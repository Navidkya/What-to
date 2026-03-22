const RAWG_BASE = 'https://api.rawg.io/api';

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
  'Corrida': 'racing',
  'Terror': 'action',
  'Luta': 'fighting',
  'Stealth': 'action',
  'Metroidvania': 'platformer',
  'Party': 'family',
  'Cartas': 'card',
  'Deck-building': 'card',
  'Arcade': 'arcade',
  'Sports': 'sports',
  'Desporto': 'sports',
};

// Mapa de plataformas para RAWG IDs
const RAWG_PLATFORM_MAP: Record<string, number> = {
  'steam': 4,        // PC
  'playstation': 187, // PS5
  'xbox': 186,       // Xbox Series X
};

export async function discoverRAWG(filters: RAWGFilters): Promise<RAWGItem[]> {
  const apiKey = import.meta.env.VITE_RAWG_KEY as string;
  if (!apiKey) return [];

  // Tabuleiro não tem API — usa mock
  if (filters.type === 'Tabuleiro') return [];


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

    return items;
  } catch {
    return [];
  }
}
