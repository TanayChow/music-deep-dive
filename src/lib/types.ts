export interface Artist {
  id: string;
  name: string;
  bio?: string;
  genres?: string[];
  activeYears?: string;
  origin?: string;
  imageUrl?: string;
  spotifyId?: string;
  lastfmUrl?: string;
  listeners?: number;
  playcount?: number;
  similar?: SimilarArtist[];
}

export interface SimilarArtist {
  id: string;
  name: string;
  match: number; // 0-1
  imageUrl?: string;
}

export interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number; // 0-1
  danceability: number; // 0-1
  valence: number; // 0-1
  acousticness: number; // 0-1
  instrumentalness: number; // 0-1
  liveness: number; // 0-1
  loudness?: number; // dB
  speechiness?: number; // 0-1
  timeSignature?: number;
  mode?: 'Major' | 'Minor';
}

export interface ProductionCredit {
  trackId: string;
  producers: CreditPerson[];
  mixingEngineers: CreditPerson[];
  masteringEngineers: CreditPerson[];
  studio?: { name: string; location?: string };
  notableGear?: string[];
  recordingDate?: string;
  label?: string;
}

export interface CreditPerson {
  name: string;
  id?: string;
  bio?: string;
  techniques?: string;
  notableWorks?: string[];
}

export interface Producer {
  id: string;
  name: string;
  bio?: string;
  signatureStyle?: string;
  notableAlbums?: string[];
  collaborators?: string[];
  peakEra?: string;
  imageUrl?: string;
  genres?: string[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  releaseDate?: string;
  coverArt?: string;
  spotifyId?: string;
  label?: string;
  totalTracks?: number;
  genres?: string[];
}

export interface GeniusAnnotation {
  trackId: string;
  url?: string;
  lyrics?: string;
  annotations?: {
    fragment: string;
    annotation: string;
  }[];
  description?: string;
  facts?: string[];
}

export interface SearchResult {
  type: 'track' | 'artist' | 'album';
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

export interface ForceGraphNode {
  id: string;
  name: string;
  val: number;
  color: string;
  imageUrl?: string;
  isCenter?: boolean;
  x?: number;
  y?: number;
}

export interface ForceGraphLink {
  source: string;
  target: string;
  value: number;
}

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}

export interface LLMProducer {
  name?: string;
  role?: string;
  bio?: string;
  [key: string]: string | undefined;
}

export interface LLMInsights {
  subject: string;
  type: 'album' | 'artist';
  productionProcess: Record<string, string> | string;
  producers: (LLMProducer | string)[];
}

export type GenreFamily =
  | 'rock'
  | 'pop'
  | 'hiphop'
  | 'electronic'
  | 'jazz'
  | 'classical'
  | 'metal'
  | 'rnb'
  | 'country'
  | 'other';
