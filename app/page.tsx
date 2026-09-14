"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Board, type Row } from "@/components/Board";
import { Console } from "@/components/Console";
import { Dialog } from "@/components/Dialog";
import { StatsPanel } from "@/components/StatsPanel";
import { Verdict, type Answer } from "@/components/Verdict";
import { loadStats, recordResult, type Stats } from "@/lib/stats";
import { FIELDS, FIELD_LABEL, MAX_GUESSES, type GuessResult } from "@/lib/ui";

type Status = "playing" | "won" | "lost";
type Saved = { rows: Row[]; status: Status; hintUsed: boolean; answer: Answer | null };

const MARK = { exact: "🟩", partial: "🟨", miss: "🟥", unknown: "⬜" } as const;

export default function Page() {
  const [mode, setMode] = useState<"daily" | "practice">("daily");
  const [n, setN] = useState<number | null>(null);
  const [dailyN, setDailyN] = useState<number | null>(null);
  const [names, setNames] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<Status>("playing");
  const [hintUsed, setHintUsed] = useState(false);
  const [picking, setPicking] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [input, setInput] = useState("");
  const [active, setActive] = useState(0);
  const [msg, setMsg] = useState("");
  const [tone, setTone] = useState<"info" | "error">("info");
  const [shareLabel, setShareLabel] = useState("Copy result");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dialog, setDialog] = useState<"help" | "stats" | null>(null);

  const used = rows.length;
  const left = MAX_GUESSES - used;
  const guessCount = rows.filter((r) => r.kind === "guess").length;

  useEffect(() => {
    fetch("/api/puzzle")
      .then((r) => r.json())
      .then((d: { number: number; names: string[] }) => {
        setNames(d.names);
        setDailyN(d.number);
        setN(d.number);
        setStats(loadStats());
        const raw = localStorage.getItem(`zeroshot:d:${d.number}`);
        if (!raw) return;
        try {
          const s: Saved = JSON.parse(raw);
          setRows(s.rows);
          setStatus(s.status);
          setHintUsed(s.hintUsed);
          setAnswer(s.answer);
        } catch {}
      })
      .catch(() => {
        setTone("error");
        setMsg("Could not load today's puzzle. Reload to try again.");
      });
  }, []);

  useEffect(() => {
    if (mode !== "daily" || !dailyN) return;
    localStorage.setItem(
      `zeroshot:d:${dailyN}`,
      JSON.stringify({ rows, status, hintUsed, answer } satisfies Saved),
    );
  }, [mode, dailyN, rows, status, hintUsed, answer]);

  const reveal = useCallback(async (num: number) => {
    const r = await fetch("/api/reveal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ n: num }),
    });
    setAnswer(await r.json());
  }, []);

  const suggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set(rows.flatMap((r) => (r.kind === "guess" ? [r.name] : [])));
    const starts: string[] = [];
    const contains: string[] = [];
    for (const nm of names) {
      if (seen.has(nm)) continue;
      const l = nm.toLowerCase();
      if (l.startsWith(q)) starts.push(nm);
      else if (l.includes(q)) contains.push(nm);
    }
    return [...starts, ...contains].slice(0, 7);
  }, [input, names, rows]);

  /** How many properties the final guess matched, for the loss copy. */
  const nearMiss = useMemo(() => {
    const last = [...rows].reverse().find((r) => r.kind === "guess");
    if (!last || last.kind !== "guess") return 0;
    return FIELDS.filter((f) => last.cells[f].state === "exact").length;
  }, [rows]);

  /** Daily results only. recordResult is idempotent per puzzle number. */
  function finish(final: Row[], won: boolean) {
    if (mode !== "daily" || dailyN == null) return;
    setStats(recordResult(dailyN, won, final.filter((r) => r.kind === "guess").length));
  }

  async function submit(raw?: string) {
    const value = (raw ?? suggestions[active] ?? input).trim();
    if (!value || status !== "playing" || n == null || busy) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ n, guess: value }),
      });
      if (!res.ok) {
        setTone("error");
        setMsg(`"${value}" isn't in the list. Pick from the suggestions.`);
        return;
      }
      const g: GuessResult = await res.json();
      const next: Row[] = [...rows, { kind: "guess", ...g }];
      setRows(next);
      setInput("");
      setActive(0);
      setTone("info");
      if (g.correct) {
        setStatus("won");
        finish(next, true);
        await reveal(n);
      } else if (next.length >= MAX_GUESSES) {
        setStatus("lost");
        finish(next, false);
        await reveal(n);
      }
    } finally {
      setBusy(false);
    }
  }

  async function takeHint(field: string) {
    if (n == null || hintUsed || status !== "playing") return;
    setPicking(false);
    const res = await fetch("/api/hint", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ n, field }),
    });
    const d: { field: string; value: string } = await res.json();
    const next: Row[] = [...rows, { kind: "hint", field: d.field, value: d.value }];
    setHintUsed(true);
    setRows(next);
    if (next.length >= MAX_GUESSES) {
      setStatus("lost");
      finish(next, false);
      await reveal(n);
    }
  }

  function startPractice() {
    setMode("practice");
    setN(1_000_003 + Math.floor(Math.random() * 999_983));
    setRows([]);
    setStatus("playing");
    setHintUsed(false);
    setAnswer(null);
    setInput("");
    setMsg("");
    setShareLabel("Copy result");
  }

  function backToDaily() {
    if (mode === "daily") return;
    setMode("daily");
    setN(dailyN);
    const raw = dailyN ? localStorage.getItem(`zeroshot:d:${dailyN}`) : null;
    let s: Saved | null = null;
    try {
      s = raw ? JSON.parse(raw) : null;
    } catch {}
    setRows(s?.rows ?? []);
    setStatus(s?.status ?? "playing");
    setHintUsed(s?.hintUsed ?? false);
    setAnswer(s?.answer ?? null);
    setInput("");
    setMsg("");
  }

  async function share() {
    const head = `Zeroshot ${mode === "daily" ? `#${dailyN}` : "practice"} ${
      status === "won" ? `${guessCount}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`
    }`;
    const grid = rows
      .map((r) =>
        r.kind === "hint"
          ? "💡 revealed"
          : FIELDS.map((f) => MARK[r.cells[f].state]).join(""),
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(`${head}\n${grid}\n${location.origin}`);
      setShareLabel("Copied");
      setTimeout(() => setShareLabel("Copy result"), 2000);
    } catch {
      setShareLabel("Copy failed");
    }
  }

  return (
    <>
      <header className="bar">
        <div className="left">
          <button className="icon" onClick={() => setDialog("help")} aria-label="How to play">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="7.2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 7a2 2 0 1 1 2.6 1.9c-.4.15-.6.5-.6.9v.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="9" cy="12.7" r="0.85" fill="currentColor" />
            </svg>
          </button>
        </div>

        <h1 className="wordmark">
          Zeroshot
          <span className="puzzleno num">
            {mode === "daily" ? (dailyN ? `Daily #${dailyN}` : "Daily") : "Practice"}
          </span>
        </h1>

        <div className="right">
          <button className="modebtn" aria-current={mode === "daily"} onClick={backToDaily}>
            Daily
          </button>
          <button className="modebtn" aria-current={mode === "practice"} onClick={startPractice}>
            Practice
          </button>
          <button className="icon" onClick={() => setDialog("stats")} aria-label="Statistics">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M3 15V9M8 15V3M13 15v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <main className="shell">
        {status === "playing" && (
          <Console
            value={input}
            onChange={(v) => {
              setInput(v);
              setActive(0);
            }}
            onSubmit={submit}
            suggestions={suggestions}
            active={active}
            setActive={setActive}
            left={left}
            msg={msg}
            tone={tone}
            disabled={busy || n == null}
          />
        )}

        <Board rows={rows} freshIndex={rows.length - 1} total={MAX_GUESSES} />

        {status === "playing" && rows.length > 0 && (
          <div className="controls">
            {!picking && (
              <button
                className="ghost"
                disabled={hintUsed || left <= 1}
                aria-expanded={picking}
                onClick={() => setPicking(true)}
              >
                {hintUsed ? "Property revealed" : "Reveal a property (costs a guess)"}
              </button>
            )}
            {picking &&
              FIELDS.map((f) => (
                <button className="ghost" key={f} onClick={() => takeHint(f)}>
                  {FIELD_LABEL[f]}
                </button>
              ))}
            {picking && (
              <button className="ghost" onClick={() => setPicking(false)}>
                Cancel
              </button>
            )}
          </div>
        )}

        {status !== "playing" && answer && (
          <Verdict
            answer={answer}
            won={status === "won"}
            guesses={guessCount}
            total={MAX_GUESSES}
            nearMiss={nearMiss}
            showStats={mode === "daily"}
            onShare={share}
            onNext={startPractice}
            onStats={() => setDialog("stats")}
            shareLabel={shareLabel}
          />
        )}
      </main>

      <Dialog open={dialog === "help"} onClose={() => setDialog(null)} title="How to play">
        <p className="msg" style={{ marginTop: 0 }}>
          Guess the architecture in {MAX_GUESSES} tries. Every guess is scored on
          seven properties.
        </p>
        <ul className="keylist" style={{ marginTop: 18 }}>
          <li>
            <span className="chip" data-state="exact">2017</span>
            <span>Exact match on that property.</span>
          </li>
          <li>
            <span className="chip" data-state="partial">Language</span>
            <span>
              Close: overlapping modality, same mechanism or paradigm family, or a
              sibling lab. The small line under the value says what overlapped.
            </span>
          </li>
          <li>
            <span className="chip" data-state="miss">Recurrence</span>
            <span>No relation on that property.</span>
          </li>
          <li>
            <span className="chip" data-state="unknown">undisclosed</span>
            <span>Not comparable. Some labs never published a parameter count.</span>
          </li>
          <li>
            <span className="chip" data-state="miss">2015 ↑</span>
            <span>
              Year and Scale are exact or nothing: if the tile is not green, the
              arrow points toward the answer.
            </span>
          </li>
        </ul>
      </Dialog>

      <Dialog open={dialog === "stats"} onClose={() => setDialog(null)} title="Statistics">
        {stats ? (
          <StatsPanel stats={stats} highlight={status === "won" ? guessCount : null} />
        ) : (
          <p className="msg">Loading.</p>
        )}
      </Dialog>
    </>
  );
}
