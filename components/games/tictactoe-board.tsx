"use client";

import * as React from "react";

interface BoardProps {
  state: any;
  yourTurn: boolean;
  outcome: any;
  onMove: (move: any) => void;
}

export function TicTacToeBoard({ state, yourTurn, outcome, onMove }: BoardProps) {
  const board = state?.board || Array(9).fill(null);
  const winningLine = outcome?.winningLine || [];
  return (
    <div className="mx-auto grid max-w-[320px] grid-cols-3 gap-2">
      {board.map((cell: any, i: number) => {
        const isWin = winningLine.includes(i);
        const disabled = !yourTurn || cell !== null || outcome?.over;
        return (
          <button
            key={i}
            disabled={disabled}
            onClick={() => onMove(i)}
            className={`relative flex h-24 items-center justify-center rounded-lg border text-3xl font-display transition ${isWin ? "border-neon-lime/80 bg-neon-lime/10 animate-scale-in" : "border-white/10 bg-white/5"} ${disabled ? "opacity-60" : "hover:bg-white/10"}`}
          >
            {cell}
          </button>
        );
      })}
    </div>
  );
}
