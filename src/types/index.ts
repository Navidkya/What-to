// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface Platform {
  n: string;
  url: string;
  c: string;
}

export interface DataItem {
  title: string;
  year?: string;
  type: string;
  genre: string;
  rating?: number;
  desc: string;
  emoji: string;
  dur?: string;
  peso?: string;
  carne?: boolean;
  comp?: string;
  custo?: string;
  local?: string;
  platforms: Platform[];
  steamId?: number | null;
  isbn?: string;
}

export interface Category {
  id: string;
  icon: string;
  name: string;
  color: string;
  trackable: boolean;
  expensive: boolean;
  moods: string[];
}

export interface WhyReason {
  icon: string;
  l: string;
  s: string;
  p: string;
  v: string | boolean | number;
  block?: boolean;
  blockPlat?: boolean;
}

export interface Profile {
  name: string;
  onboarded: boolean;
  platforms: string[];
  blockedPlatforms?: string[];
  savedPeople?: string[];
}

export interface HistoryEntry {
  catId: string;
  title: string;
  emoji: string;
  cat: string;
  date: string;
  type: string;
  genre: string;
  action: 'agora' | 'hoje' | 'save' | 'skip';
}

export interface TrackingEntry {
  state: 'watching' | 'paused' | 'done' | 'dropped' | 'want';
  title: string;
  emoji: string;
  cat: string;
  catId: string;
  s?: number;
  e?: number;
  feel?: string;
  note?: string;
  type?: string;
}

export type TrackingMap = Record<string, TrackingEntry>;
export type PrefsMap = Record<string, Record<string, unknown>>;

export interface WishlistEntry {
  key: string;
  catId: string;
  title: string;
  emoji: string;
  cat: string;
  date: string;
  type: string;
  genre: string;
  action: string;
}

export interface ScheduleEntry {
  id: string;
  title: string;
  emoji: string;
  catId: string;
  cat: string;
  date: string; // ISO
  note?: string;
}

export interface EatPrefs {
  done: boolean;
  local: string[]; // 'casa', 'sair', 'takeaway'
  fome: string;    // 'leve', 'normal', 'pesado'
  budget: string;  // 'economico', 'medio', 'especial'
  restrictions: string[]; // 'vegetariano', 'sem-gluten', 'sem-lactose', 'nenhuma'
  tempo?: string;  // 'rapido', 'normal', 'demorado'
}

export interface WatchPrefs {
  done: boolean;
  genres: string[];
  duration: string; // 'curto', 'normal', 'longo'
  type: string;     // 'Filme', 'Série', 'Ambos'
  discovery: string; // 'populares', 'mistura', 'surpresa'
}

export type Screen =
  | 'onboard'
  | 'home'
  | 'suggest'
  | 'checklist'
  | 'metrics'
  | 'match-screen'
  | 'wishlist'
  | 'profile'
  | 'b2b'
  | 'friends'
  | 'feed';

export type OverlayId =
  | 'reactOv'
  | 'whyOv'
  | 'linkOv'
  | 'liveOv'
  | 'trackOv'
  | 'wrappedOv'
  | null;

export interface LinkOverlayData {
  title: string;
  name: string;
  url: string;
  color: string;
}

export interface MatchState {
  step: string;
  mode: 'offline' | 'online' | null;
  cat: string | null;
  sub: string | null;
  participants: string[];
  pool: DataItem[];
  idx: number;
  votes: Record<string, DataItem[]>;
  currentVoter: number;
}
