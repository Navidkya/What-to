import { supabase } from '../lib/supabase';

export interface MatchSession {
  id: string;
  createdBy: string;
  joinedBy: string | null;
  status: 'waiting' | 'active' | 'done';
  catId: string;
  itemTitles: string[];
  currentIndex: number;
  createdAt: string;
}

export interface MatchVote {
  id: string;
  sessionId: string;
  userId: string;
  itemTitle: string;
  vote: boolean;
  createdAt: string;
}

function mapSession(r: any): MatchSession {
  return {
    id: r.id,
    createdBy: r.created_by,
    joinedBy: r.joined_by || null,
    status: r.status,
    catId: r.cat_id,
    itemTitles: r.item_titles || [],
    currentIndex: r.current_index || 0,
    createdAt: r.created_at,
  };
}

// Cria nova sessão com lista de sugestões
export async function createMatchSession(
  userId: string,
  catId: string,
  itemTitles: string[]
): Promise<MatchSession | null> {
  try {
    const { data, error } = await supabase
      .from('match_sessions')
      .insert({
        created_by: userId,
        cat_id: catId,
        item_titles: itemTitles,
        status: 'waiting',
      })
      .select()
      .single();
    if (error || !data) return null;
    return mapSession(data);
  } catch { return null; }
}

export async function joinMatchSession(
  sessionId: string,
  userId: string
): Promise<MatchSession | null> {
  try {
    // Tenta match exacto por ID completo (sem filtro de status — aceita waiting OU active)
    const { data: exact } = await supabase
      .from('match_sessions')
      .select('*')
      .eq('id', sessionId)
      .in('status', ['waiting', 'active'])
      .maybeSingle();

    const found = exact ?? await (async () => {
      // Fallback: prefixo para código curto manual (só waiting)
      const { data } = await supabase
        .from('match_sessions')
        .select('*')
        .ilike('id', `${sessionId.toLowerCase()}%`)
        .eq('status', 'waiting')
        .maybeSingle();
      return data;
    })();

    if (!found) return null;

    // Se já está active e joined_by é este user, apenas retorna a sessão
    if (found.status === 'active' && found.joined_by === userId) {
      return mapSession(found);
    }

    // Se já está active e joined_by é outro user, erro
    if (found.status === 'active' && found.joined_by && found.joined_by !== userId) {
      return null;
    }

    const { data, error } = await supabase
      .from('match_sessions')
      .update({ joined_by: userId, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', found.id)
      .select()
      .single();
    if (error || !data) return null;
    return mapSession(data);
  } catch { return null; }
}

// Carrega sessão por ID
export async function getMatchSession(sessionId: string): Promise<MatchSession | null> {
  try {
    const { data, error } = await supabase
      .from('match_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (error || !data) return null;
    return mapSession(data);
  } catch { return null; }
}

// Submete voto
export async function submitMatchVote(
  sessionId: string,
  userId: string,
  itemTitle: string,
  vote: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('match_votes')
      .upsert({
        session_id: sessionId,
        user_id: userId,
        item_title: itemTitle,
        vote,
      }, { onConflict: 'session_id,user_id,item_title' });
    return !error;
  } catch { return false; }
}

// Carrega todos os votos de uma sessão
export async function getMatchVotes(sessionId: string): Promise<MatchVote[]> {
  try {
    const { data, error } = await supabase
      .from('match_votes')
      .select('*')
      .eq('session_id', sessionId);
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      sessionId: r.session_id,
      userId: r.user_id,
      itemTitle: r.item_title,
      vote: r.vote,
      createdAt: r.created_at,
    }));
  } catch { return []; }
}

// Avança para o próximo item
export async function advanceMatchIndex(
  sessionId: string,
  newIndex: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('match_sessions')
      .update({ current_index: newIndex, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    return !error;
  } catch { return false; }
}

// Termina sessão
export async function endMatchSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('match_sessions')
      .update({ status: 'done', updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    return !error;
  } catch { return false; }
}

// Subscreve mudanças na sessão (Realtime)
export function listenMatchSession(
  sessionId: string,
  onUpdate: (session: MatchSession) => void
): () => void {
  const channel = supabase
    .channel(`match-session-${sessionId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'match_sessions',
      filter: `id=eq.${sessionId}`,
    }, payload => {
      onUpdate(mapSession(payload.new));
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// Subscreve novos votos na sessão (Realtime)
export function listenMatchVotes(
  sessionId: string,
  onNewVote: (vote: MatchVote) => void
): () => void {
  const channel = supabase
    .channel(`match-votes-${sessionId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'match_votes',
      filter: `session_id=eq.${sessionId}`,
    }, payload => {
      const r = payload.new as any;
      onNewVote({
        id: r.id,
        sessionId: r.session_id,
        userId: r.user_id,
        itemTitle: r.item_title,
        vote: r.vote,
        createdAt: r.created_at,
      });
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// Busca sessão activa do utilizador (criada ou onde entrou, status waiting ou active)
export async function getActiveSessionForUser(userId: string): Promise<MatchSession | null> {
  try {
    const { data } = await supabase
      .from('match_sessions')
      .select('*')
      .or(`created_by.eq.${userId},joined_by.eq.${userId}`)
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? mapSession(data) : null;
  } catch { return null; }
}

// Busca sessão por código curto (sem join)
export async function getMatchSessionByShortCode(
  shortCode: string
): Promise<MatchSession | null> {
  try {
    const { data, error } = await supabase
      .from('match_sessions')
      .select('*')
      .ilike('id', `${shortCode.toLowerCase()}%`)
      .eq('status', 'waiting')
      .maybeSingle();
    if (error || !data) return null;
    return mapSession(data);
  } catch { return null; }
}
