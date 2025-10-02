'use server';

import { revalidatePath } from 'next/cache';
import { 
    getAreaById as dbGetAreaById,
    addArea as dbAddArea,
    updateArea as dbUpdateArea,
    deleteArea as dbDeleteArea,
    addInspection as dbAddInspection
} from '@/lib/db';
import { suggestInspectionObservation, type SuggestInspectionObservationInput } from '@/ai/flows/suggest-inspection-observation';
import type { Area, Inspection } from '@/lib/types';
import { add } from 'date-fns';


const WEBHOOK_URL = 'https://hook.eu2.make.com/3gux6vcanm0m65m65qa5jd89nqmj348p8f';

async function notifyWebhook(data: any) {
  if (!WEBHOOK_URL) return;
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error('Webhook notification failed with status:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Failed to notify webhook:', error);
  }
}

export async function addAreaAction(data: Omit<Area, 'id' | 'nextInspectionDate' | 'status' | 'inspections'>) {
    const nextInspectionDate = add(new Date(data.plantingDate), { days: 90 }).toISOString().split('T')[0];
    const newAreaData: Omit<Area, 'id'> = {
        ...data,
        nextInspectionDate,
        status: 'Agendada' as const,
        inspections: [],
    };
    const newArea = await dbAddArea(newAreaData);
    await notifyWebhook({ event: 'area_created', area: newArea });
    revalidatePath('/');
    return newArea;
}

export async function updateAreaAction(id: string, data: Partial<Omit<Area, 'id'>>) {
    await dbUpdateArea(id, data);
    await notifyWebhook({ event: 'area_updated', areaId: id, changes: data });
    revalidatePath('/');
    revalidatePath(`/reports`);
}

export async function deleteAreaAction(id: string) {
    await dbDeleteArea(id);
    await notifyWebhook({ event: 'area_deleted', areaId: id });
    revalidatePath('/');
    revalidatePath(`/reports`);
}

export async function addInspectionAction(areaId: string, inspectionData: Omit<Inspection, 'id' | 'areaId'>) {
    const result = await dbAddInspection(areaId, inspectionData);
    await notifyWebhook({
        event: 'status_updated',
        areaId: areaId,
        newStatus: result.newStatus,
    });
    revalidatePath('/');
    return result;
}


export async function getAISuggestionsAction(heightCm: number, areaId: string) {
    const area = await dbGetAreaById(areaId);
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
