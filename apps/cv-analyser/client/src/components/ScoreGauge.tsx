interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  /** Override the progress-circle color class (e.g. "text-red-500") */
  colorClass?: string;
}

function autoColor(score: number): string {
  if (score < 50) return 'text-red-500';
  if (score < 75) return 'text-orange-500';
  if (score < 85) return 'text-amber-500';
  if (score < 95) return 'text-green-400';
  return 'text-green-600';
}

const ScoreGauge = ({ score, size = 120, strokeWidth = 8, colorClass }: ScoreGaugeProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const resolvedColor = colorClass || autoColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={`${resolvedColor} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-card-foreground">{score}</span>
      </div>
    </div>
  );
};

export default ScoreGauge;
