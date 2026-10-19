// Qloo API client with caching and error handling
// Base URL confirmed from hackathon docs

const QLOO_BASE_URL = 'https://hackathon.api.qloo.com';

// Entity types supported by Qloo
export const ENTITY_TYPES = {
  movie: 'urn:entity:movie',
  tv: 'urn:entity:tv_show',
  music: 'urn:entity:artist',
  book: 'urn:entity:book',
  podcast: 'urn:entity:podcast',
  videogame: 'urn:entity:videogame',
  restaurant: 'urn:entity:restaurant',
  brand: 'urn:entity:brand',
} as const;

export type EntityType = keyof typeof ENTITY_TYPES;

// Language -> country of origin mapping for filtering
export const LANGUAGE_COUNTRIES: Record<string, { countries: string[]; name: string; flag: string }> = {
  japanese: { countries: ['JP'], name: 'Japanese', flag: '🇯🇵' },
  spanish: { countries: ['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE'], name: 'Spanish', flag: '🇪🇸' },
  french: { countries: ['FR', 'BE', 'CH', 'CA'], name: 'French', flag: '🇫🇷' },
  korean: { countries: ['KR'], name: 'Korean', flag: '🇰🇷' },
  mandarin: { countries: ['CN', 'TW', 'HK'], name: 'Mandarin', flag: '🇨🇳' },
  german: { countries: ['DE', 'AT', 'CH'], name: 'German', flag: '🇩🇪' },
  italian: { countries: ['IT'], name: 'Italian', flag: '🇮🇹' },
  portuguese: { countries: ['BR', 'PT'], name: 'Portuguese', flag: '🇧🇷' },
};

export interface QlooEntity {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  properties?: Record<string, unknown>;
  images?: Array<{ url: string; width?: number; height?: number }>;
  external_ids?: Record<string, string>;
}

export interface QlooInsightResult {
  entity: QlooEntity;
  affinity?: number;
  popularity?: number;
  tags?: Array<{ id: string; name: string; affinity?: number }>;
}

export interface QlooSearchResult {
  entities: QlooEntity[];
  total?: number;
}

export interface QlooInsightsResponse {
  results: QlooInsightResult[];
  total?: number;
  tags?: Array<{ id: string; name: string; affinity?: number }>;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(endpoint: string, params: Record<string, unknown>): string {
  return `${endpoint}:${JSON.stringify(params)}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

async function qlooFetch<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | string[]> = {},
  options: { bypassCache?: boolean } = {}
): Promise<T> {
  const apiKey = process.env.QLOO_API_KEY;
  if (!apiKey) {
    throw new Error('QLOO_API_KEY environment variable is not set');
  }

  const cacheKey = getCacheKey(endpoint, params);
  if (!options.bypassCache) {
    const cached = getFromCache<T>(cacheKey);
    if (cached !== null) return cached;
  }

  // Build query string
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      searchParams.set(key, value.join(','));
    } else {
      searchParams.set(key, String(value));
    }
  }

  const url = `${QLOO_BASE_URL}${endpoint}?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Qloo API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as T;
  setCache(cacheKey, data);
  return data;
}

/**
 * Search for entities by name query
 * Endpoint: GET /search
 */
export async function searchEntities(
  query: string,
  types?: string[],
  limit = 10
): Promise<QlooSearchResult> {
  const params: Record<string, string | number | string[]> = {
    query,
    take: limit,
  };
  if (types && types.length > 0) {
    params['filter.type'] = types;
  }

  const result = await qlooFetch<{ results?: QlooEntity[]; entities?: QlooEntity[] }>(
    '/search',
    params
  );

  // Normalize response shape
  const entities = result.results || result.entities || [];
  return { entities };
}

/**
 * Get taste-driven recommendations via Insights API
 * Endpoint: GET /v2/insights
 */
export async function getInsights(options: {
  entityIds: string[];
  filterType: string;
  filterCountries?: string[];
  limit?: number;
  explainability?: boolean;
}): Promise<QlooInsightsResponse> {
  const { entityIds, filterType, filterCountries, limit = 20, explainability = true } = options;

  const params: Record<string, string | number | boolean | string[]> = {
    'filter.type': filterType,
    'signal.interests.entities': entityIds,
    take: limit,
  };

  if (filterCountries && filterCountries.length > 0) {
    params['filter.release_country'] = filterCountries;
  }

  if (explainability) {
    params['feature.explainability'] = true;
  }

  const result = await qlooFetch<{
    results?: QlooInsightResult[];
    entities?: QlooInsightResult[];
    tags?: Array<{ id: string; name: string; affinity?: number }>;
  }>('/v2/insights', params);

  return {
    results: result.results || result.entities || [],
    tags: result.tags,
  };
}

/**
 * Get taste profile tags from a set of entity IDs
 * Uses the insights endpoint with explainability to surface top taste signals
 */
export async function getTasteProfile(entityIds: string[]): Promise<{
  topTags: Array<{ id: string; name: string; affinity: number }>;
  summary: string;
}> {
  // Get taste tags by calling insights with a broad entity type
  const result = await qlooFetch<{
    results?: Array<{ entity: QlooEntity; affinity?: number; tags?: Array<{ id: string; name: string; affinity?: number }> }>;
    tags?: Array<{ id: string; name: string; affinity?: number }>;
  }>('/v2/insights', {
    'filter.type': ENTITY_TYPES.movie, // use movie as base to get cross-domain tags
    'signal.interests.entities': entityIds,
    'feature.explainability': true,
    take: 5,
  });

  // Collect tags from results
  const tagMap = new Map<string, { id: string; name: string; totalAffinity: number; count: number }>();

  if (result.tags) {
    for (const tag of result.tags) {
      const aff = tag.affinity || 0;
      const existing = tagMap.get(tag.id);
      if (existing) {
        existing.totalAffinity += aff;
        existing.count++;
      } else {
        tagMap.set(tag.id, { id: tag.id, name: tag.name, totalAffinity: aff, count: 1 });
      }
    }
  }

  if (result.results) {
    for (const r of result.results) {
      if (r.tags) {
        for (const tag of r.tags) {
          const aff = tag.affinity || 0;
          const existing = tagMap.get(tag.id);
          if (existing) {
            existing.totalAffinity += aff;
            existing.count++;
          } else {
            tagMap.set(tag.id, { id: tag.id, name: tag.name, totalAffinity: aff, count: 1 });
          }
        }
      }
    }
  }

  const topTags = Array.from(tagMap.values())
    .map(t => ({ id: t.id, name: t.name, affinity: t.totalAffinity / (t.count || 1) }))
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, 15);

  const summary = topTags.length > 0
    ? `Your taste profile: ${topTags.slice(0, 5).map(t => t.name).join(', ')}`
    : 'Building taste profile...';

  return { topTags, summary };
}

/**
 * Get entity details by IDs
 */
export async function getEntitiesById(ids: string[]): Promise<QlooEntity[]> {
  const result = await qlooFetch<{ results?: QlooEntity[]; entities?: QlooEntity[] }>(
    '/entities',
    { ids: ids.join(',') }
  );
  return result.results || result.entities || [];
}
