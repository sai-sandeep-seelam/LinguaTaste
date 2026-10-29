// Qloo API client with live/cache/simulation tracking, schema validation, and error isolation
// Official documentation: https://github.com/qloo/docs-public

// Entity types supported by Qloo URN taxonomy
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

// Country ISO alpha-2 code to official full English name accepted by Qloo release_country filter
export const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  KR: 'South Korea',
  JP: 'Japan',
  ES: 'Spain',
  MX: 'Mexico',
  AR: 'Argentina',
  CO: 'Colombia',
  CL: 'Chile',
  PE: 'Peru',
  VE: 'Venezuela',
  FR: 'France',
  BE: 'Belgium',
  CH: 'Switzerland',
  CA: 'Canada',
  CN: 'China',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  DE: 'Germany',
  AT: 'Austria',
  IT: 'Italy',
  BR: 'Brazil',
  PT: 'Portugal',
  US: 'United States',
  GB: 'United Kingdom',
};

// Language -> country of origin mapping for cultural filtering
export const LANGUAGE_COUNTRIES: Record<string, {
  countries: string[];
  countryNames: string[];
  name: string;
  flag: string;
}> = {
  japanese: { countries: ['JP'], countryNames: ['Japan'], name: 'Japanese', flag: '🇯🇵' },
  spanish: { countries: ['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE'], countryNames: ['Spain', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Venezuela'], name: 'Spanish', flag: '🇪🇸' },
  french: { countries: ['FR', 'BE', 'CH', 'CA'], countryNames: ['France', 'Belgium', 'Switzerland', 'Canada'], name: 'French', flag: '🇫🇷' },
  korean: { countries: ['KR'], countryNames: ['South Korea'], name: 'Korean', flag: '🇰🇷' },
  mandarin: { countries: ['CN', 'TW', 'HK'], countryNames: ['China', 'Taiwan', 'Hong Kong'], name: 'Mandarin', flag: '🇨🇳' },
  german: { countries: ['DE', 'AT', 'CH'], countryNames: ['Germany', 'Austria', 'Switzerland'], name: 'German', flag: '🇩🇪' },
  italian: { countries: ['IT'], countryNames: ['Italy'], name: 'Italian', flag: '🇮🇹' },
  portuguese: { countries: ['BR', 'PT'], countryNames: ['Brazil', 'Portugal'], name: 'Portuguese', flag: '🇧🇷' },
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
  explainability?: Record<string, unknown>;
  tags?: Array<{ id: string; name: string; affinity?: number }>;
}

export interface QlooSearchResult {
  entities: QlooEntity[];
  total?: number;
  source: 'live' | 'cache' | 'simulated';
  statusCode?: number;
  error?: string;
}

export interface QlooInsightsResponse {
  results: QlooInsightResult[];
  total?: number;
  tags?: Array<{ id: string; name: string; affinity?: number }>;
  explainability?: Record<string, unknown>;
  source: 'live' | 'cache' | 'simulated';
  statusCode?: number;
  error?: string;
}

export interface QlooFetchResponse<T> {
  data: T;
  source: 'live' | 'cache' | 'simulated';
  statusCode?: number;
  error?: string;
}

// ─── Environment & Base URL Helpers ──────────────────────────────────────────

let runtimeApiKey: string | undefined = undefined;
let runtimeBaseUrl: string | undefined = undefined;

export function setRuntimeQlooConfig(key?: string, baseUrl?: string): void {
  if (key !== undefined) {
    const cleaned = key.trim().replace(/^["']|["']$/g, '');
    runtimeApiKey = cleaned.length > 0 ? cleaned : undefined;
  }
  if (baseUrl !== undefined) {
    const cleanedUrl = baseUrl.trim().replace(/\/+$/, '');
    runtimeBaseUrl = cleanedUrl.length > 0 ? cleanedUrl : undefined;
  }
}

export function getQlooApiKey(): string | undefined {
  if (runtimeApiKey) return runtimeApiKey;
  const raw = process.env.QLOO_API_KEY || process.env.QLOO_KEY;
  if (!raw) return undefined;
  const cleaned = raw.trim().replace(/^["']|["']$/g, '');
  if (cleaned.length === 0 || cleaned.includes('your_qloo_api_key') || cleaned === 'your_key_here') {
    return undefined;
  }
  return cleaned;
}

export function getQlooBaseUrl(): string {
  if (runtimeBaseUrl) return runtimeBaseUrl;
  const url = process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com';
  return url.trim().replace(/\/+$/, '');
}

export function clearQlooCache(): void {
  cache.clear();
}

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

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

// ─── Core HTTP Client ────────────────────────────────────────────────────────

async function qlooFetchEnvelope<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | string[]> = {},
  options: { bypassCache?: boolean } = {}
): Promise<QlooFetchResponse<T>> {
  const apiKey = getQlooApiKey();
  if (!apiKey) {
    return {
      data: getSimulatedQlooResponse<T>(endpoint, params),
      source: 'simulated',
      error: 'QLOO_API_KEY is not configured in local environment.',
    };
  }

  const cacheKey = getCacheKey(endpoint, params);
  if (!options.bypassCache) {
    const cached = getFromCache<T>(cacheKey);
    if (cached !== null) {
      return {
        data: cached,
        source: 'cache',
        statusCode: 200,
      };
    }
  }

  // Build query string cleanly
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      searchParams.set(key, value.join(','));
    } else {
      searchParams.set(key, String(value));
    }
  }

  const baseUrl = getQlooBaseUrl();
  const url = `${baseUrl}${endpoint}?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed?.error?.reason) {
          errorMsg = `${parsed.error.reason} (${parsed.error.message || response.status})`;
        } else if (parsed?.message) {
          errorMsg = parsed.message;
        }
      } catch {
        // use fallback status
      }

      console.warn(`[Qloo API Error] ${endpoint} returned ${response.status}: ${errorMsg}. Falling back to simulation.`);
      return {
        data: getSimulatedQlooResponse<T>(endpoint, params),
        source: 'simulated',
        statusCode: response.status,
        error: errorMsg,
      };
    }

    const data = await response.json() as T;
    setCache(cacheKey, data);
    return {
      data,
      source: 'live',
      statusCode: response.status,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error reaching Qloo API';
    console.warn(`[Qloo Network Failure] ${endpoint}: ${message}. Falling back to simulation.`);
    return {
      data: getSimulatedQlooResponse<T>(endpoint, params),
      source: 'simulated',
      error: message,
    };
  }
}

// ─── Simulated Taste Graph Fallback ──────────────────────────────────────────

function getSimulatedQlooResponse<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | string[]>
): T {
  if (endpoint === '/search') {
    const query = String(params.query || '').toLowerCase();
    const mockEntities: QlooEntity[] = [
      { id: 'ent_radiohead', name: 'Radiohead', type: 'urn:entity:artist', properties: { genre: 'Art Rock', origin: 'UK' } },
      { id: 'ent_deathnote', name: 'Death Note', type: 'urn:entity:tv_show', properties: { genre: 'Anime Thriller', origin: 'JP' } },
      { id: 'ent_nmh', name: 'Neutral Milk Hotel', type: 'urn:entity:artist', properties: { genre: 'Indie Folk', origin: 'US' } },
      { id: 'ent_aot', name: 'Attack on Titan', type: 'urn:entity:tv_show', properties: { genre: 'Dark Fantasy', origin: 'JP' } },
      { id: 'ent_spirited', name: 'Spirited Away', type: 'urn:entity:movie', properties: { genre: 'Anime', director: 'Hayao Miyazaki', origin: 'JP' } },
      { id: 'ent_kendrick', name: 'Kendrick Lamar', type: 'urn:entity:artist', properties: { genre: 'Conscious Hip-Hop', origin: 'US' } },
      { id: 'ent_serial', name: 'Serial (Podcast)', type: 'urn:entity:podcast', properties: { genre: 'True Crime', origin: 'US' } },
      { id: 'ent_bb', name: 'Breaking Bad', type: 'urn:entity:tv_show', properties: { genre: 'Crime Drama', origin: 'US' } },
      { id: 'ent_bts', name: 'BTS', type: 'urn:entity:artist', properties: { genre: 'K-Pop', origin: 'KR' } },
      { id: 'ent_parasite', name: 'Parasite', type: 'urn:entity:movie', properties: { genre: 'Black Comedy Thriller', director: 'Bong Joon-ho', origin: 'KR' } },
      { id: 'ent_squidgame', name: 'Squid Game', type: 'urn:entity:tv_show', properties: { genre: 'Survival Drama', origin: 'KR' } },
      { id: 'ent_amelie', name: 'Amélie', type: 'urn:entity:movie', properties: { genre: 'Romantic Comedy', origin: 'FR' } },
      { id: 'ent_camus', name: 'Albert Camus', type: 'urn:entity:artist', properties: { genre: 'Philosophy', origin: 'FR' } },
      { id: 'ent_godard', name: 'Jean-Luc Godard', type: 'urn:entity:artist', properties: { genre: 'Nouvelle Vague', origin: 'FR' } },
      { id: 'ent_toe', name: 'toe', type: 'urn:entity:artist', properties: { genre: 'Math Rock', origin: 'JP' } },
      { id: 'ent_lain', name: 'Serial Experiments Lain', type: 'urn:entity:tv_show', properties: { genre: 'Cyberpunk Anime', origin: 'JP' } },
      { id: 'ent_sakamoto', name: 'Shintaro Sakamoto', type: 'urn:entity:artist', properties: { genre: 'Psychedelic Pop', origin: 'JP' } },
    ];

    const matched = mockEntities.filter(e => 
      e.name.toLowerCase().includes(query) || query.includes(e.name.toLowerCase())
    );

    if (matched.length > 0) {
      return { results: matched, entities: matched } as unknown as T;
    }

    // Default synthetic entity matching query
    const fallback: QlooEntity = {
      id: `ent_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: String(params.query || 'Selected Seed'),
      type: 'urn:entity:movie',
    };
    return { results: [fallback], entities: [fallback] } as unknown as T;
  }

  // /v2/insights simulation — country & media type sensitive
  const filterType = String(params['filter.type'] || '');
  const rawCountries = String(params['filter.release_country'] || params['filterCountries'] || '').toLowerCase();

  const isKorea = rawCountries.includes('korea') || rawCountries.includes('kr');
  const isSpain = rawCountries.includes('spain') || rawCountries.includes('mexico') || rawCountries.includes('colombia') || rawCountries.includes('argentina') || rawCountries.includes('es');
  const isFrance = rawCountries.includes('france') || rawCountries.includes('fr') || rawCountries.includes('belgium');
  const isGermany = rawCountries.includes('germany') || rawCountries.includes('de');
  const isItaly = rawCountries.includes('italy') || rawCountries.includes('it');

  let mockInsights: any[] = [];

  if (filterType.includes(':artist')) {
    if (isKorea) {
      mockInsights = [
        {
          entity: { id: 'ent_bts_sim', name: 'BTS', type: 'urn:entity:artist', properties: { genre: 'K-Pop / Hip-Hop', country: 'South Korea', description: 'Global cultural phenomenon blending dynamic Korean lyricism with modern hip-hop production.' } },
          affinity: 0.95, popularity: 0.99, tags: [{ id: 't_kpop', name: 'K-Pop & Hip-Hop', affinity: 0.96 }]
        },
        {
          entity: { id: 'ent_hyukoh_sim', name: 'HYUKOH', type: 'urn:entity:artist', properties: { genre: 'Indie Rock', country: 'South Korea', description: 'Celebrated Korean indie rock band known for introspective poetry and rich guitar tones.' } },
          affinity: 0.92, popularity: 0.88, tags: [{ id: 't_kindie', name: 'Korean Indie Rock', affinity: 0.93 }]
        },
        {
          entity: { id: 'ent_dean_sim', name: 'DEAN', type: 'urn:entity:artist', properties: { genre: 'Alternative R&B', country: 'South Korea', description: 'Pioneering alternative R&B artist blending smooth vocal delivery with contemporary urban rhythms.' } },
          affinity: 0.90, popularity: 0.85, tags: [{ id: 't_krnb', name: 'Korean R&B', affinity: 0.91 }]
        }
      ];
    } else if (isSpain) {
      mockInsights = [
        {
          entity: { id: 'ent_canserbero_sim', name: 'Canserbero', type: 'urn:entity:artist', properties: { genre: 'Conscious Hip-Hop', country: 'Venezuela', description: 'Revered Latin American conscious rapper known for philosophical storytelling and clear diction.' } },
          affinity: 0.96, popularity: 0.92, tags: [{ id: 't_hiphop', name: 'Conscious Hip-Hop', affinity: 0.96 }]
        },
        {
          entity: { id: 'ent_rosalia_sim', name: 'Rosalía', type: 'urn:entity:artist', properties: { genre: 'Flamenco Pop / Art Pop', country: 'Spain', description: 'Innovative Catalan artist fusing centuries-old flamenco traditions with experimental urban pop.' } },
          affinity: 0.94, popularity: 0.97, tags: [{ id: 't_artpop', name: 'Avant-Pop & Flamenco', affinity: 0.94 }]
        },
        {
          entity: { id: 'ent_sodastereo_sim', name: 'Soda Stereo', type: 'urn:entity:artist', properties: { genre: 'Rock en Español / Post-Punk', country: 'Argentina', description: 'Legendary Argentine post-punk and alternative rock trio fronted by Gustavo Cerati.' } },
          affinity: 0.91, popularity: 0.89, tags: [{ id: 't_altrock', name: 'Rock en Español', affinity: 0.92 }]
        }
      ];
    } else if (isFrance) {
      mockInsights = [
        {
          entity: { id: 'ent_stromae_sim', name: 'Stromae', type: 'urn:entity:artist', properties: { genre: 'Electropop / Chanson', country: 'Belgium', description: 'Francophone visionary synthesizing poignant social realism, dark humor, and vibrant electro-pop.' } },
          affinity: 0.96, popularity: 0.95, tags: [{ id: 't_chanson', name: 'Chanson Moderne', affinity: 0.96 }]
        },
        {
          entity: { id: 'ent_pomme_sim', name: 'Pomme', type: 'urn:entity:artist', properties: { genre: 'Indie Folk / Chanson', country: 'France', description: 'Lyrical French indie-folk artist known for delicate acoustic arrangements and crystal-clear pronunciation.' } },
          affinity: 0.92, popularity: 0.86, tags: [{ id: 't_indiefolk', name: 'French Indie Folk', affinity: 0.93 }]
        },
        {
          entity: { id: 'ent_feu_sim', name: 'Feu! Chatterton', type: 'urn:entity:artist', properties: { genre: 'Art Rock', country: 'France', description: 'Literary French art-rock group weaving Baudelairean poetry into theatrical rock arrangements.' } },
          affinity: 0.89, popularity: 0.82, tags: [{ id: 't_artrock', name: 'Art Rock & Poetry', affinity: 0.90 }]
        }
      ];
    } else {
      // Default: Japan or General
      mockInsights = [
        {
          entity: { id: 'ent_toe_sim', name: 'toe', type: 'urn:entity:artist', properties: { genre: 'Math Rock / Instrumental', country: 'Japan', description: 'Japanese math rock icons with intricate rhythms and melodic guitars.' } },
          affinity: 0.94, popularity: 0.82, tags: [{ id: 't_math', name: 'Intricate & Atmospheric', affinity: 0.95 }]
        },
        {
          entity: { id: 'ent_kinoko_sim', name: 'Kinoko Teikoku', type: 'urn:entity:artist', properties: { genre: 'Shoegaze / Dream Pop', country: 'Japan', description: 'Atmospheric Japanese shoegaze quartet known for emotive vocals and spacious reverb.' } },
          affinity: 0.91, popularity: 0.80, tags: [{ id: 't_shoegaze', name: 'Shoegaze / Dream Pop', affinity: 0.92 }]
        }
      ];
    }
  } else if (filterType.includes(':tv_show')) {
    if (isKorea) {
      mockInsights = [
        {
          entity: { id: 'ent_squidgame_sim', name: 'Squid Game', type: 'urn:entity:tv_show', properties: { genre: 'Survival Drama', country: 'South Korea', description: 'Gripping psychological survival drama exploring economic inequality and human empathy.' } },
          affinity: 0.95, popularity: 0.98, tags: [{ id: 't_survival', name: 'Survival Thriller', affinity: 0.95 }]
        },
        {
          entity: { id: 'ent_signal_sim', name: 'Signal (시그널)', type: 'urn:entity:tv_show', properties: { genre: 'Crime Mystery', country: 'South Korea', description: 'Two detectives communicating across time via walkie-talkie solve cold cases with authentic police dialogue.' } },
          affinity: 0.91, popularity: 0.89, tags: [{ id: 't_mystery', name: 'Crime Investigation', affinity: 0.92 }]
        }
      ];
    } else if (isSpain) {
      mockInsights = [
        {
          entity: { id: 'ent_moneyheist_sim', name: 'Money Heist (La Casa de Papel)', type: 'urn:entity:tv_show', properties: { genre: 'Heist Thriller', country: 'Spain', description: 'Iconic Spanish ensemble crime thriller with rapid tactical dialogue and high narrative tension.' } },
          affinity: 0.95, popularity: 0.98, tags: [{ id: 't_heist', name: 'Heist & Suspense', affinity: 0.96 }]
        },
        {
          entity: { id: 'ent_burningbody_sim', name: 'El cuerpo en llamas', type: 'urn:entity:tv_show', properties: { genre: 'True Crime Drama', country: 'Spain', description: 'Intense Barcelona crime investigation with procedural courtroom dialogue and measured speech.' } },
          affinity: 0.90, popularity: 0.86, tags: [{ id: 't_truecrime', name: 'Investigative Thriller', affinity: 0.91 }]
        }
      ];
    } else if (isFrance) {
      mockInsights = [
        {
          entity: { id: 'ent_lupin_sim', name: 'Lupin', type: 'urn:entity:tv_show', properties: { genre: 'Mystery / Adventure', country: 'France', description: 'Gentleman thief Assane Diop seeks revenge for his father in stylish Parisian settings.' } },
          affinity: 0.94, popularity: 0.96, tags: [{ id: 't_mystery', name: 'Parisian Mystery', affinity: 0.95 }]
        },
        {
          entity: { id: 'ent_callmyagent_sim', name: 'Call My Agent! (Dix pour cent)', type: 'urn:entity:tv_show', properties: { genre: 'Comedy Drama', country: 'France', description: 'Fast-paced dramedy following Parisian talent agents, featuring brilliant contemporary dialogue.' } },
          affinity: 0.92, popularity: 0.90, tags: [{ id: 't_dialogue', name: 'Witty Comedy', affinity: 0.93 }]
        }
      ];
    } else {
      mockInsights = [
        {
          entity: { id: 'ent_lain_sim', name: 'Serial Experiments Lain', type: 'urn:entity:tv_show', properties: { genre: 'Psychological Cyberpunk', country: 'Japan', description: 'Avant-garde anime exploring digital consciousness and identity.' } },
          affinity: 0.92, popularity: 0.88, tags: [{ id: 't_psych', name: 'Psychological Thriller', affinity: 0.93 }]
        }
      ];
    }
  } else if (filterType.includes(':book')) {
    if (isFrance) {
      mockInsights = [
        {
          entity: { id: 'ent_etranger_sim', name: "L'Étranger (The Stranger)", type: 'urn:entity:book', properties: { country: 'France', description: 'Existential masterpiece written in famously direct, accessible passé composé.' } },
          affinity: 0.95, popularity: 0.92, tags: [{ id: 't_exist', name: 'Existential Literature', affinity: 0.95 }]
        }
      ];
    } else if (isSpain) {
      mockInsights = [
        {
          entity: { id: 'ent_ficciones_sim', name: 'Ficciones', type: 'urn:entity:book', properties: { country: 'Argentina', description: 'Celebrated philosophical labyrinths and short stories by Jorge Luis Borges.' } },
          affinity: 0.93, popularity: 0.90, tags: [{ id: 't_lit', name: 'Magical Realism', affinity: 0.94 }]
        }
      ];
    } else if (isKorea) {
      mockInsights = [
        {
          entity: { id: 'ent_vegetarian_sim', name: 'The Vegetarian', type: 'urn:entity:book', properties: { country: 'South Korea', description: 'Poetic, haunting Nobel laureate fiction by Han Kang exploring autonomy and societal pressure.' } },
          affinity: 0.94, popularity: 0.91, tags: [{ id: 't_lit', name: 'Contemporary Korean Lit', affinity: 0.95 }]
        }
      ];
    } else {
      mockInsights = [
        {
          entity: { id: 'ent_norwegian_sim', name: 'Norwegian Wood', type: 'urn:entity:book', properties: { country: 'Japan', description: 'Nostalgic coming-of-age novel by Haruki Murakami written in clear conversational prose.' } },
          affinity: 0.92, popularity: 0.90, tags: [{ id: 't_lit', name: 'Contemporary Japanese Lit', affinity: 0.93 }]
        }
      ];
    }
  } else {
    // Movies (default)
    if (isKorea) {
      mockInsights = [
        {
          entity: { id: 'ent_parasite_sim', name: 'Parasite', type: 'urn:entity:movie', properties: { director: 'Bong Joon-ho', country: 'South Korea', description: 'Dark social satire and suspense thriller.' } },
          affinity: 0.95, popularity: 0.97, tags: [{ id: 't_noir', name: 'Atmospheric Thriller', affinity: 0.95 }]
        },
        {
          entity: { id: 'ent_burning_sim', name: 'Burning', type: 'urn:entity:movie', properties: { director: 'Lee Chang-dong', country: 'South Korea', description: 'Hypnotic psychological mystery exploring alienated youth and social divide.' } },
          affinity: 0.91, popularity: 0.88, tags: [{ id: 't_mystery', name: 'Psychological Mystery', affinity: 0.92 }]
        }
      ];
    } else if (isSpain) {
      mockInsights = [
        {
          entity: { id: 'ent_roma_sim', name: 'Roma', type: 'urn:entity:movie', properties: { director: 'Alfonso Cuarón', country: 'Mexico', description: 'Intimate, visually stunning portrait of family life in 1970s Mexico City.' } },
          affinity: 0.94, popularity: 0.93, tags: [{ id: 't_cin', name: 'Art-House Masterpiece', affinity: 0.95 }]
        },
        {
          entity: { id: 'ent_pan_sim', name: "Pan's Labyrinth", type: 'urn:entity:movie', properties: { director: 'Guillermo del Toro', country: 'Spain', description: 'Haunting dark fantasy set against the backdrop of 1944 Francoist Spain.' } },
          affinity: 0.93, popularity: 0.95, tags: [{ id: 't_darkfan', name: 'Dark Fantasy', affinity: 0.94 }]
        }
      ];
    } else if (isFrance) {
      mockInsights = [
        {
          entity: { id: 'ent_amelie_sim', name: 'Amélie', type: 'urn:entity:movie', properties: { director: 'Jean-Pierre Jeunet', country: 'France', description: 'Whimsical romantic comedy exploring Parisian eccentricities and everyday beauty.' } },
          affinity: 0.96, popularity: 0.96, tags: [{ id: 't_whimsy', name: 'Visual Whimsy', affinity: 0.96 }]
        },
        {
          entity: { id: 'ent_portrait_sim', name: 'Portrait of a Lady on Fire', type: 'urn:entity:movie', properties: { director: 'Céline Sciamma', country: 'France', description: 'Exquisite period romance featuring sparse, poetic French dialogue and intense observation.' } },
          affinity: 0.92, popularity: 0.91, tags: [{ id: 't_period', name: 'Period Romance', affinity: 0.93 }]
        }
      ];
    } else {
      mockInsights = [
        {
          entity: { id: 'ent_spirited_sim', name: 'Spirited Away', type: 'urn:entity:movie', properties: { director: 'Hayao Miyazaki', country: 'Japan', description: 'Masterpiece anime fantasy film.' } },
          affinity: 0.94, popularity: 0.96, tags: [{ id: 't_cult', name: 'Cult & Independent', affinity: 0.94 }]
        },
        {
          entity: { id: 'ent_cure_sim', name: 'Cure (1997)', type: 'urn:entity:movie', properties: { director: 'Kiyoshi Kurosawa', country: 'Japan', description: 'Atmospheric psychological suspense noir.' } },
          affinity: 0.91, popularity: 0.85, tags: [{ id: 't_noir', name: 'Psychological Noir', affinity: 0.92 }]
        }
      ];
    }
  }

  return {
    results: mockInsights,
    tags: [
      { id: 't_cult', name: 'Cult & Independent', affinity: 0.92 },
      { id: 't_noir', name: 'Atmospheric Thriller', affinity: 0.88 },
      { id: 't_exist', name: 'Philosophical Realism', affinity: 0.85 },
      { id: 't_complex', name: 'Intricate Composition', affinity: 0.83 },
    ],
  } as unknown as T;
}

// ─── Public API Methods ──────────────────────────────────────────────────────

/**
 * Search for entities by name query
 * Endpoint: GET /search
 * Per official docs: types query parameter specifies entity type filter
 */
export async function searchEntities(
  query: string,
  types?: string[],
  limit = 10,
  options: { bypassCache?: boolean } = {}
): Promise<QlooSearchResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { entities: [], total: 0, source: 'live' };
  }

  const params: Record<string, string | number | string[]> = {
    query: cleanQuery,
    take: limit,
  };

  // Official Qloo search parameter is `types`
  if (types && types.length > 0) {
    params['types'] = types;
  }

  const envelope = await qlooFetchEnvelope<{ results?: any[]; entities?: any[]; total?: number }>(
    '/search',
    params,
    options
  );

  const rawList = Array.isArray(envelope.data?.results)
    ? envelope.data.results
    : Array.isArray(envelope.data?.entities)
    ? envelope.data.entities
    : Array.isArray((envelope.data?.results as any)?.entities)
    ? (envelope.data.results as any).entities
    : [];

  const entities: QlooEntity[] = rawList
    .map((item: any): QlooEntity => ({
      id: item.entity_id || item.id || '',
      name: item.name || '',
      type: item.types?.[0] || item.type || item.subtype || 'urn:entity',
      subtype: item.subtype || (item.types?.[1] ?? undefined),
      properties: item.properties || {},
      images: item.properties?.image?.url ? [{ url: item.properties.image.url }] : item.images,
      external_ids: item.external_ids || item.external,
    }))
    .filter((e: QlooEntity) => Boolean(e.id && e.name));

  return {
    entities,
    total: envelope.data?.total || entities.length,
    source: envelope.source,
    statusCode: envelope.statusCode,
    error: envelope.error,
  };
}

