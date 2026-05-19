'use client';

interface DataSeries {
  label: string;
  color: string;
  values: number[];
}

interface Props {
  axes: string[];
  series: DataSeries[];
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function RadarChart({ axes, series }: Props) {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 120;
  const n = axes.length;
  const levels = [20, 40, 60, 80, 100];

  const axisPoints = axes.map((_, i) => polarToXY((360 / n) * i, maxR, cx, cy));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {levels.map((lvl) =>
        axes.map((_, i) => {
          const next = (i + 1) % n;
          const p1 = polarToXY((360 / n) * i, (maxR * lvl) / 100, cx, cy);
          const p2 = polarToXY((360 / n) * next, (maxR * lvl) / 100, cx, cy);
          return (
            <line
              key={`grid-${lvl}-${i}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          );
        })
      )}

      {/* Spokes */}
      {axisPoints.map((pt, i) => (
        <line key={`spoke-${i}`} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#e2e8f0" strokeWidth={1} />
      ))}

      {/* Series */}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => {
          const clamped = Math.max(0, Math.min(100, v));
          return polarToXY((360 / n) * i, (maxR * clamped) / 100, cx, cy);
        });
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        const color = COLORS[si % COLORS.length];
        return (
          <g key={`series-${si}`}>
            <path d={path} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={2} />
            {pts.map((p, pi) => (
              <circle key={`dot-${pi}`} cx={p.x} cy={p.y} r={4} fill={color} />
            ))}
          </g>
        );
      })}

      {/* Axis labels */}
      {axisPoints.map((pt, i) => {
        const labelPt = polarToXY((360 / n) * i, maxR + 22, cx, cy);
        return (
          <text
            key={`label-${i}`}
            x={labelPt.x}
            y={labelPt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill="#475569"
            fontWeight="600"
          >
            {axes[i]}
          </text>
        );
      })}

      {/* Legend */}
      {series.map((s, si) => {
        const color = COLORS[si % COLORS.length];
        return (
          <g key={`legend-${si}`} transform={`translate(10, ${size - (series.length - si) * 20})`}>
            <rect width={12} height={12} fill={color} rx={2} />
            <text x={18} y={10} fontSize={11} fill="#475569">{s.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
