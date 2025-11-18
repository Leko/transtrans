"use client";

import { ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { LANGUAGE_OPTIONS, type Language } from "@/constants/language";
import AudioLevelMeter from "./AudioLevelMeter";

export interface ConfigurationValue {
  sourceLanguage: Language;
  targetLanguage: Language;
}

interface ConfigurationProps {
  value: ConfigurationValue;
  isListening: boolean;
  onChange: (value: ConfigurationValue) => void;
  onStart: (audioTrack: MediaStreamTrack) => void;
  onStop: () => void;
}

export default function Configuration({
  value,
  isListening,
  onChange,
  onStart,
  onStop,
}: ConfigurationProps) {
  const [audioSourceType, setAudioSourceType] = useState<
    "microphone" | "screen-share" | null
  >(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDeviceId, setAudioDeviceId] = useState<string>("");
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(
    null
  );
  const [screenShareStream, setScreenShareStream] =
    useState<MediaStream | null>(null);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (audioDeviceId) return;

    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const audioInputDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );
      setAudioDevices(audioInputDevices);

      if (audioInputDevices.length > 0 && !audioDeviceId) {
        setAudioDeviceId(audioInputDevices[0].deviceId);
      }
    });
  }, [audioDeviceId]);

  // マイクストリームの取得
  useEffect(() => {
    if (audioSourceType === "microphone" && audioDeviceId && !isListening) {
      navigator.mediaDevices
        .getUserMedia({
          audio: { deviceId: { exact: audioDeviceId } },
        })
        .then((stream) => {
          setMicrophoneStream(stream);
        })
        .catch((error) => {
          console.error("Failed to get microphone:", error);
        });
    }

    return () => {
      if (microphoneStream && audioSourceType !== "microphone") {
        microphoneStream.getTracks().forEach((track) => track.stop());
        setMicrophoneStream(null);
      }
    };
  }, [audioSourceType, audioDeviceId, isListening]);

  // 画面共有ストリームの取得
  useEffect(() => {
    if (
      audioSourceType === "screen-share" &&
      !screenShareStream &&
      !isListening
    ) {
      setScreenShareError(null);
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then((stream) => {
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length === 0) {
            setScreenShareError(
              "The selected screen does not have audio available. This may be because audio sharing was not enabled. Please check 'Share tab audio' or 'Share system audio' when sharing your screen."
            );
            stream.getTracks().forEach((track) => track.stop());
          } else {
            setScreenShareStream(stream);
            setScreenShareError(null);
          }
        })
        .catch((error) => {
          console.error("Failed to get screen share:", error);
        });
    }

    return () => {
      if (screenShareStream && audioSourceType !== "screen-share") {
        screenShareStream.getTracks().forEach((track) => track.stop());
        setScreenShareStream(null);
        setScreenShareError(null);
      }
    };
  }, [audioSourceType, screenShareStream, isListening]);

  // video要素のsrcObjectを設定
  useEffect(() => {
    if (videoRef.current && screenShareStream) {
      videoRef.current.srcObject = screenShareStream;
    }
  }, [screenShareStream]);

  const handleSourceLanguageChange = (newSourceLanguage: Language) => {
    onChange({
      ...value,
      sourceLanguage: newSourceLanguage,
      targetLanguage: LANGUAGE_OPTIONS.find(
        (lang) => lang.code !== newSourceLanguage
      )!.code,
    });
  };

  const handleTargetLanguageChange = (newTargetLanguage: Language) => {
    onChange({ ...value, targetLanguage: newTargetLanguage });
  };

  const handleAudioSourceTypeChange = (
    newAudioSourceType: "microphone" | "screen-share" | null
  ) => {
    // 既存のストリームをクリーンアップ
    if (microphoneStream) {
      microphoneStream.getTracks().forEach((track) => track.stop());
      setMicrophoneStream(null);
    }
    if (screenShareStream) {
      screenShareStream.getTracks().forEach((track) => track.stop());
      setScreenShareStream(null);
    }
    setAudioSourceType(newAudioSourceType);
  };

  const handleStart = async () => {
    let audioTrack: MediaStreamTrack;

    if (audioSourceType === "microphone") {
      if (!microphoneStream) {
        throw new Error("Microphone stream not available");
      }
      audioTrack = microphoneStream.getAudioTracks()[0];
    } else {
      if (!screenShareStream) {
        throw new Error("Screen share stream not available");
      }
      audioTrack = screenShareStream.getAudioTracks()[0];
    }

    onStart(audioTrack);
  };

  const handleRetryScreenShare = () => {
    setScreenShareError(null);
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
          setScreenShareError(
            "The selected screen does not have audio available. This may be because audio sharing was not enabled. Please check 'Share tab audio' or 'Share system audio' when sharing your screen."
          );
          stream.getTracks().forEach((track) => track.stop());
        } else {
          setScreenShareStream(stream);
          setScreenShareError(null);
        }
      })
      .catch((error) => {
        console.error("Failed to get screen share:", error);
      });
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            Source Language
          </label>
          <Select.Root
            value={value.sourceLanguage}
            onValueChange={(newValue) =>
              handleSourceLanguageChange(newValue as Language)
            }
            disabled={isListening}
          >
            <Select.Trigger className="flex items-center justify-between px-3 py-2 border border-gray-600 rounded-md bg-zinc-800 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="w-4 h-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="overflow-hidden bg-zinc-800 rounded-md shadow-lg border border-gray-700">
                <Select.Viewport className="p-1">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <Select.Item
                      key={lang.code}
                      value={lang.code}
                      className="relative flex items-center px-8 py-2 rounded cursor-pointer select-none outline-none data-[highlighted]:bg-zinc-700 text-gray-100"
                    >
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                        <Check className="w-4 h-4" />
                      </Select.ItemIndicator>
                      <Select.ItemText>{lang.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            Target Language
          </label>
          <Select.Root
            value={value.targetLanguage}
            onValueChange={(newValue) =>
              handleTargetLanguageChange(newValue as Language)
            }
            disabled={isListening}
          >
            <Select.Trigger className="flex items-center justify-between px-3 py-2 border border-gray-600 rounded-md bg-zinc-800 ext-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="w-4 h-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="overflow-hidden bg-zinc-800 rounded-md shadow-lg border border-gray-700">
                <Select.Viewport className="p-1">
                  {LANGUAGE_OPTIONS.filter(
                    (lang) => lang.code !== value.sourceLanguage
                  ).map((lang) => (
                    <Select.Item
                      key={lang.code}
                      value={lang.code}
                      className="relative flex items-center px-8 py-2 rounded cursor-pointer select-none outline-none data-[highlighted]:bg-zinc-700 text-gray-100"
                    >
                      <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                        <Check className="w-4 h-4" />
                      </Select.ItemIndicator>
                      <Select.ItemText>{lang.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            Audio Source
          </label>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="audioSource"
                  value="microphone"
                  checked={audioSourceType === "microphone"}
                  onChange={() => handleAudioSourceTypeChange("microphone")}
                  disabled={isListening}
                  className="w-4 h-4 text-blue-600 bg-zinc-800 border-gray-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-300">Microphone</span>
              </label>
              {audioSourceType === "microphone" && (
                <div className="ml-6 flex flex-col gap-2">
                  <Select.Root
                    value={audioDeviceId}
                    onValueChange={setAudioDeviceId}
                    disabled={isListening}
                  >
                    <Select.Trigger className="flex items-center justify-between px-3 py-2 border border-gray-600 rounded-md bg-zinc-800 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors text-sm">
                      <Select.Value placeholder="Select audio device" />
                      <Select.Icon>
                        <ChevronDown className="w-4 h-4" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="overflow-hidden bg-zinc-800 rounded-md shadow-lg border border-gray-700">
                        <Select.Viewport className="p-1">
                          {audioDevices.map((device) => (
                            <Select.Item
                              key={device.deviceId}
                              value={device.deviceId}
                              className="relative flex items-center px-8 py-2 rounded cursor-pointer select-none outline-none data-[highlighted]:bg-zinc-700 text-gray-100 text-sm"
                            >
                              <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                                <Check className="w-4 h-4" />
                              </Select.ItemIndicator>
                              <Select.ItemText>
                                {device.label ||
                                  `Device ${device.deviceId.slice(0, 8)}`}
                              </Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                  {microphoneStream && (
                    <AudioLevelMeter
                      audioTrack={microphoneStream.getAudioTracks()[0]}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="audioSource"
                  value="screen-share"
                  checked={audioSourceType === "screen-share"}
                  onChange={() => handleAudioSourceTypeChange("screen-share")}
                  disabled={isListening}
                  className="w-4 h-4 text-blue-600 bg-zinc-800 border-gray-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-300">Screen Share</span>
              </label>
              {audioSourceType === "screen-share" && (
                <div className="ml-6 flex flex-col gap-2">
                  {screenShareError && (
                    <>
                      <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                        {screenShareError}
                      </div>
                      <button
                        onClick={handleRetryScreenShare}
                        disabled={isListening}
                        className="text-xs px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Retry screen share
                      </button>
                    </>
                  )}
                  {screenShareStream ? (
                    <>
                      <div className="text-xs text-gray-400">
                        Previewing screen share...
                      </div>
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        className="w-full rounded border border-gray-600"
                      />
                      <AudioLevelMeter
                        audioTrack={screenShareStream.getAudioTracks()[0]}
                      />
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">
                      Selecting tab/window...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full">
        {isListening ? (
          <button
            onClick={onStop}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={
              !audioSourceType ||
              (audioSourceType === "microphone" && !microphoneStream) ||
              (audioSourceType === "screen-share" && !screenShareStream)
            }
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
}
