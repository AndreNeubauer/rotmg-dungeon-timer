/** Shared string enums (const objects) and runtime validators for persisted / API data. */

export const Outcome = {
  Complete: "complete",
  Nexus: "nexus",
  Died: "died",
} as const;

export type Outcome = (typeof Outcome)[keyof typeof Outcome];

export const OUTCOME_VALUES: readonly Outcome[] = Object.values(Outcome);

export function isOutcome(value: unknown): value is Outcome {
  return typeof value === "string" && (OUTCOME_VALUES as readonly string[]).includes(value);
}

export const RunType = {
  Party: "party",
  Organic: "organic",
} as const;

export type RunType = (typeof RunType)[keyof typeof RunType];

export const RUN_TYPE_VALUES: readonly RunType[] = Object.values(RunType);

export function isRunType(value: unknown): value is RunType {
  return typeof value === "string" && (RUN_TYPE_VALUES as readonly string[]).includes(value);
}

export const PageId = {
  Timer: "timer",
  Overview: "overview",
  Times: "times",
  Leaderboard: "leaderboard",
  About: "about",
} as const;

export type PageId = (typeof PageId)[keyof typeof PageId];

export const PAGE_ID_VALUES: readonly PageId[] = Object.values(PageId);

export function isPageId(value: unknown): value is PageId {
  return typeof value === "string" && (PAGE_ID_VALUES as readonly string[]).includes(value);
}

export const PostEndActionKind = {
  Next: "next",
  Done: "done",
  Discard: "discard",
} as const;

export type PostEndActionKind = (typeof PostEndActionKind)[keyof typeof PostEndActionKind];

export const POST_END_ACTION_KIND_VALUES: readonly PostEndActionKind[] =
  Object.values(PostEndActionKind);

export function isPostEndActionKind(value: unknown): value is PostEndActionKind {
  return (
    typeof value === "string" &&
    (POST_END_ACTION_KIND_VALUES as readonly string[]).includes(value)
  );
}
