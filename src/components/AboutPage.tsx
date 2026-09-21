import { LIVE_URL, REPO_URL } from "@/lib/constants";

export function AboutPage() {
  return (
    <article className="max-w-none text-[0.9rem] leading-relaxed text-text">
      <h2 className="mb-2 text-[1rem] font-semibold">What this is</h2>
      <p className="mb-5 text-muted">
        A dungeon timer for <strong className="text-text">Realm of the Mad God</strong> that tracks
        how long exalting and other runs actually take. Review stats and compete on a shared
        leaderboard.
      </p>

      <h2 className="mb-2 text-[1rem] font-semibold">Tech stack</h2>
      <ul className="mb-5 list-disc space-y-1 pl-5 text-muted">
        <li>
          <strong className="text-text">Next.js 15</strong> — App Router, static export for GitHub
          Pages
        </li>
        <li>
          <strong className="text-text">React 19 + TypeScript</strong> — typed components and domain
          logic
        </li>
        <li>
          <strong className="text-text">Tailwind CSS 4</strong> — dark/light themes
        </li>
        <li>
          <strong className="text-text">Supabase</strong> — optional shared run log (Postgres +
          row-level security)
        </li>
        <li>
          <strong className="text-text">GitHub Actions</strong> — test gate + automated deploy
        </li>
      </ul>

      <h2 className="mb-2 text-[1rem] font-semibold">Architecture</h2>
      <p className="mb-3 text-muted">
        The app is a static site. Runs save to browser storage locally, or sync to Supabase when
        configured. Times and Leaderboard read from the same data — newest first vs fastest first.
      </p>
      <pre className="mb-5 overflow-x-auto rounded-md border border-border bg-panel p-3 text-[0.72rem] text-muted">
        {`Browser (timer + localStorage)
    ↓ optional sync
Supabase (shared leaderboard_runs)
    ↓ static fetch
GitHub Pages (Next.js export)`}
      </pre>

      <h2 className="mb-2 text-[1rem] font-semibold">How to use</h2>
      <ol className="mb-5 list-decimal space-y-1 pl-5 text-muted">
        <li>
          Pick a dungeon on <strong className="text-text">Timer</strong>, hit{" "}
          <strong className="text-text">Start</strong> when you enter,{" "}
          <strong className="text-text">End</strong> when you finish.
        </li>
        <li>
          Keyboard: <strong className="text-text">Space</strong> or{" "}
          <strong className="text-text">S</strong> to start/end,{" "}
          <strong className="text-text">E</strong>/<strong className="text-text">N</strong>/
          <strong className="text-text">D</strong> for End/Nexus/Died while running.
        </li>
        <li>After a clear, optionally log party/organic, group size, and search time.</li>
      </ol>

      <h2 className="mb-2 text-[1rem] font-semibold">Tabs</h2>
      <ul className="mb-5 list-disc space-y-1 pl-5 text-muted">
        <li>
          <strong className="text-text">Overview</strong> — exalt summary, best/avg times, recent
          runs.
        </li>
        <li>
          <strong className="text-text">Times</strong> — full log with filters and per-dungeon
          averages.
        </li>
        <li>
          <strong className="text-text">Leaderboard</strong> — same runs, sorted by fastest clear.
        </li>
      </ul>

      <h2 className="mb-2 text-[1rem] font-semibold">Links</h2>
      <ul className="mb-5 list-disc space-y-1 pl-5 text-muted">
        <li>
          <a href={LIVE_URL} className="text-text underline decoration-border hover:decoration-muted">
            Live demo
          </a>
        </li>
        <li>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text underline decoration-border hover:decoration-muted"
          >
            Source on GitHub
          </a>
        </li>
      </ul>

      <p className="text-[0.78rem] text-muted">
        Built by{" "}
        <a
          href="https://github.com/AndreNeubauer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text underline decoration-border hover:decoration-muted"
        >
          Andre Neubauer
        </a>{" "}
        — for figuring out how long exalting really takes.
      </p>
    </article>
  );
}
