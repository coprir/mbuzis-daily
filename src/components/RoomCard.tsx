"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Lock, Flame } from "lucide-react";
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
        <div className="panel panel-hover overflow-hidden">
          <div className="relative h-32 overflow-hidden rounded-t-3xl" style={{ background: room.thumbnail }}>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/20 to-transparent" />
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white 0, transparent 40%)" }}
            />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              {room.live && (
                <span className="chip bg-flame-500 font-display uppercase tracking-wider text-sand-50">
                  <span className="h-1.5 w-1.5 animate-pulseglow rounded-full bg-sand-50" /> Live
                </span>
              )}
              {room.trending && (
                <span className="chip bg-ink-950/60 text-honey-400 backdrop-blur">
                  <Flame className="h-3 w-3" /> Trending
                </span>
              )}
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-2">
              {room.locked && (
                <span className="chip bg-ink-950/60 text-sand-100 backdrop-blur">
                  <Lock className="h-3 w-3" />
                </span>
              )}
              <span className="chip bg-ink-950/60 text-sand-100 backdrop-blur">
                <Users className="h-3 w-3" /> {room.participantIds.length}/{room.capacity}
              </span>
            </div>
            <div className="absolute bottom-3 left-3 flex -space-x-2">
              {participants.slice(0, 4).map((p) => (
                <div key={p.id} className="rounded-full ring-2 ring-ink-950">
                  <Avatar user={p} size="sm" showPresence={false} />
                </div>
              ))}
              {participants.length > 4 && (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-ink-950/80 text-[10px] font-bold text-sand-50 ring-2 ring-ink-950">
                  +{participants.length - 4}
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="chip bg-sand-50/[0.06] uppercase tracking-wide text-sand-300">{room.category}</span>
              <span className="text-[11px] font-medium text-sand-500">{mounted ? `${since(room.startedAt)} live` : "live"}</span>
            </div>
            <h3 className="mt-2 font-display text-base font-bold text-sand-50 transition-colors group-hover:text-ember-400">
              {room.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-sm text-sand-500">{room.topic}</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar user={host} size="sm" />
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-sand-50">{host.username}</p>
                  <p className="text-[10px] text-sand-500">host</p>
                </div>
              </div>
              <span
                className={`chip ${
                  full
                    ? "bg-sand-50/[0.05] text-sand-500"
                    : "border border-ember-500/30 bg-ember-500/10 text-ember-400 transition-colors group-hover:bg-ember-500/20"
                }`}
              >
                {full ? "Full" : "Knock to join"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
