import { useState, useCallback, useEffect, useRef } from 'react';
import { trackAsync } from '../../services/analytics';
import type { Category, DataItem, Profile, TrackingMap, PrefsMap, WatchPrefs, EatPrefs, ListenPrefs, ReadPrefs, PlayPrefs, LearnPrefs, VisitPrefs, DoPrefs } from '../../types';
import { DATA, GRAD, GENRES, TSTATE, TCOLOR, getPlatformId } from '../../data';
import { fetchTMDB, discoverTMDB, discoverTMDBMultiPage, TMDB_GENRE_MAP, TMDB_TV_GENRE_MAP, type TMDBResult, type DiscoverItem, type DiscoverFilters } from '../../services/tmdb';
import { fetchMeal, discoverMeals, type MealResult, type MealDiscoverItem } from '../../services/mealdb';
import { fetchBookCover, getSteamImageUrl } from '../../services/openLibrary';
import { discoverRAWG, type RAWGItem } from '../../services/rawg';
import { discoverYouTube, type YTItem } from '../../services/youtube';
import { discoverDeezer, type DeezerItem } from '../../services/deezer';
import { discoverFSQ, type FSQItem } from '../../services/foursquare';
import { discoverBooksMultiPage, type GBItem } from '../../services/googleBooks';
import { loadActiveSuggestions } from '../../services/influencers';
import type { InfluencerSuggestion } from '../../services/influencers';

const SUGGEST_FALLBACKS: Record<string, string> = {
  watch:  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=90',
  eat:    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=90',
  read:   'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=90',
  listen: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=90',
  play:   'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=90',
  learn:  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=90',
  visit:  'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=90',
  do:     'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=800&q=90',
};


