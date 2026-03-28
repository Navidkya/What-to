import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import { Users } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { Screen, Conversation } from '../../types';
import {
  sendFriendRequest, acceptFriendRequest,
  rejectFriendRequest, removeFriend, loadFriends, loadPendingRequests,
  getFriendshipStatus,
} from '../../services/friends';
import type { FriendProfile, FriendRequest } from '../../services/friends';
import { loadConversations, loadMessages } from '../../services/messages';
import { supabase } from '../../lib/supabase';
import { trackAsync } from '../../services/analytics';

interface FriendsProps {
  isActive: boolean;
  onNav: (screen: Screen) => void;
  onToast: (msg: string) => void;
  userId?: string;
  onPendingCount?: (count: number) => void;
  onOpenMessages?: (friendId: string, friendName: string) => void;
  unreadMessages?: number;
  onNavigateMatch?: (sessionId: string) => void;
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const colors = ['#6ab4e0', '#e07b9a', '#7be0a0', '#e0c47b', '#c47be0', '#e0a07b'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.4,
      fontWeight: 700, color: '#0B0D12', flexShrink: 0,
    }}>
      {name[0]?.toUpperCase() || '?'}
    </div>
  );
}

function MessagesInline({ userId, onOpenMessages }: {
  userId?: string;
  onOpenMessages?: (friendId: string, friendName: string) => void;
}) {
  const [convs, setConvs] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!userId) return;
    setLoading(true);
    loadConversations(userId).then(c => { setConvs(c); setLoading(false); });
  }, [userId]);
  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'agora';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  }
  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#8a94a8', fontSize: 13 }}>
      A carregar…
    </div>
  );
  if (!convs.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8a94a8', fontSize: 13 }}>
      Sem mensagens ainda.<br/>
      <span style={{ fontSize: 12 }}>Vai a "Os meus amigos" e clica numa pessoa para enviar mensagem.</span>
    </div>
  );
  return (
    <div>
      {convs.map(c => {
        const friendId = c.user1Id === userId ? c.user2Id : c.user1Id;
        return (
          <div key={c.id}
            onClick={() => onOpenMessages?.(friendId, c.friendName || 'Amigo')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer',
              background: (c.unreadCount || 0) > 0 ? 'rgba(200,155,60,0.04)' : 'transparent',
              borderRadius: 8, marginBottom: 2,
            }}
          >
            <Avatar name={c.friendName || '?'} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ fontSize: 15, fontWeight: (c.unreadCount || 0) > 0 ? 600 : 400, color: '#f5f1eb' }}>
                  {c.friendName}
                </div>
                <div style={{ fontSize: 11, color: '#8a94a8' }}>{timeAgo(c.lastMessageAt)}</div>
              </div>
              <div style={{ fontSize: 13, color: '#8a94a8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.lastMessage || 'Sem mensagens'}
              </div>
            </div>
            {(c.unreadCount || 0) > 0 && (
              <div style={{
                background: '#C89B3C', color: '#0B0D12', borderRadius: '50%',
                width: 20, height: 20, fontSize: 11, fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {(c.unreadCount || 0) > 9 ? '9+' : c.unreadCount}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Friends({ isActive, onNav, onToast, userId, onPendingCount, onOpenMessages: _onOpenMessages, unreadMessages = 0, onNavigateMatch }: FriendsProps) {
  const [tab, setTab] = useState<'friends' | 'search' | 'requests' | 'messages' | 'notifications'>('friends');
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'match_invite' | 'friend_request' | 'friend_accepted';
    fromName: string;
    fromId: string;
    sessionId?: string;
    catName?: string;
    friendshipId?: string;
    createdAt: string;
  }>>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friends, setFriends] = useState<Array<FriendProfile & { friendshipId: string }>>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [friendPopup, setFriendPopup] = useState<(FriendProfile & { friendshipId: string }) | null>(null);
  const [profilePanel, setProfilePanel] = useState<(FriendProfile & { friendshipId: string }) | null>(null);
  const [profileEvents, setProfileEvents] = useState<Array<{ title: string; img: string | null; catId: string; catName: string; actionType: string }>>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [fs, reqs] = await Promise.all([
      loadFriends(userId),
      loadPendingRequests(userId),
    ]);
    setFriends(fs);
    setPendingRequests(reqs);
    onPendingCount?.(reqs.length);

    // Agrega notificações
    const notifs: Array<{
      id: string; type: 'match_invite' | 'friend_request' | 'friend_accepted';
      fromName: string; fromId: string; sessionId?: string; catName?: string;
      friendshipId?: string; createdAt: string;
    }> = [];
    // Pedidos de amizade pendentes
    reqs.forEach(r => {
      notifs.push({
        id: `fr-${r.id}`,
        type: 'friend_request',
        fromName: r.profile?.name || 'Alguém',
        fromId: r.requesterId,
        friendshipId: r.id,
        createdAt: new Date().toISOString(),
      });
    });
    // Convites Match via mensagens
    try {
      const convs = await loadConversations(userId);
      const matchConvs = convs.filter(c =>
        (c.lastMessage === 'Convite para Match' || c.lastMessage?.includes('MATCH_INVITE')) &&
        (c.unreadCount || 0) > 0
      );
      for (const conv of matchConvs) {
        const msgs = await loadMessages(conv.id);
        const inviteMsg = [...msgs].reverse().find(m => m.text?.startsWith('MATCH_INVITE:'));
        if (inviteMsg?.text) {
          const parts = inviteMsg.text.split(':');
          const sessionId = parts[1] || '';
          const catName = parts[2] || 'Ver';
          notifs.push({
            id: `mi-${conv.id}`,
            type: 'match_invite',
            fromName: conv.friendName || 'Amigo',
            fromId: conv.user1Id === userId ? conv.user2Id : conv.user1Id,
            sessionId,
            catName,
            createdAt: inviteMsg.createdAt || new Date().toISOString(),
          });
        }
      }
    } catch { /* silencioso */ }
    setNotifications(notifs);
    setLoading(false);
  }, [userId, onPendingCount]);

  useEffect(() => {
    if (isActive && userId) load();
  }, [isActive, userId, load]);

  // Pesquisa por @username com debounce
  useEffect(() => {
    if (!search.trim() || !userId) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const q = search.startsWith('@') ? search.slice(1) : search;
      // Pesquisa por username OU nome
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username')
        .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
        .neq('id', userId)
        .limit(10);
      const results: FriendProfile[] = (data || [])
        .filter((p: { id: string; name: string; username?: string }) => p.username)
        .map((p: { id: string; name: string; username?: string }) => ({ id: p.id, name: p.name, username: p.username }));
      // Verificar status
      const newStatusMap: Record<string, string> = { ...statusMap };
      await Promise.all(results.map(async r => {
        if (!newStatusMap[r.id]) {
          newStatusMap[r.id] = await getFriendshipStatus(userId, r.id);
        }
      }));
      setStatusMap(newStatusMap);
      setSearchResults(results);
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === 'notifications' && userId) load();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendRequest = async (targetId: string, name: string) => {
    if (!userId) return;
    const ok = await sendFriendRequest(userId, targetId);
    if (ok) {
      setStatusMap(m => ({ ...m, [targetId]: 'pending_sent' }));
      onToast(`✦ Pedido enviado a ${name}`);
      trackAsync({ userId, eventType: 'friend_request_sent', value: { targetId } });
    } else {
      onToast('Erro ao enviar pedido');
    }
  };

  const handleAccept = async (req: FriendRequest) => {
    const ok = await acceptFriendRequest(req.id);
    if (ok) {
      onToast(`✦ ${req.profile?.name || 'Amigo'} adicionado!`);
      trackAsync({ userId, eventType: 'friend_request_accepted', value: { requesterId: req.requesterId } });
      load();
      setTab('friends');
    }
  };

  const handleReject = async (req: FriendRequest) => {
    await rejectFriendRequest(req.id);
    onToast('Pedido recusado');
    load();
  };

  const handleRemove = async (friendshipId: string, name: string) => {
    await removeFriend(friendshipId);
    onToast(`Removeste ${name}`);
    load();
  };

  const loadFriendProfile = async (friendId: string) => {
    setProfileLoading(true);
    setProfileEvents([]);
    try {
      const { data } = await supabase
        .from('feed_events')
        .select('title, img, cat_id, cat_name, action_type, created_at')
        .eq('user_id', friendId)
        .order('created_at', { ascending: false })
        .limit(20);
      setProfileEvents((data || []).map((e: any) => ({
        title: e.title,
        img: e.img,
        catId: e.cat_id,
        catName: e.cat_name,
        actionType: e.action_type,
      })));
    } catch { /* silencioso */ }
    setProfileLoading(false);
  };

  if (!isActive) return null;

  const s = {
    screen: { paddingBottom: 80, minHeight: '100vh' } as React.CSSProperties,
    inner: { maxWidth: 480, margin: '0 auto', padding: '0 20px' } as React.CSSProperties,
    tab: (active: boolean): React.CSSProperties => ({
      flex: 1, padding: '10px 0', fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? '#C89B3C' : '#8a94a8',
      background: 'none', border: 'none', cursor: 'pointer',
      borderBottom: active ? '2px solid #C89B3C' : '2px solid transparent',
      transition: 'all 0.2s',
    }),
    card: {
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    } as React.CSSProperties,
    btnGold: {
      background: '#C89B3C', color: '#0B0D12', border: 'none',
      borderRadius: 8, padding: '6px 14px', fontSize: 13,
      fontWeight: 600, cursor: 'pointer',
    } as React.CSSProperties,
    btnOutline: {
      background: 'none', color: '#8a94a8',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
    } as React.CSSProperties,
  };

  return (
    <div style={s.screen} id="friends">
      <div style={s.inner}>

        {/* Header */}
        <div style={{ paddingTop: 44 }}>
          <PageHeader
            label="Social"
            title={friends.length > 0 ? `${friends.length} amigo${friends.length !== 1 ? 's' : ''}` : 'Amigos'}
            subtitle={friends.length > 0 ? 'O que estão a descobrir' : undefined}
            onBack={() => onNav('home')}
          />
        </div>

        {/* Tabs com ícones */}
        <div className="friends-tabs">

          {/* Amigos */}
          <button title="Os meus amigos" className={`friends-tab${tab === 'friends' ? ' active' : ''}`}
            onClick={() => setTab('friends')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>

          {/* Adicionar */}
          <button title="Adicionar amigo" className={`friends-tab${tab === 'search' ? ' active' : ''}`}
            onClick={() => setTab('search')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </button>

          {/* Notificações */}
          <button title="Notificações" className={`friends-tab${tab === 'notifications' ? ' active' : ''}`}
            onClick={() => setTab('notifications')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifications.length > 0 && <span className="friends-tab-badge" />}
          </button>

          {/* Mensagens */}
          <button title="Mensagens" className={`friends-tab${tab === 'messages' ? ' active' : ''}`}
            onClick={() => setTab('messages')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {unreadMessages > 0 && <span className="friends-tab-badge" />}
          </button>

          {/* Pedidos */}
          <button title="Pedidos de amizade" className={`friends-tab${tab === 'requests' ? ' active' : ''}`}
            onClick={() => setTab('requests')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <polyline points="16 11 18 13 22 9"/>
            </svg>
            {pendingRequests.length > 0 && <span className="friends-tab-badge" />}
          </button>

        </div>

        {/* TAB: Os meus amigos */}
        {tab === 'friends' && (
          <div>
            {loading && (
              <div style={{ textAlign: 'center', padding: 40, color: '#8a94a8', fontSize: 13 }}>
                A carregar…
              </div>
            )}
            {!loading && friends.length === 0 && (
              <EmptyState
                icon={<Users size={32} />}
                title="Nenhum amigo ainda"
                description="Convida amigos para veres o que estão a descobrir e jogar Match juntos."
                ctaLabel="Convidar amigos"
                ctaAction={() => setTab('search')}
              />
            )}
            {friends.length > 0 && (
              <button
                className="friends-invite-btn"
                onClick={() => {
                  const link = `https://what-to-zdka.vercel.app`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'Experimenta o What to!',
                      text: 'Descobre o que ver, jogar, ouvir ou fazer hoje.',
                      url: link,
                    });
                  } else {
                    navigator.clipboard.writeText(link);
                    onToast('✦ Link copiado!');
                  }
                  trackAsync({ userId, eventType: 'friend_invite_shared' });
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Convidar amigos
              </button>
            )}
            {!loading && friends.map(f => (
              <div key={f.friendshipId} className="friend-card" onClick={() => setFriendPopup(f)}>
                <div className="friend-card-avatar">
                  {f.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="friend-card-info">
                  <p className="friend-card-name">{f.name}</p>
                  {f.username && <p className="friend-card-username">@{f.username}</p>}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mu)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>
        )}

        {/* TAB: Adicionar */}
        {tab === 'search' && (
          <div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Pesquisar por @username…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '12px 16px',
                  color: '#f5f1eb', fontSize: 14,
                  outline: 'none', fontFamily: 'Outfit, sans-serif',
                }}
              />
            </div>

            {searchLoading && (
              <div style={{ textAlign: 'center', padding: 20, color: '#8a94a8', fontSize: 13 }}>
                A pesquisar…
              </div>
            )}

            {!searchLoading && search.length >= 2 && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: '#8a94a8', fontSize: 13 }}>
                Nenhum utilizador encontrado
              </div>
            )}

            {searchResults.map(r => {
              const status = statusMap[r.id] || 'none';
              return (
                <div key={r.id} style={s.card}>
                  <Avatar name={r.name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, color: '#f5f1eb', fontWeight: 500 }}>{r.name}</div>
                    {r.username && (
                      <div style={{ fontSize: 12, color: '#8a94a8' }}>@{r.username}</div>
                    )}
                  </div>
                  {status === 'none' && (
                    <button style={s.btnGold} onClick={() => handleSendRequest(r.id, r.name)}>
                      Adicionar
                    </button>
                  )}
                  {status === 'pending_sent' && (
                    <span style={{ fontSize: 12, color: '#8a94a8' }}>Pedido enviado</span>
                  )}
                  {status === 'accepted' && (
                    <span style={{ fontSize: 12, color: '#5ec97a' }}>✓ Amigo</span>
                  )}
                  {status === 'pending_received' && (
                    <button style={s.btnGold} onClick={() => setTab('requests')}>
                      Ver pedido
                    </button>
                  )}
                </div>
              );
            })}

            {search.length < 2 && (
              <div style={{ textAlign: 'center', padding: '32px 20px',
                color: '#8a94a8', fontSize: 13 }}>
                Escreve pelo menos 2 letras para pesquisar
              </div>
            )}
          </div>
        )}

        {/* TAB: Pedidos */}
        {tab === 'requests' && (
          <div>
            {pendingRequests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px',
                color: '#8a94a8', fontSize: 13 }}>
                Sem pedidos pendentes
              </div>
            )}
            {pendingRequests.map(req => (
              <div key={req.id} style={s.card}>
                <Avatar name={req.profile?.name || '?'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: '#f5f1eb', fontWeight: 500 }}>
                    {req.profile?.name || 'Utilizador'}
                  </div>
                  <div style={{ fontSize: 12, color: '#8a94a8', marginTop: 2 }}>
                    quer ser teu amigo
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.btnGold} onClick={() => handleAccept(req)}>
                    Aceitar
                  </button>
                  <button style={s.btnOutline} onClick={() => handleReject(req)}>
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: Notificações */}
        {tab === 'notifications' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#8a94a8', fontSize: 13 }}>A carregar…</div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(138,148,168,0.5)', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                Sem notificações
              </div>
            ) : notifications.map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.type === 'match_invite' ? 'rgba(200,155,60,0.12)' : 'rgba(106,180,224,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {n.type === 'match_invite' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C89B3C" strokeWidth="1.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  ) : n.type === 'friend_accepted' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5ec97a" strokeWidth="1.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6ab4e0" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  {n.type === 'match_invite' && (
                    <>
                      <div style={{ fontSize: 13, color: '#f5f1eb', fontFamily: "'Outfit',sans-serif", marginBottom: 2 }}>
                        <span style={{ fontWeight: 600 }}>{n.fromName}</span> convidou-te para Match
                      </div>
                      <div style={{ fontSize: 12, color: '#8a94a8', marginBottom: 8 }}>Categoria: {n.catName}</div>
                      <button
                        onClick={() => onNavigateMatch?.(n.sessionId || '')}
                        style={{ padding: '7px 18px', background: '#C89B3C', border: 'none', borderRadius: 8, color: '#0B0D12', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                      >
                        Aceitar
                      </button>
                    </>
                  )}
                  {n.type === 'friend_request' && (
                    <>
                      <div style={{ fontSize: 13, color: '#f5f1eb', fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>{n.fromName}</span> quer ser teu amigo
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={async () => {
                            const req = pendingRequests.find(r => r.id === n.friendshipId);
                            if (req) { await handleAccept(req); setNotifications(prev => prev.filter(x => x.id !== n.id)); }
                          }}
                          style={{ padding: '7px 18px', background: '#C89B3C', border: 'none', borderRadius: 8, color: '#0B0D12', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                        >
                          Aceitar
                        </button>
                        <button
                          onClick={async () => {
                            const req = pendingRequests.find(r => r.id === n.friendshipId);
                            if (req) { await handleReject(req); setNotifications(prev => prev.filter(x => x.id !== n.id)); }
                          }}
                          style={{ padding: '7px 14px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8a94a8', fontSize: 12, cursor: 'pointer' }}
                        >
                          Recusar
                        </button>
                      </div>
                    </>
                  )}
                  {n.type === 'friend_accepted' && (
                    <div style={{ fontSize: 13, color: '#f5f1eb', fontFamily: "'Outfit',sans-serif" }}>
                      <span style={{ fontWeight: 600 }}>{n.fromName}</span> aceitou o teu pedido
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: Mensagens */}
        {tab === 'messages' && (
          <div style={{ paddingTop: 8 }}>
            <MessagesInline userId={userId} onOpenMessages={_onOpenMessages} />
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>

      {/* Pop-up perfil amigo */}
      {profilePanel && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setProfilePanel(null)}
        >
          <div
            style={{ width: '100%', background: '#0f1118', borderRadius: '24px 24px 0 0', padding: '0 0 40px', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag bar */}
            <div style={{ width: 36, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 10, margin: '14px auto 0' }} />

            {/* Cabeçalho */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 20px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(200,155,60,0.15)', border: '2px solid rgba(200,155,60,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 700, color: '#C89B3C', flexShrink: 0,
              }}>
                {profilePanel.name[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, fontStyle: 'italic', color: '#f5f1eb', lineHeight: 1.1 }}>
                  {profilePanel.name}
                </div>
                {profilePanel.username && (
                  <div style={{ fontSize: 13, color: '#8a94a8', marginTop: 3 }}>@{profilePanel.username}</div>
                )}
              </div>
              <button
                onClick={() => { setProfilePanel(null); _onOpenMessages?.(profilePanel.id, profilePanel.name); }}
                style={{ background: 'rgba(200,155,60,0.12)', border: '1px solid rgba(200,155,60,0.25)', borderRadius: 12, padding: '8px 14px', color: '#C89B3C', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}
              >
                Mensagem
              </button>
            </div>

            {/* Conteúdo */}
            {(() => {
              const svgProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
              const catSvg = (catId: string) => {
                switch (catId) {
                  case 'watch': return <svg {...svgProps}><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 2l-4 5-4-5"/></svg>;
                  case 'play': return <svg {...svgProps}><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="13" r="1" fill="currentColor" stroke="none"/></svg>;
                  case 'read': return <svg {...svgProps}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
                  case 'listen': return <svg {...svgProps}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
                  case 'eat': return <svg {...svgProps}><path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2"/><path d="M5 2v20M21 2c0 0-2 2-2 8h4c0-6-2-8-2-8z"/><path d="M19 10v12"/></svg>;
                  case 'learn': return <svg {...svgProps}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
                  case 'visit': return <svg {...svgProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
                  case 'do': return <svg {...svgProps}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
                  default: return <svg {...svgProps}><circle cx="12" cy="12" r="10"/></svg>;
                }
              };

              if (profileLoading) return (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#8a94a8', fontSize: 13 }}>A carregar...</div>
              );
              if (profileEvents.length === 0) return (
                <div style={{ textAlign: 'center', padding: '24px 20px', color: '#8a94a8', fontSize: 13 }}>
                  Ainda sem actividade partilhada.
                </div>
              );

              // Categorias favoritas — top 3 por frequência
              const catCount: Record<string, { name: string; count: number }> = {};
              profileEvents.forEach(e => {
                if (!catCount[e.catId]) catCount[e.catId] = { name: e.catName, count: 0 };
                catCount[e.catId].count++;
              });
              const topCats = Object.entries(catCount)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 3);

              return (
                <>
                  {topCats.length > 0 && (
                    <div style={{ padding: '20px 20px 0' }}>
                      <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif", marginBottom: 10 }}>
                        Categorias favoritas
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {topCats.map(([catId, { name, count }]) => (
                          <div key={catId} style={{ flex: 1, background: 'rgba(200,155,60,0.07)', border: '1px solid rgba(200,155,60,0.18)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: '#C89B3C' }}>
                              {catSvg(catId)}
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#C89B3C', fontFamily: "'Outfit',sans-serif" }}>{name}</div>
                            <div style={{ fontSize: 10, color: '#8a94a8', marginTop: 2 }}>{count} {count === 1 ? 'vez' : 'vezes'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Últimas sugestões */}
                  <div style={{ padding: '20px 20px 0' }}>
                    <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif", marginBottom: 10 }}>
                      Últimas sugestões
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {profileEvents.slice(0, 6).map((e, i) => (
                        <div key={i} style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '3/4', position: 'relative', background: '#1a1d28' }}>
                          {e.img ? (
                            <img src={e.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(200,155,60,0.4)' }}>
                              {catSvg(e.catId)}
                            </div>
                          )}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }} />
                          <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, fontSize: 10, fontWeight: 600, color: '#f5f1eb', lineHeight: 1.2, fontFamily: "'Outfit',sans-serif" }}>
                            {e.title.length > 20 ? e.title.slice(0, 18) + '…' : e.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Botão fechar */}
            <button
              onClick={() => setProfilePanel(null)}
              style={{ margin: '20px 20px 0', width: 'calc(100% - 40px)', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'rgba(156,165,185,0.4)', fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}
            >
              ← fechar
            </button>
          </div>
        </div>,
        document.body
      )}

      {friendPopup && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={() => setFriendPopup(null)}
        >
          <div
            style={{
              width: '100%', background: '#161820',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 40px',
              maxHeight: '75vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar name={friendPopup.name} size={56} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#f5f1eb' }}>
                  {friendPopup.name}
                </div>
                {friendPopup.username && (
                  <div style={{ fontSize: 14, color: '#8a94a8', marginTop: 2 }}>
                    @{friendPopup.username}
                  </div>
                )}
              </div>
            </div>
            {/* Ver perfil */}
            <button
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.2)',
                borderRadius: 14, padding: '13px 16px', marginBottom: 10,
                color: '#C89B3C', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif", textAlign: 'left',
              }}
              onClick={() => {
                setProfilePanel(friendPopup);
                setFriendPopup(null);
                loadFriendProfile(friendPopup!.id);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Ver perfil
            </button>

            {/* Enviar mensagem */}
            <button
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.2)',
                borderRadius: 14, padding: '13px 16px', marginBottom: 10,
                color: '#C89B3C', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif", textAlign: 'left',
              }}
              onClick={() => { setFriendPopup(null); _onOpenMessages?.(friendPopup.id, friendPopup.name); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Enviar mensagem
            </button>

            {/* Silenciar sugestões */}
            <button
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '13px 16px', marginBottom: 10,
                color: 'rgba(245,241,235,0.5)', fontSize: 13, cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif", textAlign: 'left',
              }}
              onClick={() => { setFriendPopup(null); onToast('Em breve'); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
              Silenciar sugestões
            </button>

            {/* Remover amigo */}
            <button
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(224,123,123,0.08)', border: '1px solid rgba(224,123,123,0.2)',
                borderRadius: 14, padding: '13px 16px', marginBottom: 10,
                color: '#e07b7b', fontSize: 13, cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif", textAlign: 'left',
              }}
              onClick={() => { handleRemove(friendPopup.friendshipId, friendPopup.name); setFriendPopup(null); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Remover amigo
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