/**
 * Get taste-driven recommendations via Insights API
 * Endpoint: GET /v2/insights
 * Note: filter.release_country is only valid on movie and tv_show entity types.
 */
export async function getInsights(options: {
  entityIds: string[];
  filterType: string;
  filterCountries?: string[];
  limit?: number;
  explainability?: boolean;
  bypassCache?: boolean;
}): Promise<QlooInsightsResponse> {
  const { entityIds, filterType, filterCountries, limit = 20, explainability = true, bypassCache } = options;

  const validEntityIds = (entityIds || []).filter(
    id => Boolean(id && typeof id === 'string' && id.trim() !== '' && id !== 'undefined')
  );

  if (validEntityIds.length === 0) {
    return { results: [], tags: [], source: 'live' };
  }

  const params: Record<string, string | number | boolean | string[]> = {
    'filter.type': filterType,
    'signal.interests.entities': validEntityIds,
    take: limit,
  };

  // Only apply filter.release_country for supported entity types (movies & TV shows)
  const isVideoEntity = filterType === 'urn:entity:movie' ||
                        filterType === 'urn:entity:tv_show' ||
                        filterType.endsWith(':movie') ||
                        filterType.endsWith(':tv_show');

  if (isVideoEntity && filterCountries && filterCountries.length > 0) {
    const mapped = filterCountries.map(c => COUNTRY_CODE_TO_NAME[c.toUpperCase()] || c);
    params['filter.release_country'] = mapped;
  }

  if (explainability) {
    params['feature.explainability'] = true;
  }

  const envelope = await qlooFetchEnvelope<any>('/v2/insights', params, { bypassCache });
  const raw = envelope.data;

  // Robust response normalization across API variations
  let entitiesArray: any[] = [];
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw?.results?.entities)) {
      entitiesArray = raw.results.entities;
    } else if (Array.isArray(raw?.results)) {
      entitiesArray = raw.results;
    } else if (Array.isArray(raw?.entities)) {
      entitiesArray = raw.entities;
    }
  }

  const results: QlooInsightResult[] = entitiesArray
    .map((item: any): QlooInsightResult => {
      const e = item.entity || item;
      const affinity = item.query?.affinity ?? item.affinity ?? 0;
      const popularity = item.popularity;
      const explainData = item.query?.explainability || item.explainability;

      const tags = Array.isArray(item.tags)
        ? item.tags.map((t: any) => ({
            id: t.id || t.name || '',
            name: t.name || t.id || '',
            affinity: t.affinity ?? 0.8,
          }))
        : undefined;

      return {
        entity: {
          id: e.entity_id || e.id || '',
          name: e.name || '',
          type: e.subtype || (Array.isArray(e.types) ? e.types[0] : e.type) || filterType,
          subtype: e.subtype,
          properties: e.properties || {},
          images: e.properties?.image?.url ? [{ url: e.properties.image.url }] : e.images,
          external_ids: e.external_ids || e.external,
        },
        affinity,
        popularity,
        explainability: explainData,
        tags,
      };
    })
    .filter((r: QlooInsightResult) => Boolean(r.entity.name));

  // Extract top-level or aggregate tags
  let tags: Array<{ id: string; name: string; affinity?: number }> = [];
  if (Array.isArray(raw?.tags)) {
    tags = raw.tags;
  } else if (Array.isArray(raw?.results?.tags)) {
    tags = raw.results.tags;
  } else {
    const tagMap = new Map<string, { id: string; name: string; affinity: number }>();
    for (const r of results) {
      if (r.tags) {
        for (const t of r.tags) {
          if (!tagMap.has(t.name)) {
            tagMap.set(t.name, { id: t.id, name: t.name, affinity: t.affinity || 0.8 });
          }
        }
      }
    }
    tags = Array.from(tagMap.values()).slice(0, 15);
  }

  const topExplainability = raw?.query?.explainability || raw?.explainability;

  return {
    results,
    tags,
    explainability: topExplainability,
    source: envelope.source,
    statusCode: envelope.statusCode,
    error: envelope.error,
  };
}

