"use client";

import { useEffect, useState } from "react";

// Returns false during SSR + first client render, true after mount.
// Use to gate time-relative or randomised text so server and client
// markup match on hydration.
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
