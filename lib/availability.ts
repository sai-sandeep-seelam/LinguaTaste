/**
 * Availability service — returns per-item, per-country streaming/reading/listening links.
 *
 * Tier hierarchy (tracked per link):
 *   Tier 1 : direct deep link to exact title on the platform
 *   Tier 2 : aggregator page (TMDB/JustWatch link) — confirmed available in country
 *   Tier 3 : platform search URL pre-filled with title (books & music only; labelled "Search on ___")
 *
 * Film / TV
 *   Primary: TMDB /watch/providers (GET /3/movie/{id}/watch/providers or /3/tv/{id}/watch/providers)
 *     Response key: results.{COUNTRY}.{flatrate,rent,buy}[]{logo_path,provider_id,provider_name,link}
 *     link is the JustWatch page on themoviedb.org (Tier 2)
 *   Optional Tier 1 upgrades: Watchmode API or Streaming Availability API (if keys present)
 *
 * Books
 *   Open Library: https://openlibrary.org/search?q={title}+{author}
 *   Amazon/Kindle: https://www.amazon.com/s?k={title}+{author}&i=digital-text
 *   Bookshop.org:  https://bookshop.org/search?keywords={title}+{author}
 *   Libby:         https://libbyapp.com/search/borrow/search-type-keyword/page-1/{title}
 *
 * Music
 *   Spotify: track/artist search link (Tier 3 unless Spotify key provided for Tier 1)
 *   Apple Music: https://music.apple.com/search?term={q}
 *   YouTube Music: https://music.youtube.com/search?q={q}
 *   Deezer: from Deezer API result (Tier 1 artist URL)
 */

import type { MediaType } from './types';

// ─── Public types ─────────────────────────────────────────────────────────────

export type AvailabilityTier = 1 | 2 | 3;

export interface PlatformLink {
  platformId: string;          // e.g. 'netflix', 'spotify', 'open_library'
  platformName: string;
  logoPath?: string;           // TMDB logo_path (/abc.jpg) or local icon key
  url: string;
  tier: AvailabilityTier;
  category: 'stream' | 'rent' | 'buy' | 'read' | 'listen' | 'search';
  label?: string;              // shown label, e.g. "Search on Spotify"
}

export interface AvailabilityResult {
  entityId: string;
  country: string;             // ISO 3166-1 alpha-2
  streams: PlatformLink[];
  rents: PlatformLink[];
  buys: PlatformLink[];
  reads: PlatformLink[];       // books
  listens: PlatformLink[];     // music
  hasData: boolean;
  fetchedAt: string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry {
  result: AvailabilityResult;
  expiry: number;
}

const availabilityCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function fromCache(key: string): AvailabilityResult | null {
  const entry = availabilityCache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.result;
  availabilityCache.delete(key);
  return null;
}

function toCache(key: string, result: AvailabilityResult): void {
  availabilityCache.set(key, { result, expiry: Date.now() + CACHE_TTL_MS });
}

// ─── TMDB watch providers ─────────────────────────────────────────────────────

interface TmdbProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

interface TmdbCountryProviders {
  link: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
}

async function fetchTmdbProviders(
  tmdbId: string,
  mediaType: 'movie' | 'tv',
  country: string
): Promise<TmdbCountryProviders | null> {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) return null;

  const endpoint = mediaType === 'movie'
    ? `/3/movie/${tmdbId}/watch/providers`
    : `/3/tv/${tmdbId}/watch/providers`;

