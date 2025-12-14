"use client";

import { ConfigurationValue } from "@/components/Configuration";
import { useEffect, useState } from "react";

type Availability =
  | { status: "initializing" }
  | { status: "available" }
  | { status: "downloadable" }
  | { status: "downloading"; progress: ProgressEvent }
  | { status: "unavailable"; error: string };

export type FeatureAvailability = {
  name: (typeof features)[number]["name"];
  required: boolean;
} & Availability;

const features = [
  {
    name: "Speech Recognition",
    required: true,
    compatibilityUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#browser_compatibility",
    async init(config) {
      // @ts-expect-error https://developer.mozilla.org/ja/docs/Web/API/SpeechRecognition/available_static
      return await SpeechRecognition.available({
        langs: [config.sourceLanguage],
      });
    },
    async download(config, onProgress) {
      onProgress(
        new ProgressEvent("download", {
          lengthComputable: true,
          loaded: 0,
          total: 100,
        })
      );
      // @ts-expect-error https://developer.mozilla.org/ja/docs/Web/API/SpeechRecognition/install_static
      await SpeechRecognition.install({
        langs: [config.sourceLanguage],
        processLocally: true,
      });
      onProgress(
        new ProgressEvent("download", {
          lengthComputable: true,
          loaded: 100,
          total: 100,
        })
      );
    },
  },
  {
    name: "Rewriter",
    required: true,
    compatibilityUrl:
      "https://github.com/webmachinelearning/writing-assistance-apis",
    async init() {
      return "Rewriter" in self ? await Rewriter.availability() : "unavailable";
    },
    async download(config, onProgress) {
      const translator = await Rewriter.create({
        monitor(m) {
          m.addEventListener("downloadprogress", onProgress);
        },
      });
      await translator.destroy();
    },
  },
  {
    name: "Translator",
    required: true,
    compatibilityUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Translator#browser_compatibility",
    async init(config) {
      return "Translator" in self
        ? await Translator.availability({
            sourceLanguage: config.sourceLanguage,
            targetLanguage: config.targetLanguage,
          })
        : "unavailable";
    },
    async download(config, onProgress) {
      const translator = await Translator.create({
        sourceLanguage: config.sourceLanguage,
        targetLanguage: config.targetLanguage,
        monitor(m) {
          m.addEventListener("downloadprogress", onProgress);
        },
      });
      await translator.destroy();
    },
  },
  {
    name: "Proofreader",
    required: false,
    compatibilityUrl:
      "https://github.com/webmachinelearning/writing-assistance-apis",
    async init(config) {
      return "Proofreader" in self
        ? await Proofreader.availability({
            expectedInputLanguages: [config.sourceLanguage],
          })
        : "unavailable";
    },
    async download(config, onProgress) {
      const proofreader = await Proofreader.create({
        expectedInputLanguages: [config.sourceLanguage],
        monitor(m) {
          m.addEventListener("downloadprogress", onProgress);
        },
      });
      await proofreader.destroy();
    },
  },
  {
    name: "Summarizer",
    required: true,
    compatibilityUrl:
      "https://developer.mozilla.org/en-US/docs/Web/API/Summarizer#browser_compatibility",
    async init() {
      return "Summarizer" in self
        ? await Summarizer.availability({})
        : "unavailable";
    },
    async download(config, onProgress) {
      const proofreader = await Summarizer.create({
        monitor(m) {
          m.addEventListener("downloadprogress", onProgress);
        },
      });
      await proofreader.destroy();
    },
  },
] as const satisfies {
  name: string;
  required: boolean;
  compatibilityUrl: string;
  init: (config: ConfigurationValue) => Promise<Availability["status"]>;
  download: (
    config: ConfigurationValue,
    onProgress: (progress: ProgressEvent) => void
  ) => Promise<void>;
}[];

export function useAPIAvailability(config: ConfigurationValue) {
  const [availabilities, setAvailabilities] = useState<FeatureAvailability[]>(
    features.map((feature) => ({
      name: feature.name,
      required: feature.required,
      status: "initializing",
    }))
  );

  function download(featureName: (typeof features)[number]["name"]) {
    const feature = features.find((feature) => feature.name === featureName);
    if (!feature) {
      throw new Error(`Feature ${featureName} not found`);
    }
    return feature
      .download(config, (progress: ProgressEvent) => {
        setAvailabilities((prev) =>
          prev.map((availability) =>
            availability.name === feature.name
              ? { ...availability, status: "downloading", progress }
              : availability
          )
        );
      })
      .then(() => {
        setAvailabilities((prev) =>
          prev.map((availability) =>
            availability.name === feature.name
              ? { ...availability, status: "available" }
              : availability
          )
        );
      })
      .catch((error) => {
        setAvailabilities((prev) =>
          prev.map((availability) =>
            availability.name === feature.name
              ? { ...availability, status: "unavailable", error: error.message }
              : availability
          )
        );
      });
  }

  useEffect(() => {
    Promise.allSettled(features.map((feature) => feature.init(config))).then(
      (results) => {
        setAvailabilities(
          results.map((result, index) => {
            const status =
              result.status === "fulfilled" ? result.value : "unavailable";
            let error: string | null = null;
            if (result.status === "rejected") {
              error =
                result.reason instanceof Error
                  ? result.reason.message
                  : String(result.reason);
            } else if (status === "unavailable") {
              error = `${features[index].name} API is not available in this browser`;
            }
            return {
              name: features[index].name,
              required: features[index].required,
              status,
              error,
            };
          })
        );
      }
    );
  }, [config]);

  return { availabilities, download };
}
