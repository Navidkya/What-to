import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { Profile } from '../../types';
import { CATS } from '../../data';
import { loadCachedSuggestions } from '../../services/suggestionCache';
import { loadFriends } from '../../services/friends';
import type { FriendProfile } from '../../services/friends';
import {
  createMatchSession, joinMatchSession,
  submitMatchVote, getMatchVotes, advanceMatchIndex,
  endMatchSession, listenMatchSession, listenMatchVotes,
} from '../../services/match';
import type { MatchSession, MatchVote } from '../../services/match';
import { getOrCreateConversation, sendMessage } from '../../services/messages';

interface Props {
  profile: Profile;
  isActive: boolean;
  onBack: () => void;
  onToast: (msg: string) => void;
  userId?: string;
  userName?: string;
  onOpenMessages?: (friendId: string, friendName: string) => void;
  initialJoinCode?: string;
  onJoinCodeConsumed?: () => void;
}

const CAT_OPTIONS = [
  { id: 'watch', name: 'Ver' },
  { id: 'play', name: 'Jogar' },
  { id: 'read', name: 'Ler' },
  { id: 'listen', name: 'Ouvir' },
  { id: 'eat', name: 'Comer' },
];

function Avatar({ name, size = 40, color }: { name: string; size?: number; color?: string }) {
  const colors = ['#6ab4e0', '#e07b9a', '#7be0a0', '#e0c47b', '#c47be0'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const bg = color || colors[Math.abs(hash) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#0B0D12', flexShrink: 0,
    }}>
      {name[0]?.toUpperCase() || '?'}
    </div>
  );
}

