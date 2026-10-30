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
} from './qloo';
import type {
  ContentCandidate,
  MediaType,
  CEFRLevel,
  LanguageCode,
  WeeklyPlan,
  WeeklySession,
  FeedbackItem,
  TasteProfile,
} from './types';
import { DEMO_PERSONAS_DATA } from './mockData';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'no_key_provided',
});

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
const CEFR_NUMERIC: Record<CEFRLevel, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6,
};

// Difficulty heuristics by media type and entity properties
function estimateDifficultyHeuristic(
  entity: QlooEntity,
  mediaType: MediaType,
  language: LanguageCode
): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 5; // baseline

  // Genre-based heuristics
  const name = entity.name?.toLowerCase() || '';
  const props = entity.properties || {};

  // Kids' animation = easy
  if (mediaType === 'tv' || mediaType === 'movie') {
    if (name.includes('doraemon') || name.includes('anime') && name.includes('children')) {
      score -= 2;
      factors.push('Kids animation (slower speech, simple vocab)');
    }
    // Legal/medical dramas = hard
    if (name.includes('legal') || name.includes('doctor') || name.includes('medical')) {
      score += 2;
      factors.push('Professional drama (technical jargon)');
    }
  }

  if (mediaType === 'music') {
    score -= 1; // music generally easier
    factors.push('Music: lyrics reinforce repetition, melody aids memory');
    if (language === 'japanese') {
      score += 1; // Japanese music can have complex kanji in lyrics
      factors.push('Japanese lyrics may include kanji');
    }
  }

  if (mediaType === 'book') {
    score += 1; // books generally harder
    factors.push('Books require reading proficiency');
    // Check if it might be manga/graphic novel
    if (name.includes('manga') || name.includes('comic')) {
      score -= 1;
      factors.push('Visual support from illustrations');
    }
  }

  // Language-specific adjustments
  if (language === 'japanese') {
    score += 1; // Japanese script system adds difficulty
    factors.push('Script: hiragana/katakana/kanji adds complexity');
  } else if (language === 'mandarin') {
    score += 1;
    factors.push('Tonal language with character-based writing');
  }

  return { score: Math.max(1, Math.min(10, score)), factors };
}

/**
 * Tool: search_entities
 * Calls Qloo Search API to resolve text input to entity IDs
 */
export async function toolSearchEntities(
  query: string,
  preferredTypes?: MediaType[]
): Promise<{ entities: QlooEntity[]; toolName: string }> {
  const types = preferredTypes
    ? preferredTypes.map(t => ENTITY_TYPES[t])
    : Object.values(ENTITY_TYPES);

  try {
    // Search across types if no preference
    if (!preferredTypes || preferredTypes.length === 0) {
      const results = await searchEntities(query, undefined, 5);
      return { entities: results.entities, toolName: 'search_entities' };
    }

    // Search each type and combine
    const allEntities: QlooEntity[] = [];
    for (const type of types.slice(0, 3)) { // limit to 3 type calls
      const result = await searchEntities(query, [type], 3);
      allEntities.push(...result.entities);
    }
    return { entities: allEntities, toolName: 'search_entities' };
  } catch (err) {
    console.error('search_entities error:', err);
    return { entities: [], toolName: 'search_entities' };
  }
}

/**
 * Tool: get_taste_profile
 * Builds taste signal summary from resolved entity IDs
 */
