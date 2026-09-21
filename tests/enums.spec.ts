import { test, expect } from "@playwright/test";
import {
  Outcome,
  OUTCOME_VALUES,
  RunType,
  RUN_TYPE_VALUES,
  PageId,
  PAGE_ID_VALUES,
  PostEndActionKind,
  POST_END_ACTION_KIND_VALUES,
  isOutcome,
  isRunType,
  isPageId,
  isPostEndActionKind,
} from "../src/lib/enums";

test.describe("domain enums", () => {
  test("outcome values are stable and validated", () => {
    expect(OUTCOME_VALUES).toEqual(["complete", "nexus", "died"]);
    expect(isOutcome("complete")).toBe(true);
    expect(isOutcome("invalid")).toBe(false);
    expect(isOutcome(null)).toBe(false);
    expect(Outcome.Complete).toBe("complete");
  });

  test("run type values are stable and validated", () => {
    expect(RUN_TYPE_VALUES).toEqual(["party", "organic"]);
    expect(isRunType(RunType.Party)).toBe(true);
    expect(isRunType("solo")).toBe(false);
  });

  test("page ids match app routes", () => {
    expect(PAGE_ID_VALUES).toContain(PageId.Timer);
    expect(PAGE_ID_VALUES).toContain(PageId.About);
    expect(isPageId("timer")).toBe(true);
    expect(isPageId("settings")).toBe(false);
  });

  test("post-end action kinds are exhaustive", () => {
    expect(POST_END_ACTION_KIND_VALUES).toEqual(["next", "done", "discard"]);
    expect(isPostEndActionKind(PostEndActionKind.Next)).toBe(true);
    expect(isPostEndActionKind("retry")).toBe(false);
  });
});
