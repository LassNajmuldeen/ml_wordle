import { FIELDS, FIELD_LABEL, type GuessResult } from "@/lib/ui";

export type HintRow = { kind: "hint"; field: string; value: string; remaining?: number };
export type Row = ({ kind: "guess" } & GuessResult) | HintRow;

const STATE_WORD = {
  exact: "exact match",
  partial: "near match",
  miss: "no match",
  unknown: "not comparable",
} as const;

/** Repeating an unchanged count is noise; only a drop is worth printing. */
function narrowing(rows: Row[], i: number): number | null {
  const here = (rows[i] as { remaining?: number }).remaining;
  if (here == null) return null;
  for (let j = i - 1; j >= 0; j--) {
    const prev = (rows[j] as { remaining?: number }).remaining;
    if (prev != null) return prev === here ? null : here;
  }
  return here;
}

export function Board({
  rows, freshIndex, total,
}: {
  rows: Row[];
  freshIndex: number;
  /** total attempts, so the unplayed rows are drawn as empty slots */
  total: number;
}) {
  const blanks = Math.max(0, total - rows.length);
  return (
    <section className="board" aria-label="Your guesses">
      <div className="cols head" aria-hidden>
        {FIELDS.map((f) => (
          <div className="h" key={f}>
            {FIELD_LABEL[f]}
          </div>
        ))}
      </div>

      {rows.map((r, i) => {
        const left = narrowing(rows, i);
        if (r.kind === "hint") {
          return (
            <div className="guess" key={`h${i}`}>
              <div className="hintrow">
                <span className="k">Revealed</span>
                <span className="v">
                  {FIELD_LABEL[r.field as keyof typeof FIELD_LABEL] ?? r.field}: {r.value}
                </span>
                {left != null && <span className="narrow">{left} still possible</span>}
              </div>
            </div>
          );
        }
        return (
          <div
            className={`guess${i === freshIndex ? " fresh" : ""}${r.correct ? " solved" : ""}`}
            key={`${r.name}-${i}`}
          >
            <p className="cap" data-win={r.correct}>
              <span className="nm">{r.name}</span>
              {!r.correct && left != null && (
                <span className="narrow">
                  {left === 1 ? "only 1 answer fits" : `${left} still possible`}
                </span>
              )}
            </p>
            <div className="cols">
              {FIELDS.map((f) => {
                const c = r.cells[f];
                return (
                  <div className="tile" data-state={c.state} key={f}>
                    <span className="lab">{FIELD_LABEL[f]}</span>
                    <span className="val">
                      {c.text}
                      {c.dir && (
                        <span className="arrow" aria-hidden>
                          {c.dir === "up" ? "↑" : "↓"}
                        </span>
                      )}
                    </span>
                    {c.state === "partial" && c.sub && <span className="sub">{c.sub}</span>}
                    <span className="sr">
                      {FIELD_LABEL[f]}: {STATE_WORD[c.state]}
                      {c.dir ? (c.dir === "up" ? ", answer is higher" : ", answer is lower") : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {Array.from({ length: blanks }, (_, i) => (
        <div className="guess blank" key={`b${i}`} aria-hidden>
          <div className="cols">
            {FIELDS.map((f) => (
              <div className="tile empty" key={f} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
