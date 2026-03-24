// Last.fm API — álbuns, artistas, tracks underground e mainstream

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0';

export interface LastFMItem {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  listeners: number | null;
  playcount: number | null;
  url: string;
  type: 'Álbum' | 'Artista' | 'Track';
  genre: string;
  isUnderground: boolean;
}

export interface LastFMFilters {
  genres: string[];
  tier: 'mainstream' | 'underground' | 'all';
  type: 'Álbum' | 'Track' | 'Ambos';
  limit?: number;
  page?: number;
}

const LASTFM_TAG_MAP: Record<string, string> = {
  'Pop': 'pop',
  'Hip-Hop': 'hip-hop',
  'Jazz': 'jazz',
  'Electrónica': 'electronic',
  'Rock': 'rock',
  'Clássica': 'classical',
  'R&B': 'rnb',
  'Indie': 'indie',
  'Metal': 'metal',
  'Folk': 'folk',
  'Soul': 'soul',
  'Blues': 'blues',
  'Alternativo': 'alternative',
  'Punk': 'punk',
  'Reggae': 'reggae',
  'Ambiental': 'ambient',
  'Lo-fi': 'lo-fi',
  'Post-Rock': 'post-rock',
};

function getBestImage(images: Array<{ '#text': string; size: string }>): string | null {
  const order = ['extralarge', 'large', 'medium', 'small'];
  for (const size of order) {
    const img = images.find(i => i.size === size);
    if (img?.['#text'] && !img['#text'].includes('2a96cbd8b46e442fc41c2b86b821562f')) {
      return img['#text'];
    }
  }
  return null;
}

export async function discoverLastFM(filters: LastFMFilters): Promise<LastFMItem[]> {
  const apiKey = import.meta.env.VITE_LASTFM_KEY;
  if (!apiKey) return [];

  const items: LastFMItem[] = [];
  const limit = filters.limit || 50;
  const page = filters.page || 1;

  try {
    const tags = filters.genres.length > 0
      ? filters.genres.map(g => LASTFM_TAG_MAP[g] || g.toLowerCase())
      : ['pop', 'rock', 'electronic', 'hip-hop', 'indie'];

    if (filters.type === 'Álbum' || filters.type === 'Ambos') {
      const results = await Promise.all(tags.slice(0, 3).map(async tag => {
        try {
          const res = await fetch(
            `${LASTFM_BASE}/?method=tag.gettopalbums&tag=${encodeURIComponent(tag)}&api_key=${apiKey}&format=json&limit=${limit}&page=${page}`
          );
          if (!res.ok) return [];
          const data = await res.json() as {
            albums?: {
              album?: Array<{
                name: string;
                artist: { name: string };
                image: Array<{ '#text': string; size: string }>;
                url: string;
                playcount?: string;
                listeners?: string;
              }>;
            };
          };

          return (data.albums?.album || []).map(a => ({
            id: `lastfm-album-${a.name}-${a.artist.name}`,
            title: a.name,
            artist: a.artist.name,
            coverUrl: getBestImage(a.image),
            listeners: a.listeners ? parseInt(a.listeners) : null,
            playcount: a.playcount ? parseInt(a.playcount) : null,
            url: a.url,
            type: 'Álbum' as const,
            genre: tag,
            isUnderground: false,
          }));
        } catch { return []; }
      }));
      items.push(...results.flat());
    }

    if (filters.type === 'Track' || filters.type === 'Ambos') {
      const results = await Promise.all(tags.slice(0, 3).map(async tag => {
        try {
          const res = await fetch(
            `${LASTFM_BASE}/?method=tag.gettoptracks&tag=${encodeURIComponent(tag)}&api_key=${apiKey}&format=json&limit=${limit}&page=${page}`
          );
          if (!res.ok) return [];
          const data = await res.json() as {
            tracks?: {
              track?: Array<{
                name: string;
                artist: { name: string };
                image?: Array<{ '#text': string; size: string }>;
                url: string;
                playcount?: string;
                listeners?: string;
              }>;
            };
          };

          return (data.tracks?.track || []).map(t => ({
            id: `lastfm-track-${t.name}-${t.artist.name}`,
            title: t.name,
            artist: t.artist.name,
            coverUrl: t.image ? getBestImage(t.image) : null,
            listeners: t.listeners ? parseInt(t.listeners) : null,
            playcount: t.playcount ? parseInt(t.playcount) : null,
            url: t.url,
            type: 'Track' as const,
            genre: tag,
            isUnderground: false,
          }));
        } catch { return []; }
      }));
      items.push(...results.flat());
    }

    // Underground: artistas com poucos listeners mas alto playcount
    if (filters.tier === 'underground' || filters.tier === 'all') {
      try {
        const tag = tags[0] || 'indie';
        const res = await fetch(
          `${LASTFM_BASE}/?method=tag.gettopartists&tag=${encodeURIComponent(tag)}&api_key=${apiKey}&format=json&limit=100&page=${Math.floor(Math.random() * 5) + 3}`
        );
        if (res.ok) {
          const data = await res.json() as {
            topartists?: {
              artist?: Array<{
                name: string;
                image: Array<{ '#text': string; size: string }>;
                url: string;
                listeners?: string;
              }>;
            };
          };
          const underground = (data.topartists?.artist || [])
            .filter(a => {
              const listeners = parseInt(a.listeners || '0');
              return listeners > 1000 && listeners < 100000;
            })
            .slice(0, 20)
            .map(a => ({
              id: `lastfm-artist-${a.name}`,
              title: a.name,
              artist: a.name,
              coverUrl: getBestImage(a.image),
              listeners: parseInt(a.listeners || '0'),
              playcount: null,
              url: a.url,
              type: 'Artista' as const,
              genre: tag,
              isUnderground: true,
            }));
          items.push(...underground);
        }
      } catch { /* silencioso */ }
    }
  } catch { return []; }

  // Deduplica
  const seen = new Set<string>();
  return items.filter(i => {
    const key = `${i.title}-${i.artist}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort(() => Math.random() - 0.5);
}
