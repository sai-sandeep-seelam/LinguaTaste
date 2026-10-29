/**
 * Music Metadata Provider
 * Resolves artist top tracks, release information, and 30-second audio previews
 * using iTunes Search and Deezer APIs (no API key required).
 * 
 * Rules:
 *  - Do not autoplay audio.
 *  - Cache track lookups to avoid rate limits.
 *  - Retain authentic track titles and release years.
 */

import type { MusicTrackItem } from './types.ts';
import { titlesMatch } from './artwork.ts';

const trackCache = new Map<string, { tracks: MusicTrackItem[]; expiry: number }>();
const TRACK_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function resolveArtistTopTracks(
  artistName: string,
  limit = 3
): Promise<MusicTrackItem[]> {
  const cleanName = artistName.trim();
  if (!cleanName) return [];

  const cacheKey = `tracks:${cleanName.toLowerCase()}:${limit}`;
  const cached = trackCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.tracks;
  }

  // 1. Try iTunes Search API (entity=song)
  try {
    const params = new URLSearchParams({
      term: cleanName,
      entity: 'song',
      limit: String(limit * 2), // fetch extra to filter for artist match
    });

    const res = await fetch(`https://itunes.apple.com/search?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json() as {
        results?: Array<{
          trackId?: number;
          trackName?: string;
          artistName?: string;
          previewUrl?: string;
          trackTimeMillis?: number;
          releaseDate?: string;
          collectionName?: string;
        }>;
      };

      const results = (data.results || []).filter(r =>
        r.trackName && (titlesMatch(r.artistName || '', cleanName) || !cleanName)
      );

      if (results.length > 0) {
        const tracks: MusicTrackItem[] = results.slice(0, limit).map(r => ({
          id: r.trackId ? String(r.trackId) : undefined,
          title: r.trackName || '',
          artistName: r.artistName || cleanName,
          previewUrl: r.previewUrl,
          durationSeconds: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : undefined,
          releaseYear: r.releaseDate ? parseInt(r.releaseDate.slice(0, 4), 10) : undefined,
          albumTitle: r.collectionName,
        }));

        trackCache.set(cacheKey, { tracks, expiry: Date.now() + TRACK_CACHE_TTL_MS });
        return tracks;
      }
    }
  } catch (err) {
    console.warn(`[Music Tracks: iTunes error for ${cleanName}]:`, err);
  }

  // 2. Fallback to Deezer API
  try {
    const res = await fetch(
      `https://api.deezer.com/search/track?q=${encodeURIComponent(cleanName)}&limit=${limit * 2}`
    );
    if (res.ok) {
      const data = await res.json() as {
        data?: Array<{
          id?: number;
          title?: string;
          preview?: string;
          duration?: number;
          artist?: { name?: string };
          album?: { title?: string };
        }>;
      };

      const results = (data.data || []).filter(r =>
        r.title && (titlesMatch(r.artist?.name || '', cleanName) || !cleanName)
      );

      if (results.length > 0) {
        const tracks: MusicTrackItem[] = results.slice(0, limit).map(r => ({
          id: r.id ? String(r.id) : undefined,
          title: r.title || '',
          artistName: r.artist?.name || cleanName,
          previewUrl: r.preview,
          durationSeconds: r.duration,
          albumTitle: r.album?.title,
        }));

        trackCache.set(cacheKey, { tracks, expiry: Date.now() + TRACK_CACHE_TTL_MS });
        return tracks;
      }
    }
  } catch (err) {
    console.warn(`[Music Tracks: Deezer error for ${cleanName}]:`, err);
  }

  // Fallback default tracks for well-known K-Pop and J-Pop artists if offline
  const fallbackPresets: Record<string, MusicTrackItem[]> = {
    twice: [
      { title: 'Feel Special', artistName: 'TWICE', releaseYear: 2019, durationSeconds: 207 },
      { title: 'I CAN\'T STOP ME', artistName: 'TWICE', releaseYear: 2020, durationSeconds: 205 },
      { title: 'Fancy', artistName: 'TWICE', releaseYear: 2019, durationSeconds: 215 },
    ],
    bts: [
      { title: 'Spring Day', artistName: 'BTS', releaseYear: 2017, durationSeconds: 274 },
      { title: 'Blood Sweat & Tears', artistName: 'BTS', releaseYear: 2016, durationSeconds: 217 },
      { title: 'Dynamite', artistName: 'BTS', releaseYear: 2020, durationSeconds: 199 },
    ],
    blackpink: [
      { title: 'How You Like That', artistName: 'BLACKPINK', releaseYear: 2020, durationSeconds: 182 },
      { title: 'Lovesick Girls', artistName: 'BLACKPINK', releaseYear: 2020, durationSeconds: 192 },
      { title: 'DDU-DU DDU-DU', artistName: 'BLACKPINK', releaseYear: 2018, durationSeconds: 209 },
    ],
    itzy: [
      { title: 'WANNABE', artistName: 'ITZY', releaseYear: 2020, durationSeconds: 191 },
      { title: 'LOCO', artistName: 'ITZY', releaseYear: 2021, durationSeconds: 191 },
    ],
    toe: [
      { title: 'Goodbye', artistName: 'toe', releaseYear: 2009, durationSeconds: 254 },
      { title: 'Two Moons', artistName: 'toe', releaseYear: 2012, durationSeconds: 248 },
    ],
  };

  const norm = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const matched = Object.entries(fallbackPresets).find(([k]) => norm.includes(k));
  if (matched) {
    return matched[1];
  }

  return [];
}
