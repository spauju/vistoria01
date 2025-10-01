'use server';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  runTransaction,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Area, Inspection, User, AreaWithLastInspection } from '@/lib/types';
import { add, format } from 'date-fns';

const usersCollection = collection(db, 'users');
const areasCollection = collection(db, 'areas');
const inspectionsCollection = collection(db, 'vistorias');

async function seedInitialUsers() {
    const adminUserRef = doc(usersCollection, 'admin@canacontrol.com');
    const adminDoc = await getDoc(adminUserRef);
    if (!adminDoc.exists()) {
        await setDoc(adminUserRef, {
            email: 'admin@canacontrol.com',
            role: 'admin',
            name: 'Admin'
        });
    }

    const techUserRef = doc(usersCollection, 'tech@canacontrol.com');
    const techDoc = await getDoc(techUserRef);
    if (!techDoc.exists()) {
        await setDoc(techUserRef, {
            email: 'tech@canacontrol.com',
            role: 'technician',
            name: 'Técnico'
        });
    }
}
// Seed users on startup if they don't exist
// In a real production app, this would be handled by a setup script
seedInitialUsers();

export async function getUserByEmail(email: string): Promise<User | undefined> {
  if (!email) {
    return undefined;
  }
   // Hardcode admin user to ensure correct role assignment
  if (email === 'admin@canacontrol.com') {
    return {
        id: email,
        email: email,
        name: 'Admin',
        role: 'admin'
    };
  }

  const userDocRef = doc(db, 'users', email);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  } else {
    // Default to technician role if user is authenticated but not in our DB
     return {
        id: email,
        email: email,
        name: email.split('@')[0],
        role: 'technician'
    };
  }
}

export async function createUser(email: string, password?: string): Promise<User> {
  const existingUserDoc = await getDoc(doc(usersCollection, email));
  if (existingUserDoc.exists()) {
    throw new Error('User already exists');
  }

  const newUser: Omit<User, 'id'> = {
    email,
    name: email.split('@')[0],
    role: 'technician', // Always default to technician
  };

  await setDoc(doc(usersCollection, email), newUser);

  return { ...newUser, id: email };
}

export async function getAreas(): Promise<AreaWithLastInspection[]> {
  const snapshot = await getDocs(query(areasCollection));
  const areas: Area[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    areas.push({
        ...data,
        id: doc.id,
        // Firestore may store dates as Timestamps, convert them to string
        plantingDate: data.plantingDate instanceof Timestamp ? data.plantingDate.toDate().toISOString().split('T')[0] : data.plantingDate,
        nextInspectionDate: data.nextInspectionDate instanceof Timestamp ? data.nextInspectionDate.toDate().toISOString().split('T')[0] : data.nextInspectionDate,
    } as Area);
  });
  
  const areasWithInspections: AreaWithLastInspection[] = await Promise.all(areas.map(async (area) => {
    const q = query(inspectionsCollection, where("areaId", "==", area.id), orderBy("date", "desc"), limit(1));
    const inspectionSnapshot = await getDocs(q);
    const lastInspection = inspectionSnapshot.empty ? null : inspectionSnapshot.docs[0].data() as Inspection;
    return { ...area, inspections: lastInspection ? [lastInspection] : [] };
  }));


  return areasWithInspections.sort((a,b) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());
}

export async function getAreaById(id: string): Promise<Area | undefined> {
  const docRef = doc(db, 'areas', id);
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

  const newAreaData = {
    ...data,
    nextInspectionDate,
    status: 'Agendada',
  };

  const docRef = await addDoc(areasCollection, newAreaData);
  
  return { ...newAreaData, id: docRef.id } as Area;
}

export async function updateArea(id: string, data: Partial<Omit<Area, 'id'>>): Promise<Area | null> {
  const docRef = doc(db, 'areas', id);
  await updateDoc(docRef, data);
  const updatedDoc = await getDoc(docRef);
  return updatedDoc.exists() ? ({ id: updatedDoc.id, ...updatedDoc.data() } as Area) : null;
}

export async function deleteArea(id: string): Promise<boolean> {
   const batch = writeBatch(db);
   
   const areaRef = doc(db, 'areas', id);
   batch.delete(areaRef);

   const q = query(inspectionsCollection, where("areaId", "==", id));
   const inspectionsSnapshot = await getDocs(q);
   inspectionsSnapshot.forEach((doc) => {
       batch.delete(doc.ref);
   });

   await batch.commit();

  return true;
}

export async function addInspection(areaId: string, inspectionData: Omit<Inspection, 'id' | 'areaId'>): Promise<void> {
    
    try {
        const areaRef = doc(db, "areas", areaId);

        const newInspection: Omit<Inspection, 'id'> = {
            ...inspectionData,
            areaId: areaId,
        };

        const inspectionRef = await addDoc(inspectionsCollection, newInspection);
        
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
