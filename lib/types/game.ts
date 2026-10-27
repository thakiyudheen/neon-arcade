export type GameId =
  | "tic-tac-toe"
  | "connect-four"
  | "rock-paper-scissors"
  | "number-tic-tac-toe";

export type PlayerSlot = 0 | 1;

export type AIDifficulty = "easy" | "medium" | "hard";

export type GameMode = "ai" | "local" | "online";

export type Choice = "rock" | "paper" | "scissors";

export interface RoundOutcome {
  over: boolean;
  winner: PlayerSlot | null;
  draw: boolean;
  winningLine?: number[];
  reason?: string;
}

export interface MoveResult<S> {
  ok: boolean;
  state: S;
  error?: string;
}

export interface GameEngine<S = unknown, M = unknown> {
  id: GameId;
  name: string;
  tagline: string;
  description: string;
  rules: string[];
  simultaneous?: boolean;
  createState(firstPlayer?: PlayerSlot): S;
  applyMove(state: S, player: PlayerSlot, move: M): MoveResult<S>;
  getOutcome(state: S): RoundOutcome;
  getCurrentPlayer(state: S): PlayerSlot | null;
  getValidMoves(state: S, player: PlayerSlot): M[];
  getAIMove(state: S, player: PlayerSlot, difficulty: AIDifficulty): M | null;
  sanitizeState?(state: S, forPlayer: PlayerSlot): S;
  describeMove?(move: M): string;
}

export type AnyGameEngine = GameEngine<any, any>;

export interface PlayerInfo {
  id: string;
  name: string;
  avatarId: string;
  connected: boolean;
}

export interface GuestProfile {
  name: string;
  avatarId: string;
  createdAt: number;
}

export interface AppSettings {
  sound: boolean;
  animations: boolean;
  defaultTarget: number;
  preferredGame: GameId;
}

export interface GameStatEntry {
  wins: number;
  losses: number;
  draws: number;
  matches: number;
}

export type Statistics = Record<GameId, GameStatEntry>;

export interface MatchRecord {
  id: string;
  gameId: GameId;
  mode: "ai" | "local" | "online";
  result: "win" | "loss" | "draw";
  playerScore: number;
  opponentScore: number;
  target: number;
  opponentName: string;
  difficulty?: AIDifficulty;
  playedAt: number;
  durationSec?: number;
}

export interface ChatMessage {
  id: string;
  playerId?: string;
  name: string;
  avatarId?: string;
  text: string;
  timestamp: number;
  kind: "user" | "system" | "reaction";
}

export type RoomStatus = "waiting" | "playing" | "finished";

export interface PublicPlayer extends PlayerInfo {
  slot: PlayerSlot;
}

export interface VoiceParticipant {
  playerId: string;
  name: string;
  muted: boolean;
}

export interface RoomSnapshot {
  roomId: string;
  gameId: GameId;
  targetScore: number;
  hostId: string;
  status: RoomStatus;
  players: PublicPlayer[];
  scores: [number, number];
  round: number;
  state: unknown;
  outcome: RoundOutcome | null;
  matchWinner: PlayerSlot | null;
  rematchVotes: string[];
  chat: ChatMessage[];
  voice: VoiceParticipant[];
  createdAt: number;
  you: { playerId: string; slot: PlayerSlot } | null;
  nextRoundInMs: number | null;
}

export interface AckSuccess {
  ok: true;
  room?: RoomSnapshot;
  playerId?: string;
  roomId?: string;
  token?: string;
}

export interface AckFailure {
  ok: false;
  error: string;
}

export type Ack = AckSuccess | AckFailure;
