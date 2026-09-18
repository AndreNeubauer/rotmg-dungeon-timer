const STORAGE_KEY = "rotmg-dungeon-runs";
const RUNS_API = "/api/runs";
const EXALT_CATEGORY = "exalt";
const DUPLICATE_WINDOW_MS = 120_000;
const OVERLAP_TOLERANCE_MS = 3_000;
const GLOBAL_MIN_SECONDS = 3;

/**
 * After End — optional follow-ups.
 * LH: cult path (no Colossus) vs boss clear; boss clear can chain to Void.
 * Fungal → Crystal always.
 */
const POST_END_PROMPTS = {
  "lost-halls": {
    hint: "Which path? Time is saved — pick below.",
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
      { label: "→ Crystal Cavern", kind: "next", nextId: "crystal-cavern", primary: true },
      { label: "Done", kind: "done" },
    ],
  },
};

const LEGACY_NAME_TO_ID = {
  "Lost Halls complex": "lost-halls",
  "Lost Halls (to Cult)": "lost-halls",
  "Kogbold Steamworks": "kogbold-steamworks",
  "Moonlight Village": "moonlight-village",
  Shatters: "the-shatters",
  "The Shatters": "the-shatters",
};

const categoryTabs = document.getElementById("category-tabs");
const dungeonGrid = document.getElementById("dungeon-grid");
const searchInput = document.getElementById("dungeon-search");

const CATEGORY_TAB_LABELS = {
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
const dungeonIcon = document.getElementById("dungeon-icon");
const dungeonName = document.getElementById("dungeon-name");
const dungeonMeta = document.getElementById("dungeon-meta");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start-btn");
const endBtn = document.getElementById("end-btn");
const nexusBtn = document.getElementById("nexus-btn");
const diedBtn = document.getElementById("died-btn");
const runsBody = document.getElementById("runs-body");
const statsSummary = document.getElementById("stats-summary");
const averagesList = document.getElementById("averages-list");
const timesDungeonFilter = document.getElementById("times-dungeon-filter");

const OUTCOMES = {
  complete: { label: "Complete", short: "✓" },
  nexus: { label: "Nexus", short: "Nexus" },
  died: { label: "Died", short: "Died" },
};
const pageTimer = document.getElementById("page-timer");
const pageTimes = document.getElementById("page-times");
const tabs = document.querySelectorAll(".tab");
const postEndPrompt = document.getElementById("post-end-prompt");
const postEndLabel = document.getElementById("post-end-label");
const postEndActions = document.getElementById("post-end-actions");
const timerBlock = document.querySelector(".timer-block");

let catalog = { iconBase: "", fallbackIcon: "Dungeon Portal.png", categories: [], dungeons: [] };
let dungeonById = new Map();
let startTime = null;
let tickInterval = null;
let selectedDungeonId = "lost-halls";
let selectedCategoryId = EXALT_CATEGORY;
/** Run waiting for LH branch choice before save. */
let pendingEndRun = null;
/** Run id waiting for optional party/organic + find-time entry. */
let pendingFindRunId = null;
let findTimeAfterDone = null;
let selectedRunType = null;

const RUN_SOURCES = {
  party: { label: "Party", title: "Organised run — portal ready" },
  organic: { label: "Organic", title: "Realm / nexus search" },
};
/** Run id saved on End before chain prompt (e.g. Fungal). */
let savedRunIdForPrompt = null;

const FIND_PRESETS_MIN = [3, 5, 10, 15];
const DEFAULT_PLAYER_MAX = 50;
/** Spawn from another dungeon — no search-time field (Void, Crystal). */
const CHAIN_SPAWN_DUNGEONS = new Set(["the-void", "crystal-cavern"]);
/** Dungeons that offer a hard-mode checkbox after End. */
const HARD_MODE_DUNGEONS = new Set(["the-shatters", "spectral-penitentiary"]);
/** True when this run started via LH/Fungal chain (→ Cult, → Void, → Crystal). */
let currentRunChained = false;
/** In-memory run list — source of truth while the app is open. */
let runsCache = [];
/** When true, reads/writes go to runs.json via serve.py. */
let fileStorageReady = false;

function formatDuration(seconds) {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function iconUrlCdn(dungeon) {
  const file = dungeon?.icon || catalog.fallbackIcon;
  return `${catalog.iconBase}${encodeURIComponent(file)}`;
}

function setDungeonIcon(img, dungeon) {
  if (!dungeon) {
    img.removeAttribute("src");
    return;
  }
  const fallback = iconUrlCdn({ icon: catalog.fallbackIcon });
  const useCdn = () => {
    img.onerror = () => {
      img.onerror = null;
      img.src = fallback;
    };
    img.src = dungeon.icon ? iconUrlCdn(dungeon) : fallback;
  };
  img.onerror = useCdn;
  img.src = `icons/${dungeon.id}.png`;
}

function getDungeon(idOrName) {
  if (dungeonById.has(idOrName)) return dungeonById.get(idOrName);
  const legacyId = LEGACY_NAME_TO_ID[idOrName];
  if (legacyId && dungeonById.has(legacyId)) return dungeonById.get(legacyId);
  for (const d of catalog.dungeons) {
    if (d.name === idOrName) return d;
  }
  return null;
}

function normalizeRun(run) {
  const id = run.dungeonId || LEGACY_NAME_TO_ID[run.dungeon] || run.dungeon;
  const dungeon = getDungeon(id);
  const outcome = run.outcome && OUTCOMES[run.outcome] ? run.outcome : "complete";
  const findTimeSeconds =
    run.findTimeSeconds != null && Number.isFinite(run.findTimeSeconds) ? run.findTimeSeconds : null;
  const runType = run.runType && RUN_SOURCES[run.runType] ? run.runType : null;
  const groupSize =
    run.groupSize != null && Number.isFinite(run.groupSize) && run.groupSize >= 1
      ? Math.round(run.groupSize)
      : null;
  return {
    ...run,
    id: run.id || crypto.randomUUID(),
    dungeonId: dungeon?.id || id,
    dungeonName: dungeon?.name || run.dungeonName || run.dungeon || id,
    outcome,
    findTimeSeconds,
    runType,
    groupSize,
    hardMode: run.hardMode === true ? true : null,
  };
}

function loadRunsFromLocalStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeRun);
  } catch {
    return [];
  }
}

