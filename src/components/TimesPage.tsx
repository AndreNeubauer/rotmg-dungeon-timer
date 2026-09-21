"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OUTCOMES, RUN_SOURCES } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { avgDuration, computeStats, getDungeonSummaries, successRate } from "@/lib/stats";
import { runsNewestFirst } from "@/lib/run-persistence";
import { useRuns } from "@/hooks/RunsContext";
import { DungeonIcon } from "./DungeonIcon";
import { TableSkeleton } from "./LoadingSkeleton";

function formatTimePair(avgClear: number | null, avgAttempt: number | null) {
  const clear = avgClear != null ? formatDuration(avgClear) : "—";
  const attempt = avgAttempt != null ? formatDuration(avgAttempt) : "—";
  return (
    <>
      <span className="text-green" title="Average clear">
        {clear}
      </span>
      <span className="text-muted"> · </span>
      <span className="text-muted" title="Average attempt">
        {attempt}
      </span>
    </>
  );
}

export function TimesPage() {
  const {
    runs,
    catalog,
    getDungeonById,
    usesBoardStorage,
    boardAdminUnlocked,
    deleteRun,
    exportRuns,
    importRuns,
    refreshFromBoard,
  } = useRuns();
  const [filterId, setFilterId] = useState("");
  const [loading, setLoading] = useState(true);
  const importRef = useRef<HTMLInputElement>(null);
  const showDeleteColumn = !usesBoardStorage || boardAdminUnlocked;

  useEffect(() => {
    setLoading(true);
    void refreshFromBoard().finally(() => setLoading(false));
  }, [refreshFromBoard]);

  const filterOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const run of runs) {
      if (!byId.has(run.dungeonId)) {
        const dungeon = getDungeonById(run.dungeonId);
        byId.set(run.dungeonId, dungeon?.shortName || dungeon?.name || run.dungeonName);
      }
    }
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [runs, getDungeonById]);

  const filteredRuns = filterId ? runs.filter((r) => r.dungeonId === filterId) : runs;
  const { overall } = computeStats(filteredRuns);
  const summaries = getDungeonSummaries(runs, getDungeonById);
  const tableRuns = runsNewestFirst(filteredRuns);

  const rate = successRate(overall);
  const avgClear = avgDuration(overall.clearDuration, overall.clearCount);
  const avgAttempt = avgDuration(overall.attemptDuration, overall.total);
  const avgFind = avgDuration(overall.findDuration, overall.findCount);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-[0.78rem] text-muted" htmlFor="times-dungeon-filter">
          Dungeon
        </label>
        <select
          id="times-dungeon-filter"
          value={filterId}
          onChange={(e) => setFilterId(e.target.value)}
          className="rounded border border-border bg-surface px-2 py-1.5 text-[0.85rem] text-text"
        >
          <option value="">All dungeons</option>
          {filterOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={exportRuns}
            className="cursor-pointer rounded border border-border px-2.5 py-1 text-[0.75rem] text-muted hover:text-text"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="cursor-pointer rounded border border-border px-2.5 py-1 text-[0.75rem] text-muted hover:text-text"
          >
            Import
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void importRuns(file);
            }}
          />
        </div>
      </div>

      {overall.total === 0 ? (
        <p className="mb-4 text-[0.85rem] text-muted">
          {filterId ? "No attempts for this dungeon." : "No attempts yet."}
        </p>
      ) : (
        <div className="mb-5 flex gap-3 rounded-md border border-border bg-surface p-3">
          <div className="text-[1.6rem] font-semibold tabular-nums text-green">{rate}%</div>
          <div className="min-w-0 flex-1 text-[0.78rem]">
            {filterId && (
              <div className="mb-1 font-medium">
                {getDungeonById(filterId)?.shortName || getDungeonById(filterId)?.name}
              </div>
            )}
            <div className="mb-1 flex flex-wrap gap-1.5">
              <span className="outcome-pill complete">{overall.complete} complete</span>
              <span className="outcome-pill nexus">{overall.nexus} nexus</span>
              <span className="outcome-pill died">{overall.died} died</span>
              <span className="text-muted">{overall.total} attempts</span>
            </div>
            <div>
              {formatTimePair(avgClear, avgAttempt)}
              <span className="ml-1 text-[0.65rem] text-muted">clear · avg</span>
            </div>
            {avgFind != null && (
              <div className="text-muted">
                +{formatDuration(avgFind)} avg search ({overall.findCount} logged)
              </div>
            )}
          </div>
        </div>
      )}

      {!filterId && summaries.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-2 text-[0.65rem] uppercase tracking-wide text-muted">
            <span>Dungeon</span>
            <span>Rate</span>
            <span className="text-right">Clear · avg</span>
          </div>
          {summaries.map(({ id, name, avgClear, avgAttempt, stats, clearCount, dungeon }) => {
            const rate = successRate(stats);
            return (
              <div
                key={id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-border/50 py-2 text-[0.78rem]"
              >
                <span className="flex items-center gap-2 truncate">
                  <DungeonIcon dungeon={dungeon} catalog={catalog} width={22} height={22} />
                  {name}
                </span>
                <span className="text-muted">
                  {stats.total > clearCount
                    ? `${rate}% · ${stats.complete}/${stats.total}`
                    : `${stats.total}×`}
                </span>
                <span className="text-right">{formatTimePair(avgClear, avgAttempt)}</span>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} cols={showDeleteColumn ? 5 : 4} />
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.78rem]">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Dungeon</th>
              <th className="py-2 pr-3">Result</th>
              <th className="py-2 pr-3">Time</th>
              {showDeleteColumn && <th className="py-2" />}
            </tr>
          </thead>
          <tbody>
            {tableRuns.length === 0 ? (
              <tr>
                <td colSpan={showDeleteColumn ? 5 : 4} className="py-4 text-muted">
                  {filterId ? "No attempts for this dungeon." : "No attempts yet."}
                </td>
              </tr>
            ) : (
              tableRuns.map((run) => {
                const dungeon = getDungeonById(run.dungeonId);
                const when = new Date(run.startedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={run.id} className="border-b border-border/40">
                    <td className="py-2 pr-3 text-muted">{when}</td>
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
                        {run.ign && <span className="outcome-pill ign-tag">{run.ign}</span>}
                        {run.runType && (
                          <span className={`outcome-pill source-${run.runType}`}>
                            {RUN_SOURCES[run.runType].label}
                          </span>
                        )}
                        {run.groupSize != null && (
                          <span className="outcome-pill group-size">{run.groupSize}p</span>
                        )}
                        {run.hardMode && <span className="outcome-pill hard-mode">Hard</span>}
                        <span className={`outcome-pill ${run.outcome}`}>
                          {OUTCOMES[run.outcome].label}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      <div>{formatDuration(run.durationSeconds)}</div>
                      {run.findTimeSeconds != null && run.findTimeSeconds > 0 && (
                        <span className="text-[0.65rem] text-muted">
                          +{formatDuration(run.findTimeSeconds)} search
                        </span>
                      )}
                    </td>
                    {showDeleteColumn && (
                      <td className="py-2">
                        <button
                          type="button"
                          aria-label="Delete run"
                          onClick={() => void deleteRun(run.id)}
                          className="cursor-pointer text-[0.68rem] text-red hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    )}
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
