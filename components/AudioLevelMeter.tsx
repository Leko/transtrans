"use client";

import { useEffect, useState, useRef } from "react";

interface AudioLevelMeterProps {
  audioTrack: MediaStreamTrack | null;
}

export default function AudioLevelMeter({ audioTrack }: AudioLevelMeterProps) {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioTrack) return;

    const stream = new MediaStream([audioTrack]);
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.fftSize);

    audioContextRef.current = audioContext;
    microphone.connect(analyser);
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3; // リアルタイム性を重視

    const updateLevel = () => {
      analyser.getByteTimeDomainData(dataArray);

      // RMS (Root Mean Square) を計算
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128; // -1 to 1 に正規化
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      setAudioLevel(Math.min(rms * 2.5, 1)); // 感度調整のために2.5倍、最大1
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    updateLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
      setAudioLevel(0);
    };
  }, [audioTrack]);

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-gray-500">
        <span>Audio Level</span>
      </div>
      <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500"
          style={{ width: `${audioLevel * 100}%` }}
        />
      </div>
    </div>
  );
}
