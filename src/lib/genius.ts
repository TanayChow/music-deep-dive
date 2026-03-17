import { GeniusAnnotation } from './types';

const GENIUS_BASE = 'https://api.genius.com';

async function geniusFetch<T>(path: string): Promise<T> {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) throw new Error('GENIUS_ACCESS_TOKEN not set');

  const res = await fetch(`${GENIUS_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 3600 * 24 },
  });

  if (!res.ok) throw new Error(`Genius API error: ${res.statusText}`);
  return res.json() as Promise<T>;
}

interface GeniusSearchResponse {
  response: {
    hits: {
      type: string;
      result: {
        id: number;
        title: string;
        url: string;
        primary_artist: { name: string };
        description?: { plain: string };
        song_art_image_url?: string;
      };
    }[];
  };
}

interface GeniusSongResponse {
  response: {
    song: {
      id: number;
      title: string;
      url: string;
      description: { plain: string };
      facts?: string[];
      primary_artist: { name: string };
      producer_artists?: { name: string; id: number }[];
      writer_artists?: { name: string; id: number }[];
      recording_location?: string;
      release_date_for_display?: string;
      featured_artists?: { name: string }[];
    };
  };
}

export async function fetchGeniusAnnotations(
  trackId: string,
  title: string,
  artist: string
): Promise<GeniusAnnotation | null> {
  try {
    const searchData = await geniusFetch<GeniusSearchResponse>(
      `/search?q=${encodeURIComponent(`${artist} ${title}`)}`
    );

    const hit = searchData.response?.hits?.find(
      (h) =>
        h.type === 'song' &&
        h.result.primary_artist.name.toLowerCase().includes(artist.toLowerCase())
    ) ?? searchData.response?.hits?.[0];

    if (!hit) return null;

    const songData = await geniusFetch<GeniusSongResponse>(
      `/songs/${hit.result.id}`
    );

    const song = songData.response?.song;
    if (!song) return null;

    const description = song.description?.plain?.trim();
    const producerNames = song.producer_artists?.map((p) => p.name) ?? [];
    const writerNames = song.writer_artists?.map((w) => w.name) ?? [];

    const facts: string[] = [];
    if (song.recording_location) facts.push(`Recorded at: ${song.recording_location}`);
    if (song.release_date_for_display) facts.push(`Released: ${song.release_date_for_display}`);
    if (producerNames.length > 0) facts.push(`Produced by: ${producerNames.join(', ')}`);
    if (writerNames.length > 0) facts.push(`Written by: ${writerNames.join(', ')}`);
    if (song.featured_artists && song.featured_artists.length > 0) {
      facts.push(`Featuring: ${song.featured_artists.map((f) => f.name).join(', ')}`);
    }

    return {
      trackId,
      url: song.url,
      description: description || undefined,
      facts: facts.length > 0 ? facts : undefined,
    };
  } catch (error) {
    console.error('Genius API error:', error);
    return null;
  }
}
