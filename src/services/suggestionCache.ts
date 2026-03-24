import { supabase } from '../lib/supabase';

export interface CachedSuggestion {
  id: string;
  catId: string;
  title: string;
  description: string | null;
  img: string | null;
  rating: number | null;
  year: string | null;
  type: string;
  genre: string;
  genres: string[];
  url: string | null;
  emoji: string;
  sourceApi: string;
  tier: 'mainstream' | 'underground' | 'random';
  extraData?: Record<string, unknown>;
}

// Carrega sugestões do cache para uma categoria
export async function loadCachedSuggestions(
  catId: string,
  limit: number = 200,
  tiers: Array<'mainstream' | 'underground' | 'random'> = ['mainstream', 'underground', 'random']
): Promise<CachedSuggestion[]> {
  try {
    const { data, error } = await supabase
      .from('suggestions_cache')
      .select('*')
      .eq('cat_id', catId)
      .in('tier', tiers)
      .order('last_seen_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      catId: r.cat_id,
      title: r.title,
      description: r.description,
      img: r.img,
      rating: r.rating,
      year: r.year,
      type: r.type,
      genre: r.genre,
      genres: r.genres || [],
      url: r.url,
      emoji: r.emoji || '✦',
      sourceApi: r.source_api,
      tier: r.tier,
      extraData: r.extra_data,
    }));
  } catch { return []; }
}

// Verifica se o cache tem itens suficientes para uma categoria
export async function getCacheCount(catId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('suggestions_cache')
      .select('*', { count: 'exact', head: true })
      .eq('cat_id', catId);
    return count || 0;
  } catch { return 0; }
}

// Verifica quando foi a última actualização do cache
export async function getLastCacheUpdate(catId: string): Promise<Date | null> {
  try {
    const { data } = await supabase
      .from('suggestions_cache')
      .select('cached_at')
      .eq('cat_id', catId)
      .order('cached_at', { ascending: false })
      .limit(1)
      .single();
    return data ? new Date(data.cached_at) : null;
  } catch { return null; }
}
