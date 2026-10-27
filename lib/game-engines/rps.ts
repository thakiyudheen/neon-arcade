import type { Choice, GameEngine, MoveResult, PlayerSlot, RoundOutcome } from "../types/game";

type RPSState = {
  choices: [Choice | null, Choice | null];
  round: number;
  revealed: boolean;
};

type RPSMove = Choice;

function beats(a: Choice, b: Choice): boolean {
  if (a === "rock" && b === "scissors") return true;
  if (a === "paper" && b === "rock") return true;
  if (a === "scissors" && b === "paper") return true;
  return false;
}

function checkRPS(state: RPSState): RoundOutcome {
  if (!state.revealed) return { over: false, winner: null, draw: false };
  const [c0, c1] = state.choices;
  if (!c0 || !c1) return { over: false, winner: null, draw: false };
  if (c0 === c1) return { over: true, winner: null, draw: true };
  if (beats(c0, c1)) return { over: true, winner: 0, draw: false };
  if (beats(c1, c0)) return { over: true, winner: 1, draw: false };
  return { over: false, winner: null, draw: false };
}

export const rpsEngine: GameEngine<RPSState, RPSMove> = {
  id: "rock-paper-scissors",
  name: "Rock Paper Scissors",
  tagline: "Best of rounds",
  description: "Simultaneous picks. Both choices are hidden until revealed together.",
  rules: [
    "On each round, pick Rock, Paper, or Scissors at the same time.",
    "Choices stay hidden until both players submit.",
    "Rock beats Scissors, Paper beats Rock, Scissors beats Paper.",
    "If both pick the same, it's a draw for the round (awards 0 points).",
    "First to reach the configured match target wins the overall match.",
  ],
  simultaneous: true,
  createState(): RPSState {
    return { choices: [null, null], round: 1, revealed: false };
  },
  applyMove(state: RPSState, player: PlayerSlot, move: RPSMove): MoveResult<RPSState> {
    if (state.revealed) return { ok: false, state, error: "Round already revealed" };
    if (state.choices[player] !== null) return { ok: false, state, error: "Already submitted" };
    const choices: [Choice | null, Choice | null] = [state.choices[0], state.choices[1]];
    choices[player] = move;
    const revealed = choices[0] !== null && choices[1] !== null;
    return { ok: true, state: { choices, round: state.round, revealed } };
  },
  getOutcome(state: RPSState): RoundOutcome {
    if (!state || !Array.isArray((state as any).choices)) {
      return { over: false, winner: null, draw: false };
    }
    return checkRPS(state as any);
  },
  getCurrentPlayer(): PlayerSlot | null {
    // simultaneous; both submit
    return null;
  },
  getValidMoves(): RPSMove[] {
    return ["rock", "paper", "scissors"];
  },
  getAIMove(state: RPSState, player: PlayerSlot): RPSMove | null {
    if (state.choices[player] !== null) return null;
    const opts: Choice[] = ["rock", "paper", "scissors"];
    return opts[Math.floor(Math.random() * opts.length)];
  },
  describeMove(move: RPSMove): string {
    return `picks ${move}`;
  },
};
