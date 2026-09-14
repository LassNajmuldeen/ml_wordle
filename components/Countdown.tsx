"use client";

import { useEffect, useState } from "react";

function untilUtcMidnight(): string {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  const ms = Math.max(0, next - now.getTime());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Countdown() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    setT(untilUtcMidnight());
    const id = setInterval(() => setT(untilUtcMidnight()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!t) return null;
  return (
    <p className="countdown">
      Next architecture in <time className="num">{t}</time>
    </p>
  );
}
