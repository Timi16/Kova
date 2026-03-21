export interface Creator {
  id: string;
  name: string;
  address: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  postCount: number;
  totalVolume: number;
  totalEarned: number;
}

export interface Post {
  id: string;
  creator: Creator;
  title: string;
  description: string;
  media: string;
  mediaType: "image" | "video";
  price: number;
  mintCount: number;
  ownerCount: number;
  likes: number;
  comments: number;
  type: "open" | "limited";
  supply: number;
  endsAt: string | null;
  status: "live" | "ended" | "upcoming" | "sold_out";
  createdAt: string;
  contractAddress: string;
  tokenStandard: string;
  royalty: number;
}

export interface Listing {
  id: string;
  post: Post;
  seller: Creator;
  price: number;
  tokenId: number;
  listedAt: string;
}

export interface ActivityEvent {
  id: string;
  type: "mint" | "sale" | "list" | "offer";
  actor: Creator;
  post: Post;
  price: number;
  tokenId: number;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: "mint" | "trending" | "follow" | "offer_accepted" | "comment" | "like";
  actor: Creator;
  post?: Post;
  message: string;
  timestamp: string;
  read: boolean;
}

const addr = (i: number) => {
  const hex = "0123456789abcdef";
  let s = "0x";
  for (let j = 0; j < 40; j++) s += hex[(i * 7 + j * 13) % 16];
  return s;
};

const img = (id: number, size = 600) => `https://picsum.photos/seed/kalieso${id}/${size}/${size}`;

export const creators: Creator[] = [
  { id: "c1", name: "Luna Voss", address: addr(1), avatar: img(101, 100), bio: "Digital sculptor exploring void and form", followers: 48200, following: 312, postCount: 89, totalVolume: 2450.8, totalEarned: 1820.4 },
  { id: "c2", name: "Kael Drift", address: addr(2), avatar: img(102, 100), bio: "Generative art & on-chain poetry", followers: 31500, following: 198, postCount: 142, totalVolume: 4120.2, totalEarned: 3100.6 },
  { id: "c3", name: "Mira Chen", address: addr(3), avatar: img(103, 100), bio: "Photographer. Tokyo → Berlin → Chain", followers: 22800, following: 456, postCount: 67, totalVolume: 890.5, totalEarned: 670.3 },
  { id: "c4", name: "Axl Rune", address: addr(4), avatar: img(104, 100), bio: "3D environments & surreal landscapes", followers: 15400, following: 89, postCount: 34, totalVolume: 1560.0, totalEarned: 1170.0 },
  { id: "c5", name: "Sage Nakamoto", address: addr(5), avatar: img(105, 100), bio: "Abstract minimalism. Less is everything", followers: 42100, following: 23, postCount: 201, totalVolume: 8920.4, totalEarned: 6690.3 },
  { id: "c6", name: "Nova Pierce", address: addr(6), avatar: img(106, 100), bio: "Motion designer & visual alchemist", followers: 8900, following: 567, postCount: 28, totalVolume: 340.2, totalEarned: 255.1 },
  { id: "c7", name: "Zephyr Tanaka", address: addr(7), avatar: img(107, 100), bio: "Film stills from dreams I haven't had", followers: 19700, following: 134, postCount: 56, totalVolume: 1230.8, totalEarned: 923.1 },
  { id: "c8", name: "Echo Blanc", address: addr(8), avatar: img(108, 100), bio: "Sound → Image → Token", followers: 5200, following: 890, postCount: 12, totalVolume: 180.4, totalEarned: 135.3 },
  { id: "c9", name: "Rift Okafor", address: addr(9), avatar: img(109, 100), bio: "Glitch aesthetics & broken beauty", followers: 37600, following: 67, postCount: 178, totalVolume: 5670.0, totalEarned: 4252.5 },
  { id: "c10", name: "Sol Vega", address: addr(10), avatar: img(110, 100), bio: "Color theory extremist", followers: 11300, following: 234, postCount: 45, totalVolume: 890.6, totalEarned: 667.9 },
  { id: "c11", name: "Pixel Moreau", address: addr(11), avatar: img(111, 100), bio: "Retro-futurism & neon decay", followers: 28400, following: 156, postCount: 93, totalVolume: 3210.5, totalEarned: 2407.9 },
  { id: "c12", name: "Aura Kim", address: addr(12), avatar: img(112, 100), bio: "Watercolor meets blockchain", followers: 6700, following: 345, postCount: 19, totalVolume: 420.0, totalEarned: 315.0 },
  { id: "c13", name: "Cipher Woods", address: addr(13), avatar: img(113, 100), bio: "AI-assisted compositions", followers: 14200, following: 78, postCount: 67, totalVolume: 2100.3, totalEarned: 1575.2 },
  { id: "c14", name: "Void Patel", address: addr(14), avatar: img(114, 100), bio: "The space between pixels", followers: 9800, following: 412, postCount: 31, totalVolume: 560.8, totalEarned: 420.6 },
  { id: "c15", name: "Flux Andersen", address: addr(15), avatar: img(115, 100), bio: "Kinetic typography & motion", followers: 21000, following: 98, postCount: 84, totalVolume: 1890.2, totalEarned: 1417.6 },
  { id: "c16", name: "Nyx Rivera", address: addr(16), avatar: img(116, 100), bio: "Dark romanticism on-chain", followers: 33500, following: 45, postCount: 112, totalVolume: 4560.0, totalEarned: 3420.0 },
  { id: "c17", name: "Orion Blake", address: addr(17), avatar: img(117, 100), bio: "Cosmic renders & stellar dust", followers: 7400, following: 267, postCount: 23, totalVolume: 340.5, totalEarned: 255.4 },
  { id: "c18", name: "Zen Kowalski", address: addr(18), avatar: img(118, 100), bio: "One line. One shape. One truth", followers: 50200, following: 12, postCount: 8, totalVolume: 12400.0, totalEarned: 9300.0 },
  { id: "c19", name: "Prism Osei", address: addr(19), avatar: img(119, 100), bio: "Afrofuturist digital tapestries", followers: 16800, following: 189, postCount: 52, totalVolume: 2340.7, totalEarned: 1755.5 },
  { id: "c20", name: "Drift Yamamoto", address: addr(20), avatar: img(120, 100), bio: "Architecture of emptiness", followers: 12600, following: 145, postCount: 39, totalVolume: 1670.3, totalEarned: 1252.7 },
];