export default function Match({ profile, isActive, onBack, onToast, userId, userName, onOpenMessages, initialJoinCode, onJoinCodeConsumed }: Props) {
  const [phase, setPhase] = useState<'home' | 'creating' | 'waiting' | 'joining' | 'playing' | 'matched' | 'done'>('home');
  const [selectedCat, setSelectedCat] = useState('watch');
  const [session, setSession] = useState<MatchSession | null>(null);
  const [votes, setVotes] = useState<MatchVote[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [items, setItems] = useState<Array<{ title: string; img: string | null; genre: string; type: string; rating?: number | null; year?: string | null }>>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [matchedItem, setMatchedItem] = useState<{ title: string; img: string | null } | null>(null);
  const [myVote, setMyVote] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [showFriendInvite, setShowFriendInvite] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const cleanupSession = useRef<(() => void) | null>(null);
  const cleanupVotes = useRef<(() => void) | null>(null);

  const displayName = userName || profile.name || 'Tu';
  void onOpenMessages;

  const cleanup = useCallback(() => {
    cleanupSession.current?.();
    cleanupVotes.current?.();
    cleanupSession.current = null;
    cleanupVotes.current = null;
  }, []);

  useEffect(() => {
    if (!isActive) return;
    return () => cleanup();
  }, [isActive, cleanup]);

  useEffect(() => {
    if (!isActive || !userId) return;
    loadFriends(userId).then(fs => setFriends(fs)).catch(() => {});
  }, [isActive, userId]);

  const autoJoinRef = useRef<string | null>(null);
  if (initialJoinCode && initialJoinCode !== autoJoinRef.current) {
    autoJoinRef.current = initialJoinCode;
  }

  useEffect(() => {
    const code = autoJoinRef.current;
    if (!code || !isActive || !userId) return;
    onJoinCodeConsumed?.();
    setJoinCode(code);
    setLoading(true);
    joinMatchSession(code, userId).then(async sess => {
      if (!sess) { onToast('Sessão não encontrada — verifica o código'); setLoading(false); return; }
      const cached = await loadCachedSuggestions(sess.catId, 100, {});
      const cacheMap = new Map(cached.map(i => [i.title, i]));
      const orderedItems = sess.itemTitles.map(title => {
        const found = cacheMap.get(title);
        return found
          ? { title: found.title, img: found.img, genre: found.genre, type: found.type, rating: found.rating ?? null, year: found.year ?? null }
          : { title, img: null, genre: '', type: '', rating: null, year: null };
      });
      setSession(sess);
      setItems(orderedItems);
      setCurrentIdx(sess.currentIndex);
      setMyVote(null);
      setVotes([]);
      subscribeToSession(sess);
      setPhase('playing');
      setLoading(false);
      onToast('✦ Entraste na sessão!');
    });
  }, [initialJoinCode, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkForMatch = useCallback((allVotes: MatchVote[], sess: MatchSession) => {
    const currentTitle = sess.itemTitles[sess.currentIndex];
    if (!currentTitle) return false;
    const votesForCurrent = allVotes.filter(v => v.itemTitle === currentTitle);
    const yesVotes = votesForCurrent.filter(v => v.vote === true);
    if (yesVotes.length >= 2) {
      const item = items.find(i => i.title === currentTitle);
      setMatchedItem({ title: currentTitle, img: item?.img || null });
      setPhase('matched');
      endMatchSession(sess.id);
      return true;
    }
    const totalParticipants = 2;
    if (votesForCurrent.length >= totalParticipants && yesVotes.length === 0) {
      const nextIdx = sess.currentIndex + 1;
      if (nextIdx >= sess.itemTitles.length) {
        setPhase('done');
        endMatchSession(sess.id);
        return true;
      }
      advanceMatchIndex(sess.id, nextIdx);
    }
    return false;
  }, [items]);

  const subscribeToSession = useCallback((sess: MatchSession) => {
    cleanupSession.current = listenMatchSession(sess.id, updatedSess => {
      setSession(updatedSess);
      setCurrentIdx(updatedSess.currentIndex);
      if (updatedSess.status === 'active' && phase === 'waiting') {
        setPhase('playing');
        onToast('✦ O teu parceiro entrou!');
      }
    });
    cleanupVotes.current = listenMatchVotes(sess.id, newVote => {
      setVotes(prev => {
        const updated = [...prev.filter(v => !(v.userId === newVote.userId && v.itemTitle === newVote.itemTitle)), newVote];
        checkForMatch(updated, sess);
        return updated;
      });
    });
  }, [userId, phase, onToast, checkForMatch]);

  const handleCreate = async () => {
    if (!userId) { onToast('Precisas de estar autenticado'); return; }
    setLoading(true);
    const cached = await loadCachedSuggestions(selectedCat, 30, {});
    const titles = cached.map(i => i.title).slice(0, 20);
    const itemList = cached.slice(0, 20).map(i => ({
      title: i.title, img: i.img, genre: i.genre,
      type: i.type, rating: i.rating, year: i.year,
    }));
    if (titles.length === 0) { onToast('Sem sugestões disponíveis'); setLoading(false); return; }
    const sess = await createMatchSession(userId, selectedCat, titles);
    if (!sess) { onToast('Erro ao criar sessão'); setLoading(false); return; }
    setSession(sess);
    setItems(itemList);
    setCurrentIdx(0);
    setMyVote(null);
    setVotes([]);
    subscribeToSession(sess);
    setPhase('waiting');
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!userId || !joinCode.trim()) return;
    setLoading(true);
    const sess = await joinMatchSession(joinCode.trim(), userId);
    if (!sess) {
      onToast('Sessão não encontrada — verifica o código');
      setLoading(false);
      return;
    }
    const cached = await loadCachedSuggestions(sess.catId, 100, {});
    const cacheMap = new Map(cached.map(i => [i.title, i]));
    const orderedItems = sess.itemTitles.map(title => {
      const found = cacheMap.get(title);
      return found
        ? { title: found.title, img: found.img, genre: found.genre, type: found.type, rating: found.rating ?? null, year: found.year ?? null }
        : { title, img: null, genre: '', type: '', rating: null, year: null };
    });
    setSession(sess);
    setItems(orderedItems);
    setCurrentIdx(sess.currentIndex);
    setMyVote(null);
    setVotes([]);
    subscribeToSession(sess);
    setPhase('playing');
    setLoading(false);
    onToast('✦ Entraste na sessão!');
  };

  const handleVote = async (vote: boolean) => {
    if (!session || !userId || myVote !== null) return;
    const currentTitle = session.itemTitles[currentIdx];
    if (!currentTitle) return;
    setMyVote(vote);
    await submitMatchVote(session.id, userId, currentTitle, vote);
    const allVotes = await getMatchVotes(session.id);
    setVotes(allVotes);
    const matched = checkForMatch(allVotes, { ...session, currentIndex: currentIdx });
    if (!matched) {
      const votesForCurrent = allVotes.filter(v => v.itemTitle === currentTitle);
      if (votesForCurrent.length >= 2) {
        setTimeout(() => {
          setMyVote(null);
                setCurrentIdx(i => i + 1);
        }, 600);
      }
    }
  };

  const handleReset = () => {
    cleanup();
    setPhase('home');
    setSession(null);
    setItems([]);
    setCurrentIdx(0);
    setMyVote(null);
    setVotes([]);
    setMatchedItem(null);
    setJoinCode('');
  };

  if (!isActive) return null;

  const currentItem = items[currentIdx] || null;
  const cat = CATS.find(c => c.id === (session?.catId || selectedCat));

  const s = {
    screen: { position: 'fixed' as const, inset: 0, background: '#0B0D12', zIndex: 20, display: 'flex', flexDirection: 'column' as const },
    tb: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb' },
    backBtn: { background: 'none', border: 'none', color: '#8a94a8', fontSize: 20, cursor: 'pointer', padding: 8 },
    inner: { flex: 1, overflowY: 'auto' as const, padding: '24px 20px 80px' },
  };

  // ── PHASE: HOME ──
  if (phase === 'home') {
    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={onBack}>←</button>
          <div style={s.title}>Match</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={s.inner}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontStyle: 'italic', color: '#f5f1eb', marginBottom: 8 }}>
              Decide a dois
            </div>
            <div style={{ fontSize: 13, color: '#8a94a8' }}>
              Vota em sugestões em simultâneo.<br />Quando os dois dizem Sim — é match!
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif", marginBottom: 12 }}>
              Categoria
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {CAT_OPTIONS.map(c => (
                <button key={c.id} onClick={() => setSelectedCat(c.id)}
                  style={{ padding: '8px 16px', borderRadius: 20, border: selectedCat === c.id ? '1px solid rgba(200,155,60,0.6)' : '1px solid rgba(255,255,255,0.1)', background: selectedCat === c.id ? 'rgba(200,155,60,0.15)' : 'transparent', color: selectedCat === c.id ? '#C89B3C' : '#8a94a8', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleCreate} disabled={loading}
            style={{ width: '100%', padding: '16px', background: loading ? 'rgba(200,155,60,0.3)' : '#C89B3C', color: '#0B0D12', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: "'Outfit',sans-serif", marginBottom: 12 }}>
            {loading ? 'A criar...' : '⚡ Criar sessão'}
          </button>

          <div style={{ textAlign: 'center', margin: '16px 0', color: '#8a94a8', fontSize: 12 }}>ou</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Código da sessão…"
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#f5f1eb', fontSize: 14, outline: 'none', fontFamily: "'Outfit',sans-serif" }}
            />
            <button onClick={handleJoin} disabled={loading || !joinCode.trim()}
              style={{ padding: '12px 20px', background: joinCode.trim() ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 12, color: '#C89B3C', fontSize: 13, fontWeight: 600, cursor: joinCode.trim() ? 'pointer' : 'default', fontFamily: "'Outfit',sans-serif" }}>
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: WAITING ──
  if (phase === 'waiting' && session) {
    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={handleReset}>←</button>
          <div style={s.title}>À espera…</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ ...s.inner, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <Avatar name={displayName} size={64} color="#C89B3C" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f1eb', marginBottom: 8 }}>Sessão criada!</div>
            <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 24 }}>Partilha o código com o teu parceiro</div>
            <div style={{ background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 16, padding: '16px 24px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>Código</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: '#C89B3C', letterSpacing: 4 }}>
                {session.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
            <button onClick={() => {
              navigator.clipboard?.writeText(session.id.slice(0, 8).toUpperCase());
              onToast('✦ Código copiado!');
            }}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 20px', color: '#8a94a8', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              Copiar código
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setShowQR(q => !q)}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 20px', color: '#8a94a8', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >
              {showQR ? 'Ocultar QR Code' : 'Mostrar QR Code'}
            </button>
            {showQR && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <div style={{ background: '#fff', padding: 12, borderRadius: 12 }}>
                  <QRCodeSVG value={session.id.slice(0, 8).toUpperCase()} size={180} />
                </div>
              </div>
            )}
          </div>

          {friends.length > 0 && (
            <div style={{ width: '100%', maxWidth: 320, marginTop: 8 }}>
              <button
                onClick={() => setShowFriendInvite(o => !o)}
                style={{ width: '100%', padding: '10px 16px', background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 12, color: '#C89B3C', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
              >
                Convidar amigo
              </button>
              {showFriendInvite && (
                <div style={{ marginTop: 8, background: '#161820', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {friends.map(f => (
                    <div key={f.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                      onClick={async () => {
                        const code = session!.id.slice(0, 8).toUpperCase();
                        const catName = cat?.name || 'Ver';
                        const convId = await getOrCreateConversation(userId!, f.id);
                        if (convId) {
                          await sendMessage(convId, userId!, `MATCH_INVITE:${code}:${catName}`);
                          onToast(`✦ Convite enviado a ${f.name}!`);
                        } else {
                          onToast('Erro ao enviar convite');
                        }
                        setShowFriendInvite(false);
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(200,155,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#C89B3C', flexShrink: 0 }}>
                        {f.name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: '#f5f1eb', fontWeight: 500 }}>{f.name}</div>
                        {f.username && <div style={{ fontSize: 11, color: '#8a94a8' }}>@{f.username}</div>}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C89B3C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8a94a8', fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C89B3C', animation: 'pulse 1.5s infinite' }} />
            À espera do parceiro…
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: PLAYING ──
  if (phase === 'playing' && session && currentItem) {
    const myVoteForCurrent = votes.find(v => v.userId === userId && v.itemTitle === currentItem.title);
    const otherVoteForCurrent = votes.find(v => v.userId !== userId && v.itemTitle === currentItem.title);

    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={handleReset}>←</button>
          <div style={s.title}>{cat?.name || 'Match'}</div>
          <div style={{ fontSize: 12, color: '#8a94a8' }}>{currentIdx + 1}/{session.itemTitles.length}</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Card */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {currentItem.img ? (
              <img src={currentItem.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1d28, #0f1118)' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,13,18,0.95) 0%, rgba(11,13,18,0.3) 60%, transparent 100%)' }} />

            <div style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic', color: '#f5f1eb', marginBottom: 8, lineHeight: 1.1 }}>
                {currentItem.title}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {currentItem.type && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(200,155,60,0.15)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 20, color: '#C89B3C', fontFamily: "'Outfit',sans-serif" }}>{currentItem.type}</span>}
                {currentItem.genre && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#8a94a8', fontFamily: "'Outfit',sans-serif" }}>{currentItem.genre}</span>}
                {currentItem.year && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#8a94a8', fontFamily: "'Outfit',sans-serif" }}>{currentItem.year}</span>}
                {currentItem.rating && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#8a94a8', fontFamily: "'Outfit',sans-serif" }}>★ {currentItem.rating}</span>}
              </div>
            </div>

            {/* Indicadores de voto dos participantes */}
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: myVoteForCurrent ? (myVoteForCurrent.vote ? 'rgba(94,201,122,0.3)' : 'rgba(224,123,123,0.3)') : 'rgba(255,255,255,0.1)', border: `2px solid ${myVoteForCurrent ? (myVoteForCurrent.vote ? '#5ec97a' : '#e07b7b') : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {myVoteForCurrent ? (myVoteForCurrent.vote ? '✓' : '✗') : '?'}
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: otherVoteForCurrent ? (otherVoteForCurrent.vote ? 'rgba(94,201,122,0.3)' : 'rgba(224,123,123,0.3)') : 'rgba(255,255,255,0.1)', border: `2px solid ${otherVoteForCurrent ? (otherVoteForCurrent.vote ? '#5ec97a' : '#e07b7b') : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {otherVoteForCurrent ? (otherVoteForCurrent.vote ? '✓' : '✗') : '?'}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div style={{ padding: '16px 20px 40px', display: 'flex', gap: 12 }}>
            <button onClick={() => handleVote(false)} disabled={!!myVoteForCurrent}
              style={{ flex: 1, padding: '16px', background: myVoteForCurrent?.vote === false ? 'rgba(224,123,123,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${myVoteForCurrent?.vote === false ? 'rgba(224,123,123,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, color: '#e07b7b', fontSize: 20, cursor: myVoteForCurrent ? 'default' : 'pointer' }}>
              ✗
            </button>
            <button onClick={() => handleVote(true)} disabled={!!myVoteForCurrent}
              style={{ flex: 2, padding: '16px', background: myVoteForCurrent?.vote === true ? 'rgba(94,201,122,0.2)' : '#C89B3C', border: `1px solid ${myVoteForCurrent?.vote === true ? 'rgba(94,201,122,0.5)' : 'transparent'}`, borderRadius: 16, color: myVoteForCurrent?.vote === true ? '#5ec97a' : '#0B0D12', fontSize: 15, fontWeight: 700, cursor: myVoteForCurrent ? 'default' : 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              {myVoteForCurrent?.vote === true ? '✓ Votado' : 'Sim ✓'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: MATCHED ──
  if (phase === 'matched' && matchedItem) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {matchedItem.img && (
          <img src={matchedItem.img} alt="" style={{ width: '100%', maxWidth: 360, height: 220, objectFit: 'cover', borderRadius: 20, marginBottom: 24 }} />
        )}
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: '#C89B3C', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
          ✦ Match!
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, fontStyle: 'italic', color: '#f5f1eb', textAlign: 'center', marginBottom: 8 }}>
          {matchedItem.title}
        </div>
        <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 32, textAlign: 'center' }}>
          Os dois disseram sim!
        </div>
        <button onClick={handleReset}
          style={{ padding: '14px 32px', background: '#C89B3C', color: '#0B0D12', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
          Fechar
        </button>
      </div>,
      document.body
    );
  }

  // ── PHASE: DONE (sem match) ──
  if (phase === 'done') {
    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={handleReset}>←</button>
          <div style={s.title}>Match</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ ...s.inner, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontStyle: 'italic', color: '#f5f1eb' }}>Sem match desta vez</div>
          <div style={{ fontSize: 13, color: '#8a94a8', textAlign: 'center' }}>Nenhuma sugestão agradou aos dois.<br />Tenta novamente!</div>
          <button onClick={handleReset}
            style={{ marginTop: 16, padding: '14px 32px', background: '#C89B3C', color: '#0B0D12', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return null;
}
