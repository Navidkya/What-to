import { useState, useEffect } from 'react';
import type { Profile, HistoryEntry, TrackingMap, DataItem, Screen, ScheduleEntry } from '../../types';
import { DATA, CATS, GRAD } from '../../data';
import { fetchBookCover, getSteamImageUrl } from '../../services/openLibrary';
import { fetchMeal } from '../../services/mealdb';

interface HomeProps {
  profile: Profile;
  history: HistoryEntry[];
  tracking: TrackingMap;
  schedules: ScheduleEntry[];
  onOpenCat: (id: string, item?: DataItem) => void;
  onSurprise: () => void;
  onOpenLive: (title: string, emoji: string, catId: string) => void;
  onNav: (screen: Screen) => void;
  isActive: boolean;
}

interface HeroSlide {
  item: DataItem;
  catId: string;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TMDB_KEY = import.meta.env.VITE_TMDB_KEY as string;

// Curated lifestyle photos for "do" category items
const DO_LIFESTYLE_IMAGES = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1280&q=80',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1280&q=80',
];

// Fallback images per category (always shown if API fails)
const HERO_FALLBACKS: Record<string, string> = {
  watch: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80',
  eat: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1280&q=80',
  play: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1280&q=80',
  read: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1280&q=80',
  do: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1280&q=80',
  listen: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1280&q=80',
};

function getDayTime(): string {
  const now = new Date();
  const day = DAYS[now.getDay()];
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${day} · ${h}:${m}`;
}

function getContextualPhrase(history: HistoryEntry[]): string {
  if (history.length === 0) return 'Hoje ainda não decidiram nada.';
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia para começar algo novo.';
  if (hour < 18) return 'Tarde boa para uma pausa.';
  if (hour < 22) return 'Noite perfeita para decidir.';
  return 'Noite tranquila. O que falta fazer?';
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const suffix = name ? `, ${name}` : '';
  if (hour < 12) return `Bom dia${suffix}`;
  if (hour < 18) return `Boa tarde${suffix}`;
  return `Boa noite${suffix}`;
}

function fmtDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function fmtTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function hasPlatform(item: DataItem, profile: Profile): boolean {
  const myPlats = profile.platforms || [];
  const blocked = profile.blockedPlatforms || [];
  if (!item.platforms || !item.platforms.length) return true;
  const itemPlatIds = item.platforms
    .map(p => {
      const n = p.n.toLowerCase();
      if (n.includes('netflix')) return 'netflix';
      if (n.includes('disney')) return 'disney';
      if (n.includes('hbo') || n.includes('max')) return 'hbo';
      if (n.includes('apple')) return 'apple';
      if (n.includes('prime')) return 'prime';
      if (n.includes('spotify')) return 'spotify';
      if (n.includes('steam')) return 'steam';
      if (n.includes('playstation') || n.includes('ps')) return 'playstation';
      if (n.includes('youtube')) return 'youtube';
      return null;
    })
    .filter(Boolean) as string[];
  if (itemPlatIds.length && itemPlatIds.every(id => blocked.includes(id))) return false;
  if (!myPlats.length) return true;
  return item.platforms.some(p => {
    const n = p.n.toLowerCase();
    if (n.includes('netflix') && myPlats.includes('netflix')) return true;
    if (n.includes('disney') && myPlats.includes('disney')) return true;
    if ((n.includes('hbo') || n.includes('max')) && myPlats.includes('hbo')) return true;
    if (n.includes('apple') && myPlats.includes('apple')) return true;
    if (n.includes('prime') && myPlats.includes('prime')) return true;
    if (n.includes('spotify') && myPlats.includes('spotify')) return true;
    if (n.includes('steam') && myPlats.includes('steam')) return true;
    if ((n.includes('playstation') || n.includes('ps')) && myPlats.includes('playstation')) return true;
    if (n.includes('youtube') && myPlats.includes('youtube')) return true;
    return false;
  });
}

function buildHeroSlides(profile: Profile): HeroSlide[] {
  const pick = (catId: string, count: number): HeroSlide[] => {
    const pool = (DATA[catId] || []).filter(s => hasPlatform(s, profile));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(item => ({ item, catId }));
  };
  const slides = [
    ...pick('watch', 2),
    ...pick('eat', 1),
    ...pick('play', 1),
    ...pick('read', 1),
    ...pick('do', 1),
  ];
  return slides.sort(() => Math.random() - 0.5);
}

async function fetchTMDBBackdrop(title: string): Promise<string | null> {
  const cacheKey = `wt_tmdb_bd_${title.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached !== null) return cached || null;

  try {
    const q = encodeURIComponent(title);
    let img: string | null = null;

    const tvRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${q}&language=pt-PT`);
    if (tvRes.ok) {
      const tvData = await tvRes.json() as { results?: Array<{ backdrop_path?: string; poster_path?: string }> };
      const hit = tvData.results?.[0];
      if (hit?.backdrop_path) img = `https://image.tmdb.org/t/p/w1280${hit.backdrop_path}`;
      else if (hit?.poster_path) img = `https://image.tmdb.org/t/p/w500${hit.poster_path}`;
    }

    if (!img) {
      const mvRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${q}&language=pt-PT`);
      if (mvRes.ok) {
        const mvData = await mvRes.json() as { results?: Array<{ backdrop_path?: string; poster_path?: string }> };
        const hit = mvData.results?.[0];
        if (hit?.backdrop_path) img = `https://image.tmdb.org/t/p/w1280${hit.backdrop_path}`;
        else if (hit?.poster_path) img = `https://image.tmdb.org/t/p/w500${hit.poster_path}`;
      }
    }

    localStorage.setItem(cacheKey, img || '');
    return img;
  } catch {
    return null;
  }
}

