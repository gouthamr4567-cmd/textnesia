import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { useRiot } from "../state/RiotProvider";

/**
 * Full-screen effects layer: overlays, flying projectiles, roast cards,
 * achievement toasts, screen shake and cartoon fire.
 */
export function RiotStage({ children }: { children: ReactNode }) {
  const { overlays, projectiles, roasts, achievementToast, shake, onFire, chaosActive } = useRiot();

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
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="riot-panel fixed left-1/2 top-4 z-50 -translate-x-1/2 border-accent/60 px-5 py-3 text-center shadow-hazard"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              Achievement unlocked
            </div>
            <div className="font-display text-2xl">{achievementToast}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
