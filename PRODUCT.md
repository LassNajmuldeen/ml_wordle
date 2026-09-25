# Product

## Register

product

## Users
People who read ML papers, or want to: students, researchers, engineers, and
the ML crowd on X. They play once a day on a phone, often arriving from someone
else's posted grid, for two to four minutes. Most first visits are on mobile and
have never seen the game before.

## Product Purpose
Name one machine-learning architecture a day in seven guesses. Every guess is
graded on seven properties, so a wrong answer is still information. Success is a
player who finishes, posts their grid, and comes back tomorrow having learned one
fact they didn't hold, like AlexNet and Seq2Seq being the same year.

## Brand Personality
Playful, nerdy, generous. The jokes are ML jokes: the result names
(*Zero-shot*, *Few-shot*, *Diverged*), the `0` in the wordmark. Copy stays
plain and short everywhere else. Three words: sharp, playful, in-on-it.

## Anti-references
- **Austerity as personality.** The previous version refused to celebrate
  anything ("Solved in 5 of 8", no colour off the tiles). Players didn't know
  whether they'd done well.
- **Red for a miss.** A board of mostly maroon tiles reads as failing.
  Grey is neutral; green and yellow are what should pop.
- **Gamer dark mode**: neon on charcoal, glowing borders.
- **Cheerful SaaS**: soft purple gradients, exclamation marks, mascots.
- **Chrome around the game.** The board is the product; anything else lives in a
  dialog or below the board.

## Design Principles
1. **Use the convention players already know.** Green / yellow / grey tiles with
   arrows. Spend the originality on the data and the jokes.
2. **Every wrong guess must pay.** Seven graded properties; near matches say why.
3. **Celebrate the finish, once.** The flip, the hop, the burst and the result
   name happen when you win, not all the time.
4. **Phone first.** Seven columns across at 390px, short labels, tap a row for
   full detail. No horizontal scroll, no screen-long empty grids.
5. **Teach the deck.** The reward for finishing is the one-line note on what the
   architecture actually did.

## Accessibility & Inclusion
- WCAG 2.2 AA: body text ≥ 4.5:1, verified numerically (see DESIGN.md).
- **Colour is never the only channel.** Tile fills are separated in lightness
  (grey 0.33 / green 0.53 / yellow 0.84), Year and Size carry arrows, the hatched
  state is a pattern, and every tile announces its state as text.
- `prefers-reduced-motion: reduce` turns every animation into an instant state
  and removes the burst.
- Full keyboard play: typing anywhere focuses the guess box; arrows move through
  suggestions; Enter guesses.
