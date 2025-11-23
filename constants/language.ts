export const LANGUAGE_OPTIONS = [
  { code: "ja-JP", label: "Japanese" },
  { code: "en-US", label: "English" },
] as const;

export type Language = (typeof LANGUAGE_OPTIONS)[number]["code"];
