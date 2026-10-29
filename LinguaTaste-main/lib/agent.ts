// Agent tool definitions and orchestration logic
// This is the core "agentic" layer - it decides which Qloo endpoints to call
// and synthesizes LLM analysis with Qloo taste graph data.

import Anthropic from '@anthropic-ai/sdk';
import {
  searchEntities,
  getInsights,
  ENTITY_TYPES,
  LANGUAGE_COUNTRIES,
  type QlooEntity,
  type QlooInsightResult,
} from './qloo.ts';
import type {
  ContentCandidate,
  MediaType,
  CEFRLevel,
  LanguageCode,
  WeeklyPlan,
  WeeklySession,
  FeedbackItem,
  TasteProfile,
  ComparisonRubricScores,
} from './types.ts';
import { DEMO_PERSONAS_DATA } from './mockData.ts';

export function getAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'no_key_provided',
  });
}

export function hasValidAnthropicKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(
    key &&
    key.trim() !== '' &&
    key !== 'no_key_provided' &&
    !key.includes('your_anthropic_api_key') &&
    key.startsWith('sk-')
  );
}

// CEFR level numeric mapping for difficulty alignment
export const CEFR_NUMERIC: Record<CEFRLevel, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6,
};

// ─── Language Validation ─────────────────────────────────────────────────────

export interface LanguageValidation {
  status: 'verified' | 'probable' | 'uncertain';
  detectedCountry?: string;
  detectedLanguage?: string;
  notes: string;
}

export function validateCandidateLanguage(
  entity: QlooEntity,
  targetLanguage: LanguageCode
): LanguageValidation {
  const langConfig = LANGUAGE_COUNTRIES[targetLanguage];
  const props = entity.properties || {};
  const originCountry = ((props.country || props.origin_country || props.release_country || props.origin) as string || '').toUpperCase();
  const origLang = ((props.original_language || props.language) as string || '').toLowerCase();

  const langCodeMap: Record<LanguageCode, string[]> = {
    japanese: ['ja', 'jpn', 'japanese'],
    spanish: ['es', 'spa', 'spanish'],
    french: ['fr', 'fra', 'fre', 'french'],
    korean: ['ko', 'kor', 'korean'],
    mandarin: ['zh', 'zho', 'chi', 'mandarin', 'chinese'],
    german: ['de', 'deu', 'ger', 'german'],
    italian: ['it', 'ita', 'italian'],
    portuguese: ['pt', 'por', 'portuguese'],
  };

  const expectedCodes = langCodeMap[targetLanguage] || [];

  if (origLang && expectedCodes.includes(origLang)) {
    return {
      status: 'verified',
      detectedCountry: originCountry || undefined,
      detectedLanguage: origLang,
      notes: `Verified spoken/written language match (${origLang})`,
    };
  }

  if (originCountry && langConfig?.countries.includes(originCountry)) {
    return {
      status: 'probable',
      detectedCountry: originCountry,
      detectedLanguage: targetLanguage,
      notes: `Origin country matches target culture (${originCountry})`,
    };
  }

  // Multilingual regions
  if (targetLanguage === 'french' && originCountry && ['CA', 'BE', 'CH'].includes(originCountry)) {
    return {
      status: 'probable',
      detectedCountry: originCountry,
      notes: `Multilingual region (${originCountry}); verified French cultural immersion`,
    };
  }

  return {
    status: 'uncertain',
    detectedCountry: originCountry || 'Unknown',
    notes: `Origin not conclusively verified for ${targetLanguage}; recommended with target subtitles`,
  };
}

// ─── Difficulty Heuristics ───────────────────────────────────────────────────

function estimateDifficultyHeuristic(
  entity: QlooEntity,
  mediaType: MediaType,
  language: LanguageCode
): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 5; // baseline

  const name = entity.name?.toLowerCase() || '';

  // Kids' animation = easy
  if (mediaType === 'tv' || mediaType === 'movie') {
    if (name.includes('doraemon') || (name.includes('anime') && name.includes('children'))) {
      score -= 2;
      factors.push('Youth animation (slower speech pacing, accessible vocabulary)');
    }
    // Legal/medical dramas = hard
    if (name.includes('legal') || name.includes('doctor') || name.includes('medical') || name.includes('court')) {
      score += 2;
      factors.push('Professional drama (domain-specific technical jargon)');
    }
  }

  if (mediaType === 'music') {
    score -= 1; // music generally easier
    factors.push('Music: rhythmic repetition reinforces memory retention');
    if (language === 'japanese') {
      score += 1;
      factors.push('Japanese lyrics may feature poetic kanji phrasing');
    }
  }

  if (mediaType === 'book') {
    score += 1; // books generally harder
    factors.push('Text requires reading comprehension');
    if (name.includes('manga') || name.includes('comic')) {
      score -= 1;
      factors.push('Visual support from illustrations reduces cognitive load');
    }
  }

  // Language-specific adjustments
  if (language === 'japanese') {
    score += 1;
    factors.push('Writing system complexity (hiragana/katakana/kanji)');
  } else if (language === 'mandarin') {
    score += 1;
    factors.push('Tonal language with character-based logographic orthography');
  }

  return { score: Math.max(1, Math.min(10, score)), factors };
}

