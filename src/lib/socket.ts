"use client";

import { io, type Socket } from "socket.io-client";
import { useStore } from "./store";
import { users, currentUserId } from "./data";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

// Give each visitor a distinct identity so friends appear as different people.
// Priority: ?u=<id> query param → saved localStorage id → a random member.
// Tip: open ?u=u1 to be "Zawadi" (an admin) and access the admin dashboard.
function resolveIdentity(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("u");
    const valid = (id: string | null) => !!id && users.some((u) => u.id === id);
    if (valid(q)) {
      localStorage.setItem("mbuzis_uid", q!);
      return q!;
    }
    const saved = localStorage.getItem("mbuzis_uid");
    if (valid(saved)) return saved!;
    // pick a random non-admin seed identity (members/guests: u7..u20)
    const pool = users.filter((u) => u.role !== "admin").map((u) => u.id);
    const pick = pool[Math.floor(Math.random() * pool.length)] || currentUserId;
    localStorage.setItem("mbuzis_uid", pick);
    return pick;
  } catch {
    return currentUserId;
  }
}

/**
 * Connect to the realtime server if NEXT_PUBLIC_SOCKET_URL is configured.
 * If it isn't set, or the connection fails, the app stays in demo mode
 * (the client-side simulation in the store keeps running).
 */
export function initSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socket) return socket;

  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) return null; // demo mode

  const store = useStore.getState();
  const identity = resolveIdentity();
  store.setIdentity(identity); // reflect in the UI even before/without connecting

  socket = io(url, {
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    timeout: 6000,
  });

  socket.on("connect", () => {
    socket?.emit("identify", { userId: identity });
    useStore.getState().setNet((event, payload) => socket?.emit(event, payload), true);
  });

  socket.on("disconnect", () => {
    useStore.getState().setNet(null, false);
  });

  socket.io.on("error", () => {
    useStore.getState().setNet(null, false);
  });

  // ---- state sync ----
  socket.on("state:init", (p) => store.applyInit(p));
  socket.on("users:update", (u) => useStore.getState().applyUsers(u));
  socket.on("room:update", (r) => useStore.getState().upsertRoom(r));
  socket.on("room:created", (r) => useStore.getState().upsertRoom(r));
  socket.on("room:ended", ({ roomId }) => {
    const room = useStore.getState().rooms.find((r) => r.id === roomId);
    if (room) useStore.getState().upsertRoom({ ...room, live: false });
  });

  // ---- requests / admission ----
  socket.on("request:new", (r) => useStore.getState().addRequest(r));
  socket.on("request:resolved", (r) => useStore.getState().applyRequestResolved(r));
  socket.on("you:admitted", ({ roomId }) => useStore.getState().markAdmitted(roomId));
  socket.on("you:removed", ({ roomId }) => {
    useStore.getState().markRemoved(roomId);
    useStore.getState().pushToast({ title: "Removed from room", body: "An admin removed you from the room.", tone: "warn" });
  });

  // ---- chat / reactions ----
  socket.on("chat:new", (m) => useStore.getState().addMessage(m));
  socket.on("reaction:new", ({ roomId, emoji }) => useStore.getState().addReaction(roomId, emoji));

  // ---- meta (mute/pin/hand/speaking) ----
  socket.on("meta:update", ({ roomId, userId, pstate }) => useStore.getState().setMetaEntry(roomId, userId, pstate));
  socket.on("meta:bulk", (meta) => useStore.getState().setMetaBulk(meta));

  // ---- mod logs / follow / announcements / toasts ----
  socket.on("mod:log", (entry) => useStore.getState().addModLog(entry));
  socket.on("user:followed", ({ userId, following, followers }) =>
    useStore.getState().setFollowState(userId, following, followers)
  );
  socket.on("announcement", ({ text, by }) =>
    useStore.getState().pushToast({ title: `📣 ${by}`, body: text, tone: "info" })
  );
  socket.on("toast", (t) => useStore.getState().pushToast(t));

  return socket;
}
