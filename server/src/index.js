import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { makeUsers, makeRooms, TRENDING_TOPICS, MAX_ADMINS } from "./seed.js";

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.CLIENT_ORIGIN || "*";
const ADMIN_CODE = process.env.ADMIN_CODE || "mbuzi-admin-2026";

// registered sessions for username auth: userId -> { token, username }
const sessions = new Map();

const PALETTE = [
  "linear-gradient(135deg,#8b5cf6,#d946ef)",
  "linear-gradient(135deg,#22d3ee,#3b82f6)",
  "linear-gradient(135deg,#f472b6,#fb7185)",
  "linear-gradient(135deg,#a3e635,#22d3ee)",
  "linear-gradient(135deg,#fbbf24,#f97316)",
  "linear-gradient(135deg,#818cf8,#c084fc)",
  "linear-gradient(135deg,#2dd4bf,#0ea5e9)",
  "linear-gradient(135deg,#f43f5e,#8b5cf6)",
];
const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const initialsOf = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const stripSockets = (u) => { const { sockets, ...rest } = u; return rest; };

// ---------------------------------------------------------------------------
// In-memory state (swap for Postgres + Redis in production; see README)
// ---------------------------------------------------------------------------
const state = {
  users: makeUsers(),
  rooms: makeRooms(Date.now()),
  requests: [], // { id, roomId, userId, at, status }
  modLogs: [
    { id: nanoid(), at: Date.now() - 400000, actor: "Baraka Otieno", action: "muted a disruptive guest in Amapiano vs Afrobeats" },
    { id: nanoid(), at: Date.now() - 900000, actor: "Zawadi Mwangi", action: "locked Founders Unfiltered" },
  ],
  meta: {}, // roomId -> userId -> { muted, pinned, handRaised, speaking }
};

const userById = (id) => state.users.find((u) => u.id === id);
const roomById = (id) => state.rooms.find((r) => r.id === id);
const isPrivileged = (userId, room) => {
  const u = userById(userId);
  return !!u && (u.role === "admin" || room?.hostId === userId);
};

function pstate(roomId, userId) {
  return state.meta[roomId]?.[userId] || { muted: false, pinned: false, handRaised: false, speaking: false };
}
function setPState(roomId, userId, patch) {
  state.meta[roomId] = state.meta[roomId] || {};
  state.meta[roomId][userId] = { ...pstate(roomId, userId), ...patch };
}

// presence is derived: online if the user holds >=1 socket, else fall back to seed
function derivePresence(u) {
  if (u.sockets.size > 0) {
    const inRoom = state.rooms.some((r) => r.live && r.participantIds.includes(u.id));
    return inRoom ? "in-call" : "online";
  }
  // real (registered) users go offline when they disconnect; seed bots keep
  // their seeded presence so the space always feels populated.
  return u.dynamic ? "offline" : u.presence;
}
// full user objects so the client can render dynamically-registered users
function publicUsers() {
  return state.users.map((u) => ({ ...stripSockets(u), presence: derivePresence(u) }));
}
function emitInit(socket) {
  socket.emit("state:init", {
    you: socket.data.userId,
    users: publicUsers(),
    rooms: publicRooms(),
    requests: state.requests.filter((r) => r.status === "pending"),
    modLogs: state.modLogs,
    meta: state.meta,
    trending: TRENDING_TOPICS,
    maxAdmins: MAX_ADMINS,
  });
}
function publicRooms() {
  return state.rooms.map((r) => ({ ...r }));
}
function logMod(actorId, action) {
  const u = userById(actorId);
  const entry = { id: nanoid(), at: Date.now(), actor: u?.username ?? "Admin", action };
  state.modLogs = [entry, ...state.modLogs].slice(0, 60);
  io.emit("mod:log", entry);
}

// ---------------------------------------------------------------------------
// Rate limiting / anti-spam (per user)
// ---------------------------------------------------------------------------
const buckets = new Map(); // key -> timestamps[]
function allow(key, max, windowMs) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

// ---------------------------------------------------------------------------
// HTTP + Socket.IO
// ---------------------------------------------------------------------------
const app = express();
app.use(cors({ origin: ORIGIN }));
app.get("/", (_req, res) => res.json({ service: "mbuzis-daily-server", ok: true }));
app.get("/health", (_req, res) =>
  res.json({
    ok: true,
    users: state.users.filter((u) => derivePresence(u) !== "offline").length,
    liveRooms: state.rooms.filter((r) => r.live).length,
    connections: io?.engine?.clientsCount ?? 0,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ORIGIN, methods: ["GET", "POST"] },
});

