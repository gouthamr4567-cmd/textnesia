import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { useRiot } from "../state/RiotProvider";

/**
 * Full-screen effects layer: overlays, flying projectiles, roast cards,
 * achievement toasts, screen shake and cartoon fire.
 */
export function RiotStage({ children }: { children: ReactNode }) {
  const {
    overlays,
    projectiles,
    roasts,
    achievementToast,
    stockToast,
    isMarketCrash,
    shake,
    onFire,
    chaosActive,
  } = useRiot();

  return (
    <div className={onFire ? "relative" : "relative"}>
      <motion.div
        animate={
          shake
            ? { x: [0, -8 * shake, 7 * shake, -5 * shake, 0], y: [0, 5 * shake, -6 * shake, 0] }
            : { x: 0, y: 0 }
        }
        transition={{ duration: 0.42 }}
      >
        {children}
      </motion.div>

      {/* Cartoon fire */}
      <AnimatePresence>
        {onFire && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center gap-6 pb-2 text-6xl"
            aria-hidden
          >
            {["🔥", "🔥", "🔥", "🔥", "🔥"].map((f, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -18, 0], scale: [1, 1.25, 1] }}
                transition={{ duration: 0.6 + i * 0.1, repeat: Infinity }}
              >
                {f}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chaos vignette */}
      {chaosActive && (
        <div className="pointer-events-none fixed inset-0 z-30 riot-scanlines animate-riot-siren" aria-hidden />
      )}

      {/* Projectiles */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
        <AnimatePresence>
          {projectiles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: "-30vw", y: "40vh", rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ x: "45vw", y: "18vh", rotate: 540, scale: 2.4, opacity: 1 }}
              exit={{ opacity: 0, scale: 3.4 }}
              transition={{ duration: 0.55, ease: "easeIn" }}
              className="absolute left-0 top-0 text-6xl drop-shadow-[0_0_30px_rgba(0,0,0,0.7)]"
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <AnimatePresence>
          {overlays.map((o) => (
            <motion.div
              key={o.id}
              initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              role="status"
              className="riot-panel absolute max-w-lg px-7 py-6 text-center"
            >
              {o.emoji && <div className="mb-2 text-5xl">{o.emoji}</div>}
              <h3
                className={`font-display text-3xl sm:text-4xl ${
                  o.kind === "sympathy" ? "text-glow-hazard text-accent" : "text-glow-siren text-primary"
                }`}
              >
                {o.title}
              </h3>
              {o.body && <p className="mt-3 text-sm text-foreground/90 sm:text-base">{o.body}</p>}
              {o.detail && <p className="mt-2 text-xs text-muted-foreground">{o.detail}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Roast cards */}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex w-[min(92vw,32rem)] -translate-x-1/2 flex-col gap-2">
        <AnimatePresence>
          {roasts.map((r) => (
            <motion.div
              key={r.id}
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="riot-panel border-primary/50 px-4 py-3 text-sm shadow-neon"
            >
              <span className="mr-2">😂</span>
              {r.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Achievement toast */}
      <AnimatePresence>
        {achievementToast && (
          <motion.div
            initial={{ y: -70, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -70, opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className={`riot-panel fixed left-1/2 top-4 z-50 -translate-x-1/2 border-2 px-6 py-3.5 text-center shadow-2xl backdrop-blur-md max-w-md w-[92vw] sm:w-auto ${
              achievementToast.isPeer
                ? "border-primary/80 bg-background/95 shadow-primary/30"
                : "border-accent/90 bg-background/95 shadow-hazard"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
              <span>🏆</span>
              <span>
                {achievementToast.isPeer
                  ? `${achievementToast.unlockedBy || "OPPONENT"} UNLOCKED`
                  : "ACHIEVEMENT UNLOCKED"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-2 font-display text-xl sm:text-2xl text-foreground">
              <span>{achievementToast.emoji}</span>
              <span className="tracking-wide">{achievementToast.name}</span>
            </div>
            {achievementToast.roast && (
              <p className="mt-1 font-mono text-xs text-muted-foreground italic">
                “{achievementToast.roast}”
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market Crash Alert */}
      <AnimatePresence>
        {isMarketCrash && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 border-b-2 border-red-500/80 bg-red-600/90 py-2.5 text-center font-display text-xs uppercase tracking-widest text-white shadow-xl backdrop-blur-md sm:text-sm"
          >
            <span>🚨</span>
            <span>RELATIONSHIP MARKET CRASH IN PROGRESS — INVESTOR PANIC</span>
            <span>🚨</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock market floating toast */}
      <AnimatePresence>
        {stockToast && (
          <motion.div
            key={stockToast.eventId}
            initial={{ y: -50, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 450, damping: 26 }}
            className={`fixed right-4 top-4 z-50 flex items-center gap-3 rounded-2xl border-2 px-4 py-2.5 shadow-2xl backdrop-blur-md max-w-sm ${
              stockToast.priceChange > 0
                ? "border-emerald-500/80 bg-background/95 text-emerald-400 shadow-emerald-950/50"
                : "border-red-500/80 bg-background/95 text-red-400 shadow-red-950/50"
            }`}
          >
            <span className="text-2xl">{stockToast.priceChange > 0 ? "📈" : "📉"}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
                <span className={stockToast.priceChange > 0 ? "text-emerald-400" : "text-red-400"}>
                  {stockToast.priceChange > 0
                    ? `+₹${stockToast.priceChange.toFixed(2)}`
                    : `-₹${Math.abs(stockToast.priceChange).toFixed(2)}`}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="truncate text-foreground">{stockToast.triggeredByUserName}</span>
              </div>
              <p className="truncate font-mono text-[11px] text-muted-foreground">{stockToast.reason}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
