'use client';

import { LLMInsights, LLMProducer } from '@/lib/types';

interface Props {
  insights: LLMInsights | null;
  loading: boolean;
}

function camelToLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function ProductionProcessSection({ data }: { data: Record<string, string> | string }) {
  if (typeof data === 'string') {
    return (
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{data}</p>
    );
  }
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) =>
        value ? (
          <div key={key}>
            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              {camelToLabel(key)}
            </h5>
            <p className="text-sm text-gray-300 leading-relaxed">{value}</p>
          </div>
        ) : null
      )}
    </div>
  );
}

function ProducerCard({ producer }: { producer: LLMProducer | string }) {
  if (typeof producer === 'string') {
    return (
      <div className="bg-bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-gray-300 leading-relaxed">
        {producer}
      </div>
    );
  }

  const { name, role, bio, ...rest } = producer;

  return (
    <div className="bg-bg-secondary border border-border rounded-lg px-4 py-3 space-y-2">
      {(name || role) && (
        <div className="flex flex-wrap items-baseline gap-2">
          {name && <span className="text-sm font-semibold text-white">{name}</span>}
          {role && <span className="text-xs text-gray-400">{role}</span>}
        </div>
      )}
      {bio && <p className="text-sm text-gray-300 leading-relaxed">{bio}</p>}
      {Object.entries(rest).map(([key, value]) =>
        value ? (
          <div key={key}>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {camelToLabel(key)}:{' '}
            </span>
            <span className="text-sm text-gray-400">{value}</span>
          </div>
        ) : null
      )}
    </div>
  );
}

export function LLMInsightsPanel({ insights, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-bg-secondary rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-bg-secondary rounded" />
          <div className="h-3 w-4/5 bg-bg-secondary rounded" />
          <div className="h-3 w-3/5 bg-bg-secondary rounded" />
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-2">AI Insights</h3>
        <p className="text-xs text-gray-500">No AI insights available.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 space-y-6">
      <h3 className="text-sm font-semibold text-white">AI Insights</h3>

      {insights.productionProcess && (
        <section>
          <h4 className="text-xs font-semibold text-accent-spotify uppercase tracking-wider mb-3">
            Production Process
          </h4>
          <ProductionProcessSection data={insights.productionProcess} />
        </section>
      )}

      {insights.producers.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold text-accent-spotify uppercase tracking-wider mb-3">
            Producers &amp; Engineers
          </h4>
          <div className="space-y-3">
            {insights.producers.map((p, i) => (
              <ProducerCard key={i} producer={p} />
            ))}
          </div>
        </section>
      )}


    </div>
  );
}
