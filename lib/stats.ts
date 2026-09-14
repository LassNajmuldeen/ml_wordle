"use client";

/** Daily record, kept in the browser. Nothing leaves the device. */
export type Stats = {
  played: number;
  wins: number;
  streak: number;
  best: number;
  /** index 0 = solved in 1 guess */
  dist: number[];
  lastPuzzle: number | null;
};

const KEY = "zeroshot:stats";

export const EMPTY: Stats = {
  played: 0,
  wins: 0,
  streak: 0,
  best: 0,
  dist: [0, 0, 0, 0, 0, 0, 0, 0],
  lastPuzzle: null,
};

export function loadStats(): Stats {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const s = JSON.parse(raw) as Partial<Stats>;
    return { ...EMPTY, ...s, dist: s.dist?.length === 8 ? s.dist : [...EMPTY.dist] };
  } catch {
    return EMPTY;
  }
}

/**
 * Record one finished daily. Idempotent per puzzle, so a reload or a second
 * render never double-counts.
 */
export function recordResult(puzzle: number, won: boolean, guesses: number): Stats {
  const prev = loadStats();
  if (prev.lastPuzzle === puzzle) return prev;

  const consecutive = prev.lastPuzzle === puzzle - 1;
  const streak = won ? (consecutive ? prev.streak + 1 : 1) : 0;
  const dist = [...prev.dist];
  if (won && guesses >= 1 && guesses <= 8) dist[guesses - 1] += 1;

  const next: Stats = {
    played: prev.played + 1,
    wins: prev.wins + (won ? 1 : 0),
    streak,
    best: Math.max(prev.best, streak),
    dist,
    lastPuzzle: puzzle,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}
