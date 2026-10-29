/**
 * LinguaTaste Recommendation Intelligence Test Suite
 * 
 * Tests the multi-stage recommendation pipeline:
 *  - Seed entity resolution & URN preservation
 *  - Stage B: Hard eligibility checks (media type, TMDB dialogue language, deduplication, seed/feedback exclusion)
 *  - Stage C: Explainable reranking & evidence-based explanations
 *  - Stage D: Quality thresholds & honest abstention
 *  - Content-specific CEFR difficulty estimation with explicit limitations
 *  - Adaptive feedback learning & candidate exclusion
 *  - Profile verification for Korean, Japanese, and Spanish personas
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  resolveSeedEntities,
  evaluateCandidateEligibility,
  estimateContentDifficulty,
  parseQlooExplainability,
  generateTraceableExplanation,
  executeRecommendationPipeline,
  QUALITY_THRESHOLDS,
  TARGET_LANGUAGE_MAP,
} from '../recommendations.ts';
import type {
  QlooInsightResult,
  QlooEntity,
} from '../qloo.ts';
import type { FeedbackItem, ContentCandidate } from '../types.ts';

describe('Seed Resolution & Taxonomy Preservation', () => {
  it('resolves seeds while preserving canonical IDs and authentic URN types', async () => {
    const resolutions = await resolveSeedEntities(['Squid Game', 'Parasite', 'BTS', 'BLACKPINK']);
    assert.strictEqual(resolutions.length, 4);

    for (const res of resolutions) {
      assert.ok(res.canonicalId, `Expected canonical ID for ${res.seedInput}`);
      assert.ok(res.name, `Expected resolved name for ${res.seedInput}`);
      assert.ok(res.urnType.startsWith('urn:entity:'), `Expected URN type for ${res.seedInput}`);
    }
  });

  it('marks unknown entities with low confidence without throwing errors', async () => {
    const resolutions = await resolveSeedEntities(['NonExistentEntity98765XYZ']);
    assert.strictEqual(resolutions.length, 1);
    assert.strictEqual(resolutions[0].confidence, 'low');
    assert.ok(resolutions[0].canonicalId.startsWith('unresolved_'));
  });
});

describe('Stage B: Hard Eligibility Checks', () => {
  const seeds = [
    { seedInput: 'Squid Game', canonicalId: '340C4A42-8726-42C9-BFA6-FBA6F923E5E6', name: 'Squid Game', urnType: 'urn:entity:tv_show', confidence: 'high' as const, source: 'live' as const },
    { seedInput: 'Parasite', canonicalId: 'A499EC25-7FF6-46DE-9DA5-3E78E99B9E26', name: 'Parasite', urnType: 'urn:entity:movie', confidence: 'high' as const, source: 'live' as const },
  ];

  it('rejects candidates that match an active user seed', async () => {
    const rawSeedCandidate: QlooInsightResult = {
      entity: {
        id: '340C4A42-8726-42C9-BFA6-FBA6F923E5E6',
        name: 'Squid Game',
        type: 'urn:entity:tv_show',
        subtype: 'urn:entity:tv_show',
      },
      affinity: 0.99,
    };

    const check = await evaluateCandidateEligibility(rawSeedCandidate, 'tv', 'korean', seeds, []);
    assert.strictEqual(check.passed, false);
    assert.ok(check.reasons.some(r => r.includes('matches an active user taste seed')));
  });

  it('rejects media type mismatches (e.g. book returned during movie query)', async () => {
    const wrongTypeCandidate: QlooInsightResult = {
      entity: {
        id: 'ent_book_1',
        name: 'Korean Fairy Tales',
        type: 'urn:entity:book',
        subtype: 'urn:entity:book',
      },
      affinity: 0.92,
    };

    const check = await evaluateCandidateEligibility(wrongTypeCandidate, 'movie', 'korean', seeds, []);
    assert.strictEqual(check.passed, false);
    assert.strictEqual(check.mediaTypeStatus, 'rejected');
    assert.ok(check.reasons.some(r => r.includes('Media type mismatch')));
  });

  it('rejects English/non-target dialogue films for Korean learning goal', async () => {
    const englishMovieCandidate: QlooInsightResult = {
      entity: {
        id: '5F98082A-A0AC-4453-8D8B-FCFBCB9ED4C0',
        name: 'Joker',
        type: 'urn:entity:movie',
        subtype: 'urn:entity:movie',
        properties: { country: 'United States' },
      },
      affinity: 0.91,
    };

    const check = await evaluateCandidateEligibility(englishMovieCandidate, 'movie', 'korean', seeds, []);
    assert.strictEqual(check.passed, false);
    assert.strictEqual(check.languageStatus, 'rejected');
    assert.ok(check.reasons.some(r => r.includes('does not match target language')));
  });

  it('verifies genuine target language movies via TMDB dialogue check', async () => {
    const koreanMovieCandidate: QlooInsightResult = {
      entity: {
        id: 'ent_busan_kr',
        name: 'Train to Busan',
        type: 'urn:entity:movie',
        subtype: 'urn:entity:movie',
        properties: { country: 'South Korea' },
      },
      affinity: 0.89,
    };

    const check = await evaluateCandidateEligibility(koreanMovieCandidate, 'movie', 'korean', seeds, []);
    assert.strictEqual(check.passed, true);
    assert.strictEqual(check.languageStatus, 'verified');
    assert.strictEqual(check.tmdbVerified, true);
  });

  it('rejects candidates previously disliked or marked wrong_language in user feedback', async () => {
    const candidate: QlooInsightResult = {
      entity: {
        id: 'ent_vincenzo',
        name: 'Vincenzo',
        type: 'urn:entity:tv_show',
        subtype: 'urn:entity:tv_show',
        properties: { country: 'South Korea' },
      },
      affinity: 0.97,
    };

    const feedback: FeedbackItem[] = [
      {
        entityId: 'ent_vincenzo',
        entityName: 'Vincenzo',
        reaction: 'thumbs_down',
        reason: 'wrong_language',
        timestamp: new Date().toISOString(),
      },
    ];

    const check = await evaluateCandidateEligibility(candidate, 'tv', 'korean', seeds, feedback);
    assert.strictEqual(check.passed, false);
    assert.ok(check.reasons.some(r => r.includes('previously rejected by user feedback')));
  });
});

describe('Stage C: Explainable Reranking & Evidence Extraction', () => {
  const seeds = [
    { seedInput: 'BTS', canonicalId: 'F347D506-CB6F-46FA-9A8B-AFBC31C71A1A', name: 'BTS', urnType: 'urn:entity:artist', confidence: 'high' as const, source: 'live' as const },
    { seedInput: 'BLACKPINK', canonicalId: 'AFB6CA3D-9620-4D8B-9958-6727BA40AFA6', name: 'BLACKPINK', urnType: 'urn:entity:artist', confidence: 'high' as const, source: 'live' as const },
  ];

  it('extracts real Qloo mathematical explainability weights to contributing seeds', () => {
    const rawExplainability = {
      'signal.interests.entities': [
        { entity_id: 'F347D506-CB6F-46FA-9A8B-AFBC31C71A1A', score: 0.2603 },
        { entity_id: 'AFB6CA3D-9620-4D8B-9958-6727BA40AFA6', score: 0.2601 },
      ],
    };

    const contributions = parseQlooExplainability(rawExplainability, seeds);
    assert.strictEqual(contributions.length, 2);
    assert.strictEqual(contributions[0].seedName, 'BTS');
    assert.strictEqual(contributions[0].weight, 0.26);
    assert.strictEqual(contributions[1].seedName, 'BLACKPINK');
  });

  it('generates traceable, evidence-based explanations without fabricating numbers', () => {
    const rawResult: QlooInsightResult = {
      entity: {
        id: 'E404DC51-323B-4DB4-ABD3-0A9F02C0429E',
        name: 'TWICE',
        type: 'urn:entity:artist',
        subtype: 'urn:entity:artist',
      },
      affinity: 0.98,
      explainability: {
        'signal.interests.entities': [
          { entity_id: 'F347D506-CB6F-46FA-9A8B-AFBC31C71A1A', score: 0.26 },
        ],
      },
      tags: [{ id: 'kpop', name: 'K-Pop' }],
    };

    const difficulty = estimateContentDifficulty(rawResult.entity, 'music', 'korean', 'A1');
    const eligibility = {
      passed: true,
      reasons: [],
      languageStatus: 'probable' as const,
      mediaTypeStatus: 'verified' as const,
      detectedCountry: 'South Korea',
    };

    const explanation = generateTraceableExplanation(
      rawResult,
      seeds,
      'korean',
      'A1',
      difficulty,
      eligibility
    );

    assert.ok(explanation.summaryText.includes('BTS (26%)'), 'Must trace back to contributing seed BTS');
    assert.ok(explanation.summaryText.includes('Strong Cultural Connection'), 'Must include qualitative affinity label');
    assert.ok(!explanation.summaryText.includes('atmospheric culture'), 'Must not contain fabricated generic tag text');
  });
});

describe('Honest CEFR Difficulty Estimation', () => {
  it('provides content-type specific evidence and explicit limitations for music', () => {
    const musicEntity: QlooEntity = {
      id: 'ent_music',
      name: 'TWICE',
      type: 'urn:entity:artist',
    };

    const assessment = estimateContentDifficulty(musicEntity, 'music', 'korean', 'A1');
    assert.ok(assessment.difficultyScore <= 5.0, 'Music should have accessible baseline difficulty');
    assert.ok(assessment.evidenceUsed.some(e => e.includes('Rhythmic repetition')));
    assert.ok(assessment.missingEvidenceOrLimitations.some(l => l.includes('lyrics transcript')));
    assert.ok(assessment.pedagogicalSuitability.length > 0);
  });

  it('provides distinct evidence and limitations for books without claiming transcript analysis', () => {
    const bookEntity: QlooEntity = {
      id: 'ent_book',
      name: 'Modern Korean Fiction',
      type: 'urn:entity:book',
      properties: { description: 'Literary collection of complex prose' },
    };

    const assessment = estimateContentDifficulty(bookEntity, 'book', 'korean', 'B2');
    assert.ok(assessment.difficultyScore >= 5.5, 'Text literature requires autonomous reading comprehension');
    assert.ok(assessment.evidenceUsed.some(e => e.includes('autonomous reading comprehension')));
    assert.ok(assessment.missingEvidenceOrLimitations.some(l => l.includes('lexical frequency')));
  });
});

describe('Stage D: Quality Thresholds & Honest Abstention', () => {
  it('abstains honestly and returns clear reason when no valid seeds can be resolved', async () => {
    const result = await executeRecommendationPipeline({
      seedNames: ['UnknownFakeSeed123987456'],
      targetLanguage: 'korean',
      cefrLevel: 'A1',
      mediaTypes: ['tv', 'movie'],
      qualityThreshold: QUALITY_THRESHOLDS.STRONG,
    });

    assert.strictEqual(result.abstained, true);
    assert.strictEqual(result.candidates.length, 0);
    assert.ok(result.abstentionReason?.includes('Could not resolve'));
  });

  it('filters out weak candidates and does not silently substitute generic LLM fallbacks', async () => {
    const result = await executeRecommendationPipeline({
      seedNames: ['Squid Game', 'Parasite', 'BTS'],
      targetLanguage: 'korean',
      cefrLevel: 'A1',
      mediaTypes: ['tv', 'movie', 'music'],
      qualityThreshold: 0.50,
      limit: 10,
    });

    assert.ok(result.candidates.length > 0, 'Should return candidates that pass eligibility');
    for (const c of result.candidates) {
      assert.ok(c.compositeScore >= 0.50, `Candidate ${c.entity.name} (${c.compositeScore}) should meet threshold`);
      assert.notStrictEqual(c.languageValidation?.status, 'rejected', 'No rejected language candidates should remain');
    }
  });
});

describe('Adaptive Feedback Learning', () => {
  it('excludes candidates previously disliked by the user', async () => {
    // 1. Initial pipeline run
    const initialRun = await executeRecommendationPipeline({
      seedNames: ['Squid Game', 'Parasite', 'BTS', 'BLACKPINK'],
      targetLanguage: 'korean',
      cefrLevel: 'A1',
      mediaTypes: ['tv'],
      limit: 5,
    });

    if (initialRun.candidates.length > 0) {
      const disliked = initialRun.candidates[0];
      const feedback: FeedbackItem[] = [{
        entityId: disliked.entity.id,
        entityName: disliked.entity.name,
        reaction: 'thumbs_down',
        reason: 'not_relevant',
        timestamp: new Date().toISOString(),
      }];

      // 2. Subsequent run with feedback
      const subsequentRun = await executeRecommendationPipeline({
        seedNames: ['Squid Game', 'Parasite', 'BTS', 'BLACKPINK'],
        targetLanguage: 'korean',
        cefrLevel: 'A1',
        mediaTypes: ['tv'],
        feedbackHistory: feedback,
        limit: 5,
      });

      const containsDisliked = subsequentRun.candidates.some(c => c.entity.id === disliked.entity.id || c.entity.name === disliked.entity.name);
      assert.strictEqual(containsDisliked, false, `Disliked item "${disliked.entity.name}" must not reappear`);
    }
  });
});

describe('Cultural Immersion Personas Verification', () => {
  it('Korean persona: seeded with Squid Game, Parasite, BTS, and BLACKPINK produces category-correct candidates', async () => {
    const result = await executeRecommendationPipeline({
      seedNames: ['Squid Game', 'Parasite', 'BTS', 'BLACKPINK'],
      targetLanguage: 'korean',
      cefrLevel: 'A1',
      mediaTypes: ['tv', 'music'],
      limit: 8,
    });

    assert.ok(result.candidates.length > 0, 'Korean persona should generate recommendations');
    for (const c of result.candidates) {
      assert.ok(['tv', 'music'].includes(c.entity.type), `Expected tv or music, got ${c.entity.type}`);
      assert.ok(c.qlooAffinity > 0, 'Should have positive Qloo cultural affinity');
    }
  });

  it('Japanese persona: seeded with anime and indie music produces category-correct candidates', async () => {
    const result = await executeRecommendationPipeline({
      seedNames: ['Attack on Titan', 'Death Note', 'Radiohead', 'Spirited Away'],
      targetLanguage: 'japanese',
      cefrLevel: 'A1',
      mediaTypes: ['tv', 'movie'],
      limit: 6,
    });

    assert.ok(result.candidates.length > 0, 'Japanese persona should generate recommendations');
    for (const c of result.candidates) {
      assert.ok(['tv', 'movie'].includes(c.entity.type));
    }
  });

  it('Spanish persona: seeded with crime thriller and hip-hop produces valid recommendations', async () => {
    const result = await executeRecommendationPipeline({
      seedNames: ['Money Heist', 'Breaking Bad', 'Kendrick Lamar'],
      targetLanguage: 'spanish',
      cefrLevel: 'A2',
      mediaTypes: ['tv', 'music'],
      limit: 6,
    });

    assert.ok(result.candidates.length > 0, 'Spanish persona should generate recommendations');
    for (const c of result.candidates) {
      assert.ok(['tv', 'music'].includes(c.entity.type));
    }
  });
});
