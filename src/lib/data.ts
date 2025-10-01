'use server';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  limit,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Area, Inspection, User, AreaWithLastInspection } from '@/lib/types';
import { add, format } from 'date-fns';

const usersCollection = collection(db, 'users');
const dataCollection = collection(db, 'cana_data');

async function seedInitialUsers() {
    // This seeding logic might need adjustment if UIDs are not predictable.
    // For now, we rely on the app to create/find users correctly.
}
seedInitialUsers();

// IMPORTANT: This function now requires the user's UID from Firebase Auth.
export async function getUserById(uid: string): Promise<User | undefined> {
  if (!uid) {
    return undefined;
  }
  
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  } else {
    // Fallback for users that might not have a doc yet, though this should be handled on signup.
    // The role is the most critical part. Let's provide a default.
    return {
        id: uid,
        email: 'Usuário não encontrado',
        name: 'Usuário',
        role: 'technician' // Default to the more restrictive role.
    };
  }
}

export async function createUser(uid: string, email: string, name: string, role: 'admin' | 'technician'): Promise<User> {
  const existingUserDoc = await getDoc(doc(usersCollection, uid));
  if (existingUserDoc.exists()) {
    // Optionally update user info here if it can change
    const user = existingUserDoc.data() as User;
    return user;
  }

  const newUser: Omit<User, 'id'> = {
    email,
    name,
    role,
  };

  await setDoc(doc(usersCollection, uid), newUser);

  // Seed initial users if they match
  if(email === "admin@canacontrol.com" && !existingUserDoc.exists()){
     await setDoc(doc(usersCollection, uid), {email, name: "Admin", role: "admin"});
     return {id: uid, email, name: "Admin", role: "admin"};
  }
  if(email === "tech@canacontrol.com" && !existingUserDoc.exists()){
     await setDoc(doc(usersCollection, uid), {email, name: "Técnico", role: "technician"});
     return {id: uid, email, name: "Técnico", role: "technician"};
  }


  return { ...newUser, id: uid };
}


export async function getAreas(): Promise<AreaWithLastInspection[]> {
  const snapshot = await getDocs(query(dataCollection, where('areaId', '==', null)));
  const areas: Area[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    areas.push({
        ...data,
        id: doc.id,
        plantingDate: data.plantingDate instanceof Timestamp ? data.plantingDate.toDate().toISOString().split('T')[0] : data.plantingDate,
        nextInspectionDate: data.nextInspectionDate instanceof Timestamp ? data.nextInspectionDate.toDate().toISOString().split('T')[0] : data.nextInspectionDate,
    } as Area);
  });
  
  const areasWithInspections: AreaWithLastInspection[] = await Promise.all(areas.map(async (area) => {
    const q = query(dataCollection, where("areaId", "==", area.id), orderBy("date", "desc"), limit(1));
    const inspectionSnapshot = await getDocs(q);
    const lastInspection = inspectionSnapshot.empty ? null : inspectionSnapshot.docs[0].data() as Inspection;
    return { ...area, inspections: lastInspection ? [lastInspection] : [] };
  }));


  return areasWithInspections.sort((a,b) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());
}

export async function getAreaById(id: string): Promise<Area | undefined> {
  const docRef = doc(db, 'cana_data', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
     return {
        ...data,
        id: docSnap.id,
        plantingDate: data.plantingDate instanceof Timestamp ? data.plantingDate.toDate().toISOString().split('T')[0] : data.plantingDate,
        nextInspectionDate: data.nextInspectionDate instanceof Timestamp ? data.nextInspectionDate.toDate().toISOString().split('T')[0] : data.nextInspectionDate,
    } as Area;
  } else {
    return undefined;
  }
}

export async function addArea(data: Omit<Area, 'id' | 'nextInspectionDate' | 'status'>): Promise<Area> {
  const nextInspectionDate = format(add(new Date(data.plantingDate), { days: 90 }), 'yyyy-MM-dd');

  const newDocRef = await addDoc(dataCollection, {
    ...data,
    nextInspectionDate,
    status: 'Agendada' as const,
    areaId: null, 
  });
  
  return {
    ...data,
    id: newDocRef.id,
    nextInspectionDate,
    status: 'Agendada' as const,
  } as Area;
}

export async function updateArea(id: string, data: Partial<Omit<Area, 'id'>>): Promise<Area | null> {
  const docRef = doc(db, 'cana_data', id);
  await updateDoc(docRef, data);
  const updatedDoc = await getDoc(docRef);
  return updatedDoc.exists() ? ({ id: updatedDoc.id, ...updatedDoc.data() } as Area) : null;
}

export async function deleteArea(id: string): Promise<boolean> {
   const batch = writeBatch(db);
   
   const areaRef = doc(db, 'cana_data', id);
   batch.delete(areaRef);

   const q = query(dataCollection, where("areaId", "==", id));
   const inspectionsSnapshot = await getDocs(q);
   inspectionsSnapshot.forEach((doc) => {
       batch.delete(doc.ref);
   });

   await batch.commit();

  return true;
}

export async function addInspection(areaId: string, inspectionData: Omit<Inspection, 'id' | 'areaId'>): Promise<void> {
    
    try {
        const areaRef = doc(db, "cana_data", areaId);

        const newInspection: Omit<Inspection, 'id'> = {
            ...inspectionData,
            areaId: areaId,
        };

        const inspectionRef = await addDoc(dataCollection, newInspection);
        
        let newStatus: Area['status'] = 'Pendente';
        let newNextInspectionDate = format(add(new Date(inspectionData.date), { days: 20 }), 'yyyy-MM-dd');

        if (inspectionData.atSize) {
            newStatus = 'Concluída';
        }

        await updateDoc(areaRef, { 
            status: newStatus,
            nextInspectionDate: newNextInspectionDate,
        });

    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
}


export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (!email) {
    return undefined;
  }
  const q = query(usersCollection, where("email", "==", email), limit(1));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return undefined;
  }
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User;
}

export async function createUserAction(prevState: any, formData: FormData) {
  // This function is in actions.ts, but let's assume it should be here.
  // It should call the createUser function above.
  // For now, I will leave the existing logic in actions.ts and just correct the user lookup.
  return { message: "Função não implementada aqui.", errors: {}};
}
