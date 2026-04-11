// ATSDeepScanBlock.tsx - ATS Deep Scan component
// Paid: full keyword table, format checklist, scores, suggestions
// Free: teaser with blurred preview + CTA to unlock
import { useState } from "react";
import { Search, CheckCircle, XCircle, AlertTriangle, Shield, FileSearch, Lock, ChevronDown, ChevronUp, Info } from "lucide-react";

interface ATSKeyword {
  keyword: string;
  status: 'found' | 'missing' | 'partial';
  importance: 'high' | 'medium' | 'low';
  context?: string;
  suggestion?: string;
}

interface ATSFormatCheck {
  check: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
  fix?: string;
}

interface ATSDeepScanData {
  keywordScore: number;
  formatScore: number;
  overallATSScore: number;
  verdict: 'excellent' | 'good' | 'needs_work' | 'critical';
  keywords: ATSKeyword[];
  formatChecks: ATSFormatCheck[];
}

interface ATSDeepScanBlockProps {
  data: ATSDeepScanData;
  isPaid?: boolean;
  lang?: 'pt' | 'en' | 'es';
  onUnlock?: () => void;
}

function ScoreRing({ score, size = 64, label, color }: { score: number; size?: number; label: string; color: string }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/20" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${circumference}`} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

const ATSDeepScanBlock = ({ data, isPaid = false, lang = 'pt', onUnlock }: ATSDeepScanBlockProps) => {
  const [expandedKeyword, setExpandedKeyword] = useState<number | null>(null);
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  const pick = (pt: string, en: string, es: string) => {
    if (lang === 'en') return en;
    if (lang === 'es') return es;
    return pt;
  };

  const verdictLabels: Record<string, { label: string; color: string; bg: string }> = {
    excellent: { label: pick('Excelente', 'Excellent', 'Excelente'), color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/20' },
    good: { label: pick('Bom', 'Good', 'Bueno'), color: 'text-[#C9A961]', bg: 'bg-[#C9A961]/10 border-[#C9A961]/20' },
    needs_work: { label: pick('Precisa de Melhoria', 'Needs Work', 'Necesita Mejoras'), color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' },
    critical: { label: pick('Crítico', 'Critical', 'Crítico'), color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  };

  const verdict = verdictLabels[data.verdict] || verdictLabels.needs_work;

  const statusIcon = (status: string) => {
    switch (status) {
      case 'found':
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
      case 'missing':
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
      case 'partial':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return null;
    }
  };

  const importanceLabel = (imp: string) => {
    const labels: Record<string, { text: string; cls: string }> = {
      high: { text: pick('Alta', 'High', 'Alta'), cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
      medium: { text: pick('Média', 'Medium', 'Media'), cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
      low: { text: pick('Baixa', 'Low', 'Baja'), cls: 'bg-muted text-muted-foreground border-border' },
    };
    const l = labels[imp] || labels.low;
    return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${l.cls}`}>{l.text}</span>;
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, { text: string; cls: string }> = {
      found: { text: pick('Encontrada', 'Found', 'Encontrada'), cls: 'text-green-600' },
      missing: { text: pick('Em Falta', 'Missing', 'Faltante'), cls: 'text-red-500' },
      partial: { text: pick('Parcial', 'Partial', 'Parcial'), cls: 'text-amber-600' },
    };
    return labels[status] || labels.missing;
  };

  const foundCount = data.keywords.filter(k => k.status === 'found').length;
  const missingCount = data.keywords.filter(k => k.status === 'missing').length;
  const partialCount = data.keywords.filter(k => k.status === 'partial').length;

  const visibleKeywords = showAllKeywords ? data.keywords : data.keywords.slice(0, 6);

  const scoreColor = (s: number) => s >= 80 ? '#22c55e' : s >= 60 ? '#C9A961' : s >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="rounded-lg border-2 border-[#C9A961]/30 bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#C9A961]/10 to-[#C9A961]/5 p-4 sm:p-6 border-b border-[#C9A961]/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/10 flex items-center justify-center shrink-0">
            <FileSearch className="w-5 h-5 text-[#C9A961]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-semibold tracking-wider text-[#C9A961]">ATS DEEP SCAN</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${verdict.bg} ${verdict.color}`}>{verdict.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pick('Análise completa de keywords e formatação para sistemas ATS', 'Complete keyword and formatting analysis for ATS systems', 'Análisis completo de palabras clave y formato para sistemas ATS')}
            </p>
          </div>
        </div>

        {/* Score Rings */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <ScoreRing score={data.overallATSScore} size={72} label={pick('ATS Global', 'Overall ATS', 'ATS Global')} color={scoreColor(data.overallATSScore)} />
          <ScoreRing score={data.keywordScore} size={72} label={pick('Keywords', 'Keywords', 'Palabras Clave')} color={scoreColor(data.keywordScore)} />
          <ScoreRing score={data.formatScore} size={72} label={pick('Formato', 'Format', 'Formato')} color={scoreColor(data.formatScore)} />
        </div>
      </div>

      {isPaid ? (
        <div className="p-4 sm:p-6 space-y-6">
          {/* ── KEYWORD ANALYSIS ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#C9A961]" />
                <p className="text-xs font-semibold tracking-wider text-foreground">{pick('ANÁLISE DE KEYWORDS', 'KEYWORD ANALYSIS', 'ANÁLISIS DE PALABRAS CLAVE')}</p>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" /> {foundCount}</span>
                <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3 h-3" /> {partialCount}</span>
                <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3 h-3" /> {missingCount}</span>
              </div>
            </div>

            {/* Keyword Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_80px_70px] sm:grid-cols-[1fr_100px_80px] gap-2 p-2.5 bg-muted/30 border-b border-border text-[10px] font-semibold text-muted-foreground">
                <span>{pick('KEYWORD', 'KEYWORD', 'PALABRA CLAVE')}</span>
                <span className="text-center">{pick('ESTADO', 'STATUS', 'ESTADO')}</span>
                <span className="text-center">{pick('IMPORT.', 'IMPORTANCE', 'IMPORT.')}</span>
              </div>

              {/* Keyword Rows */}
              {visibleKeywords.map((kw, i) => {
                const sl = statusLabel(kw.status);
                const isExpanded = expandedKeyword === i;
                return (
                  <div key={i}>
                    <div
                      className={`grid grid-cols-[1fr_80px_70px] sm:grid-cols-[1fr_100px_80px] gap-2 p-2.5 items-center border-b border-border last:border-b-0 ${kw.suggestion ? 'cursor-pointer hover:bg-muted/20' : ''} transition-colors`}
                      onClick={() => kw.suggestion && setExpandedKeyword(isExpanded ? null : i)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {statusIcon(kw.status)}
                        <span className="text-sm text-foreground truncate">{kw.keyword}</span>
                        {kw.suggestion && (
                          isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold text-center ${sl.cls}`}>{sl.text}</span>
                      <div className="flex justify-center">{importanceLabel(kw.importance)}</div>
                    </div>
                    {/* Expanded suggestion */}
                    {isExpanded && kw.suggestion && (
                      <div className="px-4 py-3 bg-[#C9A961]/5 border-b border-[#C9A961]/10">
                        <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{pick('SUGESTÃO', 'SUGGESTION', 'SUGERENCIA')}</p>
                        <p className="text-xs text-foreground">{kw.suggestion}</p>
                        {kw.context && <p className="text-[10px] text-muted-foreground mt-1">{kw.context}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {data.keywords.length > 6 && (
              <button
                onClick={() => setShowAllKeywords(!showAllKeywords)}
                className="text-xs text-[#C9A961] hover:text-[#A88B4E] font-medium flex items-center gap-1 mx-auto"
              >
                {showAllKeywords
                  ? pick('Ver menos', 'Show less', 'Ver menos')
                  : pick(`Ver todas as ${data.keywords.length} keywords`, `Show all ${data.keywords.length} keywords`, `Ver todas las ${data.keywords.length} palabras clave`)
                }
                {showAllKeywords ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* ── FORMAT CHECKLIST ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold tracking-wider text-foreground">{pick('CHECKLIST DE FORMATO ATS', 'ATS FORMAT CHECKLIST', 'CHECKLIST DE FORMATO ATS')}</p>
            </div>

            <div className="space-y-2">
              {data.formatChecks.map((fc, i) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  fc.status === 'pass' ? 'border-green-500/20 bg-green-500/5' :
                  fc.status === 'warning' ? 'border-amber-500/20 bg-amber-500/5' :
                  'border-red-500/20 bg-red-500/5'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {statusIcon(fc.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{fc.check}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{fc.detail}</p>
                      {fc.fix && (
                        <div className="mt-2 p-2 bg-background/50 rounded border border-border/50">
                          <p className="text-[10px] font-semibold text-[#C9A961] uppercase">{pick('COMO CORRIGIR', 'HOW TO FIX', 'CÓMO CORREGIR')}</p>
                          <p className="text-xs text-foreground mt-0.5">{fc.fix}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── FREE TEASER ── */
        <div className="relative p-6 overflow-hidden">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#C9A961] flex items-center justify-center mb-4 shadow-lg shadow-[#C9A961]/20">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-bold text-foreground mb-2">{pick('Desbloqueia o ATS Deep Scan', 'Unlock ATS Deep Scan', 'Desbloquea ATS Deep Scan')}</h4>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              {pick('Acede à análise detalhada de keywords, checklist de formatação e sugestões específicas para passar nos filtros ATS.', 'Get detailed keyword analysis, formatting checklist, and specific suggestions to pass ATS filters.', 'Accede al análisis detallado de palabras clave, checklist de formato y sugerencias específicas para superar los filtros ATS.')}
            </p>
            <button
              onClick={onUnlock}
              className="px-6 py-2.5 bg-[#C9A961] hover:bg-[#A88B4E] text-white rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              {pick('DESBLOQUEAR AGORA', 'UNLOCK NOW', 'DESBLOQUEAR AHORA')}
            </button>
          </div>

          {/* Blurred Content Preview */}
          <div className="opacity-20 select-none pointer-events-none space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="border border-border rounded-lg h-40 bg-muted/20" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/20 rounded-lg border border-border" />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-muted/30 p-3 border-t border-border flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground leading-tight">
          {pick(
            'Os sistemas ATS (Applicant Tracking Systems) são usados por 95% das empresas Fortune 500 para filtrar currículos automaticamente.',
            'ATS (Applicant Tracking Systems) are used by 95% of Fortune 500 companies to automatically filter resumes.',
            'Los sistemas ATS (Applicant Tracking Systems) son utilizados por el 95% de las empresas Fortune 500 para filtrar currículos automáticamente.'
          )}
        </p>
      </div>
    </div>
  );
};

export default ATSDeepScanBlock;
