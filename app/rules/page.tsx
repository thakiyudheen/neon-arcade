"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RulesPage() {
  return (
    <main className="container py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Rules & How It Works</h1>
        <p className="text-slate-400">Important notes about storage, multiplayer, and modes.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Storage</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>All preferences, guest profile, local statistics, and match history are stored in <strong>localStorage</strong> only on this browser.</p>
            <p><strong>localStorage is local to one browser and cannot synchronize two different players.</strong></p>
            <p>Clearing site data removes them. We never store private auth tokens or secrets in localStorage.</p>
            <p>No PostgreSQL/MySQL/MongoDB/Prisma/Supabase/Firebase is used.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Multiplayer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Online rooms and Quick Play use a <strong>real in-memory Socket.IO server</strong>. Room state and queues live on the server, not faked.</p>
            <p>AI and Local Two-Player work <strong>without</strong> the multiplayer server.</p>
            <p>Every online move is validated on the server. Surrender awards the match to opponent; forfeit on disconnect/leaving in active match.</p>
            <p>Voice chat uses real WebRTC (P2P) with STUN/TURN via signaling; it's optional and game works if disabled.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Scoring</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>Default match target is 10. Host/settings can choose 3,5,10,15,20 (configurable). First to reach target wins the overall match.</p>
            <p>Each completed round awards 1 point to the round winner. A draw awards 0 points by default.</p>
            <p>Online scores stored in server memory during the match; completed match summaries saved locally.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Games</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p><strong>Tic-Tac-Toe:</strong> 3x3, win/draw, line animation concept, AI Easy/Medium/Hard (minimax).</p>
            <p><strong>Connect Four:</strong> 7x6 gravity, 4-in-a-row detection.</p>
            <p><strong>Rock Paper Scissors:</strong> simultaneous, hidden until both submit, revealed together.</p>
            <p><strong>Number Tic-Tac-Toe:</strong> Odd has [1,3,5,7,9], Even has [2,4,6,8], place on 3x3; first line summing to 15 wins.</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <Button asChild><Link href="/lobby">Go to Lobby</Link></Button>
      </div>
    </main>
  );
}
