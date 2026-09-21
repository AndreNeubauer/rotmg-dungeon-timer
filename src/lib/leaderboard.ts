import { OUTCOMES, RUN_SOURCES, SHARED_RUN_IDS_KEY } from "./constants";
import { publicUrl } from "./assets";
import { getAdminDeleteKey } from "./board-admin";
import type { LeaderboardConfig, Run } from "./types";

export async function loadLeaderboardConfig(): Promise<LeaderboardConfig> {
  try {
    const res = await fetch(publicUrl("leaderboard-config.json"), { cache: "no-store" });
    if (!res.ok) return defaultConfig();
    const data = await res.json();
    if (data && typeof data === "object") {
      return {
        enabled: data.enabled === true,
        supabaseUrl: (data.supabaseUrl || "").replace(/\/$/, ""),
        supabaseAnonKey: data.supabaseAnonKey || "",
        table: data.table || "leaderboard_runs",
      };
    }
  } catch {
    /* missing config */
  }
  return defaultConfig();
}

function defaultConfig(): LeaderboardConfig {
  return { enabled: false, supabaseUrl: "", supabaseAnonKey: "", table: "leaderboard_runs" };
}

export function isLeaderboardReady(config: LeaderboardConfig): boolean {
  return Boolean(config.enabled && config.supabaseUrl && config.supabaseAnonKey);
}

function supabaseHeaders(config: LeaderboardConfig, adminDeleteKey = "") {
  const key = config.supabaseAnonKey;
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (adminDeleteKey) headers["x-admin-key"] = adminDeleteKey;
  return headers;
}

/** PostgREST sends deleted row count in Content-Range (e.g. `* / 1`). 204 with `* / 0` means RLS blocked delete. */
export function parseSupabaseDeleteCount(contentRange: string | null): number | null {
  if (!contentRange) return null;
  const slash = contentRange.lastIndexOf("/");
  if (slash < 0) return null;
  const tail = contentRange.slice(slash + 1).trim();
  if (tail === "*") return null;
  const n = Number(tail);
  return Number.isFinite(n) ? n : null;
}

