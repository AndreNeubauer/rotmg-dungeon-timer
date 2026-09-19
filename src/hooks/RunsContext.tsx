"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { publicUrl } from "@/lib/assets";
import {
  buildDungeonMap,
  getDungeon,
  getDungeonsForCategory,
  getDungeonPlayerMax,
  normalizeRun,
} from "@/lib/dungeons";
import {
  CHAIN_SPAWN_DUNGEONS,
  EXALT_CATEGORY,
  HARD_MODE_DUNGEONS,
  POST_END_PROMPTS,
} from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import {
  fetchBoardClientRunIds,
  isLeaderboardReady,
  loadLeaderboardConfig,
  shareRunToLeaderboard,
} from "@/lib/leaderboard";
import {
  loadLocalRuns,
  loadPendingRuns as loadPendingFromStorage,
  persistLocalRunsToStorage,
  savePendingRuns as savePendingToStorage,
} from "@/lib/run-storage";
import { mergePendingIntoRuns, runsNewestFirst, validateRun } from "@/lib/run-persistence";
import { refreshRunsFromBoard, syncPendingRunsToBoard } from "./runs/boardSync";
import { useIgnModal } from "./useIgnModal";
import type {
  Dungeon,
  DungeonCatalog,
  LeaderboardConfig,
  Outcome,
  PostEndAction,
  Run,
  RunType,
} from "@/lib/types";

interface PendingEndRun {
  runId: string;
  dungeon: Dungeon;
  startedAt: string;
  durationSeconds: number;
}

interface RunsContextValue {
  catalog: DungeonCatalog | null;
  catalogError: boolean;
  runs: Run[];
  leaderboardConfig: LeaderboardConfig;
  usesBoardStorage: boolean;
  ign: string;
  setIgn: (value: string) => void;
  openIgnModal: () => void;
  ignModalOpen: boolean;
  closeIgnModal: () => void;
  ignConfirmRemove: boolean;
  setIgnConfirmRemove: (v: boolean) => void;
  loadDemoRuns: () => Promise<void>;
  selectedDungeonId: string;
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectDungeon: (id: string, opts?: { fromPrompt?: boolean }) => void;
  filteredDungeons: Dungeon[];
  selectedDungeon: Dungeon | null;
  getDungeonById: (id: string) => Dungeon | null;
  isRunning: boolean;
  timerDisplay: string;
  statusMessage: string;
  statusKind: "idle" | "running" | "saved" | "rejected";
  onStart: (opts?: { chained?: boolean; dungeonId?: string }) => void;
  onEnd: () => void;
  onNexus: () => void;
  onDied: () => void;
  postEndPromptVisible: boolean;
  postEndLabel: string;
  postEndActions: PostEndAction[] | null;
  runContextVisible: boolean;
  runContextRunId: string | null;
  handlePostEndAction: (action: PostEndAction) => void;
  finishRunContext: (opts?: {
    runType?: RunType | null;
    findTimeSeconds?: number | null;
    groupSize?: number | null;
    hardMode?: boolean | null;
  }) => void;
  dismissRunContext: () => void;
  selectedRunType: RunType | null;
  setSelectedRunType: (t: RunType | null) => void;
  showSearchTimeForContext: boolean;
  runContextPlayerMax: number;
  runContextShowHardMode: boolean;
  deleteRun: (runId: string) => void;
  refreshFromBoard: () => Promise<void>;
  syncAllRunsToBoard: (opts?: { quiet?: boolean }) => Promise<string>;
  leaderboardStatus: string;
  leaderboardStatusError: boolean;
  exportRuns: () => void;
  importRuns: (file: File) => Promise<void>;
  recentRuns: Run[];
}

const RunsContext = createContext<RunsContextValue | null>(null);

