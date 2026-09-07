import { useState } from "react";

import { EXCUSE_CLOSERS, EXCUSE_OPENERS, EXCUSE_REASONS } from "../data/excuses";
import { useRiot } from "../state/RiotProvider";

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export function ExcuseGenerator() {
  const { incomingMessage } = useRiot();
  const [excuse, setExcuse] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    setSpinning(true);
    let ticks = 0;
    const iv = setInterval(() => {
      setExcuse(`${pick(EXCUSE_OPENERS)}, ${pick(EXCUSE_REASONS)} — ${pick(EXCUSE_CLOSERS)}`);
      ticks += 1;
      if (ticks > 8) {
        clearInterval(iv);
        setSpinning(false);
      }
    }, 90);
  };

  return (
    <div className="riot-panel p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        🎰 Excuse Generator
      </h3>
      <p
        className={`mt-3 min-h-14 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm ${
          spinning ? "blur-[1px]" : ""
        }`}
      >
        {excuse ?? "Pull the lever. Receive an excuse of questionable quality."}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={spin}
          className="flex-1 rounded-xl bg-accent px-3 py-2 font-display text-lg text-accent-foreground transition hover:brightness-110"
        >
          SPIN
        </button>
        <button
          disabled={!excuse || spinning}
          onClick={() => excuse && incomingMessage(excuse)}
          className="flex-1 rounded-xl border border-border px-3 py-2 font-display text-lg transition hover:bg-secondary disabled:opacity-40"
        >
          SEND IT
        </button>
      </div>
    </div>
  );
}
