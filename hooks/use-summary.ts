"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/constants/language";

let summarizerPromise: Promise<Summarizer> | null = null;
let translatorPromise: Promise<Translator> | null = null;

export function useSummary<
  T extends {
    result: SpeechRecognitionAlternative;
    fianalizedAt: Date;
    durationMsFromStartedAt: number;
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
      .then(([summarizer, translator]) =>
        summarizer
          .summarize(
            finalResults
              .filter((r) => !!r.punctuated)
              .map((r) => r.punctuated)
              .join("\n"),
            { signal: abortController.signal }
          )
          .then((summary) =>
            Promise.all(
              summary
                .split("\n")
                .map((s) =>
                  translator.translate(s, { signal: abortController.signal })
                )
            )
          )
          .then((summary) => summary.join("\n"))
      )
      .then(setSummary)
      .catch((e) => {
        if (e.name === "AbortError") return;
        throw e;
      });

    return () => {
      abortController.abort();
    };
  }, [finalResults, config]);

  return { summary };
}
