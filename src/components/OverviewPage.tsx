"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/format";
import {
  avgDuration,
  bestClearSeconds,
  computeStats,
  getDungeonSummaries,
  successRate,
  totalClearHours,
} from "@/lib/stats";
import { getExaltDungeonIds } from "@/lib/dungeons";
import { loadWrTimes, type WrDungeonEntry } from "@/lib/wr-times";
import { useRuns } from "@/hooks/RunsContext";
import { DungeonIcon } from "./DungeonIcon";
import { RecentRunsList } from "./RecentRunsList";
import { StatCardsSkeleton } from "./LoadingSkeleton";
import { WrComparison, wrForDungeon } from "./WrComparison";

export function OverviewPage() {
  const { runs, catalog, getDungeonById, refreshFromBoard, usesBoardStorage } = useRuns();
  const [wrMap, setWrMap] = useState<Map<string, WrDungeonEntry>>(new Map());
  const [loading, setLoading] = useState(usesBoardStorage);

  useEffect(() => {
    void loadWrTimes().then(setWrMap);
  }, []);

  useEffect(() => {
    if (!usesBoardStorage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void refreshFromBoard().finally(() => setLoading(false));
  }, [usesBoardStorage, refreshFromBoard]);

  if (!catalog) return null;

  const exaltIds = getExaltDungeonIds(catalog);
  const exaltRuns = runs.filter((run) => exaltIds.has(run.dungeonId));
  const { overall } = computeStats(exaltRuns);
  const rate = successRate(overall);
  const avgClear = avgDuration(overall.clearDuration, overall.clearCount);
  const hours = totalClearHours(exaltRuns);

  const exaltSummaries = getDungeonSummaries(runs, getDungeonById)
    .filter((entry) => exaltIds.has(entry.id))
    .sort((a, b) => b.stats.total - a.stats.total || a.name.localeCompare(b.name));

  const stats = [
    { label: "Exalt attempts", value: overall.total || "0" },
    { label: "Success rate", value: rate != null ? `${rate}%` : "—" },
    { label: "Avg clear", value: avgClear != null ? formatDuration(avgClear) : "—" },
    { label: "Time in clears", value: hours > 0 ? `${hours.toFixed(1)}h` : "—" },
  ];

  return (
    <>
      {loading ? (
        <StatCardsSkeleton />
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-border bg-surface/70 p-3 text-center">
              <div className="text-[1.25rem] font-semibold tabular-nums">{stat.value}</div>
              <div className="text-[0.68rem] text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        {exaltSummaries.length === 0 ? (
          <p className="text-[0.85rem] text-muted">No exalt runs logged yet.</p>
        ) : (
          exaltSummaries.map((entry) => {
            const dungeonRuns = runs.filter((run) => run.dungeonId === entry.id);
            const bestRun = dungeonRuns
              .filter((r) => r.outcome === "complete")
              .sort((a, b) => a.durationSeconds - b.durationSeconds)[0];
            const best = bestClearSeconds(dungeonRuns);
            const entryRate = successRate(entry.stats);
            const wr = bestRun
              ? wrForDungeon(wrMap, entry.id, bestRun.runType, bestRun.groupSize)
              : wrForDungeon(wrMap, entry.id, null, null);
            return (
              <article
                key={entry.id}
                className="flex items-center gap-3 rounded-md border border-border bg-surface/70 p-3"
              >
                <DungeonIcon dungeon={entry.dungeon} catalog={catalog} width={36} height={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {entry.dungeon?.shortName || entry.name}
                  </div>
                  <div className="text-[0.72rem] text-muted">
                    {entry.stats.complete}/{entry.stats.total} clears · {entryRate ?? 0}%
                  </div>
                  <div className="rate-bar">
                    <span style={{ width: `${entryRate ?? 0}%` }} />
                  </div>
                </div>
                <div className="shrink-0 text-right text-[0.78rem]">
                  <div className="font-medium tabular-nums text-green">
                    {best != null ? formatDuration(best) : "—"}
                  </div>
                  <div className="text-[0.68rem] text-muted">
                    {entry.avgClear != null ? `${formatDuration(entry.avgClear)} avg` : "—"}
                  </div>
                  {best != null && (
                    <WrComparison
                      clearSeconds={best}
                      wrSeconds={wr.seconds}
                      wrDisplay={wr.display}
                      wrWeblink={wr.weblink}
                    />
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <section>
        <h2 className="mb-3 text-[0.95rem] font-medium">Recent runs</h2>
        <RecentRunsList runs={runs} emptyText="Nothing logged yet." limit={8} showWr />
      </section>
    </>
  );
}
