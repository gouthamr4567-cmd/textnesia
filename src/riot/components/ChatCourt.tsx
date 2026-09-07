import { motion } from "motion/react";
import { useState } from "react";

import { COURT_CHARGES, COURT_DEFENCES, COURT_VERDICTS } from "../data/excuses";
import { roastEngine } from "../engine/roastEngine";
import { useRiot } from "../state/RiotProvider";

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)] as T;

export function ChatCourt() {
  const { courtOpen, setCourtOpen, opponentName, punish } = useRiot();
  const [stage, setStage] = useState<"charges" | "verdict">("charges");
  const [charge] = useState(() => pick(COURT_CHARGES));
  const [defence] = useState(() => pick(COURT_DEFENCES));
  const [ruling, setRuling] = useState<(typeof COURT_VERDICTS)[number] | null>(null);

  if (!courtOpen) return null;

  const deliverVerdict = () => {
    const r = pick(COURT_VERDICTS);
    setRuling(r);
    setStage("verdict");
    setTimeout(() => punish(r.punishment, roastEngine.roast("chaos")), 900);
  };

  const close = () => {
    setCourtOpen(false);
    setStage("charges");
    setRuling(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="riot-panel w-full max-w-lg overflow-hidden"
        role="dialog"
        aria-label="Chat Court"
      >
        <div className="riot-hazard-stripes h-2" />
        <div className="p-6 text-center">
          <div className="text-5xl">⚖️</div>
          <h2 className="mt-2 font-display text-4xl text-glow-hazard text-accent">CHAT COURT</h2>

          {stage === "charges" ? (
            <>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                The state vs. {opponentName}
              </p>
              <p className="mt-3 text-sm">
                <span className="font-display text-lg text-primary">CHARGE: </span>
                {charge}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-display text-lg text-toxic">DEFENCE: </span>
                {defence}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  onClick={deliverVerdict}
                  className="rounded-xl bg-primary px-5 py-2.5 font-display text-xl text-primary-foreground shadow-neon transition hover:brightness-110"
                >
                  🔨 DELIVER VERDICT
                </button>
                <button
                  onClick={close}
                  className="rounded-xl border border-border px-5 py-2.5 font-display text-xl transition hover:bg-secondary"
                >
                  DISMISS CASE
                </button>
              </div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 2, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: -4 }}
                className="mt-6 inline-block rounded-xl border-4 border-primary px-6 py-3 font-display text-4xl text-primary text-glow-siren"
              >
                {ruling?.verdict}
              </motion.div>
              <p className="mt-4 font-display text-2xl">SENTENCE: {ruling?.sentence}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                This court is fictional. So are its rocks.
              </p>
              <button
                onClick={close}
                className="mt-6 rounded-xl bg-accent px-5 py-2.5 font-display text-xl text-accent-foreground transition hover:brightness-110"
              >
                LEAVE COURTROOM
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
