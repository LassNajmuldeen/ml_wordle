import { ANSWER_POOL, ARCHITECTURES, NAME_INDEX, norm } from "./architectures";
import {
  MECHANISM_FAMILY,
  PARADIGM_FAMILY,
  type Arch,
  type Mechanism,
  type Modality,
  type Paradigm,
} from "./types";

// ── board shape ─────────────────────────────────────────────────────────────
export const MAX_GUESSES = 7;

export const FIELDS = [
  "year",
  "modality",
  "mechanism",
  "paradigm",
  "origin",
  "params",
  "weights",
] as const;
export type Field = (typeof FIELDS)[number];

export const FIELD_LABEL: Record<Field, string> = {
  year: "Year",
  modality: "Modality",
  mechanism: "Block",
  paradigm: "Training",
  origin: "Lab",
  params: "Size",
  weights: "Weights",
};

/** Column heads on a phone, where seven columns get ~48px each. */
export const FIELD_SHORT: Record<Field, string> = {
  year: "Year",
  modality: "Data",
  mechanism: "Block",
  paradigm: "Train",
  origin: "Lab",
  params: "Size",
  weights: "Wts",
};

export type CellState = "exact" | "partial" | "miss" | "unknown";
export type Cell = {
  state: CellState;
  text: string;
  /** compact form for the phone layout */
  short: string;
  /** why a near match is near */
  sub?: string;
  dir?: "up" | "down";
};
export type GuessResult = {
  name: string;
  correct: boolean;
  cells: Record<Field, Cell>;
};

// ── compact labels ──────────────────────────────────────────────────────────
const MODALITY_SHORT: Record<Modality, string> = {
  Vision: "Vis", Language: "Lang", Audio: "Aud", Video: "Vid", Graph: "Graph",
  Tabular: "Tab", Control: "Ctrl", Biology: "Bio", Weather: "Wx",
};
const MECHANISM_SHORT: Record<Mechanism, string> = {
  "Convolution": "Conv", "Recurrence": "RNN", "State space": "SSM",
  "Self-attention": "Attn", "MLP": "MLP", "Graph message passing": "GNN",
  "Kernel machine": "Kernel", "Tree ensemble": "Trees", "Energy-based": "Energy",
  "Hybrid": "Hybrid",
};
const PARADIGM_SHORT: Record<Paradigm, string> = {
  "Supervised": "Sup", "Autoregressive": "AR", "Masked modeling": "Masked",
  "Contrastive": "Contr", "Self-distillation": "Distill", "Reconstruction": "Recon",
  "Diffusion": "Diff", "Adversarial": "Adv", "Normalizing flow": "Flow",
  "Variational": "Var", "Reinforcement learning": "RL",
};
const LAB_SHORT: Record<string, string> = {
  "Google DeepMind": "GDM", "Google Brain": "Brain", "Facebook AI Research": "FAIR",
  "Meta AI": "Meta", "Microsoft Research": "MSR", "Microsoft Research Asia": "MSRA",
  "Université de Montréal": "Montréal", "Universiteit van Amsterdam": "UvA",
  "Stanford University": "Stanford", "University of Toronto": "Toronto",
  "University of Washington": "UW", "University of Oxford": "Oxford",
  "University of Freiburg": "Freiburg", "UC Berkeley": "Berkeley", "UC San Diego": "UCSD",
  "Allen Institute for AI": "AI2", "AT&T Bell Labs": "Bell Labs", "Mistral AI": "Mistral",
  "Technology Innovation Institute": "TII", "TU München": "TUM", "RWKV Foundation": "RWKV",
  "Cornell Aeronautical Lab": "Cornell", "Black Forest Labs": "BFL", "Baidu Research": "Baidu",
  "Hugging Face": "HF", "EleutherAI": "Eleuther", "BigScience": "BigSci",
  "Stability AI": "Stability", "Johns Hopkins": "JHU", "Tsinghua": "Tsinghua",
  "AI21 Labs": "AI21", "NHK Labs": "NHK",
};

// ── scale ───────────────────────────────────────────────────────────────────
const BUCKETS = ["<1M", "1–10M", "10–100M", "0.1–1B", "1–10B", "10–100B", "100B+"];

