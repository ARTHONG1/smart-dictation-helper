"use server";

import {
  generateAiDictationSentences,
  type GenerateDictationSentencesInput,
} from "@/ai/flows/generate-dictation-sentences";
import {
  generateEnglishAiDictationSentences,
  type GenerateEnglishDictationSentencesInput,
} from "@/ai/flows/generate-english-dictation-sentences";
import { generateAudioFromSentence } from "@/ai/flows/generate-audio-flow";

export async function getAiSentences(input: GenerateDictationSentencesInput) {
  try {
    const validatedInput = {
      ...input,
      difficultyLevel: input.difficultyLevel as "쉬움" | "보통" | "어려움",
      gradeLevel: parseInt(input.gradeLevel as any, 10),
      sentenceCount: parseInt(input.sentenceCount as any, 10),
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

export async function getEnglishAiSentences(input: GenerateEnglishDictationSentencesInput) {
  try {
    const validatedInput = {
      ...input,
      difficultyLevel: input.difficultyLevel as "쉬움" | "보통" | "어려움",
      gradeLevel: parseInt(input.gradeLevel as any, 10),
      sentenceCount: parseInt(input.sentenceCount as any, 10),
    };
    const result = await generateEnglishAiDictationSentences(validatedInput);
    return { success: true, sentences: result.sentences };
  } catch (error) {
    console.error("English AI Sentence Generation Error:", error);
    if (error instanceof Error) {
      return { success: false, error: `영어 AI 문장 생성에 실패했습니다: ${error.message}` };
    }
    return { success: false, error: "영어 AI 문장 생성 중 알 수 없는 오류가 발생했습니다." };
  }
}


export async function getAudioForSentence(sentence: string) {
  try {
    const audioData = await generateAudioFromSentence(sentence);
    return { success: true, audioData };
  } catch (error) {
    console.error("Audio Generation Error:", error);
    if (error instanceof Error) {
      if (error.message.includes("429")) {
        return { success: false, error: "요청이 너무 많습니다. 1분 후에 다시 시도해주세요." };
      }
      return { success: false, error: `오디오 생성에 실패했습니다: ${error.message}` };
    }
    return { success: false, error: "오디오 생성 중 알 수 없는 오류가 발생했습니다." };
  }
}
