"use client";

import { useCallback, useState } from "react";
import { clearAdminDeleteKey, setAdminDeleteKey } from "@/lib/board-admin";
import { useRuns } from "@/hooks/RunsContext";

export function BoardAdminUnlock() {
  const { usesBoardStorage, boardAdminUnlocked, setBoardAdminUnlocked } = useRuns();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const close = useCallback(() => {
    setOpen(false);
    setDraft("");
    setError("");
  }, []);

  if (!usesBoardStorage) return null;

  if (boardAdminUnlocked && !open) {
    return (
      <button
        type="button"
        onClick={() => {
          clearAdminDeleteKey();
          setBoardAdminUnlocked(false);
        }}
        className="cursor-pointer text-[0.65rem] text-muted hover:text-text"
        title="Stop allowing shared run deletes in this browser tab"
      >
        Lock admin
      </button>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-[0.65rem] text-muted hover:text-text"
        title="Enter your delete passphrase to remove rows from the shared log"
      >
        Admin delete
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center justify-end gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const key = draft.trim();
        if (!key) {
          setError("Enter your passphrase.");
          return;
        }
        setAdminDeleteKey(key);
        setBoardAdminUnlocked(true);
        close();
      }}
    >
      <label className="sr-only" htmlFor="board-admin-key">
        Admin delete passphrase
      </label>
      <input
        id="board-admin-key"
        type="password"
        autoComplete="off"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError("");
        }}
        placeholder="Delete passphrase"
        className="max-w-[9rem] rounded border border-border bg-surface px-1.5 py-0.5 text-[0.68rem] text-text"
      />
      <button
        type="submit"
        className="cursor-pointer rounded border border-border px-1.5 py-0.5 text-[0.68rem] text-text hover:border-muted"
      >
        Unlock
      </button>
      <button
        type="button"
        onClick={close}
        className="cursor-pointer text-[0.65rem] text-muted hover:text-text"
      >
        Cancel
      </button>
      {error && <span className="w-full text-[0.62rem] text-red">{error}</span>}
    </form>
  );
}
