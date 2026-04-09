// ATSDeepScanBlock.tsx - ATS Deep Scan component
// Paid: full keyword table, format checklist, scores, suggestions
// Free: teaser with blurred preview + CTA to unlock
import { useState } from "react";
import { Search, CheckCircle, XCircle, AlertTriangle, Shield, FileSearch, Lock, ChevronDown, ChevronUp, Info } from "lucide-react";
import { t, pick, getLang } from '../pages/en/translations';

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
  isEN?: boolean;
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

const ATSDeepScanBlock = ({ data, isPaid = false, isEN = false, onUnlock }: ATSDeepScanBlockProps) => {
  const [expandedKeyword, setExpandedKeyword] = useState<number | null>(null);
  const [showAllKeywords, setShowAllKeywords] = useState(false);

  const verdictLabels: Record<string, { label: string; color: string; bg: string }> = {
    excellent: { label: t('excelente_2'), color: 'text-green-600', bg: 'bg-green-500/10 border-green-500/20' },
    good: { label: t('bom'), color: 'text-[#C9A961]', bg: 'bg-[#C9A961]/10 border-[#C9A961]/20' },
    needs_work: { label: t('precisa_de_melhoria_2'), color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' },
    critical: { label: t('crtico'), color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
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
      high: { text: t('alta'), cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
      medium: { text: lang === 'en' ? 'Medium' : lang === 'es' ? 'Media' : 'Média', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
      low: { text: t('baixa'), cls: 'bg-muted text-muted-foreground border-border' },
    };
    const l = labels[imp] || labels.low;
    return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${l.cls}`}>{l.text}</span>;
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, { text: string; cls: string }> = {
      found: { text: t('encontrada'), cls: 'text-green-600' },
      missing: { text: t('em_falta'), cls: 'text-red-500' },
      partial: { text: t('parcial'), cls: 'text-amber-600' },
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
              {t('anlise_completa_de_keywords_e')}
            </p>
          </div>
        </div>

        {/* Score Rings */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <ScoreRing score={data.overallATSScore} size={72} label={t('ats_global')} color={scoreColor(data.overallATSScore)} />
          <ScoreRing score={data.keywordScore} size={72} label={t('keywords')} color={scoreColor(data.keywordScore)} />
          <ScoreRing score={data.formatScore} size={72} label={t('formato')} color={scoreColor(data.formatScore)} />
        </div>
      </div>

      {isPaid ? (
        <div className="p-4 sm:p-6 space-y-6">
          {/* ── KEYWORD ANALYSIS ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#C9A961]" />
                <p className="text-xs font-semibold tracking-wider text-foreground">{t('anlise_de_keywords')}</p>
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
                <span>KEYWORD</span>
                <span className="text-center">{t('estado')}</span>
                <span className="text-center">{t('import')}</span>
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
                        <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{t('sugesto')}</p>
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
                  ? (t('ver_menos'))
                  : (pick(`Ver todas as ${data.keywords.length} keywords`, `Show all ${data.keywords.length} keywords`, `Ver todas as ${data.keywords.length} keywords`))
                }
                {showAllKeywords ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* ── FORMAT CHECKLIST ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold tracking-wider text-foreground">{t('checklist_de_formato_ats')}</p>
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
                        <div className="mt-2 p-2 bg-background/50 rounded border border-border">
                          <p className="text-[10px] font-semibold text-[#C9A961] mb-0.5">{t('como_corrigir')}</p>
                          <p className="text-xs text-foreground">{fc.fix}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SUMMARY ── */}
          <div className={`p-4 rounded-lg space-y-2 border ${
            data.overallATSScore >= 80 ? 'bg-green-500/5 border-green-500/20' :
            data.overallATSScore >= 60 ? 'bg-[#C9A961]/5 border-[#C9A961]/20' :
            data.overallATSScore >= 40 ? 'bg-yellow-500/5 border-yellow-500/20' :
            'bg-red-500/5 border-red-500/20'
          }`}>
            <p className={`text-xs font-semibold ${
              data.overallATSScore >= 80 ? 'text-green-600' :
              data.overallATSScore >= 60 ? 'text-[#C9A961]' :
              data.overallATSScore >= 40 ? 'text-yellow-600' :
              'text-red-500'
            }`}>{t('resumo_do_deep_scan')}</p>
            <p className="text-sm text-foreground leading-relaxed">
              {data.overallATSScore >= 80 ? (
                isEN
                  ? <>Your CV has <strong>excellent ATS compatibility</strong>. Keywords are well-placed and formatting follows best practices. Most ATS systems will parse your CV correctly.</>
                  : <>O teu CV tem <strong>excelente compatibilidade ATS</strong>. As keywords estão bem posicionadas e a formatação segue as melhores práticas. A maioria dos sistemas ATS vai ler o teu CV correctamente.</>
              ) : data.overallATSScore >= 60 ? (
                isEN
                  ? <>Your CV has <strong>good ATS compatibility</strong> but there are {missingCount} missing keyword{missingCount !== 1 ? 's' : ''} and {data.formatChecks.filter(f => f.status !== 'pass').length} formatting issue{data.formatChecks.filter(f => f.status !== 'pass').length !== 1 ? 's' : ''} to address. Fixing these points can significantly improve your approval rate.</>
                  : <>O teu CV tem <strong>boa compatibilidade ATS</strong> mas existem {missingCount} keyword{missingCount !== 1 ? 's' : ''} em falta e {data.formatChecks.filter(f => f.status !== 'pass').length} questões de formatação a resolver. Corrigir estes pontos pode melhorar significativamente a tua taxa de aprovação.</>
              ) : data.overallATSScore >= 40 ? (
                isEN
                  ? <>Your CV has <strong>moderate compatibility</strong> with ATS systems. With a <strong>{100 - data.overallATSScore}% rejection probability</strong>, about half of online applications may be filtered before reaching a recruiter. Addressing the {missingCount} missing keywords and {data.formatChecks.filter(f => f.status !== 'pass').length} formatting issues below can significantly reduce this rate.</>
                  : <>O teu CV tem uma <strong>compatibilidade moderada</strong> com sistemas ATS. Com <strong>{100 - data.overallATSScore}% de probabilidade de rejeição</strong>, cerca de metade das candidaturas online podem ser filtradas antes de chegar a um recrutador. Corrigir as {missingCount} keywords em falta e {data.formatChecks.filter(f => f.status !== 'pass').length} questões de formatação abaixo pode reduzir esta taxa significativamente.</>
              ) : (
                isEN
                  ? <>Your CV has <strong>low compatibility with ATS systems</strong>. With a <strong>{100 - data.overallATSScore}% rejection probability</strong>, most online applications will be automatically filtered out. It is urgent to restructure the format and add the missing keywords.</>
                  : <>O teu CV tem uma <strong>compatibilidade baixa com sistemas ATS</strong>. Com <strong>{100 - data.overallATSScore}% de probabilidade de rejeição</strong>, a maioria das candidaturas online será filtrada automaticamente. É urgente reformular a estrutura e adicionar as keywords em falta.</>
              )}
            </p>
          </div>
        </div>
      ) : (
        /* ── FREE TEASER ── */
        <div className="relative">
          {/* Blurred preview content */}
          <div className="p-4 sm:p-6 space-y-4 pointer-events-none select-none" style={{ filter: 'blur(4px)', opacity: 0.4 }}>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold tracking-wider text-foreground">{t('anlise_de_keywords')}</p>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-muted/30 rounded-lg border border-border" />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Shield className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold tracking-wider text-foreground">{t('checklist_de_formato_ats')}</p>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted/30 rounded-lg border border-border" />
              ))}
            </div>
          </div>

          {/* Unlock overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm">
            <Lock className="w-8 h-8 text-[#C9A961] mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">{t('ats_deep_scan')}</p>
            <p className="text-xs text-muted-foreground text-center max-w-xs mb-4 px-4">
              {t('desbloqueia_a_anlise_completa_de')
              }
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 mb-4">
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#C9A961]" /> {pick(`${data.keywords.length} keywords analisadas`, `${data.keywords.length} keywords analysed`, `${data.keywords.length} keywords analisadas`)}</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#C9A961]" /> {pick(`${data.formatChecks.length} verificações de formato`, `${data.formatChecks.length} format checks`, `${data.formatChecks.length} verificações de formato`)}</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#C9A961]" /> {t('sugestes_de_correo_personalizadas')}</li>
            </ul>
            {onUnlock && (
              <button
                onClick={onUnlock}
                className="px-6 py-2.5 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {t('desbloquear_relatrio_completo')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ATSDeepScanBlock;
