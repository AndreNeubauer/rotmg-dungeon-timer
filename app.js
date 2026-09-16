const STORAGE_KEY = "rotmg-dungeon-runs";
const EXALT_CATEGORY = "exalt";

/**
 * After End — optional follow-ups.
 * LH: cult path (no Colossus) vs boss clear; boss clear can chain to Void.
 * Fungal → Crystal always.
 */
const POST_END_PROMPTS = {
  "lost-halls": {
    hint: "Cult path (no Colossus) or boss clear?",
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
        label: "Colossus clear",
        kind: "thenPrompt",
        runName: "Lost Halls",
        thenPrompt: {
          hint: "Chain to Void?",
          actions: [
            { label: "→ Void", kind: "next", nextId: "the-void", primary: true },
            { label: "Done", kind: "done" },
          ],
        },
      },
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

const exaltGrid = document.getElementById("exalt-grid");
const allDungeonList = document.getElementById("all-dungeon-list");
const searchInput = document.getElementById("dungeon-search");
const allAccordion = document.getElementById("all-dungeons-accordion");
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
/** Run waiting for LH branch choice before save. */
let pendingEndRun = null;
/** Run id waiting for optional find-time entry. */
let pendingFindRunId = null;
let findTimeAfterDone = null;
/** Run id saved on End before chain prompt (e.g. Fungal). */
let savedRunIdForPrompt = null;

const FIND_PRESETS_MIN = [3, 5, 10, 15];
/** Spawn from another dungeon — no find-time prompt (Void, Crystal). */
const CHAIN_SPAWN_NO_FIND = new Set(["the-void", "crystal-cavern"]);
/** True when this run started via LH/Fungal chain (→ Cult, → Void, → Crystal). */
let currentRunChained = false;

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
  return {
    ...run,
    id: run.id || crypto.randomUUID(),
    dungeonId: dungeon?.id || id,
    dungeonName: dungeon?.name || run.dungeonName || run.dungeon || id,
    outcome,
    findTimeSeconds,
  };
}

function loadRuns() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const needsId = raw.some((run) => !run.id);
    const runs = raw.map(normalizeRun);
    if (needsId) saveRuns(runs);
    return runs;
  } catch {
    return [];
  }
}

function deleteRun(runId) {
  saveRuns(loadRuns().filter((r) => r.id !== runId));
}

