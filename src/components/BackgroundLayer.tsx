"use client";

import { useEffect, useState } from "react";
import { publicUrl } from "@/lib/assets";

export function BackgroundLayer() {
  const [bgUrl, setBgUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(publicUrl("exalt-backgrounds.json"), { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const files = [
          ...new Set(
            (data.backgrounds || [])
              .map((entry: { file?: string }) => entry.file)
              .filter(Boolean) as string[]
          ),
        ];
        if (!files.length) return;
        const pick = files[Math.floor(Math.random() * files.length)];
        setBgUrl(publicUrl(`backgrounds/${pick}`));
      } catch {
        /* solid bg only */
      }
    }
    void load();
  }, []);

  const style = bgUrl ? { backgroundImage: `url("${bgUrl}")` } : undefined;

  return (
    <>
      <div className="bg-layer" style={style} aria-hidden="true" />
      <div className="bg-blur" style={style} aria-hidden="true" />
      <div className="bg-scrim" aria-hidden="true" />
    </>
  );
}
