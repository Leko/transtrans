import * as Comlink from "comlink";
import { Language } from "@/constants/language";
import {
  pipeline,
  TokenClassificationOutput,
  TokenClassificationPipeline,
  TokenClassificationSingle,
  type ProgressCallback,
} from "@huggingface/transformers";

let classifier: TokenClassificationPipeline;

export const ucFirst = (str: string) => {
  const iterator = str[Symbol.iterator]();
  const first = iterator.next().value;
  return first ? first.toLocaleUpperCase() + str.slice(first.length) : str;
};

export function splitIntoWords(text: string, sourceLanguage: Language) {
  const segmentor = new Intl.Segmenter(sourceLanguage, { granularity: "word" });
  return Array.from(segmentor.segment(text))
    .filter((segment) => segment.isWordLike)
    .map((segment) => segment.segment);
}

const api = {
  async downloadModel(onProgress: ProgressCallback) {
    // @ts-expect-error Expression produces a union type that is too complex to represent.ts(2590)
    classifier ??= await pipeline(
      "token-classification",
      "ldenoue/distilbert-base-re-punctuate",
      { progress_callback: onProgress }
    );
  },

  async restorePunctuation(
    text: string,
    { sourceLanguage }: { sourceLanguage: Language }
  ) {
    if (!classifier) {
      classifier = await pipeline(
        "token-classification",
        "ldenoue/distilbert-base-re-punctuate",
        {}
      );
    }
    const results = await classifier(splitIntoWords(text, sourceLanguage));

    const punctuated = results
      .map((s) =>
        (s as TokenClassificationOutput)
          .map((c: TokenClassificationSingle) => {
            const word = c.word.startsWith("##") ? c.word.slice(2) : c.word;
            const suffix =
              !c.entity.endsWith("_") && c.entity.at(-1) !== c.word.at(-1)
                ? c.entity.at(-1)
                : "";
            if (c.entity.startsWith("Upper")) {
              return ucFirst(word) + suffix;
            } else if (c.entity.startsWith("UPPER")) {
              return word.toUpperCase() + suffix;
            } else {
              return word + suffix;
            }
          })
          .join("")
      )
      .join(" ");

    return punctuated;
  },
};

export type RemoteAPI = typeof api;

Comlink.expose(api);
