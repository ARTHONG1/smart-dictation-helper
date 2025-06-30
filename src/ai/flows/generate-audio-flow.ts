'use server';
/**
 * @fileOverview A text-to-speech AI flow for generating audio from sentences.
 *
 * - generateAudioFromSentence - A function that handles the TTS process.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateAudioFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (sentence) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
      },
      prompt: sentence,
    });
    
    if (!media || !media.url || !media.url.includes(',')) {
      throw new Error('TTS 모델로부터 유효하지 않거나 비어있는 오디오 데이터를 받았습니다.');
    }

    const base64Data = media.url.substring(media.url.indexOf(',') + 1);
    if (!base64Data) {
        throw new Error('TTS 모델로부터 비어있는 오디오 데이터를 받았습니다.');
    }

    const audioBuffer = Buffer.from(base64Data, 'base64');

    if (audioBuffer.length === 0) {
        throw new Error('오디오 데이터가 비어있어 변환할 수 없습니다.');
    }

    const wavData = await toWav(audioBuffer);
    return `data:audio/wav;base64,${wavData}`;
  }
);

export async function generateAudioFromSentence(sentence: string): Promise<string> {
    return generateAudioFlow(sentence);
}
