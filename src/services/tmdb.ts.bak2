const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG_POSTER = 'https://image.tmdb.org/t/p/w780';
const TMDB_IMG_BACKDROP = 'https://image.tmdb.org/t/p/original';
const CACHE_PREFIX = 'wt_tmdb_';

export interface TMDBResult {
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string | null;
  rating: number | null;
  year: string | null;
  runtime: string | null;
  cast: string[];
  trailerKey: string | null;
}

function cacheGet(key: string): TMDBResult | null {
  try {
    const v = localStorage.getItem(CACHE_PREFIX + key);
    return v ? JSON.parse(v) as TMDBResult : null;
  } catch { return null; }
}

function cacheSet(key: string, v: TMDBResult) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(v)); } catch {}
}

export async function fetchTMDB(title: string, type: 'movie' | 'tv'): Promise<TMDBResult | null> {
  const apiKey = import.meta.env.VITE_TMDB_KEY;
  if (!apiKey) return null;

  const cacheKey = `${type}_${title.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';
    const searchRes = await fetch(
      `${TMDB_BASE}/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=pt-PT`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json() as {
      results?: Array<{
        id: number;
        poster_path?: string;
        backdrop_path?: string;
        overview?: string;
        vote_average?: number;
        release_date?: string;
        first_air_date?: string;
      }>;
    };
    const result = searchData.results?.[0];
    if (!result) return null;

    const id = result.id;
    const detailEndpoint = type === 'movie' ? `movie/${id}` : `tv/${id}`;

    // Fetch details + credits + videos in parallel
    const [detailRes, creditsRes, videosRes] = await Promise.all([
      fetch(`${TMDB_BASE}/${detailEndpoint}?api_key=${apiKey}&language=pt-PT`),
      fetch(`${TMDB_BASE}/${detailEndpoint}/credits?api_key=${apiKey}`),
      fetch(`${TMDB_BASE}/${detailEndpoint}/videos?api_key=${apiKey}`),
    ]);

    const detail = detailRes.ok ? await detailRes.json() as {
      overview?: string;
      runtime?: number;
      episode_run_time?: number[];
    } : null;
    const credits = creditsRes.ok ? await creditsRes.json() as {
      cast?: Array<{ name: string }>;
    } : null;
    const videos = videosRes.ok ? await videosRes.json() as {
      results?: Array<{ site: string; type: string; key: string }>;
    } : null;

    const runtime = detail
      ? type === 'movie'
        ? detail.runtime ? `${detail.runtime} min` : null
        : detail.episode_run_time?.[0] ? `${detail.episode_run_time[0]} min/ep` : null
      : null;

    const cast = (credits?.cast || [])
      .slice(0, 3)
      .map((c: { name: string }) => c.name);

    const trailer = (videos?.results || []).find(
      (v: { site: string; type: string; key: string }) => v.site === 'YouTube' && v.type === 'Trailer'
    );

    const tmdbResult: TMDBResult = {
      posterUrl: result.poster_path ? `${TMDB_IMG_POSTER}${result.poster_path}` : null,
      backdropUrl: result.backdrop_path ? `${TMDB_IMG_BACKDROP}${result.backdrop_path}` : null,
      overview: (detail?.overview || result.overview) || null,
      rating: result.vote_average ? Math.round(result.vote_average * 10) / 10 : null,
      year: (result.release_date || result.first_air_date || '').substring(0, 4) || null,
      runtime,
      cast,
      trailerKey: trailer?.key || null,
    };

    cacheSet(cacheKey, tmdbResult);
    return tmdbResult;
  } catch {
    return null;
  }
}

// ── TMDB Discover ──────────────────────────────────────────────────────────

export const TMDB_GENRE_MAP: Record<string, number> = {
  'Ação': 28,
  'Aventura': 12,
  'Animação': 16,
  'Comédia': 35,
  'Crime': 80,
  'Documentário': 99,
  'Drama': 18,
  'Fantasia': 14,
  'Terror': 27,
  'Mistério': 9648,
  'Romance': 10749,
  'Sci-Fi': 878,
  'Suspense': 53,
  'Thriller': 53,
  'Anime': 16,
};

export const TMDB_TV_GENRE_MAP: Record<string, number> = {
  'Ação': 10759,
  'Animação': 16,
  'Comédia': 35,
  'Crime': 80,
  'Documentário': 99,
  'Drama': 18,
  'Fantasia': 10765,
  'Mistério': 9648,
  'Romance': 10749,
  'Sci-Fi': 10765,
  'Suspense': 9648,
  'Anime': 16,
};

export const TMDB_PROVIDER_MAP: Record<string, number> = {
  'netflix': 8,
  'disney': 337,
  'hbo': 384,
  'apple': 2,
  'prime': 119,
  'crunchyroll': 283,
  'meo': 0,
  'nos': 0,
  'vodafone': 0,
};

export interface DiscoverFilters {
  type: 'movie' | 'tv' | 'both';
  genres: string[];
  duration: 'curto' | 'normal' | 'longo';
  discovery: 'populares' | 'mistura' | 'surpresa';
  platforms: string[];
  page?: number;
}

export interface DiscoverItem {
  id: number;
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string | null;
  rating: number | null;
  year: string | null;
  type: 'Filme' | 'Série';
  genre: string;
  platforms: Array<{ n: string; url: string; c: string }>;
}

const DISCOVER_CACHE_PREFIX = 'wt_disc_';

export async function discoverTMDB(filters: DiscoverFilters): Promise<DiscoverItem[]> {
  const apiKey = import.meta.env.VITE_TMDB_KEY as string;
  if (!apiKey) return [];

  const cacheKey = DISCOVER_CACHE_PREFIX + JSON.stringify(filters);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as { ts: number; data: DiscoverItem[] };
      if (Date.now() - parsed.ts < 2 * 60 * 60 * 1000) return parsed.data;
    }
  } catch {}

  const results: DiscoverItem[] = [];
  const types: Array<'movie' | 'tv'> = filters.type === 'both'
    ? ['movie', 'tv']
    : [filters.type === 'movie' ? 'movie' : 'tv'];

  for (const mediaType of types) {
    try {
      const params = new URLSearchParams();
      params.set('api_key', apiKey);
      params.set('language', 'pt-PT');
      params.set('region', 'PT');
      params.set('include_adult', 'false');
      params.set('page', String(filters.page || 1));

      if (filters.discovery === 'populares') {
        params.set('sort_by', 'popularity.desc');
        params.set('vote_count.gte', '100');
      } else if (filters.discovery === 'surpresa') {
        params.set('sort_by', 'vote_average.desc');
        params.set('vote_count.gte', '50');
        params.set('page', String(Math.floor(Math.random() * 5) + 1));
      } else {
        params.set('sort_by', 'popularity.desc');
        params.set('vote_average.gte', '6.5');
      }

      const genreMap = mediaType === 'movie' ? TMDB_GENRE_MAP : TMDB_TV_GENRE_MAP;
      const genreIds = filters.genres
        .map(g => genreMap[g])
        .filter(Boolean);
      if (genreIds.length > 0) {
        params.set('with_genres', genreIds.join(','));
      }

      if (mediaType === 'movie') {
        if (filters.duration === 'curto') params.set('with_runtime.lte', '90');
        else if (filters.duration === 'normal') {
          params.set('with_runtime.gte', '80');
          params.set('with_runtime.lte', '150');
        } else if (filters.duration === 'longo') {
          params.set('with_runtime.gte', '150');
        }
      }

      const providerIds = filters.platforms
        .map(p => TMDB_PROVIDER_MAP[p])
        .filter((id): id is number => !!id && id > 0);
      if (providerIds.length > 0) {
        params.set('with_watch_providers', providerIds.join('|'));
        params.set('watch_region', 'PT');
      }

      const endpoint = mediaType === 'movie' ? 'discover/movie' : 'discover/tv';
      const res = await fetch(`${TMDB_BASE}/${endpoint}?${params.toString()}`);
      if (!res.ok) continue;

      const data = await res.json() as {
        results?: Array<{
          id: number;
          title?: string;
          name?: string;
          poster_path?: string;
          backdrop_path?: string;
          overview?: string;
          vote_average?: number;
          release_date?: string;
          first_air_date?: string;
          genre_ids?: number[];
        }>;
      };

      const items = (data.results || []).slice(0, 10).map(r => {
        const reverseMap = mediaType === 'movie' ? TMDB_GENRE_MAP : TMDB_TV_GENRE_MAP;
        const firstGenreId = r.genre_ids?.[0];
        const genreName = firstGenreId
          ? Object.entries(reverseMap).find(([, id]) => id === firstGenreId)?.[0] || 'Drama'
          : 'Drama';

        return {
          id: r.id,
          title: r.title || r.name || 'Sem título',
          posterUrl: r.poster_path ? `${TMDB_IMG_POSTER}${r.poster_path}` : null,
          backdropUrl: r.backdrop_path ? `${TMDB_IMG_BACKDROP}${r.backdrop_path}` : null,
          overview: r.overview || null,
          rating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
          year: (r.release_date || r.first_air_date || '').substring(0, 4) || null,
          type: mediaType === 'movie' ? 'Filme' as const : 'Série' as const,
          genre: genreName,
          platforms: [] as Array<{ n: string; url: string; c: string }>,
        };
      });

      results.push(...items);
    } catch {
      continue;
    }
  }

  const shuffled = results.sort(() => Math.random() - 0.5);

  try {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: shuffled }));
  } catch {}

  return shuffled;
}
