"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/constants/language";

let summarizerPromise: Promise<Summarizer> | null = null;
let translatorPromise: Promise<Translator> | null = null;

export async function takeUntilQuota(
  texts: string[],
  summarizer: {
    inputQuota: number;
    measureInputUsage: (
      text: string,
      options?: { signal?: AbortSignal }
    ) => Promise<number>;
  },
  options?: { signal?: AbortSignal }
): Promise<{ selectedTexts: string[]; totalUsage: number }> {
  const quota = summarizer.inputQuota;
  let totalUsage = 0;
  const selectedTexts: string[] = [];

  // 最新から逆順に処理
  for (let i = texts.length - 1; i >= 0; i--) {
    const text = texts[i];
    const usage = await summarizer.measureInputUsage(text, options);

    if (totalUsage + usage > quota) {
      break;
    }

    totalUsage += usage;
    selectedTexts.unshift(text);
  }

  return { selectedTexts, totalUsage };
}

export function useSummary<
  T extends {
    result: SpeechRecognitionAlternative;
    fianalizedAt: Date;
    startMs: number;
    endMs: number;
    punctuated?: string;
    translated?: string;
  }
>({
  finalResults,
  config,
}: {
  finalResults: T[];
  config: {
    sourceLanguage: Language;
    targetLanguage: Language;
  };
}) {
  const [inputQuota, setInputQuota] = useState<number>(0);
  const [inputUsage, setInputUsage] = useState<number>(0);
  const [summary, setSummary] = useState<string>(
    "Summary of the transcription here..."
  );

  useEffect(() => {
    if (finalResults.length <= 1) return;

    const abortController = new AbortController();
    summarizerPromise ??= Summarizer.create({
      type: "key-points",
      format: "markdown",
      length: "long",
    });
    translatorPromise ??= Translator.create({
      sourceLanguage: config.sourceLanguage.split("-")[0],
      targetLanguage: config.targetLanguage.split("-")[0],
    });
    Promise.all([summarizerPromise, translatorPromise])
      .then(async ([summarizer, translator]) => {
        setInputQuota(summarizer.inputQuota);

        const punctuatedTexts = finalResults
          .filter((r) => !!r.punctuated)
          .map((r) => r.punctuated as string);

        const { selectedTexts, totalUsage } = await takeUntilQuota(
          punctuatedTexts,
          summarizer,
          { signal: abortController.signal }
        );
        setInputUsage(totalUsage);
        if (selectedTexts.length === 0) {
          return "No text available for summarization";
        }

        const textToSummarize = selectedTexts.join("\n");

        return summarizer
          .summarize(textToSummarize, { signal: abortController.signal })
          .then((summary) =>
            Promise.all(
              summary
                .split("\n")
                .map((s) =>
                  translator.translate(s, { signal: abortController.signal })
                )
            )
          )
          .then((summary) => summary.join("\n").replaceAll(/\* ?/g, "* "));
      })
      .then(setSummary)
      .catch((e) => {
        if (e.name === "AbortError") return;
        throw e;
      });

    return () => {
      abortController.abort();
    };
  }, [finalResults, config]);

  return { summary, inputQuota, inputUsage };
}
