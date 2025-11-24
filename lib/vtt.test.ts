import { describe, it, expect } from "vitest";
import { formatDuration, toVTT } from "./vtt";
import { TranslatedResult } from "@/hooks/use-translation";

describe("formatDuration", () => {
  it("formats zero milliseconds", () => {
    expect(formatDuration(0)).toBe("00:00:00.000");
  });

  it("formats milliseconds only", () => {
    expect(formatDuration(123)).toBe("00:00:00.123");
  });

  it("formats seconds", () => {
    expect(formatDuration(5000)).toBe("00:00:05.000");
  });

  it("formats minutes", () => {
    expect(formatDuration(60000)).toBe("00:01:00.000");
  });

  it("formats hours", () => {
    expect(formatDuration(3600000)).toBe("01:00:00.000");
  });

  it("formats complex duration", () => {
    // 1 hour, 23 minutes, 45 seconds, 678 milliseconds
    const ms = 1 * 3600000 + 23 * 60000 + 45 * 1000 + 678;
    expect(formatDuration(ms)).toBe("01:23:45.678");
  });

  it("formats duration with all components", () => {
    // 12 hours, 34 minutes, 56 seconds, 789 milliseconds
    const ms = 12 * 3600000 + 34 * 60000 + 56 * 1000 + 789;
    expect(formatDuration(ms)).toBe("12:34:56.789");
  });

  it("handles 59 seconds correctly", () => {
    expect(formatDuration(59999)).toBe("00:00:59.999");
  });

  it("handles exactly 1 minute", () => {
    expect(formatDuration(60000)).toBe("00:01:00.000");
  });

  it("pads single digit components", () => {
    const ms = 1 * 3600000 + 2 * 60000 + 3 * 1000 + 4;
    expect(formatDuration(ms)).toBe("01:02:03.004");
  });
});

describe("toVTT", () => {
  const createResult = (
    startMs: number,
    endMs: number,
    punctuated?: string,
    translated?: string
  ): TranslatedResult => ({
    result: {
      transcript: "test",
      confidence: 0.9,
    },
    fianalizedAt: new Date(),
    startMs,
    endMs,
    punctuated,
    translated,
  });

  it("generates valid VTT header", () => {
    const results: TranslatedResult[] = [];
    const vtt = toVTT(results, "punctuated");
    expect(vtt).toBe("WEBVTT\n\n");
  });

  it("generates VTT with single cue using punctuated field", () => {
    const results = [createResult(0, 5000, "Hello world", "こんにちは世界")];
    const vtt = toVTT(results, "punctuated");
    expect(vtt).toBe("WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nHello world");
  });

  it("generates VTT with single cue using translated field", () => {
    const results = [createResult(0, 5000, "Hello world", "こんにちは世界")];
    const vtt = toVTT(results, "translated");
    expect(vtt).toBe("WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nこんにちは世界");
  });

  it("generates VTT with multiple cues", () => {
    const results = [
      createResult(0, 2000, "First line"),
      createResult(3000, 5000, "Second line"),
    ];
    const vtt = toVTT(results, "punctuated");
    expect(vtt).toBe(
      "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nFirst line\n\n00:00:03.000 --> 00:00:05.000\nSecond line"
    );
  });

  it("filters out results without the specified field", () => {
    const results = [
      createResult(0, 2000, "Has punctuated"),
      createResult(3000, 5000, undefined, "Only translated"),
      createResult(6000, 8000, "Another punctuated"),
    ];
    const vtt = toVTT(results, "punctuated");
    expect(vtt).toBe(
      "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHas punctuated\n\n00:00:06.000 --> 00:00:08.000\nAnother punctuated"
    );
  });

  it("escapes HTML special characters", () => {
    const results = [createResult(0, 5000, "<script>alert('xss')</script>")];
    const vtt = toVTT(results, "punctuated");
    expect(vtt).toContain("&lt;script&gt;alert('xss')&lt;/script&gt;");
  });

  it("escapes ampersand", () => {
    const results = [createResult(0, 5000, "Tom & Jerry")];
    const vtt = toVTT(results, "punctuated");
    expect(vtt).toContain("Tom &amp; Jerry");
  });

  it("escapes quotes", () => {
    const results = [createResult(0, 5000, 'Say "Hello"')];
    const vtt = toVTT(results, "punctuated");
    expect(vtt).toContain('Say "Hello"');
  });

  it("handles empty text field", () => {
    const results = [
      createResult(0, 2000, ""),
      createResult(3000, 5000, "Valid text"),
    ];
    const vtt = toVTT(results, "punctuated");
    // Empty string is falsy, should be filtered out
    expect(vtt).toBe("WEBVTT\n\n00:00:03.000 --> 00:00:05.000\nValid text");
  });

  it("handles long duration", () => {
    const results = [
      createResult(
        3600000, // 1 hour
        7200000, // 2 hours
        "Long video content"
      ),
    ];
    const vtt = toVTT(results, "punctuated");
    expect(vtt).toBe(
      "WEBVTT\n\n01:00:00.000 --> 02:00:00.000\nLong video content"
    );
  });
});
