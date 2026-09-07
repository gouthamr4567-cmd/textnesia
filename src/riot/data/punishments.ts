export type PunishmentId =
  | "pebble"
  | "punch"
  | "hammer"
  | "brick"
  | "rock"
  | "boulder"
  | "geological";

export interface Punishment {
  id: PunishmentId;
  emoji: string;
  label: string;
  /** Screen shake intensity 0-3 */
  impact: number;
  sound: string;
}

export const PUNISHMENTS: Record<PunishmentId, Punishment> = {
  pebble: { id: "pebble", emoji: "🪨", label: "PEBBLE DEPLOYED", impact: 1, sound: "bonk" },
  punch: { id: "punch", emoji: "👊", label: "CARTOON PUNCH", impact: 1.5, sound: "punch" },
  hammer: { id: "hammer", emoji: "🔨", label: "HAMMER SENTENCE", impact: 2, sound: "hammer" },
  brick: { id: "brick", emoji: "🧱", label: "BRICK DEPLOYED", impact: 2.2, sound: "brick" },
  rock: { id: "rock", emoji: "🪨", label: "ROCK DEPLOYED", impact: 2, sound: "bonk" },
  boulder: { id: "boulder", emoji: "🏔️", label: "BOULDER INBOUND", impact: 3, sound: "boulder" },
  geological: {
    id: "geological",
    emoji: "☄️",
    label: "GEOLOGICAL RESPONSE",
    impact: 3,
    sound: "boulder",
  },
};

export const CRIME_LEVELS = [
  { min: 0, max: 30, emoji: "🟢", label: "EMOTIONALLY STABLE", token: "chart-4" },
  { min: 31, max: 60, emoji: "🟡", label: "SLIGHTLY SUSPICIOUS", token: "hazard" },
  { min: 61, max: 80, emoji: "🟠", label: "QUESTIONING LIFE CHOICES", token: "hazard" },
  { min: 81, max: 95, emoji: "🔴", label: "NEEDS SPECIAL SYMPATHY", token: "siren" },
  { min: 96, max: 100, emoji: "💀", label: "BEYOND HUMAN ASSISTANCE", token: "siren" },
] as const;

export function crimeLevel(score: number) {
  return CRIME_LEVELS.find((l) => score >= l.min && score <= l.max) ?? CRIME_LEVELS[0];
}
