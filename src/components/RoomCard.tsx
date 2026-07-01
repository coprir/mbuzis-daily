"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Lock, Radio, Flame, TrendingUp } from "lucide-react";
import { type Room } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import Avatar from "./Avatar";

function since(ts: number) {
  const m = Math.max(1, Math.round((Date.now() - ts) / 60000));
  return m < 60 ? `${m}m` : `${Math.round(m / 60)}h`;
}

export default function RoomCard({ room, index = 0 }: { room: Room; index?: number }) {
  const mounted = useMounted();
  const users = useStore((s) => s.users);
  const host = users.find((u) => u.id === room.hostId)!;
  const participants = room.participantIds.map((id) => users.find((u) => u.id === id)!).filter(Boolean);
  const full = room.participantIds.length >= room.capacity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/room/${room.id}`} className="group block">
        <div className="glass glass-hover overflow-hidden">
          <div className="relative h-32 overflow-hidden" style={{ background: room.thumbnail }}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white 0, transparent 40%)" }} />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              {room.live && (
                <span className="chip bg-red-500/90 text-white">
                  <Radio className="h-3 w-3" /> LIVE
                </span>
              )}
              {room.trending && (
                <span className="chip bg-black/40 text-neon-amber backdrop-blur">
                  <Flame className="h-3 w-3" /> Trending
                </span>
              )}
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-2">
              {room.locked && (
                <span className="chip bg-black/50 text-white/90 backdrop-blur">
                  <Lock className="h-3 w-3" />
                </span>
              )}
              <span className="chip bg-black/50 text-white/90 backdrop-blur">
                <Users className="h-3 w-3" /> {room.participantIds.length}/{room.capacity}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 flex -space-x-2">
              {participants.slice(0, 4).map((p) => (
                <div key={p.id} className="ring-2 ring-base-900 rounded-full">
                  <Avatar user={p} size="sm" showPresence={false} />
                </div>
              ))}
              {participants.length > 4 && (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-[10px] font-bold text-white ring-2 ring-base-900">
                  +{participants.length - 4}
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="chip bg-white/5 text-white/60">{room.category}</span>
              <span className="text-[11px] text-white/40">{mounted ? `${since(room.startedAt)} live` : "live"}</span>
            </div>
            <h3 className="mt-2 font-display text-base font-bold text-white transition-colors group-hover:text-neon-cyan">
              {room.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-sm text-white/55">{room.topic}</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar user={host} size="sm" />
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-white">{host.username}</p>
                  <p className="text-[10px] text-white/40">host</p>
                </div>
              </div>
              <span
                className={`chip ${
                  full ? "bg-white/5 text-white/40" : "bg-neon-violet/20 text-neon-violet"
                }`}
              >
                {full ? "Full" : "Request to join"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
