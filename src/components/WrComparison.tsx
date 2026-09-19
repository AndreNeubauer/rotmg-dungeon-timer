"use client";

import { formatDuration } from "@/lib/format";
import { formatWrDelta } from "@/lib/wr-times";
import type { WrDungeonEntry } from "@/lib/wr-times";

interface WrComparisonProps {
  clearSeconds: number;
  wrSeconds: number | null;
  wrDisplay: string | null;
  wrWeblink: string | null;
  compact?: boolean;
}

export function WrComparison({
  clearSeconds,
  wrSeconds,
  wrDisplay,
  wrWeblink,
  compact = false,
}: WrComparisonProps) {
  if (wrSeconds == null) return null;

  const delta = clearSeconds - wrSeconds;
  const isFaster = delta < 0;
  const deltaClass = isFaster ? "text-green" : delta <= 5 ? "text-muted" : "text-red";

  if (compact) {
    return (
      <span className={`text-[0.65rem] ${deltaClass}`} title={`WR: ${wrDisplay ?? formatDuration(wrSeconds)}`}>
        {formatWrDelta(delta)} vs WR
      </span>
    );
  }

  return (
    <div className="text-[0.68rem] text-muted">
      <span>WR </span>
      {wrWeblink ? (
        <a
          href={wrWeblink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text underline decoration-border hover:decoration-muted"
        >
          {wrDisplay ?? formatDuration(wrSeconds)}
        </a>
      ) : (
        <span className="text-text">{wrDisplay ?? formatDuration(wrSeconds)}</span>
      )}
      <span className={`ml-1.5 ${deltaClass}`}>{formatWrDelta(delta)}</span>
    </div>
  );
}

export function wrForDungeon(
  wrMap: Map<string, WrDungeonEntry>,
  dungeonId: string,
  runType: "party" | "organic" | null,
  groupSize: number | null
) {
  const entry = wrMap.get(dungeonId);
  if (!entry) return { seconds: null, display: null, weblink: null };
  const useGroup = runType === "party" || (groupSize != null && groupSize > 1);
  const seconds = useGroup
    ? (entry.groupMinClearSeconds ?? entry.soloMinClearSeconds ?? null)
    : (entry.soloMinClearSeconds ?? entry.groupMinClearSeconds ?? null);
  const display = useGroup
    ? (entry.groupWrDisplay ?? entry.soloWrDisplay ?? null)
    : (entry.soloWrDisplay ?? entry.groupWrDisplay ?? null);
  const weblink = useGroup
    ? (entry.groupWeblink ?? entry.soloWeblink ?? null)
    : (entry.soloWeblink ?? entry.groupWeblink ?? null);
  return { seconds, display, weblink };
}
