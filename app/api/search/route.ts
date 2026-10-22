import { NextRequest, NextResponse } from 'next/server';
import { searchEntities } from '@/lib/qloo';
import { ENTITY_TYPES } from '@/lib/qloo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const types = searchParams.get('types')?.split(',').filter(Boolean);

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ entities: [] });
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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    console.error('Search API error:', err);
    return NextResponse.json(
      { error: message, entities: [] },
      { status: 500 }
    );
  }
}
