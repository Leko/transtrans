"use client";

import { LoaderIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// TODO: 古い文章の確定
// TODO: 一定時間経つとresultsが空配列になる・・・？とにかく結果がまっさらになってしまうのをなんとか状態管理する

function useSpeechRecognition({ lang }: { lang: string }) {
  const [isListening, setIsListening] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [finalSentences, setFinalSentences] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>("");

  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  // @ts-expect-error server componentでのみ起こるエラーでそのためにロジックを汚したくないので無視
  const recognition: SpeechRecognition = SpeechRecognition
    ? new SpeechRecognition()
    : null;

  function onStart() {
    setError(null);
    setIsListening(true);
  }
  function onError(event: SpeechRecognitionErrorEvent) {
    setError(new Error(event.message));
  }
  function onEnd() {
    console.log("onEnd");
    setIsListening(false);
    recognition.start();
  }
  function onResult(event: SpeechRecognitionEvent) {
    const results = Array.from(event.results);
    const stringify = (results: SpeechRecognitionResult[]) =>
      results
        .flatMap((result) =>
          Array.from(result).map((alternative) => alternative.transcript)
        )
        .join(" ");
    setInterimTranscript(
      stringify(results.filter((result) => !result.isFinal))
    );
    setFinalTranscript(stringify(results.filter((result) => result.isFinal)));
  }

  function start(audioTrack: MediaStreamTrack) {
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.addEventListener("start", onStart);
    recognition.addEventListener("result", onResult);
    recognition.addEventListener("error", onError);
    recognition.addEventListener("end", onEnd);
    recognition.start(audioTrack);
  }
  function stop() {
    recognition.removeEventListener("start", onStart);
    recognition.removeEventListener("result", onResult);
    recognition.removeEventListener("error", onError);
    recognition.removeEventListener("end", onEnd);
    recognition.stop();
  }

  useEffect(() => {
    let rewriter;
    console.log("changed:", finalTranscript);
    setIsRewriting(true);
    Rewriter.create({
      outputLanguage: lang.split("-")[0],
      expectedInputLanguages: [lang],
      expectedOutputLanguages: ["en"],
    }).then(
      (r) => {
        rewriter = r;
        rewriter
          .rewrite(finalTranscript, {
            context: [
              `This is a part of a low-accuracy auto-generated translation of a Tech Conference.`,
              `Correct contextually inappropriate words to the correct technical terms or jargon.`,
              `Keep the original words and phrases as much as possible.`,
            ],
          })
          .then((r) => {
            const segmentor = new Intl.Segmenter(lang, {
              granularity: "sentence",
            });
            const sentences = Array.from(segmentor.segment(r))
              .map((s) => s.segment.trim())
              .filter((s) => s.trim() !== "");
            setFinalSentences(sentences);
            console.log("rewritten:", sentences);
          })
          .finally(() => {
            setIsRewriting(false);
          });
      },
      [setIsRewriting, finalTranscript]
    );

    return () => {
      rewriter?.destroy();
    };
  }, [lang, finalTranscript]);

  return {
    isListening,
    isRewriting,
    error,
    interimTranscript,
    finalSentences,
    start,
    stop,
  };
}

function Translation({
  text,
  sourceLanguage,
  targetLanguage,
}: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}) {
  const Translator = typeof window !== "undefined" ? window.Translator : null;
  const [translation, setTranslation] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    Translator.create({
      sourceLanguage: sourceLanguage.split("-")[0],
      targetLanguage: targetLanguage.split("-")[0],
      monitor(m) {
        m.addEventListener("downloadprogress", (e: ProgressEvent) => {
          setProgress(e.loaded);
        });
      },
    })
      .then((t) => t.translate(text))
      .then(setTranslation);
  }, [Translator, text, sourceLanguage, targetLanguage]);

  return <span>{translation}</span>;
}

export default function Sandbox() {
  const sourceLanguage = "en-US";
  const distLanguage = "ja-JP";

  const endMarkerRef = useRef<HTMLDivElement>(null);
  const {
    interimTranscript,
    finalSentences,
    isListening,
    isRewriting,
    error,
    start,
    stop,
  } = useSpeechRecognition({
    lang: sourceLanguage,
  });

  const handleClickStart = () => {
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        const [audioTrack] = stream.getAudioTracks();
        start(audioTrack);
      });
  };
  const handleClickStop = () => {
    stop();
  };

  useLayoutEffect(() => {
    if (endMarkerRef.current) {
      endMarkerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [interimTranscript, finalSentences]);

  return (
    <div>
      {isListening ? (
        <button onClick={handleClickStop}>Stop</button>
      ) : (
        <button onClick={handleClickStart}>Start</button>
      )}
      <ol className="flex flex-col gap-2">
        {finalSentences.length > 0 &&
          finalSentences.map((sentence) => (
            <li key={sentence}>
              <p className="text-gray-400">{sentence}</p>
              <p>
                <Translation
                  text={sentence}
                  sourceLanguage={sourceLanguage}
                  targetLanguage={distLanguage}
                />
              </p>
            </li>
          ))}
        {isRewriting && (
          <li className="text-sm text-gray-400 text-center flex items-center gap-2">
            <Spinner />
            <span>Finalizing...</span>
          </li>
        )}
        {interimTranscript.length > 0 && (
          <li>
            <p className="text-gray-400">{interimTranscript}</p>
            <p>
              <Translation
                text={interimTranscript}
                sourceLanguage={sourceLanguage}
                targetLanguage={distLanguage}
              />
            </p>
          </li>
        )}
      </ol>
      <div ref={endMarkerRef}></div>
    </div>
  );
}

function Spinner() {
  return <LoaderIcon className={`w-4 h-4 animate-spin`} />;
}
