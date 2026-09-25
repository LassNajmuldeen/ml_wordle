"use client";

import { useEffect, useRef, useState } from "react";
import type { Row } from "@/components/Board";
import { Countdown } from "@/components/Countdown";
import { FIELDS, MAX_GUESSES, bucketLabel, rank } from "@/lib/game";
import type { Arch } from "@/lib/types";

const MARK = { exact: "🟩", partial: "🟨", miss: "⬛", unknown: "⬜" } as const;

function shareText(rows: Row[], won: boolean, guesses: number, puzzle: number | null) {
  const score = won ? `${guesses}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const head = `Zeroshot ${puzzle ? `#${puzzle}` : "practice"} · ${score} · ${rank(won, guesses)}`;
  const grid = rows
    .map((r) => (r.kind === "clue" ? "💡" : FIELDS.map((f) => MARK[r.cells[f].state]).join("")))
    .join("\n");
  return `${head}\n\n${grid}\n\n${location.origin}`;
}

export function Verdict({
  answer, won, rows, guesses, puzzle, streak, celebrate, onPractice, onStats,
}: {
  answer: Arch;
  won: boolean;
  rows: Row[];
  guesses: number;
  /** null in practice */
  puzzle: number | null;
  streak: number | null;
  /** true when the game ended just now, false when restored from a reload */
  celebrate: boolean;
  onPractice: () => void;
  onStats: () => void;
}) {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const [canShare, setCanShare] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches);
    if (celebrate) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [celebrate]);

  const text = () => shareText(rows, won, guesses, puzzle);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text());
      setCopied("done");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 2200);
  }

  async function nativeShare() {
    try {
      await navigator.share({ text: text() });
    } catch {}
  }

  function postToX() {
    const url = `https://x.com/intent/post?text=${encodeURIComponent(text())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="verdict" ref={ref} data-win={won} aria-live="polite">
      {won && celebrate && <Burst />}
      <p className="rank">{rank(won, guesses)}</p>
      <p className="score">
        {won ? (
          <>
            Solved in <span className="num">{guesses}</span> of {MAX_GUESSES}
            {streak ? (
              <>
                {" "}· <span className="num">{streak}</span>-day streak
              </>
            ) : null}
          </>
        ) : (
          "Out of guesses. It was:"
        )}
      </p>

      <h2 className="answer">{answer.name}</h2>
      <p className="facts">
        {answer.year} · {answer.org} · {answer.mechanism} · {bucketLabel(answer)}
        {answer.params != null ? " params" : ""} · {answer.weights.toLowerCase()} weights
      </p>
      <p className="blurb">{answer.blurb}</p>
      {answer.parents.length > 0 && <p className="from">Builds on {answer.parents.join(", ")}</p>}

      <div className="actions">
        <button className="go x" onClick={postToX}>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
            <path fill="currentColor" d="M18.9 1.2h3.7l-8 9.2L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5L9 13 0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.3H4.3l13.3 17.3Z" />
          </svg>
          Post your score
        </button>
        {canShare ? (
          <button className="ghost" onClick={nativeShare}>
            Share…
          </button>
        ) : (
          <button className="ghost" onClick={copy}>
            {copied === "done" ? "Copied" : copied === "failed" ? "Copy failed" : "Copy result"}
          </button>
        )}
      </div>

      <div className="after">
        {puzzle ? <Countdown /> : null}
        <div className="links">
          <button className="link" onClick={onPractice}>
            {puzzle ? "Play a practice round" : "Another practice round"}
          </button>
          {puzzle ? (
            <button className="link" onClick={onStats}>
              See your record
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Tile-coloured squares off the top of the card. Runs once, only on a fresh win. */
function Burst() {
  const bits = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.3;
    const dist = 90 + ((i * 37) % 70);
    return {
      "--dx": `${Math.cos(angle) * dist * 1.6}px`,
      "--dy": `${Math.sin(angle) * dist - 60}px`,
      "--rot": `${(i * 53) % 360}deg`,
      "--c": ["var(--exact)", "var(--near)", "var(--accent)"][i % 3],
      "--d": `${(i % 5) * 18}ms`,
    } as React.CSSProperties;
  });
  return (
    <div className="burst" aria-hidden>
      {bits.map((s, i) => (
        <i key={i} style={s} />
      ))}
    </div>
  );
}
