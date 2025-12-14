"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useSpeechRecognition({
  lang,
  minConfidence = 0,
}: {
  lang: string;
  minConfidence?: number;
}) {
  const [state, setState] = useState<
    | {
        isListening: true;
        startedAt: Date;
        error: null;
      }
    | {
        isListening: false;
        startedAt: null;
        error: Error;
      }
    | {
        isListening: false;
        startedAt: null;
        error: null;
      }
  >({
    isListening: false,
    error: null,
    startedAt: null,
  });
  const [finalResults, setFinalResults] = useState<
    {
      result: SpeechRecognitionAlternative;
      fianalizedAt: Date;
      endMs: number;
      startMs: number;
    }[]
  >([]);
  const [interimResults, setInterimResults] = useState<
    SpeechRecognitionResult[]
  >([]);

  const shouldContinueRef = useRef(false);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  // @ts-expect-error server componentでのみ起こるエラーでそのためにロジックを汚したくないので無視
  const recognition: SpeechRecognition = useMemo(() => {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    // @ts-expect-error maxAlternatives exists but missing from @types/dom-speech-recognition
    rec.maxAlternatives = 1;
    return rec;
  }, [SpeechRecognition, lang]);

  const onStart = useCallback(() => {
    setState({
      isListening: true,
      startedAt: new Date(),
      error: null,
    });
  }, []);
  const onError = useCallback((event: SpeechRecognitionErrorEvent) => {
    setState({
      isListening: false,
      startedAt: null,
      error: new Error(event.message),
    });
  }, []);
  const onEnd = useCallback(() => {
    setState({
      isListening: false,
      startedAt: null,
      error: null,
    });
    if (shouldContinueRef.current && audioTrackRef.current) {
      recognition.start(audioTrackRef.current);
    }
  }, [recognition]);
  const onResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      const interimResults = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const confidence = result[0].confidence;

        if (result.isFinal) {
          setFinalResults((prev) => [
            ...prev,
            {
              result: result[0],
              fianalizedAt: new Date(),
              endMs: Date.now() - state.startedAt!.getTime(),
              startMs: prev.length > 0 ? prev[prev.length - 1].endMs : 0,
            },
          ]);
        } else if (confidence >= minConfidence) {
          interimResults.push(result);
        }
      }
      setInterimResults(interimResults);
    },
    [state, minConfidence]
  );

  const start = useCallback(
    (audioTrack: MediaStreamTrack) => {
      audioTrackRef.current = audioTrack;
      shouldContinueRef.current = true;
      recognition.start(audioTrack);
    },
    [recognition]
  );
  const stop = useCallback(() => {
    shouldContinueRef.current = false;
    audioTrackRef.current = null;
    recognition.abort();
    setState({
      isListening: false,
      startedAt: null,
      error: null,
    });
  }, [recognition]);

  useEffect(() => {
    recognition.addEventListener("start", onStart);
    recognition.addEventListener("result", onResult);
    recognition.addEventListener("error", onError);
    recognition.addEventListener("end", onEnd);

    return () => {
      recognition.removeEventListener("start", onStart);
      recognition.removeEventListener("result", onResult);
      recognition.removeEventListener("error", onError);
      recognition.removeEventListener("end", onEnd);
    };
  }, [recognition, onStart, onError, onEnd, onResult]);

  return {
    state,
    interimResults,
    finalResults,
    start,
    stop,
  };
}
