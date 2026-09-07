/**
 * Service abstraction layer.
 *
 * Every screen talks to these interfaces only. Today they are backed by
 * local/mock implementations; later a Supabase realtime implementation can be
 * dropped in behind the same interfaces without touching the UI.
 */

import type { PersonalityId } from "../data/personalities";

export interface RiotMessage {
  id: string;
  author: "me" | "them" | "system";
  text: string;
  at: number;
  seen?: boolean;
  delayMs?: number;
}

export interface RiotRoom {
  id?: string | undefined;
  code: string;
  hostId?: string | undefined;
  hostName: string;
  hostPersonality: PersonalityId;
  guestId?: string | undefined;
  guestName?: string | undefined;
  guestPersonality?: PersonalityId | undefined;
  createdAt: number;
}

export interface RiotStats {
  crime: number;
  kOffences: number;
  ghostings: number;
  seenCrimes: number;
  lateReplies: number;
  genzViolations: number;
  stones: number;
  bricks: number;
  boulders: number;
  redFlags: number;
  market: number[];
}

export interface RiotEvent {
  id: string;
  type: string;
  payload?: Record<string, unknown> | undefined;
  at: number;
}

type Listener<T> = (value: T) => void;

function randomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/* ------------------------------ roomService ------------------------------ */

export const roomService = {
  createRoom(hostName: string, hostPersonality: PersonalityId): RiotRoom {
    return {
      code: randomCode(),
      hostName: hostName || "You",
      hostPersonality,
      createdAt: Date.now(),
    };
  },
  joinRoom(code: string, guestName: string, guestPersonality: PersonalityId): RiotRoom {
    return {
      code: code.toUpperCase(),
      hostName: "Rahul",
      hostPersonality: "dry",
      guestName: guestName || "You",
      guestPersonality,
      createdAt: Date.now(),
    };
  },
  /** Mock: pretends a second player connects. */
  simulatePlayerJoin(room: RiotRoom, name = "Rahul"): RiotRoom {
    return { ...room, guestName: name, guestPersonality: "dry" };
  },
};

/* ------------------------------ chatService ------------------------------ */

class MockChatService {
  private messages: RiotMessage[] = [];
  private listeners = new Set<Listener<RiotMessage[]>>();

  subscribe(fn: Listener<RiotMessage[]>) {
    this.listeners.add(fn);
    fn(this.messages);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snapshot = [...this.messages];
    this.listeners.forEach((l) => l(snapshot));
  }

  send(msg: Omit<RiotMessage, "id" | "at"> & { at?: number }): RiotMessage {
    const full: RiotMessage = {
      ...msg,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: msg.at ?? Date.now(),
    };
    this.messages = [...this.messages, full];
    this.emit();
    return full;
  }

  markAllSeen() {
    this.messages = this.messages.map((m) => (m.author === "me" ? { ...m, seen: true } : m));
    this.emit();
  }

  reset() {
    this.messages = [];
    this.emit();
  }

  all() {
    return this.messages;
  }
}

export const chatService = new MockChatService();

/* ----------------------------- eventService ------------------------------ */

class MockEventService {
  private listeners = new Set<Listener<RiotEvent>>();

  subscribe(fn: Listener<RiotEvent>) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  publish(type: string, payload?: Record<string, unknown>) {
    const evt: RiotEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      at: Date.now(),
    };
    this.listeners.forEach((l) => l(evt));
    return evt;
  }
}

export const eventService = new MockEventService();

/* ----------------------------- statsService ------------------------------ */

export const emptyStats = (): RiotStats => ({
  crime: 0,
  kOffences: 0,
  ghostings: 0,
  seenCrimes: 0,
  lateReplies: 0,
  genzViolations: 0,
  stones: 0,
  bricks: 0,
  boulders: 0,
  redFlags: 0,
  market: [100, 104, 101, 108, 112],
});

export const statsService = {
  empty: emptyStats,
  bump(stats: RiotStats, patch: Partial<RiotStats>): RiotStats {
    const next = { ...stats };
    (Object.keys(patch) as (keyof RiotStats)[]).forEach((key) => {
      if (key === "market") return;
      const delta = patch[key] as number;
      next[key] = (next[key] as number) + delta;
    });
    next.crime = Math.max(0, Math.min(100, next.crime));
    next.redFlags = Math.min(8, next.redFlags);
    return next;
  },
  pushMarket(stats: RiotStats, delta: number): RiotStats {
    const last = stats.market[stats.market.length - 1] ?? 100;
    const point = Math.max(2, Math.round(last + delta));
    return { ...stats, market: [...stats.market, point].slice(-28) };
  },
};
