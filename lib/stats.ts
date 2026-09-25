"use client";

import { MAX_GUESSES } from "./game";

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

const empty = (): Stats => ({
  played: 0,
  wins: 0,
  streak: 0,
  best: 0,
  dist: Array(MAX_GUESSES).fill(0),
  lastPuzzle: null,
});

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const s = JSON.parse(raw) as Partial<Stats>;
    // Older saves had eight slots; anything past the board's length is dropped.
    const dist = Array.from({ length: MAX_GUESSES }, (_, i) => s.dist?.[i] ?? 0);
    return { ...empty(), ...s, dist };
  } catch {
    return empty();
  }
}

/** A streak survives only if yesterday's daily was played. */
export function liveStreak(s: Stats, today: number): number {
  return s.lastPuzzle != null && s.lastPuzzle >= today - 1 ? s.streak : 0;
}

/** Record one finished daily. Idempotent per puzzle, so a reload never double-counts. */
export function recordResult(puzzle: number, won: boolean, guesses: number): Stats {
  const prev = loadStats();
  if (prev.lastPuzzle != null && prev.lastPuzzle >= puzzle) return prev;

  const streak = won ? (prev.lastPuzzle === puzzle - 1 ? prev.streak + 1 : 1) : 0;
  const dist = [...prev.dist];
  if (won && guesses >= 1 && guesses <= MAX_GUESSES) dist[guesses - 1] += 1;

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

// ── saved daily ─────────────────────────────────────────────────────────────
/** Moves, not graded rows: grading is re-run on load, so a logic fix reaches old games. */
export type Move = { kind: "guess"; name: string } | { kind: "clue" };

const dayKey = (n: number) => `zeroshot:v2:day:${n}`;

export function loadDay(n: number): Move[] {
  try {
    const raw = localStorage.getItem(dayKey(n));
    const moves = raw ? (JSON.parse(raw) as Move[]) : [];
    return Array.isArray(moves) ? moves : [];
  } catch {
    return [];
  }
}

export function saveDay(n: number, moves: Move[]) {
  try {
    localStorage.setItem(dayKey(n), JSON.stringify(moves));
  } catch {}
}

const SEEN = "zeroshot:seen-help";
export function hasSeenHelp(): boolean {
  try {
    return localStorage.getItem(SEEN) === "1";
  } catch {
    return true;
  }
}
export function markHelpSeen() {
  try {
    localStorage.setItem(SEEN, "1");
  } catch {}
}
