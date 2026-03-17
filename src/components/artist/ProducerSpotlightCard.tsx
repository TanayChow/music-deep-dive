'use client';

import Link from 'next/link';
import { Producer } from '@/lib/types';

interface ProducerSpotlightCardProps {
  producer: Producer;
}

export function ProducerSpotlightCard({ producer }: ProducerSpotlightCardProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 hover:border-border-light transition-colors group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-purple/30 to-bg-secondary border border-border flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-accent-purple">
            {producer.name.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <Link
            href={`/producer/${producer.id}`}
            className="text-sm font-semibold text-white hover:text-accent-spotify transition-colors"
          >
            {producer.name}
          </Link>
          {producer.peakEra && (
            <p className="text-xs text-gray-500 mt-0.5">Peak era: {producer.peakEra}</p>
          )}
        </div>
      </div>

      {producer.signatureStyle && (
        <p className="mt-3 text-xs text-gray-400 leading-relaxed line-clamp-3">
          {producer.signatureStyle}
        </p>
      )}

      {producer.genres && producer.genres.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {producer.genres.map((g) => (
            <span
              key={g}
              className="px-2 py-0.5 bg-bg-secondary border border-border rounded-full text-xs text-gray-400 capitalize"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {producer.notableAlbums && producer.notableAlbums.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-gray-500 mb-1.5">Notable works</p>
          <div className="space-y-1">
            {producer.notableAlbums.slice(0, 3).map((album) => (
              <p key={album} className="text-xs text-gray-300 truncate">
                {album}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
