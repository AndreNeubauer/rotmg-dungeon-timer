const STORAGE_KEY = "rotmg-dungeon-runs";

const DUNGEONS = [
  "Lost Halls complex",
  "Kogbold Steamworks",
  "Moonlight Village",
  "Shatters",
];

const dungeonSelect = document.getElementById("dungeon");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const averageEl = document.getElementById("average");
const startBtn = document.getElementById("start-btn");
const endBtn = document.getElementById("end-btn");
const runsBody = document.getElementById("runs-body");

let startTime = null;
let tickInterval = null;

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

function loadRuns() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRuns(runs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

function updateAverage() {
  const dungeon = dungeonSelect.value;
  const runs = loadRuns().filter((r) => r.dungeon === dungeon);
  if (runs.length === 0) {
    averageEl.textContent = `No runs logged for ${dungeon} yet.`;
    return;
  }
  const avg = runs.reduce((sum, r) => sum + r.durationSeconds, 0) / runs.length;
  averageEl.textContent = `${dungeon}: avg ${formatDuration(avg)} over ${runs.length} run${runs.length === 1 ? "" : "s"}`;
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
      <td>${run.dungeon}</td>
      <td class="time">${formatDuration(run.durationSeconds)}</td>
      <td><button type="button" class="delete-btn" data-id="${run.id}">Delete</button></td>
    `;
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
  startTime = Date.now();
  setRunning(true);
  statusEl.textContent = `Running — ${dungeonSelect.value}`;
  timerEl.textContent = "0:00";
  tickInterval = setInterval(tick, 200);
}

function onEnd() {
  if (!startTime) return;
  const durationSeconds = (Date.now() - startTime) / 1000;
  const run = {
    id: crypto.randomUUID(),
    dungeon: dungeonSelect.value,
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

for (const name of DUNGEONS) {
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name;
  dungeonSelect.appendChild(option);
}

startBtn.addEventListener("click", onStart);
endBtn.addEventListener("click", onEnd);
dungeonSelect.addEventListener("change", updateAverage);

renderTable();
