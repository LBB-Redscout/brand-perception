'use client';

type Sentiment = 'Positive' | 'Mixed' | 'Negative';

const styles: Record<Sentiment, string> = {
  Positive: 'bg-green-100 text-green-700',
  Mixed: 'bg-amber-100 text-amber-700',
  Negative: 'bg-red-100 text-red-700',
};

export default function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[sentiment]}`}>
      {sentiment}
    </span>
  );
}
