'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { 
    getAreaById
} from '@/lib/db';
import { suggestInspectionObservation, type SuggestInspectionObservationInput } from '@/ai/flows/suggest-inspection-observation';

// Server actions for mutations (add, update, delete) have been removed.
// The logic has been moved to the client-side components to directly use the Firebase client SDK.
// This resolves the PERMISSION_DENIED errors by ensuring the authenticated user's context is available.

const WEBHOOK_URL = 'https://hook.eu2.make.com/3gux6vcanm0m65m65qa5jd89nqmj348p8f';

export async function notifyWebhookAction(data: any) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    // Check if the request was successful
    if (!response.ok) {
        // Log the error on the server without throwing to the client
        console.error('Webhook notification failed with status:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Failed to notify webhook via server action:', error);
    // Not re-throwing error to the client, as this is a background task.
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
