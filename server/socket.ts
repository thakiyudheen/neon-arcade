import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { getEngine } from "../lib/game-engines";
import { awardRound } from "../lib/game-engines/scoring";
import type { AIDifficulty, GameId, PlayerSlot } from "../lib/types/game";
import { otherSlot } from "../lib/constants";

interface RoomPlayer {
  id: string;
  name: string;
  avatarId: string;
  socketId: string;
  slot: PlayerSlot;
  connected: boolean;
}

interface Room {
  roomId: string;
  gameId: GameId;
  targetScore: number;
  hostId: string;
  status: "waiting" | "playing" | "finished";
  players: RoomPlayer[];
  scores: [number, number];
  round: number;
  state: unknown;
  rematchVotes: Set<string>;
  chat: Array<{ id: string; playerId?: string; name: string; avatarId?: string; text: string; timestamp: number; kind: "user" | "system" | "reaction" }>;
  voice: Array<{ playerId: string; name: string; muted: boolean }>;
  createdAt: number;
  disconnectTimers: Map<string, NodeJS.Timeout>;
}

const rooms = new Map<string, Room>();
const matchmaking = new Map<GameId, Array<{ socketId: string; playerId: string; name: string; avatarId: string }>>();

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function publicRoom(r: Room) {
  const engine = getEngine(r.gameId);
  let outcome: any = { over: false, winner: null, draw: false };
  try {
    if (r.state) outcome = (engine.getOutcome as any)(r.state);
  } catch {
    outcome = { over: false, winner: null, draw: false };
  }
  const matchWinner = r.scores[0] >= r.targetScore ? 0 : r.scores[1] >= r.targetScore ? 1 : null;
  return {
    roomId: r.roomId,
    gameId: r.gameId,
    targetScore: r.targetScore,
    hostId: r.hostId,
    status: r.status,
    players: r.players.map((p) => ({ id: p.id, name: p.name, avatarId: p.avatarId, connected: p.connected, slot: p.slot })),
    scores: r.scores,
    round: r.round,
    state: r.state,
    outcome,
    matchWinner,
    rematchVotes: Array.from(r.rematchVotes),
    chat: r.chat.slice(-100),
    voice: r.voice,
    createdAt: r.createdAt,
    you: null,
    nextRoundInMs: null,
  };
}

function emitRoom(io: Server, r: Room) {
  try {
    for (const p of r.players) {
      const snap = publicRoom(r);
      (snap as any).you = { playerId: p.id, slot: p.slot };
      io.to(p.socketId).emit("room:snapshot", snap);
    }
  } catch (e) {
    console.error("emitRoom error", e);
  }
}

function startNewRound(r: Room) {
  const engine = getEngine(r.gameId);
  r.state = (engine.createState as any)();
  r.status = "playing";
}

