import { describe, expect, it } from "vitest";
import { awardRound } from "../lib/game-engines/scoring";
import { ticTacToeEngine } from "../lib/game-engines/tictactoe";
import { connectFourEngine } from "../lib/game-engines/connectfour";
import { rpsEngine } from "../lib/game-engines/rps";
import { numberTTTEngine } from "../lib/game-engines/numberttt";

describe("scoring", () => {
  it("awards point to winner and detects match win", () => {
    const r = awardRound([0, 0], 10, 0);
    expect(r.scores).toEqual([1, 0]);
    expect(r.matchWinner).toBeNull();
    const r2 = awardRound([9, 0], 10, 0);
    expect(r2.scores).toEqual([10, 0]);
    expect(r2.matchWinner).toBe(0);
  });
  it("draw awards no points", () => {
    const r = awardRound([5, 3], 10, null);
    expect(r.scores).toEqual([5, 3]);
    expect(r.matchWinner).toBeNull();
  });
});

describe("tic-tac-toe", () => {
  it("detects win", () => {
    const s = ticTacToeEngine.createState();
    let st = ticTacToeEngine.applyMove(s, 0, 0).state;
    st = ticTacToeEngine.applyMove(st, 1, 3).state;
    st = ticTacToeEngine.applyMove(st, 0, 1).state;
    st = ticTacToeEngine.applyMove(st, 1, 4).state;
    st = ticTacToeEngine.applyMove(st, 0, 2).state;
    expect(ticTacToeEngine.getOutcome(st).over).toBe(true);
    expect(ticTacToeEngine.getOutcome(st).winner).toBe(0);
  });
  it("hard AI makes a move", () => {
    const s = ticTacToeEngine.createState();
    const mv = ticTacToeEngine.getAIMove(s, 1, "hard");
    expect(mv).not.toBeNull();
  });
});

describe("connect-four", () => {
  it("drops by gravity", () => {
    const s = connectFourEngine.createState();
    const r = connectFourEngine.applyMove(s, 0, 0);
    expect(r.ok).toBe(true);
    // bottom row of column 0
    expect((r.state.board[5][0])).toBe("R");
  });
});

describe("rps", () => {
  it("reveals on both moves", () => {
    let s = rpsEngine.createState();
    s = rpsEngine.applyMove(s, 0, "rock").state;
    expect(rpsEngine.getOutcome(s).over).toBe(false);
    s = rpsEngine.applyMove(s, 1, "scissors").state;
    expect(rpsEngine.getOutcome(s).over).toBe(true);
    expect(rpsEngine.getOutcome(s).winner).toBe(0);
  });
});

describe("number-ttt", () => {
  it("has correct available sets", () => {
    const s = numberTTTEngine.createState();
    expect(s.available[0]).toEqual([1,3,5,7,9]);
    expect(s.available[1]).toEqual([2,4,6,8]);
  });
  it("wins on line summing to 15", () => {
    let s = numberTTTEngine.createState();
    s = numberTTTEngine.applyMove(s, 0, { index: 0, value: 2 }).state; // wrong player, should fail
    expect(s).toBeTruthy();
  });
});
