"use client";

import { useEffect, useState } from "react";
import { iconUrlCdn, localIconUrl } from "@/lib/assets";
import type { Dungeon, DungeonCatalog } from "@/lib/types";

interface DungeonIconProps {
  dungeon: Dungeon | null;
  catalog: DungeonCatalog | null;
  className?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
}

export function DungeonIcon({
  dungeon,
  catalog,
  className = "",
  width = 38,
  height = 38,
  lazy = true,
}: DungeonIconProps) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    if (!dungeon || !catalog) {
      setSrc("");
      return;
    }

    const local = localIconUrl(dungeon.id);
    const cdn = iconUrlCdn(catalog.iconBase, dungeon.icon, catalog.fallbackIcon);
    const fallback = iconUrlCdn(catalog.iconBase, catalog.fallbackIcon, catalog.fallbackIcon);

    const img = new Image();
    img.onload = () => setSrc(img.src);
    img.onerror = () => {
      const cdnImg = new Image();
      cdnImg.onload = () => setSrc(cdn);
      cdnImg.onerror = () => setSrc(fallback);
      cdnImg.src = cdn;
    };
    img.src = local;
  }, [dungeon, catalog]);

  if (!dungeon) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      width={width}
      height={height}
      loading={lazy ? "lazy" : "eager"}
      decoding="async"
    />
  );
}
