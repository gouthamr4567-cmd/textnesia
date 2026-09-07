import { motion } from "motion/react";

import { useRiot } from "../state/RiotProvider";

export function Memorial() {
  const { dead, opponentName, reviveChat, throwLastStone, resetRiot } = useRiot();
  if (!dead) return null;

  const year = new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="riot-panel border-stone/50 p-6 text-center"
    >
      <div className="text-5xl">🪦</div>
      <h3 className="mt-2 font-display text-3xl">HERE LIES THIS CONVERSATION</h3>
      <p className="font-mono text-xs text-muted-foreground">
        {year} – {year} · killed by {opponentName}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">Cause of death: one letter.</p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          onClick={throwLastStone}
          className="rounded-xl bg-primary px-4 py-2 font-display text-lg text-primary-foreground shadow-neon transition hover:brightness-110"
        >
          🪨 THROW ONE LAST STONE
        </button>
        <button
          onClick={reviveChat}
          className="rounded-xl border border-toxic/60 px-4 py-2 font-display text-lg text-toxic transition hover:bg-secondary"
        >
          💉 REVIVE CHAT
        </button>
        <button
          onClick={resetRiot}
          className="rounded-xl border border-border px-4 py-2 font-display text-lg transition hover:bg-secondary"
        >
          ♻️ START OVER
        </button>
      </div>
    </motion.div>
  );
}
