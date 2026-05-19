'use client';

type Level = 'Low' | 'Medium' | 'High' | 'Very High';

const styles: Record<Level, string> = {
  'Very High': 'bg-green-100 text-green-700',
  High: 'bg-lime-100 text-lime-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-gray-100 text-gray-500',
};

export default function EngagementBadge({ level }: { level: Level }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[level]}`}>
      {level}
    </span>
  );
}
