"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ArrowRight, ShieldCheck, Loader2, Wifi, WifiOff } from "lucide-react";
import { useStore, onlineCount } from "@/lib/store";

// In live mode, block the app behind a username sign-in. In demo mode
// (no realtime server configured), render children directly with the seed
// identity so the app still works offline.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const liveMode = useStore((s) => s.liveMode);
  const auth = useStore((s) => s.auth);

  if (!liveMode || auth) return <>{children}</>;
  return <JoinScreen />;
}

function JoinScreen() {
  const signIn = useStore((s) => s.signIn);
  const socketReady = useStore((s) => s.socketReady);
  const authPending = useStore((s) => s.authPending);
  const authError = useStore((s) => s.authError);
  const users = useStore((s) => s.users);
  const online = onlineCount(users);

  const [username, setUsername] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState("");

  const canSubmit = username.trim().length >= 2 && socketReady && !authPending;
  const submit = () => {
    if (!canSubmit) return;
    signIn(username.trim(), showAdmin ? adminCode.trim() : undefined);
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-neon-violet/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-[36rem] rounded-full bg-neon-cyan/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative w-full max-w-md p-8"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-neon-violet to-neon-fuchsia font-black text-white shadow-lg shadow-neon-violet/40">
            M
          </div>
          <div className="leading-none">
            <p className="font-display text-lg font-extrabold tracking-tight">
              Mbuzis <span className="neon-text">Daily</span>
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Live · Social · Loud</p>
          </div>
        </div>

        <h1 className="mt-6 font-display text-2xl font-black text-white">Pick a username to join</h1>
        <p className="mt-1 text-sm text-white/55">
          Jump into the live space as yourself. Everyone online sees you by this name.
        </p>

        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">Username</label>
          <input
            autoFocus
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. njeri_254"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-neon-violet/50 focus:outline-none"
          />
        </div>

        <AnimatePresence>
          {showAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-white/50">Admin code</label>
                <input
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Enter admin code"
                  className="mt-1.5 w-full rounded-xl border border-neon-fuchsia/30 bg-neon-fuchsia/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-neon-fuchsia/60 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-white/40">Grants admin powers (max 3 admins online).</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {authError && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {authError}
          </p>
        )}

        <button onClick={submit} disabled={!canSubmit} className="btn-neon mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50">
          {authPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Joining…
            </>
          ) : (
            <>
              <Radio className="h-4 w-4" /> Join Mbuzis Daily <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-between text-xs">
          <button
            onClick={() => setShowAdmin((v) => !v)}
            className="flex items-center gap-1.5 text-white/45 transition-colors hover:text-white/80"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> {showAdmin ? "Join as member instead" : "Have an admin code?"}
          </button>
          <span className={`flex items-center gap-1.5 ${socketReady ? "text-neon-lime" : "text-neon-amber"}`}>
            {socketReady ? (
              <>
                <Wifi className="h-3.5 w-3.5" /> {online} online
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 animate-pulse" /> connecting…
              </>
            )}
          </span>
        </div>
      </motion.div>
    </main>
  );
}
