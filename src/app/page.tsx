"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Sparkles,
  Pencil,
  Trash2,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { getAiSentences } from "./actions";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import WorksheetPreview from "@/components/worksheet-preview";

type WorksheetType = "grid" | "underline";

export default function Home() {
  const { toast } = useToast();
  const [sentences, setSentences] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState("");

  const [aiConfig, setAiConfig] = useState({
    gradeLevel: "1",
    dictationGoal: "받침 있는 글자",
    difficultyLevel: "보통",
    sentenceCount: "5",
  });

  const [worksheetConfig, setWorksheetConfig] = useState({
    type: "grid" as WorksheetType,
    isPracticeActive: true,
    practiceLines: "1",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleReset = () => {
    setSentences([]);
  };

  return (
    <div className="min-h-screen w-full bg-background p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-primary-foreground">
          귀여운 AI 받아쓰기 뚝딱!
        </h1>
        <p className="mt-2 text-muted-foreground text-base sm:text-lg">
          AI가 받아쓰기 문장을 만들어 드려요! 또는 직접 문장을 입력해 보세요.
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Left Panel */}
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
                    <Label htmlFor="count">자동 생성 개수</Label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      value={aiConfig.sentenceCount}
                      onChange={(e) =>
                        setAiConfig({
                          ...aiConfig,
                          sentenceCount: e.target.value,
                        })
                      }
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleAiGenerate} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    AI 문장 자동 생성
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
                        onClick={() => handleDeleteSentence(index)}
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

        {/* Right Panel */}
        <div className="sticky top-8 self-start">
          <WorksheetPreview
            sentences={sentences}
            worksheetConfig={worksheetConfig}
            setWorksheetConfig={setWorksheetConfig}
            isDownloading={isDownloading}
          />
        </div>
      </main>

      <footer className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-7xl mx-auto">
        <Button
          onClick={handleReset}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> 새로고침
        </Button>
      </footer>
    </div>
  );
}
