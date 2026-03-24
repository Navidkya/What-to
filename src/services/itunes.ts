// iTunes Search API — músicas, álbuns, podcasts
// Sem chave, sem autenticação, sem limites publicados

const ITUNES_BASE = 'https://itunes.apple.com';

export interface iTunesItem {
  id: number;
  title: string;
  artist: string;
  coverUrl: string | null;
  previewUrl: string | null;
  url: string;
  type: 'Track' | 'Álbum' | 'Podcast';
  genre: string;
  year: string | null;
  duration: number | null; // ms
}

export interface iTunesFilters {
  genres: string[];
  type: 'Track' | 'Álbum' | 'Podcast' | 'Ambos';
  limit?: number;
  country?: string;
}

const ITUNES_GENRE_QUERIES: Record<string, string[]> = {
  'Pop': ['pop hits', 'pop music'],
  'Hip-Hop': ['hip hop rap', 'trap music'],
  'Jazz': ['jazz classics', 'smooth jazz'],
  'Electrónica': ['electronic dance', 'techno house'],
  'Rock': ['rock music', 'alternative rock'],
  'Clássica': ['classical music', 'orchestra'],
  'R&B': ['r&b soul', 'neo soul'],
  'Indie': ['indie music', 'indie pop'],
  'Metal': ['heavy metal', 'metal music'],
  'Folk': ['folk music', 'acoustic folk'],
  'Soul': ['soul music', 'motown'],
  'Lo-fi': ['lo-fi beats', 'chill hop'],
  'Ambiental': ['ambient music', 'chill ambient'],
  'Podcast': ['podcast', 'true crime podcast'],
  'Ciência': ['science podcast', 'technology podcast'],
  'Tecnologia': ['tech podcast', 'startup podcast'],
  'True Crime': ['true crime', 'crime investigation'],
  'Cultura': ['culture arts', 'philosophy podcast'],
};

export async function discoverITunes(filters: iTunesFilters): Promise<iTunesItem[]> {
  const items: iTunesItem[] = [];
  const limit = filters.limit || 50;
  const country = filters.country || 'PT';

  const queries = filters.genres.length > 0
    ? filters.genres.flatMap(g => ITUNES_GENRE_QUERIES[g] || [g.toLowerCase()])
    : ['popular music', 'top hits', 'best albums'];

  const mediaTypes: string[] = [];
  if (filters.type === 'Track' || filters.type === 'Ambos') mediaTypes.push('music');
  if (filters.type === 'Álbum' || filters.type === 'Ambos') mediaTypes.push('music');
  if (filters.type === 'Podcast' || filters.type === 'Ambos') mediaTypes.push('podcast');

  try {
    const results = await Promise.all(
      queries.slice(0, 4).flatMap(query =>
        mediaTypes.slice(0, 2).map(async media => {
          try {
            const entity = media === 'podcast' ? 'podcast'
              : filters.type === 'Álbum' ? 'album'
              : 'song';

            const url = `${ITUNES_BASE}/search?term=${encodeURIComponent(query)}&media=${media}&entity=${entity}&limit=${limit}&country=${country}&lang=pt_PT`;
            const res = await fetch(url);
            if (!res.ok) return [];

            const data = await res.json() as {
              results?: Array<{
                trackId?: number;
                collectionId?: number;
                trackName?: string;
                collectionName?: string;
                artistName?: string;
                artworkUrl100?: string;
                previewUrl?: string;
                trackViewUrl?: string;
                collectionViewUrl?: string;
                primaryGenreName?: string;
                releaseDate?: string;
                trackTimeMillis?: number;
                wrapperType?: string;
                kind?: string;
              }>;
            };

            return (data.results || []).map(r => {
              const isAlbum = r.wrapperType === 'collection' || entity === 'album';
              const isPodcast = media === 'podcast';
              const id = r.trackId || r.collectionId || 0;
              const title = r.trackName || r.collectionName || '';
              const coverUrl = r.artworkUrl100
                ? r.artworkUrl100.replace('100x100', '600x600')
                : null;

              return {
                id,
                title,
                artist: r.artistName || '',
                coverUrl,
                previewUrl: r.previewUrl || null,
                url: r.trackViewUrl || r.collectionViewUrl || '',
                type: isPodcast ? 'Podcast' as const
                  : isAlbum ? 'Álbum' as const
                  : 'Track' as const,
                genre: r.primaryGenreName || query,
                year: r.releaseDate?.substring(0, 4) || null,
                duration: r.trackTimeMillis || null,
              };
            }).filter(i => i.title && i.id);
          } catch { return []; }
        })
      )
    );

    items.push(...results.flat());
  } catch { return []; }

  // Deduplica por id
  const seen = new Set<number>();
  return items
    .filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
    .sort(() => Math.random() - 0.5);
}
