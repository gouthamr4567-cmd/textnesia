/**
 * Supabase-backed room + message transport.
 *
 * The UI never talks to this directly; RiotProvider uses it so the existing
 * chat screen works across two devices.
 */

import { supabase } from "@/integrations/supabase/client";

import type { PersonalityId } from "../data/personalities";
import type { PunishmentId } from "../data/punishments";
import type { RiotRoom } from "./index";

export interface LiveMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
}

export interface CourtCase {
  eventId: string;
  roomId: string;
  caseNumber: number;
  offenderUserId: string;
  offenderName: string;
  crimeType: string;
  evidence: string;
  severity: number;
  verdict: "GUILTY" | "VERY GUILTY" | "EXTREMELY GUILTY";
  sentence: string;
  punishmentId: PunishmentId;
  timestamp: number;
}

export interface CourtVerdictPayload {
  eventId: string;
  verdict: "GUILTY" | "VERY GUILTY" | "EXTREMELY GUILTY";
  sentence: string;
  offenderUserId: string;
  punishmentId: PunishmentId;
}

export interface RelationshipStockEvent {
  roomId: string;
  eventId: string;
  triggeredByUserId: string;
  triggeredByUserName: string;
  eventType: string;
  reason: string;
  priceChange: number;
  currentPrice: number;
  percentageChange: number;
  timestamp: number;
}

interface RoomRow {
  id: string;
  code: string;
  host_id: string;
  host_name: string;
  host_personality: string;
  guest_id: string | null;
  guest_name: string | null;
  guest_personality: string | null;
  created_at: string;
}

const DEVICE_KEY = "riot-device-id";

export function deviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.sessionStorage.getItem(DEVICE_KEY);
  if (!id) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      id = crypto.randomUUID();
    } else {
      id = "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    }
    window.sessionStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function toRoom(row: RoomRow): RiotRoom {
  return {
    id: row.id,
    code: row.code,
    hostId: row.host_id,
    hostName: row.host_name,
    hostPersonality: row.host_personality as PersonalityId,
    guestId: row.guest_id ?? undefined,
    guestName: row.guest_name ?? undefined,
    guestPersonality: (row.guest_personality as PersonalityId | null) ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function randomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export const liveRooms = {
  async create(hostName: string, hostPersonality: PersonalityId): Promise<RiotRoom> {
    const me = deviceId();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = randomCode();
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          code,
          host_id: me,
          host_name: hostName || "You",
          host_personality: hostPersonality,
        })
        .select()
        .single();
      if (!error && data) return toRoom(data as RoomRow);
      if (error && !error.message.includes("duplicate") && !error.message.includes("unique")) throw error;
    }
    throw new Error("Could not create a room right now. Please try again.");
  },

  async join(code: string, guestName: string, guestPersonality: PersonalityId): Promise<RiotRoom> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) throw new Error("Please enter a room code.");
    const { data, error } = await supabase.rpc("join_room", {
      _code: cleanCode,
      _guest_id: deviceId(),
      _guest_name: guestName || "Guest",
      _guest_personality: guestPersonality,
    });
    if (error) {
      if (error.message.includes("ROOM_FULL")) throw new Error("That riot already has two people.");
      if (error.message.includes("ROOM_NOT_FOUND")) throw new Error("No riot found with that code.");
      throw error;
    }
    return toRoom(data as unknown as RoomRow);
  },

  async get(roomId: string): Promise<RiotRoom | null> {
    const { data, error } = await supabase.from("rooms").select().eq("id", roomId).maybeSingle();
    if (error || !data) return null;
    return toRoom(data as RoomRow);
  },

  async getByCode(code: string): Promise<RiotRoom | null> {
    const { data, error } = await supabase
      .from("rooms")
      .select()
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();
    if (error || !data) return null;
    return toRoom(data as RoomRow);
  },
};

export interface AchievementBroadcastPayload {
  achievementId: string;
  unlockedByUserId: string;
  unlockedByName: string;
  timestamp: number;
}

const activeChannels = new Map<string, ReturnType<typeof supabase.channel>>();

