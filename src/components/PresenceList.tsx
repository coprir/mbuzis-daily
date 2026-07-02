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
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-sand-300">
          Who&apos;s online
        </h3>
        <span className="chip border border-mint-400/20 bg-mint-400/10 text-mint-300">
          {sorted.filter((u) => u.presence !== "offline").length} live
        </span>
      </div>
      <div className={`space-y-1 ${compact ? "max-h-[420px]" : "max-h-[620px]"} overflow-y-auto pr-1`}>
        <AnimatePresence initial={false}>
          {sorted.map((u) => (
            <motion.div
              key={u.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-sand-50/[0.04]"
            >
              <Avatar user={u} size="sm" speaking={u.presence === "in-call"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-sand-50">{u.username}</p>
                <p className="truncate text-[11px] text-sand-500">
                  {statusLabel[u.presence]}
                  {u.role === "admin" && <span className="ml-1 font-semibold text-ember-400">· admin</span>}
                  {u.role === "host" && <span className="ml-1 font-semibold text-honey-400">· host</span>}
                </p>
              </div>
              <button
                onClick={() => toggleFollow(u.id)}
                className={`grid h-8 w-8 place-items-center rounded-full border transition-colors ${
                  u.following
                    ? "border-ember-500/40 bg-ember-500/15 text-ember-400"
                    : "border-sand-50/10 text-sand-500 hover:border-sand-50/25 hover:text-sand-50"
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
