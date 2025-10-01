'use server';

import type { Area, Inspection, User, AreaWithLastInspection, UserRole } from '@/lib/types';
import { add, toDate } from 'date-fns';
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const AREAS_COLLECTION = 'cana_data';
const USERS_COLLECTION = 'users';

// --- Helper Functions ---
async function getAdminDb() {
  // This dynamic import ensures admin SDK is only loaded on the server.
  return adminDb;
}

// --- User Functions ---

export async function getUserById(uid: string): Promise<User | null> {
    if (!uid) return null;
    const db = await getAdminDb();
    try {
        const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
        if (!userDoc.exists) {
            console.log(`User with uid ${uid} not found in Firestore.`);
            return null;
        }
        return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
        console.error(`Error fetching user ${uid}:`, error);
        return null;
    }
}


export async function dbCreateUser(uid: string, email: string, name: string, role: UserRole): Promise<User> {
    const db = await getAdminDb();
    const newUser: User = { id: uid, email, name, role };
    await db.collection(USERS_COLLECTION).doc(uid).set(newUser);
    console.log("Created user in Firestore:", newUser);
    return newUser;
}

export async function ensureUserExists(uid: string, email: string | null, name: string | null): Promise<User> {
    const existingUser = await getUserById(uid);
    if (existingUser) {
        return existingUser;
    }
    // If user does not exist, create them as a technician by default.
    const userEmail = email || 'no-email@example.com';
    const userName = name || userEmail.split('@')[0];
    return await dbCreateUser(uid, userEmail, userName, 'technician');
}

// --- Area and Inspection Functions ---

export async function getAreas(): Promise<AreaWithLastInspection[]> {
    const db = await getAdminDb();
    const snapshot = await db.collection(AREAS_COLLECTION).orderBy('nextInspectionDate', 'asc').get();
    
    const areas: AreaWithLastInspection[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        // Ensure inspections is an array and sort it descending by date
        const inspections = data.inspections && Array.isArray(data.inspections) ? data.inspections : [];
        inspections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        areas.push({
            id: doc.id,
            ...data,
            inspections: inspections.slice(0, 1) // Only return the last inspection
        } as AreaWithLastInspection);
    });
    
    return areas;
}

export async function getAreaById(id: string): Promise<AreaWithLastInspection | null> {
    const db = await getAdminDb();
    const doc = await db.collection(AREAS_COLLECTION).doc(id).get();
     if (!doc.exists) {
        return null;
    }
    const data = doc.data()!;
    const inspections = data.inspections && Array.isArray(data.inspections) ? data.inspections : [];
    inspections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
        id: doc.id,
        ...data,
        inspections: inspections
    } as AreaWithLastInspection;
}

export async function addArea(data: Omit<Area, 'id' | 'nextInspectionDate' | 'status' | 'inspections'>): Promise<Area> {
    const db = await getAdminDb();
    const nextInspectionDate = add(new Date(data.plantingDate), { days: 90 }).toISOString().split('T')[0];

    const newArea: Omit<Area, 'id'> = {
        ...data,
        nextInspectionDate,
        status: 'Agendada' as const,
        inspections: [],
    };

    const docRef = await db.collection(AREAS_COLLECTION).add(newArea);
    return { ...newArea, id: docRef.id };
}

export async function updateArea(id: string, data: Partial<Omit<Area, 'id'>>): Promise<Area | null> {
    const db = await getAdminDb();
    const docRef = db.collection(AREAS_COLLECTION).doc(id);
    await docRef.update(data);
    const updatedDoc = await docRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as Area;
}

export async function deleteArea(id: string): Promise<boolean> {
    const db = await getAdminDb();
    await db.collection(AREAS_COLLECTION).doc(id).delete();
    return true;
}

export async function addInspection(areaId: string, inspectionData: Omit<Inspection, 'id' | 'areaId'>): Promise<void> {
    const db = await getAdminDb();
    const areaRef = db.collection(AREAS_COLLECTION).doc(areaId);

    const newInspection: Omit<Inspection, 'areaId'> = {
        ...inspectionData,
        id: `insp-${Date.now()}`,
    };
    
    let newStatus: Area['status'] = 'Pendente';
    let newNextInspectionDate = add(new Date(inspectionData.date), { days: 20 }).toISOString().split('T')[0];

    if (inspectionData.atSize) {
        newStatus = 'Concluída';
    }
    
    await areaRef.update({
        status: newStatus,
        nextInspectionDate: newNextInspectionDate,
        inspections: FieldValue.arrayUnion(newInspection)
    });
}