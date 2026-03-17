import { NextRequest, NextResponse } from 'next/server';
import { fetchAudioFeatures } from '@/lib/spotify';

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
  const trackId = searchParams.get('trackId');

  if (!trackId) {
    return NextResponse.json({ error: 'trackId is required' }, { status: 400 });
  }

  try {
    const accessToken = await getClientCredentialsToken();
    const features = await fetchAudioFeatures(accessToken, trackId);
    return NextResponse.json(features, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Audio features error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audio features' },
      { status: 500 }
    );
  }
}
