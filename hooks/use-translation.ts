"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/constants/language";

let rewriterPromise: Promise<Rewriter> | null = null;
let translatorPromise: Promise<Translator> | null = null;
let proofreaderPromise: Promise<Proofreader | null> | null = null;

async function createProofreader(
  sourceLanguage: Language
): Promise<Proofreader | null> {
  const availability =
    "Proofreader" in self
      ? await Proofreader.availability({
          expectedInputLanguages: [sourceLanguage],
        })
      : "unavailable";

  if (availability === "available" || availability === "downloadable") {
    return await Proofreader.create({
      expectedInputLanguages: [sourceLanguage],
    });
  }

  // Proofreader not available for this language, return null
  return null;
}

async function proofread(
  proofreader: Proofreader | null,
  text: string
): Promise<string> {
  if (!proofreader) {
    return text;
  }
  const { correctedInput } = await proofreader.proofread(text);
  return correctedInput;
}

export type TranslatedResult = {
  result: SpeechRecognitionAlternative;
  fianalizedAt: Date;
  endMs: number;
  startMs: number;
  punctuated?: string;
  translated?: string;
};

export function useTranslation<T extends TranslatedResult>({
  sourceLanguage,
  targetLanguage,
  finalResults,
}: {
  sourceLanguage: Language;
  targetLanguage: Language;
  finalResults: T[];
}) {
  const [processedIndex, setProcessedIndex] = useState(-1);
  const [translatedResults, setTranslatedResults] = useState<
    (T & { punctuated?: string; translated?: string })[]
  >([]);

  useEffect(() => {
    const newResults = finalResults.slice(processedIndex + 1);
    if (newResults.length === 0) return;

    rewriterPromise ??= Rewriter.create({});
    translatorPromise ??= Translator.create({
      sourceLanguage: sourceLanguage.split("-")[0],
      targetLanguage: targetLanguage.split("-")[0],
    });
    proofreaderPromise ??= createProofreader(sourceLanguage);
    setTranslatedResults((prev) => [
      ...prev.slice(0, processedIndex + 1),
      newResults[0],
    ]);
    Promise.all([translatorPromise, rewriterPromise, proofreaderPromise]).then(
      async ([translator, rewriter, proofreader]) => {
        const correctedInput = await proofread(
          proofreader,
          newResults[0].result.transcript
        );

        // rewriteしてから翻訳をかけたほうが自然な翻訳になるが速度がネック...
        // 軽く比較検証をしてみたが、rewriterなしでは使い物にならないので無くすのではなく速度改善する方向で進めたい
        const rewritten = await rewriter.rewrite(correctedInput);
        const translated = await translator.translate(rewritten);
        setTranslatedResults((prev) => [
          ...prev.slice(0, processedIndex + 1),
          { ...newResults[0], punctuated: correctedInput, translated },
        ]);
        setProcessedIndex((prev) => prev + 1);
      }
    );
  }, [finalResults, sourceLanguage, targetLanguage, processedIndex]);

  return {
    translatedResults,
  };
}
