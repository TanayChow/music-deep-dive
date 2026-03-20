# Deployment Strategy

## Recommended Platform: Vercel Hobby (Free)

Vercel is the right choice for this app:

- **Zero-config Next.js 14 App Router support** — Vercel built Next.js; all route handlers, image optimization, and `Cache-Control` headers work out of the box
- **Free Hobby tier** covers personal use: 100 GB bandwidth/month, 100k function invocations/day, 10s function timeout
- **CDN caching mitigates the MusicBrainz rate limit** — API routes already set `s-maxage=86400`, so Vercel's edge cache serves repeat queries without hitting MusicBrainz again
- **Automatic deploys** on every push to `main`; preview URLs for every PR

Total monthly cost: **$0**

---

## Environment Variables

### Currently Required (5)

Set these in Vercel Dashboard → Settings → Environment Variables (mark all as Sensitive):

| Variable | Where to get it |
|----------|----------------|
| `LASTFM_API_KEY` | [last.fm/api/account/create](https://www.last.fm/api/account/create) |
| `SPOTIFY_CLIENT_ID` | [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | Same Spotify app |
| `GENIUS_ACCESS_TOKEN` | [genius.com/api-clients](https://genius.com/api-clients) — use "Client Access Token" |
| `MUSICBRAINZ_APP_NAME` | No account needed — set to e.g. `MusicDeepDive/0.1 (you@example.com)` |

### Deferred (for unbuilt features)

These appear in `.env.local.example` but have no corresponding source code yet. Add them when building those features:

| Variable | Feature |
|----------|---------|
| `NEXTAUTH_URL` | NextAuth (not yet installed) |
| `NEXTAUTH_SECRET` | NextAuth |
| `GOOGLE_CLIENT_ID` | YouTube OAuth |
| `GOOGLE_CLIENT_SECRET` | YouTube OAuth |
| `YOUTUBE_API_KEY` | YouTube Data API |
| `LASTFM_SHARED_SECRET` | Last.fm write operations |
| `NEXT_PUBLIC_APPLE_MUSIC_DEVELOPER_TOKEN` | Apple MusicKit JS (client-side) |

---

## Deployment Steps

### 1. Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/music-deep-dive.git
git push -u origin main
```

Confirm `.env.local` is gitignored (it already is).

### 2. Create Vercel Project

1. Sign in at [vercel.com](https://vercel.com) with GitHub
2. Click **Add New Project** → Import the `music-deep-dive` repo
3. Vercel auto-detects Next.js — build settings are pre-filled correctly
4. **Do not deploy yet** — add environment variables first

### 3. Add Environment Variables

In Vercel → Settings → Environment Variables, add the 5 currently-required vars listed above.

### 4. Deploy

Click **Deploy**. Build takes ~60 seconds. Your app is live at `https://music-deep-dive.vercel.app`.

### 5. (Optional) Add a Custom Domain

Vercel → Settings → Domains → add your domain. SSL is provisioned automatically.

---

## CI/CD

### What Vercel Provides Automatically

- Production deploy on every push to `main`
- Preview deployment for every pull request (unique URL per PR)
- Deploy blocked if `npm run build` fails

### GitHub Actions (`.github/workflows/ci.yml`)

An optional quality gate that runs lint + type-check + build before Vercel deploys. No API keys are needed in CI — all env vars are read at runtime in Route Handlers, not at build time.

---

## Architecture Notes

### MusicBrainz Rate Limiter

`src/lib/musicbrainz.ts` uses a module-level `let lastRequestTime = 0` to enforce 1 req/sec. This is per-process, so on serverless (Vercel) it does not protect against two concurrent cold-start function instances both firing simultaneously.

**Practical mitigation:** The `s-maxage=86400` headers on all API routes mean each unique query is cached at Vercel's CDN edge for 24 hours. MusicBrainz only gets called once per unique request per day, regardless of how many users trigger that same query. The in-process delay still correctly throttles sequential calls within a single function invocation (e.g., `searchRelease` → `fetchReleaseCredits` in one route handler).

If 429 errors from MusicBrainz appear in practice, switch to Railway (persistent process, ~$5/month) where the module-level state persists between requests.

### Function Execution Time

`src/app/api/enrichment/musicbrainz/route.ts` chains two sequential MusicBrainz calls with a ~1.1s enforced delay between them, so execution can take 2+ seconds. Vercel Hobby's 10-second function timeout is sufficient.

### No Files Required for Deployment

The app deploys to Vercel as-is. No `Dockerfile`, no `vercel.json`, and no `next.config.js` changes are needed.

---

## Alternative Platforms

| Platform | Cost | Best For |
|----------|------|----------|
| **Vercel Hobby** | **$0** | **This app — recommended** |
| Railway Hobby | ~$5/mo | When you add a database, WebSockets, or background jobs |
| Render Starter | $7/mo | Persistent process alternative to Railway |
| Render Free | $0 | Avoid — 30–50s cold start delays |
| Hetzner VPS | ~$4.15/mo | Multiple apps, want full control |

### When to Upgrade from Vercel

Switch to Railway when you add:
- A database (PostgreSQL, Redis)
- Persistent WebSocket connections
- Background/cron jobs
- Or if MusicBrainz 429 errors appear due to concurrent serverless instances

### All APIs Are Free

| API | Cost |
|-----|------|
| Last.fm | Free |
| MusicBrainz | Free |
| Genius | Free |
| Spotify (Client Credentials) | Free |
| YouTube Data API v3 | Free (10,000 units/day quota) |
| Apple MusicKit | Free (requires Apple Developer account, $99/yr if creating new) |
