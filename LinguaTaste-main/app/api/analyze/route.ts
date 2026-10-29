import { NextRequest, NextResponse } from 'next/server';
import { executeRecommendationPipeline } from '@/lib/recommendations';
import { toolGetTasteProfile } from '@/lib/agent';
import { generateTasteReasoningWithGemini, hasValidGeminiKey } from '@/lib/gemini';
import type { LanguageCode, CEFRLevel, MediaType, FeedbackItem, CrossCategoryOpportunity, SeedEntity } from '@/lib/types';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json() as {
      seedNames: string[];
      targetLanguage: LanguageCode;
      cefrLevel: CEFRLevel;
      mediaTypes?: MediaType[];
      feedbackHistory?: FeedbackItem[];
    };

    const {
      seedNames,
      targetLanguage,
      cefrLevel,
      mediaTypes = ['movie', 'tv', 'music', 'book'],
      feedbackHistory = [],
    } = body;

    if (!seedNames || seedNames.length === 0) {
      return NextResponse.json({ error: 'seedNames required' }, { status: 400 });
    }
    if (!targetLanguage) {
      return NextResponse.json({ error: 'targetLanguage required' }, { status: 400 });
    }

    // Execute multi-stage recommendation pipeline
    const pipelineResult = await executeRecommendationPipeline({
      seedNames,
      targetLanguage,
      cefrLevel,
      mediaTypes,
      feedbackHistory,
      limit: 30,
    });

    // Generate taste profile from resolved seeds
    const validSeedIds = pipelineResult.resolvedSeeds
      .filter(s => s.confidence !== 'low' && !s.canonicalId.startsWith('unresolved_'))
      .map(s => s.canonicalId);

    const { profile: tasteProfile } = await toolGetTasteProfile(validSeedIds);

    // Optional Gemini Taste Reasoning Enrichment
    let crossCategoryOpportunities: CrossCategoryOpportunity[] = pipelineResult.crossCategoryOpportunities || [];
    let geminiReasoning = null;

    if (hasValidGeminiKey()) {
      try {
        const seedEntitiesForGemini: SeedEntity[] = pipelineResult.resolvedSeeds.map(s => ({
          id: s.canonicalId,
          name: s.name,
          type: (s.urnType as MediaType) || 'movie',
        }));

        const reasoning = await generateTasteReasoningWithGemini(
          seedEntitiesForGemini,
          targetLanguage,
          cefrLevel
        );

        if (reasoning) {
          geminiReasoning = reasoning;
          if (tasteProfile && reasoning.tasteSummary) {
            tasteProfile.summary = reasoning.tasteSummary;
          }

          if (reasoning.crossCategoryAvenues && reasoning.crossCategoryAvenues.length > 0) {
            const geminiOpps: CrossCategoryOpportunity[] = reasoning.crossCategoryAvenues.map((ave, idx) => ({
              id: `gemini_cross_${targetLanguage}_${idx}`,
              fromCategory: ave.fromCategory,
              toCategory: ave.toCategory,
              normalizedGenre: ave.normalizedGenre,
              headline: ave.headline,
              promptText: ave.promptText,
              rationale: ave.rationale,
            }));
            crossCategoryOpportunities = [...geminiOpps, ...crossCategoryOpportunities];
          }
        }
      } catch (geminiErr) {
        console.warn('[Gemini Reasoning in /api/analyze failed gracefully]:', geminiErr);
      }
    }

    return NextResponse.json({
      entityIds: validSeedIds,
      resolvedEntities: pipelineResult.resolvedSeeds.map(s => ({
        name: s.name,
        id: s.canonicalId,
        type: s.urnType,
      })),
      tasteProfile,
      candidates: pipelineResult.candidates,
      byCategory: pipelineResult.byCategory,
      crossCategoryOpportunities,
      geminiReasoning,
      diagnostics: pipelineResult.diagnostics,
      agentLog: pipelineResult.agentLog,
      abstained: pipelineResult.abstained,
      abstentionReason: pipelineResult.abstentionReason,
      pipelineDurationMs: Date.now() - startTime,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    console.error('Analyze API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
