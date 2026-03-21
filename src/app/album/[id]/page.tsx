'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ProductionCredit, LLMInsights } from '@/lib/types';
import { AlbumInfo } from '@/lib/lastfm';
import { ProductionPanel } from '@/components/track/ProductionPanel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LLMInsightsPanel } from '@/components/album/LLMInsightsPanel';
import { store } from '@/lib/store';

function formatDuration(seconds: string): string {
  const s = parseInt(seconds);
  if (!s || isNaN(s)) return '';
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

export default function AlbumPage() {
  const params = useParams();
  const rawId = decodeURIComponent(params.id as string);
  const [artistSlug, albumSlug] = rawId.split('---');
  const artistName = decodeURIComponent(artistSlug ?? '');
  const albumName = decodeURIComponent(albumSlug ?? '');
  const artistPageId = encodeURIComponent(artistName);

  const [albumInfo, setAlbumInfo] = useState<AlbumInfo | null>(null);
  const [credits, setCredits] = useState<ProductionCredit | null>(null);
  const [llmInsights, setLlmInsights] = useState<LLMInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [llmLoading, setLlmLoading] = useState(true);

  useEffect(() => {
    if (!artistName || !albumName) return;

    async function loadAlbum() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/enrichment/lastfm?artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(albumName)}&type=album`
        );
        if (res.ok) {
          const data = await res.json();
          setAlbumInfo(data);
        }
      } catch (e) {
        console.error('Album info fetch error', e);
      } finally {
        setLoading(false);
      }
    }

    async function loadCredits() {
      setCreditsLoading(true);
      try {
        const res = await fetch(
          `/api/enrichment/musicbrainz?artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(albumName)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            setCredits(data);
          }
        }
      } catch (e) {
        console.error('Credits fetch error', e);
      } finally {
        setCreditsLoading(false);
      }
    }

    async function loadLLMInsights() {
      setLlmLoading(true);
      const cacheKey = `album_${artistName}---${albumName}`;
      const cached = store.getLLMInsights(cacheKey);
      if (cached) {
        setLlmInsights(cached);
        setLlmLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/enrichment/llm?artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(albumName)}&type=album`
        );
        if (res.ok) {
          const data: LLMInsights = await res.json();
          store.setLLMInsights(cacheKey, data);
          setLlmInsights(data);
        }
      } catch (e) {
        console.error('LLM insights fetch error', e);
      } finally {
        setLlmLoading(false);
      }
    }

    loadAlbum();
    loadCredits();
    loadLLMInsights();
  }, [artistName, albumName]);

  const releaseYear = albumInfo?.releaseDate
    ? albumInfo.releaseDate.slice(0, 4)
    : null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!albumInfo) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-lg font-semibold text-white">Album not found</h2>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-accent-spotify text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
        >
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex gap-6 items-end">
        <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-xl overflow-hidden bg-bg-secondary flex-shrink-0 ring-1 ring-border shadow-lg">
          {albumInfo.coverArt ? (
            <Image
              src={albumInfo.coverArt}
              alt={albumInfo.title}
              width={176}
              height={176}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pb-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Album</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1 truncate">
            {albumInfo.title}
          </h1>
          <Link
            href={`/artist/${artistPageId}`}
            className="text-base text-accent-spotify hover:underline font-medium"
          >
            {albumInfo.artist}
          </Link>
          {releaseYear && (
            <span className="text-gray-500 text-sm ml-2">· {releaseYear}</span>
          )}
          {albumInfo.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {albumInfo.genres.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 bg-bg-secondary border border-border rounded-full text-xs text-gray-300"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tracklist */}
        <div className="lg:col-span-1">
          {albumInfo.tracks.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Tracklist</h3>
              <ol className="space-y-2">
                {albumInfo.tracks.map((track, i) => (
                  <li key={track.name} className="flex items-center gap-3 group">
                    <span className="text-xs text-gray-600 w-5 text-right flex-shrink-0">{i + 1}</span>
                    <span className="text-sm text-gray-200 flex-1 truncate">{track.name}</span>
                    {track.duration && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDuration(track.duration)}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right: Credits + Wiki + LLM Insights */}
        <div className="lg:col-span-2 space-y-6">
          {creditsLoading ? (
            <div className="bg-bg-card border border-border rounded-xl p-5 flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-gray-400">Loading production credits…</span>
            </div>
          ) : credits ? (
            <ProductionPanel credits={credits} />
          ) : (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Production Credits</h3>
              <p className="text-xs text-gray-500">No production data found for this album.</p>
            </div>
          )}

          <LLMInsightsPanel insights={llmInsights} loading={llmLoading} />

          {albumInfo.wiki && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">About</h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {albumInfo.wiki}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
