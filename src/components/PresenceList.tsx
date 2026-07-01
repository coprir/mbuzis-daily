"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, UserCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import Avatar from "./Avatar";

const statusLabel: Record<string, string> = {
  online: "Online",
  away: "Away",
  "in-call": "In a room",
  offline: "Offline",
};

export default function PresenceList({ compact = false }: { compact?: boolean }) {
  const users = useStore((s) => s.users);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const me = useStore((s) => s.currentUserId);

  const sorted = [...users]
    .filter((u) => u.id !== me)
    .sort((a, b) => {
      const order = { "in-call": 0, online: 1, away: 2, offline: 3 } as Record<string, number>;
      return order[a.presence] - order[b.presence];
    });

  return (
    <div className="glass p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white/80">
          Who&apos;s online
        </h3>
        <span className="chip bg-neon-lime/15 text-neon-lime">{sorted.filter((u) => u.presence !== "offline").length} live</span>
      </div>
      <div className={`space-y-1 ${compact ? "max-h-[420px]" : "max-h-[620px]"} overflow-y-auto pr-1`}>
        <AnimatePresence initial={false}>
          {sorted.map((u) => (
            <motion.div
              key={u.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
            >
              <Avatar user={u} size="sm" speaking={u.presence === "in-call"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{u.username}</p>
                <p className="truncate text-[11px] text-white/45">
                  {statusLabel[u.presence]}
                  {u.role === "admin" && <span className="ml-1 text-neon-fuchsia">· admin</span>}
                  {u.role === "host" && <span className="ml-1 text-neon-cyan">· host</span>}
                </p>
              </div>
              <button
                onClick={() => toggleFollow(u.id)}
                className={`grid h-8 w-8 place-items-center rounded-lg border transition-colors ${
                  u.following
                    ? "border-neon-violet/40 bg-neon-violet/20 text-neon-violet"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
                title={u.following ? "Following" : "Follow"}
              >
                {u.following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
