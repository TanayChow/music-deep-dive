'use client';

import Link from 'next/link';
import { GeniusAnnotation } from '@/lib/types';

interface TriviaSidebarProps {
  annotation: GeniusAnnotation | null;
  trackTitle: string;
  artistName: string;
}

export function TriviaSidebar({ annotation, trackTitle, artistName }: TriviaSidebarProps) {
  if (!annotation) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-2">Track Trivia</h3>
        <p className="text-xs text-gray-500">
          No trivia available yet. Genius metadata not found for this track.
        </p>
        <Link
          href={`https://genius.com/search?q=${encodeURIComponent(`${artistName} ${trackTitle}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-xs text-gray-500 hover:text-white transition-colors"
        >
          Search on Genius
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Track Trivia</h3>
        {annotation.url && (
          <Link
            href={annotation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
          >
            Genius
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </Link>
        )}
      </div>

      {annotation.description && (
        <p className="text-xs text-gray-300 leading-relaxed mb-4">{annotation.description}</p>
      )}

      {annotation.facts && annotation.facts.length > 0 && (
        <div className="space-y-2.5">
          {annotation.facts.map((fact, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 bg-bg-secondary rounded-lg border border-border"
            >
              <div className="w-1 h-1 rounded-full bg-accent-spotify mt-2 flex-shrink-0" />
              <p className="text-xs text-gray-300 leading-relaxed">{fact}</p>
            </div>
          ))}
        </div>
      )}

      {annotation.annotations && annotation.annotations.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Annotations
          </h4>
          {annotation.annotations.map((ann, i) => (
            <div key={i} className="border border-border rounded-lg overflow-hidden">
              <div className="bg-bg-secondary px-3 py-2">
                <p className="text-xs text-gray-300 italic">&ldquo;{ann.fragment}&rdquo;</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-gray-400 leading-relaxed">{ann.annotation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
