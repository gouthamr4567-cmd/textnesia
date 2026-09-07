import { motion } from "motion/react";

import type { Analysis } from "../engine/analyzer";

const BARS: { key: keyof Analysis; label: string }[] = [
  { key: "effort", label: "Effort" },
  { key: "emotion", label: "Emotional depth" },
  { key: "contribution", label: "Conversation contribution" },
  { key: "suspicion", label: "Suspicion" },
];

export function Forensics({ text, analysis }: { text?: string | undefined; analysis?: Analysis | undefined }) {
  return (
    <div className="riot-panel p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        🕵️ Message Forensics
      </h3>

      {!analysis ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Send a message. The lab is standing by with gloves on.
        </p>
      ) : (
        <>
          <p className="mt-2 truncate font-mono text-xs text-foreground/80">“{text}”</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {text?.trim().split(/\s+/).filter(Boolean).length ?? 0} words analysed
          </p>

          <div className="mt-3 space-y-2">
            {BARS.map((b) => {
              const value = analysis[b.key] as number;
              return (
                <div key={b.key}>
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                    <span>{b.label}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      animate={{ width: `${value}%` }}
                      className={`h-full rounded-full ${
                        b.key === "suspicion" ? "bg-siren" : "bg-toxic"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-xl border border-primary/40 px-3 py-2 text-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Verdict
            </span>
            <div className="font-display text-xl text-primary text-glow-siren">
              {analysis.verdict}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
