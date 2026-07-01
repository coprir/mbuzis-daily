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
    <header className="sticky top-0 z-50 border-b border-white/5 bg-base-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-neon-violet to-neon-fuchsia font-black text-white shadow-lg shadow-neon-violet/40">
              M
            </div>
            <div className="leading-none">
              <p className="font-display text-lg font-extrabold tracking-tight">
                Mbuzis <span className="neon-text">Daily</span>
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Live · Social · Loud</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = path === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    active ? "text-white" : "text-white/55 hover:text-white"
                  }`}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-2 -bottom-[9px] h-0.5 rounded-full bg-gradient-to-r from-neon-violet to-neon-cyan"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-lime opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neon-lime" />
            </span>
            <span className="text-xs font-semibold text-white/80">{online} online</span>
          </div>
          {me && (
            <Link href="/profile" className="hidden items-center gap-2 sm:flex">
              <Avatar user={me} size="sm" />
            </Link>
          )}
          <button className="md:hidden text-white" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-white/5 px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${
                path === l.href ? "bg-white/10 text-white" : "text-white/60"
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
