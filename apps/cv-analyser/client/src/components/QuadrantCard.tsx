import { useState } from "react";
import ScoreGauge from "./ScoreGauge";
import { Info } from "lucide-react";
import { t } from "@/i18n";

interface QuadrantCardProps {
  title: string;
  score: number;
  benchmark: number;
  insight?: string;
  strengths?: string[];
  weaknesses?: string[];
  tooltipLabel?: string;
  tooltipText?: string;
}

/** Map any dimension title (PT/EN/ES) to a canonical key for tooltip lookup */
function dimKey(title: string): string {
  const lower = (title || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (lower.includes("experiencia") || lower === "experience") return "experiencia";
  if (lower.includes("conteudo") || lower === "content" || lower === "contenido") return "conteudo";
  if (lower.includes("estrutura") || lower === "structure" || lower === "estructura") return "estrutura";
  if (lower.includes("formacao") || lower === "education" || lower === "formacion") return "formacao";
  return "default";
}

/** Translate dimension title to current language */
function translateDimTitle(title: string): string {
  const key = dimKey(title);
  if (key === "experiencia") return t('dim_experiencia');
  if (key === "conteudo") return t('dim_conteudo');
  if (key === "estrutura") return t('dim_estrutura');
  if (key === "formacao") return t('dim_formacao');
  return title;
}

const TOOLTIP_KEYS: Record<string, { label: string; text: string }> = {
  experiencia: { label: 'quadrant_experiencia_label', text: 'quadrant_experiencia_text' },
  conteudo: { label: 'quadrant_conteudo_label', text: 'quadrant_conteudo_text' },
  estrutura: { label: 'quadrant_estrutura_label', text: 'quadrant_estrutura_text' },
  formacao: { label: 'quadrant_formacao_label', text: 'quadrant_formacao_text' },
  default: { label: 'quadrant_default_label', text: 'quadrant_default_text' },
};

const QuadrantCard = ({ title, score, benchmark, insight, strengths, weaknesses, tooltipLabel, tooltipText }: QuadrantCardProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const diff = score - benchmark;
  const diffText = diff > 0 ? `+${diff}` : `${diff}`;
  const diffColor = diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-muted-foreground";

  const key = dimKey(title);
  const tooltipKeys = TOOLTIP_KEYS[key] || TOOLTIP_KEYS["default"];
  const translatedTitle = translateDimTitle(title);
  const finalLabel = tooltipLabel || t(tooltipKeys.label, undefined, { title: translatedTitle });
  const finalText = tooltipText || t(tooltipKeys.text, undefined, { title: translatedTitle });

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">{translatedTitle}</h3>
        <div className="relative inline-flex">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
            className="p-0.5 rounded-full hover:bg-muted transition-colors"
          >
            <Info className="w-4 h-4 text-muted-foreground hover:text-[#C9A961] transition-colors" />
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-6 z-50 w-72 p-3 rounded-lg bg-foreground text-background text-xs leading-relaxed shadow-xl">
              <p className="font-semibold mb-1">{finalLabel}</p>
              <p>{finalText}</p>
              <div className="absolute -top-1.5 right-3 w-3 h-3 bg-foreground rotate-45" />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center">
        <ScoreGauge score={score} size={100} strokeWidth={6} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          {t('benchmark_label')}: <span className="font-semibold">{benchmark}</span>
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