const now = Date.now();
const h = (hours: number) => new Date(now + hours * 3600000).toISOString();
const ago = (hours: number) => new Date(now - hours * 3600000).toISOString();

export const posts: Post[] = [
  { id: "p1", creator: creators[0], title: "Summer Void", description: "A meditation on absence in the heat", media: img(1), mediaType: "image", price: 0.042, mintCount: 1204, ownerCount: 892, likes: 842, comments: 34, type: "open", supply: 0, endsAt: h(6.4), status: "live", createdAt: ago(2), contractAddress: addr(41), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p2", creator: creators[1], title: "Protocol Dreams #001", description: "First in the generative series", media: img(2), mediaType: "image", price: 0.1, mintCount: 567, ownerCount: 432, likes: 1203, comments: 89, type: "limited", supply: 1000, endsAt: null, status: "live", createdAt: ago(5), contractAddress: addr(42), tokenStandard: "ERC-721", royalty: 7.5 },
  { id: "p3", creator: creators[4], title: "Negative Space", description: "What you don't see defines what you do", media: img(3), mediaType: "image", price: 0.5, mintCount: 2841, ownerCount: 1203, likes: 3402, comments: 156, type: "open", supply: 0, endsAt: null, status: "live", createdAt: ago(12), contractAddress: addr(43), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p4", creator: creators[2], title: "Tokyo at 3AM", description: "Shibuya crossing, empty", media: img(4), mediaType: "image", price: 0.025, mintCount: 4521, ownerCount: 3102, likes: 5670, comments: 234, type: "open", supply: 0, endsAt: h(2.1), status: "live", createdAt: ago(8), contractAddress: addr(44), tokenStandard: "ERC-1155", royalty: 3 },
  { id: "p5", creator: creators[8], title: "Corrupted Memory", description: "Glitch portrait series — fragment 7", media: img(5), mediaType: "image", price: 0.08, mintCount: 890, ownerCount: 645, likes: 1567, comments: 67, type: "open", supply: 0, endsAt: h(0.5), status: "live", createdAt: ago(23), contractAddress: addr(45), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p6", creator: creators[3], title: "Floating Temple", description: "3D render — sacred geometry in clouds", media: img(6), mediaType: "image", price: 1.2, mintCount: 234, ownerCount: 198, likes: 890, comments: 45, type: "limited", supply: 500, endsAt: null, status: "live", createdAt: ago(1), contractAddress: addr(46), tokenStandard: "ERC-721", royalty: 10 },
  { id: "p7", creator: creators[5], title: "Liquid Chrome", description: "Motion study in reflections", media: img(7), mediaType: "image", price: 0.0, mintCount: 8934, ownerCount: 6201, likes: 7800, comments: 312, type: "open", supply: 0, endsAt: h(12), status: "live", createdAt: ago(4), contractAddress: addr(47), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p8", creator: creators[10], title: "Neon Decay #12", description: "When the signs stop working", media: img(8), mediaType: "image", price: 0.15, mintCount: 1678, ownerCount: 1023, likes: 2340, comments: 98, type: "open", supply: 0, endsAt: null, status: "live", createdAt: ago(6), contractAddress: addr(48), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p9", creator: creators[15], title: "Ophelia.exe", description: "Digital reimagining of Pre-Raphaelite beauty", media: img(9), mediaType: "image", price: 2.5, mintCount: 156, ownerCount: 142, likes: 4560, comments: 201, type: "limited", supply: 200, endsAt: null, status: "live", createdAt: ago(3), contractAddress: addr(49), tokenStandard: "ERC-721", royalty: 7.5 },
  { id: "p10", creator: creators[17], title: "One.", description: "", media: img(10), mediaType: "image", price: 50, mintCount: 1, ownerCount: 1, likes: 12400, comments: 890, type: "limited", supply: 1, endsAt: null, status: "sold_out", createdAt: ago(48), contractAddress: addr(50), tokenStandard: "ERC-721", royalty: 10 },
  { id: "p11", creator: creators[6], title: "Dream Frame 042", description: "Captured between sleep cycles", media: img(11), mediaType: "image", price: 0.035, mintCount: 3210, ownerCount: 2100, likes: 1890, comments: 78, type: "open", supply: 0, endsAt: h(8), status: "live", createdAt: ago(10), contractAddress: addr(51), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p12", creator: creators[9], title: "Chromatic Tension", description: "When complementary colors collide", media: img(12), mediaType: "image", price: 0.06, mintCount: 2100, ownerCount: 1560, likes: 3400, comments: 123, type: "open", supply: 0, endsAt: null, status: "live", createdAt: ago(15), contractAddress: addr(52), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p13", creator: creators[12], title: "Neural Garden", description: "AI-assisted botanical illustrations", media: img(13), mediaType: "image", price: 0.001, mintCount: 10000, ownerCount: 7800, likes: 6700, comments: 345, type: "open", supply: 0, endsAt: h(24), status: "live", createdAt: ago(20), contractAddress: addr(53), tokenStandard: "ERC-1155", royalty: 3 },
  { id: "p14", creator: creators[14], title: "Type in Motion", description: "Letters that breathe", media: img(14), mediaType: "image", price: 0.2, mintCount: 456, ownerCount: 389, likes: 2100, comments: 67, type: "limited", supply: 1000, endsAt: null, status: "live", createdAt: ago(7), contractAddress: addr(54), tokenStandard: "ERC-721", royalty: 5 },
  { id: "p15", creator: creators[18], title: "Ancestral Code", description: "Weaving tradition into the digital loom", media: img(15), mediaType: "image", price: 0.3, mintCount: 789, ownerCount: 612, likes: 4200, comments: 189, type: "open", supply: 0, endsAt: null, status: "live", createdAt: ago(14), contractAddress: addr(55), tokenStandard: "ERC-1155", royalty: 7.5 },
  { id: "p16", creator: creators[19], title: "Void Architecture", description: "Buildings that exist only in negative", media: img(16), mediaType: "image", price: 0.08, mintCount: 1345, ownerCount: 987, likes: 1670, comments: 56, type: "open", supply: 0, endsAt: h(4), status: "live", createdAt: ago(9), contractAddress: addr(56), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p17", creator: creators[7], title: "Sound Wave #3", description: "Audio visualization rendered as token", media: img(17), mediaType: "image", price: 0.0, mintCount: 5600, ownerCount: 4200, likes: 3400, comments: 145, type: "open", supply: 0, endsAt: h(48), status: "live", createdAt: ago(1), contractAddress: addr(57), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p18", creator: creators[11], title: "Watercolor Genesis", description: "Where analog meets immutable", media: img(18), mediaType: "image", price: 0.4, mintCount: 234, ownerCount: 201, likes: 890, comments: 34, type: "limited", supply: 500, endsAt: null, status: "live", createdAt: ago(16), contractAddress: addr(58), tokenStandard: "ERC-721", royalty: 5 },
  { id: "p19", creator: creators[13], title: "Between Pixels", description: "The space that separates meaning", media: img(19), mediaType: "image", price: 0.012, mintCount: 6789, ownerCount: 4560, likes: 5600, comments: 234, type: "open", supply: 0, endsAt: null, status: "live", createdAt: ago(30), contractAddress: addr(59), tokenStandard: "ERC-1155", royalty: 3 },
  { id: "p20", creator: creators[16], title: "Stellar Dust", description: "Cosmic particles frozen in time", media: img(20), mediaType: "image", price: 0.055, mintCount: 1890, ownerCount: 1340, likes: 2670, comments: 89, type: "open", supply: 0, endsAt: h(16), status: "live", createdAt: ago(11), contractAddress: addr(60), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p21", creator: creators[0], title: "Winter Presence", description: "The counterpart to Summer Void", media: img(21), mediaType: "image", price: 0.042, mintCount: 890, ownerCount: 678, likes: 1200, comments: 56, type: "open", supply: 0, endsAt: h(3), status: "live", createdAt: ago(4), contractAddress: addr(61), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p22", creator: creators[4], title: "Zero", description: "Nothing is also something", media: img(22), mediaType: "image", price: 0.0, mintCount: 15000, ownerCount: 12000, likes: 9800, comments: 567, type: "open", supply: 0, endsAt: null, status: "live", createdAt: ago(72), contractAddress: addr(62), tokenStandard: "ERC-1155", royalty: 0 },
  { id: "p23", creator: creators[1], title: "Protocol Dreams #002", description: "Iteration on infinite loops", media: img(23), mediaType: "image", price: 0.12, mintCount: 450, ownerCount: 380, likes: 980, comments: 45, type: "limited", supply: 500, endsAt: null, status: "live", createdAt: ago(2), contractAddress: addr(63), tokenStandard: "ERC-721", royalty: 7.5 },
  { id: "p24", creator: creators[8], title: "Error State", description: "When the machine reveals its soul", media: img(24), mediaType: "image", price: 0.09, mintCount: 670, ownerCount: 520, likes: 1340, comments: 78, type: "open", supply: 0, endsAt: null, status: "ended", createdAt: ago(96), contractAddress: addr(64), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p25", creator: creators[2], title: "Berlin Mornings", description: "Kreuzberg in golden hour", media: img(25), mediaType: "image", price: 0.018, mintCount: 3400, ownerCount: 2800, likes: 4100, comments: 167, type: "open", supply: 0, endsAt: null, status: "live", createdAt: ago(36), contractAddress: addr(65), tokenStandard: "ERC-1155", royalty: 3 },
  { id: "p26", creator: creators[10], title: "Neon Decay #13", description: "The last flicker", media: img(26), mediaType: "image", price: 0.15, mintCount: 1200, ownerCount: 890, likes: 1890, comments: 67, type: "open", supply: 0, endsAt: h(1.5), status: "live", createdAt: ago(8), contractAddress: addr(66), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p27", creator: creators[15], title: "Digital Muse", description: "Portrait of an algorithm", media: img(27), mediaType: "image", price: 3.0, mintCount: 89, ownerCount: 89, likes: 5600, comments: 234, type: "limited", supply: 100, endsAt: null, status: "live", createdAt: ago(6), contractAddress: addr(67), tokenStandard: "ERC-721", royalty: 7.5 },
  { id: "p28", creator: creators[5], title: "Prismatic Flow", description: "Light through computational glass", media: img(28), mediaType: "image", price: 0.0, mintCount: 4500, ownerCount: 3200, likes: 3100, comments: 123, type: "open", supply: 0, endsAt: h(6), status: "live", createdAt: ago(5), contractAddress: addr(68), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p29", creator: creators[19], title: "Anti-Structure", description: "Deconstructing the grid", media: img(29), mediaType: "image", price: 0.065, mintCount: 980, ownerCount: 756, likes: 1450, comments: 56, type: "open", supply: 0, endsAt: null, status: "live", createdAt: ago(18), contractAddress: addr(69), tokenStandard: "ERC-1155", royalty: 5 },
  { id: "p30", creator: creators[9], title: "Pure Red", description: "Just red. Nothing else needed", media: img(30), mediaType: "image", price: 0.02, mintCount: 7800, ownerCount: 5400, likes: 6200, comments: 289, type: "open", supply: 0, endsAt: null, status: "live", createdAt: ago(40), contractAddress: addr(70), tokenStandard: "ERC-1155", royalty: 3 },
];

export const listings: Listing[] = posts.slice(0, 20).flatMap((post, i) =>
  Array.from({ length: Math.min(3, Math.floor(Math.random() * 4) + 1) }, (_, j) => ({
    id: `l${i * 3 + j}`,
    post,
    seller: creators[(i + j + 3) % creators.length],
    price: +(post.price * (1.2 + Math.random() * 3)).toFixed(4),
    tokenId: i * 10 + j + 1,
    listedAt: ago(Math.random() * 48),
  }))
);

const eventTypes: ActivityEvent["type"][] = ["mint", "sale", "list", "offer"];
export const activityEvents: ActivityEvent[] = Array.from({ length: 40 }, (_, i) => ({
  id: `e${i}`,
  type: eventTypes[i % 4],
  actor: creators[i % creators.length],
  post: posts[i % posts.length],
  price: +(Math.random() * 5).toFixed(4),
  tokenId: Math.floor(Math.random() * 100) + 1,
  timestamp: ago(Math.random() * 24),
})).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const notifications: Notification[] = [
  { id: "n1", type: "mint", actor: creators[3], post: posts[0], message: "minted your post Summer Void", timestamp: ago(0.1), read: false },
  { id: "n2", type: "trending", actor: creators[0], post: posts[0], message: "Your post is trending — 500 mints in 1 hour", timestamp: ago(0.5), read: false },
  { id: "n3", type: "follow", actor: creators[7], message: "followed you", timestamp: ago(1), read: false },
  { id: "n4", type: "mint", actor: creators[12], post: posts[0], message: "minted your post Summer Void", timestamp: ago(1.5), read: false },
  { id: "n5", type: "comment", actor: creators[5], post: posts[2], message: "commented on your post", timestamp: ago(2), read: false },
  { id: "n6", type: "offer_accepted", actor: creators[9], post: posts[5], message: "Your offer was accepted", timestamp: ago(3), read: false },
  { id: "n7", type: "like", actor: creators[14], post: posts[0], message: "liked your post", timestamp: ago(4), read: false },
  { id: "n8", type: "mint", actor: creators[18], post: posts[2], message: "minted your post Negative Space", timestamp: ago(5), read: false },
  { id: "n9", type: "follow", actor: creators[2], message: "followed you", timestamp: ago(6), read: false },
  { id: "n10", type: "mint", actor: creators[6], post: posts[0], message: "minted your post Summer Void", timestamp: ago(7), read: false },
  { id: "n11", type: "like", actor: creators[11], post: posts[2], message: "liked your post", timestamp: ago(10), read: true },
  { id: "n12", type: "comment", actor: creators[16], post: posts[0], message: "commented on your post", timestamp: ago(12), read: true },
  { id: "n13", type: "mint", actor: creators[1], post: posts[2], message: "minted your post Negative Space", timestamp: ago(14), read: true },
  { id: "n14", type: "follow", actor: creators[19], message: "followed you", timestamp: ago(18), read: true },
  { id: "n15", type: "offer_accepted", actor: creators[4], post: posts[8], message: "Your offer was accepted", timestamp: ago(22), read: true },
];

export const categories = ["All", "Art", "Photography", "Music", "Video", "Writing", "3D", "Abstract"];

export const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export const formatINJ = (amount: number) => {
  if (amount === 0) return "FREE";
  return `${amount.toFixed(4)} INJ`;
};

export const formatCount = (n: number) => {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 1000) return n.toLocaleString();
  return n.toString();
};
