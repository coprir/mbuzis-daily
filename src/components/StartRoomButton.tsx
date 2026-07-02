"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Radio, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import CreateRoomModal from "./CreateRoomModal";

// A clear, reusable "Start a room" entry point. Admins get the create modal;
// everyone else gets a friendly explanation of how to host.
export default function StartRoomButton({
  variant = "primary",
  className = "",
  label = "Start a room",
}: {
  variant?: "primary" | "ghost";
  className?: string;
  label?: string;
}) {
  const meId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const createRoom = useStore((s) => s.createRoom);
  const pushToast = useStore((s) => s.pushToast);
  const me = users.find((u) => u.id === meId);
  const canHost = me?.role === "admin" || me?.role === "host";
  const [open, setOpen] = useState(false);

  const onClick = () => {
    if (canHost) {
      setOpen(true);
    } else {
      pushToast({
        title: "Only admins can start rooms",
        body: "Enter an admin code when you join, or ask an admin to promote you.",
        tone: "info",
      });
    }
  };

  return (
    <>
      <button onClick={onClick} className={`${variant === "primary" ? "btn-primary" : "btn-ghost"} ${className}`}>
        {variant === "primary" ? <Radio className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {label}
      </button>
      <AnimatePresence>
        {open && (
          <CreateRoomModal
            onClose={() => setOpen(false)}
            onCreate={(t, topic, cat, cap) => {
              const id = createRoom(t, topic, cat, cap);
              setOpen(false);
              window.location.href = `/room/${id}`;
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
