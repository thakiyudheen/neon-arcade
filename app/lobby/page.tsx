"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGameList } from "@/lib/game-engines";
import { Plus, Users, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LobbyInner() {
  const games = getGameList();
  const params = useSearchParams();
  const initialGame = (params.get("game") as any) || "tic-tac-toe";
  const [gameId, setGameId] = useState(initialGame);
  const [target, setTarget] = useState(10);

  return (
    <main className="container py-8 md:py-10 px-3 sm:px-4">
      <header className="mb-6 md:mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">Game Lobby</h1>
          <p className="text-slate-400">Create private rooms, join by ID/link, or Quick Play. Online requires the multiplayer server.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit">
          <Link href="/">Back to Home</Link>
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Game</CardTitle>
            <CardDescription>Choose which mini-game to play</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {games.map((g) => (
              <button
                key={g.id}
                onClick={() => setGameId(g.id)}
                className={`rounded-lg border px-3 py-2 sm:px-4 sm:py-3 text-left transition ${gameId === g.id ? "border-neon-cyan/70 bg-neon-cyan/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              >
                <div className="font-medium text-sm sm:text-base">{g.name}</div>
                <div className="text-xs text-slate-400">{g.tagline}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match Settings</CardTitle>
            <CardDescription>Points to win the match (default 10)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {[3,5,10,15,20].map((v) => (
                <button key={v} onClick={() => setTarget(v)} className={`rounded-md px-3 py-1 text-sm ${target===v?"bg-neon-violet/80 text-slate-950":"bg-white/5 border border-white/10"}`}>{v}</button>
              ))}
            </div>
            <p className="text-xs text-slate-500">Draws award 0 points. First to reach target wins the match.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Plus className="h-4 w-4" /> Create Private Room</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Get a room ID and shareable link. Host configures game and target.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/room/create?game=${gameId}&target=${target}`}>Create Room</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Users className="h-4 w-4" /> Join Room</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Enter a room ID from a friend.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/room/join?game=${gameId}`}>Join Room</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Zap className="h-4 w-4" /> Quick Play</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Matchmaking queue. Real server required for online play.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/room/quickplay?game=${gameId}`}>Enter Queue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="subtle"><Link href="/play/local?game=tic-tac-toe">Local Two-Player</Link></Button>
        <Button asChild variant="subtle"><Link href="/play/ai?game=tic-tac-toe">Play vs AI</Link></Button>
        <Button asChild variant="subtle"><Link href="/profile">Profile & Stats</Link></Button>
      </div>
    </main>
  );
}

export default function LobbyPage() {
  return <Suspense><LobbyInner /></Suspense>;
}
