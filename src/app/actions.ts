"use server";

import {
  generateAiDictationSentences,
  type GenerateDictationSentencesInput,
} from "@/ai/flows/generate-dictation-sentences";

export async function getAiSentences(input: GenerateDictationSentencesInput) {
  try {
    // The AI flow expects a specific enum type, let's ensure it's correct
    const validatedInput = {
      ...input,
      difficultyLevel: input.difficultyLevel as '쉬움' | '보통' | '어려움',
    };
    const result = await generateAiDictationSentences(validatedInput);
    return { success: true, sentences: result.sentences };
  } catch (error) {
    console.error("AI Sentence Generation Error:", error);
    if (error instanceof Error) {
        return { success: false, error: `AI 문장 생성에 실패했습니다: ${error.message}` };
    }
    return { success: false, error: "AI 문장 생성 중 알 수 없는 오류가 발생했습니다." };
  }
}
