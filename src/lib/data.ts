// Mbuzis Daily — mock domain data (demo mode, no backend required)

export type Role = "admin" | "host" | "member" | "guest";
export type Presence = "online" | "away" | "in-call" | "offline";

export interface User {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  role: Role;
  presence: Presence;
  bio: string;
  followers: number;
  following: boolean;
  color: string;
}

export interface Participant {
  userId: string;
  muted: boolean;
  speaking: boolean;
  pinned: boolean;
  handRaised: boolean;
  camOn: boolean;
}

export interface JoinRequest {
  id: string;
  userId: string;
  roomId: string;
  at: number;
  status: "pending" | "approved" | "rejected";
}

export interface Room {
  id: string;
  title: string;
  topic: string;
  hostId: string;
  category: string;
  capacity: number;
  locked: boolean;
  live: boolean;
  trending: boolean;
  featured: boolean;
  thumbnail: string;
  participantIds: string[];
  startedAt: number;
}

const gradients = [
  "linear-gradient(135deg,#8b5cf6,#d946ef)",
  "linear-gradient(135deg,#22d3ee,#3b82f6)",
  "linear-gradient(135deg,#f472b6,#fb7185)",
  "linear-gradient(135deg,#a3e635,#22d3ee)",
  "linear-gradient(135deg,#fbbf24,#f97316)",
  "linear-gradient(135deg,#818cf8,#c084fc)",
  "linear-gradient(135deg,#2dd4bf,#0ea5e9)",
  "linear-gradient(135deg,#f43f5e,#8b5cf6)",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const names: [string, string, Role, Presence][] = [
  ["Zawadi Mwangi", "zawadi", "admin", "online"],
  ["Baraka Otieno", "baraka", "admin", "in-call"],
  ["Nia Kamau", "niaK", "admin", "online"],
  ["Jabari Wanjiku", "jabari", "host", "in-call"],
  ["Amani Cheruiyot", "amani", "host", "online"],
  ["Sanaa Achieng", "sanaa", "host", "in-call"],
  ["Kofi Mensah", "kofi", "member", "online"],
  ["Imani Njoroge", "imani", "member", "away"],
  ["Dalia Wafula", "dalia", "member", "in-call"],
  ["Tumaini Kiptoo", "tumaini", "member", "online"],
  ["Zuri Adhiambo", "zuri", "member", "online"],
  ["Kito Musa", "kito", "member", "in-call"],
  ["Ayana Waweru", "ayana", "member", "away"],
  ["Femi Ochieng", "femi", "member", "online"],
  ["Lulu Wangari", "lulu", "member", "in-call"],
  ["Simba Mutua", "simba", "member", "online"],
  ["Halima Barasa", "halima", "guest", "online"],
  ["Deka Abdi", "deka", "guest", "away"],
  ["Rehema Juma", "rehema", "member", "online"],
  ["Bakari Kimani", "bakari", "member", "in-call"],
];

export const users: User[] = names.map(([username, handle, role, presence], i) => ({
  id: `u${i + 1}`,
  username,
  handle,
  avatar: initials(username),
  role,
  presence,
  bio: [
    "Nairobi-based storyteller & night-owl host.",
    "Talks football, amapiano & tech until 3am.",
    "Community builder. Here for the good vibes.",
    "Producer. I moderate the loudest rooms.",
    "Just vibing and meeting new people daily.",
  ][i % 5],
  // deterministic (no Math.random) so SSR and client hydration match
  followers: ((i * 1373 + 517) % 9400) + 240,
  following: i % 4 === 0,
  color: gradients[i % gradients.length],
}));

export const currentUserId = "u1"; // Zawadi (admin) — the demo "you"

const roomSeeds: [string, string, string, string, boolean, boolean][] = [
  ["Late Night Nairobi", "City talk, music & confessions", "u4", "Lifestyle", true, true],
  ["Amapiano vs Afrobeats", "The eternal debate 🔥", "u6", "Music", true, true],
  ["Founders Unfiltered", "Raw startup stories from Africa", "u5", "Business", true, false],
  ["Premier League Live", "Matchday reactions & bets", "u12", "Sports", false, true],
  ["Poetry & Chill", "Open mic for spoken word", "u15", "Arts", false, false],
  ["Tech Twende", "Devs building for the continent", "u20", "Tech", true, false],
];

export const rooms: Room[] = roomSeeds.map(([title, topic, hostId, category, trending, featured], i) => {
  const inCall = users.filter((u) => u.presence === "in-call").map((u) => u.id);
  const slice = inCall.slice(i * 2, i * 2 + 3 + (i % 3));
  const ids = slice.length ? slice : [hostId];
  return {
    id: `r${i + 1}`,
    title,
    topic,
    hostId,
    category,
    capacity: [12, 20, 8, 50, 15, 10][i],
    locked: i === 2,
    live: true,
    trending,
    featured,
    thumbnail: gradients[i % gradients.length],
    participantIds: Array.from(new Set([hostId, ...ids])),
    startedAt: Date.now() - (i + 1) * 1000 * 60 * (7 + i * 4),
  };
});

export const trendingTopics = [
  "#LateNightNairobi",
  "#AmapianoWars",
  "#FoundersUnfiltered",
  "#MatchdayVibes",
  "#TechTwende",
  "#OpenMic",
];

export const userById = (id: string) => users.find((u) => u.id === id);
export const roomById = (id: string) => rooms.find((r) => r.id === id);

export const MAX_ADMINS = 3;
