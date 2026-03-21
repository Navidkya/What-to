import { useState, useEffect, useCallback } from 'react';
import {
  loadInfluencerProfile,
  loadMySuggestions,
  createSuggestion,
  deleteSuggestion,
  toggleSuggestion,
  TIER_CONFIG,
} from '../../services/influencers';
import type { InfluencerProfile, InfluencerSuggestion } from '../../services/influencers';
import { supabase } from '../../lib/supabase';

interface Props {
  isActive: boolean;
  onBack: () => void;
  onToast: (msg: string) => void;
  userId: string;
}

interface SearchResult {
  title: string;
  desc: string;
  emoji: string;
  type: string;
  genre: string;
  img: string | null;
  rating: number | null;
  year: string | null;
  duration: string | null;
}

const CATS_LIST = [
  { id: 'watch',  name: 'Ver',       emoji: '🎬' },
  { id: 'eat',    name: 'Comer',     emoji: '🍽️' },
  { id: 'read',   name: 'Ler',       emoji: '📚' },
  { id: 'listen', name: 'Ouvir',     emoji: '🎵' },
  { id: 'play',   name: 'Jogar',     emoji: '🎮' },
  { id: 'learn',  name: 'Aprender',  emoji: '🧠' },
  { id: 'visit',  name: 'Visitar',   emoji: '📍' },
  { id: 'do',     name: 'Fazer',     emoji: '🎯' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--tx)', fontFamily: "'Outfit', sans-serif", fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
};

function tierBadgeStyle(tier: 'base' | 'silver' | 'gold'): React.CSSProperties {
  if (tier === 'gold') return { background: 'linear-gradient(135deg,#C89B3C,#a87535)', color: '#0B0D12', border: 'none' };
  if (tier === 'silver') return { background: 'rgba(156,165,185,0.2)', color: '#c8d0e0', border: '1px solid rgba(156,165,185,0.4)' };
  return { background: 'rgba(200,155,60,0.15)', color: 'var(--ac)', border: '1px solid rgba(200,155,60,0.3)' };
}

