// Postgres persistence for durable data (accounts, sessions, activity, logs,
// owner). Fully optional: with no DATABASE_URL the whole module is a no-op and
// the server runs on in-memory state exactly as before.
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "";
let pool = null;

export const dbEnabled = () => !!pool;

export async function initDb() {
  if (!DATABASE_URL) {
    console.log("🗄️  Postgres OFF (set DATABASE_URL to persist accounts/logs) — using in-memory state");
    return false;
  }
  const ssl = /localhost|127\.0\.0\.1/.test(DATABASE_URL) ? false : { rejectUnauthorized: false };
  pool = new pg.Pool({ connectionString: DATABASE_URL, ssl, max: 5 });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY, username text, handle text, avatar text, role text,
      bio text, followers int, color text, owner boolean, dynamic boolean
    );
    CREATE TABLE IF NOT EXISTS sessions (
      user_id text PRIMARY KEY, token text, username text
    );
    CREATE TABLE IF NOT EXISTS activity (
      id text PRIMARY KEY, type text, at bigint, username text, user_id text, role text, actor text
    );
    CREATE TABLE IF NOT EXISTS mod_logs (
      id text PRIMARY KEY, at bigint, actor text, action text
    );
    CREATE TABLE IF NOT EXISTS kv (key text PRIMARY KEY, value text);
  `);
  console.log("🗄️  Postgres ON — durable accounts, sessions, activity & logs");
  return true;
}

// ---- writes (fire-and-forget from callers) ----
export async function saveUser(u) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO users (id,username,handle,avatar,role,bio,followers,color,owner,dynamic)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET username=$2,handle=$3,avatar=$4,role=$5,bio=$6,followers=$7,color=$8,owner=$9,dynamic=$10`,
    [u.id, u.username, u.handle, u.avatar, u.role, u.bio, u.followers, u.color, !!u.owner, !!u.dynamic]
  ).catch((e) => console.error("[db saveUser]", e.message));
}
export async function saveSession(userId, token, username) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO sessions (user_id,token,username) VALUES ($1,$2,$3)
     ON CONFLICT (user_id) DO UPDATE SET token=$2,username=$3`,
    [userId, token, username]
  ).catch((e) => console.error("[db saveSession]", e.message));
}
export async function saveActivity(a) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO activity (id,type,at,username,user_id,role,actor) VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO NOTHING`,
    [a.id, a.type, a.at, a.username, a.userId, a.role, a.actor || null]
  ).catch((e) => console.error("[db saveActivity]", e.message));
}
export async function saveModLog(l) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO mod_logs (id,at,actor,action) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
    [l.id, l.at, l.actor, l.action]
  ).catch((e) => console.error("[db saveModLog]", e.message));
}
export async function saveKv(key, value) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO kv (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2`,
    [key, String(value)]
  ).catch((e) => console.error("[db saveKv]", e.message));
}

// ---- load everything on boot ----
export async function loadAll() {
  if (!pool) return null;
  try {
    const [users, sessions, activity, modLogs, kv] = await Promise.all([
      pool.query(`SELECT * FROM users WHERE dynamic = true`),
      pool.query(`SELECT * FROM sessions`),
      pool.query(`SELECT * FROM activity ORDER BY at DESC LIMIT 300`),
      pool.query(`SELECT * FROM mod_logs ORDER BY at DESC LIMIT 200`),
      pool.query(`SELECT * FROM kv`),
    ]);
    const kvMap = Object.fromEntries(kv.rows.map((r) => [r.key, r.value]));
    return {
      users: users.rows.map((r) => ({
        id: r.id, username: r.username, handle: r.handle, avatar: r.avatar, role: r.role,
        presence: "offline", bio: r.bio, followers: r.followers, following: false,
        color: r.color, owner: r.owner, dynamic: r.dynamic, sockets: new Set(),
      })),
      sessions: sessions.rows.map((r) => [r.user_id, { token: r.token, username: r.username }]),
      activity: activity.rows.map((r) => ({
        id: r.id, type: r.type, at: Number(r.at), username: r.username, userId: r.user_id, role: r.role, actor: r.actor,
      })),
      modLogs: modLogs.rows.map((r) => ({ id: r.id, at: Number(r.at), actor: r.actor, action: r.action })),
      owner: kvMap.owner || null,
    };
  } catch (e) {
    console.error("[db loadAll]", e.message);
    return null;
  }
}
