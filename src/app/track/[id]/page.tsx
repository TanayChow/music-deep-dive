'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AudioFeatures, ProductionCredit, GeniusAnnotation } from '@/lib/types';
import { store } from '@/lib/store';
import { AudioDNARadar } from '@/components/charts/AudioDNARadar';
import { ProductionPanel } from '@/components/track/ProductionPanel';
import { TriviaSidebar } from '@/components/track/TriviaSidebar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface TrackInfo {
  title: string;
  artist: string;
  artistId: string;
}

function parseSlug(slug: string): TrackInfo {
  // slug format: encodedArtist-encodedTrack
  // We split on the first '-' after decoding each half
  // The slug is built as: encodeURIComponent(artist) + '-' + encodeURIComponent(track)
  const decoded = decodeURIComponent(slug);
  // Re-split by finding the encoded boundary: look for the first '-' that separates the two parts
  // Since the original slug is encodeURIComponent(artist) + '-' + encodeURIComponent(track),
  // we find the first '-' in the raw slug
  const dashIdx = slug.indexOf('-');
  if (dashIdx === -1) {
    return { title: decoded, artist: 'Unknown Artist', artistId: '' };
  }
  const encodedArtist = slug.slice(0, dashIdx);
  const encodedTrack = slug.slice(dashIdx + 1);
  const artist = decodeURIComponent(encodedArtist);
  const title = decodeURIComponent(encodedTrack);
  return {
    title,
    artist,
    artistId: encodedArtist,
  };
}

export default function TrackPage() {
  const params = useParams();
  const trackSlug = params.id as string;
  const { title: trackTitle, artist: artistName, artistId } = parseSlug(trackSlug);

  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures | null>(null);
  const [credits, setCredits] = useState<ProductionCredit | null>(null);
  const [annotation, setAnnotation] = useState<GeniusAnnotation | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(false);

  useEffect(() => {
    if (!trackTitle || !artistName) return;

    const cacheKey = trackSlug;

    // Load audio features — try to find a Spotify track ID via MusicBrainz first,
    // then fall back to searching Last.fm for a Spotify ID.
    // For now we fetch directly with client credentials using the cache key as lookup.
    const cachedFeatures = store.getAudioFeatures(cacheKey);
    if (cachedFeatures) {
      setAudioFeatures(cachedFeatures);
    } else {
      // Try to get audio features by searching for the track's Spotify ID
      // We'll fetch it via MusicBrainz recording lookup which may return external IDs
      setAudioLoading(true);
      fetch(
        `/api/enrichment/musicbrainz?title=${encodeURIComponent(trackTitle)}&artist=${encodeURIComponent(artistName)}`
      )
        .then((r) => r.json())
        .then((data: ProductionCredit & { spotifyId?: string }) => {
          if (data?.trackId) {
            setCredits(data);
            store.setProductionCredits(cacheKey, data);
            // If we got a spotifyId back, fetch audio features
            if (data.spotifyId) {
              return fetch(`/api/spotify/audio-features?trackId=${data.spotifyId}`)
                .then((r) => r.json())
                .then((features: AudioFeatures) => {
                  if (features.bpm) {
                    setAudioFeatures(features);
                    store.setAudioFeatures(cacheKey, features);
                  }
                });
            }
          } else {
            const empty: ProductionCredit = {
              trackId: cacheKey,
              producers: [],
              mixingEngineers: [],
              masteringEngineers: [],
            };
            setCredits(empty);
          }
        })
        .catch(console.error)
        .finally(() => {
          setAudioLoading(false);
          setCreditsLoading(false);
        });
    }

    // Load production credits
    const cachedCredits = store.getProductionCredits(cacheKey);
    if (cachedCredits) {
      setCredits(cachedCredits);
    } else {
      setCreditsLoading(true);
      fetch(
        `/api/enrichment/musicbrainz?title=${encodeURIComponent(trackTitle)}&artist=${encodeURIComponent(artistName)}`
      )
        .then((r) => r.json())
        .then((data: ProductionCredit) => {
          if (data?.trackId) {
            setCredits(data);
            store.setProductionCredits(cacheKey, data);
          } else {
            const empty: ProductionCredit = {
              trackId: cacheKey,
              producers: [],
              mixingEngineers: [],
              masteringEngineers: [],
            };
            setCredits(empty);
          }
        })
        .catch(console.error)
        .finally(() => setCreditsLoading(false));
    }

    // Load Genius annotations
    const geniusCacheKey = `genius_${cacheKey}`;
    const cachedAnnotation = store.getCache<GeniusAnnotation>(geniusCacheKey);
    if (cachedAnnotation) {
      setAnnotation(cachedAnnotation);
    } else {
      fetch(
        `/api/enrichment/genius?trackId=${encodeURIComponent(cacheKey)}&title=${encodeURIComponent(trackTitle)}&artist=${encodeURIComponent(artistName)}`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data: GeniusAnnotation | null) => {
          setAnnotation(data);
          if (data) store.setCache(geniusCacheKey, data, 60 * 24);
        })
        .catch(console.error);
    }
  }, [trackSlug, trackTitle, artistName]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Track header */}
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-xl bg-bg-secondary ring-1 ring-border flex-shrink-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{trackTitle}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <Link
                href={`/artist/${artistId}`}
                className="text-sm text-gray-300 hover:text-accent-spotify transition-colors font-medium"
              >
                {artistName}
              </Link>
            </div>
            <div className="mt-3">
              <Link
                href="/"
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Back to search
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Audio DNA + Production */}
        <div className="lg:col-span-2 space-y-6">
          {audioLoading ? (
            <div className="bg-bg-card border border-border rounded-xl p-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : audioFeatures ? (
            <AudioDNARadar features={audioFeatures} />
          ) : (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Audio DNA</h3>
              <p className="text-xs text-gray-500">
                Audio features could not be loaded for this track.
              </p>
            </div>
          )}

          {creditsLoading ? (
            <div className="bg-bg-card border border-border rounded-xl p-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : credits ? (
            <ProductionPanel credits={credits} />
          ) : null}
        </div>

        {/* Right: Trivia sidebar */}
        <div className="space-y-6">
          <TriviaSidebar
            annotation={annotation}
            trackTitle={trackTitle}
            artistName={artistName}
          />

          {/* Quick info */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Track Info</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Artist</span>
                <span className="text-gray-200">{artistName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Title</span>
                <span className="text-gray-200">{trackTitle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
