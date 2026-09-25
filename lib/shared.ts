/** Data-free constants and types. The only game module the browser imports. */

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
  dir?: "up" | "down";
};
export type GuessResult = {
  name: string;
  correct: boolean;
  cells: Record<Field, Cell>;
};

/** Clues unlock for free once you've made this many guesses. */
export const CLUES = [
  { id: "lineage", label: "Lineage", after: 3 },
  { id: "blurb", label: "One-liner", after: 5 },
] as const;
export type ClueId = (typeof CLUES)[number]["id"];
export type Clue = { id: ClueId; text: string };

/** What autocomplete needs, and nothing that could grade a guess. */
export type Candidate = { name: string; aliases: string[]; year: number };

/** Revealed only after the game ends. */
export type Answer = {
  name: string;
  year: number;
  org: string;
  mechanism: string;
  size: string;
  weights: string;
  parents: string[];
  blurb: string;
};

export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[·‑–—]/g, "-")
    .replace(/[^a-z0-9]+/g, "");
}

/** The name is a pun, so the results lean into it. */
export function rank(won: boolean, guesses: number): string {
  if (!won) return "Diverged";
  return (
    ["Zero-shot", "One-shot", "Few-shot", "Converged", "Fine-tuned", "Overfit, but it counts", "Early stopping at the buzzer"][
      guesses - 1
    ] ?? "Solved"
  );
}
