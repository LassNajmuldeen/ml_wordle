"use client";

import { Countdown } from "@/components/Countdown";
import { liveStreak, type Stats } from "@/lib/stats";

export function StatsPanel({
  stats, today, highlight,
}: {
  stats: Stats;
  today: number;
  /** today's row, so its bar reads as "yours": the guess count, or "X" for a loss */
  highlight: number | "X" | null;
}) {
  if (stats.played === 0) {
    return <p className="stats-empty">Finish today&rsquo;s puzzle and your streak starts here.</p>;
  }
  // The last row counts the dailies that ran out of guesses.
  const rows: { label: number | "X"; count: number }[] = [
    ...stats.dist.map((count, i) => ({ label: i + 1, count })),
    { label: "X", count: stats.played - stats.wins },
  ];
  const peak = Math.max(1, ...rows.map((r) => r.count));
  return (
    <>
      <dl className="figures">
        <div>
          <dt>Played</dt>
          <dd className="num">{stats.played}</dd>
        </div>
        <div>
          <dt>Solved</dt>
          <dd className="num">{Math.round((stats.wins / stats.played) * 100)}%</dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd className="num">{liveStreak(stats, today)}</dd>
        </div>
        <div>
          <dt>Best</dt>
          <dd className="num">{stats.best}</dd>
        </div>
      </dl>
      <div className="dist">
        <p className="dist-cap">Guesses</p>
        {rows.map(({ label, count }) => (
          <div className="distrow" key={label}>
            <span className="n num" aria-hidden>
              {label}
            </span>
            <span className="sr">
              {label === "X" ? "Not solved" : `Solved in ${label} ${label === 1 ? "guess" : "guesses"}`}:{" "}
              {count} {count === 1 ? "game" : "games"}
            </span>
            <span className="bar-track" aria-hidden>
              <span
                className="fill"
                data-current={highlight === label}
                data-loss={label === "X"}
                data-zero={count === 0}
                style={{ width: `${Math.max(count ? 10 : 0, (count / peak) * 100)}%` }}
              >
                <span className="c num">{count}</span>
              </span>
            </span>
          </div>
        ))}
      </div>
      <Countdown />
    </>
  );
}
