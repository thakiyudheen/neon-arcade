export const SCORE_TARGETS = [3, 5, 10, 15, 20] as const;

export const DEFAULT_SCORE_TARGET = 10;

export function isValidScoreTarget(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    (SCORE_TARGETS as readonly number[]).includes(value)
  );
}

export function normalizeScoreTarget(value: unknown): number {
  return isValidScoreTarget(value) ? value : DEFAULT_SCORE_TARGET;
}

export function otherSlot(slot: 0 | 1): 0 | 1 {
  return slot === 0 ? 1 : 0;
}

export function clampScoreTarget(value: number): number {
  return Math.min(50, Math.max(1, Math.round(value)));
}