export function RunsProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<DungeonCatalog | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [dungeonById, setDungeonById] = useState<Map<string, Dungeon>>(new Map());
  const [runs, setRuns] = useState<Run[]>([]);
  const [leaderboardConfig, setLeaderboardConfig] = useState<LeaderboardConfig>({
    enabled: false,
    supabaseUrl: "",
    supabaseAnonKey: "",
    table: "leaderboard_runs",
  });
  const {
    ign,
    setIgn,
    modalOpen: ignModalOpen,
    confirmRemove: ignConfirmRemove,
    setConfirmRemove: setIgnConfirmRemove,
    openIgnModal,
    closeIgnModal,
    loadStoredIgn,
  } = useIgnModal();
  const [selectedDungeonId, setSelectedDungeonId] = useState("lost-halls");
  const [selectedCategoryId, setSelectedCategoryId] = useState(EXALT_CATEGORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [timerDisplay, setTimerDisplay] = useState("—");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusKind, setStatusKind] = useState<"idle" | "running" | "saved" | "rejected">("idle");
  const [currentRunChained, setCurrentRunChained] = useState(false);
  const [pendingEndRun, setPendingEndRun] = useState<PendingEndRun | null>(null);
  const [savedRunIdForPrompt, setSavedRunIdForPrompt] = useState<string | null>(null);
  const [postEndPromptConfig, setPostEndPromptConfig] = useState<string | null>(null);
  const [postEndDuration, setPostEndDuration] = useState(0);
  const [postEndSaved, setPostEndSaved] = useState(true);
  const [pendingFindRunId, setPendingFindRunId] = useState<string | null>(null);
  const [findTimeAfterDone, setFindTimeAfterDone] = useState<(() => void) | null>(null);
  const [selectedRunType, setSelectedRunType] = useState<RunType | null>(null);
  const [showSearchTimeForContext, setShowSearchTimeForContext] = useState(true);
  const [leaderboardStatus, setLeaderboardStatus] = useState("");
  const [leaderboardStatusError, setLeaderboardStatusError] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialized = useRef(false);

  const usesBoardStorage = isLeaderboardReady(leaderboardConfig);

  const norm = useCallback(
    (run: Partial<Run> & { dungeon?: string }) => {
      if (!catalog) return run as Run;
      return normalizeRun(catalog, dungeonById, run);
    },
    [catalog, dungeonById]
  );

  const loadPendingRuns = useCallback((): Run[] => {
    return loadPendingFromStorage(norm);
  }, [norm]);

  const savePendingRuns = useCallback((pending: Run[]) => {
    savePendingToStorage(pending);
  }, []);

  const mergePending = useCallback(
    (boardRuns: Run[]) => mergePendingIntoRuns(boardRuns, loadPendingRuns()) as Run[],
    [loadPendingRuns]
  );

  const rememberLocalRun = useCallback(
    (run: Run) => {
      if (!run?.id) return;
      const next = loadPendingRuns().filter((e) => e.id !== run.id);
      next.push(norm(run));
      savePendingRuns(next);
      setRuns((prev) => mergePendingIntoRuns(prev, [norm(run)]) as Run[]);
    },
    [loadPendingRuns, savePendingRuns, norm]
  );

  const forgetPendingRun = useCallback(
    (runId: string) => {
      savePendingRuns(loadPendingRuns().filter((e) => e.id !== runId));
    },
    [loadPendingRuns, savePendingRuns]
  );

  const getIgn = useCallback(() => ign, [ign]);

  const findRunById = useCallback(
    (runId: string | null): Run | null => {
      if (!runId) return null;
      return (
        runs.find((r) => r.id === runId) ||
        loadPendingRuns().find((r) => r.id === runId) ||
        null
      );
    },
    [runs, loadPendingRuns]
  );

  const validationPeerRuns = useCallback(
    (proposedRun: Run) => {
      if (!usesBoardStorage) return runs;
      const tag = (proposedRun.ign || getIgn() || "Anonymous").toLowerCase();
      return runs.filter((run) => (run.ign || "Anonymous").toLowerCase() === tag);
    },
    [usesBoardStorage, runs, getIgn]
  );

  const persistLocalRuns = useCallback(
    (nextRuns: Run[]) => {
      const normalized = nextRuns.map((r) => norm(r));
      if (usesBoardStorage) {
        setRuns(mergePending(normalized));
        return;
      }
      setRuns(normalized);
      persistLocalRunsToStorage(normalized);
    },
    [norm, usesBoardStorage, mergePending]
  );

  const loadDemoRuns = useCallback(async () => {
    try {
      const seedRes = await fetch(publicUrl("runs.json.example"), { cache: "no-store" });
      if (!seedRes.ok) return;
      const seed = await seedRes.json();
      if (!Array.isArray(seed) || seed.length === 0) return;
      persistLocalRuns(seed.map((r) => norm(r)));
    } catch {
      /* ignore */
    }
  }, [norm, persistLocalRuns]);

  const refreshFromBoard = useCallback(async () => {
    if (!isLeaderboardReady(leaderboardConfig)) return;
    try {
      setRuns(await refreshRunsFromBoard(leaderboardConfig, mergePending, norm));
    } catch (err) {
      console.warn("Failed to load runs from board", err);
      setRuns((prev) => mergePending(prev));
    }
  }, [leaderboardConfig, mergePending, norm]);

  const maybeShareRun = useCallback(
    async (runId: string) => {
      const run = findRunById(runId);
      if (!run || !isLeaderboardReady(leaderboardConfig)) return;
      rememberLocalRun(run);
      await shareRunToLeaderboard(leaderboardConfig, run, getIgn());
      await refreshFromBoard();
    },
    [findRunById, leaderboardConfig, rememberLocalRun, getIgn, refreshFromBoard]
  );

  const syncAllRunsToBoard = useCallback(
    async ({ quiet = false } = {}) => {
      if (!isLeaderboardReady(leaderboardConfig)) {
        if (!quiet) {
          setLeaderboardStatus("Leaderboard database is not configured.");
          setLeaderboardStatusError(true);
        }
        return "not-configured";
      }
      const pendingList = loadPendingRuns();
      const boardIds = await fetchBoardClientRunIds(leaderboardConfig);
      const toUpload = [...runs, ...pendingList]
        .filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i)
        .filter((run) => !boardIds.has(run.id));

      if (toUpload.length === 0) {
        if (!quiet) setLeaderboardStatus("All runs are on the leaderboard.");
        setLeaderboardStatusError(false);
        return "done";
      }

      if (!quiet) setLeaderboardStatus(`Saving ${toUpload.length} run(s) to the leaderboard…`);

      const { uploaded, failed } = await syncPendingRunsToBoard(
        leaderboardConfig,
        runs,
        pendingList,
        getIgn
      );

      if (!quiet) {
        setLeaderboardStatus(
          failed
            ? `${uploaded} saved · ${failed} failed`
            : `${uploaded} run(s) saved to the leaderboard.`
        );
        setLeaderboardStatusError(failed > 0);
      }
      await refreshFromBoard();
      return "done";
    },
    [leaderboardConfig, runs, loadPendingRuns, getIgn, refreshFromBoard]
  );

  const showRunRejected = useCallback((message: string) => {
    setStatusMessage(message);
    setStatusKind("rejected");
  }, []);

  const commitRun = useCallback(
    (opts: {
      dungeonId: string;
      dungeonName: string;
      startedAt: string;
      durationSeconds: number;
      outcome?: Outcome;
    }): string | null => {
      const run = norm({
        id: crypto.randomUUID(),
        ...opts,
        outcome: opts.outcome ?? "complete",
        findTimeSeconds: null,
        runType: null,
        groupSize: null,
        hardMode: null,
        ign: getIgn() || null,
      });
      const rejection = validateRun(run, validationPeerRuns(run), { formatDuration });
      if (rejection) {
        showRunRejected(rejection);
        return null;
      }
      setStatusKind("idle");
      const next = [...runs, run];
      rememberLocalRun(run);
      persistLocalRuns(next);
      return run.id;
    },
    [norm, validationPeerRuns, showRunRejected, runs, rememberLocalRun, persistLocalRuns, getIgn]
  );

  const updateRun = useCallback(
    (runId: string, patch: Partial<Run>) => {
      const next = runs.map((run) => (run.id === runId ? norm({ ...run, ...patch }) : run));
      persistLocalRuns(next);
      const updated = next.find((r) => r.id === runId);
      if (updated) rememberLocalRun(updated);
    },
    [runs, norm, persistLocalRuns, rememberLocalRun]
  );

  const setRunMeta = useCallback(
    (
      runId: string,
      meta: {
        runType?: RunType | null;
        findTimeSeconds?: number | null;
        groupSize?: number | null;
        hardMode?: boolean | null;
      }
    ) => {
      const next = runs.map((run) => {
        if (run.id !== runId) return run;
        const updated = { ...run };
        if (meta.runType !== undefined) updated.runType = meta.runType;
        if (meta.findTimeSeconds !== undefined) {
          updated.findTimeSeconds =
            meta.findTimeSeconds != null && meta.findTimeSeconds > 0
              ? Math.round(meta.findTimeSeconds)
              : null;
        }
        if (meta.groupSize !== undefined) {
          updated.groupSize =
            meta.groupSize != null && meta.groupSize >= 1 ? Math.round(meta.groupSize) : null;
        }
        if (meta.hardMode !== undefined) {
          updated.hardMode = meta.hardMode === true ? true : null;
        }
        return norm(updated);
      });
      persistLocalRuns(next);
      const updated = next.find((r) => r.id === runId);
      if (updated) rememberLocalRun(updated);
    },
    [runs, norm, persistLocalRuns, rememberLocalRun]
  );

  const deleteRun = useCallback(
    (runId: string) => {
      forgetPendingRun(runId);
      persistLocalRuns(runs.filter((r) => r.id !== runId));
    },
    [forgetPendingRun, persistLocalRuns, runs]
  );

  const clearPostEnd = useCallback(
    (share = false) => {
      const toShare = share ? pendingEndRun?.runId || savedRunIdForPrompt : null;
      setPendingEndRun(null);
      setSavedRunIdForPrompt(null);
      setPostEndPromptConfig(null);
      if (toShare) void maybeShareRun(toShare);
    },
    [pendingEndRun, savedRunIdForPrompt, maybeShareRun]
  );

  const readyForNextRun = useCallback(() => {
    setTimerDisplay("—");
    setStatusMessage("");
    setStatusKind("idle");
  }, []);

  const shouldOfferSearchTime = useCallback(
    (runId: string, chained = false) => {
      if (!runId || chained) return false;
      const run = findRunById(runId);
      return Boolean(run && !CHAIN_SPAWN_DUNGEONS.has(run.dungeonId));
    },
    [findRunById]
  );

  const offerRunContext = useCallback(
    (runId: string, afterDone: () => void, showSearchTime: boolean) => {
      setPendingFindRunId(runId);
      setFindTimeAfterDone(() => afterDone);
      setSelectedRunType(null);
      setShowSearchTimeForContext(showSearchTime);
      setPostEndPromptConfig(null);
    },
    []
  );

  const finishRunFlow = useCallback(
    (runId: string | null, chained: boolean) => {
      if (!runId) {
        readyForNextRun();
        return;
      }
      offerRunContext(runId, readyForNextRun, shouldOfferSearchTime(runId, chained));
    },
    [readyForNextRun, offerRunContext, shouldOfferSearchTime]
  );

  const finishRunContext = useCallback(
    (opts: {
      runType?: RunType | null;
      findTimeSeconds?: number | null;
      groupSize?: number | null;
      hardMode?: boolean | null;
    } = {}) => {
      const runId = pendingFindRunId;
      const after = findTimeAfterDone;
      setPendingFindRunId(null);
      setFindTimeAfterDone(null);
      setSelectedRunType(null);
      setSavedRunIdForPrompt(null);

      if (runId) {
        setRunMeta(runId, {
          runType: opts.runType ?? selectedRunType,
          findTimeSeconds: opts.findTimeSeconds,
          groupSize: opts.groupSize,
          hardMode: opts.hardMode,
        });
        void maybeShareRun(runId);
      }
      after?.();
    },
    [pendingFindRunId, findTimeAfterDone, selectedRunType, setRunMeta, maybeShareRun]
  );

  const dismissRunContext = useCallback(() => {
    const runId = pendingFindRunId;
    setPendingFindRunId(null);
    setFindTimeAfterDone(null);
    setSelectedRunType(null);
    readyForNextRun();
    if (runId) void maybeShareRun(runId);
  }, [pendingFindRunId, readyForNextRun, maybeShareRun]);

  const selectDungeon = useCallback(
    (id: string, { fromPrompt = false } = {}) => {
      if (startTimeRef.current != null) return;
      if (pendingFindRunId) dismissRunContext();
      if (!fromPrompt) {
        clearPostEnd(true);
        readyForNextRun();
      }
      setSelectedDungeonId(id);
      const dungeon = dungeonById.get(id);
      if (dungeon && dungeon.category !== selectedCategoryId) {
        const alsoIn = dungeon.alsoIn?.includes(selectedCategoryId);
        if (!alsoIn && dungeon.category !== selectedCategoryId) {
          setSelectedCategoryId(dungeon.category);
        }
      }
    },
    [
      pendingFindRunId,
      dismissRunContext,
      clearPostEnd,
      readyForNextRun,
      dungeonById,
      selectedCategoryId,
    ]
  );

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const onStart = useCallback(
    ({ chained = false, dungeonId }: { chained?: boolean; dungeonId?: string } = {}) => {
      if (startTimeRef.current != null) return;
      const id = dungeonId || selectedDungeonId;
      const dungeon = dungeonById.get(id);
      if (!dungeon) return;

      if (pendingFindRunId) dismissRunContext();
      if (!chained) clearPostEnd(true);
      if (id !== selectedDungeonId) {
        setSelectedDungeonId(id);
        if (
          dungeon.category !== selectedCategoryId &&
          !dungeon.alsoIn?.includes(selectedCategoryId)
        ) {
          setSelectedCategoryId(dungeon.category);
        }
      }

      setCurrentRunChained(chained);
      const now = Date.now();
      startTimeRef.current = now;
      setStartTime(now);
      setStatusMessage("Running");
      setStatusKind("running");
      setTimerDisplay("0:00");
      setPostEndPromptConfig(null);
      stopTick();
      tickRef.current = setInterval(() => {
        setTimerDisplay(formatDuration((Date.now() - now) / 1000));
      }, 200);
    },
    [
      pendingFindRunId,
      dismissRunContext,
      clearPostEnd,
      dungeonById,
      selectedDungeonId,
      selectedCategoryId,
      stopTick,
    ]
  );

  const stopAttempt = useCallback(
    (outcome: Outcome, statusMessage: string) => {
      if (startTimeRef.current == null) return;
      const dungeon = dungeonById.get(selectedDungeonId);
      if (!dungeon) return;
      const startedAt = new Date(startTimeRef.current).toISOString();
      const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
      stopTick();
      startTimeRef.current = null;
      setStartTime(null);
      setPendingEndRun(null);
      const runId = commitRun({
        dungeonId: dungeon.id,
        dungeonName: dungeon.name,
        startedAt,
        durationSeconds,
        outcome,
      });
      setStatusMessage(statusMessage);
      setStatusKind("idle");
      setTimerDisplay("—");
      if (runId) finishRunFlow(runId, currentRunChained);
      setCurrentRunChained(false);
    },
    [
      dungeonById,
      selectedDungeonId,
      stopTick,
      commitRun,
      finishRunFlow,
      currentRunChained,
    ]
  );

  const onEnd = useCallback(() => {
    if (startTimeRef.current == null) return;
    const dungeon = dungeonById.get(selectedDungeonId);
    if (!dungeon) return;
    const startedAt = new Date(startTimeRef.current).toISOString();
    const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
    stopTick();
    startTimeRef.current = null;
    setStartTime(null);
    setTimerDisplay(formatDuration(durationSeconds));
    setStatusMessage(formatDuration(durationSeconds));
    setStatusKind("saved");

    const prompt = POST_END_PROMPTS[dungeon.id];
    if (prompt) {
      setSavedRunIdForPrompt(null);
      if (prompt.deferSave) {
        const runId = commitRun({
          dungeonId: dungeon.id,
          dungeonName: dungeon.name,
          startedAt,
          durationSeconds,
        });
        if (!runId) {
          readyForNextRun();
          return;
        }
        setPendingEndRun({ runId, dungeon, startedAt, durationSeconds });
      } else {
        const runId = commitRun({
          dungeonId: dungeon.id,
          dungeonName: dungeon.name,
          startedAt,
          durationSeconds,
        });
        if (!runId) {
          readyForNextRun();
          return;
        }
        setSavedRunIdForPrompt(runId);
      }
      setPostEndPromptConfig(dungeon.id);
      setPostEndDuration(durationSeconds);
      setPostEndSaved(true);
      return;
    }

    const runId = commitRun({
      dungeonId: dungeon.id,
      dungeonName: dungeon.name,
      startedAt,
      durationSeconds,
    });
    if (runId) finishRunFlow(runId, currentRunChained);
    else readyForNextRun();
    setCurrentRunChained(false);
  }, [
    dungeonById,
    selectedDungeonId,
    stopTick,
    commitRun,
    readyForNextRun,
    finishRunFlow,
    currentRunChained,
  ]);

  const handlePostEndAction = useCallback(
    (action: PostEndAction) => {
      let runId = savedRunIdForPrompt;

      if (pendingEndRun) {
        runId = pendingEndRun.runId;
        if (action.kind === "discard") {
          deleteRun(runId);
          setPendingEndRun(null);
          clearPostEnd(false);
          readyForNextRun();
          return;
        }
        if (action.runName) updateRun(runId, { dungeonName: action.runName });
        setPendingEndRun(null);
      }

      if (action.kind === "discard") {
        clearPostEnd(false);
        readyForNextRun();
        return;
      }

      if (action.kind === "next" && action.nextId) {
        clearPostEnd(false);
        onStart({ chained: true, dungeonId: action.nextId });
        if (runId) void maybeShareRun(runId);
        return;
      }

      setPostEndPromptConfig(null);
      setSavedRunIdForPrompt(null);
      if (runId) finishRunFlow(runId, false);
    },
    [
      savedRunIdForPrompt,
      pendingEndRun,
      deleteRun,
      clearPostEnd,
      readyForNextRun,
      updateRun,
      onStart,
      maybeShareRun,
      finishRunFlow,
    ]
  );

  const exportRuns = useCallback(() => {
    const blob = new Blob([`${JSON.stringify(runs, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rotmg-runs-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [runs]);

  const importRuns = useCallback(
    async (file: File) => {
      let imported: unknown;
      try {
        imported = JSON.parse(await file.text());
      } catch {
        window.alert("That file is not valid JSON.");
        return;
      }
      if (!Array.isArray(imported)) {
        window.alert("Expected a JSON array of runs.");
        return;
      }
      const normalized = imported.map((r) => norm(r as Partial<Run>));
      let next = normalized;
      if (runs.length > 0) {
        const merge = window.confirm(
          `Import ${normalized.length} run(s)? OK = merge with your ${runs.length} existing. Cancel = replace all.`
        );
        next = merge ? [...runs, ...normalized] : normalized;
      }
      persistLocalRuns(next);
      await syncAllRunsToBoard({ quiet: true });
      if (usesBoardStorage) await refreshFromBoard();
    },
    [norm, runs, persistLocalRuns, syncAllRunsToBoard, usesBoardStorage, refreshFromBoard]
  );

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      try {
        const res = await fetch(publicUrl("dungeons.json"), { cache: "no-store" });
        if (!res.ok) throw new Error("catalog fetch failed");
        const cat: DungeonCatalog = await res.json();
        setCatalog(cat);
        setDungeonById(buildDungeonMap(cat));
      } catch {
        setCatalogError(true);
        return;
      }

      loadStoredIgn();

      const config = await loadLeaderboardConfig();
      setLeaderboardConfig(config);

      if (isLeaderboardReady(config)) {
        try {
          setRuns(await refreshRunsFromBoard(config, mergePending, norm));
        } catch {
          setRuns((prev) => mergePending(prev));
        }
      } else {
        try {
          const local = loadLocalRuns(norm);
          if (local.length > 0) setRuns(local);
        } catch {
          /* empty */
        }
      }
    }

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => stopTick(), [stopTick]);

  const getDungeonById = useCallback(
    (id: string) => (catalog ? getDungeon(catalog, dungeonById, id) : null),
    [catalog, dungeonById]
  );

  const selectedDungeon = dungeonById.get(selectedDungeonId) ?? null;
  const filteredDungeons = catalog
    ? getDungeonsForCategory(catalog, selectedCategoryId, searchQuery)
    : [];

  const postEndConfig = postEndPromptConfig ? POST_END_PROMPTS[postEndPromptConfig] : null;
  const postEndLabel = postEndConfig
    ? (() => {
        const hint = postEndConfig.hint ? `${postEndConfig.hint} ` : "";
        const lead = postEndSaved
          ? `Saved ${formatDuration(postEndDuration)}`
          : `${formatDuration(postEndDuration)} — choose:`;
        return hint ? `${lead} · ${hint}`.trim() : lead;
      })()
    : "";

  const runContextRun = findRunById(pendingFindRunId);
  const runContextPlayerMax = runContextRun
    ? getDungeonPlayerMax(getDungeonById(runContextRun.dungeonId))
    : 50;

  const value: RunsContextValue = useMemo(
    () => ({
      catalog,
      catalogError,
      runs,
      leaderboardConfig,
      usesBoardStorage,
      ign,
      setIgn,
      openIgnModal,
      ignModalOpen,
      closeIgnModal,
      ignConfirmRemove,
      setIgnConfirmRemove,
      loadDemoRuns,
      selectedDungeonId,
      selectedCategoryId,
      setSelectedCategoryId: (id: string) => {
        if (startTimeRef.current != null) return;
        setSelectedCategoryId(id);
        setSearchQuery("");
      },
      searchQuery,
      setSearchQuery,
      selectDungeon,
      filteredDungeons,
      selectedDungeon,
      getDungeonById,
      isRunning: startTime != null,
      timerDisplay,
      statusMessage,
      statusKind,
      onStart,
      onEnd,
      onNexus: () => stopAttempt("nexus", "Nexus — logged"),
      onDied: () => stopAttempt("died", "Died — logged"),
      postEndPromptVisible: Boolean(postEndConfig && !pendingFindRunId),
      postEndLabel,
      postEndActions: postEndConfig?.actions ?? null,
      runContextVisible: Boolean(pendingFindRunId),
      runContextRunId: pendingFindRunId,
      handlePostEndAction,
      finishRunContext,
      dismissRunContext,
      selectedRunType,
      setSelectedRunType,
      showSearchTimeForContext,
      runContextPlayerMax,
      runContextShowHardMode: Boolean(
        runContextRun && HARD_MODE_DUNGEONS.has(runContextRun.dungeonId)
      ),
      deleteRun,
      refreshFromBoard,
      syncAllRunsToBoard,
      leaderboardStatus,
      leaderboardStatusError,
      exportRuns,
      importRuns,
      recentRuns: runsNewestFirst(runs).slice(0, 6),
    }),
    [
      catalog,
      catalogError,
      runs,
      leaderboardConfig,
      usesBoardStorage,
      ign,
      setIgn,
      openIgnModal,
      ignModalOpen,
      closeIgnModal,
      ignConfirmRemove,
      setIgnConfirmRemove,
      loadDemoRuns,
      selectedDungeonId,
      selectedCategoryId,
      startTime,
      searchQuery,
      selectDungeon,
      filteredDungeons,
      selectedDungeon,
      getDungeonById,
      timerDisplay,
      statusMessage,
      statusKind,
      onStart,
      onEnd,
      stopAttempt,
      postEndConfig,
      pendingFindRunId,
      postEndLabel,
      handlePostEndAction,
      finishRunContext,
      dismissRunContext,
      selectedRunType,
      showSearchTimeForContext,
      runContextRun,
      runContextPlayerMax,
      deleteRun,
      refreshFromBoard,
      syncAllRunsToBoard,
      leaderboardStatus,
      leaderboardStatusError,
      exportRuns,
      importRuns,
    ]
  );

  return <RunsContext.Provider value={value}>{children}</RunsContext.Provider>;
}

export function useRuns() {
  const ctx = useContext(RunsContext);
  if (!ctx) throw new Error("useRuns must be used within RunsProvider");
  return ctx;
}
