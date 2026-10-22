import { NextRequest, NextResponse } from 'next/server';
import { generateLLMOnlyRecommendations } from '@/lib/agent';
import {
  toolSearchEntities,
  toolGetTasteProfile,
  toolRecommendByTaste,
  toolEstimateDifficulty,
} from '@/lib/agent';
import type { LanguageCode, CEFRLevel, MediaType } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      seedNames: string[];
      targetLanguage: LanguageCode;
      cefrLevel: CEFRLevel;
      mediaTypes?: MediaType[];
    };

    const { seedNames, targetLanguage, cefrLevel, mediaTypes = ['movie', 'tv', 'music', 'book'] } = body;

    // Run both Qloo and LLM-only in parallel
    const [qlooResult, llmResult] = await Promise.allSettled([
      // Qloo mode
      (async () => {
        const entityIds: string[] = [];
        for (const name of seedNames) {
          const { entities } = await toolSearchEntities(name);
          if (entities.length > 0) entityIds.push(entities[0].id);
        }

        if (entityIds.length === 0) return { candidates: [], mode: 'qloo' };

        const { profile: tasteProfile } = await toolGetTasteProfile(entityIds);
        const { candidates: rawCandidates } = await toolRecommendByTaste(
          entityIds, targetLanguage, mediaTypes, 20
        );
        const { candidates } = await toolEstimateDifficulty(
          rawCandidates, targetLanguage, cefrLevel, tasteProfile
        );
        return { candidates: candidates.slice(0, 15), mode: 'qloo', tasteProfile };
      })(),

      // LLM-only mode
      (async () => {
        const candidates = await generateLLMOnlyRecommendations(
          seedNames, targetLanguage, cefrLevel, mediaTypes
        );
        return { candidates, mode: 'llm_only' };
      })(),
    ]);

    const qloo = qlooResult.status === 'fulfilled' ? qlooResult.value : { candidates: [], mode: 'qloo' };
    const llm = llmResult.status === 'fulfilled' ? llmResult.value : { candidates: [], mode: 'llm_only' };

    return NextResponse.json({
      qloo: { ...qloo, generatedAt: new Date().toISOString() },
      llm: { ...llm, generatedAt: new Date().toISOString() },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Comparison failed';
    console.error('Compare API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
