import { NextRequest } from 'next/server';
import { resolveAvailabilityBatch, type AvailabilityRequest } from '@/lib/availability';

/**
 * POST /api/availability
 * Body: { items: AvailabilityRequest[] }
 * Returns: { results: Record<entityId, AvailabilityResult> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { items?: AvailabilityRequest[] };
    const items = body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'items array is required' }, { status: 400 });
    }

    const resultsMap = await resolveAvailabilityBatch(items, 4);
    const results: Record<string, unknown> = {};
    resultsMap.forEach((v, k) => { results[k] = v; });

    return Response.json({ results });
  } catch (err) {
    console.error('[api/availability]', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
