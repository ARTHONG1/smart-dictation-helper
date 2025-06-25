"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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

type WorksheetType = "grid" | "underline";

interface WorksheetConfig {
  type: WorksheetType;
  isPracticeActive: boolean;
  practiceLines: number;
}

interface WorksheetPreviewProps {
  sentences: string[];
  worksheetConfig: WorksheetConfig;
  setWorksheetConfig: Dispatch<SetStateAction<WorksheetConfig>>;
  isDownloading: boolean;
}

export default function WorksheetPreview({
  sentences,
  worksheetConfig,
  setWorksheetConfig,
}: // isDownloading and setIsDownloading will be managed here for downloads
WorksheetPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState<"pdf" | "image" | false>(
    false
  );

  const sentencesPerPage = useMemo(() => {
    const { type, isPracticeActive, practiceLines } = worksheetConfig;
    const linesPerSentence = 1 + (isPracticeActive ? practiceLines : 0);

    if (linesPerSentence <= 0) return sentences.length || 1;

    if (type === "grid") {
      // Assuming a total of 15 rows fit on a grid page
      return Math.floor(15 / linesPerSentence) || 1;
    } else {
      // Assuming a total of 10 items (sentence + practice) fit on an underline page
      return Math.floor(10 / linesPerSentence) || 1;
    }
  }, [worksheetConfig]);

  const totalPages = useMemo(() => {
    if (sentences.length === 0) return 1;
    return Math.ceil(sentences.length / sentencesPerPage) || 1;
  }, [sentences.length, sentencesPerPage]);

  const currentSentences = useMemo(() => {
    const startIndex = (currentPage - 1) * sentencesPerPage;
    const endIndex = startIndex + sentencesPerPage;
    return sentences.slice(startIndex, endIndex);
  }, [currentPage, sentences, sentencesPerPage]);

  const handlePageChange = (direction: "next" | "prev") => {
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleDownload = async (type: "pdf" | "image") => {
    if (sentences.length === 0) return;
    setIsDownloading(type);

    const { default: html2canvas } = await import("html2canvas");

    const getPageCanvas = async (pageIndex: number) => {
      const pageElement = document.getElementById(
        `worksheet-page-render-${pageIndex}`
      );
      if (!pageElement) return null;
      return await html2canvas(pageElement, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        backgroundColor: "#ffffff",
      });
    };

    const downloadContainer = document.createElement("div");
    downloadContainer.style.position = "absolute";
    downloadContainer.style.left = "-9999px";
    document.body.appendChild(downloadContainer);

    const pagesToRender = Array.from({ length: totalPages }, (_, i) => i);
    const pageRenders = pagesToRender.map((pageIndex) => {
        const startIndex = pageIndex * sentencesPerPage;
        const pageSentences = sentences.slice(startIndex, startIndex + sentencesPerPage);
        return <WorksheetPage key={pageIndex} id={`worksheet-page-render-${pageIndex}`} sentences={pageSentences} pageNumber={pageIndex + 1} totalPages={totalPages} config={worksheetConfig} />;
    });

    const { render } = await import("react-dom");
    const root = createRoot(downloadContainer);
    root.render(pageRenders);

    await new Promise((resolve) => setTimeout(resolve, 500)); // wait for render

    const canvases = await Promise.all(
      pagesToRender.map((i) => getPageCanvas(i))
    );
    
    document.body.removeChild(downloadContainer);

    if (type === "pdf") {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");
      canvases.forEach((canvas, index) => {
        if (!canvas) return;
        if (index > 0) doc.addPage();
        const imgData = canvas.toDataURL("image/jpeg", 0.9);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        doc.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      });
      doc.save("받아쓰기_학습지.pdf");
    } else {
      canvases.forEach((canvas, index) => {
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = `받아쓰기_학습지_${index + 1}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }

    setIsDownloading(false);
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
              type="number"
              min="1"
              className="w-20"
              value={worksheetConfig.practiceLines}
              onChange={(e) =>
                setWorksheetConfig({
                  ...worksheetConfig,
                  practiceLines: parseInt(e.target.value) || 1,
                })
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
