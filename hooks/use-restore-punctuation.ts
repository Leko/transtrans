"use client";

import { useEffect, useState } from "react";
import { restorePunctuation } from "@/lib/nlp/restore-punctuation";
import { Language } from "@/constants/language";

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

    Promise.all(
      newResults.map((result) =>
        restorePunctuation(result.result.transcript, {
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
