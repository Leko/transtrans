"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// TODO: 古い文章の確定
// TODO: 一定時間経つとresultsが空配列になる・・・？とにかく結果がまっさらになってしまうのをなんとか状態管理する

export function useSpeechRecognition({ lang }: { lang: string }) {
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
      durationMsFromStartedAt: number;
    }[]
  >([]);
  const [interimResults, setInterimResults] = useState<
    SpeechRecognitionResult[]
  >([]);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  // @ts-expect-error server componentでのみ起こるエラーでそのためにロジックを汚したくないので無視
  const recognition: SpeechRecognition = useMemo(() => {
    return SpeechRecognition ? new SpeechRecognition() : null;
  }, [SpeechRecognition]);

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
    recognition.start();
  }, [recognition]);
  const onResult = useCallback(
    (event: SpeechRecognitionEvent) => {
      const interimResults = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setFinalResults((prev) => [
            ...prev,
            {
              result: event.results[i][0],
              fianalizedAt: new Date(),
              durationMsFromStartedAt: Date.now() - state.startedAt!.getTime(),
            },
          ]);
        } else {
          interimResults.push(event.results[i]);
        }
      }
      setInterimResults(interimResults);
    },
    [state]
  );

  const start = useCallback(
    (audioTrack: MediaStreamTrack) => {
      recognition.start(audioTrack);
    },
    [recognition]
  );
  const stop = useCallback(() => {
    recognition.abort();
    setState({
      isListening: false,
      startedAt: null,
      error: null,
    });
  }, [recognition]);

  useEffect(() => {
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

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
  }, [recognition, lang, onStart, onError, onEnd, onResult]);

  return {
    state,
    interimResults,
    finalResults,
    start,
    stop,
  };
}
