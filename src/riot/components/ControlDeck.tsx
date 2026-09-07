import { useRiot } from "../state/RiotProvider";

export function ControlDeck() {
  const {
    simulateSeen,
    simulateLateReply,
    simulateGhosting,
    simulateTypingTorture,
    triggerGenZ,
    triggerRedFlags,
    triggerPolice,
    triggerChaos,
    setCourtOpen,
    punish,
    chaosActive,
  } = useRiot();

  const actions: { label: string; onClick: () => void; tone?: "danger" | "hazard" }[] = [
    { label: "👀 SEEN", onClick: simulateSeen },
    { label: "🐢 LATE REPLY", onClick: simulateLateReply },
    { label: "👻 GHOST ME", onClick: simulateGhosting },
    { label: "⌨️ TYPING TORTURE", onClick: simulateTypingTorture },
    { label: "🧢 GEN-Z", onClick: () => triggerGenZ() },
    { label: "🚩 RED FLAGS", onClick: triggerRedFlags },
    { label: "👮 STONE POLICE", onClick: triggerPolice, tone: "danger" },
    { label: "⚖️ CHAT COURT", onClick: () => setCourtOpen(true), tone: "hazard" },
    { label: "🪨 PEBBLE", onClick: () => punish("pebble") },
    { label: "🔨 HAMMER", onClick: () => punish("hammer") },
    { label: "🧱 BRICK", onClick: () => punish("brick") },
    { label: "🏔️ BOULDER", onClick: () => punish("boulder") },
  ];

  return (
    <div className="riot-panel p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        🎛️ Riot Control Deck
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={`rounded-xl border px-2 py-2 text-xs font-medium transition hover:-translate-y-0.5 hover:bg-secondary ${
              a.tone === "danger"
                ? "border-primary/60 text-primary"
                : a.tone === "hazard"
                  ? "border-accent/60 text-accent"
                  : "border-border"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <button
        onClick={triggerChaos}
        disabled={chaosActive}
        className="riot-hazard-stripes mt-3 w-full rounded-xl p-1.5 transition hover:brightness-110 disabled:opacity-60"
      >
        <span className="block rounded-lg bg-background/85 px-3 py-2 font-display text-2xl text-accent text-glow-hazard">
          ☢️ CHAOS MODE
        </span>
      </button>
      <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
        Warning: activates every consequence at once.
      </p>
    </div>
  );
}