  try {
    const res = await fetch(`https://api.themoviedb.org${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;

    const data = await res.json() as { results?: Record<string, TmdbCountryProviders> };
    return data.results?.[country] ?? null;
  } catch {
    return null;
  }
}

/** Convert a TMDB provider entry to a PlatformLink (always Tier 2 — JustWatch page) */
function tmdbProviderToLink(
  p: TmdbProvider,
  justWatchLink: string,
  category: PlatformLink['category']
): PlatformLink {
  return {
    platformId: `tmdb_${p.provider_id}`,
    platformName: p.provider_name,
    logoPath: p.logo_path,
    url: justWatchLink,
    tier: 2,
    category,
  };
}

// ─── Watchmode (optional Tier 1) ──────────────────────────────────────────────

async function fetchWatchmodeLinks(
  title: string,
  mediaType: 'movie' | 'tv',
  country: string
): Promise<PlatformLink[]> {
  const key = process.env.WATCHMODE_API_KEY;
  if (!key) return [];

  try {
    // 1. Search for the title
    const searchRes = await fetch(
      `https://api.watchmode.com/v1/search/?apiKey=${key}&search_field=name&search_value=${encodeURIComponent(title)}&types=${mediaType === 'movie' ? 'movie' : 'tv_movie,tv_series'}`
    );
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json() as {
      title_results?: Array<{ id: number; name: string; type: string }>;
    };

    const match = searchData.title_results?.[0];
    if (!match) return [];

    // 2. Get sources for that title
    const sourcesRes = await fetch(
      `https://api.watchmode.com/v1/title/${match.id}/sources/?apiKey=${key}&regions=${country}`
    );
    if (!sourcesRes.ok) return [];

    const sources = await sourcesRes.json() as Array<{
      source_id: number;
      name: string;
      type: 'sub' | 'rent' | 'buy' | 'free';
      region: string;
      ios_url?: string;
      web_url?: string;
    }>;

    return sources
      .filter(s => s.region.toUpperCase() === country.toUpperCase() && (s.web_url || s.ios_url))
      .map(s => ({
        platformId: `watchmode_${s.source_id}`,
        platformName: s.name,
        url: (s.web_url || s.ios_url)!,
        tier: 1 as AvailabilityTier,
        category: (
          s.type === 'sub' ? 'stream'
          : s.type === 'rent' ? 'rent'
          : s.type === 'buy' ? 'buy'
          : 'stream'
        ) as PlatformLink['category'],
      }));
  } catch {
    return [];
  }
}

// ─── Book links (always Tier 3 except Open Library which is Tier 2) ───────────

function buildBookLinks(
  title: string,
  author?: string,
  isbn?: string
): PlatformLink[] {
  const q = [title, author].filter(Boolean).join(' ');
  const qEnc = encodeURIComponent(q);

  const links: PlatformLink[] = [
    {
      platformId: 'open_library',
      platformName: 'Open Library',
      logoPath: 'open_library',
      url: `https://openlibrary.org/search?q=${qEnc}`,
      tier: 2,
      category: 'read',
    },
    {
      platformId: 'kindle',
      platformName: 'Kindle',
      logoPath: 'kindle',
      url: isbn
        ? `https://www.amazon.com/dp/${isbn}`
        : `https://www.amazon.com/s?k=${qEnc}&i=digital-text`,
      tier: isbn ? 2 : 3,
      category: 'buy',
      label: isbn ? undefined : 'Search on Kindle',
    },
    {
      platformId: 'bookshop',
      platformName: 'Bookshop.org',
      logoPath: 'bookshop',
      url: `https://bookshop.org/search?keywords=${qEnc}`,
      tier: 3,
      category: 'buy',
      label: 'Search on Bookshop.org',
    },
    {
      platformId: 'libby',
      platformName: 'Libby',
      logoPath: 'libby',
      url: `https://libbyapp.com/search/borrow/search-type-keyword/page-1/${encodeURIComponent(title)}`,
      tier: 3,
      category: 'read',
      label: 'Search on Libby',
    },
  ];

  return links;
}

// ─── Music links ──────────────────────────────────────────────────────────────

