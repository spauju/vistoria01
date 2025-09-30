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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Area, Inspection, User } from '@/lib/types';
import { add, format } from 'date-fns';

const usersCollection = collection(db, 'users');
const areasCollection = collection(db, 'areas');

async function seedInitialUsers() {
    const adminUser = await getUserByEmail('admin@canacontrol.com');
    if (!adminUser) {
        await setDoc(doc(usersCollection, 'admin@canacontrol.com'), {
            email: 'admin@canacontrol.com',
            role: 'admin',
            name: 'Admin'
        });
    }
    const techUser = await getUserByEmail('tech@canacontrol.com');
    if (!techUser) {
        await setDoc(doc(usersCollection, 'tech@canacontrol.com'), {
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
  const existingUser = await getUserByEmail(email);
  // Check if a doc with this ID already exists
  if (existingUser && existingUser.id === email) {
      const userDocRef = doc(db, 'users', email);
      const userDoc = await getDoc(userDocRef);
      if(userDoc.exists()){
         throw new Error('User already exists');
      }
  }

  const newUser: Omit<User, 'id'> = {
    email,
    name: email.split('@')[0],
    role: 'technician', // Always default to technician
  };

  await setDoc(doc(usersCollection, email), newUser);

  return { ...newUser, id: email };
}

export async function getAreas(): Promise<Area[]> {
  const snapshot = await getDocs(areasCollection);
  const areas: Area[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    areas.push({
        ...data,
        id: doc.id,
        // Firestore may store dates as Timestamps, convert them to string
        plantingDate: data.plantingDate instanceof Timestamp ? data.plantingDate.toDate().toISOString().split('T')[0] : data.plantingDate,
        nextInspectionDate: data.nextInspectionDate instanceof Timestamp ? data.nextInspectionDate.toDate().toISOString().split('T')[0] : data.nextInspectionDate,
        inspections: data.inspections?.map((insp: any) => ({
            ...insp,
            date: insp.date instanceof Timestamp ? insp.date.toDate().toISOString().split('T')[0] : insp.date,
        })) || []
    } as Area);
  });
  return areas.sort((a,b) => new Date(a.nextInspectionDate).getTime() - new Date(b.nextInspectionDate).getTime());
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
        inspections: data.inspections?.map((insp: any) => ({
            ...insp,
            date: insp.date instanceof Timestamp ? insp.date.toDate().toISOString().split('T')[0] : insp.date,
        })) || []
    } as Area;
  } else {
    return undefined;
  }
}

export async function addArea(data: Omit<Area, 'id' | 'nextInspectionDate' | 'status' | 'inspections'>): Promise<Area> {
  const nextInspectionDate = format(add(new Date(data.plantingDate), { days: 90 }), 'yyyy-MM-dd');

  const newAreaData = {
    ...data,
    nextInspectionDate,
    status: 'Agendada',
    inspections: [],
  };

  const docRef = await addDoc(areasCollection, newAreaData);
  
  return { ...newAreaData, id: docRef.id } as Area;
}

export async function updateArea(id: string, data: Partial<Omit<Area, 'id'>>): Promise<Area | null> {
  const docRef = doc(db, 'areas', id);
  await updateDoc(docRef, data);
  return getAreaById(id);
}

export async function deleteArea(id: string): Promise<boolean> {
  const docRef = doc(db, 'areas', id);
  await deleteDoc(docRef);
  return true;
}

export async function addInspection(areaId: string, inspectionData: Omit<Inspection, 'id'>): Promise<Area | null> {
    
    try {
        const areaRef = doc(db, "areas", areaId);

        await runTransaction(db, async (transaction) => {
            const areaDoc = await transaction.get(areaRef);
            if (!areaDoc.exists()) {
                throw "Document does not exist!";
            }

            const newInspection: Inspection = {
                ...inspectionData,
                id: `insp_${Date.now()}`,
            };
            
            const currentInspections = areaDoc.data().inspections || [];
            const newInspections = [...currentInspections, newInspection];
            
            let newStatus = areaDoc.data().status;
            let newNextInspectionDate = areaDoc.data().nextInspectionDate;

            if (inspectionData.atSize) {
                newStatus = 'Concluída';
            } else {
                newStatus = 'Pendente';
                newNextInspectionDate = format(add(new Date(inspectionData.date), { days: 20 }), 'yyyy-MM-dd');
            }

            transaction.update(areaRef, { 
                inspections: newInspections,
                status: newStatus,
                nextInspectionDate: newNextInspectionDate,
            });
        });

        return getAreaById(areaId);
    } catch (e) {
        console.error("Transaction failed: ", e);
        return null;
    }
}