function getCatIcon(catId: string) {
  const props = { width:12, height:12, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"1.5", strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  switch(catId) {
    case 'watch': return <svg {...props}><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 2l-4 5-4-5"/></svg>;
    case 'eat': return <svg {...props}><path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2"/><path d="M5 2v20M21 2c0 0-2 2-2 8h4c0-6-2-8-2-8z"/><path d="M19 10v12"/></svg>;
    case 'read': return <svg {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case 'listen': return <svg {...props}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case 'play': return <svg {...props}><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="13" r="1" fill="currentColor" stroke="none"/></svg>;
    case 'learn': return <svg {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case 'visit': return <svg {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'do': return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    default: return <svg {...props}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

function getUnsplashFallback(catId: string, genre: string): string {
  if (catId === 'eat') {
    if (genre === 'Restaurante') return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=90';
    if (genre === 'Delivery') return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=90';
    if (genre === 'Receita') return 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=90';
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=90';
  }
  if (catId === 'do') {
    if (genre === 'Natureza') return 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=90';
    if (genre === 'Criativo') return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=90';
    if (genre === 'Social') return 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=90';
    if (genre === 'Bem-estar') return 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=90';
    return 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=90';
  }
  if (catId === 'visit') {
    if (genre === 'Museu' || genre === 'Arte') return 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=90';
    if (genre === 'Natureza') return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=90';
    if (genre === 'Bar') return 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=90';
    return 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=90';
  }
  if (catId === 'learn') {
    if (genre === 'Tecnologia' || genre === 'IA') return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=90';
    if (genre === 'Arte' || genre === 'Design') return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=90';
    if (genre === 'Ciência') return 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=90';
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=90';
  }
  if (catId === 'listen') {
    if (genre === 'Podcast') return 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=90';
    if (genre === 'Jazz') return 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=90';
    if (genre === 'Hip-Hop') return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=90';
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=90';
  }
  return SUGGEST_FALLBACKS[catId] || 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=800&q=90';
}

interface SuggestProps {
  cat: Category;
  profile: Profile;
  tracking: TrackingMap;
  prefs: PrefsMap;
  disliked: string[];
  isActive: boolean;
  afterReactTrigger: number;
  afterReactGenre: string | null;
  onBack: () => void;
  onOpenReact: () => void;
  onOpenLink: (url: string, name: string, color: string) => void;
  onOpenWishlist: () => void;
  onOpenWhy: () => void;
  onOpenAddToList?: () => void;
  onDisplayItemResolved?: (item: { title: string; emoji: string; catId: string; cat: string; type: string } | null) => void;
  onImgResolved?: (img: string | null) => void;
  onApiContextResolved?: (ctx: { type?: string; genre?: string; rating?: number } | undefined) => void;
  onSwipeYes?: () => void;
  onSwipeNo?: () => void;
  curSugg: DataItem | null;
  setCurSugg: (item: DataItem) => void;
  watchPrefs?: WatchPrefs;
  eatPrefs?: EatPrefs;
  listenPrefs?: ListenPrefs;
  readPrefs?: ReadPrefs;
  playPrefs?: PlayPrefs;
  learnPrefs?: LearnPrefs;
  visitPrefs?: VisitPrefs;
  doPrefs?: DoPrefs;
  permanentPrefs?: import('../../types').PermanentPrefs;
  prefsVersion?: number;
  userId?: string;
  onReopenOnboard?: () => void;
}

// ── Filtragem estrita pós-API ─────────────────────────────────────────────
// Regra fundamental: se o utilizador escolheu X, só aparece X.
// Sem mínimos, sem fallbacks.

interface StrictFilterPrefs {
  watchType?: string;
  watchGenreIds?: number[];
  watchMinRating?: number;
  watchEpoca?: string;
  playDificuldade?: string;
  listenType?: string;
  readPeso?: string;
  eatRestrictions?: string[];
  visitDistancia?: string;
  doContexto?: string;
  doLocal?: string;
  doCusto?: string;
  excluded?: string[];
}

function strictFilter(items: APIItem[], catId: string, p: StrictFilterPrefs): APIItem[] {
  let result = [...items];

  if (p.excluded?.length) {
    const ex = new Set(p.excluded.map(t => t.toLowerCase().trim()));
    result = result.filter(i => !ex.has(((i as any).title || '').toLowerCase().trim()));
  }

  if (catId === 'watch') {
    if (p.watchType && p.watchType !== 'Ambos') {
      result = result.filter(i => {
        const item = i as DiscoverItem;
        const gids = item.genreIds || [];
        if (p.watchType === 'Documentário') return gids.includes(99);
        if (p.watchType === 'Anime') return gids.includes(16);
        if (p.watchType === 'Filme') return item.type === 'Filme' && !gids.includes(99);
        if (p.watchType === 'Série') return item.type === 'Série' && !gids.includes(99) && !gids.includes(16);
        return true;
      });
    }
    if (p.watchGenreIds?.length) {
      const ids = new Set(p.watchGenreIds);
      const withGenre = result.filter(i => (i as DiscoverItem).genreIds?.some(id => ids.has(id)));
      if (withGenre.length > 0) result = withGenre;
    }
    if (p.watchMinRating && p.watchMinRating > 0) {
      const withRating = result.filter(i => ((i as any).rating ?? 0) >= p.watchMinRating!);
      if (withRating.length > 0) result = withRating;
    }
    if (p.watchEpoca && p.watchEpoca !== 'qualquer') {
      if (p.watchEpoca === 'recente') {
        const r = result.filter(i => parseInt((i as any).year || '0') >= 2015);
        if (r.length > 0) result = r;
      } else if (p.watchEpoca === 'classico') {
        const r = result.filter(i => parseInt((i as any).year || '9999') <= 2000);
        if (r.length > 0) result = r;
      }
    }
  }

  if (catId === 'play') {
    if (p.playDificuldade === 'casual') {
      const r = result.filter(i => ((i as any).metacritic ?? 100) <= 75);
      if (r.length > 0) result = r;
    } else if (p.playDificuldade === 'desafiante') {
      const r = result.filter(i => ((i as any).metacritic ?? 0) >= 80);
      if (r.length > 0) result = r;
    }
  }

  if (catId === 'listen' && p.listenType && p.listenType !== 'Ambos') {
    const r = result.filter(i => (i as any).type === p.listenType);
    if (r.length > 0) result = r;
  }

  if (catId === 'read' && p.readPeso && p.readPeso !== 'mistura') {
    if (p.readPeso === 'leve') {
      const r = result.filter(i => !((i as any).pages) || (i as any).pages <= 250);
      if (r.length > 0) result = r;
    } else if (p.readPeso === 'denso') {
      const r = result.filter(i => ((i as any).pages ?? 0) >= 300);
      if (r.length > 0) result = r;
    }
  }

  if (catId === 'eat' && p.eatRestrictions?.length && !p.eatRestrictions.includes('nenhuma')) {
    if (p.eatRestrictions.includes('vegetariano') || p.eatRestrictions.includes('vegan')) {
      const r = result.filter(i => {
        const cat = ((i as any).category || '').toLowerCase();
        return cat.includes('vegetarian') || cat.includes('vegan') ||
               cat.includes('salad') || cat.includes('pasta') || cat.includes('dessert');
      });
      if (r.length > 0) result = r;
    }
  }

  if (catId === 'visit' && p.visitDistancia === 'perto') {
    const r = result.filter(i => ((i as any).distance ?? 99999) <= 2000);
    if (r.length > 0) result = r;
  }

  if (catId === 'do') {
    if (p.doContexto && p.doContexto !== 'qualquer') {
      const r = result.filter(i => {
        const genre = ((i as any).genre || '').toLowerCase();
        if (p.doContexto === 'solo') return genre.includes('solo') || genre.includes('individual');
        if (p.doContexto === 'a_dois') return genre.includes('dois') || genre.includes('casal');
        if (p.doContexto === 'grupo') return genre.includes('grupo') || genre.includes('social');
        return true;
      });
      if (r.length > 0) result = r;
    }
    if (p.doLocal && p.doLocal !== 'qualquer') {
      const r = result.filter(i => {
        const genre = ((i as any).genre || '').toLowerCase();
        if (p.doLocal === 'interior') return genre.includes('casa') || genre.includes('interior');
        if (p.doLocal === 'exterior') return genre.includes('natureza') || genre.includes('exterior');
        return true;
      });
      if (r.length > 0) result = r;
    }
    if (p.doCusto === 'gratuito') {
      const r = result.filter(i => !((i as any).custo) || (i as any).custo === 'gratuito');
      if (r.length > 0) result = r;
    }
  }

  return result;
}

function hasPlatform(item: DataItem, profile: Profile): boolean {
  const myPlats = profile.platforms || [];
  const blocked = profile.blockedPlatforms || [];
  if (!item.platforms || !item.platforms.length) return true;
  const itemPlatIds = item.platforms.map(p => getPlatformId(p.n)).filter(Boolean) as string[];
  if (itemPlatIds.length && itemPlatIds.every(id => blocked.includes(id))) return false;
  if (!myPlats.length) return true;
  return item.platforms.some(p => {
    const pid = getPlatformId(p.n);
    return pid ? myPlats.includes(pid) : false;
  });
}

function scoreItem(item: DataItem, catId: string, prefs: PrefsMap): number {
  const p = prefs[catId] || {};
  let score = 0;
  // Existing prefs
  if (p.peso && item.peso === p.peso) score += 3;
  if (p.carne === false && item.carne === false) score += 2;
  if (p.custo && item.custo === p.custo) score += 2;
  if (p.local && item.local === p.local) score += 2;
  if (p.dur && item.dur === p.dur) score += 2;
  // Type preference (e.g. "Prefiro série" → type = 'Série')
  if (p.type && item.type === p.type) score += 4;
  // Complexity preference
  if (p.comp === 'simples' && (item.comp === 'simples' || !item.comp)) score += 2;
  if (p.comp === 'dificil' && item.comp === 'dificil') score += 2;
  // Min rating (e.g. minRating = 8.5)
  if (typeof p.minRating === 'number' && typeof item.rating === 'number' && item.rating >= (p.minRating as number)) score += 3;
  if (typeof p.minRating === 'number' && typeof item.rating === 'number' && item.rating < (p.minRating as number)) score -= 3;
  // Format/format preferences (learn)
  if (p.formato && item.type === p.formato) score += 3;
  return score;
}

function filterByHardPrefs(pool: DataItem[], catId: string, prefs: PrefsMap): DataItem[] {
  const p = prefs[catId] || {};
  // If a strong type preference has been expressed (score > 0 means it was explicitly set),
  // move matching items to the top by giving them priority (already done in scoreItem).
  // Hard filter: only apply if pool stays non-empty after filter
  if (p.type) {
    const typed = pool.filter(i => i.type === p.type);
    if (typed.length >= 2) return typed;
  }
  if (p.local && catId === 'eat') {
    const local = pool.filter(i => i.local === p.local);
    if (local.length >= 2) return local;
  }
  if (p.carne === false && catId === 'eat') {
    const veg = pool.filter(i => i.carne === false || !i.carne);
    if (veg.length >= 2) return veg;
  }
  return pool;
}

interface CardData {
  tmdb: TMDBResult | null;
  meal: MealResult | null;
  cover: string | null;
}

type APIItem = DiscoverItem | RAWGItem | YTItem | DeezerItem | FSQItem | GBItem | MealDiscoverItem | InfluencerSuggestion;

interface DisplayData {
  title: string;
  desc: string;
  img: string | null;
  rating: number | null;
  year: string | null;
  type: string;
  genre: string;        // mantém para compatibilidade
  genres: string[];     // todos os géneros
  url: string | null;
  emoji: string;
  influencer?: { name: string; handle: string; tier: string };
}

function getDisplayData(item: APIItem, catId: string): DisplayData | null {
  // InfluencerSuggestion
  if ('influencerId' in item) {
    const i = item as InfluencerSuggestion;
    return {
      title: i.title, desc: i.desc, img: i.img, rating: i.rating, year: i.year,
      type: i.type, genre: i.genre, genres: [i.genre].filter(Boolean), url: null, emoji: i.emoji,
      influencer: { name: i.influencerName, handle: i.influencerHandle, tier: i.influencerTier },
    };
  }
  // TMDB DiscoverItem (watch)
  if (catId === 'watch' && 'backdropUrl' in item) {
    const i = item as DiscoverItem;
    return {
      title: i.title, desc: i.overview || '', img: i.backdropUrl || i.posterUrl,
      rating: i.rating, year: i.year, type: i.type, genre: i.genre,
      genres: i.allGenres && i.allGenres.length > 0 ? i.allGenres : [i.genre].filter(Boolean),
      url: null, emoji: i.type === 'Filme' ? '🎬' : '📺',
    };
  }
  // RAWG (play)
  if (catId === 'play' && 'metacritic' in item) {
    const i = item as RAWGItem;
    return {
      title: i.title, desc: i.description, img: i.coverUrl, rating: i.rating, year: i.year,
      type: 'Videojogo', genre: i.genres[0] || 'Jogo',
      genres: i.genres.length > 0 ? i.genres : ['Jogo'],
      url: null, emoji: '🎮',
    };
  }
  // YouTube (learn)
  if (catId === 'learn' && 'channelName' in item) {
    const i = item as YTItem;
    return {
      title: i.title, desc: `${i.channelName} · ${i.publishedAt || ''}`, img: i.thumbnailUrl,
      rating: null, year: i.publishedAt, type: 'Vídeo', genre: 'Aprender',
      genres: ['Vídeo', ...(i.channelName ? [i.channelName] : [])],
      url: `https://youtube.com/watch?v=${i.id}`, emoji: '🧠',
    };
  }
  // Deezer (listen)
  if (catId === 'listen' && 'artist' in item) {
    const i = item as DeezerItem;
    return {
      title: i.title, desc: i.artist, img: i.coverUrl, rating: null, year: null,
      type: i.type, genre: i.genre,
      genres: [i.genre, i.type].filter(Boolean),
      url: i.url, emoji: '🎵',
    };
  }
  // Google Books (read)
  if (catId === 'read' && 'authors' in item) {
    const i = item as GBItem;
    const rawGenre = i.genre || '';
    const genreList = rawGenre.split(/[\/,]/).map((g: string) => g.trim()).filter(Boolean);
    return {
      title: i.title, desc: `${i.authors.join(', ')} · ${i.pages ? i.pages + ' págs' : ''}`,
      img: i.coverUrl, rating: i.rating, year: i.year, type: 'Livro',
      genre: genreList[0] || 'Livro',
      genres: genreList.length > 0 ? genreList : ['Livro'],
      url: i.previewUrl, emoji: '📚',
    };
  }
  // Foursquare (visit)
  if (catId === 'visit' && 'address' in item) {
    const i = item as FSQItem;
    const dist = i.distance ? (i.distance < 1000 ? `${i.distance}m` : `${(i.distance / 1000).toFixed(1)}km`) : '';
    return {
      title: i.title, desc: `${i.category} · ${dist} · ${i.address}`.replace(/\s·\s$/, ''),
      img: i.coverUrl, rating: i.rating, year: null, type: i.category, genre: 'Local',
      genres: [i.category].filter(Boolean),
      url: i.mapsUrl, emoji: '📍',
    };
  }
  // MealDB (eat)
  if (catId === 'eat' && 'category' in item && 'type' in item && (item as MealDiscoverItem).type === 'Receita') {
    const i = item as MealDiscoverItem;
    return {
      title: i.title, desc: i.category, img: i.coverUrl, rating: null, year: null,
      type: 'Receita', genre: i.category,
      genres: [i.category, (i as any).area].filter(Boolean),
      url: null, emoji: '🍽️',
    };
  }
  return null;
}

function apply7030(items: APIItem[]): APIItem[] {
  if (items.length === 0) return items;
  const topCount = Math.ceil(items.length * 0.3);
  const sorted = [...items].sort((a, b) => (((b as any).rating ?? 0) as number) - (((a as any).rating ?? 0) as number));
  const top = sorted.slice(0, topCount);
  const rest = sorted.slice(topCount).sort(() => Math.random() - 0.5);
  return [...top, ...rest];
}

export default function Suggest({
  cat, profile, tracking, prefs, disliked, isActive,
  afterReactTrigger, afterReactGenre,
  onBack, onOpenReact, onOpenWishlist, onOpenWhy, onOpenAddToList, onDisplayItemResolved, onImgResolved, onApiContextResolved,
  onSwipeYes: _onSwipeYes, onSwipeNo: _onSwipeNo,
  curSugg, setCurSugg,
  watchPrefs, eatPrefs, listenPrefs, readPrefs, playPrefs, learnPrefs, visitPrefs, permanentPrefs,
  prefsVersion = 0,
  userId,
  onReopenOnboard,
}: SuggestProps) {
  const [curMood, setCurMood] = useState('Tudo');
  const [cbarOn, setCbarOn] = useState(false);
  const [cbarGenre, setCbarGenre] = useState<string | null>(null);

  // Carousel state
  const [cards, setCards] = useState<DataItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [cardDataMap, setCardDataMap] = useState<Record<string, CardData>>({});

  // Always-current refs (safe to read in effects and handlers)
  const cardsRef = useRef<DataItem[]>([]);
  const activeIdxRef = useRef(0);
  cardsRef.current = cards;
  activeIdxRef.current = activeIdx;

  const [quickYesOpen, setQuickYesOpen] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiItems, setApiItems] = useState<APIItem[]>([]);
  const apiItemsRef = useRef<APIItem[]>([]);
  apiItemsRef.current = apiItems;

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Track which titles we've already initiated fetches for
  const fetchedRef = useRef(new Set<string>());

  // Analytics: track cards skipped and whether user accepted anything
  const skipCountRef = useRef(0);
  const acceptedRef = useRef(false);
  const lastPrefsVersionRef = useRef(0);
  // (needsMoreRef removed in V8 — handled by pool minimum useEffect)

  const getPool = useCallback((gf?: string, moodOverride?: string) => {
    const mood = moodOverride ?? curMood;
    let pool = DATA[cat.id].filter(s => !disliked.includes(cat.id + ':' + s.title));
    pool = pool.filter(s => hasPlatform(s, profile));
    if (gf) pool = pool.filter(s => s.genre === gf || s.type === gf);
    else if (mood !== 'Tudo') pool = pool.filter(s => s.type === mood || s.genre === mood);
    if (!pool.length) {
      pool = DATA[cat.id].filter(s => !disliked.includes(cat.id + ':' + s.title));
      if (!pool.length) pool = [...DATA[cat.id]];
    }
    // Apply hard preference filters (only when not overriding by genre/mood)
    if (!gf && mood === 'Tudo') {
      pool = filterByHardPrefs(pool, cat.id, prefs);
    }
    // Apply permanent allergy filter for eat category
    if (cat.id === 'eat' && permanentPrefs?.foodAllergies?.length) {
      const allergies = permanentPrefs.foodAllergies;
      pool = pool.filter(item => {
        const desc = ((item.desc ?? '') + ' ' + item.title + ' ' + item.genre).toLowerCase();
        return !allergies.some(a => desc.includes(a.toLowerCase()));
      });
    }
    pool.sort((a, b) => scoreItem(b, cat.id, prefs) - scoreItem(a, cat.id, prefs));
    return pool;
  }, [cat.id, curMood, disliked, prefs, profile]);

  const loadBatch = useCallback((gf?: string, moodOverride?: string, exclude: string[] = []) => {
    const pool = getPool(gf, moodOverride);
    if (!pool.length) return;
    const available = pool.filter(s => !exclude.includes(s.title));
    const source = available.length >= 3 ? available : pool;
    // Take top half of scored pool and shuffle for variety
    const topHalf = source.slice(0, Math.max(8, Math.ceil(source.length / 2)));
    const shuffled = [...topHalf].sort(() => Math.random() - 0.5);
    const batch = shuffled.slice(0, 8);
    setCards(batch);
    setActiveIdx(0);
    setCardDataMap({});
    fetchedRef.current = new Set();
    if (batch.length > 0) setCurSugg(batch[0]);
  }, [getPool, setCurSugg]);

  const doAdvance = useCallback(async () => {
    skipCountRef.current++;
    const currentApiItems = apiItemsRef.current;
    const isAPIMode = currentApiItems.length > 0;
    const currentIdx = activeIdxRef.current;
    const nextIdx = currentIdx + 1;

    if (isAPIMode) {
      // Pré-carrega quando está a 20% do fim ou quando restam menos de 10 items
      if (nextIdx >= Math.max(currentApiItems.length - 10, currentApiItems.length * 0.8)) {
        handleLoadMore();
      }
      panDirRef.current = (panDirRef.current + 1) % 2;
      if (nextIdx >= currentApiItems.length) {
        if (currentApiItems.length < 15) {
          // Pool muito pequeno — tenta carregar mais antes de recomeçar
          handleLoadMore();
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        setApiItems(prev => [...prev].sort(() => Math.random() - 0.5));
        setActiveIdx(0);
        handleLoadMore();
      } else {
        setActiveIdx(nextIdx);
      }
      return;
    }

    // Mock/local pool logic
    panDirRef.current = (panDirRef.current + 1) % 2;
    const currentCards = cardsRef.current;
    if (nextIdx >= currentCards.length) {
      loadBatch(undefined, undefined, currentCards.map(c => c.title));
    } else {
      setActiveIdx(nextIdx);
      setCurSugg(currentCards[nextIdx]);
    }
  }, [loadBatch, setCurSugg]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load when screen activates or category changes
  useEffect(() => {
    if (isActive) {
      setCurMood('Tudo');
      setCbarOn(false);
      setApiItems([]);
      if (curSugg) {
        // Pre-set from hero: start batch with this item
        const pool = getPool();
        const rest = pool.filter(s => s.title !== curSugg!.title).slice(0, 7);
        const batch = [curSugg!, ...rest];
        setCards(batch);
        setActiveIdx(0);
        setCardDataMap({});
        fetchedRef.current = new Set();
      } else {
        loadBatch();
      }
    }
  }, [cat.id, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Analytics: session-end tracking (saiu sem aceitar nada)
  useEffect(() => {
    if (!isActive) return;
    skipCountRef.current = 0;
    acceptedRef.current = false;
    return () => {
      if (!acceptedRef.current && skipCountRef.current > 0) {
        trackAsync({ userId, eventType: 'suggest_session_end', catId: cat.id,
          value: { cards_seen: skipCountRef.current } });
      }
      acceptedRef.current = false;
      skipCountRef.current = 0;
    };
  }, [isActive, cat.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unified API discover for all categories
  useEffect(() => {
    if (!isActive) return;
    lastPrefsVersionRef.current = prefsVersion ?? 0;
    setApiLoading(true);
    // Reset de estado ao re-correr (garante que não mostra resultados antigos)
    setApiItems([]);
    setActiveIdx(0);
    setCurrentPage(1);
    setIsLoadingMore(false);

    const load = async () => {
      try {

        // ── WATCH ──────────────────────────────────────────────────────────
        if (cat.id === 'watch') {
          const isDone = watchPrefs?.done === true;
          if (!isDone) {
            const items = await discoverTMDBMultiPage(
              { type: 'both', genres: [], duration: 'normal', discovery: 'mistura',
                platforms: profile.platforms || [], origem: 'Qualquer', lingua: 'Qualquer',
                epoca: 'qualquer', minRating: 0 },
              [1, 2, 3, 4, 5]
            );
            setApiItems(apply7030(items));
          } else {
            const wType = (watchPrefs as any).type || 'Ambos';
            const wGenres: string[] = (watchPrefs as any).genres || [];
            const wDuration = (watchPrefs as any).duration || 'normal';
            const wDiscovery = (watchPrefs as any).discovery || 'mistura';
            const wOrigem = (watchPrefs as any).origem || 'Qualquer';
            const wLingua = (watchPrefs as any).lingua || 'Qualquer';
            const wEpoca = (watchPrefs as any).epoca || 'qualquer';
            const wMinRating = parseFloat((watchPrefs as any).minRating) || 0;

            const typeMap: Record<string, DiscoverFilters['type']> = {
              'Filme': 'movie', 'Série': 'tv', 'Documentário': 'both', 'Anime': 'tv',
            };
            const apiType = typeMap[wType] || 'both';

            let apiGenres = [...wGenres];
            if (wType === 'Documentário' && !apiGenres.includes('Documentário')) apiGenres = ['Documentário', ...apiGenres];
            if (wType === 'Anime' && !apiGenres.includes('Anime')) apiGenres = ['Anime', ...apiGenres];

            const allItems = await discoverTMDBMultiPage({
              type: apiType, genres: apiGenres,
              duration: wDuration as DiscoverFilters['duration'],
              discovery: wDiscovery as DiscoverFilters['discovery'],
              platforms: profile.platforms || [],
              origem: wOrigem, lingua: wLingua, epoca: wEpoca, minRating: wMinRating,
            }, [1, 2, 3, 4, 5]);

            const selectedGenreIds = apiGenres
              .flatMap(g => [TMDB_GENRE_MAP[g], TMDB_TV_GENRE_MAP[g]])
              .filter((id): id is number => !!id);

            const filtered = strictFilter(allItems, 'watch', {
              watchType: wType !== 'Ambos' ? wType : undefined,
              watchGenreIds: selectedGenreIds.length > 0 ? selectedGenreIds : undefined,
              watchMinRating: wMinRating > 0 ? wMinRating : undefined,
              watchEpoca: wEpoca !== 'qualquer' ? wEpoca : undefined,
              excluded: disliked.filter(d => d.startsWith('watch:')).map(d => d.split(':')[1]),
            });
            const watchFinal = filtered.length > 0 ? filtered : allItems;
            setApiItems(watchFinal);
            // pool minimum handled by useEffect below
          }
        }

        // ── EAT ────────────────────────────────────────────────────────────
        else if (cat.id === 'eat') {
          const isDone = eatPrefs?.done === true;
          const localPref = isDone ? (eatPrefs!.local || []) : [];
          const querSair = localPref.includes('sair');
          const querCasa = localPref.includes('casa') || localPref.includes('takeaway') || localPref.length === 0;

          const mealItems = (querCasa || !isDone) ? await discoverMeals({
            local: localPref,
            fome: isDone ? (eatPrefs!.fome || 'normal') : 'normal',
            budget: isDone ? (eatPrefs!.budget || 'medio') : 'medio',
            restrictions: isDone ? (eatPrefs!.restrictions || []) : [],
            tempo: isDone ? (eatPrefs!.tempo || 'normal') : 'normal',
          }) : [];

          const fsqItems = (querSair && profile.location) ? await discoverFSQ({
            lat: profile.location.lat, lng: profile.location.lng,
            radius: profile.location.radius || 5,
            tipo: ['Restaurante'],
            custo: isDone ? (eatPrefs!.budget === 'economico' ? 'baixo' : 'qualquer') : 'qualquer',
          }) : [];

          const combined = querSair && !querCasa ? [...fsqItems, ...mealItems]
            : querSair && querCasa ? [...fsqItems.slice(0, Math.ceil(fsqItems.length / 2)), ...mealItems]
            : mealItems;

          const filtered = strictFilter(combined, 'eat', {
            eatRestrictions: isDone ? (eatPrefs!.restrictions || []) : [],
            excluded: disliked.filter(d => d.startsWith('eat:')).map(d => d.split(':')[1]),
          });
          const eatFinal = isDone ? filtered : apply7030(filtered);
          setApiItems(eatFinal);
          // pool minimum handled by useEffect below
        }

        // ── PLAY ───────────────────────────────────────────────────────────
        else if (cat.id === 'play') {
          const isDone = playPrefs?.done === true;
          const pType = isDone ? (playPrefs!.type || 'Ambos') : 'Ambos';

          if (pType === 'Tabuleiro') {
            setApiItems([]);
          } else {
            const filters = {
              genres: isDone ? (playPrefs!.genres || []) : [],
              platforms: profile.platforms || [],
              dificuldade: isDone ? (playPrefs!.dificuldade || 'normal') : ('normal' as const),
              type: 'Videojogo' as const,
            };
            const pages = await Promise.all([1,2,3,4,5].map(pg => discoverRAWG({...filters, page: pg})));
            const allItems = pages.flat();
            const filtered = strictFilter(allItems, 'play', {
              playDificuldade: isDone ? playPrefs!.dificuldade : undefined,
              excluded: disliked.filter(d => d.startsWith('play:')).map(d => d.split(':')[1]),
            });
            const playFinal = isDone ? filtered : apply7030(filtered);
            setApiItems(playFinal);
            // pool minimum handled by useEffect below
          }
        }

        // ── LEARN ──────────────────────────────────────────────────────────
        else if (cat.id === 'learn') {
          const isDone = learnPrefs?.done === true;
          const queries = isDone && learnPrefs!.genres?.length > 0 ? learnPrefs!.genres : ['popular'];
          const results = await Promise.all(queries.map((g: string) => discoverYouTube({
            genres: [g],
            formato: (isDone ? (learnPrefs!.formato || 'Ambos') : 'Ambos') as any,
            duracao: isDone ? (learnPrefs!.duracao || 'normal') : 'normal',
          })));
          const allItems = results.flat();
          const filtered = strictFilter(allItems, 'learn', {
            excluded: disliked.filter(d => d.startsWith('learn:')).map(d => d.split(':')[1]),
          });
          const learnFinal = isDone ? (filtered.length > 0 ? filtered : allItems) : apply7030(allItems);
          setApiItems(learnFinal);
          // pool minimum handled by useEffect below
        }

        // ── LISTEN ─────────────────────────────────────────────────────────
        else if (cat.id === 'listen') {
          const isDone = listenPrefs?.done === true;
          const items = await discoverDeezer({
            type: (isDone ? (listenPrefs!.type || 'Ambos') : 'Ambos') as any,
            genres: isDone ? (listenPrefs!.genres || []) : [],
            energia: isDone ? (listenPrefs!.energia || 'mistura') : 'mistura',
          });
          const filtered = strictFilter(items, 'listen', {
            listenType: isDone && listenPrefs!.type !== 'Ambos' ? listenPrefs!.type : undefined,
            excluded: disliked.filter(d => d.startsWith('listen:')).map(d => d.split(':')[1]),
          });
          const listenFinal = isDone ? (filtered.length > 0 ? filtered : items) : apply7030(items);
          setApiItems(listenFinal);
          // pool minimum handled by useEffect below
        }

        // ── READ ───────────────────────────────────────────────────────────
        else if (cat.id === 'read') {
          const isDone = readPrefs?.done === true;
          const items = await discoverBooksMultiPage(
            { genres: isDone ? (readPrefs!.genres || []) : [],
              type: (isDone ? (readPrefs!.type || 'Ambos') : 'Ambos') as any,
              peso: isDone ? (readPrefs!.peso || 'mistura') : 'mistura' },
            [0, 20, 40, 60, 80]
          );
          const filtered = strictFilter(items, 'read', {
            readPeso: isDone && readPrefs!.peso !== 'mistura' ? readPrefs!.peso : undefined,
            excluded: disliked.filter(d => d.startsWith('read:')).map(d => d.split(':')[1]),
          });
          const readFinal = isDone ? (filtered.length > 0 ? filtered : items) : apply7030(items);
          setApiItems(readFinal);
          // pool minimum handled by useEffect below
        }

        // ── VISIT ──────────────────────────────────────────────────────────
        else if (cat.id === 'visit' && profile.location) {
          const isDone = visitPrefs?.done === true;
          const vDistancia = isDone ? ((visitPrefs as any).distancia || 'qualquer') : 'qualquer';
          const radius = vDistancia === 'perto' ? 2 : (profile.location.radius || 5);

          const items = await discoverFSQ({
            lat: profile.location.lat, lng: profile.location.lng, radius,
            tipo: isDone ? (visitPrefs!.tipo || []) : [],
            custo: isDone ? (visitPrefs!.custo || 'qualquer') : 'qualquer',
          });
          const filtered = strictFilter(items, 'visit', {
            visitDistancia: isDone ? vDistancia : undefined,
            excluded: disliked.filter(d => d.startsWith('visit:')).map(d => d.split(':')[1]),
          });
          const visitFinal = isDone ? (filtered.length > 0 ? filtered : items) : apply7030(items);
          setApiItems(visitFinal);
          // pool minimum handled by useEffect below
        }

      } catch {
        // silently fail — usa mock
      } finally {
        setApiLoading(false);
      }
    };

    const loadWithInfluencers = async () => {
      await load();
      try {
        const infAll = await loadActiveSuggestions();
        const infForCat = infAll
          .filter(s => s.catId === cat.id && s.active && new Date(s.expiresAt) > new Date())
          .sort((a, b) => {
            const tierOrder = { gold: 0, silver: 1, base: 2 };
            return (tierOrder[a.influencerTier] ?? 3) - (tierOrder[b.influencerTier] ?? 3);
          })
          .slice(0, 5);
        if (infForCat.length > 0) {
          setApiItems(prev => {
            if (prev.length === 0) return infForCat;
            const result = [...prev];
            const positions = [2, 5, 7, 8, 14];
            let inserted = 0;
            for (const pos of positions) {
              if (inserted >= infForCat.length) break;
              if (pos <= result.length) {
                result.splice(pos, 0, infForCat[inserted++]);
              } else {
                result.push(infForCat[inserted++]);
              }
            }
            return result;
          });
        }
      } catch { /* ignore */ }
    };

    loadWithInfluencers();
  }, [isActive, cat.id, watchPrefs, eatPrefs, playPrefs, learnPrefs, listenPrefs, readPrefs, visitPrefs, profile.location, profile.platforms]); // eslint-disable-line react-hooks/exhaustive-deps

  // Garante pool mínimo de 30 items — carrega em loop até ter suficiente
  const poolCheckRef = useRef(false);
  useEffect(() => {
    if (!isActive || apiLoading) return;
    if (apiItems.length > 0 && apiItems.length < 30 && !poolCheckRef.current) {
      poolCheckRef.current = true;
      const loadUntilFull = async () => {
        let attempts = 0;
        while (apiItemsRef.current.length < 30 && attempts < 5) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
          if (!isLoadingMore) {
            await handleLoadMore();
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        poolCheckRef.current = false;
      };
      loadUntilFull();
    }
  }, [apiItems.length, isActive, apiLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // After ReactPanel/WhyPanel action → advance carousel
  useEffect(() => {
    if (afterReactTrigger === 0) return;
    setTimeout(() => {
      setCbarGenre(afterReactGenre);
      setCbarOn(true);
      doAdvance();
    }, 150);
  }, [afterReactTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch API data for current card and next card
  useEffect(() => {
    const toFetch = [cards[activeIdx], cards[activeIdx + 1]].filter(Boolean) as DataItem[];
    toFetch.forEach(item => {
      if (fetchedRef.current.has(item.title)) return;
      fetchedRef.current.add(item.title);

      setCardDataMap(prev => ({ ...prev, [item.title]: prev[item.title] ?? { tmdb: null, meal: null, cover: null } }));

      if (cat.id === 'watch') {
        const tmdbType = item.type === 'Filme' ? 'movie' : 'tv';
        fetchTMDB(item.title, tmdbType).then(data => {
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], tmdb: data } }));
        }).catch(() => {});
      }

      if (cat.id === 'eat') {
        if (item.type === 'Receita') {
          fetchMeal(item.title).then(data => {
            const fallback = getUnsplashFallback('eat', item.type);
            setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: data?.photoUrl || fallback } }));
          }).catch(() => {
            setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: getUnsplashFallback('eat', item.type) } }));
          });
        } else {
          const img = getUnsplashFallback('eat', item.type);
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: img } }));
        }
      }

      if (cat.id === 'read') {
        const readFallback = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=90';
        fetchBookCover(item.title).then(url => {
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: url || readFallback } }));
        }).catch(() => {
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: readFallback } }));
        });
      }

      if (cat.id === 'play') {
        const steamCover = item.steamId != null ? getSteamImageUrl(item.steamId) : null;
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: steamCover || SUGGEST_FALLBACKS.play } }));
      }

      if (cat.id === 'listen') {
        const img = getUnsplashFallback('listen', item.genre);
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: img } }));
      }

      if (cat.id === 'learn') {
        const img = getUnsplashFallback('learn', item.genre);
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: img } }));
      }

      if (cat.id === 'visit') {
        const img = getUnsplashFallback('visit', item.genre);
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: img } }));
      }

      if (cat.id === 'do') {
        const img = getUnsplashFallback('do', item.genre);
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: img } }));
      }
    });
  }, [activeIdx, cards]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent when active card image changes (for ReactPanel)
  useEffect(() => {
    if (!onImgResolved) return;
    const card = cards[activeIdx];
    if (!card) { onImgResolved(null); return; }
    const data = cardDataMap[card.title];
    const img = data?.tmdb?.posterUrl || data?.cover || null;
    onImgResolved(img);
  }, [activeIdx, cardDataMap, cards]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of active API item context (for WhyPanel smart filtering)
  useEffect(() => {
    if (!onApiContextResolved) return;
    const apiItem = apiItemsRef.current[activeIdx] ?? null;
    if (!apiItem) { onApiContextResolved(undefined); return; }
    const display = getDisplayData(apiItem, cat.id);
    if (display) {
      onApiContextResolved({ type: display.type ?? undefined, genre: display.genre ?? undefined, rating: display.rating ?? undefined });
    } else {
      onApiContextResolved(undefined);
    }
  }, [activeIdx, apiItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of the currently displayed item (for AddToList)
  useEffect(() => {
    if (!onDisplayItemResolved) return;
    const apiItem = apiItemsRef.current[activeIdx] ?? null;
    const displayData = apiItem ? getDisplayData(apiItem, cat.id) : null;
    if (displayData) {
      onDisplayItemResolved({
        title: displayData.title,
        emoji: displayData.emoji,
        catId: cat.id,
        cat: cat.name,
        type: displayData.type,
      });
    } else if (cards[activeIdx]) {
      const card = cards[activeIdx];
      onDisplayItemResolved({
        title: card.title,
        emoji: card.emoji,
        catId: cat.id,
        cat: cat.name,
        type: card.type,
      });
    } else {
      onDisplayItemResolved(null);
    }
  }, [activeIdx, apiItems, cards]); // eslint-disable-line react-hooks/exhaustive-deps



  const handleLoadMore = async (): Promise<void> => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      if (cat.id === 'watch') {
        const wType = (watchPrefs as any)?.type || 'Ambos';
        const typeMap: Record<string, DiscoverFilters['type']> = {
          'Filme': 'movie', 'Série': 'tv', 'Documentário': 'both', 'Anime': 'tv',
        };
        let apiGenres = [...((watchPrefs as any)?.genres || [])];
        if (wType === 'Documentário' && !apiGenres.includes('Documentário')) apiGenres = ['Documentário', ...apiGenres];
        if (wType === 'Anime' && !apiGenres.includes('Anime')) apiGenres = ['Anime', ...apiGenres];

        const baseFilters: DiscoverFilters = {
          type: typeMap[wType] || 'both',
          genres: apiGenres,
          duration: ((watchPrefs as any)?.duration || 'normal') as DiscoverFilters['duration'],
          discovery: ((watchPrefs as any)?.discovery || 'mistura') as DiscoverFilters['discovery'],
          platforms: profile.platforms || [],
          origem: (watchPrefs as any)?.origem || 'Qualquer',
          lingua: (watchPrefs as any)?.lingua || 'Qualquer',
          epoca: (watchPrefs as any)?.epoca || 'qualquer',
          minRating: parseFloat((watchPrefs as any)?.minRating) || 0,
        };

        const selectedGenreIds = apiGenres
          .flatMap(g => [TMDB_GENRE_MAP[g], TMDB_TV_GENRE_MAP[g]])
          .filter((id): id is number => !!id);

        const [m1, m2, m3] = await Promise.all([
          discoverTMDB({ ...baseFilters, page: nextPage }),
          discoverTMDB({ ...baseFilters, page: nextPage + 1 }),
          discoverTMDB({ ...baseFilters, page: nextPage + 2 }),
        ]);
        const moreRaw = [...m1, ...m2, ...m3];
        const moreFiltered = strictFilter(moreRaw, 'watch', {
          watchType: wType !== 'Ambos' ? wType : undefined,
          watchGenreIds: selectedGenreIds.length > 0 ? selectedGenreIds : undefined,
          watchMinRating: parseFloat((watchPrefs as any)?.minRating) || undefined,
          watchEpoca: (watchPrefs as any)?.epoca !== 'qualquer' ? (watchPrefs as any)?.epoca : undefined,
          excluded: disliked.filter(d => d.startsWith('watch:')).map(d => d.split(':')[1]),
        });
        setApiItems(prev => {
          const seen = new Set(prev.map((i: any) => i.title));
          return [...prev, ...moreFiltered.filter((i: any) => !seen.has(i.title))];
        });
        setCurrentPage(nextPage + 2);

      } else if (cat.id === 'play') {
        const playFilters = {
          genres: (playPrefs as any)?.genres || [],
          platforms: profile.platforms || [],
          dificuldade: (playPrefs as any)?.dificuldade || ('normal' as const),
          type: 'Videojogo' as const,
        };
        const [r1, r2, r3] = await Promise.all([
          discoverRAWG({ ...playFilters, page: nextPage }),
          discoverRAWG({ ...playFilters, page: nextPage + 1 }),
          discoverRAWG({ ...playFilters, page: nextPage + 2 }),
        ]);
        const moreRaw = [...r1, ...r2, ...r3];
        const moreFiltered = strictFilter(moreRaw, 'play', {
          playDificuldade: (playPrefs as any)?.dificuldade,
          excluded: disliked.filter(d => d.startsWith('play:')).map(d => d.split(':')[1]),
        });
        setApiItems(prev => {
          const seen = new Set(prev.map((i: any) => i.title));
          return [...prev, ...moreFiltered.filter((i: any) => !seen.has(i.title))];
        });
        setCurrentPage(nextPage + 2);

      } else if (cat.id === 'listen' && listenPrefs) {
        const allGenres = (listenPrefs as any).genres || [];
        const rotatedGenre = allGenres.length > 0
          ? allGenres[nextPage % allGenres.length]
          : undefined;
        const moreRaw = await discoverDeezer({
          type: (listenPrefs as any).type || 'Ambos',
          genres: rotatedGenre ? [rotatedGenre] : [],
          energia: (listenPrefs as any).energia || 'mistura',
        });
        const moreFiltered = strictFilter(moreRaw, 'listen', {
          listenType: (listenPrefs as any).type !== 'Ambos' ? (listenPrefs as any).type : undefined,
          excluded: disliked.filter(d => d.startsWith('listen:')).map(d => d.split(':')[1]),
        });
        setApiItems(prev => {
          const seen = new Set(prev.map((i: any) => i.title));
          const newItems = moreFiltered.filter((i: any) => !seen.has(i.title));
          return newItems.length > 0 ? [...prev, ...newItems] : [...prev].sort(() => Math.random() - 0.5);
        });
        setCurrentPage(nextPage);

      } else if (cat.id === 'read' && readPrefs) {
        const startIndex = nextPage * 20;
        const moreRaw = await discoverBooksMultiPage(
          {
            genres: (readPrefs as any).genres || [],
            type: (readPrefs as any).type || 'Ambos',
            peso: (readPrefs as any).peso || 'mistura',
          },
          [startIndex]
        );
        const moreFiltered = strictFilter(moreRaw, 'read', {
          readPeso: (readPrefs as any).peso !== 'mistura' ? (readPrefs as any).peso : undefined,
          excluded: disliked.filter(d => d.startsWith('read:')).map(d => d.split(':')[1]),
        });
        setApiItems(prev => {
          const seen = new Set(prev.map((i: any) => i.title));
          return [...prev, ...moreFiltered.filter((i: any) => !seen.has(i.title))];
        });
        setCurrentPage(nextPage);

      } else if (cat.id === 'learn' && learnPrefs) {
        const allGenres = (learnPrefs as any).genres || ['popular'];
        const rotatedGenre = allGenres[nextPage % allGenres.length];
        const moreRaw = await discoverYouTube({
          genres: [rotatedGenre],
          formato: (learnPrefs as any).formato || 'Ambos',
          duracao: (learnPrefs as any).duracao || 'normal',
        });
        setApiItems(prev => {
          const seen = new Set(prev.map((i: any) => i.title));
          const newItems = moreRaw.filter((i: any) => !seen.has(i.title));
          return newItems.length > 0 ? [...prev, ...newItems] : [...prev].sort(() => Math.random() - 0.5);
        });
        setCurrentPage(nextPage);

      } else if (cat.id === 'eat' && eatPrefs) {
        const moreRaw = await discoverMeals({
          local: (eatPrefs as any).local || [],
          fome: (eatPrefs as any).fome || 'normal',
          budget: (eatPrefs as any).budget || 'medio',
          restrictions: (eatPrefs as any).restrictions || [],
          tempo: (eatPrefs as any).tempo || 'normal',
        });
        setApiItems(prev => {
          const seen = new Set(prev.map((i: any) => i.title));
          const newItems = moreRaw.filter((i: any) => !seen.has(i.title));
          return newItems.length > 0 ? [...prev, ...newItems] : [...prev].sort(() => Math.random() - 0.5);
        });
        setCurrentPage(nextPage);
      }

    } catch {
      // silently fail
    } finally {
      setIsLoadingMore(false);
    }
  };

  const panDirRef = useRef(0); // 0 = left, 1 = right, alternates
  const mouseDragStartX = useRef<number | null>(null);
  const mouseDragging = useRef(false);


  return (
    <div className={`screen${isActive ? ' active' : ''}`} id="suggest">
      <div className="tb">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="tbi" onClick={onBack}>←</button>
          {onReopenOnboard && (
            <button className="tbi" style={{ fontSize: 11, padding: '4px 8px', opacity: 0.75 }} onClick={onReopenOnboard}>Filtros</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 15 }}>{cat.icon}</span>
          <span className="tb-lbl">What to {cat.name}</span>
        </div>
        <button className="tbi" onClick={onOpenWishlist}>♡</button>
      </div>

      <div className="moods">
        {cat.moods.map(m => (
          <button key={m} className={`mood${m === curMood ? ' on' : ''}`}
            onClick={() => { setCurMood(m); setCbarOn(false); loadBatch(undefined, m); }}>
            {m}
          </button>
        ))}
      </div>

      <div className="carousel-viewport">
        {apiLoading && (
          <div className="discover-loading">
            <div className="discover-spinner" />
            <div className="discover-loading-lbl">A descobrir…</div>
          </div>
        )}
        {!apiLoading && (() => {
          const isApiMode = apiItemsRef.current.length > 0;
          const apiItem = isApiMode ? apiItemsRef.current[activeIdx] ?? null : null;
          if (!apiItem && !cards[activeIdx]) return null;
          return (() => {
          const isApiMode = apiItemsRef.current.length > 0;
          const card = isApiMode
            ? (cards[0] ?? { title: '', emoji: '✦', type: '', genre: '', desc: '', platforms: [] } as any)
            : cards[activeIdx];
          const data = cardDataMap[card?.title ?? ''] ?? { tmdb: null, meal: null, cover: null };

          const displayData = apiItem ? getDisplayData(apiItem, cat.id) : null;

          const displayTitle = displayData?.title ?? card.title;
          const displayDesc = displayData?.desc ?? (data?.tmdb?.overview ? data.tmdb.overview.substring(0, 140) + (data.tmdb.overview.length > 140 ? '…' : '') : card.desc);
          const displayImg = displayData?.img ?? data?.tmdb?.backdropUrl ?? data?.tmdb?.posterUrl ?? data?.cover ?? '';
          const displayRating = displayData?.rating ?? data?.tmdb?.rating ?? card.rating ?? null;
          const displayYear = displayData?.year ?? data?.tmdb?.year ?? card.year ?? null;
          const displayType = displayData?.type ?? card.type;
          const displayGenre = displayData?.genre ?? card.genre;
          const displayUrl = displayData?.url ?? null;
          const displayEmoji = displayData?.emoji ?? card.emoji;
          const hasImg = !!displayImg;

          const cardTrackInfo = tracking[cat.id + ':' + card.title];
          const cardTrackState = cardTrackInfo ? TSTATE.find(x => x.id === cardTrackInfo.state) : null;

          return (
            <div
              className="cin-card"
              style={{ cursor: 'default', userSelect: 'none' }}
              onMouseDown={e => { mouseDragStartX.current = e.clientX; mouseDragging.current = false; }}
              onMouseUp={e => {
                if (mouseDragStartX.current === null) return;
                const dx = e.clientX - mouseDragStartX.current;
                mouseDragStartX.current = null;
                if (Math.abs(dx) > 60) doAdvance();
                mouseDragging.current = false;
              }}
            >
              {/* Poster background */}
              <div className="cin-poster" style={hasImg ? undefined : { background: `linear-gradient(${GRAD[cat.id] || '135deg,#111,#222'})` }}>
                {hasImg && (
                  <img
                    key={`${displayImg}-${activeIdx}`}
                    className={`cin-poster-img ${panDirRef.current === 0 ? 'pan-left' : 'pan-right'}`}
                    src={displayImg}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover',
                             objectPosition: 'center center', position: 'absolute', inset: 0,
                             display: 'block' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                {!hasImg && <span className="cin-em">{displayEmoji}</span>}
                <div className="cin-overlay-netflix" />
                {/* Category badge top-left */}
                <div className="cin-badge">{getCatIcon(cat.id)} {cat.name}</div>
                {/* Source badge top-right — always visible */}
                <div className={
                  displayData?.influencer?.tier === 'gold' ? 'inf-badge inf-badge-gold' :
                  displayData?.influencer?.tier === 'silver' ? 'inf-badge inf-badge-silver' :
                  'inf-badge inf-badge-app'
                }>
                  {displayData?.influencer?.tier === 'gold' ? `✦ Gold · @${displayData.influencer.handle}` :
                   displayData?.influencer?.tier === 'silver' ? `◈ Silver · @${displayData.influencer.handle}` :
                   <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>What to</span>}
                </div>
                {/* Logo What to */}
                {!displayData?.influencer && (
                  <div className="cin-whatto-badge">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    what<em>to</em>
                  </div>
                )}
              </div>

              {/* Content overlay */}
              <div className="cin-body cin-body-netflix">
                <div className="cin-title">{displayTitle}</div>

                {/* Tags row — todos os géneros + ano + duração + rating */}
                <div className="cin-tags">
                  {/* Tipo */}
                  {displayType && (
                    <span className="cin-tag cin-tag-type">{displayType}</span>
                  )}
                  {/* Todos os géneros */}
                  {(displayData?.genres || (displayGenre ? [displayGenre] : [])).map((g, i) => (
                    <span key={i} className="cin-tag">{g}</span>
                  ))}
                  {/* Ano */}
                  {displayYear && <span className="cin-tag">{displayYear}</span>}
                  {/* Duração */}
                  {data?.tmdb?.runtime && <span className="cin-tag">{data.tmdb.runtime}</span>}
                  {/* Rating */}
                  {displayRating && (
                    <span className="cin-tag cin-tag-rating">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#C89B3C" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      {displayRating}
                    </span>
                  )}
                </div>

                <div className="cin-desc">{displayDesc}</div>

                {data?.tmdb?.cast && data.tmdb.cast.length > 0 && (
                  <div className="cin-cast">{data.tmdb.cast.slice(0, 3).join(' · ')}</div>
                )}

                {data?.meal?.ingredients && data.meal.ingredients.length > 0 && (
                  <div className="cin-ings">
                    {data.meal.ingredients.slice(0, 5).map((ing, j) => (
                      <span key={j} className="meal-ing-item">{ing}</span>
                    ))}
                  </div>
                )}

                {/* Platform links */}
                <div className="cin-actions">
                  {!displayData && card.platforms && card.platforms.length > 0 && card.platforms.map((p, j) => (
                    <button key={j} className="pb"
                      onClick={e => { e.stopPropagation(); window.open(p.url, '_blank', 'noopener,noreferrer'); }}
                    >
                      <span className="dot" style={{ background: p.c }} />
                      {p.n}
                    </button>
                  ))}
                  {displayUrl && (
                    <button className="pb"
                      onClick={e => { e.stopPropagation(); window.open(displayUrl, '_blank', 'noopener,noreferrer'); }}
                    >
                      <span className="dot" style={{ background: '#C89B3C' }} />
                      {cat.id === 'visit' ? 'Ver no Maps' : cat.id === 'learn' ? 'Ver no YouTube' : cat.id === 'listen' ? 'Abrir no Deezer' : cat.id === 'read' ? 'Pré-visualizar' : 'Abrir'}
                    </button>
                  )}
                  {data?.tmdb?.trailerKey && (
                    <button className="trailer-btn"
                      onClick={e => { e.stopPropagation(); window.open(`https://www.youtube.com/watch?v=${data.tmdb!.trailerKey}`, '_blank', 'noopener,noreferrer'); }}
                    >
                      ▶ Trailer
                    </button>
                  )}
                </div>

                {cardTrackInfo && cardTrackState && (
                  <div className="track-badge" style={{ marginTop: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: TCOLOR[cardTrackInfo.state] || '#5ec97a', display: 'inline-block', marginRight: 4 }} />
                    {cardTrackState.l}{cardTrackInfo.s ? ` · T${cardTrackInfo.s} Ep${cardTrackInfo.e}` : ''}
                  </div>
                )}

                {/* 4 Actions: top row (Não + bookmark + Sim) + bottom row (Não porque) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <button
                      className="suggest-btn-skip"
                      style={{ flex: 1 }}
                      onClick={e => { e.stopPropagation(); doAdvance(); }}
                    >
                      <span>←</span> Não
                    </button>
                    <button
                      className="suggest-btn-bookmark"
                      onClick={e => { e.stopPropagation(); onOpenAddToList?.(); }}
                      title="Guardar em lista"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                    </button>
                    <button
                      className="suggest-btn-yes-v2"
                      style={{ flex: 1, flexDirection: 'row', gap: 6 }}
                      onClick={e => { e.stopPropagation(); setQuickYesOpen(true); }}
                    >
                      Sim →
                    </button>
                  </div>
                  <button
                    className="suggest-btn-why"
                    style={{ width: '100%' }}
                    onClick={e => { e.stopPropagation(); onOpenWhy(); }}
                  >
                    Não porque<span style={{ opacity: 0.5 }}>...</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })()
      })()}

      </div>

      <div className={`cbar${cbarOn ? ' on' : ''}`}>
        <div className="cbar-lbl">continuar ou mudar?</div>
        <div className="cbar-pills">
          {cbarGenre && (
            <button className="cpill same" onClick={() => { setCbarOn(false); loadBatch(cbarGenre); }}>
              ➜ Mais {cbarGenre}
            </button>
          )}
          {(GENRES[cat.id] || []).filter(g => g !== cbarGenre).slice(0, 4).map(g => (
            <button key={g} className="cpill" onClick={() => { setCbarOn(false); loadBatch(g); }}>
              {g}
            </button>
          ))}
          <button className="cpill" onClick={() => { setCbarOn(false); loadBatch(); }}>
            ✦ Surpresa
          </button>
        </div>
      </div>

      {/* PROBLEMA 4 — Quick Yes panel */}
      {quickYesOpen && (() => {
        const activeApiItem = apiItemsRef.current[activeIdx] ?? null;
        const qyDisplayData = activeApiItem ? getDisplayData(activeApiItem, cat.id) : null;
        const qyTitle = qyDisplayData?.title || cards[activeIdx]?.title || '';
        const qyEmoji = qyDisplayData?.emoji || cards[activeIdx]?.emoji || '✦';
        const actionUrl = qyDisplayData?.url || cards[activeIdx]?.platforms?.[0]?.url || null;

        const openLabel = cat.id === 'watch' ? '▶ Ver na plataforma'
          : cat.id === 'listen' ? '🎵 Ouvir'
          : cat.id === 'read' ? '📖 Ler agora'
          : cat.id === 'play' ? '🎮 Jogar'
          : cat.id === 'learn' ? '▶ Ver vídeo'
          : cat.id === 'visit' ? '🗺 Ver no mapa'
          : cat.id === 'eat' ? '🍽️ Ver receita'
          : '▶ Abrir';

        const now = new Date();
        const start = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(qyTitle)}&dates=${start}/${end}`;

        return (
          <div className="quick-yes-overlay" onClick={() => setQuickYesOpen(false)}>
            <div className="quick-yes-sheet" style={{ paddingBottom: 100 }} onClick={e => e.stopPropagation()}>
              <div className="qy-drag-bar" />
              <div className="qy-title">
                <span className="qy-emoji">{qyEmoji}</span>
                <span>{qyTitle}</span>
              </div>

              <button className="qy-btn qy-now" onClick={() => { acceptedRef.current = true; trackAsync({ userId, eventType: 'suggest_accept', catId: cat.id, value: { cards_skipped: skipCountRef.current, action: 'agora' } }); skipCountRef.current = 0; onOpenReact(); setQuickYesOpen(false); }}>
                <span>▶</span>
                <div>
                  <div className="qy-btn-title">Sim, agora!</div>
                  <div className="qy-btn-sub">Abre e acompanha em tempo real</div>
                </div>
              </button>

              {actionUrl && (
                <button className="qy-btn qy-open" onClick={() => { window.open(actionUrl, '_blank'); setQuickYesOpen(false); setTimeout(() => doAdvance(), 300); }}>
                  <span>{cat.id === 'watch' ? '📺' : cat.id === 'listen' ? '🎵' : cat.id === 'visit' ? '🗺' : '🔗'}</span>
                  <div>
                    <div className="qy-btn-title">{openLabel}</div>
                    <div className="qy-btn-sub">Abre directamente</div>
                  </div>
                </button>
              )}

              <button className="qy-btn qy-later" onClick={() => { acceptedRef.current = true; trackAsync({ userId, eventType: 'suggest_accept', catId: cat.id, value: { cards_skipped: skipCountRef.current, action: 'mais_tarde' } }); skipCountRef.current = 0; if (_onSwipeYes) _onSwipeYes(); setQuickYesOpen(false); setTimeout(() => doAdvance(), 300); }}>
                <span>✅</span>
                <div>
                  <div className="qy-btn-title">Sim, mais tarde</div>
                  <div className="qy-btn-sub">Fica marcado para hoje</div>
                </div>
              </button>

              <button className="qy-btn qy-schedule" onClick={() => { window.open(calendarUrl, '_blank'); setQuickYesOpen(false); setTimeout(() => doAdvance(), 300); }}>
                <span>🗓</span>
                <div>
                  <div className="qy-btn-title">Escolher hora</div>
                  <div className="qy-btn-sub">Abre o Google Calendar</div>
                </div>
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
