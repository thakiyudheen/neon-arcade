import type { AnyGameEngine, GameId } from "../types/game";
import { ticTacToeEngine } from "./tictactoe";
import { connectFourEngine } from "./connectfour";
import { rpsEngine } from "./rps";
import { numberTTTEngine } from "./numberttt";

export const engines: Record<GameId, AnyGameEngine> = {
  "tic-tac-toe": ticTacToeEngine,
  "connect-four": connectFourEngine,
  "rock-paper-scissors": rpsEngine,
  "number-tic-tac-toe": numberTTTEngine,
};

export function getEngine(id: GameId): AnyGameEngine {
  return engines[id];
}

export function getGameList() {
  return [
    engines["tic-tac-toe"],
    engines["connect-four"],
    engines["rock-paper-scissors"],
    engines["number-tic-tac-toe"],
  ];
}
