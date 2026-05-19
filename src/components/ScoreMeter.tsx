'use client';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function scoreColor(score: number) {
  if (score >= 70) return { stroke: '#22c55e', text: '#16a34a' };
  if (score >= 45) return { stroke: '#f59e0b', text: '#d97706' };
  return { stroke: '#ef4444', text: '#dc2626' };
}

function scoreLabel(score: number) {
  if (score >= 70) return 'Strong';
  if (score >= 45) return 'Moderate';
  return 'Weak';
}

export default function ScoreMeter({ score, size = 'md' }: Props) {
  const dims = size === 'lg' ? 200 : size === 'md' ? 160 : 120;
  const strokeWidth = size === 'lg' ? 14 : size === 'md' ? 12 : 10;
  const cx = dims / 2;
  const cy = dims * 0.6;
  const r = cx - strokeWidth;

  // Semicircle arc: starts left (-180°) sweeps to right (0°)
  const circumference = Math.PI * r;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const dashOffset = circumference * (1 - progress);

  const { stroke, text } = scoreColor(score);
  const fontSize = size === 'lg' ? 36 : size === 'md' ? 28 : 22;
  const labelSize = size === 'lg' ? 14 : 12;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={dims}
        height={cy + strokeWidth}
        viewBox={`0 0 ${dims} ${cy + strokeWidth}`}
        style={{ overflow: 'visible' }}
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth} ${cy} A ${r} ${r} 0 0 1 ${dims - strokeWidth} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${strokeWidth} ${cy} A ${r} ${r} 0 0 1 ${dims - strokeWidth} ${cy}`}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="700"
          fill={text}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + labelSize + 2}
          textAnchor="middle"
          fontSize={labelSize}
          fill="#475569"
          fontWeight="500"
        >
          {scoreLabel(score)}
        </text>
        {/* Min/max labels */}
        <text x={strokeWidth} y={cy + labelSize + 14} textAnchor="middle" fontSize={10} fill="#94a3b8">0</text>
        <text x={dims - strokeWidth} y={cy + labelSize + 14} textAnchor="middle" fontSize={10} fill="#94a3b8">100</text>
      </svg>
    </div>
  );
}
