import type { PlayerSlot } from "../types/game";

export interface ScoreUpdate {
  scores: [number, number];
  matchWinner: PlayerSlot | null;
}

/**
 * Awards a completed round to the winner. Draws award no points.
 * The first player to reach the target wins the match.
 */
export function awardRound(
  scores: [number, number],
  target: number,
  roundWinner: PlayerSlot | null
): ScoreUpdate {
  if (roundWinner === null) {
    return { scores: [scores[0], scores[1]], matchWinner: null };
  }
  const next: [number, number] = [scores[0], scores[1]];
  next[roundWinner] += 1;
  const matchWinner = next[roundWinner] >= target ? roundWinner : null;
  return { scores: next, matchWinner };
}
