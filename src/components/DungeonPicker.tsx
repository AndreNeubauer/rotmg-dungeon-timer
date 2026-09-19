"use client";

import { CATEGORY_TAB_LABELS } from "@/lib/constants";
import { useRuns } from "@/hooks/RunsContext";
import { DungeonIcon } from "./DungeonIcon";

export function DungeonPicker() {
  const {
    catalog,
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    filteredDungeons,
    selectedDungeonId,
    selectDungeon,
    isRunning,
  } = useRuns();

  if (!catalog) return null;

  return (
    <div className="mb-6">
      <nav
        className="mb-3 flex flex-wrap gap-1.5"
        aria-label="Dungeon categories"
      >
        {catalog.categories.map((category) => (
          <button
            key={category.id}
            type="button"
            disabled={isRunning}
            onClick={() => setSelectedCategoryId(category.id)}
            className={`cursor-pointer rounded-md border px-3 py-1.5 text-[0.8rem] leading-tight whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45 ${
              selectedCategoryId === category.id
                ? "border-[#555] bg-[#1f1f1f] font-medium text-text"
                : "border-border bg-surface text-muted"
            }`}
          >
            {CATEGORY_TAB_LABELS[category.id] || category.label}
          </button>
        ))}
      </nav>
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={isRunning}
        placeholder="Search this tab"
        autoComplete="off"
        className="mb-3 w-full rounded border border-border bg-surface px-2.5 py-2 text-[0.9rem] text-text focus:border-muted focus:outline-none disabled:opacity-60"
      />
      <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2.5">
        {filteredDungeons.length === 0 ? (
          <p className="col-span-full text-[0.85rem] text-muted">No dungeons match.</p>
        ) : (
          filteredDungeons.map((dungeon) => {
            const selected = dungeon.id === selectedDungeonId;
            return (
              <button
                key={dungeon.id}
                type="button"
                disabled={isRunning && dungeon.id !== selectedDungeonId}
                onClick={() => selectDungeon(dungeon.id)}
                className={`flex min-h-[84px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border px-1 py-2.5 disabled:cursor-not-allowed disabled:opacity-40 ${
                  selected
                    ? "border-green bg-[color-mix(in_srgb,var(--green)_12%,#1c1c1c)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--green)_55%,transparent)]"
                    : "border-transparent bg-surface hover:border-border"
                }`}
              >
                <DungeonIcon dungeon={dungeon} catalog={catalog} width={38} height={38} />
                <span
                  className={`text-center text-[0.65rem] leading-tight ${selected ? "text-text" : "text-muted"}`}
                  title={dungeon.shortName ? dungeon.name : undefined}
                >
                  {dungeon.shortName || dungeon.name}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
