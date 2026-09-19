"use client";

import { useState } from "react";
import { FIND_PRESETS_MIN, RUN_SOURCES } from "@/lib/constants";
import { parseFindTimeInput, parseGroupSizeInput } from "@/lib/format";
import { useRuns } from "@/hooks/RunsContext";
import type { RunType } from "@/lib/types";

export function RunContextForm() {
  const {
    finishRunContext,
    dismissRunContext,
    selectedRunType,
    setSelectedRunType,
    showSearchTimeForContext,
    runContextPlayerMax,
    runContextShowHardMode,
  } = useRuns();

  const [groupInput, setGroupInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [hardMode, setHardMode] = useState(false);

  const readInputs = () => ({
    groupSize: parseGroupSizeInput(groupInput, runContextPlayerMax),
    findTimeSeconds: parseFindTimeInput(searchInput),
    hardMode: runContextShowHardMode && hardMode ? true : null,
  });

  const chainNote = showSearchTimeForContext
    ? "Skip, pick another dungeon, or press Start anytime."
    : "Chain spawn — no search time.";

  return (
    <div className="mt-4 rounded-md border border-border bg-surface/80 p-4">
      <p className="mb-3 text-[0.85rem] leading-snug text-text">
        Run details <span className="text-muted">(optional)</span>
        <span className="mt-1 block text-[0.72rem] text-muted">{chainNote}</span>
      </p>

      <p className="mb-1.5 text-[0.72rem] text-muted">Party or organic</p>
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Run type">
        {(Object.entries(RUN_SOURCES) as [RunType, { label: string; title: string }][]).map(
          ([key, { label, title }]) => (
            <button
              key={key}
              type="button"
              title={title}
              aria-pressed={selectedRunType === key}
              onClick={() => setSelectedRunType(selectedRunType === key ? null : key)}
              className={`cursor-pointer rounded border px-2.5 py-1 text-[0.75rem] ${
                selectedRunType === key
                  ? "border-green text-text"
                  : "border-border text-muted hover:border-muted"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      <p className="mb-1.5 text-[0.72rem] text-muted">
        Group size (1–{runContextPlayerMax} players)
      </p>
      <input
        type="text"
        value={groupInput}
        onChange={(e) => setGroupInput(e.target.value)}
        placeholder={`e.g. 6 · max ${runContextPlayerMax}`}
        inputMode="numeric"
        autoComplete="off"
        className="mb-3 w-full rounded border border-border bg-bg px-2.5 py-2 text-[0.85rem] text-text focus:outline-none"
      />

      {runContextShowHardMode && (
        <>
          <p className="mb-1.5 text-[0.72rem] text-muted">Difficulty</p>
          <label className="mb-3 flex cursor-pointer items-center gap-2 text-[0.85rem]">
            <input
              type="checkbox"
              checked={hardMode}
              onChange={(e) => setHardMode(e.target.checked)}
              className="accent-green"
            />
            Hard mode
          </label>
        </>
      )}

      {showSearchTimeForContext && (
        <>
          <p className="mb-1.5 text-[0.72rem] text-muted">Search time (realm → portal)</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {FIND_PRESETS_MIN.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() =>
                  finishRunContext({
                    ...readInputs(),
                    findTimeSeconds: minutes * 60,
                  })
                }
                className="cursor-pointer rounded border border-border px-2.5 py-1 text-[0.75rem] text-muted hover:border-muted hover:text-text"
              >
                {minutes}m
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="min or m:ss"
            inputMode="decimal"
            autoComplete="off"
            className="mb-3 w-full rounded border border-border bg-bg px-2.5 py-2 text-[0.85rem] text-text focus:outline-none"
          />
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => finishRunContext()}
          className="cursor-pointer rounded border border-border px-3 py-1.5 text-[0.8rem] text-muted hover:text-text"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => finishRunContext(readInputs())}
          className="cursor-pointer rounded border border-green bg-[color-mix(in_srgb,var(--green)_15%,var(--surface))] px-3 py-1.5 text-[0.8rem] text-text"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export function PostEndPrompt() {
  const {
    postEndPromptVisible,
    postEndLabel,
    postEndActions,
    handlePostEndAction,
  } = useRuns();

  if (!postEndPromptVisible || !postEndActions) return null;

  return (
    <div className="mt-4 rounded-md border border-border bg-surface/80 p-4">
      <p className="mb-3 text-[0.85rem] text-text">{postEndLabel}</p>
      <p className="mb-3 text-[0.72rem] text-muted">
        Or pick another dungeon above and press Start.
      </p>
      <div className="flex flex-wrap gap-2">
        {postEndActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => handlePostEndAction(action)}
            className={`cursor-pointer rounded border px-3 py-1.5 text-[0.8rem] ${
              action.primary
                ? "border-green bg-[color-mix(in_srgb,var(--green)_15%,var(--surface))] text-text"
                : "border-border text-muted hover:text-text"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
