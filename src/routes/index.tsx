import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { PERSONALITIES, type Personality } from "../riot/data/personalities";
import { MemoryEraserModal } from "../riot/components/MemoryEraserModal";
import { ChatCourt } from "../riot/components/ChatCourt";
import { StockMarket } from "../riot/components/StockMarket";
import { useRiot } from "../riot/state/RiotProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TEXTNESIA — Bad texts. Convenient amnesia." },
      {
        name: "description",
        content:
          "Because some messages deserve consequences. And some memories deserve deletion. A futuristic comedy experiment.",
      },
      { property: "og:title", content: "TEXTNESIA — Bad texts. Convenient amnesia." },
      {
        property: "og:description",
        content:
          "Because some messages deserve consequences. And some memories deserve deletion. A futuristic comedy experiment.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { emoji: "💬", title: "CHAT RIOT", body: "Type “k” and find out what real consequences feel like.", type: "chat" },
  { emoji: "🧠", title: "MEMORY ERASER", body: "Simulated brain deletion with an unexpected comedy twist.", type: "eraser" },
  { emoji: "🗂️", title: "INCIDENT VAULT", body: "Your permanent collection of texts you wish you never sent.", type: "vault" },
  { emoji: "🪨", title: "OFFENDER-ONLY STONES", body: "Pebbles, bricks, hammers and boulders aimed strictly at the culprit.", type: "stones" },
  { emoji: "⚖️", title: "CHAT COURT", body: "Charges, defense, and an emergency trial on both phones.", type: "court" },
  { emoji: "📈", title: "RELATIONSHIP MARKET", body: "Watch the net worth of your conversation crash in real time.", type: "market" },
] as const;

const STEPS = [
  "Connect two phones or start solo in the Riot Chamber.",
  "Chat normally. Or badly. Badly triggers consequences.",
  "Offenders receive instant physical cartoon punishments.",
  "Regret what you said? Open the Memory Eraser to 'forget' it.",
];

