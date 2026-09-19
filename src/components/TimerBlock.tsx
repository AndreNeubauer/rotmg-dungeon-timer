"use client";

import { useRuns } from "@/hooks/RunsContext";
import { DungeonIcon } from "./DungeonIcon";
import { PostEndPrompt, RunContextForm } from "./RunContextForm";

export function TimerBlock() {
  const {
    catalog,
    selectedDungeon,
    timerDisplay,
    statusMessage,
    statusKind,
    isRunning,
    onStart,
    onEnd,
    onNexus,
    onDied,
    runContextVisible,
  } = useRuns();

  return (
    <section className={`timer ${isRunning ? "running" : ""}`}>
      <div className="mb-3">
        <button
          type="button"
          disabled={isRunning}
          onClick={() => onStart()}
          className="w-full cursor-pointer rounded-md border border-border bg-surface px-4 py-2.5 text-[0.95rem] text-text hover:border-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start
        </button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <DungeonIcon
          dungeon={selectedDungeon}
          catalog={catalog}
          width={40}
          height={40}
          lazy={false}
        />
        <div>
          <span className="text-[0.65rem] uppercase tracking-wide text-muted">Selected</span>
          <p
            className="m-0 text-[1.1rem] font-medium"
            title={selectedDungeon?.shortName ? selectedDungeon.name : undefined}
          >
            {selectedDungeon?.shortName || selectedDungeon?.name || "—"}
          </p>
        </div>
      </div>

      <div className="timer-display mb-1 text-center text-[2.4rem] font-light tabular-nums tracking-tight">
        {timerDisplay}
      </div>
      {statusMessage && (
        <p className={`status mb-3 text-center text-[0.85rem] ${statusKind}`}>{statusMessage}</p>
      )}

      <div className="mb-3">
        <button
          type="button"
          disabled={!isRunning}
          onClick={onEnd}
          className="w-full cursor-pointer rounded-md border border-green bg-[color-mix(in_srgb,var(--green)_18%,var(--surface))] px-4 py-2.5 text-[0.95rem] text-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          End
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          disabled={!isRunning}
          onClick={onNexus}
          className="flex-1 cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-[0.85rem] text-muted hover:text-text disabled:opacity-40"
        >
          Nexus
        </button>
        <button
          type="button"
          disabled={!isRunning}
          onClick={onDied}
          className="flex-1 cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-[0.85rem] text-muted hover:text-text disabled:opacity-40"
        >
          Died
        </button>
      </div>

      <PostEndPrompt />
      {runContextVisible && <RunContextForm />}
    </section>
  );
}
