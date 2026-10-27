const KEYS = {
  guestProfile: "mini-games:guest-profile:v1",
  settings: "mini-games:settings:v1",
  statistics: "mini-games:statistics:v1",
  matchHistory: "mini-games:match-history:v1",
  chatHistory: "mini-games:chat-history:v1",
} as const;

type Key = (typeof KEYS)[keyof typeof KEYS];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function safeGetItem(key: Key): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: Key, value: string): boolean {
  if (!isBrowser()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: Key): boolean {
  if (!isBrowser()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: Key): T | null {
  return parseJSON<T>(safeGetItem(key));
}

export function writeJSON<T>(key: Key, value: T): boolean {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function clearAllLocalData(): boolean {
  let ok = true;
  for (const k of Object.values(KEYS)) {
    if (!safeRemoveItem(k)) ok = false;
  }
  return ok;
}

export { KEYS };
