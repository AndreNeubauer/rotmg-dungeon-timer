"use client";

import { useEffect } from "react";

interface TimerKeyboardHandlers {
  isRunning: boolean;
  canStart: boolean;
  onStart: () => void;
  onEnd: () => void;
  onNexus: () => void;
  onDied: () => void;
}

export function useTimerKeyboard({
  isRunning,
  canStart,
  onStart,
  onEnd,
  onNexus,
  onDied,
}: TimerKeyboardHandlers) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === " " || key === "s") {
        e.preventDefault();
        if (isRunning) onEnd();
        else if (canStart) onStart();
        return;
      }
      if (!isRunning) return;
      if (key === "e") {
        e.preventDefault();
        onEnd();
      } else if (key === "n") {
        e.preventDefault();
        onNexus();
      } else if (key === "d") {
        e.preventDefault();
        onDied();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRunning, canStart, onStart, onEnd, onNexus, onDied]);
}
