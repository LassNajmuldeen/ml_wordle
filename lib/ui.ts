/** Shared, data-free constants + types. Safe to import from client code. */
export const MAX_GUESSES = 8;

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
  mechanism: "Mechanism",
  paradigm: "Paradigm",
  origin: "Lab",
  params: "Scale",
  weights: "Weights",
};

export type CellState = "exact" | "partial" | "miss" | "unknown";
export type Cell = {
  state: CellState;
  text: string;
  sub?: string;
  dir?: "up" | "down";
};
export type GuessResult = {
  name: string;
  correct: boolean;
  cells: Record<Field, Cell>;
  /** answers still consistent with every clue so far */
  remaining?: number;
};

/** What the player has been told so far, replayed server-side to count candidates. */
export type HistoryEntry =
  | { kind: "guess"; name: string }
  | { kind: "hint"; field: string };

/** Size of the daily answer pool, before any guess narrows it. */
export const POOL_SIZE = 119;
