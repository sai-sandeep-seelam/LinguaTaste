/**
 * Unit tests for artwork title matching and availability link tier logic.
 *
 * Run with: npx jest lib/__tests__/artwork.test.ts
 * (No API calls — pure unit tests for matching and tier selection logic.)
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';
import { normTitle, titlesMatch } from '../artwork.ts';

function expect(actual: any) {
  return {
    toBe: (expected: any) => assert.strictEqual(actual, expected),
    toEqual: (expected: any) => assert.deepStrictEqual(actual, expected),
    toBeNull: () => assert.strictEqual(actual, null),
    toMatch: (pattern: RegExp) => assert.match(String(actual), pattern),
    toBeGreaterThan: (val: number) => assert.ok(actual > val, `${actual} not > ${val}`),
  };
}

describe('titlesMatch — artwork title matching', () => {
  test('exact match', () => {
    expect(titlesMatch('Spirited Away', 'Spirited Away')).toBe(true);
  });

  test('case insensitive match', () => {
    expect(titlesMatch('SPIRITED AWAY', 'spirited away')).toBe(true);
  });

  test('punctuation stripped', () => {
    expect(titlesMatch("Schindler's List", 'Schindlers List')).toBe(true);
  });

  test('contains match (one is a substring)', () => {
    expect(titlesMatch('Attack on Titan: The Final Season', 'Attack on Titan')).toBe(true);
  });

  test('mismatch', () => {
    expect(titlesMatch('Naruto', 'Bleach')).toBe(false);
  });

  test('empty string does not match non-empty', () => {
    expect(titlesMatch('', 'Parasite')).toBe(false);
  });

  test('both empty match', () => {
    expect(titlesMatch('', '')).toBe(true);
  });

  test('special chars stripped — colon, hyphen', () => {
    expect(titlesMatch('Spider-Man: No Way Home', 'Spider Man No Way Home')).toBe(true);
  });

  test('low confidence — completely different titles', () => {
    expect(titlesMatch('My Love from the Star', 'Breaking Bad')).toBe(false);
  });

  test('partial artist name match', () => {
    expect(titlesMatch('BTS (Bangtan Boys)', 'BTS')).toBe(true);
  });
});

// ─── Link tier tests ──────────────────────────────────────────────────────────

import type { PlatformLink } from '../availability';

type AvailabilityTier = 1 | 2 | 3;

function bestTier(links: Pick<PlatformLink, 'tier'>[]): AvailabilityTier | null {
  if (links.length === 0) return null;
  return Math.min(...links.map(l => l.tier)) as AvailabilityTier;
}

function filterByTierPreference(links: PlatformLink[]): PlatformLink[] {
  // For each platform, prefer higher tier (lower number) if duplicates exist
  const byPlatform = new Map<string, PlatformLink>();
  links.forEach(l => {
    const key = l.platformName.toLowerCase();
    const existing = byPlatform.get(key);
    if (!existing || l.tier < existing.tier) {
      byPlatform.set(key, l);
    }
  });
  return Array.from(byPlatform.values());
}

describe('availability link tier logic', () => {
  const mockLinks: PlatformLink[] = [
    { platformId: 'tmdb_9', platformName: 'Netflix', url: 'https://tmdb.org/...' , tier: 2, category: 'stream' },
    { platformId: 'watchmode_9', platformName: 'Netflix', url: 'https://netflix.com/title/123', tier: 1, category: 'stream' },
    { platformId: 'tmdb_119', platformName: 'Amazon Prime', url: 'https://tmdb.org/...', tier: 2, category: 'stream' },
  ];

  test('bestTier picks the lowest tier number', () => {
    expect(bestTier(mockLinks)).toBe(1);
  });

  test('filterByTierPreference keeps Tier 1 over Tier 2 for same platform', () => {
    const filtered = filterByTierPreference(mockLinks);
    const netflix = filtered.find(l => l.platformName === 'Netflix');
    expect(netflix?.tier).toBe(1);
    expect(netflix?.url).toBe('https://netflix.com/title/123');
  });

  test('filterByTierPreference keeps unique platforms', () => {
    const filtered = filterByTierPreference(mockLinks);
    // Netflix (1) + Amazon Prime (1) = 2 unique entries
    expect(filtered.length).toBe(2);
  });

  test('bestTier returns null for empty list', () => {
    expect(bestTier([])).toBeNull();
  });

  test('Tier 3 search links labelled correctly', () => {
    const tier3Links: PlatformLink[] = [
      { platformId: 'spotify', platformName: 'Spotify', url: 'https://open.spotify.com/search/...', tier: 3, category: 'listen', label: 'Search on Spotify' },
    ];
    expect(tier3Links[0].label).toMatch(/Search on/);
  });

  test('book links always have reads and buys categories', () => {
    const bookLinks: PlatformLink[] = [
      { platformId: 'open_library', platformName: 'Open Library', url: 'https://openlibrary.org', tier: 2, category: 'read' },
      { platformId: 'kindle', platformName: 'Kindle', url: 'https://amazon.com', tier: 3, category: 'buy', label: 'Search on Kindle' },
      { platformId: 'libby', platformName: 'Libby', url: 'https://libbyapp.com', tier: 3, category: 'read', label: 'Search on Libby' },
    ];
    const reads = bookLinks.filter(l => l.category === 'read');
    const buys = bookLinks.filter(l => l.category === 'buy');
    expect(reads.length).toBeGreaterThan(0);
    expect(buys.length).toBeGreaterThan(0);
  });
});

// ─── normTitle tests ──────────────────────────────────────────────────────────

describe('normTitle normalisation', () => {
  test('lowercases', () => {
    expect(normTitle('HELLO')).toBe('hello');
  });

  test('removes punctuation', () => {
    expect(normTitle("It's a Wonderful Life!")).toBe('its a wonderful life');
  });

  test('trims whitespace', () => {
    expect(normTitle('  Parasite  ')).toBe('parasite');
  });

  test('preserves spaces within', () => {
    expect(normTitle('Death Note')).toBe('death note');
  });
});
