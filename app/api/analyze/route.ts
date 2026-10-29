import { NextRequest, NextResponse } from 'next/server';
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

    if (!seedNames || seedNames.length === 0) {
      return NextResponse.json({ error: 'seedNames required' }, { status: 400 });
    }
    if (!targetLanguage) {
      return NextResponse.json({ error: 'targetLanguage required' }, { status: 400 });
    }

    // Step 1: Resolve seed names to Qloo entity IDs
    const agentLog: string[] = [];
    agentLog.push(`🔍 Searching for ${seedNames.length} seed entities...`);

    const entityIds: string[] = [];
    const resolvedEntities: Array<{ name: string; id: string; type: string }> = [];

    for (const name of seedNames) {
      const { entities } = await toolSearchEntities(name);
      if (entities.length > 0 && entities[0].id) {
        const best = entities[0];
        entityIds.push(best.id);
        resolvedEntities.push({ name: best.name, id: best.id, type: best.type });
        agentLog.push(`  ✓ "${name}" → ${best.name} (${best.type})`);
      } else {
        agentLog.push(`  ⚠ "${name}" not found in Qloo`);
      }
    }

    if (entityIds.length === 0) {
      return NextResponse.json({
        error: 'Could not resolve any entities. Try different names.',
        agentLog,
      }, { status: 400 });
    }

    // Step 2: Build taste profile
    agentLog.push(`\n🎨 Building taste profile from ${entityIds.length} entities...`);
    const { profile: tasteProfile } = await toolGetTasteProfile(entityIds);
    agentLog.push(`  → Top taste signals: ${tasteProfile.topTags.slice(0, 5).map(t => t.name).join(', ')}`);

    // Step 3: Get Qloo recommendations filtered to target language
    agentLog.push(`\n🌐 Discovering ${targetLanguage} content via Qloo taste graph...`);
    const { candidates: rawCandidates } = await toolRecommendByTaste(
      entityIds,
      targetLanguage,
      mediaTypes,
      40
    );
    agentLog.push(`  → Found ${rawCandidates.length} candidates from Qloo`);

    // Step 4: Score difficulty and build composite ranking
    agentLog.push(`\n🎯 Scoring difficulty and computing taste-difficulty fit...`);
    const { candidates } = await toolEstimateDifficulty(
      rawCandidates,
      targetLanguage,
      cefrLevel,
      tasteProfile
    );
    agentLog.push(`  → Ranked ${candidates.length} items by combined taste+difficulty score`);
    agentLog.push(`\n✅ Analysis complete! Top pick: "${candidates[0]?.entity.name || 'N/A'}"`);

    return NextResponse.json({
      entityIds,
      resolvedEntities,
      tasteProfile,
      candidates: candidates.slice(0, 30),
      agentLog,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    console.error('Analyze API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
