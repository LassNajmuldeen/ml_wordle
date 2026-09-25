import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Zeroshot: guess the machine-learning architecture in 7 tries";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hex twins of the OKLCH tokens in globals.css; Satori doesn't parse oklch().
const C = {
  bg: "#11131c",
  ink: "#f4f5f8",
  ink2: "#c1c4cd",
  accent: "#fb7475",
  exact: "#198044",
  near: "#f3c443",
  miss: "#323541",
};

// A plausible game: wide misses, then closing in, then solved.
const ROWS = [
  "mmpmmmp",
  "mepmmme",
  "eepeepe",
  "eeeeeee",
];
const FILL = { e: C.exact, p: C.near, m: C.miss } as const;

const bricolage = readFile(join(process.cwd(), "assets/bricolage-800.ttf"));
const mono = readFile(join(process.cwd(), "assets/jetbrains-mono-700.ttf"));

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          padding: "0 88px", background: C.bg, color: C.ink,
          fontFamily: "Bricolage",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 560 }}>
          <div style={{ display: "flex", fontSize: 112, letterSpacing: -4, lineHeight: 1 }}>
            zer<span style={{ color: C.accent, fontFamily: "Mono", fontSize: 100 }}>0</span>shot
          </div>
          <div style={{ marginTop: 28, fontSize: 44, lineHeight: 1.15, letterSpacing: -1 }}>
            Guess the ML architecture.
          </div>
          <div style={{ marginTop: 18, fontSize: 28, color: C.ink2, letterSpacing: -0.3 }}>
            A new one every day. 7 tries. From the Perceptron to DeepSeek-R1.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ROWS.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              {[...r].map((c, j) => (
                <div
                  key={j}
                  style={{
                    width: 56, height: 56, borderRadius: 10,
                    background: FILL[c as keyof typeof FILL],
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: await bricolage, weight: 800, style: "normal" },
        { name: "Mono", data: await mono, weight: 700, style: "normal" },
      ],
    },
  );
}