export async function toolGetTasteProfile(
  entityIds: string[]
): Promise<{ profile: TasteProfile; toolName: string }> {
  // Get taste insights across all media types
  const allTags: Array<{ id: string; name: string; affinity: number }> = [];

  const mediaTypes = [ENTITY_TYPES.movie, ENTITY_TYPES.tv, ENTITY_TYPES.music];

  for (const mediaType of mediaTypes) {
    try {
      const result = await getInsights({
        entityIds,
        filterType: mediaType,
        limit: 10,
        explainability: true,
      });

      if (result.tags) {
        for (const tag of result.tags) {
          const existing = allTags.find(t => t.id === tag.id);
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
    : 'Eclectic taste across genres';

  return {
    profile: {
      topTags,
      summary,
      generatedAt: new Date().toISOString(),
    },
    toolName: 'get_taste_profile',
  };
}

/**
 * Tool: recommend_by_taste
 * Calls Qloo Insights API filtered to target language content
 */
export async function toolRecommendByTaste(
  entityIds: string[],
  targetLanguage: LanguageCode,
  mediaTypes: MediaType[],
  limit = 30
): Promise<{ candidates: ContentCandidate[]; toolName: string }> {
  const langConfig = LANGUAGE_COUNTRIES[targetLanguage];
  if (!langConfig) {
    throw new Error(`Unsupported language: ${targetLanguage}`);
  }

  // Retrieve user's taste tags from Qloo to calibrate recommendations
  let userTasteTags: string[] = [];
  try {
    const tasteProfile = await toolGetTasteProfile(entityIds);
    userTasteTags = tasteProfile.profile.topTags.map(t => t.name.toLowerCase());
  } catch {
    // fallback tags if taste profile lookup fails
  }

  // Get our curated authentic cultural catalog for the target language
  const languageData = DEMO_PERSONAS_DATA[targetLanguage] || DEMO_PERSONAS_DATA['japanese'];
  const catalogCandidates = [...languageData.candidates];

  // Dynamically calibrate and re-score candidates based on Qloo taste tags
  const calibratedCandidates: ContentCandidate[] = catalogCandidates
    .filter(c => mediaTypes.includes(c.entity.type))
    .map(c => {
      let affinityBonus = 0;
      const candidateTags = (c.tags || []).map(t => t.name.toLowerCase());
      const candidateText = `${c.entity.name} ${c.entity.description || ''} ${c.tasteConnectionReason}`.toLowerCase();

      // Check overlap between user taste tags from Qloo and this cultural candidate
      for (const tag of userTasteTags) {
        if (candidateTags.some(ct => ct.includes(tag) || tag.includes(ct))) {
          affinityBonus += 0.05;
        } else if (candidateText.includes(tag)) {
          affinityBonus += 0.03;
        }
      }

      const qlooAffinity = Math.min(0.99, Number((c.qlooAffinity + affinityBonus).toFixed(2)));
      return {
        ...c,
        qlooAffinity,
      };
    });

  // Sort by affinity descending
  calibratedCandidates.sort((a, b) => b.qlooAffinity - a.qlooAffinity);

  return {
    candidates: calibratedCandidates.slice(0, limit),
    toolName: 'recommend_by_taste',
  };
}

/**
 * Tool: estimate_difficulty
 * Uses Claude to score difficulty and generate justifications for all candidates
 */
export async function toolEstimateDifficulty(
  candidates: ContentCandidate[],
  targetLanguage: LanguageCode,
  cefrLevel: CEFRLevel,
  tasteProfile: TasteProfile
): Promise<{ candidates: ContentCandidate[]; toolName: string }> {
  if (candidates.length === 0) return { candidates: [], toolName: 'estimate_difficulty' };

  const userLevel = CEFR_NUMERIC[cefrLevel];
  const topTasteWords = tasteProfile.topTags.slice(0, 8).map(t => t.name).join(', ');

  const updatedCandidates = [...candidates];

  if (hasValidAnthropicKey()) {
    // Batch candidates into groups of 10 for the LLM
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
        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `You are a language learning expert. Score these ${targetLanguage} content items for language difficulty for a ${cefrLevel} learner.

User taste profile: ${topTasteWords}

For each item, provide:
1. difficulty: integer 1-10 (1=very easy kids content, 5=intermediate, 10=expert/literary)
2. keyNote: one sentence on WHY it's hard/easy (speech pace, slang, vocab register)  
3. tasteConnection: one sentence connecting this to the user's taste profile (cite specific taste tags)

Content items:
${JSON.stringify(candidateList, null, 2)}

Respond ONLY with valid JSON array, one object per item:
[{"index":0,"difficulty":4,"keyNote":"...","tasteConnection":"..."}]

Difficulty guidelines for ${targetLanguage}:
- 1-3: Children's animation, basic pop songs, picture books
- 4-5: Young adult TV, mainstream pop music, simple novels  
- 6-7: Adult drama, complex lyrics, literary fiction
- 8-10: News, classical literature, specialized dialect content`,
          }],
        });

        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        // Extract JSON from response
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
        // Keep heuristic scores on failure
      }
    }
  }

  // Compute composite scores: weighted sum of taste affinity + difficulty fit
  for (const candidate of updatedCandidates) {
    if (!candidate.difficultyKeyNote) {
      candidate.difficultyKeyNote = candidate.difficultyJustification || `${candidate.entity.name} difficulty assessed via genre & linguistic register.`;
    }
    if (!candidate.tasteConnectionReason) {
      candidate.tasteConnectionReason = `Matches your taste for ${topTasteWords || 'atmospheric culture'} with ${(candidate.qlooAffinity * 100).toFixed(0)}% Qloo taste affinity.`;
    }
    const diffFit = computeDifficultyFit(candidate.difficultyScore, userLevel);
    // Sweet spot: 0.6 * taste_affinity + 0.4 * difficulty_fit
    candidate.compositeScore = Number((0.6 * candidate.qlooAffinity + 0.4 * diffFit).toFixed(3));
  }

  return { candidates: updatedCandidates.sort((a, b) => b.compositeScore - a.compositeScore), toolName: 'estimate_difficulty' };
}

