"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Hand, Send, LogOut, Lock, Users, Pin, Volume2, Radio,
  ShieldCheck, MoreVertical, UserX, Link2, PhoneOff, Video, VideoOff, Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { useStore } from "@/lib/store";
import { useMesh } from "@/lib/webrtc";

const reactions = ["🔥", "😂", "❤️", "👏", "🙌", "💯", "🎉", "🐐"];

export default function RoomPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const store = useStore();
  const room = store.rooms.find((r) => r.id === id);
  const meId = store.currentUserId;
  const me = store.userById(meId)!;

  const [joined, setJoined] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const isAdmin = me.role === "admin";
  const isHost = room?.hostId === meId;
  const canModerate = isAdmin || isHost;
  const inRoom = room?.participantIds.includes(meId) ?? false;

  // auto-join if admin/host or already a participant
  useEffect(() => {
    if (inRoom || isAdmin || isHost) setJoined(true);
  }, [inRoom, isAdmin, isHost]);

  // watch our own pending join request being approved (demo mode)
  const myReq = store.requests.find((r) => r.roomId === id && r.userId === meId);
  // watch server admission (connected mode)
  const admitted = store.admittedRooms.includes(id);
  useEffect(() => {
    if (myReq?.status === "approved" || admitted) {
      setJoined(true);
      setPendingJoin(false);
    }
  }, [myReq?.status, admitted]);

  if (!room) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="grid place-items-center py-32 text-center">
          <p className="text-white/60">This room has ended or doesn&apos;t exist.</p>
          <Link href="/explore" className="btn-neon mt-4">Back to explore</Link>
        </div>
      </main>
    );
  }

  if (!room.live) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="grid place-items-center py-32 text-center">
          <Radio className="h-10 w-10 text-white/30" />
          <p className="mt-3 text-white/60">“{room.title}” has ended.</p>
          <Link href="/explore" className="btn-neon mt-4">Find another room</Link>
        </div>
      </main>
    );
  }

  // ---- Lobby (request to join) ----
  if (!joined) {
    const host = store.userById(room.hostId)!;
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="mx-auto grid max-w-md place-items-center px-4 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass w-full p-8">
            <div className="mx-auto h-24 w-full rounded-xl" style={{ background: room.thumbnail }} />
            <h1 className="mt-4 font-display text-xl font-bold text-white">{room.title}</h1>
            <p className="mt-1 text-sm text-white/55">{room.topic}</p>
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-white/60">
              <span className="chip bg-white/5"><Users className="h-3.5 w-3.5" /> {room.participantIds.length}/{room.capacity}</span>
              {room.locked && <span className="chip bg-red-500/15 text-red-400"><Lock className="h-3.5 w-3.5" /> Locked</span>}
              <span className="chip bg-white/5">Host · {host.username}</span>
            </div>

            {pendingJoin ? (
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 text-neon-amber">
                  <span className="h-2 w-2 animate-pulseglow rounded-full bg-neon-amber" />
                  <span className="text-sm font-medium">Waiting for an admin to approve you…</span>
                </div>
                <p className="mt-2 text-xs text-white/45">
                  Tip: open the <Link href="/admin" className="text-neon-cyan underline">Admin dashboard</Link> in
                  this demo and approve your own request.
                </p>
              </div>
            ) : room.locked ? (
              <p className="mt-6 text-sm text-red-400">This room is locked. Ask an admin for an invite link.</p>
            ) : (
              <button
                onClick={() => { store.requestJoin(id); setPendingJoin(true); }}
                className="btn-neon mt-6 w-full"
              >
                <Hand className="h-4 w-4" /> Request to join
              </button>
            )}
            <Link href="/explore" className="btn-ghost mt-3 w-full">Back to explore</Link>
          </motion.div>
        </div>
      </main>
    );
  }

  return <LiveRoom roomId={id} micOn={micOn} setMicOn={setMicOn} camOn={camOn} setCamOn={setCamOn} canModerate={canModerate} />;
}

