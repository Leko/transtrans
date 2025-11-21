"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useTranslation } from "@/hooks/use-translation";
import { useSummary } from "@/hooks/use-summary";
import Configuration, { ConfigurationValue } from "./Configuration";
import WebAPIAvailability from "./WebAPIAvailability";
import Duration from "./Duration";
import Translation from "./Translation";
import Chat from "./Chat";
import Onboarding from "./Onboarding";

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
  const { translatedResults } = useTranslation({
    sourceLanguage: config.sourceLanguage,
    targetLanguage: config.targetLanguage,
    finalResults,
  });
  const { summary } = useSummary({
    finalResults: translatedResults,
    config,
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
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
          <ol className="flex flex-col gap-2">
            {translatedResults.map((result, i) => (
              <li key={i}>
                <p className="text-gray-400 flex flex-col">
                  <time
                    dateTime={result.fianalizedAt.toISOString()}
                    className="text-gray-500 flex items-center gap-1"
                  >
                    {!result.punctuated && !result.translated && (
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                    )}
                    <span className="text-sm">
                      <Duration ms={result.durationMsFromStartedAt} hours />
                    </span>
                    <span className="text-sm">
                      ({result.fianalizedAt.toLocaleTimeString()})
                    </span>
                  </time>
                  {result.punctuated ? (
                    <span>{result.punctuated}</span>
                  ) : (
                    <span className="text-gray-400">
                      {result.result.transcript}
                    </span>
                  )}
                </p>
                <p>
                  {result.translated ? (
                    <span>{result.translated}</span>
                  ) : (
                    <Translation
                      text={result.result.transcript}
                      sourceLanguage={config.sourceLanguage}
                      targetLanguage={config.targetLanguage}
                    />
                  )}
                </p>
              </li>
            ))}
            {interimResults.map((result) => (
              <li key={result[0].transcript}>
                <p className="text-gray-400">{result[0].transcript}</p>
                <p>
                  <span className="inline-block min-h-[8em]">
                    {/* &nbsp; necessary to prevent the scroll flickering */}
                    <Translation
                      text={result[0].transcript}
                      sourceLanguage={config.sourceLanguage}
                      targetLanguage={config.targetLanguage}
                    />
                    &nbsp;
                  </span>
                </p>
              </li>
            ))}
          </ol>
          {!state.isListening && (
            <div className="max-w-xl mx-auto">
              <Onboarding />
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
        <div className="pt-4 border-t border-gray-600">
          <h3 className="text-lg font-bold">Key Points:</h3>
          <pre className="whitespace-pre-wrap min-h-[7em]">{summary}</pre>
        </div>
      </div>
      <Chat />
    </div>
  );
}
