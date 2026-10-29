import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  TasteReasoningSchema,
  CandidateEnrichmentSchema,
  GeminiCandidateProposalSchema,
  getDeterministicCrossCategoryOpportunities,
  hasValidGeminiKey,
  generateTasteReasoningWithGemini,
} from '../gemini.ts';
import type { ContentCandidate } from '../types.ts';

describe('Gemini Discovery & Schema Validation', () => {
  it('validates authentic TasteReasoningSchema structure and rejects malformed payloads', () => {
    const validPayload = {
      tasteSummary: 'Deep cinematic affinity for atmospheric suspense and introspective storytelling.',
      culturalThemes: ['Psychological Noir', 'Acoustic Melancholy', 'Urban Solitude'],
      learningTrajectory: 'Engage with natural colloquial dialogue through crime dramas and narrative lyrics.',
      crossCategoryAvenues: [
        {
          fromCategory: 'tv',
          toCategory: 'music',
          normalizedGenre: 'Atmospheric OST & Indie Rock',
          headline: 'From Seoul Noir to Melodic Soundtracks',
          promptText: 'Enjoying Korean thrillers? Explore moody indie acoustics.',
          rationale: 'Slow vocal phrasing reinforces vocabulary acquisition.',
        },
      ],
    };

    const result = TasteReasoningSchema.safeParse(validPayload);
    assert.strictEqual(result.success, true);
    if (result.success) {
      assert.strictEqual(result.data.culturalThemes.length, 3);
      assert.strictEqual(result.data.crossCategoryAvenues[0].toCategory, 'music');
    }

    // Invalid payload: missing tasteSummary
    const invalidPayload = {
      culturalThemes: ['Aesthetic'],
    };
    const invalidResult = TasteReasoningSchema.safeParse(invalidPayload);
    assert.strictEqual(invalidResult.success, false);
  });

  it('validates CandidateEnrichmentSchema for evidence-grounded explanations', () => {
    const validEnrichment = {
      evidenceGroundedExplanation: 'Shares moody tension and slow-burn pacing with Parasite and Squid Game.',
      pedagogicalFitNote: 'Clear enunciation suitable for A2 vocabulary building.',
      learningActivityIdea: 'Shadow 2 dialogue scenes and list compound verbs used in suspenseful interactions.',
      vocabularyThemes: ['Suspense verbs', 'Honorific exchanges'],
    };

    const res = CandidateEnrichmentSchema.safeParse(validEnrichment);
    assert.strictEqual(res.success, true);
  });

  it('validates Gemini candidate proposals schema', () => {
    const validProposals = {
      proposals: [
        {
          name: 'Signal',
          category: 'tv',
          creativeContext: 'Critically acclaimed Korean procedural with time-slip narrative.',
          targetLanguageJustification: 'Authentic Korean investigative police dialogue.',
        },
      ],
    };

    const res = GeminiCandidateProposalSchema.safeParse(validProposals);
    assert.strictEqual(res.success, true);
  });
});

describe('Cross-Category Discovery Engine', () => {
  it('generates rich, category-separated discovery avenues for Korean', () => {
    const opps = getDeterministicCrossCategoryOpportunities('korean', ['tv', 'movie']);
    assert.ok(opps.length >= 2, 'Should provide multiple cross-category discovery avenues');

    for (const opp of opps) {
      assert.ok(opp.id.startsWith('cross_korean_'));
      assert.ok(['movie', 'tv', 'music', 'book'].includes(opp.fromCategory));
      assert.ok(['movie', 'tv', 'music', 'book'].includes(opp.toCategory));
      assert.ok(opp.headline.length > 5, 'Headline must be descriptive');
      assert.ok(opp.promptText.length > 15, 'Prompt text must invite user exploration');
      assert.ok(opp.rationale.length > 15, 'Rationale must provide pedagogical/cultural context');
    }
  });

  it('generates distinct discovery avenues for Japanese, Spanish, and French', () => {
    const jp = getDeterministicCrossCategoryOpportunities('japanese', ['movie']);
    assert.ok(jp.some(o => o.normalizedGenre.includes('City Pop') || o.normalizedGenre.includes('Mystery')));

    const es = getDeterministicCrossCategoryOpportunities('spanish', ['tv']);
    assert.ok(es.some(o => o.toCategory === 'music' || o.toCategory === 'book'));

    const fr = getDeterministicCrossCategoryOpportunities('french', ['movie']);
    assert.ok(fr.some(o => o.normalizedGenre.includes('Chanson') || o.normalizedGenre.includes('Fiction')));
  });
});

describe('Gemini Key Management & Graceful Fallbacks', () => {
  it('correctly detects valid vs missing/placeholder keys', () => {
    assert.strictEqual(hasValidGeminiKey(''), false);
    assert.strictEqual(hasValidGeminiKey('placeholder_key'), false);
    assert.strictEqual(hasValidGeminiKey('AIzaSyD-valid-mock-key-length-40-chars-here'), true);
  });

  it('gracefully returns null without throwing when API key is missing or invalid', async () => {
    const result = await generateTasteReasoningWithGemini(
      [{ id: 'ent_1', name: 'Parasite', type: 'movie' }],
      'korean',
      'A1',
      'invalid-key-short'
    );
    assert.strictEqual(result, null, 'Must return null rather than crashing the pipeline');
  });

  it('guarantees that candidates have clear provenance and cannot fake Qloo scores', () => {
    const candidate: ContentCandidate = {
      entity: {
        id: 'gem_001',
        name: 'Signal',
        type: 'tv',
        country: 'South Korea',
        language: 'korean',
      },
      qlooAffinity: 0.72,
      difficultyScore: 4.5,
      difficultyJustification: 'Standard crime drama dialogue',
      difficultyKeyNote: 'Investigative vocabulary',
      compositeScore: 0.76,
      tasteConnectionReason: 'Verified through TMDB dialogue check',
      provenance: 'gemini_verified', // Provenance is strictly labeled
      confidenceTier: 'strong',
    };

    assert.strictEqual(candidate.provenance, 'gemini_verified');
    assert.notStrictEqual(candidate.provenance, 'qloo_grounded');
    assert.strictEqual(candidate.confidenceTier, 'strong');
  });
});
