import { useState } from "react";
import ScoreGauge from "./ScoreGauge";
import { Info } from "lucide-react";

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

const QUADRANT_TOOLTIPS: Record<string, { label: string; text: string }> = {
  "Experiência": {
    label: "O que avalia a Experiência?",
    text: "Avalia a descrição das tuas experiências profissionais, incluindo progressão de carreira, relevância dos cargos, clareza das responsabilidades e quantificação de resultados alcançados.",
  },
  "Experience": {
    label: "What does Experience evaluate?",
    text: "Evaluates the description of your professional experiences, including career progression, role relevance, clarity of responsibilities and quantification of results achieved.",
  },
  "Conteúdo": {
    label: "O que avalia o Conteúdo?",
    text: "Avalia a qualidade do texto do teu CV, incluindo uso de verbos de acção, quantificação de resultados, clareza, relevância das informações e densidade de palavras-chave do sector.",
  },
  "Content": {
    label: "What does Content evaluate?",
    text: "Evaluates the quality of your CV text, including use of action verbs, quantification of results, clarity, relevance of information and sector keyword density.",
  },
  "Estrutura": {
    label: "O que avalia a Estrutura?",
    text: "Avalia a organização visual do teu CV, incluindo hierarquia de informação, uso de espaço em branco, consistência de formatação, legibilidade e compatibilidade com sistemas ATS.",
  },
  "Structure": {
    label: "What does Structure evaluate?",
    text: "Evaluates the visual organisation of your CV, including information hierarchy, use of white space, formatting consistency, readability and ATS compatibility.",
  },
  "Formação": {
    label: "O que avalia a Formação?",
    text: "Avalia a apresentação da tua formação académica e certificações, incluindo relevância para o perfil, actualidade, instituições frequentadas e alinhamento com a trajectória profissional.",
  },
  "Education": {
    label: "What does Education evaluate?",
    text: "Evaluates the presentation of your academic background and certifications, including relevance to profile, currency, institutions attended and alignment with career trajectory.",
  },
};

const QuadrantCard = ({ title, score, benchmark, insight, strengths, weaknesses, tooltipLabel, tooltipText }: QuadrantCardProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const diff = score - benchmark;
  const diffText = diff > 0 ? `+${diff}` : `${diff}`;
  const diffColor = diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-muted-foreground";

  const builtIn = QUADRANT_TOOLTIPS[title];
  const finalLabel = tooltipLabel || builtIn?.label || `O que avalia ${title}?`;
  const finalText = tooltipText || builtIn?.text || `Avaliação detalhada da dimensão ${title} do teu CV, comparada com o benchmark do mercado.`;

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
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
