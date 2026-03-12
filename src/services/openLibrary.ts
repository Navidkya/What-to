const OL_CACHE_PREFIX = 'wt_ol_';

function olCacheGet(key: string): string | null {
  try { return localStorage.getItem(OL_CACHE_PREFIX + key); } catch { return null; }
}
function olCacheSet(key: string, v: string) {
  try { localStorage.setItem(OL_CACHE_PREFIX + key, v); } catch { /* ignore */ }
}

export async function fetchBookCover(title: string): Promise<string | null> {
  const cacheKey = title.toLowerCase().replace(/\s+/g, '_').slice(0, 40);
  const cached = olCacheGet(cacheKey);
  if (cached !== null) return cached || null;

  try {
    const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1&fields=cover_i,title`);
    if (!res.ok) { olCacheSet(cacheKey, ''); return null; }
    const data = await res.json() as { docs?: Array<{ cover_i?: number }> };
    const coverId = data.docs?.[0]?.cover_i;
    if (!coverId) { olCacheSet(cacheKey, ''); return null; }
    const url = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    olCacheSet(cacheKey, url);
    return url;
  } catch {
    return null;
  }
}

export function getSteamImageUrl(steamId: number | null | undefined): string | null {
  if (!steamId) return null;
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${steamId}/capsule_616x353.jpg`;
}
