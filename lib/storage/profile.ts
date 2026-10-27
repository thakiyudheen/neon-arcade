import type { AppSettings, GameId, GameStatEntry, GuestProfile, MatchRecord, Statistics } from "../types/game";
import { DEFAULT_SCORE_TARGET } from "../constants";
import { KEYS, readJSON, writeJSON } from "./index";

const AVATAR_IDS = ["nova", "orbit", "pixel", "bolt", "flare", "echo", "glow", "wave"];

const NAMES = [
  "NeonNova",
  "OrbitFox",
  "PixelPulse",
  "BoltByte",
  "FlareFlow",
  "EchoEdge",
  "GlowGrid",
  "WaveWarp",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeGuest(): GuestProfile {
  return {
    name: `${pick(NAMES)}${Math.floor(1000 + Math.random() * 9000)}`,
    avatarId: pick(AVATAR_IDS),
    createdAt: Date.now(),
  };
}

function isGuestProfile(v: unknown): v is GuestProfile {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.name === "string" && o.name.length > 0 && typeof o.avatarId === "string" && typeof o.createdAt === "number";
}

export function getGuestProfile(): GuestProfile {
  const stored = readJSON<unknown>(KEYS.guestProfile);
  if (isGuestProfile(stored)) return stored;
  const fresh = makeGuest();
  writeJSON(KEYS.guestProfile, fresh);
  return fresh;
}

export function setGuestProfile(p: Partial<GuestProfile>): GuestProfile {
  const cur = getGuestProfile();
  const next = { ...cur, ...p };
  if (!isGuestProfile(next)) {
    writeJSON(KEYS.guestProfile, cur);
    return cur;
  }
  writeJSON(KEYS.guestProfile, next);
  return next;
}

function defaultSettings(): AppSettings {
  return {
    sound: true,
    animations: true,
    defaultTarget: DEFAULT_SCORE_TARGET,
    preferredGame: "tic-tac-toe",
  };
}

function isSettings(v: unknown): v is AppSettings {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.sound === "boolean" && typeof o.animations === "boolean" && typeof o.defaultTarget === "number" && typeof o.preferredGame === "string";
}

export function getSettings(): AppSettings {
  const stored = readJSON<unknown>(KEYS.settings);
  if (isSettings(stored)) return stored;
  const d = defaultSettings();
  writeJSON(KEYS.settings, d);
  return d;
}

export function setSettings(s: Partial<AppSettings>): AppSettings {
  const cur = getSettings();
  const next = { ...cur, ...s };
  if (!isSettings(next)) {
    writeJSON(KEYS.settings, cur);
    return cur;
  }
  writeJSON(KEYS.settings, next);
  return next;
}

function defaultStat(): GameStatEntry {
  return { wins: 0, losses: 0, draws: 0, matches: 0 };
}

function emptyStats(): Statistics {
  return {
    "tic-tac-toe": defaultStat(),
    "connect-four": defaultStat(),
    "rock-paper-scissors": defaultStat(),
    "number-tic-tac-toe": defaultStat(),
  };
}

function isStats(v: unknown): v is Statistics {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const ids: GameId[] = ["tic-tac-toe", "connect-four", "rock-paper-scissors", "number-tic-tac-toe"];
  for (const id of ids) {
    const e = o[id] as Record<string, unknown> | undefined;
    if (!e || typeof e.wins !== "number" || typeof e.losses !== "number" || typeof e.draws !== "number" || typeof e.matches !== "number") {
      return false;
    }
  }
  return true;
}

export function getStatistics(): Statistics {
  const stored = readJSON<unknown>(KEYS.statistics);
  if (isStats(stored)) return stored;
  const e = emptyStats();
  writeJSON(KEYS.statistics, e);
  return e;
}

export function updateStatistics(gameId: GameId, result: "win" | "loss" | "draw"): Statistics {
  const cur = getStatistics();
  const entry = cur[gameId] || defaultStat();
  const next: GameStatEntry = { ...entry };
  next.matches += 1;
  if (result === "win") next.wins += 1;
  if (result === "loss") next.losses += 1;
  if (result === "draw") next.draws += 1;
  const stats = { ...cur, [gameId]: next };
  writeJSON(KEYS.statistics, stats);
  return stats;
}

function isMatchRecord(v: unknown): v is MatchRecord {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.gameId === "string" && typeof o.mode === "string" && typeof o.result === "string" && typeof o.playedAt === "number";
}

export function getMatchHistory(): MatchRecord[] {
  const stored = readJSON<unknown>(KEYS.matchHistory);
  if (!Array.isArray(stored)) return [];
  const filtered = stored.filter(isMatchRecord);
  return filtered.slice(0, 50);
}

export function addMatchRecord(rec: MatchRecord): MatchRecord[] {
  const cur = getMatchHistory();
  const next = [rec, ...cur].slice(0, 50);
  writeJSON(KEYS.matchHistory, next);
  return next;
}

export function resetAllLocal(): boolean {
  const { clearAllLocalData } = require("./index");
  return clearAllLocalData();
}
