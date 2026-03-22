'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { LLMInsightsPanel } from '@/components/album/LLMInsightsPanel';

export function NowPlayingBar() {
  const { track, artist, album, isPlaying, llmInsights, llmLoading } = useNowPlaying();
  const [expanded, setExpanded] = useState(false);

  if (!isPlaying || !track || !artist) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Insights drawer */}
      {expanded && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
          <div className="bg-bg-card border border-border border-b-0 rounded-t-xl overflow-y-auto max-h-80">
            <div className="p-4">
              <LLMInsightsPanel insights={llmInsights} loading={llmLoading} />
            </div>
          </div>
        </div>
      )}

      {/* Main bar */}
      <div className="bg-bg-card border-t border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <span className="text-accent-spotify text-base flex-shrink-0">♪</span>

          <div className="flex-1 flex items-center gap-1 min-w-0 text-sm truncate">
            <span className="text-white font-medium truncate">{track}</span>
            <span className="text-gray-500 flex-shrink-0 mx-1">·</span>
            <Link
              href={`/artist/${encodeURIComponent(artist)}`}
              className="text-accent-spotify hover:underline flex-shrink-0"
            >
              {artist}
            </Link>
            {album && (
              <>
                <span className="text-gray-500 flex-shrink-0 mx-1">·</span>
                <span className="text-gray-400 truncate">{album}</span>
              </>
            )}
          </div>

          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-bg-secondary"
            aria-label={expanded ? 'Hide insights' : 'Show insights'}
          >
            <span>{expanded ? 'hide' : 'insights'}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
