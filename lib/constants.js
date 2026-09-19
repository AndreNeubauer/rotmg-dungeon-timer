/** @file Shared constants and enum-like values for the RotMG Dungeon Timer. */

export const APP_VERSION = "2.8.1";

export const PAGE_ROUTE_SEGMENTS = {
  timer: "Timer",
  overview: "Overview",
  times: "Times",
  leaderboard: "Board",
  about: "About",
};

export const ROUTE_SEGMENT_TO_PAGE = {
  Timer: "timer",
  Overview: "overview",
  Times: "times",
  Board: "leaderboard",
  About: "about",
};

export const PAGE_TITLES = {
  timer: "Timer",
  overview: "Overview",
  times: "Times",
  leaderboard: "Board",
  about: "About",
};

export const TAB_ROUTE_SEGMENTS = new Set(Object.values(PAGE_ROUTE_SEGMENTS));

export const STORAGE_KEY = "rotmg-dungeon-runs";
export const IGN_STORAGE_KEY = "rotmg-timer-ign";
export const SHARED_RUN_IDS_KEY = "rotmg-timer-shared-run-ids";
export const RUNS_API = "/api/runs";

export const EXALT_CATEGORY = "exalt";

export const DUPLICATE_WINDOW_MS = 120_000;
export const OVERLAP_TOLERANCE_MS = 3_000;
export const GLOBAL_MIN_SECONDS = 3;

export const OUTCOMES = {
  complete: { label: "Complete", short: "✓" },
  nexus: { label: "Nexus", short: "Nexus" },
  died: { label: "Died", short: "Died" },
};

export const OUTCOME_IDS = Object.freeze(Object.keys(OUTCOMES));

export const RUN_SOURCES = {
  party: { label: "Party", title: "Organised run — portal ready" },
  organic: { label: "Organic", title: "Realm / nexus search" },
};

export const RUN_SOURCE_IDS = Object.freeze(Object.keys(RUN_SOURCES));

export const POST_END_ACTION_KINDS = {
  next: "next",
  done: "done",
  discard: "discard",
};

export const POST_END_ACTION_KIND_IDS = Object.freeze(Object.keys(POST_END_ACTION_KINDS));

/**
 * After End — optional follow-ups.
 * LH: cult path (no Colossus) vs boss clear; boss clear can chain to Void.
 * Fungal → Crystal always.
 */
export const POST_END_PROMPTS = {
  "lost-halls": {
    hint: "Which path? Time is saved — pick below.",
    deferSave: true,
    actions: [
      {
        label: "→ Cult (no boss)",
        kind: POST_END_ACTION_KINDS.next,
        nextId: "cultist-hideout",
        runName: "Lost Halls (to Cult)",
        primary: true,
      },
      {
        label: "Colossus → Void",
        kind: POST_END_ACTION_KINDS.next,
        nextId: "the-void",
        runName: "Lost Halls",
        primary: true,
      },
      { label: "Colossus clear", kind: POST_END_ACTION_KINDS.done, runName: "Lost Halls" },
      { label: "Discard", kind: POST_END_ACTION_KINDS.discard },
    ],
  },
  "fungal-cavern": {
    actions: [
      {
        label: "→ Crystal Cavern",
        kind: POST_END_ACTION_KINDS.next,
        nextId: "crystal-cavern",
        primary: true,
      },
      { label: "Done", kind: POST_END_ACTION_KINDS.done },
    ],
  },
};

export const LEGACY_NAME_TO_ID = {
  "Lost Halls complex": "lost-halls",
  "Lost Halls (to Cult)": "lost-halls",
  "Kogbold Steamworks": "kogbold-steamworks",
  "Moonlight Village": "moonlight-village",
  Shatters: "the-shatters",
  "The Shatters": "the-shatters",
};

export const CATEGORY_TAB_LABELS = {
  exalt: "Exalt",
  realm: "Realm",
  advanced: "Advanced",
  oryx: "Oryx",
  wormhole: "Wormholes",
  "wormhole-adv": "Adv. WH",
  special: "Special",
  heroic: "Heroic",
  other: "Other",
};

export const CATEGORY_IDS = Object.freeze(Object.keys(CATEGORY_TAB_LABELS));

export const FIND_PRESETS_MIN = [3, 5, 10, 15];
export const DEFAULT_PLAYER_MAX = 50;

/** Spawn from another dungeon — no search-time field (Void, Crystal). */
export const CHAIN_SPAWN_DUNGEONS = new Set(["the-void", "crystal-cavern"]);

/** Dungeons that offer a hard-mode checkbox after End. */
export const HARD_MODE_DUNGEONS = new Set(["the-shatters", "spectral-penitentiary"]);