/** -1 = never disclosed (closed labs), -2 = no meaningful count (SVMs, forests). */
export function bucket(a: Pick<Arch, "params" | "mechanism">): number {
  const p = a.params;
  if (p == null) return nonParametric(a) ? -2 : -1;
  if (p < 1) return 0;
  if (p < 10) return 1;
  if (p < 100) return 2;
  if (p < 1_000) return 3;
  if (p < 10_000) return 4;
  if (p < 100_000) return 5;
  return 6;
}
function nonParametric(a: Pick<Arch, "mechanism">) {
  return a.mechanism === "Kernel machine" || a.mechanism === "Tree ensemble";
}
export function bucketLabel(a: Pick<Arch, "params" | "mechanism">): string {
  const b = bucket(a);
  return b === -1 ? "undisclosed" : b === -2 ? "non-parametric" : BUCKETS[b];
}

// ── labs ────────────────────────────────────────────────────────────────────
/** Sibling labs under one parent: a near miss, not a miss. */
const LAB_PARENT: [RegExp, string][] = [
  [/^(Google|Google DeepMind|Google Brain|DeepMind)$/, "Alphabet"],
  [/^(Meta AI|Facebook AI Research|FAIR)$/, "Meta"],
  [/^Microsoft Research/, "Microsoft"],
  [/^(UC Berkeley|UC San Diego|Stanford University|Stanford|CMU|Cornell|NYU|Princeton|Johns Hopkins|Caltech|University of Washington)$/, "US academia"],
  [/^(Universit|Mila|IDSIA|TU M|Tsinghua)/, "Non-US academia"],
];
/** "CMU / Google Brain" is two labs; each is compared separately. */
function labs(org: string): string[] {
  return org.split(" / ").map((s) => s.trim());
}
function parentOf(lab: string): string | null {
  for (const [re, g] of LAB_PARENT) if (re.test(lab)) return g;
  return null;
}
function shortOrg(org: string): string {
  const ls = labs(org);
  const first = LAB_SHORT[ls[0]] ?? ls[0];
  return ls.length > 1 ? `${first} +${ls.length - 1}` : first;
}

// ── comparison ──────────────────────────────────────────────────────────────
export function compare(guess: Arch, answer: Arch): GuessResult {
  // Ordinal columns have no near state: the arrow already says which way to go.
  const yd = answer.year - guess.year;
  const year: Cell = {
    state: yd === 0 ? "exact" : "miss",
    text: String(guess.year),
    short: String(guess.year),
    dir: yd === 0 ? undefined : yd > 0 ? "up" : "down",
  };

  const am = new Set(answer.modality);
  const shared = guess.modality.filter((m) => am.has(m));
  const sameSet = shared.length === guess.modality.length && shared.length === am.size;
  const modality: Cell = {
    state: sameSet ? "exact" : shared.length ? "partial" : "miss",
    text: guess.modality.join(" · "),
    short: guess.modality.map((m) => MODALITY_SHORT[m]).join(" "),
    sub: !sameSet && shared.length ? `shares ${shared.join(", ")}` : undefined,
  };

  const mFam = MECHANISM_FAMILY[guess.mechanism];
  const mechanism: Cell = {
    state:
      guess.mechanism === answer.mechanism ? "exact"
        : mFam === MECHANISM_FAMILY[answer.mechanism] ? "partial"
          : "miss",
    text: guess.mechanism,
    short: MECHANISM_SHORT[guess.mechanism],
    sub: `${mFam.toLowerCase()} family`,
  };

  const pFam = PARADIGM_FAMILY[guess.paradigm];
  const paradigm: Cell = {
    state:
      guess.paradigm === answer.paradigm ? "exact"
        : pFam === PARADIGM_FAMILY[answer.paradigm] ? "partial"
          : "miss",
    text: guess.paradigm,
    short: PARADIGM_SHORT[guess.paradigm],
    sub: `${pFam.toLowerCase()} family`,
  };

  const gl = labs(guess.org);
  const al = labs(answer.org);
  const sharedLab = gl.find((l) => al.includes(l));
  const aParents = new Set(al.map(parentOf).filter(Boolean));
  const sharedParent = gl.map(parentOf).find((p) => p && aParents.has(p));
  const origin: Cell = {
    state:
      guess.org === answer.org ? "exact"
        : sharedLab || sharedParent ? "partial"
          : "miss",
    text: guess.org,
    short: shortOrg(guess.org),
    sub: sharedLab ? `shares ${sharedLab}` : sharedParent ?? undefined,
  };

  const gb = bucket(guess);
  const ab = bucket(answer);
  const params: Cell = {
    // An undisclosed count can't be ranked, so no arrow either way.
    state: gb === ab ? "exact" : gb < 0 || ab < 0 ? "unknown" : "miss",
    text: bucketLabel(guess),
    short: gb === -1 ? "?" : gb === -2 ? "n/a" : BUCKETS[gb],
    dir: gb === ab || gb < 0 || ab < 0 ? undefined : ab > gb ? "up" : "down",
  };

  const WR = { Open: 2, Partial: 1, Closed: 0 } as const;
  const wr = Math.abs(WR[answer.weights] - WR[guess.weights]);
  const weights: Cell = {
    state: wr === 0 ? "exact" : wr === 1 ? "partial" : "miss",
    text: guess.weights,
    short: guess.weights,
  };

  // Notes explain a near match; anywhere else they're noise.
  for (const c of [modality, mechanism, paradigm, origin]) if (c.state !== "partial") c.sub = undefined;

  return {
    name: guess.name,
    correct: guess.name === answer.name,
    cells: { year, modality, mechanism, paradigm, origin, params, weights },
  };
}

