/**
 * Game state travels as a signed token, so the server needs no database and
 * the browser can't forge one. The token holds the puzzle number and the
 * guesses so far; the answer is only ever computed on the server, from the
 * number plus the secret.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type GameState = {
  /** puzzle number: a day, or ≥ 1,000,000 for practice */
  n: number;
  /** guess names, in order */
  g: string[];
};

export function secret(): string {
  const s = process.env.ZEROSHOT_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ZEROSHOT_SECRET is not set");
  }
  return "dev-only-secret";
}

const b64 = (b: Buffer) => b.toString("base64url");
const mac = (body: string) => createHmac("sha256", secret()).update(body).digest();

export function sign(state: GameState): string {
  const body = b64(Buffer.from(JSON.stringify(state)));
  return `${body}.${b64(mac(body))}`;
}

export function verify(token: unknown): GameState | null {
  if (typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const want = mac(body);
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as GameState;
    return Number.isInteger(s.n) && Array.isArray(s.g) ? s : null;
  } catch {
    return null;
  }
}
