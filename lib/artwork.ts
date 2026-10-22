/**
 * Artwork service — resolves a poster/cover URL for each recommended item.
 *
 * Priority order (per media type):
 *   Film / TV : Qloo entity images → TMDB (search by title+year, or external TMDB ID)
 *   Books     : Open Library Covers (by ISBN/OLID) → Google Books thumbnail
 *   Music     : iTunes Search API → Deezer Search API
 *   Fallback  : placeholder gradient URL (data: URL, no broken images)
 *
 * TMDB API (v3):
 *   Auth  : Authorization: Bearer <TMDB_API_READ_ACCESS_TOKEN>
 *   Config: GET https://api.themoviedb.org/3/configuration
 *     → images.secure_base_url + poster_sizes (w342, w780)
 *   Search: GET /3/search/movie?query=&year= | /3/search/tv?query=
 *     → results[0].poster_path (relative, prepend base_url + size)
 *
 * Open Library Covers (no key):
 *   https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
 *   https://covers.openlibrary.org/b/olid/{OLID}-L.jpg
 *
 * iTunes Search (no key):
 *   https://itunes.apple.com/search?term={q}&entity=musicArtist&limit=1
 *   → results[0].artworkUrl100 (swap "100x100" → "600x600" for larger)
 *
 * Deezer (no key):
 *   https://api.deezer.com/search/artist?q={q}&limit=1
 *   → data[0].picture_xl
 */

import type { MediaType } from './types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ArtworkResult {
  url: string;          // resolved image URL (never undefined)
  source: string;       // 'qloo' | 'tmdb' | 'open_library' | 'google_books' | 'itunes' | 'deezer' | 'placeholder'
  confidence: 'high' | 'medium' | 'low';
  warning?: string;
}

interface CacheEntry {
  result: ArtworkResult;
  expiry: number;
}

// ─── Cache (in-memory, keyed by entityId) ────────────────────────────────────

const artworkCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function fromCache(key: string): ArtworkResult | null {
  const entry = artworkCache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.result;
  artworkCache.delete(key);
  return null;
}

function toCache(key: string, result: ArtworkResult): void {
  artworkCache.set(key, { result, expiry: Date.now() + CACHE_TTL_MS });
}

// ─── TMDB base URL cache ──────────────────────────────────────────────────────

let tmdbImageBaseUrl: string | null = null;

async function getTmdbImageBaseUrl(): Promise<string> {
  if (tmdbImageBaseUrl) return tmdbImageBaseUrl;
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) return 'https://image.tmdb.org/t/p/';
  try {
    const res = await fetch('https://api.themoviedb.org/3/configuration', {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 }, // cache 24h
    });
    if (res.ok) {
      const data = await res.json() as { images: { secure_base_url: string } };
      tmdbImageBaseUrl = data.images.secure_base_url;
      return tmdbImageBaseUrl;
    }
  } catch {
    // fall through
  }
  return 'https://image.tmdb.org/t/p/';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalise a title for fuzzy comparison */
