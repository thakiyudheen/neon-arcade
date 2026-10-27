"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEngine } from "@/lib/game-engines";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { TicTacToeBoard } from "@/components/games/tictactoe-board";
import { ConnectFourBoard } from "@/components/games/connectfour-board";
import { RPSBoard } from "@/components/games/rps-board";
import { NumberTTTBoard } from "@/components/games/numberttt-board";
import { addMatchRecord, updateStatistics, getSettings } from "@/lib/storage/profile";

function LocalInner() {
  const params = useSearchParams();
  const gameId = (params.get("game") as any) || "tic-tac-toe";
  const engine: any = useMemo(() => getEngine(gameId), [gameId]);
  const settings = getSettings();
  const [target, setTarget] = useState(settings.defaultTarget || 10);
  const [scores, setScores] = useState<[number,number]>([0,0]);
  const [state, setState] = useState<any>(() => engine.createState());
  const [matchWinner, setMatchWinner] = useState<0|1|null>(null);
  const [err, setErr] = useState("");

  const outcome = engine.getOutcome(state);
  const current = engine.getCurrentPlayer(state);
  const canMove = matchWinner === null && !outcome.over;

  const makeMove = (move: any) => {
    if (!canMove) return;
    const player = current;
    if (player === null) return;
    const res = engine.applyMove(state, player, move);
    if (!res.ok) { setErr(res.error); return; }
    setErr("");
    setState(res.state);
    const o2 = engine.getOutcome(res.state);
    if (o2.over) {
      if (o2.winner === 0) {
        const ns: [number,number] = [scores[0]+1, scores[1]];
        setScores(ns);
        if (ns[0] >= target) { setMatchWinner(0); save("win"); }
        else setTimeout(() => setState(engine.createState()), 800);
      } else if (o2.winner === 1) {
        const ns: [number,number] = [scores[0], scores[1]+1];
        setScores(ns);
        if (ns[1] >= target) { setMatchWinner(1); save("loss"); } // track from P0 perspective roughly
        else setTimeout(() => setState(engine.createState()), 800);
      } else {
        save("draw");
        if (scores[0] < target && scores[1] < target) setTimeout(() => setState(engine.createState()), 800);
      }
    }
  };

  const save = (res: "win"|"loss"|"draw") => {
    try {
      addMatchRecord({
        id: `m-${Date.now()}`,
        gameId,
        mode: "local",
        result: res,
        playerScore: scores[0],
        opponentScore: scores[1],
        target,
        opponentName: "Local Player 2",
        playedAt: Date.now(),
      });
      updateStatistics(gameId, res);
    } catch {}
  };

  const reset = () => {
    setScores([0,0]);
    setState(engine.createState());
    setMatchWinner(null);
  };

  return (
    <main className="container py-8">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">{engine.name} • Local Two-Player</h1>
          <p className="text-slate-400">Same device, alternate turns • Target: {target}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[3,5,10,15,20].map((v) => (
            <Button key={v} size="sm" variant={target===v?"subtle":"ghost"} onClick={() => setTarget(v)}>{v}</Button>
          ))}
          <Button size="sm" variant="outline" onClick={reset}>Reset</Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader>
            <CardTitle>{matchWinner !== null ? (matchWinner===0?"Player 1 won the match!":"Player 2 won the match.") : current===null ? "Round finished" : `Player ${current===0?"1 (X/R/Odd)":"2 (O/Y/Even)"}'s turn`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              {gameId === "tic-tac-toe" && <TicTacToeBoard state={state} yourTurn={canMove} outcome={outcome} onMove={makeMove} />}
              {gameId === "connect-four" && <ConnectFourBoard state={state} yourTurn={canMove} outcome={outcome} onMove={makeMove} />}
              {gameId === "rock-paper-scissors" && <RPSBoard state={state} yourTurn={canMove} outcome={outcome} yourSlot={current} onMove={makeMove} />}
              {gameId === "number-tic-tac-toe" && <NumberTTTBoard state={state} yourTurn={canMove} outcome={outcome} yourSlot={current} onMove={makeMove} />}
            </div>
            {err && <div className="mt-2 text-sm text-rose-400">{err}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Scoreboard</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span>Player 1</span><span>{scores[0]}</span></div>
            <div className="flex justify-between"><span>Player 2</span><span>{scores[1]}</span></div>
            <div className="text-xs text-slate-500">First to {target} wins</div>
            {matchWinner !== null && <Button onClick={reset} className="w-full">Rematch</Button>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LocalPage() {
  return <Suspense><LocalInner /></Suspense>;
}
