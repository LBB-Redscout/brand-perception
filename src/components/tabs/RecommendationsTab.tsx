'use client';

import type { Recommendation, TeamRecsResult } from '@/types';
import PriorityBadge from '@/components/PriorityBadge';

interface Props {
  recommendations: Recommendation[];
  teamRecs: TeamRecsResult[];
}

function LearnFromBadge({ brand, reason }: { brand: string; reason: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-primary border border-indigo-200 rounded-full px-2.5 py-1 cursor-default"
      title={reason}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      {brand}
    </span>
  );
}

function RecCard({ rec, index }: { rec: Recommendation; index: number }) {
  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border p-6">
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <h3 className="text-sm font-bold text-text-primary leading-snug">{rec.action}</h3>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed mb-4 pl-10">{rec.rationale}</p>
      {rec.learnFrom?.length > 0 && (
        <div className="pl-10">
          <p className="text-xs text-muted font-semibold mb-2">Learn from</p>
          <div className="flex flex-wrap gap-2">
            {rec.learnFrom.map((lf, i) => (
              <LearnFromBadge key={i} brand={lf.brand} reason={lf.reason} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendationsTab({ recommendations, teamRecs }: Props) {
  return (
    <div className="space-y-8">
      {/* Overall recommendations */}
      <div>
        <h2 className="text-base font-bold text-text-primary mb-4">Overall Recommendations</h2>
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <RecCard key={i} rec={rec} index={i} />
          ))}
        </div>
      </div>

      {/* Team recommendations */}
      {teamRecs.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-text-primary mb-4">Team & Area Recommendations</h2>
          <div className="space-y-6">
            {teamRecs.map((tr, ti) => (
              <div key={ti} className="rounded-2xl border border-brand-border overflow-hidden">
                {/* Team header */}
                <div className="bg-team-accent px-6 py-4">
                  <h3 className="text-sm font-bold text-white">{tr.team}</h3>
                  <p className="text-xs text-cyan-100 mt-0.5">{tr.question}</p>
                </div>

                <div className="bg-brand-card p-6">
                  {tr.context && (
                    <p className="text-sm text-text-secondary mb-5 leading-relaxed italic border-l-4 border-team-accent pl-4">
                      {tr.context}
                    </p>
                  )}

                  <div className="space-y-4">
                    {tr.recommendations.map((rec, ri) => (
                      <div key={ri} className="border border-brand-border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-sm font-bold text-text-primary leading-snug flex-1">{rec.action}</h4>
                          <PriorityBadge priority={rec.priority} />
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed mb-3">{rec.rationale}</p>
                        {rec.learnFrom?.length > 0 && (
                          <div>
                            <p className="text-xs text-muted font-semibold mb-2">Learn from</p>
                            <div className="flex flex-wrap gap-2">
                              {rec.learnFrom.map((lf, i) => (
                                <LearnFromBadge key={i} brand={lf.brand} reason={lf.reason} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