export function normTitle(s: string): string {
  return s.toLowerCase().replace(/['’]/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Check if titles are a close match */
export function titlesMatch(a: string, b: string): boolean {
  const na = normTitle(a);
  const nb = normTitle(b);
  if (!na && !nb) return true;
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  return false;
}

// ─── TMDB lookup ─────────────────────────────────────────────────────────────

async function searchTmdb(
  title: string,
  mediaType: 'movie' | 'tv',
  year?: number,
  externalTmdbId?: string,
  size: 'w342' | 'w780' = 'w342'
): Promise<ArtworkResult | null> {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) return null;

  const baseUrl = await getTmdbImageBaseUrl();

  try {
    // If we have a TMDB ID, use it directly
    if (externalTmdbId) {
      const endpoint = mediaType === 'movie'
        ? `/3/movie/${externalTmdbId}`
        : `/3/tv/${externalTmdbId}`;
      const res = await fetch(`https://api.themoviedb.org${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { poster_path?: string; title?: string; name?: string };
        if (data.poster_path) {
          return {
            url: `${baseUrl}${size}${data.poster_path}`,
            source: 'tmdb',
            confidence: 'high',
          };
        }
      }
    }

    // Search by title
    const endpoint = mediaType === 'movie' ? '/3/search/movie' : '/3/search/tv';
    const params = new URLSearchParams({ query: title, language: 'en-US', page: '1' });
    if (year && mediaType === 'movie') params.set('year', String(year));
    if (year && mediaType === 'tv') params.set('first_air_date_year', String(year));

    const res = await fetch(`https://api.themoviedb.org${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const data = await res.json() as {
      results?: Array<{
        poster_path?: string;
        title?: string;
        name?: string;
        release_date?: string;
        first_air_date?: string;
      }>;
    };

    const results = data.results || [];
    // Find best match by title
    const match = results.find(r => {
      const t = r.title || r.name || '';
      return titlesMatch(t, title);
    }) || results[0];

    if (!match) return null;

    const confidence = titlesMatch(match.title || match.name || '', title) ? 'high' : 'low';
    if (confidence === 'low') {
      console.warn(`[artwork] Low-confidence TMDB match: "${match.title || match.name}" for "${title}"`);
    }

    if (!match.poster_path) return null;

    return {
      url: `${baseUrl}${size}${match.poster_path}`,
      source: 'tmdb',
      confidence,
    };
  } catch (err) {
    console.warn('[artwork] TMDB error:', err);
    return null;
  }
}

// ─── Open Library ────────────────────────────────────────────────────────────

async function searchOpenLibrary(
  title: string,
  author?: string,
  isbn?: string
): Promise<ArtworkResult | null> {
  try {
    // Prefer ISBN
    if (isbn) {
      const url = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
      // Open Library returns a 1x1 transparent gif when no cover exists — check content-length
      const head = await fetch(url, { method: 'HEAD' });
      const len = head.headers.get('content-length');
      if (head.ok && len && parseInt(len, 10) > 1000) {
        return { url, source: 'open_library', confidence: 'high' };
      }
    }

    // Search by title+author
    const q = author ? `${title} ${author}` : title;
    const searchRes = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=title,author_name,cover_i,isbn&limit=5`,
      { headers: { Accept: 'application/json' } }
    );
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json() as {
      docs?: Array<{ title?: string; author_name?: string[]; cover_i?: number; isbn?: string[] }>;
    };

    const docs = searchData.docs || [];
    const match = docs.find(d => titlesMatch(d.title || '', title)) || docs[0];
    if (!match) return null;

    const confidence = titlesMatch(match.title || '', title) ? 'high' : 'low';
    if (confidence === 'low') {
      console.warn(`[artwork] Low-confidence Open Library match: "${match.title}" for "${title}"`);
    }

    if (match.cover_i) {
      return {
        url: `https://covers.openlibrary.org/b/id/${match.cover_i}-L.jpg`,
        source: 'open_library',
        confidence,
      };
    }

    // Try first ISBN from results
    if (match.isbn?.[0]) {
      const url = `https://covers.openlibrary.org/b/isbn/${match.isbn[0]}-L.jpg`;
      const head = await fetch(url, { method: 'HEAD' });
      const len = head.headers.get('content-length');
      if (head.ok && len && parseInt(len, 10) > 1000) {
        return { url, source: 'open_library', confidence };
      }
    }

    return null;
  } catch (err) {
    console.warn('[artwork] Open Library error:', err);
    return null;
  }
}

// ─── Google Books ────────────────────────────────────────────────────────────

async function searchGoogleBooks(title: string, author?: string): Promise<ArtworkResult | null> {
  try {
    const q = author ? `intitle:${title}+inauthor:${author}` : `intitle:${title}`;
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&fields=items(volumeInfo(title,authors,imageLinks))`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;

    const data = await res.json() as {
      items?: Array<{
        volumeInfo?: {
          title?: string;
          authors?: string[];
          imageLinks?: { thumbnail?: string; smallThumbnail?: string };
        };
      }>;
    };

    const items = data.items || [];
    const match = items.find(i => titlesMatch(i.volumeInfo?.title || '', title)) || items[0];
    if (!match?.volumeInfo?.imageLinks?.thumbnail) return null;

    // Upgrade thumbnail to larger size: replace zoom=1 with zoom=0, or append &fife=w600
    const url = match.volumeInfo.imageLinks.thumbnail.replace('zoom=1', 'zoom=0') + '&fife=w600';
    const confidence = titlesMatch(match.volumeInfo.title || '', title) ? 'high' : 'low';
    return { url, source: 'google_books', confidence };
  } catch (err) {
    console.warn('[artwork] Google Books error:', err);
    return null;
  }
}

// ─── iTunes ──────────────────────────────────────────────────────────────────

async function searchItunes(query: string, country = 'US'): Promise<ArtworkResult | null> {
  try {
    const params = new URLSearchParams({
      term: query,
      entity: 'musicArtist',
      country,
      limit: '5',
    });
    const res = await fetch(`https://itunes.apple.com/search?${params}`);
    if (!res.ok) return null;

    const data = await res.json() as {
      results?: Array<{ artistName?: string; artworkUrl100?: string }>;
    };

    const results = data.results || [];
    const match = results.find(r => titlesMatch(r.artistName || '', query)) || results[0];
    if (!match?.artworkUrl100) return null;

    // iTunes artwork URL trick: swap size suffix for larger image
    const url = match.artworkUrl100.replace('100x100bb', '600x600bb');
    const confidence = titlesMatch(match.artistName || '', query) ? 'high' : 'medium';
    return { url, source: 'itunes', confidence };
  } catch (err) {
    console.warn('[artwork] iTunes error:', err);
    return null;
  }
}

// ─── Deezer ──────────────────────────────────────────────────────────────────

async function searchDeezer(query: string): Promise<ArtworkResult | null> {
  try {
    const res = await fetch(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}&limit=5`
    );
    if (!res.ok) return null;

    const data = await res.json() as {
      data?: Array<{ name?: string; picture_xl?: string; picture_big?: string }>;
    };

    const results = data.data || [];
    const match = results.find(r => titlesMatch(r.name || '', query)) || results[0];
    const url = match?.picture_xl || match?.picture_big;
    if (!url) return null;

    const confidence = titlesMatch(match?.name || '', query) ? 'high' : 'medium';
    return { url, source: 'deezer', confidence };
  } catch (err) {
    console.warn('[artwork] Deezer error:', err);
    return null;
  }
}

// ─── Placeholder ─────────────────────────────────────────────────────────────

const MEDIA_ICONS: Record<MediaType, string> = {
  movie: '🎬',
  tv: '📺',
  music: '🎵',
  book: '📖',
};

const GRADIENT_PALETTES: Record<MediaType, [string, string]> = {
  movie: ['#0d253f', '#01b4e4'],
  tv: ['#1a0533', '#a855f7'],
  music: ['#0f2027', '#2ecc71'],
  book: ['#2d1b69', '#f59e0b'],
};

/**
 * Return a data: URL SVG placeholder so no broken image is ever shown.
 */
function makePlaceholder(title: string, mediaType: MediaType): ArtworkResult {
  const [c1, c2] = GRADIENT_PALETTES[mediaType];
  const icon = MEDIA_ICONS[mediaType];
  const shortTitle = title.slice(0, 24) + (title.length > 24 ? '…' : '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="450" fill="url(#g)"/>
  <text x="150" y="200" font-size="72" text-anchor="middle" dominant-baseline="middle">${icon}</text>
  <text x="150" y="300" font-size="18" font-family="system-ui,sans-serif" fill="white" text-anchor="middle" font-weight="600">${shortTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
</svg>`;

  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return { url: encoded, source: 'placeholder', confidence: 'low' };
}

// ─── Main export ─────────────────────────────────────────────────────────────

export interface ArtworkRequest {
  entityId: string;
  title: string;
  mediaType: MediaType;
  year?: number;
  creator?: string;        // director / author / artist
  qlooImageUrl?: string;   // from Qloo entity response
  externalTmdbId?: string; // from Qloo external_ids
  isbn?: string;
  size?: 'card' | 'detail'; // card=w342, detail=w780
}

/**
 * Resolve artwork for a single item.
 * Results are cached in-memory by entityId.
 */
export async function resolveArtwork(req: ArtworkRequest): Promise<ArtworkResult> {
  const cacheKey = `${req.entityId}:${req.size || 'card'}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  const size = req.size === 'detail' ? 'w780' : 'w342';
  let result: ArtworkResult | null = null;

  const mt = req.mediaType;

  if (mt === 'movie' || mt === 'tv') {
    // 1. Qloo entity image
    if (req.qlooImageUrl) {
      result = { url: req.qlooImageUrl, source: 'qloo', confidence: 'high' };
    }

    // 2. TMDB
    if (!result) {
      result = await searchTmdb(req.title, mt, req.year, req.externalTmdbId, size);
    }
  } else if (mt === 'book') {
    // 1. Qloo entity image
    if (req.qlooImageUrl) {
      result = { url: req.qlooImageUrl, source: 'qloo', confidence: 'high' };
    }
    // 2. Open Library
    if (!result) {
      result = await searchOpenLibrary(req.title, req.creator, req.isbn);
    }
    // 3. Google Books
    if (!result) {
      result = await searchGoogleBooks(req.title, req.creator);
    }
  } else if (mt === 'music') {
    // 1. Qloo entity image
    if (req.qlooImageUrl) {
      result = { url: req.qlooImageUrl, source: 'qloo', confidence: 'high' };
    }
    // 2. iTunes
    if (!result) {
      result = await searchItunes(req.creator || req.title);
    }
    // 3. Deezer
    if (!result) {
      result = await searchDeezer(req.creator || req.title);
    }
  }

  // Final fallback — never a broken image
  if (!result) {
    result = makePlaceholder(req.title, mt);
  }

  toCache(cacheKey, result);
  return result;
}

/**
 * Batch resolve artwork for multiple items in parallel (with concurrency cap).
 */
export async function resolveArtworkBatch(
  requests: ArtworkRequest[],
  concurrency = 4
): Promise<Map<string, ArtworkResult>> {
  const results = new Map<string, ArtworkResult>();
  // Process in chunks
  for (let i = 0; i < requests.length; i += concurrency) {
    const chunk = requests.slice(i, i + concurrency);
    const resolved = await Promise.all(chunk.map(r => resolveArtwork(r)));
    chunk.forEach((req, j) => results.set(req.entityId, resolved[j]));
  }
  return results;
}
