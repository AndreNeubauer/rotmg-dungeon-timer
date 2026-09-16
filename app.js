const STORAGE_KEY = "rotmg-dungeon-runs";
const EXALT_CATEGORY = "exalt";

/**
 * After End — optional follow-ups.
 * LH: cult path (no Colossus) vs boss clear; they do not chain automatically.
 * Cult → Void (vial run into void). Fungal → Crystal always.
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
      { label: "Colossus clear", kind: "done", runName: "Lost Halls" },
    ],
  },
  "cultist-hideout": {
    hint: "Continue to Void?",
    actions: [
      { label: "→ Void", kind: "next", nextId: "the-void", primary: true },
      { label: "Done", kind: "done" },
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
const runsBody = document.getElementById("runs-body");
const averagesList = document.getElementById("averages-list");
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
  return {
    ...run,
    dungeonId: dungeon?.id || id,
    dungeonName: dungeon?.name || run.dungeonName || run.dungeon || id,
  };
}

function loadRuns() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map(normalizeRun);
  } catch {
    return [];
  }
}

function saveRuns(runs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

function commitRun({ dungeonId, dungeonName, startedAt, durationSeconds }) {
  const runs = loadRuns();
  runs.push({
    id: crypto.randomUUID(),
    dungeonId,
    dungeonName,
    startedAt,
    durationSeconds,
  });
  saveRuns(runs);
}

function selectedDungeon() {
  return getDungeon(selectedDungeonId);
}

function isRunning() {
  return startTime !== null;
}

function selectDungeon(id) {
  if (isRunning()) return;
  hidePostEndPrompt();
  selectedDungeonId = id;
  renderExaltGrid();
  renderAllDungeonList(searchInput.value);
  updateSelectedDisplay();
}

function hidePostEndPrompt() {
  pendingEndRun = null;
  postEndPrompt.classList.add("hidden");
  postEndActions.innerHTML = "";
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

function showPostEndPrompt(dungeonId, durationSeconds) {
  const config = POST_END_PROMPTS[dungeonId];
  if (!config) {
    resetToStartPage();
    return;
  }

  const hint = config.hint ? `${config.hint} ` : "";
  postEndLabel.textContent = `Saved ${formatDuration(durationSeconds)} · ${hint}`.trim();
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

function handlePostEndAction(action) {
  if (pendingEndRun) {
    commitRun({
      dungeonId: pendingEndRun.dungeon.id,
      dungeonName: action.runName || pendingEndRun.dungeon.name,
      startedAt: pendingEndRun.startedAt,
      durationSeconds: pendingEndRun.durationSeconds,
    });
    pendingEndRun = null;
  }

  hidePostEndPrompt();

  if (action.kind === "next" && action.nextId) {
    selectDungeon(action.nextId);
    onStart();
    return;
  }

  resetToStartPage();
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

function computeAverages() {
  const runs = loadRuns();
  const byDungeon = new Map();
  for (const run of runs) {
    const key = run.dungeonName;
    if (!byDungeon.has(key)) {
      byDungeon.set(key, { total: 0, count: 0, name: run.dungeonName, id: run.dungeonId });
    }
    const entry = byDungeon.get(key);
    entry.total += run.durationSeconds;
    entry.count += 1;
  }

  return [...byDungeon.entries()]
    .map(([key, { total, count, name, id }]) => ({
      id,
      key,
      name,
      avg: total / count,
      count,
      dungeon: getDungeon(id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderAverages() {
  const averages = computeAverages();
  averagesList.innerHTML = "";

  if (averages.length === 0) {
    averagesList.innerHTML = `<p class="empty">No runs yet.</p>`;
    return;
  }

  for (const { name, avg, count, dungeon } of averages) {
    const row = document.createElement("div");
    row.className = "average-row";
    const img = document.createElement("img");
    img.alt = "";
    if (dungeon) setDungeonIcon(img, dungeon);
    const nameCell = document.createElement("span");
    nameCell.className = "average-row-name";
    nameCell.append(img, name);
    row.append(
      nameCell,
      Object.assign(document.createElement("span"), { className: "average-row-count", textContent: `${count}×` }),
      Object.assign(document.createElement("span"), { className: "average-row-time", textContent: formatDuration(avg) })
    );
    averagesList.appendChild(row);
  }
}

function renderRunsTable() {
  const runs = loadRuns().slice().reverse();
  runsBody.innerHTML = "";

  if (runs.length === 0) {
    runsBody.innerHTML = `<tr><td colspan="4" class="empty">No runs yet.</td></tr>`;
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
    row.innerHTML = `
      <td class="when">${when}</td>
      <td class="dungeon-cell"><img class="table-icon" alt="" /><span>${run.dungeonName}</span></td>
      <td class="time">${formatDuration(run.durationSeconds)}</td>
      <td><button type="button" class="delete-btn">×</button></td>
    `;
    if (dungeon) setDungeonIcon(row.querySelector(".table-icon"), dungeon);
    row.querySelector(".delete-btn").addEventListener("click", () => {
      saveRuns(loadRuns().filter((r) => r.id !== run.id));
      renderTimesPage();
    });
    runsBody.appendChild(row);
  }
}

function renderTimesPage() {
  renderAverages();
  renderRunsTable();
}

function setRunning(running) {
  startBtn.disabled = running;
  endBtn.disabled = !running;
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
  if (startTime) return;
  const dungeon = selectedDungeon();
  if (!dungeon) return;
  startTime = Date.now();
  setRunning(true);
  statusEl.textContent = "Running";
  timerEl.textContent = "0:00";
  tickInterval = setInterval(tick, 200);
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
    if (prompt.deferSave) {
      pendingEndRun = { dungeon, startedAt, durationSeconds };
    } else {
      commitRun({
        dungeonId: dungeon.id,
        dungeonName: dungeon.name,
        startedAt,
        durationSeconds,
      });
    }
    showPostEndPrompt(dungeon.id, durationSeconds);
    return;
  }

  commitRun({
    dungeonId: dungeon.id,
    dungeonName: dungeon.name,
    startedAt,
    durationSeconds,
  });
  resetToStartPage();
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
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => showPage(tab.dataset.page));
  });

  renderExaltGrid();
  renderAllDungeonList();
  updateSelectedDisplay();
}

init();
