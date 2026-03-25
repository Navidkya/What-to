// IGDB API via Twitch — jogos indie, underground, e mainstream
// Requer token de acesso gerado via Client Credentials

const IGDB_BASE = 'https://api.igdb.com/v4';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TOKEN_CACHE_KEY = 'wt_igdb_token';

interface TokenCache {
  access_token: string;
  expires_at: number;
}

async function getAccessToken(): Promise<string | null> {
  try {
    // Verifica cache
    const cached = localStorage.getItem(TOKEN_CACHE_KEY);
    if (cached) {
      const parsed: TokenCache = JSON.parse(cached);
      if (parsed.expires_at > Date.now() + 60000) {
        return parsed.access_token;
      }
    }

    const clientId = import.meta.env.VITE_IGDB_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_IGDB_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const res = await fetch(
      `${TWITCH_TOKEN_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
      { method: 'POST' }
    );
    if (!res.ok) return null;

    const data = await res.json() as { access_token: string; expires_in: number };
    const cache: TokenCache = {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in * 1000),
    };
    localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(cache));
    return data.access_token;
  } catch { return null; }
}

export interface IGDBItem {
  id: number;
  title: string;
  coverUrl: string | null;
  rating: number | null;
  year: string | null;
  genres: string[];
  summary: string;
  type: 'Videojogo';
  isIndie: boolean;
  gameModes: string[];
  themes: string[];
}

export interface IGDBFilters {
  genres: string[];
  tier: 'mainstream' | 'indie' | 'underground' | 'all';
  limit?: number;
  offset?: number;
  jogadores?: string;    // 'solo' | 'co-op' | 'versus'
  online?: string;
}

const IGDB_GENRE_MAP: Record<string, number> = {
  'RPG': 12,
  'Estratégia': 15,
  'Puzzle': 9,
  'Ação': 4,
  'Plataforma': 8,
  'Aventura': 31,
  'Simulação': 13,
  'Indie': 32,
  'Corrida': 10,
  'Luta': 4,
  'Arcade': 33,
  'Desporto': 14,
  'Terror': 4,
};

export async function discoverIGDB(filters: IGDBFilters): Promise<IGDBItem[]> {
  const clientId = import.meta.env.VITE_IGDB_CLIENT_ID;
  const token = await getAccessToken();
  if (!clientId || !token) return [];

  try {
    const genreIds = filters.genres
      .map(g => IGDB_GENRE_MAP[g])
      .filter(Boolean);

    let whereClause = 'rating > 60 & rating_count > 5 & cover != null';

    if (filters.tier === 'mainstream') {
      whereClause = 'rating > 75 & rating_count > 100 & cover != null';
    } else if (filters.tier === 'indie') {
      whereClause = 'rating > 70 & rating_count >= 10 & rating_count < 200 & cover != null';
    } else if (filters.tier === 'underground') {
      whereClause = 'rating > 75 & rating_count >= 5 & rating_count < 50 & cover != null';
    }

    if (genreIds.length > 0) {
      whereClause += ` & genres = (${genreIds.join(',')})`;
    }

    // Filtro por jogadores via game_modes
    if (filters.jogadores === 'solo') {
      whereClause += ' & game_modes = (1)';
    } else if (filters.jogadores === 'co-op') {
      whereClause += ' & game_modes = (3)';
    } else if (filters.jogadores === 'versus') {
      whereClause += ' & game_modes = (2)';
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const sortOptions = ['rating desc', 'first_release_date desc', 'rating_count desc'];
    const sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];

    const body = `
      fields name, cover.url, rating, first_release_date, genres.name, summary, game_modes.name, themes.name;
      where ${whereClause};
      sort ${sort};
      limit ${limit};
      offset ${offset};
    `;

    const res = await fetch(`${IGDB_BASE}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body,
    });

    if (!res.ok) return [];

    const data = await res.json() as Array<{
      id: number;
      name: string;
      cover?: { url: string };
      rating?: number;
      first_release_date?: number;
      genres?: Array<{ name: string }>;
      summary?: string;
      game_modes?: Array<{ name: string }>;
      themes?: Array<{ name: string }>;
    }>;

    return data.map(r => ({
      id: r.id,
      title: r.name,
      coverUrl: r.cover?.url
        ? r.cover.url.replace('t_thumb', 't_cover_big').replace('http:', 'https:')
        : null,
      rating: r.rating ? Math.round(r.rating) / 10 : null,
      year: r.first_release_date
        ? new Date(r.first_release_date * 1000).getFullYear().toString()
        : null,
      genres: (r.genres || []).map(g => g.name).slice(0, 3),
      summary: r.summary?.substring(0, 150) || '',
      type: 'Videojogo' as const,
      isIndie: filters.tier === 'indie' || filters.tier === 'underground',
      gameModes: (r.game_modes || []).map((m: { name: string }) => m.name),
      themes: (r.themes || []).map((t: { name: string }) => t.name),
    }));
  } catch { return []; }
}
