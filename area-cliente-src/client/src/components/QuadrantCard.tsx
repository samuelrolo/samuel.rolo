import ScoreGauge from "./ScoreGauge";
import { Info } from "lucide-react";

interface QuadrantCardProps {
  title: string;
  score: number;
  benchmark: number;
  insight?: string;
}

const QuadrantCard = ({ title, score, benchmark, insight }: QuadrantCardProps) => {
  const diff = score - benchmark;
  const diffText = diff > 0 ? `+${diff}` : `${diff}`;
  const diffColor = diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        <Info className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex items-center justify-center">
        <ScoreGauge score={score} size={100} strokeWidth={6} />
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Benchmark: <span className="font-semibold">{benchmark}</span>
          <span className={`ml-2 font-semibold ${diffColor}`}>({diffText})</span>
        </p>
        {insight && (
          <p className="text-sm text-muted-foreground mt-2">
            → {insight}
          </p>
        )}
      </div>
    </div>
  );
};

export default QuadrantCard;
