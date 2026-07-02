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
        <div className="fixed bottom-5 left-5 z-[100] hidden items-center gap-2 rounded-full border border-mint-400/30 bg-mint-400/10 px-3 py-1.5 text-xs font-bold text-mint-300 backdrop-blur sm:flex">
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
              className="panel flex items-start gap-3 rounded-2xl p-3.5"
            >
              <span className="mt-0.5">
                {t.tone === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-mint-400" />
                ) : t.tone === "warn" ? (
                  <AlertTriangle className="h-5 w-5 text-honey-400" />
                ) : (
                  <Info className="h-5 w-5 text-ember-400" />
                )}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-sand-50">{t.title}</p>
                {t.body && <p className="mt-0.5 text-xs text-sand-300/80">{t.body}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="text-sand-500 hover:text-sand-50">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