async function buildMusicLinks(
  title: string,
  artist?: string,
  country = 'US'
): Promise<PlatformLink[]> {
  const q = [artist || title].filter(Boolean).join(' ');
  const qEnc = encodeURIComponent(q);
  const links: PlatformLink[] = [];

  // Deezer — can give us a Tier 1 artist URL
  try {
    const dRes = await fetch(`https://api.deezer.com/search/artist?q=${qEnc}&limit=3`);
    if (dRes.ok) {
      const dData = await dRes.json() as { data?: Array<{ name?: string; link?: string }> };
      const dMatch = dData.data?.find(d =>
        (d.name || '').toLowerCase().includes((artist || title).toLowerCase())
      ) || dData.data?.[0];
      if (dMatch?.link) {
        links.push({
          platformId: 'deezer',
          platformName: 'Deezer',
          logoPath: 'deezer',
          url: dMatch.link,
          tier: 1,
          category: 'listen',
        });
      }
    }
  } catch { /* ignore */ }

  // iTunes / Apple Music (Tier 3 search unless we find a direct URL)
  try {
    const iRes = await fetch(
      `https://itunes.apple.com/search?term=${qEnc}&entity=musicArtist&country=${country}&limit=3`
    );
    if (iRes.ok) {
      const iData = await iRes.json() as {
        results?: Array<{ artistName?: string; artistLinkUrl?: string }>;
      };
      const iMatch = iData.results?.find(r =>
        (r.artistName || '').toLowerCase().includes((artist || title).toLowerCase())
      ) || iData.results?.[0];
      if (iMatch?.artistLinkUrl) {
        // artistLinkUrl is the Apple Music artist page (Tier 1)
        links.push({
          platformId: 'apple_music',
          platformName: 'Apple Music',
          logoPath: 'apple_music',
          url: iMatch.artistLinkUrl,
          tier: 1,
          category: 'listen',
        });
      }
    }
  } catch { /* ignore */ }

  // Spotify (always Tier 3 search unless SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET provided)
  const spotifyToken = process.env.SPOTIFY_CLIENT_ID;
  if (spotifyToken) {
    // With credentials we can get Tier 1 artist URL via search API
    try {
      const accessTokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
      if (accessTokenRes.ok) {
        const { access_token } = await accessTokenRes.json() as { access_token: string };
        const searchRes = await fetch(
          `https://api.spotify.com/v1/search?q=${qEnc}&type=artist&limit=3`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        if (searchRes.ok) {
          const sData = await searchRes.json() as {
            artists?: { items?: Array<{ name?: string; external_urls?: { spotify?: string } }> };
          };
          const sMatch = sData.artists?.items?.find(a =>
            (a.name || '').toLowerCase().includes((artist || title).toLowerCase())
          ) || sData.artists?.items?.[0];
          if (sMatch?.external_urls?.spotify) {
            links.push({
              platformId: 'spotify',
              platformName: 'Spotify',
              logoPath: 'spotify',
              url: sMatch.external_urls.spotify,
              tier: 1,
              category: 'listen',
            });
          }
        }
      }
    } catch { /* fallthrough to Tier 3 */ }
  }

  // Spotify fallback Tier 3 (if not already added as Tier 1)
  if (!links.find(l => l.platformId === 'spotify')) {
    links.push({
      platformId: 'spotify',
      platformName: 'Spotify',
      logoPath: 'spotify',
      url: `https://open.spotify.com/search/${qEnc}`,
      tier: 3,
      category: 'listen',
      label: 'Search on Spotify',
    });
  }

  // YouTube Music (Tier 3)
  links.push({
    platformId: 'youtube_music',
    platformName: 'YouTube Music',
    logoPath: 'youtube_music',
    url: `https://music.youtube.com/search?q=${qEnc}`,
    tier: 3,
    category: 'listen',
    label: 'Search on YouTube Music',
  });

  return links;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export interface AvailabilityRequest {
  entityId: string;
  title: string;
  mediaType: MediaType;
  creator?: string;
  country: string;          // ISO 3166-1 alpha-2
  externalTmdbId?: string;
  isbn?: string;
}

/**
 * Resolve availability for a single item in a given country.
 */
export async function resolveAvailability(
  req: AvailabilityRequest
): Promise<AvailabilityResult> {
  const cacheKey = `${req.entityId}:${req.country}`;
  const cached = fromCache(cacheKey);
  if (cached) return cached;

  const empty: AvailabilityResult = {
    entityId: req.entityId,
    country: req.country,
    streams: [],
    rents: [],
    buys: [],
    reads: [],
    listens: [],
    hasData: false,
    fetchedAt: new Date().toISOString(),
  };

  const mt = req.mediaType;

  if (mt === 'movie' || mt === 'tv') {
    // Try to find TMDB ID (from external IDs or a fresh search)
    let tmdbId = req.externalTmdbId;

    if (!tmdbId && process.env.TMDB_API_READ_ACCESS_TOKEN) {
      // Search TMDB by title to get ID
      const endpoint = mt === 'movie' ? '/3/search/movie' : '/3/search/tv';
      try {
        const res = await fetch(
          `https://api.themoviedb.org${endpoint}?query=${encodeURIComponent(req.title)}&language=en-US`,
          { headers: { Authorization: `Bearer ${process.env.TMDB_API_READ_ACCESS_TOKEN}` } }
        );
        if (res.ok) {
          const data = await res.json() as { results?: Array<{ id: number; title?: string; name?: string }> };
          const match = data.results?.find(r =>
            (r.title || r.name || '').toLowerCase().includes(req.title.toLowerCase())
          ) || data.results?.[0];
          if (match) tmdbId = String(match.id);
        }
      } catch { /* ignore */ }
    }

    if (tmdbId) {
      const providers = await fetchTmdbProviders(tmdbId, mt, req.country);
      if (providers) {
        const justWatchLink = providers.link;
        (providers.flatrate || []).forEach(p =>
          empty.streams.push(tmdbProviderToLink(p, justWatchLink, 'stream'))
        );
        (providers.rent || []).forEach(p =>
          empty.rents.push(tmdbProviderToLink(p, justWatchLink, 'rent'))
        );
        (providers.buy || []).forEach(p =>
          empty.buys.push(tmdbProviderToLink(p, justWatchLink, 'buy'))
        );
        empty.hasData = true;
      }
    }

    // Optional Tier 1 upgrade via Watchmode
    if (process.env.WATCHMODE_API_KEY) {
      const watchmodeLinks = await fetchWatchmodeLinks(req.title, mt, req.country);
      // Merge: replace Tier 2 entries with Tier 1 where platform matches
      watchmodeLinks.forEach(wl => {
        // Check if we already have a Tier 2 entry for the same platform name
        const replaceIn = (arr: PlatformLink[]) => {
          const idx = arr.findIndex(
            l => l.platformName.toLowerCase() === wl.platformName.toLowerCase()
          );
          if (idx >= 0) arr[idx] = wl;
          else arr.push(wl);
        };
        if (wl.category === 'stream') replaceIn(empty.streams);
        else if (wl.category === 'rent') replaceIn(empty.rents);
        else if (wl.category === 'buy') replaceIn(empty.buys);
      });
      if (watchmodeLinks.length > 0) empty.hasData = true;
    }
  } else if (mt === 'book') {
    const bookLinks = buildBookLinks(req.title, req.creator, req.isbn);
    bookLinks.forEach(l => {
      if (l.category === 'read') empty.reads.push(l);
      else empty.buys.push(l);
    });
    empty.hasData = true;
  } else if (mt === 'music') {
    const musicLinks = await buildMusicLinks(req.title, req.creator, req.country);
    empty.listens.push(...musicLinks);
    empty.hasData = musicLinks.length > 0;
  }

  toCache(cacheKey, empty);
  return empty;
}

/**
 * Batch resolve availability for multiple items (with concurrency cap).
 */
export async function resolveAvailabilityBatch(
  requests: AvailabilityRequest[],
  concurrency = 4
): Promise<Map<string, AvailabilityResult>> {
  const results = new Map<string, AvailabilityResult>();
  for (let i = 0; i < requests.length; i += concurrency) {
    const chunk = requests.slice(i, i + concurrency);
    const resolved = await Promise.all(chunk.map(r => resolveAvailability(r)));
    chunk.forEach((req, j) => results.set(req.entityId, resolved[j]));
  }
  return results;
}
