"use client";

import { Countdown } from "@/components/Countdown";
import { liveStreak, type Stats } from "@/lib/stats";

export function StatsPanel({
  stats, today, highlight,
}: {
  stats: Stats;
  today: number;
  /** guess count of today's win, so its bar reads as "yours" */
  highlight: number | null;
}) {
  if (stats.played === 0) {
    return <p className="stats-empty">Finish today&rsquo;s puzzle and your streak starts here.</p>;
  }
  const peak = Math.max(1, ...stats.dist);
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
        <p className="dist-cap">Solved in</p>
        {stats.dist.map((count, i) => (
          <div className="distrow" key={i}>
            <span className="n num" aria-hidden>
              {i + 1}
            </span>
            <span className="sr">
              {i + 1} {i ? "guesses" : "guess"}: {count} {count === 1 ? "game" : "games"}
            </span>
            <span className="bar-track" aria-hidden>
              <span
                className="fill"
                data-current={highlight === i + 1}
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
