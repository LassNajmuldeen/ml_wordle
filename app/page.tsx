"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Board, type Row } from "@/components/Board";
import { Console } from "@/components/Console";
import { Dialog } from "@/components/Dialog";
import { Help } from "@/components/Help";
import { StatsPanel } from "@/components/StatsPanel";
import { Verdict } from "@/components/Verdict";
import {
  CLUES,
  MAX_GUESSES,
  answerFor,
  clueText,
  compare,
  lookup,
  puzzleNumber,
  randomPractice,
  suggest,
} from "@/lib/game";
import {
  hasSeenHelp,
  liveStreak,
  loadDay,
  loadStats,
  markHelpSeen,
  recordResult,
  saveDay,
  type Move,
  type Stats,
} from "@/lib/stats";

/** Flip stagger and duration; must match .tile.flip in globals.css. */
const FLIP_STEP = 90;
const FLIP_MS = 420;

export default function Page() {
  const [daily, setDaily] = useState<number | null>(null);
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  const [n, setN] = useState<number | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [fresh, setFresh] = useState<number | null>(null);
  const [settled, setSettled] = useState(true);
  const [input, setInput] = useState("");
  const [active, setActive] = useState(0);
  const [msg, setMsg] = useState("");
  const [shake, setShake] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dialog, setDialog] = useState<"help" | "stats" | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The day is read from the player's clock, so it has to wait for the browser.
  useEffect(() => {
    const d = puzzleNumber();
    setDaily(d);
    setN(d);
    setMoves(loadDay(d));
    setStats(loadStats());
    if (!hasSeenHelp()) setDialog("help");
  }, []);

  const answer = n == null ? null : answerFor(n);

  const rows: Row[] = useMemo(() => {
    if (!answer) return [];
    let clue = 0;
    return moves.flatMap((m): Row[] => {
      if (m.kind === "clue") {
        const c = CLUES[clue++];
        return c ? [{ kind: "clue", clue: c, text: clueText(answer, c) }] : [];
      }
      const a = lookup(m.name);
      return a ? [{ kind: "guess", ...compare(a, answer) }] : [];
    });
  }, [moves, answer]);

  const won = rows.some((r) => r.kind === "guess" && r.correct);
  const status = won ? "won" : rows.length >= MAX_GUESSES ? "lost" : "playing";
  const guessCount = rows.filter((r) => r.kind === "guess").length;
  const cluesUsed = rows.filter((r) => r.kind === "clue").length;
  const left = MAX_GUESSES - rows.length;

  const guessed = useMemo(
    () => new Set(rows.flatMap((r) => (r.kind === "guess" ? [r.name] : []))),
    [rows],
  );
  const suggestions = useMemo(() => suggest(input, guessed), [input, guessed]);

  /** Commit a move, animate it, persist it, and record the result if it ended the game. */
  function play(next: Move[]) {
    setMoves(next);
    setFresh(next.length - 1);
    setInput("");
    setActive(0);
    setMsg("");

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSettled(false);
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(
      () => setSettled(true),
      reduce ? 0 : FLIP_STEP * 6 + FLIP_MS + 120,
    );

    if (mode !== "daily" || daily == null || !answer) return;
    saveDay(daily, next);
    const hit = next.some((m) => m.kind === "guess" && lookup(m.name)?.name === answer.name);
    if (hit || next.length >= MAX_GUESSES) {
      const g = next.filter((m) => m.kind === "guess").length;
      setStats(recordResult(daily, hit, g));
    }
  }

  function submit(raw?: string) {
    if (status !== "playing" || !answer) return;
    const value = (raw ?? suggestions[active]?.name ?? input).trim();
    if (!value) return;
    const arch = lookup(value);
    if (!arch) {
      setMsg(`“${value}” isn't in the deck. Pick one from the list.`);
      setShake((s) => s + 1);
      return;
    }
    if (guessed.has(arch.name)) {
      setMsg(`Already tried ${arch.name}.`);
      setShake((s) => s + 1);
      return;
    }
    play([...moves, { kind: "guess", name: arch.name }]);
  }

  function takeClue() {
    if (status !== "playing" || cluesUsed >= CLUES.length || left <= 1) return;
    play([...moves, { kind: "clue" }]);
  }

  function switchTo(next: "daily" | "practice") {
    if (daily == null) return;
    if (next === "daily" && mode === "daily") return;
    setMode(next);
    setN(next === "daily" ? daily : randomPractice(daily));
    setMoves(next === "daily" ? loadDay(daily) : []);
    setFresh(null);
    setSettled(true);
    setInput("");
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeDialog() {
    if (dialog === "help") markHelpSeen();
    setDialog(null);
  }

  const streak = stats && daily ? liveStreak(stats, daily) : 0;

  return (
    <>
      <header className="bar">
        <button className="icon" onClick={() => setDialog("help")} aria-label="How to play">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7.8 7.9a2.2 2.2 0 1 1 2.9 2.1c-.45.17-.7.55-.7 1v.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="10" cy="14.1" r="1" fill="currentColor" />
          </svg>
        </button>

        <div className="brand">
          <h1 className="wordmark">
            zer<span className="o">0</span>shot
          </h1>
          <div className="modes" role="group" aria-label="Mode">
            <button aria-pressed={mode === "daily"} onClick={() => switchTo("daily")}>
              Daily{daily ? <span className="num"> #{daily}</span> : null}
            </button>
            <button aria-pressed={mode === "practice"} onClick={() => switchTo("practice")}>
              {mode === "practice" ? "New practice" : "Practice"}
            </button>
          </div>
        </div>

        <button className="icon stat" onClick={() => setDialog("stats")} aria-label={`Statistics, streak ${streak}`}>
          {streak > 0 && (
            <span className="streak num" aria-hidden>
              {streak}
            </span>
          )}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M4 16v-5M10 16V4M16 16v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <main className="shell">
        {status === "playing" && (
          <Console
            value={input}
            onChange={(v) => {
              setInput(v);
              setActive(0);
              setMsg("");
            }}
            onSubmit={submit}
            suggestions={suggestions}
            active={active}
            setActive={setActive}
            left={left}
            msg={msg}
            shake={shake}
            disabled={n == null}
            clue={
              guessCount > 0 && cluesUsed < CLUES.length && left > 1
                ? { next: CLUES[cluesUsed], onTake: takeClue }
                : null
            }
          />
        )}

        <Board rows={rows} fresh={fresh} total={MAX_GUESSES} flipStep={FLIP_STEP} />

        {status !== "playing" && answer && settled && (
          <Verdict
            answer={answer}
            won={won}
            rows={rows}
            guesses={guessCount}
            puzzle={mode === "daily" ? daily : null}
            streak={mode === "daily" ? streak : null}
            celebrate={fresh != null}
            onPractice={() => switchTo("practice")}
            onStats={() => setDialog("stats")}
          />
        )}
      </main>

      <Dialog open={dialog === "help"} onClose={closeDialog} title="How to play">
        <Help onStart={closeDialog} />
      </Dialog>

      <Dialog open={dialog === "stats"} onClose={closeDialog} title="Your record">
        {stats && daily ? (
          <StatsPanel stats={stats} today={daily} highlight={mode === "daily" && won ? guessCount : null} />
        ) : null}
      </Dialog>
    </>
  );
}
