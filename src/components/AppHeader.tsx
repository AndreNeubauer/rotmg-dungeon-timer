"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_VERSION, LIVE_URL, PAGE_ROUTES, REPO_URL } from "@/lib/constants";
import { useRuns } from "@/hooks/RunsContext";
import { BoardAdminUnlock } from "./BoardAdminUnlock";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS = [
  { id: "timer", href: "/timer", label: "Timer" },
  { id: "overview", href: "/overview", label: "Overview" },
  { id: "times", href: "/times", label: "Times" },
  { id: "leaderboard", href: "/leaderboard", label: "Leaderboard" },
  { id: "about", href: "/about", label: "About" },
] as const;

function resolveActivePage(pathname: string): string {
  const clean = pathname.replace(/\/$/, "") || "/";
  if (clean === "/" || clean.endsWith("/timer")) return "timer";
  const match = NAV_ITEMS.find((item) => clean.endsWith(`/${PAGE_ROUTES[item.id]}`));
  return match?.id ?? "timer";
}

export function AppHeader() {
  const pathname = usePathname();
  const { ign, openIgnModal } = useRuns();
  const activePage = resolveActivePage(pathname);

  return (
    <header className="mb-7">
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-[1.35rem] font-semibold">
            <Link href="/" className="text-text no-underline hover:opacity-90">
              RotMG Dungeon Timer
            </Link>
          </h1>
          <p className="mt-0.5 text-[0.72rem] text-muted">Track clears, stats &amp; leaderboard</p>
        </div>
        <div className="flex max-w-[58%] flex-col items-end gap-1.5">
          <ThemeToggle />
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-[0.75rem] text-muted">
            <BoardAdminUnlock />
            <span className="text-[0.62rem] uppercase tracking-wide">IGN</span>
            <span className="max-w-36 truncate font-medium text-text">{ign || "—"}</span>
            <button
              type="button"
              onClick={openIgnModal}
              className="cursor-pointer rounded border border-border px-1.5 py-0.5 text-[0.68rem] text-text hover:border-muted"
            >
              {ign ? "Edit" : "Set IGN"}
            </button>
          </div>
        </div>
      </div>
      <nav className="flex flex-wrap gap-x-3.5 gap-y-2.5" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={activePage === item.id ? "page" : undefined}
            className={`border-none bg-transparent p-0 text-[1.05rem] no-underline ${
              activePage === item.id
                ? "font-medium text-text underline decoration-border underline-offset-4"
                : "text-muted hover:text-text"
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
    <footer className="relative z-0 mx-auto flex max-w-[var(--content-max)] flex-col items-center gap-1 px-4 pb-5 text-center text-[0.65rem] leading-snug text-muted">
      <span>
        Built by{" "}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-text hover:underline">
          Andre Neubauer
        </a>
      </span>
      <span>
        <a href={LIVE_URL} className="hover:text-text hover:underline">
          Live demo
        </a>
        {" · "}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-text hover:underline">
          Source
        </a>
      </span>
      {usesBoardStorage && (
        <span className="text-[0.58rem] opacity-85">Runs sync to the shared leaderboard</span>
      )}
      <span className="text-[0.58rem] tabular-nums opacity-80">v{APP_VERSION}</span>
    </footer>
  );
}
