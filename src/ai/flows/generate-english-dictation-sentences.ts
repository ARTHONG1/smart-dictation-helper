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
  // We handle output validation manually to gracefully handle model errors.
  prompt: `You are an AI assistant for elementary school teachers. Your primary task is to generate **extremely short** English sentences for dictation tests.

**ABSOLUTE CRITICAL RULE: EVERY sentence you generate MUST be 11 characters or less.** This includes all letters, spaces, and punctuation. This is a non-negotiable technical requirement. Any sentence longer than 11 characters will cause an error.

Here are examples to show the strictness of the rule:
- "I am a boy." (11 chars) -> VALID
- "It is a cat." (12 chars) -> INVALID
- "She can run." (12 chars) -> INVALID
- "Look at it." (11 chars) -> VALID
- "It is fun!" (10 chars) -> VALID
- "Hi, I am Sam." (13 chars) -> INVALID

Generate {{sentenceCount}} sentences for a {{gradeLevel}} grade student.
The difficulty level should be {{difficultyLevel}}.

The user provided a topic for inspiration: '{{englishDictationGoal}}'. The topic can be in Korean.
However, if you cannot create a sentence that fits the 11-character limit for the topic, create a simple sentence that ignores the topic.
**The 11-character limit is ALWAYS more important than the topic.**

Before you provide the final JSON output, you MUST double-check and count the characters of every single sentence to ensure it is 11 characters or less.

Return ONLY a JSON object with a "sentences" key containing an array of the generated strings. Do not add any other text, comments, or formatting like markdown.
  `,
});

const generateEnglishDictationSentencesFlow = ai.defineFlow(
  {
    name: 'generateEnglishDictationSentencesFlow',
    inputSchema: GenerateEnglishDictationSentencesInputSchema,
    outputSchema: GenerateEnglishDictationSentencesOutputSchema,
  },
  async (input) => {
    const response = await prompt(input);
    const text = response.text;

    try {
      const jsonString = text!.substring(
        text!.indexOf('{'),
        text!.lastIndexOf('}') + 1
      );
      const parsed = JSON.parse(jsonString);
      
      if (!parsed.sentences || !Array.isArray(parsed.sentences)) {
        throw new Error("AI 응답에 'sentences' 배열이 없습니다.");
      }

      const originalCount = parsed.sentences.length;
      const validSentences = parsed.sentences.filter(
        (s: any) => typeof s === 'string' && s.length <= 11
      );

      if (validSentences.length < originalCount) {
          console.warn(`AI가 11자를 초과하는 문장을 ${originalCount - validSentences.length}개 생성하여 필터링했습니다.`);
      }

      if (validSentences.length === 0 && originalCount > 0) {
        throw new Error(
          'AI가 생성한 모든 문장이 11자를 초과했습니다. 더 쉬운 조건으로 다시 시도해 주세요.'
        );
      }
      
      if (validSentences.length === 0) {
         throw new Error('AI가 유효한 문장을 생성하지 못했습니다. 다시 시도해 주세요.');
      }

      return { sentences: validSentences };
    } catch (e: any) {
      console.error('Failed to parse or validate AI response:', e);
      console.error('Original AI response:', text);
      throw new Error(`AI 응답 처리 오류: ${e.message || '응답 형식이 올바르지 않습니다.'}`);
    }
  }
);
