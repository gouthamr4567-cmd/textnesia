import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";

import { useRiot } from "../state/RiotProvider";

function getMarketStatus(price: number) {
  if (price >= 80) {
    return {
      tier: "STABLE",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      borderColor: "border-chart-4/40",
      emoji: "🟢",
      label: "STABLE",
      description: "Relationship appears financially viable.",
    };
  }
  if (price >= 60) {
    return {
      tier: "UNSTABLE",
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/40",
      emoji: "🟡",
      label: "UNSTABLE",
      description: "Investors are getting nervous.",
    };
  }
  if (price >= 40) {
    return {
      tier: "CONCERNING",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      borderColor: "border-orange-400/40",
      emoji: "🟠",
      label: "CONCERNING",
      description: "Relationship fundamentals are questionable.",
    };
  }
  if (price >= 20) {
    return {
      tier: "CRITICAL",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/40",
      emoji: "🔴",
      label: "CRITICAL",
      description: "Sell everything.",
    };
  }
  return {
    tier: "COLLAPSE",
    color: "text-siren",
    bgColor: "bg-siren/15",
    borderColor: "border-siren/60",
    emoji: "💀",
    label: "MARKET COLLAPSE",
    description: "There may no longer be a relationship.",
  };
}

export function StockMarket() {
  const { stockPrice, stockHistory, recentStockEvents, isMarketCrash } = useRiot();

  const status = getMarketStatus(stockPrice);
  const latestEvent = recentStockEvents[0] ?? null;

  // Calculate net change compared to initial ₹100
  const netChange = Number((stockPrice - 100.0).toFixed(2));
  const netPercent = ((netChange / 100) * 100).toFixed(1);
  const isUp = netChange >= 0;

  // Sparkline coordinates
  const data = stockHistory.length > 0 ? stockHistory : [100];
  const maxVal = Math.max(...data, 115);
  const minVal = Math.min(...data, 10);
  const range = Math.max(1, maxVal - minVal);

  const polylinePoints = useMemo(() => {
    return data
      .map((val, idx) => {
        const x = (idx / Math.max(1, data.length - 1)) * 100;
        const y = 90 - ((val - minVal) / range) * 80;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [data, minVal, range]);

  const areaPoints = useMemo(() => {
    if (!polylinePoints) return "";
    return `0,95 ${polylinePoints} 100,95`;
  }, [polylinePoints]);

  return (
    <div className="riot-panel relative overflow-hidden border border-border/80 p-4 transition-all">
      {/* Crash glow pulse */}
      {isMarketCrash && (
        <div className="pointer-events-none absolute inset-0 animate-pulse border-2 border-primary bg-primary/15" />
      )}

      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${
                isUp ? "bg-chart-4" : "bg-primary"
              } opacity-75`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                isUp ? "bg-chart-4" : "bg-primary"
              }`}
            />
          </span>
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-foreground/80">
            RELATIONSHIP EXCHANGE™
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          NASDAQ: RIOT
        </span>
      </div>

      {/* Crash Banner */}
      <AnimatePresence>
        {isMarketCrash && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-xl border border-primary bg-primary/20 p-2.5 text-center"
          >
            <div className="animate-riot-siren font-display text-lg text-primary">
              🚨 RELATIONSHIP MARKET CRASH
            </div>
            <p className="font-mono text-[10px] tracking-wide text-primary-foreground/90">
              INVESTOR CONFIDENCE HAS COLLAPSED.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Price & Change Section */}
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl tracking-tight text-foreground sm:text-5xl">
              ₹{stockPrice.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold ${
                isUp ? "bg-chart-4/20 text-chart-4" : "bg-primary/20 text-primary"
              }`}
            >
              {isUp ? "▲ +" : "▼ "}₹{Math.abs(netChange).toFixed(2)} ({isUp ? "+" : ""}{netPercent}%)
            </span>
            <span className="text-[10px] text-muted-foreground">from ₹100.00 IPO</span>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`rounded-xl border px-3 py-1.5 text-right ${status.bgColor} ${status.borderColor}`}
        >
          <div className="flex items-center justify-end gap-1.5 font-display text-sm">
            <span>{status.emoji}</span>
            <span className={status.color}>{status.label}</span>
          </div>
          <p className="max-w-[130px] truncate text-[9px] text-muted-foreground">
            {status.description}
          </p>
        </div>
      </div>

      {/* Mini SVG Price Graph */}
      <div className="relative mt-3 rounded-xl border border-border/40 bg-secondary/20 p-2">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-20 w-full overflow-visible"
          aria-label="Relationship stock graph"
        >
          <defs>
            <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isUp ? "var(--color-chart-4)" : "var(--color-siren)"}
                stopOpacity="0.35"
              />
              <stop
                offset="100%"
                stopColor={isUp ? "var(--color-chart-4)" : "var(--color-siren)"}
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Reference ₹100 baseline */}
          {minVal <= 100 && maxVal >= 100 && (
            <line
              x1="0"
              y1={90 - ((100 - minVal) / range) * 80}
              x2="100"
              y2={90 - ((100 - minVal) / range) * 80}
              stroke="currentColor"
              strokeDasharray="2,2"
              strokeWidth="0.8"
              className="text-border"
            />
          )}

          {/* Filled Area */}
          {areaPoints && (
            <polygon points={areaPoints} fill="url(#stockGradient)" />
          )}

          {/* Price Line */}
          {polylinePoints && (
            <polyline
              points={polylinePoints}
              fill="none"
              stroke={isUp ? "var(--color-chart-4)" : "var(--color-siren)"}
              strokeWidth="2.2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>

        <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
          <span>₹{minVal.toFixed(0)}</span>
          <span>IPO ₹100.00</span>
          <span>₹{maxVal.toFixed(0)}</span>
        </div>
      </div>

      {/* Latest Event Attribution Banner */}
      {latestEvent && (
        <div className="mt-3 rounded-xl border border-border/50 bg-secondary/40 p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">
              LATEST TRANSACTION
            </span>
            <span
              className={`font-mono text-[11px] font-bold ${
                latestEvent.priceChange >= 0 ? "text-chart-4" : "text-primary"
              }`}
            >
              {latestEvent.priceChange >= 0 ? "+₹" : "-₹"}
              {Math.abs(latestEvent.priceChange).toFixed(2)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-display text-sm tracking-wide text-foreground">
              {latestEvent.priceChange >= 0 ? "📈" : "📉"} {latestEvent.reason}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              by <strong className="text-foreground">{latestEvent.triggeredByUserName}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Recent Activity List */}
      {recentStockEvents.length > 1 && (
        <div className="mt-3">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Recent Market Activity
          </h4>
          <div className="mt-1.5 max-h-32 space-y-1.5 overflow-y-auto pr-1">
            {recentStockEvents.slice(0, 6).map((evt) => (
              <div
                key={evt.eventId}
                className="flex items-center justify-between rounded-lg border border-border/30 bg-card/40 px-2 py-1 font-mono text-[11px]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{evt.priceChange >= 0 ? "📈" : "📉"}</span>
                  <span className="truncate text-foreground/90">{evt.reason}</span>
                  <span className="text-[9px] text-muted-foreground">
                    ({evt.triggeredByUserName})
                  </span>
                </div>
                <span
                  className={`ml-2 shrink-0 font-bold ${
                    evt.priceChange >= 0 ? "text-chart-4" : "text-primary"
                  }`}
                >
                  {evt.priceChange >= 0 ? "+" : ""}
                  {evt.priceChange.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
