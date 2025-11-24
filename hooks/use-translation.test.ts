import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Type declaration for test mocks on globalThis
declare const globalThis: {
  Rewriter: {
    create: ReturnType<typeof vi.fn>;
  };
  Translator: {
    create: ReturnType<typeof vi.fn>;
  };
  Proofreader: {
    create: ReturnType<typeof vi.fn>;
  };
};

// Mock implementations
const mockRewriter = {
  rewrite: vi.fn(),
};

const mockTranslator = {
  translate: vi.fn(),
};

const mockProofreader = {
  proofread: vi.fn(),
};

// Helper to get fresh module with reset cache
async function getFreshModule() {
  vi.resetModules();
  // Clear mock call counts before getting fresh module
  mockRewriter.rewrite.mockClear();
  mockTranslator.translate.mockClear();
  mockProofreader.proofread.mockClear();
  const mod = await import("./use-translation");
  return mod;
}

// Type for TranslatedResult
type TranslatedResult = {
  result: SpeechRecognitionAlternative;
  fianalizedAt: Date;
  endMs: number;
  startMs: number;
  punctuated?: string;
  translated?: string;
};

describe("useTranslation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset module-level promises by clearing mocks
    mockRewriter.rewrite.mockResolvedValue("rewritten text");
    mockTranslator.translate.mockResolvedValue("translated text");
    mockProofreader.proofread.mockResolvedValue({
      correctedInput: "punctuated text",
    });

    // Setup global API mocks
    vi.stubGlobal("Rewriter", {
      create: vi.fn().mockResolvedValue(mockRewriter),
    });

    vi.stubGlobal("Translator", {
      create: vi.fn().mockResolvedValue(mockTranslator),
    });

    vi.stubGlobal("Proofreader", {
      create: vi.fn().mockResolvedValue(mockProofreader),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("initializes with empty translated results", async () => {
    const { useTranslation } = await getFreshModule();
    const { result } = renderHook(() =>
      useTranslation({
        sourceLanguage: "ja-JP",
        targetLanguage: "en-US",
        finalResults: [],
      })
    );

    expect(result.current.translatedResults).toEqual([]);
  });

  it("does not process when finalResults is empty", async () => {
    const { useTranslation } = await getFreshModule();
    renderHook(() =>
      useTranslation({
        sourceLanguage: "ja-JP",
        targetLanguage: "en-US",
        finalResults: [],
      })
    );

    expect(globalThis.Rewriter.create).not.toHaveBeenCalled();
    expect(globalThis.Translator.create).not.toHaveBeenCalled();
    expect(globalThis.Proofreader.create).not.toHaveBeenCalled();
  });

  it("creates APIs with correct language configuration", async () => {
    const { useTranslation } = await getFreshModule();
    const finalResults: TranslatedResult[] = [
      {
        result: {
          transcript: "こんにちは",
          confidence: 0.9,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 0,
        endMs: 1000,
      },
    ];

    renderHook(() =>
      useTranslation({
        sourceLanguage: "ja-JP",
        targetLanguage: "en-US",
        finalResults,
      })
    );

    await waitFor(() => {
      expect(globalThis.Translator.create).toHaveBeenCalledWith({
        sourceLanguage: "ja",
        targetLanguage: "en",
      });
    });
  });

  it("processes new final results through translation pipeline", async () => {
    const { useTranslation } = await getFreshModule();
    const finalResults: TranslatedResult[] = [
      {
        result: {
          transcript: "こんにちは",
          confidence: 0.9,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 0,
        endMs: 1000,
      },
    ];

    const { result } = renderHook(() =>
      useTranslation({
        sourceLanguage: "ja-JP",
        targetLanguage: "en-US",
        finalResults,
      })
    );

    await waitFor(() => {
      expect(result.current.translatedResults).toHaveLength(1);
      expect(result.current.translatedResults[0].punctuated).toBe(
        "punctuated text"
      );
      expect(result.current.translatedResults[0].translated).toBe(
        "translated text"
      );
    });

    expect(mockProofreader.proofread).toHaveBeenCalledWith("こんにちは");
    expect(mockRewriter.rewrite).toHaveBeenCalledWith("punctuated text");
    expect(mockTranslator.translate).toHaveBeenCalledWith("rewritten text");
  });

  it("preserves original result data in translated results", async () => {
    const { useTranslation } = await getFreshModule();
    const originalDate = new Date("2024-01-01");
    const finalResults: TranslatedResult[] = [
      {
        result: {
          transcript: "テスト",
          confidence: 0.85,
        } as SpeechRecognitionAlternative,
        fianalizedAt: originalDate,
        startMs: 100,
        endMs: 2000,
      },
    ];

    const { result } = renderHook(() =>
      useTranslation({
        sourceLanguage: "ja-JP",
        targetLanguage: "en-US",
        finalResults,
      })
    );

    await waitFor(() => {
      expect(result.current.translatedResults[0].result.transcript).toBe(
        "テスト"
      );
      expect(result.current.translatedResults[0].result.confidence).toBe(0.85);
      expect(result.current.translatedResults[0].fianalizedAt).toBe(
        originalDate
      );
      expect(result.current.translatedResults[0].startMs).toBe(100);
      expect(result.current.translatedResults[0].endMs).toBe(2000);
    });
  });

  it("processes multiple results sequentially", async () => {
    const { useTranslation } = await getFreshModule();
    const finalResults: TranslatedResult[] = [
      {
        result: {
          transcript: "First",
          confidence: 0.9,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 0,
        endMs: 1000,
      },
    ];

    const { result, rerender } = renderHook(
      ({ finalResults }) =>
        useTranslation({
          sourceLanguage: "ja-JP",
          targetLanguage: "en-US",
          finalResults,
        }),
      { initialProps: { finalResults } }
    );

    await waitFor(() => {
      expect(result.current.translatedResults).toHaveLength(1);
    });

    // Add second result
    const updatedResults: TranslatedResult[] = [
      ...finalResults,
      {
        result: {
          transcript: "Second",
          confidence: 0.8,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 1000,
        endMs: 2000,
      },
    ];

    rerender({ finalResults: updatedResults });

    await waitFor(() => {
      expect(result.current.translatedResults).toHaveLength(2);
    });
  });

  it("reuses API instances across multiple translations", async () => {
    const { useTranslation } = await getFreshModule();
    const finalResults: TranslatedResult[] = [
      {
        result: {
          transcript: "First",
          confidence: 0.9,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 0,
        endMs: 1000,
      },
    ];

    const { result, rerender } = renderHook(
      ({ finalResults }) =>
        useTranslation({
          sourceLanguage: "ja-JP",
          targetLanguage: "en-US",
          finalResults,
        }),
      { initialProps: { finalResults } }
    );

    // Wait for first result to be fully processed
    await waitFor(() => {
      expect(result.current.translatedResults[0]?.translated).toBe("translated text");
    });

    // Add second result
    const updatedResults: TranslatedResult[] = [
      ...finalResults,
      {
        result: {
          transcript: "Second",
          confidence: 0.8,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 1000,
        endMs: 2000,
      },
    ];

    rerender({ finalResults: updatedResults });

    await waitFor(() => {
      // Second result should be processed
      expect(mockProofreader.proofread).toHaveBeenCalledWith("Second");
    });

    // The create methods are called once per module lifecycle
    // Since we're in the same test, they were already created
    expect(globalThis.Rewriter.create).toHaveBeenCalledTimes(1);
    expect(globalThis.Translator.create).toHaveBeenCalledTimes(1);
    expect(globalThis.Proofreader.create).toHaveBeenCalledTimes(1);
  });

  it("handles different language pairs correctly", async () => {
    const { useTranslation } = await getFreshModule();
    const finalResults: TranslatedResult[] = [
      {
        result: {
          transcript: "Hello",
          confidence: 0.9,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 0,
        endMs: 1000,
      },
    ];

    renderHook(() =>
      useTranslation({
        sourceLanguage: "en-US",
        targetLanguage: "ja-JP",
        finalResults,
      })
    );

    await waitFor(() => {
      expect(globalThis.Translator.create).toHaveBeenCalledWith({
        sourceLanguage: "en",
        targetLanguage: "ja",
      });
    });
  });

  it("initially adds result without translation, then updates with translation", async () => {
    const { useTranslation } = await getFreshModule();
    // Track state changes
    const stateHistory: { punctuated?: string; translated?: string }[] = [];

    const finalResults: TranslatedResult[] = [
      {
        result: {
          transcript: "テスト",
          confidence: 0.9,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 0,
        endMs: 1000,
      },
    ];

    const { result } = renderHook(() => {
      const hookResult = useTranslation({
        sourceLanguage: "ja-JP",
        targetLanguage: "en-US",
        finalResults,
      });
      if (hookResult.translatedResults.length > 0) {
        stateHistory.push({
          punctuated: hookResult.translatedResults[0].punctuated,
          translated: hookResult.translatedResults[0].translated,
        });
      }
      return hookResult;
    });

    await waitFor(() => {
      expect(result.current.translatedResults[0].translated).toBe(
        "translated text"
      );
    });

    // First state should be without translation, final should have translation
    expect(stateHistory.some((s) => s.translated === undefined)).toBe(true);
    expect(
      stateHistory.some((s) => s.translated === "translated text")
    ).toBe(true);
  });

  it("processes only new results when finalResults grows", async () => {
    const { useTranslation } = await getFreshModule();
    const initialResults: TranslatedResult[] = [
      {
        result: {
          transcript: "First",
          confidence: 0.9,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 0,
        endMs: 1000,
      },
    ];

    const { result, rerender } = renderHook(
      ({ finalResults }) =>
        useTranslation({
          sourceLanguage: "ja-JP",
          targetLanguage: "en-US",
          finalResults,
        }),
      { initialProps: { finalResults: initialResults } }
    );

    // Wait for first result to be fully processed
    await waitFor(() => {
      expect(result.current.translatedResults[0]?.translated).toBe("translated text");
    });

    // Clear call counts
    mockProofreader.proofread.mockClear();
    mockRewriter.rewrite.mockClear();
    mockTranslator.translate.mockClear();

    // Add new result
    const updatedResults: TranslatedResult[] = [
      ...initialResults,
      {
        result: {
          transcript: "Second",
          confidence: 0.8,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 1000,
        endMs: 2000,
      },
    ];

    rerender({ finalResults: updatedResults });

    await waitFor(() => {
      expect(result.current.translatedResults).toHaveLength(2);
      expect(result.current.translatedResults[1]?.translated).toBe("translated text");
    });

    // Should process the new result
    expect(mockProofreader.proofread).toHaveBeenCalledWith("Second");
  });

  it("extracts language code correctly from locale string", async () => {
    const { useTranslation } = await getFreshModule();
    const finalResults: TranslatedResult[] = [
      {
        result: {
          transcript: "Test",
          confidence: 0.9,
        } as SpeechRecognitionAlternative,
        fianalizedAt: new Date(),
        startMs: 0,
        endMs: 1000,
      },
    ];

    renderHook(() =>
      useTranslation({
        // @ts-expect-error Testing language code extraction with non-standard codes not in Language union type
        sourceLanguage: "zh-CN",
        // @ts-expect-error Testing language code extraction with non-standard codes not in Language union type
        targetLanguage: "fr-FR",
        finalResults,
      })
    );

    await waitFor(() => {
      expect(globalThis.Translator.create).toHaveBeenCalledWith({
        sourceLanguage: "zh",
        targetLanguage: "fr",
      });
    });
  });
});
