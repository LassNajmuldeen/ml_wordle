# Design

## Theme

Ink-indigo ground, coral for anything you press, and the tiles carrying the
rest. Dark because the board is a field of saturated tiles and it reads best on
a dark ground, and because a dark grid screenshot stands out in an X feed.

Colour strategy: **restrained plus one accent.** Tinted neutrals toward hue 275;
coral (`--accent`) only on primary buttons, focus rings, the `0` in the
wordmark and the streak count. All other saturation belongs to the tiles.

## Color

All tokens are OKLCH in `app/globals.css`. Hex twins (for the OG image, which
can't parse OKLCH) are in `app/opengraph-image.tsx`.

| Token | Value | Hex | Role |
|---|---|---|---|
| `--bg` | `oklch(0.19 0.018 275)` | `#11131c` | page |
| `--raise` | `oklch(0.235 0.022 275)` | `#1b1d29` | input, dialogs, verdict |
| `--ink` | `oklch(0.97 0.004 275)` | `#f4f5f8` | primary text |
| `--ink-2` | `oklch(0.82 0.014 275)` | `#c1c4cd` | prose |
| `--ink-3` | `oklch(0.71 0.02 275)` | `#9ea1ae` | labels |
| `--accent` | `oklch(0.72 0.165 22)` | `#fb7475` | primary action |

| Tile | Fill | Text | Contrast |
|---|---|---|---|
| Exact | `oklch(0.53 0.13 152)` | near-white | 4.97 |
| Near | `oklch(0.84 0.15 88)` | dark amber | 10.1 |
| Miss | `oklch(0.33 0.022 275)` | `--miss-ink` | 9.07 |
| Can't compare | miss + 135° hatching | `--ink-2` | 7.0 |

Text on ground: ink-3 7.2, ink-2 10.6. Coral button text 6.85.

## Typography

- **Bricolage Grotesque** for everything readable: wordmark (800), headings,
  tile values, body.
- **JetBrains Mono** for numbers that should line up or feel like data: the `0`
  in the wordmark, years in suggestions, the countdown, the facts line, stats
  counts.

## Layout

- **Bar**: help · wordmark with a Daily / Practice switch under it · stats (with
  a 🔥 streak count once you have one). No rule underneath.
- **Board**: seven equal tile columns. At ≥1024px the guess name sits in a 9.5rem
  gutter to the left, and the input and verdict share that offset. Below that,
  the name sits above its row.
- **≤700px**: tiles shrink to ~48px and print short labels (`Attn`, `AR`,
  `FAIR`, `0.1–1B↓`). The latest non-winning guess opens a detail panel with
  the full values and why each yellow is yellow; the chevron on any row toggles
  it.
- **Verdict**: a raised card under the board with the result name, the answer,
  its one-liner, **Post your score** (X intent) and Copy / Share.

## Motion

- **Flip**: each tile of the new row turns on the X axis, blank on the way up and
  coloured on the way down. 420ms, staggered 90ms. Only the row that just landed
  animates.
- **Hop**: on a win, the solved row's tiles jump in a wave once the last tile has
  turned.
- **Burst**: 28 tile-coloured squares off the top of the verdict card, 1.1s, only
  on a fresh win (not when reloading a solved day).
- **Shake**: the input shakes on a name that isn't in the deck or was already tried.
- `prefers-reduced-motion: reduce` collapses all of it and hides the burst.

## Components

`Board` (tiles, clue rows, phone detail panel), `Console` (combobox, guesses
left, clue button), `Verdict`, `Help`, `StatsPanel`, `Dialog` (native
`<dialog>`), `Countdown`. Buttons come in three shapes: `.go` (coral, primary),
`.ghost` (outlined), `.link` (underlined text).
