const GB_BASE = 'https://www.googleapis.com/books/v1';

export interface GBItem {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  description: string;
  rating: number | null;
  year: string | null;
  pages: number | null;
  genre: string;
  previewUrl: string | null;
}

export interface GBFilters {
  genres: string[];
  type: 'Livro' | 'Artigo' | 'Ambos';
  peso: 'leve' | 'denso' | 'mistura';
}

const GENRE_QUERY_MAP: Record<string, string> = {
  'Psicologia': 'psychology self-help',
  'História': 'history',
  'Sci-Fi': 'science fiction',
  'Romance': 'romance novel',
  'Biografia': 'biography memoir',
  'Ensaio': 'essay non-fiction',
  'Tecnologia': 'technology programming',
  'Arte': 'art design',
  'Negócios': 'business entrepreneurship',
  'Ciência': 'science popular',
  'Filosofia': 'philosophy',
  'Aventura': 'adventure fiction',
};

export async function discoverBooks(filters: GBFilters): Promise<GBItem[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_KEY as string;
  if (!apiKey) return [];

  try {
    const query = filters.genres.length > 0
      ? filters.genres.map(g => GENRE_QUERY_MAP[g] || g).join('+OR+')
      : 'bestseller popular';

    const params = new URLSearchParams();
    params.set('key', apiKey);
    params.set('q', query);
    params.set('maxResults', '20');
    params.set('orderBy', 'relevance');
    params.set('printType', filters.type === 'Artigo' ? 'magazines' : 'books');

    const res = await fetch(`${GB_BASE}/volumes?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json() as {
      items?: Array<{
        id: string;
        volumeInfo: {
          title: string;
          authors?: string[];
          description?: string;
          averageRating?: number;
          publishedDate?: string;
          pageCount?: number;
          categories?: string[];
          imageLinks?: {
            extraLarge?: string;
            large?: string;
            medium?: string;
            thumbnail?: string;
          };
          previewLink?: string;
        };
      }>;
    };

    const items: GBItem[] = (data.items || []).map(r => {
      const info = r.volumeInfo;
      // Pede imagem de maior qualidade possível
      const coverUrl = info.imageLinks?.extraLarge
        || info.imageLinks?.large
        || info.imageLinks?.medium
        || (info.imageLinks?.thumbnail
          ? info.imageLinks.thumbnail.replace('zoom=1', 'zoom=3').replace('&edge=curl', '')
          : null);

      return {
        id: r.id,
        title: info.title,
        authors: info.authors || [],
        coverUrl,
        description: info.description?.substring(0, 200) || '',
        rating: info.averageRating || null,
        year: info.publishedDate?.substring(0, 4) || null,
        pages: info.pageCount || null,
        genre: info.categories?.[0] || filters.genres[0] || 'Livro',
        previewUrl: info.previewLink || null,
      };
    });

    // Filtra livros sem capa
    const withCovers = items.filter(i => i.coverUrl);
    const result = withCovers.length >= 5 ? withCovers : items;

    return result;
  } catch {
    return [];
  }
}
