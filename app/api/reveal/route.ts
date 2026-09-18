import { NextResponse } from "next/server";
import { answerFor, bucketLabel } from "@/lib/game";

export async function POST(req: Request) {
  const { n } = (await req.json()) as { n?: number };
  if (typeof n !== "number") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const a = answerFor(n);
  return NextResponse.json({
    name: a.name,
    year: a.year,
    org: a.org,
    modality: a.modality,
    mechanism: a.mechanism,
    paradigm: a.paradigm,
    scale: bucketLabel(a.params),
    weights: a.weights,
    parents: a.parents,
    blurb: a.blurb,
  });
}
