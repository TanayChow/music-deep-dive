import { NextRequest, NextResponse } from 'next/server';
import { fetchRecordingCredits, searchRecording, fetchMBArtistInfo, searchRelease, fetchReleaseCredits } from '@/lib/musicbrainz';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recordingId = searchParams.get('recordingId');
  const artistMbid = searchParams.get('artistMbid');
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');
  const album = searchParams.get('album');

  try {
    // Album credits by artist + album name
    if (album && artist) {
      const releaseId = await searchRelease(album, artist);
      if (!releaseId) {
        return NextResponse.json({ error: 'Release not found' }, { status: 404 });
      }
      const credits = await fetchReleaseCredits(releaseId);
      return NextResponse.json(credits ?? {}, {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    // Lookup recording credits by MBID
    if (recordingId) {
      const credits = await fetchRecordingCredits(recordingId);
      return NextResponse.json(credits ?? {}, {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    // Search for a recording MBID
    if (title && artist) {
      const mbid = await searchRecording(title, artist);
      if (!mbid) {
        return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
      }
      const credits = await fetchRecordingCredits(mbid);
      return NextResponse.json(credits ?? {}, {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    // Artist info by MBID
    if (artistMbid) {
      const info = await fetchMBArtistInfo(artistMbid);
      return NextResponse.json(info ?? {}, {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    return NextResponse.json(
      { error: 'Provide recordingId, (title + artist), or artistMbid' },
      { status: 400 }
    );
  } catch (error) {
    console.error('MusicBrainz API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'MusicBrainz request failed' },
      { status: 500 }
    );
  }
}
