"use client";

import * as Comlink from "comlink";
import { useEffect, useState } from "react";
import type { Language } from "@/constants/language";
import type { RemoteAPI } from "@/lib/nlp/restore-punctuation";

let worker: Comlink.Remote<RemoteAPI>;

export function useRestorePunctuation<
  T extends {
    result: SpeechRecognitionAlternative;
    fianalizedAt: Date;
    durationMsFromStartedAt: number;
  }
>({
  sourceLanguage,
  finalResults,
}: {
  sourceLanguage: Language;
  finalResults: T[];
}) {
  const [processedIndex, setProcessedIndex] = useState(-1);
  const [punctuatedResults, setPunctuatedResults] = useState<
    (T & { punctuated: string })[]
  >([]);

  useEffect(() => {
    const newResults = finalResults.slice(processedIndex + 1);
    if (newResults.length === 0) return;

    worker ??= Comlink.wrap<RemoteAPI>(
      new Worker(new URL("@/lib/nlp/restore-punctuation.ts", import.meta.url))
    );
    Promise.all(
      newResults.map((result) =>
        worker.restorePunctuation(result.result.transcript, {
          sourceLanguage,
        })
      )
    ).then((results) => {
      setPunctuatedResults((prev) => [
        ...prev,
        ...results.map((result, index) => ({
          ...finalResults[processedIndex + index + 1],
          punctuated: result,
        })),
      ]);
      setProcessedIndex(finalResults.length - 1);
    });
  }, [finalResults, sourceLanguage, processedIndex]);

  return {
    punctuatedResults,
    isProcessing: processedIndex + 1 !== finalResults.length,
  };
}
