"use client";

import { motion } from "framer-motion";
import { Mail, Phone, Chrome, ShieldCheck, Radio, Bell, MonitorSmartphone, LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { useStore } from "@/lib/store";

export default function Profile() {
  const meId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const me = users.find((u) => u.id === meId);
  const rooms = useStore((s) => s.rooms);
  const auth = useStore((s) => s.auth);
  const signOut = useStore((s) => s.signOut);
  const myRooms = rooms.filter((r) => r.hostId === meId);

  if (!me) return null;

  const devices = [
    { name: "Chrome · Windows 11", loc: "Nairobi, KE", current: true },
    { name: "Mbuzis iOS App", loc: "Nairobi, KE", current: false },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden">
          <div className="h-28" style={{ background: "linear-gradient(110deg,#f04e0f,#ff6a2b 45%,#ffc24d)" }} />
          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="rounded-full ring-4 ring-ink-950">
                  <Avatar user={me} size="xl" showPresence={false} />
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-sand-50">{me.username}</h1>
                    {me.role === "admin" && (
                      <span className="chip border border-ember-500/30 bg-ember-500/10 text-ember-400">
                        <ShieldCheck className="h-3.5 w-3.5" /> Admin
                      </span>
                    )}
                    {me.role === "host" && (
                      <span className="chip border border-honey-500/25 bg-honey-500/10 text-honey-400">Host</span>
                    )}
                    {(me.role === "member" || me.role === "guest") && (
                      <span className="chip bg-sand-50/[0.08] capitalize text-sand-300">{me.role}</span>
                    )}
                  </div>
                  <p className="text-sm text-sand-500">@{me.handle}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 pb-1 text-center">
                <div>
                  <p className="font-display text-xl font-bold text-sand-50">{me.followers.toLocaleString()}</p>
                  <p className="text-xs text-sand-500">followers</p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-sand-50">{myRooms.length}</p>
                  <p className="text-xs text-sand-500">rooms hosted</p>
                </div>
                {auth && (
                  <button
                    onClick={signOut}
                    className="chip border border-sand-50/15 bg-sand-50/[0.04] text-sand-300 transition-colors hover:border-flame-500/40 hover:bg-flame-500/10 hover:text-flame-400"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                )}
              </div>
            </div>
            <p className="mt-4 max-w-lg text-sm text-sand-300/80">{me.bio}</p>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Auth / linked accounts */}
          <div className="panel p-5">
            <h2 className="font-display font-bold text-sand-50">Sign-in methods</h2>
            <p className="mb-4 text-sm text-sand-500">Email, Google & phone — all linked in demo mode.</p>
            <div className="space-y-2">
              {[
                { icon: Mail, label: "nawmankipkorir@gmail.com", tag: "Verified" },
                { icon: Chrome, label: "Google account", tag: "Linked" },
                { icon: Phone, label: "+254 · 7XX XXX 214", tag: "Verified" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between rounded-2xl border border-sand-50/[0.07] bg-sand-50/[0.03] px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <m.icon className="h-4 w-4 text-ember-400" />
                    <span className="text-sm text-sand-100">{m.label}</span>
                  </div>
                  <span className="chip border border-mint-400/20 bg-mint-400/10 text-mint-300">{m.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="panel p-5">
            <h2 className="font-display font-bold text-sand-50">Notifications</h2>
            <p className="mb-4 text-sm text-sand-500">Get pinged when the platform comes alive.</p>
            <div className="space-y-2">
              {[
                { icon: Radio, label: "A favourite room goes live" },
                { icon: Bell, label: "Your join request is accepted" },
                { icon: MonitorSmartphone, label: "Friends come online" },
                { icon: ShieldCheck, label: "Admin announcements" },
              ].map((n, i) => (
                <label key={n.label} className="flex cursor-pointer items-center justify-between rounded-2xl border border-sand-50/[0.07] bg-sand-50/[0.03] px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <n.icon className="h-4 w-4 text-honey-400" />
                    <span className="text-sm text-sand-100">{n.label}</span>
                  </div>
                  <Toggle defaultOn={i !== 2} />
                </label>
              ))}
            </div>
          </div>

          {/* Sessions / devices */}
          <div className="panel p-5 md:col-span-2">
            <h2 className="font-display font-bold text-sand-50">Active sessions & devices</h2>
            <p className="mb-4 text-sm text-sand-500">Session management with device tracking for account security.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {devices.map((d) => (
                <div key={d.name} className="flex items-center justify-between rounded-2xl border border-sand-50/[0.07] bg-sand-50/[0.03] px-3 py-3">
                  <div className="flex items-center gap-3">
                    <MonitorSmartphone className="h-5 w-5 text-sand-500" />
                    <div>
                      <p className="text-sm font-medium text-sand-50">{d.name}</p>
                      <p className="text-xs text-sand-500">{d.loc}</p>
                    </div>
                  </div>
                  {d.current ? (
                    <span className="chip border border-mint-400/20 bg-mint-400/10 text-mint-300">This device</span>
                  ) : (
                    <button className="chip border border-flame-500/25 bg-flame-500/10 text-flame-400 hover:bg-flame-500/20">Sign out</button>
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
    <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${defaultOn ? "bg-ember-500" : "bg-sand-50/15"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-sand-50 transition-transform ${defaultOn ? "translate-x-6" : "translate-x-1"}`} />
    </span>
  );
}
