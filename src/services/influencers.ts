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

// ── Invite codes ──────────────────────────────────────────────────────────────

export async function verifyInviteCode(code: string): Promise<{
  ok: boolean;
  tier?: 'base' | 'silver' | 'gold';
  name?: string;
  handle?: string;
  platform?: string;
  error?: string;
}> {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('used', false)
    .single();
  if (error || !data) return { ok: false, error: 'Código inválido ou já utilizado' };
  return {
    ok: true,
    tier: data.tier as 'base' | 'silver' | 'gold',
    name: data.name as string,
    handle: data.handle as string,
    platform: data.platform as string,
  };
}

export async function activateInviteCode(
  code: string,
  userId: string,
  tier: 'base' | 'silver' | 'gold',
  name: string,
  handle: string,
  platform: string,
): Promise<{ ok: boolean; error?: string }> {
  const allCats = ['watch', 'eat', 'read', 'listen', 'play', 'learn', 'visit', 'do'];
  const allowedCats =
    tier === 'gold' ? allCats :
    tier === 'silver' ? ['watch', 'eat', 'read', 'listen'] :
    ['watch', 'eat'];

  const { error: profError } = await supabase.from('influencers').insert({
    user_id: userId,
    name,
    handle,
    platform,
    tier,
    allowed_cats: allowedCats,
    status: 'active',
    invite_code: code.toUpperCase().trim(),
  });
  if (profError) return { ok: false, error: profError.message };

  await supabase.from('invite_codes').update({
    used: true,
    used_by: userId,
    used_at: new Date().toISOString(),
  }).eq('code', code.toUpperCase().trim());

  return { ok: true };
}

export async function createInviteCode(payload: {
  code: string;
  name: string;
  handle: string;
  tier: 'base' | 'silver' | 'gold';
  platform: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('invite_codes').insert({
    code: payload.code.toUpperCase().trim(),
    name: payload.name,
    handle: payload.handle,
    tier: payload.tier,
    platform: payload.platform,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface InviteCode {
  id: string;
  code: string;
  name: string;
  handle: string;
  tier: string;
  platform: string;
  used: boolean;
  usedAt: string | null;
  usedBy: string | undefined;
  createdAt: string;
}

export async function listInviteCodes(): Promise<InviteCode[]> {
  const { data } = await supabase
    .from('invite_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(r => ({
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    handle: r.handle as string,
    tier: r.tier as string,
    platform: r.platform as string,
    used: r.used as boolean,
    usedAt: (r.used_at as string) || null,
    usedBy: (r.used_by as string) || undefined,
    createdAt: r.created_at as string,
  }));
}

export async function updateInviteCode(id: string, payload: {
  code?: string;
  name?: string;
  handle?: string;
  tier?: 'base' | 'silver' | 'gold';
  platform?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('invite_codes').update(payload).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function removeInviteCode(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('invite_codes').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
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
