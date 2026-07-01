// Seed state for the Mbuzis Daily realtime server.
// IDs (u1..u20, r1..r6) are kept in sync with the web app's src/lib/data.ts so
// the client can resolve names/avatars/colours locally while the server stays
// the source of truth for presence, membership and room state.

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

const names = [
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

const initials = (n) =>
  n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function makeUsers() {
  return names.map(([username, handle, role, presence], i) => ({
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
    followers: ((i * 1373 + 517) % 9400) + 240,
    following: i % 4 === 0,
    color: gradients[i % gradients.length],
    // sockets currently held by this user (presence is derived from this at runtime)
    sockets: new Set(),
  }));
}

const roomSeeds = [
  ["Late Night Nairobi", "City talk, music & confessions", "u4", "Lifestyle", true, true, 12, false],
  ["Amapiano vs Afrobeats", "The eternal debate 🔥", "u6", "Music", true, true, 20, false],
  ["Founders Unfiltered", "Raw startup stories from Africa", "u5", "Business", true, false, 8, true],
  ["Premier League Live", "Matchday reactions & bets", "u12", "Sports", false, true, 50, false],
  ["Poetry & Chill", "Open mic for spoken word", "u15", "Arts", false, false, 15, false],
  ["Tech Twende", "Devs building for the continent", "u20", "Tech", true, false, 10, false],
];

export function makeRooms(now) {
  const inCall = names
    .map((n, i) => [`u${i + 1}`, n[3]])
    .filter(([, p]) => p === "in-call")
    .map(([id]) => id);

  return roomSeeds.map(([title, topic, hostId, category, trending, featured, capacity, locked], i) => {
    const slice = inCall.slice(i * 2, i * 2 + 3 + (i % 3));
    const ids = slice.length ? slice : [hostId];
    return {
      id: `r${i + 1}`,
      title,
      topic,
      hostId,
      category,
      capacity,
      locked,
      live: true,
      trending,
      featured,
      thumbnail: gradients[i % gradients.length],
      participantIds: Array.from(new Set([hostId, ...ids])),
      startedAt: now - (i + 1) * 1000 * 60 * (7 + i * 4),
    };
  });
}

export const TRENDING_TOPICS = [
  "#LateNightNairobi",
  "#AmapianoWars",
  "#FoundersUnfiltered",
  "#MatchdayVibes",
  "#TechTwende",
  "#OpenMic",
];

export const MAX_ADMINS = 3;
