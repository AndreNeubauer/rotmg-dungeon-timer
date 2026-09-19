import {
  boardRowToRun,
  fetchBoardClientRunIds,
  fetchLeaderboardRows,
  isLeaderboardReady,
  shareRunToLeaderboard,
} from "@/lib/leaderboard";
import type { LeaderboardConfig, Run } from "@/lib/types";

export async function refreshRunsFromBoard(
  config: LeaderboardConfig,
  mergePending: (runs: Run[]) => Run[],
  norm: (run: Partial<Run>) => Run
): Promise<Run[]> {
  if (!isLeaderboardReady(config)) return [];
  const rows = await fetchLeaderboardRows(config);
  return mergePending(rows.map((row) => norm(boardRowToRun(row))));
}

export async function syncPendingRunsToBoard(
  config: LeaderboardConfig,
  runs: Run[],
  pending: Run[],
  getIgn: () => string
): Promise<{ uploaded: number; failed: number }> {
  if (!isLeaderboardReady(config)) return { uploaded: 0, failed: 0 };

  const boardIds = await fetchBoardClientRunIds(config);
  const toUpload = [...runs, ...pending]
    .filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i)
    .filter((run) => !boardIds.has(run.id));

  let uploaded = 0;
  let failed = 0;
  for (const run of toUpload) {
    const result = await shareRunToLeaderboard(config, run, getIgn(), boardIds);
    if (result.ok && result.reason === "uploaded") uploaded += 1;
    else if (!result.ok && result.reason !== "already-shared") failed += 1;
  }
  return { uploaded, failed };
}