export async function deleteRunFromLeaderboard(
  config: LeaderboardConfig,
  clientRunId: string,
  adminDeleteKey = getAdminDeleteKey()
): Promise<{ ok: boolean; reason: string }> {
  if (!isLeaderboardReady(config)) return { ok: false, reason: "not-configured" };
  if (!adminDeleteKey) return { ok: false, reason: "no-admin-key" };
  const table = config.table || "leaderboard_runs";
  try {
    const res = await fetch(
      `${config.supabaseUrl}/rest/v1/${table}?client_run_id=eq.${encodeURIComponent(clientRunId)}`,
      {
        method: "DELETE",
        headers: { ...supabaseHeaders(config, adminDeleteKey), Prefer: "count=exact" },
      }
    );
    const deleted = parseSupabaseDeleteCount(res.headers.get("content-range"));
    if (res.ok && deleted === 0) return { ok: false, reason: "forbidden" };
    if (res.ok) return { ok: true, reason: "deleted" };
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "forbidden" };
    return { ok: false, reason: `http-${res.status}` };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export interface BoardRow {
  client_run_id: string;
  dungeon_id: string;
  dungeon_name: string;
  started_at: string;
  duration_seconds: number;
  outcome: string;
  run_type: string | null;
  group_size: number | null;
  hard_mode: boolean | null;
  find_time_seconds: number | null;
  ign: string | null;
}

export function boardRowToRun(row: BoardRow): Partial<Run> {
  return {
    id: row.client_run_id,
    dungeonId: row.dungeon_id,
    dungeonName: row.dungeon_name,
    startedAt: row.started_at,
    durationSeconds: Number(row.duration_seconds),
    outcome: row.outcome as Run["outcome"],
    runType: row.run_type as Run["runType"],
    groupSize: row.group_size,
    hardMode: row.hard_mode,
    findTimeSeconds: row.find_time_seconds,
    ign: row.ign,
  };
}

export function leaderboardWriteBody(run: Run, ign: string) {
  const outcome = run.outcome && OUTCOMES[run.outcome] ? run.outcome : "complete";
  return {
    client_run_id: run.id,
    ign: ign || run.ign || "Anonymous",
    dungeon_id: run.dungeonId,
    dungeon_name: run.dungeonName,
    duration_seconds: run.durationSeconds,
    outcome,
    run_type: run.runType,
    group_size: run.groupSize,
    hard_mode: run.hardMode,
    find_time_seconds: run.findTimeSeconds,
    started_at: run.startedAt,
  };
}

export async function fetchLeaderboardRows(
  config: LeaderboardConfig,
  dungeonId = ""
): Promise<BoardRow[]> {
  const table = config.table || "leaderboard_runs";
  const params = new URLSearchParams({
    select: "*",
    order: "started_at.desc",
    limit: "1000",
  });
  if (dungeonId) params.set("dungeon_id", `eq.${dungeonId}`);

  const res = await fetch(`${config.supabaseUrl}/rest/v1/${table}?${params}`, {
    headers: supabaseHeaders(config),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Leaderboard fetch failed (${res.status})`);
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

export async function fetchBoardClientRunIds(config: LeaderboardConfig): Promise<Set<string>> {
  const table = config.table || "leaderboard_runs";
  const params = new URLSearchParams({ select: "client_run_id", limit: "1000" });
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/${table}?${params}`, {
      headers: supabaseHeaders(config),
      cache: "no-store",
    });
    if (!res.ok) return new Set();
    const rows = await res.json();
    return new Set(
      (Array.isArray(rows) ? rows : [])
        .map((row: { client_run_id?: string }) => row.client_run_id)
        .filter(Boolean) as string[]
    );
  } catch {
    return new Set();
  }
}

export async function patchRunOnLeaderboard(
  config: LeaderboardConfig,
  run: Run,
  ign: string
): Promise<{ ok: boolean; reason: string }> {
  const table = config.table || "leaderboard_runs";
  const body = leaderboardWriteBody(run, ign);
  const patch = { ...body };
  delete (patch as { client_run_id?: string }).client_run_id;
  delete (patch as { started_at?: string }).started_at;
  try {
    const res = await fetch(
      `${config.supabaseUrl}/rest/v1/${table}?client_run_id=eq.${encodeURIComponent(run.id)}`,
      {
        method: "PATCH",
        headers: { ...supabaseHeaders(config), Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      }
    );
    if (res.ok) return { ok: true, reason: "patched" };
    return { ok: false, reason: `http-${res.status}` };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function shareRunToLeaderboard(
  config: LeaderboardConfig,
  run: Run,
  ign: string,
  boardIds?: Set<string>
): Promise<{ ok: boolean; reason: string }> {
  const onBoard = boardIds ?? (await fetchBoardClientRunIds(config));
  if (onBoard.has(run.id)) {
    if (!getSharedRunIds().includes(run.id)) markRunShared(run.id);
    const patched = await patchRunOnLeaderboard(config, run, ign);
    return { ok: true, reason: patched.ok ? "patched" : "already-shared" };
  }

  const table = config.table || "leaderboard_runs";
  const body = leaderboardWriteBody(run, ign);

  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...supabaseHeaders(config), Prefer: "return=minimal" },
      body: JSON.stringify(body),
    });
    if (res.ok || res.status === 409) {
      markRunShared(run.id);
      if (res.status === 409) await patchRunOnLeaderboard(config, run, ign);
      return { ok: true, reason: res.status === 409 ? "duplicate" : "uploaded" };
    }
    return { ok: false, reason: `http-${res.status}` };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export function getSharedRunIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SHARED_RUN_IDS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function markRunShared(runId: string) {
  const ids = new Set(getSharedRunIds());
  ids.add(runId);
  try {
    localStorage.setItem(SHARED_RUN_IDS_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {
    /* ignore */
  }
}

export function formatRunTags(
  row: {
    ign?: string | null;
    runType?: string | null;
    groupSize?: number | null;
    hardMode?: boolean | null;
  },
  { includeIgn = false } = {}
): { type: string; label: string }[] {
  const pills: { type: string; label: string }[] = [];
  if (includeIgn && row.ign) pills.push({ type: "ign-tag", label: row.ign });
  if (row.runType && RUN_SOURCES[row.runType as keyof typeof RUN_SOURCES]) {
    pills.push({
      type: `source-${row.runType}`,
      label: RUN_SOURCES[row.runType as keyof typeof RUN_SOURCES].label,
    });
  }
  if (row.groupSize != null) pills.push({ type: "group-size", label: `${row.groupSize}p` });
  if (row.hardMode) pills.push({ type: "hard-mode", label: "Hard" });
  return pills;
}
