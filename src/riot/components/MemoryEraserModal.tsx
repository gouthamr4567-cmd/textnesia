import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import { memoryService, analyzeMemory, type MemoryIncident } from "../services/memoryService";

type Step = "input" | "analyzed" | "deleting" | "erased" | "backup" | "restored" | "corrupted";

interface MemoryEraserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  onMemoryRecorded?: (incident: MemoryIncident) => void;
}

export function MemoryEraserModal({
  isOpen,
  onClose,
  initialText = "",
  onMemoryRecorded,
}: MemoryEraserModalProps) {
  const [text, setText] = useState(initialText);
  const [incident, setIncident] = useState<MemoryIncident | null>(null);
  const [step, setStep] = useState<Step>("input");
  const [progress, setProgress] = useState(0);
  const [vault, setVault] = useState<MemoryIncident[]>([]);
  const [tab, setTab] = useState<"eraser" | "vault">("eraser");

  useEffect(() => {
    if (isOpen) {
      setVault(memoryService.getAll());
      if (initialText) {
        setText(initialText);
        handleAnalyze(initialText);
      } else {
        setStep("input");
      }
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const handleAnalyze = (inputTxt?: string) => {
    const raw = (inputTxt ?? text).trim();
    if (!raw) return;
    const analysis = analyzeMemory(raw);
    const newInc: MemoryIncident = {
      ...analysis,
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      status: "ACTIVE",
      source: initialText ? "chat" : "manual",
    };
    setIncident(newInc);
    memoryService.save(newInc);
    setVault(memoryService.getAll());
    if (onMemoryRecorded) onMemoryRecorded(newInc);
    setStep("analyzed");
  };

  const handleStartDelete = () => {
    setStep("deleting");
    setProgress(0);

    const timer1 = setTimeout(() => setProgress(47), 400);
    const timer2 = setTimeout(() => setProgress(73), 800);
    const timer3 = setTimeout(() => setProgress(91), 1200);
    const timer4 = setTimeout(() => setProgress(99), 1600);
    const timer5 = setTimeout(() => {
      setProgress(100);
      setStep("erased");
      memoryService.bumpStat("erased");
      if (incident) {
        memoryService.updateStatus(incident.id, "ERASED");
        setVault(memoryService.getAll());
      }
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  };

  const handleMakeItWorse = () => {
    if (!incident) return;
    setStep("corrupted");
    memoryService.bumpStat("corrupted");
    memoryService.updateStatus(incident.id, "CORRUPTED");
    setVault(memoryService.getAll());
  };

  const handleRestoreToVault = () => {
    if (incident) {
      memoryService.updateStatus(incident.id, "ACTIVE");
      setVault(memoryService.getAll());
    }
    setStep("input");
    setText("");
    setTab("vault");
  };

  const handleSelectFromVault = (item: MemoryIncident) => {
    setIncident(item);
    setText(item.description);
    setTab("eraser");
    setStep("analyzed");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-6 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="riot-panel relative my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto border-2 border-primary/60 bg-card/95 p-5 shadow-[0_0_60px_rgba(0,0,0,0.85)] sm:p-7"
        >
          {/* Header tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border/70 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab("eraser")}
                className={`rounded-xl px-3.5 py-1.5 font-display text-base transition ${
                  tab === "eraser"
                    ? "bg-primary text-primary-foreground shadow-neon"
                    : "border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                🧠 MEMORY ERASER
              </button>
              <button
                onClick={() => setTab("vault")}
                className={`rounded-xl px-3.5 py-1.5 font-display text-base transition ${
                  tab === "vault"
                    ? "bg-accent text-accent-foreground shadow-hazard"
                    : "border border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                🗂️ INCIDENT VAULT ({vault.length})
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-xl border border-border px-3.5 py-1.5 font-display text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              ✕ CLOSE
            </button>
          </div>

          {/* VAULT TAB */}
          {tab === "vault" && (
            <div className="mt-5 space-y-4">
              <div>
                <h2 className="font-display text-2xl text-foreground">🗂️ INCIDENT VAULT</h2>
                <p className="font-mono text-xs text-muted-foreground">
                  Your permanent collection of things your brain refuses to forget.
                </p>
              </div>

              {vault.length === 0 ? (
                <div className="rounded-2xl border border-border/70 bg-secondary/30 p-8 text-center">
                  <div className="text-4xl">🧠</div>
                  <p className="mt-2 font-display text-lg text-foreground">No Incidents Vaulted Yet</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Type a message you regret or let the chat detect an embarrassing text.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                  {vault.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border/80 bg-secondary/40 p-3.5 transition hover:border-primary/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base text-foreground truncate">
                            {item.title}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                              item.status === "CORRUPTED"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                : item.status === "RESTORED"
                                  ? "bg-destructive/20 text-destructive border border-destructive/40"
                                  : "bg-chart-4/20 text-chart-4 border border-chart-4/40"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-foreground/80 mt-1 truncate">
                          "{item.description}"
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-2 font-mono text-[10px] text-muted-foreground">
                          <span>Embarrassment: <strong className="text-destructive">{item.embarrassment}%</strong></span>
                          <span>•</span>
                          <span>Replay: <strong className="text-accent">{item.replayProbability}%</strong></span>
                          <span>•</span>
                          <span>Priority: <strong className="text-primary">{item.deletePriority}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleSelectFromVault(item)}
                          className="rounded-lg bg-primary/20 border border-primary/50 px-2.5 py-1 font-mono text-xs text-primary transition hover:bg-primary/30"
                        >
                          🧠 VIEW / ERASE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ERASER TAB */}
          {tab === "eraser" && (
            <div className="mt-5 space-y-5">
              {/* Step 1: Input */}
              {step === "input" && (
                <div className="space-y-4">
                  <div>
                    <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-primary border border-primary/30">
                      TEXTNESIA RECOVERY PROTOCOL
                    </span>
                    <h2 className="mt-2 font-display text-3xl sm:text-4xl text-primary text-glow-siren">
                      🧠 MEMORY ERASER
                    </h2>
                    <p className="mt-1 font-mono text-xs text-muted-foreground sm:text-sm">
                      Something you wish you could forget?
                    </p>
                    <p className="font-mono text-[11px] text-primary/80">
                      Any memory. Any incident. Completely fictional deletion.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      What do you want to forget?
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="I wish I could forget what happened yesterday..."
                      rows={3}
                      className="w-full rounded-xl border border-input bg-secondary/50 p-3.5 text-sm outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAnalyze()}
                      disabled={!text.trim()}
                      className="rounded-xl bg-primary px-6 py-3 font-display text-xl text-primary-foreground shadow-neon transition hover:brightness-110 disabled:opacity-50"
                    >
                      🗑️ ERASE THIS MEMORY
                    </button>
                    <button
                      onClick={() => {
                        const samples = [
                          "I called my teacher mom in front of the whole class",
                          "I waved back at someone who was waving at the person behind me",
                          "I fell on stage in front of everyone",
                          "I sent a message to the wrong person",
                          "I replied 'k' to a 4-paragraph love message",
                          "I gave the completely wrong answer with 100% confidence",
                          "I forgot my friend's birthday after they threw me a party",
                        ];
                        const pick = samples[Math.floor(Math.random() * samples.length)];
                        setText(pick ?? "");
                      }}
                      className="rounded-xl border border-border px-4 py-3 font-display text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    >
                      🎲 RANDOM REGRET
                    </button>
                  </div>

                  <p className="font-mono text-[10px] text-muted-foreground italic text-center pt-2">
                    *Fictional comedy simulation. Does not alter real human memories or brain chemistry.
                  </p>
                </div>
              )}

              {/* Step 2: Analyzed */}
              {step === "analyzed" && incident && (
                <div className="space-y-5">
                  <div className="rounded-2xl border-2 border-primary/60 bg-primary/10 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
                        ⚡ MEMORY DIAGNOSTIC LOCATED
                      </span>
                      <span className="rounded bg-destructive/20 px-2 py-0.5 font-mono text-[10px] font-bold text-destructive border border-destructive/40">
                        PRIORITY: {incident.deletePriority}
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-2xl sm:text-3xl text-foreground">
                      {incident.title}
                    </h3>
                    <p className="mt-2 font-mono text-sm text-foreground/90 bg-background/60 p-3 rounded-xl border border-border">
                      "{incident.description}"
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                      <div className="rounded-xl border border-border bg-background/50 p-2.5">
                        <span className="text-[10px] text-muted-foreground">Embarrassment</span>
                        <div className="mt-1 font-display text-2xl text-destructive">{incident.embarrassment}%</div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/50 p-2.5">
                        <span className="text-[10px] text-muted-foreground">Emotional Damage</span>
                        <div className="mt-1 font-display text-2xl text-accent">{incident.emotionalDamage}%</div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/50 p-2.5">
                        <span className="text-[10px] text-muted-foreground">Replay Probability</span>
                        <div className="mt-1 font-display text-2xl text-chart-4">{incident.replayProbability}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleStartDelete}
                      className="rounded-xl bg-destructive px-6 py-3.5 font-display text-xl text-destructive-foreground shadow-hazard transition hover:brightness-110"
                    >
                      🗑️ DELETE MEMORY
                    </button>
                    <button
                      onClick={() => setStep("input")}
                      className="rounded-xl border border-border px-4 py-3 font-display text-base text-muted-foreground transition hover:bg-secondary"
                    >
                      ✏️ EDIT TEXT
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Deleting Animation */}
              {step === "deleting" && (
                <div className="py-8 text-center space-y-4">
                  <div className="text-5xl animate-bounce">🧠⚡</div>
                  <h3 className="font-display text-3xl text-primary text-glow-siren">
                    {progress < 40 && "SCANNING BRAIN STORAGE..."}
                    {progress >= 40 && progress < 70 && "LOCATING EMBARRASSING DATA..."}
                    {progress >= 70 && progress < 95 && "ISOLATING CRINGE ARCHIVE..."}
                    {progress >= 95 && "DELETING NEURON PATHWAYS..."}
                  </h3>

                  <div className="w-full max-w-md mx-auto rounded-full border border-primary/50 bg-secondary/50 p-1">
                    <div
                      className="h-3 rounded-full bg-primary shadow-neon transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="font-mono text-lg font-bold text-accent">{progress}%</p>
                </div>
              )}

              {/* Step 4: Erased */}
              {step === "erased" && (
                <div className="py-6 text-center space-y-4">
                  <div className="text-5xl animate-pulse">🧠✨</div>
                  <h3 className="font-display text-3xl sm:text-4xl text-chart-4 text-glow-hazard">
                    🧠 MEMORY ERASED
                  </h3>
                  <p className="font-mono text-sm sm:text-base text-foreground/90 max-w-md mx-auto">
                    “Congratulations. Your brain has officially forgotten something.”
                  </p>

                  {incident && (
                    <div className="mt-3 rounded-xl border border-chart-4/40 bg-chart-4/10 p-3.5 max-w-md mx-auto text-left">
                      <div className="flex items-center justify-between text-chart-4 font-mono text-[10px] font-bold uppercase">
                        <span>STATUS: ERASED FROM RECORD</span>
                        <span>100% PURGED</span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground line-through">
                        "{incident.description}"
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-center gap-3 pt-3">
                    <button
                      onClick={() => {
                        setStep("input");
                        setText("");
                      }}
                      className="rounded-xl bg-primary px-5 py-3 font-display text-base text-primary-foreground shadow-neon transition hover:brightness-110"
                    >
                      🧠 ERASE ANOTHER MEMORY
                    </button>
                    <button
                      onClick={handleStartDelete}
                      className="rounded-xl border border-primary/50 px-4 py-3 font-display text-base text-primary transition hover:bg-primary/20"
                    >
                      🔄 DELETE AGAIN
                    </button>
                    <button
                      onClick={handleMakeItWorse}
                      className="rounded-xl border border-destructive/80 px-4 py-3 font-display text-base text-destructive transition hover:bg-destructive/15"
                    >
                      💀 MAKE IT WORSE
                    </button>
                    <button
                      onClick={() => setTab("vault")}
                      className="rounded-xl border border-border px-4 py-3 font-display text-base text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    >
                      🗂️ INCIDENT VAULT
                    </button>
                  </div>
                </div>
              )}

              {/* Step 7: Corrupted */}
              {step === "corrupted" && (
                <div className="space-y-5 text-center">
                  <div className="rounded-2xl border-2 border-amber-500/70 bg-amber-500/10 p-6">
                    <div className="text-5xl">🌀</div>
                    <h3 className="mt-2 font-display text-3xl text-amber-400">
                      MEMORY CORRUPTED
                    </h3>
                    <p className="mt-2 font-mono text-sm text-foreground/90">
                      Congratulations. You remembered it incorrectly. Now it's twice as awkward.
                    </p>
                    <div className="mt-4 rounded-xl border border-amber-500/40 bg-background/70 p-3.5 font-mono text-xs text-amber-300 italic">
                      "Wait... did I also wave back when they were waving at someone behind me?!"
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => setStep("input")}
                      className="rounded-xl bg-primary px-5 py-3 font-display text-base text-primary-foreground shadow-neon transition hover:brightness-110"
                    >
                      🧠 ERASE ANOTHER MEMORY
                    </button>
                    <button
                      onClick={() => setTab("vault")}
                      className="rounded-xl border border-border px-4 py-3 font-display text-base text-muted-foreground transition hover:bg-secondary"
                    >
                      🗂️ GO TO VAULT
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
