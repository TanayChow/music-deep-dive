'use client';

import Image from 'next/image';

interface SimpleTrack {
  id: string;
  title: string;
  artist: string;
  duration?: number;
  trackNumber?: number;
}

interface TrackListProps {
  tracks: SimpleTrack[];
  albumTitle: string;
  albumArt?: string;
  artistName?: string;
  releaseDate?: string;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatTotalDuration(tracks: SimpleTrack[]): string {
  const totalMs = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  const totalMinutes = Math.floor(totalMs / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours} hr ${mins} min`;
}

export function TrackList({ tracks, albumTitle, albumArt, artistName, releaseDate }: TrackListProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Album header */}
      <div className="flex items-center gap-5 p-5 border-b border-border">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-bg-secondary flex-shrink-0 ring-1 ring-border">
          {albumArt ? (
            <Image
              src={albumArt}
              alt={albumTitle}
              width={80}
              height={80}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{albumTitle}</h2>
          {artistName && (
            <p className="text-sm text-gray-400 mt-0.5">{artistName}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {releaseDate && (
              <span className="text-xs text-gray-500">{releaseDate.slice(0, 4)}</span>
            )}
            <span className="text-xs text-gray-500">{tracks.length} tracks</span>
            {tracks.some((t) => t.duration) && (
              <span className="text-xs text-gray-500">{formatTotalDuration(tracks)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Track list */}
      <div>
        {tracks.map((track, i) => (
          <div
            key={track.id}
            className={`flex items-center gap-3 px-5 py-3 ${
              i > 0 ? 'border-t border-border' : ''
            }`}
          >
            <span className="text-sm text-gray-600 w-5 text-center flex-shrink-0">
              {track.trackNumber ?? i + 1}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-100 truncate">{track.title}</p>
              <p className="text-xs text-gray-500 truncate">{track.artist}</p>
            </div>

            {track.duration && (
              <span className="text-xs text-gray-500 w-10 text-right flex-shrink-0">
                {formatDuration(track.duration)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
