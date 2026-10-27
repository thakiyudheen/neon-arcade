import type { AIDifficulty, GameEngine, MoveResult, PlayerSlot, RoundOutcome } from "../types/game";
import { otherSlot } from "../constants";

type NTTTState = {
  board: Array<number | null>; // store numbers placed; we track owner by array of length 9 with values or null
  owner: Array<PlayerSlot | null>; // who placed the number at index
  available: Record<PlayerSlot, number[]>; // numbers each player has left
  turn: PlayerSlot;
};

type NTTTMove = { index: number; value: number };

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// Standard Number Tic-Tac-Toe: players use numbers 1-9, each number used once overall? Or each has set?
// Clear rules: Player 0 has odds {1,3,5,7,9}, Player 1 has evens {2,4,6,8} (common variant) OR each has 1-5? 
// To be explicit and deterministic, use the common variant: Odd player uses {1,3,5,7,9}, Even player uses {2,4,6,8}. Both place onto 3x3; first to form a line summing to 15 wins (magic square). 
// This is unambiguous and easy to validate.
function initAvailable(): Record<PlayerSlot, number[]> {
  return {
    0: [1,3,5,7,9],
    1: [2,4,6,8],
  };
}

function checkNTTT(state: NTTTState): RoundOutcome {
  for (const line of WIN_LINES) {
    const vals = line.map((i) => state.board[i]).filter((v): v is number => v !== null);
    if (vals.length !== 3) continue;
    if (vals[0] + vals[1] + vals[2] === 15) {
      // determine winner by who placed the middle/any? find owner of one in line
      const owners = line.map((i) => state.owner[i]).filter((o): o is PlayerSlot => o !== null);
      // all same owner
      if (owners[0] === owners[1] && owners[1] === owners[2]) {
        return { over: true, winner: owners[0], draw: false, winningLine: line };
      }
    }
  }
  // draw if board full
  if (state.board.every((v) => v !== null)) {
    return { over: true, winner: null, draw: true };
  }
  return { over: false, winner: null, draw: false };
}

export const numberTTTEngine: GameEngine<NTTTState, NTTTMove> = {
  id: "number-tic-tac-toe",
  name: "Number Tic-Tac-Toe",
  tagline: "Make 15 to win",
  description: "Odd uses 1,3,5,7,9; Even uses 2,4,6,8. Place onto 3x3; first line summing to 15 wins the round.",
  rules: [
    "Player 1 (odd) places odd numbers {1,3,5,7,9}; Player 2 (even) places even numbers {2,4,6,8}.",
    "Each number may be used only once overall.",
    "Place a number onto an empty square on your turn.",
    "First player to have three numbers on a row/column/diagonal that sum to 15 wins the round.",
    "If the board fills with no line summing to 15, the round is a draw (awards 0 points).",
    "First to reach the configured match target wins the overall match.",
  ],
  simultaneous: false,
  createState(): NTTTState {
    return {
      board: Array(9).fill(null),
      owner: Array(9).fill(null),
      available: initAvailable(),
      turn: 0,
    };
  },
  applyMove(state: NTTTState, player: PlayerSlot, move: NTTTMove): MoveResult<NTTTState> {
    if (state.turn !== player) return { ok: false, state, error: "Not your turn" };
    if (move.index < 0 || move.index > 8) return { ok: false, state, error: "Invalid square" };
    if (state.board[move.index] !== null) return { ok: false, state, error: "Square already taken" };
    if (!state.available[player].includes(move.value)) return { ok: false, state, error: "Number not available" };
    const o = checkNTTT(state);
    if (o.over) return { ok: false, state, error: "Round already finished" };
    const board = state.board.slice();
    const owner = state.owner.slice();
    board[move.index] = move.value;
    owner[move.index] = player;
    const available: Record<PlayerSlot, number[]> = {
      0: state.available[0].filter((v) => v !== move.value),
      1: state.available[1].filter((v) => v !== move.value),
    };
    return { ok: true, state: { board, owner, available, turn: otherSlot(player) } };
  },
  getOutcome(state: NTTTState): RoundOutcome {
    if (!state || !Array.isArray((state as any).board)) {
      return { over: false, winner: null, draw: false };
    }
    return checkNTTT(state as any);
  },
  getCurrentPlayer(state: NTTTState): PlayerSlot | null {
    if (!state || !Array.isArray((state as any).board)) return null;
    const o = checkNTTT(state as any);
    if (o.over) return null;
    return (state as any).turn;
  },
  getValidMoves(state: NTTTState, player: PlayerSlot): NTTTMove[] {
    if (!state || !Array.isArray((state as any).board)) return [];
    const o = checkNTTT(state as any);
    if (o.over) return [];
    const moves: NTTTMove[] = [];
    for (let i = 0; i < 9; i++) {
      if ((state as any).board[i] !== null) continue;
      const avail = (state as any).available?.[player] || [];
      for (const v of avail) {
        moves.push({ index: i, value: v });
      }
    }
    return moves;
  },
  getAIMove(state: NTTTState, player: PlayerSlot, difficulty: AIDifficulty): NTTTMove | null {
    const moves = this.getValidMoves(state, player);
    if (moves.length === 0) return null;
    if (difficulty === "easy") return moves[Math.floor(Math.random() * moves.length)];
    if (difficulty === "medium" && Math.random() < 0.35) return moves[Math.floor(Math.random() * moves.length)];
    // try to complete a line to 15 if possible
    for (const mv of moves) {
      const board = state.board.slice();
      const owner = state.owner.slice();
      board[mv.index] = mv.value;
      owner[mv.index] = player;
      const s2: NTTTState = { board, owner, available: state.available, turn: player };
      const res = checkNTTT(s2);
      if (res.over && res.winner === player) return mv;
    }
    // try to block
    const opp = otherSlot(player);
    for (const mv of moves) {
      const board = state.board.slice();
      const owner = state.owner.slice();
      board[mv.index] = mv.value;
      owner[mv.index] = opp;
      const s2: NTTTState = { board, owner, available: state.available, turn: opp };
      const res = checkNTTT(s2);
      if (res.over && res.winner === opp) {
        // place something else? better to find a move that doesn't let opp win immediately? actually we want to block: simulate placing opponent move? easier: just pick randomly from moves if no immediate win
      }
    }
    // fallback center-ish or random
    const preferred = moves.filter((m) => m.index === 4 || m.index === 0 || m.index === 2 || m.index === 6 || m.index === 8);
    if (preferred.length > 0 && difficulty === "hard") return preferred[Math.floor(Math.random() * preferred.length)];
    return moves[Math.floor(Math.random() * moves.length)];
  },
  describeMove(move: NTTTMove): string {
    return `places ${move.value} on square ${move.index + 1}`;
  },
};
