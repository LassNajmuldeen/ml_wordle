import { NextResponse } from "next/server";
import { ALL_NAMES, MAX_GUESSES, puzzleNumber } from "@/lib/game";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { number: puzzleNumber(), names: ALL_NAMES, maxGuesses: MAX_GUESSES },
    { headers: { "cache-control": "no-store" } },
  );
}
