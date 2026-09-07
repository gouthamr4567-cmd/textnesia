/**
 * Centralized sound manager. Uses the WebAudio API to synthesize short
 * comedic effects — no external audio assets, no autoplay loops.
 */

export type SoundId =
  | "message"
  | "bonk"
  | "scratch"
  | "punch"
  | "hammer"
  | "brick"
  | "boulder"
  | "siren"
  | "horror"
  | "piano"
  | "achievement"
  | "sting"
  | "ui";

let ctx: AudioContext | null = null;
let enabled = true;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.18,
  slideTo?: number,
  delay = 0,
) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, gain = 0.25, delay = 0, filterFreq = 1200) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const frames = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFreq, t0);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t0);
}

const RECIPES: Record<SoundId, () => void> = {
  message: () => tone(880, 0.09, "sine", 0.1, 1200),
  ui: () => tone(520, 0.05, "triangle", 0.06),
  bonk: () => {
    tone(180, 0.16, "square", 0.16, 60);
    noise(0.1, 0.12);
  },
  scratch: () => {
    tone(700, 0.32, "sawtooth", 0.1, 90);
    noise(0.3, 0.14, 0, 2600);
  },
  punch: () => {
    noise(0.12, 0.2, 0, 900);
    tone(120, 0.18, "square", 0.18, 45);
  },
  hammer: () => {
    tone(240, 0.1, "square", 0.15, 90);
    noise(0.22, 0.24, 0.05, 700);
  },
  brick: () => {
    noise(0.3, 0.3, 0, 500);
    tone(90, 0.32, "sine", 0.22, 35);
  },
  boulder: () => {
    tone(70, 0.9, "sine", 0.26, 26);
    noise(0.8, 0.28, 0.05, 320);
    tone(140, 0.6, "sawtooth", 0.1, 40, 0.1);
  },
  siren: () => {
    tone(720, 0.35, "sawtooth", 0.09, 420);
    tone(420, 0.35, "sawtooth", 0.09, 720, 0.35);
    tone(720, 0.35, "sawtooth", 0.09, 420, 0.7);
  },
  horror: () => {
    tone(110, 1.4, "sawtooth", 0.07, 55);
    tone(113, 1.4, "sine", 0.05, 57);
  },
  piano: () => {
    [523.25, 466.16, 415.3, 349.23].forEach((f, i) =>
      tone(f, 0.7, "triangle", 0.09, undefined, i * 0.32),
    );
  },
  achievement: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, 0.22, "square", 0.09, undefined, i * 0.08),
    );
  },
  sting: () => {
    [392, 349.23, 311.13, 261.63].forEach((f, i) =>
      tone(f, 0.24, "triangle", 0.11, undefined, i * 0.13),
    );
    noise(0.2, 0.1, 0.5);
  },
};

export const soundManager = {
  get enabled() {
    return enabled;
  },
  setEnabled(v: boolean) {
    enabled = v;
    if (typeof window !== "undefined") localStorage.setItem("riot-sound", v ? "1" : "0");
  },
  init() {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("riot-sound");
    if (stored !== null) enabled = stored === "1";
  },
  play(id: SoundId) {
    if (!enabled) return;
    try {
      RECIPES[id]?.();
    } catch {
      /* audio unavailable — silently ignore */
    }
  },
};
