// src/ai/flows/generate-dictation-sentences.ts
'use server';

/**
 * @fileOverview AI-powered dictation sentence generator for teachers.
 *
 * - generateAiDictationSentences - A function that generates dictation sentences based on grade, goal, and difficulty.
 * - GenerateDictationSentencesInput - The input type for the generateAiDictationSentences function.
 * - GenerateDictationSentencesOutput - The return type for the generateAiDictationSentences function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDictationSentencesInputSchema = z.object({
  gradeLevel: z.number().describe('The grade level of the dictation sentences (1-6).'),
  dictationGoal: z.string().describe('The dictation goal (e.g., 받침 있는 글자, 이중 모음).'),
  difficultyLevel: z.enum(['쉬움', '보통', '어려움']).describe('The difficulty level of the dictation sentences.'),
  sentenceCount: z.number().describe('The number of sentences to generate.'),
});
export type GenerateDictationSentencesInput = z.infer<typeof GenerateDictationSentencesInputSchema>;

const GenerateDictationSentencesOutputSchema = z.object({
  sentences: z.array(
    z.string().max(11).describe('A generated dictation sentence (maximum 11 characters).')
  ).describe('The list of generated dictation sentences.'),
});
export type GenerateDictationSentencesOutput = z.infer<typeof GenerateDictationSentencesOutputSchema>;

export async function generateAiDictationSentences(
  input: GenerateDictationSentencesInput
): Promise<GenerateDictationSentencesOutput> {
  return generateDictationSentencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDictationSentencesPrompt',
  input: {schema: GenerateDictationSentencesInputSchema},
  output: {schema: GenerateDictationSentencesOutputSchema},
  prompt: `You are an AI assistant helping elementary school teachers generate dictation sentences.

  Generate {{sentenceCount}} dictation sentences for grade {{gradeLevel}} students.
  The dictation goal is: {{dictationGoal}}.
  The difficulty level is: {{difficultyLevel}}.

  Each sentence should be no more than 11 characters long (including spaces).
  Sentences should be appropriate for the specified grade level and dictation goal.
  Sentences should match the specified difficulty level, using vocabulary appropriate for that level.

  Return the sentences as a JSON array of strings.
  `,
});

const generateDictationSentencesFlow = ai.defineFlow(
  {
    name: 'generateDictationSentencesFlow',
    inputSchema: GenerateDictationSentencesInputSchema,
    outputSchema: GenerateDictationSentencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
