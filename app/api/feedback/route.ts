import { NextRequest, NextResponse } from 'next/server';
import { toolRecordFeedback } from '@/lib/agent';
import type { FeedbackItem, ContentCandidate } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      feedback: FeedbackItem[];
      candidates: ContentCandidate[];
    };

    const { feedback, candidates } = body;

    if (!feedback || feedback.length === 0) {
      return NextResponse.json({ error: 'feedback required' }, { status: 400 });
    }

    const { adjustedCandidates } = await toolRecordFeedback(feedback, candidates);

    return NextResponse.json({
      adjustedCandidates,
      message: `Processed ${feedback.length} feedback items. Adjusted ${adjustedCandidates.length} candidates.`,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Feedback processing failed';
    console.error('Feedback API error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
