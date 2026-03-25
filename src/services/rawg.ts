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
  tags: string[];
  playtime: number | null;
  esrb: string | null;
}

export interface RAWGFilters {
  genres: string[];        // ex: ['RPG', 'Estratégia']
  platforms: string[];     // ex: ['steam', 'playstation', 'xbox']
  dificuldade: 'casual' | 'normal' | 'desafiante';
  type: 'Videojogo' | 'Tabuleiro' | 'Ambos';
  page?: number;
  jogadores?: string;      // 'solo' | 'co-op' | 'versus' | 'local-coop'
  online?: string;         // 'online' | 'offline' | 'local'
  duracaoJogo?: string;    // 'curto' | 'normal' | 'longo'
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

    // Jogadores → tags
    if (filters.jogadores === 'solo') {
      params.set('tags', 'singleplayer');
    } else if (filters.jogadores === 'co-op') {
      params.set('tags', 'co-op,local-co-op,online-co-op');
    } else if (filters.jogadores === 'versus') {
      params.set('tags', 'multiplayer,pvp');
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
        tags?: Array<{ slug: string }>;
        playtime?: number;
        esrb_rating?: { name: string };
      }>;
    };

    let items: RAWGItem[] = (data.results || []).map(r => ({
      id: r.id,
      title: r.name,
      coverUrl: r.background_image || null,
      rating: r.rating ? Math.round(r.rating * 10) / 10 : null,
      year: r.released ? r.released.substring(0, 4) : null,
      genres: (r.genres || []).map(g => g.name).slice(0, 2),
      platforms: (r.platforms || []).map(p => p.platform.name).slice(0, 3),
      description: `${(r.genres || []).map(g => g.name).join(', ')} · ${r.released?.substring(0, 4) || ''}`,
      metacritic: r.metacritic || null,
      tags: (r.tags || []).map((t: { slug: string }) => t.slug).slice(0, 10),
      playtime: r.playtime || null,
      esrb: r.esrb_rating?.name || null,
    }));

    // Filtro por duração pós-fetch
    if (filters.duracaoJogo === 'curto') items = items.filter(i => i.playtime === null || i.playtime <= 5);
    if (filters.duracaoJogo === 'normal') items = items.filter(i => i.playtime === null || (i.playtime > 5 && i.playtime <= 30));
    if (filters.duracaoJogo === 'longo') items = items.filter(i => i.playtime === null || i.playtime > 30);

    return items;
  } catch {
    return [];
  }
}
