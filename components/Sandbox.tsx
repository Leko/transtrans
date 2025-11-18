"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Configuration, { ConfigurationValue } from "./Configuration";
import WebAPIAvailability from "./WebAPIAvailability";
import Duration from "./Duration";
import Translation from "./Translation";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

export default function Sandbox() {
  const endMarkerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<ConfigurationValue>({
    sourceLanguage: "en-US",
    targetLanguage: "ja-JP",
  });
  const { state, interimResults, finalResults, start, stop } =
    useSpeechRecognition({
      lang: config.sourceLanguage,
    });

  const handleChange = (newConfig: ConfigurationValue) => {
    setConfig(newConfig);
  };

  const handleStart = (audioTrack: MediaStreamTrack) => {
    start(audioTrack);
  };

  const handleStop = () => {
    stop();
  };
  useLayoutEffect(() => {
    if (endMarkerRef.current) {
      endMarkerRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [interimResults, finalResults]);

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
          {finalResults.map((result) => (
            <li key={result.result.transcript}>
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
                <span>{result.result.transcript}</span>
              </p>
              <p>
                <Translation
                  text={result.result.transcript}
                  sourceLanguage={config.sourceLanguage}
                  targetLanguage={config.targetLanguage}
                />
              </p>
            </li>
          ))}
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
        <div ref={endMarkerRef}></div>
      </div>
    </div>
  );
}
