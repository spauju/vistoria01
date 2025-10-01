'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addArea as dbAddArea, updateArea as dbUpdateArea, deleteArea as dbDeleteArea, addInspection as dbAddInspection, getAreaById, createUser as dbCreateUser, getUserByEmail } from '@/lib/data';
import { add, format } from 'date-fns';
import { suggestInspectionObservation, type SuggestInspectionObservationInput } from '@/ai/flows/suggest-inspection-observation';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';

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
    await dbDeleteArea(areaId);
    revalidatePath('/');
    return { message: 'Área excluída com sucesso.' };
  } catch (e) {
    return { message: 'Falha ao excluir área.' };
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

  const { email, password } = validatedFields.data;
  const auth = getAuth(app);

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser && existingUser.id !== email) { // Check if user exists in mock DB but wasn't a placeholder
         return { message: 'Este email já está em uso.', errors: { email: ['Este email já está em uso.'] } };
    }
    
    await createUserWithEmailAndPassword(auth, email, password);
    // Also add to our mock DB
    await dbCreateUser(email, password);

    revalidatePath('/');
    return { message: `Usuário ${email} criado com sucesso como técnico.`, errors: {} };
  } catch (error: any) {
    let message = 'Falha ao criar usuário.';
    if (error.code === 'auth/email-already-in-use') {
       message = 'Este email já está em uso.';
    }
    return { message, errors: { email: [message] } };
  }
}
