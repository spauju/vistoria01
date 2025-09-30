'use server';

/**
 * @fileOverview A flow to suggest potential observations about sugarcane's condition based on height, date, and location.
 *
 * - suggestInspectionObservation - A function that suggests observations based on input data.
 * - SuggestInspectionObservationInput - The input type for the suggestInspectionObservation function.
 * - SuggestInspectionObservationOutput - The return type for the suggestInspectionObservation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestInspectionObservationInputSchema = z.object({
  heightCm: z.number().describe('The height of the sugarcane in centimeters.'),
  inspectionDate: z.string().describe('The date of the inspection (YYYY-MM-DD).'),
  sector: z.string().describe('The sector of the sugarcane field.'),
  lote: z.string().describe('The lote of the sugarcane field.'),
  talhoes: z.string().describe('The talhoes of the sugarcane field.'),
});
export type SuggestInspectionObservationInput = z.infer<
  typeof SuggestInspectionObservationInputSchema
>;

const SuggestInspectionObservationOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of potential observations about the sugarcane condition.'),
});
export type SuggestInspectionObservationOutput = z.infer<
  typeof SuggestInspectionObservationOutputSchema
>;

export async function suggestInspectionObservation(
  input: SuggestInspectionObservationInput
): Promise<SuggestInspectionObservationOutput> {
  return suggestInspectionObservationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestInspectionObservationPrompt',
  input: {schema: SuggestInspectionObservationInputSchema},
  output: {schema: SuggestInspectionObservationOutputSchema},
  prompt: `You are an experienced agricultural technician specializing in sugarcane inspections.

  Based on the following information, provide a list of potential observations about the sugarcane's condition. Consider factors like height, date, and location to identify potential issues or areas of concern. Be specific and provide actionable insights.

  Height: {{heightCm}} cm
  Inspection Date: {{inspectionDate}}
  Sector: {{sector}}
  Lote: {{lote}}
  Talhoes: {{talhoes}}

  Provide the observations as a numbered list.`,
});

const suggestInspectionObservationFlow = ai.defineFlow(
  {
    name: 'suggestInspectionObservationFlow',
    inputSchema: SuggestInspectionObservationInputSchema,
    outputSchema: SuggestInspectionObservationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
