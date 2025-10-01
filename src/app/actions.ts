'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addArea as dbAddArea, updateArea as dbUpdateArea, deleteArea as dbDeleteArea, addInspection as dbAddInspection, getAreaById, dbCreateUser, getUserById } from '@/lib/data';
import { suggestInspectionObservation, type SuggestInspectionObservationInput } from '@/ai/flows/suggest-inspection-observation';
import { cookies } from 'next/headers';


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
    return { message: 'Área adicionada com sucesso (Simulado).', errors: {} };
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
    
    await dbUpdateArea(areaId, validatedFields.data );
    revalidatePath('/');
    return { message: 'Área atualizada com sucesso (Simulado).', errors: {} };
  } catch (e) {
    return { message: 'Falha ao atualizar área.', errors: {} };
  }
}

export async function deleteAreaAction(areaId: string) {
  try {
    const user = await getUserById(cookies().get('uid')?.value || '');
    
    if (user?.role !== 'admin') {
      return { message: 'Ação não autorizada. Apenas administradores podem excluir áreas.' };
    }

    await dbDeleteArea(areaId);
    revalidatePath('/');
    return { message: 'Área excluída com sucesso (Simulado).' };
  } catch (e: any) {
    console.error('Falha ao excluir área:', e);
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
        return { message: 'Vistoria adicionada com sucesso (Simulado).', errors: {} };
    } catch (e) {
        return { message: 'Falha ao adicionar vistoria.', errors: {} };
    }
}

export async function rescheduleInspectionAction(areaId: string, newDate: Date) {
    try {
        await dbUpdateArea(areaId, { nextInspectionDate: newDate.toISOString().split('T')[0] });
        revalidatePath('/');
        return { message: 'Vistoria reagendada com sucesso (Simulado).' };
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

  const user = await getUserById(cookies().get('uid')?.value || '');
  if (user?.role !== 'admin') {
      return { message: 'Ação não autorizada. Apenas administradores podem criar usuários.', errors: {}};
  }
  
  const { email } = validatedFields.data;
  const name = email.split('@')[0];
  const role = 'technician'; 
  
  try {
    await dbCreateUser(email, name, role);
    revalidatePath('/users'); 
    return { message: `Usuário ${email} criado com sucesso como técnico (Simulado).`, errors: {} };
  } catch (error: any) {
    let message = 'Falha ao criar usuário.';
    return { message, errors: { email: [message] } };
  }
}

// This is the new action to be called from the client-side AuthProvider
export async function fetchUserAction(uid: string) {
    return await getUserById(uid);
}
