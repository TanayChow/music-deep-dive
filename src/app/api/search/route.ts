import { NextRequest, NextResponse } from 'next/server';
import { SearchResult } from '@/lib/types';

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

async function lastfmSearch(params: Record<string, string>): Promise<Response> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error('LASTFM_API_KEY not set');

  const url = new URL(LASTFM_BASE);
  url.search = new URLSearchParams({
    ...params,
    api_key: apiKey,
    format: 'json',
  }).toString();

  return fetch(url.toString(), { next: { revalidate: 300 } });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const type = searchParams.get('type'); // 'artist', 'album', or omit for both

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResult[] = [];

  try {
    if (!type || type === 'artist') {
      const res = await lastfmSearch({
        method: 'artist.search',
        artist: q,
        limit: '10',
      });

      if (res.ok) {
        const data = await res.json();
        const artists = data.results?.artistmatches?.artist ?? [];
        for (const artist of artists) {
          const imageUrl =
            (Array.isArray(artist.image)
              ? artist.image.find((i: { size: string; '#text': string }) => i.size === 'extralarge')?.['#text'] ||
                artist.image.find((i: { size: string; '#text': string }) => i.size === 'large')?.['#text']
              : undefined) || undefined;

          results.push({
            type: 'artist',
            id: encodeURIComponent(artist.name),
            title: artist.name,
            subtitle: artist.listeners
              ? `${parseInt(artist.listeners).toLocaleString()} listeners`
              : undefined,
            imageUrl: imageUrl && imageUrl !== '' ? imageUrl : undefined,
          });
        }
      }
    }

    if (!type || type === 'album') {
      const res = await lastfmSearch({
        method: 'album.search',
        album: q,
        limit: '10',
      });

      if (res.ok) {
        const data = await res.json();
        const albums = data.results?.albummatches?.album ?? [];
        for (const album of albums) {
          const imageUrl =
            (Array.isArray(album.image)
              ? album.image.find((i: { size: string; '#text': string }) => i.size === 'extralarge')?.['#text'] ||
                album.image.find((i: { size: string; '#text': string }) => i.size === 'large')?.['#text']
              : undefined) || undefined;

          results.push({
            type: 'album',
            id: encodeURIComponent(album.artist) + '---' + encodeURIComponent(album.name),
            title: album.name,
            subtitle: album.artist,
            imageUrl: imageUrl && imageUrl !== '' ? imageUrl : undefined,
          });
        }
      }
    }
  } catch (error) {
    console.error('Last.fm search error:', error);
  }

  return NextResponse.json({ results });
}
