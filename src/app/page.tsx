
"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Pencil,
  Trash2,
  Loader2,
  BookOpen,
  Volume2,
  RefreshCw,
  Globe,
  DownloadCloud,
  Square,
} from "lucide-react";
import { getAiSentences, getAudioForSentence, getEnglishAiSentences } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import WorksheetPreview from "@/components/worksheet-preview";
import { Slider } from "@/components/ui/slider";

type WorksheetType = "grid" | "underline";

export default function Home() {
  const { toast } = useToast();
  const [sentences, setSentences] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  
  const [combinedAudio, setCombinedAudio] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Browser TTS states
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);
  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState<number | null>(null);
  const [speechRate, setSpeechRate] = useState(0.8);

  const [aiConfig, setAiConfig] = useState({
    gradeLevel: "1",
    dictationGoal: "",
    englishDictationGoal: "",
    difficultyLevel: "보통",
    sentenceCount: "",
  });

  const [worksheetConfig, setWorksheetConfig] = useState({
    type: "grid" as WorksheetType,
    isPracticeActive: true,
    practiceLines: "1",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEnglishLoading, setIsEnglishLoading] = useState(false);

  useEffect(() => {
    setCombinedAudio(null);
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsBrowserSpeaking(false);
      setCurrentlySpeakingIndex(null);
    }
  }, [sentences]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleBrowserSpeech = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) {
        toast({ variant: 'destructive', title: '오류', description: '이 브라우저에서는 음성 합성을 지원하지 않습니다.' });
        return;
    }

    if (isBrowserSpeaking && currentlySpeakingIndex === index) {
        window.speechSynthesis.cancel();
        setIsBrowserSpeaking(false);
        setCurrentlySpeakingIndex(null);
        return;
    }
    
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
    const targetLang = isKorean ? 'ko' : 'en';

    const voice = availableVoices.find(v => v.lang.startsWith(targetLang) && v.name.includes('Google')) ||
                  availableVoices.find(v => v.lang.startsWith(targetLang));
    
    if (voice) {
        utterance.voice = voice;
    }
    utterance.lang = voice?.lang || (isKorean ? 'ko-KR' : 'en-US');
    utterance.rate = speechRate;
    
    utterance.onstart = () => {
        setIsBrowserSpeaking(true);
        setCurrentlySpeakingIndex(index);
    };

    utterance.onend = () => {
        setIsBrowserSpeaking(false);
        setCurrentlySpeakingIndex(null);
    };

    utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        toast({ variant: 'destructive', title: '음성 재생 오류', description: '기본 음성을 재생하는 중 오류가 발생했습니다.' });
        setIsBrowserSpeaking(false);
        setCurrentlySpeakingIndex(null);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSentenceChange = (index: number, value: string) => {
    if (value.length > 11) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "문장은 11자를 초과할 수 없습니다.",
      });
      return;
    }
    const newSentences = [...sentences];
    newSentences[index] = value;
    setSentences(newSentences);
  };

  const handleAddSentence = () => {
    const lines = manualInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const validLines: string[] = [];
    for (const line of lines) {
      if (line.length > 11) {
        toast({
          variant: "destructive",
          title: "입력 오류",
          description: `"${line}" 문장이 11자를 초과합니다.`,
        });
        return;
      }
      validLines.push(line);
    }
    setSentences((prev) => [...prev, ...validLines]);
    setManualInput("");
  };

  const handleDeleteSentence = (index: number) => {
    setSentences((prev) => prev.filter((_, i) => i !== index));
  };
  
  const handleGenerateCombinedAudio = async () => {
    if (!sentences.length || isGeneratingAudio) return;

    setIsGeneratingAudio(true);
    setCombinedAudio(null);
    
    try {
      const combinedText = sentences.join('\n\n');
      const result = await getAudioForSentence(combinedText);

      if (result.success && result.audioData) {
        setCombinedAudio(result.audioData);
        toast({
          title: "성공",
          description: "고품질 전체 문장 음성을 성공적으로 생성했습니다!",
        });
      } else {
        let description = result.error || "알 수 없는 오류로 오디오를 생성할 수 없습니다.";
        if (description && description.includes("429")) {
            description = "요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해주세요. (하루 무료 생성 횟수는 제한적입니다)";
        }
        toast({
          variant: "destructive",
          title: "오디오 생성 오류",
          description: description,
        });
      }
    } catch (error) {
      console.error("Combined audio generation error:", error);
      toast({
        variant: "destructive",
        title: "오디오 생성 오류",
        description: "음성을 생성하는 중 문제가 발생했습니다.",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleAiGenerate = async () => {
    setIsLoading(true);
    const result = await getAiSentences({
      ...aiConfig,
      gradeLevel: parseInt(aiConfig.gradeLevel),
      sentenceCount: parseInt(aiConfig.sentenceCount) || 1,
    });
    if (result.success && result.sentences) {
      setSentences(result.sentences);
      toast({
        title: "성공",
        description: "AI가 문장을 성공적으로 생성했습니다!",
      });
    } else {
      toast({
        variant: "destructive",
        title: "오류",
        description: result.error,
      });
    }
    setIsLoading(false);
  };
  
  const handleEnglishAiGenerate = async () => {
    setIsEnglishLoading(true);
    const result = await getEnglishAiSentences({
      ...aiConfig,
      gradeLevel: parseInt(aiConfig.gradeLevel),
      sentenceCount: parseInt(aiConfig.sentenceCount) || 1,
    });
    if (result.success && result.sentences) {
      setSentences(result.sentences);
      toast({
        title: "성공",
        description: "AI가 영어 문장을 성공적으로 생성했습니다!",
      });
    } else {
      toast({
        variant: "destructive",
        title: "오류",
        description: result.error,
      });
    }
    setIsEnglishLoading(false);
  };

  const handleReset = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsBrowserSpeaking(false);
    setCurrentlySpeakingIndex(null);
    setSentences([]);
    setManualInput('');
    setCombinedAudio(null);
    setAiConfig({
      gradeLevel: "1",
      dictationGoal: "",
      englishDictationGoal: "",
      difficultyLevel: "보통",
      sentenceCount: "",
    });
    setWorksheetConfig({
      type: "grid" as WorksheetType,
      isPracticeActive: true,
      practiceLines: "1",
    })
  };

  return (
    <div className="min-h-screen w-full bg-background p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground">
          우리반 AI 받아쓰기
        </h1>
        <p className="mt-2 text-muted-foreground text-base sm:text-lg">
          AI가 받아쓰기 학습지를 자동으로 만들어주고, 또박또박 읽어주는 음성도 함께 제공해요. 선생님의 소중한 시간을 아껴드립니다.
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-6">
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai">
                <Sparkles className="mr-2 h-4 w-4" /> AI 자동 생성
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Pencil className="mr-2 h-4 w-4" /> 직접 입력
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ai">
              <Card>
                <CardHeader>
                  <CardTitle>AI 자동 생성 옵션</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="grade">학년</Label>
                      <Select
                        value={aiConfig.gradeLevel}
                        onValueChange={(v) =>
                          setAiConfig({ ...aiConfig, gradeLevel: v })
                        }
                      >
                        <SelectTrigger id="grade">
                          <SelectValue placeholder="학년 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(6).keys()].map((i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              {i + 1}학년
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="difficulty">성취 수준</Label>
                      <Select
                        value={aiConfig.difficultyLevel}
                        onValueChange={(v) =>
                          setAiConfig({ ...aiConfig, difficultyLevel: v })
                        }
                      >
                        <SelectTrigger id="difficulty">
                          <SelectValue placeholder="수준 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="쉬움">쉬움</SelectItem>
                          <SelectItem value="보통">보통</SelectItem>
                          <SelectItem value="어려움">어려움</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="goal">국어 받아쓰기 목표</Label>
                    <Input
                      id="goal"
                      placeholder="예: 받침 있는 글자, 이중 모음"
                      value={aiConfig.dictationGoal}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, dictationGoal: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="english-goal">영어 받아쓰기 목표</Label>
                    <Input
                      id="english-goal"
                      placeholder="예: phonics, sight words"
                      value={aiConfig.englishDictationGoal}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, englishDictationGoal: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="count">자동 생성 개수</Label>
                    <Input
                      id="count"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={aiConfig.sentenceCount}
                      onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setAiConfig({
                            ...aiConfig,
                            sentenceCount: value,
                          })
                        }
                      }
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button onClick={handleAiGenerate} disabled={isLoading || isEnglishLoading} className="w-full">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    AI 문장 자동 생성
                  </Button>
                  <Button onClick={handleEnglishAiGenerate} disabled={isLoading || isEnglishLoading} className="w-full" variant="secondary">
                     {isEnglishLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Globe className="mr-2 h-4 w-4" />
                    )}
                    영어 특화 AI 문장 자동 생성
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle>직접 받아쓰기 문장 입력</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="한 줄에 한 문장씩 입력하세요. (최대 11자)"
                    rows={5}
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                  />
                </CardContent>
                <CardFooter>
                  <Button onClick={handleAddSentence} className="w-full">
                    <Pencil className="mr-2 h-4 w-4" /> 문장 추가
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  받아쓰기 문장 목록
                </CardTitle>
                <CardDescription>
                  총 {sentences.length}개
                </CardDescription>
              </div>
               <div className="space-y-2 pt-4">
                  <Label htmlFor="speech-rate">기본 음성 속도 조절</Label>
                  <Slider
                    id="speech-rate"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={[speechRate]}
                    onValueChange={(value) => setSpeechRate(value[0])}
                  />
                </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4 border-b pb-4">
                  <Button
                      onClick={handleGenerateCombinedAudio}
                      disabled={isGeneratingAudio || sentences.length === 0}
                      className="w-full"
                  >
                      {isGeneratingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
                      고급) 고품질 전체 문장 음성 생성
                  </Button>
                  {combinedAudio && (
                      <div className="flex flex-col items-center gap-2">
                          <audio controls src={combinedAudio} className="w-full h-10">
                            오디오를 지원하지 않는 브라우저입니다.
                          </audio>
                           <Button
                              onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = combinedAudio;
                                  link.download = '받아쓰기_음성.wav';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                              }}
                              variant="outline"
                              className="w-full"
                          >
                              <DownloadCloud className="mr-2 h-4 w-4" />
                              음성 파일 다운로드 (.wav)
                          </Button>
                      </div>
                  )}
              </div>
              <div className="max-h-60 overflow-y-auto pr-2">
                <div className="space-y-2">
                  {sentences.length > 0 ? (
                    sentences.map((sentence, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-8 text-center">
                          {index + 1}.
                        </span>
                        <Input
                          value={sentence}
                          onChange={(e) =>
                            handleSentenceChange(index, e.target.value)
                          }
                          className="flex-grow"
                        />
                         <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleBrowserSpeech(sentence, index)}
                            title={isBrowserSpeaking && currentlySpeakingIndex === index ? "재생 중지" : "기본 음성으로 듣기"}
                            disabled={isBrowserSpeaking && currentlySpeakingIndex !== index}
                          >
                            {isBrowserSpeaking && currentlySpeakingIndex === index ? (
                                <Square className="h-4 w-4 text-primary" />
                            ) : (
                                <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSentence(index)}
                          title="문장 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      문장을 추가해주세요.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="sticky top-8 self-start">
          <WorksheetPreview
            sentences={sentences}
            worksheetConfig={worksheetConfig}
            setWorksheetConfig={setWorksheetConfig}
          />
        </div>
      </main>

      <footer className="mt-8 flex justify-center items-center gap-4 max-w-7xl mx-auto">
        <Button
          onClick={handleReset}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </footer>
    </div>
  );
}
