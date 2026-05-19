'use client';

interface Props {
  positive: number;
  neutral: number;
  negative: number;
}

export default function SentimentBar({ positive, neutral, negative }: Props) {
  return (
    <div className="w-full">
      <div className="flex rounded-full overflow-hidden h-4 w-full">
        <div
          className="bg-positive transition-all duration-700"
          style={{ width: `${positive}%` }}
        />
        <div
          className="bg-muted transition-all duration-700"
          style={{ width: `${neutral}%` }}
        />
        <div
          className="bg-negative transition-all duration-700"
          style={{ width: `${negative}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-sm">
        <span className="flex items-center gap-1.5 text-positive font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-positive inline-block" />
          Positive {positive}%
        </span>
        <span className="flex items-center gap-1.5 text-muted font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-muted inline-block" />
          Neutral {neutral}%
        </span>
        <span className="flex items-center gap-1.5 text-negative font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-negative inline-block" />
          Negative {negative}%
        </span>
      </div>
    </div>
  );
}
