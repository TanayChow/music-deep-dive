import { NextRequest, NextResponse } from 'next/server';
import { fetchRelatedArtists, fetchSpotifyArtist } from '@/lib/spotify';

async function getClientCredentialsToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!response.ok) {
    throw new Error(`Spotify token error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get('artistId');

  if (!artistId) {
    return NextResponse.json({ error: 'artistId is required' }, { status: 400 });
  }

  try {
    const accessToken = await getClientCredentialsToken();
    const [artist, similar] = await Promise.all([
      fetchSpotifyArtist(accessToken, artistId),
      fetchRelatedArtists(accessToken, artistId),
    ]);

    return NextResponse.json({ artist, similar }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Related artists error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch related artists' },
      { status: 500 }
    );
  }
}
