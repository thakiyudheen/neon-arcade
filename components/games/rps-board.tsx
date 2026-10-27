"use client";

interface BoardProps {
  state: any;
  yourTurn: boolean;
  outcome: any;
  yourSlot: number | null;
  onMove: (move: any) => void;
}

export function RPSBoard({ state, yourTurn, outcome, yourSlot, onMove }: BoardProps) {
  const choices = state?.choices || [null, null];
  const revealed = state?.revealed;
  const opts = ["rock", "paper", "scissors"] as const;
  const youChose = yourSlot !== null ? choices[yourSlot] : null;
  const disabled = !yourTurn || outcome?.over || youChose !== null;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => (
          <button key={o} disabled={disabled} onClick={() => onMove(o)} className={`rounded-lg border border-white/10 px-3 py-2 capitalize ${youChose===o?"bg-neon-cyan/20":""} ${disabled?"opacity-60":"hover:bg-white/10"}`}>{o}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-400">You</div>
          <div className="text-lg capitalize">{youChose || (yourTurn ? "Choose" : "Waiting")}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-400">Opponent</div>
          <div className="text-lg capitalize">{revealed ? choices[1 - (yourSlot||0)] || "?" : "Hidden"}</div>
        </div>
      </div>
      {revealed && outcome?.over && (
        <div className="text-center text-sm">{outcome.draw ? "Draw - 0 points" : outcome.winner===yourSlot ? "You won the round!" : "Opponent won the round"}</div>
      )}
    </div>
  );
}
