'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a secure, random password.
 *
 * - generatePassword - A function that triggers the password generation flow.
 * - GeneratePasswordInput - The input type for the generatePassword function (currently empty).
 * - GeneratePasswordOutput - The return type for the generatePassword function, containing the generated password.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePasswordInputSchema = z.object({}).describe('Input schema for generating a random password.');
export type GeneratePasswordInput = z.infer<typeof GeneratePasswordInputSchema>;

const GeneratePasswordOutputSchema = z.object({
  password: z.string().describe('The randomly generated password consisting only of uppercase and lowercase letters.'),
}).describe('Output schema for the randomly generated password.');
export type GeneratePasswordOutput = z.infer<typeof GeneratePasswordOutputSchema>;

const passwordPrompt = ai.definePrompt({
  name: 'generatePasswordPrompt',
  input: { schema: GeneratePasswordInputSchema },
  output: { schema: GeneratePasswordOutputSchema },
  prompt: `Generate a random password that is exactly 12 characters long.
The password must ONLY contain uppercase and lowercase English letters (a-z, A-Z).
Do NOT include any numbers, symbols, or special characters.
Your response MUST be a JSON object with a single field named "password" containing the generated password string.`,
});

const generatePasswordFlow = ai.defineFlow(
  {
    name: 'generatePasswordFlow',
    inputSchema: GeneratePasswordInputSchema,
    outputSchema: GeneratePasswordOutputSchema,
  },
  async (input) => {
    const { output } = await passwordPrompt(input);
    if (!output) {
      throw new Error('Failed to generate password.');
    }
    return output;
  }
);

export async function generatePassword(input: GeneratePasswordInput = {}): Promise<GeneratePasswordOutput> {
  return generatePasswordFlow(input);
}
