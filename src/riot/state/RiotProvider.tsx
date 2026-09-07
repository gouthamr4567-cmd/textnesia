import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ACHIEVEMENTS } from "../data/achievements";
import { GENZ_HEADLINES, isHarmful } from "../data/genz";
import { getPersonality, type PersonalityId } from "../data/personalities";
import { PUNISHMENTS, type PunishmentId } from "../data/punishments";
import { POLICE_LINES } from "../data/roasts";
import { analyzeMessage, type Analysis } from "../engine/analyzer";
import { roastEngine } from "../engine/roastEngine";
import { soundManager, type SoundId } from "../engine/sound";
import {
  chatService,
  eventService,
  roomService,
  statsService,
  type RiotMessage,
  type RiotRoom,
  type RiotStats,
} from "../services";
import { deviceId, liveMessages, liveRooms, type LiveMessage } from "../services/live";

export type OverlayKind =
  | "alert"
  | "genz"
  | "sympathy"
  | "police"
  | "ghost"
  | "typing"
  | "collapse"
  | "closure";

export interface Overlay {
  id: string;
  kind: OverlayKind;
  title: string;
  body?: string | undefined;
  detail?: string | undefined;
  emoji?: string | undefined;
  ms: number;
}

export interface Projectile {
  id: string;
  emoji: string;
  label: string;
  impact: number;
}

export interface RoastCard {
  id: string;
  text: string;
}

interface RiotContextValue {
  room: RiotRoom | null;
  myName: string;
  personality: PersonalityId;
  opponentName: string;
  messages: RiotMessage[];
  stats: RiotStats;
  analyses: Record<string, Analysis>;
  overlays: Overlay[];
  projectiles: Projectile[];
  roasts: RoastCard[];
  unlocked: string[];
  achievementToast: string | null;
  typingLabel: string | null;
  typingSeconds: number;
  ghostSeconds: number;
  onFire: boolean;
  shake: number;
  soundOn: boolean;
  dead: boolean;
  chaosActive: boolean;
  courtOpen: boolean;
  setCourtOpen: (v: boolean) => void;
  createRoom: (name: string, personality: PersonalityId) => Promise<RiotRoom>;
  joinRoom: (code: string, name: string, personality: PersonalityId) => Promise<RiotRoom>;
  simulatePlayerJoin: () => void;
  setPersonality: (p: PersonalityId) => void;
  sendMessage: (text: string) => Promise<void> | void;
  incomingMessage: (text: string, delayMs?: number) => void;
  simulateSeen: () => void;
  simulateLateReply: () => void;
  simulateGhosting: () => void;
  simulateTypingTorture: () => void;
  triggerGenZ: (sample?: string) => void;
  triggerRedFlags: () => void;
  triggerPolice: () => void;
  triggerChaos: () => void;
  throwLastStone: () => void;
  punish: (
    id: PunishmentId,
    roastText?: string,
    withSympathy?: boolean,
    targetUserId?: string,
  ) => void;
  toggleSound: () => void;
  resetRiot: () => void;
  reviveChat: () => void;
}

