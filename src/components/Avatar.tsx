"use client";

import { type User } from "@/lib/data";

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-base", xl: "h-20 w-20 text-xl" };
const ring = {
  online: "ring-mint-400",
  away: "ring-honey-400",
  "in-call": "ring-ember-500",
  offline: "ring-sand-50/20",
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
          speaking ? "ring-mint-400 shadow-[0_0_0_4px_rgba(74,222,151,0.25)]" : "ring-sand-50/10"
        } transition-shadow`}
        style={{ background: user.color }}
        title={user.username}
      >
        {user.avatar}
      </div>
      {showPresence && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-950 ${
            user.presence === "online"
              ? "bg-mint-400"
              : user.presence === "away"
              ? "bg-honey-400"
              : user.presence === "in-call"
              ? "bg-ember-500 animate-pulseglow"
              : "bg-sand-50/30"
          }`}
        />
      )}
    </div>
  );
}
