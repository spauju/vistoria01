import { db } from './firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Area, Inspection, User, AreaWithLastInspection, UserRole, EmailPayload, AppSettings } from '@/lib/types';
import { add, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

const AREAS_COLLECTION = 'cana_data';
const USERS_COLLECTION = 'users';
const MAIL_COLLECTION = 'mail';
const SETTINGS_COLLECTION = 'settings';

// --- Settings Functions ---

export async function getAppSettings(): Promise<AppSettings> {
    const docRef = doc(db, SETTINGS_COLLECTION, 'notifications');
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as AppSettings;
        }
        return { recipientEmails: [] };
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        // Re-throw other errors or handle them as needed
        throw serverError;
    }
}

export async function addRecipientEmail(email: string): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, 'notifications');
    updateDoc(docRef, {
        recipientEmails: arrayUnion(email)
    }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: { recipientEmails: arrayUnion(email) }
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}

export async function removeRecipientEmail(email: string): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, 'notifications');
    updateDoc(docRef, {
        recipientEmails: arrayRemove(email)
    }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: { recipientEmails: arrayRemove(email) }
        });
        errorEmitter.emit('permission-error', permissionError);
    });
}


// --- User Functions ---

export async function getUserById(uid: string): Promise<User | null> {
    if (!uid) return null;
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            console.log(`User with uid ${uid} not found in Firestore.`);
            return null;
        }
        return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        console.error(`Error fetching user ${uid}:`, serverError);
        return null;
    }
}

export async function dbCreateUser(uid: string, email: string, name: string, role: UserRole): Promise<User> {
    const newUser: Omit<User, 'id'> = { email, name, role };
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    
    return setDoc(userDocRef, newUser).then(() => {
        console.log("Created user in Firestore:", { id: uid, ...newUser });
        return { id: uid, ...newUser};
    }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: newUser,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

export async function ensureUserExists(uid: string, email: string | null, name: string | null): Promise<User | null> {
    const existingUser = await getUserById(uid);
    if (existingUser) {
        return existingUser;
    }
    
    console.warn(`User with UID ${uid} authenticated but does not exist in Firestore 'users' collection.`);
    return null;
}

// --- Email Function ---
export async function sendEmailNotification(payload: Omit<EmailPayload, 'to'>): Promise<void> {
    try {
        const settings = await getAppSettings();
        const recipients = settings.recipientEmails;

        if (recipients.length === 0) {
            console.warn("Email notification not sent: No recipients configured.");
            return;
        }

        const emailData: EmailPayload = {
            to: recipients,
            ...payload
        };

        addDoc(collection(db, MAIL_COLLECTION), emailData).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: `/${MAIL_COLLECTION}`,
                operation: 'create',
                requestResourceData: emailData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    } catch (error) {
        // Errors from getAppSettings are already handled, but we catch here just in case.
        console.error("Error preparing email notification:", error);
    }
}


// --- Area and Inspection Functions ---

export async function getAreas(): Promise<AreaWithLastInspection[]> {
    const q = query(collection(db, AREAS_COLLECTION), orderBy('nextInspectionDate', 'asc'));
    try {
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
    } catch (serverError: any) {
         if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `/${AREAS_COLLECTION}`,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw serverError;
    }
}

export async function getAreaById(id: string): Promise<AreaWithLastInspection | null> {
    const docRef = doc(db, AREAS_COLLECTION, id);
    try {
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
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        throw serverError;
    }
}

export async function addArea(newAreaData: Omit<Area, 'id'>): Promise<Area> {
    const areasCollectionRef = collection(db, AREAS_COLLECTION);
    return addDoc(areasCollectionRef, newAreaData).then((docRef) => {
        return { ...newAreaData, id: docRef.id };
    }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: `/${AREAS_COLLECTION}`,
            operation: 'create',
            requestResourceData: newAreaData
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}


export async function updateArea(id: string, data: Partial<Omit<Area, 'id'>>): Promise<void> {
    const docRef = doc(db, AREAS_COLLECTION, id);
    updateDoc(docRef, data).then(async () => {
        if (data.nextInspectionDate && data.status === 'Agendada') {
            const areaDoc = await getDoc(docRef);
            const area = areaDoc.data() as Area;
            const formattedDate = format(new Date(data.nextInspectionDate), 'PPP', { locale: ptBR });
            
            await sendEmailNotification({
                message: {
                    subject: `Vistoria Reagendada: Área ${area.sectorLote}`,
                    html: `A vistoria para a área <strong>${area.sectorLote} (${area.plots})</strong> foi reagendada para <strong>${formattedDate}</strong>.`
                }
            });
        }
    }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

export async function deleteArea(id: string): Promise<void> {
    const docRef = doc(db, AREAS_COLLECTION, id);
    deleteDoc(docRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}

export async function addInspection(areaId: string, inspectionData: Omit<Inspection, 'id' | 'areaId'>, user: User | null): Promise<{ newStatus: Area['status'], newNextInspectionDate: string }> {
    const areaRef = doc(db, AREAS_COLLECTION, areaId);
    const areaDoc = await getDoc(areaRef);
    if (!areaDoc.exists()) throw new Error("Area not found");
    const area = areaDoc.data() as Area;

    const newInspection: Omit<Inspection, 'areaId'> = {
        ...inspectionData,
        id: `insp-${Date.now()}`,
    };
    
    let newStatus: Area['status'];
    let newNextInspectionDate: string;
    let emailSubject = '';
    let emailBody = '';

    if (inspectionData.atSize) {
        newStatus = 'Concluída';
        newNextInspectionDate = area.nextInspectionDate; // Keep the date, but status is complete
        emailSubject = `Vistoria Concluída: Área ${area.sectorLote}`;
        emailBody = `A vistoria para a área <strong>${area.sectorLote} (${area.plots})</strong> foi concluída com sucesso. Altura registrada: ${inspectionData.heightCm} cm.`;
    } else {
        newStatus = 'Pendente';
        newNextInspectionDate = add(new Date(inspectionData.date), { days: 20 }).toISOString().split('T')[0];
        const formattedDate = format(new Date(newNextInspectionDate), 'PPP', { locale: ptBR });
        emailSubject = `Nova Vistoria Necessária: Área ${area.sectorLote}`;
        emailBody = `A cana na área <strong>${area.sectorLote} (${area.plots})</strong> ainda não atingiu o porte. Uma nova vistoria foi agendada para <strong>${formattedDate}</strong>.`;
    }
    
    const updatePayload = {
        status: newStatus,
        nextInspectionDate: newNextInspectionDate,
        inspections: arrayUnion(newInspection)
    };

    return updateDoc(areaRef, updatePayload).then(async () => {
        await sendEmailNotification({
            message: {
                subject: emailSubject,
                html: emailBody,
            }
        });
        return { newStatus, newNextInspectionDate };
    }).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: areaRef.path,
            operation: 'update',
            requestResourceData: updatePayload
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    });
}
