import { NextRequest, NextResponse } from 'next/server';
import { toolBuildWeeklyPlan } from '@/lib/agent';
import type { ContentCandidate, LanguageCode, CEFRLevel } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      candidates: ContentCandidate[];
      targetLanguage: LanguageCode;
      cefrLevel: CEFRLevel;
      weeklyHours: number;
      weekNumber?: number;
    };

    const { candidates, targetLanguage, cefrLevel, weeklyHours, weekNumber = 1 } = body;

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ error: 'candidates required' }, { status: 400 });
    }

    const { plan } = await toolBuildWeeklyPlan(
      candidates,
      targetLanguage,
      cefrLevel,
      weeklyHours,
      weekNumber
    );

    return NextResponse.json({ plan });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Plan generation failed';
    console.error('Plan API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