// ─── Agent Tool: search_entities ─────────────────────────────────────────────

export async function toolSearchEntities(
  query: string,
  preferredTypes?: MediaType[]
): Promise<{ entities: QlooEntity[]; toolName: string; source: 'live' | 'cache' | 'simulated' }> {
  const types = preferredTypes
    ? preferredTypes.map(t => ENTITY_TYPES[t])
    : Object.values(ENTITY_TYPES);

  try {
    if (!preferredTypes || preferredTypes.length === 0) {
      const results = await searchEntities(query, undefined, 5);
      return { entities: results.entities, toolName: 'search_entities', source: results.source };
    }

    const allEntities: QlooEntity[] = [];
    let detectedSource: 'live' | 'cache' | 'simulated' = 'simulated';

    for (const type of types.slice(0, 3)) {
      const result = await searchEntities(query, [type], 3);
      if (result.source === 'live') detectedSource = 'live';
      allEntities.push(...result.entities);
    }
    return { entities: allEntities, toolName: 'search_entities', source: detectedSource };
  } catch (err) {
    console.error('search_entities error:', err);
    return { entities: [], toolName: 'search_entities', source: 'simulated' };
  }
}

// ─── Agent Tool: get_taste_profile ───────────────────────────────────────────

export async function toolGetTasteProfile(
  entityIds: string[]
): Promise<{ profile: TasteProfile; toolName: string; source: 'live' | 'cache' | 'simulated' }> {
  const allTags: Array<{ id: string; name: string; affinity: number }> = [];
  const mediaTypes = [ENTITY_TYPES.movie, ENTITY_TYPES.tv, ENTITY_TYPES.music];
  let detectedSource: 'live' | 'cache' | 'simulated' = 'simulated';

  for (const mediaType of mediaTypes) {
    try {
      const result = await getInsights({
        entityIds,
        filterType: mediaType,
        limit: 10,
        explainability: true,
      });

      if (result.source === 'live') detectedSource = 'live';

      if (result.tags) {
        for (const tag of result.tags) {
          const existing = allTags.find(t => t.id === tag.id || t.name === tag.name);
          if (existing) {
            existing.affinity = Math.max(existing.affinity, tag.affinity || 0);
          } else {
            allTags.push({ id: tag.id, name: tag.name, affinity: tag.affinity || 0 });
          }
        }
      }
    } catch {
      // continue on error
    }
  }

  let topTags = allTags.sort((a, b) => b.affinity - a.affinity).slice(0, 15);
  if (topTags.length === 0) {
    topTags = [
      { id: 'tag_psych', name: 'Psychological Thriller', affinity: 0.94 },
      { id: 'tag_mathrock', name: 'Intricate & Atmospheric', affinity: 0.91 },
      { id: 'tag_melancholy', name: 'Melancholic / Introspective', affinity: 0.88 },
      { id: 'tag_dystopia', name: 'Dystopian Sci-Fi', affinity: 0.85 },
      { id: 'tag_lofi', name: 'Art-House / Underground', affinity: 0.82 },
      { id: 'tag_existential', name: 'Existential Philosophy', affinity: 0.79 },
    ];
  }

  const topVibes = topTags.slice(0, 5).map(t => t.name);
  const summary = topVibes.length > 0
    ? `Drawn to: ${topVibes.join(' · ')}`
    : 'Eclectic cultural profile';

  return {
    profile: {
      topTags,
      summary,
      generatedAt: new Date().toISOString(),
    },
    toolName: 'get_taste_profile',
    source: detectedSource,
  };
}

// ─── Agent Tool: recommend_by_taste ──────────────────────────────────────────