export const liveBroadcast = {
  async unlockAchievement(roomId: string, achievementId: string, unlockedByName: string): Promise<void> {
    const channelName = `riot-room-${roomId}`;
    const channel = activeChannels.get(roomId) ?? supabase.channel(channelName);
    try {
      await channel.send({
        type: "broadcast",
        event: "achievement_unlocked",
        payload: {
          achievementId,
          unlockedByUserId: deviceId(),
          unlockedByName,
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error("[liveBroadcast.unlockAchievement error]", err);
    }
  },

  async sendCourtCase(roomId: string, courtCase: CourtCase): Promise<void> {
    const channelName = `riot-room-${roomId}`;
    const channel = activeChannels.get(roomId) ?? supabase.channel(channelName);
    try {
      await channel.send({
        type: "broadcast",
        event: "court_case",
        payload: {
          courtCase,
        },
      });
    } catch (err) {
      console.error("[liveBroadcast.sendCourtCase error]", err);
    }
  },

  async sendCourtVerdict(roomId: string, verdict: CourtVerdictPayload): Promise<void> {
    const channelName = `riot-room-${roomId}`;
    const channel = activeChannels.get(roomId) ?? supabase.channel(channelName);
    try {
      await channel.send({
        type: "broadcast",
        event: "court_verdict",
        payload: {
          verdict,
        },
      });
    } catch (err) {
      console.error("[liveBroadcast.sendCourtVerdict error]", err);
    }
  },

  async updateStock(roomId: string, stockEvent: RelationshipStockEvent): Promise<void> {
    const channelName = `riot-room-${roomId}`;
    const channel = activeChannels.get(roomId) ?? supabase.channel(channelName);
    try {
      await channel.send({
        type: "broadcast",
        event: "relationship_stock_update",
        payload: {
          stockEvent,
        },
      });
    } catch (err) {
      console.error("[liveBroadcast.updateStock error]", err);
    }
  },
};

export const liveMessages = {
  async list(roomId: string): Promise<LiveMessage[]> {
    const { data, error } = await supabase
      .from("messages")
      .select()
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[liveMessages.list error]", error);
      throw error;
    }
    return (data ?? []) as LiveMessage[];
  },

  async send(roomId: string, senderName: string, text: string): Promise<LiveMessage> {
    const me = deviceId();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        room_id: roomId,
        sender_id: me,
        sender_name: senderName,
        text,
      })
      .select()
      .single();
    if (error) {
      console.error("[liveMessages.send error]", error);
      throw error;
    }
    return data as LiveMessage;
  },

  subscribe(
    roomId: string,
    onMessage: (message: LiveMessage) => void,
    onRoomChange?: (room: RiotRoom) => void,
    onAchievement?: (payload: AchievementBroadcastPayload) => void,
    onCourtCase?: (courtCase: CourtCase) => void,
    onCourtVerdict?: (verdict: CourtVerdictPayload) => void,
    onStockUpdate?: (event: RelationshipStockEvent) => void,
  ) {
    const channelName = `riot-room-${roomId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.new) {
            onMessage(payload.new as LiveMessage);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new) {
            onRoomChange?.(toRoom(payload.new as RoomRow));
          }
        },
      )
      .on("broadcast", { event: "achievement_unlocked" }, ({ payload }) => {
        if (payload && onAchievement) {
          onAchievement(payload as AchievementBroadcastPayload);
        }
      })
      .on("broadcast", { event: "court_case" }, ({ payload }) => {
        if (payload && onCourtCase) {
          const c = (payload as { courtCase: CourtCase }).courtCase;
          if (c) onCourtCase(c);
        }
      })
      .on("broadcast", { event: "court_verdict" }, ({ payload }) => {
        if (payload && onCourtVerdict) {
          const v = (payload as { verdict: CourtVerdictPayload }).verdict;
          if (v) onCourtVerdict(v);
        }
      })
      .on("broadcast", { event: "relationship_stock_update" }, ({ payload }) => {
        if (payload && onStockUpdate) {
          const s = (payload as { stockEvent: RelationshipStockEvent }).stockEvent;
          if (s) onStockUpdate(s);
        }
      })
      .subscribe((status, err) => {
        if (err) {
          console.error(`[Realtime channel ${channelName} error]:`, err);
        }
      });

    activeChannels.set(roomId, channel);

    return () => {
      activeChannels.delete(roomId);
      void supabase.removeChannel(channel);
    };
  },
};
