import { ProductionCredit, CreditPerson } from './types';

const MB_BASE = 'https://musicbrainz.org/ws/2';
const USER_AGENT =
  process.env.MUSICBRAINZ_APP_NAME ?? 'MusicDeepDive/0.1 (music-deep-dive@example.com)';

let lastRequestTime = 0;

async function mbFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  // Rate limiting: max 1 req/sec
  const now = Date.now();
  const wait = 1100 - (now - lastRequestTime);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestTime = Date.now();

  const url = new URL(`${MB_BASE}${path}`);
  url.search = new URLSearchParams({
    fmt: 'json',
    ...(params ?? {}),
  }).toString();

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
    next: { revalidate: 86400 }, // 24 hours
  });

  if (!res.ok) {
    throw new Error(`MusicBrainz API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

interface MBRecording {
  id: string;
  title: string;
  length?: number;
  relations?: MBRelation[];
  releases?: {
    id: string;
    title: string;
    date?: string;
    'label-info'?: {
      label?: { name: string };
    }[];
  }[];
}

interface MBRelation {
  type: string;
  'type-id': string;
  direction: string;
  artist?: {
    id: string;
    name: string;
    'sort-name': string;
    disambiguation?: string;
  };
  attributes?: string[];
  begin?: string;
  end?: string;
}

export async function fetchRecordingCredits(
  recordingId: string
): Promise<ProductionCredit | null> {
  try {
    const data = await mbFetch<MBRecording>(`/recording/${recordingId}`, {
      inc: 'artist-rels+label-rels+work-rels+releases',
    });

    const producers: CreditPerson[] = [];
    const mixingEngineers: CreditPerson[] = [];
    const masteringEngineers: CreditPerson[] = [];

    for (const rel of data.relations ?? []) {
      if (!rel.artist) continue;
      const person: CreditPerson = { name: rel.artist.name };

      const type = rel.type.toLowerCase();
      if (type === 'producer' || type === 'co-producer' || type === 'executive producer') {
        producers.push(person);
      } else if (type === 'mix' || type === 'mixed by' || type === 'mixer') {
        mixingEngineers.push(person);
      } else if (type === 'mastering' || type === 'mastered by') {
        masteringEngineers.push(person);
      }
    }

    const firstRelease = data.releases?.[0];
    const label = firstRelease?.['label-info']?.[0]?.label?.name;

    return {
      trackId: recordingId,
      producers,
      mixingEngineers,
      masteringEngineers,
      recordingDate: firstRelease?.date,
      label,
    };
  } catch (error) {
    console.error('MusicBrainz fetch error:', error);
    return null;
  }
}

interface MBSearchResult {
  recordings: {
    id: string;
    score: number;
    title: string;
    length?: number;
    'artist-credit': { artist: { id: string; name: string } }[];
  }[];
}

export async function searchRecording(
  title: string,
  artist: string
): Promise<string | null> {
  try {
    const query = `recording:"${title}" AND artist:"${artist}"`;
    const data = await mbFetch<MBSearchResult>('/recording', {
      query,
      limit: '1',
    });

    return data.recordings?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

interface MBReleaseSearchResult {
  releases: {
    id: string;
    score: number;
    title: string;
    'artist-credit': { artist: { id: string; name: string } }[];
  }[];
}

interface MBRelease {
  id: string;
  title: string;
  date?: string;
  relations?: MBRelation[];
  'label-info'?: { label?: { name: string } }[];
}

export async function searchRelease(
  albumTitle: string,
  artist: string
): Promise<string | null> {
  try {
    const query = `release:"${albumTitle}" AND artist:"${artist}"`;
    const data = await mbFetch<MBReleaseSearchResult>('/release', {
      query,
      limit: '1',
    });
    return data.releases?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchReleaseCredits(
  releaseId: string
): Promise<ProductionCredit | null> {
  try {
    const data = await mbFetch<MBRelease>(`/release/${releaseId}`, {
      inc: 'artist-rels+label-rels',
    });

    const producers: CreditPerson[] = [];
    const mixingEngineers: CreditPerson[] = [];
    const masteringEngineers: CreditPerson[] = [];

    for (const rel of data.relations ?? []) {
      if (!rel.artist) continue;
      const person: CreditPerson = { name: rel.artist.name };

      const type = rel.type.toLowerCase();
      if (type === 'producer' || type === 'co-producer' || type === 'executive producer') {
        producers.push(person);
      } else if (type === 'mix' || type === 'mixed by' || type === 'mixer') {
        mixingEngineers.push(person);
      } else if (type === 'mastering' || type === 'mastered by') {
        masteringEngineers.push(person);
      }
    }

    const label = data['label-info']?.[0]?.label?.name;

    return {
      trackId: releaseId,
      producers,
      mixingEngineers,
      masteringEngineers,
      recordingDate: data.date,
      label,
    };
  } catch (error) {
    console.error('MusicBrainz release fetch error:', error);
    return null;
  }
}

interface MBArtistResponse {
  id: string;
  name: string;
  'sort-name': string;
  country?: string;
  'begin-area'?: { name: string };
  'life-span'?: { begin?: string; end?: string; ended?: boolean };
  genres?: { name: string }[];
  tags?: { name: string; count: number }[];
  disambiguation?: string;
}

export async function fetchMBArtistInfo(
  mbid: string
): Promise<{ origin?: string; activeYears?: string } | null> {
  try {
    const data = await mbFetch<MBArtistResponse>(`/artist/${mbid}`, {
      inc: 'genres+tags',
    });

    const origin = data['begin-area']?.name ?? data.country;
    const begin = data['life-span']?.begin?.slice(0, 4);
    const end = data['life-span']?.end?.slice(0, 4);
    const ended = data['life-span']?.ended;
    const activeYears = begin
      ? ended && end
        ? `${begin}–${end}`
        : `${begin}–present`
      : undefined;

    return { origin, activeYears };
  } catch {
    return null;
  }
}
