const assert = require("node:assert/strict");
const {
  mergePendingIntoRuns,
  validateRun,
  runsNewestFirst,
} = require("../run-persistence.js");

function fmt(seconds) {
  return `${Math.round(seconds)}s`;
}

function run(id, dungeonId, startedAt, durationSeconds, extra = {}) {
  return {
    id,
    dungeonId,
    dungeonName: extra.dungeonName || dungeonId,
    startedAt,
    durationSeconds,
    outcome: extra.outcome || "complete",
    runType: extra.runType ?? null,
    groupSize: extra.groupSize ?? null,
    hardMode: extra.hardMode ?? null,
    findTimeSeconds: extra.findTimeSeconds ?? null,
    ign: extra.ign ?? null,
  };
}

// Board refresh used to replace cache and drop unsynced LH/Void runs.
{
  const board = [run("old", "abyss-of-demons", "2026-09-19T12:00:00.000Z", 40)];
  const pending = [
    run("lh1", "lost-halls", "2026-09-19T17:00:00.000Z", 480, { dungeonName: "Lost Halls" }),
    run("void1", "the-void", "2026-09-19T17:08:00.000Z", 180, { dungeonName: "The Void" }),
  ];
  const merged = mergePendingIntoRuns(board, pending);
  assert.equal(merged.length, 3);
  assert.deepEqual(
    merged.map((r) => r.id),
    ["old", "lh1", "void1"]
  );
}

// Local metadata (path name, party tag) overlays the board row.
{
  const board = [run("lh1", "lost-halls", "2026-09-19T17:00:00.000Z", 480, { dungeonName: "Lost Halls" })];
  const pending = [
    run("lh1", "lost-halls", "2026-09-19T17:00:00.000Z", 480, {
      dungeonName: "Lost Halls (to Cult)",
      runType: "party",
      groupSize: 8,
    }),
  ];
  const merged = mergePendingIntoRuns(board, pending);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].dungeonName, "Lost Halls (to Cult)");
  assert.equal(merged[0].runType, "party");
  assert.equal(merged[0].groupSize, 8);
}

// Sequential LH → Void (Void starts when LH ends) is not an overlap.
{
  const lh = run("lh1", "lost-halls", "2026-09-19T17:00:00.000Z", 480);
  const voidStart = new Date(Date.parse(lh.startedAt) + 480 * 1000).toISOString();
  const voidRun = run("void1", "the-void", voidStart, 120);
  assert.equal(validateRun(voidRun, [lh], { formatDuration: fmt }), null);
}

// A second LH+Void pair later the same session still saves.
{
  const firstLh = run("lh1", "lost-halls", "2026-09-19T17:00:00.000Z", 480);
  const firstVoid = run("void1", "the-void", "2026-09-19T17:08:00.000Z", 180);
  const secondLh = run("lh2", "lost-halls", "2026-09-19T17:20:00.000Z", 500);
  assert.equal(validateRun(secondLh, [firstLh, firstVoid], { formatDuration: fmt }), null);
  const secondVoid = run("void2", "the-void", "2026-09-19T17:28:20.000Z", 160);
  assert.equal(validateRun(secondVoid, [firstLh, firstVoid, secondLh], { formatDuration: fmt }), null);
}

// True overlap still rejects.
{
  const long = run("a", "lost-halls", "2026-09-19T17:00:00.000Z", 600);
  const nested = run("b", "the-void", "2026-09-19T17:02:00.000Z", 60);
  const message = validateRun(nested, [long], { formatDuration: fmt });
  assert.match(message, /overlaps/);
}

// Too short still rejects.
{
  const message = validateRun(run("x", "the-void", "2026-09-19T17:00:00.000Z", 2), [], { formatDuration: fmt });
  assert.match(message, /Too short/);
}

// Newest-first so just-logged runs appear at the top of Timer/Times.
{
  const ordered = runsNewestFirst([
    run("a", "lost-halls", "2026-09-19T17:00:00.000Z", 10),
    run("b", "the-void", "2026-09-19T17:10:00.000Z", 10),
    run("c", "lost-halls", "2026-09-19T17:20:00.000Z", 10),
  ]);
  assert.deepEqual(
    ordered.map((r) => r.id),
    ["c", "b", "a"]
  );
}

console.log("test-run-persistence: ok");
