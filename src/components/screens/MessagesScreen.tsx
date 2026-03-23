import { useState, useEffect, useRef } from 'react';
import {
  loadConversations, loadMessages, sendMessage, sendSuggestion,
  getOrCreateConversation, markAsRead,
} from '../../services/messages';
import type { ChatMessage, Conversation } from '../../types';
import { supabase } from '../../lib/supabase';

interface Props {
  isActive: boolean;
  userId?: string;
  userName?: string;
  onBack: () => void;
  onToast: (msg: string) => void;
  // Se vier de clicar num amigo, abre directamente a conversa
  initialFriendId?: string;
  initialFriendName?: string;
  // Sugestão a partilhar (vem do Suggest)
  pendingSuggestion?: {
    title: string; emoji: string; catId: string;
    cat: string; img?: string | null; type?: string;
  } | null;
  onClearPendingSuggestion?: () => void;
  onUnreadCount?: (count: number) => void;
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = ['#6ab4e0','#e07b9a','#7be0a0','#e0c47b','#c47be0','#e0a07b'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#0B0D12', flexShrink: 0,
    }}>
      {name[0]?.toUpperCase() || '?'}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

export default function MessagesScreen({
  isActive, userId, userName, onBack, onToast,
  initialFriendId, initialFriendName,
  pendingSuggestion, onClearPendingSuggestion,
  onUnreadCount,
}: Props) {
  const [view, setView] = useState<'inbox' | 'conversation'>('inbox');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Carrega inbox
  const loadInbox = async () => {
    if (!userId) return;
    setLoading(true);
    const convs = await loadConversations(userId);
    setConversations(convs);
    const total = convs.reduce((s, c) => s + (c.unreadCount || 0), 0);
    onUnreadCount?.(total);
    setLoading(false);
  };

  useEffect(() => {
    if (isActive && userId) loadInbox();
  }, [isActive, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Abre conversa directamente se vier initialFriendId
  useEffect(() => {
    if (isActive && initialFriendId && userId && initialFriendName) {
      openConversation(initialFriendId, initialFriendName);
    }
  }, [isActive, initialFriendId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll para o fim
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (friendId: string, friendName: string) => {
    if (!userId) return;
    setLoading(true);
    const convId = await getOrCreateConversation(userId, friendId);
    if (!convId) { onToast('Erro ao abrir conversa'); setLoading(false); return; }

    const conv: Conversation = {
      id: convId, user1Id: userId, user2Id: friendId,
      lastMessageAt: new Date().toISOString(),
      friendName, friendUsername: '',
    };
    setActiveConv(conv);

    const msgs = await loadMessages(convId);
    setMessages(msgs);
    await markAsRead(convId, userId);
    setLoading(false);
    setView('conversation');

    // Subscreve Realtime
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    realtimeRef.current = supabase
      .channel(`messages:${convId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, (payload) => {
        const m = payload.new as any;
        const newMsg: ChatMessage = {
          id: m.id, conversationId: m.conversation_id,
          senderId: m.sender_id, text: m.text,
          suggestion: m.suggestion, readAt: m.read_at, createdAt: m.created_at,
        };
        setMessages(prev => {
          if (prev.find(p => p.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (m.sender_id !== userId) markAsRead(convId, userId!);
      })
      .subscribe();
  };

  // Envia sugestão pendente assim que a conversa abre
  useEffect(() => {
    if (view === 'conversation' && activeConv && pendingSuggestion && userId) {
      sendSuggestion(activeConv.id, userId, pendingSuggestion).then(msg => {
        if (msg) setMessages(prev => [...prev, msg]);
        onClearPendingSuggestion?.();
      });
    }
  }, [view, activeConv]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!inputText.trim() || !activeConv || !userId || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText('');
    const msg = await sendMessage(activeConv.id, userId, text);
    if (msg) setMessages(prev => [...prev, msg]);
    setSending(false);
  };

  const handleBack = () => {
    if (view === 'conversation') {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
      setView('inbox');
      setActiveConv(null);
      setMessages([]);
      loadInbox();
    } else {
      onBack();
    }
  };

  if (!isActive) return null;

  // Supress unused warning
  void userName;

  const st = {
    screen: { position: 'fixed' as const, inset: 0, background: '#0B0D12',
      display: 'flex', flexDirection: 'column' as const, zIndex: 20 },
    tb: { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '52px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22,
      fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb' },
    backBtn: { background: 'none', border: 'none', color: '#8a94a8',
      fontSize: 20, cursor: 'pointer', padding: 8 },
  };

  // ── INBOX ──
  if (view === 'inbox') {
    return (
      <div style={st.screen}>
        <div style={st.tb}>
          <button style={st.backBtn} onClick={handleBack}>←</button>
          <div style={st.title}>Mensagens</div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40,
              color: '#8a94a8', fontSize: 13 }}>A carregar…</div>
          )}
          {!loading && conversations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>💬</div>
              <div style={{ color: 'rgba(245,241,235,0.6)', fontSize: 15,
                fontWeight: 500, marginBottom: 8 }}>
                Sem mensagens ainda
              </div>
              <div style={{ color: '#8a94a8', fontSize: 13 }}>
                Vai ao ecrã de Amigos e clica em "Mensagem" para começar
              </div>
            </div>
          )}
          {conversations.map(c => (
            <div
              key={c.id}
              onClick={() => openConversation(
                c.user1Id === userId ? c.user2Id : c.user1Id,
                c.friendName || 'Amigo'
              )}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: (c.unreadCount || 0) > 0
                  ? 'rgba(200,155,60,0.04)' : 'transparent',
              }}
            >
              <Avatar name={c.friendName || '?'} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 3 }}>
                  <div style={{ fontSize: 15, fontWeight: (c.unreadCount || 0) > 0 ? 600 : 400,
                    color: '#f5f1eb' }}>
                    {c.friendName}
                  </div>
                  <div style={{ fontSize: 11, color: '#8a94a8' }}>
                    {timeAgo(c.lastMessageAt)}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#8a94a8',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.lastMessage || 'Sem mensagens'}
                </div>
              </div>
              {(c.unreadCount || 0) > 0 && (
                <div style={{
                  background: '#C89B3C', color: '#0B0D12',
                  borderRadius: '50%', width: 20, height: 20,
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {(c.unreadCount || 0) > 9 ? '9+' : c.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── CONVERSA ──
  return (
    <div style={st.screen}>
      {/* Header */}
      <div style={{ ...st.tb, gap: 10 }}>
        <button style={st.backBtn} onClick={handleBack}>←</button>
        <Avatar name={activeConv?.friendName || '?'} size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f1eb' }}>
            {activeConv?.friendName}
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 20,
            color: '#8a94a8', fontSize: 13 }}>A carregar…</div>
        )}
        {messages.map(m => {
          const isMine = m.senderId === userId;
          return (
            <div key={m.id} style={{
              display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
            }}>
              {m.suggestion ? (
                // Card de sugestão partilhada
                <div style={{
                  maxWidth: '80%', background: isMine
                    ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${isMine ? 'rgba(200,155,60,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 16, padding: '12px 14px',
                }}>
                  {m.suggestion.img && (
                    <img src={m.suggestion.img} alt=""
                      style={{ width: '100%', height: 100, objectFit: 'cover',
                        borderRadius: 10, marginBottom: 8 }} />
                  )}
                  <div style={{ fontSize: 11, color: '#C89B3C', marginBottom: 4,
                    textTransform: 'uppercase', letterSpacing: 1 }}>
                    ✦ {m.suggestion.cat}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f5f1eb' }}>
                    {m.suggestion.emoji} {m.suggestion.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#8a94a8', marginTop: 6 }}>
                    {timeAgo(m.createdAt)}
                  </div>
                </div>
              ) : (
                // Mensagem de texto normal
                <div style={{
                  maxWidth: '75%',
                  background: isMine ? '#C89B3C' : 'rgba(255,255,255,0.08)',
                  color: isMine ? '#0B0D12' : '#f5f1eb',
                  borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '10px 14px', fontSize: 14, lineHeight: 1.4,
                }}>
                  <div>{m.text}</div>
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4,
                    textAlign: 'right' }}>
                    {timeAgo(m.createdAt)}
                    {isMine && m.readAt && ' · lido'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px 32px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 8, alignItems: 'flex-end',
        background: '#0B0D12',
      }}>
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Mensagem…"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '10px 16px',
            color: '#f5f1eb', fontSize: 14, outline: 'none',
            fontFamily: 'Outfit, sans-serif',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
          style={{
            background: inputText.trim() ? '#C89B3C' : 'rgba(255,255,255,0.08)',
            color: inputText.trim() ? '#0B0D12' : '#8a94a8',
            border: 'none', borderRadius: '50%', width: 40, height: 40,
            cursor: inputText.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 16, transition: 'all 0.2s',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
