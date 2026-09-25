import { CLUES, MAX_GUESSES } from "@/lib/shared";

/** First-visit explainer. One worked example does more than a legend. */
export function Help({ onStart }: { onStart: () => void }) {
  return (
    <div className="help">
      <p className="lede">
        Guess today&rsquo;s machine-learning architecture in {MAX_GUESSES} tries. Every guess is
        compared with the answer on seven properties, so even a wrong guess tells you something.
      </p>

      <p className="eg-cap">Say the answer is CLIP and you guess BERT:</p>
      <div className="eg" aria-hidden>
        <Tile s="miss" l="Year" v="2018 ↑" />
        <Tile s="partial" l="Data" v="Lang" />
        <Tile s="exact" l="Block" v="Attn" />
        <Tile s="miss" l="Train" v="Masked" />
        <Tile s="miss" l="Lab" v="Google" />
        <Tile s="exact" l="Size" v="0.1–1B" />
        <Tile s="exact" l="Wts" v="Open" />
      </div>

      <ul className="keylist">
        <li>
          <span className="chip" data-state="exact" />
          <span>
            <b>Green</b>: same value.
          </span>
        </li>
        <li>
          <span className="chip" data-state="partial" />
          <span>
            <b>Yellow</b>: partly the same. Only for lists: BERT is Language, CLIP is Vision and
            Language.
          </span>
        </li>
        <li>
          <span className="chip" data-state="miss" />
          <span>
            <b>Grey</b>: different. On Year and Size, the arrow points toward the answer.
          </span>
        </li>
        <li>
          <span className="chip" data-state="unknown" />
          <span>
            <b>Hatched</b>: can&rsquo;t compare. Some labs never published a parameter count.
          </span>
        </li>
      </ul>

      <p className="fine">
        Clues unlock for free: the answer&rsquo;s <b>lineage</b> after {CLUES[0].after} guesses,
        and a <b>one-liner</b> about it after {CLUES[1].after}. A new architecture every day at
        midnight UTC.
      </p>

      <button className="go wide" onClick={onStart} autoFocus>
        Start guessing
      </button>
    </div>
  );
}

function Tile({ s, l, v }: { s: string; l: string; v: string }) {
  return (
    <div className="tile" data-state={s}>
      <span className="lab">{l}</span>
      <span className="val">{v}</span>
    </div>
  );
}
