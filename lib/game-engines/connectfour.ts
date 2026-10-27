import type { AIDifficulty, GameEngine, MoveResult, PlayerSlot, RoundOutcome } from "../types/game";
import { otherSlot } from "../constants";

type C4State = {
  board: Array<Array<"R"|"Y"|null>>;
  turn: PlayerSlot;
  heights: number[]; // 0-5 per column
};

type C4Move = number; // column 0-6

function checkC4(board: Array<Array<"R"|"Y"|null>>): RoundOutcome {
  // horizontal
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 4; c++) {
      const v = board[r][c];
      if (v && board[r][c+1]===v && board[r][c+2]===v && board[r][c+3]===v) {
        return { over: true, winner: v==="R"?0:1, draw: false };
      }
    }
  }
  // vertical
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r < 3; r++) {
      const v = board[r][c];
      if (v && board[r+1][c]===v && board[r+2][c]===v && board[r+3][c]===v) {
        return { over: true, winner: v==="R"?0:1, draw: false };
      }
    }
  }
  // diagonal down-right
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const v = board[r][c];
      if (v && board[r+1][c+1]===v && board[r+2][c+2]===v && board[r+3][c+3]===v) {
        return { over: true, winner: v==="R"?0:1, draw: false };
      }
    }
  }
  // diagonal down-left
  for (let r = 0; r < 3; r++) {
    for (let c = 3; c < 7; c++) {
      const v = board[r][c];
      if (v && board[r+1][c-1]===v && board[r+2][c-2]===v && board[r+3][c-3]===v) {
        return { over: true, winner: v==="R"?0:1, draw: false };
      }
    }
  }
  // draw if full
  let full = true;
  for (let c = 0; c < 7; c++) if ((board[5][c])===null) { full = false; break; }
  if (full) return { over: true, winner: null, draw: true };
  return { over: false, winner: null, draw: false };
}

export const connectFourEngine: GameEngine<C4State, C4Move> = {
  id: "connect-four",
  name: "Connect Four",
  tagline: "Four in a row",
  description: "Drop discs and connect four horizontally, vertically, or diagonally.",
  rules: [
    "7 columns × 6 rows. Discs fall to the lowest available row in the chosen column.",
    "Connect four of your discs in a straight line to win the round.",
    "If board fills with no winner, round is a draw (awards 0 points).",
    "First to reach the configured match target wins the overall match.",
  ],
  simultaneous: false,
  createState(): C4State {
    return {
      board: Array(6).fill(0).map(() => Array(7).fill(null)),
      turn: 0,
      heights: Array(7).fill(0),
    };
  },
  applyMove(state: C4State, player: PlayerSlot, move: C4Move): MoveResult<C4State> {
    if (state.turn !== player) return { ok: false, state, error: "Not your turn" };
    if (move < 0 || move > 6) return { ok: false, state, error: "Invalid column" };
    if (state.heights[move] >= 6) return { ok: false, state, error: "Column full" };
    const o = checkC4(state.board);
    if (o.over) return { ok: false, state, error: "Round already finished" };
    const board = state.board.map((row) => row.slice()) as Array<Array<"R"|"Y"|null>>;
    const h = state.heights.slice();
    const row = 5 - h[move];
    board[row][move] = player === 0 ? "R" : "Y";
    h[move] += 1;
    return { ok: true, state: { board, turn: otherSlot(player), heights: h } };
  },
  getOutcome(state: C4State): RoundOutcome {
    if (!state || !Array.isArray((state as any).board)) {
      return { over: false, winner: null, draw: false };
    }
    return checkC4((state as any).board);
  },
  getCurrentPlayer(state: C4State): PlayerSlot | null {
    if (!state || !Array.isArray((state as any).board)) return null;
    const o = checkC4((state as any).board);
    if (o.over) return null;
    return (state as any).turn;
  },
  getValidMoves(state: C4State): C4Move[] {
    if (!state || !Array.isArray((state as any).board)) return [];
    const o = checkC4((state as any).board);
    if (o.over) return [];
    const m: C4Move[] = [];
    for (let c = 0; c < 7; c++) if ((state as any).heights && (state as any).heights[c] < 6) m.push(c);
    return m;
  },
  getAIMove(state: C4State, player: PlayerSlot, difficulty: AIDifficulty): C4Move | null {
    const moves = this.getValidMoves(state, player);
    if (moves.length === 0) return null;
    if (difficulty === "easy") return moves[Math.floor(Math.random() * moves.length)];
    if (difficulty === "medium" && Math.random() < 0.3) return moves[Math.floor(Math.random() * moves.length)];
    // simple heuristic: prefer center columns, else random among moves (kept clear as heuristic, still functional)
    const center = moves.filter((c) => c === 3 || c === 2 || c === 4);
    if (center.length > 0 && difficulty === "hard") return center[Math.floor(Math.random() * center.length)];
    return moves[Math.floor(Math.random() * moves.length)];
  },
  describeMove(move: C4Move): string {
    return `drops disc into column ${move + 1}`;
  },
};
