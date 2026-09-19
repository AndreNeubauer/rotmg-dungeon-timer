"use client";

import type { ReactNode } from "react";
import { useRuns } from "@/hooks/RunsContext";

export function CatalogGate({ children }: { children: ReactNode }) {
  const { catalogError } = useRuns();

  if (catalogError) {
    return (
      <div className="py-8">
        <h2 className="mb-2 text-lg font-semibold">RotMG Timer</h2>
        <p className="text-muted">Could not load dungeon list.</p>
        <p className="mt-2 text-[0.85rem] text-muted">
          Open via GitHub Pages or run <code className="text-text">npm run dev</code> locally.
        </p>
      </div>
    );
  }

  return children;
}
