import { motion } from "motion/react";
import { useMemo } from "react";

import { COURT_DEFENCES } from "../data/excuses";
import { useRiot } from "../state/RiotProvider";

export function ChatCourt() {
  const {
    courtOpen,
    activeCourtCase,
    courtVerdictDelivered,
    deliverCourtVerdict,
    dismissCourt,
  } = useRiot();

  // Deterministically pick a funny defense excuse based on eventId so both users see the same statement
  const defence = useMemo(() => {
    if (!activeCourtCase) return COURT_DEFENCES[0];
    let hash = 0;
    for (let i = 0; i < activeCourtCase.eventId.length; i++) {
      hash = (hash + activeCourtCase.eventId.charCodeAt(i)) % COURT_DEFENCES.length;
    }
    return COURT_DEFENCES[hash];
  }, [activeCourtCase]);

  if (!courtOpen || !activeCourtCase) return null;

  const caseTag = `CASE #${String(activeCourtCase.caseNumber).padStart(3, "0")}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="riot-panel w-full max-w-lg overflow-hidden border-2 border-accent/40 shadow-neon"
        role="dialog"
        aria-label="Chat Court"
      >
        <div className="riot-hazard-stripes h-2.5" />
        <div className="p-6 text-center">
          <div className="text-5xl">⚖️</div>
          <h2 className="mt-2 font-display text-4xl text-glow-hazard text-accent">
            CHAT COURT
          </h2>
          <div className="mt-1 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {caseTag} • TRIAL IN SESSION
          </div>

          {!courtVerdictDelivered ? (
            <>
              <div className="mt-5 space-y-3 rounded-xl border border-border bg-secondary/30 p-4 text-left">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    DEFENDANT
                  </span>
                  <span className="font-display text-base text-foreground">
                    👤 {activeCourtCase.offenderName}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    CRIME
                  </span>
                  <span className="font-display text-base text-primary">
                    🚨 {activeCourtCase.crimeType}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    SEVERITY
                  </span>
                  <span className="font-mono text-xs font-bold text-accent">
                    {"⚡".repeat(Math.min(5, Math.max(1, Math.round(activeCourtCase.severity / 2))))} ({activeCourtCase.severity}/10)
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    EVIDENCE PRESENTED
                  </span>
                  <div className="mt-1 rounded-lg border border-toxic/20 bg-background/80 p-2.5 font-mono text-xs text-toxic">
                    “{activeCourtCase.evidence}”
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    OFFICIAL DEFENCE STATEMENT
                  </span>
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    “{defence}”
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={deliverCourtVerdict}
                  className="rounded-xl bg-primary px-6 py-3 font-display text-xl text-primary-foreground shadow-neon transition hover:brightness-110 active:scale-95"
                >
                  🔨 DELIVER VERDICT
                </button>
                <button
                  onClick={dismissCourt}
                  className="rounded-xl border border-border px-6 py-3 font-display text-xl transition hover:bg-secondary active:scale-95"
                >
                  DISMISS CASE
                </button>
              </div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 2.2, opacity: 0, rotate: -12 }}
                animate={{ scale: 1, opacity: 1, rotate: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="mt-6 inline-block rounded-2xl border-4 border-primary bg-primary/10 px-8 py-4 font-display text-5xl text-primary text-glow-siren shadow-neon"
              >
                {activeCourtCase.verdict}
              </motion.div>

              <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  COURT SENTENCE
                </span>
                <p className="mt-1 font-display text-2xl text-foreground">
                  ⚖️ {activeCourtCase.sentence}
                </p>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                This court is fictional. Geological consequences are not.
              </p>

              <button
                onClick={dismissCourt}
                className="mt-6 rounded-xl bg-accent px-6 py-3 font-display text-xl text-accent-foreground transition hover:brightness-110 active:scale-95"
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
