import { NextResponse } from "next/server";
import { answerFor, compare, lookup } from "@/lib/game";

export async function POST(req: Request) {
  const { n, guess } = (await req.json()) as { n?: number; guess?: string };
  if (typeof n !== "number" || typeof guess !== "string") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const arch = lookup(guess);
  if (!arch) {
    return NextResponse.json({ error: "not in the deck" }, { status: 404 });
  }
  return NextResponse.json(compare(arch, answerFor(n)));
}
