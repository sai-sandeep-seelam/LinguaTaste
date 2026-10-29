import { NextRequest, NextResponse } from 'next/server';
import { searchEntities, ENTITY_TYPES } from '@/lib/qloo';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    const types = searchParams.get('types')?.split(',').filter(Boolean);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ entities: [], source: 'live' });
    }

    // Map type names to Qloo URNs
    const qlooTypes = types?.map(t => {
      const key = t as keyof typeof ENTITY_TYPES;
      return ENTITY_TYPES[key] || t;
    });

    const result = await searchEntities(query.trim(), qlooTypes, 8);
    
    return NextResponse.json({
      entities: result.entities.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        imageUrl: e.images?.[0]?.url,
        description: (e.properties?.description as string) || '',
        creator: (e.properties?.director as string) ||
                 (e.properties?.artist as string) ||
                 (e.properties?.author as string) || '',
      })),
      source: result.source,
      error: result.error,
    });
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith?.('NEXT_PRERENDER')) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Search failed';
    console.error('Search API error:', err);
    return NextResponse.json(
      { error: message, entities: [], source: 'simulated' },
      { status: 500 }
    );
  }
}
