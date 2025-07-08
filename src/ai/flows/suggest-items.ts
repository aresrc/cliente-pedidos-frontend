
'use server';
/**
 * @fileOverview Suggests menu items based on the time of day, previous orders, and available menu items.
 *
 * - suggestItems - A function that suggests menu items.
 * - SuggestItemsInput - The input type for the suggestItems function.
 * - SuggestItemsOutput - The return type for the suggestItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestItemsInputSchema = z.object({
  timeOfDay: z
    .string()
    .describe(
      'The time of day, e.g., morning, afternoon, evening, or night.'
    ),
  previousOrders: z
    .string()
    .describe('A comma-separated list of previously ordered items. Can be "None".'),
  availableMenuItems: z
    .string()
    .describe('A comma-separated list of all available menu item names.'),
});
export type SuggestItemsInput = z.infer<typeof SuggestItemsInputSchema>;

const SuggestItemsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('A comma-separated list of suggested menu items, taken ONLY from the available menu items list.'),
});
export type SuggestItemsOutput = z.infer<typeof SuggestItemsOutputSchema>;

export async function suggestItems(input: SuggestItemsInput): Promise<SuggestItemsOutput> {
  return suggestItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestItemsPrompt',
  input: {schema: SuggestItemsInputSchema},
  output: {schema: SuggestItemsOutputSchema},
  prompt: `You are a helpful assistant for a restaurant.
Given the current time of day, the customer's previous orders, and a list of available menu items, suggest a few items that the customer might enjoy.

Your suggestions MUST come ONLY from the 'Available Menu Items' list provided below.
Do not suggest items that are not in this list.
Format your suggestions as a comma-separated list.

Time of day: {{{timeOfDay}}}
Previous orders: {{{previousOrders}}}
Available Menu Items: {{{availableMenuItems}}}

Suggestions:`,
});

const suggestItemsFlow = ai.defineFlow(
  {
    name: 'suggestItemsFlow',
    inputSchema: SuggestItemsInputSchema,
    outputSchema: SuggestItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

