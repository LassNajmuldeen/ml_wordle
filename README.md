# ZEROSHOT

A daily Wordle for machine-learning architectures. Name the architecture in eight
attempts; every guess grades itself against the answer on seven axes.

```bash
npm install
npm run dev      # http://localhost:3000
```

---

## 1. The game

Guess an architecture from a 128-entry deck. Each guess returns a row of seven cells:

| Column | Exact (green) | Near (amber) | Wrong (crimson) |
|---|---|---|---|
| **Year** | same year | within 3 years, plus ▲/▼ | further, plus ▲/▼ |
| **Modality** | identical set | sets overlap (`2/4 shared`) | disjoint |
| **Mechanism** | same block type | same family (`Recurrence`↔`State space`) | different family |
| **Paradigm** | same objective | same family (`Masked`↔`Contrastive` = self-supervised) | different family |
| **Origin** | same lab | sibling lab (Google ↔ DeepMind) or same country | neither |
| **Scale** | same order-of-magnitude bucket | adjacent bucket, plus ▲/▼ | further, plus ▲/▼ |
| **Weights** | same | Open↔Partial or Partial↔Closed | Open vs Closed |

A fourth state, **hatched grey**, means *undisclosed* — GPT-4, Gemini and Claude
never published a parameter count, so the cell can't be graded. That's a real
signal, not a bug: hatched Scale narrows the field to about six models.

### Why this is not just red/green

Wordle's yellow is "right letter, wrong place". Architectures have no positions,
so the yellow is rebuilt from four different kinds of near-miss:

1. **Ordinal near-miss** — Year and Scale are numbers, so they get amber for
   *close* plus a direction arrow. This is the strongest hint in the game.
2. **Set near-miss** — Modality is a set, so partial overlap is amber and the
   cell prints how much overlaps.
3. **Taxonomic near-miss** — Mechanism and Paradigm sit in families. Guessing
   Mamba against an LSTM answer is amber, because both are recurrent.
4. **Institutional near-miss** — Google Brain against a DeepMind answer is
   amber via the shared parent org; Mistral against Stable Diffusion is amber
   via "both European".

### The Geass

The one mechanic Wordle doesn't have. Once per puzzle you may spend an attempt
to *command* one field into the open — including **Lineage**, which no column
shows: "Descends from — DDPM, CLIP, VQ-VAE". Eight attempts becomes seven, and
you get the citation ancestry instead. It is almost always worth it after guess
four, and never worth it on guess one, which is the whole point.

---

## 2. Fields, and why these seven

The constraint is that every field must be **comparable across the entire deck**
— a 1958 perceptron and a 671B MoE both have to have a defensible value. That
rules out a lot of tempting fields.

**Kept:** year · modality · mechanism · paradigm · origin lab · parameter bucket ·
weight availability.

**Rejected:** *layer count* (undefined for trees and SSMs), *accuracy /
benchmark* (no shared benchmark across 70 years), *training compute* (unpublished
for most closed models and pre-2012 work), *context length* (only meaningful for
sequence models), *activation function* (weakly discriminative — half the deck is
ReLU-or-GELU).

**Loss functions, optimizers, activations and training techniques** are the right
call as a **second deck, not extra columns.** Cross-entropy has no
"parameter count" and Adam has no "modality", so they can't share a board. They
share a *shape* instead — year, family, origin, what it replaced, what it's used
with — so the plan is a mode switch (`Architectures` / `Techniques` /
`Datasets & benchmarks`) reusing the same comparison engine with a different
field list. The `compare()` function in `lib/game.ts` is already field-driven;
adding a deck is a data file plus a field spec.

---

## 3. Hosting

Deploy to Vercel — it's a Next.js app with four route handlers and no database:

```bash
npx vercel        # preview
npx vercel --prod
```

Everything the player needs comes from static assets plus four tiny dynamic
routes. Cost at a few thousand daily players is effectively zero.

**The answer never reaches the browser.** The deck lives in `lib/architectures.ts`,
which is imported only by server code. The client gets a list of *names* for the
autocomplete and nothing else; grading happens in `POST /api/guess`, and the
answer is only returned by `POST /api/reveal` after a win or a loss. View-source
cheating doesn't work, which is the one thing Wordle clones usually get wrong.

| Route | Purpose |
|---|---|
| `GET /api/puzzle` | today's puzzle number + the autocomplete name list |
| `POST /api/guess` | grade one guess, return coloured cells |
| `POST /api/hint` | reveal one property, at the cost of a guess |

Both `/api/guess` and `/api/hint` also take the guess history and return
`remaining`: how many of the 119 possible answers are still consistent with every
clue given so far. The server replays each clue against each candidate, so the
number is exact rather than an estimate.
| `POST /api/reveal` | the full answer, after the game ends |

The daily answer is `ORDER[(puzzleNumber - 1) % ORDER.length]`, where `ORDER` is
a fixed-seed shuffle of the 119 tier-1 entries. Same answer for everyone, worldwide,
rolling over at UTC midnight; no storage, no cron. Endless mode passes a random
puzzle number to the same routes. Progress persists in `localStorage`.

