export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function parseGroupSizeInput(raw: string, maxPlayers: number): number | null {
  const text = raw.trim();
  if (!text) return null;
  const size = Math.round(Number(text));
  if (!Number.isFinite(size) || size < 1 || size > maxPlayers) return null;
  return size;
}

export function parseFindTimeInput(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  if (text.includes(":")) {
    const [mins, secs] = text.split(":").map((part) => Number(part));
    if (Number.isFinite(mins) && Number.isFinite(secs) && mins >= 0 && secs >= 0) {
      return mins * 60 + secs;
    }
    return null;
  }
  const minutes = Number(text);
  if (Number.isFinite(minutes) && minutes > 0) return Math.round(minutes * 60);
  return null;
}
