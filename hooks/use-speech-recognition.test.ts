import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeechRecognition } from "./use-speech-recognition";

// Helper to create SpeechRecognitionEvent-like events
function createSpeechRecognitionResultEvent(
  results: {
    isFinal: boolean;
    transcript: string;
    confidence: number;
  }[],
  resultIndex = 0
): Event {
  const event = new Event("result");
  const resultsObj: Record<number, unknown> & { length: number } = {
    length: results.length,
  };

  results.forEach((result, index) => {
    resultsObj[index] = {
      isFinal: result.isFinal,
      0: {
        transcript: result.transcript,
        confidence: result.confidence,
      },
      length: 1,
    };
  });

  Object.defineProperties(event, {
    resultIndex: { value: resultIndex },
    results: { value: resultsObj },
  });

  return event;
}

// Mock SpeechRecognition extending EventTarget for native event handling
class MockSpeechRecognition extends EventTarget {
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;

  start = vi.fn(() => {
    // Simulate async start event
    setTimeout(() => {
      this.dispatchEvent(new Event("start"));
    }, 0);
  });

  abort = vi.fn(() => {
    this.dispatchEvent(new Event("end"));
  });

  stop = vi.fn();
}

describe("useSpeechRecognition", () => {
  let mockRecognition: MockSpeechRecognition;
  let MockSpeechRecognitionClass: typeof MockSpeechRecognition;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create a class that captures the instance for testing
    MockSpeechRecognitionClass = class extends MockSpeechRecognition {
      constructor() {
        super();
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        mockRecognition = this;
      }
    };

    // Setup global SpeechRecognition mock using stubGlobal
    vi.stubGlobal("SpeechRecognition", MockSpeechRecognitionClass);
    vi.stubGlobal("webkitSpeechRecognition", undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    expect(result.current.state.isListening).toBe(false);
    expect(result.current.state.error).toBe(null);
    expect(result.current.state.startedAt).toBe(null);
    expect(result.current.finalResults).toEqual([]);
    expect(result.current.interimResults).toEqual([]);
  });

  it("configures recognition with correct settings", () => {
    renderHook(() => useSpeechRecognition({ lang: "ja-JP" }));

    expect(mockRecognition.lang).toBe("ja-JP");
    expect(mockRecognition.continuous).toBe(true);
    expect(mockRecognition.interimResults).toBe(true);
    expect(mockRecognition.maxAlternatives).toBe(1);
  });

  it("starts recognition when start is called", async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    const mockAudioTrack = {
      kind: "audio",
      id: "test-track",
    } as MediaStreamTrack;

    act(() => {
      result.current.start(mockAudioTrack);
    });

    expect(mockRecognition.start).toHaveBeenCalledWith(mockAudioTrack);
  });

  it("updates state to listening when recognition starts", async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    const mockAudioTrack = {
      kind: "audio",
      id: "test-track",
    } as MediaStreamTrack;

    act(() => {
      result.current.start(mockAudioTrack);
    });

    // Advance timers to trigger the start event
    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.state.isListening).toBe(true);
    expect(result.current.state.startedAt).toBeInstanceOf(Date);
    expect(result.current.state.error).toBe(null);
  });

  it("stops recognition when stop is called", async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    const mockAudioTrack = {
      kind: "audio",
      id: "test-track",
    } as MediaStreamTrack;

    act(() => {
      result.current.start(mockAudioTrack);
    });

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    act(() => {
      result.current.stop();
    });

    expect(mockRecognition.abort).toHaveBeenCalled();
    expect(result.current.state.isListening).toBe(false);
    expect(result.current.state.startedAt).toBe(null);
  });

  it("handles error events", async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    const mockAudioTrack = {
      kind: "audio",
      id: "test-track",
    } as MediaStreamTrack;

    act(() => {
      result.current.start(mockAudioTrack);
    });

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    // Simulate error event
    act(() => {
      const errorEvent = new Event("error") as SpeechRecognitionErrorEvent;
      Object.defineProperty(errorEvent, "message", {
        value: "network error",
        writable: false,
      });
      mockRecognition.dispatchEvent(errorEvent);
    });

    expect(result.current.state.isListening).toBe(false);
    expect(result.current.state.error).toBeInstanceOf(Error);
    expect(result.current.state.error?.message).toBe("network error");
  });

  it("processes final results correctly", async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    const mockAudioTrack = {
      kind: "audio",
      id: "test-track",
    } as MediaStreamTrack;

    act(() => {
      result.current.start(mockAudioTrack);
    });

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    // Simulate result event with final result
    act(() => {
      const resultEvent = createSpeechRecognitionResultEvent([
        { isFinal: true, transcript: "Hello world", confidence: 0.9 },
      ]);
      mockRecognition.dispatchEvent(resultEvent);
    });

    expect(result.current.finalResults).toHaveLength(1);
    expect(result.current.finalResults[0].result.transcript).toBe(
      "Hello world"
    );
    expect(result.current.finalResults[0].result.confidence).toBe(0.9);
    expect(result.current.finalResults[0].fianalizedAt).toBeInstanceOf(Date);
  });

  it("processes interim results correctly", async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    const mockAudioTrack = {
      kind: "audio",
      id: "test-track",
    } as MediaStreamTrack;

    act(() => {
      result.current.start(mockAudioTrack);
    });

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    // Simulate result event with interim result
    act(() => {
      const resultEvent = createSpeechRecognitionResultEvent([
        { isFinal: false, transcript: "Hello", confidence: 0.5 },
      ]);
      mockRecognition.dispatchEvent(resultEvent);
    });

    expect(result.current.interimResults).toHaveLength(1);
    expect(result.current.finalResults).toHaveLength(0);
  });

  it("accumulates multiple final results", async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    const mockAudioTrack = {
      kind: "audio",
      id: "test-track",
    } as MediaStreamTrack;

    act(() => {
      result.current.start(mockAudioTrack);
    });

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    // First result
    act(() => {
      const resultEvent = createSpeechRecognitionResultEvent([
        { isFinal: true, transcript: "First", confidence: 0.9 },
      ]);
      mockRecognition.dispatchEvent(resultEvent);
    });

    // Second result
    act(() => {
      const resultEvent = createSpeechRecognitionResultEvent(
        [
          { isFinal: true, transcript: "First", confidence: 0.9 },
          { isFinal: true, transcript: "Second", confidence: 0.8 },
        ],
        1
      );
      mockRecognition.dispatchEvent(resultEvent);
    });

    expect(result.current.finalResults).toHaveLength(2);
    expect(result.current.finalResults[0].result.transcript).toBe("First");
    expect(result.current.finalResults[1].result.transcript).toBe("Second");
  });

  it("restarts recognition automatically after end if shouldContinue is true", async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    const mockAudioTrack = {
      kind: "audio",
      id: "test-track",
    } as MediaStreamTrack;

    act(() => {
      result.current.start(mockAudioTrack);
    });

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    // Simulate end event (not from stop())
    act(() => {
      mockRecognition.dispatchEvent(new Event("end"));
    });

    // Should restart because shouldContinue is still true
    expect(mockRecognition.start).toHaveBeenCalledTimes(2);
    expect(mockRecognition.start).toHaveBeenLastCalledWith(mockAudioTrack);
  });

  it("does not restart recognition after stop is called", async () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    const mockAudioTrack = {
      kind: "audio",
      id: "test-track",
    } as MediaStreamTrack;

    act(() => {
      result.current.start(mockAudioTrack);
    });

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    // Clear mock calls count
    mockRecognition.start.mockClear();

    act(() => {
      result.current.stop();
    });

    // Stop triggers abort which triggers end, but should not restart
    expect(mockRecognition.start).not.toHaveBeenCalled();
  });

  it("updates language configuration when lang prop changes", () => {
    const { rerender } = renderHook(
      ({ lang }) => useSpeechRecognition({ lang }),
      { initialProps: { lang: "en-US" } }
    );

    expect(mockRecognition.lang).toBe("en-US");

    rerender({ lang: "ja-JP" });

    expect(mockRecognition.lang).toBe("ja-JP");
  });

  it("handles webkit prefix fallback", () => {
    // Remove SpeechRecognition, keep webkitSpeechRecognition
    vi.unstubAllGlobals();
    vi.stubGlobal("SpeechRecognition", undefined);
    vi.stubGlobal("webkitSpeechRecognition", MockSpeechRecognitionClass);

    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    expect(result.current.state.isListening).toBe(false);
    expect(mockRecognition.lang).toBe("en-US");
  });

  it("cleans up event listeners on unmount", () => {
    const { unmount } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    // Spy after hook is rendered so mockRecognition is assigned
    const removeEventListenerSpy = vi.spyOn(
      mockRecognition,
      "removeEventListener"
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "start",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "result",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "error",
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "end",
      expect.any(Function)
    );
  });

  it("calculates timing correctly for final results", async () => {
    vi.useRealTimers();

    const { result } = renderHook(() =>
      useSpeechRecognition({ lang: "en-US" })
    );

    const mockAudioTrack = {
      kind: "audio",
      id: "test-track",
    } as MediaStreamTrack;

    act(() => {
      result.current.start(mockAudioTrack);
    });

    // Wait for start event
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // First result
    act(() => {
      const resultEvent = createSpeechRecognitionResultEvent([
        { isFinal: true, transcript: "First", confidence: 0.9 },
      ]);
      mockRecognition.dispatchEvent(resultEvent);
    });

    expect(result.current.finalResults[0].startMs).toBe(0);
    expect(result.current.finalResults[0].endMs).toBeGreaterThanOrEqual(0);

    // Second result
    act(() => {
      const resultEvent = createSpeechRecognitionResultEvent(
        [
          { isFinal: true, transcript: "First", confidence: 0.9 },
          { isFinal: true, transcript: "Second", confidence: 0.8 },
        ],
        1
      );
      mockRecognition.dispatchEvent(resultEvent);
    });

    // Second result's startMs should be the first result's endMs
    expect(result.current.finalResults[1].startMs).toBe(
      result.current.finalResults[0].endMs
    );
  });
});
