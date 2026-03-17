'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Artist } from '@/lib/types';

interface ArtistBioProps {
  artist: Artist;
}

export function ArtistBio({ artist }: ArtistBioProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Header with image */}
      <div className="relative">
        {artist.imageUrl ? (
          <div className="relative h-48 w-full">
            <Image
              src={artist.imageUrl}
              alt={artist.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/40 to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-accent-purple/20 to-bg-secondary" />
        )}
      </div>

      <div className="px-5 pb-5 -mt-6 relative">
        <h1 className="text-2xl font-bold text-white mb-1">{artist.name}</h1>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {artist.origin && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {artist.origin}
            </span>
          )}
          {artist.activeYears && (
            <span className="text-xs text-gray-400">{artist.activeYears}</span>
          )}
          {artist.listeners !== undefined && (
            <span className="text-xs text-gray-400">
              {artist.listeners.toLocaleString()} listeners
            </span>
          )}
        </div>

        {/* Genre tags */}
        {artist.genres && artist.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {artist.genres.map((genre) => (
              <span
                key={genre}
                className="px-2 py-1 bg-bg-secondary border border-border rounded-full text-xs text-gray-300 capitalize"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        {artist.bio && (
          <p className="text-sm text-gray-300 leading-relaxed line-clamp-6">{artist.bio}</p>
        )}

        {/* Last.fm link */}
        {artist.lastfmUrl && (
          <Link
            href={artist.lastfmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs text-gray-500 hover:text-white transition-colors"
          >
            View on Last.fm
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
    </div>
  );
}
