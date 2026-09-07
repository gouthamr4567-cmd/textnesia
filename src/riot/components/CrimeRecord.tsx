import { ACHIEVEMENTS } from "../data/achievements";
import { useRiot } from "../state/RiotProvider";

export function CrimeRecord() {
  const { stats, opponentName, unlocked } = useRiot();

  const rows: [string, number][] = [
    ["“K” offences", stats.kOffences],
    ["Ghostings", stats.ghostings],
    ["Seen crimes", stats.seenCrimes],
    ["Late replies", stats.lateReplies],
    ["Gen-Z violations", stats.genzViolations],
    ["Stones deployed", stats.stones],
    ["Bricks deployed", stats.bricks],
    ["Boulders deployed", stats.boulders],
  ];

  const wanted = stats.crime >= 81;

  return (
    <div className="riot-panel overflow-hidden">
      <div className="riot-hazard-stripes h-1.5" />
      <div className="p-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          📋 Texting Crime Record
        </h3>
        <p className="mt-1 font-display text-2xl">👤 {opponentName}</p>

        <dl className="mt-3 space-y-1.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between font-mono text-xs">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className={value > 0 ? "text-primary" : "text-foreground/60"}>{value}</dd>
            </div>
          ))}
        </dl>

        {wanted && (
          <div className="mt-4 animate-riot-siren rounded-xl border border-primary bg-primary/10 px-3 py-2 text-center font-display text-xl text-primary">
            🚨 WANTED BY STONE POLICE
          </div>
        )}

        <h4 className="mt-5 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          🏆 Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
        </h4>
        <ul className="mt-2 grid grid-cols-2 gap-1.5">
          {ACHIEVEMENTS.map((a) => {
            const got = unlocked.includes(a.id);
            return (
              <li
                key={a.id}
                title={a.description}
                className={`rounded-lg border px-2 py-1.5 text-[10px] leading-tight ${
                  got
                    ? "border-accent/70 bg-accent/10 text-accent"
                    : "border-border text-muted-foreground opacity-60"
                }`}
              >
                <span className="mr-1">{got ? a.emoji : "🔒"}</span>
                {a.name}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
