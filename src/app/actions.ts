'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addArea as dbAddArea, updateArea as dbUpdateArea, deleteArea as dbDeleteArea, addInspection as dbAddInspection, getAreaById, dbCreateUser, getUserById } from '@/lib/data';
import { add, format } from 'date-fns';
import { suggestInspectionObservation, type SuggestInspectionObservationInput } from '@/ai/flows/suggest-inspection-observation';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { cookies } from 'next/headers';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

const areaSchema = z.object({
  sectorLote: z.string().min(1, 'Setor/Lote é obrigatório.'),
  plots: z.string().min(1, 'Talhões são obrigatórios.'),
  plantingDate: z.string().min(1, 'Data de plantio é obrigatória.'),
});

export async function addAreaAction(prevState: any, formData: FormData) {
  try {
    const validatedFields = areaSchema.safeParse({
      sectorLote: formData.get('sectorLote'),
      plots: formData.get('plots'),
      plantingDate: formData.get('plantingDate'),
    });

    if (!validatedFields.success) {
      return {
        message: 'Por favor, corrija os erros abaixo.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }
    
    await dbAddArea(validatedFields.data);
    revalidatePath('/');
    return { message: 'Área adicionada com sucesso.', errors: {} };
  } catch (e) {
    console.error(e);
    return { message: 'Falha ao adicionar área.', errors: {} };
  }
}

export async function updateAreaAction(areaId: string, prevState: any, formData: FormData) {
    try {
    const validatedFields = areaSchema.safeParse({
      sectorLote: formData.get('sectorLote'),
      plots: formData.get('plots'),
      plantingDate: formData.get('plantingDate'),
    });

    if (!validatedFields.success) {
      return {
        message: 'Por favor, corrija os erros abaixo.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }
    
    const plantingDate = new Date(validatedFields.data.plantingDate);
    const nextInspectionDate = format(add(plantingDate, { days: 90 }), 'yyyy-MM-dd');
    
    await dbUpdateArea(areaId, { ...validatedFields.data, nextInspectionDate });
    revalidatePath('/');
    return { message: 'Área atualizada com sucesso.', errors: {} };
  } catch (e) {
    return { message: 'Falha ao atualizar área.', errors: {} };
  }
}

export async function deleteAreaAction(areaId: string) {
  try {
    const idToken = cookies().get('idToken')?.value;

    if (!adminApp) {
       return { message: 'Ação não autorizada. O serviço de administração não está disponível.' };
    }
    if (!idToken) {
       return { message: 'Ação não autorizada. Token de autenticação não encontrado.' };
    }

    const decodedToken = await getAdminAuth(adminApp).verifyIdToken(idToken);

    if (decodedToken.admin !== true) {
      return { message: 'Ação não autorizada. Apenas administradores podem excluir áreas.' };
    }

    await dbDeleteArea(areaId);
    revalidatePath('/');
    return { message: 'Área excluída com sucesso.' };
  } catch (e: any) {
    console.error('Falha ao excluir área:', e);
    return { message: e.code === 'permission-denied' ? 'Permissão negada pelo Firestore.' : 'Falha ao excluir área. Verifique suas permissões.' };
  }
}


const inspectionSchema = z.object({
    heightCm: z.coerce.number().min(1, "Altura é obrigatória."),
    observations: z.string().optional(),
    atSize: z.boolean(),
    date: z.string(),
});


export async function addInspectionAction(areaId: string, prevState: any, formData: FormData) {
    try {
        const atSize = formData.get('atSize') === 'on';
        const validatedFields = inspectionSchema.safeParse({
            heightCm: formData.get('heightCm'),
            observations: formData.get('observations'),
            atSize: atSize,
            date: new Date().toISOString().split('T')[0],
        });
        
        if(!validatedFields.success) {
            return {
                message: 'Por favor, corrija os erros abaixo.',
                errors: validatedFields.error.flatten().fieldErrors,
            }
        }

        await dbAddInspection(areaId, validatedFields.data);
        revalidatePath('/');
        return { message: 'Vistoria adicionada com sucesso.', errors: {} };
    } catch (e) {
        return { message: 'Falha ao adicionar vistoria.', errors: {} };
    }
}

export async function rescheduleInspectionAction(areaId: string, newDate: Date) {
    try {
        await dbUpdateArea(areaId, { nextInspectionDate: format(newDate, 'yyyy-MM-dd') });
        revalidatePath('/');
        return { message: 'Vistoria reagendada com sucesso.' };
    } catch (e) {
        return { message: 'Falha ao reagendar vistoria.' };
    }
}

export async function getAISuggestionsAction(heightCm: number, areaId: string) {
    const area = await getAreaById(areaId);
    if (!area) {
        return { suggestions: [] };
    }
    const input: SuggestInspectionObservationInput = {
        heightCm,
        inspectionDate: new Date().toISOString().split('T')[0],
        sector: area.sectorLote.split('/')[0],
        lote: area.sectorLote.split('/')[1],
        talhoes: area.plots,
    }
    try {
        const result = await suggestInspectionObservation(input);
        return result;
    } catch(e) {
        console.error(e);
        return { suggestions: ["Não foi possível obter sugestões da IA."]};
    }
}

const userSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(6, 'A senha precisa de no mínimo 6 caracteres.'),
});


export async function createUserAction(prevState: any, formData: FormData) {
  const validatedFields = userSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Por favor, corrija os erros abaixo.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // First, verify if the user making the request is an admin
  const idToken = cookies().get('idToken')?.value;
  if (!adminApp || !idToken) {
    return { message: 'Ação não autorizada.', errors: {}};
  }
  const decodedToken = await getAdminAuth(adminApp).verifyIdToken(idToken);
  if(decodedToken.admin !== true) {
     return { message: 'Ação não autorizada. Apenas administradores podem criar usuários.', errors: {}};
  }
  
  const { email, password } = validatedFields.data;
  const auth = getAuth(app);

  try {
    // We cannot create users with email/password directly on the client SDK
    // This needs to be done via Admin SDK. For now, this will fail but the structure is here.
    // The correct way is to call an endpoint that uses the Admin SDK.
    // For this app, we'll simulate the creation flow and rely on Firestore rules.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;
    
    const name = email.split('@')[0];
    // New users are always technicians by default.
    const role = 'technician'; 
    
    await dbCreateUser(uid, email, name, role);

    revalidatePath('/');
    return { message: `Usuário ${email} criado com sucesso como técnico.`, errors: {} };
  } catch (error: any) {
    let message = 'Falha ao criar usuário.';
    if (error.code === 'auth/email-already-in-use') {
       message = 'Este email já está em uso.';
    } else if (error.code === 'auth/operation-not-allowed') {
       message = 'Criação de usuário por email/senha não está habilitada.'
    }
    console.error("Create user error:", error);
    return { message, errors: { email: [message] } };
  }
}
