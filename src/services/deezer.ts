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

// IDs de géneros Deezer para browse (mantido para uso futuro)
export const DEEZER_GENRE_IDS: Record<string, number> = {
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
      if (filters.genres.length > 0) {
        // Pesquisa por álbuns usando query de género — mais preciso que browse por artistas
        const results = await Promise.all(
          filters.genres.map(async genre => {
            const query = GENRE_SEARCH_MAP[genre] || genre.toLowerCase();
            try {
              const res = await fetch(`${DEEZER_BASE}/search/album?q=${encodeURIComponent(query)}&limit=50`);
              if (!res.ok) return [];
              const data = await res.json() as {
                data?: Array<{
                  id: number;
                  title: string;
                  artist?: { name: string };
                  cover_xl?: string;
                  cover_big?: string;
                  nb_fan?: number;
                  link?: string;
                }>;
              };
              return (data.data || []).map(r => ({
                id: r.id,
                title: r.title,
                artist: r.artist?.name || '',
                coverUrl: r.cover_xl || r.cover_big || null,
                previewUrl: null,
                type: 'Álbum' as const,
                genre: genre,
                fans: r.nb_fan || null,
                url: r.link || `https://www.deezer.com/album/${r.id}`,
              }));
            } catch { return []; }
          })
        );
        items.push(...results.flat());
      } else {
        // Sem género específico — usa chart geral
        try {
          const res = await fetch(`${DEEZER_BASE}/chart/0/albums?limit=50`);
          if (res.ok) {
            const data = await res.json() as {
              data?: Array<{
                id: number;
                title: string;
                artist?: { name: string };
                cover_xl?: string;
                cover_big?: string;
                nb_fan?: number;
                link?: string;
              }>;
            };
            const albums = (data.data || []).map(r => ({
              id: r.id,
              title: r.title,
              artist: r.artist?.name || '',
              coverUrl: r.cover_xl || r.cover_big || null,
              previewUrl: null,
              type: 'Álbum' as const,
              genre: 'Música',
              fans: r.nb_fan || null,
              url: r.link || `https://www.deezer.com/album/${r.id}`,
            }));
            items.push(...albums);
          }
        } catch { /* silencioso */ }
      }

      // Energia — filtra por géneros energéticos/relaxantes
      if (filters.energia === 'energetico') {
        const energeticGenres = new Set(['Hip-Hop', 'Rock', 'Electrónica', 'pop', 'hip hop', 'rock', 'electronic']);
        const energetic = items.filter(i => energeticGenres.has(i.genre) || energeticGenres.has((GENRE_SEARCH_MAP[i.genre] || '')));
        if (energetic.length >= 5) items.splice(0, items.length, ...energetic);
      } else if (filters.energia === 'relaxante') {
        const relaxGenres = new Set(['Jazz', 'Clássica', 'Indie', 'R&B', 'jazz', 'classical', 'indie', 'r&b soul']);
        const relax = items.filter(i => relaxGenres.has(i.genre) || relaxGenres.has((GENRE_SEARCH_MAP[i.genre] || '')));
        if (relax.length >= 5) items.splice(0, items.length, ...relax);
      }
    }

    if (filters.type === 'Podcast' || filters.type === 'Ambos') {
      const queries = filters.genres.length > 0
        ? filters.genres.map(g => GENRE_SEARCH_MAP[g] || g)
        : ['popular podcast'];

      const results = await Promise.all(
        queries.map(async query => {
          try {
            const res = await fetch(`${DEEZER_BASE}/search/podcast?q=${encodeURIComponent(query)}&limit=30`);
            if (!res.ok) return [];
            const data = await res.json() as {
              data?: Array<{
                id: number;
                title: string;
                picture_xl?: string;
                picture_big?: string;
                fans?: number;
                link?: string;
              }>;
            };
            return (data.data || []).map(r => ({
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
          } catch { return []; }
        })
      );
      items.push(...results.flat());
    }
  } catch {
    return [];
  }

  // Deduplica por id
  const seen = new Set<number>();
  const unique = items.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; });

  return unique.sort(() => Math.random() - 0.5);
}
