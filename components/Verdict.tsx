export type Answer = {
  name: string;
  year: number;
  org: string;
  scale: string;
  weights: string;
  parents: string[];
  blurb: string;
};

/** Factual, not congratulatory. The architecture is the payoff. */
function headline(won: boolean, guesses: number, total: number, nearMiss: number) {
  if (!won) {
    return nearMiss > 0
      ? `Out of guesses. Your last guess matched ${nearMiss} of 7 properties.`
      : "Out of guesses.";
  }
  if (guesses === 1) return "Solved on the first guess.";
  return `Solved in ${guesses} of ${total}.`;
}

export function Verdict({
  answer, won, guesses, total, nearMiss, showStats,
  onShare, onNext, onStats, shareLabel,
}: {
  answer: Answer;
  won: boolean;
  guesses: number;
  total: number;
  nearMiss: number;
  showStats: boolean;
  onShare: () => void;
  onNext: () => void;
  onStats: () => void;
  shareLabel: string;
}) {
  return (
    <section className="verdict">
      <p className="status" data-win={won}>
        {headline(won, guesses, total, nearMiss)}
      </p>
      <h2 className="name">{answer.name}</h2>
      <p className="facts">
        {answer.year} · {answer.org} · {answer.scale} ·{" "}
        {answer.weights.toLowerCase()} weights
      </p>
      <p className="blurb">{answer.blurb}</p>
      {answer.parents.length > 0 && (
        <p className="from">Builds on {answer.parents.join(", ")}</p>
      )}
      <div className="actions">
        <button className="go" onClick={onShare}>
          {shareLabel}
        </button>
        {showStats && (
          <button className="ghost" onClick={onStats}>
            View stats
          </button>
        )}
        <button className="ghost" onClick={onNext}>
          Play a random one
        </button>
      </div>
    </section>
  );
}
