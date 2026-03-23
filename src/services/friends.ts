import { supabase } from '../lib/supabase';

export interface FriendProfile {
  id: string;
  name: string;
  platforms?: string[];
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  profile?: FriendProfile;
}

// Pesquisa utilizadores por nome (exclui o próprio)
export async function searchUsers(query: string, currentUserId: string): Promise<FriendProfile[]> {
  if (!query.trim() || query.length < 2) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, platforms')
      .ilike('name', `%${query}%`)
      .neq('id', currentUserId)
      .limit(10);
    if (error) return [];
    return (data || []).map(p => ({ id: p.id, name: p.name, platforms: p.platforms }));
  } catch { return []; }
}

// Envia pedido de amizade
export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('friendships').insert({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: 'pending',
    });
    return !error;
  } catch { return false; }
}

// Aceita pedido de amizade
export async function acceptFriendRequest(friendshipId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    return !error;
  } catch { return false; }
}

// Recusa pedido de amizade
export async function rejectFriendRequest(friendshipId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('friendships')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    return !error;
  } catch { return false; }
}

// Remove amigo
export async function removeFriend(friendshipId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    return !error;
  } catch { return false; }
}

// Carrega lista de amigos aceites
export async function loadFriends(userId: string): Promise<Array<FriendProfile & { friendshipId: string }>> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');
    if (error || !data) return [];

    const friendIds = data.map(f => f.requester_id === userId ? f.addressee_id : f.requester_id);
    const friendshipMap: Record<string, string> = {};
    data.forEach(f => {
      const fid = f.requester_id === userId ? f.addressee_id : f.requester_id;
      friendshipMap[fid] = f.id;
    });

    if (!friendIds.length) return [];
    const { data: profiles } = await supabase
      .from('profiles').select('id, name, platforms').in('id', friendIds);

    return (profiles || []).map(p => ({
      id: p.id, name: p.name, platforms: p.platforms,
      friendshipId: friendshipMap[p.id],
    }));
  } catch { return []; }
}

// Carrega pedidos pendentes recebidos
export async function loadPendingRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id, status, created_at')
      .eq('addressee_id', userId)
      .eq('status', 'pending');
    if (error || !data) return [];

    const requesterIds = data.map(f => f.requester_id);
    if (!requesterIds.length) return [];
    const { data: profiles } = await supabase
      .from('profiles').select('id, name').in('id', requesterIds);

    const profileMap: Record<string, FriendProfile> = {};
    (profiles || []).forEach(p => { profileMap[p.id] = { id: p.id, name: p.name }; });

    return data.map(f => ({
      id: f.id,
      requesterId: f.requester_id,
      addresseeId: f.addressee_id,
      status: f.status,
      createdAt: f.created_at,
      profile: profileMap[f.requester_id],
    }));
  } catch { return []; }
}

// Verifica se já existe relação entre dois utilizadores
export async function getFriendshipStatus(userId: string, targetId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'accepted'> {
  try {
    const { data } = await supabase
      .from('friendships')
      .select('requester_id, status')
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${userId})`)
      .single();
    if (!data) return 'none';
    if (data.status === 'accepted') return 'accepted';
    if (data.status === 'pending') {
      return data.requester_id === userId ? 'pending_sent' : 'pending_received';
    }
    return 'none';
  } catch { return 'none'; }
}