function broadcastUsers() {
  io.emit("users:update", publicUsers());
}
function broadcastRoom(room) {
  io.emit("room:update", room);
}

io.on("connection", (socket) => {
  let userId = null;

  // ---- seed identity (used by ?u= links and tests; no registration) ----
  socket.on("identify", (payload) => {
    userId = (payload && payload.userId) || "u1";
    const u = userById(userId);
    if (!u) return;
    u.sockets.add(socket.id);
    socket.data.userId = userId;
    emitInit(socket);
    broadcastUsers();
  });

  // ---- username auth: register a new user, or resume a saved session ----
  socket.on("auth", (payload = {}) => {
    // resume an existing session
    if (payload.resume?.userId && payload.resume?.token) {
      const sess = sessions.get(payload.resume.userId);
      const u = userById(payload.resume.userId);
      if (sess && u && sess.token === payload.resume.token) {
        userId = u.id;
        u.sockets.add(socket.id);
        socket.data.userId = userId;
        socket.emit("auth:ok", { user: stripSockets(u), token: sess.token });
        emitInit(socket);
        broadcastUsers();
      } else {
        socket.emit("auth:error", { code: "session", message: "Session expired — pick a username to rejoin." });
      }
      return;
    }

    // register a new username
    const name = String(payload.username || "").trim().slice(0, 20);
    if (name.length < 2) return socket.emit("auth:error", { message: "Username must be at least 2 characters." });
    if (!/^[\w .-]+$/.test(name)) return socket.emit("auth:error", { message: "Use letters, numbers, spaces, _ or - only." });
    if (state.users.some((u) => u.username.toLowerCase() === name.toLowerCase()))
      return socket.emit("auth:error", { message: "That username is taken — try another." });

    let role = "member";
    if (payload.adminCode) {
      if (payload.adminCode !== ADMIN_CODE)
        return socket.emit("auth:error", { message: "Invalid admin code." });
      const activeAdmins = state.users.filter((u) => u.role === "admin" && u.sockets.size > 0).length;
      if (activeAdmins >= MAX_ADMINS)
        return socket.emit("auth:error", { message: `All ${MAX_ADMINS} admin seats are in use — join as a member.` });
      role = "admin";
    }

    const u = {
      id: "g" + nanoid(8),
      username: name,
      handle: (name.toLowerCase().replace(/[^a-z0-9]/g, "") || "guest").slice(0, 15),
      avatar: initialsOf(name),
      role,
      presence: "online",
      bio: "New to Mbuzis Daily 👋",
      followers: 0,
      following: false,
      color: PALETTE[hashStr(name) % PALETTE.length],
      dynamic: true,
      sockets: new Set(),
    };
    state.users.push(u);
    const token = nanoid(24);
    sessions.set(u.id, { token, username: name });
    userId = u.id;
    u.sockets.add(socket.id);
    socket.data.userId = userId;
    socket.emit("auth:ok", { user: stripSockets(u), token });
    emitInit(socket);
    broadcastUsers();
    if (role === "admin") logMod(u.id, `joined as an admin`);
  });

  // ---- sign out ----
  socket.on("auth:signout", () => {
    const u = userById(socket.data.userId);
    if (u) {
      u.sockets.delete(socket.id);
      broadcastUsers();
    }
    userId = null;
    socket.data.userId = null;
  });

  // ---- create room ----
  socket.on("room:create", ({ id: rid, title, topic, category, capacity } = {}) => {
    if (!userId || !title) return;
    if (!allow(`create:${userId}`, 4, 60000)) return;
    const cleanId = typeof rid === "string" && /^[a-zA-Z0-9_-]{4,24}$/.test(rid) && !roomById(rid) ? rid : nanoid(8);
    const room = {
      id: cleanId,
      title: String(title).slice(0, 80),
      topic: String(topic || "Live conversation").slice(0, 120),
      hostId: userId,
      category: category || "Lifestyle",
      capacity: Math.min(100, Math.max(2, Number(capacity) || 12)),
      locked: false,
      live: true,
      trending: false,
      featured: false,
      thumbnail: "linear-gradient(135deg,#8b5cf6,#22d3ee)",
      participantIds: [userId],
      startedAt: Date.now(),
    };
    state.rooms.unshift(room);
    logMod(userId, `created room ${room.title}`);
    io.emit("room:created", room);
    broadcastRoom(room);
    socket.emit("you:admitted", { roomId: room.id });
  });

  // ---- request to join ----
  socket.on("room:join-request", ({ roomId } = {}) => {
    const room = roomById(roomId);
    if (!userId || !room || !room.live) return;
    if (room.participantIds.includes(userId)) {
      socket.emit("you:admitted", { roomId });
      return;
    }
    // privileged users skip the queue
    if (isPrivileged(userId, room)) {
      admit(userId, room);
      return;
    }
    if (room.locked) {
      socket.emit("toast", { title: "Room locked", body: "This room is locked. Ask an admin for an invite.", tone: "warn" });
      return;
    }
    if (!allow(`join:${userId}`, 5, 60000)) {
      socket.emit("toast", { title: "Slow down", body: "Too many join requests — try again shortly.", tone: "warn" });
      return;
    }
    if (state.requests.some((r) => r.roomId === roomId && r.userId === userId && r.status === "pending")) return;
    const req = { id: nanoid(), roomId, userId, at: Date.now(), status: "pending" };
    state.requests.unshift(req);
    io.emit("request:new", req);
    socket.emit("toast", { title: "Join request sent", body: `Waiting for an admin to approve you into “${room.title}”.`, tone: "info" });
  });

  // ---- approve / reject ----
  socket.on("room:resolve-request", ({ reqId, approve } = {}) => {
    const req = state.requests.find((r) => r.id === reqId);
    if (!req || req.status !== "pending") return;
    const room = roomById(req.roomId);
    if (!room || !isPrivileged(userId, room)) return;
    req.status = approve ? "approved" : "rejected";
    io.emit("request:resolved", req);
    const target = userById(req.userId);
    logMod(userId, `${approve ? "approved" : "rejected"} ${target?.username}'s join request`);
    if (approve) admit(req.userId, room);
  });

  function admit(uid, room) {
    if (!room.participantIds.includes(uid)) {
      room.participantIds.push(uid);
      broadcastRoom(room);
      broadcastUsers();
    }
    // tell every socket held by that user they're in
    const u = userById(uid);
    u?.sockets.forEach((sid) => io.to(sid).emit("you:admitted", { roomId: room.id }));
  }

  // ---- leave ----
  socket.on("room:leave", ({ roomId } = {}) => {
    const room = roomById(roomId);
    if (!room || !userId) return;
    room.participantIds = room.participantIds.filter((id) => id !== userId);
    broadcastRoom(room);
    broadcastUsers();
    socket.to(`rtc:${roomId}`).emit("rtc:peer-left", { socketId: socket.id, userId });
    socket.leave(`rtc:${roomId}`);
  });

  // ---- moderation ----
  socket.on("room:lock", ({ roomId } = {}) => {
    const room = roomById(roomId);
    if (!room || !isPrivileged(userId, room)) return;
    room.locked = !room.locked;
    logMod(userId, `${room.locked ? "locked" : "unlocked"} ${room.title}`);
    broadcastRoom(room);
  });

  socket.on("room:end", ({ roomId } = {}) => {
    const room = roomById(roomId);
    if (!room || !isPrivileged(userId, room)) return;
    room.live = false;
    logMod(userId, `ended ${room.title}`);
    broadcastRoom(room);
    io.to(`rtc:${roomId}`).emit("room:ended", { roomId });
  });

  socket.on("room:mute", ({ roomId, userId: target } = {}) => {
    const room = roomById(roomId);
    if (!room || !isPrivileged(userId, room)) return;
    const now = !pstate(roomId, target).muted;
    setPState(roomId, target, { muted: now });
    logMod(userId, `${now ? "muted" : "unmuted"} ${userById(target)?.username}`);
    io.emit("meta:update", { roomId, userId: target, pstate: pstate(roomId, target) });
  });

  socket.on("room:pin", ({ roomId, userId: target } = {}) => {
    const room = roomById(roomId);
    if (!room || !isPrivileged(userId, room)) return;
    setPState(roomId, target, { pinned: !pstate(roomId, target).pinned });
    logMod(userId, `pinned ${userById(target)?.username} as speaker`);
    io.emit("meta:update", { roomId, userId: target, pstate: pstate(roomId, target) });
  });

  socket.on("room:remove", ({ roomId, userId: target } = {}) => {
    const room = roomById(roomId);
    if (!room || !isPrivileged(userId, room)) return;
    room.participantIds = room.participantIds.filter((id) => id !== target);
    logMod(userId, `removed ${userById(target)?.username} from the room`);
    broadcastRoom(room);
    broadcastUsers();
    userById(target)?.sockets.forEach((sid) => io.to(sid).emit("you:removed", { roomId }));
  });

  socket.on("room:raise-hand", ({ roomId } = {}) => {
    if (!userId) return;
    setPState(roomId, userId, { handRaised: !pstate(roomId, userId).handRaised });
    io.emit("meta:update", { roomId, userId, pstate: pstate(roomId, userId) });
  });

  // ---- chat ----
  socket.on("chat:send", ({ roomId, text } = {}) => {
    if (!userId || !text || !text.trim()) return;
    if (!allow(`chat:${userId}`, 8, 10000)) return; // anti-spam
    const room = roomById(roomId);
    if (!room || !room.participantIds.includes(userId)) return;
    const msg = { id: nanoid(), roomId, userId, text: String(text).slice(0, 500).trim(), at: Date.now() };
    io.emit("chat:new", msg);
  });

  // ---- reactions ----
  socket.on("reaction:send", ({ roomId, emoji } = {}) => {
    if (!userId || !emoji) return;
    if (!allow(`react:${userId}`, 12, 5000)) return;
    io.emit("reaction:new", { id: nanoid(), roomId, emoji: String(emoji).slice(0, 8) });
  });

  // ---- announcements (admins only) ----
  socket.on("announce", ({ text } = {}) => {
    const u = userById(userId);
    if (!u || u.role !== "admin" || !text) return;
    logMod(userId, `announced: “${String(text).slice(0, 200)}”`);
    io.emit("announcement", { text: String(text).slice(0, 200), by: u.username });
  });

  // ---- follow ----
  socket.on("user:follow", ({ userId: target } = {}) => {
    const u = userById(target);
    if (!u) return;
    u.following = !u.following;
    u.followers += u.following ? 1 : -1;
    io.emit("user:followed", { userId: target, following: u.following, followers: u.followers });
  });

  // ---- WebRTC mesh signaling ----
  socket.on("rtc:join", ({ roomId } = {}) => {
    if (!userId) return;
    const clients = Array.from(io.sockets.adapter.rooms.get(`rtc:${roomId}`) || []);
    const peers = clients.map((sid) => ({ socketId: sid, userId: io.sockets.sockets.get(sid)?.data.userId }));
    socket.join(`rtc:${roomId}`);
    socket.emit("rtc:peers", { peers }); // existing peers to call
    socket.to(`rtc:${roomId}`).emit("rtc:peer-joined", { socketId: socket.id, userId });
  });

  socket.on("rtc:signal", ({ to, data } = {}) => {
    if (!to) return;
    io.to(to).emit("rtc:signal", { from: socket.id, userId, data });
  });

  // ---- disconnect ----
  socket.on("disconnect", () => {
    const u = userById(socket.data.userId);
    if (u) {
      u.sockets.delete(socket.id);
      broadcastUsers();
    }
    // notify rtc rooms
    io.emit("rtc:peer-left", { socketId: socket.id, userId: socket.data.userId });
  });
});

