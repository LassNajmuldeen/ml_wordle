import { NextResponse } from "next/server";
import { answerFor, oneLiner } from "@/lib/game";
import { ONELINER_AFTER } from "@/lib/shared";
import { verify } from "@/lib/token";

export const dynamic = "force-dynamic";

/** The one-liner, only when asked for and only once enough guesses are in. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { token?: unknown };
  const state = verify(body.token);
  if (!state) return NextResponse.json({ error: "bad token" }, { status: 401 });
  if (state.g.length < ONELINER_AFTER) {
    return NextResponse.json({ error: "not unlocked yet" }, { status: 403 });
  }
  return NextResponse.json(
    { text: oneLiner(answerFor(state.n)) },
    { headers: { "cache-control": "no-store" } },
  );
}
