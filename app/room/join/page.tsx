"use client";

import { useApp } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSocket } from "@/lib/socket/client";
import { setGuestProfile } from "@/lib/storage/profile";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function JoinInner() {
  const { profile, refresh } = useApp();
  const params = useSearchParams();
  const router = useRouter();
  const [roomId, setRoomId] = useState(params.get("id") || "");
  const [name, setName] = useState(profile?.name || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const join = () => {
    if (!roomId.trim()) return setErr("Enter a room ID");
    const displayName = name.trim();
    if (!displayName) {
      setErr("Please enter your name");
      return;
    }
    setLoading(true);
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
      setLoading(false);
      const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
      setErr(`No response from multiplayer server at ${url}. Make sure it's running.`);
    }, 8000);
    try {
      s.emit("room:join", { roomId: roomId.trim(), name: displayName, avatarId: profile?.avatarId || "orbit" }, (res: any) => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        setLoading(false);
        if (res?.ok) {
          router.push(`/room/${roomId.trim()}`);
        } else {
          setErr(res?.error || "Failed to join");
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

  return (
    <main className="container py-8 md:py-10 px-3 sm:px-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader>
          <CardTitle>Join Room</CardTitle>
          <CardDescription>Enter the room ID shared by the host</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Room ID</label>
            <Input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="room-xxxx" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Your name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your display name" maxLength={16} />
            <p className="text-xs text-slate-500">Host will see this name when you join.</p>
          </div>
          {err && <p className="text-sm text-rose-400">{err}</p>}
          <Button onClick={join} disabled={loading} className="w-full">{loading ? "Joining..." : "Join Room"}</Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function JoinPage() {
  return <Suspense><JoinInner /></Suspense>;
}
