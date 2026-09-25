import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Same four tiles as icon.svg, for iOS home screens (which ignore SVG). */
export default function AppleIcon() {
  const tile = (bg: string) => (
    <div style={{ width: 66, height: 66, borderRadius: 14, background: bg }} />
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12, background: "#11131c",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {tile("#323541")}
          {tile("#f3c443")}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {tile("#198044")}
          {tile("#fb7475")}
        </div>
      </div>
    ),
    size,
  );
}
