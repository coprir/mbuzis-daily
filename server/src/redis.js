// Optional Redis adapter for Socket.IO — lets multiple server instances share
// presence/room events so the platform scales horizontally. No-op without
// REDIS_URL (a single instance works fine on its own).
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

const REDIS_URL = process.env.REDIS_URL || "";

export async function attachRedis(io) {
  if (!REDIS_URL) {
    console.log("🔁 Redis OFF (set REDIS_URL to scale to multiple instances) — single-instance mode");
    return false;
  }
  try {
    const pub = createClient({ url: REDIS_URL });
    const sub = pub.duplicate();
    await Promise.all([pub.connect(), sub.connect()]);
    io.adapter(createAdapter(pub, sub));
    console.log("🔁 Redis ON — Socket.IO adapter attached (horizontal scale ready)");
    return true;
  } catch (e) {
    console.error("[redis] failed, continuing single-instance:", e.message);
    return false;
  }
}
