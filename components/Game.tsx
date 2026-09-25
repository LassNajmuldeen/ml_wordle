"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Board } from "@/components/Board";
import { Console } from "@/components/Console";
import { Dialog } from "@/components/Dialog";
import { Help } from "@/components/Help";
import { OneLiner } from "@/components/OneLiner";
import { StatsPanel } from "@/components/StatsPanel";
import { Verdict } from "@/components/Verdict";
import { MAX_GUESSES, norm, type Answer, type Candidate, type GuessResult } from "@/lib/shared";
import {
  hasSeenHelp,
  liveStreak,
  loadDay,
  loadStats,
  markHelpSeen,
  recordResult,
  saveDay,
  type SavedGame,
  type Stats,
} from "@/lib/stats";

/** Flip stagger and duration; must match .tile.flip in globals.css. */
const FLIP_STEP = 90;
const FLIP_MS = 420;

type Start = { n: number | null; token: string };
type GuessReply = { row: GuessResult; token: string; answer: Answer | null };

async function post<T>(url: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.ok ? { ok: true, data: (await r.json()) as T } : { ok: false, status: r.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

const fresh = (token: string): SavedGame => ({ token, rows: [], oneLiner: null, answer: null });

export function Game({ candidates }: { candidates: Candidate[] }) {
  const [daily, setDaily] = useState<number | null>(null);
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  const [game, setGame] = useState<SavedGame | null>(null);
  const [landed, setLanded] = useState<number | null>(null);
  const [settled, setSettled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [active, setActive] = useState(0);
  const [msg, setMsg] = useState("");
  const [shake, setShake] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dialog, setDialog] = useState<"help" | "stats" | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const index = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of candidates) for (const k of [c.name, ...c.aliases]) m.set(norm(k), c.name);
    return m;
  }, [candidates]);

  async function start(next: "daily" | "practice") {
    setGame(null);
    const res = await post<Start>("/api/start", { mode: next });
    if (!res.ok) {
      setMsg("Couldn't reach the server. Check your connection and reload.");
      return;
    }
    const { n, token } = res.data;
    if (next === "daily" && n != null) {
      setDaily(n);
      const saved = loadDay(n);
      setGame(saved ?? fresh(token));
      if (!saved) saveDay(n, fresh(token));
    } else {
      setGame(fresh(token));
    }
  }

  useEffect(() => {
    setStats(loadStats());
    if (!hasSeenHelp()) setDialog("help");
    start("daily");
  }, []);

  const rows = game?.rows ?? [];
  const won = rows.some((r) => r.correct);
  const over = Boolean(game?.answer);
  const guessCount = rows.length;
  const left = MAX_GUESSES - guessCount;

  const guessed = useMemo(() => new Set(rows.map((r) => r.name)), [rows]);

  const suggestions = useMemo(() => {
    const k = norm(input);
    if (!k) return [];
    const starts: Candidate[] = [];
    const contains: Candidate[] = [];
    for (const c of candidates) {
      if (guessed.has(c.name)) continue;
      const keys = [c.name, ...c.aliases].map(norm);
      if (keys.some((x) => x.startsWith(k))) starts.push(c);
      else if (keys.some((x) => x.includes(k))) contains.push(c);
    }
    return [...starts, ...contains].slice(0, 6);
  }, [input, candidates, guessed]);

  function reject(text: string) {
    setMsg(text);
    setShake((s) => s + 1);
  }

  async function submit(raw?: string) {
    if (!game || over || busy) return;
    const value = (raw ?? suggestions[active]?.name ?? input).trim();
    if (!value) return;
    const name = index.get(norm(value));
    if (!name) return reject(`“${value}” isn't in the deck. Pick one from the list.`);
    if (guessed.has(name)) return reject(`Already tried ${name}.`);

    setBusy(true);
    const res = await post<GuessReply>("/api/guess", { token: game.token, guess: name });
    setBusy(false);
    if (!res.ok) {
      return reject(res.status === 0 ? "Couldn't reach the server. Try again." : "That guess didn't go through. Reload and try again.");
    }

    const { row, token, answer } = res.data;
    const next: SavedGame = { ...game, token, rows: [...game.rows, row], answer };
    setGame(next);
    setLanded(next.rows.length - 1);
    setInput("");
    setActive(0);
    setMsg("");

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSettled(false);
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setSettled(true), reduce ? 0 : FLIP_STEP * 6 + FLIP_MS + 120);

    if (mode === "daily" && daily != null) {
      saveDay(daily, next);
      if (answer) setStats(recordResult(daily, row.correct, next.rows.length));
    }
  }

  async function revealOneLiner() {
    if (!game || busy) return;
    setBusy(true);
    const res = await post<{ text: string }>("/api/clue", { token: game.token });
    setBusy(false);
    if (!res.ok) return setMsg("Couldn't load the clue. Try again.");
    const next = { ...game, oneLiner: res.data.text };
    setGame(next);
    if (mode === "daily" && daily != null) saveDay(daily, next);
  }

  function switchTo(next: "daily" | "practice") {
    if (next === "daily" && mode === "daily") return;
    setMode(next);
    setLanded(null);
    setSettled(true);
    setInput("");
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    start(next);
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
        <div className="col">
          {!over && (
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
              disabled={!game || busy}
            />
          )}
          {!over && (
            <OneLiner
              text={game?.oneLiner ?? null}
              guesses={guessCount}
              busy={busy}
              onReveal={revealOneLiner}
            />
          )}
        </div>

        <Board rows={rows} fresh={landed} total={MAX_GUESSES} flipStep={FLIP_STEP} />

        {game?.answer && settled && (
          <div className="col">
            <Verdict
              answer={game.answer}
              won={won}
              rows={rows}
              guesses={guessCount}
              puzzle={mode === "daily" ? daily : null}
              streak={mode === "daily" ? streak : null}
              celebrate={landed != null}
              onPractice={() => switchTo("practice")}
              onStats={() => setDialog("stats")}
            />
          </div>
        )}
      </main>

      <footer className="foot">
        <p>
          Found a wrong fact, or want a model added?{" "}
          <a href="mailto:lass.najm@gmail.com?subject=Zeroshot">lass.najm@gmail.com</a>
        </p>
      </footer>

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
