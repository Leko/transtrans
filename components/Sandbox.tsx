"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useRestorePunctuation } from "@/hooks/use-restore-punctuation";
import { useTranslation } from "@/hooks/use-translation";
import Configuration, { ConfigurationValue } from "./Configuration";
import WebAPIAvailability from "./WebAPIAvailability";
import Duration from "./Duration";
import Translation from "./Translation";

export default function Sandbox() {
  const endMarkerRef = useRef<HTMLDivElement>(null);
  const [keepScrollToBottom, setKeepScrollToBottom] = useState(true);
  const [config, setConfig] = useState<ConfigurationValue>({
    sourceLanguage: "en-US",
    targetLanguage: "ja-JP",
  });
  const { state, interimResults, finalResults, start, stop } =
    useSpeechRecognition({
      lang: config.sourceLanguage,
    });
  const { punctuatedResults, isProcessing: isRestoringPunctuation } =
    useRestorePunctuation({
      sourceLanguage: config.sourceLanguage,
      finalResults,
    });
  const { translatedResults, isProcessing: isTranslating } = useTranslation({
    sourceLanguage: config.sourceLanguage,
    targetLanguage: config.targetLanguage,
    punctuatedResults,
  });

  const handleChange = useCallback((newConfig: ConfigurationValue) => {
    setConfig(newConfig);
  }, []);
  const handleStart = useCallback(
    (audioTrack: MediaStreamTrack) => {
      start(audioTrack);
    },
    [start]
  );
  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  useLayoutEffect(() => {
    if (endMarkerRef.current && keepScrollToBottom) {
      endMarkerRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [interimResults, finalResults, keepScrollToBottom]);

  return (
    <div className="h-full min-h-0 flex items-stretch justify-between gap-8 px-8">
      <div className="w-1/4 flex flex-col min-h-0">
        <h2 className="text-lg font-bold mb-2">Configuration</h2>
        <Configuration
          value={config}
          isListening={state.isListening}
          onChange={handleChange}
          onStart={handleStart}
          onStop={handleStop}
        />

        <h2 className="text-lg font-bold mt-4 mb-2">Web APIs Availability</h2>
        <WebAPIAvailability config={config} />
      </div>
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
        <ol className="flex flex-col gap-2">
          {translatedResults.map((result, i) => (
            <li key={i}>
              <p className="text-gray-400 flex flex-col">
                <time
                  dateTime={result.fianalizedAt.toISOString()}
                  className="text-gray-500 flex items-center gap-1"
                >
                  <span className="text-sm">
                    <Duration ms={result.durationMsFromStartedAt} hours />
                  </span>
                  <span className="text-sm">
                    ({result.fianalizedAt.toLocaleTimeString()})
                  </span>
                </time>
                <span>{result.punctuated}</span>
              </p>
              <p>{result.translated}</p>
            </li>
          ))}
          {isRestoringPunctuation && (
            <li key="isRestoringPunctuation">
              <p className="text-gray-400 flex items-center gap-2">
                <LoaderIcon className="w-4 h-4 animate-spin" /> Restoring
                punctuation...
              </p>
            </li>
          )}
          {isTranslating && (
            <li key="isTranslating">
              <p className="text-gray-400 flex items-center gap-2">
                <LoaderIcon className="w-4 h-4 animate-spin" /> Translating...
              </p>
            </li>
          )}
          {interimResults.map((result) => (
            <li key={result[0].transcript}>
              <p className="text-gray-400">{result[0].transcript}</p>
              <p>
                <Translation
                  text={result[0].transcript}
                  sourceLanguage={config.sourceLanguage}
                  targetLanguage={config.targetLanguage}
                  appendBuffer
                />
              </p>
            </li>
          ))}
        </ol>
        {!state.isListening && (
          <div className="flex flex-col items-center justify-center max-w-xl mx-auto">
            <h2>
              <span className="text-xl font-bold">TransTrans</span> - Live
              Transcription and Translation
            </h2>

            <h3 className="text-lg font-bold mt-4">How to start:</h3>
            <ol className="list-decimal list-inside">
              <li>Choose Source Language</li>
              <li>Choose Target Language</li>
              <li>Choose Audio Source</li>
              <li>Click the start button</li>
            </ol>

            <h3 className="text-lg font-bold mt-4">How it works:</h3>
            <p>
              TransTrans uses the Web Speech Recognition API to transcribe your
              speech in real-time. It then uses the Translation API to translate
              the transcription into the target language.
            </p>
          </div>
        )}
        <div ref={endMarkerRef} className="flex justify-center gap-2">
          <label className="flex items-center gap-2 text-gray-400">
            <input
              type="checkbox"
              checked={keepScrollToBottom}
              onChange={(e) => setKeepScrollToBottom(e.target.checked)}
            />
            Keep scroll to bottom
          </label>
        </div>
      </div>
    </div>
  );
}
