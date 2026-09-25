import { CLUES, type Clue } from "@/lib/shared";

/** Two clues that unlock for free as you guess. Locked ones show how close they are. */
export function Clues({ clues, guesses }: { clues: Clue[]; guesses: number }) {
  return (
    <section className="clues" aria-label="Clues">
      {CLUES.map((c) => {
        const got = clues.find((x) => x.id === c.id);
        const progress = Math.min(1, guesses / c.after);
        return (
          <div className="cluecard" data-open={Boolean(got)} key={c.id}>
            <div className="cc-head">
              <span className="cc-k">{c.label}</span>
              {!got && (
                <span className="cc-n num">
                  {Math.min(guesses, c.after)}/{c.after}
                </span>
              )}
            </div>
            {got ? (
              <p className="cc-text">{got.text}</p>
            ) : (
              <p className="cc-lock">Unlocks after {c.after} guesses</p>
            )}
            {!got && (
              <span className="cc-bar" aria-hidden>
                <span style={{ width: `${progress * 100}%` }} />
              </span>
            )}
          </div>
        );
      })}
    </section>
  );
}
