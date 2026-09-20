export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto" aria-busy="true" aria-label="Loading">
      <div className="mb-2 grid gap-2 border-b border-border pb-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="grid gap-2 border-b border-border/40 py-2.5"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, col) => (
            <div key={col} className="skeleton h-4" style={{ width: col === 0 ? "60%" : "40%" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-md border border-border bg-panel p-3 text-center">
          <div className="skeleton mx-auto mb-2 h-6 w-12" />
          <div className="skeleton mx-auto h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
