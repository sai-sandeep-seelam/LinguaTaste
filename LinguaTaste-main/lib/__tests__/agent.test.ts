import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCandidateLanguage,
  toolEstimateDifficulty,
  toolRecordFeedback,
  toolBuildWeeklyPlan,
  evaluateComparisonRubric,
} from '../agent.ts';
import type { ContentCandidate, FeedbackItem, TasteProfile } from '../types.ts';

describe('Candidate Language Validation', () => {
  it('marks candidate as verified when spoken language matches target', () => {
    const entity = {
      id: 'test_film_1',
      name: 'Drive My Car',
      type: 'urn:entity:movie',
      properties: { original_language: 'ja', country: 'JP' },
    };
    const validation = validateCandidateLanguage(entity, 'japanese');
    assert.equal(validation.status, 'verified');
    assert.ok(validation.notes.includes('Verified spoken'));
  });

  it('marks candidate as probable when origin country matches target culture', () => {
    const entity = {
      id: 'test_film_2',
      name: 'El laberinto del fauno',
      type: 'urn:entity:movie',
      properties: { country: 'ES' },
    };
    const validation = validateCandidateLanguage(entity, 'spanish');
    assert.equal(validation.status, 'probable');
    assert.ok(validation.notes.includes('Origin country matches'));
  });

  it('marks candidate as uncertain when origin cannot be confirmed for target culture', () => {
    const entity = {
      id: 'test_film_3',
      name: 'Random Indie Film',
      type: 'urn:entity:movie',
      properties: { country: 'US' },
    };
    const validation = validateCandidateLanguage(entity, 'japanese');
    assert.equal(validation.status, 'uncertain');
    assert.ok(validation.notes.includes('recommended with target subtitles'));
  });
});

describe('Difficulty Estimation & Composite Scoring', () => {
  const dummyTasteProfile: TasteProfile = {
    topTags: [{ id: 't1', name: 'Melancholic', affinity: 0.9 }],
    summary: 'Taste: Melancholic',
    generatedAt: new Date().toISOString(),
  };

  it('computes composite scores using 0.6 affinity + 0.4 difficulty fit', async () => {
    const candidates: ContentCandidate[] = [
      {
        entity: { id: 'c1', name: 'Simple Ballad', type: 'music', language: 'japanese' },
        qlooAffinity: 0.9,
        difficultyScore: 3,
        difficultyJustification: 'Repetitive rhythm',
        difficultyKeyNote: 'Repetitive refrain',
        compositeScore: 0,
        tasteConnectionReason: 'Matches music taste',
      },
    ];

    const result = await toolEstimateDifficulty(candidates, 'japanese', 'A1', dummyTasteProfile);
    assert.equal(result.candidates.length, 1);
    const scored = result.candidates[0];
    assert.ok(scored.compositeScore > 0 && scored.compositeScore <= 1);
    assert.ok(scored.difficultyScore >= 1 && scored.difficultyScore <= 10);
  });
});

describe('Adaptive Feedback Loop (toolRecordFeedback)', () => {
  const initialCandidates: ContentCandidate[] = [
    {
      entity: { id: 'cand_1', name: 'Item 1', type: 'movie' },
      qlooAffinity: 0.8,
      difficultyScore: 5,
      difficultyJustification: '',
      difficultyKeyNote: '',
      compositeScore: 0.7,
      tasteConnectionReason: '',
      tags: [{ id: 't1', name: 'Cyberpunk', affinity: 0.9 }],
    },
    {
      entity: { id: 'cand_2', name: 'Item 2', type: 'movie' },
      qlooAffinity: 0.75,
      difficultyScore: 6,
      difficultyJustification: '',
      difficultyKeyNote: '',
      compositeScore: 0.65,
      tasteConnectionReason: '',
      tags: [{ id: 't2', name: 'Cyberpunk', affinity: 0.85 }],
    },
    {
      entity: { id: 'cand_3', name: 'Item 3 (Disliked)', type: 'tv' },
      qlooAffinity: 0.6,
      difficultyScore: 7,
      difficultyJustification: '',
      difficultyKeyNote: '',
      compositeScore: 0.5,
      tasteConnectionReason: '',
    },
  ];

  it('boosts liked items and removes disliked items from candidates', async () => {
    const feedback: FeedbackItem[] = [
      {
        entityId: 'cand_1',
        entityName: 'Item 1',
        reaction: 'thumbs_up',
        timestamp: new Date().toISOString(),
      },
      {
        entityId: 'cand_3',
        entityName: 'Item 3 (Disliked)',
        reaction: 'thumbs_down',
        timestamp: new Date().toISOString(),
      },
    ];

    const result = await toolRecordFeedback(feedback, initialCandidates);

    // cand_3 should be completely pruned
    const hasCand3 = result.adjustedCandidates.some(c => c.entity.id === 'cand_3');
    assert.equal(hasCand3, false);

    // cand_1 score should be boosted by 30%
    const cand1 = result.adjustedCandidates.find(c => c.entity.id === 'cand_1');
    assert.ok(cand1);
    assert.ok(cand1.compositeScore > 0.7);

    // cand_2 shares the "Cyberpunk" tag with liked cand_1, so it should also receive a 15% tag boost
    const cand2 = result.adjustedCandidates.find(c => c.entity.id === 'cand_2');
    assert.ok(cand2);
    assert.ok(cand2.compositeScore > 0.65);
  });

  it('adjusts difficulty down when user reports too_hard and up when too_easy', async () => {
    const feedback: FeedbackItem[] = [
      {
        entityId: 'cand_1',
        entityName: 'Item 1',
        reaction: 'thumbs_up',
        difficultyFeedback: 'too_hard',
        timestamp: new Date().toISOString(),
      },
      {
        entityId: 'cand_2',
        entityName: 'Item 2',
        reaction: 'thumbs_up',
        difficultyFeedback: 'too_easy',
        timestamp: new Date().toISOString(),
      },
    ];

    const result = await toolRecordFeedback(feedback, initialCandidates);
    const cand1 = result.adjustedCandidates.find(c => c.entity.id === 'cand_1');
    const cand2 = result.adjustedCandidates.find(c => c.entity.id === 'cand_2');

    assert.equal(cand1?.difficultyScore, 4); // 5 - 1 = 4
    assert.equal(cand2?.difficultyScore, 7); // 6 + 1 = 7
  });
});

