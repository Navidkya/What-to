// Trending real de cada categoria para alimentar o feed com dados realistas
// Os números de utilizadores são gerados com base na posição no trending:
// #1 = baseCount, #2 = baseCount * 0.67, #3 = baseCount * 0.45, etc.
// O baseCount diminui à medida que há mais utilizadores reais na app.

const PORTUGUESE_NAMES = [
  'Ana','Miguel','Sofia','João','Beatriz','Tiago','Inês','Pedro','Mariana','Rui',
  'Catarina','André','Marta','Diogo','Carolina','Nuno','Filipa','Gonçalo','Rita','Luís',
  'Sara','Vasco','Daniela','Bruno','Francisca','Rodrigo','Leonor','Afonso','Matilde','Hugo',
];

function randomName(): string {
  return PORTUGUESE_NAMES[Math.floor(Math.random() * PORTUGUESE_NAMES.length)];
}

function randomCount(position: number, baseCount: number): number {
  const decay = Math.pow(0.67, position - 1);
  const base = Math.round(baseCount * decay);
  const noise = Math.round(base * (0.9 + Math.random() * 0.2)); // ±10%
  return Math.max(noise, 3);
}

// baseCount diminui com utilizadores reais:
// 0 users reais → base 500
// 100 users reais → base 400
// 1000 users reais → base 200
// 10000 users reais → base 50 (dados reais dominam)
function getBaseCount(realUserCount: number): number {
  if (realUserCount >= 10000) return 50;
  if (realUserCount >= 1000) return 200;
  if (realUserCount >= 100) return 400;
  return 500;
}

export interface TrendingFeedCard {
  id: string;
  type: 'community' | 'individual';
  // community
  count?: number;
  period?: 'hoje' | 'semana' | 'mês';
  verb?: string; // 'estão a ver', 'começaram a jogar', 'leram', etc.
  // individual
  personName?: string;
  action?: string; // 'está a ver', 'começou a jogar', etc.
  // shared
  title: string;
  catId: string;
  catName: string;
  emoji: string;
  img: string | null;
  badge: '✦ What to';
}

const CAT_VERBS: Record<string, { community: string[]; individual: string[] }> = {
  watch:  { community: ['estão a ver', 'começaram a ver', 'viram esta semana'], individual: ['está a ver', 'começou a ver', 'acabou de ver'] },
  eat:    { community: ['cozinharam', 'experimentaram', 'fizeram esta semana'], individual: ['cozinhou', 'experimentou', 'fez hoje'] },
  read:   { community: ['estão a ler', 'leram este mês', 'começaram a ler'], individual: ['está a ler', 'leu', 'começou a ler'] },
  listen: { community: ['estão a ouvir', 'ouviram esta semana', 'descobriram'], individual: ['está a ouvir', 'descobriu', 'ouve em repeat'] },
  play:   { community: ['estão a jogar', 'começaram a jogar', 'jogaram esta semana'], individual: ['está a jogar', 'começou a jogar', 'recomenda'] },
  learn:  { community: ['estão a aprender', 'viram este vídeo', 'aprenderam'], individual: ['está a aprender', 'viu', 'recomenda'] },
  visit:  { community: ['visitaram', 'estiveram em', 'foram a'], individual: ['visitou', 'esteve em', 'recomenda'] },
  do:     { community: ['fizeram', 'experimentaram', 'adoraram'], individual: ['fez', 'experimentou', 'adorou'] },
};

const CAT_NAMES: Record<string, string> = {
  watch: 'Ver', eat: 'Comer', read: 'Ler', listen: 'Ouvir',
  play: 'Jogar', learn: 'Aprender', visit: 'Visitar', do: 'Fazer',
};

const CAT_EMOJIS: Record<string, string> = {
  watch: '🎬', eat: '🍽️', read: '📚', listen: '🎵',
  play: '🎮', learn: '🧠', visit: '📍', do: '⚡',
};

function pickVerb(catId: string, type: 'community' | 'individual'): string {
  const verbs = CAT_VERBS[catId]?.[type] || ['usaram'];
  return verbs[Math.floor(Math.random() * verbs.length)];
}

async function fetchTrendingWatch(): Promise<Array<{ title: string; img: string | null }>> {
  try {
    const apiKey = import.meta.env.VITE_TMDB_KEY;
    const res = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&language=pt-PT`);
    if (!res.ok) return [];
    const data = await res.json() as { results?: Array<{ title?: string; name?: string; backdrop_path?: string; poster_path?: string }> };
    return (data.results || []).slice(0, 8).map(r => ({
      title: r.title || r.name || '',
      img: r.backdrop_path ? `https://image.tmdb.org/t/p/w780${r.backdrop_path}` : r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
    }));
  } catch { return []; }
}

