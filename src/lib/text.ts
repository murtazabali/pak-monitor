// Small text helpers shared by the tagger, classifier and normalizer.

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-word, case-insensitive, Unicode-aware matcher for a term.
 * Uses letter/number lookarounds (instead of \b) so terms that contain
 * punctuation — e.g. "gulshan-e-iqbal" or "i.i. chundrigar" — still match
 * cleanly without producing substring false positives.
 */
export function wholeWordRegex(term: string): RegExp {
  const e = escapeRegExp(term.trim().toLowerCase());
  return new RegExp(`(?<![\\p{L}\\p{N}])${e}(?![\\p{L}\\p{N}])`, "iu");
}

/** Strip HTML tags + decode the common entities, collapse whitespace. */
export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(s: string, max = 280): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

// Common words ignored when tokenizing for clustering / keyword stats.
const STOPWORDS = new Set(
  ("the a an in on of to for and or with at by from as is are was were be been being after over amid " +
    "says say said new up down out into not no but its his her their our your they them he she it we you " +
    "this that these those will would can could may might has have had do does did than then so if about " +
    "more most other some such only own same also before during under against between off above below " +
    "pakistan pakistani govt government two three amid via per get got")
    .split(" "),
);

/** Significant lowercase tokens from text (letters/numbers, length ≥ 3, no stopwords).
 *  Unicode-aware, so Urdu/Arabic-script words tokenize too. */
export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return matches.filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}
