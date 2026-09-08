import { Link, createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChatCourt } from "../riot/components/ChatCourt";
import { ControlDeck } from "../riot/components/ControlDeck";
import { CrimeMeter } from "../riot/components/CrimeMeter";
import { CrimeRecord } from "../riot/components/CrimeRecord";
import { ExcuseGenerator } from "../riot/components/ExcuseGenerator";
import { FinalRiotReport } from "../riot/components/FinalRiotReport";
import { Forensics } from "../riot/components/Forensics";
import { Memorial } from "../riot/components/Memorial";
import { RiotStage } from "../riot/components/RiotStage";
import { StockMarket } from "../riot/components/StockMarket";
import { useRiot } from "../riot/state/RiotProvider";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "The Riot Chat — REPLY RIOT" },
      {
        name: "description",
        content:
          "Live chat with instant roasts, crime meter, cartoon punishments and the Stone Police.",
      },
      { property: "og:title", content: "The Riot Chat — REPLY RIOT" },
      {
        property: "og:description",
        content:
          "Live chat with instant roasts, crime meter, cartoon punishments and the Stone Police.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const {
    room,
    myName,
    opponentName,
    messages,
    analyses,
    sendMessage,
    incomingMessage,
    typingLabel,
    typingSeconds,
    ghostSeconds,
    soundOn,
    toggleSound,
    resetRiot,
    simulateSeen,
    simulateGhosting,
    triggerChaos,
    dead,
    stockPrice,
    setReportOpen,
  } = useRiot();

  const [draft, setDraft] = useState("");
  const [panel, setPanel] = useState<"controls" | "record">("controls");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typingLabel]);

  const lastMine = useMemo(() => [...messages].reverse().find((m) => m.author === "me"), [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  };

  const runDemo = () => {
    resetRiot();
    const script: [number, () => void][] = [
      [200, () => incomingMessage("heyy what's up")],
      [1600, () => sendMessage("Nothing much! Just finished a project, want to hear about it?")],
      [4200, () => incomingMessage("k")],
      [8000, () => simulateSeen()],
      [13000, () => incomingMessage("bro fr ngl 💀")],
      [17000, () => simulateGhosting()],
      [27000, () => triggerChaos()],
    ];
    script.forEach(([ms, fn]) => setTimeout(fn, ms));
  };

  return (
    <RiotStage>
      <main className="mx-auto max-w-6xl px-4 py-5">
        <header className="riot-panel mb-4 flex flex-wrap items-center gap-3 p-3">
          <Link to="/" className="font-display text-2xl text-primary text-glow-siren">
            💥 REPLY RIOT
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {room ? (
              <>
                ROOM <span className="font-bold text-toxic">{room.code}</span> · {myName} vs {opponentName}
              </>
            ) : (
              `SOLO · ${myName} vs ${opponentName}`
            )}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-bold ${
                stockPrice >= 80
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : stockPrice >= 50
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                    : "border-red-500/40 bg-red-500/10 text-red-400"
              }`}
            >
              <span>{stockPrice >= 80 ? "📈" : stockPrice >= 50 ? "📊" : "📉"}</span>
              <span>₹{stockPrice.toFixed(2)}</span>
            </div>
            <span className="rounded-full border border-chart-4/60 px-3 py-1 font-mono text-[10px] text-chart-4">
              🟢 Online
            </span>
            <button
              onClick={runDemo}
              className="rounded-xl border border-accent/60 px-3 py-1.5 font-display text-base text-accent transition hover:bg-secondary"
            >
              🎬 DEMO
            </button>
            <button
              onClick={toggleSound}
              aria-pressed={soundOn}
              className="rounded-xl border border-border px-3 py-1.5 font-display text-base transition hover:bg-secondary"
            >
              {soundOn ? "🔊 SOUND ON" : "🔇 SOUND OFF"}
            </button>
            <button
              onClick={() => setReportOpen(true)}
              className="rounded-xl border border-primary/70 bg-primary/15 px-3 py-1.5 font-display text-base text-primary transition hover:bg-primary/25"
            >
              📑 FINAL REPORT
            </button>
            <button
              onClick={resetRiot}
              className="rounded-xl border border-border px-3 py-1.5 font-display text-base transition hover:bg-secondary"
            >
              ♻️ RESET
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {/* ------------------------------ chat ------------------------------ */}
          <section className="riot-panel flex h-[70vh] min-h-[28rem] flex-col overflow-hidden">
            <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto p-4">
              {room && !room.guestName && opponentName === "Waiting for player..." && (
                <div className="rounded-2xl border border-toxic/40 bg-toxic/5 p-5 text-center">
                  <p className="font-mono text-xs uppercase tracking-widest text-toxic">
                    Waiting for Phone B to join
                  </p>
                  <p className="mt-2 font-display text-4xl tracking-[0.25em] text-primary">
                    {room.code}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Open REPLY RIOT on the second phone, select <strong>JOIN ROOM</strong>, and enter this 5-letter code.
                  </p>
                </div>
              )}

              {messages.length === 0 && (!room || room.guestName || opponentName !== "Waiting for player...") && (
                <p className="mt-10 text-center text-sm text-muted-foreground">
                  Say something. Say it badly. We're watching.
                </p>
              )}

              <AnimatePresence initial={false}>
                {messages.map((m) => {
                  const a = analyses[m.id];
                  const mine = m.author === "me";
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 14, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[80%]">
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm ${
                            mine
                              ? "bg-primary/85 text-primary-foreground"
                              : "border border-border bg-secondary/70"
                          } ${a && a.dryness > 62 ? "ring-2 ring-siren/70" : ""}`}
                        >
                          {m.text}
                        </div>
                        <div
                          className={`mt-1 flex items-center gap-2 font-mono text-[10px] text-muted-foreground ${
                            mine ? "justify-end" : ""
                          }`}
                        >
                          <span>{mine ? myName : opponentName}</span>
                          {m.seen && mine && <span className="text-toxic">seen 👀</span>}
                          {a && a.dryness > 62 && <span className="text-primary">🧊 dry {a.dryness}%</span>}
                          {a && a.genzWords.length > 0 && <span className="text-accent">🧢 gen-z</span>}
                          {a && a.lateness > 60 && <span className="text-accent">🐢 late</span>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {typingLabel && (
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span className="animate-pulse">⌨️ {typingLabel}</span>
                  {typingSeconds > 0 && (
                    <span className="text-primary">
                      {typingSeconds >= 60 ? `${typingSeconds / 60} min` : `${typingSeconds} sec`}
                    </span>
                  )}
                </div>
              )}

              {ghostSeconds > 0 && (
                <div className="rounded-xl border border-primary/50 px-3 py-2 text-center font-mono text-xs text-primary">
                  👻 No reply for {ghostSeconds} seconds...
                </div>
              )}
            </div>

            {dead ? (
              <div className="border-t border-border p-4">
                <Memorial />
              </div>
            ) : (
              <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type something. Try “k” if you're brave."
                  aria-label="Message"
                  className="flex-1 rounded-xl border border-input bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-3 font-display text-xl text-primary-foreground shadow-neon transition hover:brightness-110"
                >
                  SEND
                </button>
              </form>
            )}
          </section>

          {/* ----------------------------- panels ----------------------------- */}
          <aside className="space-y-4">
            <CrimeMeter />
            <StockMarket />

            <div className="inline-flex w-full rounded-2xl border border-border p-1">
              {(["controls", "record"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPanel(p)}
                  className={`flex-1 rounded-xl px-3 py-2 font-display text-lg transition ${
                    panel === p ? "bg-secondary" : "text-muted-foreground"
                  }`}
                >
                  {p === "controls" ? "🎛️ CONTROLS" : "📋 RECORD"}
                </button>
              ))}
            </div>

            {panel === "controls" ? (
              <>
                <ControlDeck />
                <ExcuseGenerator />
              </>
            ) : (
              <>
                <CrimeRecord />
                <Forensics text={lastMine?.text} analysis={lastMine ? analyses[lastMine.id] : undefined} />
              </>
            )}
          </aside>
        </div>
      </main>

      <ChatCourt />
      <FinalRiotReport />
    </RiotStage>
  );
}
