# Music Deep Dive

A personal music analytics and discovery app that aggregates listening history across Spotify, Apple Music, and YouTube Music, enriched with metadata, production credits, and trivia.

## Features

- **Unified History Feed** — paginated timeline of all plays across platforms, filterable by platform and date range
- **Era & Genre Chart** — bubble chart visualizing your listening by decade and genre
- **Audio DNA** — Spotify-powered radar chart showing energy, danceability, valence, acousticness, instrumentalness, and liveness for any track
- **Similar Artists Graph** — force-directed graph of related artists (Spotify or Last.fm)
- **Production Credits** — producers, mixing/mastering engineers, and studio info via MusicBrainz
- **Track Trivia** — descriptions and facts from Genius
- **Artist Bios** — biography, genre tags, and listener stats from Last.fm
- **Global Search** — instant client-side search over your local history
- **All data stored locally** — localStorage / no backend database

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (dark theme)
- **Charts**: Recharts (Scatter + Radar)
- **Graph**: react-force-graph-2d (canvas, SSR-disabled)
- **Auth**: NextAuth.js v4 (Spotify + Google OAuth)
- **Data sources**: Spotify Web API, Apple MusicKit JS, YouTube Data API v3, Last.fm, MusicBrainz, Genius

## Quick Start

### 1. Install dependencies

```bash
cd music-deep-dive
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in all API keys (see below).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Where to get it |
|---|---|
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `SPOTIFY_CLIENT_ID` | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | Same as above |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/) — OAuth 2.0 client |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `YOUTUBE_API_KEY` | Google Cloud Console — YouTube Data API v3 |
| `NEXT_PUBLIC_APPLE_MUSIC_DEVELOPER_TOKEN` | Apple Developer account — MusicKit key |
| `LASTFM_API_KEY` | [Last.fm API account](https://www.last.fm/api/account/create) |
| `LASTFM_SHARED_SECRET` | Same as above |
| `GENIUS_ACCESS_TOKEN` | [Genius API clients](https://genius.com/api-clients) |
| `MUSICBRAINZ_APP_NAME` | Any string like `MyApp/1.0 (email@example.com)` |

### Spotify Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Add `http://localhost:3000/api/auth/callback/spotify` as a Redirect URI
4. Copy Client ID and Client Secret

### Google / YouTube Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable **YouTube Data API v3**
3. Create OAuth 2.0 credentials (Web application)
4. Add `http://localhost:3000/api/auth/callback/google` as an Authorized redirect URI
5. Copy Client ID and Client Secret

### Apple Music Setup

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a MusicKit key under Certificates, Identifiers & Profiles
3. Generate a developer token (JWT signed with the key) — see [Apple docs](https://developer.apple.com/documentation/applemusicapi/generating_developer_tokens)
4. Set `NEXT_PUBLIC_APPLE_MUSIC_DEVELOPER_TOKEN` to the JWT string

### Last.fm Setup

1. Create an API account at [last.fm/api](https://www.last.fm/api/account/create)
2. Copy API Key and Shared Secret

### Genius Setup

1. Create a client at [genius.com/api-clients](https://genius.com/api-clients)
2. Copy the Client Access Token

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with TopNav
│   ├── page.tsx                # Home: history feed + era/genre chart
│   ├── track/[id]/page.tsx     # Track: Audio DNA + production + trivia
│   ├── artist/[id]/page.tsx    # Artist: bio + similar graph + plays
│   ├── album/[id]/page.tsx     # Album: tracklist
│   ├── producer/[id]/page.tsx  # Producer spotlight
│   ├── settings/page.tsx       # Platform connections + data management
│   └── api/
│       ├── auth/[...nextauth]/ # NextAuth handler
│       ├── spotify/            # History, audio features, related artists
│       ├── apple-music/        # Apple Music history
│       ├── youtube/            # YouTube history
│       ├── enrichment/         # Last.fm, MusicBrainz, Genius
│       └── search/             # Spotify catalog search
├── components/
│   ├── nav/                    # TopNav + SearchBar
│   ├── feed/                   # HistoryFeed, TrackRow, FeedFilters
│   ├── charts/                 # EraGenreChart, AudioDNARadar
│   ├── artist/                 # ArtistBio, SimilarArtistsGraph, ProducerSpotlightCard
│   ├── track/                  # ProductionPanel, TriviaSidebar
│   ├── album/                  # TrackList
│   └── ui/                     # PlatformBadge, LoadingSpinner
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── store.ts                # localStorage helpers
│   ├── spotify.ts              # Spotify API client
│   ├── apple-music.ts          # MusicKit JS helpers
│   ├── youtube.ts              # YouTube Data API helpers
│   ├── lastfm.ts               # Last.fm API client
│   ├── musicbrainz.ts          # MusicBrainz client (rate-limited)
│   ├── genius.ts               # Genius API client
│   └── types.ts                # Shared TypeScript types
└── hooks/
    ├── useHistory.ts           # Read/filter local history
    ├── useSearch.ts            # Client-side search
    └── usePlatformSync.ts      # Orchestrate platform syncs
```

## Data Flow

1. User connects Spotify or Google in **Settings**
2. Clicking "Sync" fetches recent plays from the platform API route
3. Tracks are deduplicated and persisted in `localStorage` via `store`
4. The home feed reads from `localStorage` — no API calls needed to browse history
5. Visiting a track page fetches audio features (Spotify), production credits (MusicBrainz), and trivia (Genius) — results are cached in `localStorage`
6. Artist pages fetch bio + similar artists from Spotify or Last.fm — also cached

## Notes

- MusicBrainz is rate-limited to 1 request/second server-side
- Spotify audio features API may be deprecated for new apps — the UI gracefully falls back if unavailable
- Apple Music history does not return `played_at` timestamps; play times default to the current date
- All cached data has TTLs: audio features (7 days), production credits (30 days), artist info (7 days)
