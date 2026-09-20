"use client";

import { useRuns } from "@/hooks/RunsContext";

export function DemoRunsBanner() {
  const { runs, loadDemoRuns, usesBoardStorage } = useRuns();

  if (usesBoardStorage || runs.length > 0) return null;

  return (
    <div className="mb-5 rounded-md border border-border bg-panel px-3 py-2.5 text-[0.82rem]">
      <span className="text-muted">No runs yet. </span>
      <button
        type="button"
        onClick={() => void loadDemoRuns()}
        className="cursor-pointer text-text underline decoration-border hover:decoration-muted"
      >
        Load demo data
      </button>
      <span className="text-muted"> to explore stats and the leaderboard.</span>
    </div>
  );
}
