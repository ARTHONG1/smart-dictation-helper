"use client";

import { cn } from "@/lib/utils";

type WorksheetType = "grid" | "underline";

interface WorksheetConfig {
  type: WorksheetType;
  isPracticeActive: boolean;
  practiceLines: number;
}

interface WorksheetPageProps {
  id: string;
  sentences: string[];
  pageNumber: number;
  totalPages: number;
  config: WorksheetConfig;
  isPreview?: boolean;
}

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

  const renderGridRow = (chars: string[], isPractice: boolean) => (
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

  return (
    <div className="space-y-1">
      {renderGridRow(characters, false)}
      {config.isPracticeActive &&
        Array.from({ length: config.practiceLines }).map((_, i) =>
          renderGridRow(Array(11).fill(""), true)
        )}
    </div>
  );
};

const UnderlineSentence = ({
  sentence,
  config,
  sentenceNumber,
}: {
  sentence: string;
  config: WorksheetConfig;
  sentenceNumber: number;
}) => {
  const renderLine = (text: string | null, isPractice: boolean) => (
    <div className="flex items-center h-12">
      <div className="w-10 text-center font-bold text-lg">
        {!isPractice && `${sentenceNumber}.`}
      </div>
      <div className="flex-1 border-b-2 border-gray-400 h-full flex items-end pb-1">
        <span className="text-2xl font-body tracking-widest">{text}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-1">
      {renderLine(sentence, false)}
      {config.isPracticeActive &&
        Array.from({ length: config.practiceLines }).map((_, i) =>
          renderLine(null, true)
        )}
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
            <span>{new Date().toLocaleDateString("ko-KR")}</span>
            <span>이름: ______________</span>
          </div>
        </header>
        <main className="flex-1 space-y-4">
          {sentences.map((sentence, index) => {
             const sentenceNumber = (pageNumber - 1) * (Math.floor(config.type === 'grid' ? 15 : 10 / (1 + (config.isPracticeActive ? config.practiceLines : 0)))) + index + 1;
             if (config.type === "grid") {
              return <GridSentence key={index} sentence={sentence} config={config} sentenceNumber={index+1}/>
             }
             return <UnderlineSentence key={index} sentence={sentence} config={config} sentenceNumber={index+1}/>
          })}
        </main>
        <footer className="text-center text-sm">
          - {pageNumber} / {totalPages} -
        </footer>
      </div>
    </div>
  );
}
