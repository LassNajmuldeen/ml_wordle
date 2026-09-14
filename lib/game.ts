import { ANSWER_POOL, ARCHITECTURES, NAME_INDEX, norm } from "./architectures";
import { MECHANISM_FAMILY, PARADIGM_FAMILY, type Arch } from "./types";
import { FIELDS as ALL_FIELDS } from "./ui";
import type { Cell, Field, GuessResult, HistoryEntry } from "./ui";

export {
  MAX_GUESSES,
  POOL_SIZE,
  FIELDS,
  FIELD_LABEL,
  type Field,
  type Cell,
  type CellState,
  type GuessResult,
  type HistoryEntry,
} from "./ui";

export const EPOCH = Date.UTC(2026, 0, 1);

// ── scale buckets ───────────────────────────────────────────────────────────
const BUCKETS = ["<1M", "1–10M", "10–100M", "0.1–1B", "1–10B", "10–100B", "100B+"];
export function bucket(p: number | null): number {
  if (p == null) return -1;
  if (p < 1) return 0;
  if (p < 10) return 1;
  if (p < 100) return 2;
  if (p < 1_000) return 3;
  if (p < 10_000) return 4;
  if (p < 100_000) return 5;
  return 6;
}
export function bucketLabel(p: number | null): string {
  const b = bucket(p);
  return b < 0 ? "undisclosed" : BUCKETS[b];
}

const WEIGHT_RANK = { Open: 2, Partial: 1, Closed: 0 } as const;

/** Sibling labs under one umbrella — a near-miss, not a miss. */
const ORG_GROUP: [RegExp, string][] = [
  [/^(Google|Google DeepMind|Google Brain|DeepMind)$/, "Alphabet"],
  [/Google Brain/, "Alphabet"],
  [/^(Meta AI|Facebook AI Research)$/, "Meta"],
  [/^Microsoft Research/, "Microsoft"],
  [/^(OpenAI)$/, "OpenAI"],
  [/^(Mistral AI)$/, "Mistral"],
  [/^(DeepSeek)$/, "DeepSeek"],
  [/(UC Berkeley|Stanford University|CMU|Cornell|NYU)/, "US academia"],
  [/(Universit|Mila|IDSIA|Oxford|Freiburg|TU M)/, "Non-US academia"],
];
function orgGroup(org: string): string | null {
  for (const [re, g] of ORG_GROUP) if (re.test(org)) return g;
  return null;
}

// ── comparison ──────────────────────────────────────────────────────────────
export function compare(guess: Arch, answer: Arch): GuessResult {
  const yearDelta = answer.year - guess.year;
  const year: Cell = {
    state:
      yearDelta === 0 ? "exact" : Math.abs(yearDelta) <= 3 ? "partial" : "miss",
    text: String(guess.year),
    dir: yearDelta === 0 ? undefined : yearDelta > 0 ? "up" : "down",
  };

  const gm = new Set(guess.modality);
  const am = new Set(answer.modality);
  const overlap = [...gm].filter((m) => am.has(m)).length;
  const modality: Cell = {
    state:
      overlap === gm.size && overlap === am.size
        ? "exact"
        : overlap > 0
          ? "partial"
          : "miss",
    text: guess.modality.join(" · "),
    sub:
      overlap > 0 && !(overlap === gm.size && overlap === am.size)
        ? `${overlap}/${am.size} shared`
        : undefined,
  };

  const mechanism: Cell = {
    state:
      guess.mechanism === answer.mechanism
        ? "exact"
        : MECHANISM_FAMILY[guess.mechanism] === MECHANISM_FAMILY[answer.mechanism]
          ? "partial"
          : "miss",
    text: guess.mechanism,
    sub: MECHANISM_FAMILY[guess.mechanism],
  };

  const paradigm: Cell = {
    state:
      guess.paradigm === answer.paradigm
        ? "exact"
        : PARADIGM_FAMILY[guess.paradigm] === PARADIGM_FAMILY[answer.paradigm]
          ? "partial"
          : "miss",
    text: guess.paradigm,
    sub: PARADIGM_FAMILY[guess.paradigm],
  };

  const sameGroup =
    orgGroup(guess.org) !== null && orgGroup(guess.org) === orgGroup(answer.org);
  const origin: Cell = {
    state:
      guess.org === answer.org
        ? "exact"
        : sameGroup || guess.country === answer.country
          ? "partial"
          : "miss",
    text: guess.org,
    sub: guess.country,
  };

  const gb = bucket(guess.params);
  const ab = bucket(answer.params);
  const params: Cell =
    gb < 0 || ab < 0
      ? {
          state: gb === ab ? "exact" : "unknown",
          text: bucketLabel(guess.params),
        }
      : {
          state: gb === ab ? "exact" : Math.abs(gb - ab) === 1 ? "partial" : "miss",
          text: bucketLabel(guess.params),
          dir: gb === ab ? undefined : ab > gb ? "up" : "down",
        };

  const wr = WEIGHT_RANK[answer.weights] - WEIGHT_RANK[guess.weights];
  const weights: Cell = {
    state: wr === 0 ? "exact" : Math.abs(wr) === 1 ? "partial" : "miss",
    text: guess.weights,
  };

  return {
    name: guess.name,
    correct: guess.name === answer.name,
    cells: { year, modality, mechanism, paradigm, origin, params, weights },
  };
}

// ── daily selection ─────────────────────────────────────────────────────────
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
  const rnd = mulberry32(0x5ec1ea55); // fixed seed — order must never drift
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();

export function puzzleNumber(now = new Date()): number {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.floor((today - EPOCH) / 86_400_000) + 1;
}

export function answerFor(n: number): Arch {
  return ORDER[((n - 1) % ORDER.length + ORDER.length) % ORDER.length];
}

export function lookup(input: string): Arch | undefined {
  return NAME_INDEX.get(norm(input));
}

export const ALL_NAMES = ARCHITECTURES.map((a) => a.name).sort((x, y) =>
  x.localeCompare(y),
);

// ── how much of the answer pool is still alive ──────────────────────────────

/** The single source of truth for what a revealed property says. */
export function revealField(a: Arch, field: string): string {
  switch (field) {
    case "year": return String(a.year);
    case "modality": return a.modality.join(" · ");
    case "mechanism": return a.mechanism;
    case "paradigm": return a.paradigm;
    case "origin": return `${a.org}, ${a.country}`;
    case "params": return bucketLabel(a.params);
    case "weights": return a.weights;
    case "lineage": return a.parents.length ? a.parents.join(", ") : "no listed ancestor";
    default: return "";
  }
}

/** Two feedback rows look identical to the player when every cell agrees. */
function sameFeedback(a: GuessResult, b: GuessResult): boolean {
  return ALL_FIELDS.every((f) => {
    const x = a.cells[f];
    const y = b.cells[f];
    return x.state === y.state && x.dir === y.dir && x.text === y.text;
  });
}

/**
 * Count the answers a perfect logician could still be holding. Every clue the
 * player has been given is replayed against each candidate; a candidate
 * survives only if it would have produced exactly the same board.
 */
export function candidatesLeft(answer: Arch, history: HistoryEntry[]): number {
  if (history.length === 0) return ANSWER_POOL.length;
  return ANSWER_POOL.filter((cand) =>
    history.every((h) => {
      if (h.kind === "hint") return revealField(cand, h.field) === revealField(answer, h.field);
      const g = lookup(h.name);
      if (!g) return true;
      return sameFeedback(compare(g, cand), compare(g, answer));
    }),
  ).length;
}
