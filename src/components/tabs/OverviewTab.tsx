'use client';

import type { BrandReport } from '@/types';
import ScoreMeter from '@/components/ScoreMeter';
import SentimentBar from '@/components/SentimentBar';
import ThemeBar from '@/components/ThemeBar';

interface Props {
  report: BrandReport;
}

export default function OverviewTab({ report }: Props) {
  const themeEntries = Object.entries(report.themes) as [
    keyof BrandReport['themes'],
    BrandReport['themes'][keyof BrandReport['themes']],
  ][];

  return (
    <div className="space-y-6">
      {/* Score + sentiment row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-brand-card rounded-2xl border border-brand-border p-6 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-text-secondary mb-4">Overall Perception Score</p>
          <ScoreMeter score={report.overallScore} size="lg" />
        </div>

        <div className="bg-brand-card rounded-2xl border border-brand-border p-6">
          <p className="text-sm font-semibold text-text-secondary mb-4">Sentiment Distribution</p>
          <SentimentBar
            positive={report.sentiment.positive}
            neutral={report.sentiment.neutral}
            negative={report.sentiment.negative}
          />
          <p className="mt-5 text-sm text-text-secondary leading-relaxed">{report.summary}</p>
        </div>
      </div>

      {/* Theme breakdown */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6">
        <h2 className="text-base font-bold text-text-primary mb-5">Theme Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          {themeEntries.map(([key, val]) => (
            <ThemeBar key={key} label={key} score={val.score} insight={val.insight} />
          ))}
        </div>
      </div>

      {/* Strengths & Concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-green-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Top Strengths
          </h3>
          <ul className="space-y-2">
            {report.topStrengths.map((s, i) => (
              <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-positive flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Top Concerns
          </h3>
          <ul className="space-y-2">
            {report.topConcerns.map((c, i) => (
              <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-negative flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sources */}
      {report.sources?.length > 0 && (
        <div className="bg-brand-card rounded-2xl border border-brand-border p-6">
          <h3 className="text-sm font-bold text-text-primary mb-3">Sources</h3>
          <ul className="space-y-1.5">
            {report.sources.map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
