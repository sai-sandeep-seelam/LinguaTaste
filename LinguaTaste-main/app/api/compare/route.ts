import { NextRequest, NextResponse } from 'next/server';
import { executeRecommendationPipeline } from '@/lib/recommendations';
import {
  generateLLMOnlyRecommendations,
  toolGetTasteProfile,
  evaluateComparisonRubric,
} from '@/lib/agent';
import type { LanguageCode, CEFRLevel, MediaType, ContentCandidate } from '@/lib/types';

interface MeasuredMetrics {
  sampleCount: number;
  verifiedLanguagePercent: number;
  eligibilityPassPercent: number;
  duplicateRatePercent: number;
  thresholdPassedCount: number;
  uniqueCategoriesCount: number;
}

function calculateMeasuredMetrics(
  candidates: ContentCandidate[],
  totalGenerated: number
): MeasuredMetrics {
  if (candidates.length === 0) {
    return {
      sampleCount: 0,
      verifiedLanguagePercent: 0,
      eligibilityPassPercent: 0,
      duplicateRatePercent: 0,
      thresholdPassedCount: 0,
      uniqueCategoriesCount: 0,
    };
  }

  const verifiedCount = candidates.filter(c => c.languageValidation?.status === 'verified').length;
  const verifiedLanguagePercent = Math.round((verifiedCount / candidates.length) * 100);

  // Check unique titles to measure duplicate rate
  const titles = candidates.map(c => (c.entity.name || '').toLowerCase().trim());
  const uniqueTitles = new Set(titles);
  const duplicateCount = titles.length - uniqueTitles.size;
  const duplicateRatePercent = Math.round((duplicateCount / candidates.length) * 100);

  const eligibilityPassPercent = totalGenerated > 0
    ? Math.round((candidates.length / totalGenerated) * 100)
    : 100;

  const thresholdPassedCount = candidates.filter(c => (c.compositeScore || 0) >= 0.52).length;
  const uniqueCategoriesCount = new Set(candidates.map(c => c.entity.type)).size;

  return {
    sampleCount: candidates.length,
    verifiedLanguagePercent,
    eligibilityPassPercent,
    duplicateRatePercent,
    thresholdPassedCount,
    uniqueCategoriesCount,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      seedNames: string[];
      targetLanguage: LanguageCode;
      cefrLevel: CEFRLevel;
      mediaTypes?: MediaType[];
    };

    const {
      seedNames,
      targetLanguage,
      cefrLevel,
      mediaTypes = ['movie', 'tv', 'music', 'book'],
    } = body;

    if (!seedNames || seedNames.length === 0) {
      return NextResponse.json({ error: 'seedNames required' }, { status: 400 });
    }

    // Run both Qloo-grounded pipeline and LLM baseline under identical constraints
    const [qlooResult, llmResult] = await Promise.allSettled([
      // Arm A: Qloo-grounded Pipeline with Hard Eligibility & Explainable Reranking
      (async () => {
        const pipelineRes = await executeRecommendationPipeline({
          seedNames,
          targetLanguage,
          cefrLevel,
          mediaTypes,
          limit: 15,
        });

        const validSeedIds = pipelineRes.resolvedSeeds
          .filter(s => s.confidence !== 'low')
          .map(s => s.canonicalId);

        const { profile: tasteProfile } = await toolGetTasteProfile(validSeedIds);
        const sliced = pipelineRes.candidates.slice(0, 15);
        const rubricScores = evaluateComparisonRubric(sliced, targetLanguage, cefrLevel);
        const totalGen = Object.values(pipelineRes.diagnostics.categoryStats).reduce((sum, s) => sum + s.generated, 0);
        const metrics = calculateMeasuredMetrics(sliced, totalGen || sliced.length);

        return {
          candidates: sliced,
          mode: 'qloo' as const,
          tasteProfile,
          rubricScores,
          metrics,
          diagnostics: pipelineRes.diagnostics,
          isLive: pipelineRes.diagnostics.apiSource === 'live',
        };
      })(),

      // Arm B: Generic LLM Baseline (Without access to Qloo taste graph)
      (async () => {
        const candidates = await generateLLMOnlyRecommendations(
          seedNames,
          targetLanguage,
          cefrLevel,
          mediaTypes
        );
        const sliced = candidates.slice(0, 15);
        const rubricScores = evaluateComparisonRubric(sliced, targetLanguage, cefrLevel);
        const metrics = calculateMeasuredMetrics(sliced, sliced.length);

        return {
          candidates: sliced,
          mode: 'llm_only' as const,
          rubricScores,
          metrics,
          isLive: false,
        };
      })(),
    ]);

    const qloo = qlooResult.status === 'fulfilled'
      ? qlooResult.value
      : { candidates: [], mode: 'qloo' as const, isLive: false, rubricScores: undefined, metrics: undefined };

    const llm = llmResult.status === 'fulfilled'
      ? llmResult.value
      : { candidates: [], mode: 'llm_only' as const, isLive: false, rubricScores: undefined, metrics: undefined };

    const sampleSize = Math.max(qloo.candidates.length, llm.candidates.length);
    const isPreliminary = sampleSize < 10;

    return NextResponse.json({
      qloo: { ...qloo, generatedAt: new Date().toISOString() },
      llm: { ...llm, generatedAt: new Date().toISOString() },
      evaluationMetadata: {
        sampleSize,
        isPreliminary,
        preliminaryNote: isPreliminary
          ? 'Preliminary benchmark: sample size is under 10 candidates; metrics reflect initial screening pool.'
          : 'Grounded benchmark: full candidate sample evaluated.',
        targetLanguage,
        cefrLevel,
        criteria: [
          'Taste Relevance: Cultural affinity alignment to seed entities',
          'Language Correctness: Origin and spoken dialogue language verification',
          'Difficulty Suitability: Proximity to CEFR level proximal development sweet spot',
          'Recommendation Diversity: Variety across 4 media categories & creators',
          'Resource Availability: Metadata completeness for streaming & reading lookup',
        ],
        benchmarkFairnessNote: 'Both arms evaluated with identical user seeds, CEFR level, media types, and objective verification criteria.',
      },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Comparison failed';
    console.error('Compare API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
