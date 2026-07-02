"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import RoomCard from "@/components/RoomCard";
import PresenceList from "@/components/PresenceList";
import { useStore } from "@/lib/store";

const cats = ["All", "Lifestyle", "Music", "Business", "Sports", "Arts", "Tech"];

export default function Explore() {
  const rooms = useStore((s) => s.rooms).filter((r) => r.live);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const filtered = rooms.filter(
    (r) =>
      (cat === "All" || r.category === cat) &&
      (r.title.toLowerCase().includes(q.toLowerCase()) || r.topic.toLowerCase().includes(q.toLowerCase()))
  );
  // simple "AI recommendation" = most populated trending room
  const rec = [...rooms].sort((a, b) => b.participantIds.length - a.participantIds.length)[0];

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-sand-50 sm:text-3xl">Explore live rooms</h1>
          <p className="mt-1 text-sand-500">Jump into the conversation — knock and an admin waves you in.</p>
        </div>

        {rec && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel mb-6 flex flex-col items-start gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between"
            style={{ backgroundImage: "linear-gradient(100deg, rgba(240,78,15,0.14), rgba(245,166,35,0.06) 60%, transparent)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="grid h-11 w-11 place-items-center rounded-2xl text-ink-950 shadow-ember"
                style={{ background: "linear-gradient(135deg,#ffc24d,#ff6a2b 60%,#f04e0f)" }}
              >
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-widest text-ember-400">AI pick for you</p>
                <p className="font-display font-bold text-sand-50">{rec.title}</p>
                <p className="text-sm text-sand-500">{rec.topic}</p>
              </div>
            </div>
            <a href={`/room/${rec.id}`} className="btn-primary w-full sm:w-auto">Join the buzz</a>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search rooms & topics…"
                  className="field rounded-full py-2.5 pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {cats.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`chip transition-colors ${
                      cat === c
                        ? "bg-ember-500 font-bold text-ink-950 shadow-ember"
                        : "border border-sand-50/10 bg-sand-50/[0.04] text-sand-300 hover:border-sand-50/25 hover:text-sand-50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((r, i) => (
                  <RoomCard key={r.id} room={r} index={i} />
                ))}
              </div>
            ) : (
              <div className="panel grid place-items-center p-16 text-center text-sand-500">
                No rooms match that. Try another category.
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <PresenceList compact />
          </aside>
        </div>
      </div>
    </main>
  );
}
