'use client';

import type { BrandAnalysis } from '@/types';
import RadarChart from '@/components/RadarChart';
import ScoreMeter from '@/components/ScoreMeter';

interface Props {
  primary: BrandAnalysis;
  competitors: BrandAnalysis[];
}

const THEME_KEYS = ['product_quality', 'customer_service', 'value', 'brand_image', 'innovation'] as const;
const THEME_LABELS = ['Product\nQuality', 'Customer\nService', 'Value', 'Brand\nImage', 'Innovation'];
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

type ThemeKey = (typeof THEME_KEYS)[number];

function getThemeValues(analysis: BrandAnalysis): number[] {
  return THEME_KEYS.map((k) => analysis.report.themes[k as ThemeKey]?.score ?? 0);
}

function Trophy() {
  return (
    <svg className="w-4 h-4 text-warning inline-block ml-1" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function CompareTab({ primary, competitors }: Props) {
  const all = [primary, ...competitors];
  const radarSeries = all.map((a, i) => ({
    label: a.brand,
    color: COLORS[i % COLORS.length],
    values: getThemeValues(a),
  }));

  return (
    <div className="space-y-8">
      {/* Radar chart */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6">
        <h2 className="text-base font-bold text-text-primary mb-6 text-center">Theme Comparison</h2>
        <div className="flex justify-center">
          <RadarChart axes={THEME_LABELS} series={radarSeries} />
        </div>
      </div>

      {/* Score comparison table */}
      <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-bg border-b border-brand-border">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Metric</th>
              {all.map((a, i) => (
                <th key={i} className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS[i % COLORS.length] }}>
                  {a.brand}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Overall score row */}
            <ScoreRow
              label="Overall Score"
              values={all.map((a) => a.report.overallScore)}
              brands={all.map((a) => a.brand)}
            />
            {/* Theme rows */}
            {THEME_KEYS.map((key, i) => (
              <ScoreRow
                key={key}
                label={THEME_LABELS[i].replace('\n', ' ')}
                values={all.map((a) => a.report.themes[key as ThemeKey]?.score ?? 0)}
                brands={all.map((a) => a.brand)}
              />
            ))}
            {/* Social */}
            <ScoreRow
              label="Social Score"
              values={all.map((a) => a.report.socialPresence.overallScore)}
              brands={all.map((a) => a.brand)}
            />
          </tbody>
        </table>
      </div>

      {/* Mini brand cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {all.map((a, i) => (
          <div key={i} className="bg-brand-card rounded-2xl border border-brand-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <h3 className="font-bold text-text-primary text-sm">{a.brand}</h3>
            </div>
            <ScoreMeter score={a.report.overallScore} size="sm" />
            <p className="text-xs text-text-secondary mt-3 leading-relaxed line-clamp-3">{a.report.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRow({ label, values }: { label: string; values: number[]; brands: string[] }) {
  const max = Math.max(...values);
  return (
    <tr className="border-b border-brand-border last:border-0 hover:bg-brand-bg/50 transition">
      <td className="px-5 py-3 font-medium text-text-secondary">{label}</td>
      {values.map((v, i) => {
        const isTop = v === max;
        const color = v >= 70 ? 'text-positive' : v >= 45 ? 'text-warning' : 'text-negative';
        return (
          <td key={i} className={`px-5 py-3 text-center font-bold ${color}`}>
            {v}
            {isTop && values.filter((x) => x === max).length === 1 && <Trophy />}
          </td>
        );
      })}
    </tr>
  );
}
