import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";

import { PERSONALITIES } from "../riot/data/personalities";
import { MemoryEraserModal } from "../riot/components/MemoryEraserModal";

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
  { emoji: "💬", title: "CHAT RIOT", body: "Type “k” and find out what real consequences feel like." },
  { emoji: "🧠", title: "MEMORY ERASER", body: "Simulated brain deletion with an unexpected comedy twist." },
  { emoji: "🗂️", title: "INCIDENT VAULT", body: "Your permanent collection of texts you wish you never sent." },
  { emoji: "🪨", title: "OFFENDER-ONLY STONES", body: "Pebbles, bricks, hammers and boulders aimed strictly at the culprit." },
  { emoji: "⚖️", title: "CHAT COURT", body: "Charges, defense, and an emergency trial on both phones." },
  { emoji: "📈", title: "RELATIONSHIP MARKET", body: "Watch the net worth of your conversation crash in real time." },
];

const STEPS = [
  "Connect two phones or start solo in the Riot Chamber.",
  "Chat normally. Or badly. Badly triggers consequences.",
  "Offenders receive instant physical cartoon punishments.",
  "Regret what you said? Open the Memory Eraser to 'forget' it.",
];

function Landing() {
  const [eraserOpen, setEraserOpen] = useState(false);

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
            onClick={() => setEraserOpen(true)}
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
            onClick={() => setEraserOpen(true)}
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

      <section className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="font-display text-4xl">THE TWO SIDES OF TEXTNESIA</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -6 }}
              className="riot-panel p-5 transition hover:shadow-neon"
            >
              <div className="text-4xl">{f.emoji}</div>
              <h3 className="mt-2 font-display text-2xl">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <h2 className="font-display text-4xl text-toxic">CHOOSE YOUR SUSPECT</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONALITIES.map((p) => (
            <div key={p.id} className="riot-panel p-4">
              <div className="text-3xl">{p.emoji}</div>
              <h3 className="mt-1 font-display text-xl">{p.name}</h3>
              <p className="font-mono text-xs text-accent">{p.quote}</p>
              <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
            </div>
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
            onClick={() => setEraserOpen(true)}
            className="rounded-2xl bg-accent px-8 py-4 font-display text-2xl text-accent-foreground shadow-hazard transition hover:brightness-110"
          >
            🧠 OPEN MEMORY ERASER
          </button>
        </div>
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Parody comedy experiment · zero real rocks · no real brain alteration
        </p>
      </section>

      {/* Memory Eraser Modal */}
      <MemoryEraserModal isOpen={eraserOpen} onClose={() => setEraserOpen(false)} />
    </main>
  );
}
