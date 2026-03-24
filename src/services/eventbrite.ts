// Eventbrite API — eventos locais para Visitar e Fazer

const EB_BASE = 'https://www.eventbriteapi.com/v3';

export interface EventbriteItem {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  url: string;
  startDate: string;
  venue: string;
  city: string;
  isFree: boolean;
  category: string;
  type: 'Evento';
}

export interface EventbriteFilters {
  lat?: number;
  lng?: number;
  radius?: number; // km
  categories?: string[];
  isFree?: boolean;
  limit?: number;
}

const EB_CATEGORY_MAP: Record<string, string> = {
  'Música': '103',
  'Arte': '105',
  'Desporto': '108',
  'Tecnologia': '102',
  'Comida': '110',
  'Cinema': '104',
  'Teatro': '105',
  'Negócios': '101',
  'Educação': '102',
  'Cultura': '105',
};

export async function discoverEventbrite(filters: EventbriteFilters): Promise<EventbriteItem[]> {
  const token = import.meta.env.VITE_EVENTBRITE_TOKEN;
  if (!token) return [];

  try {
    const params = new URLSearchParams();
    params.set('token', token);
    params.set('expand', 'venue,category');
    params.set('page_size', String(filters.limit || 50));
    params.set('sort_by', 'date');
    params.set('start_date.keyword', 'today');

    if (filters.lat && filters.lng) {
      params.set('location.latitude', String(filters.lat));
      params.set('location.longitude', String(filters.lng));
      params.set('location.within', `${filters.radius || 10}km`);
    }

    if (filters.isFree) {
      params.set('price', 'free');
    }

    if (filters.categories && filters.categories.length > 0) {
      const catIds = filters.categories
        .map(c => EB_CATEGORY_MAP[c])
        .filter(Boolean);
      if (catIds.length > 0) {
        params.set('categories', catIds.join(','));
      }
    }

    const res = await fetch(`${EB_BASE}/events/search/?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json() as {
      events?: Array<{
        id: string;
        name: { text: string };
        description?: { text: string };
        logo?: { url: string };
        url: string;
        start: { local: string };
        venue?: { name: string; address?: { city: string } };
        is_free: boolean;
        category?: { name: string };
      }>;
    };

    return (data.events || []).map(e => ({
      id: e.id,
      title: e.name.text,
      description: e.description?.text?.substring(0, 150) || '',
      coverUrl: e.logo?.url || null,
      url: e.url,
      startDate: e.start.local,
      venue: e.venue?.name || '',
      city: e.venue?.address?.city || '',
      isFree: e.is_free,
      category: e.category?.name || 'Evento',
      type: 'Evento' as const,
    }));
  } catch { return []; }
}
