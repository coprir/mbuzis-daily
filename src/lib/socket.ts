"use client";

import { io, type Socket } from "socket.io-client";
import { useStore } from "./store";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

function savedSession(): { userId: string; token: string } | null {
  try {
    const raw = localStorage.getItem("mbuzis_session");
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.userId && s?.token ? { userId: s.userId, token: s.token } : null;
  } catch {
    return null;
  }
}

/**
 * Connect to the realtime server if NEXT_PUBLIC_SOCKET_URL is configured.
 * In live mode, users authenticate with a username (see AuthGate) — or resume
 * a saved session automatically. Without a server URL the app runs in demo
 * mode with the seed identity.
 */
export function initSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socket) return socket;

  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) return null; // demo mode

  const store = useStore.getState();
  store.setLiveMode(true);

  socket = io(url, {
    transports: ["websocket", "polling"],
    reconnectionAttempts: 8,
    timeout: 7000,
  });

  socket.on("connect", () => {
    const s = useStore.getState();
    s.setEmit((event, payload) => socket?.emit(event, payload));
    s.setSocketReady(true);
    // auto-resume a saved session; otherwise the AuthGate collects a username
    const sess = savedSession();
    if (sess) socket?.emit("auth", { resume: sess });
  });

  socket.on("disconnect", () => {
    const s = useStore.getState();
    s.setEmit(null);
    s.setSocketReady(false);
  });

  socket.io.on("error", () => useStore.getState().setSocketReady(false));

  // ---- auth ----
  socket.on("auth:ok", (p) => useStore.getState().applyAuthOk(p));
  socket.on("auth:error", (e) => useStore.getState().applyAuthError(e?.message || "Sign-in failed."));

  // ---- state sync ----
  socket.on("state:init", (p) => useStore.getState().applyInit(p));
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
