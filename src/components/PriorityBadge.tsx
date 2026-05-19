'use client';

type Priority = 'High' | 'Medium' | 'Low';

const styles: Record<Priority, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-blue-100 text-blue-700',
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[priority]}`}>
      {priority} Priority
    </span>
  );
}