**If you later want streaks, leaderboards or accounts:** that's the first thing
that needs a database. Add one from the Vercel Marketplace (Neon or Upstash)
rather than hand-rolling it.

---

## 4. Where the data comes from

The honest answer: **curate, then scrape to audit.** Not the other way round.

There is no clean source of truth for "modality, creators, year, type" across
70 years of ML. Papers with Code — the obvious answer two years ago — was shut
down and folded into Hugging Face. What's left is four partial sources that
disagree with each other, and a curated deck they can be checked against.

`npm run enrich` audits the deck and writes disagreements to
`data/enrichment-report.json`. It never writes to the deck — a human reviews the
diff. Sources, in trust order:

| Source | API | Gives you |
|---|---|---|
| **arXiv** | `export.arxiv.org/api/query` | canonical first-preprint date, exact title |
| **Semantic Scholar** | `api.semanticscholar.org/graph/v1` | venue, author affiliations, citation count |
| **Hugging Face Hub** | `huggingface.co/api/models` | real parameter counts from safetensors metadata, licence → weights status |
| **Wikidata** | SPARQL endpoint | organisation → country, org → parent org |

All four are public JSON/Atom APIs with no key. **Do not scrape the HTML** —
these pages are rendered from exactly these APIs, and the APIs are stable.

```bash
npm run enrich                  # whole deck, ~4 min (Semantic Scholar is 1 rps)
npm run enrich -- --limit 10
npm run enrich -- --only BERT
```

### The failure mode you will hit

Title search matches lookalikes. The first run of this script "corrected" BERT's
year from 2018 to 2020, because arXiv's top hit for `ti:"BERT"` is
*BERT-ATTACK: Adversarial Attack Against BERT Using BERT*.

The fix is the optional `paper` field on each entry — the exact paper title,
which pins arXiv and Semantic Scholar to the right document. Four entries have it
as worked examples (BERT, Transformer, ResNet-50, Mamba). Filling in the rest is
the highest-value hour of data work in this repo; after that, the audit is
trustworthy enough to run on a schedule.

### What is genuinely not scrapable

Mechanism and paradigm are **judgement calls** — no source states that Stable
Diffusion's mechanism is convolution and its paradigm is diffusion. Those two
columns are, and should stay, hand-assigned. An LLM can propose them from the
abstract; a human still signs off. That's ~2 minutes per entry, so a 500-entry
deck is a weekend, not a project.

---

## 5. Layout

```
app/
  page.tsx              the game (client)
  layout.tsx            fonts + shell
  globals.css           the whole design system
  api/{puzzle,guess,geass,reveal}/route.ts
lib/
  types.ts              Arch schema + family taxonomies
  architectures.ts      the deck — 128 entries, hand-curated
  game.ts               compare(), daily selection, buckets   [server only]
  ui.ts                 data-free constants shared with the client
components/Sigil.tsx
scripts/enrich.mts      the audit pipeline
```

Adding an entry is one object in `lib/architectures.ts`. `tier: 1` means it can
be the daily answer (119 of them); `tier: 2` means guessable but too obscure to
be the target (9, mostly pre-2000).

### Difficulty

Measured, not guessed. `median-left` is how many answers survive one consistent
opening guess; `mean-guesses` is a solver that always guesses something still
consistent, over 12 seeds against every answer.

| Configuration | Pool | Median left | Determined in 1 | Mean guesses |
|---|---|---|---|---|
| 7 fields, arrows (**shipped**) | 119 | 2 | 37% | 2.51 |
| Same, old 60-answer pool | 60 | 1 | 52% | 2.31 |
| No arrows | 119 | 3 | 32% | 2.58 |
| No near state | 119 | 7 | 14% | 3.05 |
| 5 fields, no arrows, 128 | 128 | 6 | 17% | 2.97 |

Per-field information, each column alone against the 60-answer pool (median
answers left after one guess, lower means more revealing):

| Scale | Year | Modality | Mechanism | Paradigm | Lab | Weights |
|---|---|---|---|---|---|---|
| 14 | 21 | 30 | 32 | 35 | 35 | 42 |

The arrows on Scale and Year are what make those two columns dominant. No single
column is the problem, and Mechanism is among the least revealing. The real
ceiling is deck size: 119 answers is about 6.9 bits of entropy, and any seven
property board yields roughly 5 bits per guess.

---

## 6. What you get for finishing

Solving records the result locally (`lib/stats.ts`): games played, solve rate,
current and best streak, and a guess distribution, all shown on the verdict
alongside a countdown to the next UTC midnight. Nothing leaves the browser.

Each row also prints how far your guess narrowed the field, but only when the
number actually moved. Repeating "12 still possible" on three rows in a row is
noise; a drop from 60 to 12 is the point of the game.

## 7. Design

Near-black end to end, with the graded tiles as the only colour on the page:
green exact, amber near, red wrong, plus ↑ / ↓ on the two numeric columns.
Unplayed attempts show as outlined rows, so the board has its shape from the
start. One horizontal rule on the entire page; how-to-play and statistics live
in dialogs.

Tokens, measured contrast ratios and the motion spec are in `DESIGN.md`.
Strategy, anti-references and accessibility commitments are in `PRODUCT.md`.
