import { CONVERSATION_ENDERS, DRY_WORDS, GENZ_WORDS } from "../data/genz";

export interface Analysis {
  dryness: number; // 0-100
  genz: number; // 0-100
  genzWords: string[];
  lateness: number; // 0-100
  ghosting: number; // 0-100
  redFlags: number; // 0-6
  isK: boolean;
  isHmm: boolean;
  effort: number; // 0-100
  emotion: number; // 0-100
  contribution: number; // 0-100
  suspicion: number; // 0-100
  verdict: string;
}

export interface AnalyzeInput {
  text: string;
  /** ms since previous message from the other side */
  delayMs?: number;
  /** how many consecutive dry replies preceded this one */
  dryStreak?: number;
  /** ms of simulated inactivity */
  inactivityMs?: number;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function analyzeMessage({
  text,
  delayMs = 0,
  dryStreak = 0,
  inactivityMs = 0,
}: AnalyzeInput): Analysis {
  const raw = text.trim();
  const lower = raw.toLowerCase();
  const stripped = lower.replace(/[.!?,]/g, "").trim();
  const words = stripped.split(/\s+/).filter(Boolean);

  // ---- Dryness ----
  let dryness = 0;
  if (raw.length <= 2) dryness += 55;
  else if (raw.length <= 5) dryness += 38;
  else if (raw.length <= 12) dryness += 20;
  else if (raw.length > 60) dryness -= 15;

  if (DRY_WORDS.includes(stripped)) dryness += 30;
  if (words.length <= 2) dryness += 12;
  if (!raw.includes("?")) dryness += 8;
  if (CONVERSATION_ENDERS.includes(stripped)) dryness += 12;
  if (/^(k|kk)$/.test(stripped)) dryness += 20;
  dryness += Math.min(25, dryStreak * 8);
  if (/[😂🤣❤️😍🥺😄]/.test(raw)) dryness -= 12;
  if (words.length > 12) dryness -= 20;
  dryness = clamp(dryness);

  // ---- Gen-Z ----
  const genzWords = GENZ_WORDS.filter((w) =>
    w.includes(" ") ? lower.includes(w) : words.includes(w),
  );
  const genz = clamp(genzWords.length * 26 + (/💀|🔥|😭/.test(raw) ? 18 : 0));

  // ---- Lateness ----
  const mins = delayMs / 60000;
  const lateness = clamp(mins <= 1 ? mins * 12 : 12 + Math.log2(mins) * 22);

  // ---- Ghosting ----
  const ghostMins = inactivityMs / 60000;
  const ghosting = clamp(ghostMins * 55);

  // ---- Red flags ----
  const offences = [
    dryness > 60,
    genz > 50,
    lateness > 50,
    ghosting > 40,
    dryStreak >= 2,
    CONVERSATION_ENDERS.includes(stripped),
  ].filter(Boolean).length;

  const effort = clamp(Math.min(100, raw.length * 2.2) - dryness * 0.4);
  const emotion = clamp(
    (/[!?]/.test(raw) ? 25 : 0) +
      (/[😂🤣❤️😍🥺😄😅🙏]/.test(raw) ? 35 : 0) +
      Math.min(30, words.length * 3) -
      dryness * 0.5,
  );
  const contribution = clamp((raw.includes("?") ? 45 : 0) + Math.min(45, words.length * 4) - dryness * 0.5);
  const suspicion = clamp(dryness * 0.7 + genz * 0.2 + lateness * 0.2 + (offences > 2 ? 15 : 0));

  return {
    dryness,
    genz,
    genzWords,
    lateness,
    ghosting,
    redFlags: offences,
    isK: /^(k|kk)$/.test(stripped),
    isHmm: /^(hmm+|hm)$/.test(stripped),
    effort,
    emotion,
    contribution,
    suspicion,
    verdict:
      suspicion > 85
        ? "HIGHLY SUSPICIOUS"
        : suspicion > 60
          ? "SUSPICIOUS"
          : suspicion > 35
            ? "MILDLY CONCERNING"
            : "SURPRISINGLY INNOCENT",
  };
}