async function fetchTMDBPoster(title: string): Promise<string | null> {
  const cacheKey = `wt_tmdb_ps_${title.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached !== null) return cached || null;

  try {
    const q = encodeURIComponent(title);
    let img: string | null = null;

    const tvRes = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${q}&language=pt-PT`);
    if (tvRes.ok) {
      const tvData = await tvRes.json() as { results?: Array<{ poster_path?: string }> };
      const hit = tvData.results?.[0];
      if (hit?.poster_path) img = `https://image.tmdb.org/t/p/w342${hit.poster_path}`;
    }

    if (!img) {
      const mvRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${q}&language=pt-PT`);
      if (mvRes.ok) {
        const mvData = await mvRes.json() as { results?: Array<{ poster_path?: string }> };
        const hit = mvData.results?.[0];
        if (hit?.poster_path) img = `https://image.tmdb.org/t/p/w342${hit.poster_path}`;
      }
    }

    localStorage.setItem(cacheKey, img || '');
    return img;
  } catch {
    return null;
  }
}

// Categories to show in the new 3D Explorer
const EXPLORE_CAT_IDS = ['watch', 'eat', 'play', 'read', 'listen', 'learn', 'visit', 'do'];

const CAT_IMAGES: Record<string, string> = {
  watch: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80',
  eat: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  play: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80',
  read: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80',
  listen: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
  learn: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80',
  visit: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&q=80',
  do: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=400&q=80',
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  watch: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="13" rx="2"/>
      <path d="M16 2l-4 5-4-5"/>
    </svg>
  ),
  eat: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2"/>
      <path d="M5 2v20"/>
      <path d="M21 2c0 0-2 2-2 8h4c0-6-2-8-2-8z"/>
      <path d="M19 10v12"/>
    </svg>
  ),
  do: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  match: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  play: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="3"/>
      <path d="M6 12h4m-2-2v4"/>
      <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/>
      <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  read: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  listen: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  learn: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17H8v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
    </svg>
  ),
  visit: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
};

