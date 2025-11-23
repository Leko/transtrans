import { describe, it, expect } from "vitest";
import { takeUntilQuota } from "./use-summary";

function createMockSummarizer(
  inputQuota: number,
  usageMap: Map<string, number> | ((text: string) => number)
) {
  return {
    inputQuota,
    measureInputUsage: async (text: string) => {
      if (typeof usageMap === "function") {
        return usageMap(text);
      }
      return usageMap.get(text) ?? text.length;
    },
  };
}

describe("takeUntilQuota", () => {
  it("returns empty array when texts is empty", async () => {
    const summarizer = createMockSummarizer(100, new Map());
    const result = await takeUntilQuota([], summarizer);

    expect(result.selectedTexts).toEqual([]);
    expect(result.totalUsage).toBe(0);
  });

  it("returns single text when within quota", async () => {
    const usageMap = new Map([["hello", 10]]);
    const summarizer = createMockSummarizer(100, usageMap);
    const result = await takeUntilQuota(["hello"], summarizer);

    expect(result.selectedTexts).toEqual(["hello"]);
    expect(result.totalUsage).toBe(10);
  });

  it("returns empty array when single text exceeds quota", async () => {
    const usageMap = new Map([["hello", 150]]);
    const summarizer = createMockSummarizer(100, usageMap);
    const result = await takeUntilQuota(["hello"], summarizer);

    expect(result.selectedTexts).toEqual([]);
    expect(result.totalUsage).toBe(0);
  });

  it("returns all texts when all within quota", async () => {
    const usageMap = new Map([
      ["first", 20],
      ["second", 30],
      ["third", 40],
    ]);
    const summarizer = createMockSummarizer(100, usageMap);
    const result = await takeUntilQuota(
      ["first", "second", "third"],
      summarizer
    );

    expect(result.selectedTexts).toEqual(["first", "second", "third"]);
    expect(result.totalUsage).toBe(90);
  });

  it("returns only newest texts that fit within quota", async () => {
    const usageMap = new Map([
      ["old", 50],
      ["middle", 40],
      ["newest", 30],
    ]);
    const summarizer = createMockSummarizer(80, usageMap);
    const result = await takeUntilQuota(["old", "middle", "newest"], summarizer);

    // Should include "newest" (30) and "middle" (40) = 70, but not "old" (50) as 70+50=120 > 80
    expect(result.selectedTexts).toEqual(["middle", "newest"]);
    expect(result.totalUsage).toBe(70);
  });

  it("returns texts when exact quota match", async () => {
    const usageMap = new Map([
      ["a", 50],
      ["b", 50],
    ]);
    const summarizer = createMockSummarizer(100, usageMap);
    const result = await takeUntilQuota(["a", "b"], summarizer);

    expect(result.selectedTexts).toEqual(["a", "b"]);
    expect(result.totalUsage).toBe(100);
  });

  it("excludes text that would exceed quota by 1", async () => {
    const usageMap = new Map([
      ["a", 50],
      ["b", 51],
    ]);
    const summarizer = createMockSummarizer(100, usageMap);
    const result = await takeUntilQuota(["a", "b"], summarizer);

    // b (51) fits, a (50) would make it 101 > 100
    expect(result.selectedTexts).toEqual(["b"]);
    expect(result.totalUsage).toBe(51);
  });

  it("handles large number of texts correctly", async () => {
    const texts = Array.from({ length: 100 }, (_, i) => `text${i}`);
    const summarizer = createMockSummarizer(50, () => 10);
    const result = await takeUntilQuota(texts, summarizer);

    // Each text is 10 tokens, quota is 50, so we can fit 5 texts
    // Should be the newest 5: text95, text96, text97, text98, text99
    expect(result.selectedTexts).toEqual([
      "text95",
      "text96",
      "text97",
      "text98",
      "text99",
    ]);
    expect(result.totalUsage).toBe(50);
  });

  it("processes from newest to oldest (reverse order)", async () => {
    const order: string[] = [];
    const summarizer = {
      inputQuota: 100,
      measureInputUsage: async (text: string) => {
        order.push(text);
        return 10;
      },
    };

    await takeUntilQuota(["first", "second", "third"], summarizer);

    // Should process in reverse order: third, second, first
    expect(order).toEqual(["third", "second", "first"]);
  });

  it("maintains original order in result despite reverse processing", async () => {
    const usageMap = new Map([
      ["a", 10],
      ["b", 20],
      ["c", 30],
    ]);
    const summarizer = createMockSummarizer(100, usageMap);
    const result = await takeUntilQuota(["a", "b", "c"], summarizer);

    // Result should maintain original order: a, b, c
    expect(result.selectedTexts).toEqual(["a", "b", "c"]);
  });

  it("stops at first text that exceeds quota", async () => {
    const usageMap = new Map([
      ["a", 10],
      ["b", 100], // This exceeds remaining quota
      ["c", 20],
    ]);
    const summarizer = createMockSummarizer(50, usageMap);
    const result = await takeUntilQuota(["a", "b", "c"], summarizer);

    // c (20) fits, b (100) would exceed, stop here
    expect(result.selectedTexts).toEqual(["c"]);
    expect(result.totalUsage).toBe(20);
  });

  it("handles zero quota", async () => {
    const usageMap = new Map([["a", 1]]);
    const summarizer = createMockSummarizer(0, usageMap);
    const result = await takeUntilQuota(["a"], summarizer);

    expect(result.selectedTexts).toEqual([]);
    expect(result.totalUsage).toBe(0);
  });

  it("handles zero usage text", async () => {
    const usageMap = new Map([
      ["empty", 0],
      ["normal", 50],
    ]);
    const summarizer = createMockSummarizer(100, usageMap);
    const result = await takeUntilQuota(["empty", "normal"], summarizer);

    expect(result.selectedTexts).toEqual(["empty", "normal"]);
    expect(result.totalUsage).toBe(50);
  });
});
