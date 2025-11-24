import { describe, it, expect } from "vitest";
import { ucFirst, splitIntoWords } from "./restore-punctuation";

describe("ucFirst", () => {
  it("capitalizes first letter of lowercase string", () => {
    expect(ucFirst("hello")).toBe("Hello");
  });

  it("keeps already capitalized string", () => {
    expect(ucFirst("Hello")).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(ucFirst("")).toBe("");
  });

  it("handles single character", () => {
    expect(ucFirst("a")).toBe("A");
  });

  it("handles uppercase single character", () => {
    expect(ucFirst("A")).toBe("A");
  });

  it("handles string with numbers at start", () => {
    expect(ucFirst("123abc")).toBe("123abc");
  });

  it("handles string with special characters", () => {
    expect(ucFirst("@hello")).toBe("@hello");
  });

  it("handles unicode characters", () => {
    expect(ucFirst("über")).toBe("Über");
  });

  it("handles emoji at start", () => {
    const result = ucFirst("😀hello");
    // Emoji stays as is, rest of string unchanged
    expect(result).toBe("😀hello");
  });

  it("handles Japanese characters", () => {
    expect(ucFirst("こんにちは")).toBe("こんにちは");
  });

  it("handles mixed case string", () => {
    expect(ucFirst("hELLO")).toBe("HELLO");
  });
});

describe("splitIntoWords", () => {
  it("splits English text into words", () => {
    const result = splitIntoWords("Hello world", "en-US");
    expect(result).toEqual(["Hello", "world"]);
  });

  it("handles empty string", () => {
    const result = splitIntoWords("", "en-US");
    expect(result).toEqual([]);
  });

  it("handles single word", () => {
    const result = splitIntoWords("Hello", "en-US");
    expect(result).toEqual(["Hello"]);
  });

  it("removes punctuation from results", () => {
    const result = splitIntoWords("Hello, world!", "en-US");
    expect(result).toEqual(["Hello", "world"]);
  });

  it("handles multiple spaces", () => {
    const result = splitIntoWords("Hello   world", "en-US");
    expect(result).toEqual(["Hello", "world"]);
  });

  it("handles numbers as words", () => {
    const result = splitIntoWords("I have 3 apples", "en-US");
    expect(result).toEqual(["I", "have", "3", "apples"]);
  });

  it("handles Japanese text", () => {
    const result = splitIntoWords("今日は天気です", "ja-JP");
    // Japanese word segmentation
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("今日");
    expect(result).toContain("天気");
  });

  it("handles mixed language text", () => {
    const result = splitIntoWords("Hello 世界", "en-US");
    expect(result).toEqual(["Hello", "世界"]);
  });

  it("handles contractions", () => {
    const result = splitIntoWords("I'm going to the store", "en-US");
    expect(result).toContain("I'm");
    expect(result).toContain("going");
  });

  it("handles hyphenated words", () => {
    const result = splitIntoWords("well-known fact", "en-US");
    // Behavior depends on Intl.Segmenter implementation
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles newlines and tabs", () => {
    const result = splitIntoWords("Hello\nworld\tthere", "en-US");
    expect(result).toEqual(["Hello", "world", "there"]);
  });

  it("filters out non-word-like segments", () => {
    const result = splitIntoWords("...hello...", "en-US");
    expect(result).toEqual(["hello"]);
  });
});