function loadRuns() {
  return runsCache;
}

async function fetchRunsFromFile() {
  const res = await fetch(RUNS_API, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load runs (${res.status})`);
  const raw = await res.json();
  if (!Array.isArray(raw)) throw new Error("runs.json must be a JSON array");
  return raw.map(normalizeRun);
}

async function writeRunsToFile(runs) {
  const res = await fetch(RUNS_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(runs),
  });
  if (!res.ok) throw new Error(`Failed to save runs (${res.status})`);
}

async function initRunsStorage() {
  try {
    let runs = await fetchRunsFromFile();
    fileStorageReady = true;
    const local = loadRunsFromLocalStorage();
    if (runs.length === 0 && local.length > 0) {
      runs = local;
      await writeRunsToFile(runs);
      localStorage.removeItem(STORAGE_KEY);
    }
    const needsId = runs.some((run) => !run.id);
    runsCache = runs.map(normalizeRun);
    if (needsId) await persistRuns(runsCache);
    return;
  } catch (_) {
    fileStorageReady = false;
  }

  runsCache = loadRunsFromLocalStorage();
  const needsId = runsCache.some((run) => !run.id);
  if (needsId) persistRuns(runsCache);
}

async function persistRuns(runs) {
  runsCache = runs.map(normalizeRun);
  if (fileStorageReady) {
    try {
      await writeRunsToFile(runsCache);
      return;
    } catch (err) {
      console.error(err);
      fileStorageReady = false;
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runsCache));
}

function saveRuns(runs) {
  void persistRuns(runs);
}

function deleteRun(runId) {
  saveRuns(loadRuns().filter((r) => r.id !== runId));
}

function runStartMs(run) {
  return new Date(run.startedAt).getTime();
}

function runEndMs(run) {
  return runStartMs(run) + run.durationSeconds * 1000;
}

function validateRun(run, existingRuns) {
  const duration = run.durationSeconds;
  if (!Number.isFinite(duration) || duration < GLOBAL_MIN_SECONDS) {
    return `Too short (${formatDuration(Math.max(0, duration))}) — not saved`;
  }

  const startMs = runStartMs(run);
  for (const other of existingRuns) {
    if (startMs + OVERLAP_TOLERANCE_MS < runEndMs(other) - OVERLAP_TOLERANCE_MS) {
      return `Time travel — overlaps ${other.dungeonName} (${formatDuration(other.durationSeconds)}) — not saved`;
    }
    if (
      other.dungeonId === run.dungeonId &&
      Math.round(other.durationSeconds) === Math.round(duration) &&
      Math.abs(startMs - runStartMs(other)) <= DUPLICATE_WINDOW_MS
    ) {
      return `Duplicate ${run.dungeonName} (${formatDuration(duration)}) — not saved`;
    }
  }

  return null;
}

function showRunRejected(message) {
  statusEl.textContent = message;
  statusEl.classList.remove("running", "saved");
  statusEl.classList.add("rejected");
}

function commitRun({ dungeonId, dungeonName, startedAt, durationSeconds, outcome = "complete" }) {
  const run = {
    id: crypto.randomUUID(),
    dungeonId,
    dungeonName,
    startedAt,
    durationSeconds,
    outcome,
    findTimeSeconds: null,
    runType: null,
    groupSize: null,
    hardMode: null,
  };
  const rejection = validateRun(run, loadRuns());
  if (rejection) {
    showRunRejected(rejection);
    return null;
  }

  statusEl.classList.remove("rejected");
  const runs = loadRuns();
  runs.push(run);
  saveRuns(runs);
  return run.id;
}

function setRunMeta(runId, { runType, findTimeSeconds, groupSize, hardMode } = {}) {
  saveRuns(
    loadRuns().map((run) => {
      if (run.id !== runId) return run;
      const next = { ...run };
      if (runType !== undefined) {
        next.runType = runType && RUN_SOURCES[runType] ? runType : null;
      }
      if (findTimeSeconds !== undefined) {
        next.findTimeSeconds =
          findTimeSeconds != null && findTimeSeconds > 0 ? Math.round(findTimeSeconds) : null;
      }
      if (groupSize !== undefined) {
        next.groupSize = groupSize != null && groupSize >= 1 ? Math.round(groupSize) : null;
      }
      if (hardMode !== undefined) {
        next.hardMode = hardMode === true ? true : null;
      }
      return next;
    })
  );
}

function updateRun(runId, patch) {
  saveRuns(loadRuns().map((run) => (run.id === runId ? { ...run, ...patch } : run)));
}

function getDungeonPlayerMax(dungeon) {
  const max = dungeon?.playerMax;
  return Number.isFinite(max) && max >= 1 ? Math.round(max) : DEFAULT_PLAYER_MAX;
}

function getRunPlayerMax(runId) {
  const run = loadRuns().find((entry) => entry.id === runId);
  return run ? getDungeonPlayerMax(getDungeon(run.dungeonId)) : DEFAULT_PLAYER_MAX;
}

function parseGroupSizeInput(raw, maxPlayers) {
  const text = raw.trim();
  if (!text) return null;
  const size = Math.round(Number(text));
  if (!Number.isFinite(size) || size < 1 || size > maxPlayers) return null;
  return size;
}

function parseFindTimeInput(raw) {
  const text = raw.trim();
  if (!text) return null;
  if (text.includes(":")) {
    const [mins, secs] = text.split(":").map((part) => Number(part));
    if (Number.isFinite(mins) && Number.isFinite(secs) && mins >= 0 && secs >= 0) {
      return mins * 60 + secs;
    }
    return null;
  }
  const minutes = Number(text);
  if (Number.isFinite(minutes) && minutes > 0) return Math.round(minutes * 60);
  return null;
}

function emptyOutcomeCounts() {
  return { complete: 0, nexus: 0, died: 0, total: 0 };
}

function addOutcome(counts, outcome) {
  counts[outcome] += 1;
  counts.total += 1;
}

function successRate(counts) {
  if (counts.total === 0) return null;
  return Math.round((counts.complete / counts.total) * 100);
}

function emptyTiming() {
  return { attemptDuration: 0, clearDuration: 0, clearCount: 0, findDuration: 0, findCount: 0 };
}

function emptySourceBuckets() {
  return { party: emptyTiming(), organic: emptyTiming() };
}

function addRunToSourceBucket(bucket, run) {
  bucket.attemptDuration += run.durationSeconds;
  if (run.outcome === "complete") {
    bucket.clearDuration += run.durationSeconds;
    bucket.clearCount += 1;
  }
  if (run.findTimeSeconds != null && run.findTimeSeconds > 0) {
    bucket.findDuration += run.findTimeSeconds;
    bucket.findCount += 1;
  }
}

function getTimesFilterId() {
  return timesDungeonFilter?.value || "";
}

function getFilteredTimesRuns() {
  const filterId = getTimesFilterId();
  const runs = loadRuns();
  if (!filterId) return runs;
  return runs.filter((run) => run.dungeonId === filterId);
}

function computeStats(runs = loadRuns()) {
  const overall = { ...emptyOutcomeCounts(), ...emptyTiming(), bySource: emptySourceBuckets() };
  const byDungeon = new Map();

  for (const run of runs) {
    addOutcome(overall, run.outcome);
    overall.attemptDuration += run.durationSeconds;
    if (run.outcome === "complete") {
      overall.clearDuration += run.durationSeconds;
      overall.clearCount += 1;
    }

    if (!byDungeon.has(run.dungeonId)) {
      byDungeon.set(run.dungeonId, {
        ...emptyOutcomeCounts(),
        ...emptyTiming(),
        bySource: emptySourceBuckets(),
        name: run.dungeonName,
        id: run.dungeonId,
      });
    }
    const entry = byDungeon.get(run.dungeonId);
    addOutcome(entry, run.outcome);
    entry.attemptDuration += run.durationSeconds;
    if (run.outcome === "complete") {
      entry.clearDuration += run.durationSeconds;
      entry.clearCount += 1;
    }
    if (run.findTimeSeconds != null && run.findTimeSeconds > 0) {
      overall.findDuration += run.findTimeSeconds;
      overall.findCount += 1;
      entry.findDuration += run.findTimeSeconds;
      entry.findCount += 1;
    }
    if (run.runType === "party" || run.runType === "organic") {
      addRunToSourceBucket(overall.bySource[run.runType], run);
      addRunToSourceBucket(entry.bySource[run.runType], run);
    }
  }

  return { overall, byDungeon };
}

function avgDuration(total, count) {
  return count > 0 ? total / count : null;
}

function getDungeonSummaries(runs = loadRuns()) {
  const { byDungeon } = computeStats(runs);
  return [...byDungeon.values()]
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      dungeon: getDungeon(entry.id),
      stats: {
        complete: entry.complete,
        nexus: entry.nexus,
        died: entry.died,
        total: entry.total,
      },
      avgClear: avgDuration(entry.clearDuration, entry.clearCount),
      avgAttempt: avgDuration(entry.attemptDuration, entry.total),
      avgFind: avgDuration(entry.findDuration, entry.findCount),
      findCount: entry.findCount,
      clearCount: entry.clearCount,
      bySource: entry.bySource,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function formatTimePair(avgClear, avgAttempt) {
  const clear = avgClear != null ? formatDuration(avgClear) : "—";
  const attempt = avgAttempt != null ? formatDuration(avgAttempt) : "—";
  return `<span class="time-clear" title="Average clear">${clear}</span><span class="time-sep"> · </span><span class="time-attempt" title="Average attempt">${attempt}</span>`;
}

function formatGroupClearStats(runs) {
  const bySize = new Map();
  for (const run of runs) {
    if (run.outcome !== "complete" || run.groupSize == null) continue;
    if (!bySize.has(run.groupSize)) {
      bySize.set(run.groupSize, { total: 0, count: 0 });
    }
    const entry = bySize.get(run.groupSize);
    entry.total += run.durationSeconds;
    entry.count += 1;
  }
  if (bySize.size === 0) return "";
  const parts = [...bySize.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([size, { total, count }]) => `${size}p ${formatDuration(total / count)} clear (${count}×)`);
  return `<span class="source-compare">By group: ${parts.join(" · ")}</span>`;
}

function formatSourceCompare(bySource) {
  const partyClear = avgDuration(bySource.party.clearDuration, bySource.party.clearCount);
  const organicClear = avgDuration(bySource.organic.clearDuration, bySource.organic.clearCount);
  const partyFind = avgDuration(bySource.party.findDuration, bySource.party.findCount);
  const organicFind = avgDuration(bySource.organic.findDuration, bySource.organic.findCount);

  const lines = [];
  if (partyClear != null || organicClear != null) {
    const party = partyClear != null ? formatDuration(partyClear) : "—";
    const organic = organicClear != null ? formatDuration(organicClear) : "—";
    lines.push(`<span class="source-compare">Clear: Party ${party} · Organic ${organic}</span>`);
  }
  if (partyFind != null || organicFind != null) {
    const party = partyFind != null ? `+${formatDuration(partyFind)}` : "—";
    const organic = organicFind != null ? `+${formatDuration(organicFind)}` : "—";
    lines.push(`<span class="source-compare">Search: Party ${party} · Organic ${organic}</span>`);
  }
  return lines.join("");
}

function selectedDungeon() {
  return getDungeon(selectedDungeonId);
}

function isRunning() {
  return startTime !== null;
}

function dungeonInCategory(dungeon, categoryId) {
  if (dungeon.category === categoryId) return true;
  return Array.isArray(dungeon.alsoIn) && dungeon.alsoIn.includes(categoryId);
}

function ensureCategoryForDungeon(dungeonId) {
  const dungeon = getDungeon(dungeonId);
  if (!dungeon) return;
  if (dungeonInCategory(dungeon, selectedCategoryId)) return;
  selectedCategoryId = dungeon.category;
}

function getDungeonsForCategory(categoryId, filter = "") {
  const q = filter.trim().toLowerCase();
  return catalog.dungeons.filter((dungeon) => {
    if (!dungeonInCategory(dungeon, categoryId)) return false;
    if (!q) return true;
    const haystack = `${dungeon.name} ${dungeon.shortName || ""}`.toLowerCase();
    return haystack.includes(q);
  });
}

function selectDungeon(id, { fromPrompt = false } = {}) {
  if (isRunning()) return;
  if (pendingFindRunId) dismissFindTimePrompt();
  if (!fromPrompt) {
    hideChainPrompt();
    readyForNextRun();
  }
  selectedDungeonId = id;
  ensureCategoryForDungeon(id);
  renderDungeonPicker();
  updateSelectedDisplay();
}

function hideChainPrompt() {
  pendingEndRun = null;
  savedRunIdForPrompt = null;
  postEndPrompt.classList.add("hidden");
  postEndActions.innerHTML = "";
}

function dismissFindTimePrompt() {
  pendingFindRunId = null;
  findTimeAfterDone = null;
  selectedRunType = null;
  postEndPrompt.classList.add("hidden");
  postEndActions.innerHTML = "";
  refreshIdleControls();
}

function hidePostEndPrompt() {
  hideChainPrompt();
  dismissFindTimePrompt();
}

function readyForNextRun() {
  timerEl.textContent = "—";
  statusEl.textContent = "";
  statusEl.classList.remove("running", "saved");
}

function refreshIdleControls() {
  startBtn.disabled = startTime != null;
  renderDungeonPicker();
}

function shouldOfferSearchTime(runId, { chained = false } = {}) {
  if (!runId || chained) return false;
  const run = loadRuns().find((entry) => entry.id === runId);
  return Boolean(run && !CHAIN_SPAWN_DUNGEONS.has(run.dungeonId));
}

function finishRunContext({ findTimeSeconds = null, groupSize = null, hardMode = null } = {}) {
  const after = findTimeAfterDone;
  const runId = pendingFindRunId;
  pendingFindRunId = null;
  findTimeAfterDone = null;
  const runType = selectedRunType;
  selectedRunType = null;
  savedRunIdForPrompt = null;
  postEndPrompt.classList.add("hidden");
  postEndActions.innerHTML = "";

  if (runId) {
    setRunMeta(runId, {
      runType,
      findTimeSeconds: findTimeSeconds != null && findTimeSeconds > 0 ? findTimeSeconds : null,
      groupSize,
      hardMode,
    });
  }
  after?.();
}

function createRunTypeToggles(onChange) {
  const row = document.createElement("div");
  row.className = "toggle-row";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Run type");

  for (const [key, { label, title }] of Object.entries(RUN_SOURCES)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toggle-check";
    btn.textContent = label;
    btn.title = title;
    btn.dataset.runType = key;
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      selectedRunType = selectedRunType === key ? null : key;
      for (const toggle of row.querySelectorAll(".toggle-check")) {
        const active = toggle.dataset.runType === selectedRunType;
        toggle.classList.toggle("selected", active);
        toggle.setAttribute("aria-pressed", active ? "true" : "false");
      }
      onChange?.(selectedRunType);
    });
    row.appendChild(btn);
  }
  return row;
}

function readRunContextInputs(groupInput, searchInput, playerMax, hardModeInput = null) {
  return {
    groupSize: groupInput ? parseGroupSizeInput(groupInput.value, playerMax) : null,
    findTimeSeconds: searchInput ? parseFindTimeInput(searchInput.value) : null,
    hardMode: hardModeInput?.checked === true ? true : null,
  };
}

function offerRunContext(runId, afterDone, { showSearchTime = true } = {}) {
  pendingFindRunId = runId;
  findTimeAfterDone = afterDone;
  selectedRunType = null;
  const run = loadRuns().find((entry) => entry.id === runId);
  const showHardMode = Boolean(run && HARD_MODE_DUNGEONS.has(run.dungeonId));
  const playerMax = getRunPlayerMax(runId);
  const chainNote = showSearchTime
    ? "Skip, pick another dungeon, or press Start anytime."
    : "Chain spawn — no search time.";
  postEndLabel.innerHTML = `Run details <span class="find-optional">(optional)</span><span class="find-sub">${chainNote}</span>`;
  postEndActions.innerHTML = "";

  const typeLabel = document.createElement("p");
  typeLabel.className = "find-section-label";
  typeLabel.textContent = "Party or organic";
  postEndActions.appendChild(typeLabel);
  postEndActions.appendChild(createRunTypeToggles());

  const groupLabel = document.createElement("p");
  groupLabel.className = "find-section-label";
  groupLabel.textContent = `Group size (1–${playerMax} players)`;
  postEndActions.appendChild(groupLabel);

  const groupRow = document.createElement("div");
  groupRow.className = "find-custom-row";
  const groupInput = document.createElement("input");
  groupInput.type = "text";
  groupInput.className = "find-input";
  groupInput.placeholder = `e.g. 6 · max ${playerMax}`;
  groupInput.inputMode = "numeric";
  groupInput.autocomplete = "off";
  groupRow.appendChild(groupInput);
  postEndActions.appendChild(groupRow);

  let hardModeInput = null;
  if (showHardMode) {
    const hardLabel = document.createElement("p");
    hardLabel.className = "find-section-label";
    hardLabel.textContent = "Difficulty";
    postEndActions.appendChild(hardLabel);

    const hardRow = document.createElement("label");
    hardRow.className = "hard-mode-row";
    hardModeInput = document.createElement("input");
    hardModeInput.type = "checkbox";
    hardModeInput.className = "hard-mode-check";
    const hardText = document.createElement("span");
    hardText.textContent = "Hard mode";
    hardRow.append(hardModeInput, hardText);
    postEndActions.appendChild(hardRow);
  }

  let searchInput = null;
  if (showSearchTime) {
    const searchLabel = document.createElement("p");
    searchLabel.className = "find-section-label";
    searchLabel.textContent = "Search time (realm → portal)";
    postEndActions.appendChild(searchLabel);

    const presetRow = document.createElement("div");
    presetRow.className = "find-preset-row";
    for (const minutes of FIND_PRESETS_MIN) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "post-end-action secondary find-preset toggle-check";
      btn.textContent = `${minutes}m`;
      btn.addEventListener("click", () =>
        finishRunContext({
          ...readRunContextInputs(groupInput, searchInput, playerMax, hardModeInput),
          findTimeSeconds: minutes * 60,
        })
      );
      presetRow.appendChild(btn);
    }
    postEndActions.appendChild(presetRow);

    const customRow = document.createElement("div");
    customRow.className = "find-custom-row";
    searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "find-input";
    searchInput.placeholder = "min or m:ss";
    searchInput.inputMode = "decimal";
    searchInput.autocomplete = "off";
    customRow.appendChild(searchInput);
    postEndActions.appendChild(customRow);
  }

  const actionRow = document.createElement("div");
  actionRow.className = "find-action-row";
  const skipBtn = document.createElement("button");
  skipBtn.type = "button";
  skipBtn.className = "post-end-action secondary";
  skipBtn.textContent = "Skip";
  skipBtn.addEventListener("click", () => finishRunContext());
  const doneBtn = document.createElement("button");
  doneBtn.type = "button";
  doneBtn.className = "post-end-action primary";
  doneBtn.textContent = "Done";
  doneBtn.addEventListener("click", () => {
    finishRunContext(readRunContextInputs(groupInput, searchInput, playerMax, hardModeInput));
  });
  groupInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") doneBtn.click();
  });
  if (searchInput) {
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") doneBtn.click();
    });
  }
  actionRow.append(skipBtn, doneBtn);
  postEndActions.appendChild(actionRow);

  postEndPrompt.classList.remove("hidden");
  timerBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function finishRunFlow(runId, { afterDone = readyForNextRun } = {}) {
  const chained = currentRunChained;
  currentRunChained = false;
  if (!runId) {
    afterDone?.();
    return;
  }
  offerRunContext(runId, afterDone, { showSearchTime: shouldOfferSearchTime(runId, { chained }) });
}

function resetToStartPage() {
  hidePostEndPrompt();
  timerEl.textContent = "—";
  statusEl.textContent = "";
  statusEl.classList.remove("running", "saved");
  showPage("timer");
  window.scrollTo({ top: 0, behavior: "smooth" });
  dungeonGrid.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showSavedDuration(durationSeconds) {
  timerEl.textContent = formatDuration(durationSeconds);
  statusEl.textContent = formatDuration(durationSeconds);
  statusEl.classList.add("saved");
}

function renderPostEndPrompt(config, durationSeconds, { saved = true } = {}) {
  const hint = config.hint ? `${config.hint} ` : "";
  const lead = saved
    ? `Saved ${formatDuration(durationSeconds)}`
    : `${formatDuration(durationSeconds)} — choose:`;
  postEndLabel.textContent = hint ? `${lead} · ${hint}`.trim() : lead;
  postEndActions.innerHTML = "";

  for (const action of config.actions) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `post-end-action ${action.primary ? "primary" : "secondary"}`;
    btn.textContent = action.label;
    btn.addEventListener("click", () => handlePostEndAction(action));
    postEndActions.appendChild(btn);
  }

  postEndPrompt.classList.remove("hidden");
  timerBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showPostEndPrompt(dungeonId, durationSeconds) {
  const config = POST_END_PROMPTS[dungeonId];
  if (!config) {
    resetToStartPage();
    return;
  }

  renderPostEndPrompt(config, durationSeconds, { saved: true });
}

function handlePostEndAction(action) {
  let runId = savedRunIdForPrompt;

  if (pendingEndRun) {
    runId = pendingEndRun.runId;
    if (action.kind === "discard") {
      deleteRun(runId);
      pendingEndRun = null;
      hidePostEndPrompt();
      resetToStartPage();
      return;
    }
    if (action.runName) {
      updateRun(runId, { dungeonName: action.runName });
    }
    pendingEndRun = null;
  }

  if (action.kind === "discard") {
    hidePostEndPrompt();
    resetToStartPage();
    return;
  }

  if (action.kind === "next" && action.nextId) {
    hideChainPrompt();
    selectDungeon(action.nextId, { fromPrompt: true });
    onStart({ chained: true });
    return;
  }

  postEndPrompt.classList.add("hidden");
  postEndActions.innerHTML = "";
  savedRunIdForPrompt = null;
  finishRunFlow(runId);
}

function createDungeonCard(dungeon, { compact = false } = {}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `dungeon-card${compact ? " compact" : ""}${dungeon.id === selectedDungeonId ? " selected" : ""}`;
  btn.dataset.id = dungeon.id;
  btn.disabled = isRunning() && dungeon.id !== selectedDungeonId;

  const img = document.createElement("img");
  img.alt = "";
  setDungeonIcon(img, dungeon);

  const label = document.createElement("span");
  label.className = "dungeon-card-name";
  label.textContent = dungeon.shortName || dungeon.name;
  if (dungeon.shortName) label.title = dungeon.name;

  btn.append(img, label);
  btn.addEventListener("click", () => selectDungeon(dungeon.id));
  return btn;
}

function renderCategoryTabs() {
  if (!categoryTabs) return;
  let buttons = categoryTabs.querySelectorAll(".category-tab");

  if (buttons.length === 0 && catalog.categories?.length) {
    categoryTabs.innerHTML = "";
    for (const category of catalog.categories) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-tab";
      btn.dataset.category = category.id;
      btn.textContent = CATEGORY_TAB_LABELS[category.id] || category.label;
      categoryTabs.appendChild(btn);
    }
    buttons = categoryTabs.querySelectorAll(".category-tab");
  }

  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === selectedCategoryId);
    btn.disabled = isRunning();
  });
}

function renderDungeonGrid() {
  if (!dungeonGrid) return;
  const matches = getDungeonsForCategory(selectedCategoryId, searchInput.value);
  dungeonGrid.innerHTML = "";

  if (matches.length === 0) {
    dungeonGrid.innerHTML = `<p class="empty">No dungeons match.</p>`;
    return;
  }

  for (const dungeon of matches) {
    dungeonGrid.appendChild(createDungeonCard(dungeon));
  }
}

function renderDungeonPicker() {
  renderCategoryTabs();
  renderDungeonGrid();
}

function updateSelectedDisplay() {
  const dungeon = selectedDungeon();
  if (!dungeon) {
    dungeonName.textContent = "—";
    return;
  }
  setDungeonIcon(dungeonIcon, dungeon);
  dungeonName.textContent = dungeon.name;
  if (!isRunning() && !pendingFindRunId && !pendingEndRun) {
    statusEl.textContent = "";
  }
}

function renderStatsSummary() {
  const filterId = getTimesFilterId();
  const runs = getFilteredTimesRuns();
  const { overall } = computeStats(runs);
  statsSummary.innerHTML = "";

  if (overall.total === 0) {
    statsSummary.innerHTML = `<p class="empty">${filterId ? "No attempts for this dungeon." : "No attempts yet."}</p>`;
    return;
  }

  const filterDungeon = filterId ? getDungeon(filterId) : null;
  const filterTitle = filterDungeon
    ? filterDungeon.shortName || filterDungeon.name
    : null;
  const rate = successRate(overall);
  const avgClear = avgDuration(overall.clearDuration, overall.clearCount);
  const avgAttempt = avgDuration(overall.attemptDuration, overall.total);
  const avgFind = avgDuration(overall.findDuration, overall.findCount);
  const findLine =
    avgFind != null
      ? `<div class="stats-find">+${formatDuration(avgFind)} avg search <span class="time-legend">(${overall.findCount} logged)</span></div>`
      : "";
  const sourceLine = formatSourceCompare(overall.bySource);
  const groupLine = formatGroupClearStats(runs);
  const card = document.createElement("div");
  card.className = "stats-card";
  card.innerHTML = `
    <div class="stats-rate">${rate}%</div>
    <div class="stats-body">
      ${filterTitle ? `<div class="stats-filter-name">${filterTitle}</div>` : ""}
      <div class="stats-detail">
        <span class="outcome-pill complete">${overall.complete} complete</span>
        <span class="outcome-pill nexus">${overall.nexus} nexus</span>
        <span class="outcome-pill died">${overall.died} died</span>
        <span class="stats-total">${overall.total} attempts</span>
      </div>
      <div class="stats-times">${formatTimePair(avgClear, avgAttempt)}<span class="time-legend">clear · avg</span></div>
      ${findLine}
      ${sourceLine ? `<div class="stats-source">${sourceLine}</div>` : ""}
      ${groupLine ? `<div class="stats-source">${groupLine}</div>` : ""}
    </div>
  `;
  statsSummary.appendChild(card);
}

function renderTimesFilter() {
  if (!timesDungeonFilter) return;
  const current = timesDungeonFilter.value;
  const byId = new Map();
  for (const run of loadRuns()) {
    if (!byId.has(run.dungeonId)) {
      const dungeon = getDungeon(run.dungeonId);
      byId.set(run.dungeonId, dungeon?.shortName || dungeon?.name || run.dungeonName);
    }
  }

  timesDungeonFilter.innerHTML = `<option value="">All dungeons</option>`;
  for (const [id, name] of [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]))) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = name;
    timesDungeonFilter.appendChild(option);
  }

  const valid = current === "" || byId.has(current);
  timesDungeonFilter.value = valid ? current : "";
}

function renderAverages() {
  const filterId = getTimesFilterId();
  if (filterId) {
    averagesList.innerHTML = "";
    averagesList.classList.add("hidden");
    return;
  }
  averagesList.classList.remove("hidden");

  const summaries = getDungeonSummaries();
  averagesList.innerHTML = "";

  if (summaries.length === 0) {
    averagesList.innerHTML = `<p class="empty">No attempts yet.</p>`;
    return;
  }

  const header = document.createElement("div");
  header.className = "averages-header";
  header.innerHTML = `
    <span>Dungeon</span>
    <span>Rate</span>
    <span class="averages-header-times">Clear · avg</span>
  `;
  averagesList.appendChild(header);

  for (const { name, avgClear, avgAttempt, avgFind, findCount, clearCount, dungeon, stats, bySource } of summaries) {
    const row = document.createElement("div");
    row.className = "average-row";
    const img = document.createElement("img");
    img.alt = "";
    if (dungeon) setDungeonIcon(img, dungeon);
    const nameCell = document.createElement("span");
    nameCell.className = "average-row-name";
    nameCell.append(img, name);

    const rate = successRate(stats);
    const statsCell = document.createElement("span");
    statsCell.className = "average-row-stats";
    statsCell.textContent =
      stats.total > clearCount ? `${rate}% · ${stats.complete}/${stats.total}` : `${stats.total}×`;

    const timeCell = document.createElement("span");
    timeCell.className = "average-row-times";
    timeCell.innerHTML = formatTimePair(avgClear, avgAttempt);
    if (findCount > 0 && avgFind != null) {
      timeCell.innerHTML += `<span class="avg-find" title="Average search time (logged runs only)"> +${formatDuration(avgFind)} search</span>`;
    }
    const sourceCompare = formatSourceCompare(bySource);
    if (sourceCompare) {
      timeCell.innerHTML += `<span class="avg-source">${sourceCompare}</span>`;
    }

    row.append(nameCell, statsCell, timeCell);
    averagesList.appendChild(row);
  }
}

function renderRunsTable() {
  const filterId = getTimesFilterId();
  const runs = getFilteredTimesRuns().slice().reverse();
  runsBody.innerHTML = "";

  if (runs.length === 0) {
    runsBody.innerHTML = `<tr><td colspan="5" class="empty">${filterId ? "No attempts for this dungeon." : "No attempts yet."}</td></tr>`;
    return;
  }

  for (const run of runs) {
    const dungeon = getDungeon(run.dungeonId);
    const row = document.createElement("tr");
    const when = new Date(run.startedAt).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const outcome = OUTCOMES[run.outcome];
    const sourcePill = run.runType
      ? `<span class="outcome-pill source-${run.runType}">${RUN_SOURCES[run.runType].label}</span>`
      : "";
    const groupPill =
      run.groupSize != null
        ? `<span class="outcome-pill group-size">${run.groupSize}p</span>`
        : "";
    const hardPill = run.hardMode
      ? `<span class="outcome-pill hard-mode">Hard</span>`
      : "";
    const findNote =
      run.findTimeSeconds != null && run.findTimeSeconds > 0
        ? `<span class="find-time">+${formatDuration(run.findTimeSeconds)} search</span>`
        : "";
    row.innerHTML = `
      <td class="when">${when}</td>
      <td class="dungeon-cell"><img class="table-icon" alt="" /><span>${run.dungeonName}</span></td>
      <td>${sourcePill}${groupPill}${hardPill}<span class="outcome-pill ${run.outcome}">${outcome.label}</span></td>
      <td class="time">${formatDuration(run.durationSeconds)}${findNote}</td>
      <td class="delete-cell"><button type="button" class="delete-btn" aria-label="Delete run">Delete</button></td>
    `;
    if (dungeon) setDungeonIcon(row.querySelector(".table-icon"), dungeon);
    row.querySelector(".delete-btn").addEventListener("click", () => {
      deleteRun(run.id);
      renderTimesPage();
    });
    runsBody.appendChild(row);
  }
}

function renderTimesPage() {
  renderTimesFilter();
  renderStatsSummary();
  renderAverages();
  renderRunsTable();
}

function setRunning(running) {
  timerBlock.classList.toggle("running", running);
  searchInput.disabled = running;
  for (const btn of postEndActions.querySelectorAll("button")) {
    btn.disabled = running;
  }
  if (running) hidePostEndPrompt();
  statusEl.classList.toggle("running", running);
  statusEl.classList.toggle("saved", false);
  renderDungeonPicker();
}

function tick() {
  if (!startTime) return;
  timerEl.textContent = formatDuration((Date.now() - startTime) / 1000);
}

function onStart({ chained = false } = {}) {
  if (startTime) return;
  if (pendingFindRunId) dismissFindTimePrompt();
  const dungeon = selectedDungeon();
  if (!dungeon) return;
  currentRunChained = chained;
  startTime = Date.now();
  setRunning(true);
  statusEl.textContent = "Running";
  timerEl.textContent = "0:00";
  tickInterval = setInterval(tick, 200);
}

function stopAttempt({ outcome, statusMessage }) {
  if (!startTime) return;
  const dungeon = selectedDungeon();
  if (!dungeon) return;

  const startedAt = new Date(startTime).toISOString();
  const durationSeconds = (Date.now() - startTime) / 1000;

  clearInterval(tickInterval);
  tickInterval = null;
  startTime = null;
  pendingEndRun = null;

  const runId = commitRun({
    dungeonId: dungeon.id,
    dungeonName: dungeon.name,
    startedAt,
    durationSeconds,
    outcome,
  });

  setRunning(false);
  timerEl.textContent = "—";
  if (!runId) return;
  statusEl.textContent = statusMessage;
  statusEl.classList.remove("running", "saved", "rejected");
  finishRunFlow(runId);
}

function onNexus() {
  stopAttempt({ outcome: "nexus", statusMessage: "Nexus — logged" });
}

function onDied() {
  stopAttempt({ outcome: "died", statusMessage: "Died — logged" });
}

function onEnd() {
  if (!startTime) return;
  const dungeon = selectedDungeon();
  if (!dungeon) return;
  const startedAt = new Date(startTime).toISOString();
  const durationSeconds = (Date.now() - startTime) / 1000;

  clearInterval(tickInterval);
  tickInterval = null;
  startTime = null;

  setRunning(false);
  showSavedDuration(durationSeconds);

  const prompt = POST_END_PROMPTS[dungeon.id];
  if (prompt) {
    savedRunIdForPrompt = null;
    if (prompt.deferSave) {
      const runId = commitRun({
        dungeonId: dungeon.id,
        dungeonName: dungeon.name,
        startedAt,
        durationSeconds,
      });
      if (!runId) {
        resetToStartPage();
        return;
      }
      pendingEndRun = { runId, dungeon, startedAt, durationSeconds };
    } else {
      savedRunIdForPrompt = commitRun({
        dungeonId: dungeon.id,
        dungeonName: dungeon.name,
        startedAt,
        durationSeconds,
      });
      if (!savedRunIdForPrompt) {
        resetToStartPage();
        return;
      }
    }
    showPostEndPrompt(dungeon.id, durationSeconds);
    return;
  }

  const runId = commitRun({
    dungeonId: dungeon.id,
    dungeonName: dungeon.name,
    startedAt,
    durationSeconds,
  });
  if (!runId) {
    resetToStartPage();
    return;
  }
  finishRunFlow(runId);
}

function showPage(name) {
  const isTimer = name === "timer";
  pageTimer.classList.toggle("hidden", !isTimer);
  pageTimes.classList.toggle("hidden", isTimer);
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.page === name));
  if (!isTimer) renderTimesPage();
}

async function loadCatalog() {
  try {
    const res = await fetch("dungeons.json", { cache: "no-store" });
    if (res.ok) return res.json();
  } catch (_) {
    /* file:// — fetch unavailable */
  }
  if (window.DUNGEON_CATALOG) return window.DUNGEON_CATALOG;
  throw new Error("Failed to load dungeon catalog");
}

async function init() {
  try {
    catalog = await loadCatalog();
  } catch (err) {
    console.error(err);
    document.body.innerHTML =
      "<main style='padding:2rem;font-family:system-ui;color:#eee;background:#111;min-height:100vh'>" +
      "<h1>RotMG Timer</h1><p>Could not load dungeon list.</p>" +
      "<p>Open via <a href='https://andreneubauer.github.io/test/'>GitHub Pages</a> " +
      "or run <code>python3 serve.py</code> in <code>apps/rotmg-dungeon-timer</code>.</p></main>";
    return;
  }
  dungeonById = new Map(catalog.dungeons.map((d) => [d.id, d]));

  await initRunsStorage();

  searchInput?.addEventListener("input", () => renderDungeonGrid());
  categoryTabs?.addEventListener("click", (event) => {
    const btn = event.target.closest(".category-tab");
    if (!btn || isRunning()) return;
    const categoryId = btn.dataset.category;
    if (!categoryId || categoryId === selectedCategoryId) return;
    selectedCategoryId = categoryId;
    if (searchInput) searchInput.value = "";
    renderDungeonPicker();
  });
  startBtn.addEventListener("click", onStart);
  endBtn.addEventListener("click", onEnd);
  nexusBtn.addEventListener("click", onNexus);
  diedBtn.addEventListener("click", onDied);
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => showPage(tab.dataset.page));
  });
  timesDungeonFilter?.addEventListener("change", () => renderTimesPage());

  renderDungeonPicker();
  updateSelectedDisplay();
}

init();
