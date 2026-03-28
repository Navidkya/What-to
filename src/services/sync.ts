import { supabase } from '../lib/supabase';
import type {
  Profile, HistoryEntry, TrackingMap, PrefsMap,
  UserList, EatPrefs, WatchPrefs, ListenPrefs, ReadPrefs,
  PlayPrefs, LearnPrefs, VisitPrefs, DoPrefs, PermanentPrefs
} from '../types';

// ─── PROFILE ────────────────────────────────────────────────
export async function syncProfileToSupabase(userId: string, profile: Profile) {
  await supabase.from('profiles').upsert({
    id: userId,
    name: profile.name,
    platforms: profile.platforms,
    blocked_platforms: profile.blockedPlatforms || [],
    location: profile.location || null,
    username: profile.username || null,
  });
}

export async function loadProfileFromSupabase(userId: string): Promise<Partial<Profile> | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!data) return null;
  return {
    name: data.name || '',
    platforms: data.platforms || [],
    blockedPlatforms: data.blocked_platforms || [],
    location: data.location || undefined,
    username: data.username || undefined,
  };
}

// ─── PREFS ──────────────────────────────────────────────────
type AllPrefs = {
  eat?: EatPrefs; watch?: WatchPrefs; listen?: ListenPrefs;
  read?: ReadPrefs; play?: PlayPrefs; learn?: LearnPrefs;
  visit?: VisitPrefs; do?: DoPrefs; permanent?: PermanentPrefs;
  prefs?: PrefsMap;
};

export async function syncPrefsToSupabase(userId: string, prefs: AllPrefs) {
  const rows = Object.entries(prefs).map(([category, data]) => ({
    user_id: userId,
    category,
    prefs: data,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length > 0) {
    await supabase.from('category_prefs').upsert(rows, { onConflict: 'user_id,category' });
  }
}

export async function loadPrefsFromSupabase(userId: string): Promise<AllPrefs> {
  const { data } = await supabase.from('category_prefs').select('*').eq('user_id', userId);
  if (!data) return {};
  const result: AllPrefs = {};
  data.forEach((row: { category: string; prefs: unknown }) => {
    (result as Record<string, unknown>)[row.category] = row.prefs;
  });
  return result;
}

// ─── HISTORY ────────────────────────────────────────────────
let _syncingHistory = false;

export async function syncHistoryToSupabase(userId: string, history: HistoryEntry[]) {
  if (_syncingHistory) return;
  _syncingHistory = true;
  try {
    await supabase.from('history').delete().eq('user_id', userId);
    if (history.length === 0) return;
    const rows = history.slice(0, 200).map(h => ({
      user_id: userId,
      cat_id: h.catId,
      title: h.title,
      emoji: h.emoji,
      cat: h.cat,
      date: h.date,
      type: h.type,
      genre: h.genre,
      action: h.action,
    }));
    await supabase.from('history').insert(rows);
  } finally {
    _syncingHistory = false;
  }
}

export async function loadHistoryFromSupabase(userId: string): Promise<HistoryEntry[]> {
  const { data } = await supabase
    .from('history')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(200);
  if (!data) return [];
  const seen = new Set<string>();
  const deduplicated = data.filter((h: Record<string, string>) => {
    const key = `${h.title}-${h.cat}-${(h.date || '').substring(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return deduplicated.map((h: Record<string, string>) => ({
    catId: h.cat_id,
    title: h.title,
    emoji: h.emoji,
    cat: h.cat,
    date: h.date,
    type: h.type,
    genre: h.genre,
    action: h.action as HistoryEntry['action'],
  }));
}

// ─── TRACKING ───────────────────────────────────────────────
export async function syncTrackingToSupabase(userId: string, tracking: TrackingMap) {
  await supabase.from('tracking').delete().eq('user_id', userId);
  const entries = Object.entries(tracking);
  if (entries.length === 0) return;
  const rows = entries.map(([key, data]) => ({
    user_id: userId,
    key,
    data,
  }));
  await supabase.from('tracking').insert(rows);
}

export async function loadTrackingFromSupabase(userId: string): Promise<TrackingMap> {
  const { data } = await supabase.from('tracking').select('*').eq('user_id', userId);
  if (!data) return {};
  const result: TrackingMap = {};
  data.forEach((row: { key: string; data: unknown }) => {
    result[row.key] = row.data as TrackingMap[string];
  });
  return result;
}

// ─── LISTS ──────────────────────────────────────────────────
export async function syncListsToSupabase(userId: string, lists: UserList[]) {
  await supabase.from('user_lists').delete().eq('user_id', userId);
  if (lists.length === 0) return;

  for (const list of lists) {
    const { data: insertedList } = await supabase
      .from('user_lists')
      .insert({ id: list.id, user_id: userId, name: list.name, emoji: list.emoji, created_at: list.createdAt })
      .select()
      .single();

    if (insertedList && list.items.length > 0) {
      const itemRows = list.items.map(item => ({
        id: item.id,
        list_id: list.id,
        user_id: userId,
        title: item.title,
        emoji: item.emoji,
        cat_id: item.catId,
        cat: item.cat,
        type: item.type,
        added_at: item.addedAt,
      }));
      await supabase.from('list_items').insert(itemRows);
    }
  }
}

export async function loadListsFromSupabase(userId: string): Promise<UserList[]> {
  const { data: lists } = await supabase
    .from('user_lists')
    .select('*, list_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (!lists) return [];

  return lists.map((list: Record<string, unknown>) => ({
    id: list.id as string,
    name: list.name as string,
    emoji: list.emoji as string,
    createdAt: list.created_at as string,
    items: ((list.list_items as Record<string, unknown>[]) || []).map(item => ({
      id: item.id as string,
      title: item.title as string,
      emoji: item.emoji as string,
      catId: item.cat_id as string,
      cat: item.cat as string,
      type: item.type as string,
      addedAt: item.added_at as string,
    })),
  }));
}

// ─── LOAD ALL (após login) ───────────────────────────────────
export async function loadAllFromSupabase(userId: string) {
  const [profile, prefs, history, tracking, lists] = await Promise.all([
    loadProfileFromSupabase(userId),
    loadPrefsFromSupabase(userId),
    loadHistoryFromSupabase(userId),
    loadTrackingFromSupabase(userId),
    loadListsFromSupabase(userId),
  ]);
  return { profile, prefs, history, tracking, lists };
}
