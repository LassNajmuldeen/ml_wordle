import { NextResponse } from "next/server";
import { puzzleNumber, randomPractice } from "@/lib/game";
import { sign } from "@/lib/token";

export const dynamic = "force-dynamic";

/** Hands out a fresh game. The server decides the day, not the browser's clock. */
export async function POST(req: Request) {
  const { mode } = (await req.json().catch(() => ({}))) as { mode?: string };
  const daily = mode !== "practice";
  const n = daily ? puzzleNumber() : randomPractice();
  return NextResponse.json(
    { n: daily ? n : null, token: sign({ n, g: [] }) },
    { headers: { "cache-control": "no-store" } },
  );
}
