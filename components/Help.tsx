import { MAX_GUESSES } from "@/lib/game";

/** First-visit explainer. One worked example does more than a legend. */
export function Help({ onStart }: { onStart: () => void }) {
  return (
    <div className="help">
      <p className="lede">
        Guess today&rsquo;s machine-learning architecture in {MAX_GUESSES} tries. Every guess is
        compared with the answer on seven properties, so even a wrong guess tells you something.
      </p>

      <p className="eg-cap">Say the answer is GPT-2 and you guess BERT:</p>
      <div className="eg" aria-hidden>
        <Tile s="miss" l="Year" v="2018 ↑" />
        <Tile s="exact" l="Data" v="Lang" />
        <Tile s="exact" l="Block" v="Attn" />
        <Tile s="partial" l="Train" v="Masked" />
        <Tile s="miss" l="Lab" v="Google" />
        <Tile s="miss" l="Size" v="0.1–1B ↑" />
        <Tile s="partial" l="Wts" v="Open" />
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
            <b>Yellow</b>: close. Masked and autoregressive are both self-supervised; open and
            partial weights are one step apart. Google and DeepMind count as close too.
          </span>
        </li>
        <li>
          <span className="chip" data-state="miss" />
          <span>
            <b>Grey</b>: no relation. On Year and Size, the arrow points toward the answer.
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
        Stuck? A <b>clue</b> shows the answer&rsquo;s lineage, then its one-line description. Each
        clue uses up a guess. A new architecture every day at midnight UTC.
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
