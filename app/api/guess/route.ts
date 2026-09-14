import { NextResponse } from "next/server";
import { answerFor, candidatesLeft, compare, lookup } from "@/lib/game";
import type { HistoryEntry } from "@/lib/ui";

export async function POST(req: Request) {
  const { n, guess, history } = (await req.json()) as {
    n?: number;
    guess?: string;
    history?: HistoryEntry[];
  };
  if (typeof n !== "number" || typeof guess !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const arch = lookup(guess);
  if (!arch) {
    return NextResponse.json({ error: "not in the deck" }, { status: 404 });
  }
  const answer = answerFor(n);
  const trail: HistoryEntry[] = [
    ...(Array.isArray(history) ? history : []),
    { kind: "guess", name: arch.name },
  ];
  return NextResponse.json({
    ...compare(arch, answer),
    remaining: candidatesLeft(answer, trail),
  });
}
