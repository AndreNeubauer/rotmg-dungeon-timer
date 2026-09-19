export function AboutPage() {
  return (
    <article className="prose prose-invert max-w-none text-[0.9rem] leading-relaxed text-text">
      <h2 className="mb-2 text-[1rem] font-semibold">What this is</h2>
      <p className="mb-5 text-muted">
        A simple dungeon timer for <strong className="text-text">Realm of the Mad God</strong>,
        built to track how long exalting and other runs actually take. Personal stats stay in your
        browser; optional shared leaderboard when Supabase is configured.
      </p>

      <h2 className="mb-2 text-[1rem] font-semibold">How to use</h2>
      <ol className="mb-5 list-decimal space-y-1 pl-5 text-muted">
        <li>
          Pick a dungeon on <strong className="text-text">Timer</strong>, hit{" "}
          <strong className="text-text">Start</strong> when you enter,{" "}
          <strong className="text-text">End</strong> when you finish.
        </li>
        <li>
          Use <strong className="text-text">Nexus</strong> or{" "}
          <strong className="text-text">Died</strong> if the run did not clear.
        </li>
        <li>After a clear, optionally log party/organic, group size, and search time.</li>
      </ol>

      <h2 className="mb-2 text-[1rem] font-semibold">Tabs</h2>
      <ul className="mb-5 list-disc space-y-1 pl-5 text-muted">
        <li>
          <strong className="text-text">Overview</strong> — exalt summary, best/avg times, recent
          runs at a glance.
        </li>
        <li>
          <strong className="text-text">Times</strong> — full log with filters and per-dungeon
          averages.
        </li>
        <li>
          <strong className="text-text">Board</strong> — same runs as Times, sorted by fastest
          clear.
        </li>
      </ul>

      <h2 className="mb-2 text-[1rem] font-semibold">Data</h2>
      <ul className="mb-5 list-disc space-y-1 pl-5 text-muted">
        <li>
          <strong className="text-text">Hosted site</strong> — runs save to the shared log
          automatically. Times and Board match.
        </li>
        <li>
          <strong className="text-text">Local dev</strong> (<code className="text-text">npm run dev</code>
          ) — uses browser storage when no board is configured.
        </li>
        <li>
          <strong className="text-text">IGN</strong> — optional tag on runs you log; not required to
          view anything.
        </li>
      </ul>

      <p className="text-[0.78rem] text-muted">By MeleeOnly with love — for figuring out how long exalting really takes.</p>
    </article>
  );
}
