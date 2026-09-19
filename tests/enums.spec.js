import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import {
  CATEGORY_IDS,
  OUTCOME_IDS,
  PAGE_ROUTE_SEGMENTS,
  POST_END_ACTION_KIND_IDS,
  POST_END_PROMPTS,
  ROUTE_SEGMENT_TO_PAGE,
  RUN_SOURCE_IDS,
  TAB_ROUTE_SEGMENTS,
} from "../lib/constants.js";
import { collectDatabaseEnumViolations, collectEnumViolations } from "../lib/enum-validation.js";

const catalog = JSON.parse(readFileSync(join(process.cwd(), "dungeons.json"), "utf8"));

test.describe("route enums", () => {
  test("PAGE_ROUTE_SEGMENTS and ROUTE_SEGMENT_TO_PAGE are inverse maps", () => {
    for (const [pageId, segment] of Object.entries(PAGE_ROUTE_SEGMENTS)) {
      expect(ROUTE_SEGMENT_TO_PAGE[segment]).toBe(pageId);
    }
  });

  test("TAB_ROUTE_SEGMENTS matches exported page segments", () => {
    expect([...TAB_ROUTE_SEGMENTS].sort()).toEqual(Object.values(PAGE_ROUTE_SEGMENTS).sort());
  });
});

test.describe("outcome and run source enums", () => {
  test("OUTCOMES covers database CHECK values", () => {
    expect([...OUTCOME_IDS].sort()).toEqual(["complete", "died", "nexus"]);
    expect(collectDatabaseEnumViolations()).toEqual([]);
  });

  test("RUN_SOURCES covers database CHECK values", () => {
    expect([...RUN_SOURCE_IDS].sort()).toEqual(["organic", "party"]);
  });
});

test.describe("category enums", () => {
  test("CATEGORY_IDS matches dungeons.json categories", () => {
    const catalogCategoryIds = catalog.categories.map((category) => category.id).sort();
    expect([...CATEGORY_IDS].sort()).toEqual(catalogCategoryIds);
  });

  test("every dungeon uses a known category id", () => {
    for (const dungeon of catalog.dungeons) {
      expect(CATEGORY_IDS).toContain(dungeon.category);
    }
  });
});

test.describe("post-end prompt enums", () => {
  test("POST_END_PROMPTS only uses registered action kinds", () => {
    for (const prompt of Object.values(POST_END_PROMPTS)) {
      for (const action of prompt.actions) {
        expect(POST_END_ACTION_KIND_IDS).toContain(action.kind);
      }
    }
  });
});

test.describe("cross-source enum validation", () => {
  test("catalog and constants stay aligned", () => {
    expect(collectEnumViolations(catalog)).toEqual([]);
  });
});
