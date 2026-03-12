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

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TMDB_KEY = import.meta.env.VITE_TMDB_KEY as string;

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
      if (hit?.poster_path) img = `https://image.tmdb.org/t/p/w92${hit.poster_path}`;
    }

    if (!img) {
      const mvRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${q}&language=pt-PT`);
      if (mvRes.ok) {
        const mvData = await mvRes.json() as { results?: Array<{ poster_path?: string }> };
        const hit = mvData.results?.[0];
        if (hit?.poster_path) img = `https://image.tmdb.org/t/p/w92${hit.poster_path}`;
      }
    }

    localStorage.setItem(cacheKey, img || '');
    return img;
  } catch {
    return null;
  }
}

// Which cats are "big" (top row) vs "small" (secondary)
const BIG_CAT_IDS = ['watch', 'eat', 'do'];
const SMALL_CAT_IDS = ['play', 'read', 'listen', 'learn', 'visit'];

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

  // Hero card: random item from all available data
  const allItems = Object.values(DATA).flat().filter(item => hasPlatform(item, profile));
  const [heroItem] = useState<DataItem | null>(() => {
    if (!allItems.length) return null;
    return allItems[Math.floor(Math.random() * allItems.length)];
  });
  const heroCat = heroItem ? CATS.find(c => DATA[c.id]?.includes(heroItem)) : null;

  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!heroItem || !heroCat) return;
    const catId = heroCat.id;
    const title = heroItem.title;

    async function fetchImg() {
      let img: string | null = null;

      if (catId === 'watch') {
        img = await fetchTMDBBackdrop(title);
      } else if (catId === 'play') {
        img = getSteamImageUrl(heroItem!.steamId);
      } else if (catId === 'eat') {
        const meal = await fetchMeal(title);
        img = meal?.photoUrl || null;
      } else if (catId === 'read') {
        img = await fetchBookCover(title);
      }

      setHeroImageUrl(img);
    }

    fetchImg();
  }, [heroItem?.title, heroCat?.id]);

  // Pending: hoje + watching
  const hojeItems = history.filter(h => h.action === 'hoje').slice(0, 3);
  const watchingItems = Object.entries(tracking).filter(([, v]) => v.state === 'watching').slice(0, 2);
  const pendingItems: Array<{ emoji: string; title: string; sub: string; badge: string; catId: string; ep?: number }> = [];
  hojeItems.forEach(h => pendingItems.push({ emoji: h.emoji, title: h.title, sub: 'Para hoje · ' + fmtDate(h.date), badge: 'hoje', catId: h.catId }));
  watchingItems.forEach(([, v]) => pendingItems.push({ emoji: v.emoji || '🎬', title: v.title, sub: 'A ver' + (v.s ? ` · T${v.s} Ep${v.e}` : ''), badge: 'watching', catId: v.catId, ep: v.e }));

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
  }, [pendingItems.map(p => p.title).join(',')]);

  // Today's schedules
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySchedules = schedules.filter(s => s.date.startsWith(todayStr));

  const bigCats = CATS.filter(c => BIG_CAT_IDS.includes(c.id));
  const smallCats = CATS.filter(c => SMALL_CAT_IDS.includes(c.id));

  return (
    <div className="h-screen-content" id="home" style={{ paddingBottom: 80 }}>
      <div className="home-inner">

        {/* Header */}
        <div className="home-header">
          <div className="home-header-top">
            <div className="home-name">{greeting}</div>
            <button className="home-avatar" onClick={() => onNav('profile')}>
              {avatarLetter}
            </button>
          </div>
          <div className="home-sub">{dayTime}</div>
          <div className="home-mood">{contextPhrase}</div>
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
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${Math.min((it.ep / 10) * 100, 100)}%` }} />
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

        {/* Hero card */}
        {heroItem && heroCat && (
          <div
            className="home-hero"
            style={!heroImageUrl ? { background: `linear-gradient(${GRAD[heroCat.id] || '135deg,#111,#222'})` } : undefined}
            onClick={() => onOpenCat(heroCat.id, heroItem)}
          >
            {heroImageUrl && <img className="home-hero-img" src={heroImageUrl} alt="" />}
            <div className="home-hero-overlay" />
            <div className="home-hero-body">
              <div className="home-hero-badge">Sugestão do dia</div>
              <div className="home-hero-title">{heroItem.title}</div>
              <div className="home-hero-desc">{heroItem.desc}</div>
              <div className="home-hero-btns" onClick={e => e.stopPropagation()}>
                <button className="btn-primary" onClick={() => onOpenCat(heroCat.id, heroItem)}>Ver ideia</button>
                <button className="btn-secondary" onClick={e => { e.stopPropagation(); onSurprise(); }}>Trocar ↺</button>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="section-lbl">Explorar</div>

        <div className="cats-grid">
          <div className="cats-row-main">
            {bigCats.map(c => (
              <button
                key={c.id}
                className="cat-big"
                data-cat={c.id}
                style={{ '--c': c.color } as React.CSSProperties}
                onClick={() => onOpenCat(c.id)}
              >
                <span className="cat-big-i">{CAT_ICONS[c.id]}</span>
                <span className="cat-big-n">{c.name}</span>
              </button>
            ))}
            <button
              className="cat-big"
              data-cat="match"
              style={{ '--c': '#e07070' } as React.CSSProperties}
              onClick={() => onNav('match-screen')}
            >
              <span className="cat-big-i">{CAT_ICONS['match']}</span>
              <span className="cat-big-n">Match</span>
            </button>
          </div>

          <div className="cats-small">
            {smallCats.map(c => (
              <button
                key={c.id}
                className="cat-small"
                data-cat={c.id}
                style={{ '--c': c.color } as React.CSSProperties}
                onClick={() => onOpenCat(c.id)}
              >
                <span className="cat-small-i">{CAT_ICONS[c.id] || c.icon}</span>
                <span className="cat-small-n">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="home-actions" style={{ marginTop: 14 }}>
          <button className="btn-surprise" onClick={onSurprise}>
            <span style={{ fontSize: 16 }}>✦</span> Surpreende-me
          </button>
          <button className="ha-btn" onClick={() => onNav('match-screen')}>
            <span className="ha-i">⚡</span>Match
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
