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
    z.string().max(11).describe('A generated English sentence. IMPORTANT: It MUST NOT exceed 11 characters, including spaces and punctuation.')
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
  prompt: `You are an AI assistant for elementary school teachers. Your task is to generate short English sentences for dictation tests.

Follow these rules STRICTLY:
1.  Generate {{sentenceCount}} sentences for {{gradeLevel}} grade students.
2.  The topic is "{{englishDictationGoal}}".
3.  The difficulty is "{{difficultyLevel}}".
4.  **THE ABSOLUTE MAXIMUM LENGTH for each sentence is 11 characters.** This includes all letters, spaces, and punctuation. Any sentence longer than 11 characters is invalid.

Here are examples of length calculation:
- "I see a bug." is 11 characters long. This is VALID.
- "I see a cat." is 12 characters long. This is INVALID.
- "A red dog." is 10 characters long. This is VALID.
- "It is a cat" is 11 characters long. This is VALID.

Before you provide the final JSON output, you MUST double-check every single sentence to ensure it is 11 characters or less. If any sentence is longer, you must shorten it or create a new one that fits the length constraint.

Return ONLY a JSON object with a "sentences" key containing an array of the generated strings.
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
