"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Radio } from "lucide-react";

export default function CreateRoomModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, topic: string, cat: string, cap: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [cat, setCat] = useState("Lifestyle");
  const [cap, setCap] = useState(12);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[95] grid place-items-center bg-ink-950/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="panel w-full max-w-md p-6"
      >
        <h2 className="font-display text-xl font-bold text-sand-50">Start a live room</h2>
        <p className="mb-4 text-sm text-sand-500">Goes live instantly. You&apos;ll be the host.</p>
        <div className="space-y-3">
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Room title" className="field" />
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What's the vibe / topic?" className="field" />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="rounded-2xl border border-sand-50/10 bg-ink-700 p-3 text-sm text-sand-50 focus:border-ember-500/60 focus:outline-none"
            >
              {["Lifestyle", "Music", "Business", "Sports", "Arts", "Tech"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 rounded-2xl border border-sand-50/10 bg-sand-50/[0.04] px-3">
              <span className="text-xs text-sand-500">Max</span>
              <input
                type="number"
                min={2}
                max={100}
                value={cap}
                onChange={(e) => setCap(Number(e.target.value))}
                className="w-full bg-transparent py-3 text-sm text-sand-50 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={() => title.trim() && onCreate(title.trim(), topic.trim() || "Live conversation", cat, cap)}
            className="btn-primary flex-1"
          >
            <Radio className="h-4 w-4" /> Go live
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
