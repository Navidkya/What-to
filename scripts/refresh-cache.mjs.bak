import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const TMDB_KEY = process.env.TMDB_KEY;
const RAWG_KEY = process.env.RAWG_KEY;
const YOUTUBE_KEY = process.env.YOUTUBE_KEY;
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
const LASTFM_KEY = process.env.LASTFM_KEY;

async function upsert(items) {
  if (!items.length) return;
  // Deduplicar por external_id antes de enviar
  const seen = new Set();
  const unique = items.filter(item => {
    if (!item.external_id) return false;
    if (seen.has(item.external_id)) return false;
    seen.add(item.external_id);
    return true;
  });
  if (!unique.length) return;
  // Enviar em batches de 500 para evitar limites
  for (let i = 0; i < unique.length; i += 500) {
    const batch = unique.slice(i, i + 500);
    const { error } = await supabase.from('suggestions_cache')
      .upsert(batch, { onConflict: 'cat_id,source_api,external_id', ignoreDuplicates: true });
    if (error) console.error('Upsert error:', error.message);
    else console.log(`  + ${batch.length} items (batch ${Math.floor(i/500)+1})`);
  }
}

async function getIGDBToken() {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const d = await res.json();
  return d.access_token;
}

async function refreshWatch() {
  console.log('\n WATCH');
  const items = [];
  // Mainstream
  for (let p = 1; p <= 15; p++) {
    for (const t of ['movie', 'tv']) {
      try {
        const r = await fetch(`https://api.themoviedb.org/3/discover/${t}?api_key=${TMDB_KEY}&language=pt-PT&sort_by=popularity.desc&vote_count.gte=100&page=${p}`);
        const d = await r.json();
        for (const i of (d.results || [])) {
          if (!i.title && !i.name) continue;
          items.push({
            cat_id: 'watch', title: i.title || i.name,
            description: i.overview?.substring(0, 300) || null,
            img: i.backdrop_path ? `https://image.tmdb.org/t/p/w780${i.backdrop_path}` : i.poster_path ? `https://image.tmdb.org/t/p/w500${i.poster_path}` : null,
            rating: i.vote_average ? Math.round(i.vote_average * 10) / 10 : null,
            year: (i.release_date || i.first_air_date || '').substring(0, 4) || null,
            type: t === 'movie' ? 'Filme' : 'Serie', genre: 'Drama', genres: [],
            url: null, emoji: t === 'movie' ? '🎬' : '📺',
            source_api: 'tmdb', external_id: `${t}-${i.id}`,
            tier: 'mainstream', last_seen_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.error(e.message); }
      await new Promise(r => setTimeout(r, 150));
    }
  }
  // Underground
  for (let p = 1; p <= 8; p++) {
    for (const t of ['movie', 'tv']) {
      try {
        const r = await fetch(`https://api.themoviedb.org/3/discover/${t}?api_key=${TMDB_KEY}&language=pt-PT&sort_by=vote_average.desc&vote_average.gte=7.0&vote_count.gte=20&vote_count.lte=500&page=${p}`);
        const d = await r.json();
        for (const i of (d.results || [])) {
          if (!i.title && !i.name) continue;
          items.push({
            cat_id: 'watch', title: i.title || i.name,
            description: i.overview?.substring(0, 300) || null,
            img: i.backdrop_path ? `https://image.tmdb.org/t/p/w780${i.backdrop_path}` : null,
            rating: i.vote_average ? Math.round(i.vote_average * 10) / 10 : null,
            year: (i.release_date || i.first_air_date || '').substring(0, 4) || null,
            type: t === 'movie' ? 'Filme' : 'Serie', genre: 'Underground', genres: [],
            url: null, emoji: t === 'movie' ? '🎬' : '📺',
            source_api: 'tmdb', external_id: `${t}-${i.id}`,
            tier: 'underground', last_seen_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.error(e.message); }
      await new Promise(r => setTimeout(r, 150));
    }
  }
  // Cinema mundial
  for (const lang of ['pt', 'fr', 'ko', 'ja', 'es', 'it', 'de', 'hi']) {
    for (let p = 1; p <= 3; p++) {
      try {
        const r = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=pt-PT&sort_by=vote_average.desc&vote_count.gte=30&with_original_language=${lang}&page=${p}`);
        const d = await r.json();
        for (const i of (d.results || [])) {
          if (!i.title) continue;
          items.push({
            cat_id: 'watch', title: i.title,
            description: i.overview?.substring(0, 300) || null,
            img: i.backdrop_path ? `https://image.tmdb.org/t/p/w780${i.backdrop_path}` : null,
            rating: i.vote_average ? Math.round(i.vote_average * 10) / 10 : null,
            year: i.release_date?.substring(0, 4) || null,
            type: 'Filme', genre: 'Cinema Mundial', genres: ['Cinema Mundial'],
            url: null, emoji: '🎬',
            source_api: 'tmdb', external_id: `movie-${i.id}`,
            tier: 'underground', last_seen_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.error(e.message); }
      await new Promise(r => setTimeout(r, 150));
    }
  }
  await upsert(items);
  console.log(`  Total: ${items.length}`);
}

async function refreshPlay() {
  console.log('\n PLAY');
  const items = [];
  for (let p = 1; p <= 15; p++) {
    try {
      const r = await fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&page_size=40&ordering=-rating&metacritic=65,100&page=${p}`);
      const d = await r.json();
      for (const i of (d.results || [])) {
        items.push({
          cat_id: 'play', title: i.name,
          description: (i.genres || []).map(g => g.name).join(', '),
          img: i.background_image || null,
          rating: i.rating ? Math.round(i.rating * 10) / 10 : null,
          year: i.released?.substring(0, 4) || null,
          type: 'Videojogo', genre: i.genres?.[0]?.name || 'Jogo',
          genres: (i.genres || []).map(g => g.name).slice(0, 3),
          url: null, emoji: '🎮',
          source_api: 'rawg', external_id: String(i.id),
          tier: 'mainstream', last_seen_at: new Date().toISOString(),
        });
      }
    } catch (e) { console.error(e.message); }
    await new Promise(r => setTimeout(r, 250));
  }
  const token = await getIGDBToken();
  for (const [tier, where] of [
    ['indie', 'rating > 70 & rating_count >= 10 & rating_count < 200 & cover != null'],
    ['underground', 'rating > 75 & rating_count >= 5 & rating_count < 50 & cover != null'],
  ]) {
    for (let offset = 0; offset < 300; offset += 50) {
      try {
        const r = await fetch('https://api.igdb.com/v4/games', {
          method: 'POST',
          headers: { 'Client-ID': IGDB_CLIENT_ID, 'Authorization': `Bearer ${token}`, 'Content-Type': 'text/plain' },
          body: `fields name,cover.url,rating,first_release_date,genres.name,summary; where ${where}; sort rating desc; limit 50; offset ${offset};`,
        });
        const d = await r.json();
        for (const i of (d || [])) {
          items.push({
            cat_id: 'play', title: i.name,
            description: i.summary?.substring(0, 300) || null,
            img: i.cover?.url ? i.cover.url.replace('t_thumb', 't_cover_big').replace('http:', 'https:') : null,
            rating: i.rating ? Math.round(i.rating) / 10 : null,
            year: i.first_release_date ? new Date(i.first_release_date * 1000).getFullYear().toString() : null,
            type: 'Videojogo', genre: i.genres?.[0]?.name || 'Indie',
            genres: (i.genres || []).map(g => g.name).slice(0, 3),
            url: null, emoji: '🎮',
            source_api: 'igdb', external_id: String(i.id),
            tier, last_seen_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.error(e.message); }
      await new Promise(r => setTimeout(r, 350));
    }
  }
  await upsert(items);
  console.log(`  Total: ${items.length}`);
}

async function refreshListen() {
  console.log('\n LISTEN');
  const items = [];
  const tags = ['pop','rock','hip-hop','electronic','jazz','classical','indie','soul','metal','folk','r&b','ambient','lo-fi','alternative','punk','reggae'];
  for (const tag of tags) {
    for (let p = 1; p <= 4; p++) {
      try {
        const r = await fetch(`https://ws.audioscrobbler.com/2.0/?method=tag.gettopalbums&tag=${encodeURIComponent(tag)}&api_key=${LASTFM_KEY}&format=json&limit=50&page=${p}`);
        const d = await r.json();
        for (const a of (d.albums?.album || [])) {
          const img = a.image?.find(i => i.size === 'extralarge')?.['#text'];
          if (!img || img.includes('2a96cbd8b46e442fc41c2b86b821562f')) continue;
          items.push({
            cat_id: 'listen', title: a.name,
            description: a.artist?.name || null, img,
            rating: null, year: null, type: 'Album', genre: tag,
            genres: [tag, 'Album'], url: a.url || null, emoji: '🎵',
            source_api: 'lastfm',
            external_id: `album-${a.name}-${a.artist?.name}`.replace(/[^\w-]/g, '_').substring(0, 190),
            tier: 'mainstream', last_seen_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.error(e.message); }
      await new Promise(r => setTimeout(r, 200));
    }
  }
  for (const q of ['top hits 2024','best songs','indie hits','underground music','jazz classics','electronic dance','hip hop','lo-fi beats','soul classics','rock classics']) {
    try {
      const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=100&country=PT`);
      const d = await r.json();
      for (const i of (d.results || [])) {
        if (!i.trackName || !i.trackId) continue;
        items.push({
          cat_id: 'listen', title: i.trackName,
          description: i.artistName || null,
          img: i.artworkUrl100?.replace('100x100', '600x600') || null,
          rating: null, year: i.releaseDate?.substring(0, 4) || null,
          type: 'Track', genre: i.primaryGenreName || q,
          genres: [i.primaryGenreName || q, 'Track'],
          url: i.trackViewUrl || null, emoji: '🎵',
          source_api: 'itunes', external_id: String(i.trackId),
          tier: q.includes('underground') ? 'underground' : 'mainstream',
          last_seen_at: new Date().toISOString(),
        });
      }
    } catch (e) { console.error(e.message); }
    await new Promise(r => setTimeout(r, 200));
  }
  await upsert(items);
  console.log(`  Total: ${items.length}`);
}

async function refreshRead() {
  console.log('\n READ');
  const items = [];
  for (const q of ['bestseller fiction','popular science','history biography','philosophy','psychology','thriller mystery','science fiction','poetry classics','graphic novel','self help']) {
    for (let s = 0; s < 120; s += 40) {
      try {
        const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=40&startIndex=${s}&orderBy=relevance`);
        const d = await r.json();
        for (const b of (d.items || [])) {
          const info = b.volumeInfo;
          if (!info?.title) continue;
          items.push({
            cat_id: 'read', title: info.title,
            description: `${info.authors?.join(', ') || ''} · ${info.pageCount ? info.pageCount + ' pags' : ''}`,
            img: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
            rating: info.averageRating || null,
            year: info.publishedDate?.substring(0, 4) || null,
            type: 'Livro', genre: info.categories?.[0] || q,
            genres: (info.categories || [q]).slice(0, 3),
            url: info.previewLink || null, emoji: '📚',
            source_api: 'google_books', external_id: b.id,
            tier: 'mainstream', last_seen_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.error(e.message); }
      await new Promise(r => setTimeout(r, 200));
    }
  }
  for (const subject of ['science_fiction','mystery','horror','fantasy','historical_fiction','biography','philosophy','poetry','comics','romance','thriller','classics']) {
    for (let p = 1; p <= 4; p++) {
      try {
        const offset = (p - 1) * 50;
        const r = await fetch(`https://openlibrary.org/subjects/${subject}.json?limit=50&offset=${offset}`);
        const d = await r.json();
        for (const w of (d.works || [])) {
          if (!w.title) continue;
          items.push({
            cat_id: 'read', title: w.title,
            description: w.authors?.[0]?.name || null,
            img: w.cover_id ? `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg` : null,
            rating: null, year: w.first_publish_year?.toString() || null,
            type: 'Livro', genre: subject.replace(/_/g, ' '),
            genres: [subject.replace(/_/g, ' '), 'Livro'],
            url: w.key ? `https://openlibrary.org${w.key}` : null, emoji: '📚',
            source_api: 'openlibrary',
            external_id: w.key?.replace(/\//g, '_').substring(0, 190) || null,
            tier: (w.edition_count || 0) < 5 ? 'underground' : 'mainstream',
            last_seen_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.error(e.message); }
      await new Promise(r => setTimeout(r, 200));
    }
  }
  await upsert(items);
  console.log(`  Total: ${items.length}`);
}

async function refreshLearn() {
  console.log('\n LEARN');
  const items = [];
  const queries = [
    'tutorial aprender','ciencia explicada','historia mundo','tecnologia IA',
    'filosofia explicada','matematica tutorial','biologia medicina',
    'astronomia espaco','psicologia comportamento','arte design tutorial',
    'musica teoria','culinaria tecnicas','economia financas','programacao web',
    'fisica quantica','linguistica idiomas','geopolitica atual','sociologia',
  ];
  for (const q of queries) {
    for (const dur of ['short','medium','long']) {
      try {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_KEY}&part=snippet&type=video&q=${encodeURIComponent(q)}&maxResults=50&relevanceLanguage=pt&videoDuration=${dur}&videoEmbeddable=true&safeSearch=strict`);
        const d = await r.json();
        for (const i of (d.items || [])) {
          if (!i.id?.videoId || !i.snippet?.title) continue;
          items.push({
            cat_id: 'learn', title: i.snippet.title,
            description: i.snippet.channelTitle || null,
            img: i.snippet.thumbnails?.high?.url || i.snippet.thumbnails?.medium?.url || null,
            rating: null, year: i.snippet.publishedAt?.substring(0, 4) || null,
            type: 'Video', genre: q.split(' ')[0],
            genres: ['Video', q.split(' ')[0]],
            url: `https://youtube.com/watch?v=${i.id.videoId}`, emoji: '🧠',
            source_api: 'youtube', external_id: i.id.videoId,
            tier: 'mainstream', last_seen_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.error(e.message); }
      await new Promise(r => setTimeout(r, 350));
    }
  }
  await upsert(items);
  console.log(`  Total: ${items.length}`);
}

async function main() {
  console.log('What to — Cache Refresh — ' + new Date().toISOString());
  await refreshWatch();
  await refreshPlay();
  await refreshListen();
  await refreshRead();
  await refreshLearn();
  const { count } = await supabase.from('suggestions_cache').select('*', { count: 'exact', head: true });
  console.log('\nCache total: ' + count + ' itens');
}

main().catch(console.error);
