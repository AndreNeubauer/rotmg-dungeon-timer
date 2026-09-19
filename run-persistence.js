/**
 * Shared run-log helpers (browser + Node tests).
 * Pending local runs must survive a board refresh so LH → Void chains
 * still show after Times/Overview reload from Supabase.
 */
(function (root) {
  const OVERLAP_TOLERANCE_MS = 3_000;
  const DUPLICATE_WINDOW_MS = 120_000;
  const GLOBAL_MIN_SECONDS = 3;

  function runStartMs(run) {
    return new Date(run.startedAt).getTime();
  }

  function runEndMs(run) {
    return runStartMs(run) + Number(run.durationSeconds) * 1000;
  }

  function intervalsOverlap(aStart, aEnd, bStart, bEnd, tolerance) {
    return aStart + tolerance < bEnd - tolerance && bStart + tolerance < aEnd - tolerance;
  }

  function mergePendingIntoRuns(boardRuns, pendingRuns) {
    const byId = new Map();
    for (const run of boardRuns || []) {
      if (run && run.id) byId.set(run.id, run);
    }
    for (const pending of pendingRuns || []) {
      if (!pending || !pending.id) continue;
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

  function validateRun(run, existingRuns, { formatDuration } = {}) {
    const duration = Number(run.durationSeconds);
    const label = typeof formatDuration === "function" ? formatDuration : String;
    if (!Number.isFinite(duration) || duration < GLOBAL_MIN_SECONDS) {
      return `Too short (${label(Math.max(0, duration))}) — not saved`;
    }

    const startMs = runStartMs(run);
    const endMs = startMs + duration * 1000;
    for (const other of existingRuns || []) {
      if (run.id && other.id && run.id === other.id) continue;
      if (intervalsOverlap(startMs, endMs, runStartMs(other), runEndMs(other), OVERLAP_TOLERANCE_MS)) {
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

  function runsNewestFirst(runs) {
    return (runs || []).slice().sort((a, b) => runStartMs(b) - runStartMs(a));
  }

  const api = {
    OVERLAP_TOLERANCE_MS,
    DUPLICATE_WINDOW_MS,
    GLOBAL_MIN_SECONDS,
    runStartMs,
    runEndMs,
    intervalsOverlap,
    mergePendingIntoRuns,
    validateRun,
    runsNewestFirst,
  };

  root.RotmgRunPersistence = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
