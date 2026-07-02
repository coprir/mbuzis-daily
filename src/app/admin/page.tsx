"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Check, X, Plus, Lock, Unlock, Radio, Megaphone, ScrollText,
  Users, Gauge, Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { useStore, onlineCount } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { MAX_ADMINS } from "@/lib/data";

function ago(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`;
}

export default function Admin() {
  const {
    users, rooms, requests, modLogs, resolveRequest, toggleLock, endRoom, createRoom, announce, removeUser,
  } = useStore();
  const meId = useStore((s) => s.currentUserId);
  const userById = (id: string) => users.find((u) => u.id === id);
  const me = userById(meId);
  const mounted = useMounted();
  const admins = users.filter((u) => u.role === "admin");
  const pending = requests.filter((r) => r.status === "pending");
  const liveRooms = rooms.filter((r) => r.live);

  const [showCreate, setShowCreate] = useState(false);
  const [ann, setAnn] = useState("");

  // Role-based access gate
  if (!me || me.role !== "admin") {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="mx-auto grid max-w-md place-items-center px-4 py-32 text-center">
          <ShieldCheck className="h-12 w-12 text-ember-400" />
          <h1 className="mt-4 font-display text-2xl font-bold text-sand-50">Admins only</h1>
          <p className="mt-2 text-sand-500">This dashboard is restricted by role-based access control.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-ember-400" />
              <h1 className="font-display text-2xl font-bold text-sand-50">Admin Control Room</h1>
            </div>
            <p className="mt-1 text-sand-500">Role-based access · {admins.length}/{MAX_ADMINS} admin seats used</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Create live room
          </button>
        </div>

        {/* KPI row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Users, label: "Users online", value: onlineCount(users), tint: "text-mint-400" },
            { icon: Radio, label: "Live rooms", value: liveRooms.length, tint: "text-flame-400" },
            { icon: Gauge, label: "Pending requests", value: pending.length, tint: "text-honey-400" },
            { icon: ShieldCheck, label: "Admin seats", value: `${admins.length}/${MAX_ADMINS}`, tint: "text-ember-400" },
          ].map((k) => (
            <div key={k.label} className="panel p-4">
              <k.icon className={`h-5 w-5 ${k.tint}`} />
              <p className="mt-2 font-display text-2xl font-bold text-sand-50">{k.value}</p>
              <p className="text-xs text-sand-500">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Join requests */}
            <section className="panel p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display font-bold text-sand-50">
                  <Gauge className="h-4 w-4 text-honey-400" /> Join requests
                </h2>
                <span className="chip border border-honey-500/25 bg-honey-500/10 text-honey-400">{pending.length} pending</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {pending.length === 0 && (
                    <p className="py-6 text-center text-sm text-sand-500">No pending requests. All clear ✨</p>
                  )}
                  {pending.map((r) => {
                    const u = userById(r.userId)!;
                    const room = rooms.find((x) => x.id === r.roomId);
                    return (
                      <motion.div
                        key={r.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 rounded-2xl border border-sand-50/[0.07] bg-sand-50/[0.03] p-3"
                      >
                        <Avatar user={u} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-sand-50">
                            {u.username} <span className="text-sand-500">wants in</span>
                          </p>
                          <p className="truncate text-xs text-sand-500">{room?.title}{mounted ? ` · ${ago(r.at)}` : ""}</p>
                        </div>
                        <button
                          onClick={() => resolveRequest(r.id, true)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-mint-400/15 text-mint-400 transition-colors hover:bg-mint-400/25"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => resolveRequest(r.id, false)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-flame-500/15 text-flame-400 transition-colors hover:bg-flame-500/25"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </section>

            {/* Live rooms management */}
            <section className="panel p-5">
              <h2 className="mb-3 flex items-center gap-2 font-display font-bold text-sand-50">
                <Radio className="h-4 w-4 text-flame-400" /> Manage live rooms
              </h2>
              <div className="space-y-2">
                {liveRooms.map((room) => {
                  const host = userById(room.hostId)!;
                  return (
                    <div key={room.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-sand-50/[0.07] bg-sand-50/[0.03] p-3">
                      <div className="h-9 w-9 rounded-xl" style={{ background: room.thumbnail }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-sand-50">{room.title}</p>
                        <p className="truncate text-xs text-sand-500">
                          {host.username} · {room.participantIds.length}/{room.capacity} · {room.locked ? "Locked" : "Open"}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleLock(room.id)}
                        className="chip border border-sand-50/10 bg-sand-50/[0.04] text-sand-300 hover:text-sand-50"
                        title={room.locked ? "Unlock" : "Lock"}
                      >
                        {room.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        {room.locked ? "Unlock" : "Lock"}
                      </button>
                      <a href={`/room/${room.id}`} className="chip border border-ember-500/30 bg-ember-500/10 text-ember-400 hover:bg-ember-500/20">Open</a>
                      <button
                        onClick={() => endRoom(room.id)}
                        className="chip border border-flame-500/25 bg-flame-500/10 text-flame-400 hover:bg-flame-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> End
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Admins */}
            <section className="panel p-5">
              <h2 className="mb-1 flex items-center gap-2 font-display font-bold text-sand-50">
                <ShieldCheck className="h-4 w-4 text-ember-400" /> Platform admins
              </h2>
              <p className="mb-3 text-xs text-sand-500">Hard cap of {MAX_ADMINS} admins across all of Mbuzis Daily.</p>
              <div className="space-y-2">
                {admins.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-sand-50/[0.07] bg-sand-50/[0.03] p-2.5">
                    <Avatar user={a} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-sand-50">{a.username}</p>
                      <p className="text-[11px] text-sand-500">@{a.handle}</p>
                    </div>
                    <span className="chip border border-ember-500/30 bg-ember-500/10 text-ember-400">admin</span>
                  </div>
                ))}
                {Array.from({ length: MAX_ADMINS - admins.length }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-dashed border-sand-50/10 p-2.5 text-center text-xs text-sand-500/70">
                    Empty admin seat
                  </div>
                ))}
              </div>
            </section>

            {/* Announcement */}
            <section className="panel p-5">
              <h2 className="mb-3 flex items-center gap-2 font-display font-bold text-sand-50">
                <Megaphone className="h-4 w-4 text-honey-400" /> Broadcast announcement
              </h2>
              <textarea
                value={ann}
                onChange={(e) => setAnn(e.target.value)}
                rows={3}
                placeholder="Say something to the whole platform…"
                className="field resize-none"
              />
              <button
                onClick={() => { if (ann.trim()) { announce(ann.trim()); setAnn(""); } }}
                className="btn-primary mt-2 w-full"
              >
                <Megaphone className="h-4 w-4" /> Send to everyone
              </button>
            </section>

            {/* Moderation logs */}
            <section className="panel p-5">
              <h2 className="mb-3 flex items-center gap-2 font-display font-bold text-sand-50">
                <ScrollText className="h-4 w-4 text-sand-300" /> Moderation logs
              </h2>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {modLogs.map((l) => (
                    <motion.div
                      key={l.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-sand-50/[0.05] bg-sand-50/[0.02] px-3 py-2"
                    >
                      <p className="text-xs text-sand-300">
                        <b className="text-sand-50">{l.actor}</b> {l.action}
                      </p>
                      <p className="text-[10px] text-sand-500/70">{mounted ? ago(l.at) : ""}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Create room modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateRoomModal
            onClose={() => setShowCreate(false)}
            onCreate={(t, topic, cat, cap) => {
              const id = createRoom(t, topic, cat, cap);
              setShowCreate(false);
              window.location.href = `/room/${id}`;
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function CreateRoomModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, topic: string, cat: string, cap: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [cat, setCat] = useState("Lifestyle");
  const [cap, setCap] = useState(12);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="panel w-full max-w-md p-6"
      >
        <h2 className="font-display text-xl font-bold text-sand-50">Create a live room</h2>
        <p className="mb-4 text-sm text-sand-500">Goes live instantly. You&apos;ll be the host.</p>
        <div className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Room title"
            className="field"
          />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What's the vibe / topic?"
            className="field"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="rounded-2xl border border-sand-50/10 bg-ink-700 p-3 text-sm text-sand-50 focus:border-ember-500/60 focus:outline-none"
            >
              {["Lifestyle", "Music", "Business", "Sports", "Arts", "Tech"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 rounded-2xl border border-sand-50/10 bg-sand-50/[0.04] px-3">
              <span className="text-xs text-sand-500">Max</span>
              <input
                type="number"
                min={2}
                max={100}
                value={cap}
                onChange={(e) => setCap(Number(e.target.value))}
                className="w-full bg-transparent py-3 text-sm text-sand-50 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={() => title.trim() && onCreate(title.trim(), topic.trim() || "Live conversation", cat, cap)}
            className="btn-primary flex-1"
          >
            <Radio className="h-4 w-4" /> Go live
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
