"use client";

import { useApp } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getSocket } from "@/lib/socket/client";
import { getEngine } from "@/lib/game-engines";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TicTacToeBoard } from "@/components/games/tictactoe-board";
import { ConnectFourBoard } from "@/components/games/connectfour-board";
import { RPSBoard } from "@/components/games/rps-board";
import { NumberTTTBoard } from "@/components/games/numberttt-board";
import { MessageSquare, Mic, PhoneOff, Share2, Skull, Smile } from "lucide-react";
import { addMatchRecord, updateStatistics } from "@/lib/storage/profile";

function VoicePanel({ roomId, voice, youId }: { roomId: string; voice: any[]; youId: string | null }) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [pcs, setPcs] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [err, setErr] = useState("");

  const stun = process.env.NEXT_PUBLIC_STUN_URL || "stun:stun.l.google.com:19302";
  const config: RTCConfiguration = {
    iceServers: [{ urls: stun }, ...(process.env.NEXT_PUBLIC_TURN_URL ? [{ urls: process.env.NEXT_PUBLIC_TURN_URL, username: process.env.NEXT_PUBLIC_TURN_USERNAME, credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL }] : [])],
  };

  const join = async () => {
    try {
      setErr("");
      const s = getSocket();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      s.emit("voice:join", { roomId }, () => {});
      setJoined(true);
      setMuted(false);
      // connect to others
      for (const v of voice) {
        if (v.playerId === youId) continue;
        const pc = new RTCPeerConnection(config);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        pc.onicecandidate = (e) => {
          if (e.candidate) s.emit("webrtc:ice", { roomId, to: v.playerId, candidate: e.candidate });
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        s.emit("webrtc:offer", { roomId, to: v.playerId, sdp: offer });
        pcs.set(v.playerId, pc);
      }
      setPcs(new Map(pcs));
    } catch (e: any) {
      setErr(e?.message || "Microphone permission denied or unavailable");
    }
  };

  const leave = () => {
    const s = getSocket();
    s.emit("voice:leave", { roomId }, () => {});
    localStream?.getTracks().forEach((t) => t.stop());
    for (const pc of pcs.values()) pc.close();
    setPcs(new Map());
    setLocalStream(null);
    setJoined(false);
    setMuted(true);
  };

  const toggleMute = () => {
    const s = getSocket();
    localStream?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted(!muted);
    s.emit("voice:toggle", { roomId, muted: !muted }, () => {});
  };

  useEffect(() => {
    const s = getSocket();
    const onOffer = async ({ from, sdp }: any) => {
      if (!localStream) return;
      const pc = new RTCPeerConnection(config);
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
      pc.onicecandidate = (e) => {
        if (e.candidate) s.emit("webrtc:ice", { roomId, to: from, candidate: e.candidate });
      };
      pc.ontrack = (e) => {
        const audio = document.createElement("audio");
        audio.srcObject = e.streams[0];
        audio.autoplay = true;
        audio.controls = false;
        document.body.appendChild(audio);
      };
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      s.emit("webrtc:answer", { roomId, to: from, sdp: answer });
      pcs.set(from, pc);
      setPcs(new Map(pcs));
    };
    const onAnswer = async ({ from, sdp }: any) => {
      const pc = pcs.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    };
    const onIce = async ({ from, candidate }: any) => {
      const pc = pcs.get(from);
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };
    s.on("webrtc:offer", onOffer);
    s.on("webrtc:answer", onAnswer);
    s.on("webrtc:ice", onIce);
    return () => {
      s.off("webrtc:offer", onOffer);
      s.off("webrtc:answer", onAnswer);
      s.off("webrtc:ice", onIce);
    };
  }, [localStream, pcs, roomId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mic className="h-4 w-4" /> Voice Chat (WebRTC)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {!joined ? <Button onClick={join} size="sm"><Mic className="h-3.5 w-3.5" /> Join Voice</Button> : (
            <>
              <Button onClick={toggleMute} size="sm" variant="outline">{muted ? <Mic className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}{muted ? "Unmute" : "Mute"}</Button>
              <Button onClick={leave} size="sm" variant="destructive"><PhoneOff className="h-3.5 w-3.5" /> Leave</Button>
            </>
          )}
        </div>
        <div className="text-xs text-slate-400">Participants: {voice.length} • STUN/TURN configured via env. Game works if voice unavailable.</div>
        {err && <div className="text-xs text-rose-400">{err}</div>}
      </CardContent>
    </Card>
  );
}

const CHAT_EMOJIS = ["😀", "😂", "😍", "❤️", "👍", "👎", "🔥", "🎉", "😮", "😢", "😡", "😎", "💯", "👀", "GG"];

function ChatPanel({ roomId, chat }: { roomId: string; chat: any[] }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const send = () => {
    if (!text.trim()) return;
    const s = getSocket();
    s.emit("chat:send", { roomId, text }, () => {});
    setText("");
    setShowEmoji(false);
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Room Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[320px] flex-col">
        <div className="flex-1 space-y-2 overflow-auto pr-1">
          {chat.slice(-50).map((m) => (
            <div key={m.id} className="rounded-lg border border-white/5 bg-white/5 px-2 py-1 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="truncate">{m.name}</span>
                <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="text-slate-200 break-words">{m.text}</div>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          {showEmoji && (
            <div className="absolute bottom-[calc(100%+6px)] left-0 mb-0 w-full max-h-32 overflow-auto rounded-xl border border-white/10 bg-night-900/95 backdrop-blur shadow-2xl animate-fade-up z-20">
              <div className="flex flex-wrap gap-1 p-2">
                {CHAT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      addEmoji(emoji);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition hover:bg-white/10 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => setShowEmoji((prev) => !prev)} className="shrink-0">
              <Smile className="h-4 w-4" />
            </Button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Say something..."
              maxLength={200}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-cyan/60"
            />
            <Button size="sm" onClick={send} className="shrink-0">Send</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useApp();
  const [snap, setSnap] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const s = getSocket();
    const onSnap = (r: any) => setSnap(r);
    s.on("room:snapshot", onSnap);
    return () => {
      s.off("room:snapshot", onSnap);
    };
  }, []);

  const engine = useMemo(() => (snap?.gameId ? getEngine(snap.gameId) : null), [snap?.gameId]);
  const youSlot = snap?.you?.slot ?? null;
  const yourTurn = snap?.status === "playing" && engine && snap?.outcome && !snap?.outcome?.over && (engine.getCurrentPlayer as any)(snap.state) === youSlot;

  const makeMove = (move: any) => {
    const s = getSocket();
    s.emit("game:move", { roomId: id, move }, (res: any) => {
      if (!res?.ok) setErr(res?.error || "Invalid move");
      else setErr("");
    });
  };

  const surrender = () => {
    if (!confirm("Surrender and award match to opponent?")) return;
    const s = getSocket();
    s.emit("room:surrender", { roomId: id }, () => {});
  };

  const leave = () => {
    const s = getSocket();
    s.emit("room:leave", { roomId: id }, () => router.push("/lobby"));
  };

  const share = () => {
    const url = `${location.origin}/room/join?id=${id}`;
    navigator.clipboard?.writeText(url);
    alert("Invitation link copied to clipboard");
  };

  useEffect(() => {
    if (!snap) return;
    if (snap.status === "finished" && snap.matchWinner !== null && snap.you?.playerId) {
      // save match record once
      const key = `saved:${id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      const won = snap.matchWinner === snap.you.slot;
      const draw = false;
      const res = won ? "win" : "loss";
      try {
        addMatchRecord({
          id: `m-${Date.now()}`,
          gameId: snap.gameId,
          mode: "online",
          result: res,
          playerScore: snap.scores[snap.you.slot],
          opponentScore: snap.scores[1 - snap.you.slot],
          target: snap.targetScore,
          opponentName: snap.players.find((p: any) => p.slot === 1 - snap.you.slot)?.name || "Opponent",
          playedAt: Date.now(),
        });
        updateStatistics(snap.gameId, res);
      } catch {}
    }
  }, [snap, id]);

  if (!snap) {
    return (
      <main className="container py-10">
        <Card className="mx-auto max-w-md">
          <CardHeader><CardTitle>Connecting to room...</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-400">Waiting for server connection. Make sure the Socket.IO server is running.</CardContent>
        </Card>
      </main>
    );
  }

  const opp = snap.players.find((p: any) => p.slot !== youSlot);
  const me = snap.players.find((p: any) => p.slot === youSlot);

  return (
    <main className="container py-8">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">{engine?.name || snap.gameId} • Room {snap.roomId}</h1>
          <p className="text-slate-400">Match target: {snap.targetScore} • Round {snap.round} • Status: {snap.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={share}><Share2 className="h-3.5 w-3.5" /> Copy Invite Link</Button>
          <Button size="sm" variant="outline" onClick={leave}><PhoneOff className="h-3.5 w-3.5" /> Leave</Button>
          {snap.status === "playing" && <Button size="sm" variant="destructive" onClick={surrender}><Skull className="h-3.5 w-3.5" /> Surrender</Button>}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <div className="text-xs sm:text-sm text-slate-400">You</div>
              <div className="font-medium truncate">{me?.name || profile?.name} {youSlot===0?"(X/R/Odd)":"(O/Y/Even)"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Score</div>
              <div className="text-xl sm:text-2xl font-display">{snap.scores?.[0]} - {snap.scores?.[1]}</div>
            </div>
            <div className="text-left sm:text-right min-w-0">
              <div className="text-xs sm:text-sm text-slate-400">Opponent</div>
              <div className="font-medium truncate">{opp?.name || "Waiting..."} {opp ? (opp.slot===0?"(X/R/Odd)":"(O/Y/Even)") : ""} {opp && !opp.connected ? "(disconnected)" : ""}</div>
            </div>
          </div>

          {snap.status === "waiting" && (
            <Card>
              <CardHeader><CardTitle>Waiting for opponent</CardTitle></CardHeader>
              <CardContent className="text-slate-400">Share the room ID or invite link. Host can start once both players are connected.</CardContent>
            </Card>
          )}

          {snap.status === "playing" && engine && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>{yourTurn ? "Your turn" : snap.outcome?.over ? "Round finished" : "Opponent's turn"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  {snap.gameId === "tic-tac-toe" && <TicTacToeBoard state={snap.state} yourTurn={yourTurn} outcome={snap.outcome} onMove={makeMove} />}
                  {snap.gameId === "connect-four" && <ConnectFourBoard state={snap.state} yourTurn={yourTurn} outcome={snap.outcome} onMove={makeMove} />}
                  {snap.gameId === "rock-paper-scissors" && <RPSBoard state={snap.state} yourTurn={yourTurn} outcome={snap.outcome} yourSlot={youSlot} onMove={makeMove} />}
                  {snap.gameId === "number-tic-tac-toe" && <NumberTTTBoard state={snap.state} yourTurn={yourTurn} outcome={snap.outcome} yourSlot={youSlot} onMove={makeMove} />}
                </div>
                {err && <div className="mt-2 text-sm text-rose-400">{err}</div>}
              </CardContent>
            </Card>
          )}

          {snap.status === "finished" && (
            <Card>
              <CardHeader><CardTitle>Match Finished</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="text-lg">{snap.matchWinner === youSlot ? "You won the match!" : snap.matchWinner !== null ? "You lost the match." : "Draw/finished"}</div>
                <div className="text-slate-400">Final score: {snap.scores?.[0]} - {snap.scores?.[1]}</div>
                <Button onClick={() => router.push("/lobby")}>Back to Lobby</Button>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1"><MessageSquare className="h-4 w-4" /> Chat</Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>Room Chat</SheetTitle>
                </SheetHeader>
                <div className="max-h-[70vh] overflow-auto">
                  <ChatPanel roomId={id} chat={snap.chat || []} />
                </div>
              </SheetContent>
            </Sheet>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1"><Mic className="h-4 w-4" /> Voice</Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>Voice Chat</SheetTitle>
                </SheetHeader>
                <VoicePanel roomId={id} voice={snap.voice || []} youId={snap.you?.playerId || null} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden lg:block space-y-4">
          <VoicePanel roomId={id} voice={snap.voice || []} youId={snap.you?.playerId || null} />
          <ChatPanel roomId={id} chat={snap.chat || []} />
        </div>
      </div>
    </main>
  );
}
