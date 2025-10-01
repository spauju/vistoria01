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
  addDoc,
  getFirestore,
} from 'firebase/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { adminApp, adminDb } from './firebase-admin';
import { app } from '@/lib/firebase';
import type { Area, Inspection, User, AreaWithLastInspection } from '@/lib/types';
import { add, format } from 'date-fns';

// Helper to get Firestore instance, ensuring it runs on the client.
const getDb = () => getFirestore(app);

export async function getUserById(uid: string): Promise<User | undefined> {
  if (!uid) {
    return undefined;
  }
  const db = getDb();
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return { id: userDocSnap.id, ...userDocSnap.data() } as User;
  }
  
  return undefined;
}

export async function getAreas(): Promise<AreaWithLastInspection[]> {
  const db = getDb();
  const dataCollection = collection(db, 'cana_data');
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
    const q = query(collection(db, 'cana_data'), where("areaId", "==", area.id), orderBy("date", "desc"), limit(1));
    const inspectionSnapshot = await getDocs(q);
    const lastInspection = inspectionSnapshot.empty ? null : inspectionSnapshot.docs[0].data() as Inspection;
    return { ...area, inspections: lastInspection ? [lastInspection] : [] };
  }));


  return areasWithInspections.sort((a,b) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());
}

export async function getAreaById(id: string): Promise<Area | undefined> {
  if (!adminDb) return undefined;
  const docRef = doc(adminDb, 'cana_data', id);
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
  if (!adminDb) throw new Error('Admin DB not initialized');
  const nextInspectionDate = format(add(new Date(data.plantingDate), { days: 90 }), 'yyyy-MM-dd');

  const newDocRef = await addDoc(collection(adminDb, 'cana_data'), {
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
  if (!adminDb) throw new Error('Admin DB not initialized');
  const docRef = doc(adminDb, 'cana_data', id);
  await updateDoc(docRef, data);
  const updatedDoc = await getDoc(docRef);
  return updatedDoc.exists() ? ({ id: updatedDoc.id, ...updatedDoc.data() } as Area) : null;
}

export async function deleteArea(id: string): Promise<boolean> {
   if (!adminDb) throw new Error('Admin DB not initialized');
   const batch = writeBatch(adminDb);
   
   const areaRef = doc(adminDb, 'cana_data', id);
   batch.delete(areaRef);

   const q = query(collection(adminDb, 'cana_data'), where("areaId", "==", id));
   const inspectionsSnapshot = await getDocs(q);
   inspectionsSnapshot.forEach((doc) => {
       batch.delete(doc.ref);
   });

   await batch.commit();

  return true;
}

export async function addInspection(areaId: string, inspectionData: Omit<Inspection, 'id' | 'areaId'>): Promise<void> {
    if (!adminDb) throw new Error('Admin DB not initialized');
    try {
        const areaRef = doc(adminDb, "cana_data", areaId);

        const newInspection: Omit<Inspection, 'id'> = {
            ...inspectionData,
            areaId: areaId,
        };

        await addDoc(collection(adminDb, 'cana_data'), newInspection);
        
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


export async function dbCreateUser(uid: string, email: string, name: string, role: 'admin' | 'technician'): Promise<User> {
  if (!adminDb) throw new Error('Admin DB not initialized');
  const userDocRef = doc(adminDb, 'users', uid);

  if (adminApp) {
    try {
      const auth = getAdminAuth(adminApp);
      await auth.setCustomUserClaims(uid, { admin: role === 'admin' });
    } catch (error) {
       console.error("Failed to set custom claims:", error);
    }
  } else {
    console.warn('Firebase Admin SDK not initialized. Cannot set custom claims. Admin role will not work.');
  }

  const userRecord = {
    email,
    name,
    role,
  };

  await setDoc(userDocRef, userRecord, { merge: true });

  return { ...userRecord, id: uid };
}
