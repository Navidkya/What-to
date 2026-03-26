import { useState, useEffect, useCallback } from 'react';
import type { Screen } from '../../types';
import {
  sendFriendRequest, acceptFriendRequest,
  rejectFriendRequest, removeFriend, loadFriends, loadPendingRequests,
  getFriendshipStatus,
} from '../../services/friends';
import type { FriendProfile, FriendRequest } from '../../services/friends';
import { supabase } from '../../lib/supabase';
import { trackAsync } from '../../services/analytics';

interface FriendsProps {
  isActive: boolean;
  onNav: (screen: Screen) => void;
  onToast: (msg: string) => void;
  userId?: string;
  onPendingCount?: (count: number) => void;
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

export default function Friends({ isActive, onNav, onToast, userId, onPendingCount }: FriendsProps) {
  const [tab, setTab] = useState<'friends' | 'search' | 'requests'>('friends');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friends, setFriends] = useState<Array<FriendProfile & { friendshipId: string }>>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [friendPopup, setFriendPopup] = useState<(FriendProfile & { friendshipId: string }) | null>(null);

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
        <div style={{ paddingTop: 56, paddingBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif",
              fontSize: 32, fontStyle: 'italic', fontWeight: 600,
              color: '#f5f1eb', lineHeight: 1.1 }}>
              Amigos
            </div>
            <div style={{ fontSize: 12, color: '#8a94a8', marginTop: 3 }}>
              {friends.length} {friends.length === 1 ? 'amigo' : 'amigos'}
            </div>
          </div>
          <button onClick={() => onNav('home')} style={{
            background: 'none', border: 'none', color: '#8a94a8',
            fontSize: 20, cursor: 'pointer', padding: 8,
          }}>←</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
          <button style={s.tab(tab === 'friends')} onClick={() => setTab('friends')}>
            Os meus amigos
          </button>
          <button style={s.tab(tab === 'search')} onClick={() => setTab('search')}>
            Adicionar
          </button>
          <button style={{ ...s.tab(tab === 'requests'), position: 'relative' }}
            onClick={() => setTab('requests')}>
            Pedidos
            {pendingRequests.length > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: '20%',
                background: '#C89B3C', color: '#0B0D12',
                borderRadius: '50%', width: 16, height: 16,
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {pendingRequests.length}
              </span>
            )}
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
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(200,155,60,0.5)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div style={{ color: 'rgba(245,241,235,0.6)', fontSize: 15,
                  fontWeight: 500, marginBottom: 8 }}>
                  Ainda não tens amigos
                </div>
                <div style={{ color: '#8a94a8', fontSize: 13, marginBottom: 20 }}>
                  Pesquisa pelo nome de alguém que usa a app
                </div>
                <button style={s.btnGold} onClick={() => setTab('search')}>
                  Adicionar amigos
                </button>
                <button
                  onClick={() => {
                    const link = `https://what-to-zdka.vercel.app`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Experimenta o What to!',
                        text: 'Descobre o que ver, jogar, ouvir ou fazer hoje. Entra aqui:',
                        url: link,
                      });
                    } else {
                      navigator.clipboard.writeText(link);
                      onToast('✦ Link copiado!');
                    }
                    trackAsync({ userId, eventType: 'friend_invite_shared' });
                  }}
                  style={{
                    marginTop: 10, background: 'none',
                    border: '1px solid rgba(200,155,60,0.3)',
                    borderRadius: 12, padding: '10px 20px',
                    color: 'var(--ac)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  ↑ Convidar amigo para a app
                </button>
              </div>
            )}
            {friends.length > 0 && (
              <button
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
                style={{
                  width: '100%', marginBottom: 16,
                  background: 'rgba(200,155,60,0.08)',
                  border: '1px solid rgba(200,155,60,0.2)',
                  borderRadius: 12, padding: '12px',
                  color: 'var(--ac)', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 6,
                }}
              >
                ↑ Convidar mais amigos
              </button>
            )}
            {!loading && friends.map(f => (
              <div key={f.friendshipId} style={{ ...s.card, cursor: 'pointer' }}
                onClick={() => setFriendPopup(f)}>
                <Avatar name={f.name} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: '#f5f1eb', fontWeight: 500 }}>{f.name}</div>
                  {f.username && (
                    <div style={{ fontSize: 12, color: '#8a94a8' }}>@{f.username}</div>
                  )}
                </div>
                <span style={{ color: 'rgba(156,165,185,0.4)', fontSize: 18 }}>›</span>
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

        <div style={{ height: 80 }} />
      </div>

      {/* Pop-up perfil amigo */}
      {friendPopup && (
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
            <button
              style={{
                width: '100%', background: 'rgba(224,123,123,0.15)',
                border: '1px solid rgba(224,123,123,0.3)',
                borderRadius: 12, padding: '12px',
                color: '#e07b7b', fontSize: 14, cursor: 'pointer',
              }}
              onClick={() => {
                handleRemove(friendPopup.friendshipId, friendPopup.name);
                setFriendPopup(null);
              }}
            >
              Remover amigo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
