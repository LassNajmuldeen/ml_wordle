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
| **Year** | same year | · | anything else, with ↑/↓ toward the answer |
| **Modality** | identical set | sets overlap (the tile names what's shared) | disjoint |
| **Block** | same core op | same family (`Recurrence` ↔ `State space`) | different family |
| **Training** | same objective | same family (`Masked` ↔ `Autoregressive` = self-supervised) | different family |
| **Lab** | same lab | shares one lab, or a sibling (Google ↔ DeepMind, FAIR ↔ Meta AI) | neither |
| **Size** | same order-of-magnitude bucket | · | anything else, with ↑/↓ toward the answer |
| **Weights** | same | one step apart (Open ↔ Partial ↔ Closed) | Open vs Closed |

**Hatched** means the Size can't be compared: closed labs never published a
count (GPT-4, Gemini, Claude), and SVMs and random forests don't have one in
the usual sense. The two are labelled differently (`undisclosed` vs
`non-parametric`) and only match their own kind.

Year and Size have no yellow on purpose: the arrow already says which way to
move, and a "close" band on top of it was the single most revealing signal on
the board.

**Clues.** After the first guess you can spend a guess on a clue: first the
answer's lineage ("Builds on DDPM, CLIP"), then its one-line description with
its own name blanked out. Two clues, one guess each.

**Results** are named for how quickly you got there: 1 guess is *Zero-shot*,
2 *One-shot*, 3 *Few-shot*, then *Converged*, *Fine-tuned*, and so on. A loss
is *Diverged*. The share text carries that name plus the usual emoji grid, and
the verdict has a one-tap **Post your score** to X.

---

## How it runs

The whole game is a static page. The deck, the grading and the daily pick all
live in the client bundle, so there are no API routes, no database and nothing
to scale if a post goes wide. Vercel serves it from the CDN.

```bash
npx vercel          # preview
npx vercel --prod   # production
```

The daily answer is `ORDER[(n - 1) % ORDER.length]`, where `ORDER` is a
fixed-seed shuffle of the tier-1 entries and `n` counts UTC days since
2026-01-01. Same answer for everyone, rolling over at midnight UTC.

**Why not grade on the server?** An earlier version did, to keep the answer out
of the browser. It didn't: `/api/reveal` returned the answer to anyone who
asked, and `/api/guess` is an oracle anyway. Wordle ships its answer list in
the bundle too. For a free daily puzzle, the round trip per guess wasn't buying
anything.

Progress and stats live in `localStorage`: the day's moves (guess names and
clues, re-graded on load so logic fixes reach saved games), and a streak /
distribution record. Nothing leaves the device except Vercel Web Analytics page
views, which need **Analytics** switched on in the Vercel project to record.

**Changing the deck changes the daily order.** Adding or removing a tier-1 entry
reshuffles every future day. Add entries as tier 2 if you don't want that, or
accept that one day's answer moves.

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
  page.tsx               game state: moves → graded rows, daily/practice
  layout.tsx             fonts, metadata, analytics
  globals.css            the whole design system
  opengraph-image.tsx    the X / link-preview card (1200×630)
  icon.svg, apple-icon.tsx
components/              Board, Console, Verdict, Help, StatsPanel, Dialog, Countdown
lib/
  architectures.ts       the deck (128 entries; tier 1 = can be the answer)
  types.ts               Arch schema + Block / Training families
  game.ts                compare(), clues, daily pick, autocomplete
  stats.ts               localStorage: saved day, streaks
assets/                  static TTFs for the OG image
scripts/enrich.mts       the audit pipeline
```

Design tokens, contrast figures and motion are in `DESIGN.md`; audience and
voice in `PRODUCT.md`.
