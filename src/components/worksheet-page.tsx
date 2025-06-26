"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

type WorksheetType = "grid" | "underline";

interface WorksheetConfig {
  type: WorksheetType;
  isPracticeActive: boolean;
  practiceLines: string;
}

interface WorksheetPageProps {
  id: string;
  sentences: string[];
  pageNumber: number;
  totalPages: number;
  config: WorksheetConfig;
  isPreview?: boolean;
}

const GridRow = ({
  chars,
  isPractice,
  sentenceNumber,
  rowKey,
}: {
  chars: string[];
  isPractice: boolean;
  sentenceNumber?: number;
  rowKey: string;
}) => (
  <div key={rowKey} className="flex items-center">
    <div className="w-8 text-center font-bold text-lg flex items-center justify-center">
      {!isPractice && `${sentenceNumber}.`}
    </div>
    <div className="grid grid-cols-11 gap-px border-l border-t border-gray-400 bg-gray-400 flex-1">
      {chars.map((char, i) => (
        <div
          key={i}
          className="grid place-items-center aspect-square bg-white text-2xl font-display border-r border-b border-gray-400"
        >
          {char}
        </div>
      ))}
    </div>
  </div>
);

const GridSentence = ({
  sentence,
  config,
  sentenceNumber,
}: {
  sentence: string;
  config: WorksheetConfig;
  sentenceNumber: number;
}) => {
  const characters = sentence.padEnd(11, "").split("");
  const practiceLinesNum = parseInt(config.practiceLines) || 0;

  return (
    <div className="space-y-1">
      <GridRow
        chars={characters}
        isPractice={false}
        sentenceNumber={sentenceNumber}
        rowKey={`sentence-${sentenceNumber}`}
      />
      {config.isPracticeActive &&
        Array.from({ length: practiceLinesNum }).map((_, i) => (
          <GridRow
            key={`practice-grid-${sentenceNumber}-${i}`}
            chars={Array(11).fill("")}
            isPractice={true}
            rowKey={`practice-grid-${sentenceNumber}-${i}`}
          />
        ))}
    </div>
  );
};

const UnderlineRow = ({
  text,
  isPractice,
  sentenceNumber,
  rowKey,
}: {
  text: string | null;
  isPractice: boolean;
  sentenceNumber?: number;
  rowKey: string;
}) => (
  <div key={rowKey} className="flex items-center h-12">
    <div className="w-10 text-center font-bold text-lg flex items-center justify-center">
      {!isPractice && `${sentenceNumber}.`}
    </div>
    <div className="flex-1 border-b-2 border-gray-400 h-full flex items-end pb-1">
      <span className="text-2xl font-display tracking-widest">{text}</span>
    </div>
  </div>
);

const UnderlineSentence = ({
  sentence,
  config,
  sentenceNumber,
}: {
  sentence: string;
  config: WorksheetConfig;
  sentenceNumber: number;
}) => {
  const practiceLinesNum = parseInt(config.practiceLines) || 0;
  return (
    <div className="space-y-1">
      <UnderlineRow
        text={sentence}
        isPractice={false}
        sentenceNumber={sentenceNumber}
        rowKey={`underline-sentence-${sentenceNumber}`}
      />
      {config.isPracticeActive &&
        Array.from({ length: practiceLinesNum }).map((_, i) => (
          <UnderlineRow
            key={`practice-line-${sentenceNumber}-${i}`}
            text={null}
            isPractice={true}
            rowKey={`practice-line-${sentenceNumber}-${i}`}
          />
        ))}
    </div>
  );
};

export default function WorksheetPage({
  id,
  sentences,
  pageNumber,
  totalPages,
  config,
  isPreview = false,
}: WorksheetPageProps) {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // This will only run on the client, after initial hydration
    setCurrentDate(new Date().toLocaleDateString("ko-KR"));
  }, []); // Empty dependency array ensures this runs once on mount

  const sentencesPerPage = useMemo(() => {
    const { type, isPracticeActive, practiceLines } = config;
    const practiceLinesNum = parseInt(practiceLines, 10) || 0;
    const linesPerSentence = 1 + (isPracticeActive ? practiceLinesNum : 0);

    if (linesPerSentence <= 0) return 1;

    if (type === "grid") {
      return Math.floor(15 / linesPerSentence) || 1;
    } else {
      return Math.floor(10 / linesPerSentence) || 1;
    }
  }, [config]);


  return (
    <div
      id={id}
      className={cn(
        "bg-white text-black font-body p-[1.5cm]",
        isPreview
          ? "aspect-[210/297] w-full shadow-lg"
          : "w-[210mm] h-[297mm]"
      )}
    >
      <div className="h-full flex flex-col">
        <header className="text-center mb-6">
          <h2 className="text-4xl font-bold font-display">받아쓰기 시험</h2>
          <div className="flex justify-between items-end mt-4 text-lg">
            <span>{currentDate}</span>
            <span>이름: ______________</span>
          </div>
        </header>
        <main className="flex-1 space-y-4">
          {sentences.map((sentence, index) => {
            const sentenceNumber = (pageNumber - 1) * sentencesPerPage + index + 1;
            if (config.type === "grid") {
              return (
                <GridSentence
                  key={`${sentence}-${index}`}
                  sentence={sentence}
                  config={config}
                  sentenceNumber={sentenceNumber}
                />
              );
            }
            return (
              <UnderlineSentence
                key={`${sentence}-${index}`}
                sentence={sentence}
                config={config}
                sentenceNumber={sentenceNumber}
              />
            );
          })}
        </main>
        <footer className="text-center text-sm">
          - {pageNumber} / {totalPages} -
        </footer>
      </div>
    </div>
  );
}
