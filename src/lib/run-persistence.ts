export const OVERLAP_TOLERANCE_MS = 3_000;
export const DUPLICATE_WINDOW_MS = 120_000;
export const GLOBAL_MIN_SECONDS = 3;

export interface PersistableRun {
  id: string;
  dungeonId: string;
  dungeonName: string;
  startedAt: string;
  durationSeconds: number;
  outcome?: string;
  runType?: string | null;
  groupSize?: number | null;
  hardMode?: boolean | null;
  findTimeSeconds?: number | null;
  ign?: string | null;
}

export function runStartMs(run: PersistableRun): number {
  return new Date(run.startedAt).getTime();
}

export function runEndMs(run: PersistableRun): number {
  return runStartMs(run) + Number(run.durationSeconds) * 1000;
}

export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  tolerance: number
): boolean {
  return aStart + tolerance < bEnd - tolerance && bStart + tolerance < aEnd - tolerance;
}

export function mergePendingIntoRuns(
  boardRuns: PersistableRun[],
  pendingRuns: PersistableRun[]
): PersistableRun[] {
  const byId = new Map<string, PersistableRun>();
  for (const run of boardRuns || []) {
    if (run?.id) byId.set(run.id, run);
  }
  for (const pending of pendingRuns || []) {
    if (!pending?.id) continue;
    const existing = byId.get(pending.id);
    if (existing) {
      byId.set(pending.id, {
        ...existing,
        dungeonName: pending.dungeonName || existing.dungeonName,
        runType: pending.runType ?? existing.runType,
        groupSize: pending.groupSize ?? existing.groupSize,
        hardMode: pending.hardMode ?? existing.hardMode,
        findTimeSeconds: pending.findTimeSeconds ?? existing.findTimeSeconds,
        ign: pending.ign ?? existing.ign,
      });
    } else {
      byId.set(pending.id, pending);
    }
  }
  return [...byId.values()].sort((a, b) => runStartMs(a) - runStartMs(b));
}

export function validateRun(
  run: PersistableRun,
  existingRuns: PersistableRun[],
  { formatDuration }: { formatDuration?: (seconds: number) => string } = {}
): string | null {
  const duration = Number(run.durationSeconds);
  const label = typeof formatDuration === "function" ? formatDuration : String;
  if (!Number.isFinite(duration) || duration < GLOBAL_MIN_SECONDS) {
    return `Too short (${label(Math.max(0, duration))}) — not saved`;
  }

  const startMs = runStartMs(run);
  const endMs = startMs + duration * 1000;
  for (const other of existingRuns || []) {
    if (run.id && other.id && run.id === other.id) continue;
    if (
      intervalsOverlap(startMs, endMs, runStartMs(other), runEndMs(other), OVERLAP_TOLERANCE_MS)
    ) {
      return `Time travel — overlaps ${other.dungeonName} (${label(other.durationSeconds)}) — not saved`;
    }
    if (
      other.dungeonId === run.dungeonId &&
      Math.round(Number(other.durationSeconds)) === Math.round(duration) &&
      Math.abs(startMs - runStartMs(other)) <= DUPLICATE_WINDOW_MS
    ) {
      return `Duplicate ${run.dungeonName} (${label(duration)}) — not saved`;
    }
  }
  return null;
}

export function runsNewestFirst<T extends PersistableRun>(runs: T[]): T[] {
  return (runs || []).slice().sort((a, b) => runStartMs(b) - runStartMs(a));
}