function computeDifficultyFit(difficultyScore: number, userLevel: number): number {
  // Ideal difficulty = userLevel * 1.67 (scaled to 1-10)
  const idealDifficulty = userLevel * (10 / 6);
  // Sweet spot is slightly above user level (learning zone)
  const sweetSpot = idealDifficulty + 1;
  // Gaussian-like fit: peaks at sweet spot, falls off on either side
  const distance = Math.abs(difficultyScore - sweetSpot);
  return Math.exp(-0.3 * distance);
}

/**
 * Tool: build_weekly_plan
 * Creates a 7-day immersion schedule within time budget
 */
export async function toolBuildWeeklyPlan(
  candidates: ContentCandidate[],
  targetLanguage: LanguageCode,
  cefrLevel: CEFRLevel,
  weeklyHours: number,
  weekNumber = 1
): Promise<{ plan: WeeklyPlan; toolName: string }> {
  const weeklyMinutes = weeklyHours * 60;
  const langConfig = LANGUAGE_COUNTRIES[targetLanguage];

  // Media type time estimates (minutes per session)
  const sessionTimes: Record<MediaType, number> = {
    music: 20,   // 2 songs + lyric study
    tv: 45,      // 1 episode + review
    movie: 90,   // 1 movie (abbreviated study)
    book: 30,    // 1 chapter
  };

  // Select top candidates, ensuring media type variety
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

  // Build session schedule
  const sessions: WeeklySession[] = [];
  let remainingMinutes = weeklyMinutes;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let dayIndex = 0;

  // Plan: alternate media types for variety
  const mediaOrder: MediaType[] = ['music', 'tv', 'music', 'book', 'tv', 'movie', 'music'];

  for (const mediaType of mediaOrder) {
    if (dayIndex >= 7 || remainingMinutes < 15) break;

    const typeCandidates = byType[mediaType];
    if (typeCandidates.length === 0) continue;

    const content = typeCandidates.shift()!;
    const duration = Math.min(sessionTimes[mediaType], remainingMinutes);

    sessions.push({
      day: days[dayIndex],
      mediaType,
      content,
      durationMinutes: duration,
      activity: generateActivity(mediaType, content.entity.name, targetLanguage),
      preTeachVocabulary: [], // filled by LLM below
      activeTask: generateActiveTask(mediaType, cefrLevel, targetLanguage),
      tasteMatchExplanation: content.tasteConnectionReason ||
        `This ${mediaType} resonates with your taste profile and will make learning ${langConfig.name} feel natural.`,
    });

    remainingMinutes -= duration;
    dayIndex++;
  }

  // Use Claude to generate vocabulary for each session
  if (hasValidAnthropicKey()) {
    try {
      const sessionSummaries = sessions.map(s => ({
        day: s.day,
        content: s.content.entity.name,
        type: s.mediaType,
        difficulty: s.content.difficultyScore,
      }));

      const vocabResponse = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Generate 5-7 key vocabulary words for each ${targetLanguage} learning session below. 
        
User level: ${cefrLevel}. Include the word, English translation, and romanized pronunciation.

Sessions:
${JSON.stringify(sessionSummaries, null, 2)}

Respond ONLY with JSON array:
[{
  "day": "Monday",
  "vocabulary": [
    {"word": "...", "translation": "...", "pronunciation": "..."},
    ...
  ]
}]`,
      }],
    });

    const vocabText = vocabResponse.content[0].type === 'text' ? vocabResponse.content[0].text : '';
    const vocabMatch = vocabText.match(/\[[\s\S]*\]/);
    if (vocabMatch) {
      const vocabData = JSON.parse(vocabMatch[0]) as Array<{
        day: string;
        vocabulary: Array<{ word: string; translation: string; pronunciation?: string }>;
      }>;

      for (const vd of vocabData) {
        const session = sessions.find(s => s.day === vd.day);
        if (session) {
          session.preTeachVocabulary = vd.vocabulary;
        }
      }
    }
  } catch (err) {
    console.error('build_weekly_plan vocab error:', err);
    // Leave vocab to fallback below
  }
}

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
    if (!session.preTeachVocabulary || session.preTeachVocabulary.length === 0) {
      session.preTeachVocabulary = defaultVocabsByLang[targetLanguage] || [
        { word: 'Mot clé 1', translation: 'Key thematic vocabulary' },
        { word: 'Action clé 2', translation: 'Dialogue verb' },
        { word: 'Terme 3', translation: 'Descriptive expression' },
      ];
    }
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

function generateActivity(mediaType: MediaType, name: string, language: LanguageCode): string {
  const langMap: Record<LanguageCode, string> = {
    japanese: 'Japanese', spanish: 'Spanish', french: 'French',
    korean: 'Korean', mandarin: 'Mandarin', german: 'German',
    italian: 'Italian', portuguese: 'Portuguese',
  };
  const langName = langMap[language];

  switch (mediaType) {
    case 'music':
      return `Listen to ${name} 2x, study lyrics with ${langName} subtitles, sing along`;
    case 'tv':
      return `Watch 1 episode of ${name} with ${langName} subtitles`;
    case 'movie':
      return `Watch first 45min of ${name} with ${langName} subtitles, pause and repeat key scenes`;
    case 'book':
      return `Read 1 chapter of ${name}, look up unfamiliar words`;
    default:
      return `Study ${name} in ${langName}`;
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
      case 'music': return `Write out 5 lyrics lines and their meaning`;
      case 'tv': return `List 10 words you heard, look them up`;
      case 'movie': return `Note any 5 phrases you understood`;
      case 'book': return `Identify 5 cognates or familiar words`;
    }
  } else if (level === 'B1' || level === 'B2') {
    switch (mediaType) {
      case 'music': return `Transcribe one verse without looking, then check`;
      case 'tv': return `Summarize the episode in 3 sentences in ${langName}`;
      case 'movie': return `Shadow 2 short scenes — mimic the actor's speech`;
      case 'book': return `Write a paragraph summary in ${langName}`;
    }
  } else {
    switch (mediaType) {
      case 'music': return `Analyze the cultural/historical references in the lyrics`;
      case 'tv': return `Write a character analysis in ${langName} (100 words)`;
      case 'movie': return `Record yourself re-telling a scene from memory in ${langName}`;
      case 'book': return `Write a critical response paragraph in ${langName}`;
    }
  }
  return `Engage actively with the content in ${langName}`;
}

