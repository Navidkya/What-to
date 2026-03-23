import { supabase } from '../lib/supabase';

export interface FeedEvent {
  id: string;
  userId: string;
  displayName: string;
  catId: string;
  catName: string;
  title: string;
  emoji: string;
  actionType: 'started' | 'marked_today' | 'finished' | 'recommended';
  img: string | null;
  rating: number | null;
  isPublic: boolean;
  createdAt: string;
}

// Publica um evento no feed (silencioso — falha sem quebrar a app)
export async function publishFeedEvent(params: {
  userId: string;
  displayName: string;
  catId: string;
  catName: string;
  title: string;
  emoji: string;
  actionType: FeedEvent['actionType'];
  img?: string | null;
  rating?: number | null;
}): Promise<void> {
  try {
    await supabase.from('feed_events').insert({
      user_id: params.userId,
      display_name: params.displayName,
      cat_id: params.catId,
      cat_name: params.catName,
      title: params.title,
      emoji: params.emoji,
      action_type: params.actionType,
      img: params.img ?? null,
      rating: params.rating ?? null,
      is_public: true,
    });
  } catch { /* silencioso */ }
}

// Busca eventos recentes públicos (feed de tendências + amigos)
export async function loadFeedEvents(limit = 30): Promise<FeedEvent[]> {
  try {
    const { data, error } = await supabase
      .from('feed_events')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map(r => ({
      id: r.id,
      userId: r.user_id,
      displayName: r.display_name,
      catId: r.cat_id,
      catName: r.cat_name,
      title: r.title,
      emoji: r.emoji,
      actionType: r.action_type,
      img: r.img,
      rating: r.rating,
      isPublic: r.is_public,
      createdAt: r.created_at,
    }));
  } catch { return []; }
}

// Busca tendências agregadas (títulos mais aceites nos últimos 7 dias)
export async function loadTrending(catId?: string, limit = 10): Promise<Array<{
  title: string; emoji: string; catId: string; catName: string; count: number; img: string | null;
}>> {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from('feed_events')
      .select('title, emoji, cat_id, cat_name, img')
      .gte('created_at', since)
      .in('action_type', ['started', 'recommended']);
    if (catId) query = query.eq('cat_id', catId);
    const { data, error } = await query.limit(200);
    if (error || !data) return [];
    // Agrega por título
    const counts: Record<string, { title: string; emoji: string; catId: string; catName: string; count: number; img: string | null }> = {};
    for (const r of data) {
      const key = r.cat_id + ':' + r.title;
      if (!counts[key]) counts[key] = { title: r.title, emoji: r.emoji, catId: r.cat_id, catName: r.cat_name, count: 0, img: r.img };
      counts[key].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, limit);
  } catch { return []; }
}

// Desliga partilha pública para um utilizador (actualiza todos os seus eventos)
export async function setFeedPrivacy(userId: string, isPublic: boolean): Promise<void> {
  try {
    await supabase.from('feed_events').update({ is_public: isPublic }).eq('user_id', userId);
  } catch { /* silencioso */ }
}
