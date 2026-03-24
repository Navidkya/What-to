// OpenLibrary — livros underground, clássicos, e nichados
// Sem chave, sem autenticação

const OL_BASE = 'https://openlibrary.org';

export interface OLBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  year: string | null;
  subjects: string[];
  description: string;
  pages: number | null;
  url: string;
  type: 'Livro';
  isUnderground: boolean;
}

export interface OLFilters {
  genres: string[];
  tier: 'mainstream' | 'underground' | 'all';
  limit?: number;
  page?: number;
}

const OL_SUBJECT_MAP: Record<string, string[]> = {
  'Romance': ['romance', 'love_stories', 'fiction'],
  'Ficção Científica': ['science_fiction', 'space_opera', 'cyberpunk'],
  'Fantasia': ['fantasy', 'magic', 'dragons'],
  'Terror': ['horror', 'ghost_stories', 'supernatural'],
  'Thriller': ['thriller', 'suspense', 'mystery'],
  'Crime': ['mystery', 'detective_and_mystery_stories', 'crime'],
  'Histórico': ['historical_fiction', 'history'],
  'Biografia': ['biography', 'autobiography'],
  'Ciência': ['science', 'popular_science', 'physics'],
  'Filosofia': ['philosophy', 'ethics'],
  'Psicologia': ['psychology', 'self-help'],
  'Aventura': ['adventure_stories', 'action_adventure'],
  'Clássicos': ['classics', 'literary_fiction'],
  'Poesia': ['poetry', 'verse'],
  'BD': ['comics', 'graphic_novels'],
  'Manga': ['manga', 'japanese_comics'],
};

export async function discoverOpenLibrary(filters: OLFilters): Promise<OLBook[]> {
  const items: OLBook[] = [];
  const limit = filters.limit || 40;
  const page = filters.page || 1;

  const subjects = filters.genres.length > 0
    ? filters.genres.flatMap(g => OL_SUBJECT_MAP[g] || [g.toLowerCase()])
    : ['fiction', 'science_fiction', 'mystery', 'biography', 'history'];

  try {
    const results = await Promise.all(
      subjects.slice(0, 4).map(async subject => {
        try {
          const sort = Math.random() > 0.5 ? 'rating' : 'editions';
          const offset = (page - 1) * limit;

          const res = await fetch(
            `${OL_BASE}/subjects/${encodeURIComponent(subject)}.json?limit=${limit}&offset=${offset}&sort=${sort}`
          );
          if (!res.ok) return [];

          const data = await res.json() as {
            works?: Array<{
              key: string;
              title: string;
              authors?: Array<{ name: string }>;
              cover_id?: number;
              first_publish_year?: number;
              subject?: string[];
              edition_count?: number;
            }>;
          };

          return (data.works || []).map(w => {
            const coverId = w.cover_id;
            const coverUrl = coverId
              ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
              : null;

            const isUnderground = (w.edition_count || 0) < 5;

            return {
              id: w.key,
              title: w.title,
              author: w.authors?.[0]?.name || 'Desconhecido',
              coverUrl,
              year: w.first_publish_year?.toString() || null,
              subjects: (w.subject || []).slice(0, 3),
              description: (w.subject || []).slice(0, 3).join(', '),
              pages: null,
              url: `https://openlibrary.org${w.key}`,
              type: 'Livro' as const,
              isUnderground,
            };
          });
        } catch { return []; }
      })
    );

    items.push(...results.flat());
  } catch { return []; }

  // Deduplica por título
  const seen = new Set<string>();
  return items
    .filter(i => {
      if (!i.title || seen.has(i.title.toLowerCase())) return false;
      seen.add(i.title.toLowerCase());
      return true;
    })
    .sort(() => Math.random() - 0.5);
}
