'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { 
    addArea as dbAddArea, 
    updateArea as dbUpdateArea, 
    deleteArea as dbDeleteArea, 
    addInspection as dbAddInspection, 
    getAreaById, 
    dbCreateUser 
} from '@/lib/db';
import { suggestInspectionObservation, type SuggestInspectionObservationInput } from '@/ai/flows/suggest-inspection-observation';

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
  } catch (e: any) {
    console.error(e);
    return { message: e.message || 'Falha ao adicionar área.', errors: {} };
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
    return { message: 'Área atualizada com sucesso.', errors: {} };
  } catch (e: any) {
    return { message: 'Falha ao atualizar área.', errors: {} };
  }
}

export async function deleteAreaAction(areaId: string) {
  try {
    await dbDeleteArea(areaId);
    revalidatePath('/');
    return { message: 'Área excluída com sucesso.' };
  } catch (e: any) {
    console.error('Falha ao excluir área:', e);
    return { message: e.message || 'Falha ao excluir área.' };
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
    } catch (e: any) {
        return { message: 'Falha ao adicionar vistoria.', errors: {} };
    }
}

export async function rescheduleInspectionAction(areaId: string, newDate: Date) {
    try {
        await dbUpdateArea(areaId, { nextInspectionDate: newDate.toISOString().split('T')[0] });
        revalidatePath('/');
        return { message: 'Vistoria reagendada com sucesso.' };
    } catch (e: any) {
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
 try {
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
    
    const { email } = validatedFields.data;
    
    revalidatePath('/users');
    return { message: `A funcionalidade de criação de usuário deve ser implementada no cliente. O usuário ${email} pode ser criado no Console do Firebase.`, errors: {} };
  } catch (error: any) {
    console.error("Error in createUserAction:", error);
    return { message: 'Falha ao criar usuário.', errors: {} };
  }
}