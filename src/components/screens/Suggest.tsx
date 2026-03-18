import { useState, useCallback, useEffect, useRef } from 'react';
import type { Category, DataItem, Profile, TrackingMap, PrefsMap } from '../../types';
import { DATA, GRAD, GENRES, TSTATE, TCOLOR, getPlatformId } from '../../data';
import { fetchTMDB, type TMDBResult } from '../../services/tmdb';
import { fetchMeal, type MealResult } from '../../services/mealdb';
import { fetchBookCover, getSteamImageUrl } from '../../services/openLibrary';

const SUGGEST_FALLBACKS: Record<string, string> = {
  watch:  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  eat:    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  read:   'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
  listen: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
  play:   'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
  learn:  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
  visit:  'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80',
  do:     'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=800&q=80',
};

const EAT_TYPE_IMAGES: Record<string, string> = {
  'Restaurante': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'Delivery':    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  'Receita':     'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80',
};

const LISTEN_TYPE_IMAGES: Record<string, string> = {
  'Álbum':   'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
  'Podcast': 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80',
};

const VISIT_TYPE_IMAGES: Record<string, string> = {
  'Museu':       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'Bar':         'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80',
  'Restaurante': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'Experiência': 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=800&q=80',
};

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
  onOpenWhy: () => void;
  onImgResolved?: (img: string | null) => void;
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
  // Existing prefs
  if (p.peso && item.peso === p.peso) score += 3;
  if (p.carne === false && item.carne === false) score += 2;
  if (p.custo && item.custo === p.custo) score += 2;
  if (p.local && item.local === p.local) score += 2;
  if (p.dur && item.dur === p.dur) score += 2;
  // Type preference (e.g. "Prefiro série" → type = 'Série')
  if (p.type && item.type === p.type) score += 4;
  // Complexity preference
  if (p.comp === 'simples' && (item.comp === 'simples' || !item.comp)) score += 2;
  if (p.comp === 'dificil' && item.comp === 'dificil') score += 2;
  // Min rating (e.g. minRating = 8.5)
  if (typeof p.minRating === 'number' && typeof item.rating === 'number' && item.rating >= (p.minRating as number)) score += 3;
  if (typeof p.minRating === 'number' && typeof item.rating === 'number' && item.rating < (p.minRating as number)) score -= 3;
  // Format/format preferences (learn)
  if (p.formato && item.type === p.formato) score += 3;
  return score;
}

function filterByHardPrefs(pool: DataItem[], catId: string, prefs: PrefsMap): DataItem[] {
  const p = prefs[catId] || {};
  // If a strong type preference has been expressed (score > 0 means it was explicitly set),
  // move matching items to the top by giving them priority (already done in scoreItem).
  // Hard filter: only apply if pool stays non-empty after filter
  if (p.type) {
    const typed = pool.filter(i => i.type === p.type);
    if (typed.length >= 2) return typed;
  }
  if (p.local && catId === 'eat') {
    const local = pool.filter(i => i.local === p.local);
    if (local.length >= 2) return local;
  }
  if (p.carne === false && catId === 'eat') {
    const veg = pool.filter(i => i.carne === false || !i.carne);
    if (veg.length >= 2) return veg;
  }
  return pool;
}

interface CardData {
  tmdb: TMDBResult | null;
  meal: MealResult | null;
  cover: string | null;
}

export default function Suggest({
  cat, profile, tracking, prefs, disliked, isActive,
  afterReactTrigger, afterReactGenre,
  onBack, onOpenReact, onOpenWishlist, onOpenWhy, onImgResolved,
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
    // Apply hard preference filters (only when not overriding by genre/mood)
    if (!gf && mood === 'Tudo') {
      pool = filterByHardPrefs(pool, cat.id, prefs);
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

      setCardDataMap(prev => ({ ...prev, [item.title]: prev[item.title] ?? { tmdb: null, meal: null, cover: null } }));

      if (cat.id === 'watch') {
        const tmdbType = item.type === 'Filme' ? 'movie' : 'tv';
        fetchTMDB(item.title, tmdbType).then(data => {
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], tmdb: data } }));
        }).catch(() => {});
      }

      if (cat.id === 'eat') {
        if (item.type === 'Receita') {
          fetchMeal(item.title).then(data => {
            const fallback = EAT_TYPE_IMAGES[item.type] || SUGGEST_FALLBACKS.eat;
            setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: data?.photoUrl || fallback } }));
          }).catch(() => {
            setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: EAT_TYPE_IMAGES[item.type] || SUGGEST_FALLBACKS.eat } }));
          });
        } else {
          const img = EAT_TYPE_IMAGES[item.type] || SUGGEST_FALLBACKS.eat;
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: img } }));
        }
      }

      if (cat.id === 'read') {
        fetchBookCover(item.title).then(url => {
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: url || SUGGEST_FALLBACKS.read } }));
        }).catch(() => {
          setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: SUGGEST_FALLBACKS.read } }));
        });
      }

      if (cat.id === 'play') {
        const steamCover = item.steamId != null ? getSteamImageUrl(item.steamId) : null;
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: steamCover || SUGGEST_FALLBACKS.play } }));
      }

      if (cat.id === 'listen') {
        const img = LISTEN_TYPE_IMAGES[item.type] || SUGGEST_FALLBACKS.listen;
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: img } }));
      }

      if (cat.id === 'learn') {
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: SUGGEST_FALLBACKS.learn } }));
      }

      if (cat.id === 'visit') {
        const img = VISIT_TYPE_IMAGES[item.type] || SUGGEST_FALLBACKS.visit;
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: img } }));
      }

      if (cat.id === 'do') {
        setCardDataMap(prev => ({ ...prev, [item.title]: { ...prev[item.title], cover: SUGGEST_FALLBACKS.do } }));
      }
    });
  }, [activeIdx, cards]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent when active card image changes (for ReactPanel)
  useEffect(() => {
    if (!onImgResolved) return;
    const card = cards[activeIdx];
    if (!card) { onImgResolved(null); return; }
    const data = cardDataMap[card.title];
    const img = data?.tmdb?.posterUrl || data?.cover || null;
    onImgResolved(img);
  }, [activeIdx, cardDataMap, cards]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCardClick = () => {
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
        {cards[activeIdx] && (() => {
          const card = cards[activeIdx];
          const data = cardDataMap[card.title];
          const hasImg = !!(data?.tmdb?.posterUrl || data?.cover);
          const imgSrc = data?.tmdb?.posterUrl || data?.cover || '';
          const cardTrackInfo = tracking[cat.id + ':' + card.title];
          const cardTrackState = cardTrackInfo ? TSTATE.find(x => x.id === cardTrackInfo.state) : null;

          return (
            <div
              className="cin-card"
              style={{ cursor: 'pointer' }}
              onClick={handleCardClick}
            >
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

                {/* Simplified Actions */}
                <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 16 }}>
                  <button className="action-no"
                    style={{ flex: 1, padding: 16, borderRadius: '50px', background: 'rgba(224,112,112,0.1)', border: '1px solid rgba(224,112,112,0.3)', color: '#e07070', fontSize: 16, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={e => {
                      e.stopPropagation();
                      onOpenWhy();
                    }}
                  >
                    <span>←</span> Não
                  </button>
                  <button className="action-yes"
                    style={{ flex: 1.5, padding: 16, borderRadius: '50px', background: 'linear-gradient(135deg, #c8974a, #a87535)', border: 'none', color: '#000', fontSize: 16, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={e => { e.stopPropagation(); setQuickYesOpen(true); }}
                  >
                    Sim <span>→</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })()}

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
