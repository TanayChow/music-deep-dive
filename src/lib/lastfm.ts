import { Artist, SimilarArtist, GenreFamily } from './types';

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

async function lastfmFetch<T>(params: Record<string, string>): Promise<T> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new Error('LASTFM_API_KEY not set');

  const url = new URL(LASTFM_BASE);
  url.search = new URLSearchParams({
    ...params,
    api_key: apiKey,
    format: 'json',
  }).toString();

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`Last.fm API error: ${res.statusText}`);
  return res.json() as Promise<T>;
}

interface LastfmArtistInfo {
  artist: {
    name: string;
    mbid?: string;
    url: string;
    image: { '#text': string; size: string }[];
    stats: { listeners: string; playcount: string };
    bio: {
      summary: string;
      content: string;
    };
    tags: {
      tag: { name: string; url: string }[];
    };
    similar: {
      artist: { name: string; url: string; image: { '#text': string; size: string }[] }[];
    };
  };
}

export async function fetchLastfmArtistInfo(artistName: string): Promise<Partial<Artist>> {
  const data = await lastfmFetch<LastfmArtistInfo>({
    method: 'artist.getinfo',
    artist: artistName,
    autocorrect: '1',
  });

  const a = data.artist;
  const imageUrl = a.image?.find((i) => i.size === 'extralarge')?.['#text'] ||
                   a.image?.find((i) => i.size === 'large')?.['#text'];

  // Strip HTML tags from bio
  const cleanBio = a.bio?.summary
    ?.replace(/<a[^>]*>.*?<\/a>/g, '')
    ?.replace(/<[^>]+>/g, '')
    ?.trim();

  const similar: SimilarArtist[] = (a.similar?.artist ?? []).slice(0, 10).map((s, i) => ({
    id: encodeURIComponent(s.name.toLowerCase()),
    name: s.name,
    match: 1 - i * 0.08,
    imageUrl: s.image?.find((img) => img.size === 'large')?.['#text'],
  }));

  return {
    name: a.name,
    bio: cleanBio,
    genres: a.tags?.tag?.map((t) => t.name).slice(0, 5) ?? [],
    imageUrl: imageUrl && imageUrl !== '' ? imageUrl : undefined,
    lastfmUrl: a.url,
    listeners: parseInt(a.stats?.listeners ?? '0'),
    playcount: parseInt(a.stats?.playcount ?? '0'),
    similar,
  };
}

interface LastfmSimilarArtists {
  similarartists: {
    artist: {
      name: string;
      match: string;
      url: string;
      image: { '#text': string; size: string }[];
      mbid?: string;
    }[];
  };
}

export async function fetchSimilarArtists(artistName: string): Promise<SimilarArtist[]> {
  const data = await lastfmFetch<LastfmSimilarArtists>({
    method: 'artist.getsimilar',
    artist: artistName,
    limit: '15',
    autocorrect: '1',
  });

  return (data.similarartists?.artist ?? []).map((a) => ({
    id: encodeURIComponent(a.name.toLowerCase()),
    name: a.name,
    match: parseFloat(a.match),
    imageUrl: a.image?.find((i) => i.size === 'extralarge')?.['#text'] ||
              a.image?.find((i) => i.size === 'large')?.['#text'],
  }));
}

interface LastfmTopTags {
  toptags: {
    tag: { name: string; count: number; url: string }[];
  };
}

export async function fetchTrackTags(
  artist: string,
  track: string
): Promise<string[]> {
  const data = await lastfmFetch<LastfmTopTags>({
    method: 'track.gettoptags',
    artist,
    track,
    autocorrect: '1',
  });

  return (data.toptags?.tag ?? [])
    .filter((t) => t.count > 25)
    .map((t) => t.name)
    .slice(0, 8);
}

interface LastfmAlbumInfo {
  album: {
    name: string;
    artist: string;
    image: { '#text': string; size: string }[];
    releasedate?: string;
    tags?: { tag: { name: string }[] };
    wiki?: { summary: string };
    tracks?: {
      track:
        | { name: string; duration: string; url: string }[]
        | { name: string; duration: string; url: string };
    };
  };
}

export interface AlbumInfo {
  title: string;
  artist: string;
  releaseDate?: string;
  coverArt?: string;
  genres: string[];
  wiki?: string;
  tracks: { name: string; duration: string; url: string }[];
}

export async function fetchLastfmAlbumInfo(
  artist: string,
  album: string
): Promise<AlbumInfo> {
  const data = await lastfmFetch<LastfmAlbumInfo>({
    method: 'album.getinfo',
    artist,
    album,
    autocorrect: '1',
  });

  const a = data.album;
  const coverArt =
    a.image?.find((i) => i.size === 'extralarge')?.['#text'] ||
    a.image?.find((i) => i.size === 'large')?.['#text'];

  const cleanWiki = a.wiki?.summary
    ?.replace(/<a[^>]*>.*?<\/a>/g, '')
    ?.replace(/<[^>]+>/g, '')
    ?.trim();

  const rawTracks = a.tracks?.track ?? [];
  const tracks = Array.isArray(rawTracks) ? rawTracks : [rawTracks];

  return {
    title: a.name,
    artist: a.artist,
    releaseDate: a.releasedate?.trim() || undefined,
    coverArt: coverArt && coverArt !== '' ? coverArt : undefined,
    genres: a.tags?.tag?.map((t) => t.name).slice(0, 5) ?? [],
    wiki: cleanWiki || undefined,
    tracks: tracks.map((t) => ({ name: t.name, duration: t.duration, url: t.url })),
  };
}

export function mapGenreToFamily(genre: string): GenreFamily {
  const g = genre.toLowerCase();
  if (/\brock\b|alternative|indie|grunge|punk/.test(g)) return 'rock';
  if (/\bpop\b|dance|synth/.test(g)) return 'pop';
  if (/hip.?hop|rap|trap|drill/.test(g)) return 'hiphop';
  if (/electronic|techno|house|edm|ambient|trance|dubstep/.test(g)) return 'electronic';
  if (/\bjazz\b|blues|soul|swing/.test(g)) return 'jazz';
  if (/classical|orchestra|symphony|opera|chamber/.test(g)) return 'classical';
  if (/metal|hardcore|doom|thrash|death/.test(g)) return 'metal';
  if (/r&b|rnb|rhythm|funk/.test(g)) return 'rnb';
  if (/country|folk|bluegrass|americana/.test(g)) return 'country';
  return 'other';
}

export const GENRE_FAMILY_COLORS: Record<GenreFamily, string> = {
  rock: '#ef4444',
  pop: '#ec4899',
  hiphop: '#a855f7',
  electronic: '#3b82f6',
  jazz: '#eab308',
  classical: '#22c55e',
  metal: '#7f1d1d',
  rnb: '#f97316',
  country: '#84cc16',
  other: '#64748b',
};