function LiveRoom({
  roomId, micOn, setMicOn, camOn, setCamOn, canModerate,
}: {
  roomId: string; micOn: boolean; setMicOn: (v: boolean) => void;
  camOn: boolean; setCamOn: (v: boolean) => void; canModerate: boolean;
}) {
  const store = useStore();
  const room = store.rooms.find((r) => r.id === roomId)!;
  const meId = store.currentUserId;
  const connected = store.connected;
  const messages = store.messages.filter((m) => m.roomId === roomId);
  const floats = store.reactions.filter((r) => r.roomId === roomId);
  const [text, setText] = useState("");
  const [handUp, setHandUp] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // real peer video/audio over WebRTC when connected to the live server
  const { localStream, streams, mediaError } = useMesh({ roomId, active: connected, micOn, camOn });

  const participants = room.participantIds.map((pid) => store.userById(pid)!).filter(Boolean);
  const pinned = participants.filter((p) => store.pstate(roomId, p.id).pinned);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const copyInvite = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    store.pushToast({ title: "Invite link copied 🔗", body: url, tone: "success" });
  };

  const send = () => {
    if (!text.trim()) return;
    store.sendMessage(roomId, text);
    setText("");
  };

  const gridCols = useMemo(() => {
    const n = participants.length;
    if (n <= 1) return "grid-cols-1";
    if (n <= 4) return "grid-cols-2";
    if (n <= 9) return "grid-cols-2 sm:grid-cols-3";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  }, [participants.length]);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="chip bg-red-500/90 text-white"><Radio className="h-3 w-3" /> LIVE</span>
              <h1 className="truncate font-display text-lg font-bold text-white">{room.title}</h1>
              {room.locked && <Lock className="h-4 w-4 text-red-400" />}
            </div>
            <p className="truncate text-sm text-white/50">{room.topic}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip bg-white/5 text-white/70"><Users className="h-3.5 w-3.5" /> {participants.length}/{room.capacity}</span>
            <button onClick={copyInvite} className="chip bg-white/5 text-white/70 hover:text-white">
              <Link2 className="h-3.5 w-3.5" /> Invite
            </button>
            {canModerate && (
              <button onClick={() => store.toggleLock(roomId)} className="chip bg-white/5 text-white/70 hover:text-white">
                <Lock className="h-3.5 w-3.5" /> {room.locked ? "Unlock" : "Lock"}
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Stage */}
          <div className="relative">
            {pinned.length > 0 && (
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                {pinned.map((p) => (
                  <Tile key={p.id} user={p} roomId={roomId} big canModerate={canModerate}
                    menuFor={menuFor} setMenuFor={setMenuFor} meId={meId}
                    stream={p.id === meId ? localStream : streams[p.id]} />
                ))}
              </div>
            )}
            <div className={`grid ${gridCols} gap-3`}>
              {participants
                .filter((p) => !store.pstate(roomId, p.id).pinned)
                .map((p) => (
                  <Tile key={p.id} user={p} roomId={roomId} canModerate={canModerate}
                    menuFor={menuFor} setMenuFor={setMenuFor} meId={meId}
                    stream={p.id === meId ? localStream : streams[p.id]} />
                ))}
            </div>
            {mediaError && (
              <p className="mt-2 text-center text-xs text-neon-amber/80">{mediaError}</p>
            )}

            {/* floating reactions */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <AnimatePresence>
                {floats.map((f, i) => (
                  <motion.span
                    key={f.id}
                    initial={{ opacity: 0, y: 40, x: (i % 5) * 40 + 20, scale: 0.5 }}
                    animate={{ opacity: 1, y: -220, scale: 1.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.4, ease: "easeOut" }}
                    className="absolute bottom-4 text-3xl"
                    style={{ left: `${10 + ((i * 13) % 80)}%` }}
                  >
                    {f.emoji}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {/* Control bar */}
            <div className="glass mt-4 flex flex-wrap items-center justify-center gap-2 p-3">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`grid h-11 w-11 place-items-center rounded-full ${micOn ? "bg-white/10 text-white" : "bg-red-500/20 text-red-400"}`}
              >
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setCamOn(!camOn)}
                className={`grid h-11 w-11 place-items-center rounded-full ${camOn ? "bg-white/10 text-white" : "bg-red-500/20 text-red-400"}`}
              >
                {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
              <button
                onClick={() => { setHandUp(!handUp); store.raiseHand(roomId, meId); }}
                className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${handUp ? "bg-neon-amber/30 text-neon-amber" : "bg-white/10 text-white"}`}
                title="Raise hand"
              >
                <Hand className="h-5 w-5" />
              </button>
              <div className="mx-1 flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
                {reactions.map((e) => (
                  <button
                    key={e}
                    onClick={() => store.react(roomId, e)}
                    className="grid h-8 w-8 place-items-center rounded-full text-lg transition-transform hover:scale-125"
                  >
                    {e}
                  </button>
                ))}
              </div>
              <Link
                href="/explore"
                onClick={() => store.leaveRoom(roomId)}
                className="ml-auto grid h-11 place-items-center rounded-full bg-red-500 px-5 font-semibold text-white hover:bg-red-600"
              >
                <span className="flex items-center gap-2"><PhoneOff className="h-4 w-4" /> Leave</span>
              </Link>
            </div>
          </div>

          {/* Side panel: participants + chat */}
          <div className="flex flex-col gap-4">
            {canModerate && <RequestsInline roomId={roomId} />}

            <div className="glass flex min-h-[520px] flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-white/10 p-3">
                <Users className="h-4 w-4 text-white/60" />
                <span className="text-sm font-semibold text-white">Live chat</span>
                <span className="ml-auto chip bg-neon-lime/15 text-neon-lime">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-lime" /> real-time
                </span>
              </div>
              <div ref={chatRef} className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.length === 0 && (
                  <p className="py-8 text-center text-sm text-white/35">Say hi 👋 — the room is listening.</p>
                )}
                {messages.map((m) => {
                  const u = store.userById(m.userId)!;
                  const mine = m.userId === meId;
                  return (
                    <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                      <Avatar user={u} size="sm" showPresence={false} />
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? "bg-neon-violet/25" : "bg-white/5"}`}>
                        <p className="text-[11px] font-semibold text-white/60">{u.username}</p>
                        <p className="text-sm text-white/90">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
                <TypingIndicator participants={participants.filter((p) => p.id !== meId)} />
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Message the room…"
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-neon-violet/50 focus:outline-none"
                />
                <button onClick={send} className="grid h-10 w-10 place-items-center rounded-full bg-neon-violet text-white hover:bg-neon-violet/80">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function VideoStream({ stream, muted }: { stream: MediaStream; muted: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function Tile({
  user, roomId, big, canModerate, menuFor, setMenuFor, meId, stream,
}: {
  user: any; roomId: string; big?: boolean; canModerate: boolean;
  menuFor: string | null; setMenuFor: (v: string | null) => void; meId: string;
  stream?: MediaStream | null;
}) {
  const store = useStore();
  const ps = store.pstate(roomId, user.id);
  const speaking = ps.speaking && !ps.muted;
  const isSelf = user.id === meId;
  const hasVideo = !!stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live");

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all ${
        speaking ? "border-neon-lime/70 shadow-[0_0_0_3px_rgba(163,230,53,0.25)]" : "border-white/10"
      } ${big ? "aspect-video" : "aspect-square sm:aspect-video"}`}
      style={{ background: user.color }}
    >
      {hasVideo && <VideoStream stream={stream!} muted={isSelf} />}
      <div className={`absolute inset-0 ${hasVideo ? "bg-transparent" : "bg-black/35"}`} />
      {!hasVideo && (
        <div className="absolute inset-0 grid place-items-center">
          <div className={`grid place-items-center rounded-full bg-black/30 font-black text-white ${big ? "h-24 w-24 text-3xl" : "h-14 w-14 text-lg"}`}>
            {user.avatar}
          </div>
        </div>
      )}

      {/* top badges */}
      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        {user.role === "admin" && <span className="chip bg-neon-fuchsia/90 text-white"><ShieldCheck className="h-3 w-3" /></span>}
        {ps.pinned && <span className="chip bg-neon-cyan/90 text-black"><Pin className="h-3 w-3" /></span>}
        {ps.handRaised && <span className="chip animate-pulseglow bg-neon-amber/90 text-black"><Hand className="h-3 w-3" /></span>}
      </div>

      {/* speaking wave */}
      {speaking && (
        <div className="absolute right-2 top-2 flex items-end gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 rounded-full bg-neon-lime"
              animate={{ height: [4, 12, 6, 14, 4] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      )}

      {/* bottom bar */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-white">
          {ps.muted ? <MicOff className="h-3 w-3 text-red-400" /> : <Volume2 className="h-3 w-3 text-neon-lime" />}
          {user.username}{user.id === meId && " (you)"}
        </span>
        {canModerate && user.id !== meId && (
          <div className="relative">
            <button
              onClick={() => setMenuFor(menuFor === user.id ? null : user.id)}
              className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {menuFor === user.id && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute bottom-8 right-0 z-20 w-40 overflow-hidden rounded-xl border border-white/10 bg-base-700 shadow-xl"
                >
                  <MenuItem icon={ps.muted ? Mic : MicOff} label={ps.muted ? "Unmute" : "Mute"}
                    onClick={() => { store.toggleMute(roomId, user.id); setMenuFor(null); }} />
                  <MenuItem icon={Pin} label={ps.pinned ? "Unpin speaker" : "Pin speaker"}
                    onClick={() => { store.togglePin(roomId, user.id); setMenuFor(null); }} />
                  <MenuItem icon={UserX} label="Remove" danger
                    onClick={() => { store.removeUser(roomId, user.id); setMenuFor(null); }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-white/10 ${danger ? "text-red-400" : "text-white/80"}`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function RequestsInline({ roomId }: { roomId: string }) {
  const store = useStore();
  const pending = store.requests.filter((r) => r.roomId === roomId && r.status === "pending");
  if (pending.length === 0) return null;
  return (
    <div className="glass p-3">
      <div className="mb-2 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-neon-amber" />
        <span className="text-sm font-semibold text-white">Join requests</span>
        <span className="ml-auto chip bg-neon-amber/15 text-neon-amber">{pending.length}</span>
      </div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {pending.map((r) => {
            const u = store.userById(r.userId)!;
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex items-center gap-2 rounded-xl bg-white/5 p-2"
              >
                <Avatar user={u} size="sm" />
                <span className="flex-1 truncate text-sm text-white">{u.username}</span>
                <button onClick={() => store.resolveRequest(r.id, true)} className="grid h-8 w-8 place-items-center rounded-lg bg-neon-lime/20 text-neon-lime">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => store.resolveRequest(r.id, false)} className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/20 text-red-400">
                  <UserX className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TypingIndicator({ participants }: { participants: any[] }) {
  const [typers, setTypers] = useState<string[]>([]);
  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() > 0.5 && participants.length) {
        const u = participants[Math.floor(Math.random() * participants.length)];
        setTypers([u.username]);
        setTimeout(() => setTypers([]), 1800);
      }
    }, 3200);
    return () => clearInterval(iv);
  }, [participants]);

  if (typers.length === 0) return null;
  return (
    <div className="flex items-center gap-2 px-1 text-xs text-white/45">
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white/50"
            animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
        ))}
      </span>
      {typers[0]} is typing…
    </div>
  );
}