/**
 * Get taste profile tags from a set of entity IDs
 */
export async function getTasteProfile(entityIds: string[]): Promise<{
  topTags: Array<{ id: string; name: string; affinity: number }>;
  summary: string;
  source: 'live' | 'cache' | 'simulated';
}> {
  const validEntityIds = (entityIds || []).filter(
    id => Boolean(id && typeof id === 'string' && id.trim() !== '' && id !== 'undefined')
  );

  if (validEntityIds.length === 0) {
    return { topTags: [], summary: 'No seeds provided', source: 'live' };
  }

  const insightsResult = await getInsights({
    entityIds: validEntityIds,
    filterType: ENTITY_TYPES.movie,
    limit: 10,
    explainability: true,
  });

  const tagMap = new Map<string, { id: string; name: string; totalAffinity: number; count: number }>();

  if (insightsResult.tags) {
    for (const tag of insightsResult.tags) {
      const aff = tag.affinity || 0.8;
      const existing = tagMap.get(tag.name);
      if (existing) {
        existing.totalAffinity += aff;
        existing.count++;
      } else {
        tagMap.set(tag.name, { id: tag.id, name: tag.name, totalAffinity: aff, count: 1 });
      }
    }
  }

  if (insightsResult.results) {
    for (const r of insightsResult.results) {
      if (r.tags) {
        for (const tag of r.tags) {
          const aff = tag.affinity || 0.8;
          const existing = tagMap.get(tag.name);
          if (existing) {
            existing.totalAffinity += aff;
            existing.count++;
          } else {
            tagMap.set(tag.name, { id: tag.id, name: tag.name, totalAffinity: aff, count: 1 });
          }
        }
      }
    }
  }

  const topTags = Array.from(tagMap.values())
    .map(t => ({ id: t.id, name: t.name, affinity: Number((t.totalAffinity / (t.count || 1)).toFixed(2)) }))
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, 15);

  const summary = topTags.length > 0
    ? `Your taste profile: ${topTags.slice(0, 5).map(t => t.name).join(', ')}`
    : 'Building taste profile...';

  return { topTags, summary, source: insightsResult.source };
}