function Landing() {
  const navigate = useNavigate();
  const { setCourtOpen } = useRiot();

  const [eraserOpen, setEraserOpen] = useState(false);
  const [eraserTab, setEraserTab] = useState<"eraser" | "vault">("eraser");
  const [stonesModalOpen, setStonesModalOpen] = useState(false);
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<Personality | null>(null);

  const handleFeatureClick = (type: (typeof FEATURES)[number]["type"]) => {
    switch (type) {
      case "chat":
        navigate({ to: "/lobby" });
        break;
      case "eraser":
        setEraserTab("eraser");
        setEraserOpen(true);
        break;
      case "vault":
        setEraserTab("vault");
        setEraserOpen(true);
        break;
      case "stones":
        setStonesModalOpen(true);
        break;
      case "court":
        setCourtOpen(true);
        break;
      case "market":
        setMarketModalOpen(true);
        break;
    }
  };

  return (
    <main className="min-h-screen">
      <section className="relative mx-auto flex min-h-[92vh] max-w-5xl flex-col items-center justify-center px-5 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 riot-scanlines opacity-40" aria-hidden />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
          className="relative"
        >
          <span className="mb-4 inline-block rounded-full border border-primary/50 bg-primary/10 px-4 py-1 font-mono text-[10px] uppercase tracking-[0.35em] text-primary">
            TEXTNESIA PROTOCOL // V2.0 ACTIVE
          </span>
          <h1 className="font-display text-[clamp(3.5rem,14vw,9rem)] leading-[0.85] text-primary text-glow-siren">
            TEXTNESIA
          </h1>
          <p className="mt-4 font-display text-[clamp(1.25rem,4vw,2.25rem)] text-accent text-glow-hazard">
            “Bad texts. Convenient amnesia.”
          </p>
        </motion.div>

        <p className="relative mt-6 max-w-xl text-sm text-foreground/90 sm:text-base font-medium">
          Because some messages deserve consequences.
          <br className="hidden sm:inline" /> And some memories deserve deletion.
        </p>

        {/* Two Main Hero Actions */}
        <div className="relative mt-10 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 text-left">
          {/* Action 1: Chat Riot */}
          <Link
            to="/lobby"
            className="group riot-panel relative overflow-hidden p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-neon"
          >
            <div className="flex items-center justify-between">
              <span className="text-4xl">💬</span>
              <span className="rounded-full bg-primary/20 px-3 py-0.5 font-mono text-[10px] font-bold text-primary uppercase">
                2-PLAYER LIVE
              </span>
            </div>
            <h2 className="mt-4 font-display text-3xl text-primary group-hover:text-glow-siren">
              CHAT RIOT
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              “Say something regrettable.”
            </p>
            <div className="mt-4 flex items-center gap-2 font-display text-sm text-foreground group-hover:text-primary">
              <span>ENTER RIOT CHAMBER</span>
              <span>→</span>
            </div>
          </Link>

          {/* Action 2: Memory Eraser */}
          <button
            onClick={() => {
              setEraserTab("eraser");
              setEraserOpen(true);
            }}
            className="group riot-panel relative overflow-hidden p-6 text-left transition hover:-translate-y-1 hover:border-accent hover:shadow-hazard"
          >
            <div className="flex items-center justify-between">
              <span className="text-4xl">🧠</span>
              <span className="rounded-full bg-accent/20 px-3 py-0.5 font-mono text-[10px] font-bold text-accent uppercase">
                MEMORY ERASE
              </span>
            </div>
            <h2 className="mt-4 font-display text-3xl text-accent group-hover:text-glow-hazard">
              MEMORY ERASER
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              “Forget something you wish never happened.”
            </p>
            <div className="mt-4 flex items-center gap-2 font-display text-sm text-foreground group-hover:text-accent">
              <span>OPEN ERASER & VAULT</span>
              <span>→</span>
            </div>
          </button>
        </div>

        {/* Quick actions row */}
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/lobby"
            search={{ mode: "join" }}
            className="rounded-xl border border-toxic/60 px-5 py-2.5 font-display text-lg text-toxic transition hover:bg-secondary"
          >
            🚪 JOIN ROOM
          </Link>
          <button
            onClick={() => {
              setEraserTab("vault");
              setEraserOpen(true);
            }}
            className="rounded-xl border border-accent/60 px-5 py-2.5 font-display text-lg text-accent transition hover:bg-secondary"
          >
            🗂️ INCIDENT VAULT
          </button>
          <a
            href="#how-it-works"
            className="rounded-xl border border-border px-5 py-2.5 font-display text-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            ❓ HOW IT WORKS
          </a>
        </div>

        <div className="relative mt-14 flex gap-6 text-5xl" aria-hidden>
          {["🧠", "🪨", "⚡", "🗑️", "🚨"].map((e, i) => (
            <span
              key={e}
              className="animate-riot-float"
              style={{ animationDelay: `${i * 0.6}s` }}
            >
              {e}
            </span>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="font-display text-4xl text-accent text-glow-hazard">❓ THE TEXTNESIA CYCLE</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s} className="riot-panel flex gap-3 p-4">
              <span className="font-display text-3xl text-primary">{i + 1}</span>
              <span className="self-center text-sm text-foreground/90">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* THE TWO SIDES OF TEXTNESIA */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-4xl">THE TWO SIDES OF TEXTNESIA</h2>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            ⚡ CLICK ANY MODULE TO LAUNCH
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFeatureClick(f.type)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleFeatureClick(f.type);
                }
              }}
              className="group riot-panel flex cursor-pointer select-none flex-col justify-between p-5 transition hover:border-primary hover:shadow-neon"
            >
              <div>
                <div className="text-4xl">{f.emoji}</div>
                <h3 className="mt-2 font-display text-2xl group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2.5 font-mono text-xs text-primary/80 group-hover:text-primary">
                <span>LAUNCH MODULE</span>
                <span className="transition-transform group-hover:translate-x-1 font-bold">→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CHOOSE YOUR SUSPECT */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-4xl text-toxic">CHOOSE YOUR SUSPECT</h2>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            👥 CLICK TO INSPECT DOSSIER OR ENTER CHAT
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONALITIES.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedSuspect(p)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedSuspect(p);
                }
              }}
              className="group riot-panel flex cursor-pointer select-none flex-col justify-between p-4 transition hover:border-toxic hover:shadow-hazard"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-3xl">{p.emoji}</div>
                  <span className="rounded-full bg-toxic/15 px-2 py-0.5 font-mono text-[9px] font-bold text-toxic">
                    SUSPECT
                  </span>
                </div>
                <h3 className="mt-1.5 font-display text-xl group-hover:text-toxic transition-colors">
                  {p.name}
                </h3>
                <p className="font-mono text-xs text-accent">{p.quote}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
              </div>
              <div className="mt-3.5 flex items-center justify-between border-t border-border/50 pt-2.5 font-mono text-[11px]">
                <span className="text-muted-foreground">
                  Chaos: <strong className="text-accent">{p.chaos}x</strong>
                </span>
                <span className="flex items-center gap-1 font-bold text-primary group-hover:underline">
                  DOSSIER <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/lobby"
            className="rounded-2xl bg-primary px-8 py-4 font-display text-2xl text-primary-foreground shadow-neon transition hover:brightness-110"
          >
            💬 ENTER CHAT RIOT
          </Link>
          <button
            onClick={() => {
              setEraserTab("eraser");
              setEraserOpen(true);
            }}
            className="rounded-2xl bg-accent px-8 py-4 font-display text-2xl text-accent-foreground shadow-hazard transition hover:brightness-110"
          >
            🧠 OPEN MEMORY ERASER
          </button>
        </div>
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Parody comedy experiment · zero real rocks · no real brain alteration
        </p>
      </section>

      {/* Suspect Details Dossier Modal */}
      <AnimatePresence>
        {selectedSuspect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="riot-panel relative w-full max-w-lg border-2 border-toxic/60 bg-card p-6 shadow-hazard"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-toxic/20 px-2 py-0.5 font-mono text-[10px] font-bold text-toxic">
                    SUSPECT DOSSIER
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ID: #{selectedSuspect.id.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSuspect(null)}
                  className="rounded border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  ✕ CLOSE
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="text-6xl animate-bounce">{selectedSuspect.emoji}</div>
                <div>
                  <h3 className="font-display text-3xl text-foreground">{selectedSuspect.name}</h3>
                  <p className="font-mono text-sm text-accent">{selectedSuspect.quote}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-accent">
                    <span>⚡ CHAOS MULTIPLIER:</span>
                    <span>{selectedSuspect.chaos}x</span>
                  </div>
                </div>
              </div>

              <p className="mt-4 rounded-xl border border-border/70 bg-secondary/30 p-3.5 font-mono text-xs text-foreground/90">
                {selectedSuspect.description}
              </p>

              <div className="mt-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  KNOWN OFFENDING DISPATCHES
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {selectedSuspect.replies.map((reply) => (
                    <span
                      key={reply}
                      className="rounded-lg border border-border bg-background/60 px-2.5 py-1 font-mono text-xs text-foreground"
                    >
                      “{reply}”
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    const id = selectedSuspect.id;
                    setSelectedSuspect(null);
                    navigate({ to: "/lobby", search: { suspect: id } });
                  }}
                  className="flex-1 rounded-xl bg-primary px-5 py-3.5 font-display text-xl text-primary-foreground shadow-neon transition hover:brightness-110"
                >
                  🚨 SELECT & ENTER CHAT RIOT
                </button>
                <button
                  onClick={() => setSelectedSuspect(null)}
                  className="rounded-xl border border-border px-4 py-3.5 font-display text-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Offender-Only Stones Explanation Modal */}
      <AnimatePresence>
        {stonesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="riot-panel relative w-full max-w-lg border-2 border-primary/60 bg-card p-6 shadow-neon"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                    FORENSIC TARGETING SPEC
                  </span>
                </div>
                <button
                  onClick={() => setStonesModalOpen(false)}
                  className="rounded border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  ✕ CLOSE
                </button>
              </div>

              <div className="mt-4 text-center">
                <div className="text-5xl">🪨⚡</div>
                <h3 className="mt-2 font-display text-3xl text-primary text-glow-siren">
                  OFFENDER-ONLY STONES™
                </h3>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  Bad replies cause cartoon geological consequences. Strictly for the culprit.
                </p>
              </div>

              <div className="mt-5 space-y-2.5 font-mono text-xs">
                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <span className="font-bold text-primary">🎯 Device Fingerprinting</span>
                  <p className="mt-0.5 text-muted-foreground">
                    Punishments target stable device IDs. Only the person who typed the dry text gets hit with physical animations.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <span className="font-bold text-chart-4">🛡️ Zero Friendly Fire</span>
                  <p className="mt-0.5 text-muted-foreground">
                    The innocent recipient remains safe and sound while watching the offender's screen take geological damage.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <span className="font-bold text-accent">🏔️ Geological Escalation</span>
                  <p className="mt-0.5 text-muted-foreground">
                    Pebble (15% dry) → Hammer (25%) → Brick (50%) → Boulder (80%+ or repeated offenses).
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    setStonesModalOpen(false);
                    navigate({ to: "/lobby" });
                  }}
                  className="flex-1 rounded-xl bg-primary px-5 py-3.5 font-display text-xl text-primary-foreground shadow-neon transition hover:brightness-110"
                >
                  🚨 ENTER CHAT RIOT TO TEST
                </button>
                <button
                  onClick={() => setStonesModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-3.5 font-display text-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Relationship Stock Market Modal */}
      <AnimatePresence>
        {marketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="riot-panel relative w-full max-w-xl max-h-[90vh] overflow-y-auto border-2 border-accent/60 bg-card p-6 shadow-hazard"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent/20 px-2 py-0.5 font-mono text-[10px] font-bold text-accent">
                    MARKET SIMULATION
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    REAL-TIME VALUATION
                  </span>
                </div>
                <button
                  onClick={() => setMarketModalOpen(false)}
                  className="rounded border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  ✕ CLOSE
                </button>
              </div>

              <div className="mt-4">
                <StockMarket />
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    setMarketModalOpen(false);
                    navigate({ to: "/lobby" });
                  }}
                  className="flex-1 rounded-xl bg-primary px-5 py-3.5 font-display text-xl text-primary-foreground shadow-neon transition hover:brightness-110"
                >
                  💬 TRADE IN LIVE CHAT RIOT
                </button>
                <button
                  onClick={() => setMarketModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-3.5 font-display text-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Court Modal */}
      <ChatCourt />

      {/* Memory Eraser & Incident Vault Modal */}
      <MemoryEraserModal
        isOpen={eraserOpen}
        onClose={() => setEraserOpen(false)}
        initialTab={eraserTab}
      />
    </main>
  );
}
