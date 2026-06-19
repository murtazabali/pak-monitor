import { wholeWordRegex } from "@/lib/text";

export type Sentiment = "pos" | "neg" | "neu";

// Lightweight keyword sentiment — a tone hint, not a true classifier.
const POSITIVE = [
  "win", "wins", "won", "record", "growth", "boost", "surge", "rise", "agreement",
  "signed", "launch", "approves", "approved", "deal", "relief", "recovery", "rescue",
  "wins", "qualifies", "honour", "award", "success", "improves", "gains", "revival",
];
const NEGATIVE = [
  "killed", "dead", "death", "dies", "attack", "blast", "explosion", "crisis", "ban",
  "banned", "arrest", "arrested", "fraud", "scam", "flood", "floods", "crash", "fire",
  "protest", "clash", "injured", "fall", "falls", "loss", "fear", "threat", "collapse",
  "shortage", "strike", "deadly", "violence", "corruption", "terror",
];

const POS_RE = POSITIVE.map(wholeWordRegex);
const NEG_RE = NEGATIVE.map(wholeWordRegex);

export function sentimentOf(text: string): Sentiment {
  let score = 0;
  for (const re of POS_RE) if (re.test(text)) score++;
  for (const re of NEG_RE) if (re.test(text)) score--;
  return score > 0 ? "pos" : score < 0 ? "neg" : "neu";
}
