"use client";

import { useTheme, type Theme } from "@/hooks/useTheme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "Auto" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Color theme">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={`cursor-pointer rounded border px-1.5 py-0.5 text-[0.62rem] ${
            theme === value
              ? "border-muted text-text"
              : "border-transparent text-muted hover:border-border hover:text-text"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
