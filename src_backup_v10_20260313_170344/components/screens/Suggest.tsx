import { useState, useCallback, useEffect, useRef } from 'react';
import type { Category, DataItem, Profile, TrackingMap, PrefsMap } from '../../types';
import { DATA, GRAD, GENRES, TSTATE, TCOLOR, getPlatformId } from '../../data';
import { fetchTMDB, type TMDBResult } from '../../services/tmdb';
import { fetchMeal, type MealResult } from '../../services/mealdb';
import { fetchBookCover, getSteamImageUrl } from '../../services/openLibrary';

interface SuggestProps {
  cat: Category;
  profile: Profile;
  tracking: TrackingMap;
  prefs: PrefsMap;
  disliked: string[];
  isActive: boolean;
  afterReactTrigger: number;
  afterReactGenre: string | null;
  onBack: () => void;
  onOpenReact: () => void;
  onOpenLink: (url: string, name: string, color: string) => void;
  onOpenWishlist: () => void;
  onSwipeYes?: () => void;
  onSwipeNo?: () => void;
  curSugg: DataItem | null;
  setCurSugg: (item: DataItem) => void;
}

function hasPlatform(item: DataItem, profile: Profile): boolean {
  const myPlats = profile.platforms || [];
  const blocked = profile.blockedPlatforms || [];
  if (!item.platforms || !item.platforms.length) return true;
  const itemPlatIds = item.platforms.map(p => getPlatformId(p.n)).filter(Boolean) as string[];
  if (itemPlatIds.length && itemPlatIds.every(id => blocked.includes(id))) return false;
  if (!myPlats.length) return true;
  return item.platforms.some(p => {
    const pid = getPlatformId(p.n);
    return pid ? myPlats.includes(pid) : false;
  });
}

function scoreItem(item: DataItem, catId: string, prefs: PrefsMap): number {
  const p = prefs[catId] || {};
  let score = 0;
  if (p.peso && item.peso === p.peso) score += 3;
  if (p.carne === false && item.carne === false) score += 2;
  if (p.custo && item.custo === p.custo) score += 2;
  if (p.local && item.local === p.local) score += 2;
  if (p.dur && item.dur === p.dur) score += 2;
  return score;
}

interface CardData {
  tmdb: TMDBResult | null;
  meal: MealResult | null;
  cover: string | null;
}

