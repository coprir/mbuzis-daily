"use client";

import { create } from "zustand";
import {
  users as seedUsers,
  rooms as seedRooms,
  currentUserId,
  type User,
  type Room,
  type JoinRequest,
  type Presence,
} from "./data";

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  at: number;
}

export interface FloatReaction {
  id: string;
  roomId: string;
  emoji: string;
}

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: "info" | "success" | "warn";
}

export interface ModLog {
  id: string;
  at: number;
  actor: string;
  action: string;
}

export interface ActivityItem {
  id: string;
  type: "join" | "promote" | "demote";
  at: number;
  username: string;
  userId: string;
  role?: string;
  actor?: string;
}

export interface PState {
  muted: boolean;
  pinned: boolean;
  handRaised: boolean;
  speaking: boolean;
}
type RoomMeta = Record<string, PState>;

interface State {
  users: User[];
  rooms: Room[];
  requests: JoinRequest[];
  messages: ChatMessage[];
  reactions: FloatReaction[];
  toasts: Toast[];
  modLogs: ModLog[];
  meta: Record<string, RoomMeta>;
  activity: ActivityItem[];
  owner: string | null;
  emailEnabled: boolean;
  currentUserId: string;

  // networking + auth
  connected: boolean; // authenticated & ready to route actions
  socketReady: boolean; // transport connected (may not be authed yet)
  liveMode: boolean; // a realtime server URL is configured
  emit: ((event: string, payload?: unknown) => void) | null;
  auth: { userId: string; token: string; username: string } | null;
  authError: string | null;
  authPending: boolean;
  setLiveMode: (v: boolean) => void;
  enterDemoMode: () => void;
  setEmit: (emit: State["emit"]) => void;
  setSocketReady: (v: boolean) => void;
  setConnected: (v: boolean) => void;
  setIdentity: (userId: string) => void;
  signIn: (username: string, adminCode?: string) => void;
  signOut: () => void;
  applyAuthOk: (p: { user: User; token: string }) => void;
  applyAuthError: (message: string) => void;
  userById: (id: string) => User | undefined;
  admittedRooms: string[];
  markAdmitted: (roomId: string) => void;
  markRemoved: (roomId: string) => void;

  pstate: (roomId: string, userId: string) => PState;

  // user-facing actions (routed to server when connected, else local demo)
  requestJoin: (roomId: string, userId?: string) => void;
  resolveRequest: (reqId: string, approve: boolean) => void;
  toggleMute: (roomId: string, userId: string) => void;
  togglePin: (roomId: string, userId: string) => void;
  raiseHand: (roomId: string, userId: string) => void;
  removeUser: (roomId: string, userId: string) => void;
  toggleLock: (roomId: string) => void;
  endRoom: (roomId: string) => void;
  createRoom: (title: string, topic: string, category: string, capacity: number) => string;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, text: string, userId?: string) => void;
  react: (roomId: string, emoji: string) => void;
  toggleFollow: (userId: string) => void;
  announce: (text: string) => void;
  promoteUser: (userId: string) => void;
  demoteUser: (userId: string) => void;
  emailLogs: () => void;
  logMod: (actorId: string, action: string) => void;
  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  tick: () => void;

  // server-event appliers (do NOT re-emit)
  applyInit: (p: {
    you?: string;
    users?: User[];
    rooms?: Room[];
    requests?: JoinRequest[];
    modLogs?: ModLog[];
    meta?: Record<string, RoomMeta>;
    activity?: ActivityItem[];
    owner?: string | null;
    emailEnabled?: boolean;
  }) => void;
  applyUsers: (u: User[]) => void;
  addActivity: (a: ActivityItem) => void;
  upsertRoom: (room: Room) => void;
  addRequest: (r: JoinRequest) => void;
  applyRequestResolved: (r: JoinRequest) => void;
  addMessage: (m: ChatMessage) => void;
  addReaction: (roomId: string, emoji: string) => void;
  setMetaEntry: (roomId: string, userId: string, ps: PState) => void;
  setMetaBulk: (meta: Record<string, RoomMeta>) => void;
  addModLog: (entry: ModLog) => void;
  setFollowState: (userId: string, following: boolean, followers: number) => void;
}

