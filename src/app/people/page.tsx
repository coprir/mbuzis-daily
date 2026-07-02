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
        <h1 className="font-display text-2xl font-bold text-sand-50 sm:text-3xl">People on Mbuzis Daily</h1>
        <p className="mt-1 text-sand-500">Follow your favourite hosts and see who&apos;s live right now.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`chip transition-colors ${
                tab === t
                  ? "bg-ember-500 font-bold text-ink-950 shadow-ember"
                  : "border border-sand-50/10 bg-sand-50/[0.04] text-sand-300 hover:border-sand-50/25 hover:text-sand-50"
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
              className="panel panel-hover p-5"
            >
              <div className="flex items-start gap-4">
                <Avatar user={u} size="lg" speaking={u.presence === "in-call"} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display font-bold text-sand-50">{u.username}</p>
                    {u.role === "admin" && (
                      <span className="chip border border-ember-500/30 bg-ember-500/10 text-ember-400">admin</span>
                    )}
                    {u.role === "host" && (
                      <span className="chip border border-honey-500/25 bg-honey-500/10 text-honey-400">host</span>
                    )}
                  </div>
                  <p className="text-xs text-sand-500">@{u.handle}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-sand-300/80">{u.bio}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-sand-500">
                      <b className="text-sand-50">{u.followers.toLocaleString()}</b> followers
                    </span>
                    <button
                      onClick={() => toggleFollow(u.id)}
                      className={`chip transition-colors ${
                        u.following
                          ? "border border-ember-500/30 bg-ember-500/10 text-ember-400"
                          : "border border-sand-50/10 bg-sand-50/[0.04] text-sand-300 hover:border-sand-50/25 hover:text-sand-50"
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