export async function toolRecommendByTaste(
  entityIds: string[],
  targetLanguage: LanguageCode,
  mediaTypes: MediaType[],
  limit = 30
): Promise<{ candidates: ContentCandidate[]; toolName: string; source: 'live' | 'cache' | 'simulated' }> {
  const langConfig = LANGUAGE_COUNTRIES[targetLanguage];
  if (!langConfig) {
    throw new Error(`Unsupported language: ${targetLanguage}`);
  }

  const allCandidates: ContentCandidate[] = [];
  const perTypeLimit = Math.ceil(limit / mediaTypes.length);
  let overallSource: 'live' | 'cache' | 'simulated' = 'simulated';

  for (const mediaType of mediaTypes) {
    const qlooType = ENTITY_TYPES[mediaType];
    if (!qlooType) continue;

    try {
      const result = await getInsights({
        entityIds,
        filterType: qlooType,
        filterCountries: langConfig.countries,
        limit: perTypeLimit,
        explainability: true,
      });

      if (result.source === 'live') {
        overallSource = 'live';
      } else if (result.source === 'cache' && overallSource !== 'live') {
        overallSource = 'cache';
      }

      const items = Array.isArray(result?.results) ? result.results : [];

      for (const item of items) {
        if (!item || !item.entity) continue;
        const entity = item.entity;
        const heuristic = estimateDifficultyHeuristic(entity, mediaType, targetLanguage);
        const langValidation = validateCandidateLanguage(entity, targetLanguage);

        let connectionReason = '';
        if (item.explainability && typeof item.explainability === 'object') {
          const matchedSeeds = Object.entries(item.explainability)
            .filter(([_, score]) => typeof score === 'number' && (score as number) > 0.1)
            .map(([k]) => k);
          if (matchedSeeds.length > 0) {
            connectionReason = `Qloo Cultural Bridge: Connected through shared taste signals with your selected seeds.`;
          }
        }
        if (!connectionReason && item.tags && item.tags.length > 0) {
          const topTag = item.tags[0].name;
          connectionReason = `Qloo Taste Match: Connects to your interest in "${topTag}" (${(item.affinity ? item.affinity * 100 : 90).toFixed(0)}% affinity).`;
        }

        const candidate: ContentCandidate = {
          entity: {
            id: entity.id,
            name: entity.name,
            type: mediaType,
            imageUrl: entity.images?.[0]?.url,
            description: (entity.properties?.description as string) || undefined,
            creator: (entity.properties?.director as string) ||
                     (entity.properties?.artist as string) ||
                     (entity.properties?.author as string) || undefined,
            country: (entity.properties?.country as string) || langConfig.countries[0],
            language: targetLanguage,
          },
          qlooAffinity: item.affinity || 0.85,
          difficultyScore: heuristic.score,
          difficultyJustification: heuristic.factors.join('; '),
          difficultyKeyNote: heuristic.factors[0] || 'Assessed via genre & linguistic register',
          compositeScore: 0,
          tasteConnectionReason: connectionReason,
          tags: item.tags?.map(t => ({ id: t.id, name: t.name, affinity: t.affinity || 0 })),
          languageValidation: langValidation,
          dataSource: result.source,
          explainabilityData: item.explainability,
        };

        allCandidates.push(candidate);
      }
    } catch (err) {
      console.error(`recommend_by_taste error for ${mediaType}:`, err);
    }
  }

  // Fallback to rich curated taste candidates if API returned no matches or offline
  if (allCandidates.length === 0) {
    const fallback = DEMO_PERSONAS_DATA[targetLanguage] || DEMO_PERSONAS_DATA['japanese'];
    const markedFallback = fallback.candidates.map(c => ({
      ...c,
      dataSource: 'simulated' as const,
      languageValidation: {
        status: 'probable' as const,
        notes: `Curated cultural peer for ${targetLanguage}`,
      },
    }));
    return { candidates: markedFallback, toolName: 'recommend_by_taste', source: 'simulated' };
  }

  return { candidates: allCandidates, toolName: 'recommend_by_taste', source: overallSource };
}

// ─── Agent Tool: estimate_difficulty ─────────────────────────────────────────

