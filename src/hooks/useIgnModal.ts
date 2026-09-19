"use client";

import { useCallback, useState } from "react";
import { IGN_STORAGE_KEY } from "@/lib/constants";

export function useIgnModal() {
  const [ign, setIgnState] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const setIgn = useCallback((value: string) => {
    const trimmed = value.trim().slice(0, 32);
    if (!trimmed) localStorage.removeItem(IGN_STORAGE_KEY);
    else localStorage.setItem(IGN_STORAGE_KEY, trimmed);
    setIgnState(trimmed);
    setConfirmRemove(false);
  }, []);

  const openIgnModal = useCallback(() => {
    setConfirmRemove(false);
    setModalOpen(true);
  }, []);

  const closeIgnModal = useCallback(() => {
    setModalOpen(false);
    setConfirmRemove(false);
  }, []);

  const loadStoredIgn = useCallback(() => {
    try {
      const stored = localStorage.getItem(IGN_STORAGE_KEY)?.trim() || "";
      setIgnState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    ign,
    setIgn,
    modalOpen,
    confirmRemove,
    setConfirmRemove,
    openIgnModal,
    closeIgnModal,
    loadStoredIgn,
  };
}
