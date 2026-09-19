import { PENDING_RUNS_KEY, STORAGE_KEY } from "./constants";
import type { Run } from "./types";

export function loadPendingRuns(norm: (run: Partial<Run>) => Run): Run[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PENDING_RUNS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => norm(r));
  } catch {
    return [];
  }
}

export function savePendingRuns(pending: Run[]): void {
  try {
    localStorage.setItem(PENDING_RUNS_KEY, JSON.stringify(pending.slice(-200)));
  } catch {
    /* ignore */
  }
}

export function loadLocalRuns(norm: (run: Partial<Run>) => Run): Run[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => norm(r));
  } catch {
    return [];
  }
}

export function persistLocalRunsToStorage(runs: Run[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch {
    /* ignore */
  }
}
