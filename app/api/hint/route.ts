import { NextResponse } from "next/server";
import { answerFor, candidatesLeft, FIELDS, revealField } from "@/lib/game";
import type { HistoryEntry } from "@/lib/ui";

export async function POST(req: Request) {
  const { n, field, history } = (await req.json()) as {
    n?: number;
    field?: string;
    history?: HistoryEntry[];
  };
  const valid = FIELDS as readonly string[];
  if (typeof n !== "number" || !field || !valid.includes(field)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const answer = answerFor(n);
  const trail: HistoryEntry[] = [
    ...(Array.isArray(history) ? history : []),
    { kind: "hint", field },
  ];
  return NextResponse.json({
    field,
    value: revealField(answer, field),
    remaining: candidatesLeft(answer, trail),
  });
}
