import { useRiot } from "../state/RiotProvider";

function mood(value: number) {
  if (value >= 105) return { emoji: "📈", label: "PROMISING" };
  if (value >= 80) return { emoji: "📉", label: "SLIGHT DECLINE" };
  if (value >= 45) return { emoji: "📉📉", label: "MAJOR CRASH" };
  return { emoji: "💥", label: "TOTAL COLLAPSE" };
}

export function StockMarket() {
  const { stats } = useRiot();
  const data = stats.market;
  const last = data[data.length - 1] ?? 100;
  const m = mood(last);

  const max = Math.max(...data, 120);
  const min = Math.min(...data, 0);
  const points = data
    .map((v, i) => {
      const x = (i / Math.max(1, data.length - 1)) * 100;
      const y = 100 - ((v - min) / Math.max(1, max - min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="riot-panel p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Relationship Market
        </h3>
        <span className="font-mono text-sm text-toxic">{last} pts</span>
      </div>

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-3 h-24 w-full" aria-hidden>
        <polyline
          points={points}
          fill="none"
          stroke={last >= 100 ? "var(--color-chart-4)" : "var(--color-siren)"}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-1 flex items-center gap-2">
        <span className="text-lg">{m.emoji}</span>
        <span className="font-display text-lg">{m.label}</span>
      </div>
    </div>
  );
}
