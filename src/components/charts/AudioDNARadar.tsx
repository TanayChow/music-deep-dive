'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { AudioFeatures } from '@/lib/types';

interface AudioDNARadarProps {
  features: AudioFeatures;
}

interface TooltipEntry {
  name: string;
  value: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: TooltipEntry }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-card border border-border rounded-lg p-2 text-xs">
      <p className="text-white font-medium">{d.name}</p>
      <p className="text-accent-spotify">{(d.value * 100).toFixed(0)}%</p>
    </div>
  );
}

export function AudioDNARadar({ features }: AudioDNARadarProps) {
  const data = [
    { name: 'Energy', value: features.energy },
    { name: 'Danceability', value: features.danceability },
    { name: 'Happiness', value: features.valence },
    { name: 'Acousticness', value: features.acousticness },
    { name: 'Instrumental', value: features.instrumentalness },
    { name: 'Liveness', value: features.liveness },
  ];

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-1">Audio DNA</h3>
      <p className="text-xs text-gray-500 mb-4">Track characteristics from Spotify audio analysis</p>

      {/* BPM and Key highlights */}
      <div className="flex gap-4 mb-5">
        <div className="flex-1 bg-bg-secondary rounded-lg px-4 py-3 text-center border border-border">
          <p className="text-2xl font-bold text-accent-spotify">{features.bpm}</p>
          <p className="text-xs text-gray-400 mt-0.5">BPM</p>
        </div>
        <div className="flex-1 bg-bg-secondary rounded-lg px-4 py-3 text-center border border-border">
          <p className="text-lg font-bold text-white">{features.key}</p>
          <p className="text-xs text-gray-400 mt-0.5">Key</p>
        </div>
        {features.loudness !== undefined && (
          <div className="flex-1 bg-bg-secondary rounded-lg px-4 py-3 text-center border border-border">
            <p className="text-lg font-bold text-white">{features.loudness.toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-0.5">dB</p>
          </div>
        )}
      </div>

      {/* Radar Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#2a2a3a" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
          />
          <Radar
            name="Audio Features"
            dataKey="value"
            stroke="#1DB954"
            fill="#1DB954"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Bar gauges */}
      <div className="mt-4 space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-24 flex-shrink-0">{d.name}</span>
            <div className="flex-1 bg-bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-accent-spotify rounded-full transition-all duration-500"
                style={{ width: `${d.value * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">
              {(d.value * 100).toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
