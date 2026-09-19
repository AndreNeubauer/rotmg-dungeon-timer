/** @file Cross-source enum consistency checks used in tests and CI. */

import {
  CATEGORY_IDS,
  CATEGORY_TAB_LABELS,
  CHAIN_SPAWN_DUNGEONS,
  HARD_MODE_DUNGEONS,
  OUTCOME_IDS,
  PAGE_ROUTE_SEGMENTS,
  POST_END_ACTION_KIND_IDS,
  POST_END_PROMPTS,
  ROUTE_SEGMENT_TO_PAGE,
  RUN_SOURCE_IDS,
  TAB_ROUTE_SEGMENTS,
} from "./constants.js";

/**
 * @param {object} catalog
 * @returns {string[]}
 */
export function collectEnumViolations(catalog) {
  const violations = [];
  const dungeonIds = new Set((catalog.dungeons || []).map((dungeon) => dungeon.id));
  const catalogCategoryIds = new Set((catalog.categories || []).map((category) => category.id));

  for (const pageId of Object.keys(PAGE_ROUTE_SEGMENTS)) {
    const segment = PAGE_ROUTE_SEGMENTS[pageId];
    if (ROUTE_SEGMENT_TO_PAGE[segment] !== pageId) {
      violations.push(`PAGE_ROUTE_SEGMENTS.${pageId} ↔ ROUTE_SEGMENT_TO_PAGE mismatch`);
    }
  }

  for (const segment of TAB_ROUTE_SEGMENTS) {
    if (!ROUTE_SEGMENT_TO_PAGE[segment]) {
      violations.push(`TAB_ROUTE_SEGMENTS contains unmapped segment: ${segment}`);
    }
  }

  for (const categoryId of CATEGORY_IDS) {
    if (!catalogCategoryIds.has(categoryId)) {
      violations.push(`CATEGORY_TAB_LABELS.${categoryId} missing from dungeons.json categories`);
    }
    if (CATEGORY_TAB_LABELS[categoryId] == null) {
      violations.push(`dungeons.json category ${categoryId} missing from CATEGORY_TAB_LABELS`);
    }
  }

  for (const categoryId of catalogCategoryIds) {
    if (!CATEGORY_TAB_LABELS[categoryId]) {
      violations.push(`dungeons.json category ${categoryId} missing from CATEGORY_TAB_LABELS`);
    }
  }

  for (const dungeon of catalog.dungeons || []) {
    if (!CATEGORY_IDS.includes(dungeon.category)) {
      violations.push(`Dungeon ${dungeon.id} has unknown category: ${dungeon.category}`);
    }
  }

  for (const dungeonId of CHAIN_SPAWN_DUNGEONS) {
    if (!dungeonIds.has(dungeonId)) {
      violations.push(`CHAIN_SPAWN_DUNGEONS references unknown dungeon: ${dungeonId}`);
    }
  }

  for (const dungeonId of HARD_MODE_DUNGEONS) {
    if (!dungeonIds.has(dungeonId)) {
      violations.push(`HARD_MODE_DUNGEONS references unknown dungeon: ${dungeonId}`);
    }
  }

  for (const [promptDungeonId, prompt] of Object.entries(POST_END_PROMPTS)) {
    if (!dungeonIds.has(promptDungeonId)) {
      violations.push(`POST_END_PROMPTS key is not a dungeon id: ${promptDungeonId}`);
    }
    for (const action of prompt.actions || []) {
      if (!POST_END_ACTION_KIND_IDS.includes(action.kind)) {
        violations.push(
          `POST_END_PROMPTS.${promptDungeonId} has invalid action kind: ${action.kind}`
        );
      }
      if (action.kind === "next" && action.nextId && !dungeonIds.has(action.nextId)) {
        violations.push(
          `POST_END_PROMPTS.${promptDungeonId} nextId not in catalog: ${action.nextId}`
        );
      }
    }
  }

  return violations;
}

export const DB_OUTCOME_IDS = ["complete", "nexus", "died"];
export const DB_RUN_SOURCE_IDS = ["party", "organic"];

/** @returns {string[]} */
export function collectDatabaseEnumViolations() {
  const violations = [];

  for (const outcome of OUTCOME_IDS) {
    if (!DB_OUTCOME_IDS.includes(outcome)) {
      violations.push(`OUTCOMES.${outcome} missing from database CHECK constraint`);
    }
  }
  for (const outcome of DB_OUTCOME_IDS) {
    if (!OUTCOME_IDS.includes(outcome)) {
      violations.push(`Database outcome ${outcome} missing from OUTCOMES constant`);
    }
  }

  for (const source of RUN_SOURCE_IDS) {
    if (!DB_RUN_SOURCE_IDS.includes(source)) {
      violations.push(`RUN_SOURCES.${source} missing from database CHECK constraint`);
    }
  }
  for (const source of DB_RUN_SOURCE_IDS) {
    if (!RUN_SOURCE_IDS.includes(source)) {
      violations.push(`Database run_type ${source} missing from RUN_SOURCES constant`);
    }
  }

  return violations;
}
