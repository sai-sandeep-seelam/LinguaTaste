/**
 * LinguaTaste 2.0 — Gemini Taste Intelligence & Discovery Engine
 * 
 * Powered by official @google/genai SDK with strict Zod runtime schema validation.
 * 
 * Responsibilities:
 *  - Cultural reasoning, taste profile synthesis, and learning trajectory planning
 *  - Structured cross-category discovery opportunities
 *  - Evidence-grounded explanation enrichment based on real Qloo signals
 *  - Candidate idea generation (which MUST be resolved and verified through real metadata providers)
 * 
 * Strict Boundaries:
 *  - Server-side only (GEMINI_API_KEY is never exposed via NEXT_PUBLIC_ or browser bundle)
 *  - Configurable model identifier (GEMINI_MODEL, default: gemini-3.5-flash)
 *  - Never fabricate Qloo scores, Qloo affinity weights, or Qloo entity IDs
 *  - Never mark a Gemini suggestion as Qloo-grounded (labeled as 'gemini_verified')
 *  - Gracefully falls back to deterministic heuristics if Gemini is unavailable
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import type {
  MediaType,
  LanguageCode,
  CEFRLevel,
  ContentCandidate,
  CrossCategoryOpportunity,
  SeedEntity,
} from './types.ts';

// ─── Configuration ────────────────────────────────────────────────────────────

export const GEMINI_CONFIG = {
  get model(): string {
    return process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  },
  get apiKey(): string | undefined {
    return process.env.GEMINI_API_KEY?.trim() || undefined;
  },
  timeoutMs: 12000,
};

export function hasValidGeminiKey(runtimeKey?: string): boolean {
  const key = runtimeKey !== undefined ? runtimeKey.trim() : GEMINI_CONFIG.apiKey;
  return Boolean(key && key.length >= 10 && !key.includes('placeholder'));
}

export function getGeminiClient(runtimeKey?: string): GoogleGenAI | null {
  const key = runtimeKey !== undefined ? runtimeKey.trim() : GEMINI_CONFIG.apiKey;
  if (!key || key.length < 10) return null;
  return new GoogleGenAI({ apiKey: key });
}

// ─── Zod Schemas for Runtime Validation ──────────────────────────────────────

export const TasteReasoningSchema = z.object({
  tasteSummary: z.string().min(10).describe('Editorial synthesis of user cultural DNA and aesthetic preferences'),
  culturalThemes: z.array(z.string()).min(1).max(5).describe('3 to 5 core cultural or aesthetic themes'),
  learningTrajectory: z.string().min(10).describe('How these tastes translate into engaging CEFR-aligned immersion'),
  crossCategoryAvenues: z.array(z.object({
    fromCategory: z.enum(['movie', 'tv', 'music', 'book']),
    toCategory: z.enum(['movie', 'tv', 'music', 'book']),
    normalizedGenre: z.string(),
    headline: z.string(),
    promptText: z.string(),
    rationale: z.string(),
  })).default([]),
});

export type TasteReasoningResult = z.infer<typeof TasteReasoningSchema>;

export const CandidateEnrichmentSchema = z.object({
  evidenceGroundedExplanation: z.string().min(10).describe('Clear, authentic explanation connecting user taste seeds to candidate'),
  pedagogicalFitNote: z.string().min(5).describe('Specific linguistic observation for target CEFR level'),
  learningActivityIdea: z.string().min(10).describe('Actionable immersion exercise based on actual title themes'),
  vocabularyThemes: z.array(z.string()).max(4).default([]),
});

export type CandidateEnrichmentResult = z.infer<typeof CandidateEnrichmentSchema>;

export const GeminiCandidateProposalSchema = z.object({
  proposals: z.array(z.object({
    name: z.string().min(1),
    category: z.enum(['movie', 'tv', 'music', 'book']),
    creativeContext: z.string().describe('Why this candidate matches the user taste profile'),
    targetLanguageJustification: z.string().describe('How this matches the target language/culture'),
  })).max(4).default([]),
});

export type GeminiCandidateProposals = z.infer<typeof GeminiCandidateProposalSchema>;

// ─── Helper: Clean JSON string from markdown code fence ──────────────────────

function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

// ─── Function 1: Generate Deep Taste Reasoning & Editorial Synthesis ────────

export async function generateTasteReasoningWithGemini(
  seeds: SeedEntity[],
  targetLanguage: LanguageCode,
  cefrLevel: CEFRLevel,
  runtimeKey?: string
): Promise<TasteReasoningResult | null> {
  const client = getGeminiClient(runtimeKey);
  if (!client || seeds.length === 0) return null;

  const seedListStr = seeds
    .map(s => `• [${s.type.toUpperCase()}] "${s.name}"`)
    .join('\n');

  const prompt = `You are the chief cultural editor and language immersion architect for LinguaTaste.
Analyze this user's taste seeds:
${seedListStr}

Target Language: ${targetLanguage.toUpperCase()}
Target CEFR Level: ${cefrLevel}

CRITICAL RULES:
1. Provide thoughtful, literary, editorial reasoning.
2. Formulate 2 to 3 cross-category discovery avenues (e.g. from Korean drama to Korean indie rock or mystery literature).
3. Do NOT invent Qloo scores or claim you queried Qloo directly.
4. Output MUST be valid JSON strictly matching this structure:
{
  "tasteSummary": "string",
  "culturalThemes": ["string", "string", ...],
  "learningTrajectory": "string",
  "crossCategoryAvenues": [
    {
      "fromCategory": "movie" | "tv" | "music" | "book",
      "toCategory": "movie" | "tv" | "music" | "book",
      "normalizedGenre": "string",
      "headline": "string",
      "promptText": "string",
      "rationale": "string"
    }
  ]
}`;

  try {
    const response = await client.models.generateContent({
      model: GEMINI_CONFIG.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) return null;

    const parsedJson = JSON.parse(cleanJsonText(text));
    const validated = TasteReasoningSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.warn('[Gemini: Taste Reasoning Schema Validation Error]:', validated.error.issues);
      return null;
    }

    return validated.data;
  } catch (err) {
    console.warn('[Gemini: generateTasteReasoning failed]:', err);
    return null;
  }
}

// ─── Function 2: Generate Cross-Category Opportunities ───────────────────────

export function getDeterministicCrossCategoryOpportunities(
  targetLanguage: LanguageCode,
  activeCategories: MediaType[]
): CrossCategoryOpportunity[] {
  const opps: CrossCategoryOpportunity[] = [];

  const crossMap: Record<LanguageCode, Array<{
    from: MediaType;
    to: MediaType;
    genre: string;
    headline: string;
    prompt: string;
    rationale: string;
  }>> = {
    korean: [
      {
        from: 'tv',
        to: 'movie',
        genre: 'Psychological Thriller / Noir',
        headline: 'From K-Drama Suspense to Korean Neo-Noir Cinema',
        prompt: "You're exploring Korean thriller TV. Want to discover celebrated Korean neo-noir cinema with similar tension?",
        rationale: 'Shares tense pacing, sharp dialogue exchanges, and atmospheric cinematography tailored for A2-B1 immersion.',
      },
      {
        from: 'tv',
        to: 'music',
        genre: 'Atmospheric OST & Indie Rock',
        headline: 'Soundtracks of Seoul: Melodic Indie & Vocal Drama',
        prompt: "Drawn to Korean drama narratives? Discover Korean indie and acoustic singer-songwriters who compose iconic OSTs.",
        rationale: 'Slow vocal delivery and emotional lyricism make Korean acoustic tracks ideal for repetitive pronunciation practice.',
      },
      {
        from: 'movie',
        to: 'book',
        genre: 'Modern Urban Fiction',
        headline: 'Contemporary Korean Literary Landscapes',
        prompt: 'Enjoying Korean cinema? Explore contemporary Korean novels exploring modern urban solitude and family dynamics.',
        rationale: 'Korean contemporary prose provides rich contextual vocabulary that bridges colloquial speech and formal grammar.',
      },
    ],
    japanese: [
      {
        from: 'movie',
        to: 'music',
        genre: 'City Pop & Math Rock',
        headline: 'From Tokyo Cinematic Moods to City Pop & Indie Rock',
        prompt: 'Drawn to Japanese cinematic aesthetics? Explore Japanese indie rock and 80s City Pop with matching melancholic tones.',
        rationale: 'Distinctive melodies and clear vocal phrasing provide memorable auditory anchors for JLPT vocabulary.',
      },
      {
        from: 'tv',
        to: 'book',
        genre: 'Mystery & Light Novels',
        headline: 'From Screen to Page: Honkaku Mystery & Short Fiction',
        prompt: "Exploring Japanese series? Uncover Japan's rich tradition of puzzle-box mystery novels and contemporary novellas.",
        rationale: 'Mystery novels emphasize deductive dialogue and descriptive scene-setting, reinforcing kanji in context.',
      },
    ],
    spanish: [
      {
        from: 'tv',
        to: 'music',
        genre: 'Latin Indie & Acoustic Bolero',
        headline: 'From Hispanic Drama to Poetic Songcraft',
        prompt: "Immersing in Spanish-language TV? Discover Latin American and Spanish indie singer-songwriters with evocative lyricism.",
        rationale: 'Acoustic vocals allow learners to distinguish regional cadence, subjunctive moods, and conversational idioms.',
      },
      {
        from: 'movie',
        to: 'book',
        genre: 'Magical Realism & Noir',
        headline: 'Cinematic Shadows to Literary Masterworks',
        prompt: 'Loving Hispanic cinema? Explore gripping contemporary novellas and magical realist short stories.',
        rationale: 'Spanish literary prose enriches descriptive fluency and complex narrative sentence structures.',
      },
    ],
    french: [
      {
        from: 'movie',
        to: 'music',
        genre: 'Chanson & Modern French Pop',
        headline: 'From French Cinema to Poetic Nouvelle Chanson',
        prompt: 'Enjoying French film? Discover modern chanson and melodic indie artists with articulate, lyrical French.',
        rationale: 'French lyrics train the ear on liaison and elision at natural tempo.',
      },
      {
        from: 'movie',
        to: 'book',
        genre: 'Philosophical Fiction & BD',
        headline: 'French Narrative Arts: Graphic Novels & Novellas',
        prompt: 'Exploring French film? Delve into Bande Dessinée (BD) and modern novellas with parallel visual storytelling.',
        rationale: 'Graphic novels bridge dialogue speech bubbles with authentic literary narration.',
      },
    ],
    mandarin: [
      {
        from: 'tv',
        to: 'music',
        genre: 'Mandopop & Acoustic Folk',
        headline: 'From Period Dramas to Expressive Mandopop',
        prompt: 'Watching Mandarin dramas? Explore acoustic Mandopop ballads renowned for clear tonal enunciation.',
        rationale: 'Singing slows vowel elongation, aiding tone recognition for A1-B1 learners.',
      },
    ],
    german: [
      {
        from: 'tv',
        to: 'book',
        genre: 'Crime & Historical Noir',
        headline: 'From German Krimi Series to Detective Fiction',
        prompt: 'Hooked on German television? Discover gripping Krimi (crime) novels with concise, punchy prose.',
        rationale: 'German detective novels offer accessible compound nouns and repetitive investigative dialogue.',
      },
    ],
    italian: [
      {
        from: 'movie',
        to: 'music',
        genre: 'Cantautore & Neo-Classical',
        headline: 'Cinematic Italy to the Cantautore Tradition',
        prompt: 'Loving Italian cinema? Explore the rich Italian singer-songwriter (cantautore) musical movement.',
        rationale: 'Articulate phrasing and melodic cadences build natural Italian rhythm.',
      },
    ],
    portuguese: [
      {
        from: 'movie',
        to: 'music',
        genre: 'Bossa Nova & MPB',
        headline: 'From Brazilian Film to Bossa Nova & MPB',
        prompt: 'Captivated by Brazilian film? Journey into MPB and Bossa Nova for poetic Portuguese immersion.',
        rationale: 'Bossa nova vocals provide relaxed, gentle acoustic pacing for listening comprehension.',
      },
    ],
  };

  const list = crossMap[targetLanguage] || crossMap.korean;
  list.forEach((item, idx) => {
    opps.push({
      id: `cross_${targetLanguage}_${item.from}_${item.to}_${idx}`,
      fromCategory: item.from,
      toCategory: item.to,
      normalizedGenre: item.genre,
      headline: item.headline,
      promptText: item.prompt,
      rationale: item.rationale,
    });
  });

  return opps;
}

// ─── Function 3: Enrich Candidate Explanation with Gemini ────────────────────

export async function enrichCandidateExplanationWithGemini(
  candidate: ContentCandidate,
  seeds: SeedEntity[],
  targetLanguage: LanguageCode,
  cefrLevel: CEFRLevel,
  runtimeKey?: string
): Promise<CandidateEnrichmentResult | null> {
  const client = getGeminiClient(runtimeKey);
  if (!client) return null;

  const relevantSeeds = seeds.map(s => s.name).slice(0, 3).join(', ');

  const prompt = `You are the cultural reasoning assistant for LinguaTaste.
A recommendation candidate has been verified through Qloo cultural signals and metadata verification:
- Title: "${candidate.entity.name}" (${candidate.entity.type})
- Year: ${candidate.entity.year || 'N/A'}
- Creator: ${candidate.entity.creator || 'N/A'}
- Verified Qloo Affinity: ${(candidate.qlooAffinity * 100).toFixed(0)}%
- Target Language: ${targetLanguage.toUpperCase()}
- Learner CEFR Level: ${cefrLevel}
- User Taste Seeds: ${relevantSeeds}

TASK:
Provide an authentic, evidence-grounded explanation and a targeted immersion activity idea.

STRICT RESTRICTIONS:
- Do NOT fabricate or alter the Qloo affinity score.
- Do NOT invent plot facts not reasonably associated with "${candidate.entity.name}".
- Output strictly in JSON format matching this schema:
{
  "evidenceGroundedExplanation": "string",
  "pedagogicalFitNote": "string",
  "learningActivityIdea": "string",
  "vocabularyThemes": ["string", "string"]
}`;

  try {
    const response = await client.models.generateContent({
      model: GEMINI_CONFIG.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) return null;

    const parsedJson = JSON.parse(cleanJsonText(text));
    const validated = CandidateEnrichmentSchema.safeParse(parsedJson);
    if (!validated.success) return null;

    return validated.data;
  } catch (err) {
    console.warn(`[Gemini: enrichCandidate failed for ${candidate.entity.name}]:`, err);
    return null;
  }
}

// ─── Function 4: Propose Candidates For Verification ─────────────────────────

export async function proposeCandidatesWithGemini(
  targetLanguage: LanguageCode,
  mediaType: MediaType,
  seeds: SeedEntity[],
  cefrLevel: CEFRLevel,
  runtimeKey?: string
): Promise<GeminiCandidateProposals | null> {
  const client = getGeminiClient(runtimeKey);
  if (!client || seeds.length === 0) return null;

  const seedStr = seeds.map(s => `"${s.name}" (${s.type})`).join(', ');

  const prompt = `You are the candidate expansion assistant for LinguaTaste.
Propose 2 real, authentic ${mediaType.toUpperCase()} titles in ${targetLanguage.toUpperCase()} that resonate culturally with a fan of: ${seedStr}.

REQUIREMENTS:
1. ONLY propose REAL, culturally celebrated works that actually exist.
2. The language of origin MUST be ${targetLanguage.toUpperCase()}.
3. The content must be linguistically suitable for a ${cefrLevel} learner.
4. Output strictly in JSON format:
{
  "proposals": [
    {
      "name": "Exact Official Title",
      "category": "${mediaType}",
      "creativeContext": "Brief reason why it matches the aesthetic",
      "targetLanguageJustification": "Authentic ${targetLanguage} language suitability"
    }
  ]
}`;

  try {
    const response = await client.models.generateContent({
      model: GEMINI_CONFIG.model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) return null;

    const parsed = JSON.parse(cleanJsonText(text));
    const validated = GeminiCandidateProposalSchema.safeParse(parsed);
    if (!validated.success) return null;

    return validated.data;
  } catch (err) {
    console.warn('[Gemini: proposeCandidates failed]:', err);
    return null;
  }
}
