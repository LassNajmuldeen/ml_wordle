"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { FIELDS, FIELD_LABEL, FIELD_SHORT, type GuessResult } from "@/lib/shared";

const STATE_WORD = {
  exact: "match",
  partial: "partly matches",
  miss: "no match",
  unknown: "can't compare",
} as const;

export function Board({
  rows, fresh, total, flipStep,
}: {
  rows: GuessResult[];
  /** index of the row that just landed; only it animates */
  fresh: number | null;
  total: number;
  flipStep: number;
}) {
  // On a phone the tiles only fit short labels, so one row at a time can open
  // to full text. The latest wrong guess opens by default.
  const lastMiss = rows.findLastIndex((r) => !r.correct);
  const [open, setOpen] = useState<number | null>(null);
  const openRow = open ?? lastMiss;
  useEffect(() => setOpen(null), [rows.length]);

  return (
    <section className="board" aria-label="Your guesses">
      <div className="row headrow" aria-hidden>
        <div className="name" />
        <div className="tiles">
          {FIELDS.map((f) => (
            <div className="h" key={f}>
              <span className="full">{FIELD_LABEL[f]}</span>
              <span className="short">{FIELD_SHORT[f]}</span>
            </div>
          ))}
        </div>
      </div>

      <ol className="rows">
        {rows.map((r, i) => {
          const isFresh = i === fresh;
          const expanded = openRow === i;
          return (
            <li className={`row${isFresh ? " fresh" : ""}${r.correct ? " solved" : ""}`} key={r.name}>
              <div className="name">
                <span className="nm">{r.name}</span>
                <button
                  className="more"
                  aria-expanded={expanded}
                  aria-label={`${expanded ? "Hide" : "Show"} details for ${r.name}`}
                  onClick={() => setOpen(expanded ? -1 : i)}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M3 4.5 6 7.5l3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="tiles">
                {FIELDS.map((f, j) => {
                  const c = r.cells[f];
                  return (
                    <div
                      className={`tile${isFresh ? " flip" : ""}`}
                      data-state={c.state}
                      key={f}
                      style={{ "--i": j, "--step": `${flipStep}ms` } as CSSProperties}
                    >
                      <span className="val full">
                        {c.text}
                        {c.dir && <Arrow dir={c.dir} />}
                      </span>
                      <span className="val short" aria-hidden>
                        {c.short}
                        {c.dir && <Arrow dir={c.dir} />}
                      </span>
                      <span className="sr">
                        {FIELD_LABEL[f]} {c.text}: {STATE_WORD[c.state]}
                        {c.dir ? (c.dir === "up" ? ", answer is higher" : ", answer is lower") : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              {expanded && (
                <dl className="details" aria-hidden>
                  {FIELDS.map((f) => {
                    const c = r.cells[f];
                    return (
                      <div key={f} data-state={c.state}>
                        <dt>{FIELD_LABEL[f]}</dt>
                        <dd>
                          {c.text}
                          {c.dir && <Arrow dir={c.dir} />}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              )}
            </li>
          );
        })}

        {Array.from({ length: Math.max(0, total - rows.length) }, (_, i) => (
          <li className="row blank" key={`b${i}`} aria-hidden>
            <div className="name" />
            <div className="tiles">
              {FIELDS.map((f) => (
                <div className="tile empty" key={f} />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Arrow({ dir }: { dir: "up" | "down" }) {
  return (
    <span className="arrow" aria-hidden>
      {dir === "up" ? "↑" : "↓"}
    </span>
  );
}
