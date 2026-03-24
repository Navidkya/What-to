const YT_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YTItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  channelName: string;
  duration: string | null; // ex: "12:34"
  viewCount: string | null;
  description: string;
  publishedAt: string | null;
}

export interface YTFilters {
  genres: string[];     // temas ex: ['IA', 'Design']
  formato: 'video' | 'texto' | 'Ambos';
  duracao: 'curta' | 'normal' | 'longa';
  page?: string;        // pageToken para paginação
}

// Duração para parâmetro YouTube
const DURATION_MAP: Record<string, string> = {
  'curta': 'short',   // < 4 min
  'normal': 'medium', // 4-20 min
  'longa': 'long',    // > 20 min
};

export async function discoverYouTube(filters: YTFilters): Promise<YTItem[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_KEY as string;
  if (!apiKey) return [];
  if (filters.formato === 'texto') return [];

  // Múltiplas queries paralelas para mais resultados
  const baseQueries = filters.genres.length > 0
    ? filters.genres
    : ['aprender', 'tutorial', 'ciência', 'história', 'tecnologia'];

  const queryVariants = baseQueries.flatMap(g => [
    `${g} tutorial português`,
    `${g} explicado`,
    `aprender ${g}`,
    `${g} curso`,
  ]).slice(0, 8); // máx 8 queries paralelas

  try {
    const results = await Promise.all(
      queryVariants.map(async query => {
        try {
          const params = new URLSearchParams();
          params.set('key', apiKey);
          params.set('part', 'snippet');
          params.set('type', 'video');
          params.set('q', query);
          params.set('maxResults', '50');
          params.set('relevanceLanguage', 'pt');
          params.set('videoDuration', DURATION_MAP[filters.duracao] || 'medium');
          params.set('videoEmbeddable', 'true');
          params.set('safeSearch', 'strict');
          if (Math.random() > 0.7 && filters.page) {
            params.set('pageToken', filters.page);
          }

          const res = await fetch(`${YT_BASE}/search?${params.toString()}`);
          if (!res.ok) return [];

          const data = await res.json() as {
            items?: Array<{
              id: { videoId: string };
              snippet: {
                title: string;
                description: string;
                channelTitle: string;
                publishedAt: string;
                thumbnails: {
                  maxres?: { url: string };
                  standard?: { url: string };
                  high?: { url: string };
                  medium?: { url: string };
                  default?: { url: string };
                };
              };
            }>;
          };

          return (data.items || []).map(r => ({
            id: r.id.videoId,
            title: r.snippet.title,
            thumbnailUrl: r.snippet.thumbnails.maxres?.url
              || r.snippet.thumbnails.standard?.url
              || r.snippet.thumbnails.high?.url
              || r.snippet.thumbnails.medium?.url
              || null,
            channelName: r.snippet.channelTitle,
            duration: null,
            viewCount: null,
            description: r.snippet.description.substring(0, 120),
            publishedAt: r.snippet.publishedAt?.substring(0, 4) || null,
          }));
        } catch { return []; }
      })
    );

    const all = results.flat();

    // Deduplica por id
    const seen = new Set<string>();
    return all
      .filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
      .sort(() => Math.random() - 0.5);
  } catch { return []; }
}
