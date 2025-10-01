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
