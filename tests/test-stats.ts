import assert from "node:assert/strict";
import {
  avgDuration,
  bestClearSeconds,
  computeStats,
  successRate,
  totalClearHours,
} from "../src/lib/stats";
import type { Run } from "../src/lib/types";

function run(
  id: string,
  dungeonId: string,
  durationSeconds: number,
  outcome: Run["outcome"] = "complete",
  extra: Partial<Run> = {}
): Run {
  return {
    id,
    dungeonId,
    dungeonName: dungeonId,
    startedAt: "2026-09-19T12:00:00.000Z",
    durationSeconds,
    outcome,
    findTimeSeconds: null,
    runType: null,
    groupSize: null,
    hardMode: null,
    ign: null,
    ...extra,
  };
}

{
  assert.equal(successRate({ complete: 3, total: 4 }), 75);
  assert.equal(successRate({ complete: 0, total: 0 }), null);
}

{
  assert.equal(avgDuration(120, 2), 60);
  assert.equal(avgDuration(0, 0), null);
}

{
  const runs = [
    run("a", "lost-halls", 100, "complete"),
    run("b", "lost-halls", 200, "nexus"),
    run("c", "the-void", 80, "complete"),
  ];
  const { overall } = computeStats(runs);
  assert.equal(overall.total, 3);
  assert.equal(overall.complete, 2);
  assert.equal(overall.nexus, 1);
  assert.equal(overall.clearCount, 2);
}

{
  const runs = [
    run("a", "lost-halls", 300, "complete"),
    run("b", "lost-halls", 120, "complete"),
    run("c", "lost-halls", 90, "died"),
  ];
  assert.equal(bestClearSeconds(runs), 120);
}

{
  const runs = [
    run("a", "lost-halls", 3600, "complete"),
    run("b", "the-void", 1800, "complete"),
  ];
  assert.equal(totalClearHours(runs), 1.5);
}

console.log("test-stats: ok");