function saveRuns(runs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

function commitRun({ dungeonId, dungeonName, startedAt, durationSeconds, outcome = "complete" }) {
  const id = crypto.randomUUID();
  const runs = loadRuns();
  runs.push({
    id,
    dungeonId,
    dungeonName,
    startedAt,
    durationSeconds,
    outcome,
    findTimeSeconds: null,
  });
  saveRuns(runs);
  return id;
}

function setRunFindTime(runId, findTimeSeconds) {
  saveRuns(
    loadRuns().map((run) =>
      run.id === runId ? { ...run, findTimeSeconds: Math.max(0, Math.round(findTimeSeconds)) } : run
    )
  );
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

function computeStats() {
  const runs = loadRuns();
  const overall = { ...emptyOutcomeCounts(), ...emptyTiming() };
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
  }

  return { overall, byDungeon };
}

function avgDuration(total, count) {
  return count > 0 ? total / count : null;
}

function getDungeonSummaries() {
  const { byDungeon } = computeStats();
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
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function formatTimePair(avgClear, avgAttempt) {
  const clear = avgClear != null ? formatDuration(avgClear) : "—";
  const attempt = avgAttempt != null ? formatDuration(avgAttempt) : "—";
  return `<span class="time-clear" title="Average clear">${clear}</span><span class="time-sep"> · </span><span class="time-attempt" title="Average attempt">${attempt}</span>`;
}

function selectedDungeon() {
  return getDungeon(selectedDungeonId);
}

function isRunning() {
  return startTime !== null;
}

function selectDungeon(id, { fromPrompt = false } = {}) {
  if (isRunning()) return;
  if (pendingEndRun && !fromPrompt) return;
  if (pendingFindRunId) dismissFindTimePrompt();
  hideChainPrompt();
  selectedDungeonId = id;
  renderExaltGrid();
  renderAllDungeonList(searchInput.value);
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
  renderExaltGrid();
  renderAllDungeonList(searchInput.value);
}

function shouldOfferFindTime(runId) {
  if (!runId || currentRunChained) return false;
  const run = loadRuns().find((entry) => entry.id === runId);
  return Boolean(run && !CHAIN_SPAWN_NO_FIND.has(run.dungeonId));
}

function finishFindTime(findTimeSeconds = null) {
  if (pendingFindRunId && findTimeSeconds != null && findTimeSeconds > 0) {
    setRunFindTime(pendingFindRunId, findTimeSeconds);
  }
  const after = findTimeAfterDone;
  pendingFindRunId = null;
  findTimeAfterDone = null;
  savedRunIdForPrompt = null;
  postEndPrompt.classList.add("hidden");
  postEndActions.innerHTML = "";
  after?.();
}

function offerFindTime(runId, afterDone) {
  pendingFindRunId = runId;
  findTimeAfterDone = afterDone;
  postEndLabel.innerHTML = `Add find time?<span class="find-sub">Realm or nexus → portal. Skip if party had it ready.</span>`;
  postEndActions.innerHTML = "";

  const skipBtn = document.createElement("button");
  skipBtn.type = "button";
  skipBtn.className = "post-end-action secondary";
  skipBtn.textContent = "Skip";
  skipBtn.addEventListener("click", () => finishFindTime());
  postEndActions.appendChild(skipBtn);

  for (const minutes of FIND_PRESETS_MIN) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "post-end-action secondary find-preset";
    btn.textContent = `${minutes}m`;
    btn.addEventListener("click", () => finishFindTime(minutes * 60));
    postEndActions.appendChild(btn);
  }

  const customRow = document.createElement("div");
  customRow.className = "find-custom-row";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "find-input";
  input.placeholder = "min or m:ss";
  input.inputMode = "decimal";
  input.autocomplete = "off";
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "post-end-action primary";
  saveBtn.textContent = "Add";
  saveBtn.addEventListener("click", () => {
    const seconds = parseFindTimeInput(input.value);
    if (seconds == null) {
      input.focus();
      return;
    }
    finishFindTime(seconds);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveBtn.click();
  });
  customRow.append(input, saveBtn);
  postEndActions.appendChild(customRow);

  postEndPrompt.classList.remove("hidden");
  timerBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function finishRunFlow(runId, { chain = false, afterDone = resetToStartPage } = {}) {
  if (chain || !runId) {
    afterDone?.();
    return;
  }
  offerFindTime(runId, afterDone);
}

function resetToStartPage() {
  hidePostEndPrompt();
  timerEl.textContent = "—";
  statusEl.textContent = "";
  statusEl.classList.remove("running", "saved");
  showPage("timer");
  window.scrollTo({ top: 0, behavior: "smooth" });
  exaltGrid.scrollIntoView({ behavior: "smooth", block: "start" });
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
}

function showPostEndPrompt(dungeonId, durationSeconds) {
  const config = POST_END_PROMPTS[dungeonId];
  if (!config) {
    resetToStartPage();
    return;
  }

  renderPostEndPrompt(config, durationSeconds, { saved: !config.deferSave });
  postEndPrompt.classList.remove("hidden");
  timerBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function handlePostEndAction(action) {
  let durationSeconds = null;
  let runId = savedRunIdForPrompt;

  if (pendingEndRun) {
    durationSeconds = pendingEndRun.durationSeconds;
    runId = commitRun({
      dungeonId: pendingEndRun.dungeon.id,
      dungeonName: action.runName || pendingEndRun.dungeon.name,
      startedAt: pendingEndRun.startedAt,
      durationSeconds: pendingEndRun.durationSeconds,
    });
    pendingEndRun = null;
  }

  if (action.kind === "thenPrompt" && action.thenPrompt) {
    savedRunIdForPrompt = runId;
    renderPostEndPrompt(action.thenPrompt, durationSeconds, { saved: true });
    return;
  }

  if (action.kind === "discard") {
    pendingEndRun = null;
    hidePostEndPrompt();
    resetToStartPage();
    return;
  }

  if (action.kind === "next" && action.nextId) {
    hidePostEndPrompt();
    selectDungeon(action.nextId, { fromPrompt: true });
    onStart();
    return;
  }

  postEndPrompt.classList.add("hidden");
  postEndActions.innerHTML = "";
  pendingEndRun = null;
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
  label.textContent = dungeon.name;

  btn.append(img, label);
  btn.addEventListener("click", () => selectDungeon(dungeon.id));
  return btn;
}

function renderExaltGrid() {
  exaltGrid.innerHTML = "";
  const exalt = catalog.dungeons.filter((d) => d.category === EXALT_CATEGORY);
  for (const d of exalt) {
    exaltGrid.appendChild(createDungeonCard(d));
  }
}

function renderAllDungeonList(filter = "") {
  const q = filter.trim().toLowerCase();
  allDungeonList.innerHTML = "";
  const categoryMap = new Map(catalog.categories.map((c) => [c.id, c.label]));

  for (const category of catalog.categories) {
    if (category.id === EXALT_CATEGORY) continue;

    const matches = catalog.dungeons.filter((d) => {
      if (d.category !== category.id) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q);
    });
    if (matches.length === 0) continue;

    const group = document.createElement("div");
    group.className = "dungeon-group";

    const heading = document.createElement("h3");
    heading.textContent = categoryMap.get(category.id) || category.id;
    group.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "dungeon-grid compact-grid";
    for (const d of matches) {
      grid.appendChild(createDungeonCard(d, { compact: true }));
    }
    group.appendChild(grid);
    allDungeonList.appendChild(group);
  }

  if (allDungeonList.children.length === 0) {
    allDungeonList.innerHTML = `<p class="empty">No dungeons match.</p>`;
  }
}

function updateSelectedDisplay() {
  const dungeon = selectedDungeon();
  if (!dungeon) {
    dungeonName.textContent = "—";
    return;
  }
  setDungeonIcon(dungeonIcon, dungeon);
  dungeonName.textContent = dungeon.name;
  if (!isRunning()) statusEl.textContent = "";
}

function renderStatsSummary() {
  const { overall } = computeStats();
  statsSummary.innerHTML = "";

  if (overall.total === 0) {
    statsSummary.innerHTML = `<p class="empty">No attempts yet.</p>`;
    return;
  }

  const rate = successRate(overall);
  const avgClear = avgDuration(overall.clearDuration, overall.clearCount);
  const avgAttempt = avgDuration(overall.attemptDuration, overall.total);
  const avgFind = avgDuration(overall.findDuration, overall.findCount);
  const findLine =
    avgFind != null
      ? `<div class="stats-find">+${formatDuration(avgFind)} avg find <span class="time-legend">(${overall.findCount} logged)</span></div>`
      : "";
  const card = document.createElement("div");
  card.className = "stats-card";
  card.innerHTML = `
    <div class="stats-rate">${rate}%</div>
    <div class="stats-body">
      <div class="stats-detail">
        <span class="outcome-pill complete">${overall.complete} complete</span>
        <span class="outcome-pill nexus">${overall.nexus} nexus</span>
        <span class="outcome-pill died">${overall.died} died</span>
        <span class="stats-total">${overall.total} attempts</span>
      </div>
      <div class="stats-times">${formatTimePair(avgClear, avgAttempt)}<span class="time-legend">clear · avg</span></div>
      ${findLine}
    </div>
  `;
  statsSummary.appendChild(card);
}

function renderAverages() {
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

  for (const { name, avgClear, avgAttempt, avgFind, findCount, clearCount, dungeon, stats } of summaries) {
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
      timeCell.innerHTML += `<span class="avg-find" title="Average find time (logged runs only)"> +${formatDuration(avgFind)} find</span>`;
    }

    row.append(nameCell, statsCell, timeCell);
    averagesList.appendChild(row);
  }
}

function renderRunsTable() {
  const runs = loadRuns().slice().reverse();
  runsBody.innerHTML = "";

  if (runs.length === 0) {
    runsBody.innerHTML = `<tr><td colspan="5" class="empty">No attempts yet.</td></tr>`;
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
    const findNote =
      run.findTimeSeconds != null && run.findTimeSeconds > 0
        ? `<span class="find-time">+${formatDuration(run.findTimeSeconds)} find</span>`
        : "";
    row.innerHTML = `
      <td class="when">${when}</td>
      <td class="dungeon-cell"><img class="table-icon" alt="" /><span>${run.dungeonName}</span></td>
      <td><span class="outcome-pill ${run.outcome}">${outcome.label}</span></td>
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
  renderStatsSummary();
  renderAverages();
  renderRunsTable();
}

function setRunning(running) {
  startBtn.disabled = running || pendingFindRunId != null;
  endBtn.disabled = !running;
  nexusBtn.disabled = !running;
  diedBtn.disabled = !running;
  searchInput.disabled = running;
  for (const btn of postEndActions.querySelectorAll("button")) {
    btn.disabled = running;
  }
  if (running) {
    allAccordion.open = false;
    hidePostEndPrompt();
  }
  statusEl.classList.toggle("running", running);
  statusEl.classList.toggle("saved", false);
  renderExaltGrid();
  renderAllDungeonList(searchInput.value);
}

function tick() {
  if (!startTime) return;
  timerEl.textContent = formatDuration((Date.now() - startTime) / 1000);
}

function onStart() {
  if (startTime || pendingFindRunId) return;
  const dungeon = selectedDungeon();
  if (!dungeon) return;
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
  statusEl.textContent = statusMessage;
  statusEl.classList.remove("running", "saved");
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
      pendingEndRun = { dungeon, startedAt, durationSeconds };
    } else {
      savedRunIdForPrompt = commitRun({
        dungeonId: dungeon.id,
        dungeonName: dungeon.name,
        startedAt,
        durationSeconds,
      });
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
  finishRunFlow(runId);
}

function showPage(name) {
  const isTimer = name === "timer";
  pageTimer.classList.toggle("hidden", !isTimer);
  pageTimes.classList.toggle("hidden", isTimer);
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.page === name));
  if (!isTimer) renderTimesPage();
}

async function init() {
  const res = await fetch("dungeons.json");
  catalog = await res.json();
  dungeonById = new Map(catalog.dungeons.map((d) => [d.id, d]));

  searchInput.addEventListener("input", () => renderAllDungeonList(searchInput.value));
  startBtn.addEventListener("click", onStart);
  endBtn.addEventListener("click", onEnd);
  nexusBtn.addEventListener("click", onNexus);
  diedBtn.addEventListener("click", onDied);
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => showPage(tab.dataset.page));
  });

  renderExaltGrid();
  renderAllDungeonList();
  updateSelectedDisplay();
}

init();
