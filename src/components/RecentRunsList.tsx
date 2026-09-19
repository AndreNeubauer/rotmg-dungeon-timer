"use client";

import { useEffect, useState } from "react";
import { OUTCOMES, RUN_SOURCES } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { runsNewestFirst } from "@/lib/run-persistence";
import { loadWrTimes, type WrDungeonEntry } from "@/lib/wr-times";
import type { Run } from "@/lib/types";
import { useRuns } from "@/hooks/RunsContext";
import { DungeonIcon } from "./DungeonIcon";
import { WrComparison, wrForDungeon } from "./WrComparison";

interface RecentRunsListProps {
  runs?: Run[];
  emptyText: string;
  limit?: number;
  showWr?: boolean;
}

export function RecentRunsList({ runs: propRuns, emptyText, limit = 8, showWr = false }: RecentRunsListProps) {
  const { catalog, getDungeonById, runs: allRuns } = useRuns();
  const runs = runsNewestFirst(propRuns ?? allRuns).slice(0, limit);
  const [wrMap, setWrMap] = useState<Map<string, WrDungeonEntry>>(new Map());

  useEffect(() => {
    if (showWr) void loadWrTimes().then(setWrMap);
  }, [showWr]);

  if (runs.length === 0) {
    return <p className="text-[0.85rem] text-muted">{emptyText}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {runs.map((run) => {
        const dungeon = getDungeonById(run.dungeonId);
        const when = new Date(run.startedAt).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const tags: string[] = [];
        if (run.runType) tags.push(RUN_SOURCES[run.runType].label);
        if (run.groupSize != null) tags.push(`${run.groupSize}p`);
        if (run.hardMode) tags.push("Hard");
        if (run.outcome !== "complete") tags.push(OUTCOMES[run.outcome].label);
        const wr =
          showWr && run.outcome === "complete"
            ? wrForDungeon(wrMap, run.dungeonId, run.runType, run.groupSize)
            : { seconds: null, display: null, weblink: null };

        return (
          <article
            key={run.id}
            className="flex items-center gap-2.5 rounded-md border border-border/60 bg-surface/60 px-2.5 py-2"
          >
            <DungeonIcon dungeon={dungeon} catalog={catalog} width={28} height={28} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.85rem] font-medium">{run.dungeonName}</div>
              <div className="text-[0.68rem] text-muted">
                {when}
                {tags.length ? ` · ${tags.join(" · ")}` : ""}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="tabular-nums text-[0.85rem]">{formatDuration(run.durationSeconds)}</div>
              {showWr && run.outcome === "complete" && (
                <WrComparison
                  clearSeconds={run.durationSeconds}
                  wrSeconds={wr.seconds}
                  wrDisplay={wr.display}
                  wrWeblink={wr.weblink}
                  compact
                />
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