// ── clues ───────────────────────────────────────────────────────────────────
export const CLUES = ["lineage", "blurb"] as const;
export type Clue = (typeof CLUES)[number];
export const CLUE_LABEL: Record<Clue, string> = {
  lineage: "Lineage",
  blurb: "One-liner",
};

export function clueText(a: Arch, clue: Clue): string {
  if (clue === "lineage") {
    return a.parents.length
      ? `Builds on ${a.parents.join(", ")}`
      : "No listed ancestor. It started a line of its own.";
  }
  // The answer's own names are blanked so the clue can't just hand it over.
  let s = a.blurb;
  for (const n of [a.name, ...(a.aliases ?? [])].sort((x, y) => y.length - x.length)) {
    s = s.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escape(n)}(?![\\p{L}\\p{N}])`, "giu"), "▇▇▇");
  }
  return s;
}
function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── daily selection ─────────────────────────────────────────────────────────
export const EPOCH = Date.UTC(2026, 0, 1);

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fixed-seed shuffle so the daily order is stable but not alphabetical. */
const ORDER: Arch[] = (() => {
  const a = [...ANSWER_POOL];
  const rnd = mulberry32(0x5ec1ea55); // fixed seed: the order must never drift
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();

export function puzzleNumber(now = new Date()): number {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - EPOCH) / 86_400_000) + 1;
}

export function answerFor(n: number): Arch {
  return ORDER[((n - 1) % ORDER.length + ORDER.length) % ORDER.length];
}

/** A practice answer that isn't today's daily. */
export function randomPractice(daily: number): number {
  let n: number;
  do n = 1 + Math.floor(Math.random() * ORDER.length);
  while (answerFor(n) === answerFor(daily));
  return n;
}

// ── lookup ──────────────────────────────────────────────────────────────────
export function lookup(input: string): Arch | undefined {
  return NAME_INDEX.get(norm(input));
}

export const ALL = [...ARCHITECTURES].sort((x, y) => x.name.localeCompare(y.name));

/** Prefix matches first, then substring, searching aliases too ("ViT"). */
export function suggest(q: string, exclude: Set<string>, limit = 6): Arch[] {
  const k = norm(q);
  if (!k) return [];
  const starts: Arch[] = [];
  const contains: Arch[] = [];
  for (const a of ALL) {
    if (exclude.has(a.name)) continue;
    const keys = [a.name, ...(a.aliases ?? [])].map(norm);
    if (keys.some((x) => x.startsWith(k))) starts.push(a);
    else if (keys.some((x) => x.includes(k))) contains.push(a);
  }
  return [...starts, ...contains].slice(0, limit);
}

// ── verdict copy ────────────────────────────────────────────────────────────
/** The name is a pun, so the results lean into it. */
export function rank(won: boolean, guesses: number): string {
  if (!won) return "Diverged";
  return (
    ["Zero-shot", "One-shot", "Few-shot", "Converged", "Fine-tuned", "Overfit, but it counts", "Early stopping at the buzzer"][
      guesses - 1
    ] ?? "Solved"
  );
}
