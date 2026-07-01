"use client";

import { motion } from "framer-motion";
import { Mail, Phone, Chrome, ShieldCheck, Radio, Bell, MonitorSmartphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { useStore } from "@/lib/store";
import { userById } from "@/lib/data";

export default function Profile() {
  const meId = useStore((s) => s.currentUserId);
  const me = userById(meId)!;
  const rooms = useStore((s) => s.rooms);
  const myRooms = rooms.filter((r) => r.hostId === meId);

  const devices = [
    { name: "Chrome · Windows 11", loc: "Nairobi, KE", current: true },
    { name: "Mbuzis iOS App", loc: "Nairobi, KE", current: false },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass overflow-hidden">
          <div className="h-28" style={{ background: "linear-gradient(120deg,#8b5cf6,#d946ef,#22d3ee)" }} />
          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="rounded-full ring-4 ring-base-900">
                  <Avatar user={me} size="xl" showPresence={false} />
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-white">{me.username}</h1>
                    <span className="chip bg-neon-fuchsia/20 text-neon-fuchsia">
                      <ShieldCheck className="h-3.5 w-3.5" /> Admin
                    </span>
                  </div>
                  <p className="text-sm text-white/45">@{me.handle}</p>
                </div>
              </div>
              <div className="flex gap-6 pb-1 text-center">
                <div>
                  <p className="font-display text-xl font-bold text-white">{me.followers.toLocaleString()}</p>
                  <p className="text-xs text-white/45">followers</p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-white">{myRooms.length}</p>
                  <p className="text-xs text-white/45">rooms hosted</p>
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-lg text-sm text-white/60">{me.bio}</p>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Auth / linked accounts */}
          <div className="glass p-5">
            <h2 className="font-display font-bold text-white">Sign-in methods</h2>
            <p className="mb-4 text-sm text-white/50">Email, Google & phone — all linked in demo mode.</p>
            <div className="space-y-2">
              {[
                { icon: Mail, label: "nawmankipkorir@gmail.com", tag: "Verified" },
                { icon: Chrome, label: "Google account", tag: "Linked" },
                { icon: Phone, label: "+254 · 7XX XXX 214", tag: "Verified" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <m.icon className="h-4 w-4 text-neon-cyan" />
                    <span className="text-sm text-white/80">{m.label}</span>
                  </div>
                  <span className="chip bg-neon-lime/15 text-neon-lime">{m.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="glass p-5">
            <h2 className="font-display font-bold text-white">Notifications</h2>
            <p className="mb-4 text-sm text-white/50">Get pinged when the platform comes alive.</p>
            <div className="space-y-2">
              {[
                { icon: Radio, label: "A favourite room goes live" },
                { icon: Bell, label: "Your join request is accepted" },
                { icon: MonitorSmartphone, label: "Friends come online" },
                { icon: ShieldCheck, label: "Admin announcements" },
              ].map((n, i) => (
                <label key={n.label} className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <n.icon className="h-4 w-4 text-neon-violet" />
                    <span className="text-sm text-white/80">{n.label}</span>
                  </div>
                  <Toggle defaultOn={i !== 2} />
                </label>
              ))}
            </div>
          </div>

          {/* Sessions / devices */}
          <div className="glass p-5 md:col-span-2">
            <h2 className="font-display font-bold text-white">Active sessions & devices</h2>
            <p className="mb-4 text-sm text-white/50">Session management with device tracking for account security.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {devices.map((d) => (
                <div key={d.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <MonitorSmartphone className="h-5 w-5 text-white/60" />
                    <div>
                      <p className="text-sm font-medium text-white">{d.name}</p>
                      <p className="text-xs text-white/45">{d.loc}</p>
                    </div>
                  </div>
                  {d.current ? (
                    <span className="chip bg-neon-lime/15 text-neon-lime">This device</span>
                  ) : (
                    <button className="chip bg-red-500/15 text-red-400 hover:bg-red-500/25">Sign out</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Toggle({ defaultOn }: { defaultOn?: boolean }) {
  return (
    <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${defaultOn ? "bg-neon-violet" : "bg-white/15"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${defaultOn ? "translate-x-6" : "translate-x-1"}`} />
    </span>
  );
}
