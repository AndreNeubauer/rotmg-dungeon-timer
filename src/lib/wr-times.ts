import { publicUrl } from "./assets";
import type { Run, RunType } from "./types";

export interface WrDungeonEntry {
  dungeonId: string;
  name: string;
  soloMinClearSeconds?: number;
  soloWrDisplay?: string;
  soloWeblink?: string;
  groupMinClearSeconds?: number;
  groupWrDisplay?: string;
  groupWeblink?: string;
}

export interface WrTimesCatalog {
  fetchedAt: string;
  note?: string;
  dungeons: WrDungeonEntry[];
}

let cached: Map<string, WrDungeonEntry> | null = null;
let fetchedAt: string | null = null;

export async function loadWrTimes(): Promise<Map<string, WrDungeonEntry>> {
  if (cached) return cached;
  try {
    const res = await fetch(publicUrl("wr-times.json"), { cache: "no-store" });
    if (!res.ok) return new Map();
    const data: WrTimesCatalog = await res.json();
    fetchedAt = data.fetchedAt ?? null;
    cached = new Map(data.dungeons.map((d) => [d.dungeonId, d]));
    return cached;
  } catch {
    return new Map();
  }
}

export function getWrFetchedAt(): string | null {
  return fetchedAt;
}

/** Pick solo vs group WR based on run context. */
export function wrSecondsForRun(
  entry: WrDungeonEntry | undefined,
  run: Pick<Run, "runType" | "groupSize">
): number | null {
  if (!entry) return null;
  const useGroup =
    run.runType === "party" || (run.groupSize != null && run.groupSize > 1);
  if (useGroup && entry.groupMinClearSeconds != null) return entry.groupMinClearSeconds;
  if (entry.soloMinClearSeconds != null) return entry.soloMinClearSeconds;
  if (entry.groupMinClearSeconds != null) return entry.groupMinClearSeconds;
  return null;
}

export function wrDisplayForRun(
  entry: WrDungeonEntry | undefined,
  run: Pick<Run, "runType" | "groupSize">
): string | null {
  if (!entry) return null;
  const useGroup =
    run.runType === "party" || (run.groupSize != null && run.groupSize > 1);
  if (useGroup && entry.groupWrDisplay) return entry.groupWrDisplay;
  return entry.soloWrDisplay ?? entry.groupWrDisplay ?? null;
}

export function wrWeblinkForRun(
  entry: WrDungeonEntry | undefined,
  run: Pick<Run, "runType" | "groupSize">
): string | null {
  if (!entry) return null;
  const useGroup =
    run.runType === "party" || (run.groupSize != null && run.groupSize > 1);
  if (useGroup && entry.groupWeblink) return entry.groupWeblink;
  return entry.soloWeblink ?? entry.groupWeblink ?? null;
}

/** Delta vs WR in seconds (positive = slower than WR). */
export function deltaVsWr(clearSeconds: number, wrSeconds: number): number {
  return clearSeconds - wrSeconds;
}

export function formatWrDelta(seconds: number): string {
  const sign = seconds >= 0 ? "+" : "−";
  const abs = Math.abs(seconds);
  if (abs < 60) return `${sign}${Math.round(abs)}s`;
  const mins = Math.floor(abs / 60);
  const secs = Math.round(abs % 60);
  return `${sign}${mins}:${String(secs).padStart(2, "0")}`;
}

export function pickWrForContext(
  entry: WrDungeonEntry | undefined,
  runType: RunType | null,
  groupSize: number | null
): { seconds: number | null; display: string | null; weblink: string | null } {
  const run = { runType, groupSize };
  return {
    seconds: wrSecondsForRun(entry, run),
    display: wrDisplayForRun(entry, run),
    weblink: wrWeblinkForRun(entry, run),
  };
}