async function fetchTrendingPlay(): Promise<Array<{ title: string; img: string | null }>> {
  try {
    const apiKey = import.meta.env.VITE_RAWG_KEY;
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&dates=${last30},${today}&ordering=-added&page_size=8`);
    if (!res.ok) return [];
    const data = await res.json() as { results?: Array<{ name: string; background_image?: string }> };
    return (data.results || []).slice(0, 8).map(r => ({
      title: r.name,
      img: r.background_image || null,
    }));
  } catch { return []; }
}

async function fetchTrendingRead(): Promise<Array<{ title: string; img: string | null }>> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_KEY;
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=bestseller&orderBy=newest&maxResults=8&key=${apiKey}`);
    if (!res.ok) return [];
    const data = await res.json() as { items?: Array<{ volumeInfo: { title: string; imageLinks?: { thumbnail?: string } } }> };
    return (data.items || []).slice(0, 8).map(r => ({
      title: r.volumeInfo.title,
      img: r.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
    }));
  } catch { return []; }
}

async function fetchTrendingListen(): Promise<Array<{ title: string; img: string | null }>> {
  try {
    const res = await fetch('https://api.deezer.com/chart/0/albums?limit=8');
    if (!res.ok) return [];
    const data = await res.json() as { data?: Array<{ title: string; cover_medium?: string }> };
    return (data.data || []).slice(0, 8).map(r => ({
      title: r.title,
      img: r.cover_medium || null,
    }));
  } catch { return []; }
}

async function fetchTrendingLearn(): Promise<Array<{ title: string; img: string | null }>> {
  try {
    const apiKey = import.meta.env.VITE_YOUTUBE_KEY;
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&videoCategoryId=27&maxResults=8&key=${apiKey}&hl=pt`);
    if (!res.ok) return [];
    const data = await res.json() as { items?: Array<{ snippet: { title: string; thumbnails?: { medium?: { url: string } } } }> };
    return (data.items || []).slice(0, 8).map(r => ({
      title: r.snippet.title,
      img: r.snippet.thumbnails?.medium?.url || null,
    }));
  } catch { return []; }
}

// Eat, Visit, Do — sem trending API fiável, usa lista editorial
const EDITORIAL_EAT = [
  { title: 'Bacalhau à Brás', img: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=780&q=80' },
  { title: 'Francesinha', img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=780&q=80' },
  { title: 'Pastel de Nata', img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=780&q=80' },
  { title: 'Caldo Verde', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=780&q=80' },
  { title: 'Alheira Grelhada', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=780&q=80' },
];
const EDITORIAL_VISIT = [
  { title: 'Museu do Azulejo', img: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=780&q=80' },
  { title: 'LX Factory', img: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=780&q=80' },
  { title: 'Parque das Nações', img: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=780&q=80' },
  { title: 'Serra da Arrábida', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=780&q=80' },
  { title: 'Time Out Market', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=780&q=80' },
];
const EDITORIAL_DO = [
  { title: 'Surf em Cascais', img: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=780&q=80' },
  { title: 'Escape Room', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=780&q=80' },
  { title: 'Caminhada na Sintra', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=780&q=80' },
  { title: 'Aula de Cerâmica', img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=780&q=80' },
  { title: 'Picnic no Parque', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=780&q=80' },
];

export async function buildTrendingFeedCards(realUserCount = 0): Promise<TrendingFeedCard[]> {
  const baseCount = getBaseCount(realUserCount);

  // Busca trending de todas as categorias em paralelo
  const [watchItems, playItems, readItems, listenItems, learnItems] = await Promise.all([
    fetchTrendingWatch(),
    fetchTrendingPlay(),
    fetchTrendingRead(),
    fetchTrendingListen(),
    fetchTrendingLearn(),
  ]);

  const allCategories: Array<{ catId: string; items: Array<{ title: string; img: string | null }> }> = [
    { catId: 'watch', items: watchItems },
    { catId: 'play', items: playItems },
    { catId: 'read', items: readItems },
    { catId: 'listen', items: listenItems },
    { catId: 'learn', items: learnItems },
    { catId: 'eat', items: EDITORIAL_EAT },
    { catId: 'visit', items: EDITORIAL_VISIT },
    { catId: 'do', items: EDITORIAL_DO },
  ];

  const cards: TrendingFeedCard[] = [];

  for (const { catId, items } of allCategories) {
    if (!items.length) continue;

    // Top 3 de cada categoria → card de comunidade
    items.slice(0, 3).forEach((item, i) => {
      if (!item.title) return;
      const count = randomCount(i + 1, baseCount);
      const period: 'hoje' | 'semana' | 'mês' = i === 0 ? 'semana' : i === 1 ? 'mês' : 'hoje';
      cards.push({
        id: `trending-${catId}-${i}-${Date.now()}`,
        type: 'community',
        count,
        period,
        verb: pickVerb(catId, 'community'),
        title: item.title,
        catId,
        catName: CAT_NAMES[catId] || catId,
        emoji: CAT_EMOJIS[catId] || '✦',
        img: item.img,
        badge: '✦ What to',
      });
    });

    // #1 e #2 de cada categoria → card individual (pessoa fictícia)
    items.slice(0, 2).forEach((item) => {
      if (!item.title) return;
      cards.push({
        id: `individual-${catId}-${item.title}-${Date.now()}`,
        type: 'individual',
        personName: randomName(),
        action: pickVerb(catId, 'individual'),
        title: item.title,
        catId,
        catName: CAT_NAMES[catId] || catId,
        emoji: CAT_EMOJIS[catId] || '✦',
        img: item.img,
        badge: '✦ What to',
      });
    });
  }

  // Embaralha para misturar categorias
  return cards.sort(() => Math.random() - 0.5);
}
