# zer0shot

A daily Wordle for machine-learning architectures. Name the model in 7 tries;
every guess is graded against the answer on seven properties, so a wrong guess
still narrows the field.

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
```

---

## The game

Each guess returns a row of seven tiles:

| Column | Green | Yellow | Grey |
|---|---|---|---|
| **Year** | same year | · | different, with ↑/↓ toward the answer |
| **Modality** | identical set | the sets overlap | disjoint |
| **Block** | same core op | · | different |
| **Training** | same objective | · | different |
| **Lab** | same lab | a joint lab shares one (`CMU / Google Brain` vs `Google Brain`) | different |
| **Size** | same order-of-magnitude bucket | · | different, with ↑/↓ toward the answer |
| **Weights** | same (Open / Partial / Closed) | · | different |

**Yellow is rare on purpose.** A green on any column is already a lot of
information, so yellow only means a genuine partial overlap between two lists.
There are no "same family" or "sibling lab" near-misses and no explanatory
notes under the values.

**Hatched** means Size can't be compared: closed labs never published a count
(GPT-4, Gemini, Claude), and SVMs and random forests don't have one. The two are
labelled `undisclosed` and `non-parametric` and only match their own kind.

**One clue, by choice.** After 5 guesses you can reveal the answer's one-line
description, with its own name blanked out. It's free and only appears if you
click for it; the server won't send it before then.

**Results** are named for how quickly you got there: 1 guess is *ZERO-SHOTTED!*,
2 *One-shot*, 3 *Few-shot*, then *Converged*, *Fine-tuned*, *Overfit, but it counts*, and *Last epoch* on the final guess. A loss
is *Diverged*. The verdict has a one-tap **Post your score** to X.

---

## How it runs

The page itself is static. Grading happens in two route handlers, so the deck
and the daily order never reach the browser; the page only ships names,
aliases and years for autocomplete.

| Route | Does |
|---|---|
| `POST /api/start` | `{ mode: "daily" \| "practice" }` → a signed token for a new game. The server picks the day, not the browser's clock. |
| `POST /api/guess` | `{ token, guess }` → the graded row, a new token, and the answer **only once the game is over**. |
| `POST /api/clue` | `{ token }` → the one-liner, only if the token has 5+ guesses. |

### Anti-cheat

- **The answer never ships.** No blurb, property or lab data is in the client
  bundle. Check with `grep -r Reparameterisation .next/static` after a build.
- **The order is secret.** The daily shuffle is seeded from `ZEROSHOT_SECRET`,
  not from the source. The repo is public, so a seed in the code would let
  anyone compute every future answer.
- **The game can't be forged.** State lives in an HMAC-signed token (puzzle
  number + guesses). Editing it to claim the game is over fails the signature,
  so the answer can't be revealed early. Repeating a guess is refused.

What it doesn't stop: someone playing the same day in a private window to
probe. That costs them a real game each time, which is the same trade every
server-graded daily makes.

**`ZEROSHOT_SECRET` must be set** in Vercel (Production and Preview) before
deploying; the API refuses to run in production without it. Locally a dev
secret is used. Changing the secret reshuffles every day's answer.

```bash
npx vercel env add ZEROSHOT_SECRET production
```

Progress and stats live in `localStorage`: the day's token and graded rows,
and a streak / distribution record. Nothing else leaves the device except
Vercel Web Analytics page views.

**Adding models without breaking anyone's game.** Each day draws its answer
from the entries eligible that day. New answer-eligible entries get
`from: <puzzle number>` set to a day that hasn't started yet (usually
tomorrow), so today's answer never changes underneath someone mid-game. To
retire an entry from the rotation but keep it guessable, set
`until: <last puzzle number>`.

---

## Where the data comes from

**Curate, then scrape to audit.** There's no clean source of truth for
"modality, lab, year, type" across 70 years of ML, so the deck in
`lib/architectures.ts` is hand-curated and `npm run enrich` checks it against
four public APIs, writing disagreements to `data/enrichment-report.json`. It
never edits the deck; a human reviews the report.

| Source | Gives you |
|---|---|
| **arXiv** `export.arxiv.org/api/query` | first-preprint date, exact title |
| **Semantic Scholar** `api.semanticscholar.org/graph/v1` | venue, author affiliations |
| **Hugging Face Hub** `huggingface.co/api/models` | parameter counts from safetensors metadata |
| **Wikidata** SPARQL | organisation → parent org |

```bash
npm run enrich                  # whole deck, ~4 min (Semantic Scholar is 1 rps)
npm run enrich -- --only BERT
```

Title search matches lookalikes: the first run "corrected" BERT's year to 2020
because arXiv's top hit for `ti:"BERT"` is *BERT-ATTACK*. The optional `paper`
field pins an entry to its exact title; four entries have it (BERT,
Transformer, ResNet-50, Mamba). Filling in the rest is the highest-value hour of
data work in this repo.

Block and Training are judgement calls no source states, and stay hand-assigned.

---

## Layout

```
app/
  page.tsx               server component: passes autocomplete names only
  api/start, api/guess, api/clue   signed-token game, graded on the server
  layout.tsx             fonts, metadata, analytics
  globals.css            the whole design system
  opengraph-image.tsx    the X / link-preview card (1200×630)
  icon.svg, apple-icon.tsx
components/              Game (client state), Board, OneLiner, Console, Verdict, Help, StatsPanel, Dialog, Countdown
lib/
  architectures.ts       the deck (156 entries through Sept 2026; tier 1 = can be the answer)
  types.ts               Arch schema
  shared.ts              data-free constants and types (the only game module the client imports)
  game.ts                compare(), one-liner, secret daily order      [server only]
  token.ts               HMAC-signed game state                        [server only]
  stats.ts               localStorage: saved day, streaks
assets/                  static TTFs for the OG image
scripts/enrich.mts       the audit pipeline
```

Design tokens, contrast figures and motion are in `DESIGN.md`; audience and
voice in `PRODUCT.md`.
