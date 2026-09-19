export function publicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const clean = path.replace(/^\//, "");
  return base ? `${base}/${clean}` : `/${clean}`;
}

export function iconUrlCdn(
  iconBase: string,
  icon: string | undefined,
  fallbackIcon: string
): string {
  const file = icon || fallbackIcon;
  return `${iconBase}${encodeURIComponent(file)}`;
}

export function localIconUrl(dungeonId: string): string {
  return publicUrl(`icons/${dungeonId}.png`);
}
