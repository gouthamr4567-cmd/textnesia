import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

import { PERSONALITIES, type PersonalityId } from "../riot/data/personalities";
import { useRiot } from "../riot/state/RiotProvider";

type LobbySearch = { mode?: "create" | "join"; suspect?: PersonalityId | undefined };

export const Route = createFileRoute("/lobby")({
  validateSearch: (search: Record<string, unknown>): LobbySearch => {
    const validPersonalities: PersonalityId[] = ["dry", "ghoster", "late", "genz", "normal", "overthinker"];
    const suspectVal = typeof search["suspect"] === "string" && validPersonalities.includes(search["suspect"] as PersonalityId)
      ? (search["suspect"] as PersonalityId)
      : undefined;
    return {
      mode: search["mode"] === "join" ? "join" : "create",
      suspect: suspectVal,
    };
  },
  head: () => ({
    meta: [
      { title: "Start a Chat — TEXTNESIA" },
      {
        name: "description",
        content: "Create or join a TEXTNESIA chat room and pick the texting personality you want judged.",
      },
      { property: "og:title", content: "Start a Chat — TEXTNESIA" },
      {
        property: "og:description",
        content: "Create or join a TEXTNESIA chat room and pick the texting personality you want judged.",
      },
    ],
  }),
  component: Lobby,
});

function Lobby() {
  const { mode, suspect } = Route.useSearch();
  const navigate = useNavigate();
  const { createRoom, joinRoom, room, simulatePlayerJoin, resetRiot } = useRiot();

  const [tab, setTab] = useState<"create" | "join">(mode ?? "create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [personality, setPersonality] = useState<PersonalityId>(suspect ?? "normal");
  const [created, setCreated] = useState<string | null>(room?.code ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (suspect) {
      setPersonality(suspect);
    }
  }, [suspect]);

  const start = async () => {
    setError(null);
    setLoading(true);
    try {
      resetRiot();
      if (tab === "create") {
        const r = await createRoom(name, personality);
        setCreated(r.code);
        navigate({ to: "/chat" });
      } else {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) {
          setError("Please enter a 5-letter room code.");
          setLoading(false);
          return;
        }
        await joinRoom(cleanCode, name, personality);
        navigate({ to: "/chat" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to enter room. Please try again.";
      console.error("Lobby action error:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-display text-5xl text-primary text-glow-siren">💬 TEXTNESIA CHAT</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Two people. One chat. An unreasonable amount of consequences and amnesia.
      </p>

      <div className="mt-6 inline-flex rounded-2xl border border-border p-1">
        {(["create", "join"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError(null);
            }}
            className={`rounded-xl px-5 py-2 font-display text-lg transition ${
              tab === t ? "bg-primary text-primary-foreground shadow-neon" : "text-muted-foreground"
            }`}
          >
            {t === "create" ? "💬 CREATE ROOM" : "🚪 JOIN ROOM"}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="riot-panel space-y-4 p-5">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goutham"
              className="mt-1 w-full rounded-xl border border-input bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          {tab === "join" && (
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Riot code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XK4TP"
                maxLength={5}
                className="mt-1 w-full rounded-xl border border-input bg-secondary/50 px-3 py-2 font-mono text-lg tracking-[0.4em] outline-none focus:border-toxic"
              />
            </label>
          )}

          {tab === "create" && created && (
            <div className="rounded-xl border border-toxic/50 p-3 text-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Room code
              </div>
              <div className="font-display text-4xl tracking-[0.3em] text-toxic">{created}</div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-primary/60 bg-primary/10 p-2.5 text-center text-xs text-primary">
              {error}
            </div>
          )}

          <button
            onClick={start}
            disabled={loading}
            className="w-full rounded-2xl bg-primary px-5 py-3.5 font-display text-2xl text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "CONNECTING..." : "🚨 ENTER THE RIOT"}
          </button>
          <p className="text-center font-mono text-[10px] text-muted-foreground">
            Realtime Supabase room · 2 players max · Instant sync
          </p>
        </div>

        <div>
          <h2 className="font-display text-3xl text-accent text-glow-hazard">
            👤 PICK A PERSONALITY
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PERSONALITIES.map((p) => {
              const active = personality === p.id;
              return (
                <motion.button
                  key={p.id}
                  whileHover={{ y: -4 }}
                  onClick={() => setPersonality(p.id)}
                  className={`riot-panel p-4 text-left transition ${
                    active ? "border-primary shadow-neon" : ""
                  }`}
                  aria-pressed={active}
                >
                  <div className="text-3xl">{p.emoji}</div>
                  <div className="mt-1 font-display text-xl">{p.name}</div>
                  <div className="font-mono text-xs text-accent">{p.quote}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
