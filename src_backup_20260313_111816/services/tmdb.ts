const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const CACHE_PREFIX = 'wt_tmdb_';

export interface TMDBResult {
  posterUrl: string | null;
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
      posterUrl: result.poster_path ? `${TMDB_IMG}${result.poster_path}` : null,
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
