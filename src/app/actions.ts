'use server';

import { revalidatePath } from 'next/cache';
import { add, format } from 'date-fns';
import { addArea, updateArea, deleteArea, addInspection } from '@/lib/db';
import type { Area, Inspection } from '@/lib/types';

const WEBHOOK_URL = 'https://hook.eu2.make.com/3gux6vcanm0m65m65qa5jd89nqmj348p8f';

async function notifyWebhook(payload: any) {
  // This function runs on the server, so it's safe to use fetch here.
  try {
    console.log('Sending to webhook:', JSON.stringify(payload, null, 2));
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error('Webhook notification failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Error sending webhook notification:', error);
  }
}

export async function addAreaAction(newAreaData: Pick<Area, 'sectorLote' | 'plots' | 'plantingDate'>) {
  try {
    const nextInspectionDate = add(new Date(newAreaData.plantingDate), { days: 90 }).toISOString().split('T')[0];
    const areaToCreate: Omit<Area, 'id'> = {
        ...newAreaData,
        nextInspectionDate,
        status: 'Agendada' as const,
        inspections: [],
    };
    const createdArea = await addArea(areaToCreate);
    
    // Notify webhook on success
    await notifyWebhook({
        event: 'area_created',
        area: createdArea,
    });
    
    revalidatePath('/');
    return { success: true, area: createdArea };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAreaAction(areaId: string, data: Partial<Omit<Area, 'id'>>) {
    try {
        await updateArea(areaId, data);
        
        await notifyWebhook({
            event: 'area_updated',
            areaId: areaId,
            updates: data,
        });

        revalidatePath('/');
        revalidatePath(`/area/${areaId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function deleteAreaAction(areaId: string) {
    try {
        await deleteArea(areaId);
        
        await notifyWebhook({
            event: 'area_deleted',
            areaId: areaId,
        });

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function rescheduleAreaAction(areaId: string, newDate: string) {
    try {
        const payload = { nextInspectionDate: newDate };
        await updateArea(areaId, payload);
        
        await notifyWebhook({
            event: 'area_rescheduled',
            areaId: areaId,
            ...payload
        });

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


export async function inspectAreaAction(areaId: string, inspectionData: Omit<Inspection, 'id' | 'areaId'>) {
    try {
        const { newStatus, newNextInspectionDate } = await addInspection(areaId, inspectionData);

        await notifyWebhook({
            event: 'area_inspected',
            areaId: areaId,
            inspection: inspectionData,
            newStatus,
            newNextInspectionDate,
        });
        
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
