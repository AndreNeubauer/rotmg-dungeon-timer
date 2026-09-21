"use client";

import { useEffect, useMemo, useState } from "react";
import { OUTCOMES } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { formatRunTags } from "@/lib/leaderboard";
import { useRuns } from "@/hooks/RunsContext";
import { DungeonIcon } from "./DungeonIcon";
import { TableSkeleton } from "./LoadingSkeleton";

export function LeaderboardPage() {
  const {
    runs,
    catalog,
    getDungeonById,
    usesBoardStorage,
    refreshFromBoard,
    syncAllRunsToBoard,
    leaderboardStatus,
    leaderboardStatusError,
  } = useRuns();
  const [filterId, setFilterId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (usesBoardStorage) {
          await syncAllRunsToBoard({ quiet: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // syncAllRunsToBoard changes when `runs` updates; only load when board mode toggles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usesBoardStorage]);

  const dungeonOptions = useMemo(() => {
    if (!catalog) return [];
    return [...catalog.dungeons].sort((a, b) =>
      (a.shortName || a.name).localeCompare(b.shortName || b.name)
    );
  }, [catalog]);

  const boardRuns = useMemo(() => {
    let list = runs.slice();
    if (filterId) list = list.filter((r) => r.dungeonId === filterId);
    return list.sort((a, b) => a.durationSeconds - b.durationSeconds);
  }, [runs, filterId]);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 min-w-48 flex-1 text-[0.78rem] leading-snug text-muted">
          Same run log as Times — fastest clears first. New times save automatically.
        </p>
        <button
          type="button"
          onClick={() => void refreshFromBoard()}
          className="cursor-pointer rounded border border-border px-2.5 py-1 text-[0.75rem] text-muted hover:text-text"
        >
          Refresh
        </button>
      </div>

      <p
        className={`mb-3 text-[0.72rem] ${leaderboardStatusError ? "text-red" : "text-muted"}`}
      >
        {loading
          ? "Loading leaderboard…"
          : leaderboardStatus ||
            (!usesBoardStorage ? "Leaderboard database is not configured yet." : "")}
      </p>

      <div className="mb-3 flex items-center gap-3">
        <label className="text-[0.78rem] text-muted" htmlFor="leaderboard-dungeon-filter">
          Dungeon
        </label>
        <select
          id="leaderboard-dungeon-filter"
          value={filterId}
          onChange={(e) => setFilterId(e.target.value)}
          className="rounded border border-border bg-surface px-2 py-1.5 text-[0.85rem] text-text"
        >
          <option value="">All dungeons</option>
          {dungeonOptions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.shortName || d.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.78rem]">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="w-9 py-2 pr-3 text-right">#</th>
                <th className="py-2 pr-3">Dungeon</th>
                <th className="py-2 pr-3">Result</th>
                <th className="py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {boardRuns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-muted">
                    {filterId ? "No runs for this dungeon yet." : "No runs yet."}
                  </td>
                </tr>
              ) : (
                boardRuns.map((run, index) => {
                  const dungeon = getDungeonById(run.dungeonId);
                  const tags = formatRunTags(
                    {
                      ign: run.ign,
                      runType: run.runType,
                      groupSize: run.groupSize,
                      hardMode: run.hardMode,
                    },
                    { includeIgn: true }
                  );
                  return (
                    <tr key={run.id} className="border-b border-border/40">
                      <td className="py-2 pr-3 text-right tabular-nums text-muted">{index + 1}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <DungeonIcon
                            dungeon={dungeon}
                            catalog={catalog}
                            className="table-icon"
                            width={22}
                            height={22}
                          />
                          <span>{run.dungeonName}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <span key={tag.label} className={`outcome-pill ${tag.type}`}>
                              {tag.label}
                            </span>
                          ))}
                          <span className={`outcome-pill ${run.outcome}`}>
                            {OUTCOMES[run.outcome].label}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 tabular-nums">{formatDuration(run.durationSeconds)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
