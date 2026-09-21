import { LEGACY_NAME_TO_ID } from "./constants";
import { Outcome, isOutcome, isRunType } from "./enums";
import type { Dungeon, DungeonCatalog, Run } from "./types";

export function buildDungeonMap(catalog: DungeonCatalog): Map<string, Dungeon> {
  return new Map(catalog.dungeons.map((d) => [d.id, d]));
}

export function getDungeon(
  catalog: DungeonCatalog,
  dungeonById: Map<string, Dungeon>,
  idOrName: string
): Dungeon | null {
  if (dungeonById.has(idOrName)) return dungeonById.get(idOrName)!;
  const legacyId = LEGACY_NAME_TO_ID[idOrName];
  if (legacyId && dungeonById.has(legacyId)) return dungeonById.get(legacyId)!;
  for (const d of catalog.dungeons) {
    if (d.name === idOrName) return d;
  }
  return null;
}

export function normalizeRun(
  catalog: DungeonCatalog,
  dungeonById: Map<string, Dungeon>,
  run: Partial<Run> & { dungeon?: string }
): Run {
  const id = run.dungeonId || LEGACY_NAME_TO_ID[run.dungeon ?? ""] || run.dungeon || "";
  const dungeon = getDungeon(catalog, dungeonById, id);
  const outcome = isOutcome(run.outcome) ? run.outcome : Outcome.Complete;
  const findTimeSeconds =
    run.findTimeSeconds != null && Number.isFinite(run.findTimeSeconds)
      ? run.findTimeSeconds
      : null;
  const runType = isRunType(run.runType) ? run.runType : null;
  const groupSize =
    run.groupSize != null && Number.isFinite(run.groupSize) && run.groupSize >= 1
      ? Math.round(run.groupSize)
      : null;
  return {
    ...run,
    id: run.id || crypto.randomUUID(),
    dungeonId: dungeon?.id || id,
    dungeonName: dungeon?.name || run.dungeonName || run.dungeon || id,
    startedAt: run.startedAt || new Date().toISOString(),
    durationSeconds: Number(run.durationSeconds) || 0,
    outcome,
    findTimeSeconds,
    runType,
    groupSize,
    hardMode: run.hardMode === true ? true : null,
    ign: typeof run.ign === "string" && run.ign.trim() ? run.ign.trim() : null,
  } as Run;
}

export function dungeonInCategory(dungeon: Dungeon, categoryId: string): boolean {
  if (dungeon.category === categoryId) return true;
  return Array.isArray(dungeon.alsoIn) && dungeon.alsoIn.includes(categoryId);
}

export function getDungeonsForCategory(
  catalog: DungeonCatalog,
  categoryId: string,
  filter = ""
): Dungeon[] {
  const q = filter.trim().toLowerCase();
  return catalog.dungeons.filter((dungeon) => {
    if (!dungeonInCategory(dungeon, categoryId)) return false;
    if (!q) return true;
    const haystack = `${dungeon.name} ${dungeon.shortName || ""}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function getDungeonPlayerMax(dungeon: Dungeon | null): number {
  const max = dungeon?.playerMax;
  return Number.isFinite(max) && max! >= 1 ? Math.round(max!) : 50;
}

export function getExaltDungeonIds(catalog: DungeonCatalog): Set<string> {
  return new Set(catalog.dungeons.filter((d) => d.category === "exalt").map((d) => d.id));
}
