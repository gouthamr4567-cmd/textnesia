import { motion } from "motion/react";

import { crimeLevel } from "../data/punishments";
import { useRiot } from "../state/RiotProvider";

export function CrimeMeter() {
  const { stats } = useRiot();
  const level = crimeLevel(stats.crime);

  return (
    <div className="riot-panel p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Communication Crime Meter
        </h3>
        <span className="font-display text-2xl text-primary text-glow-siren">
          {stats.crime}
          <span className="text-sm text-muted-foreground">/100</span>
        </span>
      </div>

      <div className="mt-3 h-4 overflow-hidden rounded-full border border-border bg-secondary">
        <motion.div
          animate={{ width: `${stats.crime}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="h-full rounded-full bg-gradient-to-r from-chart-4 via-hazard to-siren"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xl">{level.emoji}</span>
        <span className="font-display text-lg tracking-wide">{level.label}</span>
      </div>

      <div className="mt-3 flex gap-1" aria-label={`${stats.redFlags} red flags`}>
        {Array.from({ length: stats.redFlags }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            className="text-lg"
          >
            🚩
          </motion.span>
        ))}
        {stats.redFlags === 0 && (
          <span className="font-mono text-[10px] text-muted-foreground">NO RED FLAGS. YET.</span>
        )}
      </div>
    </div>
  );
}
