"use client";

import { useState } from "react";

interface BoardProps {
  state: any;
  yourTurn: boolean;
  outcome: any;
  yourSlot: number | null;
  onMove: (move: any) => void;
}

export function NumberTTTBoard({ state, yourTurn, outcome, yourSlot, onMove }: BoardProps) {
  const board = state?.board || Array(9).fill(null);
  const available = state?.available?.[yourSlot||0] || [];
  const [sel, setSel] = useState<number | null>(null);
  const disabled = !yourTurn || outcome?.over;
  const winningLine = outcome?.winningLine || [];

  const place = (i: number) => {
    if (disabled || board[i] !== null || sel === null) return;
    onMove({ index: i, value: sel });
    setSel(null);
  };

  return (
    <div className="mx-auto max-w-[360px] space-y-4">
      <div className="text-center text-sm text-slate-400">Your numbers: {available.join(", ") || "None"}</div>
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell: any, i: number) => {
          const isWin = winningLine.includes(i);
          return (
            <button key={i} disabled={disabled || cell !== null} onClick={() => place(i)} className={`flex h-24 items-center justify-center rounded-lg border text-xl font-display ${isWin?"border-neon-lime/80 bg-neon-lime/10":cell!==null?"border-white/20 bg-white/10":"border-white/10 bg-white/5"} ${disabled?"opacity-60":""}`}>
              {cell}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {available.map((v: number) => (
          <button key={v} disabled={disabled} onClick={() => setSel(v)} className={`rounded-md px-3 py-1 ${sel===v?"bg-neon-violet/80 text-slate-950":"bg-white/5 border border-white/10"} ${disabled?"opacity-60":""}`}>{v}</button>
        ))}
      </div>
      <div className="text-center text-xs text-slate-500">Rules: Odd uses 1,3,5,7,9; Even uses 2,4,6,8. First line summing to 15 wins.</div>
    </div>
  );
}
