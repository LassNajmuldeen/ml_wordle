# Design

## Theme

One dark surface. The page is near-black end to end, and the graded tiles are the
only colour and the only hard edges on it. There is exactly one rule on the whole
page, under the top bar. Everything that used to be chrome (a lede, a how-to-play
block, a footer, a bordered verdict card) is either gone or moved into a dialog.

Single theme, no light variant: the board is a field of saturated tiles and it
only holds together on black.

Colour strategy: **restrained.** Neutral dark ground, no accent hue at all.
Primary buttons are near-white on black. All saturation is reserved for grading.

## Color

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a0a0b` | the page |
| `--raise` | `#17171a` | input, hint row, dialogs |
| `--line` | `rgba(255,255,255,.09)` | the one rule, and borders |
| `--ink` | `#f2f2f0` | primary text, primary button fill |
| `--ink-2` | `#a3a3a1` | prose |
| `--ink-3` | `#8b8b89` | labels, counts |

Grading tiles:

| State | Background | Text | Contrast | Greyscale L |
|---|---|---|---|---|
| Exact | `#20623f` | `#eefaf2` | 6.80 | 0.094 |
| Near | `#a8811a` | `#1c1403` | 5.06 | 0.241 |
| Wrong | `#4a2427` | `#f0c3bd` | 8.42 | 0.029 |
| Not comparable | transparent | `#8b8b89` | 5.80 | — |
| Unplayed | transparent, 1px `rgba(255,255,255,.055)` | — | — | — |

Text on the ground: ink 17.65, ink-2 7.83, ink-3 5.80. All pass AA.

**Colour is not the only channel.** The three fills are ordered and separated in
greyscale (0.029 / 0.094 / 0.241), so the board survives monochrome and
red-green colour blindness. Near-matches are also the only tiles carrying a
sub-line, Year and Scale add an arrow, and every tile announces its state as
text to screen readers.

Every tile carries `inset 0 0 0 1px rgba(255,255,255,.07)`, because the wrong
tile sits at only 1.48:1 against the ground and would otherwise have no edge.

## Layout

A single bar, then the board. Nothing else above the fold.

- **Bar**: help icon, centred wordmark with the puzzle number beneath it, mode
  buttons and a stats icon. One `1px` bottom rule, the only rule on the page.
- **Board**: seven equal tile columns at `76px` minimum height. The tile grid is
  the fixed element; nothing is allowed to narrow it. Above 1100px the guess name
  moves out into an 11.5rem gutter to the left of the grid, and the input, hint
  rows and verdict shift by the same offset so everything stays aligned with the
  tiles. Below 1100px the gutter collapses to zero and the name sits above its
  own row instead. Tile width is identical either way. Unplayed attempts render
  as outlined rows, so the board has its full shape before the first guess.
- **Below 760px**: the header row disappears, tiles reflow at
  `minmax(96px, 1fr)` and print their property name inside. No horizontal
  scrolling at any width.
- How to play and Statistics are native `<dialog>` elements: real focus trap,
  real Esc, no library.

## Motion at completion

Winning is the one moment the interface reacts. The solved row swaps its
entrance for `land`: the same 45ms stagger, but each tile overshoots to 1.035
and lifts 3px before settling, 620ms end to end. It runs once, on the row that
just won, and collapses to nothing under `prefers-reduced-motion`. Nothing else
on the page celebrates.

## Typography

Two families.

- **Source Serif 4**, 600 — the wordmark and the revealed answer. Nothing else.
- **DM Sans** — every other piece of text, with `tabular-nums` on tile values so
  years and size brackets line up in their columns.

Fixed rem scale, not fluid: 0.5625 / 0.625 / 0.6875 / 0.75 / 0.8125 / 0.875 /
0.9375 / 1.5 / 2. Product UI is read at consistent DPI; a clamped heading that
shrinks with the viewport looks worse, not better.

## Layout

Single column, `max-width: 60rem`. Rhythm on a 4px base: 4 / 8 / 12 / 20 / 32 /
52 / 80.

- **Board**: a name column (`11.5rem`) plus seven equal tile columns, 6px gutter,
  10px radius. Column names sit once above the first row.
- **Below 760px**: the header row disappears and each guess becomes a block — the
  architecture name, then the tiles reflowing at `minmax(92px, 1fr)` with their
  property name printed inside. No horizontal scrolling at any width.
- Rounded corners throughout: 6px chips, 10px tiles and buttons, 14px cards.

## Motion

- Tiles: 260ms `cubic-bezier(0.22, 1, 0.36, 1)`, opacity plus a 0.94 → 1 scale,
  staggered 45ms across the row. Only the row that just landed animates; earlier
  rows are static, so the board doesn't replay itself on every render.
- Buttons and inputs: 160ms colour and border transitions.
- `prefers-reduced-motion: reduce` collapses all of it to instant.

## Components

`Board` (with tiles and the hint row), `Console` (input, suggestion listbox,
counter), `Verdict`, plus the `.rules` disclosure. Buttons come in two shapes and
only two: `.go` (filled clay, primary action) and `.ghost` (outlined pill,
everything else).
