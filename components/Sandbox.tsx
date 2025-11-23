"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { DownloadIcon, LoaderIcon } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useTranslation } from "@/hooks/use-translation";
import { useSummary } from "@/hooks/use-summary";
import Configuration, { ConfigurationValue } from "./Configuration";
import WebAPIAvailability, {
  AvailableIcon,
  DownloadableIcon,
  DownloadingIcon,
  InitializingIcon,
  UnavailableIcon,
} from "./WebAPIAvailability";
import Duration from "./Duration";
import Translation from "./Translation";
import Chat from "./Chat";
import Onboarding from "./Onboarding";
import { useAPIAvailability } from "@/hooks/api-availability";
import { IconButton } from "@radix-ui/themes";
import { toVTT } from "@/lib/vtt";
import { downloadAsFile } from "@/lib/download";

export default function Sandbox() {
  const endMarkerRef = useRef<HTMLDivElement>(null);
  const [keepScrollToBottom, setKeepScrollToBottom] = useState(true);
  const [config, setConfig] = useState<ConfigurationValue>({
    sourceLanguage: "en-US",
    targetLanguage: "ja-JP",
  });
  const { availabilities, download } = useAPIAvailability(config);
  const { state, interimResults, finalResults, start, stop } =
    useSpeechRecognition({
      lang: config.sourceLanguage,
    });
  const { translatedResults } = useTranslation({
    sourceLanguage: config.sourceLanguage,
    targetLanguage: config.targetLanguage,
    finalResults,
  });
  const { summary, inputQuota, inputUsage } = useSummary({
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

  const handleDownloadTranslated = useCallback(() => {
    const blob = new Blob([toVTT(translatedResults, "translated")], {
      type: "text/vtt",
    });
    downloadAsFile(blob, "translated.vtt");
  }, [translatedResults]);

  const handleDownloadTranscript = useCallback(() => {
    const blob = new Blob([toVTT(translatedResults, "punctuated")], {
      type: "text/vtt",
    });
    downloadAsFile(blob, "transcript.vtt");
  }, [translatedResults]);

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

        <details open className="mt-4 mb-2">
          <summary>
            <h2 className="text-lg font-bold inline-flex items-center gap-2">
              <span>
                {availabilities.some((a) => a.status === "initializing") ? (
                  <InitializingIcon size={6} />
                ) : availabilities.some((a) => a.status === "downloading") ? (
                  <DownloadingIcon size={6} />
                ) : availabilities.some((a) => a.status === "unavailable") ? (
                  <UnavailableIcon size={6} />
                ) : availabilities.some((a) => a.status === "downloadable") ? (
                  <DownloadableIcon size={6} />
                ) : (
                  <AvailableIcon size={6} />
                )}
              </span>
              <span>Web APIs Availability</span>
            </h2>
          </summary>
          <WebAPIAvailability
            availabilities={availabilities}
            onRequestDownload={download}
          />
        </details>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
          {translatedResults.length > 0 && (
            // FIXME: pr-2がないとボタンがはみ出て横スクロールしてしまう
            <div className="flex justify-end pr-2">
              <div className="relative group">
                <IconButton variant="ghost">
                  <DownloadIcon className="size-6 text-white" />
                </IconButton>
                <div className="absolute right-0 top-full hidden group-hover:block bg-zinc-800 border border-gray-700 rounded-md p-1 shadow-lg min-w-[240px] z-50">
                  <button
                    onClick={handleDownloadTranscript}
                    className="w-full text-left px-3 py-2 text-sm text-gray-100 hover:bg-zinc-700 rounded-sm"
                  >
                    Download transcript (VTT)
                  </button>
                  <button
                    onClick={handleDownloadTranslated}
                    className="w-full text-left px-3 py-2 text-sm text-gray-100 hover:bg-zinc-700 rounded-sm"
                  >
                    Download translated (VTT)
                  </button>
                </div>
              </div>
            </div>
          )}
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
                    <span className="text-sm inline-flex items-center gap-1">
                      <Duration ms={result.startMs} />
                      <span>-</span>
                      <Duration ms={result.endMs} />
                    </span>
                  </time>
                  {result.punctuated ? (
                    <span>{result.punctuated}</span>
                  ) : (
                    <span className="text-gray-500">
                      {result.result.transcript}
                    </span>
                  )}
                </p>
                <p>
                  {result.translated ? (
                    <span>{result.translated}</span>
                  ) : (
                    <span className="text-gray-500">
                      <Translation
                        text={result.result.transcript}
                        sourceLanguage={config.sourceLanguage}
                        targetLanguage={config.targetLanguage}
                      />
                    </span>
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
          {!state.isListening && finalResults.length === 0 && (
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
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>Key Points:</span>
            <span className="text-gray-500 text-sm">
              ({inputUsage || "?"} / {inputQuota || "?"} tokens used. When
              reaching the quota, the summary will be truncated)
            </span>
          </h3>
          <pre className="whitespace-pre-wrap min-h-[7em]">{summary}</pre>
        </div>
      </div>
      {process.env.NODE_ENV === "development" && <Chat />}
    </div>
  );
}
