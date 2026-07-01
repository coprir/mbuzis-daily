"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, X, Wifi } from "lucide-react";
import { useStore } from "@/lib/store";
import { initSocket } from "@/lib/socket";
import AuthGate from "./AuthGate";

// Connects to the realtime server (if configured), drives the demo-mode
// simulation loop when offline, and renders global toasts + a live badge.
export default function LiveProvider({ children }: { children: React.ReactNode }) {
  const tick = useStore((s) => s.tick);
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  const connected = useStore((s) => s.connected);

  useEffect(() => {
    initSocket();
  }, []);

  useEffect(() => {
    // The simulation self-disables while connected (tick() returns early),
    // but we still tick so it resumes instantly if the socket drops.
    const iv = setInterval(() => tick(), 2200);
    return () => clearInterval(iv);
  }, [tick]);

  return (
    <>
      <AuthGate>{children}</AuthGate>
      {connected && (
        <div className="fixed bottom-5 left-5 z-[100] hidden items-center gap-2 rounded-full border border-neon-lime/30 bg-neon-lime/10 px-3 py-1.5 text-xs font-semibold text-neon-lime backdrop-blur sm:flex">
          <Wifi className="h-3.5 w-3.5" /> Live server connected
        </div>
      )}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className="glass flex items-start gap-3 p-3.5"
            >
              <span className="mt-0.5">
                {t.tone === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-neon-lime" />
                ) : t.tone === "warn" ? (
                  <AlertTriangle className="h-5 w-5 text-neon-amber" />
                ) : (
                  <Info className="h-5 w-5 text-neon-cyan" />
                )}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.body && <p className="mt-0.5 text-xs text-white/60">{t.body}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
