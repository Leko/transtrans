import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns single class name", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes with object syntax", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo");
  });

  it("handles array of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles undefined and null values", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("handles false and empty string values", () => {
    expect(cn("foo", false, "", "bar")).toBe("foo bar");
  });

  it("merges tailwind classes correctly", () => {
    // Later padding class should override earlier one
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("merges conflicting tailwind classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("preserves non-conflicting tailwind classes", () => {
    expect(cn("p-4", "m-2")).toBe("p-4 m-2");
  });

  it("handles complex combinations", () => {
    expect(
      cn(
        "base-class",
        { conditional: true, disabled: false },
        ["array-class"],
        undefined,
        "final-class"
      )
    ).toBe("base-class conditional array-class final-class");
  });

  it("handles nested arrays", () => {
    expect(cn(["a", ["b", "c"]])).toBe("a b c");
  });

  it("handles mixed clsx and tailwind-merge use case", () => {
    const isActive = true;
    const isDisabled = false;
    expect(
      cn(
        "px-4 py-2",
        { "bg-blue-500": isActive, "bg-gray-500": isDisabled },
        "px-6" // Should override px-4
      )
    ).toBe("py-2 bg-blue-500 px-6");
  });
});
