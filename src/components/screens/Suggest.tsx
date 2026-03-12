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

export default function Suggest({
  cat, profile, tracking, prefs, disliked, isActive,
  afterReactTrigger, afterReactGenre,
  onBack, onOpenReact, onOpenWishlist,
  onSwipeYes, onSwipeNo,
  curSugg, setCurSugg,
}: SuggestProps) {
  const [curMood, setCurMood] = useState('Tudo');
  const [cbarOn, setCbarOn] = useState(false);
  const [cbarGenre, setCbarGenre] = useState<string | null>(null);
  const [animClass, setAnimClass] = useState('');

  // Swipe state
  const touchStartX = useRef<number | null>(null);
  const mouseDown = useRef(false);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [returning, setReturning] = useState(false);
  const isSwiping = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // API data
  const [tmdbData, setTmdbData] = useState<TMDBResult | null>(null);
  const [mealData, setMealData] = useState<MealResult | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

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

  const loadSugg = useCallback((anim: boolean, gf?: string, moodOverride?: string) => {
    const pool = getPool(gf, moodOverride);
    if (!pool.length) return;
    const top = pool.slice(0, Math.min(3, pool.length));
    let s: DataItem;
    if (top.length > 1) {
      let attempts = 0;
      do {
        s = top[Math.floor(Math.random() * top.length)];
        attempts++;
      } while (curSugg && s.title === curSugg.title && attempts < 10);
    } else {
      s = top[0];
    }
    if (anim) {
      setAnimClass('c-out');
      setTimeout(() => {
        setCurSugg(s);
        setAnimClass('c-in');
        setTimeout(() => setAnimClass(''), 320);
      }, 240);
    } else {
      setCurSugg(s);
    }
  }, [getPool, curSugg, setCurSugg]);

  useEffect(() => {
    if (isActive) {
      setCurMood('Tudo');
      setCbarOn(false);
      loadSugg(false);
    }
  }, [cat.id, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (afterReactTrigger === 0) return;
    // Reduced delay so new suggestion loads quickly after WhyPanel/ReactPanel action
    setTimeout(() => {
      loadSugg(true);
      setCbarGenre(afterReactGenre);
      setCbarOn(true);
    }, 150);
  }, [afterReactTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch API data when suggestion changes
  useEffect(() => {
    setTmdbData(null);
    setMealData(null);
    setCoverUrl(null);
    if (!curSugg) return;
    if (cat.id === 'watch') {
      const tmdbType = curSugg.type === 'Filme' ? 'movie' : 'tv';
      fetchTMDB(curSugg.title, tmdbType).then(setTmdbData).catch(() => {});
    }
    if (cat.id === 'eat' && curSugg.type === 'Receita') {
      fetchMeal(curSugg.title).then(setMealData).catch(() => {});
    }
    if (cat.id === 'read') {
      fetchBookCover(curSugg.title).then(url => setCoverUrl(url)).catch(() => {});
    }
    if (cat.id === 'play' && curSugg.steamId) {
      setCoverUrl(getSteamImageUrl(curSugg.steamId));
    }
  }, [curSugg?.title, cat.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const trackInfo = curSugg ? tracking[cat.id + ':' + curSugg.title] : null;
  const trackState = trackInfo ? TSTATE.find(x => x.id === trackInfo.state) : null;

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = false;
    setSwipeDelta(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 8) {
      isSwiping.current = true;
      e.preventDefault();
    }
    setSwipeDelta(dx);
  };
  const handleTouchEnd = () => {
    const dx = swipeDelta;
    touchStartX.current = null;
    if (Math.abs(dx) >= 100) {
      if (dx > 0) onSwipeYes?.();
      else onSwipeNo?.();
    } else {
      setReturning(true);
      setTimeout(() => setReturning(false), 450);
    }
    setSwipeDelta(0);
    isSwiping.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDown.current = true;
    touchStartX.current = e.clientX;
    isSwiping.current = false;
    setSwipeDelta(0);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseDown.current || touchStartX.current === null) return;
    const dx = e.clientX - touchStartX.current;
    if (Math.abs(dx) > 8) isSwiping.current = true;
    setSwipeDelta(dx);
  };
  const handleMouseUp = () => {
    if (!mouseDown.current) return;
    const dx = swipeDelta;
    touchStartX.current = null;
    mouseDown.current = false;
    if (Math.abs(dx) >= 100) {
      if (dx > 0) onSwipeYes?.();
      else onSwipeNo?.();
    } else {
      setReturning(true);
      setTimeout(() => setReturning(false), 450);
    }
    setSwipeDelta(0);
    isSwiping.current = false;
  };
  const handleCardClick = () => {
    if (isSwiping.current || Math.abs(swipeDelta) > 10) return;
    onOpenReact();
  };

  const isDragging = mouseDown.current || touchStartX.current !== null;
  const clampedDelta = Math.max(-60, Math.min(60, swipeDelta));
  const swipeProgress = Math.min(Math.abs(swipeDelta) / 100, 1);

  let cardStyle: React.CSSProperties = {};
  if (isDragging && swipeDelta !== 0) {
    cardStyle = {
      transform: `translateX(${clampedDelta * 0.8}px)`,
      transition: 'none',
      cursor: 'grabbing',
    };
  } else if (returning) {
    cardStyle = {
      transform: 'translateX(0)',
      transition: 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
    };
  }

  // Background for cinematic poster
  const hasRealImage = !!(tmdbData?.posterUrl || mealData?.photoUrl || coverUrl);
  const posterBg: React.CSSProperties =
    cat.id === 'eat' && mealData?.photoUrl
      ? { backgroundImage: `url(${mealData.photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : cat.id === 'watch' && tmdbData?.posterUrl
      ? { backgroundImage: `url(${tmdbData.posterUrl})`, backgroundSize: 'cover', backgroundPosition: 'center top' }
      : (cat.id === 'read' || cat.id === 'play') && coverUrl
      ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center top' }
      : { background: `linear-gradient(${GRAD[cat.id] || '135deg,#111,#222'})` };

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
            onClick={() => { setCurMood(m); setCbarOn(false); loadSugg(true, undefined, m); }}>
            {m}
          </button>
        ))}
      </div>

      <div className="card-zone">
        <div id="cWrap" style={{ width: '100%', userSelect: 'none' }} className={animClass}>
          {curSugg && (
            <div className="swipe-card-wrap" ref={cardRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Swipe indicators */}
              <div className="swipe-indicator yes" style={{ opacity: swipeDelta > 20 ? swipeProgress : 0 }}>
                SIM ✓
              </div>
              <div className="swipe-indicator no" style={{ opacity: swipeDelta < -20 ? swipeProgress : 0 }}>
                NÃO ✗
              </div>

              {/* Cinematic card */}
              <div className="cin-card" style={cardStyle} onClick={handleCardClick}>
                {/* Full-bleed poster background */}
                <div className="cin-poster" style={posterBg}>
                  {!hasRealImage && (
                    <span className="cin-em">{curSugg.emoji}</span>
                  )}
                  {/* Bottom-to-top gradient overlay */}
                  <div className="cin-overlay" />
                </div>

                {/* Content overlaid at bottom */}
                <div className="cin-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span className="tag t">{curSugg.type}</span>
                    <span className="tag g">{curSugg.genre}</span>
                    {(tmdbData?.rating || curSugg.rating) && (
                      <span className="rating" style={{ marginLeft: 'auto' }}>⭐ {tmdbData?.rating || curSugg.rating}</span>
                    )}
                  </div>

                  <div className="cin-title">{curSugg.title}</div>

                  {curSugg.year && (
                    <div className="cin-year">
                      {tmdbData?.year ? `${tmdbData.year}` : curSugg.year}
                      {tmdbData?.runtime ? ` · ${tmdbData.runtime}` : ''}
                    </div>
                  )}

                  <div className="cin-desc">
                    {tmdbData?.overview
                      ? tmdbData.overview.substring(0, 140) + (tmdbData.overview.length > 140 ? '…' : '')
                      : curSugg.desc}
                  </div>

                  {tmdbData?.cast && tmdbData.cast.length > 0 && (
                    <div className="cin-cast">{tmdbData.cast.slice(0, 3).join(' · ')}</div>
                  )}

                  {mealData?.ingredients && mealData.ingredients.length > 0 && (
                    <div className="cin-ings">
                      {mealData.ingredients.slice(0, 5).map((ing, i) => (
                        <span key={i} className="meal-ing-item">{ing}</span>
                      ))}
                    </div>
                  )}

                  <div className="cin-actions">
                    {curSugg.platforms && curSugg.platforms.length > 0 && (
                      <>
                        {curSugg.platforms.map((p, i) => (
                          <button key={i} className="pb"
                            onClick={e => {
                              e.stopPropagation();
                              window.open(p.url, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <span className="dot" style={{ background: p.c }} />
                            {p.n}
                          </button>
                        ))}
                      </>
                    )}

                    {tmdbData?.trailerKey && (
                      <button className="trailer-btn"
                        onClick={e => {
                          e.stopPropagation();
                          window.open(`https://www.youtube.com/watch?v=${tmdbData.trailerKey}`, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        ▶ Trailer
                      </button>
                    )}
                  </div>

                  {trackInfo && trackState && (
                    <div className="track-badge" style={{ marginTop: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: TCOLOR[trackInfo.state] || '#5ec97a', display: 'inline-block', marginRight: 4 }} />
                      {trackState.l}{trackInfo.s ? ` · T${trackInfo.s} Ep${trackInfo.e}` : ''}
                    </div>
                  )}
                </div>
              </div>

              <div className="swipe-dots">
                <div className="swipe-dot" />
                <div className="swipe-dot active" />
                <div className="swipe-dot" />
              </div>
              <div className="card-hint">← desliza para não · toca para reagir · desliza para sim →</div>
            </div>
          )}
        </div>
      </div>

      <div className={`cbar${cbarOn ? ' on' : ''}`}>
        <div className="cbar-lbl">continuar ou mudar?</div>
        <div className="cbar-pills">
          {cbarGenre && (
            <button className="cpill same" onClick={() => { setCbarOn(false); loadSugg(true, cbarGenre); }}>
              ➜ Mais {cbarGenre}
            </button>
          )}
          {(GENRES[cat.id] || []).filter(g => g !== cbarGenre).slice(0, 4).map(g => (
            <button key={g} className="cpill" onClick={() => { setCbarOn(false); loadSugg(true, g); }}>
              {g}
            </button>
          ))}
          <button className="cpill" onClick={() => { setCbarOn(false); loadSugg(true); }}>
            ✦ Surpresa
          </button>
        </div>
      </div>
    </div>
  );
}
