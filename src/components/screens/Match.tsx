import { useState, useEffect, useRef, useCallback } from 'react';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import { Zap } from 'lucide-react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { Profile } from '../../types';
import { CATS } from '../../data';
import { loadCachedSuggestions } from '../../services/suggestionCache';
import { loadFriends } from '../../services/friends';
import type { FriendProfile } from '../../services/friends';
import {
  createMatchSession, joinMatchSession, getActiveSessionForUser,
  submitMatchVote, advanceMatchIndex,
  endMatchSession, listenMatchSession, listenMatchVotes,
  checkMatchForItem, addItemsToSession, getMatchVotes,
  setSessionStandby, updateSessionFilters, setSessionItems,
} from '../../services/match';
import type { MatchSession, MatchVote } from '../../services/match';
import { getOrCreateConversation, sendMessage, loadConversations } from '../../services/messages';

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

function CatPicker({ selected, onChange }: { selected: string[]; onChange: (cats: string[]) => void }) {
  const toggle = (id: string) => {
    onChange(selected.includes(id)
      ? selected.length > 1 ? selected.filter(c => c !== id) : selected
      : [...selected, id]
    );
  };
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 4 }}>
      {CAT_OPTIONS.map(c => {
        const active = selected.includes(c.id);
        return (
          <button key={c.id} onClick={() => toggle(c.id)} style={{
            position: 'relative', padding: '10px 16px',
            background: active ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${active ? 'rgba(200,155,60,0.5)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, color: active ? '#C89B3C' : '#8a94a8',
            fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
            fontWeight: active ? 600 : 400,
          }}>
            {c.name}
            {active && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 14, height: 14, borderRadius: '50%',
                background: '#C89B3C', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 8, color: '#0B0D12', fontWeight: 700,
              }}>✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const GENRE_OPTIONS: Record<string, string[]> = {
  watch: ['Acção', 'Comédia', 'Drama', 'Terror', 'Ficção Científica', 'Romance', 'Documentário', 'Animação', 'Thriller'],
  play: ['Acção', 'RPG', 'Estratégia', 'Desporto', 'Aventura', 'Puzzle', 'Simulação'],
  read: ['Romance', 'Ficção Científica', 'Fantasia', 'Thriller', 'Biografia', 'História', 'Manga'],
  listen: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Electrónica', 'Clássica', 'Indie'],
  eat: ['Italiana', 'Asiática', 'Portuguesa', 'Vegetariana', 'Fast Food', 'Sobremesas'],
};

const TYPE_OPTIONS: Record<string, { label: string; value: string }[]> = {
  watch: [
    { label: 'Filme', value: 'Filme' },
    { label: 'Série', value: 'Serie' },
    { label: 'Documentário', value: 'Documentario' },
  ],
  play: [
    { label: 'Single player', value: 'single' },
    { label: 'Multiplayer', value: 'multi' },
  ],
  read: [
    { label: 'Livro', value: 'Livro' },
    { label: 'Manga', value: 'Manga' },
    { label: 'BD', value: 'BD' },
  ],
  eat: [
    { label: 'Receita em casa', value: 'Receita' },
    { label: 'Restaurante', value: 'Restaurante' },
  ],
};

const ERA_OPTIONS = [
  { label: 'Clássico (antes 2000)', value: 'classic' },
  { label: 'Moderno (2000–2019)', value: 'modern' },
  { label: 'Recente (2020+)', value: 'recent' },
];

function FilterPicker({ cats, filters, onChange }: {
  cats: string[];
  filters: Record<string, any>;
  onChange: (f: Record<string, any>) => void;
}) {
  const toggleGenre = (catId: string, genre: string) => {
    const current: string[] = filters[catId]?.genres || [];
    const updated = current.includes(genre)
      ? current.filter(g => g !== genre)
      : [...current, genre];
    onChange({ ...filters, [catId]: { ...(filters[catId] || {}), genres: updated } });
  };

  const toggleType = (catId: string, value: string) => {
    const current: string[] = filters[catId]?.types || [];
    const updated = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value];
    onChange({ ...filters, [catId]: { ...(filters[catId] || {}), types: updated } });
  };

  const toggleEra = (catId: string, value: string) => {
    const current: string[] = filters[catId]?.eras || [];
    const updated = current.includes(value)
      ? current.filter(e => e !== value)
      : [...current, value];
    onChange({ ...filters, [catId]: { ...(filters[catId] || {}), eras: updated } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
      {cats.map(catId => {
        const catName = CAT_OPTIONS.find(c => c.id === catId)?.name || catId;
        const genres = GENRE_OPTIONS[catId] || [];
        const selectedGenres: string[] = filters[catId]?.genres || [];
        const selectedTypes: string[] = filters[catId]?.types || [];
        const selectedEras: string[] = filters[catId]?.eras || [];
        return (
          <div key={catId}>
            <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.6)', letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily: "'Outfit',sans-serif", marginBottom: 10 }}>
              {catName}
            </div>
            {/* Géneros */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {genres.map(g => {
                const active = selectedGenres.includes(g);
                return (
                  <button key={g} onClick={() => toggleGenre(catId, g)} style={{
                    padding: '7px 14px', borderRadius: 20,
                    background: active ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? 'rgba(200,155,60,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? '#C89B3C' : '#8a94a8',
                    fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                    fontWeight: active ? 600 : 400,
                  }}>
                    {g}
                  </button>
                );
              })}
              <button onClick={() => onChange({ ...filters, [catId]: { ...(filters[catId] || {}), genres: [] } })} style={{
                padding: '7px 14px', borderRadius: 20,
                background: selectedGenres.length === 0 ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedGenres.length === 0 ? 'rgba(200,155,60,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: selectedGenres.length === 0 ? '#C89B3C' : '#8a94a8',
                fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
              }}>
                Qualquer
              </button>
            </div>
            {/* Tipo de conteúdo */}
            {TYPE_OPTIONS[catId] && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: 'rgba(138,148,168,0.5)', letterSpacing: 1, textTransform: 'uppercase' as const, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>Tipo</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {TYPE_OPTIONS[catId].map(opt => {
                    const active = selectedTypes.includes(opt.value);
                    return (
                      <button key={opt.value} onClick={() => toggleType(catId, opt.value)} style={{
                        padding: '6px 12px', borderRadius: 20,
                        background: active ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(200,155,60,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color: active ? '#C89B3C' : '#8a94a8',
                        fontSize: 11, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                        fontWeight: active ? 600 : 400,
                      }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Época — só para watch */}
            {catId === 'watch' && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: 'rgba(138,148,168,0.5)', letterSpacing: 1, textTransform: 'uppercase' as const, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>Época</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {ERA_OPTIONS.map(opt => {
                    const active = selectedEras.includes(opt.value);
                    return (
                      <button key={opt.value} onClick={() => toggleEra(catId, opt.value)} style={{
                        padding: '6px 12px', borderRadius: 20,
                        background: active ? 'rgba(200,155,60,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(200,155,60,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color: active ? '#C89B3C' : '#8a94a8',
                        fontSize: 11, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                        fontWeight: active ? 600 : 400,
                      }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div style={{ fontSize: 12, color: 'rgba(138,148,168,0.5)', fontStyle: 'italic' as const, fontFamily: "'Outfit',sans-serif", lineHeight: 1.5 }}>
        Quanto mais géneros em comum, maior a probabilidade de match.
      </div>
    </div>
  );
}

type Phase = 'home' | 'creating' | 'waiting' | 'joining' | 'playing' | 'matched' | 'done' | 'local-playing' | 'local-done';

type LocalItem = { title: string; img: string | null; genre: string; type: string; rating?: number | null; year?: string | null; description?: string | null };

export default function Match({ profile, isActive, onBack, onToast, userId, userName, onOpenMessages, initialJoinCode, onJoinCodeConsumed }: Props) {
  const [phase, setPhase] = useState<Phase>('home');
  const [selectedCats, setSelectedCats] = useState<string[]>(['watch']);
  const [session, setSession] = useState<MatchSession | null>(null);
  const [, setVotes] = useState<MatchVote[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [items, setItems] = useState<LocalItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [matchedItem, setMatchedItem] = useState<{ title: string; img: string | null } | null>(null);
  const [, setMyVote] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [showFriendInvite, setShowFriendInvite] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Novos estados
  const [sessionFilters, setSessionFilters] = useState<Record<string, any>>({});
  const [showFilterSetup, setShowFilterSetup] = useState(false);
  const [showJoinReview, setShowJoinReview] = useState(false);
  const [pendingSession, setPendingSession] = useState<MatchSession | null>(null);
  const [mode, setMode] = useState<'local' | 'online' | null>(null);
  const [, setSubPhase] = useState<'create' | 'join'>('create');
  const [localPlayers, setLocalPlayers] = useState<string[]>(['', '']);
  const [localPlayerIdx, setLocalPlayerIdx] = useState(0);
  const [localVotes, setLocalVotes] = useState<Record<string, Record<string, boolean>>>({});
  const [localMatches, setLocalMatches] = useState<Array<{ title: string; img: string | null }>>([]);
  const [showPassOverlay, setShowPassOverlay] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [matchInvites, setMatchInvites] = useState<Array<{ convId: string; friendId: string; friendName: string }>>([]);
  const [activeSession, setActiveSession] = useState<MatchSession | null>(null);
  const [myVotedTitles, setMyVotedTitles] = useState<Set<string>>(new Set());
  const [showMatchBanner, setShowMatchBanner] = useState(false);
  const [addingMore, setAddingMore] = useState(false);
  const [voteCount, setVoteCount] = useState(0);

  const cleanupSession = useRef<(() => void) | null>(null);
  const cleanupVotes = useRef<(() => void) | null>(null);
  const itemsRef = useRef<LocalItem[]>([]);
  const phaseRef = useRef<Phase>('home');
  const myVotedTitlesRef = useRef<Set<string>>(new Set());
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  const displayName = userName || profile.name || 'Tu';

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    myVotedTitlesRef.current = myVotedTitles;
  }, [myVotedTitles]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

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

  useEffect(() => {
    if (!isActive || !userId) return;
    loadConversations(userId).then(convs => {
      const invites = convs
        .filter(c => c.lastMessage === 'Convite para Match' && (c.unreadCount || 0) > 0)
        .map(c => ({
          convId: c.id,
          friendId: c.user1Id === userId ? c.user2Id : c.user1Id,
          friendName: c.friendName || '',
        }));
      setMatchInvites(invites);
    }).catch(() => {});
    getActiveSessionForUser(userId).then(sess => setActiveSession(sess)).catch(() => {});
  }, [isActive, userId]);

  useEffect(() => {
    if (!isActive || !initialJoinCode || !userId) return;
    if (initialJoinCode.trim().length < 8) { onJoinCodeConsumed?.(); return; }
    const t = window.setTimeout(async () => {
      setLoading(true);
      const sess = await joinMatchSession(initialJoinCode.trim(), userId);
      if (!sess) {
        onToast('Sessão não encontrada ou já iniciada');
        setLoading(false);
        onJoinCodeConsumed?.();
        return;
      }
      const catIds = sess.catId.split(',');
      const allCachedChunks = await Promise.all(catIds.map(cid => loadCachedSuggestions(cid, 100, {})));
      const cached = allCachedChunks.flat();
      const cacheMap = new Map(cached.map(i => [i.title, i]));
      const orderedItems = sess.itemTitles.map(title => {
        const found = cacheMap.get(title);
        return found
          ? { title: found.title, img: found.img, genre: found.genre, type: found.type, rating: found.rating ?? null, year: found.year ?? null, description: (found as any).description ?? null }
          : { title, img: null, genre: '', type: '', rating: null, year: null, description: null };
      });
      const previousVotes = await getMatchVotes(sess.id);
      const myPreviousVoted = new Set(
        previousVotes.filter(v => v.userId === userId).map(v => v.itemTitle)
      );
      setMyVotedTitles(myPreviousVoted);
      myVotedTitlesRef.current = myPreviousVoted;
      const firstUnvoted = orderedItems.findIndex(i => !myPreviousVoted.has(i.title));
      setCurrentIdx(firstUnvoted !== -1 ? firstUnvoted : 0);
      setPendingSession(sess);
      setSession(sess);
      setItems(orderedItems);
      setShowJoinReview(true);
      setLoading(false);
      onToast('✦ Entraste na sessão!');
      onJoinCodeConsumed?.();
    }, 150);
    return () => window.clearTimeout(t);
  }, [isActive, initialJoinCode, userId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    cleanupSession.current = listenMatchSession(sess.id, async (updatedSess) => {
      setSession(updatedSess);
      // Criador recebe items via Realtime quando o convidado confirmou filtros
      if (updatedSess.itemTitles.length > 0 && itemsRef.current.length === 0 && phaseRef.current === 'waiting') {
        const catIds = updatedSess.catId.split(',');
        const allCachedChunks = await Promise.all(catIds.map(cid => loadCachedSuggestions(cid, 100, {})));
        const cached = allCachedChunks.flat();
        const cacheMap = new Map(cached.map(i => [i.title, i]));
        const orderedItems = updatedSess.itemTitles.map(title => {
          const found = cacheMap.get(title);
          return found
            ? { title: found.title, img: found.img, genre: found.genre, type: found.type, rating: found.rating ?? null, year: found.year ?? null, description: (found as any).description ?? null }
            : { title, img: null, genre: '', type: '', rating: null, year: null, description: null };
        });
        setItems(orderedItems);
        setCurrentIdx(0);
        setPhase('playing');
        onToast('✦ O teu parceiro confirmou — a começar!');
        return;
      }
      setCurrentIdx(updatedSess.currentIndex);
      if (updatedSess.status === 'active' && phaseRef.current === 'waiting' && updatedSess.itemTitles.length > 0) {
        setPhase('playing');
        onToast('✦ O teu parceiro entrou!');
      }
    });
    cleanupVotes.current = listenMatchVotes(sess.id, async (newVote) => {
      // Só interessa votos do outro user
      if (newVote.userId === userId) return;
      // Se o outro votou Sim num item onde eu já votei Sim → match!
      if (newVote.vote && myVotedTitlesRef.current.has(newVote.itemTitle)) {
        const isMatch = await checkMatchForItem(sess.id, newVote.itemTitle);
        if (isMatch) {
          const item = itemsRef.current.find(i => i.title === newVote.itemTitle);
          setMatchedItem({ title: newVote.itemTitle, img: item?.img || null });
          setPhase('matched');
          endMatchSession(sess.id);
        }
      }
    });
  }, [userId, onToast, checkForMatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateWithFilters = async () => {
    if (!userId) { onToast('Precisas de estar autenticado'); return; }
    setLoading(true);
    // Sessão criada sem sugestões — o convidado vai gerar os items após confirmar filtros
    const hostFilters = { host: sessionFilters };
    const sess = await createMatchSession(userId, selectedCats.join(','), [], hostFilters);
    if (!sess) { onToast('Erro ao criar sessão'); setLoading(false); return; }
    setSession(sess);
    setItems([]);
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
    const catIds = sess.catId.split(',');
    const allCachedChunks = await Promise.all(catIds.map(cid => loadCachedSuggestions(cid, 100, {})));
    const cached = allCachedChunks.flat();
    const cacheMap = new Map(cached.map(i => [i.title, i]));
    const orderedItems = sess.itemTitles.map(title => {
      const found = cacheMap.get(title);
      return found
        ? { title: found.title, img: found.img, genre: found.genre, type: found.type, rating: found.rating ?? null, year: found.year ?? null, description: (found as any).description ?? null }
        : { title, img: null, genre: '', type: '', rating: null, year: null, description: null };
    });
    const previousVotes = await getMatchVotes(sess.id);
    const myPreviousVoted = new Set(
      previousVotes.filter(v => v.userId === userId).map(v => v.itemTitle)
    );
    setMyVotedTitles(myPreviousVoted);
    myVotedTitlesRef.current = myPreviousVoted;
    const firstUnvoted = orderedItems.findIndex(i => !myPreviousVoted.has(i.title));
    setCurrentIdx(firstUnvoted !== -1 ? firstUnvoted : 0);
    setPendingSession(sess);
    setSession(sess);
    setItems(orderedItems);
    setShowJoinReview(true);
    setLoading(false);
    onToast('✦ Entraste na sessão!');
  };

  const findNextUnvoted = (startIdx: number, votedTitles: Set<string>): number => {
    for (let i = startIdx; i < items.length; i++) {
      if (!votedTitles.has(items[i].title)) return i;
    }
    return -1;
  };

  const handleVote = async (vote: boolean) => {
    if (!session || !userId) return;
    const currentTitle = items[currentIdx]?.title;
    if (!currentTitle || myVotedTitles.has(currentTitle)) return;

    // Marca como votado localmente
    const newVotedTitles = new Set([...myVotedTitles, currentTitle]);
    setMyVotedTitles(newVotedTitles);
    myVotedTitlesRef.current = newVotedTitles;

    // Guarda voto no Supabase
    await submitMatchVote(session.id, userId, currentTitle, vote);

    // Se votou Sim, verifica imediatamente se há match
    if (vote) {
      const isMatch = await checkMatchForItem(session.id, currentTitle);
      if (isMatch) {
        const item = items.find(i => i.title === currentTitle);
        setMatchedItem({ title: currentTitle, img: item?.img || null });
        setPhase('matched');
        endMatchSession(session.id);
        return;
      }
    }

    // Incrementa contador — banner a cada 10 votos
    const newCount = voteCount + 1;
    setVoteCount(newCount);
    if (newCount % 10 === 0) setShowMatchBanner(true);

    // Avança para próximo item não votado
    const nextIdx = findNextUnvoted(currentIdx + 1, newVotedTitles);
    if (nextIdx !== -1) {
      setCurrentIdx(nextIdx);
      setMyVote(null);
    }
  };

  const handleLocalVote = (vote: boolean) => {
    const playerName = localPlayers[localPlayerIdx];
    const item = items[currentIdx];
    if (!item) return;
    const newPlayerVotes = { ...(localVotes[playerName] || {}), [item.title]: vote };
    const newVotes = { ...localVotes, [playerName]: newPlayerVotes };
    setLocalVotes(newVotes);
    const nextItemIdx = currentIdx + 1;
    if (nextItemIdx < items.length) {
      setCurrentIdx(nextItemIdx);
    } else {
      const nextPlayerIdx = localPlayerIdx + 1;
      if (nextPlayerIdx < localPlayers.length) {
        setLocalPlayerIdx(nextPlayerIdx);
        setCurrentIdx(0);
        setShowPassOverlay(true);
      } else {
        const matches = items.filter(it =>
          localPlayers.every(p => newVotes[p]?.[it.title] === true)
        );
        setLocalMatches(matches.map(it => ({ title: it.title, img: it.img })));
        setPhase('local-done');
      }
    }
  };

  const handleReset = () => {
    cleanup();
    setPhase('home');
    setMode(null);
    setSubPhase('create');
    setSessionFilters({});
    setShowFilterSetup(false);
    setShowJoinReview(false);
    setPendingSession(null);
    setSession(null);
    setItems([]);
    setCurrentIdx(0);
    setMyVote(null);
    setVotes([]);
    setMatchedItem(null);
    setJoinCode('');
    setLocalPlayers(['', '']);
    setLocalPlayerIdx(0);
    setLocalVotes({});
    setLocalMatches([]);
    setShowPassOverlay(false);
    setShowJoinCode(false);
    setActiveSession(null);
    setMyVotedTitles(new Set());
    setShowMatchBanner(false);
    setAddingMore(false);
    setVoteCount(0);
  };

  if (!isActive) return null;

  const currentItem = items[currentIdx] || null;
  const firstCatId = (session?.catId || selectedCats[0] || 'watch').split(',')[0];
  const cat = CATS.find(c => c.id === firstCatId);

  const s = {
    screen: { position: 'fixed' as const, inset: 0, background: '#0B0D12', zIndex: 20, display: 'flex', flexDirection: 'column' as const },
    tb: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    title: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic' as const, fontWeight: 600, color: '#f5f1eb' },
    backBtn: { background: 'none', border: 'none', color: '#8a94a8', fontSize: 20, cursor: 'pointer', padding: 8 },
    inner: { flex: 1, overflowY: 'auto' as const, padding: '24px 20px 80px' },
    lbl: { fontSize: 11, color: 'rgba(200,155,60,0.6)', letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily: "'Outfit',sans-serif", marginBottom: 12 },
  };

  // ── ECRÃ: configuração Online (antes de criar sessão) ──
  if (phase === 'home' && mode === 'online' && showFilterSetup) {
    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={() => { setMode(null); setShowFilterSetup(false); }}>←</button>
          <div style={s.title}>Configurar sessão</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={s.inner}>
          <div style={{ marginBottom: 24 }}>
            <div style={s.lbl}>Categorias</div>
            <CatPicker selected={selectedCats} onChange={setSelectedCats} />
          </div>
          <div style={{ marginBottom: 32 }}>
            <div style={s.lbl}>Géneros preferidos</div>
            <FilterPicker cats={selectedCats} filters={sessionFilters} onChange={setSessionFilters} />
          </div>
          <button
            onClick={async () => {
              setShowFilterSetup(false);
              await handleCreateWithFilters();
            }}
            disabled={loading}
            style={{ width: '100%', padding: '16px', background: loading ? 'rgba(200,155,60,0.3)' : '#C89B3C', color: '#0B0D12', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: "'Outfit',sans-serif" }}
          >
            {loading ? 'A criar...' : 'Criar sessão'}
          </button>
        </div>
      </div>
    );
  }

  // ── ECRÃ: revisão de filtros para o convidado ──
  if (showJoinReview && pendingSession) {
    // Suporta estrutura nova { host: {...} } e legada { catId: {...} }
    const rawFilters = pendingSession.filters || {};
    const hostFilters: Record<string, any> = rawFilters.host || rawFilters;
    const hasFilters = Object.keys(hostFilters).some(k => {
      const f = hostFilters[k];
      return (f?.genres || []).length > 0 || (f?.types || []).length > 0 || (f?.eras || []).length > 0;
    });
    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={() => { setShowJoinReview(false); handleReset(); }}>←</button>
          <div style={s.title}>Sessão de Match</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={s.inner}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic' as const, color: '#f5f1eb', marginBottom: 8 }}>
              O teu parceiro criou uma sessão
            </div>
            <div style={{ fontSize: 13, color: '#8a94a8', lineHeight: 1.6 }}>
              Categorias: {pendingSession.catId.split(',').map(id => CAT_OPTIONS.find(c => c.id === id)?.name || id).join(', ')}
            </div>
          </div>

          {hasFilters && (
            <div style={{ marginBottom: 24, background: 'rgba(200,155,60,0.06)', border: '1px solid rgba(200,155,60,0.15)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={s.lbl}>Filtros activos</div>
              {Object.entries(hostFilters).map(([catId, f]: [string, any]) => {
                const labels = [...(f?.genres || []), ...(f?.types || []), ...(f?.eras || [])];
                if (labels.length === 0) return null;
                return (
                  <div key={catId} style={{ fontSize: 12, color: '#8a94a8', marginBottom: 6 }}>
                    <span style={{ color: '#C89B3C' }}>{CAT_OPTIONS.find(c => c.id === catId)?.name}:</span>{' '}
                    {labels.join(', ')}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={s.lbl}>Os teus filtros (opcional)</div>
            <FilterPicker
              cats={pendingSession.catId.split(',')}
              filters={sessionFilters}
              onChange={setSessionFilters}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            <button
              onClick={async () => {
                if (!pendingSession) return;
                setShowJoinReview(false);
                setLoading(true);

                const guestFilters = sessionFilters;
                const catIds = pendingSession.catId.split(',');

                const chunks = await Promise.all(catIds.map(async cid => {
                  const hostGenres: string[] = hostFilters[cid]?.genres || [];
                  const hostTypes: string[] = hostFilters[cid]?.types || [];
                  const hostEras: string[] = hostFilters[cid]?.eras || [];
                  const guestGenres: string[] = guestFilters[cid]?.genres || [];
                  const guestTypes: string[] = guestFilters[cid]?.types || [];
                  const guestEras: string[] = guestFilters[cid]?.eras || [];
                  const all = await loadCachedSuggestions(cid, 100, {});

                  // Filtro idioma
                  const langFiltered = all.filter(i => {
                    const lang = (i as any).original_language || '';
                    return !lang || lang === 'pt' || lang === 'en';
                  });

                  return langFiltered.filter(i => {
                    const itemGenre = i.genre?.toLowerCase() || '';
                    const itemGenres: string[] = ((i as any).genres || []).map((g: string) => g.toLowerCase());
                    const allItemGenres = [itemGenre, ...itemGenres];
                    // Géneros
                    const hostGenreOk = hostGenres.length === 0 || hostGenres.some(g => allItemGenres.some(ig => ig.includes(g.toLowerCase())));
                    const guestGenreOk = guestGenres.length === 0 || guestGenres.some(g => allItemGenres.some(ig => ig.includes(g.toLowerCase())));
                    // Tipo
                    const combinedTypes = [...new Set([...hostTypes, ...guestTypes])];
                    const typeOk = combinedTypes.length === 0 || combinedTypes.some(t => i.type?.toLowerCase().includes(t.toLowerCase()));
                    // Época
                    const combinedEras = [...new Set([...hostEras, ...guestEras])];
                    const yr = parseInt(i.year || '0');
                    const eraOk = combinedEras.length === 0 || combinedEras.some(e => {
                      if (e === 'classic') return yr > 0 && yr < 2000;
                      if (e === 'modern') return yr >= 2000 && yr < 2020;
                      if (e === 'recent') return yr >= 2020;
                      return true;
                    });
                    return hostGenreOk && guestGenreOk && typeOk && eraOk;
                  });
                }));

                let pool = chunks.flat();
                // Fallback sem filtro guest se resultados insuficientes
                if (pool.length < 10) {
                  const fallbackChunks = await Promise.all(catIds.map(cid => loadCachedSuggestions(cid, 60, {})));
                  pool = fallbackChunks.flat().filter(i => {
                    const lang = (i as any).original_language || '';
                    return !lang || lang === 'pt' || lang === 'en';
                  });
                  if (pool.length > 0) onToast('Sem sugestões comuns com esses filtros — a usar sugestões gerais');
                }

                const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 20);
                if (shuffled.length === 0) {
                  onToast('Sem sugestões disponíveis'); setLoading(false);
                  subscribeToSession(pendingSession); setPhase('playing'); return;
                }

                const titles = shuffled.map(i => i.title);
                const localItems = shuffled.map(i => ({
                  title: i.title, img: i.img, genre: i.genre,
                  type: i.type, rating: i.rating ?? null, year: i.year ?? null,
                  description: (i as any).description ?? null,
                }));

                // Guarda filtros do guest e items na sessão (criador recebe via Realtime)
                await updateSessionFilters(pendingSession.id, guestFilters);
                await setSessionItems(pendingSession.id, titles);

                setItems(localItems);
                setCurrentIdx(0);
                setLoading(false);
                subscribeToSession(pendingSession);
                setPhase('playing');
              }}
              disabled={loading}
              style={{ width: '100%', padding: '15px', background: loading ? 'rgba(200,155,60,0.3)' : '#C89B3C', border: 'none', borderRadius: 14, color: '#0B0D12', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >
              {loading ? 'A calcular...' : 'Vamos jogar!'}
            </button>
            <button
              onClick={async () => {
                if (pendingSession) await setSessionStandby(pendingSession.id);
                setShowJoinReview(false);
                handleReset();
                onToast('Sessão em pausa — podes retomar mais tarde');
              }}
              style={{ width: '100%', padding: '15px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#8a94a8', fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >
              Não estou nesse mood — guardar para depois
            </button>
            <button
              onClick={() => { setShowJoinReview(false); handleReset(); }}
              style={{ background: 'none', border: 'none', color: 'rgba(138,148,168,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", padding: '8px' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: HOME — ecrã principal ──
  if (phase === 'home' && mode === null) {
    return (
      <div style={s.screen}>
        <div style={{ padding: '40px 20px 0' }}>
          <PageHeader label="Jogo" title="Match" onBack={onBack} />
        </div>
        <div style={s.inner}>

          {/* Sessão em curso */}
          {activeSession && (
            <div style={{ marginBottom: 24, background: 'rgba(200,155,60,0.06)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.6)', letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily: "'Outfit',sans-serif", marginBottom: 8 }}>Sessão em curso</div>
              <div style={{ fontSize: 13, color: '#f5f1eb', marginBottom: 12, fontFamily: "'Outfit',sans-serif" }}>
                {CATS.find(c => c.id === activeSession.catId.split(',')[0])?.name || 'Match'} · {activeSession.status === 'waiting' ? 'À espera de parceiro' : activeSession.status === 'standby' ? 'Em pausa' : 'Em jogo'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={async () => {
                    if (!userId) return;
                    setLoading(true);
                    const catIds = activeSession.catId.split(',');
                    const chunks = await Promise.all(catIds.map(cid => loadCachedSuggestions(cid, 100, {})));
                    const cached = chunks.flat();
                    const cacheMap = new Map(cached.map(i => [i.title, i]));
                    const orderedItems = activeSession.itemTitles.map(title => {
                      const found = cacheMap.get(title);
                      return found ? { title: found.title, img: found.img, genre: found.genre, type: found.type, rating: found.rating ?? null, year: found.year ?? null } : { title, img: null, genre: '', type: '', rating: null, year: null };
                    });
                    const previousVotes = await getMatchVotes(activeSession.id);
                    const myPreviousVoted = new Set(
                      previousVotes.filter(v => v.userId === userId).map(v => v.itemTitle)
                    );
                    setMyVotedTitles(myPreviousVoted);
                    myVotedTitlesRef.current = myPreviousVoted;
                    const firstUnvoted = orderedItems.findIndex(i => !myPreviousVoted.has(i.title));
                    setSession(activeSession);
                    setItems(orderedItems);
                    setCurrentIdx(firstUnvoted !== -1 ? firstUnvoted : 0);
                    setMyVote(null);
                    setVotes([]);
                    subscribeToSession(activeSession);
                    setPhase(activeSession.status === 'waiting' ? 'waiting' : 'playing');
                    setLoading(false);
                  }}
                  style={{ flex: 1, padding: '10px', background: '#C89B3C', border: 'none', borderRadius: 10, color: '#0B0D12', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                >
                  Continuar
                </button>
                <button
                  onClick={() => { endMatchSession(activeSession.id); setActiveSession(null); }}
                  style={{ padding: '10px 14px', background: 'rgba(224,112,112,0.08)', border: '1px solid rgba(224,112,112,0.2)', borderRadius: 10, color: '#e07070', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                >
                  Abandonar
                </button>
              </div>
            </div>
          )}

          {/* SECÇÃO 1 — Criar sessão */}
          <div style={{ marginBottom: 32 }}>
            <div style={s.lbl}>Criar sessão</div>

            <div style={{ display: 'flex', gap: 12 }}>
              {/* Local */}
              <button
                onClick={() => setMode('local')}
                style={{ flex: 1, padding: '18px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, color: '#f5f1eb', cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 10 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <circle cx="12" cy="17" r="1" fill="currentColor" />
                </svg>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>Local</div>
                  <div style={{ fontSize: 11, color: '#8a94a8', marginTop: 2 }}>Passa o telefone</div>
                </div>
              </button>

              {/* Online */}
              <button
                onClick={() => { setMode('online'); setShowFilterSetup(true); }}
                disabled={loading}
                style={{ flex: 1, padding: '18px 12px', background: loading ? 'rgba(200,155,60,0.2)' : 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.35)', borderRadius: 16, color: '#C89B3C', cursor: loading ? 'default' : 'pointer', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 10 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <circle cx="12" cy="20" r="1" fill="currentColor" />
                </svg>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{loading ? 'A criar...' : 'Online'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.6)', marginTop: 2 }}>À distância</div>
                </div>
              </button>
            </div>
          </div>

          {/* SECÇÃO 2 — Entrar em sessão */}
          <div>
            <div style={s.lbl}>Entrar em sessão</div>

            {/* Convites activos */}
            <div style={{ marginBottom: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', fontSize: 11, color: 'rgba(138,148,168,0.5)', fontFamily: "'Outfit',sans-serif", letterSpacing: 0.5, borderBottom: matchInvites.length > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                Convites activos
              </div>
              {matchInvites.length === 0 ? (
                <EmptyState
                  icon={<Zap size={24} />}
                  title="Sem sessões activas"
                  description="Cria uma sessão ou aguarda que um amigo te convide."
                />
              ) : matchInvites.map(inv => (
                <div key={inv.convId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(200,155,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#C89B3C', flexShrink: 0 }}>
                    {inv.friendName[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: '#f5f1eb', fontFamily: "'Outfit',sans-serif" }}>{inv.friendName}</div>
                  <button
                    onClick={() => onOpenMessages?.(inv.friendId, inv.friendName)}
                    style={{ padding: '6px 14px', background: '#C89B3C', border: 'none', borderRadius: 8, color: '#0B0D12', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                  >
                    Aceitar
                  </button>
                </div>
              ))}
            </div>

            {/* Ler QR Code */}
            <button
              onClick={() => onToast('Em breve — leitura de QR Code')}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: '#8a94a8', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Ler QR Code
            </button>

            <button
              onClick={() => setShowJoinCode(v => !v)}
              style={{ width: '100%', padding: '12px 16px', background: showJoinCode ? 'rgba(200,155,60,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${showJoinCode ? 'rgba(200,155,60,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, color: showJoinCode ? '#C89B3C' : '#8a94a8', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h3v3h-3z"/>
              </svg>
              Inserir código
            </button>
            {showJoinCode && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 6 }}>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Código da sessão…"
                  style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#f5f1eb', fontSize: 14, outline: 'none', fontFamily: "'Outfit',sans-serif", letterSpacing: 2 }}
                />
                <button onClick={handleJoin} disabled={loading || !joinCode.trim()}
                  style={{ padding: '12px 20px', background: joinCode.trim() ? '#C89B3C' : 'rgba(255,255,255,0.04)', border: 'none', borderRadius: 12, color: joinCode.trim() ? '#0B0D12' : '#8a94a8', fontSize: 13, fontWeight: 700, cursor: joinCode.trim() ? 'pointer' : 'default', fontFamily: "'Outfit',sans-serif" }}>
                  Entrar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: HOME — mode local (configurar jogadores) ──
  if (phase === 'home' && mode === 'local') {
    const allFilled = localPlayers.length >= 2 && localPlayers.every(p => p.trim().length > 0);

    const handleStartLocal = async () => {
      if (!allFilled) { onToast('Preenche todos os nomes'); return; }
      setLoading(true);
      const catChunks = await Promise.all(selectedCats.map(cid => loadCachedSuggestions(cid, 30, {})));
      const allCached = catChunks.flat();
      const itemList = allCached.slice(0, 20).map(i => ({
        title: i.title, img: i.img, genre: i.genre,
        type: i.type, rating: i.rating, year: i.year,
      }));
      if (itemList.length === 0) { onToast('Sem sugestões disponíveis'); setLoading(false); return; }
      setItems(itemList);
      setCurrentIdx(0);
      setLocalPlayerIdx(0);
      setLocalVotes({});
      setLoading(false);
      setPhase('local-playing');
    };

    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={() => setMode(null)}>←</button>
          <div style={s.title}>Quem joga?</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={s.inner}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.5)', letterSpacing: 1.2, textTransform: 'uppercase' as const, fontFamily: "'Outfit',sans-serif", marginBottom: 20 }}>
              {selectedCats.map(id => CAT_OPTIONS.find(c => c.id === id)?.name).filter(Boolean).join(' · ')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {localPlayers.map((name, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={name}
                    onChange={e => {
                      const updated = [...localPlayers];
                      updated[idx] = e.target.value;
                      setLocalPlayers(updated);
                    }}
                    placeholder={`Jogador ${idx + 1}`}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', color: '#f5f1eb', fontSize: 14, outline: 'none', fontFamily: "'Outfit',sans-serif" }}
                  />
                  {localPlayers.length > 2 && (
                    <button
                      onClick={() => setLocalPlayers(prev => prev.filter((_, i) => i !== idx))}
                      style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(224,112,112,0.08)', border: '1px solid rgba(224,112,112,0.2)', color: '#e07070', fontSize: 16, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {localPlayers.length < 6 && (
              <button
                onClick={() => setLocalPlayers(prev => [...prev, ''])}
                style={{ marginTop: 10, width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 12, color: '#8a94a8', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Adicionar jogador
              </button>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.6)', letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily: "'Outfit',sans-serif", marginBottom: 10 }}>Categorias</div>
              <CatPicker selected={selectedCats} onChange={setSelectedCats} />
            </div>

            <button
              onClick={handleStartLocal}
              disabled={!allFilled || loading}
              style={{ width: '100%', padding: '16px', background: allFilled && !loading ? '#C89B3C' : 'rgba(200,155,60,0.25)', color: allFilled && !loading ? '#0B0D12' : 'rgba(200,155,60,0.4)', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: allFilled && !loading ? 'pointer' : 'default', fontFamily: "'Outfit',sans-serif" }}
            >
              {loading ? 'A carregar...' : 'Começar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: LOCAL PLAYING ──
  if (phase === 'local-playing' && currentItem) {
    const playerName = localPlayers[localPlayerIdx];

    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={handleReset}>←</button>
          <div style={{ ...s.title, fontSize: 18 }}>{playerName}</div>
          <div style={{ fontSize: 12, color: '#8a94a8' }}>{currentIdx + 1}/{items.length}</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {currentItem.img ? (
              <img src={currentItem.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1d28, #0f1118)' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,13,18,0.95) 0%, rgba(11,13,18,0.3) 60%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic' as const, color: '#f5f1eb', marginBottom: 8, lineHeight: 1.1 }}>
                {currentItem.title}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {currentItem.type && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(200,155,60,0.15)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 20, color: '#C89B3C', fontFamily: "'Outfit',sans-serif" }}>{currentItem.type}</span>}
                {currentItem.genre && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#8a94a8', fontFamily: "'Outfit',sans-serif" }}>{currentItem.genre}</span>}
                {currentItem.year && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#8a94a8', fontFamily: "'Outfit',sans-serif" }}>{currentItem.year}</span>}
                {currentItem.rating && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#8a94a8', fontFamily: "'Outfit',sans-serif" }}>★ {currentItem.rating}</span>}
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 20px calc(80px + env(safe-area-inset-bottom, 16px))', display: 'flex', gap: 12 }}>
            <button onClick={() => handleLocalVote(false)}
              style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, color: '#e07b7b', fontSize: 20, cursor: 'pointer' }}>
              ✗
            </button>
            <button onClick={() => handleLocalVote(true)}
              style={{ flex: 2, padding: '16px', background: '#C89B3C', border: 'none', borderRadius: 16, color: '#0B0D12', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              Sim ✓
            </button>
          </div>
        </div>

        {showPassOverlay && createPortal(
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(11,13,18,0.97)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div style={{ fontSize: 11, color: '#C89B3C', letterSpacing: 2, textTransform: 'uppercase' as const, fontFamily: "'Outfit',sans-serif", marginBottom: 20 }}>
              Passa o telefone
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontStyle: 'italic' as const, color: '#f5f1eb', textAlign: 'center', marginBottom: 4 }}>
              Agora é a vez de
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 700, fontStyle: 'italic' as const, color: '#C89B3C', textAlign: 'center', marginBottom: 40 }}>
              {localPlayers[localPlayerIdx]}
            </div>
            <button
              onClick={() => setShowPassOverlay(false)}
              style={{ padding: '14px 40px', background: '#C89B3C', color: '#0B0D12', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >
              Pronto
            </button>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // ── PHASE: LOCAL DONE ──
  if (phase === 'local-done') {
    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={handleReset}>←</button>
          <div style={s.title}>Resultados</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={s.inner}>
          {localMatches.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontStyle: 'italic' as const, color: '#f5f1eb', marginBottom: 12 }}>
                Nenhum match desta vez
              </div>
              <div style={{ fontSize: 13, color: '#8a94a8' }}>Ninguém concordou em nenhuma opção.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 20 }}>
                {localMatches.length === 1 ? '1 match' : `${localMatches.length} matches`} — todos votaram Sim
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {localMatches.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'rgba(200,155,60,0.06)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 14, padding: '12px 14px' }}>
                    {m.img ? (
                      <img src={m.img} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(200,155,60,0.1)', flexShrink: 0 }} />
                    )}
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic' as const, color: '#f5f1eb' }}>{m.title}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          <button onClick={handleReset}
            style={{ marginTop: 32, width: '100%', padding: '14px', background: '#C89B3C', color: '#0B0D12', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            Jogar de novo
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE: WAITING (online) — redesenhado ──
  if (phase === 'waiting' && session) {
    const shortCode = session.id.slice(0, 8).toUpperCase();
    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={handleReset}>←</button>
          <div style={s.title}>Sessão criada</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ ...s.inner, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 20 }}>
          <Avatar name={displayName} size={56} color="#C89B3C" />

          {/* Categorias — resumo não editável */}
          <div style={{ width: '100%', maxWidth: 340 }}>
            <div style={{ fontSize: 11, color: 'rgba(200,155,60,0.6)', letterSpacing: 1.5, textTransform: 'uppercase' as const, fontFamily: "'Outfit',sans-serif", marginBottom: 10 }}>Categorias</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {(session?.catId || selectedCats.join(',')).split(',').map(catId => (
                <span key={catId} style={{
                  padding: '8px 14px', borderRadius: 12,
                  background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.25)',
                  color: '#C89B3C', fontSize: 13, fontFamily: "'Outfit',sans-serif", fontWeight: 600,
                }}>
                  {CAT_OPTIONS.find(c => c.id === catId)?.name || catId}
                </span>
              ))}
            </div>
          </div>

          {/* PRIORIDADE 1 — Convidar amigo */}
          {friends.length > 0 && (
            <div style={{ width: '100%', maxWidth: 340 }}>
              <button
                onClick={() => setShowFriendInvite(o => !o)}
                style={{ width: '100%', padding: '14px 20px', background: '#C89B3C', border: 'none', borderRadius: 14, color: '#0B0D12', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Convidar amigo
              </button>
              {showFriendInvite && (
                <div style={{ marginTop: 8, background: '#161820', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {friends.map(f => (
                    <div key={f.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                      onClick={async () => {
                        const catName = cat?.name || 'Ver';
                        const convId = await getOrCreateConversation(userId!, f.id);
                        if (convId) {
                          await sendMessage(convId, userId!, `MATCH_INVITE:${session!.id}:${catName}`);
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
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRIORIDADE 2 — QR Code */}
          <div style={{ width: '100%', maxWidth: 340 }}>
            <button
              onClick={() => setShowQR(q => !q)}
              style={{ width: '100%', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 16px', color: '#8a94a8', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >
              {showQR ? 'Ocultar QR Code' : 'Mostrar QR Code'}
            </button>
            {showQR && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                <div style={{ background: '#fff', padding: 12, borderRadius: 12 }}>
                  <QRCodeSVG value={shortCode} size={180} />
                </div>
              </div>
            )}
          </div>

          {/* PRIORIDADE 3 — Código discreto */}
          <div style={{ textAlign: 'center', color: 'rgba(138,148,168,0.45)', fontSize: 12, fontFamily: "'Outfit',sans-serif", lineHeight: 1.8 }}>
            ou partilha o código:{' '}
            <span style={{ color: 'rgba(200,155,60,0.55)', fontWeight: 600, letterSpacing: 2 }}>{shortCode}</span>
            {' · '}
            <span
              style={{ textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => { navigator.clipboard?.writeText(shortCode); onToast('✦ Código copiado!'); }}
            >
              copiar
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8a94a8', fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C89B3C', animation: 'pulse 1.5s infinite' }} />
            À espera do parceiro…
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: PLAYING (online) ──
  if (phase === 'playing' && session && currentItem) {
    const alreadyVoted = myVotedTitles.has(currentItem.title);

    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={handleReset}>←</button>
          <div style={s.title}>{cat?.name || 'Match'}</div>
          <div style={{ fontSize: 12, color: '#8a94a8' }}>{myVotedTitles.size}/{items.length}</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
          <div
            style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
            onTouchStart={(e) => {
              swipeStartX.current = e.touches[0].clientX;
              swipeStartY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              if (swipeStartX.current === null || swipeStartY.current === null) return;
              const dx = e.changedTouches[0].clientX - swipeStartX.current;
              const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY.current);
              swipeStartX.current = null;
              swipeStartY.current = null;
              if (Math.abs(dx) < 40 || dy > Math.abs(dx)) return;
              if (dx < 0) {
                const nextIdx = findNextUnvoted(currentIdx + 1, myVotedTitles);
                if (nextIdx !== -1) setCurrentIdx(nextIdx);
                else if (currentIdx < items.length - 1) setCurrentIdx(currentIdx + 1);
              } else {
                if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
              }
            }}
          >
            {/* Progress dots */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, display: 'flex', justifyContent: 'center', gap: 4, padding: '10px 0 4px' }}>
              {items.slice(Math.max(0, currentIdx - 2), Math.min(items.length, currentIdx + 3)).map((_, i) => {
                const realIdx = Math.max(0, currentIdx - 2) + i;
                return (
                  <div key={realIdx} style={{
                    width: realIdx === currentIdx ? 16 : 6,
                    height: 4, borderRadius: 2,
                    background: realIdx === currentIdx ? '#C89B3C' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.2s',
                  }} />
                );
              })}
            </div>
            {currentItem.img ? (
              <img src={currentItem.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1d28, #0f1118)' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,13,18,0.97) 0%, rgba(11,13,18,0.5) 50%, transparent 100%)' }} />

            <div style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, fontStyle: 'italic' as const, color: '#f5f1eb', marginBottom: 8, lineHeight: 1.1 }}>
                {currentItem.title}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: currentItem.description ? 8 : 0 }}>
                {currentItem.type && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(200,155,60,0.15)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 20, color: '#C89B3C', fontFamily: "'Outfit',sans-serif" }}>{currentItem.type}</span>}
                {currentItem.genre && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#8a94a8', fontFamily: "'Outfit',sans-serif" }}>{currentItem.genre}</span>}
                {currentItem.year && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#8a94a8', fontFamily: "'Outfit',sans-serif" }}>{currentItem.year}</span>}
                {currentItem.rating && <span style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#8a94a8', fontFamily: "'Outfit',sans-serif" }}>★ {currentItem.rating}</span>}
              </div>
              {currentItem.description && (
                <div style={{ fontSize: 12, color: 'rgba(138,148,168,0.75)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, fontFamily: "'Outfit',sans-serif" }}>
                  {currentItem.description}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '16px 20px calc(80px + env(safe-area-inset-bottom, 16px))', display: 'flex', gap: 12 }}>
            <button onClick={() => handleVote(false)} disabled={alreadyVoted}
              style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, color: '#e07b7b', fontSize: 20, cursor: alreadyVoted ? 'default' : 'pointer', opacity: alreadyVoted ? 0.4 : 1 }}>
              ✗
            </button>
            <button onClick={() => handleVote(true)} disabled={alreadyVoted}
              style={{ flex: 2, padding: '16px', background: alreadyVoted ? 'rgba(200,155,60,0.25)' : '#C89B3C', border: 'none', borderRadius: 16, color: alreadyVoted ? 'rgba(200,155,60,0.5)' : '#0B0D12', fontSize: 15, fontWeight: 700, cursor: alreadyVoted ? 'default' : 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              {alreadyVoted ? '✓ Votado' : 'Sim ✓'}
            </button>
          </div>
        </div>

        {/* Banner informativo — fecha ao clicar fora */}
        {showMatchBanner && session && createPortal(
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(11,13,18,0.85)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 32 }}
            onClick={() => setShowMatchBanner(false)}
          >
            <div
              style={{ background: '#161820', borderRadius: 20, padding: '28px 24px', maxWidth: 320, width: '100%', textAlign: 'center' as const }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontStyle: 'italic' as const, color: '#f5f1eb', marginBottom: 10 }}>
                Já votaste em {voteCount} sugestões
              </div>
              <div style={{ fontSize: 13, color: '#8a94a8', lineHeight: 1.6, marginBottom: 24 }}>
                Podes continuar a explorar ou aguardar enquanto o teu parceiro decide. O match acontece quando os dois escolherem a mesma.
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!session) return;
                  setAddingMore(true);
                  const catIds = session.catId.split(',');
                  const chunks = await Promise.all(catIds.map(cid => loadCachedSuggestions(cid, 30, {})));
                  const existing = new Set(itemsRef.current.map(i => i.title));
                  const newCandidates = chunks.flat().filter(i => {
                    const lang = (i as any).original_language || '';
                    return !existing.has(i.title) && (!lang || lang === 'pt' || lang === 'en');
                  }).slice(0, 10);
                  if (newCandidates.length > 0) {
                    await addItemsToSession(session.id, newCandidates.map(i => i.title));
                    const newLocalItems = newCandidates.map(i => ({ title: i.title, img: i.img, genre: i.genre, type: i.type, rating: i.rating ?? null, year: i.year ?? null, description: (i as any).description ?? null }));
                    setItems(prev => {
                      const firstNew = prev.length;
                      setTimeout(() => setCurrentIdx(firstNew), 0);
                      return [...prev, ...newLocalItems];
                    });
                  } else {
                    onToast('Sem mais sugestões disponíveis');
                  }
                  setShowMatchBanner(false);
                  setAddingMore(false);
                }}
                disabled={addingMore}
                style={{ width: '100%', padding: '13px', background: '#C89B3C', border: 'none', borderRadius: 12, color: '#0B0D12', fontSize: 14, fontWeight: 700, cursor: addingMore ? 'default' : 'pointer', fontFamily: "'Outfit',sans-serif", marginBottom: 10 }}
              >
                {addingMore ? 'A carregar...' : 'Explorar mais 10'}
              </button>
              <button
                onClick={() => setShowMatchBanner(false)}
                style={{ background: 'none', border: 'none', color: '#8a94a8', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
              >
                Continuar a votar
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // ── PHASE: MATCHED ──
  if (phase === 'matched' && matchedItem) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <style>{`
          @keyframes matchPop {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes matchFadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div style={{ fontSize: 72, color: '#C89B3C', marginBottom: 24, animation: 'matchPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
          ✦
        </div>
        {matchedItem.img && (
          <img src={matchedItem.img} alt="" style={{ width: '100%', maxWidth: 320, height: 200, objectFit: 'cover', borderRadius: 20, marginBottom: 20, animation: 'matchFadeUp 0.4s 0.3s both' }} />
        )}
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontStyle: 'italic' as const, color: '#C89B3C', letterSpacing: 3, marginBottom: 8, textTransform: 'uppercase' as const, animation: 'matchFadeUp 0.4s 0.4s both' }}>
          Match!
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, fontStyle: 'italic' as const, color: '#f5f1eb', textAlign: 'center', marginBottom: 6, animation: 'matchFadeUp 0.4s 0.5s both' }}>
          {matchedItem.title}
        </div>
        <div style={{ fontSize: 13, color: '#8a94a8', marginBottom: 32, animation: 'matchFadeUp 0.4s 0.6s both' }}>
          Os dois disseram sim!
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 300, animation: 'matchFadeUp 0.4s 0.7s both' }}>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `Match: ${matchedItem.title}`, text: `Fizemos match em "${matchedItem.title}" no What to!`, url: 'https://what-to-zdka.vercel.app' });
              } else {
                navigator.clipboard?.writeText(`Fizemos match em "${matchedItem.title}" no What to!`);
                onToast('✦ Copiado para partilhar!');
              }
            }}
            style={{ flex: 1, padding: '13px', background: 'rgba(200,155,60,0.15)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 14, color: '#C89B3C', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
          >
            Partilhar
          </button>
          <button onClick={handleReset}
            style={{ flex: 1, padding: '13px', background: '#C89B3C', color: '#0B0D12', border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            Fechar
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // ── PHASE: DONE (online, sem match) ──
  if (phase === 'done') {
    return (
      <div style={s.screen}>
        <div style={s.tb}>
          <button style={s.backBtn} onClick={handleReset}>←</button>
          <div style={s.title}>Match</div>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ ...s.inner, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontStyle: 'italic' as const, color: '#f5f1eb' }}>Sem match desta vez</div>
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
