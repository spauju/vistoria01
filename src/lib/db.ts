import { db } from './firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy, arrayUnion } from 'firebase/firestore';
import type { Area, Inspection, User, AreaWithLastInspection, UserRole } from '@/lib/types';
import { add } from 'date-fns';

const AREAS_COLLECTION = 'cana_data';
const USERS_COLLECTION = 'users';
const WEBHOOK_URL = 'https://hook.eu2.make.com/3gux6vcanm0m65m65qa5jd89nqmj348p8f';

// --- Webhook Function ---

async function notifyWebhook(data: any) {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to notify webhook:', error);
    // We don't throw an error here because the primary operation (DB write) should not fail if the webhook fails.
  }
}


// --- User Functions ---

export async function getUserById(uid: string): Promise<User | null> {
    if (!uid) return null;
    try {
        const userDocRef = doc(db, USERS_COLLECTION, uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
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
    const newUser: Omit<User, 'id'> = { email, name, role };
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userDocRef, newUser);
    console.log("Created user in Firestore:", { id: uid, ...newUser });
    return { id: uid, ...newUser};
}

export async function ensureUserExists(uid: string, email: string | null, name: string | null): Promise<User | null> {
    const existingUser = await getUserById(uid);
    if (existingUser) {
        return existingUser;
    }
    
    // If the user does not exist in Firestore, return null.
    // The creation of users should be handled by an admin.
    console.warn(`User with UID ${uid} authenticated but does not exist in Firestore 'users' collection.`);
    return null;
}

// --- Area and Inspection Functions ---

export async function getAreas(): Promise<AreaWithLastInspection[]> {
    const q = query(collection(db, AREAS_COLLECTION), orderBy('nextInspectionDate', 'asc'));
    const snapshot = await getDocs(q);
    
    const areas: AreaWithLastInspection[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        const inspections = data.inspections && Array.isArray(data.inspections) ? data.inspections : [];
        inspections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        areas.push({
            id: doc.id,
            ...data,
            inspections: inspections.slice(0, 1)
        } as AreaWithLastInspection);
    });
    
    return areas;
}

export async function getAreaById(id: string): Promise<AreaWithLastInspection | null> {
    const docRef = doc(db, AREAS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
     if (!docSnap.exists()) {
        return null;
    }
    const data = docSnap.data()!;
    const inspections = data.inspections && Array.isArray(data.inspections) ? data.inspections : [];
    inspections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
        id: docSnap.id,
        ...data,
        inspections: inspections
    } as AreaWithLastInspection;
}

export async function addArea(data: Omit<Area, 'id' | 'nextInspectionDate' | 'status' | 'inspections'>): Promise<Area> {
    const nextInspectionDate = add(new Date(data.plantingDate), { days: 90 }).toISOString().split('T')[0];

    const newArea: Omit<Area, 'id'> = {
        ...data,
        nextInspectionDate,
        status: 'Agendada' as const,
        inspections: [],
    };

    const docRef = await addDoc(collection(db, AREAS_COLLECTION), newArea);
    
    const finalArea = { ...newArea, id: docRef.id };

    // Notify webhook about the new area
    await notifyWebhook({
      event: 'area_created',
      area: finalArea,
    });
    
    return finalArea;
}

export async function updateArea(id: string, data: Partial<Omit<Area, 'id'>>): Promise<void> {
    const docRef = doc(db, AREAS_COLLECTION, id);
    await updateDoc(docRef, data);
}

export async function deleteArea(id: string): Promise<void> {
    await deleteDoc(doc(db, AREAS_COLLECTION, id));
}

export async function addInspection(areaId: string, inspectionData: Omit<Inspection, 'id' | 'areaId'>): Promise<void> {
    const areaRef = doc(db, AREAS_COLLECTION, areaId);

    const newInspection: Omit<Inspection, 'areaId'> = {
        ...inspectionData,
        id: `insp-${Date.now()}`,
    };
    
    let newStatus: Area['status'] = 'Pendente';
    let newNextInspectionDate = add(new Date(inspectionData.date), { days: 20 }).toISOString().split('T')[0];

    if (inspectionData.atSize) {
        newStatus = 'Concluída';
    }
    
    await updateDoc(areaRef, {
        status: newStatus,
        nextInspectionDate: newNextInspectionDate,
        inspections: arrayUnion(newInspection)
    });

    // Notify webhook about the status change
    await notifyWebhook({
      event: 'status_updated',
      areaId: areaId,
      newStatus: newStatus,
    });
}