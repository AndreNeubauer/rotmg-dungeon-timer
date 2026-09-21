/** Session-only storage for the Supabase admin delete passphrase (not committed to git). */
export const ADMIN_DELETE_KEY_SESSION = "rotmg-timer-admin-delete-key";

export function getAdminDeleteKey(): string {
  if (typeof sessionStorage === "undefined") return "";
  try {
    return sessionStorage.getItem(ADMIN_DELETE_KEY_SESSION) || "";
  } catch {
    return "";
  }
}

export function setAdminDeleteKey(key: string) {
  sessionStorage.setItem(ADMIN_DELETE_KEY_SESSION, key);
}

export function clearAdminDeleteKey() {
  sessionStorage.removeItem(ADMIN_DELETE_KEY_SESSION);
}

export function isBoardAdminUnlocked(): boolean {
  return getAdminDeleteKey().length > 0;
}
