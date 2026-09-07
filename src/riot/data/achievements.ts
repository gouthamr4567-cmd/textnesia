export interface AchievementDef {
  id: string;
  emoji: string;
  name: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-blood", emoji: "🥇", name: "FIRST BLOOD", description: "Witness the first “k”." },
  { id: "seen-survivor", emoji: "👀", name: "SEEN SURVIVOR", description: "Survive a Seen crime." },
  { id: "archaeologist", emoji: "🏺", name: "ARCHAEOLOGIST", description: "Endure a late reply." },
  { id: "ghost-hunter", emoji: "👻", name: "PROFESSIONAL GHOST HUNTER", description: "Detect 3 ghostings." },
  { id: "k-collector", emoji: "🪨", name: "K COLLECTOR", description: "Receive 10 “k” replies." },
  { id: "geologist", emoji: "🧑‍🔬", name: "GEOLOGIST", description: "Deploy 10 stones." },
  { id: "relationship-archaeologist", emoji: "🪦", name: "RELATIONSHIP ARCHAEOLOGIST", description: "Revive a dead conversation." },
  { id: "still-here", emoji: "🤡", name: "WHY ARE YOU STILL HERE?", description: "Self-explanatory." },
];
