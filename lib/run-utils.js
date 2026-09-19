/** @file Pure run, routing, and formatting helpers (no DOM or storage). */

import {
  DUPLICATE_WINDOW_MS,
  GLOBAL_MIN_SECONDS,
  OUTCOMES,
  OVERLAP_TOLERANCE_MS,
  PAGE_ROUTE_SEGMENTS,
  ROUTE_SEGMENT_TO_PAGE,
  RUN_SOURCES,
  LEGACY_NAME_TO_ID,
} from "./constants.js";

export function formatDuration(seconds) {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function runStartMs(run) {
  return new Date(run.startedAt).getTime();
}

export function runEndMs(run) {
  return runStartMs(run) + run.durationSeconds * 1000;
}

export function normalizeRun(run, getDungeon = () => null) {
  const id = run.dungeonId || LEGACY_NAME_TO_ID[run.dungeon] || run.dungeon;
  const dungeon = getDungeon(id);
  const outcome = run.outcome && OUTCOMES[run.outcome] ? run.outcome : "complete";
  const findTimeSeconds =
    run.findTimeSeconds != null && Number.isFinite(run.findTimeSeconds)
      ? run.findTimeSeconds
      : null;
  const runType = run.runType && RUN_SOURCES[run.runType] ? run.runType : null;
  const groupSize =
    run.groupSize != null && Number.isFinite(run.groupSize) && run.groupSize >= 1
      ? Math.round(run.groupSize)
      : null;
  return {
    ...run,
    id: run.id || crypto.randomUUID(),
    dungeonId: dungeon?.id || id,
    dungeonName: dungeon?.name || run.dungeonName || run.dungeon || id,
    outcome,
    findTimeSeconds,
    runType,
    groupSize,
    hardMode: run.hardMode === true ? true : null,
    ign: typeof run.ign === "string" && run.ign.trim() ? run.ign.trim() : null,
  };
}

export function validateRun(run, existingRuns) {
  const duration = run.durationSeconds;
  if (!Number.isFinite(duration) || duration < GLOBAL_MIN_SECONDS) {
    return `Too short (${formatDuration(Math.max(0, duration))}) — not saved`;
  }

  const startMs = runStartMs(run);
  for (const other of existingRuns) {
    if (startMs + OVERLAP_TOLERANCE_MS < runEndMs(other) - OVERLAP_TOLERANCE_MS) {
      return `Time travel — overlaps ${other.dungeonName} (${formatDuration(other.durationSeconds)}) — not saved`;
    }
    if (
      other.dungeonId === run.dungeonId &&
      Math.round(other.durationSeconds) === Math.round(duration) &&
      Math.abs(startMs - runStartMs(other)) <= DUPLICATE_WINDOW_MS
    ) {
      return `Duplicate ${run.dungeonName} (${formatDuration(duration)}) — not saved`;
    }
  }

  return null;
}

export function parseGroupSizeInput(raw, maxPlayers) {
  const text = raw.trim();
  if (!text) return null;
  const size = Math.round(Number(text));
  if (!Number.isFinite(size) || size < 1 || size > maxPlayers) return null;
  return size;
}

export function parseFindTimeInput(raw) {
  const text = raw.trim();
  if (!text) return null;
  if (text.includes(":")) {
    const [mins, secs] = text.split(":").map((part) => Number(part));
    if (Number.isFinite(mins) && Number.isFinite(secs) && mins >= 0 && secs >= 0) {
      return mins * 60 + secs;
    }
    return null;
  }
  const minutes = Number(text);
  if (Number.isFinite(minutes) && minutes > 0) return Math.round(minutes * 60);
  return null;
}

function emptyOutcomeCounts() {
  return { complete: 0, nexus: 0, died: 0, total: 0 };
}

function addOutcome(counts, outcome) {
  counts[outcome] += 1;
  counts.total += 1;
}

function emptyTiming() {
  return { attemptDuration: 0, clearDuration: 0, clearCount: 0, findDuration: 0, findCount: 0 };
}

function emptySourceBuckets() {
  return { party: emptyTiming(), organic: emptyTiming() };
}

function addRunToSourceBucket(bucket, run) {
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

export function computeStats(runs) {
  const overall = { ...emptyOutcomeCounts(), ...emptyTiming(), bySource: emptySourceBuckets() };
  const byDungeon = new Map();

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
    const entry = byDungeon.get(run.dungeonId);
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

export function avgDuration(total, count) {
  return count > 0 ? total / count : null;
}

export function successRate(counts) {
  if (counts.total === 0) return null;
  return Math.round((counts.complete / counts.total) * 100);
}

export function getAppBase(pathname) {
  const path = pathname.replace(/\/$/, "");
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "";
  const last = parts[parts.length - 1];
  if (ROUTE_SEGMENT_TO_PAGE[last] || last === "index.html") {
    return parts.length > 1 ? `/${parts.slice(0, -1).join("/")}` : "";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export function buildPageUrl(pageName, pathname = "/") {
  const segment = PAGE_ROUTE_SEGMENTS[pageName] || "Timer";
  const base = getAppBase(pathname).replace(/\/$/, "");
  return `${base}/${segment}`;
}

export function pageFromPath(pathname = "/") {
  const parts = pathname.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length === 0) return "timer";
  const last = parts[parts.length - 1];
  if (last === "index.html") return "timer";
  return ROUTE_SEGMENT_TO_PAGE[last] || "timer";
}
