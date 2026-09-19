import { test, expect } from "@playwright/test";
import {
  buildPageUrl,
  computeStats,
  formatDuration,
  normalizeRun,
  pageFromPath,
  parseFindTimeInput,
  parseGroupSizeInput,
  validateRun,
} from "../lib/run-utils.js";

const sampleDungeon = { id: "lost-halls", name: "Lost Halls", category: "exalt" };
const getDungeon = (id) => (id === "lost-halls" ? sampleDungeon : null);

test.describe("formatDuration", () => {
  test("formats sub-hour durations", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(0)).toBe("0:00");
  });

  test("formats hour-plus durations", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });
});

test.describe("normalizeRun", () => {
  test("defaults invalid outcome to complete", () => {
    const run = normalizeRun({ dungeonId: "lost-halls", outcome: "invalid" }, getDungeon);
    expect(run.outcome).toBe("complete");
  });

  test("resolves legacy dungeon names", () => {
    const run = normalizeRun({ dungeon: "The Shatters", durationSeconds: 120 }, getDungeon);
    expect(run.dungeonId).toBe("the-shatters");
  });
});

test.describe("validateRun", () => {
  test("rejects runs shorter than the global minimum", () => {
    const message = validateRun(
      {
        dungeonId: "lost-halls",
        dungeonName: "Lost Halls",
        startedAt: "2026-01-01T12:00:00.000Z",
        durationSeconds: 2,
      },
      []
    );
    expect(message).toMatch(/Too short/);
  });

  test("accepts valid runs", () => {
    const message = validateRun(
      {
        dungeonId: "lost-halls",
        dungeonName: "Lost Halls",
        startedAt: "2026-01-01T12:00:00.000Z",
        durationSeconds: 120,
      },
      []
    );
    expect(message).toBeNull();
  });
});

test.describe("parse helpers", () => {
  test("parseFindTimeInput accepts mm:ss and minutes", () => {
    expect(parseFindTimeInput("3:30")).toBe(210);
    expect(parseFindTimeInput("5")).toBe(300);
  });

  test("parseGroupSizeInput enforces player max", () => {
    expect(parseGroupSizeInput("8", 20)).toBe(8);
    expect(parseGroupSizeInput("25", 20)).toBeNull();
  });
});

test.describe("routing helpers", () => {
  test("pageFromPath resolves tab URLs", () => {
    expect(pageFromPath("/Times")).toBe("times");
    expect(pageFromPath("/")).toBe("timer");
  });

  test("buildPageUrl builds segment URLs", () => {
    expect(buildPageUrl("times", "/Timer")).toBe("/Times");
  });
});

test.describe("computeStats", () => {
  test("aggregates outcomes and clears", () => {
    const runs = [
      {
        dungeonId: "lost-halls",
        dungeonName: "Lost Halls",
        outcome: "complete",
        durationSeconds: 100,
        findTimeSeconds: 30,
        runType: "party",
      },
      {
        dungeonId: "lost-halls",
        dungeonName: "Lost Halls",
        outcome: "died",
        durationSeconds: 40,
        findTimeSeconds: null,
        runType: null,
      },
    ];

    const { overall, byDungeon } = computeStats(runs);
    expect(overall.complete).toBe(1);
    expect(overall.died).toBe(1);
    expect(overall.total).toBe(2);
    expect(overall.clearCount).toBe(1);
    expect(byDungeon.get("lost-halls").total).toBe(2);
  });
});
