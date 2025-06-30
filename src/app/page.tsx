
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

type WorksheetType = "grid" | "underline";

const AUDIO_CACHE_KEY = 'audioCache';

export default function Home() {
  const { toast } = useToast();
  const [sentences, setSentences] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [audioLoadingIndex, setAudioLoadingIndex] = useState<number | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});


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
    try {
      const storedCache = localStorage.getItem(AUDIO_CACHE_KEY);
      if (storedCache) {
        setAudioCache(JSON.parse(storedCache));
      }
    } catch (error) {
      console.error("Failed to load audio cache from localStorage", error);
    }
  }, []);

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

  const handlePlayAudio = async (sentence: string, index: number) => {
    if (audioLoadingIndex !== null) return;
  
    if (audioCache[sentence]) {
      const audio = new Audio(audioCache[sentence]);
      audio.play();
      return;
    }
  
    setAudioLoadingIndex(index);
    try {
      const result = await getAudioForSentence(sentence);
      if (result.success && result.audioData) {
        const audio = new Audio(result.audioData);
        audio.play();

        setAudioCache(prevCache => {
          const newCache = { ...prevCache, [sentence]: result.audioData! };
          try {
            localStorage.setItem(AUDIO_CACHE_KEY, JSON.stringify(newCache));
          } catch (error) {
            console.error("Failed to save audio cache to localStorage", error);
          }
          return newCache;
        });
      } else {
        toast({
          variant: "destructive",
          title: "오류",
          description: result.error || "오디오를 재생할 수 없습니다.",
        });
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "오디오를 재생하는 중 문제가 발생했습니다.",
      });
    } finally {
      setAudioLoadingIndex(null);
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
    setSentences([]);
    setManualInput('');
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
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                받아쓰기 문장 목록
              </CardTitle>
              <CardDescription>
                총 {sentences.length}개의 문장이 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-60 overflow-y-auto pr-2">
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
                        onClick={() => handlePlayAudio(sentence, index)}
                        disabled={audioLoadingIndex === index}
                        title="문장 듣기"
                      >
                        {audioLoadingIndex === index ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
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
