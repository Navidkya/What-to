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
  lingua?: string;   // 'Português' | 'Inglês' | undefined
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
  'Ficção Científica': 'science fiction',
  'Fantasia': 'fantasy',
  'Terror': 'horror',
  'Mistério': 'mystery thriller',
  'Policíaco': 'crime detective',
  'Humor': 'comedy humor',
  'Infantil': 'children books',
  'Juvenil': 'young adult',
  'Desenvolvimento Pessoal': 'self-help personal development',
  'Saúde': 'health wellness',
  'Culinária': 'cooking food',
  'Viagens': 'travel',
  'Desporto': 'sports',
  'Política': 'politics society',
  'Economia': 'economics finance',
  'Religião': 'religion spirituality',
  'Poesia': 'poetry',
  'Teatro': 'drama theatre',
  'Manga': 'manga graphic novel',
  'BD': 'comic graphic novel',
};

export async function discoverBooksMultiPage(
  filters: GBFilters,
  pages: number[] = [0, 20, 40]
): Promise<GBItem[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_KEY as string;
  if (!apiKey) return [];
  const query = filters.genres.length > 0
    ? filters.genres.map(g => GENRE_QUERY_MAP[g] || g).join('+OR+')
    : 'bestseller popular';
  const results = await Promise.all(
    pages.map(async startIndex => {
      try {
        const params = new URLSearchParams();
        params.set('key', apiKey);
        params.set('q', query);
        params.set('maxResults', '20');
        params.set('startIndex', String(startIndex));
        params.set('orderBy', 'relevance');
        params.set('printType', filters.type === 'Artigo' ? 'magazines' : 'books');
        if (filters.lingua === 'Português') params.set('langRestrict', 'pt');
        else if (filters.lingua === 'Inglês') params.set('langRestrict', 'en');
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
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
              imageLinks?: { extraLarge?: string; large?: string; medium?: string; thumbnail?: string };
              previewLink?: string;
            };
          }>;
        };
        return (data.items || []).map(r => {
          const info = r.volumeInfo;
          const coverUrl = info.imageLinks?.extraLarge || info.imageLinks?.large || info.imageLinks?.medium
            || (info.imageLinks?.thumbnail ? info.imageLinks.thumbnail.replace('zoom=1','zoom=3').replace('&edge=curl','') : null);
          return {
            id: r.id, title: info.title, authors: info.authors || [],
            coverUrl, description: info.description?.substring(0, 200) || '',
            rating: info.averageRating || null, year: info.publishedDate?.substring(0,4) || null,
            pages: info.pageCount || null, genre: info.categories?.[0] || filters.genres[0] || 'Livro',
            previewUrl: info.previewLink || null,
          } as GBItem;
        });
      } catch { return []; }
    })
  );
  const all = results.flat();
  const seen = new Set<string>();
  return all.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

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
    if (filters.lingua === 'Português') params.set('langRestrict', 'pt');
    else if (filters.lingua === 'Inglês') params.set('langRestrict', 'en');

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
