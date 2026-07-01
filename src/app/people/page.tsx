"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, UserCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { useStore } from "@/lib/store";

const tabs = ["Everyone", "In a room", "Hosts", "Admins", "Following"] as const;

export default function People() {
  const users = useStore((s) => s.users);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const me = useStore((s) => s.currentUserId);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Everyone");

  const list = users
    .filter((u) => u.id !== me)
    .filter((u) => {
      if (tab === "In a room") return u.presence === "in-call";
      if (tab === "Hosts") return u.role === "host";
      if (tab === "Admins") return u.role === "admin";
      if (tab === "Following") return u.following;
      return true;
    });

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">People on Mbuzis Daily</h1>
        <p className="mt-1 text-white/55">Follow your favourite hosts and see who&apos;s live right now.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`chip transition-colors ${
                tab === t ? "bg-neon-violet text-white" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass glass-hover p-5"
            >
              <div className="flex items-start gap-4">
                <Avatar user={u} size="lg" speaking={u.presence === "in-call"} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display font-bold text-white">{u.username}</p>
                    {u.role === "admin" && <span className="chip bg-neon-fuchsia/20 text-neon-fuchsia">admin</span>}
                    {u.role === "host" && <span className="chip bg-neon-cyan/20 text-neon-cyan">host</span>}
                  </div>
                  <p className="text-xs text-white/40">@{u.handle}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-white/55">{u.bio}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-white/50">
                      <b className="text-white">{u.followers.toLocaleString()}</b> followers
                    </span>
                    <button
                      onClick={() => toggleFollow(u.id)}
                      className={`chip transition-colors ${
                        u.following
                          ? "bg-neon-violet/20 text-neon-violet"
                          : "bg-white/5 text-white/70 hover:text-white"
                      }`}
                    >
                      {u.following ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                      {u.following ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
