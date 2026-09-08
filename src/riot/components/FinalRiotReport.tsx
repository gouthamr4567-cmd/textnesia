import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";

import { useRiot } from "../state/RiotProvider";

export function FinalRiotReport() {
  const { reportOpen, setReportOpen, reportData, resetRiot, setCourtOpen, soundOn } = useRiot();

  useEffect(() => {
    if (reportOpen && soundOn && typeof window !== "undefined") {
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU");
        audio.play().catch(() => {});
      } catch {
        // audio fallback
      }
    }
  }, [reportOpen, soundOn]);

  if (!reportOpen) return null;

  const {
    totalMessages,
    myMessages,
    opponentMessages,
    mostUsedShortReply,
    dryMessagesCount,
    myDryCount,
    opponentDryCount,
    totalCrimes,
    myCrimes,
    opponentCrimes,
    mostCommonCrime,
    worstOffense,
    totalPunishments,
    myPunishments,
    opponentPunishments,
    mostBrutalPunishment,
    totalCourtCases,
    guiltyVerdicts,
    myConvictions,
    opponentConvictions,
    mostSeriousCase,
    startPrice,
    currentPrice,
    peakPrice,
    troughPrice,
    percentageChange,
    marketStatusTier,
    unlockedAchievements,
    finalTitle,
    finalRoast,
    riotScore,
    riotRank,
    myName,
    opponentName,
    roomCode,
  } = reportData;

  // Comparison awards
  const mostCriminalWinner = myCrimes > opponentCrimes ? myName : opponentCrimes > myCrimes ? opponentName : null;
  const mostDryWinner = myDryCount > opponentDryCount ? myName : opponentDryCount > myDryCount ? opponentName : null;
  const mostPunishedWinner = myPunishments > opponentPunishments ? myName : opponentPunishments > myPunishments ? opponentName : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-6 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="riot-panel relative my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto border-2 border-primary/60 bg-card/95 p-5 shadow-[0_0_60px_rgba(0,0,0,0.85)] sm:p-8"
        >
          {/* Top Dossier Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border/70 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-primary border border-primary/30">
                  CLASSIFIED // OFFICIAL DOSSIER
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  CASE #{roomCode || "SOLO-001"}
                </span>
              </div>
              <h1 className="mt-2 font-display text-3xl sm:text-5xl tracking-wide text-primary text-glow-siren">
                FINAL RIOT REPORT™
              </h1>
              <p className="mt-1 font-mono text-xs italic text-accent sm:text-sm">
                “The evidence is overwhelming.”
              </p>
            </div>

            <button
              onClick={() => setReportOpen(false)}
              aria-label="Close report"
              className="rounded-xl border border-border px-3.5 py-1.5 font-display text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              ✕ CLOSE
            </button>
          </div>

          {/* Section 1: Final Verdict & Roast */}
          <div className="mt-6 rounded-2xl border-2 border-primary/50 bg-primary/5 p-5 sm:p-6 shadow-inner relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 select-none opacity-10 pointer-events-none text-9xl">
              ⚖️
            </div>
            <div className="inline-block rounded border border-primary/60 bg-primary/20 px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
              OFFICIAL CLASSIFICATION
            </div>
            <h2 className="mt-2 font-display text-2xl sm:text-4xl text-foreground tracking-wide">
              {finalTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
              {finalRoast}
            </p>
          </div>

          {/* Section 2: Riot Score & Rank */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-secondary/40 p-5 text-center flex flex-col justify-center items-center">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                RIOT SCORE™
              </span>
              <div className="mt-2 font-display text-5xl sm:text-6xl text-primary text-glow-siren tracking-tight">
                {riotScore}
              </div>
              <span className="mt-1 font-mono text-[10px] text-muted-foreground">
                Calculated from crimes, penalties & damage
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-5 flex flex-col justify-center">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                OFFICIAL THREAT RANK
              </span>
              <div className="mt-2 font-display text-2xl sm:text-3xl text-accent text-glow-hazard tracking-wide">
                {riotRank}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 font-mono text-[10px] text-destructive">
                  Worst Offense: {worstOffense}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Side-by-Side Comparison: YOU vs THEM */}
          <div className="mt-6 rounded-2xl border border-border bg-card/60 p-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-display text-lg tracking-wide text-foreground">
                👥 YOU vs THEM — FORENSIC COMPARISON
              </h3>
              <span className="font-mono text-[10px] text-muted-foreground">
                Room: {roomCode || "Local Session"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-xs sm:text-sm">
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 font-bold text-primary truncate">
                {myName} (You)
              </div>
              <div className="p-3 text-muted-foreground font-semibold flex items-center justify-center">
                METRIC
              </div>
              <div className="rounded-xl border border-border bg-secondary/60 p-3 font-bold text-foreground truncate">
                {opponentName}
              </div>

              <div className="py-2.5 border-b border-border/30 font-display text-base text-foreground">
                {myMessages}
              </div>
              <div className="py-2.5 border-b border-border/30 text-muted-foreground text-xs flex items-center justify-center">
                Messages Sent
              </div>
              <div className="py-2.5 border-b border-border/30 font-display text-base text-foreground">
                {opponentMessages}
              </div>

              <div className="py-2.5 border-b border-border/30 font-display text-base text-destructive">
                {myDryCount}
              </div>
              <div className="py-2.5 border-b border-border/30 text-muted-foreground text-xs flex items-center justify-center">
                Dry Replies
              </div>
              <div className="py-2.5 border-b border-border/30 font-display text-base text-destructive">
                {opponentDryCount}
              </div>

              <div className="py-2.5 border-b border-border/30 font-display text-base text-accent">
                {myCrimes}
              </div>
              <div className="py-2.5 border-b border-border/30 text-muted-foreground text-xs flex items-center justify-center">
                Texting Crimes
              </div>
              <div className="py-2.5 border-b border-border/30 font-display text-base text-accent">
                {opponentCrimes}
              </div>

              <div className="py-2.5 border-b border-border/30 font-display text-base text-primary">
                {myPunishments}
              </div>
              <div className="py-2.5 border-b border-border/30 text-muted-foreground text-xs flex items-center justify-center">
                Punishments Endured
              </div>
              <div className="py-2.5 border-b border-border/30 font-display text-base text-primary">
                {opponentPunishments}
              </div>

              <div className="py-2.5 font-display text-base text-foreground">
                {myConvictions}
              </div>
              <div className="py-2.5 text-muted-foreground text-xs flex items-center justify-center">
                Court Convictions
              </div>
              <div className="py-2.5 font-display text-base text-foreground">
                {opponentConvictions}
              </div>
            </div>

            {/* Badges won */}
            <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-border/40">
              {mostCriminalWinner && (
                <span className="rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[10px] text-accent">
                  🏆 Most Criminal: <strong>{mostCriminalWinner}</strong>
                </span>
              )}
              {mostDryWinner && (
                <span className="rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1 font-mono text-[10px] text-destructive">
                  🧊 Most Dry: <strong>{mostDryWinner}</strong>
                </span>
              )}
              {mostPunishedWinner && (
                <span className="rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[10px] text-primary">
                  🪨 Most Punished: <strong>{mostPunishedWinner}</strong>
                </span>
              )}
              <span className="rounded-lg border border-border bg-secondary px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                Short Reply Habit: <strong>{mostUsedShortReply}</strong>
              </span>
            </div>
          </div>

          {/* Section 4: Relationship Stock Market Verdict */}
          <div className="mt-5 rounded-2xl border border-border bg-secondary/30 p-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-display text-lg tracking-wide text-foreground">
                📈 RELATIONSHIP MARKET STATUS
              </h3>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 font-mono text-xs font-bold text-primary">
                {marketStatusTier}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-sm text-muted-foreground">
                ₹{startPrice.toFixed(2)} →
              </span>
              <span
                className={`font-display text-3xl sm:text-4xl ${
                  currentPrice >= startPrice ? "text-chart-4" : "text-destructive"
                }`}
              >
                ₹{currentPrice.toFixed(2)}
              </span>
              <span
                className={`font-mono text-xs font-bold ${
                  percentageChange >= 0 ? "text-chart-4" : "text-destructive"
                }`}
              >
                ({percentageChange >= 0 ? "+" : ""}{percentageChange}%)
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div className="rounded-lg border border-border/60 bg-background/50 p-2 text-center">
                <div className="text-muted-foreground text-[10px]">PEAK</div>
                <div className="mt-0.5 font-bold text-chart-4">₹{peakPrice.toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/50 p-2 text-center">
                <div className="text-muted-foreground text-[10px]">TROUGH</div>
                <div className="mt-0.5 font-bold text-destructive">₹{troughPrice.toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/50 p-2 text-center">
                <div className="text-muted-foreground text-[10px]">BRUTAL PUNISHMENT</div>
                <div className="mt-0.5 font-bold text-primary">{mostBrutalPunishment}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/50 p-2 text-center">
                <div className="text-muted-foreground text-[10px]">PRIMARY CRIME</div>
                <div className="mt-0.5 font-bold text-accent truncate">{mostCommonCrime}</div>
              </div>
            </div>
          </div>

          {/* Section 5: Chat Court Verdict Highlights */}
          <div className="mt-5 rounded-2xl border border-border bg-secondary/30 p-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-display text-lg tracking-wide text-foreground">
                ⚖️ CHAT COURT DOCKET
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {totalCourtCases} Cases Tried ({guiltyVerdicts} Convictions)
              </span>
            </div>

            {mostSeriousCase ? (
              <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
                    CASE #{String(mostSeriousCase.caseNumber).padStart(3, "0")} — {mostSeriousCase.crimeType}
                  </span>
                  <span className="rounded bg-destructive/20 px-2 py-0.5 font-mono text-[10px] font-bold text-destructive border border-destructive/30">
                    {mostSeriousCase.verdict}
                  </span>
                </div>
                <div className="mt-2 font-mono text-xs text-foreground/90">
                  <span className="text-muted-foreground">Defendant:</span> {mostSeriousCase.offenderName}
                </div>
                <div className="mt-1 font-mono text-xs text-foreground/90">
                  <span className="text-muted-foreground">Sentence:</span> {mostSeriousCase.sentence}
                </div>
                <p className="mt-3 font-mono text-[11px] italic text-muted-foreground">
                  “Justice has been served. Unfortunately, it was served with a rock.”
                </p>
              </div>
            ) : (
              <p className="mt-4 text-center font-mono text-xs text-muted-foreground py-2">
                No active court cases filed in this session. The jury was dismissed for lack of literacy.
              </p>
            )}
          </div>

          {/* Section 6: Achievement Damage Report */}
          <div className="mt-5 rounded-2xl border border-border bg-secondary/30 p-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="font-display text-lg tracking-wide text-foreground">
                🏆 YOUR DAMAGE REPORT
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {unlockedAchievements.length} Unlocked
              </span>
            </div>

            {unlockedAchievements.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {unlockedAchievements.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3"
                  >
                    <span className="text-2xl">{a.emoji}</span>
                    <div className="min-w-0">
                      <div className="font-display text-sm text-foreground">{a.name}</div>
                      <p className="font-mono text-[11px] text-muted-foreground italic truncate">
                        “{a.roast}”
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-center font-mono text-xs text-muted-foreground py-2">
                Zero achievements unlocked. Your conversational mediocrity is legally binding.
              </p>
            )}
          </div>

          {/* Section 7: Cinematic Ending */}
          <div className="mt-6 border-t-2 border-border/70 pt-6 text-center">
            <div className="inline-block rounded border-2 border-destructive/70 bg-destructive/15 px-4 py-1.5 font-mono text-xs font-bold tracking-widest text-destructive uppercase">
              CASE CLOSED
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              Thank you for participating in this completely unnecessary investigation.
            </p>
            <div className="mt-3 font-display text-2xl tracking-widest text-primary text-glow-siren">
              BAD REPLIES. BIG CONSEQUENCES.
            </div>
          </div>

          {/* Section 8: Action Buttons */}
          <div className="mt-6 flex flex-wrap justify-center gap-2.5 pt-4 border-t border-border">
            <button
              onClick={() => {
                setReportOpen(false);
                resetRiot();
              }}
              className="rounded-xl bg-primary px-5 py-2.5 font-display text-base text-primary-foreground shadow-neon transition hover:brightness-110"
            >
              🔄 START ANOTHER RIOT
            </button>
            <button
              onClick={() => {
                setReportOpen(false);
                setCourtOpen(true);
              }}
              className="rounded-xl border border-accent/70 px-4 py-2.5 font-display text-base text-accent transition hover:bg-secondary"
            >
              ⚖️ VIEW COURT RECORD
            </button>
            <button
              onClick={() => setReportOpen(false)}
              className="rounded-xl border border-border px-4 py-2.5 font-display text-base text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              ✕ CLOSE REPORT
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
