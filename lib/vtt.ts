"use client";

import { TranslatedResult } from "@/hooks/use-translation";

export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;
  return (
    hours.toString().padStart(2, "0") +
    ":" +
    minutes.toString().padStart(2, "0") +
    ":" +
    seconds.toString().padStart(2, "0") +
    "." +
    milliseconds.toString().padStart(3, "0")
  );
}

export function toVTT(
  translatedResults: TranslatedResult[],
  textField: "punctuated" | "translated"
): string {
  const escapeSpecialCharacters = (() => {
    const textarea = document.createElement("textarea");
    return (text: string) => {
      textarea.textContent = text;
      return textarea.innerHTML;
    };
  })();

  return `WEBVTT\n\n${translatedResults
    .filter((result) => !!result[textField])
    .map(
      (result) =>
        `${formatDuration(result.startMs)} --> ${formatDuration(
          result.endMs
        )}\n${escapeSpecialCharacters(result[textField]!)}`
    )
    .join("\n\n")}`;
}
