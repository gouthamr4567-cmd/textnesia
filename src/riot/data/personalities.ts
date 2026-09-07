export type PersonalityId =
  | "dry"
  | "ghoster"
  | "late"
  | "genz"
  | "normal"
  | "overthinker";

export interface Personality {
  id: PersonalityId;
  emoji: string;
  name: string;
  quote: string;
  description: string;
  /** Multiplier applied to generated crime scores for the opponent bot. */
  chaos: number;
  replies: string[];
}

export const PERSONALITIES: Personality[] = [
  {
    id: "dry",
    emoji: "🧊",
    name: "DRY TEXTER",
    quote: "“k”",
    description: "Speaks in single letters. Emotionally comparable to a spreadsheet cell.",
    chaos: 1.4,
    replies: ["k", "ok", "hmm", "ya", "fine", "👍", "cool", "kk"],
  },
  {
    id: "ghoster",
    emoji: "👻",
    name: "PROFESSIONAL GHOSTER",
    quote: "“Seen 3 hours ago.”",
    description: "Reads everything. Answers nothing. Certified in advanced disappearing.",
    chaos: 1.6,
    replies: ["...", "sorry was busy", "oh", "hey", "yeah"],
  },
  {
    id: "late",
    emoji: "🐢",
    name: "LATE REPLIER",
    quote: "“Sorry, just saw this.”",
    description: "Replies in business days. Sometimes in geological eras.",
    chaos: 1.25,
    replies: ["sorry just saw this", "oh my bad", "was asleep", "just woke up", "sorry!!"],
  },
  {
    id: "genz",
    emoji: "🧢",
    name: "GEN-Z OVERLORD",
    quote: "“bro fr ngl 💀”",
    description: "English is optional. Vibes are mandatory.",
    chaos: 1.35,
    replies: ["bro fr ngl 💀", "lowkey cooked", "no cap that's sus", "bet", "delulu behaviour"],
  },
  {
    id: "normal",
    emoji: "❤️",
    name: "NORMAL HUMAN",
    quote: "“Hey! How are you?”",
    description: "Suspiciously functional. Under investigation for being nice.",
    chaos: 0.7,
    replies: [
      "Hey! How are you?",
      "That's actually really interesting, tell me more",
      "Haha that's great 😄",
      "How was your day?",
    ],
  },
  {
    id: "overthinker",
    emoji: "😭",
    name: "OVERTHINKER",
    quote: "“Why did you put a full stop?”",
    description: "Will analyse your punctuation until the sun burns out.",
    chaos: 1.2,
    replies: [
      "why did you put a full stop?",
      "are you mad at me",
      "you replied differently today",
      "ok but what did you MEAN by that",
    ],
  },
];

export const getPersonality = (id: PersonalityId) =>
  PERSONALITIES.find((p) => p.id === id) ?? PERSONALITIES[0];
