import { supabase } from '../lib/supabase';
import type { ChatMessage, Conversation } from '../types';

// Encontra ou cria conversa entre dois utilizadores
export async function getOrCreateConversation(userId: string, friendId: string): Promise<string | null> {
  try {
    // Tenta encontrar conversa existente (qualquer ordem)
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(user1_id.eq.${userId},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${userId})`
      )
      .single();

    if (existing) return existing.id;

    // Cria nova conversa
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ user1_id: userId, user2_id: friendId })
      .select('id')
      .single();

    if (error) return null;
    return created?.id || null;
  } catch { return null; }
}

// Carrega lista de conversas do utilizador
export async function loadConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, user1_id, user2_id, last_message, last_message_at')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error || !data) return [];

    // Enriquecer com nomes dos amigos
    const friendIds = data.map((c: any) => c.user1_id === userId ? c.user2_id : c.user1_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, username')
      .in('id', friendIds);

    const profileMap: Record<string, { name: string; username: string }> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = { name: p.name, username: p.username };
    });

    // Contar mensagens não lidas (query agregada)
    const convIds = data.map((c: any) => c.id);
    const unreadCounts: Record<string, number> = {};
    if (convIds.length > 0) {
      const { data: unreadData } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .neq('sender_id', userId)
        .is('read_at', null);
      (unreadData || []).forEach((m: any) => {
        unreadCounts[m.conversation_id] = (unreadCounts[m.conversation_id] || 0) + 1;
      });
    }

    return data.map((c: any) => {
      const friendId = c.user1_id === userId ? c.user2_id : c.user1_id;
      const friend = profileMap[friendId];
      return {
        id: c.id,
        user1Id: c.user1_id,
        user2Id: c.user2_id,
        lastMessage: c.last_message,
        lastMessageAt: c.last_message_at,
        friendName: friend?.name || 'Utilizador',
        friendUsername: friend?.username || '',
        unreadCount: unreadCounts[c.id] || 0,
      };
    });
  } catch { return []; }
}

// Carrega mensagens de uma conversa
export async function loadMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, text, suggestion, read_at, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error || !data) return [];

    return data.map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      text: m.text,
      suggestion: m.suggestion,
      readAt: m.read_at,
      createdAt: m.created_at,
    }));
  } catch { return []; }
}

// Envia mensagem de texto
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, text })
      .select()
      .single();

    if (error || !data) return null;

    // Actualiza last_message na conversa
    await supabase.from('conversations').update({
      last_message: text.startsWith('MATCH_INVITE:')
        ? 'Convite para Match'
        : text.substring(0, 80),
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);

    return {
      id: data.id, conversationId: data.conversation_id,
      senderId: data.sender_id, text: data.text,
      readAt: data.read_at, createdAt: data.created_at,
    };
  } catch { return null; }
}

// Envia sugestão como mensagem
export async function sendSuggestion(
  conversationId: string,
  senderId: string,
  suggestion: ChatMessage['suggestion']
): Promise<ChatMessage | null> {
  try {
    const preview = `✦ ${suggestion?.emoji} ${suggestion?.title}`;
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, suggestion })
      .select()
      .single();

    if (error || !data) return null;

    await supabase.from('conversations').update({
      last_message: preview,
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId);

    return {
      id: data.id, conversationId: data.conversation_id,
      senderId: data.sender_id, suggestion: data.suggestion,
      readAt: data.read_at, createdAt: data.created_at,
    };
  } catch { return null; }
}

// Marca mensagens como lidas
export async function markAsRead(conversationId: string, userId: string): Promise<void> {
  try {
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);
  } catch { /* silencioso */ }
}

// Total de mensagens não lidas (para badge)
export async function getTotalUnread(userId: string): Promise<number> {
  try {
    const convs = await loadConversations(userId);
    return convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  } catch { return 0; }
}