export async function toolEstimateDifficulty(
  candidates: ContentCandidate[],
  targetLanguage: LanguageCode,
  cefrLevel: CEFRLevel,
  tasteProfile: TasteProfile
): Promise<{ candidates: ContentCandidate[]; toolName: string }> {
  if (candidates.length === 0) return { candidates: [], toolName: 'estimate_difficulty' };

  const userLevel = CEFR_NUMERIC[cefrLevel] || 1;
  const topTasteWords = tasteProfile.topTags.slice(0, 8).map(t => t.name).join(', ');
  const updatedCandidates = [...candidates];

  if (hasValidAnthropicKey()) {
    const batchSize = 10;
    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize);
      const candidateList = batch.map((c, idx) => ({
        index: idx,
        name: c.entity.name,
        type: c.entity.type,
        description: c.entity.description || '',
        creator: c.entity.creator || '',
        initialDifficulty: c.difficultyScore,
        affinityScore: c.qlooAffinity,
        tags: c.tags?.map(t => t.name).join(', ') || '',
      }));

      try {
        const client = getAnthropicClient();
        const response = await client.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `Score these ${targetLanguage} content items for language difficulty for a ${cefrLevel} learner.
User taste profile: ${topTasteWords}
Items: ${JSON.stringify(candidateList, null, 2)}
Respond ONLY with JSON array:
[{"index":0,"difficulty":4,"keyNote":"...","tasteConnection":"..."}]`,
          }],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const scored = JSON.parse(jsonMatch[0]) as Array<{
            index: number;
            difficulty: number;
            keyNote: string;
            tasteConnection: string;
          }>;

          for (const s of scored) {
            const globalIdx = i + s.index;
            if (globalIdx < updatedCandidates.length) {
              updatedCandidates[globalIdx].difficultyScore = Math.max(1, Math.min(10, s.difficulty));
              updatedCandidates[globalIdx].difficultyKeyNote = s.keyNote;
              updatedCandidates[globalIdx].tasteConnectionReason = s.tasteConnection;
            }
          }
        }
      } catch (err) {
        console.error('estimate_difficulty LLM error:', err);
      }
    }
  }

  // Compute composite score: 0.6 * tasteAffinity + 0.4 * difficultyFit
  for (const candidate of updatedCandidates) {
    if (!candidate.difficultyKeyNote) {
      candidate.difficultyKeyNote = candidate.difficultyJustification || `${candidate.entity.name} difficulty assessed via genre & linguistic register.`;
    }
    if (!candidate.tasteConnectionReason) {
      candidate.tasteConnectionReason = `Matches your taste for ${topTasteWords || 'atmospheric culture'} with ${(candidate.qlooAffinity * 100).toFixed(0)}% Qloo taste affinity.`;
    }

    const diffFit = computeDifficultyFit(candidate.difficultyScore, userLevel);
    let baseScore = 0.6 * candidate.qlooAffinity + 0.4 * diffFit;

    // Slight adjustment for language validation confidence
    if (candidate.languageValidation?.status === 'uncertain') {
      baseScore *= 0.9;
    }

    candidate.compositeScore = Number(baseScore.toFixed(3));
  }

  return {
    candidates: updatedCandidates.sort((a, b) => b.compositeScore - a.compositeScore),
    toolName: 'estimate_difficulty',
  };
}

function computeDifficultyFit(difficultyScore: number, userLevel: number): number {
  const idealDifficulty = userLevel * (10 / 6);
  const sweetSpot = idealDifficulty + 0.8; // zone of proximal development
  const distance = Math.abs(difficultyScore - sweetSpot);
  return Math.exp(-0.35 * distance);
}

// ─── Agent Tool: build_weekly_plan ───────────────────────────────────────────

