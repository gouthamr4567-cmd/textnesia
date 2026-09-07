export type RoastCategory =
  | "dry"
  | "k"
  | "seen"
  | "ghost"
  | "late"
  | "genz"
  | "typing"
  | "dead"
  | "chaos";

export const ROASTS: Record<RoastCategory, string[]> = {
  dry: [
    "Bro replied like the keyboard charged per letter.",
    "That “hmm” has the emotional depth of a loading screen.",
    "I've seen CAPTCHA questions with more personality.",
    "Bro is texting like every word costs ₹100.",
    "This reply was written, reviewed and rejected by a rock.",
    "Your message had the energy of an out-of-office auto reply.",
  ],
  k: [
    "One letter. Zero effort. Maximum consequences.",
    "“k” — the international symbol for “I have given up”.",
    "You typed one character. The stone department typed nothing back.",
    "Somewhere, an English teacher just felt a chill.",
  ],
  seen: [
    "You opened it. You read it. You chose violence.",
    "Seen at 11:04. Replied at never o'clock.",
    "The blue tick is now evidence in an ongoing investigation.",
    "Reading without replying is a crime in 7 fictional jurisdictions.",
  ],
  ghost: [
    "They didn't ghost you. They upgraded to invisible mode.",
    "They disappeared, but unfortunately their communication crime record remains.",
    "Missing person report filed. Suspect is typing... no they're not.",
    "The conversation has been declared a protected archaeological site.",
  ],
  late: [
    "Take your time. Apparently time is exactly what you have.",
    "Replying after 4 business days is technically a postal service.",
    "This reply arrived with a carbon date attached.",
    "You waited so long the message expired and grew a beard.",
  ],
  genz: [
    "Six words. Zero of them English.",
    "This message needs subtitles and a support group.",
    "Detected 100% vibes and 0% grammar.",
    "The dictionary called. It's hiding.",
  ],
  typing: [
    "Two minutes of typing for a two-letter reply. Economics has died.",
    "You wrote a novel and delivered a receipt.",
    "The typing indicator worked harder than you did.",
  ],
  dead: [
    "This conversation is now a museum exhibit.",
    "Time of death: the moment they said “k”.",
    "The chat has been donated to science.",
  ],
  chaos: [
    "Communication has left the building, the country and the atmosphere.",
    "This is no longer a chat. This is a crime scene.",
    "The rocks are throwing themselves now.",
  ],
};

export const SYMPATHY: string[] = [
  "Don't worry. You deserve better than a one-letter conversation.",
  "They disappeared, but your dignity is still here.",
  "We understand this is difficult. Please remember that staring at the Seen status will not make a reply appear.",
  "Your message was thoughtful. Their reply was a pebble. That's not on you.",
  "You tried. They ghosted. We threw rocks.",
];

export const EXCUSES = [
  { label: "Phone died", weight: 8 },
  { label: "Didn't see message", weight: 21 },
  { label: "Busy", weight: 14 },
  { label: "Forgot", weight: 20 },
  { label: "Mentally replied", weight: 37 },
];

export const POLICE_LINES = [
  "We received several reports of suspicious texting behaviour.",
  "We have received a report of unauthorized emotional damage.",
  "Step away from the keyboard. Slowly.",
  "Suspect has been sentenced to geological consequences.",
];

export const COURT_CHARGES: { id: string; label: string; evidence: string }[] = [
  { id: "k", label: "Excessive “k” usage", evidence: "Exhibit A: a single letter, delivered without remorse." },
  { id: "dry", label: "Criminal lack of enthusiasm", evidence: "Exhibit B: 0 questions asked in the entire conversation." },
  { id: "late", label: "Replying after 4 business days", evidence: "Exhibit C: timestamp gap visible from space." },
  { id: "ghost", label: "Unauthorized ghosting", evidence: "Exhibit D: suspect vanished mid-sentence." },
  { id: "seen", label: "Seen without response", evidence: "Exhibit E: read receipt, no receipt of feelings." },
  { id: "genz", label: "Gen-Z vocabulary abuse", evidence: "Exhibit F: “bro fr ngl 💀” submitted as a sentence." },
];