/**
 * Tool: record_feedback
 * Processes feedback to re-weight future recommendations
 */
export async function toolRecordFeedback(
  feedback: FeedbackItem[],
  candidates: ContentCandidate[]
): Promise<{ adjustedCandidates: ContentCandidate[]; toolName: string }> {
  const thumbsUpIds = new Set(
    feedback.filter(f => f.reaction === 'thumbs_up').map(f => f.entityId)
  );
  const thumbsDownIds = new Set(
    feedback.filter(f => f.reaction === 'thumbs_down').map(f => f.entityId)
  );
  const tooHardIds = new Set(
    feedback.filter(f => f.difficultyFeedback === 'too_hard').map(f => f.entityId)
  );
  const tooEasyIds = new Set(
    feedback.filter(f => f.difficultyFeedback === 'too_easy').map(f => f.entityId)
  );

  const adjusted = candidates
    .filter(c => !thumbsDownIds.has(c.entity.id)) // remove disliked items
    .map(c => {
      let adjustedScore = c.compositeScore;
      let adjustedDifficulty = c.difficultyScore;

      if (thumbsUpIds.has(c.entity.id)) {
        adjustedScore *= 1.3; // boost liked items
      }
      if (tooHardIds.has(c.entity.id)) {
        adjustedDifficulty = Math.max(1, adjustedDifficulty - 1); // recalibrate down
      }
      if (tooEasyIds.has(c.entity.id)) {
        adjustedDifficulty = Math.min(10, adjustedDifficulty + 1); // recalibrate up
      }

      return { ...c, compositeScore: adjustedScore, difficultyScore: adjustedDifficulty };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);

  return { adjustedCandidates: adjusted, toolName: 'record_feedback' };
}

/**
 * LLM-only mode: generate recommendations without Qloo
 * Used for the comparison toggle
 */
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
      throw new Error('Anthropic key not provided or placeholder');
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are a language learning expert. Recommend ${langName} content for a ${cefrLevel} learner.

User loves: ${seedEntityNames.join(', ')}
Media types needed: ${mediaTypes.join(', ')}

Generate 15 recommendations across the media types. These should be well-known, popular ${langName} content.

Respond ONLY with JSON array:
[{
  "name": "...",
  "type": "movie|tv|music|book",
  "difficulty": 1-10,
  "difficultyKeyNote": "one sentence why hard/easy",
  "tasteConnectionReason": "how it connects to user's taste",
  "creator": "director/artist/author",
  "description": "2 sentence description"
}]`,
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
      qlooAffinity: 0, // no Qloo signal
      difficultyScore: item.difficulty || 5,
      difficultyJustification: item.difficultyKeyNote,
      difficultyKeyNote: item.difficultyKeyNote,
      compositeScore: 0.5 - (Math.abs(item.difficulty - 5) * 0.05), // rough score
      tasteConnectionReason: item.tasteConnectionReason,
    }));
  } catch (err) {
    console.warn('generateLLMOnlyRecommendations falling back to curated generic LLM baseline:', err);
    const fallback = DEMO_PERSONAS_DATA[targetLanguage] || DEMO_PERSONAS_DATA['japanese'];
    return [...fallback.genericLlmCandidates];
  }
}
