'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Artist } from '@/lib/types';
import { store } from '@/lib/store';
import { ArtistBio } from '@/components/artist/ArtistBio';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ArtistPage() {
  const params = useParams();
  const artistId = params.id as string;
  const artistName = decodeURIComponent(artistId);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtist() {
      setLoading(true);

      const cached = store.getArtist(artistId);
      if (cached) {
        setArtist(cached);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/enrichment/lastfm?artist=${encodeURIComponent(artistName)}&type=bio`
        );
        if (res.ok) {
          const data = await res.json();
          const lfmArtist: Artist = {
            id: artistId,
            name: artistName,
            ...data,
          };
          store.setArtist(artistId, lfmArtist);
          setArtist(lfmArtist);
        } else {
          setArtist({ id: artistId, name: artistName });
        }
      } catch (e) {
        console.error('Last.fm artist fetch error', e);
        setArtist({ id: artistId, name: artistName });
      }

      setLoading(false);
    }

    loadArtist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-white">Artist not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ArtistBio artist={artist} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {artist.similar && artist.similar.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Similar Artists</h3>
              <div className="flex flex-wrap gap-2">
                {artist.similar.map((s) => (
                  <Link
                    key={s.id}
                    href={`/artist/${encodeURIComponent(s.name)}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-secondary border border-border rounded-full hover:border-accent-spotify hover:text-accent-spotify text-gray-200 text-sm transition-colors"
                  >
                    {s.name}
                    {s.match < 1 && (
                      <span className="text-xs text-gray-500">
                        {Math.round(s.match * 100)}%
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