export default function CreatorDashboard({ isActive, onBack, onToast, userId }: Props) {
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [suggestions, setSuggestions] = useState<InfluencerSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [newCatId, setNewCatId] = useState('watch');
  const [publishing, setPublishing] = useState(false);

  // Manual form for visit/do
  const [manualEmoji, setManualEmoji] = useState('📍');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');

  const isManualCat = newCatId === 'visit' || newCatId === 'do';

  const reload = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const p = await loadInfluencerProfile(userId);
    setProfile(p);
    if (p) {
      const suggs = await loadMySuggestions(p.id);
      setSuggestions(suggs);
    }
    const { data: { user } } = await supabase.auth.getUser();
    setEmailConfirmed(!!user?.email_confirmed_at);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (isActive) reload();
  }, [isActive, reload]);

  if (!isActive) return null;

  const activeCat = CATS_LIST.find(c => c.id === newCatId);
  const defaultEmoji = activeCat?.emoji || '✦';

  const allowedCats = profile
    ? (profile.allowedCats.length > 0 ? CATS_LIST.filter(c => profile.allowedCats.includes(c.id)) : CATS_LIST)
    : CATS_LIST;

  const activeCount = suggestions.filter(s => s.active && new Date(s.expiresAt) > new Date()).length;
  const maxActive = profile ? TIER_CONFIG[profile.tier].maxActive : 3;
  const atLimit = activeCount >= maxActive;

  const resendEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.auth.resend({ type: 'signup', email: user.email });
      onToast('✉️ Email de confirmação reenviado!');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    const q = encodeURIComponent(searchQuery.trim());
    try {
      let results: SearchResult[] = [];
      if (newCatId === 'watch') {
        const tmdbKey = import.meta.env.VITE_TMDB_KEY as string;
        if (tmdbKey) {
          const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${q}&language=pt-PT`);
          const data = await res.json() as { results?: Array<Record<string, unknown>> };
          results = (data.results || []).slice(0, 10).map(r => ({
            title: (r.title || r.name || '') as string,
            desc: ((r.overview as string) || '').substring(0, 120),
            emoji: r.media_type === 'movie' ? '🎬' : '📺',
            type: r.media_type === 'movie' ? 'Filme' : 'Série',
            genre: '',
            img: r.backdrop_path
              ? `https://image.tmdb.org/t/p/w780${r.backdrop_path as string}`
              : r.poster_path
                ? `https://image.tmdb.org/t/p/w780${r.poster_path as string}`
                : null,
            rating: r.vote_average ? Math.round((r.vote_average as number) * 10) / 10 : null,
            year: ((r.release_date || r.first_air_date) as string)?.substring(0, 4) || null,
            duration: null,
          }));
        }
      } else if (newCatId === 'play') {
        const rawgKey = import.meta.env.VITE_RAWG_KEY as string;
        if (rawgKey) {
          const res = await fetch(`https://api.rawg.io/api/games?key=${rawgKey}&search=${q}&page_size=10`);
          const data = await res.json() as { results?: Array<Record<string, unknown>> };
          results = (data.results || []).slice(0, 10).map(r => ({
            title: r.name as string,
            desc: '',
            emoji: '🎮',
            type: 'Videojogo',
            genre: ((r.genres as Array<{ name: string }>)?.[0]?.name) || 'Jogo',
            img: (r.background_image as string) || null,
            rating: r.rating ? Math.round((r.rating as number) * 10) / 10 : null,
            year: ((r.released as string) || '').substring(0, 4) || null,
            duration: null,
          }));
        }
      } else if (newCatId === 'read') {
        const booksKey = import.meta.env.VITE_GOOGLE_BOOKS_KEY as string;
        const url = booksKey
          ? `https://www.googleapis.com/books/v1/volumes?key=${booksKey}&q=${q}&maxResults=10`
          : `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=10`;
        const res = await fetch(url);
        const data = await res.json() as { items?: Array<Record<string, unknown>> };
        results = (data.items || []).slice(0, 10).map(r => {
          const info = r.volumeInfo as Record<string, unknown>;
          const imgLinks = info.imageLinks as Record<string, string> | undefined;
          return {
            title: info.title as string,
            desc: ((info.description as string) || '').substring(0, 120),
            emoji: '📚',
            type: 'Livro',
            genre: ((info.categories as string[]) || [])[0] || 'Literatura',
            img: imgLinks?.thumbnail?.replace('http:', 'https:') || null,
            rating: (info.averageRating as number) || null,
            year: ((info.publishedDate as string) || '').substring(0, 4) || null,
            duration: null,
          };
        });
      } else if (newCatId === 'listen') {
        const deezerUrl = `https://corsproxy.io/?${encodeURIComponent(`https://api.deezer.com/search/album?q=${searchQuery.trim()}&limit=10`)}`;
        const res = await fetch(deezerUrl);
        const data = await res.json() as { data?: Array<Record<string, unknown>> };
        results = (data.data || []).slice(0, 10).map(r => ({
          title: r.title as string,
          desc: (r.artist as Record<string, unknown>)?.name as string || '',
          emoji: '🎵',
          type: 'Álbum',
          genre: 'Música',
          img: (r.cover_xl as string) || null,
          rating: null,
          year: null,
          duration: null,
        }));
      } else if (newCatId === 'learn') {
        const ytKey = import.meta.env.VITE_YOUTUBE_KEY as string;
        if (ytKey) {
          const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${ytKey}&q=${q}&part=snippet&type=video&maxResults=10`);
          const data = await res.json() as { items?: Array<Record<string, unknown>> };
          results = (data.items || []).slice(0, 10).map(r => {
            const snippet = r.snippet as Record<string, unknown>;
            const thumbs = snippet.thumbnails as Record<string, { url: string }>;
            const vidId = r.id as Record<string, string>;
            return {
              title: snippet.title as string,
              desc: ((snippet.description as string) || '').substring(0, 120),
              emoji: '🧠',
              type: 'Vídeo',
              genre: 'Aprender',
              img: thumbs?.high?.url || null,
              rating: null,
              year: ((snippet.publishedAt as string) || '').substring(0, 4) || null,
              duration: vidId?.videoId ? `youtube.com/watch?v=${vidId.videoId}` : null,
            };
          });
        }
      } else if (newCatId === 'eat') {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${q}`);
        const data = await res.json() as { meals?: Array<Record<string, unknown>> };
        results = (data.meals || []).slice(0, 10).map(r => ({
          title: r.strMeal as string,
          desc: ((r.strInstructions as string) || '').substring(0, 120),
          emoji: '🍽️',
          type: 'Receita',
          genre: (r.strCategory as string) || 'Culinária',
          img: (r.strMealThumb as string) || null,
          rating: null,
          year: null,
          duration: null,
        }));
      }
      setSearchResults(results);
    } catch (err) {
      onToast('Erro na pesquisa');
    }
    setSearching(false);
  };

  const handlePublish = async () => {
    if (!profile) return;
    if (atLimit) { onToast(`Limite de ${maxActive} sugestões atingido`); return; }

    const catInfo = CATS_LIST.find(c => c.id === newCatId);

    let payload: Omit<InfluencerSuggestion, 'id' | 'influencerId' | 'influencerName' | 'influencerHandle' | 'influencerTier' | 'expiresAt' | 'active' | 'createdAt'>;

    if (isManualCat) {
      if (!manualTitle.trim()) { onToast('Escreve um título'); return; }
      payload = {
        title: manualTitle.trim(),
        desc: manualDesc.trim(),
        emoji: manualEmoji || defaultEmoji,
        catId: newCatId,
        cat: catInfo?.name || newCatId,
        type: catInfo?.name || newCatId,
        genre: catInfo?.name || newCatId,
        img: null,
        rating: null,
        year: null,
        duration: null,
      };
    } else {
      if (!selectedResult) { onToast('Selecciona um resultado'); return; }
      payload = {
        title: selectedResult.title,
        desc: selectedResult.desc,
        emoji: selectedResult.emoji || defaultEmoji,
        catId: newCatId,
        cat: catInfo?.name || newCatId,
        type: selectedResult.type,
        genre: selectedResult.genre,
        img: selectedResult.img,
        rating: selectedResult.rating,
        year: selectedResult.year,
        duration: selectedResult.duration,
      };
    }

    setPublishing(true);
    const result = await createSuggestion(profile.id, profile.tier, payload);
    setPublishing(false);

    if (!result.ok) {
      onToast(result.error || 'Erro ao publicar');
      return;
    }

    onToast('✦ Sugestão publicada!');
    setAdding(false);
    setSelectedResult(null);
    setSearchResults([]);
    setSearchQuery('');
    setManualTitle('');
    setManualDesc('');
    await reload();
  };

  const handleDelete = async (id: string) => {
    await deleteSuggestion(id);
    setSuggestions(prev => prev.filter(s => s.id !== id));
    onToast('Sugestão removida');
  };

  const handleToggle = async (id: string, current: boolean) => {
    if (!current && atLimit) { onToast(`Limite de ${maxActive} sugestões atingido`); return; }
    await toggleSuggestion(id, !current);
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, active: !current } : s));
  };

  return (
    <div className="screen active" id="creator-dashboard" style={{ overflowY: 'auto', paddingBottom: 40 }}>
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 52, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--mu)', fontSize: 20, cursor: 'pointer', padding: 4, flexShrink: 0 }}>←</button>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, fontStyle: 'italic', color: 'var(--tx)' }}>
            Painel do Criador
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--mu)' }}>A carregar…</div>
        ) : !profile ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--mu)' }}>
            <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.3 }}>✦</div>
            <div style={{ fontSize: 15, marginBottom: 8 }}>Perfil não encontrado</div>
            <div style={{ fontSize: 12 }}>O teu perfil de criador ainda não foi aprovado.</div>
            <button onClick={onBack} style={{ marginTop: 20, padding: '11px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'var(--mu)', fontFamily: "'Outfit',sans-serif", fontSize: 13, cursor: 'pointer' }}>← voltar</button>
          </div>
        ) : (
          <>
            {/* Email confirmation banner (informativo, não bloqueia) */}
            {!emailConfirmed && (
              <div style={{ margin: '0 0 16px', padding: '12px 16px', background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ac)', fontFamily: "'Outfit',sans-serif" }}>✉️ Confirma o teu email</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>Para garantires acesso permanente à tua conta</div>
                </div>
                <button onClick={resendEmail} style={{ padding: '6px 12px', background: 'rgba(200,155,60,0.12)', border: '1px solid rgba(200,155,60,0.25)', borderRadius: 8, color: 'var(--ac)', fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Reenviar
                </button>
              </div>
            )}

            {/* Profile card */}
            <div style={{ padding: '16px', background: 'rgba(200,155,60,0.06)', border: '1px solid rgba(200,155,60,0.18)', borderRadius: 18, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#C89B3C,#a87535)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#0B0D12', flexShrink: 0 }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)', fontFamily: "'Outfit',sans-serif" }}>{profile.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--mu)' }}>@{profile.handle}</div>
                </div>
                <div style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif", flexShrink: 0, ...tierBadgeStyle(profile.tier) }}>
                  {TIER_CONFIG[profile.tier].label}
                </div>
              </div>

              {/* Usage bar */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--mu)' }}>Sugestões activas</span>
                  <span style={{ fontSize: 11, color: atLimit ? 'var(--rd)' : 'var(--mu)' }}>{activeCount} / {maxActive}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (activeCount / maxActive) * 100)}%`, background: atLimit ? 'var(--rd)' : 'linear-gradient(90deg,#C89B3C,#a87535)', borderRadius: 100, transition: 'width 0.4s' }} />
                </div>
              </div>
            </div>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--mu)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>
                As tuas sugestões · {suggestions.length}
              </div>
              {!adding && (
                <button
                  onClick={() => { setAdding(true); setSelectedResult(null); setSearchResults([]); setSearchQuery(''); }}
                  disabled={atLimit}
                  style={{ padding: '7px 14px', background: atLimit ? 'rgba(255,255,255,0.04)' : 'rgba(200,155,60,0.1)', border: `1px solid ${atLimit ? 'rgba(255,255,255,0.08)' : 'rgba(200,155,60,0.3)'}`, borderRadius: 20, color: atLimit ? 'var(--mu)' : 'var(--ac)', fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif", cursor: atLimit ? 'not-allowed' : 'pointer', opacity: atLimit ? 0.5 : 1 }}
                >
                  + Nova sugestão
                </button>
              )}
            </div>

            {/* Add form */}
            {adding && (
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Nova sugestão</div>

                {/* Category selector */}
                <select
                  value={newCatId}
                  onChange={e => { setNewCatId(e.target.value); setSelectedResult(null); setSearchResults([]); setSearchQuery(''); }}
                  style={{ ...inputStyle, marginBottom: 10 }}
                >
                  {allowedCats.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#0B0D12' }}>{c.emoji} {c.name}</option>
                  ))}
                </select>

                {isManualCat ? (
                  /* Manual form for visit/do */
                  <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input value={manualEmoji} onChange={e => setManualEmoji(e.target.value)} placeholder={defaultEmoji} style={{ ...inputStyle, width: 56, flexShrink: 0, textAlign: 'center', fontSize: 20 }} />
                      <input value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="Título" style={{ ...inputStyle, flex: 1 }} />
                    </div>
                    <textarea value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder="Descrição (opcional)" rows={2} style={{ ...inputStyle, resize: 'none', lineHeight: 1.5, marginBottom: 10 }} />
                  </>
                ) : (
                  /* Search-based */
                  <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder={`Pesquisar ${activeCat?.name || ''}…`}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button onClick={handleSearch} disabled={searching} style={{ padding: '0 16px', background: 'rgba(200,155,60,0.1)', border: '1px solid rgba(200,155,60,0.3)', borderRadius: 10, color: 'var(--ac)', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>
                        {searching ? '…' : 'Pesquisar'}
                      </button>
                    </div>

                    {/* Search results */}
                    {searchResults.length > 0 && !selectedResult && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, maxHeight: 280, overflowY: 'auto' }}>
                        {searchResults.map((r, i) => (
                          <button key={i} onClick={() => setSelectedResult(r)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
                            {r.img ? (
                              <img src={r.img} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <span style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{r.emoji}</span>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Outfit',sans-serif" }}>{r.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>{r.type}{r.year ? ` · ${r.year}` : ''}{r.rating ? ` · ⭐ ${r.rating}` : ''}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected preview */}
                    {selectedResult && (
                      <div style={{ padding: 12, background: 'rgba(200,155,60,0.05)', border: '1px solid rgba(200,155,60,0.2)', borderRadius: 10, marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {selectedResult.img ? (
                            <img src={selectedResult.img} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <span style={{ fontSize: 32, flexShrink: 0 }}>{selectedResult.emoji}</span>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', fontFamily: "'Outfit',sans-serif" }}>{selectedResult.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>{selectedResult.type}{selectedResult.year ? ` · ${selectedResult.year}` : ''}</div>
                          </div>
                          <button onClick={() => { setSelectedResult(null); }} style={{ background: 'none', border: 'none', color: 'var(--mu)', cursor: 'pointer', fontSize: 18, padding: 4, flexShrink: 0 }}>×</button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#C89B3C,#a87535)', border: 'none', borderRadius: 10, color: '#0B0D12', fontWeight: 700, fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: publishing ? 'not-allowed' : 'pointer', opacity: publishing ? 0.7 : 1 }}
                  >
                    {publishing ? 'A publicar…' : 'Publicar sugestão'}
                  </button>
                  <button
                    onClick={() => { setAdding(false); setSelectedResult(null); setSearchResults([]); setSearchQuery(''); setManualTitle(''); setManualDesc(''); }}
                    style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'var(--mu)', fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Suggestions list */}
            {suggestions.length === 0 && !adding ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 10 }}>
                <div style={{ fontSize: 36, opacity: 0.2 }}>✦</div>
                <div style={{ fontSize: 13, color: 'var(--mu)', textAlign: 'center' }}>Ainda não publicaste nenhuma sugestão</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {suggestions.map(s => {
                  const isExpired = new Date(s.expiresAt) < new Date();
                  const daysLeft = Math.max(0, Math.ceil((new Date(s.expiresAt).getTime() - Date.now()) / 86400000));
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, opacity: isExpired ? 0.5 : 1 }}>
                      {s.img ? (
                        <img src={s.img} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{s.emoji}</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 2 }}>
                          {s.cat}{isExpired ? ' · Expirada' : ` · ${daysLeft}d restantes`}
                        </div>
                      </div>
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(s.id, s.active)}
                        title={s.active ? 'Desactivar' : 'Activar'}
                        style={{ width: 28, height: 28, borderRadius: 8, background: s.active ? 'rgba(94,201,122,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${s.active ? 'rgba(94,201,122,0.3)' : 'rgba(255,255,255,0.1)'}`, color: s.active ? 'var(--gn)' : 'var(--mu)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        {s.active ? '●' : '○'}
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(224,112,112,0.06)', border: '1px solid rgba(224,112,112,0.2)', color: 'var(--rd)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Metrics */}
            <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--mu)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'Outfit',sans-serif" }}>Métricas</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)', fontFamily: "'Cormorant Garamond',serif" }}>0</div>
                  <div style={{ fontSize: 10, color: 'var(--mu)' }}>Views</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--tx)', fontFamily: "'Cormorant Garamond',serif" }}>0</div>
                  <div style={{ fontSize: 10, color: 'var(--mu)' }}>Accepts</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(156,165,185,0.4)', marginTop: 10 }}>As métricas aparecem após aprovação</div>
            </div>

            <button onClick={onBack} style={{ width: '100%', padding: '13px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: 'var(--mu)', fontSize: 13, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' }}>
              Sair do painel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
