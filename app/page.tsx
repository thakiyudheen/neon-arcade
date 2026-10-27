import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Sparkles, Users, Wifi } from "lucide-react";
import { getGameList } from "@/lib/game-engines";

export default function HomePage() {
  const games = getGameList();
  return (
    <main className="container py-10 md:py-14">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-neon-cyan" />
            Neon Arcade • No account required • LocalStorage only for preferences
          </div>
          <h1 className="font-display text-3xl md:text-5xl tracking-tight">Multiplayer Mini-Games Platform</h1>
          <p className="max-w-2xl text-slate-400">
            Play Tic-Tac-Toe, Connect Four, Rock Paper Scissors, and Number Tic-Tac-Toe. AI, local two-player, private rooms, Quick Play, live chat, and real voice chat. Stats stay in this browser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg">
            <Link href="/lobby"><Gamepad2 className="h-4 w-4" /> Enter Lobby</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/play/ai?game=tic-tac-toe">Play vs AI</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {games.map((g) => (
          <Card key={g.id} className="relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-neon-cyan/10 blur-3xl" />
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {g.name}
                <span className="text-xs text-slate-500">{g.tagline}</span>
              </CardTitle>
              <CardDescription>{g.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="subtle">
                <Link href={`/play/ai?game=${g.id}`}>AI</Link>
              </Button>
              <Button asChild size="sm" variant="subtle">
                <Link href={`/play/local?game=${g.id}`}>Local 2P</Link>
              </Button>
              <Button asChild size="sm" variant="subtle">
                <Link href={`/lobby?game=${g.id}&mode=room`}>Create Room</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-neon-violet" /> Online</CardTitle>
            <CardDescription>Private rooms with shareable links, or Quick Play matchmaking. Requires the Socket.IO server.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wifi className="h-4 w-4 text-neon-cyan" /> Voice Chat</CardTitle>
            <CardDescription>Real WebRTC room voice. Optional; game works without it. Configure STUN/TURN in env.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Local-only</CardTitle>
            <CardDescription>AI and local two-player work fully offline. Local stats/match history are browser-specific and can be cleared.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
