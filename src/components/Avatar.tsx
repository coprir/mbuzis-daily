"use client";

import { type User } from "@/lib/data";

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base", xl: "h-20 w-20 text-xl" };
const ring = {
  online: "ring-neon-lime",
  away: "ring-neon-amber",
  "in-call": "ring-neon-fuchsia",
  offline: "ring-white/20",
};

export default function Avatar({
  user,
  size = "md",
  showPresence = true,
  speaking = false,
}: {
  user: User;
  size?: keyof typeof sizes;
  showPresence?: boolean;
  speaking?: boolean;
}) {
  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={`${sizes[size]} grid place-items-center rounded-full font-bold text-white ring-2 ${
          speaking ? "ring-neon-lime shadow-[0_0_0_4px_rgba(163,230,53,0.25)]" : "ring-white/10"
        } transition-shadow`}
        style={{ background: user.color }}
        title={user.username}
      >
        {user.avatar}
      </div>
      {showPresence && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-base-900 ${
            user.presence === "online"
              ? "bg-neon-lime"
              : user.presence === "away"
              ? "bg-neon-amber"
              : user.presence === "in-call"
              ? "bg-neon-fuchsia animate-pulseglow"
              : "bg-white/30"
          }`}
        />
      )}
    </div>
  );
}
