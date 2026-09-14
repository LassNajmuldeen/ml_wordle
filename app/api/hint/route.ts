import { NextResponse } from "next/server";
import { answerFor, FIELDS, revealField } from "@/lib/game";

export async function POST(req: Request) {
  const { n, field } = (await req.json()) as { n?: number; field?: string };
  const valid = FIELDS as readonly string[];
  if (typeof n !== "number" || !field || !valid.includes(field)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  return NextResponse.json({ field, value: revealField(answerFor(n), field) });
}
