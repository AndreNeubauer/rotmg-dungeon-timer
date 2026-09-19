"use client";

import { OUTCOMES, RUN_SOURCES } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { runsNewestFirst } from "@/lib/run-persistence";
import type { Run } from "@/lib/types";
import { useRuns } from "@/hooks/RunsContext";
import { DungeonIcon } from "./DungeonIcon";

interface RecentRunsListProps {
  runs?: Run[];
  emptyText: string;
  limit?: number;
}

export function RecentRunsList({ runs: propRuns, emptyText, limit = 8 }: RecentRunsListProps) {
  const { catalog, getDungeonById, runs: allRuns } = useRuns();
  const runs = runsNewestFirst(propRuns ?? allRuns).slice(0, limit);

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
            <div className="shrink-0 tabular-nums text-[0.85rem]">
              {formatDuration(run.durationSeconds)}
            </div>
          </article>
        );
      })}
    </div>
  );
}
