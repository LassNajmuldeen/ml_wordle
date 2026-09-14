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
};
