import type { Outcome, PostEndActionKind, RunType } from "./enums";

export type { Outcome, PageId, PostEndActionKind, RunType } from "./enums";

export interface Run {
  id: string;
  dungeonId: string;
  dungeonName: string;
  startedAt: string;
  durationSeconds: number;
  outcome: Outcome;
  findTimeSeconds: number | null;
  runType: RunType | null;
  groupSize: number | null;
  hardMode: boolean | null;
  ign: string | null;
}

export interface Dungeon {
  id: string;
  name: string;
  shortName?: string;
  category: string;
  alsoIn?: string[];
  icon?: string;
  playerMax?: number;
}

export interface DungeonCatalog {
  version: number;
  iconBase: string;
  fallbackIcon: string;
  categories: { id: string; label: string }[];
  dungeons: Dungeon[];
}

export interface LeaderboardConfig {
  enabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  table: string;
}

export interface PostEndAction {
  label: string;
  kind: PostEndActionKind;
  nextId?: string;
  runName?: string;
  primary?: boolean;
}

export interface PostEndPromptConfig {
  hint?: string;
  deferSave?: boolean;
  actions: PostEndAction[];
}
