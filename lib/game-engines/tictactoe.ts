import type { AIDifficulty, GameEngine, GameId, MoveResult, PlayerSlot, RoundOutcome } from "../types/game";
import { otherSlot } from "../constants";

type TTTState = {
  board: Array<"X" | "O" | null>;
  turn: PlayerSlot;
  moveCount: number;
};

type TTTMove = number;

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function checkTTT(board: Array<"X"|"O"|null>): RoundOutcome {
  for (const line of WIN_LINES) {
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { over: true, winner: board[a] === "X" ? 0 : 1, draw: false, winningLine: line };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { over: true, winner: null, draw: true };
  }
  return { over: false, winner: null, draw: false };
}

function minimax(board: Array<"X"|"O"|null>, depth: number, isMax: boolean): number {
  const res = checkTTT(board);
  if (res.over && res.draw) return 0;
  if (res.over && res.winner === 1) return 10 - depth; // O
  if (res.over && res.winner === 0) return depth - 10; // X
  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== null) continue;
      board[i] = "O";
      best = Math.max(best, minimax(board, depth + 1, false));
      board[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== null) continue;
      board[i] = "X";
      best = Math.min(best, minimax(board, depth + 1, true));
      board[i] = null;
    }
    return best;
  }
}

export const ticTacToeEngine: GameEngine<TTTState, TTTMove> = {
  id: "tic-tac-toe",
  name: "Tic-Tac-Toe",
  tagline: "Classic X vs O",
  description: "Get three in a row to win the round. First to reach the target wins the match.",
  rules: [
    "X and O alternate, X goes first by default.",
    "Place your mark on an empty square to claim it.",
    "Three in a row (horizontal, vertical, diagonal) wins the round.",
    "If board fills with no winner, the round is a draw (awards 0 points).",
    "First player to reach the configured match target wins the overall match.",
  ],
  simultaneous: false,
  createState(): TTTState {
    return {
      board: Array(9).fill(null),
      turn: 0,
      moveCount: 0,
    };
  },
  applyMove(state: TTTState, player: PlayerSlot, move: TTTMove): MoveResult<TTTState> {
    if (state.turn !== player) {
      return { ok: false, state, error: "Not your turn" };
    }
    if (move < 0 || move > 8) {
      return { ok: false, state, error: "Invalid square" };
    }
    if (state.board[move] !== null) {
      return { ok: false, state, error: "Square already taken" };
    }
    const outcome = checkTTT(state.board);
    if (outcome.over) {
      return { ok: false, state, error: "Round already finished" };
    }
    const nextBoard = state.board.slice() as Array<"X"|"O"|null>;
    nextBoard[move] = player === 0 ? "X" : "O";
    const nextState: TTTState = {
      board: nextBoard,
      turn: otherSlot(player),
      moveCount: state.moveCount + 1,
    };
    return { ok: true, state: nextState };
  },
  getOutcome(state: TTTState): RoundOutcome {
    if (!state || !Array.isArray((state as any).board)) {
      return { over: false, winner: null, draw: false };
    }
    return checkTTT((state as any).board);
  },
  getCurrentPlayer(state: TTTState): PlayerSlot | null {
    if (!state || !Array.isArray((state as any).board)) return null;
    const o = checkTTT((state as any).board);
    if (o.over) return null;
    return (state as any).turn;
  },
  getValidMoves(state: TTTState): TTTMove[] {
    if (!state || !Array.isArray((state as any).board)) return [];
    const o = checkTTT((state as any).board);
    if (o.over) return [];
    const moves: TTTMove[] = [];
    for (let i = 0; i < 9; i++) if ((state as any).board[i] === null) moves.push(i);
    return moves;
  },
  getAIMove(state: TTTState, player: PlayerSlot, difficulty: AIDifficulty): TTTMove | null {
    const moves = this.getValidMoves(state, player);
    if (moves.length === 0) return null;
    if (difficulty === "easy") {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    if (difficulty === "medium") {
      // 60% optimal, 40% random
      if (Math.random() < 0.4) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
    }
    // hard / medium-favored optimal via minimax from AI perspective
    const aiIsO = player === 1;
    let bestScore = aiIsO ? -Infinity : Infinity;
    let bestMove = moves[0];
    for (const mv of moves) {
      const board = state.board.slice() as Array<"X"|"O"|null>;
      board[mv] = aiIsO ? "O" : "X";
      const score = minimax(board, 0, aiIsO);
      if (aiIsO) {
        if (score > bestScore) { bestScore = score; bestMove = mv; }
      } else {
        if (score < bestScore) { bestScore = score; bestMove = mv; }
      }
    }
    return bestMove;
  },
  describeMove(move: TTTMove): string {
    const row = Math.floor(move / 3) + 1;
    const col = (move % 3) + 1;
    return `plays at row ${row}, column ${col}`;
  },
};
