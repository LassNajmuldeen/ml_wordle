import { NextResponse } from "next/server";
import { answerCard, answerFor, compare, lookup } from "@/lib/game";
import { MAX_GUESSES } from "@/lib/shared";
import { sign, verify } from "@/lib/token";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * Grade one guess against a signed game. The answer is returned only once the
 * game is over: solved, or out of guesses.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { token?: unknown; guess?: unknown };
  const state = verify(body.token);
  if (!state) return fail("bad token", 401);
  if (typeof body.guess !== "string") return fail("no guess");

  const answer = answerFor(state.n);
  if (state.g.includes(answer.name) || state.g.length >= MAX_GUESSES) return fail("game over", 409);

  const arch = lookup(body.guess);
  if (!arch) return fail("not in the deck", 404);
  if (state.g.includes(arch.name)) return fail("already guessed", 409);

  const g = [...state.g, arch.name];
  const row = compare(arch, answer);
  const done = row.correct || g.length >= MAX_GUESSES;

  return NextResponse.json(
    {
      row,
      token: sign({ n: state.n, g }),
      answer: done ? answerCard(answer) : null,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
