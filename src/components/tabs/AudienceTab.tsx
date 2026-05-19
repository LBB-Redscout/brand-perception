'use client';

import type { BrandReport } from '@/types';
import SentimentBadge from '@/components/SentimentBadge';
import EngagementBadge from '@/components/EngagementBadge';

interface Props {
  audience: BrandReport['audience'];
}

export default function AudienceTab({ audience }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary + stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-brand-card rounded-2xl border border-brand-border p-6">
          <h2 className="text-base font-bold text-text-primary mb-3">Audience Overview</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{audience.summary}</p>
        </div>

        <div className="bg-brand-card rounded-2xl border border-brand-border p-6 space-y-4">
          <Stat label="Age Range" value={audience.ageRange} />
          <div>
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">Influencer Presence</p>
            <EngagementBadge level={audience.influencerPresence} />
          </div>
          <div>
            <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">Loyalty Signal</p>
            <EngagementBadge level={audience.loyaltySignal} />
          </div>
        </div>
      </div>

      {/* Segment stacked bar */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6">
        <h2 className="text-base font-bold text-text-primary mb-4">Audience Segments</h2>

        {/* Stacked bar */}
        <div className="flex rounded-full overflow-hidden h-5 w-full mb-5">
          {audience.segments.map((seg, i) => {
            const colors = ['bg-primary', 'bg-team-accent', 'bg-warning', 'bg-positive', 'bg-muted'];
            return (
              <div
                key={i}
                className={`${colors[i % colors.length]} transition-all duration-700`}
                style={{ width: `${seg.percentage}%` }}
                title={`${seg.label}: ${seg.percentage}%`}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audience.segments.map((seg, i) => {
            const colors = ['bg-primary/10 border-primary/20', 'bg-cyan-50 border-cyan-200', 'bg-amber-50 border-amber-200', 'bg-green-50 border-green-200', 'bg-gray-50 border-gray-200'];
            const dotColors = ['bg-primary', 'bg-team-accent', 'bg-warning', 'bg-positive', 'bg-muted'];
            return (
              <div key={i} className={`rounded-xl border p-4 ${colors[i % colors.length]}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColors[i % dotColors.length]}`} />
                    <span className="text-sm font-semibold text-text-primary">{seg.label}</span>
                  </div>
                  <span className="text-sm font-bold text-text-primary">{seg.percentage}%</span>
                </div>
                <p className="text-xs text-text-secondary mb-2 leading-relaxed">{seg.description}</p>
                <SentimentBadge sentiment={seg.sentiment} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Channels + Influencer + Loyalty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-card rounded-2xl border border-brand-border p-6">
          <h3 className="text-sm font-bold text-text-primary mb-3">Top Channels</h3>
          <ul className="space-y-2">
            {audience.topChannels.map((ch, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                {ch}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-brand-card rounded-2xl border border-brand-border p-6">
          <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
            Influencer Activity
            <EngagementBadge level={audience.influencerPresence} />
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">{audience.influencerNote}</p>
        </div>

        <div className="bg-brand-card rounded-2xl border border-brand-border p-6">
          <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
            Audience Loyalty
            <EngagementBadge level={audience.loyaltySignal} />
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">{audience.loyaltyNote}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}
