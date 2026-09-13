export interface MemoryIncident {
  id: string;
  title: string;
  description: string;
  embarrassment: number; // 0-100%
  emotionalDamage: number; // 0-100%
  replayProbability: number; // 0-100%
  deletePriority: "MILD" | "HIGH" | "CRITICAL" | "EXTREME";
  status: "ACTIVE" | "ERASED" | "RESTORED" | "CORRUPTED";
  timestamp: number;
  source: "chat" | "manual";
  rawText: string;
}

export interface MemoryStats {
  created: number;
  erased: number;
  restored: number;
  backupsDetected: number;
  corrupted: number;
}

const MEMORY_STORAGE_KEY = "textnesia-memory-vault";
const MEMORY_STATS_KEY = "textnesia-memory-stats";

export function analyzeMemory(text: string): Omit<MemoryIncident, "id" | "timestamp" | "status" | "source"> {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  let embarrassment = 70;
  let emotionalDamage = 65;
  let replayProbability = 85;
  let title = "THE EMBARRASSING INCIDENT";

  // Monosyllabic disasters
  if (/^(k|kk|ok|hmm|fine|ya|cool)$/i.test(lower)) {
    title = `THE INCIDENT OF "${clean.toUpperCase()}"`;
    embarrassment = 94;
    emotionalDamage = 88;
    replayProbability = 99;
  } else if (lower.includes("crush") || lower.includes("love") || lower.includes("confess") || lower.includes("reject")) {
    title = "THE CRUSH CONFESSION CATASTROPHE";
    embarrassment = 98;
    emotionalDamage = 95;
    replayProbability = 100;
  } else if (lower.includes("teacher") || (lower.includes("mom") && (lower.includes("called") || lower.includes("said")))) {
    title = "THE CLASSROOM MATERNAL INCIDENT";
    embarrassment = 96;
    emotionalDamage = 85;
    replayProbability = 99;
  } else if (lower.includes("wave") || lower.includes("waving")) {
    title = "THE FALSE SALUTATION FIASCO";
    embarrassment = 92;
    emotionalDamage = 75;
    replayProbability = 96;
  } else if (lower.includes("fall") || lower.includes("fell") || lower.includes("tripped") || lower.includes("stage")) {
    title = "THE PUBLIC GRAVITATIONAL COLLAPSE";
    embarrassment = 97;
    emotionalDamage = 89;
    replayProbability = 98;
  } else if (lower.includes("presentation") || lower.includes("interview") || lower.includes("meeting") || lower.includes("class")) {
    title = "THE PUBLIC PERFORMANCE NIGHTMARE";
    embarrassment = 91;
    emotionalDamage = 86;
    replayProbability = 94;
  } else if (lower.includes("birthday") || lower.includes("forgot")) {
    title = "THE SOCIAL OBLIGATION AMNESIA";
    embarrassment = 88;
    emotionalDamage = 90;
    replayProbability = 93;
  } else if (lower.includes("ghost") || lower.includes("left on read") || lower.includes("seen")) {
    title = "THE CHAT DISAPPEARANCE EVENT";
    embarrassment = 89;
    emotionalDamage = 92;
    replayProbability = 96;
  } else if (lower.includes("wrong person") || lower.includes("accidental") || lower.includes("screenshot")) {
    title = "THE WRONG RECIPIENT FIASCO";
    embarrassment = 99;
    emotionalDamage = 97;
    replayProbability = 100;
  } else if (lower.includes("sorry") || lower.includes("my bad")) {
    title = "THE UNNECESSARY APOLOGY PARADE";
    embarrassment = 76;
    emotionalDamage = 70;
    replayProbability = 88;
  } else if (lower.includes("haha") || lower.includes("lol") || lower.includes("lmao")) {
    title = "THE AWKWARD LAUGHTER DEFENSE";
    embarrassment = 82;
    emotionalDamage = 60;
    replayProbability = 90;
  } else if (clean.length < 15) {
    title = `THE BRIEF REGRET: "${clean.slice(0, 15)}"`;
    embarrassment = 86;
    emotionalDamage = 78;
    replayProbability = 92;
  } else {
    const hash = clean.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    embarrassment = 75 + (hash % 24);
    emotionalDamage = 68 + ((hash * 3) % 29);
    replayProbability = 84 + ((hash * 7) % 16);
    title = `THE REGRETTABLE DISPATCH #${(hash % 900) + 100}`;
  }

  let deletePriority: MemoryIncident["deletePriority"] = "HIGH";
  if (embarrassment >= 95 || emotionalDamage >= 90) deletePriority = "EXTREME";
  else if (embarrassment >= 85) deletePriority = "CRITICAL";
  else if (embarrassment <= 75) deletePriority = "MILD";

  return {
    title,
    description: clean,
    embarrassment: Math.min(100, embarrassment),
    emotionalDamage: Math.min(100, emotionalDamage),
    replayProbability: Math.min(100, replayProbability),
    deletePriority,
    rawText: clean,
  };
}

export const memoryService = {
  getAll(): MemoryIncident[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(MEMORY_STORAGE_KEY) || sessionStorage.getItem(MEMORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  save(incident: MemoryIncident): MemoryIncident[] {
    if (typeof window === "undefined") return [incident];
    const current = this.getAll();
    const updated = [incident, ...current.filter((i) => i.id !== incident.id)];
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));
      sessionStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));
      this.bumpStat("created");
    } catch {
      // safe fallback
    }
    return updated;
  },

  updateStatus(id: string, status: MemoryIncident["status"]): MemoryIncident[] {
    if (typeof window === "undefined") return [];
    const current = this.getAll();
    const updated = current.map((item) => (item.id === id ? { ...item, status } : item));
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));
      sessionStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // safe fallback
    }
    return updated;
  },

  getStats(): MemoryStats {
    if (typeof window === "undefined") {
      return { created: 0, erased: 0, restored: 0, backupsDetected: 0, corrupted: 0 };
    }
    try {
      const raw = localStorage.getItem(MEMORY_STATS_KEY);
      return raw ? JSON.parse(raw) : { created: 0, erased: 0, restored: 0, backupsDetected: 0, corrupted: 0 };
    } catch {
      return { created: 0, erased: 0, restored: 0, backupsDetected: 0, corrupted: 0 };
    }
  },

  bumpStat(field: keyof MemoryStats) {
    if (typeof window === "undefined") return;
    try {
      const current = this.getStats();
      current[field] = (current[field] || 0) + 1;
      localStorage.setItem(MEMORY_STATS_KEY, JSON.stringify(current));
    } catch {
      // safe fallback
    }
  },
};