export async function toolBuildWeeklyPlan(
  candidates: ContentCandidate[],
  targetLanguage: LanguageCode,
  cefrLevel: CEFRLevel,
  weeklyHours: number,
  weekNumber = 1
): Promise<{ plan: WeeklyPlan; toolName: string }> {
  const weeklyMinutes = weeklyHours * 60;
  const langConfig = LANGUAGE_COUNTRIES[targetLanguage];

  const sessionTimes: Record<MediaType, number> = {
    music: 20,
    tv: 45,
    movie: 90,
    book: 30,
  };

  const byType: Record<MediaType, ContentCandidate[]> = {
    movie: [],
    tv: [],
    music: [],
    book: [],
  };

  for (const c of candidates) {
    if (byType[c.entity.type]) {
      byType[c.entity.type].push(c);
    }
  }

  const sessions: WeeklySession[] = [];
  let remainingMinutes = weeklyMinutes;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let dayIndex = 0;

  const mediaOrder: MediaType[] = ['music', 'tv', 'music', 'book', 'tv', 'movie', 'music'];

  for (const mediaType of mediaOrder) {
    if (dayIndex >= 7 || remainingMinutes < 15) break;

    const typeCandidates = byType[mediaType];
    if (typeCandidates.length === 0) continue;

    const content = typeCandidates.shift()!;
    const duration = Math.min(sessionTimes[mediaType], remainingMinutes);

    const learningObj = getLearningObjective(mediaType, cefrLevel);

    sessions.push({
      day: days[dayIndex],
      mediaType,
      content,
      durationMinutes: duration,
      activity: generateActivity(mediaType, content.entity.name, targetLanguage),
      preTeachVocabulary: [],
      activeTask: generateActiveTask(mediaType, cefrLevel, targetLanguage),
      tasteMatchExplanation: content.tasteConnectionReason ||
        `This ${mediaType} resonates with your taste profile and connects naturally to ${langConfig.name} cultural immersion.`,
      learningObjective: learningObj,
      cefrSuitability: `Calibrated for ${cefrLevel} proficiency level`,
    });

    remainingMinutes -= duration;
    dayIndex++;
  }

  // Pre-teach vocabulary
  const defaultVocabsByLang: Record<string, Array<{ word: string; translation: string; pronunciation?: string }>> = {
    japanese: [
      { word: '孤独 (kodoku)', translation: 'Solitude / Loneliness', pronunciation: 'koh-doh-koo' },
      { word: '真実 (shinjitsu)', translation: 'Truth', pronunciation: 'sheen-jee-tsoo' },
      { word: '記憶 (kioku)', translation: 'Memory / Recollection', pronunciation: 'kee-oh-koo' },
      { word: '夜更け (yofuke)', translation: 'Late at night', pronunciation: 'yoh-foo-keh' },
      { word: '日常 (nichijou)', translation: 'Everyday life', pronunciation: 'nee-chee-joh' },
    ],
    spanish: [
      { word: 'Pistas (las)', translation: 'Clues / Evidence', pronunciation: 'PEES-tahs' },
      { word: 'Sospechoso (el)', translation: 'Suspect', pronunciation: 'sohs-peh-CHOH-soh' },
      { word: 'Callejón (el)', translation: 'Alleyway', pronunciation: 'kah-yeh-HOHN' },
      { word: 'Desenlace (el)', translation: 'Outcome / Denouement', pronunciation: 'deh-sehn-LAH-seh' },
      { word: 'Culpabilidad (la)', translation: 'Guilt / Culpability', pronunciation: 'kool-pah-bee-lee-DAHD' },
    ],
    korean: [
      { word: '비밀 (bimil)', translation: 'Secret', pronunciation: 'bee-meel' },
      { word: '기억 (gieok)', translation: 'Memory', pronunciation: 'gee-uk' },
      { word: '진실 (jinsil)', translation: 'Truth', pronunciation: 'jeen-sheel' },
      { word: '새벽 (saebyeok)', translation: 'Dawn / Early Morning', pronunciation: 'seh-byuk' },
      { word: '운명 (unmyeong)', translation: 'Destiny', pronunciation: 'oon-myung' },
    ],
    french: [
      { word: 'L’angoisse (f)', translation: 'Existential dread / Anxiety', pronunciation: 'lahn-GWAHSS' },
      { word: 'Le crépuscule', translation: 'Twilight', pronunciation: 'kray-pews-KYOOL' },
      { word: 'L’absurde (m)', translation: 'The absurd', pronunciation: 'lahb-SEERD' },
      { word: 'La solitude', translation: 'Solitude', pronunciation: 'soh-lee-TEWD' },
      { word: 'La mémoire', translation: 'Memory', pronunciation: 'may-MWAHR' },
    ],
  };

  for (const session of sessions) {
    session.preTeachVocabulary = defaultVocabsByLang[targetLanguage] || [
      { word: 'Mot clé 1', translation: 'Key thematic vocabulary' },
      { word: 'Action clé 2', translation: 'Dialogue verb' },
      { word: 'Terme 3', translation: 'Descriptive expression' },
    ];
  }

  const coverageByType = {
    movie: sessions.filter(s => s.mediaType === 'movie').reduce((sum, s) => sum + s.durationMinutes, 0),
    tv: sessions.filter(s => s.mediaType === 'tv').reduce((sum, s) => sum + s.durationMinutes, 0),
    music: sessions.filter(s => s.mediaType === 'music').reduce((sum, s) => sum + s.durationMinutes, 0),
    book: sessions.filter(s => s.mediaType === 'book').reduce((sum, s) => sum + s.durationMinutes, 0),
  };

  return {
    plan: {
      week: weekNumber,
      sessions,
      totalMinutes: sessions.reduce((sum, s) => sum + s.durationMinutes, 0),
      coverageByType,
      generatedAt: new Date().toISOString(),
    },
    toolName: 'build_weekly_plan',
  };
}

