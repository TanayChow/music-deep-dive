# Music Deep Dive — Architecture

## Overview

Music Deep Dive is a Next.js 14 (App Router) web app for music discovery. It aggregates data from four external APIs — Last.fm, MusicBrainz, Genius, and Spotify — to surface production credits, audio analysis, artist relationships, and trivia. No user authentication is required; all API access uses server-side client credentials.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 3 (dark theme) |
| Charts | Recharts (radar chart) |
| LLM | @anthropic-ai/sdk (Claude API) |
| Caching | Browser localStorage (custom TTL store) |

---

## Directory Structure

```
src/
├── app/                        # Next.js App Router pages + API routes
│   ├── page.tsx                # Home — search interface
│   ├── layout.tsx              # Root layout with TopNav
│   ├── globals.css             # Global styles
│   ├── album/[id]/page.tsx     # Album detail page
│   ├── artist/[id]/page.tsx    # Artist detail page
│   ├── track/[id]/page.tsx     # Track detail page
│   ├── producer/[id]/page.tsx  # Producer profile page
│   ├── settings/page.tsx       # Cache stats + API credits
│   └── api/
│       ├── search/route.ts                    # Unified search endpoint
│       ├── now-playing/route.ts               # Apple Music now-playing (macOS AppleScript)
│       ├── enrichment/
│       │   ├── lastfm/route.ts                # Last.fm enrichment
│       │   ├── musicbrainz/route.ts           # MusicBrainz enrichment
│       │   ├── genius/route.ts                # Genius enrichment
│       │   └── llm/route.ts                   # LLM-generated production insights
│       └── spotify/
│           └── audio-features/route.ts        # Audio analysis
├── components/
│   ├── nav/
│   │   ├── TopNav.tsx              # Sticky header + breadcrumbs
│   │   ├── SearchBar.tsx           # Debounced search dropdown
│   │   └── NowPlayingBar.tsx       # Sticky footer showing current Apple Music track
│   ├── artist/
│   │   └── ArtistBio.tsx           # Artist card (bio, genres, stats)
│   ├── album/
│   │   └── LLMInsightsPanel.tsx    # AI-generated production narrative + producer bios
│   ├── track/
│   │   ├── ProductionPanel.tsx     # Producers, engineers, label
│   │   └── TriviaSidebar.tsx       # Genius annotations + facts
│   ├── charts/
│   │   └── AudioDNARadar.tsx       # Recharts radar + gauge bars
│   └── ui/
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useSearch.ts            # Debounced search state hook
│   └── useNowPlaying.ts        # Polls /api/now-playing every 10s
└── lib/
    ├── types.ts                # Shared TypeScript interfaces
    ├── store.ts                # Client-side localStorage cache
    ├── lastfm.ts               # Last.fm API client
    ├── musicbrainz.ts          # MusicBrainz API client (rate-limited)
    ├── genius.ts               # Genius API client
    └── spotify.ts              # Spotify API client
```

---

## Page Routes

| Route | Page | Data Sources |
|---|---|---|
| `/` | Home | `/api/search` (Last.fm) |
| `/artist/[id]` | Artist | Last.fm bio + similar artists |
| `/album/[id]` | Album | Last.fm album info + MusicBrainz credits + LLM insights |
| `/track/[id]` | Track | Last.fm tags, MusicBrainz credits, Genius trivia, Spotify audio features |
| `/producer/[id]` | Producer | Static producer data |
| `/settings` | Settings | localStorage cache stats |

---

## API Routes

All API routes are Next.js Route Handlers under `/app/api/`. They act as a server-side proxy to external APIs, keeping API keys out of the browser.

### `GET /api/search`
Queries Last.fm for artists and albums.

| Param | Description |
|---|---|
| `q` | Search query |
| `type` | `artist` \| `album` (default: both) |

Returns `SearchResult[]`:
```ts
{ type: 'artist' | 'album', id: string, title: string, subtitle?: string, imageUrl?: string }
```

Album IDs encode both artist and album name using a triple-dash separator:
```
encodeURIComponent(artist) + '---' + encodeURIComponent(albumName)
```

### `GET /api/enrichment/lastfm`
Multi-purpose Last.fm enrichment endpoint.

| `type` param | Required params | Returns |
|---|---|---|
| `bio` | `artist` | Artist bio, genres, listeners, similar artists |
| `similar` | `artist` | List of similar artists with match scores |
| `tags` | `artist`, `track` | Track genre tags |
| `album` | `artist`, `album` | Album metadata, tracklist, wiki |

### `GET /api/enrichment/musicbrainz`
Returns production credits. Selection logic (checked in order):

1. `album` + `artist` → `searchRelease` → `fetchReleaseCredits`
2. `recordingId` → `fetchRecordingCredits`
3. `title` + `artist` → `searchRecording` → `fetchRecordingCredits`
4. `artistMbid` → `fetchMBArtistInfo`

Responses are cached for 24h via `Cache-Control` headers.

### `GET /api/enrichment/genius`
Fetches annotations and facts for a track.

| Param | Description |
|---|---|
| `title` | Track title |
| `artist` | Artist name |

### `GET /api/enrichment/llm`
Returns AI-generated production insights for an album or artist.

| Param | Description |
|---|---|
| `artist` | Artist name (required) |
| `album` | Album title (required when `type=album`) |
| `type` | `album` (default) \| `artist` |

