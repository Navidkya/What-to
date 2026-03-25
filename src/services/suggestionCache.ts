import { supabase } from '../lib/supabase';
export interface CachedSuggestion {
  id: string;
  catId: string;
  title: string;
  description: string | null;
  img: string | null;
  rating: number | null;
  year: string | null;
  type: string;
  genre: string;
  genres: string[];
  genreIds: number[];
  originalLanguage: string | null;
  voteCount: number | null;
  runtime: number | null;
  castList: string[];
  trailerKey: string | null;
  isAnime: boolean;
  isDocumentary: boolean;
  playTags: string[];
  playtime: number | null;
  gameModes: string[];
  platformsList: string[];
  trackDurationMs: number | null;
  artist: string | null;
  pageCount: number | null;
  bookLanguage: string | null;
  subjects: string[];
  url: string | null;
  emoji: string;
  sourceApi: string;
  externalId: string | null;
  tier: 'mainstream' | 'underground';
}
export interface CacheFilters {
  watchType?: string;
  watchGenreIds?: number[];
  watchMinRating?: number;
  watchMaxYear?: number;
  watchMinYear?: number;
  watchLanguage?: string;
  playTags?: string[];
  playGameModes?: string[];
  playMaxPlaytime?: number;
  playMinPlaytime?: number;
  playPlatforms?: string[];
  listenType?: string;
  listenGenre?: string;
  listenMaxDurationMs?: number;
  listenMinDurationMs?: number;
  readType?: string;
  readMinPages?: number;
  readMaxPages?: number;
  readLanguage?: string;
  readSubjects?: string[];
  minRating?: number;
  minYear?: number;
  maxYear?: number;
  excludeTitles?: string[];
}
function mapRow(r: any): CachedSuggestion {
  return {
    id: r.id,
    catId: r.cat_id,
    title: r.title,
    description: r.description,
    img: r.img,
    rating: r.rating,
    year: r.year,
    type: r.type,
    genre: r.genre,
    genres: r.genres || [],
    genreIds: r.genre_ids || [],
    originalLanguage: r.original_language || null,
    voteCount: r.vote_count || null,
    runtime: r.runtime || null,
    castList: r.cast_list || [],
    trailerKey: r.trailer_key || null,
    isAnime: r.is_anime || false,
    isDocumentary: r.is_documentary || false,
    playTags: r.play_tags || [],
    playtime: r.playtime || null,
    gameModes: r.game_modes || [],
    platformsList: r.platforms_list || [],
    trackDurationMs: r.track_duration_ms || null,
    artist: r.artist || null,
    pageCount: r.page_count || null,
    bookLanguage: r.book_language || null,
    subjects: r.subjects || [],
    url: r.url,
    emoji: r.emoji || '✦',
    sourceApi: r.source_api,
    externalId: r.external_id || null,
    tier: r.tier,
  };
}
export async function loadCachedSuggestions(
  catId: string,
  limit: number = 100,
  filters?: CacheFilters
): Promise<CachedSuggestion[]> {
  try {
    let query = supabase
      .from('suggestions_cache')
      .select('*')
      .eq('cat_id', catId)
      .in('tier', ['mainstream', 'underground']);
    if (catId === 'watch' && filters) {
      if (filters.watchType === 'Filme') {
        query = query.eq('type', 'Filme');
      } else if (filters.watchType === 'Serie') {
        query = query.eq('type', 'Serie').eq('is_anime', false).eq('is_documentary', false);
      } else if (filters.watchType === 'Documentário') {
        query = query.eq('is_documentary', true);
      } else if (filters.watchType === 'Anime') {
        query = query.eq('is_anime', true);
      }
      if (filters.watchGenreIds?.length) {
        query = query.overlaps('genre_ids', filters.watchGenreIds);
      }
      if (filters.watchMinRating) {
        query = query.gte('rating', filters.watchMinRating);
      }
      if (filters.watchMinYear) {
        query = query.gte('year', String(filters.watchMinYear));
      }
      if (filters.watchMaxYear) {
        query = query.lte('year', String(filters.watchMaxYear));
      }
      if (filters.watchLanguage) {
        query = query.eq('original_language', filters.watchLanguage);
      }
    }
    if (catId === 'play' && filters) {
      if (filters.playTags?.length) {
        query = query.overlaps('play_tags', filters.playTags);
      }
      if (filters.playGameModes?.length) {
        query = query.overlaps('game_modes', filters.playGameModes);
      }
      if (filters.playMinPlaytime != null) {
        query = query.gte('playtime', filters.playMinPlaytime);
      }
      if (filters.playMaxPlaytime != null) {
        query = query.lte('playtime', filters.playMaxPlaytime);
      }
      if (filters.playPlatforms?.length) {
        query = query.overlaps('platforms_list', filters.playPlatforms);
      }
    }
    if (catId === 'listen' && filters) {
      if (filters.listenType && filters.listenType !== 'Ambos') {
        if (filters.listenType === 'Álbum') query = query.eq('type', 'Album');
        else if (filters.listenType === 'Single/EP') query = query.eq('type', 'Track');
        else if (filters.listenType === 'Podcast') query = query.eq('type', 'Podcast');
      }
      if (filters.listenGenre) {
        query = query.ilike('genre', `%${filters.listenGenre}%`);
      }
      if (filters.listenMinDurationMs) {
        query = query.gte('track_duration_ms', filters.listenMinDurationMs);
      }
      if (filters.listenMaxDurationMs) {
        query = query.lte('track_duration_ms', filters.listenMaxDurationMs);
      }
    }
    if (catId === 'read' && filters) {
      if (filters.readType === 'BD/Manga') {
        query = query.overlaps('subjects', ['manga', 'comics', 'graphic novels', 'comic books']);
      } else if (filters.readType === 'Livro') {
        query = query.eq('type', 'Livro');
      }
      if (filters.readMinPages) {
        query = query.gte('page_count', filters.readMinPages);
      }
      if (filters.readMaxPages) {
        query = query.lte('page_count', filters.readMaxPages);
      }
      if (filters.readLanguage) {
        query = query.eq('book_language', filters.readLanguage);
      }
      if (filters.readSubjects?.length) {
        query = query.overlaps('subjects', filters.readSubjects);
      }
    }
    if (filters?.minRating) {
      query = query.gte('rating', filters.minRating);
    }
    query = query
      .order('last_seen_at', { ascending: false })
      .limit(limit * 3);
    const { data, error } = await query;
    if (error || !data) return [];
    const shuffled = data
      .map((r: any) => mapRow(r))
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
    if (filters?.excludeTitles?.length) {
      const ex = new Set(filters.excludeTitles.map((t: string) => t.toLowerCase()));
      return shuffled.filter((i: CachedSuggestion) => !ex.has(i.title.toLowerCase()));
    }
    return shuffled;
  } catch { return []; }
}
export async function getCacheCount(catId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('suggestions_cache')
      .select('*', { count: 'exact', head: true })
      .eq('cat_id', catId);
    return count || 0;
  } catch { return 0; }
}
export async function getLastCacheUpdate(catId: string): Promise<Date | null> {
  try {
    const { data } = await supabase
      .from('suggestions_cache')
      .select('cached_at')
      .eq('cat_id', catId)
      .order('cached_at', { ascending: false })
      .limit(1)
      .single();
    return data ? new Date(data.cached_at) : null;
  } catch { return null; }
}
