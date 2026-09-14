# Product

## Register

product

## Users
People who read ML papers, or want to. Students, researchers, engineers who can
name twenty architectures and want to find out whether they can name them from
their properties instead of their logos. They play once a day, on a phone or in
a browser tab next to work, for two to four minutes. The deck is the draw: they
stay because they learn that AlexNet and Seq2Seq are the same year, or that
Microsoft Research Asia is in Beijing.

## Product Purpose
Name one machine-learning architecture a day in eight guesses. Every guess is
graded on seven axes, so a wrong answer is still information. Success is a player
who finishes, shares a grid, and comes back tomorrow, having learned one fact
they did not previously hold.

## Brand Personality
Warm, plain-spoken, unhurried. Explains without condescending and states results
without cheering: "Solved in 5 of 8", not "Amazing job!". Three words: calm,
precise, generous. The interface should feel like a well-made reference tool that
happens to be a game.

## Anti-references
- **Two earlier attempts on this project.** First: gold hairlines, crimson glows,
  a lattice background, gradient-clipped wordmark. Costume, not character.
  Second: near-black with grading carried by underlines and dimming. Elegant, but
  it made players decode a novel system before they could play.
- **Gamer dark mode**: neon on charcoal, glowing borders.
- **Cheerful SaaS**: confetti, emoji, soft purple gradients, exclamation marks.
- **Anything edgy.** No sigils, no imperial language, no black-and-crimson.
- **Chrome around the game.** A third attempt was warm cream with a lede, a
  how-to-play block, a bordered verdict card and a footer. Too many horizontal
  rules, tiles too small, nothing dominant. The board is the product; if a
  pixel is not the board, it needs a reason.

## Design Principles
1. **Use the convention players already know.** Green, amber, red tiles with
   arrows is a solved interaction. Inventing a new grading language buys
   distinctiveness at the cost of the first thirty seconds of every session.
   Spend the originality on the data instead.
2. **Every wrong guess must pay.** Seven graded properties means an incorrect
   answer still eliminates a third of the deck. The board should make that
   obvious at a glance.
3. **Calm over loud.** Saturation appears only on graded tiles. Chrome, text and
   controls stay in warm neutrals.
4. **Explain in place, once.** The near-match tile prints why it is a near match
   rather than making the player consult a key.
5. **Teach the deck, not the game.** The reward for finishing is the one-line
   note on what the architecture actually did.

## Accessibility & Inclusion
- WCAG 2.2 AA. All body text ≥4.5:1 against the ground, verified numerically,
  including the dimmed "wrong" state and placeholder text.
- **Colour is never the only channel.** Green/amber/red is exactly the pairing
  red-green colour blindness loses, so the three tile fills are separated by
  greyscale luminance as well as hue, near-matches are the only tiles carrying an
  explanatory sub-line, Year and Scale add ↑ / ↓, and every tile announces its
  state as text to screen readers.
- `prefers-reduced-motion: reduce` replaces every entrance with an instant state.
- Full keyboard play: type, arrow to a suggestion, Enter. Visible focus rings.
- Board is a real table for screen readers, with each cell's state announced as
  text, not inferred from colour.