Uses `claude-sonnet-4-6` by default; set `LLM_PROVIDER=openai` to use GPT-4o instead. Responses are cached for 1h via `Cache-Control` headers. Returns `LLMInsights`:
```ts
{ subject: string, type: 'album' | 'artist', productionProcess: string, producers: ProducerInfo[] }
```

### `GET /api/now-playing`
Returns the currently playing track from the macOS Apple Music app via AppleScript. macOS-only; always returns `Cache-Control: no-store`.

Returns `NowPlayingTrack | null`:
```ts
{ track: string, artist: string, album: string, isPlaying: boolean }
```

### `GET /api/spotify/audio-features`
Returns `AudioFeatures` (BPM, key, energy, danceability, valence, etc.) for a track.

---

## Data Flow

```
Browser
  │
  ├─ useSearch hook (debounced)
  │     └─→ GET /api/search
  │               └─→ Last.fm album.search / artist.search
  │
  ├─ Artist page
  │     └─→ GET /api/enrichment/lastfm?type=bio
  │               └─→ Last.fm artist.getinfo + artist.getsimilar
  │
  ├─ Album page (parallel fetches)
  │     ├─→ GET /api/enrichment/lastfm?type=album
  │     │         └─→ Last.fm album.getinfo
  │     ├─→ GET /api/enrichment/musicbrainz?album=...&artist=...
  │     │         └─→ MusicBrainz /release search + /release/{id}?inc=artist-rels
  │     └─→ GET /api/enrichment/llm?type=album&artist=...&album=...
  │               └─→ Claude (claude-sonnet-4-6) or OpenAI (gpt-4o)
  │
  └─ Track page (parallel fetches)
        ├─→ GET /api/enrichment/lastfm?type=tags
        ├─→ GET /api/enrichment/musicbrainz?title=...&artist=...
        ├─→ GET /api/enrichment/genius?title=...&artist=...
        └─→ GET /api/spotify/audio-features?trackId=...
```

---

## Client-Side Cache (`src/lib/store.ts`)

All enrichment data is cached in `localStorage` with TTL expiration to avoid redundant API calls within a session.

- **Key prefix:** `mdd_cache_`
- **TTL:** configurable per call (minutes)
- **Typed accessors:**
  - `store.getArtist(id)` / `store.setArtist(id, artist)`
  - `store.getAudioFeatures(id)` / `store.setAudioFeatures(id, features)`
  - `store.getCredits(id)` / `store.setCredits(id, credits)`
  - `store.getLLMInsights(id)` / `store.setLLMInsights(id, insights)`
- Cache stats (key count, storage size) are surfaced on the `/settings` page.

---

## Key Types (`src/lib/types.ts`)

```ts
Artist            // Bio, genres, origin, images, similar artists, listener stats
SimilarArtist     // { id, name, match: number (0–1), imageUrl? }
AudioFeatures     // BPM, key, mode, energy, danceability, valence, acousticness, ...
ProductionCredit  // { producers, mixingEngineers, masteringEngineers, label, recordingDate, ... }
CreditPerson      // { name, id?, bio?, techniques?, notableWorks? }
SearchResult      // { type, id, title, subtitle?, imageUrl? }
GeniusAnnotation  // { url, lyrics?, description?, facts?, annotations? }
LLMInsights       // { subject, type: 'album'|'artist', productionProcess, producers: ProducerInfo[] }
ForceGraphNode    // { id, name, type, val? } — for force-directed graph visualisation
ForceGraphLink    // { source, target, value? }
GenreFamily       // Enum: rock | pop | hiphop | electronic | jazz | classical | country | ...
```

---

## External APIs

| API | Auth | Usage | Rate Limit |
|---|---|---|---|
| Last.fm | API key (`LASTFM_API_KEY`) | Search, artist bio, album info, similar artists | None enforced client-side |
| MusicBrainz | None (User-Agent header) | Recording/release credits, artist origin | 1 req/sec (enforced in `mbFetch`) |
| Genius | Bearer token (`GENIUS_ACCESS_TOKEN`) | Track annotations and facts | None enforced |
| Spotify | Client credentials (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`) | Audio features | Token auto-refreshed |
| Claude (Anthropic) | API key (`ANTHROPIC_API_KEY`) | LLM production insights (default provider) | Model-dependent |
| OpenAI | API key (`OPENAI_API_KEY`) | LLM production insights (optional, set `LLM_PROVIDER=openai`) | Model-dependent |

Required environment variables:
```
LASTFM_API_KEY=
GENIUS_ACCESS_TOKEN=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=          # optional — only needed if LLM_PROVIDER=openai
LLM_PROVIDER=            # optional — "claude" (default) or "openai"
MUSICBRAINZ_APP_NAME=    # optional — defaults to MusicDeepDive/0.1
```

---

## Styling

Tailwind CSS with a custom dark theme defined in `tailwind.config.js`:

| Token | Value | Usage |
|---|---|---|
| `bg-bg-primary` | `#0a0a0f` | Page background |
| `bg-bg-secondary` | `#12121a` | Input / subtle backgrounds |
| `bg-bg-card` | `#1a1a24` | Card surfaces |
| `accent-spotify` | Spotify green | Primary accent, links, CTAs |
| `border` | `#2a2a3a` | Card/input borders |

---

## Build & Development

```bash
npm install
# Create .env.local and populate the required keys listed in the External APIs section above
npm run dev                  # localhost:3000
npm run build                # production build
npm run lint                 # ESLint
npm run type-check           # TypeScript type check (no emit)
```
