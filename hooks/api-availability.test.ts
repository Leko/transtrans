import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAPIAvailability } from "./api-availability";
import type { ConfigurationValue } from "@/components/Configuration";

// Type declaration for test mocks on globalThis
declare const globalThis: {
  SpeechRecognition: {
    available: ReturnType<typeof vi.fn>;
    install: ReturnType<typeof vi.fn>;
  };
  Rewriter: {
    availability: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  Translator: {
    availability: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  Proofreader: {
    availability: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  Summarizer: {
    availability: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

describe("useAPIAvailability", () => {
  const defaultConfig: ConfigurationValue = {
    sourceLanguage: "ja-JP",
    targetLanguage: "en-US",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks for all APIs
    Object.defineProperty(globalThis, "SpeechRecognition", {
      value: {
        available: vi.fn().mockResolvedValue("available"),
        install: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, "Rewriter", {
      value: {
        availability: vi.fn().mockResolvedValue("available"),
        create: vi.fn().mockResolvedValue({
          destroy: vi.fn(),
        }),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, "Translator", {
      value: {
        availability: vi.fn().mockResolvedValue("available"),
        create: vi.fn().mockResolvedValue({
          destroy: vi.fn(),
        }),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, "Proofreader", {
      value: {
        availability: vi.fn().mockResolvedValue("available"),
        create: vi.fn().mockResolvedValue({
          destroy: vi.fn(),
        }),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, "Summarizer", {
      value: {
        availability: vi.fn().mockResolvedValue("available"),
        create: vi.fn().mockResolvedValue({
          destroy: vi.fn(),
        }),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with all features in initializing state", () => {
    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    expect(result.current.availabilities).toHaveLength(5);
    result.current.availabilities.forEach((availability) => {
      expect(availability.status).toBe("initializing");
    });
  });

  it("checks availability of all features", async () => {
    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.every((a) => a.status !== "initializing")).toBe(true);
    });

    expect(globalThis.SpeechRecognition.available).toHaveBeenCalledWith({
      langs: ["ja-JP"],
    });
    expect(globalThis.Rewriter.availability).toHaveBeenCalled();
    expect(globalThis.Translator.availability).toHaveBeenCalledWith({
      sourceLanguage: "ja-JP",
      targetLanguage: "en-US",
    });
    expect(globalThis.Proofreader.availability).toHaveBeenCalledWith({
      expectedInputLanguages: ["ja-JP"],
    });
    expect(globalThis.Summarizer.availability).toHaveBeenCalledWith({});
  });

  it("sets features to available when APIs report available", async () => {
    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.every((a) => a.status === "available")).toBe(true);
    });

    expect(result.current.availabilities).toEqual([
      { name: "Speech Recognition", status: "available", error: null },
      { name: "Rewriter", status: "available", error: null },
      { name: "Translator", status: "available", error: null },
      { name: "Proofreader", status: "available", error: null },
      { name: "Summarizer", status: "available", error: null },
    ]);
  });

  it("sets features to downloadable when APIs report downloadable", async () => {
    globalThis.SpeechRecognition.available.mockResolvedValue("downloadable");
    globalThis.Rewriter.availability.mockResolvedValue("downloadable");

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Speech Recognition")?.status).toBe("downloadable");
    });

    expect(result.current.availabilities.find((a) => a.name === "Rewriter")?.status).toBe("downloadable");
  });

  it("sets features to unavailable when APIs are not present", async () => {
    // Remove Rewriter from global
    // @ts-expect-error - intentionally setting to undefined
    delete globalThis.Rewriter;

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Rewriter")?.status).toBe("unavailable");
    });
  });

  it("sets features to unavailable when availability check fails", async () => {
    globalThis.SpeechRecognition.available.mockRejectedValue(new Error("API not supported"));

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      const speechRecog = result.current.availabilities.find((a) => a.name === "Speech Recognition");
      expect(speechRecog?.status).toBe("unavailable");
    });
  });

  it("provides download function that downloads feature", async () => {
    globalThis.Rewriter.availability.mockResolvedValue("downloadable");

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Rewriter")?.status).toBe("downloadable");
    });

    await act(async () => {
      await result.current.download("Rewriter");
    });

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Rewriter")?.status).toBe("available");
    });

    expect(globalThis.Rewriter.create).toHaveBeenCalled();
  });

  it("tracks download progress", async () => {
    globalThis.Rewriter.availability.mockResolvedValue("downloadable");

    // Mock create to call progress callback
    let progressCallback: (e: ProgressEvent) => void;
    globalThis.Rewriter.create.mockImplementation(({ monitor }: { monitor: (m: { addEventListener: (event: string, cb: (e: ProgressEvent) => void) => void }) => void }) => {
      monitor({
        addEventListener: (_event: string, cb: (e: ProgressEvent) => void) => {
          progressCallback = cb;
        },
      });
      // Simulate progress
      setTimeout(() => {
        progressCallback(new ProgressEvent("downloadprogress", {
          lengthComputable: true,
          loaded: 50,
          total: 100,
        }));
      }, 0);
      return Promise.resolve({ destroy: vi.fn() });
    });

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Rewriter")?.status).toBe("downloadable");
    });

    act(() => {
      result.current.download("Rewriter");
    });

    await waitFor(() => {
      const rewriter = result.current.availabilities.find((a) => a.name === "Rewriter");
      expect(rewriter?.status).toBe("downloading");
    });
  });

  it("handles download errors", async () => {
    globalThis.Translator.availability.mockResolvedValue("downloadable");
    globalThis.Translator.create.mockRejectedValue(new Error("Download failed"));

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Translator")?.status).toBe("downloadable");
    });

    await act(async () => {
      await result.current.download("Translator");
    });

    await waitFor(() => {
      const translator = result.current.availabilities.find((a) => a.name === "Translator");
      expect(translator?.status).toBe("unavailable");
    });
  });

  it("throws error when downloading unknown feature", async () => {
    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    expect(() =>
      result.current.download("Unknown Feature" as unknown as "Rewriter")
    ).toThrow("Feature Unknown Feature not found");
  });

  it("downloads Speech Recognition correctly", async () => {
    globalThis.SpeechRecognition.available.mockResolvedValue("downloadable");

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Speech Recognition")?.status).toBe("downloadable");
    });

    await act(async () => {
      await result.current.download("Speech Recognition");
    });

    expect(globalThis.SpeechRecognition.install).toHaveBeenCalledWith({
      langs: ["ja-JP"],
      processLocally: true,
    });

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Speech Recognition")?.status).toBe("available");
    });
  });

  it("downloads Translator with correct language configuration", async () => {
    globalThis.Translator.availability.mockResolvedValue("downloadable");

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Translator")?.status).toBe("downloadable");
    });

    await act(async () => {
      await result.current.download("Translator");
    });

    expect(globalThis.Translator.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceLanguage: "ja-JP",
        targetLanguage: "en-US",
      })
    );
  });

  it("downloads Proofreader with correct language configuration", async () => {
    globalThis.Proofreader.availability.mockResolvedValue("downloadable");

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Proofreader")?.status).toBe("downloadable");
    });

    await act(async () => {
      await result.current.download("Proofreader");
    });

    expect(globalThis.Proofreader.create).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedInputLanguages: ["ja-JP"],
      })
    );
  });

  it("destroys created API instance after download", async () => {
    const mockDestroy = vi.fn();
    globalThis.Summarizer.availability.mockResolvedValue("downloadable");
    globalThis.Summarizer.create.mockResolvedValue({ destroy: mockDestroy });

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      expect(result.current.availabilities.find((a) => a.name === "Summarizer")?.status).toBe("downloadable");
    });

    await act(async () => {
      await result.current.download("Summarizer");
    });

    expect(mockDestroy).toHaveBeenCalled();
  });

  it("re-checks availability when config changes", async () => {
    const { result, rerender } = renderHook(
      ({ config }) => useAPIAvailability(config),
      { initialProps: { config: defaultConfig } }
    );

    await waitFor(() => {
      expect(result.current.availabilities.every((a) => a.status !== "initializing")).toBe(true);
    });

    // Clear mocks
    vi.clearAllMocks();

    // Update config
    const newConfig: ConfigurationValue = {
      sourceLanguage: "en-US",
      targetLanguage: "ja-JP",
    };

    rerender({ config: newConfig });

    await waitFor(() => {
      expect(globalThis.Translator.availability).toHaveBeenCalledWith({
        sourceLanguage: "en-US",
        targetLanguage: "ja-JP",
      });
    });
  });

  it("handles Translator unavailability correctly", async () => {
    // @ts-expect-error - intentionally setting to undefined
    delete globalThis.Translator;

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      const translator = result.current.availabilities.find((a) => a.name === "Translator");
      expect(translator?.status).toBe("unavailable");
    });
  });

  it("handles Proofreader unavailability correctly", async () => {
    // @ts-expect-error - intentionally setting to undefined
    delete globalThis.Proofreader;

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      const proofreader = result.current.availabilities.find((a) => a.name === "Proofreader");
      expect(proofreader?.status).toBe("unavailable");
    });
  });

  it("handles Summarizer unavailability correctly", async () => {
    // @ts-expect-error - intentionally setting to undefined
    delete globalThis.Summarizer;

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      const summarizer = result.current.availabilities.find((a) => a.name === "Summarizer");
      expect(summarizer?.status).toBe("unavailable");
    });
  });

  it("returns all feature names correctly", async () => {
    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    const expectedNames = [
      "Speech Recognition",
      "Rewriter",
      "Translator",
      "Proofreader",
      "Summarizer",
    ];

    expect(result.current.availabilities.map((a) => a.name)).toEqual(expectedNames);
  });

  it("handles rejection errors with string message", async () => {
    globalThis.SpeechRecognition.available.mockRejectedValue("String error");

    const { result } = renderHook(() => useAPIAvailability(defaultConfig));

    await waitFor(() => {
      const speechRecog = result.current.availabilities.find((a) => a.name === "Speech Recognition");
      expect(speechRecog?.status).toBe("unavailable");
    });
  });
});
