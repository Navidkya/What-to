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
  location?: {
    lat: number;
    lng: number;
    label: string;
    radius: number; // km
  };
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
  total?: number;
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

export interface ListenPrefs {
  done: boolean;
  type: 'Álbum' | 'Podcast' | 'Ambos';
  genres: string[];
  energia: 'relaxante' | 'energetico' | 'mistura';
}

export interface ReadPrefs {
  done: boolean;
  type: 'Livro' | 'Artigo' | 'Ambos';
  genres: string[];
  peso: 'leve' | 'denso' | 'mistura';
}

export interface PlayPrefs {
  done: boolean;
  type: 'Videojogo' | 'Tabuleiro' | 'Ambos';
  genres: string[];
  dificuldade: 'casual' | 'normal' | 'desafiante';
}

export interface LearnPrefs {
  done: boolean;
  formato: 'video' | 'texto' | 'Ambos';
  genres: string[];
  duracao: 'curta' | 'normal' | 'longa';
}

export interface VisitPrefs {
  done: boolean;
  tipo: string[];
  custo: 'gratuito' | 'baixo' | 'qualquer';
  distancia: 'perto' | 'qualquer';
}

export interface DoPrefs {
  done: boolean;
  contexto: 'solo' | 'a_dois' | 'grupo' | 'qualquer';
  local: 'interior' | 'exterior' | 'qualquer';
  custo: 'gratuito' | 'qualquer';
}

export type Screen =
  | 'onboard'
  | 'home'
  | 'suggest'
  | 'checklist'
  | 'metrics'
  | 'match-screen'
  | 'wishlist'
  | 'lista'
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

export interface UserListItem {
  id: string;
  title: string;
  emoji: string;
  catId: string;
  cat: string;
  type: string;
  addedAt: string;
  note?: string;
}

export interface UserList {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  items: UserListItem[];
}

export interface PermanentPrefs {
  foodAllergies: string[];
  foodDislikes: string[];
  alwaysGenres: Record<string, string[]>;
  neverGenres: Record<string, string[]>;
  preferredLanguage: 'pt' | 'en' | 'any';
}
