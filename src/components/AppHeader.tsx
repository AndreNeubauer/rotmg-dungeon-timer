"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_VERSION, PAGE_ROUTES } from "@/lib/constants";
import { useRuns } from "@/hooks/RunsContext";

const NAV_ITEMS = [
  { id: "timer", href: "/Timer", label: "Timer" },
  { id: "overview", href: "/Overview", label: "Overview" },
  { id: "times", href: "/Times", label: "Times" },
  { id: "leaderboard", href: "/Board", label: "Board" },
  { id: "about", href: "/About", label: "About" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const { ign, promptIgnEdit } = useRuns();

  const cleanPath = pathname.replace(/\/$/, "") || "/";
  const activePage =
    cleanPath === "/" || cleanPath.endsWith("/Timer")
      ? "timer"
      : NAV_ITEMS.find((item) => cleanPath.endsWith(`/${PAGE_ROUTES[item.id]}`))?.id ?? "timer";

  return (
    <header className="mb-7">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <h1 className="m-0 text-[1.35rem] font-semibold">RotMG Timer</h1>
        <div className="flex max-w-[58%] flex-wrap items-center justify-end gap-x-2 gap-y-1.5 text-[0.75rem] text-muted">
          <span className="text-[0.62rem] uppercase tracking-wide">IGN</span>
          <span className="max-w-36 truncate font-medium text-text">{ign || "—"}</span>
          {!ign ? (
            <button
              type="button"
              onClick={promptIgnEdit}
              className="cursor-pointer rounded border border-border px-1.5 py-0.5 text-[0.68rem] text-text hover:border-muted"
            >
              Set IGN
            </button>
          ) : (
            <button
              type="button"
              onClick={promptIgnEdit}
              className="cursor-pointer rounded border border-border px-1.5 py-0.5 text-[0.68rem] text-text hover:border-muted"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      <nav className="flex flex-wrap gap-x-3.5 gap-y-2.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`border-none bg-transparent p-0 text-[1.05rem] no-underline ${
              activePage === item.id ? "text-text" : "text-muted hover:text-text"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <span className="sr-only">v{APP_VERSION}</span>
    </header>
  );
}

export function AppFooter() {
  const { usesBoardStorage } = useRuns();
  return (
    <footer className="relative z-0 mx-auto flex max-w-[var(--content-max)] flex-col items-center gap-0.5 px-4 pb-5 text-center text-[0.65rem] leading-snug text-muted">
      <span>By MeleeOnly with love</span>
      {usesBoardStorage && (
        <span className="text-[0.58rem] opacity-85">Runs sync to the shared board</span>
      )}
      <span className="text-[0.58rem] tabular-nums opacity-80">v{APP_VERSION}</span>
    </footer>
  );
}
