"use client";

import { useApp } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSocket } from "@/lib/socket/client";
import { setGuestProfile } from "@/lib/storage/profile";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function QPInner() {
  const { profile, refresh } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const gameId = (params.get("game") as any) || "tic-tac-toe";
  const [name, setName] = useState(profile?.name || "");
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState("");

  const join = () => {
    const displayName = name.trim();
    if (!displayName) {
      setErr("Please enter your name");
      return;
    }
    setSearching(true);
    setErr("");
    try {
      setGuestProfile({ name: displayName });
      refresh();
    } catch {}
    const s = getSocket();
    let done = false;
    const timeout = setTimeout(() => {
      if (done) return;
      done = true;
      setSearching(false);
      const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
      setErr(`No response from multiplayer server at ${url}. Make sure it's running.`);
    }, 8000);
    try {
      s.emit("matchmaking:join", { gameId, name: displayName, avatarId: profile?.avatarId || "nova" }, (res: any) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        if (!res?.ok) {
          setSearching(false);
          setErr(res?.error || "Failed to join queue");
        }
        // if ok, wait for match event
      });
    } catch (e: any) {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      setSearching(false);
      setErr(e?.message || "Socket error");
    }
  };

  const leave = () => {
    const s = getSocket();
    s.emit("matchmaking:leave", { gameId }, () => {
      setSearching(false);
    });
  };

  useEffect(() => {
    const s = getSocket();
    const onMatched = (payload: any) => {
      if (payload?.roomId) router.push(`/room/${payload.roomId}`);
    };
    s.on("matchmaking:matched", onMatched);
    return () => {
      s.off("matchmaking:matched", onMatched);
    };
  }, [router]);

  return (
    <main className="container py-8 md:py-10 px-3 sm:px-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader>
          <CardTitle>Quick Play</CardTitle>
          <CardDescription>Game: {gameId} • Target: 10 (server default)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Your name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your display name" maxLength={16} />
            <p className="text-xs text-slate-500">Opponent will see this name in the match.</p>
          </div>
          <p className="text-sm text-slate-400">Searching for another player. Requires a reachable multiplayer server. This is real matchmaking, not simulated.</p>
          {err && <p className="text-sm text-rose-400">{err}</p>}
          {!searching ? (
            <Button onClick={join} className="w-full">Enter Queue</Button>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm">Searching for opponent...</div>
              <Button onClick={leave} variant="outline" className="w-full">Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function QuickPlayPage() {
  return <Suspense><QPInner /></Suspense>;
}
