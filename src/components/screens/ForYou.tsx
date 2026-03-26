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
  initialCatId?: string;
  initialTitle?: string;
}

function getCatIcon(catId: string) {
  const props = { width:12, height:12, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"1.5", strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  switch(catId) {
    case 'watch': return <svg {...props}><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 2l-4 5-4-5"/></svg>;
    case 'eat': return <svg {...props}><path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2"/><path d="M5 2v20M21 2c0 0-2 2-2 8h4c0-6-2-8-2-8z"/><path d="M19 10v12"/></svg>;
    case 'read': return <svg {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case 'listen': return <svg {...props}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case 'play': return <svg {...props}><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="13" r="1" fill="currentColor" stroke="none"/></svg>;
    case 'learn': return <svg {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case 'visit': return <svg {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'do': return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    default: return <svg {...props}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

function getUnsplashFallback(catId: string, genre: string): string {
  if (catId === 'eat') {
    if (genre === 'Restaurante') return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=90';
    if (genre === 'Delivery') return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=90';
    if (genre === 'Receita') return 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=90';
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=90';
  }
  if (catId === 'do') {
    if (genre === 'Natureza') return 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=90';
    if (genre === 'Criativo') return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=90';
    if (genre === 'Social') return 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=90';
    return 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=90';
  }
  if (catId === 'visit') {
    if (genre === 'Museu' || genre === 'Arte') return 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=90';
    if (genre === 'Natureza') return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=90';
    if (genre === 'Bar') return 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=90';
    return 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=90';
  }
  if (catId === 'learn') {
    if (genre === 'Tecnologia' || genre === 'IA') return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=90';
    if (genre === 'Arte' || genre === 'Design') return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=90';
    if (genre === 'Ciência') return 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=90';
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=90';
  }
  if (catId === 'listen') {
    if (genre === 'Podcast') return 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=90';
    if (genre === 'Jazz') return 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=90';
    if (genre === 'Hip-Hop') return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=90';
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=90';
  }
  if (catId === 'play') return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=90';
  if (catId === 'watch') return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=90';
  if (catId === 'read') return 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=90';
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
  initialCatId: _initialCatId,
  initialTitle,
}: Props) {
  const [baseSlides] = useState<ForYouSlide[]>(() => buildForYouSlides(history, _profile));
  const [slides, setSlides] = useState<ForYouSlide[]>(() => buildForYouSlides(history, _profile));
  const [activeIdx, setActiveIdx] = useState(0);
  const [images, setImages] = useState<Record<string, string>>({});
  const [addListOpen, setAddListOpen] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const fetchedRef = useRef(new Set<string>());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const panDirRef = useRef(0);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      panDirRef.current = (panDirRef.current + 1) % 2;
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
      // Se veio de uma sugestão específica, vai para esse slide
      if (initialTitle) {
        const idx = mixed.findIndex(s => s.title === initialTitle);
        if (idx >= 0) setActiveIdx(idx);
      }
    }).catch(() => {});
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

        // Fallback for all categories without API images
        if (!img) {
          img = getUnsplashFallback(slide.catId, slide.genre);
        }

        if (img) {
          setImages(prev => ({ ...prev, [slide.title]: img as string }));
        }
      })();
    });
  }, [activeIdx, slides]);

  // Touch swipe (mobile)
  const dragStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { dragStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    const dx = e.changedTouches[0].clientX - dragStart.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && activeIdx < slides.length - 1) { panDirRef.current = (panDirRef.current + 1) % 2; setActiveIdx(i => i + 1); resetTimer(); }
      if (dx > 0 && activeIdx > 0) { panDirRef.current = (panDirRef.current + 1) % 2; setActiveIdx(i => i - 1); resetTimer(); }
    }
    dragStart.current = null;
  };

  // Mouse drag refs (desktop)
  const mouseDragRef = useRef<number | null>(null);
  const mouseDraggingRef = useRef(false);

  useEffect(() => {
    const handleWindowMouseUp = (e: MouseEvent) => {
      if (mouseDragRef.current === null) return;
      const dx = e.clientX - mouseDragRef.current;
      mouseDragRef.current = null;
      if (Math.abs(dx) > 50) {
        panDirRef.current = (panDirRef.current + 1) % 2;
        if (dx < 0) setActiveIdx(i => Math.min(i + 1, slides.length - 1));
        if (dx > 0) setActiveIdx(i => Math.max(i - 1, 0));
        resetTimer();
      }
      mouseDraggingRef.current = false;
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const slide = slides[activeIdx];
  if (!isActive) return null;
  if (!slide) return null;

  const img = slide.influencer && slide.img ? slide.img : (images[slide.title] || null);
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
            onClick={() => { panDirRef.current = (panDirRef.current + 1) % 2; setActiveIdx(i); resetTimer(); }}
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
        onMouseUp={e => {
          if (mouseDragRef.current === null) return;
          const dx = e.clientX - mouseDragRef.current;
          mouseDragRef.current = null;
          if (Math.abs(dx) < 10 && !mouseDraggingRef.current) {
            setQuickViewOpen(true);
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
                  key={`${img}-${activeIdx}`}
                  className={`cin-poster-img ${panDirRef.current === 0 ? 'pan-left' : 'pan-right'}`}
                  src={img}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover',
                           objectPosition: 'center center', position: 'absolute', inset: 0,
                           display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              {!img && <span className="cin-em">{slide.emoji}</span>}
              <div className="cin-overlay-netflix" />
              <div className="cin-badge">{getCatIcon(slide.catId)} {slide.catName}</div>

              {/* Source badge — always visible */}
              <div className={
                slide.influencer?.tier === 'gold' ? 'inf-badge inf-badge-gold' :
                'inf-badge inf-badge-app'
              }>
                {slide.influencer?.tier === 'gold'
                  ? `✦ Gold · @${slide.influencer.handle}`
                  : <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>What to</span>}
              </div>
              {/* Logo What to */}
              {!slide.influencer && (
                <div className="cin-whatto-badge">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  what<em>to</em>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="cin-body cin-body-netflix">
              <div className="cin-title">{slide.title}</div>
              <div className="cin-meta">
                <span>{slide.type}</span>
                {slide.genre && <><span className="cin-meta-sep"> · </span><span>{slide.genre}</span></>}
                {slide.year && <><span className="cin-meta-sep"> · </span><span>{slide.year}</span></>}
                {slide.rating && <><span className="cin-meta-sep"> · </span><span style={{ display:'inline-flex', alignItems:'center', gap:3 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="#C89B3C" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>{slide.rating}</span></>}
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

      {quickViewOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 16px 24px', zIndex:500 }}
          onClick={() => setQuickViewOpen(false)}>
          <div style={{ width:'100%', maxWidth:480, background:'rgba(10,12,20,0.95)', backdropFilter:'blur(40px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:'20px 20px 28px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width:36, height:3, background:'rgba(255,255,255,0.15)', borderRadius:10, margin:'0 auto 20px' }} />
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              {img && <img src={img} alt="" style={{ width:64, height:64, borderRadius:12, objectFit:'cover', flexShrink:0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, fontStyle:'italic', color:'var(--tx)', lineHeight:1.15, marginBottom:4 }}>{slide.title}</div>
                <div style={{ fontSize:11, color:'var(--mu)' }}>{slide.type}{slide.genre ? ` · ${slide.genre}` : ''}{slide.year ? ` · ${slide.year}` : ''}{slide.rating ? ` · ★ ${slide.rating}` : ''}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {primaryPlatform && (
                <button onClick={() => { window.open(primaryPlatform.url,'_blank'); setQuickViewOpen(false); resetTimer(); }}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'linear-gradient(135deg,rgba(200,155,60,0.15),rgba(168,117,53,0.08))', border:'1px solid rgba(200,155,60,0.35)', borderRadius:16, cursor:'pointer', textAlign:'left', width:'100%' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" fill="var(--ac)" stroke="none"/></svg>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--ac)', fontFamily:"'Outfit',sans-serif" }}>Ver agora</div>
                    <div style={{ fontSize:11, color:'var(--mu)', marginTop:1 }}>Abre na plataforma</div>
                  </div>
                </button>
              )}
              <button onClick={() => {
                const now = new Date();
                const s = now.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
                const e2 = new Date(now.getTime()+7200000).toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
                window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(slide.title)}&dates=${s}/${e2}`,'_blank');
                setQuickViewOpen(false);
              }}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'rgba(106,180,224,0.07)', border:'1px solid rgba(106,180,224,0.2)', borderRadius:16, cursor:'pointer', textAlign:'left', width:'100%' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--bl)', fontFamily:"'Outfit',sans-serif" }}>Agendar</div>
                  <div style={{ fontSize:11, color:'var(--mu)', marginTop:1 }}>Adicionar ao Google Calendar</div>
                </div>
              </button>
              <button onClick={() => { setAddListOpen(true); setQuickViewOpen(false); }}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, cursor:'pointer', textAlign:'left', width:'100%' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mu)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--tx)', fontFamily:"'Outfit',sans-serif" }}>Guardar em lista</div>
                  <div style={{ fontSize:11, color:'var(--mu)', marginTop:1 }}>Adicionar a uma lista pessoal</div>
                </div>
              </button>
            </div>
            <button onClick={() => setQuickViewOpen(false)}
              style={{ width:'100%', marginTop:14, padding:'12px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, color:'var(--mu)', fontSize:13, fontFamily:"'Outfit',sans-serif", cursor:'pointer' }}>
              ← fechar
            </button>
          </div>
        </div>
      )}

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
