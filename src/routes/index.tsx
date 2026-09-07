import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import { PERSONALITIES } from "../riot/data/personalities";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REPLY RIOT — Bad replies. Big consequences." },
      {
        name: "description",
        content:
          "Send a dry text. Get roasted, stoned and sentenced by the Stone Police. A cartoon comedy chat experiment.",
      },
      { property: "og:title", content: "REPLY RIOT — Bad replies. Big consequences." },
      {
        property: "og:description",
        content:
          "Send a dry text. Get roasted, stoned and sentenced by the Stone Police. A cartoon comedy chat experiment.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { emoji: "🧊", title: "DRY REPLY DETECTION", body: "Type “k” and find out what happens." },
  { emoji: "👀", title: "SEEN = CYBER CRIME", body: "The blue tick is now evidence." },
  { emoji: "👻", title: "GHOSTING ALARM", body: "Your profile catches cartoon fire." },
  { emoji: "🪨", title: "PUNISHMENT ENGINE", body: "Pebbles, bricks, hammers, boulders." },
  { emoji: "⚖️", title: "CHAT COURT", body: "Charges, defence, and a guilty verdict." },
  { emoji: "📈", title: "RELATIONSHIP MARKET", body: "Watch the value of this chat collapse." },
];

const STEPS = [
  "Start a riot and pick a texting personality.",
  "Chat normally. Or badly. Badly is funnier.",
  "The system detects the crime and reacts instantly.",
  "Roasts, rocks, sirens and Special Sympathy™ follow.",
];

function Landing() {
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
          <span className="mb-4 inline-block rounded-full border border-primary/50 px-4 py-1 font-mono text-[10px] uppercase tracking-[0.35em] text-primary">
            Fictional law enforcement · zero real rocks
          </span>
          <h1 className="font-display text-[clamp(3.5rem,14vw,9rem)] leading-[0.85] text-primary text-glow-siren">
            💥 REPLY RIOT
          </h1>
          <p className="mt-4 font-display text-[clamp(1.25rem,4vw,2.25rem)] text-accent text-glow-hazard">
            “Bad replies. Big consequences.”
          </p>
        </motion.div>

        <p className="relative mt-6 max-w-xl text-sm text-muted-foreground sm:text-base">
          A chat app that judges how you text. Dry replies get pebbles. Ghosting gets boulders.
          Everything here is cartoonish, harmless and completely made up.
        </p>

        <div className="relative mt-9 flex flex-wrap justify-center gap-3">
          <Link
            to="/lobby"
            className="animate-riot-siren rounded-2xl bg-primary px-7 py-4 font-display text-2xl text-primary-foreground shadow-neon transition hover:-translate-y-0.5 hover:brightness-110"
          >
            💬 START RIOT
          </Link>
          <Link
            to="/lobby"
            search={{ mode: "join" }}
            className="rounded-2xl border border-toxic/60 px-7 py-4 font-display text-2xl text-toxic transition hover:-translate-y-0.5 hover:bg-secondary"
          >
            🚪 JOIN RIOT
          </Link>
          <a
            href="#how-it-works"
            className="rounded-2xl border border-border px-7 py-4 font-display text-2xl transition hover:-translate-y-0.5 hover:bg-secondary"
          >
            ❓ HOW IT WORKS
          </a>
        </div>

        <div className="relative mt-14 flex gap-6 text-5xl" aria-hidden>
          {["🪨", "🧱", "🔨", "🏔️", "🚨"].map((e, i) => (
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
        <h2 className="font-display text-4xl text-accent text-glow-hazard">❓ HOW IT WORKS</h2>
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
        <h2 className="font-display text-4xl">THE CONSEQUENCES</h2>
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

        <div className="mt-10 text-center">
          <Link
            to="/lobby"
            className="rounded-2xl bg-accent px-8 py-4 font-display text-2xl text-accent-foreground shadow-hazard transition hover:brightness-110"
          >
            💥 START THE RIOT
          </Link>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Parody only · no real police, no real rocks, no real relationships harmed
          </p>
        </div>
      </section>
    </main>
  );
}
