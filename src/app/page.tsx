"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Radio, Users, Flame, Sparkles, ArrowRight, ShieldCheck, Hand, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import PresenceList from "@/components/PresenceList";
import { useStore, onlineCount } from "@/lib/store";
import { trendingTopics } from "@/lib/data";

function Stat({ icon: Icon, value, label, tint }: any) {
  return (
    <div className="glass flex items-center gap-3 p-4">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-display text-2xl font-extrabold leading-none text-white">{value}</p>
        <p className="text-xs text-white/50">{label}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const users = useStore((s) => s.users);
  const rooms = useStore((s) => s.rooms);
  const online = onlineCount(users);
  const liveRooms = rooms.filter((r) => r.live);
  const featured = liveRooms.filter((r) => r.featured);
  const totalInCall = liveRooms.reduce((n, r) => n + r.participantIds.length, 0);

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-neon-violet/20 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="chip mx-auto mb-5 border border-white/10 bg-white/5 text-white/70">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-lime opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-lime" />
              </span>
              {online} people are online right now
            </span>
            <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
              The room is always
              <br />
              <span className="neon-text">live on Mbuzis Daily</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/60 sm:text-lg">
              See who&apos;s online, knock on a live video room, and get waved in by an admin. Loud,
              curated, community-first conversations — every single day.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/explore" className="btn-neon w-full sm:w-auto">
                <Radio className="h-4 w-4" /> Explore live rooms
              </Link>
              <Link href="/admin" className="btn-ghost w-full sm:w-auto">
                <ShieldCheck className="h-4 w-4" /> Open admin dashboard
              </Link>
            </div>
          </motion.div>

          {/* Live stat bar */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Users} value={online} label="Users online" tint="bg-neon-lime/15 text-neon-lime" />
            <Stat icon={Radio} value={liveRooms.length} label="Rooms live" tint="bg-red-500/15 text-red-400" />
            <Stat icon={Sparkles} value={totalInCall} label="In conversations" tint="bg-neon-cyan/15 text-neon-cyan" />
            <Stat icon={Flame} value={trendingTopics.length} label="Trending topics" tint="bg-neon-amber/15 text-neon-amber" />
          </div>
        </div>
      </section>

      {/* Trending ticker */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="glass flex items-center gap-4 overflow-hidden p-3">
          <span className="chip shrink-0 bg-neon-amber/15 text-neon-amber">
            <Flame className="h-3.5 w-3.5" /> Trending
          </span>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((t) => (
              <span key={t} className="chip bg-white/5 text-white/70">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured + presence */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-white">Featured live rooms</h2>
              <Link href="/explore" className="flex items-center gap-1 text-sm text-neon-cyan hover:underline">
                See all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(featured.length ? featured : liveRooms.slice(0, 4)).map((r, i) => (
                <RoomCard key={r.id} room={r} index={i} />
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Hand, title: "Raise your hand", body: "Signal the host you want the mic — get pinned to speak." },
                { icon: MessageSquare, title: "Chat + reactions", body: "Live chat, typing indicators & floating emoji during calls." },
                { icon: ShieldCheck, title: "Admin-approved entry", body: "Every join request is reviewed. Max 3 admins keep it curated." },
              ].map((f) => (
                <div key={f.title} className="glass p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-neon-violet/30 to-neon-cyan/20 text-neon-cyan">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
                  <p className="mt-1 text-sm text-white/55">{f.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <PresenceList />
          </aside>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-white/40">
        <p>
          <span className="font-display font-bold text-white">Mbuzis Daily</span> — live, social, loud. Demo
          experience · no account required.
        </p>
      </footer>
    </main>
  );
}
