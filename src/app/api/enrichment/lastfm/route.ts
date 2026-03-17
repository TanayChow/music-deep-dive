import { NextRequest, NextResponse } from 'next/server';
import { fetchLastfmArtistInfo, fetchSimilarArtists, fetchTrackTags, fetchLastfmAlbumInfo } from '@/lib/lastfm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const track = searchParams.get('track');
  const album = searchParams.get('album');
  const type = searchParams.get('type') ?? 'bio';

  if (!artist) {
    return NextResponse.json({ error: 'artist is required' }, { status: 400 });
  }

  try {
    let data: unknown;

    switch (type) {
      case 'bio':
        data = await fetchLastfmArtistInfo(artist);
        break;
      case 'similar':
        data = await fetchSimilarArtists(artist);
        break;
      case 'tags':
        if (!track) {
          return NextResponse.json({ error: 'track is required for tags' }, { status: 400 });
        }
        data = await fetchTrackTags(artist, track);
        break;
      case 'album':
        if (!album) {
          return NextResponse.json({ error: 'album is required for album type' }, { status: 400 });
        }
        data = await fetchLastfmAlbumInfo(artist, album);
        break;
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Last.fm API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Last.fm request failed' },
      { status: 500 }
    );
  }
}
