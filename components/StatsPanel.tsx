"use client";

import { Countdown } from "@/components/Countdown";
import type { Stats } from "@/lib/stats";

export function StatsPanel({
  stats, highlight,
}: {
  stats: Stats;
  /** guess count of the game just finished, so its bar reads as "yours" */
  highlight: number | null;
}) {
  const peak = Math.max(1, ...stats.dist);
  if (stats.played === 0) {
    return <p className="msg">No finished games yet. Your record shows up here.</p>;
  }
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
          <dd className="num">{stats.streak}</dd>
        </div>
        <div>
          <dt>Best</dt>
          <dd className="num">{stats.best}</dd>
        </div>
      </dl>
      <div className="dist">
        <p className="sr">Guess distribution</p>
        {stats.dist.map((count, i) => (
          <div className="distrow" key={i}>
            <span className="n num" aria-hidden>
              {i + 1}
            </span>
            <span className="sr">
              Solved in {i + 1}: {count} {count === 1 ? "game" : "games"}
            </span>
            <span
              className="fill"
              data-current={highlight === i + 1}
              style={{ width: `${Math.max(count ? 8 : 2, (count / peak) * 100)}%` }}
            />
            <span className="c num" aria-hidden>
              {count}
            </span>
          </div>
        ))}
      </div>
      <Countdown />
    </>
  );
}