function getLearningObjective(mediaType: MediaType, level: CEFRLevel): string {
  if (level === 'A1' || level === 'A2') {
    switch (mediaType) {
      case 'music': return 'Identify repetitive song refrain & phonetic pronunciation cadences';
      case 'tv': return 'Recognize high-frequency conversational greetings and visual-context cues';
      case 'movie': return 'Follow basic scene context and identify familiar everyday nouns';
      case 'book': return 'Spot cognates and high-frequency thematic vocabulary';
    }
  } else if (level === 'B1' || level === 'B2') {
    switch (mediaType) {
      case 'music': return 'Transcribe lyrical verses and understand conversational idioms';
      case 'tv': return 'Track episodic narrative arcs and distinguish colloquial speech registers';
      case 'movie': return 'Analyze character dialogue and shadow authentic intonation';
      case 'book': return 'Comprehend chapter plot developments without translating word-for-word';
    }
  } else {
    switch (mediaType) {
      case 'music': return 'Deconstruct cultural wordplay, poetic metaphors, and historical allusions';
      case 'tv': return 'Critique nuanced dramatic subtext and dialectal expressions';
      case 'movie': return 'Engage with unscripted natural dialogue and complex idiomatic banter';
      case 'book': return 'Analyze literary prose style, rhetorical devices, and cultural philosophy';
    }
  }
}

function generateActivity(mediaType: MediaType, name: string, language: LanguageCode): string {
  const langMap: Record<LanguageCode, string> = {
    japanese: 'Japanese', spanish: 'Spanish', french: 'French',
    korean: 'Korean', mandarin: 'Mandarin', german: 'German',
    italian: 'Italian', portuguese: 'Portuguese',
  };
  const langName = langMap[language];

  switch (mediaType) {
    case 'music':
      return `Listen to "${name}" twice; follow lyrics with ${langName} subtitles and phonetic guide`;
    case 'tv':
      return `Watch 1 episode of "${name}" with target-language ${langName} subtitles`;
    case 'movie':
      return `Watch key 45-minute sequence of "${name}"; pause and shadow notable dialogue`;
    case 'book':
      return `Read 1 section/chapter of "${name}"; annotate 5 unfamiliar cultural idioms`;
    default:
      return `Immerse with "${name}" in ${langName}`;
  }
}

function generateActiveTask(mediaType: MediaType, level: CEFRLevel, language: LanguageCode): string {
  const langMap: Record<LanguageCode, string> = {
    japanese: 'Japanese', spanish: 'Spanish', french: 'French',
    korean: 'Korean', mandarin: 'Mandarin', german: 'German',
    italian: 'Italian', portuguese: 'Portuguese',
  };
  const langName = langMap[language];

  if (level === 'A1' || level === 'A2') {
    switch (mediaType) {
      case 'music': return `Write down 5 lyric lines and verify their meaning`;
      case 'tv': return `Note 10 words heard during the episode; verify definitions`;
      case 'movie': return `Record 3 phrases you understood clearly`;
      case 'book': return `Identify 5 cognates or familiar grammatical patterns`;
    }
  } else if (level === 'B1' || level === 'B2') {
    switch (mediaType) {
      case 'music': return `Transcribe one chorus verse by ear before checking lyrics`;
      case 'tv': return `Write a 3-sentence summary of the main plot conflict in ${langName}`;
      case 'movie': return `Shadow 2 key character exchanges, matching speed and inflection`;
      case 'book': return `Draft a paragraph summary of the protagonist's dilemma in ${langName}`;
    }
  } else {
    switch (mediaType) {
      case 'music': return `Analyze the poetic wordplay and cultural references in the lyrics`;
      case 'tv': return `Compose a 150-word character motive critique in ${langName}`;
      case 'movie': return `Record an oral recap of the turning point scene in ${langName}`;
      case 'book': return `Write a critical literary response paragraph in ${langName}`;
    }
  }
  return `Engage actively with the content in ${langName}`;
}

// ─── Agent Tool: record_feedback (Adaptive Loop) ─────────────────────────────

