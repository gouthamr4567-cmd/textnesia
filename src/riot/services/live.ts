/**
 * Supabase-backed room + message transport.
 *
 * The UI never talks to this directly; RiotProvider uses it so the existing
 * chat screen works across two devices.
 */

import { supabase } from "@/integrations/supabase/client";

import type { PersonalityId } from "../data/personalities";
import type { RiotRoom } from "./index";

export interface LiveMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
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
      .subscribe((status, err) => {
        if (err) {
          console.error(`[Realtime channel ${channelName} error]:`, err);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
