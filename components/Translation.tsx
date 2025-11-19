"use client";

import { useEffect, useState } from "react";

// @ts-expect-error Translator is not a standard API yet
const Translator = typeof window !== "undefined" ? window.Translator : null;
let cache: Promise<typeof Translator> | null = null;

export default function Translation({
  text,
  sourceLanguage,
  targetLanguage,
  appendBuffer = false,
}: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  appendBuffer?: boolean;
}) {
  const [translation, setTranslation] = useState<string>("");

  useEffect(() => {
    if (!cache) {
      cache = Translator.create({
        sourceLanguage: sourceLanguage.split("-")[0],
        targetLanguage: targetLanguage.split("-")[0],
      });
    }
    cache!.then((t) => t.translate(text)).then(setTranslation);
  }, [text, sourceLanguage, targetLanguage]);

  return (
    <span
      className="inline-block"
      style={{ minHeight: appendBuffer ? "8em" : "auto" }}
    >
      {/* &nbsp; necessary to prevent the scroll flickering */}
      {translation}&nbsp;
    </span>
  );
}
