'use client';

interface Props {
  label: string;
  score: number;
  insight: string;
}

function barColor(score: number) {
  if (score >= 70) return 'bg-positive';
  if (score >= 45) return 'bg-warning';
  return 'bg-negative';
}

function textColor(score: number) {
  if (score >= 70) return 'text-positive';
  if (score >= 45) return 'text-warning';
  return 'text-negative';
}

const THEME_LABELS: Record<string, string> = {
  product_quality: 'Product Quality',
  customer_service: 'Customer Service',
  value: 'Value',
  brand_image: 'Brand Image',
  innovation: 'Innovation',
};

export default function ThemeBar({ label, score, insight }: Props) {
  const displayLabel = THEME_LABELS[label] || label;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-text-primary">{displayLabel}</span>
        <span className={`text-sm font-bold ${textColor(score)}`}>{score}</span>
      </div>
      <div className="w-full bg-brand-border rounded-full h-2.5 mb-1">
        <div
          className={`h-2.5 rounded-full ${barColor(score)} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-text-secondary">{insight}</p>
    </div>
  );
}
