"use client";

import { useState, useEffect } from "react";
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
}: {
  chars: string[];
  isPractice: boolean;
  sentenceNumber?: number;
}) => (
  <div className="flex items-center">
    <div className="w-8 text-center font-bold text-lg">
      {!isPractice && `${sentenceNumber}.`}
    </div>
    <div className="grid grid-cols-11 gap-px border-l border-t border-gray-400 bg-gray-400 flex-1">
      {chars.map((char, i) => (
        <div
          key={i}
          className="aspect-square bg-white flex items-center justify-center text-2xl font-body border-r border-b border-gray-400"
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
      />
      {config.isPracticeActive &&
        Array.from({ length: practiceLinesNum }).map((_, i) => (
          <GridRow
            key={`practice-grid-${i}`}
            chars={Array(11).fill("")}
            isPractice={true}
          />
        ))}
    </div>
  );
};

const UnderlineRow = ({
  text,
  isPractice,
  sentenceNumber,
}: {
  text: string | null;
  isPractice: boolean;
  sentenceNumber?: number;
}) => (
  <div className="flex items-center h-12">
    <div className="w-10 text-center font-bold text-lg">
      {!isPractice && `${sentenceNumber}.`}
    </div>
    <div className="flex-1 border-b-2 border-gray-400 h-full flex items-end pb-1">
      <span className="text-2xl font-body tracking-widest">{text}</span>
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
      />
      {config.isPracticeActive &&
        Array.from({ length: practiceLinesNum }).map((_, i) => (
          <UnderlineRow
            key={`practice-line-${i}`}
            text={null}
            isPractice={true}
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
            const sentenceNumber =
              (pageNumber - 1) *
                Math.floor(
                  config.type === "grid"
                    ? 15
                    : 10 / (1 + (config.isPracticeActive ? (parseInt(config.practiceLines) || 0) : 0))
                ) +
              index +
              1;
            if (config.type === "grid") {
              return (
                <GridSentence
                  key={index}
                  sentence={sentence}
                  config={config}
                  sentenceNumber={index + 1}
                />
              );
            }
            return (
              <UnderlineSentence
                key={index}
                sentence={sentence}
                config={config}
                sentenceNumber={index + 1}
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
