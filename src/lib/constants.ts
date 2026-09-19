import type { PostEndPromptConfig } from "./types";

export const APP_VERSION = "3.1.0";
export const REPO_URL = "https://github.com/AndreNeubauer/rotmg-dungeon-timer";
export const LIVE_URL = "https://andreneubauer.github.io/rotmg-dungeon-timer/";

export const PAGE_ROUTES = {
  timer: "timer",
  overview: "overview",
  times: "times",
  leaderboard: "leaderboard",
  about: "about",
} as const;

export const PAGE_TITLES = {
  timer: "Timer",
  overview: "Overview",
  times: "Times",
  leaderboard: "Leaderboard",
  about: "About",
} as const;

export const STORAGE_KEY = "rotmg-dungeon-runs";
export const IGN_STORAGE_KEY = "rotmg-timer-ign";
export const SHARED_RUN_IDS_KEY = "rotmg-timer-shared-run-ids";
export const PENDING_RUNS_KEY = "rotmg-timer-pending-runs";
export const THEME_STORAGE_KEY = "rotmg-timer-theme";

export const EXALT_CATEGORY = "exalt";
export const DEFAULT_PLAYER_MAX = 50;

export const OUTCOMES = {
  complete: { label: "Complete", short: "✓" },
  nexus: { label: "Nexus", short: "Nexus" },
  died: { label: "Died", short: "Died" },
} as const;

export const RUN_SOURCES = {
  party: { label: "Party", title: "Organised run — portal ready" },
  organic: { label: "Organic", title: "Realm / nexus search" },
} as const;

export const CATEGORY_TAB_LABELS: Record<string, string> = {
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

export const LEGACY_NAME_TO_ID: Record<string, string> = {
  "Lost Halls complex": "lost-halls",
  "Lost Halls (to Cult)": "lost-halls",
  "Kogbold Steamworks": "kogbold-steamworks",
  "Moonlight Village": "moonlight-village",
  Shatters: "the-shatters",
  "The Shatters": "the-shatters",
};

export const POST_END_PROMPTS: Record<string, PostEndPromptConfig> = {
  "lost-halls": {
    hint: "Which path? Or pick another dungeon above and Start.",
    deferSave: true,
    actions: [
      {
        label: "→ Cult (no boss)",
        kind: "next",
        nextId: "cultist-hideout",
        runName: "Lost Halls (to Cult)",
        primary: true,
      },
      {
        label: "Colossus → Void",
        kind: "next",
        nextId: "the-void",
        runName: "Lost Halls",
        primary: true,
      },
      { label: "Colossus clear", kind: "done", runName: "Lost Halls" },
      { label: "Discard", kind: "discard" },
    ],
  },
  "fungal-cavern": {
    actions: [
      {
        label: "→ Crystal Cavern",
        kind: "next",
        nextId: "crystal-cavern",
        primary: true,
      },
      { label: "Done", kind: "done" },
    ],
  },
};

export const CHAIN_SPAWN_DUNGEONS = new Set(["the-void", "crystal-cavern"]);
export const HARD_MODE_DUNGEONS = new Set(["the-shatters", "spectral-penitentiary"]);
export const FIND_PRESETS_MIN = [3, 5, 10, 15];
