# Music Deep Dive

A music discovery app that lets you search for any artist or album and surfaces production credits, audio analysis, artist relationships, and track trivia — no account or login required.

## Features

- **Artist & Album Search** — search Last.fm's catalog instantly from the nav bar
- **Artist Pages** — biography, genre tags, listener stats, and similar artists from Last.fm
- **Album Pages** — cover art, tracklist, release info, and production credits from MusicBrainz
- **Track Pages** — audio DNA radar (BPM, energy, danceability, valence via Spotify), production credits, and trivia from Genius
- **Producer Pages** — producer profile with notable works
- **No login required** — all API access uses server-side client credentials

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS (custom dark theme)
- **Charts**: Recharts (radar chart)
- **Data sources**: Last.fm, MusicBrainz, Genius, Spotify (client credentials)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your API keys (see below).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Where to get it |
|---|---|
| `LASTFM_API_KEY` | [last.fm/api/account/create](https://www.last.fm/api/account/create) |
| `GENIUS_ACCESS_TOKEN` | [genius.com/api-clients](https://genius.com/api-clients) |
| `SPOTIFY_CLIENT_ID` | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | Same as above |
| `MUSICBRAINZ_APP_NAME` | Optional — any string e.g. `MyApp/1.0 (email@example.com)` |

### Spotify Setup

No user login needed. Create an app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), copy the Client ID and Client Secret — the app uses the client credentials flow server-side.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run dev:https` | Start dev server with HTTPS (uses certs in `certificates/`) |
| `npm run dev:turbo` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type check (no emit) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                # Home: search interface
│   ├── artist/[id]/page.tsx    # Artist: bio + similar artists
│   ├── album/[id]/page.tsx     # Album: tracklist + credits + wiki
│   ├── track/[id]/page.tsx     # Track: audio DNA + credits + trivia
│   ├── producer/[id]/page.tsx  # Producer profile
│   ├── settings/page.tsx       # Cache stats
│   └── api/
│       ├── search/             # Last.fm artist + album search
│       ├── enrichment/         # Last.fm, MusicBrainz, Genius
│       └── spotify/            # Audio features
├── components/
│   ├── nav/                    # TopNav + SearchBar
│   ├── artist/                 # ArtistBio
│   ├── charts/                 # AudioDNARadar
│   ├── track/                  # ProductionPanel, TriviaSidebar
│   └── ui/                     # LoadingSpinner
├── lib/
│   ├── store.ts                # localStorage cache with TTL
│   ├── lastfm.ts               # Last.fm API client
│   ├── musicbrainz.ts          # MusicBrainz client (rate-limited 1 req/s)
│   ├── genius.ts               # Genius API client
│   ├── spotify.ts              # Spotify client credentials flow
│   └── types.ts                # Shared TypeScript types
└── hooks/
    └── useSearch.ts            # Debounced search state
```

## Data Flow

1. User types in the search bar → debounced query hits `/api/search` → Last.fm returns artists and albums
2. Clicking an artist fetches bio + similar artists from Last.fm (cached in `localStorage`)
3. Clicking an album fetches tracklist from Last.fm and production credits from MusicBrainz (parallel, cached)
4. Visiting a track page fetches audio features (Spotify), production credits (MusicBrainz), and trivia (Genius) in parallel — all cached

## Notes

- MusicBrainz is rate-limited to 1 request/second server-side
- All enrichment data is cached in `localStorage` with TTL expiry — cache stats visible at `/settings`
- Spotify audio features may be unavailable for new developer apps; the UI falls back gracefully
