"use client";

interface BoardProps {
  state: any;
  yourTurn: boolean;
  outcome: any;
  onMove: (move: any) => void;
}

export function ConnectFourBoard({ state, yourTurn, outcome, onMove }: BoardProps) {
  const board = state?.board || Array(6).fill(0).map(() => Array(7).fill(null));
  const disabled = !yourTurn || outcome?.over;
  return (
    <div className="mx-auto max-w-[420px] space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {Array(7).fill(0).map((_, c) => (
          <button key={c} disabled={disabled || (state?.heights?.[c] >= 6)} onClick={() => onMove(c)} className="rounded-md bg-white/5 py-1 text-xs hover:bg-white/10 disabled:opacity-40">Drop</button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 rounded-xl border border-white/10 bg-night-900 p-2">
        {board.map((row: any, r: number) =>
          row.map((cell: any, c: number) => (
            <div key={`${r}-${c}`} className="flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
              {cell === "R" && <div className="h-7 w-7 rounded-full bg-rose-400 shadow-glow" />}
              {cell === "Y" && <div className="h-7 w-7 rounded-full bg-amber-300 shadow-glow" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
