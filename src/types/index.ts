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
  username?: string;
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
  local: string[];
  fome: string;
  budget: string;
  restrictions: string[];
  tempo?: string;
  nivelCozinheiro?: string;
  quantas?: string;
  cozinha?: string[];
  ocasiao?: string;
  abertoAgora?: boolean;
  petFriendly?: boolean;
  esplanada?: boolean;
}

export interface WatchPrefs {
  done: boolean;
  type: string;
  genres: string[];
  duration: string;
  discovery: string;
  origem?: string;
  lingua?: string;
  epoca?: string;
  minRating?: string;
  conQuem?: string;
  humor?: string;
  classificacao?: string;
  gatilhos?: string;
  reassistir?: boolean;
}

export interface ListenPrefs {
  done: boolean;
  type: 'Álbum' | 'Single/EP' | 'Podcast' | 'Ambos';
  genres: string[];
  energia: 'relaxante' | 'energetico' | 'mistura';
  momento?: string;
  duracao?: string;
  novidade?: string;
  lingua?: string;
}

export interface ReadPrefs {
  done: boolean;
  type: 'Livro' | 'BD/Manga' | 'Ambos';
  genres: string[];
  peso: 'leve' | 'denso' | 'mistura';
  comprimento?: string;
  lingua?: string;
  tempoReal?: string;
  formato?: string;
  standalone?: boolean;
}

export interface PlayPrefs {
  done: boolean;
  type: 'Videojogo' | 'Mobile' | 'Arcade' | 'Tabuleiro' | 'Ambos';
  genres: string[];
  dificuldade: 'casual' | 'normal' | 'desafiante';
  jogadores?: string;
  online?: string;
  duracao?: string;
  experiencia?: string;
}

export interface LearnPrefs {
  done: boolean;
  formato: 'video' | 'Ambos';
  genres: string[];
  duracao: 'curta' | 'normal' | 'longa';
  nivel?: string;
  lingua?: string;
  gratis?: boolean;
  certificado?: boolean;
  objetivo?: string;
}

export interface VisitPrefs {
  done: boolean;
  tipo: string[];
  distancia: 'perto' | 'proximo' | 'qualquer';
  custo: 'gratuito' | 'baixo' | 'qualquer';
  altura?: string;
  acessivel?: boolean;
  conQuem?: string;
  interior?: boolean;
  tempoVisita?: string;
  reserva?: string;
  mobilidade?: string;
}

export interface DoPrefs {
  done: boolean;
  contexto: 'solo' | 'a_dois' | 'grupo' | 'qualquer';
  local: 'interior' | 'exterior' | 'qualquer';
  custo: 'gratuito' | 'qualquer';
  duracao?: string;
  energia?: string;
  objetivo?: string;
  meteorologia?: string;
  animais?: boolean;
}

export type Screen =
  | 'onboard'
  | 'home'
  | 'para-ti'
  | 'suggest'
  | 'checklist'
  | 'metrics'
  | 'match-screen'
  | 'wishlist'
  | 'lista'
  | 'profile'
  | 'b2b'
  | 'friends'
  | 'feed'
  | 'creator-dashboard'
  | 'plan'
  | 'messages'
  | 'conversation';

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

export interface PlanItem {
  id: string;
  title: string;
  emoji: string;
  catId: string;
  cat: string;
  type: string;
  desc?: string;
  img?: string | null;
}

export interface NightPlan {
  id: string;
  name: string;
  emoji: string;
  items: PlanItem[];
  participants: string[];
  createdAt: string;
  isAuto: boolean; // gerado pelo Surpreende-me
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  suggestion?: {
    title: string;
    emoji: string;
    catId: string;
    cat: string;
    img?: string | null;
    type?: string;
  };
  readAt?: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  lastMessage?: string;
  lastMessageAt: string;
  // enriquecido no cliente
  friendName?: string;
  friendUsername?: string;
  unreadCount?: number;
}