describe('Weekly Immersion Schedule Construction', () => {
  it('generates structured sessions across multiple media types with vocabulary and tasks', async () => {
    const candidates: ContentCandidate[] = [
      { entity: { id: 'm1', name: 'Song 1', type: 'music' }, qlooAffinity: 0.9, difficultyScore: 3, difficultyJustification: '', difficultyKeyNote: '', compositeScore: 0.8, tasteConnectionReason: '' },
      { entity: { id: 't1', name: 'Show 1', type: 'tv' }, qlooAffinity: 0.85, difficultyScore: 4, difficultyJustification: '', difficultyKeyNote: '', compositeScore: 0.75, tasteConnectionReason: '' },
      { entity: { id: 'f1', name: 'Film 1', type: 'movie' }, qlooAffinity: 0.88, difficultyScore: 5, difficultyJustification: '', difficultyKeyNote: '', compositeScore: 0.78, tasteConnectionReason: '' },
      { entity: { id: 'b1', name: 'Book 1', type: 'book' }, qlooAffinity: 0.8, difficultyScore: 4, difficultyJustification: '', difficultyKeyNote: '', compositeScore: 0.7, tasteConnectionReason: '' },
    ];

    const { plan } = await toolBuildWeeklyPlan(candidates, 'japanese', 'A1', 5, 1);
    assert.ok(plan.sessions.length > 0);
    assert.ok(plan.totalMinutes > 0);

    const first = plan.sessions[0];
    assert.ok(first.day.length > 0);
    assert.ok(first.activity.length > 0);
    assert.ok(first.activeTask.length > 0);
    assert.ok(first.preTeachVocabulary.length > 0);
    assert.ok(first.learningObjective && first.learningObjective.length > 0);
  });
});

describe('Evaluation Rubric Fairness Scoring', () => {
  it('scores candidates deterministically across all five criteria', () => {
    const sampleCandidates: ContentCandidate[] = [
      {
        entity: { id: 's1', name: 'Anime 1', type: 'tv', creator: 'Director A', country: 'JP' },
        qlooAffinity: 0.92,
        difficultyScore: 3,
        difficultyJustification: '',
        difficultyKeyNote: '',
        compositeScore: 0.85,
        tasteConnectionReason: '',
        languageValidation: { status: 'verified', notes: '' },
      },
      {
        entity: { id: 's2', name: 'Track 1', type: 'music', creator: 'Artist B', country: 'JP' },
        qlooAffinity: 0.90,
        difficultyScore: 2,
        difficultyJustification: '',
        difficultyKeyNote: '',
        compositeScore: 0.82,
        tasteConnectionReason: '',
        languageValidation: { status: 'verified', notes: '' },
      },
    ];

    const rubric = evaluateComparisonRubric(sampleCandidates, 'japanese', 'A1');
    assert.ok(rubric.tasteRelevance >= 0 && rubric.tasteRelevance <= 100);
    assert.ok(rubric.languageCorrectness >= 0 && rubric.languageCorrectness <= 100);
    assert.ok(rubric.difficultyFit >= 0 && rubric.difficultyFit <= 100);
    assert.ok(rubric.recommendationDiversity >= 0 && rubric.recommendationDiversity <= 100);
    assert.ok(rubric.resourceAvailability >= 0 && rubric.resourceAvailability <= 100);
    assert.ok(rubric.overallScore >= 0 && rubric.overallScore <= 100);
  });
});
