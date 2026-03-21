const DEEZER_BASE = 'https://api.deezer.com';

export interface DeezerItem {
  id: number;
  title: string;
  artist: string;
  coverUrl: string | null;
  previewUrl: string | null; // 30s preview
  type: 'Álbum' | 'Podcast';
  genre: string;
  fans: number | null;
  url: string;
}

export interface DeezerFilters {
  type: 'Álbum' | 'Podcast' | 'Ambos';
  genres: string[];
  energia: 'relaxante' | 'energetico' | 'mistura';
}

// Géneros para pesquisa Deezer
const GENRE_SEARCH_MAP: Record<string, string> = {
  'Pop': 'pop',
  'Hip-Hop': 'hip hop',
  'Jazz': 'jazz',
  'Electrónica': 'electronic',
  'Rock': 'rock',
  'Clássica': 'classical',
  'R&B': 'r&b soul',
  'Indie': 'indie',
  'Ciência': 'science podcast',
  'Tecnologia': 'technology podcast',
  'True Crime': 'true crime',
  'Cultura': 'culture',
};

// IDs de géneros Deezer para browse
const DEEZER_GENRE_IDS: Record<string, number> = {
  'Pop': 132,
  'Hip-Hop': 116,
  'Jazz': 129,
  'Electrónica': 106,
  'Rock': 152,
  'Clássica': 98,
  'R&B': 165,
  'Indie': 85,
};

export async function discoverDeezer(filters: DeezerFilters): Promise<DeezerItem[]> {
  const items: DeezerItem[] = [];

  try {
    if (filters.type === 'Álbum' || filters.type === 'Ambos') {
      // Usa géneros se definidos, senão top charts
      const genreId = filters.genres.length > 0
        ? DEEZER_GENRE_IDS[filters.genres[0]]
        : null;

      const url = genreId
        ? `${DEEZER_BASE}/genre/${genreId}/artists`
        : `${DEEZER_BASE}/chart/0/albums`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json() as {
          data?: Array<{
            id: number;
            name?: string;
            title?: string;
            artist?: { name: string };
            cover_xl?: string;
            cover_big?: string;
            nb_fan?: number;
            link?: string;
          }>;
        };
        const albums = (data.data || []).slice(0, 15).map(r => ({
          id: r.id,
          title: r.title || r.name || 'Sem título',
          artist: r.artist?.name || '',
          coverUrl: r.cover_xl || r.cover_big || null,
          previewUrl: null,
          type: 'Álbum' as const,
          genre: filters.genres[0] || 'Música',
          fans: r.nb_fan || null,
          url: r.link || `https://www.deezer.com/album/${r.id}`,
        }));
        items.push(...albums);
      }
    }

    if (filters.type === 'Podcast' || filters.type === 'Ambos') {
      const query = filters.genres.length > 0
        ? GENRE_SEARCH_MAP[filters.genres[0]] || filters.genres[0]
        : 'podcast popular';
      const searchUrl = `${DEEZER_BASE}/search/podcast?q=${encodeURIComponent(query)}&limit=10`;
      const res = await fetch(searchUrl);
      if (res.ok) {
        const data = await res.json() as {
          data?: Array<{
            id: number;
            title: string;
            description?: string;
            picture_xl?: string;
            picture_big?: string;
            fans?: number;
            link?: string;
          }>;
        };
        const podcasts = (data.data || []).slice(0, 10).map(r => ({
          id: r.id,
          title: r.title,
          artist: 'Podcast',
          coverUrl: r.picture_xl || r.picture_big || null,
          previewUrl: null,
          type: 'Podcast' as const,
          genre: filters.genres[0] || 'Podcast',
          fans: r.fans || null,
          url: r.link || `https://www.deezer.com/show/${r.id}`,
        }));
        items.push(...podcasts);
      }
    }
  } catch {
    return [];
  }

  const shuffled = items.sort(() => Math.random() - 0.5);
  return shuffled;
}
