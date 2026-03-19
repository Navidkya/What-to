const FSQ_BASE = 'https://api.foursquare.com/v3';
const FSQ_CACHE = 'wt_fsq_';
const CACHE_TTL = 60 * 60 * 1000; // 1 hora (locais mudam menos)

export interface FSQItem {
  id: string;
  title: string;
  category: string;
  coverUrl: string | null;
  rating: number | null;
  address: string;
  distance: number | null; // metros
  url: string;
  lat: number;
  lng: number;
  mapsUrl: string;
}

export interface FSQFilters {
  lat: number;
  lng: number;
  radius: number;    // km → converte para metros
  tipo: string[];    // ex: ['Restaurante', 'Bar', 'Museu']
  custo: 'gratuito' | 'baixo' | 'qualquer';
}

// Categorias Foursquare por tipo
const FSQ_CATEGORY_MAP: Record<string, string> = {
  'Restaurante': '13065',
  'Bar': '13003',
  'Museu': '10027',
  'Miradouro': '16032',
  'Natureza': '16000',
  'Mercado': '17069',
  'Galeria': '10004',
  'Experiência': '18000',
  'Histórico': '16020',
  'Cultural': '10000',
};

function cacheGet<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(FSQ_CACHE + key);
    if (!v) return null;
    const parsed = JSON.parse(v) as { ts: number; data: T };
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch { return null; }
}

function cacheSet<T>(key: string, data: T) {
  try {
    localStorage.setItem(FSQ_CACHE + key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

export async function discoverFSQ(filters: FSQFilters): Promise<FSQItem[]> {
  const apiKey = import.meta.env.VITE_FOURSQUARE_KEY as string;
  if (!apiKey) return [];

  const cacheKey = JSON.stringify(filters);
  const cached = cacheGet<FSQItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const categoryIds = filters.tipo.length > 0
      ? filters.tipo.map(t => FSQ_CATEGORY_MAP[t]).filter(Boolean).join(',')
      : Object.values(FSQ_CATEGORY_MAP).slice(0, 5).join(',');

    const params = new URLSearchParams();
    params.set('ll', `${filters.lat},${filters.lng}`);
    params.set('radius', String(Math.min(filters.radius * 1000, 50000)));
    params.set('categories', categoryIds);
    params.set('limit', '20');
    params.set('sort', 'RATING');
    params.set('fields', 'fsq_id,name,categories,rating,location,distance,photos,website,geocodes');

    if (filters.custo === 'gratuito') {
      params.set('price', '1');
    } else if (filters.custo === 'baixo') {
      params.set('price', '1,2');
    }

    const res = await fetch(`${FSQ_BASE}/places/search?${params.toString()}`, {
      headers: {
        'Authorization': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return [];

    const data = await res.json() as {
      results?: Array<{
        fsq_id: string;
        name: string;
        categories?: Array<{ name: string }>;
        rating?: number;
        location?: { formatted_address?: string };
        distance?: number;
        website?: string;
        geocodes?: { main?: { latitude: number; longitude: number } };
        photos?: Array<{ prefix: string; suffix: string }>;
      }>;
    };

    const items: FSQItem[] = (data.results || []).map(r => {
      const lat = r.geocodes?.main?.latitude || filters.lat;
      const lng = r.geocodes?.main?.longitude || filters.lng;
      const photo = r.photos?.[0];
      const coverUrl = photo ? `${photo.prefix}original${photo.suffix}` : null;

      return {
        id: r.fsq_id,
        title: r.name,
        category: r.categories?.[0]?.name || 'Local',
        coverUrl,
        rating: r.rating ? Math.round(r.rating * 10) / 10 : null,
        address: r.location?.formatted_address || '',
        distance: r.distance || null,
        url: r.website || `https://foursquare.com/v/${r.fsq_id}`,
        lat,
        lng,
        mapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
      };
    });

    cacheSet(cacheKey, items);
    return items;
  } catch {
    return [];
  }
}
