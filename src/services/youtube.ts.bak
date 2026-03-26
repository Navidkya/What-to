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

  // Texto/artigos não vêm do YouTube — retorna vazio (usa mock)
  if (filters.formato === 'texto') return [];

  const searchQuery = filters.genres.length > 0
    ? filters.genres.join(' OR ') + ' tutorial aprender português'
    : 'tutorial aprender português';

  try {
    const params = new URLSearchParams();
    params.set('key', apiKey);
    params.set('part', 'snippet');
    params.set('type', 'video');
    params.set('q', searchQuery);
    params.set('maxResults', '20');
    params.set('relevanceLanguage', 'pt');
    params.set('videoDuration', DURATION_MAP[filters.duracao] || 'medium');
    params.set('videoEmbeddable', 'true');
    params.set('safeSearch', 'strict');
    if (filters.page) params.set('pageToken', filters.page);

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

    const items: YTItem[] = (data.items || []).map(r => ({
      id: r.id.videoId,
      title: r.snippet.title,
      thumbnailUrl: r.snippet.thumbnails.maxres?.url
        || r.snippet.thumbnails.standard?.url
        || r.snippet.thumbnails.high?.url
        || r.snippet.thumbnails.medium?.url
        || r.snippet.thumbnails.default?.url
        || null,
      channelName: r.snippet.channelTitle,
      duration: null, // precisaria de outro call para obter duração exacta
      viewCount: null,
      description: r.snippet.description.substring(0, 120) || '',
      publishedAt: r.snippet.publishedAt?.substring(0, 4) || null,
    }));

    return items;
  } catch {
    return [];
  }
}
