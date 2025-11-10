'use server';

/**
 * @fileOverview A personalized game recommendation AI agent.
 * 
 * - getPersonalizedGameRecommendations - A function that retrieves personalized game recommendations based on user data.
 * - PersonalizedGameRecommendationsInput - The input type for the getPersonalizedGameRecommendations function.
 * - PersonalizedGameRecommendationsOutput - The return type for the getPersonalizedGameRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedGameRecommendationsInputSchema = z.object({
  purchaseHistory: z
    .array(z.string())
    .describe('An array of game titles the user has previously purchased.'),
  playStyle: z
    .string()
    .describe(
      'A description of the users preferred play style, including genres, preferred game mechanics, and typical gaming habits.'
    ),
});
export type PersonalizedGameRecommendationsInput = z.infer<
  typeof PersonalizedGameRecommendationsInputSchema
>;

const PersonalizedGameRecommendationsOutputSchema = z.object({
  recommendedGames: z
    .array(z.string())
    .describe(
      'An array of game titles recommended to the user based on their purchase history and play style.'
    ),
  reasoning: z
    .string()
    .describe(
      'A brief explanation of why these games were recommended, referencing the users purchase history and play style.'
    ),
});
export type PersonalizedGameRecommendationsOutput = z.infer<
  typeof PersonalizedGameRecommendationsOutputSchema
>;

export async function getPersonalizedGameRecommendations(
  input: PersonalizedGameRecommendationsInput
): Promise<PersonalizedGameRecommendationsOutput> {
  return personalizedGameRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedGameRecommendationsPrompt',
  input: {schema: PersonalizedGameRecommendationsInputSchema},
  output: {schema: PersonalizedGameRecommendationsOutputSchema},
  prompt: `You are a game recommendation expert. Given a user's purchase history and play style, you will recommend games they might enjoy.\n\nPurchase History: {{{purchaseHistory}}}\nPlay Style: {{{playStyle}}}\n\nBased on this information, recommend a list of games the user might enjoy, and briefly explain why each game was recommended, referencing their purchase history and play style.`,
});

const personalizedGameRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedGameRecommendationsFlow',
    inputSchema: PersonalizedGameRecommendationsInputSchema,
    outputSchema: PersonalizedGameRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
