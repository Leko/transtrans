"use client";

import { useEffect, useState } from "react";
import { Language } from "@/constants/language";

const Rewriter = typeof window !== "undefined" ? window.Rewriter : null;
let rewriterPromise: Promise<typeof Rewriter> | null = null;
const Translator = typeof window !== "undefined" ? window.Translator : null;
let translatorPromise: Promise<typeof Translator> | null = null;

export function useTranslation<
  T extends {
    result: SpeechRecognitionAlternative;
    fianalizedAt: Date;
    durationMsFromStartedAt: number;
    punctuated: string;
  }
>({
  sourceLanguage,
  targetLanguage,
  punctuatedResults,
}: {
  sourceLanguage: Language;
  targetLanguage: Language;
  punctuatedResults: T[];
}) {
  const [processedIndex, setProcessedIndex] = useState(-1);
  const [translatedResults, setTranslatedResults] = useState<
    (T & { translated: string })[]
  >([]);

  useEffect(() => {
    const newResults = punctuatedResults.slice(processedIndex + 1);
    if (newResults.length === 0) return;

    rewriterPromise ??= Rewriter.create({});
    translatorPromise ??= Translator.create({
      sourceLanguage: sourceLanguage.split("-")[0],
      targetLanguage: targetLanguage.split("-")[0],
    });
    Promise.all([translatorPromise, rewriterPromise])
      .then(([translator, rewriter]) =>
        Promise.all(
          newResults.map(async (result) =>
            translator.translate(
              // rewriteしてから翻訳をかけたほうが自然な翻訳になるが速度がネック...
              // 軽く比較検証をしてみたが、rewriterなしでは使い物にならないので無くすのではなく速度改善する方向で進める
              await rewriter.rewrite(result.punctuated)
            )
          )
        )
      )
      .then((results) => {
        setTranslatedResults((prev) => [
          ...prev,
          ...results.map((result, index) => ({
            ...punctuatedResults[processedIndex + index + 1],
            translated: result,
          })),
        ]);
        setProcessedIndex(punctuatedResults.length - 1);
      });
  }, [punctuatedResults, sourceLanguage, targetLanguage, processedIndex]);

  return {
    translatedResults,
    isProcessing: processedIndex + 1 !== punctuatedResults.length,
  };
}