export function initSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (process.env.CLIENT_ORIGIN || "http://localhost:3000").split(",").map((s) => s.trim()),
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    socket.on("room:create", (payload, cb) => {
      try {
        const { gameId, name, avatarId, targetScore } = payload || {};
        const roomId = makeId("room");
        const playerId = makeId("p");
        const room: Room = {
          roomId,
          gameId: gameId as GameId,
          targetScore: Math.max(1, Math.min(50, targetScore || 10)),
          hostId: playerId,
          status: "waiting",
          players: [{ id: playerId, name: name || "Host", avatarId: avatarId || "nova", socketId: socket.id, slot: 0, connected: true }],
          scores: [0, 0],
          round: 1,
          state: null,
          rematchVotes: new Set(),
          chat: [{ id: makeId("m"), name: "System", text: "Room created. Share the room ID to invite a player.", timestamp: Date.now(), kind: "system" }],
          voice: [],
          createdAt: Date.now(),
          disconnectTimers: new Map(),
        };
        rooms.set(roomId, room);
        socket.join(roomId);
        const snap = publicRoom(room);
        (snap as any).you = { playerId, slot: 0 };
        cb?.({ ok: true, room: snap, playerId, roomId });
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message || "Failed to create room" });
      }
    });

    socket.on("room:join", (payload, cb) => {
      try {
        const { roomId, name, avatarId } = payload || {};
        const room = rooms.get(roomId);
        if (!room) return cb?.({ ok: false, error: "Room not found" });
        if (room.players.length >= 2) return cb?.({ ok: false, error: "Room is full" });
        if (room.status !== "waiting") return cb?.({ ok: false, error: "Room already in progress" });
        const playerId = makeId("p");
        const player: RoomPlayer = { id: playerId, name: name || "Player", avatarId: avatarId || "orbit", socketId: socket.id, slot: 1, connected: true };
        room.players.push(player);
        room.chat.push({ id: makeId("m"), name: "System", text: `${player.name} joined the room.`, timestamp: Date.now(), kind: "system" });
        socket.join(roomId);
        startNewRound(room);
        emitRoom(io, room);
        cb?.({ ok: true, roomId, playerId });
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message || "Failed to join room" });
      }
    });

    socket.on("room:start", ({ roomId }, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb?.({ ok: false, error: "Room not found" });
      const p = room.players.find((x) => x.socketId === socket.id);
      if (!p || p.id !== room.hostId) return cb?.({ ok: false, error: "Only host can start" });
      if (room.players.length < 2) return cb?.({ ok: false, error: "Need 2 players" });
      startNewRound(room);
      room.chat.push({ id: makeId("m"), name: "System", text: "Match started.", timestamp: Date.now(), kind: "system" });
      emitRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("game:move", ({ roomId, move }, cb) => {
      try {
        const room = rooms.get(roomId);
        if (!room || room.status !== "playing") return cb?.({ ok: false, error: "Not in active match" });
        const p = room.players.find((x) => x.socketId === socket.id);
        if (!p) return cb?.({ ok: false, error: "Not in room" });
        const engine: any = getEngine(room.gameId);
        const res = engine.applyMove(room.state, p.slot, move);
        if (!res.ok) return cb?.({ ok: false, error: res.error || "Invalid move" });
        room.state = res.state;
        const outcome = engine.getOutcome(room.state);
        if (outcome.over) {
          // award round
          const upd = awardRound(room.scores, room.targetScore, outcome.winner as any);
          room.scores = upd.scores;
          if (outcome.winner !== null) {
            const winnerName = room.players.find((x) => x.slot === outcome.winner)?.name || "Player";
            room.chat.push({ id: makeId("m"), name: "System", text: `${winnerName} won the round!`, timestamp: Date.now(), kind: "system" });
          } else if (outcome.draw) {
            room.chat.push({ id: makeId("m"), name: "System", text: "Round ended in a draw.", timestamp: Date.now(), kind: "system" });
          }
          if (upd.matchWinner !== null) {
            room.status = "finished";
            const w = room.players.find((x) => x.slot === upd.matchWinner)?.name || "Player";
            room.chat.push({ id: makeId("m"), name: "System", text: `${w} won the match!`, timestamp: Date.now(), kind: "system" });
          } else {
            // start next round
            room.round += 1;
            setTimeout(() => {
              if (!rooms.has(roomId)) return;
              startNewRound(room);
              room.chat.push({ id: makeId("m"), name: "System", text: `Round ${room.round} started.`, timestamp: Date.now(), kind: "system" });
              emitRoom(io, room);
            }, 900);
          }
        }
        emitRoom(io, room);
        cb?.({ ok: true });
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message || "Move failed" });
      }
    });

    socket.on("chat:send", ({ roomId, text }, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb?.({ ok: false, error: "Room not found" });
      const p = room.players.find((x) => x.socketId === socket.id);
      if (!p) return cb?.({ ok: false, error: "Not in room" });
      const msg = (text || "").toString().slice(0, 200);
      if (!msg.trim()) return cb?.({ ok: false, error: "Empty message" });
      room.chat.push({ id: makeId("m"), playerId: p.id, name: p.name, avatarId: p.avatarId, text: msg.trim(), timestamp: Date.now(), kind: "user" });
      emitRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("room:surrender", ({ roomId }, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb?.({ ok: false, error: "Room not found" });
      const p = room.players.find((x) => x.socketId === socket.id);
      if (!p) return cb?.({ ok: false, error: "Not in room" });
      const opp = room.players.find((x) => x.slot === otherSlot(p.slot));
      if (!opp) return cb?.({ ok: false, error: "No opponent" });
      room.scores = [0, 0];
      room.scores[opp.slot] = room.targetScore;
      room.status = "finished";
      room.chat.push({ id: makeId("m"), name: "System", text: `${p.name} surrendered. ${opp.name} wins the match.`, timestamp: Date.now(), kind: "system" });
      emitRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("room:leave", ({ roomId }, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb?.({ ok: false, error: "Room not found" });
      const p = room.players.find((x) => x.socketId === socket.id);
      if (!p) return cb?.({ ok: false, error: "Not in room" });
      room.chat.push({ id: makeId("m"), name: "System", text: `${p.name} left the room.`, timestamp: Date.now(), kind: "system" });
      // if match active, award forfeit to opponent
      if (room.status === "playing") {
        const opp = room.players.find((x) => x.slot === otherSlot(p.slot));
        if (opp && opp.connected) {
          room.scores = [0, 0];
          room.scores[opp.slot] = room.targetScore;
          room.status = "finished";
          room.chat.push({ id: makeId("m"), name: "System", text: `${opp.name} wins by forfeit.`, timestamp: Date.now(), kind: "system" });
          emitRoom(io, room);
        }
      }
      socket.leave(roomId);
      room.players = room.players.filter((x) => x.socketId !== socket.id);
      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        emitRoom(io, room);
      }
      cb?.({ ok: true });
    });

    socket.on("matchmaking:join", (payload, cb) => {
      try {
        const { gameId, name, avatarId } = payload || {};
        const gid = gameId as GameId;
        if (!matchmaking.has(gid)) matchmaking.set(gid, []);
        const list = matchmaking.get(gid)!;
        // avoid duplicates
        if (list.find((x) => x.socketId === socket.id)) return cb?.({ ok: false, error: "Already in queue" });
        list.push({ socketId: socket.id, playerId: makeId("p"), name: name || "Player", avatarId: avatarId || "nova" });
        // try match
        if (list.length >= 2) {
          const a = list.shift()!;
          const b = list.shift()!;
          const roomId = makeId("room");
          const room: Room = {
            roomId,
            gameId: gid,
            targetScore: 10,
            hostId: a.playerId,
            status: "playing",
            players: [
              { id: a.playerId, name: a.name, avatarId: a.avatarId, socketId: a.socketId, slot: 0, connected: true },
              { id: b.playerId, name: b.name, avatarId: b.avatarId, socketId: b.socketId, slot: 1, connected: true },
            ],
            scores: [0, 0],
            round: 1,
            state: (getEngine(gid).createState as any)(),
            rematchVotes: new Set(),
            chat: [{ id: makeId("m"), name: "System", text: "Quick Play match found.", timestamp: Date.now(), kind: "system" }],
            voice: [],
            createdAt: Date.now(),
            disconnectTimers: new Map(),
          };
          rooms.set(roomId, room);
          const sa = io.sockets.sockets.get(a.socketId);
          const sb = io.sockets.sockets.get(b.socketId);
          sa?.join(roomId);
          sb?.join(roomId);
          const sna = publicRoom(room); (sna as any).you = { playerId: a.playerId, slot: 0 };
          const snb = publicRoom(room); (snb as any).you = { playerId: b.playerId, slot: 1 };
          io.to(a.socketId).emit("matchmaking:matched", { roomId, room: sna });
          io.to(b.socketId).emit("matchmaking:matched", { roomId, room: snb });
        }
        cb?.({ ok: true, searching: true });
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message || "Queue failed" });
      }
    });

    socket.on("matchmaking:leave", (payload, cb) => {
      const { gameId } = payload || {};
      const gid = gameId as GameId;
      const list = matchmaking.get(gid);
      if (list) {
        const idx = list.findIndex((x) => x.socketId === socket.id);
        if (idx >= 0) list.splice(idx, 1);
      }
      cb?.({ ok: true });
    });

    socket.on("voice:join", ({ roomId }, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb?.({ ok: false, error: "Room not found" });
      const p = room.players.find((x) => x.socketId === socket.id);
      if (!p) return cb?.({ ok: false, error: "Not in room" });
      if (!room.voice.find((v) => v.playerId === p.id)) {
        room.voice.push({ playerId: p.id, name: p.name, muted: true });
        emitRoom(io, room);
      }
      cb?.({ ok: true });
    });

    socket.on("voice:leave", ({ roomId }, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb?.({ ok: false, error: "Room not found" });
      const p = room.players.find((x) => x.socketId === socket.id);
      if (!p) return cb?.({ ok: false, error: "Not in room" });
      room.voice = room.voice.filter((v) => v.playerId !== p.id);
      emitRoom(io, room);
      cb?.({ ok: true });
    });

    socket.on("voice:toggle", ({ roomId, muted }, cb) => {
      const room = rooms.get(roomId);
      if (!room) return cb?.({ ok: false, error: "Room not found" });
      const p = room.players.find((x) => x.socketId === socket.id);
      if (!p) return cb?.({ ok: false, error: "Not in room" });
      const v = room.voice.find((x) => x.playerId === p.id);
      if (v) v.muted = !!muted;
      emitRoom(io, room);
      cb?.({ ok: true });
    });

    // WebRTC signaling passthrough for P2P voice
    socket.on("webrtc:offer", ({ roomId, to, sdp }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const p = room.players.find((x) => x.socketId === socket.id);
      const target = room.players.find((x) => x.id === to);
      if (p && target) io.to(target.socketId).emit("webrtc:offer", { from: p.id, sdp });
    });
    socket.on("webrtc:answer", ({ roomId, to, sdp }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const p = room.players.find((x) => x.socketId === socket.id);
      const target = room.players.find((x) => x.id === to);
      if (p && target) io.to(target.socketId).emit("webrtc:answer", { from: p.id, sdp });
    });
    socket.on("webrtc:ice", ({ roomId, to, candidate }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const p = room.players.find((x) => x.socketId === socket.id);
      const target = room.players.find((x) => x.id === to);
      if (p && target) io.to(target.socketId).emit("webrtc:ice", { from: p.id, candidate });
    });

    socket.on("disconnect", () => {
      // remove from queues
      for (const [, list] of matchmaking) {
        const idx = list.findIndex((x) => x.socketId === socket.id);
        if (idx >= 0) list.splice(idx, 1);
      }
      // mark disconnected in rooms
      for (const room of rooms.values()) {
        const p = room.players.find((x) => x.socketId === socket.id);
        if (p) {
          p.connected = false;
          try {
            room.chat.push({ id: makeId("m"), name: "System", text: `${p.name} disconnected.`, timestamp: Date.now(), kind: "system" });
            emitRoom(io, room);
          } catch {}
          // cleanup if empty
          if (room.players.every((x) => !x.connected)) {
            setTimeout(() => {
              const r2 = rooms.get(room.roomId);
              if (r2 && r2.players.every((x) => !x.connected)) {
                rooms.delete(room.roomId);
              }
            }, 30000);
          }
        }
      }
    });
  });

  return io;
}
