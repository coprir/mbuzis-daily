# Mbuzis Daily 🎥

**Live · Social · Loud.** A real-time social video-calling platform where you see who's online, knock on live video rooms, and get waved in by an admin. Energetic, urban, community-first — inspired by Discord, Twitter Spaces, and modern livestream platforms.

Mbuzis Daily runs in two modes:

- **🟢 Live mode** — a real **Socket.IO + WebRTC** backend powers genuine presence, chat, reactions, moderation and **peer-to-peer video/audio**. Start the server and set one env var.
- **🎭 Demo mode** — with no backend configured, the web app runs fully self-contained with a client-side simulation engine. **No database, no API keys, nothing to install beyond the web app.** Great for a quick look or a static Vercel deploy.

The app auto-detects: if `NEXT_PUBLIC_SOCKET_URL` points at a reachable server it goes live; otherwise it falls back to demo mode (and even reconnects live if the server comes back).

## Quick start

### Live mode (real backend + WebRTC video)

```bash
# 1. realtime server
cd server
npm install
npm run dev          # → http://localhost:4000  (health: /health)

# 2. web app (new terminal)
cd ..
npm install
# .env.local already points NEXT_PUBLIC_SOCKET_URL at http://localhost:4000
npm run dev          # → http://localhost:3800
```

Open http://localhost:3800 — you'll see the **“Live server connected”** badge. Open a room to get real WebRTC video (grant camera/mic). Open a second browser/profile to try the **request-to-join → admin approves → you're in** flow for real.

### Demo mode (zero backend)

```bash
npm install
# remove/blank NEXT_PUBLIC_SOCKET_URL (or just don't run the server)
npm run dev          # → http://localhost:3800
```

### Docker (both, one command)

```bash
docker compose up --build     # web on :3800, server on :4000
```

## What's included

| Area | What you can do |
| --- | --- |
| **Homepage** | Live online count, active rooms, trending topics, featured rooms, glassmorphism + motion |
| **Explore** | Browse/search live rooms, filter by category, "AI pick for you" recommendation |
| **People** | Presence list, follow/unfollow hosts, filter by role/status |
| **Live Room** | **Real WebRTC video grid** (avatar fallback), "who's talking" indicators, live chat, floating emoji reactions, typing indicators, raise hand, invite-by-link, mic/cam controls |
| **Join flow** | Request → admin approves/rejects (server-enforced) → you're let in |
| **Admin dashboard** | Role-based gate, max-3-admin cap, approve/reject requests, create/end/lock rooms, mute, pin, remove users, broadcast announcements, moderation logs |
| **Profile** | Auth methods (email / Google / phone), notification prefs, session & device tracking |

The demo "you" is **Zawadi Mwangi**, one of the 3 platform admins, so the admin dashboard and in-room moderation are unlocked.

## Architecture

```
┌────────────────────────┐        WebSocket (Socket.IO)        ┌───────────────────────────┐
│  Next.js 14 web app     │  ◀────────────────────────────────▶ │  Node + Express + Socket.IO │
│  (React, Tailwind,      │   presence · chat · reactions ·      │  realtime server            │
│   Framer Motion,        │   join requests · moderation         │  (server/)                  │
│   Zustand store)        │                                      │                             │
│                         │        WebRTC signaling relay        │  in-memory state +          │
│  WebRTC mesh (peer A/V)  │  ◀───── offer/answer/ICE ──────────▶ │  bot simulation             │
└────────────────────────┘                                      └───────────────────────────┘
```

- **Realtime:** `server/src/index.js` — Socket.IO handlers for identify/presence, room create/join/leave, admin-approved entry, mute/pin/remove/lock/end, chat, reactions, raise-hand, announcements, moderation logs. Includes **rate limiting** (join requests, chat, reactions) and a light server-side bot simulation so rooms feel alive.
- **Video:** full-**mesh WebRTC** (`src/lib/webrtc.ts`) with the server as signaling relay. Uses public STUN; add a **TURN** server for reliable NAT traversal in production. Mesh is ideal for small rooms — swap in an SFU (mediasoup / LiveKit) to scale to large rooms.
- **Client store:** `src/lib/store.ts` (Zustand) is dual-mode — every action routes to the server when connected, or mutates locally in demo mode. `src/lib/socket.ts` wires server events back into the store.

### Production hardening (roadmap)
Swap the server's in-memory state for **PostgreSQL** (accounts, rooms, logs) + **Redis** (presence/session fan-out, Socket.IO adapter for horizontal scale). Add real auth (email + Google OAuth + phone OTP), a TURN server, and an SFU for large rooms. All containerized via the included Dockerfiles.

## Deployment (make it a real, always-on site)

The frontend and realtime server deploy separately (the Socket.IO server needs a long-lived host, not serverless).

### 1. Realtime server + Postgres + Redis → Render (one click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/coprir/mbuzis-daily)

The included `render.yaml` **blueprint provisions everything** — the server, a persistent **Postgres** database (accounts, sessions, activity & logs survive restarts), and **Redis** (Socket.IO adapter for scale) — and wires `DATABASE_URL` / `REDIS_URL` automatically.

After the first deploy, set these in the Render dashboard (marked `sync: false`):
- `SUPER_ADMIN_CODE` — your private owner code
- `ADMIN_CODE` — the shared moderator code
- `SMTP_URL` — for real email (Gmail app password: `smtps://you%40gmail.com:app-pass@smtp.gmail.com:465`)

> Persistence and email are **optional and auto-detected**: with no `DATABASE_URL` the server runs on in-memory state; with no `SMTP_URL` email is a safe no-op. Set them to turn each on — no code change.

### 2. Web app → Vercel

`vercel.json` is included. Set `NEXT_PUBLIC_SOCKET_URL` to your Render server URL (**at build time** — it's inlined into the client bundle), then set the server's `CLIENT_ORIGIN` to your Vercel URL. If the server is ever unreachable, the app degrades gracefully to demo mode.

## Project structure

```
mbuzis-daily/
  src/
    app/                 # landing, explore, people, profile, admin, room/[id]
    components/          # Navbar, Avatar, RoomCard, PresenceList, LiveProvider
    lib/
      data.ts            # seed users, rooms, topics
      store.ts           # Zustand store (dual-mode: server ↔ demo)
      socket.ts          # Socket.IO client → store wiring
      webrtc.ts          # WebRTC mesh hook (peer video/audio)
      useMounted.ts      # hydration-safe mount gate
  server/
    src/index.js         # Socket.IO + WebRTC signaling server
    src/seed.js          # seed state (ids aligned with the web app)
    Dockerfile
  Dockerfile             # web app (Next standalone)
  docker-compose.yml     # both services locally
  render.yaml            # server (+ optional web) blueprint
  vercel.json            # frontend
```

## Tech stack

**Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand, socket.io-client, WebRTC.
**Backend:** Node.js, Express, Socket.IO, WebRTC signaling. **Infra:** Docker, Render/Vercel configs.
