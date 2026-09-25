import { ONELINER_AFTER } from "@/lib/shared";

/** A clue the player has to choose to see: locked, then offered, then shown. */
export function OneLiner({
  text, guesses, busy, onReveal,
}: {
  text: string | null;
  guesses: number;
  busy: boolean;
  onReveal: () => void;
}) {
  const unlocked = guesses >= ONELINER_AFTER;
  return (
    <section className="cluecard" data-open={Boolean(text)} aria-label="Clue">
      <div className="cc-head">
        <span className="cc-k">One-liner</span>
        {!unlocked && (
          <span className="cc-n num">
            {guesses}/{ONELINER_AFTER}
          </span>
        )}
      </div>
      {text ? (
        <p className="cc-text">{text}</p>
      ) : unlocked ? (
        <button className="cc-reveal" onClick={onReveal} disabled={busy}>
          Reveal what it&rsquo;s known for
        </button>
      ) : (
        <p className="cc-lock">Available after {ONELINER_AFTER} guesses, if you want it</p>
      )}
      {!unlocked && (
        <span className="cc-bar" aria-hidden>
          <span style={{ width: `${(guesses / ONELINER_AFTER) * 100}%` }} />
        </span>
      )}
    </section>
  );
}
