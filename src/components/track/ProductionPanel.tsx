'use client';

import Link from 'next/link';
import { ProductionCredit } from '@/lib/types';

interface ProductionPanelProps {
  credits: ProductionCredit;
}

function PersonList({
  people,
  label,
}: {
  people: ProductionCredit['producers'];
  label: string;
}) {
  if (!people || people.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {label}
      </h4>
      <div className="space-y-3">
        {people.map((person) => (
          <div key={person.name} className="group">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-accent-purple">
                  {person.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {person.id ? (
                  <Link
                    href={`/producer/${person.id}`}
                    className="text-sm font-medium text-white hover:text-accent-spotify transition-colors"
                  >
                    {person.name}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-white">{person.name}</p>
                )}
                {person.bio && (
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                    {person.bio}
                  </p>
                )}
                {person.techniques && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">{person.techniques}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductionPanel({ credits }: ProductionPanelProps) {
  const hasContent =
    credits.producers.length > 0 ||
    credits.mixingEngineers.length > 0 ||
    credits.masteringEngineers.length > 0 ||
    credits.studio ||
    (credits.notableGear && credits.notableGear.length > 0);

  if (!hasContent) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-2">Production Credits</h3>
        <p className="text-xs text-gray-500">No production credits found for this track.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-5">Production Credits</h3>

      <div className="space-y-6">
        <PersonList people={credits.producers} label="Producers" />
        <PersonList people={credits.mixingEngineers} label="Mixing" />
        <PersonList people={credits.masteringEngineers} label="Mastering" />

        {credits.studio && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Studio
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-white">{credits.studio.name}</p>
                {credits.studio.location && (
                  <p className="text-xs text-gray-400">{credits.studio.location}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {credits.notableGear && credits.notableGear.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Notable Gear
            </h4>
            <div className="flex flex-wrap gap-2">
              {credits.notableGear.map((gear) => (
                <span
                  key={gear}
                  className="px-2.5 py-1 bg-bg-secondary border border-border rounded-lg text-xs text-gray-300"
                >
                  {gear}
                </span>
              ))}
            </div>
          </div>
        )}

        {credits.label && (
          <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-gray-500">
            <span>Label: {credits.label}</span>
            {credits.recordingDate && <span>{credits.recordingDate}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
