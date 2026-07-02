"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Radio, Compass, Shield, Users, Menu, X } from "lucide-react";
import { useState } from "react";
import { useStore, onlineCount } from "@/lib/store";
import Avatar from "./Avatar";

const links = [
  { href: "/", label: "Home", icon: Radio },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/people", label: "People", icon: Users },
  { href: "/admin", label: "Admin", icon: Shield },
];

export default function Navbar() {
  const path = usePathname();
  const users = useStore((s) => s.users);
  const meId = useStore((s) => s.currentUserId);
  const me = users.find((u) => u.id === meId);
  const [open, setOpen] = useState(false);
  const online = onlineCount(users);

  return (
    <header className="sticky top-0 z-50 border-b border-sand-50/[0.06] bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="grid h-9 w-9 place-items-center rounded-2xl font-display font-bold text-ink-950 shadow-ember"
              style={{ background: "linear-gradient(135deg,#ffc24d,#ff6a2b 60%,#f04e0f)" }}
            >
              M
            </div>
            <div className="leading-none">
              <p className="font-display text-lg font-bold tracking-tight text-sand-50">
                Mbuzis <span className="text-flare">Daily</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-honey-400/80">
                Live · Social · Loud
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = path === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? "text-sand-50" : "text-sand-500 hover:text-sand-100"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full border border-ember-500/25 bg-ember-500/10"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <l.icon className={`relative h-4 w-4 ${active ? "text-ember-400" : ""}`} />
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-mint-400/20 bg-mint-400/[0.07] px-3 py-1.5 sm:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint-400" />
            </span>
            <span className="text-xs font-bold text-mint-300">{online} online</span>
          </div>
          {me && (
            <Link href="/profile" className="hidden items-center gap-2 sm:flex">
              <Avatar user={me} size="sm" />
            </Link>
          )}
          <button className="text-sand-50 md:hidden" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-sand-50/[0.06] px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold ${
                path === l.href
                  ? "border border-ember-500/25 bg-ember-500/10 text-sand-50"
                  : "text-sand-500"
              }`}
            >
              <l.icon className={`h-4 w-4 ${path === l.href ? "text-ember-400" : ""}`} />
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
