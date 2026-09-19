import assert from "node:assert/strict";
import { deltaVsWr, formatWrDelta, wrSecondsForRun } from "../src/lib/wr-times";
import type { WrDungeonEntry } from "../src/lib/wr-times";

const entry: WrDungeonEntry = {
  dungeonId: "lost-halls",
  name: "Lost Halls",
  soloMinClearSeconds: 100,
  soloWrDisplay: "1m40s",
  groupMinClearSeconds: 60,
  groupWrDisplay: "1m",
};

{
  assert.equal(wrSecondsForRun(entry, { runType: null, groupSize: null }), 100);
  assert.equal(wrSecondsForRun(entry, { runType: "party", groupSize: 8 }), 60);
  assert.equal(wrSecondsForRun(entry, { runType: "organic", groupSize: 2 }), 60);
}

{
  assert.equal(deltaVsWr(120, 100), 20);
  assert.equal(deltaVsWr(90, 100), -10);
}

{
  assert.equal(formatWrDelta(5), "+5s");
  assert.equal(formatWrDelta(-3), "−3s");
  assert.equal(formatWrDelta(65), "+1:05");
}

console.log("test-wr-times: ok");
