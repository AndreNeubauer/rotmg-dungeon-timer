"use client";

import { useEffect, useRef, useState } from "react";
import { useRuns } from "@/hooks/RunsContext";

export function IgnModal() {
  const { ign, setIgn, ignModalOpen, closeIgnModal, ignConfirmRemove, setIgnConfirmRemove } =
    useRuns();
  const [draft, setDraft] = useState(ign);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ignModalOpen) {
      setDraft(ign);
      setIgnConfirmRemove(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [ignModalOpen, ign, setIgnConfirmRemove]);

  if (!ignModalOpen) return null;

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed && ign) {
      setIgnConfirmRemove(true);
      return;
    }
    setIgn(trimmed);
    closeIgnModal();
  }

  function handleRemove() {
    setIgn("");
    closeIgnModal();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={closeIgnModal}
    >
      <div
        role="dialog"
        aria-labelledby="ign-modal-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ign-modal-title" className="mb-1 text-[1rem] font-semibold">
          In-game name
        </h2>
        <p className="mb-3 text-[0.78rem] text-muted">
          Optional tag on runs you log. Not required to view anything.
        </p>

        {ignConfirmRemove ? (
          <div>
            <p className="mb-3 text-[0.85rem]">Remove your IGN?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIgnConfirmRemove(false)}
                className="cursor-pointer rounded border border-border px-3 py-1.5 text-[0.8rem] text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="cursor-pointer rounded border border-red bg-[color-mix(in_srgb,var(--red)_15%,var(--surface))] px-3 py-1.5 text-[0.8rem] text-text"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              maxLength={32}
              placeholder="Your IGN"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") closeIgnModal();
              }}
              className="mb-3 w-full rounded border border-border bg-bg px-2.5 py-2 text-[0.9rem] text-text focus:border-muted focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeIgnModal}
                className="cursor-pointer rounded border border-border px-3 py-1.5 text-[0.8rem] text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="cursor-pointer rounded border border-green bg-[color-mix(in_srgb,var(--green)_18%,var(--surface))] px-3 py-1.5 text-[0.8rem] text-text"
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