export default function Home({ profile, history, tracking, schedules, onOpenCat, onSurprise, onOpenLive, onNav, isActive: _isActive }: HomeProps) {
  const greeting = getGreeting(profile.name);
  const avatarLetter = profile.name ? profile.name[0].toUpperCase() : '◉';
  const dayTime = getDayTime();
  const contextPhrase = getContextualPhrase(history);

  // Hero único (sem carrossel) — apenas primeiro slide
  const [heroInit] = useState(() => {
    const slides = buildHeroSlides(profile);
    const first = slides[0] ?? null;
    const fb = first ? HERO_FALLBACKS[first.catId] : null;
    return { slide: first, fallbackImg: fb ?? null };
  });
  const currentSlide = heroInit.slide;
  const [heroImage, setHeroImage] = useState<string | null>(heroInit.fallbackImg);

  useEffect(() => {
    if (!currentSlide) return;
    const { item, catId } = currentSlide;
    (async () => {
      let url: string | null = null;
      try {
        if (catId === 'watch') url = await fetchTMDBBackdrop(item.title);
        else if (catId === 'eat') { const meal = await fetchMeal(item.title); url = meal?.photoUrl ?? null; }
        else if (catId === 'play') url = getSteamImageUrl(item.steamId);
        else if (catId === 'read') url = await fetchBookCover(item.title);
        else if (catId === 'do') url = DO_LIFESTYLE_IMAGES[0];
        else url = HERO_FALLBACKS[catId] ?? null;
      } catch { /* skip */ }
      setHeroImage(url || HERO_FALLBACKS[catId] || null);
    })();
  }, [currentSlide?.catId, currentSlide?.item?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentHeroCat = currentSlide ? CATS.find(c => c.id === currentSlide.catId) : null;
  const currentHeroImg = heroImage;

  // Pending: hoje + watching
  const hojeItems = history.filter(h => h.action === 'hoje').slice(0, 3);
  const watchingItems = Object.entries(tracking).filter(([, v]) => v.state === 'watching').slice(0, 2);
  const pendingItems: Array<{ emoji: string; title: string; sub: string; badge: string; catId: string; ep?: number; total?: number }> = [];
  hojeItems.forEach(h => pendingItems.push({ emoji: h.emoji, title: h.title, sub: 'Para hoje · ' + fmtDate(h.date), badge: 'hoje', catId: h.catId }));
  watchingItems.forEach(([, v]) => pendingItems.push({ emoji: v.emoji || '🎬', title: v.title, sub: 'A ver' + (v.s ? ` · T${v.s} Ep${v.e}` : ''), badge: 'watching', catId: v.catId, ep: v.e, total: v.total }));

  const [pendingImages, setPendingImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!pendingItems.length) return;

    async function fetchPendingImages() {
      const updates: Record<string, string> = {};

      for (const item of pendingItems) {
        try {
          let img: string | null = null;

          if (item.catId === 'watch') {
            img = await fetchTMDBPoster(item.title);
          } else if (item.catId === 'eat') {
            const meal = await fetchMeal(item.title);
            img = meal?.photoUrl || null;
          }

          if (img) updates[item.title] = img;
        } catch { /* skip */ }
      }

      if (Object.keys(updates).length) {
        setPendingImages(prev => ({ ...prev, ...updates }));
      }
    }

    fetchPendingImages();
  }, [pendingItems.map(p => p.title).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Today's schedules
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySchedules = schedules.filter(s => s.date.startsWith(todayStr));

  const exploreCats = CATS.filter(c => EXPLORE_CAT_IDS.includes(c.id));

  return (
    <div className="h-screen-content" id="home" style={{ paddingBottom: 80 }}>
      {/* Swipe left hint — Amigos */}
      <div className="swipe-hint-left" style={{ opacity: 0.4 }}>
        <span>←</span>
        <span style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}>Amigos</span>
      </div>
      <div className="home-inner">

        {/* Header */}
        <div className="home-header">
          <div className="home-header-top">
            <div className="home-header-left">
              <div className="home-sub">{dayTime}</div>
              <div className="home-name">{greeting}</div>
              <div className="home-mood">{contextPhrase}</div>
            </div>
            <button className="home-avatar" onClick={() => onNav('profile')}>
              {avatarLetter}
            </button>
          </div>
        </div>

        {/* Planeado para hoje */}
        {todaySchedules.length > 0 && (
          <div className="planned-section">
            <div className="section-lbl" style={{ marginBottom: 8 }}>Planeado para hoje</div>
            {todaySchedules.map(s => (
              <div key={s.id} className="planned-item">
                <span className="planned-em">{s.emoji}</span>
                <div className="planned-info">
                  <div className="planned-title">{s.title}</div>
                  <div className="planned-sub">{fmtTime(s.date)} · {s.cat}</div>
                </div>
                <button
                  className="planned-cal-btn"
                  onClick={() => {
                    const [dateStr, timeStr] = s.date.split('T');
                    const [y, mo, d] = dateStr.split('-');
                    const [h, mi] = (timeStr || '00:00').split(':');
                    const start = `${y}${mo}${d}T${h}${mi}00`;
                    const endH = String(Number(h) + 1).padStart(2, '0');
                    const end = `${y}${mo}${d}T${endH}${mi}00`;
                    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(s.title)}&dates=${start}/${end}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  📅
                </button>
              </div>
            ))}
          </div>
        )}

        {/* A acompanhar */}
        {pendingItems.length > 0 && (
          <div className="pending-section">
            <div className="section-lbl" style={{ marginBottom: 8 }}>A acompanhar</div>
            {pendingItems.map((it, i) => (
              <div key={i} className="pending-card card-base fade-in" data-cat={it.catId} onClick={() => onOpenLive(it.title, it.emoji, it.catId)}>
                {pendingImages[it.title] ? (
                  <img className="pending-thumb" src={pendingImages[it.title]} alt="" />
                ) : (
                  <span className="pending-em">{it.emoji}</span>
                )}
                <div className="pending-info">
                  <div className="pending-title">{it.title}</div>
                  <div className="pending-sub">{it.sub}</div>
                  {it.ep !== undefined && it.ep > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div className="progress-bar-track" style={{ flex: 1 }}>
                        <div className="progress-bar-fill" style={{ width: `${Math.min((it.ep / (it.total || 10)) * 100, 100)}%` }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--mu)', whiteSpace: 'nowrap' }}>
                        {it.total ? `Ep. ${it.ep}/${it.total}` : `Ep. ${it.ep}`}
                      </span>
                    </div>
                  )}
                </div>
                <span className={`pending-badge ${it.badge}`}>
                  {it.badge === 'watching' ? '▶ A ver' : '✅ Hoje'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Hero único (sem carrossel) */}
        {currentSlide && (
          <div
            className="home-hero"
            style={currentHeroImg ? undefined : { background: `linear-gradient(${GRAD[currentSlide.catId] || '135deg,#111,#222'})` }}
            onClick={() => onOpenCat(currentSlide.catId, currentSlide.item)}
          >
            {currentHeroImg && (
              <img className="home-hero-img" src={currentHeroImg} alt="" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            )}
            <div className="home-hero-overlay" />

            <div className="home-hero-cat-badge">
              {currentHeroCat?.icon} {currentHeroCat?.name.toUpperCase()}
            </div>

            <div className="home-hero-body">
              <div className="home-hero-title">{currentSlide.item.title}</div>
              <div className="home-hero-desc">{currentSlide.item.desc}</div>

              <div className="home-hero-btns" onClick={e => e.stopPropagation()}>
                <button className="btn-primary" onClick={() => onOpenCat(currentSlide.catId, currentSlide.item)}>
                  Ver ideia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="section-lbl" style={{ textTransform: 'lowercase', marginTop: 12 }}>explorar categorias</div>

        <div className="cats-3d-scroll">
          {exploreCats.map(c => (
            <button
              key={c.id}
              className="cat-3d-card fade-in"
              data-cat={c.id}
              style={{ '--c': c.color } as React.CSSProperties}
              onClick={() => onOpenCat(c.id)}
            >
              {CAT_IMAGES[c.id] && (
                <>
                  <div className="cat-3d-bg" style={{ backgroundImage: `url(${CAT_IMAGES[c.id]})` }} />
                  <div className="cat-3d-overlay" />
                </>
              )}
              <div className="cat-3d-content">
                <span className="cat-3d-i">{CAT_ICONS[c.id] || c.icon}</span>
                <span className="cat-3d-n">{c.name}</span>
                <span className="cat-3d-count">{(DATA[c.id] || []).length} ideias</span>
              </div>
            </button>
          ))}
        </div>

        {/* Actions — só Surpreende-me */}
        <div className="home-actions-solo">
          <button className="btn-surprise" onClick={onSurprise}>
            <span className="surprise-star">✦</span>
            Surpreende-me
          </button>
        </div>

        {/* Match de hoje */}
        <div className="match-today-card">
          <div className="match-today-left">
            <div className="match-today-avatars">
              <div className="match-today-av" style={{ background: 'var(--ac2)', borderColor: 'var(--ac)', color: 'var(--ac)' }}>
                {avatarLetter}
              </div>
              <div className="match-today-av" style={{ background: 'rgba(106,180,224,0.13)', borderColor: '#6ab4e0', color: '#6ab4e0', marginLeft: -10 }}>
                P
              </div>
            </div>
            <div>
              <div className="match-today-title">Jogar Match agora?</div>
              <div className="match-today-sub">Decide a dois em segundos</div>
            </div>
          </div>
          <button className="match-today-btn" onClick={() => onNav('match-screen')}>⚡</button>
        </div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
