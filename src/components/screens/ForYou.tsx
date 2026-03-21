import { useState, useRef, useEffect } from 'react';
import type { Profile, HistoryEntry, TrackingMap, Screen, UserList, UserListItem } from '../../types';
import { DATA, CATS, GRAD } from '../../data';
import { fetchTMDB } from '../../services/tmdb';
import { fetchMeal } from '../../services/mealdb';
import { fetchBookCover, getSteamImageUrl } from '../../services/openLibrary';
import { loadActiveSuggestions } from '../../services/influencers';
import type { InfluencerSuggestion } from '../../services/influencers';

interface ForYouSlide {
  title: string;
  desc: string;
  emoji: string;
  catId: string;
  catName: string;
  type: string;
  genre: string;
  rating?: number;
  year?: string;
  platforms: Array<{ n: string; url: string; c: string }>;
  img: string | null;
  steamId?: number | null;
  influencer?: { name: string; handle: string; tier: 'gold' };
}

interface Props {
  profile: Profile;
  history: HistoryEntry[];
  tracking: TrackingMap;
  lists: UserList[];
  isActive: boolean;
  onBack: () => void;
  onNav: (screen: Screen) => void;
  onUpdateLists: (lists: UserList[]) => void;
  onToast: (msg: string) => void;
}

function getContextualImg(catId: string, genre: string): string {
  if (catId === 'do') {
    if (genre === 'Natureza') return 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=90';
    if (genre === 'Criativo') return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=90';
    if (genre === 'Social') return 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=90';
    return 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=90';
  }
  if (catId === 'visit') return 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=90';
  if (catId === 'learn') return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=90';
  if (catId === 'listen') {
    if (genre === 'Podcast') return 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=90';
    return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=90';
  }
  return 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=800&q=90';
}

function buildForYouSlides(history: HistoryEntry[], _profile: Profile): ForYouSlide[] {
  const genreCount: Record<string, number> = {};
  const catCount: Record<string, number> = {};
  const seenTitles = new Set(history.map(h => h.title));

  history.filter(h => h.action === 'agora' || h.action === 'hoje').forEach(h => {
    if (h.genre) genreCount[h.genre] = (genreCount[h.genre] || 0) + 1;
    catCount[h.catId] = (catCount[h.catId] || 0) + 1;
  });

  const candidates: Array<ForYouSlide & { score: number }> = [];
  const cats = ['watch', 'eat', 'play', 'read', 'listen', 'do', 'learn', 'visit'];

  cats.forEach(catId => {
    const cat = CATS.find(c => c.id === catId);
    if (!cat) return;
    (DATA[catId] || []).forEach(item => {
      if (seenTitles.has(item.title)) return;
      const score =
        (genreCount[item.genre] || 0) * 3 +
        (catCount[catId] || 0) * 1 +
        (item.rating || 0) * 0.5 +
        Math.random() * 2;
      candidates.push({
        title: item.title,
        desc: item.desc,
        emoji: item.emoji,
        catId,
        catName: cat.name,
        type: item.type,
        genre: item.genre,
        rating: item.rating,
        year: item.year,
        platforms: item.platforms || [],
        img: null,
        steamId: item.steamId,
        score,
      });
    });
  });

  if (history.length === 0) {
    candidates.forEach(c => { c.score = (c.rating || 0) + Math.random() * 2; });
  }

  candidates.sort((a, b) => b.score - a.score);

  const catUsed: Record<string, number> = {};
  const result: ForYouSlide[] = [];
  for (const c of candidates) {
    if (result.length >= 10) break;
    catUsed[c.catId] = (catUsed[c.catId] || 0) + 1;
    if (catUsed[c.catId] > 3) continue;
    result.push(c);
  }

  return result;
}

function buildMixedSlides(base: ForYouSlide[], influencers: InfluencerSuggestion[]): ForYouSlide[] {
  const goldSlides: ForYouSlide[] = influencers
    .filter(s => s.influencerTier === 'gold')
    .slice(0, 3)
    .map(s => {
      const cat = CATS.find(c => c.id === s.catId);
      return {
        title: s.title,
        desc: s.desc,
        emoji: s.emoji,
        catId: s.catId,
        catName: cat?.name || s.cat,
        type: s.type,
        genre: s.genre,
        rating: s.rating || undefined,
        year: s.year || undefined,
        platforms: [],
        img: s.img,
        influencer: { name: s.influencerName, handle: s.influencerHandle, tier: 'gold' as const },
      };
    });

  if (goldSlides.length === 0) return base.slice(0, 10);

  const mixed: ForYouSlide[] = [];
  const positions = [3, 6, 9];
  let infIdx = 0;
  for (let i = 0; i < base.length || infIdx < goldSlides.length; i++) {
    if (mixed.length >= 10) break;
    if (positions.includes(mixed.length) && infIdx < goldSlides.length) {
      mixed.push(goldSlides[infIdx++]);
    } else if (i < base.length) {
      mixed.push(base[i]);
    }
  }
  return mixed.slice(0, 10);
}