const RiotContext = createContext<RiotContextValue | null>(null);

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function RiotProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<RiotRoom | null>(() => {
    if (typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem("riot_room") || window.localStorage.getItem("riot_room");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
    return null;
  });
  const [myName, setMyName] = useState(() => {
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem("riot_my_name") || window.localStorage.getItem("riot_my_name") || "You";
    }
    return "You";
  });
  const [personality, setPersonality] = useState<PersonalityId>(() => {
    if (typeof window !== "undefined") {
      return (window.sessionStorage.getItem("riot_my_personality") || window.localStorage.getItem("riot_my_personality") || "normal") as PersonalityId;
    }
    return "normal";
  });
  const [opponentName, setOpponentName] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem("riot_room") || window.localStorage.getItem("riot_room");
      if (cached) {
        try {
          const r: RiotRoom = JSON.parse(cached);
          const myId = deviceId();
          if (myId === r.hostId) {
            return r.guestName || "Waiting for player...";
          }
          return r.hostName || "Host";
        } catch {
          // ignore
        }
      }
    }
    return "Opponent";
  });
  const [messages, setMessages] = useState<RiotMessage[]>([]);
  const [stats, setStats] = useState<RiotStats>(statsService.empty);
  const [analyses, setAnalyses] = useState<Record<string, Analysis>>({});
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [roasts, setRoasts] = useState<RoastCard[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [achievementToast, setAchievementToast] = useState<string | null>(null);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [typingSeconds, setTypingSeconds] = useState(0);
  const [ghostSeconds, setGhostSeconds] = useState(0);
  const [onFire, setOnFire] = useState(false);
  const [shake, setShake] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [dead, setDead] = useState(false);
  const [chaosActive, setChaosActive] = useState(false);
  const [courtOpen, setCourtOpen] = useState(false);

  const dryStreak = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);

  // Sound manager init & restore saved room session if page was refreshed
  useEffect(() => {
    soundManager.init();
    setSoundOn(soundManager.enabled);

    if (typeof window !== "undefined") {
      const savedRoomId = window.localStorage.getItem("riot_active_room_id");
      const savedName = window.localStorage.getItem("riot_my_name");
      const savedPersonality = window.localStorage.getItem("riot_my_personality") as PersonalityId | null;
      if (savedName) setMyName(savedName);
      if (savedPersonality) setPersonality(savedPersonality);

      if (savedRoomId) {
        liveRooms
          .get(savedRoomId)
          .then((r) => {
            if (r) {
              setRoom(r);
              const myId = deviceId();
              if (myId === r.hostId) {
                setOpponentName(r.guestName || "Waiting for player...");
              } else {
                setOpponentName(r.hostName || "Host");
              }
            }
          })
          .catch((e) => console.error("Error restoring room:", e));
      }
    }

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  // Mock chat service fallback when NOT in a live room
  useEffect(() => {
    if (room?.id) return;
    const unsub = chatService.subscribe(setMessages);
    return () => {
      unsub();
    };
  }, [room?.id]);

  const play = useCallback((id: SoundId) => soundManager.play(id), []);

  const pushOverlay = useCallback(
    (o: Omit<Overlay, "id">) => {
      const overlay: Overlay = { ...o, id: uid() };
      setOverlays((prev) => [...prev, overlay]);
      later(() => setOverlays((prev) => prev.filter((x) => x.id !== overlay.id)), o.ms);
    },
    [later],
  );

  const pushRoast = useCallback(
    (text: string) => {
      const card = { id: uid(), text };
      setRoasts((prev) => [...prev.slice(-3), card]);
      later(() => setRoasts((prev) => prev.filter((r) => r.id !== card.id)), 6500);
    },
    [later],
  );

  const unlock = useCallback(
    (id: string) => {
      setUnlocked((prev) => {
        if (prev.includes(id)) return prev;
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (def) {
          soundManager.play("achievement");
          setAchievementToast(`${def.emoji} ${def.name}`);
          later(() => setAchievementToast(null), 3200);
        }
        return [...prev, id];
      });
    },
    [later],
  );

  const bumpCrime = useCallback((patch: Partial<RiotStats>, marketDelta: number) => {
    setStats((prev) => statsService.pushMarket(statsService.bump(prev, patch), marketDelta));
  }, []);

  const punish = useCallback(
    (
      id: PunishmentId,
      roastText?: string,
      withSympathy = false,
      targetUserId?: string,
    ) => {
      const myId = deviceId();
      const target = targetUserId ?? myId;
      const isTarget = target === myId;

      // On each client, trigger the physical punishment only when the event target matches the current user's ID
      if (isTarget) {
        const p = PUNISHMENTS[id];
        const projectile: Projectile = { id: uid(), emoji: p.emoji, label: p.label, impact: p.impact };
        setProjectiles((prev) => [...prev, projectile]);
        later(() => {
          play(p.sound as SoundId);
          setShake(p.impact);
          later(() => setShake(0), 420);
        }, 520);
        later(() => setProjectiles((prev) => prev.filter((x) => x.id !== projectile.id)), 1600);
      }

      const patch: Partial<RiotStats> =
        id === "brick"
          ? { bricks: 1 }
          : id === "boulder" || id === "geological"
            ? { boulders: 1 }
            : { stones: 1 };
      bumpCrime(patch, -3);

      if (roastText) later(() => pushRoast(roastText), 1100);
      if (withSympathy) {
        later(
          () =>
            pushOverlay({
              kind: "sympathy",
              title: "❤️ SPECIAL SYMPATHY™",
              body: roastEngine.sympathy(),
              ms: 4200,
            }),
          2100,
        );
      }
      eventService.publish("punishment", {
        id,
        targetUserId: target,
        offenderUserId: target,
      });
      setStats((s) => {
        if (s.stones + 1 >= 10) unlock("geologist");
        return s;
      });
    },
    [bumpCrime, later, play, pushOverlay, pushRoast, unlock],
  );

  /* ---------------------------- message handling --------------------------- */

  const registerAnalysis = useCallback((msg: RiotMessage, analysis: Analysis) => {
    setAnalyses((prev) => ({ ...prev, [msg.id]: analysis }));
  }, []);

  const reactToDryness = useCallback(
    (analysis: Analysis, offenderUserId?: string) => {
      const target = offenderUserId ?? deviceId();
      if (analysis.isK) {
        bumpCrime({ crime: 14, kOffences: 1, redFlags: 1 }, -9);
        unlock("first-blood");
        play("scratch");
        pushOverlay({ kind: "alert", title: "🚨 “K” DETECTED", emoji: "🪨", ms: 1500 });
        later(() => punish("pebble", roastEngine.roast("k"), true, target), 900);
        return;
      }
      if (analysis.isHmm) {
        bumpCrime({ crime: 10, redFlags: 1 }, -6);
        pushOverlay({ kind: "alert", title: "🚨 LOW EFFORT DETECTED", emoji: "👊", ms: 1400 });
        later(() => punish("punch", roastEngine.roast("dry"), false, target), 800);
        return;
      }
      if (analysis.dryness > 62) {
        dryStreak.current += 1;
        bumpCrime({ crime: 8, redFlags: dryStreak.current >= 2 ? 1 : 0 }, -5);
        pushOverlay({ kind: "alert", title: "🧊 DRY REPLY DETECTED", emoji: "🪨", ms: 1300 });
        later(
          () =>
            punish(
              dryStreak.current >= 2 ? "rock" : "pebble",
              roastEngine.roast("dry"),
              dryStreak.current >= 3,
              target,
            ),
          800,
        );
      } else {
        dryStreak.current = 0;
        bumpCrime({ crime: -4 }, +6);
      }
    },
    [bumpCrime, later, play, punish, pushOverlay, unlock],
  );

  const triggerGenZ = useCallback(
    (sample = "bro fr ngl 💀") => {
      play("scratch");
      bumpCrime({ crime: 7, genzViolations: 1 }, -4);
      pushOverlay({
        kind: "genz",
        title: "🧢 GEN-Z DETECTED",
        body: `“${sample}”`,
        detail: GENZ_HEADLINES[Math.floor(Math.random() * GENZ_HEADLINES.length)] as string,
        ms: 3000,
      });
      later(() => pushRoast(roastEngine.roast("genz")), 1800);
    },
    [bumpCrime, later, play, pushOverlay, pushRoast],
  );

  // Subscribe to live Supabase messages and room changes when in a live room
  useEffect(() => {
    if (!room?.id) return;

    const myId = deviceId();

    // Fetch existing messages from Supabase
    liveMessages
      .list(room.id)
      .then((serverMsgs) => {
        const converted: RiotMessage[] = serverMsgs.map((m) => ({
          id: m.id,
          author: m.sender_id === myId ? "me" : "them",
          text: m.text,
          at: new Date(m.created_at).getTime(),
        }));
        setMessages(converted);

        const nextAnalyses: Record<string, Analysis> = {};
        converted.forEach((m) => {
          nextAnalyses[m.id] = analyzeMessage({ text: m.text });
        });
        setAnalyses((prev) => ({ ...prev, ...nextAnalyses }));
      })
      .catch((err) => {
        console.error("[liveMessages.list error]", err);
      });

    // Realtime subscription
    const unsub = liveMessages.subscribe(
      room.id,
      (liveMsg: LiveMessage) => {
        const isMine = liveMsg.sender_id === myId;
        const newMsg: RiotMessage = {
          id: liveMsg.id,
          author: isMine ? "me" : "them",
          text: liveMsg.text,
          at: new Date(liveMsg.created_at).getTime(),
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === liveMsg.id)) return prev;
          return [...prev, newMsg];
        });

        const analysis = analyzeMessage({ text: liveMsg.text, dryStreak: dryStreak.current });
        setAnalyses((prev) => ({ ...prev, [liveMsg.id]: analysis }));

        if (!isMine) {
          setDead(false);
          play("message");

          if (analysis.isK) {
            bumpCrime({ kOffences: 1, crime: 14, redFlags: 1 }, -9);
            unlock("first-blood");
            play("scratch");
            pushOverlay({ kind: "alert", title: "🚨 “K” DETECTED", emoji: "🪨", ms: 1500 });
            later(() => punish("pebble", roastEngine.roast("k"), true, liveMsg.sender_id), 900);
          } else if (analysis.isHmm) {
            bumpCrime({ crime: 10, redFlags: 1 }, -6);
            pushOverlay({ kind: "alert", title: "🚨 LOW EFFORT DETECTED", emoji: "👊", ms: 1400 });
            later(() => punish("punch", roastEngine.roast("dry"), false, liveMsg.sender_id), 800);
          } else if (analysis.dryness > 62) {
            dryStreak.current += 1;
            bumpCrime({ crime: 8, redFlags: dryStreak.current >= 2 ? 1 : 0 }, -5);
            pushOverlay({ kind: "alert", title: "🧊 DRY REPLY DETECTED", emoji: "🪨", ms: 1300 });
            later(
              () =>
                punish(
                  dryStreak.current >= 2 ? "rock" : "pebble",
                  roastEngine.roast("dry"),
                  dryStreak.current >= 3,
                  liveMsg.sender_id,
                ),
              800,
            );
          } else {
            dryStreak.current = 0;
            bumpCrime({ crime: -4 }, +6);
          }

          if (analysis.genzWords.length) {
            later(() => triggerGenZ(liveMsg.text), 400);
          }
        }
      },
      (updatedRoom: RiotRoom) => {
        setRoom(updatedRoom);
        if (myId === updatedRoom.hostId) {
          if (updatedRoom.guestName) {
            setOpponentName(updatedRoom.guestName);
            soundManager.play("achievement");
            pushOverlay({
              kind: "alert",
              title: "💥 OPPONENT JOINED!",
              body: `${updatedRoom.guestName} has entered the riot!`,
              emoji: "🥊",
              ms: 3000,
            });
          }
        } else if (myId === updatedRoom.guestId) {
          if (updatedRoom.hostName) {
            setOpponentName(updatedRoom.hostName);
          }
        }
      },
    );

    return () => {
      unsub();
    };
  }, [room?.id, bumpCrime, later, play, punish, pushOverlay, triggerGenZ, unlock]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (isHarmful(trimmed)) {
        pushOverlay({
          kind: "alert",
          title: "🛡️ MODERATION",
          body: "REPLY RIOT roasts texting habits, not people. That message was not delivered.",
          ms: 3600,
        });
        return;
      }
      setDead(false);
      play("message");

      if (room?.id) {
        // REAL ROOM MODE (Supabase)
        try {
          const liveMsg = await liveMessages.send(room.id, myName, trimmed);
          const msg: RiotMessage = {
            id: liveMsg.id,
            author: "me",
            text: trimmed,
            at: new Date(liveMsg.created_at).getTime(),
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === liveMsg.id)) return prev;
            return [...prev, msg];
          });
          const analysis = analyzeMessage({ text: trimmed, dryStreak: dryStreak.current });
          registerAnalysis(msg, analysis);
          if (analysis.genzWords.length) {
            unlock("still-here");
            later(() => triggerGenZ(trimmed), 500);
          }
          reactToDryness(analysis, deviceId());
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : "Could not deliver message.";
          console.error("Failed to send message to Supabase:", err);
          pushOverlay({
            kind: "alert",
            title: "⚠️ MESSAGE FAILED",
            body: errMsg,
            ms: 3000,
          });
        }
        return;
      }

      // LOCAL / DEMO MODE (Fallback when not in a Supabase room)
      const msg = chatService.send({ author: "me", text: trimmed });
      const analysis = analyzeMessage({ text: trimmed, dryStreak: dryStreak.current });
      registerAnalysis(msg, analysis);
      if (analysis.genzWords.length) {
        unlock("still-here");
        later(() => triggerGenZ(trimmed), 500);
      }
      reactToDryness(analysis, deviceId());
    },
    [
      bumpCrime,
      later,
      myName,
      opponentName,
      play,
      punish,
      pushOverlay,
      reactToDryness,
      registerAnalysis,
      room,
      triggerGenZ,
      unlock,
    ],
  );

  const incomingMessage = useCallback(
    (text: string, delayMs = 0) => {
      const msg = chatService.send({ author: "them", text, delayMs });
      const analysis = analyzeMessage({ text, delayMs, dryStreak: dryStreak.current });
      registerAnalysis(msg, analysis);
      play("message");
      if (analysis.isK) {
        bumpCrime({ kOffences: 1, crime: 12, redFlags: 1 }, -9);
        unlock("first-blood");
        pushOverlay({ kind: "alert", title: "🚨 “K” DETECTED", emoji: "🪨", ms: 1500 });
        later(() => punish("pebble", roastEngine.roast("k"), true), 900);
      } else if (analysis.isHmm) {
        bumpCrime({ crime: 9 }, -5);
        pushOverlay({ kind: "alert", title: "🚨 “HMM” DETECTED", emoji: "👊", ms: 1400 });
        later(() => punish("punch", roastEngine.roast("dry")), 800);
      } else if (analysis.genzWords.length) {
        later(() => triggerGenZ(text), 400);
      }
    },
    [bumpCrime, later, play, punish, pushOverlay, registerAnalysis, triggerGenZ, unlock],
  );

  /* ------------------------------- scenarios ------------------------------- */

  const triggerPolice = useCallback(() => {
    play("siren");
    pushOverlay({
      kind: "police",
      title: "🚨 STONE POLICE HAS ARRIVED",
      body: POLICE_LINES[Math.floor(Math.random() * POLICE_LINES.length)] as string,
      detail: "Suspect has been sentenced to geological consequences.",
      ms: 3600,
    });
    later(() => punish("rock", roastEngine.roast("chaos")), 2200);
  }, [later, play, punish, pushOverlay]);

  const simulateSeen = useCallback(() => {
    chatService.markAllSeen();
    play("siren");
    bumpCrime({ crime: 15, seenCrimes: 1, redFlags: 1 }, -11);
    unlock("seen-survivor");
    pushOverlay({
      kind: "police",
      title: "🚨 CYBER CRIME DETECTED 🚨",
      body: "We have received a report of unauthorized emotional damage.",
      detail: "🚔 👮 Stone Police dispatched.",
      ms: 3400,
    });
    later(() => punish("hammer", roastEngine.roast("seen"), true), 2000);
  }, [bumpCrime, later, play, punish, pushOverlay, unlock]);

  const simulateLateReply = useCallback(() => {
    bumpCrime({ crime: 11, lateReplies: 1 }, -7);
    unlock("archaeologist");
    const fourDays = 4 * 24 * 60 * 60 * 1000;
    const msg = chatService.send({
      author: "them",
      text: "sorry just saw this",
      delayMs: fourDays,
    });
    registerAnalysis(msg, analyzeMessage({ text: "sorry just saw this", delayMs: fourDays }));
    pushOverlay({
      kind: "alert",
      title: "🐢 LATE REPLY DETECTED",
      body: "Delay: 4 business days",
      emoji: "🧱",
      ms: 2000,
    });
    later(() => punish("brick", roastEngine.roast("late"), true), 1200);
  }, [bumpCrime, later, punish, pushOverlay, registerAnalysis, unlock]);

  const simulateGhosting = useCallback(() => {
    setGhostSeconds(0);
    play("horror");
    let s = 0;
    const iv = setInterval(() => {
      s += 10;
      setGhostSeconds(s);
      if (s >= 60) clearInterval(iv);
    }, 700);
    later(() => {
      clearInterval(iv);
      setGhostSeconds(0);
      setOnFire(true);
      bumpCrime({ crime: 22, ghostings: 1, redFlags: 2 }, -20);
      setStats((st) => {
        if (st.ghostings + 1 >= 3) unlock("ghost-hunter");
        return st;
      });
      pushOverlay({
        kind: "ghost",
        title: "👻 GHOSTING DETECTED",
        body: "Profile has caught cartoon fire 🔥🔥🔥",
        ms: 3000,
      });
      later(() => punish("punch"), 1400);
      later(() => punish("boulder", roastEngine.roast("ghost"), true), 2600);
      later(() => setOnFire(false), 6500);
      later(() => setDead(true), 7000);
    }, 4600);
  }, [bumpCrime, later, play, punish, pushOverlay, unlock]);

  const simulateTypingTorture = useCallback(() => {
    const marks = [10, 30, 60, 120];
    setTypingSeconds(0);
    setTypingLabel(`${opponentName} is typing...`);
    marks.forEach((m, i) => later(() => setTypingSeconds(m), 700 * (i + 1)));
    later(() => {
      setTypingLabel(null);
      setTypingSeconds(0);
      incomingMessage("ok");
      play("scratch");
      pushOverlay({
        kind: "typing",
        title: "TWO MINUTES.",
        body: "FOR “OK”?! 😭",
        ms: 2800,
      });
      later(() => punish("brick", roastEngine.roast("typing"), true), 1500);
      bumpCrime({ crime: 12, redFlags: 1 }, -8);
    }, 3400);
  }, [bumpCrime, incomingMessage, later, opponentName, play, punish, pushOverlay]);

  const triggerRedFlags = useCallback(() => {
    play("bonk");
    bumpCrime({ crime: 10, redFlags: 3 }, -6);
    pushOverlay({
      kind: "alert",
      title: "🚩🚩🚩🚩🚩 RED FLAGS",
      body: "PROFILE SUCCESSFULLY CONVERTED INTO A POLITICAL RALLY",
      detail: "(Entirely fictional. No actual politics were involved.)",
      ms: 3000,
    });
  }, [bumpCrime, play, pushOverlay]);

  const throwLastStone = useCallback(() => {
    punish("geological", "FOR CLOSURE.");
    pushOverlay({ kind: "closure", title: "☄️ FOR CLOSURE.", ms: 3000 });
  }, [punish, pushOverlay]);

  const triggerChaos = useCallback(() => {
    setChaosActive(true);
    const steps: [number, () => void][] = [
      [0, () => simulateSeen()],
      [1200, () => triggerRedFlags()],
      [2200, () => triggerGenZ("bro fr ngl 💀 lowkey cooked")],
      [3200, () => triggerPolice()],
      [4200, () => punish("pebble", roastEngine.roast("dry"))],
      [5000, () => punish("brick", roastEngine.roast("chaos"))],
      [5800, () => punish("hammer")],
      [6400, () => setOnFire(true)],
      [6600, () => punish("boulder", roastEngine.roast("ghost"))],
      [7400, () => bumpCrime({ crime: 60, ghostings: 1, redFlags: 3 }, -45)],
      [
        8200,
        () => {
          play("sting");
          pushOverlay({ kind: "collapse", title: "COMMUNICATION HAS COLLAPSED", ms: 3200 });
        },
      ],
      [
        11200,
        () =>
          pushOverlay({
            kind: "sympathy",
            title: "❤️ SPECIAL SYMPATHY™",
            body: "You tried. They ghosted. We threw rocks.",
            ms: 4000,
          }),
      ],
      [
        15000,
        () => {
          setOnFire(false);
          setDead(true);
          setChaosActive(false);
          pushOverlay({
            kind: "collapse",
            title: "YOU SHOULD MOVE ON, YOU IDIOT 😂",
            body: "Tap “THROW ONE LAST STONE” for closure.",
            ms: 4500,
          });
        },
      ],
    ];
    steps.forEach(([ms, fn]) => later(fn, ms));
  }, [
    bumpCrime,
    later,
    play,
    punish,
    pushOverlay,
    simulateSeen,
    triggerGenZ,
    triggerPolice,
    triggerRedFlags,
  ]);

  /* ------------------------------- lifecycle ------------------------------- */

  const createRoom = useCallback(async (name: string, p: PersonalityId) => {
    const cleanName = name.trim() || "Host";
    const r = await liveRooms.create(cleanName, p);
    setRoom(r);
    setMyName(cleanName);
    setPersonality(p);
    setOpponentName("Waiting for player...");
    setMessages([]);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("riot_room", JSON.stringify(r));
      window.sessionStorage.setItem("riot_active_room_id", r.id!);
      window.sessionStorage.setItem("riot_my_name", cleanName);
      window.sessionStorage.setItem("riot_my_personality", p);
      window.localStorage.setItem("riot_room", JSON.stringify(r));
      window.localStorage.setItem("riot_active_room_id", r.id!);
      window.localStorage.setItem("riot_my_name", cleanName);
      window.localStorage.setItem("riot_my_personality", p);
    }
    return r;
  }, []);

  const joinRoom = useCallback(async (code: string, name: string, p: PersonalityId) => {
    const cleanName = name.trim() || "Guest";
    const cleanCode = code.trim().toUpperCase();
    const r = await liveRooms.join(cleanCode, cleanName, p);
    setRoom(r);
    setMyName(cleanName);
    setPersonality(p);
    setOpponentName(r.hostName || "Host");
    setMessages([]);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("riot_room", JSON.stringify(r));
      window.sessionStorage.setItem("riot_active_room_id", r.id!);
      window.sessionStorage.setItem("riot_my_name", cleanName);
      window.sessionStorage.setItem("riot_my_personality", p);
      window.localStorage.setItem("riot_room", JSON.stringify(r));
      window.localStorage.setItem("riot_active_room_id", r.id!);
      window.localStorage.setItem("riot_my_name", cleanName);
      window.localStorage.setItem("riot_my_personality", p);
    }
    return r;
  }, []);

  const simulatePlayerJoin = useCallback(() => {
    if (!room?.id) {
      setRoom((prev) => (prev ? roomService.simulatePlayerJoin(prev) : prev));
      soundManager.play("achievement");
    }
  }, [room?.id]);

  const resetRiot = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    chatService.reset();
    setRoom(null);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("riot_room");
      window.sessionStorage.removeItem("riot_active_room_id");
      window.localStorage.removeItem("riot_room");
      window.localStorage.removeItem("riot_active_room_id");
    }
    setStats(statsService.empty());
    setMessages([]);
    setAnalyses({});
    setOverlays([]);
    setProjectiles([]);
    setRoasts([]);
    setDead(false);
    setOnFire(false);
    setChaosActive(false);
    dryStreak.current = 0;
  }, []);

  const reviveChat = useCallback(() => {
    setDead(false);
    unlock("relationship-archaeologist");
    incomingMessage("hey... you still there?");
    setStats((s) => statsService.pushMarket({ ...s, crime: Math.max(0, s.crime - 20) }, 18));
  }, [incomingMessage, unlock]);

  const toggleSound = useCallback(() => {
    const next = !soundManager.enabled;
    soundManager.setEnabled(next);
    setSoundOn(next);
    if (next) soundManager.play("ui");
  }, []);

  // Dead chat detection: 45s of silence in an active riot.
  useEffect(() => {
    if (!messages.length) return;
    const t = setTimeout(() => {
      setDead(true);
      soundManager.play("piano");
    }, 45000);
    return () => clearTimeout(t);
  }, [messages]);

  const value = useMemo<RiotContextValue>(
    () => ({
      room,
      myName,
      personality,
      opponentName,
      messages,
      stats,
      analyses,
      overlays,
      projectiles,
      roasts,
      unlocked,
      achievementToast,
      typingLabel,
      typingSeconds,
      ghostSeconds,
      onFire,
      shake,
      soundOn,
      dead,
      chaosActive,
      courtOpen,
      setCourtOpen,
      createRoom,
      joinRoom,
      simulatePlayerJoin,
      setPersonality,
      sendMessage,
      incomingMessage,
      simulateSeen,
      simulateLateReply,
      simulateGhosting,
      simulateTypingTorture,
      triggerGenZ,
      triggerRedFlags,
      triggerPolice,
      triggerChaos,
      throwLastStone,
      punish,
      toggleSound,
      resetRiot,
      reviveChat,
    }),
    [
      achievementToast,
      analyses,
      chaosActive,
      courtOpen,
      createRoom,
      dead,
      ghostSeconds,
      incomingMessage,
      joinRoom,
      messages,
      myName,
      onFire,
      opponentName,
      overlays,
      personality,
      projectiles,
      punish,
      resetRiot,
      reviveChat,
      roasts,
      room,
      sendMessage,
      shake,
      simulateGhosting,
      simulateLateReply,
      simulatePlayerJoin,
      simulateSeen,
      simulateTypingTorture,
      soundOn,
      stats,
      throwLastStone,
      toggleSound,
      triggerChaos,
      triggerGenZ,
      triggerPolice,
      triggerRedFlags,
      typingLabel,
      typingSeconds,
      unlocked,
    ],
  );

  return <RiotContext.Provider value={value}>{children}</RiotContext.Provider>;
}

export function useRiot() {
  const ctx = useContext(RiotContext);
  if (!ctx) throw new Error("useRiot must be used inside <RiotProvider>");
  return ctx;
}
