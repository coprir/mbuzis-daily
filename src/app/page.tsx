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
    <div className="panel flex items-center gap-3 p-4">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-display text-2xl font-bold leading-none text-sand-50">{value}</p>
        <p className="mt-1 text-xs text-sand-500">{label}</p>
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
        <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-[50rem] -translate-x-1/2 rounded-full bg-ember-500/15 blur-[130px]" />
        <div className="pointer-events-none absolute right-[-10%] top-40 h-64 w-[28rem] rounded-full bg-honey-500/10 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="chip mx-auto mb-6 border border-mint-400/20 bg-mint-400/[0.07] text-mint-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-400" />
              </span>
              {online} people are online right now
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.02] tracking-tight text-sand-50 sm:text-[4.25rem]">
              The city never
              <br />
              logs off. <span className="text-flare">Neither do we.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-sand-300/80 sm:text-lg">
              See who&apos;s online, knock on a live video room, and get waved in by an admin. Loud,
              curated, community-first conversations — every single day.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/explore" className="btn-primary w-full sm:w-auto">
                <Radio className="h-4 w-4" /> Explore live rooms
              </Link>
              <Link href="/admin" className="btn-ghost w-full sm:w-auto">
                <ShieldCheck className="h-4 w-4" /> Open admin dashboard
              </Link>
            </div>
          </motion.div>

          {/* Live stat bar */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Users} value={online} label="Users online" tint="bg-mint-400/10 text-mint-400" />
            <Stat icon={Radio} value={liveRooms.length} label="Rooms live" tint="bg-flame-500/10 text-flame-400" />
            <Stat icon={Sparkles} value={totalInCall} label="In conversations" tint="bg-ember-500/10 text-ember-400" />
            <Stat icon={Flame} value={trendingTopics.length} label="Trending topics" tint="bg-honey-500/10 text-honey-400" />
          </div>
        </div>
      </section>

      {/* Trending ticker */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="panel flex items-center gap-4 overflow-hidden p-3">
          <span className="chip z-10 shrink-0 border border-honey-500/25 bg-honey-500/10 font-display uppercase tracking-wider text-honey-400">
            <Flame className="h-3.5 w-3.5" /> Trending
          </span>
          <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div className="flex w-max animate-marquee gap-2">
              {trendingTopics.map((t) => (
                <span key={t} className="chip shrink-0 bg-sand-50/[0.05] text-sand-300">{t}</span>
              ))}
              {trendingTopics.map((t) => (
                <span key={`dup-${t}`} aria-hidden className="chip shrink-0 bg-sand-50/[0.05] text-sand-300">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured + presence */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-sand-50">Featured live rooms</h2>
              <Link href="/explore" className="flex items-center gap-1 text-sm font-semibold text-ember-400 transition-colors hover:text-ember-300">
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
                <div key={f.title} className="panel panel-hover p-5">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-2xl text-ink-950 shadow-ember"
                    style={{ background: "linear-gradient(135deg,#ffc24d,#ff6a2b 60%,#f04e0f)" }}
                  >
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-display font-bold text-sand-50">{f.title}</h3>
                  <p className="mt-1 text-sm text-sand-500">{f.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <PresenceList />
          </aside>
        </div>
      </section>

      <footer className="border-t border-sand-50/[0.06] py-8 text-center text-sm text-sand-500">
        <p>
          <span className="font-display font-bold text-sand-50">
            Mbuzis <span className="text-flare">Daily</span>
          </span>{" "}
          — live, social, loud. Demo experience · no account required.
        </p>
      </footer>
    </main>
  );
}