/**
 * Diagnostic helper: tests Qloo entity search & Insights without exposing secrets
 */
export async function testQlooConnection(): Promise<{
  configured: boolean;
  baseUrl: string;
  search: {
    tested: boolean;
    success: boolean;
    statusCode?: number;
    entitiesCount: number;
    sampleEntityName?: string;
    sampleEntityId?: string;
    source: 'live' | 'cache' | 'simulated';
    error?: string;
  };
  insights: {
    tested: boolean;
    success: boolean;
    statusCode?: number;
    resultsCount: number;
    sampleCandidate?: string;
    source: 'live' | 'cache' | 'simulated';
    error?: string;
  };
}> {
  const apiKey = getQlooApiKey();
  const baseUrl = getQlooBaseUrl();

  if (!apiKey) {
    return {
      configured: false,
      baseUrl,
      search: {
        tested: false,
        success: false,
        entitiesCount: 0,
        source: 'simulated',
        error: 'QLOO_API_KEY is not set in environment.',
      },
      insights: {
        tested: false,
        success: false,
        resultsCount: 0,
        source: 'simulated',
        error: 'QLOO_API_KEY is not set in environment.',
      },
    };
  }

  // Test 1: Search for known entity
  const searchResult = await searchEntities('Radiohead', [ENTITY_TYPES.music], 3, { bypassCache: true });
  const sample = searchResult.entities[0];

  // Test 2: Real Insights request using resolved entity ID if available
  const seedId = sample?.id || 'ent_radiohead';
  const insightsResult = await getInsights({
    entityIds: [seedId],
    filterType: ENTITY_TYPES.music,
    limit: 5,
    explainability: true,
    bypassCache: true,
  });

  return {
    configured: true,
    baseUrl,
    search: {
      tested: true,
      success: searchResult.source === 'live',
      statusCode: searchResult.statusCode,
      entitiesCount: searchResult.entities.length,
      sampleEntityName: sample?.name,
      sampleEntityId: sample?.id,
      source: searchResult.source,
      error: searchResult.error,
    },
    insights: {
      tested: true,
      success: insightsResult.source === 'live',
      statusCode: insightsResult.statusCode,
      resultsCount: insightsResult.results.length,
      sampleCandidate: insightsResult.results[0]?.entity?.name,
      source: insightsResult.source,
      error: insightsResult.error,
    },
  };
}
