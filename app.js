const STORAGE_KEY = "rotmg-dungeon-runs";

const LEGACY_NAME_TO_ID = {
  "Lost Halls complex": "lost-halls-complex",
  "Kogbold Steamworks": "kogbold-steamworks",
  "Moonlight Village": "moonlight-village",
  Shatters: "the-shatters",
  "The Shatters": "the-shatters",
};

const searchInput = document.getElementById("dungeon-search");
const dungeonSelect = document.getElementById("dungeon");
const dungeonIcon = document.getElementById("dungeon-icon");
const dungeonName = document.getElementById("dungeon-name");
const dungeonMeta = document.getElementById("dungeon-meta");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const averageEl = document.getElementById("average");
const startBtn = document.getElementById("start-btn");
const endBtn = document.getElementById("end-btn");
const runsBody = document.getElementById("runs-body");

let catalog = { iconBase: "", fallbackIcon: "Dungeon Portal.png", categories: [], dungeons: [] };
let dungeonById = new Map();
let startTime = null;
let tickInterval = null;
let selectedDungeonId = "lost-halls-complex";

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
  img.onerror = () => {
    img.onerror = null;
    img.src = iconUrlCdn(dungeon);
  };
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
    dungeonName: dungeon?.name || run.dungeon || id,
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

function selectedDungeon() {
  return getDungeon(selectedDungeonId);
}

function updatePreview() {
  const dungeon = selectedDungeon();
  if (!dungeon) {
    dungeonName.textContent = "—";
    dungeonMeta.textContent = "";
    dungeonIcon.removeAttribute("src");
    return;
  }
  setDungeonIcon(dungeonIcon, dungeon);
  dungeonIcon.alt = dungeon.name;
  dungeonName.textContent = dungeon.name;
  const bits = [];
  if (dungeon.difficulty != null) bits.push(`Difficulty ${dungeon.difficulty}`);
  if (dungeon.note) bits.push(dungeon.note);
  dungeonMeta.textContent = bits.join(" · ");
}

function updateAverage() {
  const dungeon = selectedDungeon();
  if (!dungeon) return;
  const runs = loadRuns().filter((r) => r.dungeonId === dungeon.id);
  if (runs.length === 0) {
    averageEl.textContent = `No runs logged for ${dungeon.name} yet.`;
    return;
  }
  const avg = runs.reduce((sum, r) => sum + r.durationSeconds, 0) / runs.length;
  averageEl.textContent = `${dungeon.name}: avg ${formatDuration(avg)} over ${runs.length} run${runs.length === 1 ? "" : "s"}`;
}

function renderDungeonOptions(filter = "") {
  const q = filter.trim().toLowerCase();
  dungeonSelect.innerHTML = "";
  const categoryMap = new Map(catalog.categories.map((c) => [c.id, c.label]));

  for (const category of catalog.categories) {
    const matches = catalog.dungeons.filter((d) => {
      if (d.category !== category.id) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q);
    });
    if (matches.length === 0) continue;

    const group = document.createElement("optgroup");
    group.label = categoryMap.get(category.id) || category.id;
    for (const d of matches) {
      const option = document.createElement("option");
      option.value = d.id;
      option.textContent = d.difficulty != null ? `${d.name} (${d.difficulty})` : d.name;
      option.selected = d.id === selectedDungeonId;
      group.appendChild(option);
    }
    dungeonSelect.appendChild(group);
  }

  if (!dungeonSelect.querySelector(`option[value="${selectedDungeonId}"]`) && dungeonSelect.options.length > 0) {
    selectedDungeonId = dungeonSelect.options[0].value;
  }
  updatePreview();
  updateAverage();
}

function renderTable() {
  const runs = loadRuns().slice().reverse();
  runsBody.innerHTML = "";

  if (runs.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="4" class="empty">No runs yet.</td>`;
    runsBody.appendChild(row);
    updateAverage();
    return;
  }

  for (const run of runs) {
    const dungeon = getDungeon(run.dungeonId);
    const row = document.createElement("tr");
    const when = new Date(run.startedAt).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    row.innerHTML = `
      <td>${when}</td>
      <td class="dungeon-cell"><img class="table-icon" alt="" width="24" height="24" /><span>${run.dungeonName}</span></td>
      <td class="time">${formatDuration(run.durationSeconds)}</td>
      <td><button type="button" class="delete-btn" data-id="${run.id}">Delete</button></td>
    `;
    if (dungeon) setDungeonIcon(row.querySelector(".table-icon"), dungeon);
    row.querySelector(".delete-btn").addEventListener("click", () => {
      const next = loadRuns().filter((r) => r.id !== run.id);
      saveRuns(next);
      renderTable();
    });
    runsBody.appendChild(row);
  }

  updateAverage();
}

function setRunning(running) {
  searchInput.disabled = running;
  dungeonSelect.disabled = running;
  startBtn.disabled = running;
  endBtn.disabled = !running;
  statusEl.classList.toggle("running", running);
  statusEl.classList.toggle("saved", false);
}

function tick() {
  if (!startTime) return;
  const elapsed = (Date.now() - startTime) / 1000;
  timerEl.textContent = formatDuration(elapsed);
}

function onStart() {
  if (startTime) return;
  const dungeon = selectedDungeon();
  if (!dungeon) return;
  startTime = Date.now();
  setRunning(true);
  statusEl.textContent = `Running — ${dungeon.name}`;
  timerEl.textContent = "0:00";
  tickInterval = setInterval(tick, 200);
}

function onEnd() {
  if (!startTime) return;
  const dungeon = selectedDungeon();
  if (!dungeon) return;
  const durationSeconds = (Date.now() - startTime) / 1000;
  const run = {
    id: crypto.randomUUID(),
    dungeonId: dungeon.id,
    dungeonName: dungeon.name,
    startedAt: new Date(startTime).toISOString(),
    durationSeconds,
  };

  clearInterval(tickInterval);
  tickInterval = null;
  startTime = null;

  const runs = loadRuns();
  runs.push(run);
  saveRuns(runs);

  setRunning(false);
  timerEl.textContent = formatDuration(durationSeconds);
  statusEl.textContent = `Saved — ${formatDuration(durationSeconds)}`;
  statusEl.classList.add("saved");
  renderTable();
}

async function init() {
  const res = await fetch("dungeons.json");
  catalog = await res.json();
  dungeonById = new Map(catalog.dungeons.map((d) => [d.id, d]));

  searchInput.addEventListener("input", () => renderDungeonOptions(searchInput.value));
  dungeonSelect.addEventListener("change", () => {
    selectedDungeonId = dungeonSelect.value;
    updatePreview();
    updateAverage();
  });
  startBtn.addEventListener("click", onStart);
  endBtn.addEventListener("click", onEnd);

  renderDungeonOptions();
  renderTable();
}

init();
