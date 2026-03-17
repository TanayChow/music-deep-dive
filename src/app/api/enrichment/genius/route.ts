import { NextRequest, NextResponse } from 'next/server';
import { fetchGeniusAnnotations } from '@/lib/genius';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get('trackId');
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');

  if (!trackId || !title || !artist) {
    return NextResponse.json(
      { error: 'trackId, title, and artist are required' },
      { status: 400 }
    );
  }

  try {
    const annotations = await fetchGeniusAnnotations(trackId, title, artist);

    if (!annotations) {
      return NextResponse.json({ error: 'No Genius data found' }, { status: 404 });
    }

    return NextResponse.json(annotations, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Genius API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Genius request failed' },
      { status: 500 }
    );
  }
}