// ---------------------------------------------------------------------------
// Light server-side simulation so rooms feel alive even with one real user
// ---------------------------------------------------------------------------
const emojiPool = ["🔥", "😂", "❤️", "👏", "🙌", "💯", "🎉", "😮", "🐐"];
const chatterPool = [
  "yooo this room is 🔥", "who else pulled up?", "turn the mic up!", "🐐 host fr",
  "amapiano all day", "🇰🇪 vibes only", "this take is wild lol", "brb making chai",
  "welcome welcome 👋", "raise your hand!",
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

setInterval(() => {
  const live = state.rooms.filter((r) => r.live && r.participantIds.length > 0);
  if (!live.length) return;
  const roll = Math.random();

  if (roll < 0.6) {
    const room = pick(live);
    const bots = room.participantIds.filter((id) => !userById(id)?.sockets.size);
    if (bots.length) {
      io.emit("chat:new", { id: nanoid(), roomId: room.id, userId: pick(bots), text: pick(chatterPool), at: Date.now() });
    }
  }
  if (roll > 0.5) {
    const room = pick(live);
    io.emit("reaction:new", { id: nanoid(), roomId: room.id, emoji: pick(emojiPool) });
  }
  // speaking indicators for bots
  for (const room of live) {
    for (const pid of room.participantIds) {
      if (userById(pid)?.sockets.size) continue; // real users drive their own
      setPState(room.id, pid, { speaking: !pstate(room.id, pid).muted && Math.random() > 0.72 });
    }
  }
  io.emit("meta:bulk", state.meta);
}, 2400);

server.listen(PORT, () => {
  console.log(`⚡ Mbuzis Daily realtime server on :${PORT} (origin: ${ORIGIN})`);
});
