interface DimensionBarProps {
  label: string;
  score: number;
  benchmark?: number;
  insight?: string;
}

const DimensionBar = ({ label, score, benchmark, insight }: DimensionBarProps) => {
  return (
    <div className="space-y-1.5">
      {/* Mobile: stack label above bar; Desktop: side by side */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <span className="text-sm font-semibold text-card-foreground sm:w-44 sm:shrink-0 mb-1 sm:mb-0">{label}</span>
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1 relative">
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full gold-bar transition-all duration-1000 ease-out"
                style={{ width: `${score}%` }}
              />
            </div>
            {benchmark !== undefined && (
              <div
                className="absolute top-0 h-3 w-0.5 bg-card-foreground/50"
                style={{ left: `${benchmark}%` }}
                title={`Benchmark: ${benchmark}`}
              />
            )}
          </div>
          <span className="text-sm font-bold text-card-foreground w-10 text-right">{score}</span>
        </div>
      </div>
      {insight && (
        <p className="text-sm text-muted-foreground sm:pl-48">→ {insight}</p>
      )}
    </div>
  );
};

export default DimensionBar;
