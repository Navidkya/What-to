const RAWG_BASE = 'https://api.rawg.io/api';
const RAWG_CACHE = 'wt_rawg_';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 horas

export interface RAWGItem {
  id: number;
  title: string;
  coverUrl: string | null;
  rating: number | null;
  year: string | null;
  genres: string[];
  platforms: string[];
  description: string;
  metacritic: number | null;
}

export interface RAWGFilters {
  genres: string[];        // ex: ['RPG', 'Estratégia']
  platforms: string[];     // ex: ['steam', 'playstation', 'xbox']
  dificuldade: 'casual' | 'normal' | 'desafiante';
  type: 'Videojogo' | 'Tabuleiro' | 'Ambos';
  page?: number;
}

// Mapa de géneros para RAWG slugs
const RAWG_GENRE_MAP: Record<string, string> = {
  'RPG': 'role-playing-games-rpg',
  'Estratégia': 'strategy',
  'Puzzle': 'puzzle',
  'Ação': 'action',
  'Plataforma': 'platformer',
  'Roguelite': 'indie',
  'Cooperativo': 'action',
  'Competitivo': 'action',
  'Sandbox': 'simulation',
  'Aventura': 'adventure',
  'Simulação': 'simulation',
  'Indie': 'indie',
};

// Mapa de plataformas para RAWG IDs
const RAWG_PLATFORM_MAP: Record<string, number> = {
  'steam': 4,        // PC
  'playstation': 187, // PS5
  'xbox': 186,       // Xbox Series X
};

function cacheGet<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(RAWG_CACHE + key);
    if (!v) return null;
    const parsed = JSON.parse(v) as { ts: number; data: T };
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch { return null; }
}

function cacheSet<T>(key: string, data: T) {
  try {
    localStorage.setItem(RAWG_CACHE + key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

export async function discoverRAWG(filters: RAWGFilters): Promise<RAWGItem[]> {
  const apiKey = import.meta.env.VITE_RAWG_KEY as string;
  if (!apiKey) return [];

  // Tabuleiro não tem API — usa mock
  if (filters.type === 'Tabuleiro') return [];

  const cacheKey = JSON.stringify(filters);
  const cached = cacheGet<RAWGItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams();
    params.set('key', apiKey);
    params.set('page_size', '100');
    params.set('ordering', '-rating');
    params.set('metacritic', '60,100');
    params.set('page', String(filters.page || 1));

    // Géneros
    const genreSlugs = filters.genres
      .map(g => RAWG_GENRE_MAP[g])
      .filter(Boolean);
    if (genreSlugs.length > 0) {
      params.set('genres', genreSlugs.join(','));
    }

    // Plataformas
    const platformIds = filters.platforms
      .map(p => RAWG_PLATFORM_MAP[p])
      .filter((id): id is number => !!id);
    if (platformIds.length > 0) {
      params.set('platforms', platformIds.join(','));
    }

    // Dificuldade → metacritic
    if (filters.dificuldade === 'casual') {
      params.set('metacritic', '50,75');
    } else if (filters.dificuldade === 'desafiante') {
      params.set('metacritic', '80,100');
      params.set('tags', 'difficult');
    }

    const res = await fetch(`${RAWG_BASE}/games?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json() as {
      results?: Array<{
        id: number;
        name: string;
        background_image?: string;
        rating?: number;
        released?: string;
        genres?: Array<{ name: string }>;
        platforms?: Array<{ platform: { name: string } }>;
        metacritic?: number;
      }>;
    };

    const items: RAWGItem[] = (data.results || []).map(r => ({
      id: r.id,
      title: r.name,
      coverUrl: r.background_image || null,
      rating: r.rating ? Math.round(r.rating * 10) / 10 : null,
      year: r.released ? r.released.substring(0, 4) : null,
      genres: (r.genres || []).map(g => g.name).slice(0, 2),
      platforms: (r.platforms || []).map(p => p.platform.name).slice(0, 3),
      description: `${(r.genres || []).map(g => g.name).join(', ')} · ${r.released?.substring(0, 4) || ''}`,
      metacritic: r.metacritic || null,
    }));

    cacheSet(cacheKey, items);
    return items;
  } catch {
    return [];
  }
}
