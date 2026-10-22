import { NextRequest } from 'next/server';
import { resolveArtworkBatch, type ArtworkRequest } from '@/lib/artwork';

/**
 * POST /api/artwork
 * Body: { items: ArtworkRequest[] }
 * Returns: { results: Record<entityId, ArtworkResult> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { items?: ArtworkRequest[] };
    const items = body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'items array is required' }, { status: 400 });
    }

    const resultsMap = await resolveArtworkBatch(items, 4);
    const results: Record<string, unknown> = {};
    resultsMap.forEach((v, k) => { results[k] = v; });

    return Response.json({ results });
  } catch (err) {
    console.error('[api/artwork]', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
