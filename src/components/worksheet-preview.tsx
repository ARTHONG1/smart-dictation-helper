
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  ImageIcon,
  Loader2,
} from "lucide-react";
import WorksheetPage from "./worksheet-page";
import type { Dispatch, SetStateAction } from "react";
import { createRoot } from "react-dom/client";
import { useToast } from "@/hooks/use-toast";

type WorksheetType = "grid" | "underline";

interface WorksheetConfig {
  type: WorksheetType;
  isPracticeActive: boolean;
  practiceLines: string;
}

interface WorksheetPreviewProps {
  sentences: string[];
  worksheetConfig: WorksheetConfig;
  setWorksheetConfig: Dispatch<SetStateAction<WorksheetConfig>>;
}

export default function WorksheetPreview({
  sentences,
  worksheetConfig,
  setWorksheetConfig,
}: WorksheetPreviewProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState<"pdf" | "image" | false>(
    false
  );

  const sentencesPerPage = useMemo(() => {
    const { type, isPracticeActive, practiceLines } = worksheetConfig;
    const practiceLinesNum = parseInt(practiceLines, 10) || 0;
    const linesPerSentence = 1 + (isPracticeActive ? practiceLinesNum : 0);

    if (linesPerSentence <= 0) return sentences.length || 1;

    if (type === "grid") {
      return Math.floor(10 / linesPerSentence) || 1;
    } else {
      return Math.floor(10 / linesPerSentence) || 1;
    }
  }, [worksheetConfig]);

  const totalPages = useMemo(() => {
    if (sentences.length === 0) return 1;
    return Math.ceil(sentences.length / sentencesPerPage) || 1;
  }, [sentences.length, sentencesPerPage]);
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = useMemo(
    () => (currentPage - 1) * sentencesPerPage,
    [currentPage, sentencesPerPage]
  );

  const currentSentences = useMemo(() => {
    const endIndex = startIndex + sentencesPerPage;
    return sentences.slice(startIndex, endIndex);
  }, [sentences, startIndex, sentencesPerPage]);

  const handlePageChange = (direction: "next" | "prev") => {
    setCurrentPage((prevPage) => {
      if (direction === "next") {
        return prevPage < totalPages ? prevPage + 1 : prevPage;
      } else {
        return prevPage > 1 ? prevPage - 1 : prevPage;
      }
    });
  };

  const handleDownload = async (type: "pdf" | "image") => {
    if (sentences.length === 0) return;
    setIsDownloading(type);

    const { default: html2canvas } = await import("html2canvas");

    const downloadContainer = document.createElement("div");
    downloadContainer.style.position = "absolute";
    downloadContainer.style.left = "-9999px";
    downloadContainer.style.width = "210mm";
    document.body.appendChild(downloadContainer);

    const root = createRoot(downloadContainer);
    const canvases: HTMLCanvasElement[] = [];

    try {
      await document.fonts.ready;

      for (let i = 0; i < totalPages; i++) {
        const pageIndex = i;
        const startIndexForPage = pageIndex * sentencesPerPage;
        const pageSentences = sentences.slice(
          startIndexForPage,
          startIndexForPage + sentencesPerPage
        );

        await new Promise<void>((resolve, reject) => {
          root.render(
            <WorksheetPage
              key={pageIndex}
              id={`worksheet-page-render-${pageIndex}`}
              sentences={pageSentences}
              pageNumber={pageIndex + 1}
              totalPages={totalPages}
              config={worksheetConfig}
              startIndex={startIndexForPage}
              isForDownload={true}
            />
          );

          setTimeout(async () => {
            try {
              const pageElement = downloadContainer.firstChild as HTMLElement;
              if (pageElement) {
                const canvas = await html2canvas(pageElement, {
                  scale: 3,
                  useCORS: true,
                  backgroundColor: "#ffffff",
                });
                canvases.push(canvas);
                resolve();
              } else {
                reject(new Error(`Page element for page ${i + 1} not found.`));
              }
            } catch (e) {
              reject(e);
            }
          }, 100);
        });
      }

      if (canvases.length !== totalPages) {
        throw new Error("Failed to render all pages.");
      }

      if (type === "pdf") {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF("p", "mm", "a4");
        canvases.forEach((canvas, index) => {
          if (index > 0) doc.addPage();
          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          const pdfWidth = doc.internal.pageSize.getWidth();
          const pdfHeight = doc.internal.pageSize.getHeight();
          doc.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        });
        doc.save("받아쓰기_학습지.pdf");
      } else {
        for (let i = 0; i < canvases.length; i++) {
          const canvas = canvases[i];
          const link = document.createElement("a");
          link.download = `받아쓰기_학습지_${i + 1}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error("Failed to download worksheet:", error);
      toast({
        variant: "destructive",
        title: "다운로드 실패",
        description: "학습지를 다운로드하는 중 오류가 발생했습니다.",
      });
    } finally {
      root.unmount();
      document.body.removeChild(downloadContainer);
      setIsDownloading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>최종 학습지 미리보기</CardTitle>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          <div>
            <Label className="font-semibold">학습지 형태</Label>
            <RadioGroup
              value={worksheetConfig.type}
              onValueChange={(v) =>
                setWorksheetConfig({
                  ...worksheetConfig,
                  type: v as WorksheetType,
                })
              }
              className="flex items-center gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grid" id="grid" />
                <Label htmlFor="grid">격자형</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="underline" id="underline" />
                <Label htmlFor="underline">밑줄형</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="practice"
                checked={worksheetConfig.isPracticeActive}
                onCheckedChange={(c) =>
                  setWorksheetConfig({
                    ...worksheetConfig,
                    isPracticeActive: !!c,
                  })
                }
              />
              <Label htmlFor="practice">연습 공간 추가</Label>
            </div>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-20"
              value={worksheetConfig.practiceLines}
              onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setWorksheetConfig({
                    ...worksheetConfig,
                    practiceLines: value,
                  })
                }
              }
              disabled={!worksheetConfig.isPracticeActive}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent id="worksheet-preview-area" className="bg-muted/50 rounded-lg p-4 min-h-[400px]">
        {sentences.length > 0 ? (
            <WorksheetPage
                id="worksheet-page-preview"
                sentences={currentSentences}
                pageNumber={currentPage}
                totalPages={totalPages}
                config={worksheetConfig}
                startIndex={startIndex}
                isPreview
            />
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>왼쪽에서 문장을 추가하여 미리보기를 확인하세요.</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4 pt-6">
        {sentences.length > 0 && (
          <div className="flex items-center justify-center w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange("prev")}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="font-mono text-sm mx-4">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange("next")}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <Button
            onClick={() => handleDownload("pdf")}
            disabled={isDownloading !== false || sentences.length === 0}
            className="w-full"
          >
            {isDownloading === "pdf" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            PDF 다운로드
          </Button>
          <Button
            onClick={() => handleDownload("image")}
            disabled={isDownloading !== false || sentences.length === 0}
            className="w-full"
          >
            {isDownloading === "image" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="mr-2 h-4 w-4" />
            )}
            이미지 다운로드
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