function getActionLabel(catId: string): string {
  switch (catId) {
    case 'watch': return 'Ver';
    case 'play': return 'Jogar';
    case 'read': return 'Ler';
    case 'listen': return 'Ouvir';
    case 'visit': return 'Visitar';
    case 'eat': return 'Comer';
    case 'learn': return 'Aprender';
    default: return 'Abrir';
  }
}

export default function ForYou({
  profile: _profile,
  history,
  tracking: _tracking,
  lists,
  isActive,
  onBack,
  onNav: _onNav,
  onUpdateLists,
  onToast,
}: Props) {
  const [baseSlides] = useState<ForYouSlide[]>(() => buildForYouSlides(history, _profile));
  const [slides, setSlides] = useState<ForYouSlide[]>(() => buildForYouSlides(history, _profile));
  const [activeIdx, setActiveIdx] = useState(0);
  const [images, setImages] = useState<Record<string, string>>({});
  const [addListOpen, setAddListOpen] = useState(false);
  const fetchedRef = useRef(new Set<string>());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i >= slides.length - 1 ? 0 : i + 1));
    }, 8000);
  };

  useEffect(() => {
    if (!isActive) return;
    resetTimer();
    // Load influencer suggestions and mix
    loadActiveSuggestions().then(all => {
      const gold = all.filter(s => s.influencerTier === 'gold').slice(0, 3);
      const mixed = buildMixedSlides(baseSlides, gold);
      setSlides(mixed);
    }).catch(() => { /* ignore */ });
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, baseSlides.length]);

  // Fetch images
  useEffect(() => {
    const toFetch = [slides[activeIdx], slides[activeIdx + 1]].filter(Boolean);
    toFetch.forEach(slide => {
      if (!slide || fetchedRef.current.has(slide.title)) return;
      fetchedRef.current.add(slide.title);

      // Influencer slides: use img directly if available
      if (slide.influencer && slide.img) {
        setImages(prev => ({ ...prev, [slide.title]: slide.img as string }));
        return;
      }

      (async () => {
        let img: string | null = null;
        try {
          if (slide.catId === 'watch') {
            const tmdbType = slide.type === 'Filme' ? 'movie' : 'tv';
            const data = await fetchTMDB(slide.title, tmdbType);
            img = data?.backdropUrl || data?.posterUrl || null;
          } else if (slide.catId === 'eat' && slide.type === 'Receita') {
            const meal = await fetchMeal(slide.title);
            img = meal?.photoUrl || null;
          } else if (slide.catId === 'read') {
            img = await fetchBookCover(slide.title);
            if (!img) img = 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=90';
          } else if (slide.catId === 'play' && slide.steamId) {
            img = getSteamImageUrl(slide.steamId);
          }
        } catch { /* skip */ }

        // Fallback for categories without API images
        if (!img && ['do', 'visit', 'learn', 'listen'].includes(slide.catId)) {
          img = getContextualImg(slide.catId, slide.genre);
        }

        if (img) {
          setImages(prev => ({ ...prev, [slide.title]: img as string }));
        }
      })();
    });
  }, [activeIdx, slides]);

  // Touch swipe
  const dragStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { dragStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    const dx = e.changedTouches[0].clientX - dragStart.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && activeIdx < slides.length - 1) { setActiveIdx(i => i + 1); resetTimer(); }
      if (dx > 0 && activeIdx > 0) { setActiveIdx(i => i - 1); resetTimer(); }
    }
    dragStart.current = null;
  };

  // Mouse drag refs
  const mouseDragRef = useRef<number | null>(null);
  const mouseDraggingRef = useRef(false);

  const slide = slides[activeIdx];
  if (!isActive) return null;
  if (!slide) return null;

  const img = slide.influencer && slide.img ? slide.img : (images[slide.title] || null);
  const cat = CATS.find(c => c.id === slide.catId);
  const primaryPlatform = slide.platforms?.[0] || null;

  return (
    <div
      className="screen active"
      id="for-you"
      style={{ background: '#060810', paddingBottom: 80, display: 'flex', flexDirection: 'column' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="tb" style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <button className="tbi" onClick={onBack}>←</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic', fontWeight: 600, color: '#f5f1eb' }}>
            Para ti
          </span>
          <span style={{ fontSize: 10, color: 'var(--mu)', letterSpacing: 1 }}>
            {activeIdx + 1} / {slides.length}
          </span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '0 20px 12px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setActiveIdx(i); resetTimer(); }}
            style={{
              height: 3, flex: 1, borderRadius: 100,
              background: i === activeIdx ? '#C89B3C' : i < activeIdx ? 'rgba(200,155,60,0.35)' : 'rgba(255,255,255,0.15)',
              border: 'none', cursor: 'pointer', padding: 0, transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', width: '100%', padding: '0 16px', overflowY: 'auto', userSelect: 'none' }}
        onMouseDown={e => { mouseDragRef.current = e.clientX; mouseDraggingRef.current = false; }}
        onMouseMove={e => { if (mouseDragRef.current === null) return; if (Math.abs(e.clientX - mouseDragRef.current) > 8) mouseDraggingRef.current = true; }}
        onMouseUp={e => {
          if (mouseDragRef.current === null) return;
          const dx = e.clientX - mouseDragRef.current;
          mouseDragRef.current = null;
          if (Math.abs(dx) > 50) {
            if (dx < 0 && activeIdx < slides.length - 1) { setActiveIdx(i => i + 1); resetTimer(); }
            if (dx > 0 && activeIdx > 0) { setActiveIdx(i => i - 1); resetTimer(); }
          }
          mouseDraggingRef.current = false;
        }}
        onMouseLeave={() => { mouseDragRef.current = null; }}
      >
        <div key={activeIdx} style={{ transition: 'opacity 0.3s ease', opacity: 1 }}>
          <div
            className="cin-card"
            style={{ cursor: 'default', userSelect: 'none' }}
          >
            {/* Poster */}
            <div
              className="cin-poster"
              style={!img ? { background: `linear-gradient(${GRAD[slide.catId] || '135deg,#111,#222'})` } : undefined}
            >
              {img && (
                <img
                  className="cin-poster-img"
                  src={img}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', position: 'absolute', inset: 0, display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              {!img && <span className="cin-em">{slide.emoji}</span>}
              <div className="cin-overlay" />
              <div className="cin-badge">{cat?.icon} {slide.catName}</div>

              {/* Source badge — always visible */}
              <div className={
                slide.influencer?.tier === 'gold' ? 'inf-badge inf-badge-gold' :
                'inf-badge inf-badge-app'
              }>
                {slide.influencer?.tier === 'gold'
                  ? `✦ Gold · @${slide.influencer.handle}`
                  : '✦ What to'}
              </div>
            </div>

            {/* Info */}
            <div className="cin-body">
              <div className="cin-title">{slide.title}</div>
              <div className="cin-meta">
                <span>{slide.type}</span>
                {slide.genre && <><span className="cin-meta-sep"> · </span><span>{slide.genre}</span></>}
                {slide.year && <><span className="cin-meta-sep"> · </span><span>{slide.year}</span></>}
                {slide.rating && <><span className="cin-meta-sep"> · </span><span>⭐ {slide.rating}</span></>}
              </div>
              <div className="cin-desc">{slide.desc}</div>

              {slide.platforms.length > 0 && (
                <div className="cin-actions">
                  {slide.platforms.map((p, j) => (
                    <button key={j} className="pb" onClick={() => window.open(p.url, '_blank', 'noopener,noreferrer')}>
                      <span className="dot" style={{ background: p.c }} />{p.n}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 8 }}>
                {primaryPlatform && (
                  <button
                    onClick={() => { window.open(primaryPlatform.url, '_blank', 'noopener,noreferrer'); resetTimer(); }}
                    style={{ flex: 1, padding: '14px', borderRadius: 50, background: 'linear-gradient(135deg, #C89B3C, #a87535)', border: 'none', color: '#0B0D12', fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    {getActionLabel(slide.catId)}
                  </button>
                )}
                <button
                  onClick={() => setAddListOpen(true)}
                  style={{ width: 52, padding: '14px 0', borderRadius: 50, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(245,241,235,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add to list panel */}
      {addListOpen && (
        <div className="ov on" onClick={e => { if (e.target === e.currentTarget) setAddListOpen(false); }}>
          <div className="panel" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="panel-drag" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 24 }}>{slide.emoji}</span>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: 'var(--tx)' }}>{slide.title}</div>
                <div style={{ fontSize: 11, color: 'var(--mu)', marginTop: 1 }}>Guardar em lista</div>
              </div>
            </div>
            {lists.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--mu)', fontSize: 13 }}>
                Ainda não tens listas.<br />Cria uma na tab Lista.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {lists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => {
                      const item: UserListItem = {
                        id: Math.random().toString(36).slice(2, 9),
                        title: slide.title,
                        emoji: slide.emoji,
                        catId: slide.catId,
                        cat: slide.catName,
                        type: slide.type,
                        addedAt: new Date().toISOString(),
                      };
                      const updated = lists.map(l =>
                        l.id === list.id
                          ? { ...l, items: [...l.items.filter(i => i.title !== item.title), item] }
                          : l
                      );
                      onUpdateLists(updated);
                      onToast(`\u2661 Guardado em "${list.name}"`);
                      setAddListOpen(false);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, cursor: 'pointer', fontFamily: "'Outfit', sans-serif", textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 20 }}>{list.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{list.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--mu)' }}>{list.items.length} itens</div>
                    </div>
                    <span style={{ color: 'var(--mu)', fontSize: 16 }}>+</span>
                  </button>
                ))}
              </div>
            )}
            <button className="why-back-btn" onClick={() => setAddListOpen(false)}>← voltar</button>
          </div>
        </div>
      )}
    </div>
  );
}
