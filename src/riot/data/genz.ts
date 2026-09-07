export const GENZ_WORDS = [
  "bro",
  "bruh",
  "fr",
  "ngl",
  "idk",
  "imo",
  "rn",
  "sus",
  "slay",
  "bet",
  "no cap",
  "cap",
  "lol",
  "lmao",
  "rizz",
  "cooked",
  "delulu",
  "lowkey",
  "highkey",
  "yeet",
  "vibe",
  "vibes",
  "mid",
  "based",
  "gyat",
  "skibidi",
  "ick",
  "ate",
  "tea",
  "bussin",
];

export const GENZ_HEADLINES = [
  "We may have lost normal English.",
  "Translation services are currently unavailable.",
  "The Oxford dictionary has left the chat.",
  "Linguists have been notified. They are not happy.",
  "This message required 4 context clues and a prayer.",
];

export const DRY_WORDS = ["k", "kk", "ok", "okay", "hmm", "hm", "ya", "yeah", "yep", "fine", "cool", "sure", "nice", "oh", "lol", "👍", "🙂", "."];

export const CONVERSATION_ENDERS = ["k", "ok", "okay", "fine", "cool", "sure", "👍", "kk", "hmm"];

/** Very light moderation layer: only obviously harmful intent is blocked. */
const HARMFUL_PATTERNS: RegExp[] = [
  /\bkill (you|him|her|them|yourself)\b/i,
  /\bi('| a)m going to hurt\b/i,
  /\bkys\b/i,
  /\bsuicide\b/i,
  /\bstab\b/i,
  /\bshoot (you|him|her|them)\b/i,
];

export function isHarmful(text: string) {
  return HARMFUL_PATTERNS.some((r) => r.test(text));
}
