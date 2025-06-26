'use server';

/**
 * @fileOverview AI-powered English dictation sentence generator for teachers.
 *
 * - generateEnglishAiDictationSentences - A function that generates English dictation sentences.
 * - GenerateEnglishDictationSentencesInput - The input type for the function.
 * - GenerateEnglishDictationSentencesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEnglishDictationSentencesInputSchema = z.object({
  gradeLevel: z.number().describe('The grade level of the dictation sentences (1-6).'),
  englishDictationGoal: z.string().describe('The English dictation goal (e.g., phonics, sight words).'),
  difficultyLevel: z.enum(['쉬움', '보통', '어려움']).describe('The difficulty level (Easy, Normal, Hard) of the dictation sentences.'),
  sentenceCount: z.number().describe('The number of sentences to generate.'),
});
export type GenerateEnglishDictationSentencesInput = z.infer<typeof GenerateEnglishDictationSentencesInputSchema>;

const GenerateEnglishDictationSentencesOutputSchema = z.object({
  sentences: z.array(
    z.string().max(11).describe('A generated English dictation sentence (maximum 11 characters).')
  ).describe('The list of generated English dictation sentences.'),
});
export type GenerateEnglishDictationSentencesOutput = z.infer<typeof GenerateEnglishDictationSentencesOutputSchema>;

export async function generateEnglishAiDictationSentences(
  input: GenerateEnglishDictationSentencesInput
): Promise<GenerateEnglishDictationSentencesOutput> {
  return generateEnglishDictationSentencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEnglishDictationSentencesPrompt',
  input: {schema: GenerateEnglishDictationSentencesInputSchema},
  output: {schema: GenerateEnglishDictationSentencesOutputSchema},
  prompt: `You are an AI assistant helping elementary school teachers generate English dictation sentences.

  Generate {{sentenceCount}} English dictation sentences for grade {{gradeLevel}} students.
  The English dictation goal is: {{englishDictationGoal}}.
  The difficulty level is: {{difficultyLevel}}.

  **IMPORTANT: Each sentence MUST be 11 characters or less.**
  This character limit includes spaces and all punctuation.
  For example, the sentence "I see a cat." is 12 characters long and is **invalid**.
  The sentence "I see a bug." is 11 characters long and is **valid**.

  The sentences should be simple, grammatically correct, and appropriate for the specified grade level.
  The sentences should be based on the dictation goal (e.g., specific phonics rules, sight words).
  The sentences should match the specified difficulty level, using vocabulary appropriate for that level.

  Return the sentences as a JSON object with a "sentences" key containing an array of strings.
  `,
});

const generateEnglishDictationSentencesFlow = ai.defineFlow(
  {
    name: 'generateEnglishDictationSentencesFlow',
    inputSchema: GenerateEnglishDictationSentencesInputSchema,
    outputSchema: GenerateEnglishDictationSentencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
