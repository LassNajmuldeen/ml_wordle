/**
 * Grading, clues and the daily pick. Server only: nothing here may be imported
 * from a client component, or the deck and the order ship to the browser.
 */
import { createHash } from "node:crypto";
import { ANSWER_POOL, NAME_INDEX } from "./architectures";
import { secret } from "./token";
import {
  norm,
  type Answer,
  type Cell,
  type GuessResult,
} from "./shared";
import type { Arch, Mechanism, Modality, Paradigm } from "./types";

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
  "Stability AI": "Stability", "Johns Hopkins": "JHU", "AI21 Labs": "AI21", "NHK Labs": "NHK",
  "Moonshot AI": "Moonshot", "Physical Intelligence": "Phys. Int.", "Samsung SAIT": "Samsung",
  "Arc Institute": "Arc", "Renmin University": "Renmin", "Google Research": "G. Research",
};

// ── scale ───────────────────────────────────────────────────────────────────
const BUCKETS = ["<1M", "1–10M", "10–100M", "0.1–1B", "1–10B", "10–100B", "100B+"];

/** -1 = never disclosed (closed labs), -2 = no meaningful count (SVMs, forests). */
export function bucket(a: Pick<Arch, "params" | "mechanism">): number {
  const p = a.params;
  if (p == null) return a.mechanism === "Kernel machine" || a.mechanism === "Tree ensemble" ? -2 : -1;
  if (p < 1) return 0;
  if (p < 10) return 1;
  if (p < 100) return 2;
  if (p < 1_000) return 3;
  if (p < 10_000) return 4;
  if (p < 100_000) return 5;
  return 6;
}
export function bucketLabel(a: Pick<Arch, "params" | "mechanism">): string {
  const b = bucket(a);
  return b === -1 ? "undisclosed" : b === -2 ? "non-parametric" : BUCKETS[b];
}

/** "CMU / Google Brain" is two labs. */
function labs(org: string): string[] {
  return org.split(" / ").map((s) => s.trim());
}
function shortOrg(org: string): string {
  const ls = labs(org);
  const first = LAB_SHORT[ls[0]] ?? ls[0];
  return ls.length > 1 ? `${first} +${ls.length - 1}` : first;
}

/** Green when equal, yellow when two sets overlap, otherwise grey. */
function overlap(g: string[], a: string[]): Cell["state"] {
  const shared = g.filter((x) => a.includes(x)).length;
  if (shared === g.length && shared === a.length) return "exact";
  return shared ? "partial" : "miss";
}

// ── comparison ──────────────────────────────────────────────────────────────
/**
 * Yellow is rare on purpose: a green on any column already carries a lot of
 * information. Only a genuine partial overlap is yellow: shared modalities, or
 * a joint lab that includes one of the answer's labs. Everything else is exact
 * or nothing, with arrows on the two ordered columns.
 */
export function compare(guess: Arch, answer: Arch): GuessResult {
  const yd = answer.year - guess.year;
  const gb = bucket(guess);
  const ab = bucket(answer);
  const exact = (x: unknown, y: unknown): Cell["state"] => (x === y ? "exact" : "miss");

  return {
    name: guess.name,
    correct: guess.name === answer.name,
    cells: {
      year: {
        state: yd === 0 ? "exact" : "miss",
        text: String(guess.year),
        short: String(guess.year),
        dir: yd === 0 ? undefined : yd > 0 ? "up" : "down",
      },
      modality: {
        state: overlap(guess.modality, answer.modality),
        text: guess.modality.join(" · "),
        short: guess.modality.map((m) => MODALITY_SHORT[m]).join(" "),
      },
      mechanism: {
        state: exact(guess.mechanism, answer.mechanism),
        text: guess.mechanism,
        short: MECHANISM_SHORT[guess.mechanism],
      },
      paradigm: {
        state: exact(guess.paradigm, answer.paradigm),
        text: guess.paradigm,
        short: PARADIGM_SHORT[guess.paradigm],
      },
      origin: {
        state: overlap(labs(guess.org), labs(answer.org)),
        text: guess.org,
        short: shortOrg(guess.org),
      },
      params: {
        // An undisclosed count can't be ranked, so no arrow either way.
        state: gb === ab ? "exact" : gb < 0 || ab < 0 ? "unknown" : "miss",
        text: bucketLabel(guess),
        short: gb === -1 ? "?" : gb === -2 ? "n/a" : BUCKETS[gb],
        dir: gb === ab || gb < 0 || ab < 0 ? undefined : ab > gb ? "up" : "down",
      },
      weights: {
        state: exact(guess.weights, answer.weights),
        text: guess.weights,
        short: guess.weights,
      },
    },
  };
}

// ── clue ────────────────────────────────────────────────────────────────────
/** The answer's one-liner, with its own names blanked so it can't hand it over. */
export function oneLiner(a: Arch): string {
  let s = a.blurb;
  for (const n of [a.name, ...(a.aliases ?? [])].sort((x, y) => y.length - x.length)) {
    const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`(?<![\\p{L}\\p{N}])${esc}(?![\\p{L}\\p{N}])`, "giu"), "▇▇▇");
  }
  return s;
}

export function answerCard(a: Arch): Answer {
  return {
    name: a.name,
    year: a.year,
    org: a.org,
    mechanism: a.mechanism,
    size: bucketLabel(a) + (a.params != null ? " params" : ""),
    weights: a.weights,
    parents: a.parents,
    blurb: a.blurb,
  };
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

/**
 * The daily order is a shuffle seeded from the server secret. The repo is
 * public, so a seed in the source would let anyone compute every future answer.
 * Each day draws from the entries eligible that day (see `Arch.from`), so
 * adding models never changes a day that has already started.
 */
const orders = new Map<number, Arch[]>();
function orderFor(n: number): Arch[] {
  // Practice numbers are far past any day, so they draw from every current entry.
  const pool = ANSWER_POOL.filter((a) => (a.from ?? 0) <= n && n <= (a.until ?? Infinity));
  const cached = orders.get(pool.length);
  if (cached) return cached;
  const seed = createHash("sha256").update(`order:${secret()}`).digest().readUInt32LE(0);
  const a = [...pool];
  const rnd = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  orders.set(pool.length, a);
  return a;
}

export function puzzleNumber(now = new Date()): number {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - EPOCH) / 86_400_000) + 1;
}

export function answerFor(n: number): Arch {
  const o = orderFor(n);
  return o[((n - 1) % o.length + o.length) % o.length];
}

/** A practice puzzle whose answer isn't today's. Practice numbers never collide with days. */
export function randomPractice(): number {
  const today = answerFor(puzzleNumber());
  let n: number;
  do n = 1_000_000 + Math.floor(Math.random() * 1_000_000);
  while (answerFor(n) === today);
  return n;
}

export function lookup(input: string): Arch | undefined {
  return NAME_INDEX.get(norm(input));
}
