# Neon Arcade - Multiplayer Mini-Games Platform

A polished, responsive gaming platform built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui-style components, Socket.IO, and WebRTC. **No database.** Uses `localStorage` for guest profile, preferences, local statistics, and match history. Online rooms and Quick Play use an in-memory Socket.IO server.

## Features
- **Games**: Tic-Tac-Toe (AI Easy/Medium/Hard with minimax), Connect Four, Rock Paper Scissors (simultaneous/reveal), Number Tic-Tac-Toe (make 15 to win)
- **Modes**: Play vs AI, Local Two-Player (same device), Private Rooms, Quick Play matchmaking
- **Match System**: Configurable score threshold (default 10; choices 3,5,10,15,20). First to target wins match. Draws award 0 points.
- **Multiplayer**: Real Socket.IO rooms with server-authoritative moves, surrender/forfeit, rematch flow
- **Chat**: Real-time room chat with system messages (rate-limited conceptually; basic validation)
- **Voice**: Real WebRTC room voice chat (P2P) with join/leave/mute, mic permission handling, STUN/TURN config. Optional - game works without it.
- **Local Data**: Typed `localStorage` utilities with versioned keys, validation, reset option. Local stats are browser-specific.
- **UI**: Dark neon theme, responsive, animations, reduced-motion support

## Important Notes
- `localStorage` is local to one browser and **cannot** sync between players. Use the in-memory multiplayer server for online play.
- AI and Local Two-Player work **without** the multiplayer server.
- Online rooms/Quick Play require a real reachable signaling/game server.
- No PostgreSQL/MySQL/MongoDB/Prisma/Supabase/Firebase. No fake multiplayer/voice.

## Quick Start

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Copy `.env.example` to `.env.local` and adjust as needed:
```bash
cp .env.example .env.local
```
Required for online features:
- `NEXT_PUBLIC_SOCKET_URL` - browser URL of Socket.IO server (default `http://localhost:4000`)
- `CLIENT_ORIGIN` - allowed origin for Socket.IO server
- `SOCKET_PORT` - port for Socket.IO server (default `4000`)
- WebRTC: `NEXT_PUBLIC_STUN_URL`, optional `NEXT_PUBLIC_TURN_URL/USERNAME/CREDENTIAL`

### 3) Run frontend + multiplayer server together (dev)
```bash
npm run dev
```
This runs Next.js on `http://localhost:3000` and the Socket.IO server on `http://localhost:4000`.

### 4) Run separately
```bash
# Terminal 1
npm run dev:web

# Terminal 2
npm run dev:server
```

### 5) Production
```bash
npm run build
npm run start        # Next.js
npm run start:server # Socket.IO server
```

## Testing Multiplayer
Open two separate browser sessions (or different browsers/incognito) pointing to the same frontend. Create a room in one and join with the room ID in the other - moves will synchronize in real-time via Socket.IO.

## Typecheck/Lint/Test
```bash
npm run typecheck
npm run lint
npm run test
```

## Project Structure
- `app/` - Next.js App Router pages/layouts
- `components/` - UI, games, lobby, chat, voice, providers
- `lib/` - types, constants, game engines (rules/AI/scoring), storage, socket client, utils
- `server/` - Socket.IO server (rooms, matchmaking, authoritative game logic)
- `tests/` - Vitest tests
- `.env.example` - required config only for selected services
