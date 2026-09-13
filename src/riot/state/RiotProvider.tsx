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
import { memoryService, analyzeMemory, type MemoryIncident, type MemoryStats } from "../services/memoryService";
import {
  chatService,
  eventService,
  roomService,
  statsService,
  type RiotMessage,
  type RiotRoom,
  type RiotStats,
} from "../services";
import {
  deviceId,
  liveBroadcast,
  liveMessages,
  liveRooms,
  type AchievementBroadcastPayload,
  type CourtCase,
  type CourtVerdictPayload,
  type LiveMessage,
  type RelationshipStockEvent,
} from "../services/live";

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

export interface AchievementToastData {
  id: string;
  name: string;
  emoji: string;
  roast: string;
  unlockedBy?: string | undefined;
  isPeer?: boolean | undefined;
}

export interface PunishmentRecord {
  id: string;
  punishmentId: PunishmentId;
  targetUserId: string;
  targetUserName: string;
  timestamp: number;
}

export interface FinalReportData {
  totalMessages: number;
  myMessages: number;
  opponentMessages: number;
  mostUsedShortReply: string;
  dryMessagesCount: number;
  myDryCount: number;
  opponentDryCount: number;
  suspiciousCount: number;
  totalCrimes: number;
  myCrimes: number;
  opponentCrimes: number;
  mostCommonCrime: string;
  worstOffense: string;
  totalPunishments: number;
  myPunishments: number;
  opponentPunishments: number;
  mostBrutalPunishment: string;
  totalCourtCases: number;
  guiltyVerdicts: number;
  myConvictions: number;
  opponentConvictions: number;
  mostSeriousCase: CourtCase | null;
  convictionRate: number;
  startPrice: number;
  currentPrice: number;
  peakPrice: number;
  troughPrice: number;
  netChange: number;
  percentageChange: number;
  marketEventsCount: number;
  biggestCrash: RelationshipStockEvent | null;
  biggestRecovery: RelationshipStockEvent | null;
  marketStatusTier: string;
  unlockedCount: number;
  unlockedAchievements: Array<{ id: string; name: string; emoji: string; roast: string; rarity?: string }>;
  finalTitle: string;
  finalRoast: string;
  riotScore: number;
  riotRank: string;
  myName: string;
  opponentName: string;
  roomCode?: string | undefined;
  memoryStats?: MemoryStats;
  worstMemory?: MemoryIncident | null;
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
  achievementToast: AchievementToastData | null;
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
  activeCourtCase: CourtCase | null;
  courtCases: CourtCase[];
  courtVerdictDelivered: boolean;
  deliverCourtVerdict: () => void;
  dismissCourt: () => void;
  stockPrice: number;
  stockHistory: number[];
  recentStockEvents: RelationshipStockEvent[];
  stockToast: RelationshipStockEvent | null;
  isMarketCrash: boolean;
  reportOpen: boolean;
  setReportOpen: (v: boolean) => void;
  reportData: FinalReportData;
  memoryEraserOpen: boolean;
  setMemoryEraserOpen: (v: boolean) => void;
  memoryInitialText: string;
  setMemoryInitialText: (t: string) => void;
  memoryToast: MemoryIncident | null;
  dismissMemoryToast: () => void;
  createMemoryFromChat: (text: string) => MemoryIncident;
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
  const [unlocked, setUnlocked] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const cached = window.sessionStorage.getItem("riot_unlocked");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
    }
    return [];
  });
  const [achievementToast, setAchievementToast] = useState<AchievementToastData | null>(null);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [typingSeconds, setTypingSeconds] = useState(0);
  const [ghostSeconds, setGhostSeconds] = useState(0);
  const [onFire, setOnFire] = useState(false);
  const [shake, setShake] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [dead, setDead] = useState(false);
  const [chaosActive, setChaosActive] = useState(false);
  const [courtOpen, setCourtOpen] = useState(false);
  const [activeCourtCase, setActiveCourtCase] = useState<CourtCase | null>(null);
  const [courtCases, setCourtCases] = useState<CourtCase[]>([]);
  const [courtVerdictDelivered, setCourtVerdictDelivered] = useState(false);
  const [stockPrice, setStockPrice] = useState<number>(100.0);
  const [stockHistory, setStockHistory] = useState<number[]>([100.0]);
  const [recentStockEvents, setRecentStockEvents] = useState<RelationshipStockEvent[]>([]);
  const [stockToast, setStockToast] = useState<RelationshipStockEvent | null>(null);
  const [isMarketCrash, setIsMarketCrash] = useState<boolean>(false);
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [punishmentHistory, setPunishmentHistory] = useState<PunishmentRecord[]>([]);
  const [memoryEraserOpen, setMemoryEraserOpen] = useState<boolean>(false);
  const [memoryInitialText, setMemoryInitialText] = useState<string>("");
  const [memoryToast, setMemoryToast] = useState<MemoryIncident | null>(null);

  const dismissMemoryToast = useCallback(() => {
    setMemoryToast(null);
  }, []);

  const createMemoryFromChat = useCallback((text: string): MemoryIncident => {
    const analysis = analyzeMemory(text);
    const newInc: MemoryIncident = {
      ...analysis,
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      status: "ACTIVE",
      source: "chat",
    };
    memoryService.save(newInc);
    setMemoryToast(newInc);
    setTimeout(() => {
      setMemoryToast((cur) => (cur?.id === newInc.id ? null : cur));
    }, 6000);
    return newInc;
  }, []);

  const dryStreak = useRef(0);
  const punishmentsReceivedCount = useRef(0);
  const distinctPunishments = useRef<Set<PunishmentId>>(new Set());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const courtCasesRef = useRef<CourtCase[]>([]);
  courtCasesRef.current = courtCases;
  const processedCourtEvents = useRef<Set<string>>(new Set());
  const lastCourtTime = useRef<number>(0);
  const convictionsCount = useRef<number>(0);
  const executedSentences = useRef<Set<string>>(new Set());
  const stockPriceRef = useRef<number>(100.0);
  stockPriceRef.current = stockPrice;
  const processedStockEvents = useRef<Set<string>>(new Set());

  // Load room-specific court cases, stock state & punishments on mount / room change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const roomId = room?.id || "local";
    const storageKey = `reply-riot-court-${roomId}`;
    const raw = window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed: CourtCase[] = JSON.parse(raw);
        setCourtCases(parsed);
        parsed.forEach((c) => processedCourtEvents.current.add(c.eventId));
      } catch {
        setCourtCases([]);
      }
    } else {
      setCourtCases([]);
    }

    const stockKey = `reply-riot-stock-${roomId}`;
    const rawStock = window.localStorage.getItem(stockKey) || window.sessionStorage.getItem(stockKey);
    if (rawStock) {
      try {
        const parsed = JSON.parse(rawStock);
        if (typeof parsed.stockPrice === "number") {
          setStockPrice(parsed.stockPrice);
          stockPriceRef.current = parsed.stockPrice;
        }
        if (Array.isArray(parsed.stockHistory) && parsed.stockHistory.length > 0) {
          setStockHistory(parsed.stockHistory);
        }
        if (Array.isArray(parsed.recentStockEvents)) {
          setRecentStockEvents(parsed.recentStockEvents);
          parsed.recentStockEvents.forEach((ev: RelationshipStockEvent) => {
            processedStockEvents.current.add(ev.eventId);
          });
        }
      } catch {
        setStockPrice(100.0);
        stockPriceRef.current = 100.0;
        setStockHistory([100.0]);
        setRecentStockEvents([]);
      }
    } else {
      setStockPrice(100.0);
      stockPriceRef.current = 100.0;
      setStockHistory([100.0]);
      setRecentStockEvents([]);
    }

    const punishmentKey = `reply-riot-punishments-${roomId}`;
    const rawPunishments = window.localStorage.getItem(punishmentKey) || window.sessionStorage.getItem(punishmentKey);
    if (rawPunishments) {
      try {
        setPunishmentHistory(JSON.parse(rawPunishments));
      } catch {
        setPunishmentHistory([]);
      }
    } else {
      setPunishmentHistory([]);
    }
  }, [room?.id]);

  const saveCourtCase = useCallback((c: CourtCase) => {
    setCourtCases((prev) => {
      if (prev.some((existing) => existing.eventId === c.eventId)) return prev;
      const next = [...prev, c];
      if (typeof window !== "undefined") {
        const roomId = room?.id || "local";
        const storageKey = `reply-riot-court-${roomId}`;
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
          window.sessionStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, [room?.id]);

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
    (id: string, isFromPeer = false, peerName?: string) => {
      setUnlocked((prev) => {
        if (prev.includes(id)) return prev;
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (def) {
          soundManager.play("achievement");
          setAchievementToast({
            id: def.id,
            name: def.name,
            emoji: def.emoji,
            roast: def.roast,
            unlockedBy: isFromPeer ? peerName || "Opponent" : undefined,
            isPeer: isFromPeer,
          });
          later(() => setAchievementToast(null), 3600);
        }
        // If unlocked by this player and in a real room, broadcast to peer
        if (!isFromPeer && room?.id) {
          void liveBroadcast.unlockAchievement(room.id, id, myName);
        }
        const next = [...prev, id];
        if (typeof window !== "undefined") {
          try {
            window.sessionStorage.setItem("riot_unlocked", JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      });
    },
    [later, myName, room?.id],
  );

  const bumpCrime = useCallback(
    (patch: Partial<RiotStats>, marketDelta: number) => {
      setStats((prev) => {
        const next = statsService.pushMarket(statsService.bump(prev, patch), marketDelta);
        if (next.crime >= 50) {
          unlock("emotional-damage");
        }
        if (next.kOffences >= 2) {
          unlock("k-merchant");
        }
        return next;
      });
    },
    [unlock],
  );

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
      const targetName = target === myId ? myName : opponentName;

      setPunishmentHistory((prev) => {
        const next = [
          ...prev,
          {
            id: uid(),
            punishmentId: id,
            targetUserId: target,
            targetUserName: targetName,
            timestamp: Date.now(),
          },
        ];
        if (typeof window !== "undefined") {
          const roomId = room?.id || "local";
          const storageKey = `reply-riot-punishments-${roomId}`;
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(next));
            window.sessionStorage.setItem(storageKey, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      });

      distinctPunishments.current.add(id);
      if (distinctPunishments.current.size >= 3) {
        unlock("reply-destroyer");
      }
      if (id === "boulder" || id === "geological") {
        unlock("geological-threat");
      }

      // On each client, trigger the physical punishment only when the event target matches the current user's ID
      if (isTarget) {
        punishmentsReceivedCount.current += 1;
        if (punishmentsReceivedCount.current >= 2) {
          unlock("stone-collector");
        }
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
        if (s.stones + 1 >= 10) unlock("geological-threat");
        return s;
      });
    },
    [bumpCrime, later, play, pushOverlay, pushRoast, unlock],
  );

  const triggerCourtCase = useCallback(
    (
      offenderUserId: string,
      offenderName: string,
      crimeType: string,
      evidence: string,
      severity: number,
      punishmentId: PunishmentId,
      sentence: string,
      verdict: "GUILTY" | "VERY GUILTY" | "EXTREMELY GUILTY" = "GUILTY",
    ) => {
      const now = Date.now();
      if (now - lastCourtTime.current < 4000) {
        return null;
      }
      lastCourtTime.current = now;

      const eventId = uid();
      processedCourtEvents.current.add(eventId);

      const caseNumber = courtCasesRef.current.length + 1;
      const c: CourtCase = {
        eventId,
        roomId: room?.id || "local",
        caseNumber,
        offenderUserId,
        offenderName,
        crimeType,
        evidence,
        severity,
        verdict,
        sentence,
        punishmentId,
        timestamp: now,
      };

      saveCourtCase(c);
      setActiveCourtCase(c);
      setCourtVerdictDelivered(false);
      setCourtOpen(true);
      soundManager.play("bonk");

      if (room?.id) {
        void liveBroadcast.sendCourtCase(room.id, c);
      }

      // Check achievements
      const totalCases = courtCasesRef.current.length + 1;
      if (totalCases >= 3) {
        unlock("court-regular");
      }
      if (offenderUserId === deviceId()) {
        convictionsCount.current += 1;
        if (convictionsCount.current >= 2) {
          unlock("convicted");
        }
      }

      return c;
    },
    [room?.id, saveCourtCase, unlock],
  );

  const deliverCourtVerdict = useCallback(() => {
    if (!activeCourtCase) return;
    setCourtVerdictDelivered(true);
    if (!executedSentences.current.has(activeCourtCase.eventId)) {
      executedSentences.current.add(activeCourtCase.eventId);
      // Deliver physical punishment targeted strictly to offender
      punish(
        activeCourtCase.punishmentId,
        roastEngine.roast("chaos"),
        false,
        activeCourtCase.offenderUserId,
      );
    }

    if (room?.id) {
      void liveBroadcast.sendCourtVerdict(room.id, {
        eventId: activeCourtCase.eventId,
        verdict: activeCourtCase.verdict,
        sentence: activeCourtCase.sentence,
        offenderUserId: activeCourtCase.offenderUserId,
        punishmentId: activeCourtCase.punishmentId,
      });
    }

    // Court conviction impact on stock market (deduplicated)
    const courtStockEventId = `court-verdict-stock-${activeCourtCase.eventId}`;
    if (!processedStockEvents.current.has(courtStockEventId)) {
      triggerStockChange(
        -10,
        "COURT_VERDICT",
        "CONVICTED IN CHAT COURT",
        activeCourtCase.offenderUserId,
        activeCourtCase.offenderName,
        courtStockEventId,
      );
    }
  }, [activeCourtCase, punish, room?.id]);

  const dismissCourt = useCallback(() => {
    setCourtOpen(false);
    setActiveCourtCase(null);
    setCourtVerdictDelivered(false);
  }, []);

  /* ---------------------- stock market (Phase 3) ---------------------- */

  const lastCrashTime = useRef<number>(0);

  const applyStockEvent = useCallback(
    (evt: RelationshipStockEvent, isRemote = false) => {
      // Deduplicate: each eventId applied strictly once across both devices
      if (processedStockEvents.current.has(evt.eventId)) {
        return;
      }
      processedStockEvents.current.add(evt.eventId);

      const prevPrice = stockPriceRef.current;
      // Clamp between ₹0.01 and ₹999.99
      const nextPrice = Math.max(
        0.01,
        Math.min(999.99, Number((prevPrice + evt.priceChange).toFixed(2))),
      );
      stockPriceRef.current = nextPrice;

      setStockPrice(nextPrice);
      setStockHistory((prev) => [...prev, nextPrice].slice(-40));
      setRecentStockEvents((prev) => [evt, ...prev.filter((e) => e.eventId !== evt.eventId)].slice(0, 10));

      // Show floating price toast
      setStockToast(evt);
      later(() => setStockToast((t) => (t?.eventId === evt.eventId ? null : t)), 3200);

      // Audio feedback
      if (evt.priceChange > 0) {
        soundManager.play("achievement");
      } else if (evt.priceChange <= -20) {
        soundManager.play("scratch");
      }

      // Check Market Crash: drop >= 25 or price falls below 25
      const isMajorDrop = evt.priceChange <= -25 || (prevPrice >= 25 && nextPrice < 25);
      if (isMajorDrop) {
        const now = Date.now();
        if (now - lastCrashTime.current > 4000) {
          lastCrashTime.current = now;
          setIsMarketCrash(true);
          soundManager.play("horror");
          later(() => setIsMarketCrash(false), 5000);
          unlock("market-crasher");
        }
      }

      // Check stock achievements
      if (nextPrice < 25) {
        unlock("financial-damage");
      }
      if (nextPrice >= 130) {
        unlock("bull-market");
      }
      if (prevPrice < 35 && nextPrice >= 60) {
        unlock("relationship-recovery");
      }

      // Sync stats.market for backward compatibility
      setStats((s) => ({
        ...s,
        market: [...s.market, Math.round(nextPrice)].slice(-28),
      }));

      // Persist to local & session storage
      if (typeof window !== "undefined") {
        const roomId = room?.id || "local";
        const stockKey = `reply-riot-stock-${roomId}`;
        try {
          const payload = {
            stockPrice: nextPrice,
            stockHistory: [...stockHistory, nextPrice].slice(-40),
            recentStockEvents: [evt, ...recentStockEvents].slice(0, 10),
          };
          window.localStorage.setItem(stockKey, JSON.stringify(payload));
          window.sessionStorage.setItem(stockKey, JSON.stringify(payload));
        } catch {
          // ignore
        }
      }

      // If triggered locally and in live room, broadcast to peer
      if (!isRemote && room?.id) {
        void liveBroadcast.updateStock(room.id, {
          ...evt,
          currentPrice: nextPrice,
        });
      }
    },
    [later, recentStockEvents, room?.id, stockHistory, unlock],
  );

  const triggerStockChange = useCallback(
    (
      priceChange: number,
      eventType: string,
      reason: string,
      triggeredByUserId: string,
      triggeredByUserName: string,
      customEventId?: string,
    ) => {
      const prevPrice = stockPriceRef.current;
      const nextPrice = Math.max(
        0.01,
        Math.min(999.99, Number((prevPrice + priceChange).toFixed(2))),
      );
      const percentageChange =
        prevPrice > 0 ? Number(((priceChange / prevPrice) * 100).toFixed(1)) : 0;
      const eventId =
        customEventId || `stock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const stockEvent: RelationshipStockEvent = {
        roomId: room?.id || "local",
        eventId,
        triggeredByUserId,
        triggeredByUserName,
        eventType,
        reason,
        priceChange,
        currentPrice: nextPrice,
        percentageChange,
        timestamp: Date.now(),
      };

      applyStockEvent(stockEvent, false);
      return stockEvent;
    },
    [applyStockEvent, room?.id],
  );

  const evaluateMessageStock = useCallback(
    (text: string, analysis: Analysis, dryStreakCount: number) => {
      const lower = text.toLowerCase().trim();
      const stripped = lower.replace(/[.!?,]/g, "").trim();

      // 1. Apology / Very Positive
      if (
        (lower.includes("sorry") || lower.includes("apolog") || lower.includes("my bad")) &&
        (lower.includes("❤️") || lower.includes("love") || lower.includes("pls") || lower.includes("please"))
      ) {
        return {
          priceChange: 20,
          eventType: "VERY_POSITIVE",
          reason: "RELATIONSHIP RECOVERY",
        };
      }

      if (lower.includes("sorry") || lower.includes("my bad") || lower.includes("apolog")) {
        return {
          priceChange: 15,
          eventType: "APOLOGY",
          reason: "APOLOGY INVESTORS ARE BACK",
        };
      }

      if (
        lower.includes("thank") ||
        lower.includes("awesome") ||
        lower.includes("you're the best") ||
        lower.includes("you are the best") ||
        lower.includes("love you") ||
        stripped === "❤️" ||
        stripped === "nice" ||
        stripped === "great"
      ) {
        return {
          priceChange: 8,
          eventType: "POSITIVE",
          reason: "POSITIVE SENTIMENT",
        };
      }

      // 2. Monosyllabic / Dry / Low effort (Single deduction per message)
      if (analysis.isK) {
        if (dryStreakCount >= 2) {
          return {
            priceChange: -20,
            eventType: "REPEAT_DRY",
            reason: "INVESTOR CONFIDENCE COLLAPSING",
          };
        }
        return {
          priceChange: -12,
          eventType: "DRY_TEXT",
          reason: "DRY TEXTING",
        };
      }

      if (analysis.isHmm) {
        return {
          priceChange: -5,
          eventType: "LOW_EFFORT",
          reason: "CONVERSATION NEGLIGENCE",
        };
      }

      if (/^(ok|okay|fine|ya|yeah|yep|sure|kk)$/.test(stripped)) {
        return {
          priceChange: -8,
          eventType: "VERY_DRY",
          reason: "VERY DRY",
        };
      }

      if (analysis.dryness > 62) {
        if (dryStreakCount >= 2) {
          return {
            priceChange: -18,
            eventType: "REPEAT_DRY",
            reason: "INVESTOR CONFIDENCE COLLAPSING",
          };
        }
        return {
          priceChange: -8,
          eventType: "DRY_TEXT",
          reason: "DRY TEXTING",
        };
      }

      return null;
    },
    [],
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
        unlock("first-offense");
        play("scratch");
        pushOverlay({ kind: "alert", title: "🚨 “K” DETECTED", emoji: "🪨", ms: 1500 });
        later(() => punish("pebble", roastEngine.roast("k"), true, target), 900);
        return;
      }
      if (analysis.isHmm) {
        bumpCrime({ crime: 10, redFlags: 1 }, -6);
        unlock("first-offense");
        pushOverlay({ kind: "alert", title: "🚨 LOW EFFORT DETECTED", emoji: "👊", ms: 1400 });
        later(() => punish("punch", roastEngine.roast("dry"), false, target), 800);
        return;
      }
      if (analysis.dryness > 62) {
        dryStreak.current += 1;
        if (dryStreak.current >= 3) {
          unlock("dry-legend");
        }
        bumpCrime({ crime: 8, redFlags: dryStreak.current >= 2 ? 1 : 0 }, -5);
        unlock("first-offense");
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
      unlock("still-here");
      pushOverlay({
        kind: "genz",
        title: "🧢 GEN-Z DETECTED",
        body: `“${sample}”`,
        detail: GENZ_HEADLINES[Math.floor(Math.random() * GENZ_HEADLINES.length)] as string,
        ms: 3000,
      });
      later(() => pushRoast(roastEngine.roast("genz")), 1800);
    },
    [bumpCrime, later, play, pushOverlay, pushRoast, unlock],
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
            unlock("first-offense");
            play("scratch");
            pushOverlay({ kind: "alert", title: "🚨 “K” DETECTED", emoji: "🪨", ms: 1500 });
            later(() => punish("pebble", roastEngine.roast("k"), true, liveMsg.sender_id), 900);
          } else if (analysis.isHmm) {
            bumpCrime({ crime: 10, redFlags: 1 }, -6);
            unlock("first-offense");
            pushOverlay({ kind: "alert", title: "🚨 LOW EFFORT DETECTED", emoji: "👊", ms: 1400 });
            later(() => punish("punch", roastEngine.roast("dry"), false, liveMsg.sender_id), 800);
          } else if (analysis.dryness > 62) {
            dryStreak.current += 1;
            if (dryStreak.current >= 3) {
              unlock("dry-legend");
            }
            bumpCrime({ crime: 8, redFlags: dryStreak.current >= 2 ? 1 : 0 }, -5);
            unlock("first-offense");
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
            unlock("still-here");
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
      (achPayload: AchievementBroadcastPayload) => {
        // Peer unlocked an achievement over Realtime broadcast
        unlock(achPayload.achievementId, true, achPayload.unlockedByName);
      },
      (incomingCase: CourtCase) => {
        // Peer committed a court offense or summoned court
        if (processedCourtEvents.current.has(incomingCase.eventId)) return;
        processedCourtEvents.current.add(incomingCase.eventId);

        saveCourtCase(incomingCase);
        setActiveCourtCase(incomingCase);
        setCourtVerdictDelivered(false);
        setCourtOpen(true);
        soundManager.play("bonk");

        const totalCases = courtCasesRef.current.length + 1;
        if (totalCases >= 3) {
          unlock("court-regular");
        }
        if (incomingCase.offenderUserId === myId) {
          convictionsCount.current += 1;
          if (convictionsCount.current >= 2) {
            unlock("convicted");
          }
        }
      },
      (incomingVerdict: CourtVerdictPayload) => {
        setCourtVerdictDelivered(true);
        if (!executedSentences.current.has(incomingVerdict.eventId)) {
          executedSentences.current.add(incomingVerdict.eventId);
          punish(
            incomingVerdict.punishmentId,
            roastEngine.roast("chaos"),
            false,
            incomingVerdict.offenderUserId,
          );
        }
      },
      (incomingStock: RelationshipStockEvent) => {
        applyStockEvent(incomingStock, true);
      },
    );

    return () => {
      unsub();
    };
  }, [
    room?.id,
    applyStockEvent,
    bumpCrime,
    later,
    play,
    punish,
    pushOverlay,
    saveCourtCase,
    triggerGenZ,
    unlock,
  ]);

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

          // Single deterministic Stock Market update for this message:
          const stockImpact = evaluateMessageStock(trimmed, analysis, dryStreak.current);
          if (stockImpact) {
            triggerStockChange(
              stockImpact.priceChange,
              stockImpact.eventType,
              stockImpact.reason,
              deviceId(),
              myName,
              `stock-msg-${liveMsg.id}`,
            );
          }

          // Deterministic Court check for sender:
          if (analysis.isK) {
            if (dryStreak.current >= 2) {
              triggerCourtCase(
                deviceId(),
                myName,
                "REPEAT OFFENDER",
                trimmed,
                9,
                "rock",
                "Habitual monosyllabic contempt. Sentenced to rock.",
                "VERY GUILTY",
              );
            } else {
              triggerCourtCase(
                deviceId(),
                myName,
                "DRY TEXTING",
                trimmed,
                7,
                "pebble",
                "One geological punishment.",
                "GUILTY",
              );
            }
          } else if (analysis.isHmm) {
            triggerCourtCase(
              deviceId(),
              myName,
              "CONVERSATION NEGLIGENCE",
              trimmed,
              6,
              "punch",
              "Aggravated conversation negligence. Punched in the ego.",
              "GUILTY",
            );
          } else if (analysis.dryness > 62 && dryStreak.current >= 3) {
            triggerCourtCase(
              deviceId(),
              myName,
              "REPEAT OFFENDER",
              trimmed,
              8,
              "rock",
              "Unbroken dryness streak. Sentenced to rock.",
              "GUILTY",
            );
          }

          // Phase 7: Connect significant bad-text crimes to Memory Creation
          if (analysis.isK || analysis.isHmm || (analysis.dryness > 65 && dryStreak.current >= 2)) {
            createMemoryFromChat(trimmed);
          }
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

      const stockImpact = evaluateMessageStock(trimmed, analysis, dryStreak.current);
      if (stockImpact) {
        triggerStockChange(
          stockImpact.priceChange,
          stockImpact.eventType,
          stockImpact.reason,
          deviceId(),
          myName,
          `stock-msg-${msg.id}`,
        );
      }

      if (analysis.isK) {
        if (dryStreak.current >= 2) {
          triggerCourtCase(
            deviceId(),
            myName,
            "REPEAT OFFENDER",
            trimmed,
            9,
            "rock",
            "Habitual monosyllabic contempt. Sentenced to rock.",
            "VERY GUILTY",
          );
        } else {
          triggerCourtCase(
            deviceId(),
            myName,
            "DRY TEXTING",
            trimmed,
            7,
            "pebble",
            "One geological punishment.",
            "GUILTY",
          );
        }
      } else if (analysis.isHmm) {
        triggerCourtCase(
          deviceId(),
          myName,
          "CONVERSATION NEGLIGENCE",
          trimmed,
          6,
          "punch",
          "Aggravated conversation negligence. Punched in the ego.",
          "GUILTY",
        );
      }

      if (analysis.isK || analysis.isHmm || (analysis.dryness > 65 && dryStreak.current >= 2)) {
        createMemoryFromChat(trimmed);
      }
    },
    [
      bumpCrime,
      createMemoryFromChat,
      evaluateMessageStock,
      later,
      myName,
      opponentName,
      play,
      punish,
      pushOverlay,
      reactToDryness,
      registerAnalysis,
      room,
      triggerCourtCase,
      triggerGenZ,
      triggerStockChange,
      unlock,
    ],
  );

  const incomingMessage = useCallback(
    (text: string, delayMs = 0) => {
      const msg = chatService.send({ author: "them", text, delayMs });
      const analysis = analyzeMessage({ text, delayMs, dryStreak: dryStreak.current });
      registerAnalysis(msg, analysis);
      play("message");

      const stockImpact = evaluateMessageStock(text, analysis, dryStreak.current);
      if (stockImpact) {
        triggerStockChange(
          stockImpact.priceChange,
          stockImpact.eventType,
          stockImpact.reason,
          "them-simulated",
          opponentName,
          `stock-incoming-${msg.id}`,
        );
      }

      if (analysis.isK) {
        bumpCrime({ kOffences: 1, crime: 12, redFlags: 1 }, -9);
        unlock("first-offense");
        pushOverlay({ kind: "alert", title: "🚨 “K” DETECTED", emoji: "🪨", ms: 1500 });
        later(() => punish("pebble", roastEngine.roast("k"), true), 900);
      } else if (analysis.isHmm) {
        bumpCrime({ crime: 9 }, -5);
        unlock("first-offense");
        pushOverlay({ kind: "alert", title: "🚨 “HMM” DETECTED", emoji: "👊", ms: 1400 });
        later(() => punish("punch", roastEngine.roast("dry")), 800);
      } else if (analysis.dryness > 62) {
        dryStreak.current += 1;
        if (dryStreak.current >= 3) unlock("dry-legend");
        unlock("first-offense");
      } else if (analysis.genzWords.length) {
        unlock("still-here");
        later(() => triggerGenZ(text), 400);
      }
    },
    [
      bumpCrime,
      evaluateMessageStock,
      later,
      opponentName,
      play,
      punish,
      pushOverlay,
      registerAnalysis,
      triggerGenZ,
      triggerStockChange,
      unlock,
    ],
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
    triggerStockChange(
      -8,
      "LATE_REPLY",
      "TEMPORAL NEGLIGENCE",
      "them-simulated",
      opponentName || "The Other Person",
      `stock-late-${msg.id}`,
    );
    later(() => {
      triggerCourtCase(
        "them-simulated",
        opponentName || "The Other Person",
        "TEMPORAL NEGLIGENCE",
        "Delayed reply by 4 business days ('sorry just saw this')",
        7,
        "brick",
        "Sentenced to 1 Brick for chronological disrespect.",
        "GUILTY",
      );
    }, 1500);
  }, [
    bumpCrime,
    later,
    opponentName,
    punish,
    pushOverlay,
    registerAnalysis,
    triggerCourtCase,
    triggerStockChange,
    unlock,
  ]);

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
      unlock("professional-ghost");
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
      triggerStockChange(
        -25,
        "GHOSTING",
        "GHOSTING DETECTED",
        "them-simulated",
        opponentName || "The Ghost",
        `stock-ghost-${Date.now()}`,
      );
      later(() => {
        triggerCourtCase(
          "them-simulated",
          opponentName || "The Ghost",
          "DISAPPEARANCE TRIAL",
          "Vanished without trace for over 60 seconds",
          9,
          "boulder",
          "Sentenced to Boulder for emotional abandonment.",
          "EXTREMELY GUILTY",
        );
      }, 3000);
    }, 4600);
  }, [
    bumpCrime,
    later,
    opponentName,
    play,
    punish,
    pushOverlay,
    triggerCourtCase,
    triggerStockChange,
    unlock,
  ]);

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
        () => {
          pushOverlay({
            kind: "sympathy",
            title: "❤️ SPECIAL SYMPATHY™",
            body: "You tried. They ghosted. We threw rocks.",
            ms: 4000,
          });
          triggerCourtCase(
            deviceId(),
            myName,
            "SUPREME COURT OF EMOTIONAL DAMAGE",
            "Multiple counts of cyber disrespect and total communication collapse",
            10,
            "geological",
            "Sentenced to Geological Extinction.",
            "EXTREMELY GUILTY",
          );
        },
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
    myName,
    play,
    punish,
    pushOverlay,
    simulateSeen,
    triggerCourtCase,
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
      window.sessionStorage.removeItem("riot_unlocked");
      window.localStorage.removeItem("riot_room");
      window.localStorage.removeItem("riot_active_room_id");
    }
    setUnlocked([]);
    punishmentsReceivedCount.current = 0;
    distinctPunishments.current.clear();
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
    setCourtOpen(false);
    setActiveCourtCase(null);
    setCourtVerdictDelivered(false);
    processedCourtEvents.current.clear();
    executedSentences.current.clear();
    setStockPrice(100.0);
    stockPriceRef.current = 100.0;
    setStockHistory([100.0]);
    setRecentStockEvents([]);
    setStockToast(null);
    setIsMarketCrash(false);
    processedStockEvents.current.clear();
    setReportOpen(false);
    setPunishmentHistory([]);
    if (typeof window !== "undefined") {
      const roomId = room?.id || "local";
      window.sessionStorage.removeItem(`reply-riot-stock-${roomId}`);
      window.localStorage.removeItem(`reply-riot-stock-${roomId}`);
      window.sessionStorage.removeItem(`reply-riot-punishments-${roomId}`);
      window.localStorage.removeItem(`reply-riot-punishments-${roomId}`);
    }
  }, [room?.id]);

  const setCourtOpenHandler = useCallback(
    (open: boolean) => {
      if (open && !activeCourtCase) {
        const peerId =
          room?.hostId === deviceId()
            ? room?.guestId || "suspect-peer"
            : room?.hostId || "suspect-peer";
        triggerCourtCase(
          peerId,
          opponentName || "The Accused",
          "CONVERSATION NEGLIGENCE",
          "Summoned to court on suspicion of texting crimes",
          6,
          "rock",
          "Found guilty of casual texting crimes. Sentenced to rock.",
          "GUILTY",
        );
      } else {
        setCourtOpen(open);
      }
    },
    [activeCourtCase, opponentName, room?.guestId, room?.hostId, triggerCourtCase],
  );

  const reviveChat = useCallback(() => {
    setDead(false);
    unlock("relationship-archaeologist");
    incomingMessage("hey... you still there?");
    setStats((s) => statsService.pushMarket({ ...s, crime: Math.max(0, s.crime - 20) }, 18));
    triggerStockChange(
      18,
      "RECOVERY",
      "RELATIONSHIP DEFIBRILLATOR",
      deviceId(),
      myName,
      `stock-revive-${Date.now()}`,
    );
  }, [incomingMessage, myName, triggerStockChange, unlock]);

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

  const reportData = useMemo<FinalReportData>(() => {
    const myId = deviceId();
    const totalMessages = messages.length;
    const myMessages = messages.filter((m) => m.author === "me").length;
    const opponentMessages = messages.filter((m) => m.author === "them").length;

    // Short replies mode
    const shortReplies = messages
      .map((m) => m.text.trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length <= 6);
    const shortCounts: Record<string, number> = {};
    shortReplies.forEach((r) => {
      shortCounts[r] = (shortCounts[r] || 0) + 1;
    });
    let mostUsedShortReply = "None (Remarkably articulate)";
    let maxShortCount = 0;
    Object.entries(shortCounts).forEach(([r, count]) => {
      if (count > maxShortCount) {
        maxShortCount = count;
        mostUsedShortReply = `“${r}” (${count}x)`;
      }
    });

    // Dry messages and crimes
    let myDryCount = 0;
    let opponentDryCount = 0;
    let suspiciousCount = 0;
    let myCrimes = 0;
    let opponentCrimes = 0;
    const crimeCounts: Record<string, number> = {
      "Dry Texting": 0,
      "Monosyllabic Neglect": 0,
      "Gen-Z Slang Overdose": 0,
      "Red Flags Detected": 0,
      "Cringe Violations": 0,
      "Temporal Negligence": 0,
      "Ghosting Crime": 0,
    };

    let worstOffense = "Unchecked conversational audacity";
    let worstSeverity = 0;

    messages.forEach((m) => {
      const a = analyses[m.id];
      if (!a) return;
      const isMine = m.author === "me";

      const isDry = a.dryness > 60 || a.isK || a.isHmm;
      if (isDry) {
        if (isMine) myDryCount++;
        else opponentDryCount++;
        crimeCounts["Dry Texting"] = (crimeCounts["Dry Texting"] || 0) + 1;
        if (isMine) myCrimes++;
        else opponentCrimes++;
      }

      if (a.isK || a.isHmm) {
        crimeCounts["Monosyllabic Neglect"] = (crimeCounts["Monosyllabic Neglect"] || 0) + 1;
      }

      if (a.genzWords.length > 0) {
        crimeCounts["Gen-Z Slang Overdose"] = (crimeCounts["Gen-Z Slang Overdose"] || 0) + 1;
        if (isMine) myCrimes++;
        else opponentCrimes++;
      }

      if (a.redFlags > 0) {
        suspiciousCount++;
        crimeCounts["Red Flags Detected"] = (crimeCounts["Red Flags Detected"] || 0) + a.redFlags;
        if (isMine) myCrimes += a.redFlags;
        else opponentCrimes += a.redFlags;
      }

      if (a.suspicion > 60) {
        crimeCounts["Cringe Violations"] = (crimeCounts["Cringe Violations"] || 0) + 1;
      }

      if (a.ghosting > 50) {
        suspiciousCount++;
      }

      const messageSeverity = a.dryness + a.suspicion + a.redFlags * 20;
      if (messageSeverity > worstSeverity) {
        worstSeverity = messageSeverity;
        worstOffense = `“${m.text.slice(0, 32)}${m.text.length > 32 ? "..." : ""}” (Severity ${Math.min(99, Math.round(messageSeverity / 2))})`;
      }
    });

    const dryMessagesCount = myDryCount + opponentDryCount;
    const totalCrimes = myCrimes + opponentCrimes + courtCases.length;

    let mostCommonCrime = "Dry Texting";
    let maxCrimeCount = 0;
    Object.entries(crimeCounts).forEach(([name, count]) => {
      if (count > maxCrimeCount) {
        maxCrimeCount = count;
        mostCommonCrime = name;
      }
    });

    // Punishments
    const myPunishments = punishmentHistory.filter((p) => p.targetUserId === myId).length;
    const opponentPunishments = punishmentHistory.filter((p) => p.targetUserId !== myId).length;
    const totalPunishments = punishmentHistory.length;

    const brutalityRank: Record<PunishmentId, number> = {
      geological: 6,
      boulder: 5,
      hammer: 4,
      brick: 3,
      rock: 2,
      punch: 2,
      pebble: 1,
    };
    let maxBrutality = 0;
    let mostBrutalPunishment = totalPunishments > 0 ? "Pebble" : "None";
    punishmentHistory.forEach((p) => {
      const rank = brutalityRank[p.punishmentId] || 1;
      if (rank > maxBrutality) {
        maxBrutality = rank;
        mostBrutalPunishment = PUNISHMENTS[p.punishmentId]?.label || p.punishmentId.toUpperCase();
      }
    });

    // Court
    const totalCourtCases = courtCases.length;
    const guiltyVerdicts = courtCases.filter((c) => c.verdict.includes("GUILTY")).length;
    const myConvictions = courtCases.filter((c) => c.offenderUserId === myId).length;
    const opponentConvictions = courtCases.filter((c) => c.offenderUserId !== myId).length;
    let mostSeriousCase: CourtCase | null = null;
    let maxCaseSeverity = -1;
    courtCases.forEach((c) => {
      if (c.severity > maxCaseSeverity) {
        maxCaseSeverity = c.severity;
        mostSeriousCase = c;
      }
    });
    const convictionRate = totalCourtCases > 0 ? Math.round((guiltyVerdicts / totalCourtCases) * 100) : 100;

    // Stock Market (Phase 3 state as source of truth)
    const startPrice = stockHistory[0] ?? 100.0;
    const currentPrice = stockPrice;
    const peakPrice = Math.max(...stockHistory);
    const troughPrice = Math.min(...stockHistory);
    const netChange = Number((currentPrice - startPrice).toFixed(2));
    const percentageChange = Number((((currentPrice - startPrice) / startPrice) * 100).toFixed(1));
    const marketEventsCount = recentStockEvents.length;

    const biggestCrash: RelationshipStockEvent | null = recentStockEvents.reduce<RelationshipStockEvent | null>(
      (acc, e) => (e.priceChange < (acc?.priceChange ?? 0) ? e : acc),
      null,
    );
    const biggestRecovery: RelationshipStockEvent | null = recentStockEvents.reduce<RelationshipStockEvent | null>(
      (acc, e) => (e.priceChange > (acc?.priceChange ?? 0) ? e : acc),
      null,
    );

    let marketStatusTier = "STABLE";
    if (currentPrice >= 80) marketStatusTier = "BULL MARKET / STABLE";
    else if (currentPrice >= 60) marketStatusTier = "UNSTABLE";
    else if (currentPrice >= 40) marketStatusTier = "EMOTIONAL VOLATILITY";
    else if (currentPrice >= 20) marketStatusTier = "MARKET CRASH";
    else marketStatusTier = "RELATIONSHIP INSOLVENCY";

    // Achievements
    const unlockedAchievements = unlocked
      .map((id) => {
        const a = ACHIEVEMENTS.find((def) => def.id === id);
        return a ? { id: a.id, name: a.name, emoji: a.emoji, roast: a.roast } : null;
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);
    const unlockedCount = unlockedAchievements.length;

    // Deterministic Final Title
    const crashedHard =
      (biggestCrash as RelationshipStockEvent | null) !== null &&
      ((biggestCrash as RelationshipStockEvent).reason.includes("GHOSTING") ||
        (biggestCrash as RelationshipStockEvent).priceChange <= -20);
    let finalTitle = "CASUAL CONVERSATIONALIST";
    if (stats.ghostings >= 1 || ((biggestCrash as RelationshipStockEvent | null) !== null && (biggestCrash as RelationshipStockEvent).reason.includes("GHOSTING"))) {
      finalTitle = "THE PROFESSIONAL GHOST";
    } else if (stats.kOffences >= 2 || mostUsedShortReply.toLowerCase().includes("“k”")) {
      finalTitle = "K MERCHANT";
    } else if (currentPrice < 35 || crashedHard) {
      finalTitle = "RELATIONSHIP MARKET CRASHER";
    } else if (myPunishments >= 3) {
      finalTitle = "CONVERSATION SURVIVOR";
    } else if (myCrimes >= 5 || totalCrimes >= 8) {
      finalTitle = "EMOTIONAL DAMAGE DEALER";
    } else if (myDryCount >= 2 || dryMessagesCount >= 3) {
      finalTitle = "CERTIFIED DRY TEXTER";
    } else if (totalCrimes >= 4) {
      finalTitle = "CHAOTIC COMMUNICATOR";
    }

    // Deterministic Final Roast based on real counts
    let finalRoast = `${totalMessages} messages. ${totalCrimes} detected communication crimes. ${totalCourtCases} emergency court sessions. Your relationship entered the exchange at ₹${startPrice.toFixed(2)} and exited at ₹${currentPrice.toFixed(2)}. The forensic board has officially recommended permanent keyboard confiscation.`;
    if (finalTitle === "THE PROFESSIONAL GHOST") {
      finalRoast = `You vanished for business days while the other phone caught fire. ₹${Math.abs(netChange).toFixed(2)} in stock valuation vanished into the ether. Even the Stone Police couldn't find your last remaining vowel.`;
    } else if (finalTitle === "K MERCHANT") {
      finalRoast = `You typed 'k' as if each additional letter cost ₹10.00 in cellular data. With ${myDryCount} dry replies and ${myPunishments} incoming stones, investors have completely liquidated their positions.`;
    } else if (finalTitle === "RELATIONSHIP MARKET CRASHER") {
      finalRoast = `A catastrophic plummet from ₹${startPrice.toFixed(2)} to ₹${currentPrice.toFixed(2)} (${percentageChange > 0 ? "+" : ""}${percentageChange}%). Financial analysts are comparing your replies to the 1929 stock market crash.`;
    } else if (finalTitle === "CONVERSATION SURVIVOR") {
      finalRoast = `You took ${myPunishments} physical geological strikes to the face, survived ${totalCourtCases} trials, and are somehow still texting. A medical and conversational miracle.`;
    } else if (finalTitle === "EMOTIONAL DAMAGE DEALER") {
      finalRoast = `A verified menace with ${myCrimes} offenses and ${totalCourtCases} convictions. Your texting style has officially been classified by authorities as an emotional biohazard.`;
    }

    // Deterministic Riot Score
    const riotScore = Math.min(
      999,
      Math.max(
        42,
        Math.round(
          totalMessages * 8 +
            totalCrimes * 24 +
            totalPunishments * 32 +
            totalCourtCases * 45 +
            unlockedCount * 30 +
            Math.max(0, 100 - currentPrice) * 3,
        ),
      ),
    );

    let riotRank = "Innocent Bystander";
    if (riotScore >= 800) riotRank = "Relationship Terrorist";
    else if (riotScore >= 600) riotRank = "Public Threat";
    else if (riotScore >= 450) riotRank = "Communication Criminal";
    else if (riotScore >= 300) riotRank = "Certified Menace";
    else if (riotScore >= 150) riotRank = "Minor Menace";

    return {
      totalMessages,
      myMessages,
      opponentMessages,
      mostUsedShortReply,
      dryMessagesCount,
      myDryCount,
      opponentDryCount,
      suspiciousCount,
      totalCrimes,
      myCrimes,
      opponentCrimes,
      mostCommonCrime,
      worstOffense,
      totalPunishments,
      myPunishments,
      opponentPunishments,
      mostBrutalPunishment,
      totalCourtCases,
      guiltyVerdicts,
      myConvictions,
      opponentConvictions,
      mostSeriousCase,
      convictionRate,
      startPrice,
      currentPrice,
      peakPrice,
      troughPrice,
      netChange,
      percentageChange,
      marketEventsCount,
      biggestCrash,
      biggestRecovery,
      marketStatusTier,
      unlockedCount,
      unlockedAchievements,
      finalTitle,
      finalRoast,
      riotScore,
      riotRank,
      myName,
      opponentName,
      roomCode: room?.code,
      memoryStats: memoryService.getStats(),
      worstMemory: memoryService.getAll().sort((a, b) => b.embarrassment - a.embarrassment)[0] || null,
    };
  }, [
    analyses,
    courtCases,
    messages,
    myName,
    opponentName,
    punishmentHistory,
    recentStockEvents,
    room?.code,
    stats,
    stockHistory,
    stockPrice,
    unlocked,
  ]);

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
      setCourtOpen: setCourtOpenHandler,
      activeCourtCase,
      courtCases,
      courtVerdictDelivered,
      deliverCourtVerdict,
      dismissCourt,
      stockPrice,
      stockHistory,
      recentStockEvents,
      stockToast,
      isMarketCrash,
      reportOpen,
      setReportOpen,
      reportData,
      memoryEraserOpen,
      setMemoryEraserOpen,
      memoryInitialText,
      setMemoryInitialText,
      memoryToast,
      dismissMemoryToast,
      createMemoryFromChat,
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
      activeCourtCase,
      analyses,
      chaosActive,
      courtCases,
      courtOpen,
      courtVerdictDelivered,
      createRoom,
      dead,
      deliverCourtVerdict,
      dismissCourt,
      ghostSeconds,
      incomingMessage,
      isMarketCrash,
      joinRoom,
      messages,
      myName,
      onFire,
      opponentName,
      overlays,
      personality,
      projectiles,
      punish,
      recentStockEvents,
      reportData,
      reportOpen,
      resetRiot,
      reviveChat,
      roasts,
      room,
      sendMessage,
      setCourtOpenHandler,
      setReportOpen,
      memoryEraserOpen,
      memoryInitialText,
      memoryToast,
      dismissMemoryToast,
      createMemoryFromChat,
      shake,
      simulateGhosting,
      simulateLateReply,
      simulatePlayerJoin,
      simulateSeen,
      simulateTypingTorture,
      soundOn,
      stats,
      stockHistory,
      stockPrice,
      stockToast,
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
