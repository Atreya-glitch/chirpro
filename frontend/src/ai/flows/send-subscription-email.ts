'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SubscriptionEmailInputSchema = z.object({
  email: z.string().email().describe('The user email address.'),
  planName: z.string().describe('The name of the subscription plan.'),
  price: z.string().describe('The price paid for the subscription.'),
  transactionId: z.string().describe('A unique transaction reference.'),
}).describe('Input schema for generating a subscription confirmation email.');
export type SubscriptionEmailInput = z.infer<typeof SubscriptionEmailInputSchema>;

const SubscriptionEmailOutputSchema = z.object({
  subject: z.string().describe('The email subject line.'),
  body: z.string().describe('The formatted email body containing invoice details.'),
}).describe('Output schema for the generated invoice email.');
export type SubscriptionEmailOutput = z.infer<typeof SubscriptionEmailOutputSchema>;

const emailPrompt = ai.definePrompt({
  name: 'generateSubscriptionEmailPrompt',
  input: { schema: SubscriptionEmailInputSchema },
  output: { schema: SubscriptionEmailOutputSchema },
  prompt: `You are the ChirpPro Billing Assistant.
Generate a professional subscription confirmation email for a user who just upgraded their plan.

Details:
User Email: {{{email}}}
Plan: {{{planName}}}
Price: {{{price}}}
Transaction ID: {{{transactionId}}}

The email should include:
1. A warm greeting.
2. Confirmation of the successful upgrade.
3. An "Invoice Summary" section with the price and transaction ID.
4. A reminder of their new tweeting limits (Free: 1, Bronze: 3, Silver: 5, Gold: Unlimited).
5. A professional sign-off.

Format the body as plain text with clear sections.`,
});

const sendSubscriptionEmailFlow = ai.defineFlow(
  {
    name: 'sendSubscriptionEmailFlow',
    inputSchema: SubscriptionEmailInputSchema,
    outputSchema: SubscriptionEmailOutputSchema,
  },
  async (input) => {
    const { output } = await emailPrompt(input);
    if (!output) {
      throw new Error('Failed to generate subscription email.');
    }
    
    return output;
  }
);

export async function sendSubscriptionEmail(input: SubscriptionEmailInput): Promise<SubscriptionEmailOutput> {
  return sendSubscriptionEmailFlow(input);
}
