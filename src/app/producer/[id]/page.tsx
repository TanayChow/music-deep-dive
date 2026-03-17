'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Producer } from '@/lib/types';
import { store } from '@/lib/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function decodeProducerId(id: string): string {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export default function ProducerPage() {
  const params = useParams();
  const producerId = params.id as string;
  const producerName = decodeProducerId(producerId);

  const [producer, setProducer] = useState<Producer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = store.getCache<Producer>(`producer_${producerId}`);
    if (cached) {
      setProducer(cached);
    } else {
      const basic: Producer = {
        id: producerId,
        name: producerName,
      };
      setProducer(basic);
    }
    setLoading(false);
  }, [producerId, producerName]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-white mb-2">Producer not found</h2>
        <Link
          href="/"
          className="px-4 py-2 bg-accent-spotify text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
        >
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200">{producer.name}</span>
      </div>

      {/* Producer header card */}
      <div className="bg-bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/30 to-bg-secondary border border-border flex items-center justify-center flex-shrink-0">
            {producer.imageUrl ? (
              <img
                src={producer.imageUrl}
                alt={producer.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <span className="text-2xl font-bold text-accent-purple">
                {producer.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{producer.name}</h1>

            <div className="flex flex-wrap items-center gap-3 mt-2">
              {producer.peakEra && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Peak era: {producer.peakEra}
                </span>
              )}
            </div>

            {producer.genres && producer.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {producer.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-1 bg-bg-secondary border border-border rounded-full text-xs text-gray-300 capitalize"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {producer.bio && (
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-sm text-gray-300 leading-relaxed">{producer.bio}</p>
          </div>
        )}

        {producer.signatureStyle && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Signature Style
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">{producer.signatureStyle}</p>
          </div>
        )}

        {producer.notableAlbums && producer.notableAlbums.length > 0 && (
          <div className="mt-5 pt-5 border-t border-border">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Notable Works
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {producer.notableAlbums.map((album) => (
                <div
                  key={album}
                  className="bg-bg-secondary border border-border rounded-lg px-3 py-2"
                >
                  <p className="text-sm text-gray-300 truncate">{album}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {producer.collaborators && producer.collaborators.length > 0 && (
          <div className="mt-5 pt-5 border-t border-border">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Frequent Collaborators
            </h3>
            <div className="flex flex-wrap gap-2">
              {producer.collaborators.map((collab) => (
                <span
                  key={collab}
                  className="px-2.5 py-1 bg-bg-secondary border border-border rounded-full text-xs text-gray-300"
                >
                  {collab}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
