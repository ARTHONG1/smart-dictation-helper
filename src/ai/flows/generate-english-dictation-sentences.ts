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
  englishDictationGoal: z.string().describe('The English dictation topic. It can be in English or Korean (e.g., phonics, sight words, 행복). This is a suggestion for the AI.'),
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
  prompt: `You are an AI assistant for elementary school teachers. Your primary task is to generate **extremely short** English sentences for dictation tests.

**The most important rule is the length: EVERY sentence MUST be 11 characters or less.** This includes all letters, spaces, and punctuation. This is a strict technical requirement.

Examples:
- "I am a boy." -> 11 chars. (VALID)
- "It is a cat." -> 12 chars. (INVALID)
- "She can run." -> 12 chars. (INVALID)
- "Look at it." -> 11 chars. (VALID)
- "It is fun!" -> 10 chars. (VALID)

Generate {{sentenceCount}} sentences for a {{gradeLevel}} grade student.
The difficulty level should be {{difficultyLevel}}.

The user provided a topic for inspiration: '{{englishDictationGoal}}'. The topic can be in Korean.
However, if you cannot create a sentence that fits the 11-character limit for the topic, create a simple sentence that ignores the topic.
**The 11-character limit is more important than the topic.**

Before you provide the final JSON output, you MUST double-check every single sentence to ensure it is 11 characters or less.

Return ONLY a JSON object with a "sentences" key containing an array of the generated strings, where each string is 11 characters or less.
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
