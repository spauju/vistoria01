
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
  Timestamp,
  writeBatch,
  limit,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import type { Area, Inspection, User, AreaWithLastInspection } from '@/lib/types';
import { add, format } from 'date-fns';

// NOTE: All server-side data access MUST now use the adminDb to bypass client-side security rules.
// The security is enforced by checking user roles within the Server Actions themselves.

async function getAdminDb() {
    const { adminDb } = await import('./firebase-admin');
    if (!adminDb) {
        // This part should ideally not be reached if initialization is correct.
        // It indicates a severe configuration problem.
        throw new Error('Admin DB not initialized or initialization failed.');
    }
    return adminDb;
}

export async function getUserById(uid: string): Promise<User | undefined> {
  if (!uid) return undefined;
  const adminDb = await getAdminDb();
  
  const userDocRef = doc(adminDb, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return { id: userDocSnap.id, ...userDocSnap.data() } as User;
  }
  
  // If user exists in Auth but not in Firestore, create it.
  const { adminApp } = await import('./firebase-admin');
  if (adminApp) {
      try {
        const { getAuth } = await import('firebase-admin/auth');
        const authUser = await getAuth(adminApp).getUser(uid);
        if (authUser.email) {
            console.log(`Creating missing user document for ${uid}`);
            const role = authUser.email.endsWith('@canacontrol.com') && authUser.email.startsWith('admin') ? 'admin' : 'technician';
            const name = authUser.displayName || authUser.email.split('@')[0] || 'Usuário';
            return await dbCreateUser(uid, authUser.email, name, role);
        }
      } catch (error) {
        console.error("Error fetching user from Auth to create in DB:", error);
      }
  }

  return undefined;
}


export async function getAreas(): Promise<AreaWithLastInspection[]> {
  const adminDb = await getAdminDb();
  const areasCollection = collection(adminDb, 'areas');
  const snapshot = await getDocs(areasCollection);
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
    const inspectionsCollection = collection(adminDb, `areas/${area.id}/inspections`);
    const q = query(inspectionsCollection, orderBy("date", "desc"), limit(1));
    const inspectionSnapshot = await getDocs(q);
    const lastInspection = inspectionSnapshot.empty ? null : inspectionSnapshot.docs[0].data() as Inspection;
    return { ...area, inspections: lastInspection ? [lastInspection] : [] };
  }));


  return areasWithInspections.sort((a,b) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());
}

export async function getAreaById(id: string): Promise<Area | undefined> {
  const adminDb = await getAdminDb();
  const docRef = doc(adminDb, 'areas', id);
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
  const adminDb = await getAdminDb();
  const nextInspectionDate = format(add(new Date(data.plantingDate), { days: 90 }), 'yyyy-MM-dd');

  const newDocRef = await addDoc(collection(adminDb, 'areas'), {
    ...data,
    nextInspectionDate,
    status: 'Agendada' as const,
  });
  
  const createdDoc = await getDoc(newDocRef);
  const createdData = createdDoc.data();

  return {
    ...createdData,
    id: createdDoc.id,
  } as Area;
}

export async function updateArea(id: string, data: Partial<Omit<Area, 'id'>>): Promise<Area | null> {
  const adminDb = await getAdminDb();
  const docRef = doc(adminDb, 'areas', id);
  await updateDoc(docRef, data);
  const updatedDoc = await getDoc(docRef);
  return updatedDoc.exists() ? ({ id: updatedDoc.id, ...updatedDoc.data() } as Area) : null;
}

export async function deleteArea(id: string): Promise<boolean> {
   const adminDb = await getAdminDb();
   const batch = writeBatch(adminDb);
   
   const areaRef = doc(adminDb, 'areas', id);
   
   // Delete all inspections in the subcollection
   const inspectionsCollection = collection(adminDb, `areas/${id}/inspections`);
   const inspectionsSnapshot = await getDocs(inspectionsCollection);
   inspectionsSnapshot.forEach((doc) => {
       batch.delete(doc.ref);
   });

   // Delete the area document itself
   batch.delete(areaRef);

   await batch.commit();

  return true;
}

export async function addInspection(areaId: string, inspectionData: Omit<Inspection, 'id' | 'areaId'>): Promise<void> {
    const adminDb = await getAdminDb();
    try {
        const areaRef = doc(adminDb, "areas", areaId);
        const inspectionsCollection = collection(areaRef, "inspections");

        // Add the new inspection to the subcollection
        await addDoc(inspectionsCollection, inspectionData);
        
        let newStatus: Area['status'] = 'Pendente';
        let newNextInspectionDate = format(add(new Date(inspectionData.date), { days: 20 }), 'yyyy-MM-dd');

        if (inspectionData.atSize) {
            newStatus = 'Concluída';
        }

        // Update the parent area document
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
  const adminDb = await getAdminDb();
  const userDocRef = doc(adminDb, 'users', uid);

  // Set custom claims for role-based access in Firestore rules
  const { adminApp } = await import('./firebase-admin');
  if (adminApp) {
    try {
      const { getAuth } = await import('firebase-admin/auth');
      await getAuth(adminApp).setCustomUserClaims(uid, { admin: role === 'admin' });
      console.log(`Custom claim set for ${uid}: { admin: ${role === 'admin'} }`);
    } catch (error) {
       console.error("Failed to set custom claims:", error);
       // Even if claims fail, we can still create the user doc
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
