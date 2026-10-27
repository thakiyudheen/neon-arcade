"use client";

import { useApp } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSocket } from "@/lib/socket/client";
import { setGuestProfile } from "@/lib/storage/profile";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

function CreateInner() {
  const { profile, refresh } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const gameId = (params.get("game") as any) || "tic-tac-toe";
  const target = Number(params.get("target")) || 10;
  const [name, setName] = useState(profile?.name || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);

  const create = () => {
    const displayName = name.trim();
    if (!displayName) {
      setErr("Please enter your name");
      return;
    }
    setLoading(true);
    setErr("");
    setRoomId("");
    try {
      setGuestProfile({ name: displayName });
      refresh();
    } catch {}
    const s = getSocket();
    let done = false;
    const timeout = setTimeout(() => {
      if (done) return;
      done = true;
      setLoading(false);
      const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
      setErr(`No response from multiplayer server at ${url}. Make sure it's running (npm run dev or npm run dev:server).`);
    }, 8000);
    try {
      s.emit("room:create", { gameId, name: displayName, avatarId: profile?.avatarId || "nova", targetScore: target }, (res: any) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        setLoading(false);
        if (res?.ok && res.roomId) {
          setRoomId(res.roomId);
        } else {
          setErr(res?.error || "Failed to create room");
        }
      });
    } catch (e: any) {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      setLoading(false);
      setErr(e?.message || "Socket error");
    }
  };

  const copyId = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const copyLink = async () => {
    if (!roomId || typeof window === "undefined") return;
    const link = `${window.location.origin}/room/join?id=${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const goToRoom = () => {
    if (roomId) router.push(`/room/${roomId}`);
  };

  return (
    <main className="container py-8 md:py-10 px-3 sm:px-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader>
          <CardTitle>Create Private Room</CardTitle>
          <CardDescription>Game: {gameId} • Target: {target} points to win</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!roomId ? (
            <>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Your name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your display name" maxLength={16} />
                <p className="text-xs text-slate-500">Opponent will see this name when they join.</p>
              </div>
              {err && <p className="text-sm text-rose-400">{err}</p>}
              <Button onClick={create} disabled={loading} className="w-full">{loading ? "Creating..." : "Create Room"}</Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-sm text-slate-300">Room ID</div>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <code className="flex-1 text-sm tracking-wide">{roomId}</code>
                  <Button size="sm" variant="outline" onClick={copyId}><Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}</Button>
                </div>
                <p className="text-xs text-slate-500">Share this room ID with your opponent.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={copyLink} variant="outline"><Copy className="h-4 w-4" /> Copy Invitation Link</Button>
                <Button onClick={goToRoom}><ExternalLink className="h-4 w-4" /> Go to Room</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function CreatePage() {
  return <Suspense><CreateInner /></Suspense>;
}