export default function Suggest({
  cat, profile, tracking, prefs, disliked, isActive,
  afterReactTrigger, afterReactGenre,
  onBack, onOpenReact, onOpenWishlist,
  onSwipeYes: _onSwipeYes, onSwipeNo: _onSwipeNo,
  curSugg, setCurSugg,
}: SuggestProps) {
  const [curMood, setCurMood] = useState('Tudo');
  const [cbarOn, setCbarOn] = useState(false);
  const [cbarGenre, setCbarGenre] = useState<string | null>(null);

  // Carousel state
  const [cards, setCards] = useState<DataItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [cardDataMap, setCardDataMap] = useState<Record<string, CardData>>({});

  // Always-current refs (safe to read in effects and handlers)
  const cardsRef = useRef<DataItem[]>([]);
  const activeIdxRef = useRef(0);
  cardsRef.current = cards;
  activeIdxRef.current = activeIdx;

  // Drag state
  const touchStartX = useRef<number | null>(null);
  const mouseDownX = useRef<number | null>(null);
  const isSwipingRef = useRef(false);
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSkipBar, setShowSkipBar] = useState(false);
  const skipBarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [quickYesOpen, setQuickYesOpen] = useState(false);

  // Track which titles we've already initiated fetches for
  const fetchedRef = useRef(new Set<string>());

  const getPool = useCallback((gf?: string, moodOverride?: string) => {
    const mood = moodOverride ?? curMood;
    let pool = DATA[cat.id].filter(s => !disliked.includes(cat.id + ':' + s.title));
    pool = pool.filter(s => hasPlatform(s, profile));
    if (gf) pool = pool.filter(s => s.genre === gf || s.type === gf);
    else if (mood !== 'Tudo') pool = pool.filter(s => s.type === mood || s.genre === mood);
    if (!pool.length) {
      pool = DATA[cat.id].filter(s => !disliked.includes(cat.id + ':' + s.title));
      if (!pool.length) pool = [...DATA[cat.id]];
    }
    pool.sort((a, b) => scoreItem(b, cat.id, prefs) - scoreItem(a, cat.id, prefs));
    return pool;
  }, [cat.id, curMood, disliked, prefs, profile]);

  const loadBatch = useCallback((gf?: string, moodOverride?: string, exclude: string[] = []) => {
    const pool = getPool(gf, moodOverride);
    if (!pool.length) return;
    const available = pool.filter(s => !exclude.includes(s.title));
    const source = available.length >= 3 ? available : pool;
    // Take top half of scored pool and shuffle for variety
    const topHalf = source.slice(0, Math.max(8, Math.ceil(source.length / 2)));
    const shuffled = [...topHalf].sort(() => Math.random() - 0.5);
    const batch = shuffled.slice(0, 8);
    setCards(batch);
    setActiveIdx(0);
    setCardDataMap({});
    fetchedRef.current = new Set();
    if (batch.length > 0) setCurSugg(batch[0]);
  }, [getPool, setCurSugg]);

  const doAdvance = useCallback(() => {
    const currentCards = cardsRef.current;
    const currentIdx = activeIdxRef.current;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= currentCards.length) {
      loadBatch(undefined, undefined, currentCards.map(c => c.title));
    } else {
      setActiveIdx(nextIdx);
      setCurSugg(currentCards[nextIdx]);
    }
  }, [loadBatch, setCurSugg]);

  // Load when screen activates or category changes
  useEffect(() => {
    if (isActive) {
      setCurMood('Tudo');
      setCbarOn(false);
      if (curSugg) {
        // Pre-set from hero: start batch with this item
        const pool = getPool();
        const rest = pool.filter(s => s.title !== curSugg!.title).slice(0, 7);
        const batch = [curSugg!, ...rest];
        setCards(batch);
        setActiveIdx(0);
        setCardDataMap({});
        fetchedRef.current = new Set();
      } else {
        loadBatch();
      }
    }
  }, [cat.id, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // After ReactPanel/WhyPanel action → advance carousel
  useEffect(() => {
    if (afterReactTrigger === 0) return;
    setTimeout(() => {
      setCbarGenre(afterReactGenre);
      setCbarOn(true);
      doAdvance();
    }, 150);
  }, [afterReactTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch API data for current card and next card
  useEffect(() => {
    const toFetch = [cards[activeIdx], cards[activeIdx + 1]].filter(Boolean) as DataItem[];
    toFetch.forEach(item => {
      if (fetchedRef.current.has(item.title)) return;
      fetchedRef.current.add(item.title);

      // Initialize entry
      setCardDataMap(prev => ({ ...prev, [item.title]: prev[item.title] ?? { tmdb: null, meal: null, cover: null } }));

      if (cat.id === 'watch') {
        const tmdbType = item.type === 'Filme' ? 'movie' : 'tv';
        fetchTMDB(item.title, tmdbType).then(data => {
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], tmdb: data } }));
        }).catch(() => {});
      }
      if (cat.id === 'eat' && item.type === 'Receita') {
        fetchMeal(item.title).then(data => {
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], meal: data } }));
        }).catch(() => {});
      }
      if (cat.id === 'read') {
        fetchBookCover(item.title).then(url => {
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: url } }));
        }).catch(() => {});
      }
      if (cat.id === 'play' && item.steamId != null) {
        const steamCover = getSteamImageUrl(item.steamId);
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: steamCover } }));
      }
    });
  }, [activeIdx, cards]); // eslint-disable-line react-hooks/exhaustive-deps

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwipingRef.current = false;
    setIsDragging(true);
    setDragDelta(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 8) {
      isSwipingRef.current = true;
      e.preventDefault();
    }
    setDragDelta(dx);
  };
  const handleTouchEnd = () => {
    const dx = dragDelta;
    touchStartX.current = null;
    setIsDragging(false);
    setDragDelta(0);
    if (Math.abs(dx) >= 80) {
      if (dx < 0) {
        setShowSkipBar(true);
        doAdvance();
        if (skipBarTimerRef.current) clearTimeout(skipBarTimerRef.current);
        skipBarTimerRef.current = setTimeout(() => setShowSkipBar(false), 3000);
      } else {
        setQuickYesOpen(true);
      }
    }
    isSwipingRef.current = false;
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownX.current = e.clientX;
    setIsDragging(true);
    isSwipingRef.current = false;
    setDragDelta(0);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseDownX.current === null) return;
    const dx = e.clientX - mouseDownX.current;
    if (Math.abs(dx) > 8) isSwipingRef.current = true;
    setDragDelta(dx);
  };
  const handleMouseUp = () => {
    if (mouseDownX.current === null) return;
    const dx = dragDelta;
    mouseDownX.current = null;
    setIsDragging(false);
    setDragDelta(0);
    if (Math.abs(dx) >= 80) {
      if (dx < 0) {
        setShowSkipBar(true);
        doAdvance();
        if (skipBarTimerRef.current) clearTimeout(skipBarTimerRef.current);
        skipBarTimerRef.current = setTimeout(() => setShowSkipBar(false), 3000);
      } else {
        setQuickYesOpen(true);
      }
    }
    isSwipingRef.current = false;
  };

  const handleCardClick = () => {
    if (isSwipingRef.current || Math.abs(dragDelta) > 10) return;
    onOpenReact();
  };

  return (
    <div className={`screen${isActive ? ' active' : ''}`} id="suggest">
      <div className="tb">
        <button className="tbi" onClick={onBack}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 15 }}>{cat.icon}</span>
          <span className="tb-lbl">What to {cat.name}</span>
        </div>
        <button className="tbi" onClick={onOpenWishlist}>♡</button>
      </div>

      <div className="moods">
        {cat.moods.map(m => (
          <button key={m} className={`mood${m === curMood ? ' on' : ''}`}
            onClick={() => { setCurMood(m); setCbarOn(false); loadBatch(undefined, m); }}>
            {m}
          </button>
        ))}
      </div>

      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{
            transform: `translateX(calc(-${activeIdx} * 92vw + ${dragDelta}px))`,
            transition: isDragging ? 'none' : 'transform 300ms ease',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {cards.map((card, i) => {
            const data = cardDataMap[card.title];
            const hasImg = !!(data?.tmdb?.posterUrl || data?.meal?.photoUrl || data?.cover);
            const imgSrc = data?.meal?.photoUrl || data?.tmdb?.posterUrl || data?.cover || '';
            const cardTrackInfo = tracking[cat.id + ':' + card.title];
            const cardTrackState = cardTrackInfo ? TSTATE.find(x => x.id === cardTrackInfo.state) : null;

            // PROBLEMA 3: swipe card transform — no flip, just translate+rotate
            const MAX_ROTATION = 15;
            const rawRotation = (dragDelta / (window.innerWidth * 0.5)) * MAX_ROTATION;
            const clampedRotation = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, rawRotation));
            const cardTransform = (i === activeIdx && isDragging && dragDelta !== 0)
              ? `translateX(${dragDelta}px) rotate(${clampedRotation}deg)`
              : 'translateX(0) rotate(0deg)';
            const cardTransition = (i === activeIdx && isDragging) ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

            return (
              <div key={card.title + i} className="carousel-slide">
                <div
                  className="cin-card swipe-card"
                  style={{
                    cursor: isSwipingRef.current ? 'grabbing' : 'pointer',
                    transform: cardTransform,
                    transition: cardTransition,
                  }}
                  onClick={i === activeIdx ? handleCardClick : undefined}
                >
                  {i === activeIdx && (
                    <>
                      <div className="swipe-indicator yes" style={{ opacity: dragDelta > 20 ? Math.min(dragDelta / 100, 1) : 0 }}>SIM ✓</div>
                      <div className="swipe-indicator no" style={{ opacity: dragDelta < -20 ? Math.min(-dragDelta / 100, 1) : 0 }}>NÃO ✕</div>
                    </>
                  )}
                  {/* Poster background */}
                  <div className="cin-poster" style={hasImg ? undefined : { background: `linear-gradient(${GRAD[cat.id] || '135deg,#111,#222'})` }}>
                    {hasImg && (
                      <img
                        className="cin-poster-img"
                        src={imgSrc}
                        alt=""
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    {!hasImg && <span className="cin-em">{card.emoji}</span>}
                    <div className="cin-overlay" />
                    {/* Category badge top-left */}
                    <div className="cin-badge">{cat.icon} {cat.name}</div>
                  </div>

                  {/* Content overlay */}
                  <div className="cin-body">
                    <div className="cin-title">{card.title}</div>

                    <div className="cin-meta">
                      <span>{card.type}</span>
                      {card.genre && <><span className="cin-meta-sep"> · </span><span>{card.genre}</span></>}
                      {(data?.tmdb?.year || card.year) && <><span className="cin-meta-sep"> · </span><span>{data?.tmdb?.year ?? card.year}</span></>}
                      {data?.tmdb?.runtime && <><span className="cin-meta-sep"> · </span><span>{data.tmdb.runtime}</span></>}
                      {(data?.tmdb?.rating || card.rating) && <><span className="cin-meta-sep"> · </span><span>⭐ {data?.tmdb?.rating || card.rating}</span></>}
                    </div>

                    <div className="cin-desc">
                      {data?.tmdb?.overview
                        ? data.tmdb.overview.substring(0, 140) + (data.tmdb.overview.length > 140 ? '…' : '')
                        : card.desc}
                    </div>

                    {data?.tmdb?.cast && data.tmdb.cast.length > 0 && (
                      <div className="cin-cast">{data.tmdb.cast.slice(0, 3).join(' · ')}</div>
                    )}

                    {data?.meal?.ingredients && data.meal.ingredients.length > 0 && (
                      <div className="cin-ings">
                        {data.meal.ingredients.slice(0, 5).map((ing, j) => (
                          <span key={j} className="meal-ing-item">{ing}</span>
                        ))}
                      </div>
                    )}

                    {/* Platform links */}
                    <div className="cin-actions">
                      {card.platforms && card.platforms.length > 0 && card.platforms.map((p, j) => (
                        <button key={j} className="pb"
                          onClick={e => { e.stopPropagation(); window.open(p.url, '_blank', 'noopener,noreferrer'); }}
                        >
                          <span className="dot" style={{ background: p.c }} />
                          {p.n}
                        </button>
                      ))}
                      {data?.tmdb?.trailerKey && (
                        <button className="trailer-btn"
                          onClick={e => { e.stopPropagation(); window.open(`https://www.youtube.com/watch?v=${data.tmdb!.trailerKey}`, '_blank', 'noopener,noreferrer'); }}
                        >
                          ▶ Trailer
                        </button>
                      )}
                    </div>

                    {cardTrackInfo && cardTrackState && (
                      <div className="track-badge" style={{ marginTop: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: TCOLOR[cardTrackInfo.state] || '#5ec97a', display: 'inline-block', marginRight: 4 }} />
                        {cardTrackState.l}{cardTrackInfo.s ? ` · T${cardTrackInfo.s} Ep${cardTrackInfo.e}` : ''}
                      </div>
                    )}

                    {/* Não / Sim action buttons — M3 */}
                    <div className="suggest-actions">
                      <button className="action-no"
                        onClick={e => {
                          e.stopPropagation();
                          setShowSkipBar(true);
                          doAdvance();
                          if (skipBarTimerRef.current) clearTimeout(skipBarTimerRef.current);
                          skipBarTimerRef.current = setTimeout(() => setShowSkipBar(false), 3000);
                        }}
                      >
                        ✕ Não
                      </button>
                      <button className="action-yes"
                        onClick={e => { e.stopPropagation(); setQuickYesOpen(true); }}
                      >
                        ✓ Sim
                      </button>
                    </div>
                  </div>
                  {i === activeIdx && showSkipBar && (
                    <div className="skip-bar">
                      <button className="skip-bar-btn" onClick={() => { setShowSkipBar(false); }}>Hoje não</button>
                      <button className="skip-bar-btn" onClick={() => { setShowSkipBar(false); }}>Guardar</button>
                      <button className="skip-bar-btn why" onClick={() => { setShowSkipBar(false); }}>Não gosto</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Position dots */}
        <div className="carousel-dots">
          {cards.map((_, i) => (
            <div key={i} className={`carousel-dot${i === activeIdx ? ' active' : ''}`} />
          ))}
        </div>

        <div className="card-hint">← desliza para não · toca para reagir · desliza para sim →</div>
      </div>

      <div className={`cbar${cbarOn ? ' on' : ''}`}>
        <div className="cbar-lbl">continuar ou mudar?</div>
        <div className="cbar-pills">
          {cbarGenre && (
            <button className="cpill same" onClick={() => { setCbarOn(false); loadBatch(cbarGenre); }}>
              ➜ Mais {cbarGenre}
            </button>
          )}
          {(GENRES[cat.id] || []).filter(g => g !== cbarGenre).slice(0, 4).map(g => (
            <button key={g} className="cpill" onClick={() => { setCbarOn(false); loadBatch(g); }}>
              {g}
            </button>
          ))}
          <button className="cpill" onClick={() => { setCbarOn(false); loadBatch(); }}>
            ✦ Surpresa
          </button>
        </div>
      </div>

      {/* PROBLEMA 4 — Quick Yes panel */}
      {quickYesOpen && (
        <div className="quick-yes-overlay" onClick={() => setQuickYesOpen(false)}>
          <div className="quick-yes-sheet" onClick={e => e.stopPropagation()}>
            <div className="qy-drag-bar" />
            <div className="qy-title">
              <span className="qy-emoji">{cards[activeIdx]?.emoji}</span>
              <span>{cards[activeIdx]?.title}</span>
            </div>
            <button className="qy-btn qy-now" onClick={() => { onOpenReact(); setQuickYesOpen(false); }}>
              <span>▶</span>
              <div>
                <div className="qy-btn-title">Sim, agora!</div>
                <div className="qy-btn-sub">Abre e acompanha em tempo real</div>
              </div>
            </button>
            <button className="qy-btn qy-later" onClick={() => { if (_onSwipeYes) _onSwipeYes(); setQuickYesOpen(false); }}>
              <span>✅</span>
              <div>
                <div className="qy-btn-title">Sim, mais tarde</div>
                <div className="qy-btn-sub">Fica marcado para hoje</div>
              </div>
            </button>
            <button className="qy-btn qy-schedule" onClick={() => { setQuickYesOpen(false); }}>
              <span>🗓</span>
              <div>
                <div className="qy-btn-title">Escolher hora</div>
                <div className="qy-btn-sub">Agenda para um momento específico</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
