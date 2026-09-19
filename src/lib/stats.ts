import type { Run, Dungeon } from "./types";

function emptyOutcomeCounts() {
  return { complete: 0, nexus: 0, died: 0, total: 0 };
}

function emptyTiming() {
  return { attemptDuration: 0, clearDuration: 0, clearCount: 0, findDuration: 0, findCount: 0 };
}

function emptySourceBuckets() {
  return { party: emptyTiming(), organic: emptyTiming() };
}

function addOutcome(counts: ReturnType<typeof emptyOutcomeCounts>, outcome: string) {
  if (outcome === "complete" || outcome === "nexus" || outcome === "died") {
    counts[outcome] += 1;
  }
  counts.total += 1;
}

function addRunToSourceBucket(
  bucket: ReturnType<typeof emptyTiming>,
  run: Run
) {
  bucket.attemptDuration += run.durationSeconds;
  if (run.outcome === "complete") {
    bucket.clearDuration += run.durationSeconds;
    bucket.clearCount += 1;
  }
  if (run.findTimeSeconds != null && run.findTimeSeconds > 0) {
    bucket.findDuration += run.findTimeSeconds;
    bucket.findCount += 1;
  }
}

export function successRate(counts: { complete: number; total: number }): number | null {
  if (counts.total === 0) return null;
  return Math.round((counts.complete / counts.total) * 100);
}

export function avgDuration(total: number, count: number): number | null {
  return count > 0 ? total / count : null;
}

export function computeStats(runs: Run[]) {
  const overall = {
    ...emptyOutcomeCounts(),
    ...emptyTiming(),
    bySource: emptySourceBuckets(),
  };
  const byDungeon = new Map<
    string,
    ReturnType<typeof emptyOutcomeCounts> &
      ReturnType<typeof emptyTiming> & {
        bySource: ReturnType<typeof emptySourceBuckets>;
        name: string;
        id: string;
      }
  >();

  for (const run of runs) {
    addOutcome(overall, run.outcome);
    overall.attemptDuration += run.durationSeconds;
    if (run.outcome === "complete") {
      overall.clearDuration += run.durationSeconds;
      overall.clearCount += 1;
    }

    if (!byDungeon.has(run.dungeonId)) {
      byDungeon.set(run.dungeonId, {
        ...emptyOutcomeCounts(),
        ...emptyTiming(),
        bySource: emptySourceBuckets(),
        name: run.dungeonName,
        id: run.dungeonId,
      });
    }
    const entry = byDungeon.get(run.dungeonId)!;
    addOutcome(entry, run.outcome);
    entry.attemptDuration += run.durationSeconds;
    if (run.outcome === "complete") {
      entry.clearDuration += run.durationSeconds;
      entry.clearCount += 1;
    }
    if (run.findTimeSeconds != null && run.findTimeSeconds > 0) {
      overall.findDuration += run.findTimeSeconds;
      overall.findCount += 1;
      entry.findDuration += run.findTimeSeconds;
      entry.findCount += 1;
    }
    if (run.runType === "party" || run.runType === "organic") {
      addRunToSourceBucket(overall.bySource[run.runType], run);
      addRunToSourceBucket(entry.bySource[run.runType], run);
    }
  }

  return { overall, byDungeon };
}

export function getDungeonSummaries(
  runs: Run[],
  getDungeon: (id: string) => Dungeon | null
) {
  const { byDungeon } = computeStats(runs);
  return [...byDungeon.values()]
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      dungeon: getDungeon(entry.id),
      stats: {
        complete: entry.complete,
        nexus: entry.nexus,
        died: entry.died,
        total: entry.total,
      },
      avgClear: avgDuration(entry.clearDuration, entry.clearCount),
      avgAttempt: avgDuration(entry.attemptDuration, entry.total),
      avgFind: avgDuration(entry.findDuration, entry.findCount),
      findCount: entry.findCount,
      clearCount: entry.clearCount,
      bySource: entry.bySource,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function bestClearSeconds(runs: Run[]): number | null {
  let best: number | null = null;
  for (const run of runs) {
    if (run.outcome !== "complete") continue;
    if (best == null || run.durationSeconds < best) best = run.durationSeconds;
  }
  return best;
}

export function totalClearHours(runs: Run[]): number {
  let total = 0;
  for (const run of runs) {
    if (run.outcome === "complete") total += run.durationSeconds;
  }
  return total / 3600;
}