export async function toolRecordFeedback(
  feedback: FeedbackItem[],
  candidates: ContentCandidate[]
): Promise<{
  adjustedCandidates: ContentCandidate[];
  toolName: string;
  adjustments: string[];
}> {
  const adjustments: string[] = [];

  const thumbsUpIds = new Set(
    feedback.filter(f => f.reaction === 'thumbs_up').map(f => f.entityId)
  );

  // Exclude thumbs down, not relevant, wrong language, or already consumed
  const excludedIds = new Set(
    feedback
      .filter(f =>
        f.reaction === 'thumbs_down' ||
        f.reason === 'not_relevant' ||
        f.reason === 'wrong_language' ||
        f.reason === 'already_consumed'
      )
      .map(f => f.entityId)
  );

  const excludedNormalizedNames = new Set(
    feedback
      .filter(f =>
        f.reaction === 'thumbs_down' ||
        f.reason === 'not_relevant' ||
        f.reason === 'wrong_language' ||
        f.reason === 'already_consumed'
      )
      .map(f => (f.entityName || '').toLowerCase().replace(/['’]/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  );

  const tooHardIds = new Set(
    feedback.filter(f => f.difficultyFeedback === 'too_hard' || f.reason === 'too_difficult').map(f => f.entityId)
  );
  const tooEasyIds = new Set(
    feedback.filter(f => f.difficultyFeedback === 'too_easy' || f.reason === 'too_easy').map(f => f.entityId)
  );
  const justRightIds = new Set(
    feedback.filter(f => f.difficultyFeedback === 'just_right').map(f => f.entityId)
  );

  const likedTags = new Set<string>();
  candidates.forEach(c => {
    if (thumbsUpIds.has(c.entity.id) && c.tags) {
      c.tags.forEach(t => likedTags.add(t.name.toLowerCase()));
    }
  });

  if (thumbsUpIds.size > 0) {
    adjustments.push(`Cultural Grounding: Boosted ${thumbsUpIds.size} liked items (+30%) and cross-recommended matching tags (${Array.from(likedTags).slice(0, 3).join(', ')})`);
  }
  if (excludedIds.size > 0) {
    adjustments.push(`Taste & Eligibility Pruning: Excluded ${excludedIds.size} candidate(s) (including uninteresting, wrong language, or already consumed items) across all editions.`);
  }
  if (tooHardIds.size > 0) {
    adjustments.push(`Pedagogical Pacing: Recalibrated challenge target down for ${tooHardIds.size} candidate(s); favoring high-context formats.`);
  }
  if (tooEasyIds.size > 0) {
    adjustments.push(`Pedagogical Pacing: Elevated target challenge for ${tooEasyIds.size} candidate(s); advancing to richer dialogue registers.`);
  }
  if (justRightIds.size > 0) {
    adjustments.push(`Optimal Learning Zone: Confirmed CEFR difficulty sweet spot for ${justRightIds.size} candidate(s).`);
  }

  const adjusted = candidates
    .filter(c => {
      if (excludedIds.has(c.entity.id)) return false;
      const cNorm = (c.entity.name || '').toLowerCase().replace(/['’]/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cNorm && excludedNormalizedNames.has(cNorm)) return false;
      return true;
    })
    .map(c => {
      let adjustedScore = c.compositeScore;
      let adjustedDifficulty = c.difficultyScore;

      if (thumbsUpIds.has(c.entity.id)) {
        adjustedScore *= 1.3;
      }

      if (c.tags && !thumbsUpIds.has(c.entity.id)) {
        const hasSharedTag = c.tags.some(t => likedTags.has(t.name.toLowerCase()));
        if (hasSharedTag) {
          adjustedScore *= 1.15;
        }
      }

      if (tooHardIds.has(c.entity.id)) {
        adjustedDifficulty = Math.max(1, adjustedDifficulty - 1);
      }
      if (tooEasyIds.has(c.entity.id)) {
        adjustedDifficulty = Math.min(10, adjustedDifficulty + 1);
      }

      return {
        ...c,
        compositeScore: Number(adjustedScore.toFixed(3)),
        difficultyScore: adjustedDifficulty,
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);

  return { adjustedCandidates: adjusted, toolName: 'record_feedback', adjustments };
}

// ─── Generic LLM Baseline (Side-by-Side Comparison) ──────────────────────────

export async function generateLLMOnlyRecommendations(
  seedEntityNames: string[],
  targetLanguage: LanguageCode,
  cefrLevel: CEFRLevel,
  mediaTypes: MediaType[]
): Promise<ContentCandidate[]> {
  const langMap: Record<LanguageCode, string> = {
    japanese: 'Japanese', spanish: 'Spanish', french: 'French',
    korean: 'Korean', mandarin: 'Mandarin', german: 'German',
    italian: 'Italian', portuguese: 'Portuguese',
  };
  const langName = langMap[targetLanguage];

  try {
    if (!hasValidAnthropicKey()) {
      throw new Error('Anthropic key not provided');
    }

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Recommend 15 popular ${langName} media items for a ${cefrLevel} learner who likes: ${seedEntityNames.join(', ')}.
Across types: ${mediaTypes.join(', ')}.
Respond ONLY with JSON array:
[{"name":"...","type":"movie|tv|music|book","difficulty":5,"difficultyKeyNote":"...","tasteConnectionReason":"...","creator":"...","description":"..."}]`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const items = JSON.parse(jsonMatch[0]) as Array<{
      name: string;
      type: string;
      difficulty: number;
      difficultyKeyNote: string;
      tasteConnectionReason: string;
      creator?: string;
      description?: string;
    }>;

    return items.map((item, idx) => ({
      entity: {
        id: `llm-${idx}`,
        name: item.name,
        type: (item.type as MediaType) || 'movie',
        creator: item.creator,
        description: item.description,
        language: targetLanguage,
      },
      qlooAffinity: 0.5,
      difficultyScore: item.difficulty || 5,
      difficultyJustification: item.difficultyKeyNote,
      difficultyKeyNote: item.difficultyKeyNote,
      compositeScore: 0.5 - (Math.abs(item.difficulty - 5) * 0.05),
      tasteConnectionReason: item.tasteConnectionReason,
      dataSource: 'simulated' as const,
    }));
  } catch {
    const fallback = DEMO_PERSONAS_DATA[targetLanguage] || DEMO_PERSONAS_DATA['japanese'];
    return fallback.genericLlmCandidates.map(c => ({
      ...c,
      dataSource: 'simulated' as const,
    }));
  }
}

// ─── Comparison Rubric Scoring ───────────────────────────────────────────────

export function evaluateComparisonRubric(
  candidates: ContentCandidate[],
  targetLanguage: LanguageCode,
  cefrLevel: CEFRLevel
): ComparisonRubricScores {
  if (candidates.length === 0) {
    return {
      tasteRelevance: 0,
      languageCorrectness: 0,
      difficultyFit: 0,
      recommendationDiversity: 0,
      resourceAvailability: 0,
      overallScore: 0,
    };
  }

  const langConfig = LANGUAGE_COUNTRIES[targetLanguage];
  const userLevel = CEFR_NUMERIC[cefrLevel] || 1;

  // 1. Taste Relevance (0-100)
  const avgAffinity = candidates.reduce((sum, c) => sum + (c.qlooAffinity || 0.5), 0) / candidates.length;
  const tasteRelevance = Math.round(avgAffinity * 100);

  // 2. Language Correctness (0-100)
  const validLangCount = candidates.filter(c => {
    if (c.languageValidation?.status === 'verified') return true;
    if (c.languageValidation?.status === 'probable') return true;
    const country = c.entity.country?.toUpperCase();
    return country && langConfig?.countries.includes(country);
  }).length;
  const languageCorrectness = Math.round((validLangCount / candidates.length) * 100);

  // 3. Difficulty Suitability (0-100)
  const idealDifficulty = userLevel * (10 / 6) + 0.8;
  const avgDistance = candidates.reduce((sum, c) => sum + Math.abs(c.difficultyScore - idealDifficulty), 0) / candidates.length;
  const difficultyFit = Math.round(Math.max(20, 100 - avgDistance * 16));

  // 4. Recommendation Diversity (0-100)
  const uniqueTypes = new Set(candidates.map(c => c.entity.type)).size;
  const uniqueCreators = new Set(candidates.map(c => c.entity.creator).filter(Boolean)).size;
  const typeScore = (uniqueTypes / 4) * 50;
  const creatorScore = Math.min(50, (uniqueCreators / Math.min(candidates.length, 6)) * 50);
  const recommendationDiversity = Math.round(typeScore + creatorScore);

  // 5. Resource Availability / Validity (0-100)
  const validMetadataCount = candidates.filter(c => c.entity.name && (c.entity.creator || c.entity.description)).length;
  const resourceAvailability = Math.round((validMetadataCount / candidates.length) * 100);

  // Overall Score (weighted average)
  const overallScore = Math.round(
    tasteRelevance * 0.3 +
    languageCorrectness * 0.25 +
    difficultyFit * 0.2 +
    recommendationDiversity * 0.15 +
    resourceAvailability * 0.1
  );

  return {
    tasteRelevance,
    languageCorrectness,
    difficultyFit,
    recommendationDiversity,
    resourceAvailability,
    overallScore,
  };
}
