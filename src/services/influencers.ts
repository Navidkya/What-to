import { supabase } from '../lib/supabase';

export interface InfluencerProfile {
  id: string;
  userId: string;
  name: string;
  handle: string;
  bio: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'other';
  tier: 'base' | 'silver' | 'gold';
  allowedCats: string[];
  status: 'active' | 'pending';
  createdAt: string;
}

export interface InfluencerSuggestion {
  id: string;
  influencerId: string;
  influencerName: string;
  influencerHandle: string;
  influencerTier: 'base' | 'silver' | 'gold';
  title: string;
  desc: string;
  emoji: string;
  catId: string;
  cat: string;
  type: string;
  genre: string;
  img: string | null;
  rating: number | null;
  year: string | null;
  duration: string | null;
  expiresAt: string;
  active: boolean;
  createdAt: string;
}

export const TIER_CONFIG = {
  base:   { maxActive: 3,  durationDays: 7,  maxCats: 2,  label: 'Base',   slots: 1 },
  silver: { maxActive: 8,  durationDays: 30, maxCats: 4,  label: 'Silver', slots: 2 },
  gold:   { maxActive: 20, durationDays: 90, maxCats: 8,  label: 'Gold',   slots: 3 },
};

export async function loadInfluencerProfile(userId: string): Promise<InfluencerProfile | null> {
  const { data } = await supabase
    .from('influencers')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  if (!data) return null;
  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: data.name as string,
    handle: data.handle as string,
    bio: (data.bio as string) || '',
    platform: (data.platform as InfluencerProfile['platform']) || 'instagram',
    tier: (data.tier as InfluencerProfile['tier']) || 'base',
    allowedCats: (data.allowed_cats as string[]) || [],
    status: data.status as InfluencerProfile['status'],
    createdAt: data.created_at as string,
  };
}

export async function loadMySuggestions(influencerId: string): Promise<InfluencerSuggestion[]> {
  const { data } = await supabase
    .from('influencer_suggestions')
    .select('*, influencers(name, handle, tier)')
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(mapRow);
}

export async function loadActiveSuggestions(): Promise<InfluencerSuggestion[]> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('influencer_suggestions')
    .select('*, influencers(name, handle, tier)')
    .eq('active', true)
    .gt('expires_at', now)
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(mapRow);
}

export async function createSuggestion(
  influencerId: string,
  tier: 'base' | 'silver' | 'gold',
  payload: Omit<InfluencerSuggestion, 'id' | 'influencerId' | 'influencerName' | 'influencerHandle' | 'influencerTier' | 'expiresAt' | 'active' | 'createdAt'>
): Promise<{ ok: boolean; error?: string }> {
  const active = await loadMySuggestions(influencerId);
  const activeCount = active.filter(s => s.active && new Date(s.expiresAt) > new Date()).length;
  const limit = TIER_CONFIG[tier].maxActive;
  if (activeCount >= limit) {
    return { ok: false, error: `Limite de ${limit} sugestões activas para o tier ${TIER_CONFIG[tier].label}` };
  }
  const expiresAt = new Date(Date.now() + TIER_CONFIG[tier].durationDays * 86400000).toISOString();
  const { error } = await supabase.from('influencer_suggestions').insert({
    influencer_id: influencerId,
    title: payload.title,
    description: payload.desc,
    emoji: payload.emoji,
    cat_id: payload.catId,
    cat: payload.cat,
    type: payload.type,
    genre: payload.genre,
    img: payload.img,
    rating: payload.rating,
    year: payload.year,
    duration: payload.duration,
    expires_at: expiresAt,
    active: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleSuggestion(id: string, active: boolean): Promise<void> {
  await supabase.from('influencer_suggestions').update({ active }).eq('id', id);
}

export async function deleteSuggestion(id: string): Promise<void> {
  await supabase.from('influencer_suggestions').delete().eq('id', id);
}

export async function submitApplication(data: {
  name: string; handle: string; platform: string; message: string; email: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('creator_applications').insert({
    name: data.name,
    handle: data.handle,
    platform: data.platform,
    message: data.message,
    email: data.email,
    status: 'pending',
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getMyUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

function mapRow(row: Record<string, unknown>): InfluencerSuggestion {
  const inf = row.influencers as Record<string, unknown> | null;
  return {
    id: row.id as string,
    influencerId: row.influencer_id as string,
    influencerName: (inf?.name as string) || '',
    influencerHandle: (inf?.handle as string) || '',
    influencerTier: ((inf?.tier as string) || 'base') as 'base' | 'silver' | 'gold',
    title: row.title as string,
    desc: (row.description as string) || '',
    emoji: (row.emoji as string) || '✦',
    catId: row.cat_id as string,
    cat: row.cat as string,
    type: (row.type as string) || '',
    genre: (row.genre as string) || '',
    img: (row.img as string) || null,
    rating: (row.rating as number) || null,
    year: (row.year as string) || null,
    duration: (row.duration as string) || null,
    expiresAt: row.expires_at as string,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}
