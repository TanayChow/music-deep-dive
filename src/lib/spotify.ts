import { AudioFeatures, Artist, SimilarArtist } from './types';

const SPOTIFY_BASE = 'https://api.spotify.com/v1';

async function spotifyFetch<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${SPOTIFY_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`Spotify API error: ${err.error?.message ?? res.statusText}`);
  }
  return res.json() as Promise<T>;
}

interface SpotifyAudioFeaturesResponse {
  tempo: number;
  key: number;
  mode: number;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  time_signature: number;
}

const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export async function fetchAudioFeatures(
  accessToken: string,
  trackId: string
): Promise<AudioFeatures> {
  const data = await spotifyFetch<SpotifyAudioFeaturesResponse>(
    `/audio-features/${trackId}`,
    accessToken
  );

  return {
    bpm: Math.round(data.tempo),
    key: `${KEY_NAMES[data.key] ?? '?'} ${data.mode === 1 ? 'Major' : 'Minor'}`,
    energy: data.energy,
    danceability: data.danceability,
    valence: data.valence,
    acousticness: data.acousticness,
    instrumentalness: data.instrumentalness,
    liveness: data.liveness,
    loudness: data.loudness,
    speechiness: data.speechiness,
    timeSignature: data.time_signature,
    mode: data.mode === 1 ? 'Major' : 'Minor',
  };
}

interface SpotifyArtistResponse {
  id: string;
  name: string;
  genres: string[];
  images: { url: string }[];
  followers: { total: number };
  popularity: number;
  external_urls: { spotify: string };
}

export async function fetchSpotifyArtist(
  accessToken: string,
  artistId: string
): Promise<Partial<Artist>> {
  const data = await spotifyFetch<SpotifyArtistResponse>(
    `/artists/${artistId}`,
    accessToken
  );

  return {
    id: artistId,
    name: data.name,
    genres: data.genres,
    imageUrl: data.images[0]?.url,
    spotifyId: data.id,
    listeners: data.followers.total,
  };
}

interface SpotifyRelatedArtistsResponse {
  artists: SpotifyArtistResponse[];
}

export async function fetchRelatedArtists(
  accessToken: string,
  artistId: string
): Promise<SimilarArtist[]> {
  const data = await spotifyFetch<SpotifyRelatedArtistsResponse>(
    `/artists/${artistId}/related-artists`,
    accessToken
  );

  return data.artists.slice(0, 12).map((a, i) => ({
    id: a.id,
    name: a.name,
    match: 1 - i * 0.07,
    imageUrl: a.images[0]?.url,
  }));
}