let seq = 0;
const uid = () => `x${Date.now().toString(36)}${(seq++).toString(36)}`;
const DEFAULT_PSTATE: PState = { muted: false, pinned: false, handRaised: false, speaking: false };

const emojiPool = ["🔥", "😂", "❤️", "👏", "🙌", "💯", "🎉", "😮", "🐐"];
const chatterPool = [
  "yooo this room is 🔥", "who else pulled up?", "turn the mic up!", "🐐 host fr",
  "amapiano all day", "🇰🇪 vibes only", "raise your hand jabari", "this take is wild lol",
  "brb making chai", "welcome welcome 👋",
];

export const useStore = create<State>((set, get) => {
  // emit to server if connected; returns true if it was routed to the network
  const route = (event: string, payload?: unknown) => {
    const { connected, emit } = get();
    if (connected && emit) {
      emit(event, payload);
      return true;
    }
    return false;
  };

  return {
    users: seedUsers,
    rooms: seedRooms,
    requests: [],
    messages: [],
    reactions: [],
    toasts: [],
    modLogs: [
      { id: uid(), at: Date.now() - 400000, actor: "Baraka Otieno", action: "muted a disruptive guest in Amapiano vs Afrobeats" },
      { id: uid(), at: Date.now() - 900000, actor: "Zawadi Mwangi", action: "locked Founders Unfiltered" },
    ],
    meta: {},
    activity: [],
    owner: null,
    emailEnabled: false,
    currentUserId,
    connected: false,
    socketReady: false,
    liveMode: false,
    emit: null,
    auth: null,
    authError: null,
    authPending: false,
    admittedRooms: [],

    setLiveMode: (v) => set({ liveMode: v }),
    enterDemoMode: () => set({ liveMode: false }), // fall back to local demo if the server is unreachable
    setEmit: (emit) => set({ emit }),
    setSocketReady: (v) => set((s) => ({ socketReady: v, connected: v ? s.connected : false })),
    setConnected: (v) => set({ connected: v }),
    setIdentity: (userId) => set({ currentUserId: userId }),

    signIn: (username, adminCode) => {
      const { emit } = get();
      if (!emit) {
        set({ authError: "Still connecting to the server — try again in a moment." });
        return;
      }
      set({ authPending: true, authError: null });
      emit("auth", { username, adminCode: adminCode || undefined });
    },
    signOut: () => {
      try { localStorage.removeItem("mbuzis_session"); } catch {}
      get().emit?.("auth:signout");
      if (typeof window !== "undefined") window.location.href = "/";
    },
    applyAuthOk: ({ user, token }) => {
      try {
        localStorage.setItem("mbuzis_session", JSON.stringify({ userId: user.id, token, username: user.username }));
      } catch {}
      set((s) => ({
        auth: { userId: user.id, token, username: user.username },
        currentUserId: user.id,
        connected: true,
        authPending: false,
        authError: null,
        users: s.users.some((u) => u.id === user.id)
          ? s.users.map((u) => (u.id === user.id ? user : u))
          : [...s.users, user],
      }));
    },
    applyAuthError: (message) => {
      try { localStorage.removeItem("mbuzis_session"); } catch {}
      set({ authError: message, authPending: false });
    },
    userById: (id) => get().users.find((u) => u.id === id),

    markAdmitted: (roomId) =>
      set((s) => (s.admittedRooms.includes(roomId) ? s : { admittedRooms: [...s.admittedRooms, roomId] })),
    markRemoved: (roomId) =>
      set((s) => ({ admittedRooms: s.admittedRooms.filter((r) => r !== roomId) })),

    pstate: (roomId, userId) => get().meta[roomId]?.[userId] ?? DEFAULT_PSTATE,

    logMod: (actorId, action) => {
      const u = get().users.find((x) => x.id === actorId);
      set((s) => ({
        modLogs: [{ id: uid(), at: Date.now(), actor: u?.username ?? "Admin", action }, ...s.modLogs].slice(0, 60),
      }));
    },

    requestJoin: (roomId, userId = currentUserId) => {
      if (route("room:join-request", { roomId })) return;
      if (get().requests.some((r) => r.roomId === roomId && r.userId === userId && r.status === "pending")) return;
      const req: JoinRequest = { id: uid(), roomId, userId, at: Date.now(), status: "pending" };
      set((s) => ({ requests: [req, ...s.requests] }));
      const room = get().rooms.find((r) => r.id === roomId);
      get().pushToast({ title: "Join request sent", body: `Waiting for an admin to approve you into “${room?.title}”.`, tone: "info" });
    },

    resolveRequest: (reqId, approve) => {
      if (route("room:resolve-request", { reqId, approve })) return;
      const req = get().requests.find((r) => r.id === reqId);
      if (!req || req.status !== "pending") return;
      set((s) => ({
        requests: s.requests.map((r) => (r.id === reqId ? { ...r, status: approve ? "approved" : "rejected" } : r)),
        rooms: approve
          ? s.rooms.map((room) =>
              room.id === req.roomId && !room.participantIds.includes(req.userId)
                ? { ...room, participantIds: [...room.participantIds, req.userId] }
                : room
            )
          : s.rooms,
      }));
      const u = get().users.find((x) => x.id === req.userId);
      get().logMod(get().currentUserId, `${approve ? "approved" : "rejected"} ${u?.username}'s join request`);
      get().pushToast({
        title: approve ? "Request approved" : "Request rejected",
        body: `${u?.username} was ${approve ? "let into the room" : "kept out"}.`,
        tone: approve ? "success" : "warn",
      });
    },

    toggleMute: (roomId, userId) => {
      if (route("room:mute", { roomId, userId })) return;
      set((s) => {
        const room = s.meta[roomId] ?? {};
        const cur = room[userId] ?? DEFAULT_PSTATE;
        return { meta: { ...s.meta, [roomId]: { ...room, [userId]: { ...cur, muted: !cur.muted } } } };
      });
      const u = get().users.find((x) => x.id === userId);
      get().logMod(get().currentUserId, `${get().pstate(roomId, userId).muted ? "muted" : "unmuted"} ${u?.username}`);
    },

    togglePin: (roomId, userId) => {
      if (route("room:pin", { roomId, userId })) return;
      set((s) => {
        const room = s.meta[roomId] ?? {};
        const cur = room[userId] ?? DEFAULT_PSTATE;
        return { meta: { ...s.meta, [roomId]: { ...room, [userId]: { ...cur, pinned: !cur.pinned } } } };
      });
      const u = get().users.find((x) => x.id === userId);
      get().logMod(get().currentUserId, `pinned ${u?.username} as speaker`);
    },

    raiseHand: (roomId, userId) => {
      if (route("room:raise-hand", { roomId })) return;
      set((s) => {
        const room = s.meta[roomId] ?? {};
        const cur = room[userId] ?? DEFAULT_PSTATE;
        return { meta: { ...s.meta, [roomId]: { ...room, [userId]: { ...cur, handRaised: !cur.handRaised } } } };
      });
    },

    removeUser: (roomId, userId) => {
      if (route("room:remove", { roomId, userId })) return;
      set((s) => ({
        rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, participantIds: r.participantIds.filter((id) => id !== userId) } : r)),
      }));
      const u = get().users.find((x) => x.id === userId);
      get().logMod(get().currentUserId, `removed ${u?.username} from the room`);
      get().pushToast({ title: "User removed", body: `${u?.username} was removed.`, tone: "warn" });
    },

    toggleLock: (roomId) => {
      if (route("room:lock", { roomId })) return;
      set((s) => ({ rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, locked: !r.locked } : r)) }));
      const room = get().rooms.find((r) => r.id === roomId);
      get().logMod(get().currentUserId, `${room?.locked ? "locked" : "unlocked"} ${room?.title}`);
    },

    endRoom: (roomId) => {
      if (route("room:end", { roomId })) return;
      set((s) => ({ rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, live: false } : r)) }));
      const room = get().rooms.find((r) => r.id === roomId);
      get().logMod(get().currentUserId, `ended ${room?.title}`);
    },

    createRoom: (title, topic, category, capacity) => {
      const id = uid();
      const room: Room = {
        id, title, topic, hostId: currentUserId, category, capacity,
        locked: false, live: true, trending: false, featured: false,
        thumbnail: "linear-gradient(135deg,#8b5cf6,#22d3ee)",
        participantIds: [currentUserId], startedAt: Date.now(),
      };
      set((s) => ({ rooms: [room, ...s.rooms.filter((r) => r.id !== id)] }));
      get().pushToast({ title: "Room is live! 🎥", body: `“${title}” was created.`, tone: "success" });
      if (!route("room:create", { id, title, topic, category, capacity })) {
        get().logMod(currentUserId, `created room ${title}`);
      }
      return id;
    },

    leaveRoom: (roomId) => {
      route("room:leave", { roomId });
    },

    sendMessage: (roomId, text, userId = currentUserId) => {
      if (!text.trim()) return;
      if (userId === currentUserId && route("chat:send", { roomId, text })) return;
      get().addMessage({ id: uid(), roomId, userId, text: text.trim(), at: Date.now() });
    },

    react: (roomId, emoji) => {
      if (route("reaction:send", { roomId, emoji })) return;
      get().addReaction(roomId, emoji);
    },

    toggleFollow: (userId) => {
      if (route("user:follow", { userId })) return;
      set((s) => ({
        users: s.users.map((u) =>
          u.id === userId ? { ...u, following: !u.following, followers: u.followers + (u.following ? -1 : 1) } : u
        ),
      }));
    },

    announce: (text) => {
      if (route("announce", { text })) {
        get().pushToast({ title: "📣 Announcement sent", body: text, tone: "success" });
        return;
      }
      get().logMod(get().currentUserId, `announced: “${text}”`);
      get().pushToast({ title: "📣 Announcement sent", body: text, tone: "success" });
    },

    promoteUser: (userId) => {
      if (route("admin:promote", { userId })) return;
      set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, role: "admin" } : u)) }));
      const u = get().users.find((x) => x.id === userId);
      get().logMod(get().currentUserId, `promoted ${u?.username} to admin`);
    },
    demoteUser: (userId) => {
      if (route("admin:demote", { userId })) return;
      set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, role: "member" } : u)) }));
      const u = get().users.find((x) => x.id === userId);
      get().logMod(get().currentUserId, `removed admin from ${u?.username}`);
    },
    emailLogs: () => {
      if (route("logs:email")) return;
      get().pushToast({ title: "Connect to the live server", body: "Log emails send from the realtime server.", tone: "warn" });
    },

    pushToast: (t) => {
      const id = uid();
      set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
      setTimeout(() => get().dismissToast(id), 4200);
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

    // ---- server-event appliers ----
    applyInit: (p) => {
      set((s) => ({
        currentUserId: p.you ?? s.currentUserId,
        users: p.users ?? s.users, // server sends full user list (incl. registered users)
        rooms: p.rooms ?? s.rooms,
        requests: p.requests ?? s.requests,
        modLogs: p.modLogs ?? s.modLogs,
        meta: p.meta ?? s.meta,
        activity: p.activity ?? s.activity,
        owner: p.owner ?? s.owner,
        emailEnabled: p.emailEnabled ?? s.emailEnabled,
      }));
    },
    applyUsers: (u) => set({ users: u }),
    addActivity: (a) =>
      set((s) => (s.activity.some((x) => x.id === a.id) ? s : { activity: [a, ...s.activity].slice(0, 300) })),
    upsertRoom: (room) =>
      set((s) => {
        const exists = s.rooms.some((r) => r.id === room.id);
        return { rooms: exists ? s.rooms.map((r) => (r.id === room.id ? room : r)) : [room, ...s.rooms] };
      }),
    addRequest: (r) =>
      set((s) => (s.requests.some((x) => x.id === r.id) ? s : { requests: [r, ...s.requests].slice(0, 40) })),
    applyRequestResolved: (r) =>
      set((s) => ({ requests: s.requests.map((x) => (x.id === r.id ? { ...x, status: r.status } : x)) })),
    addMessage: (m) =>
      set((s) => (s.messages.some((x) => x.id === m.id) ? s : { messages: [...s.messages, m].slice(-400) })),
    addReaction: (roomId, emoji) => {
      const r: FloatReaction = { id: uid(), roomId, emoji };
      set((s) => ({ reactions: [...s.reactions, r] }));
      setTimeout(() => set((s) => ({ reactions: s.reactions.filter((x) => x.id !== r.id) })), 2600);
    },
    setMetaEntry: (roomId, userId, ps) =>
      set((s) => ({ meta: { ...s.meta, [roomId]: { ...(s.meta[roomId] ?? {}), [userId]: ps } } })),
    setMetaBulk: (meta) => set({ meta }),
    addModLog: (entry) =>
      set((s) => (s.modLogs.some((x) => x.id === entry.id) ? s : { modLogs: [entry, ...s.modLogs].slice(0, 60) })),
    setFollowState: (userId, following, followers) =>
      set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, following, followers } : u)) })),

    // ---- demo-mode simulation (disabled while connected) ----
    tick: () => {
      const s = get();
      if (s.connected) return;
      const roll = Math.random();
      if (roll < 0.6) {
        const liveRooms = s.rooms.filter((r) => r.live && r.participantIds.length > 1);
        const room = liveRooms[Math.floor(Math.random() * liveRooms.length)];
        if (room) {
          const others = room.participantIds.filter((id) => id !== s.currentUserId);
          const speaker = others[Math.floor(Math.random() * others.length)];
          if (speaker) get().sendMessage(room.id, chatterPool[Math.floor(Math.random() * chatterPool.length)], speaker);
        }
      }
      if (roll > 0.5) {
        const liveRooms = s.rooms.filter((r) => r.live);
        const room = liveRooms[Math.floor(Math.random() * liveRooms.length)];
        if (room) get().addReaction(room.id, emojiPool[Math.floor(Math.random() * emojiPool.length)]);
      }
      if (roll > 0.86) {
        const guests = s.users.filter((u) => u.presence !== "in-call" && u.id !== s.currentUserId);
        const guest = guests[Math.floor(Math.random() * guests.length)];
        const liveRooms = s.rooms.filter((r) => r.live);
        const room = liveRooms[Math.floor(Math.random() * liveRooms.length)];
        if (guest && room && !s.requests.some((r) => r.userId === guest.id && r.status === "pending")) {
          set((st) => ({
            requests: [{ id: uid(), roomId: room.id, userId: guest.id, at: Date.now(), status: "pending" as const }, ...st.requests].slice(0, 30),
          }));
        }
      }
      set((st) => {
        const meta = { ...st.meta };
        for (const room of st.rooms.filter((r) => r.live)) {
          const rm = { ...(meta[room.id] ?? {}) };
          for (const pid of room.participantIds) {
            const cur = rm[pid] ?? DEFAULT_PSTATE;
            rm[pid] = { ...cur, speaking: !cur.muted && Math.random() > 0.72 };
          }
          meta[room.id] = rm;
        }
        const opts: Presence[] = ["online", "away", "in-call"];
        const users = roll > 0.7
          ? st.users.map((u) => (Math.random() > 0.92 ? { ...u, presence: opts[Math.floor(Math.random() * opts.length)] } : u))
          : st.users;
        return { meta, users };
      });
    },
  };
});

export const onlineCount = (users: User[]) => users.filter((u) => u.presence !== "offline").length;
