/**
 * LiveMatchPanel — Full "Live Match" experience.
 *
 * Contains:
 * 1. JD textarea input (paste job description)
 * 2. Score dashboard (3 ring scores + summary)
 * 3. Keyword table (found/partial/missing with importance)
 * 4. LiveMatchEditor (annotated CV text with highlights)
 * 5. Format checklist
 *
 * Props:
 * - cvText: the extracted CV text
 * - lang: 'pt' | 'en' | 'es'
 * - isPaid: whether the user has paid (standalone) — controls paywall
 * - onRequestPayment: callback to trigger payment modal (standalone)
 * - isMemberArea: if true, always shows full content (no paywall)
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { runLiveMatch, isURL, type LiveMatchResult, type MatchedKeyword } from '../lib/liveMatchEngine';
import LiveMatchEditor from './LiveMatchEditor';
import {
  Crosshair, Zap, FileSearch, CheckCircle, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, Clipboard, Sparkles, Lock, ArrowRight,
  BarChart3, Shield, Type, Search
} from 'lucide-react';

interface LiveMatchPanelProps {
  cvText: string;
  lang?: 'pt' | 'en' | 'es';
  isPaid?: boolean;
  onRequestPayment?: () => void;
  isMemberArea?: boolean;
  /** Initial JD text (e.g. from sessionStorage) */
  initialJD?: string;
}

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score, label, size = 64, color }: { score: number; label: string; size?: number; color: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f0f0ee" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-sm font-bold text-[#333]">{score}</span>
      </div>
      <span className="text-[9px] text-[#888] font-medium text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Keyword Row ─────────────────────────────────────────────────────────────

function KeywordRow({ kw, lang }: { kw: MatchedKeyword; lang: 'pt' | 'en' | 'es' }) {
  const [expanded, setExpanded] = useState(false);
  const pick = (pt: string, en: string, es: string) => (lang === 'es' ? es : lang === 'en' ? en : pt);

  return (
    <div className="border-b border-[#f0f0ee] last:border-b-0">
      <div
        className="flex items-center justify-between px-3 py-1.5 hover:bg-[#fafaf9] cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {kw.status === 'found' ? <CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> :
           kw.status === 'partial' ? <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" /> :
           <XCircle className="w-3 h-3 text-red-500 shrink-0" />}
          <span className="text-[11px] text-[#333] truncate">{kw.keyword}</span>
          {kw.foundVariant && (
            <span className="text-[9px] text-[#aaa] italic truncate">≈ {kw.foundVariant}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[8px] px-1 py-0.5 rounded ${
            kw.category === 'technical' ? 'bg-blue-50 text-blue-600' :
            kw.category === 'soft-skill' ? 'bg-purple-50 text-purple-600' :
            kw.category === 'certification' ? 'bg-emerald-50 text-emerald-600' :
            kw.category === 'tool' ? 'bg-cyan-50 text-cyan-600' :
            kw.category === 'education' ? 'bg-indigo-50 text-indigo-600' :
            kw.category === 'experience' ? 'bg-orange-50 text-orange-600' :
            'bg-gray-50 text-gray-500'
          }`}>
            {kw.category === 'technical' ? pick('Técnica', 'Technical', 'Técnica') :
             kw.category === 'soft-skill' ? pick('Soft Skill', 'Soft Skill', 'Habilidad blanda') :
             kw.category === 'certification' ? pick('Certificação', 'Certification', 'Certificación') :
             kw.category === 'tool' ? pick('Ferramenta', 'Tool', 'Herramienta') :
             kw.category === 'education' ? pick('Formação', 'Education', 'Formación') :
             kw.category === 'experience' ? pick('Experiência', 'Experience', 'Experiencia') :
             pick('Outro', 'Other', 'Otro')}
          </span>
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
            kw.importance === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
            kw.importance === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
            'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            {kw.importance === 'high' ? pick('Alta', 'High', 'Alta') : kw.importance === 'medium' ? pick('Média', 'Med', 'Media') : pick('Baixa', 'Low', 'Baja')}
          </span>
          {kw.suggestion && (
            expanded ? <ChevronUp className="w-3 h-3 text-[#ccc]" /> : <ChevronDown className="w-3 h-3 text-[#ccc]" />
          )}
        </div>
      </div>
      {expanded && kw.suggestion && (
        <div className="px-3 pb-2 pl-7">
          <div className="p-2 bg-[#C9A961]/5 border border-[#C9A961]/15 rounded text-[10px] text-[#666] font-light">
            <span className="text-[#C9A961] font-medium">→ </span>{kw.suggestion}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export default function LiveMatchPanel({
  cvText, lang = 'pt', isPaid = false, onRequestPayment, isMemberArea = false, initialJD = ''
}: LiveMatchPanelProps) {
  const [jdText, setJdText] = useState(initialJD);
  const [result, setResult] = useState<LiveMatchResult | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'keywords' | 'format'>('editor');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const pick = (pt: string, en: string, es: string) => (lang === 'es' ? es : lang === 'en' ? en : pt);
  const hasAccess = isMemberArea || isPaid;

  const [urlWarning, setUrlWarning] = useState(false);

  // Auto-analyse with debounce
  const analyse = useCallback((jd: string) => {
    if (!cvText.trim() || !jd.trim()) {
      setResult(null);
      setUrlWarning(false);
      return;
    }
    // Detect URLs — don't analyse, show warning instead
    if (isURL(jd)) {
      setResult(null);
      setUrlWarning(true);
      return;
    }
    setUrlWarning(false);
    setIsAnalysing(true);
    // Small delay to show loading state
    setTimeout(() => {
      const res = runLiveMatch(cvText, jd, lang);
      setResult(res);
      setIsAnalysing(false);
    }, 300);
  }, [cvText, lang]);

  const handleJDChange = useCallback((value: string) => {
    setJdText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => analyse(value), 600);
  }, [analyse]);

  // Run initial analysis if JD is provided (but NOT if it's a URL)
  useEffect(() => {
    if (initialJD.trim() && cvText.trim() && !isURL(initialJD)) {
      analyse(initialJD);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setJdText(text);
        analyse(text);
      }
    } catch {
      // Clipboard API not available
    }
  }, [analyse]);

  // Score color helper
  const scoreColor = (score: number) =>
    score >= 80 ? '#22c55e' : score >= 60 ? '#C9A961' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A961] to-[#B8943F] flex items-center justify-center">
          <Crosshair className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#333] flex items-center gap-1.5">
            {pick('Live Match', 'Live Match', 'Análisis en Vivo')}
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] border border-[#C9A961]/20">
              {pick('Tempo Real', 'Real-time', 'Tiempo real')}
            </span>
          </h3>
          <p className="text-[10px] text-[#888] font-light">
            {pick('Cole a descrição da vaga e veja instantaneamente a compatibilidade ATS', 'Paste the job description and instantly see ATS compatibility', 'Pega la descripción de la vacante y ve al instante la compatibilidad ATS')}
          </p>
        </div>
      </div>

      {/* JD Input */}
      <div className="relative">
        <textarea
          value={jdText}
          onChange={(e) => handleJDChange(e.target.value)}
          placeholder={pick('Cole aqui a descrição da vaga / job description...', 'Paste the job description here...', 'Pega aquí la descripción de la vacante...')}
          className="w-full h-28 p-3 pr-10 text-[11px] text-[#333] bg-[#fafaf9] border border-[#e8e8e6] rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#C9A961]/40 focus:border-[#C9A961]/40 placeholder:text-[#bbb] font-light transition-colors"
        />
        <button
          onClick={handlePaste}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-white border border-[#e8e8e6] hover:border-[#C9A961]/40 hover:bg-[#C9A961]/5 transition-colors"
          title={pick('Colar da área de transferência', 'Paste from clipboard', 'Pegar desde el portapapeles')}
        >
          <Clipboard className="w-3 h-3 text-[#888]" />
        </button>
        {jdText.trim() && (
          <div className="absolute bottom-2 right-2 text-[9px] text-[#bbb]">
            {jdText.split(/\s+/).filter(Boolean).length} {pick('palavras', 'words', 'palabras')}
          </div>
        )}
      </div>

      {/* URL Warning */}
      {urlWarning && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-700">
            {pick('Detetámos um link em vez de uma descrição de vaga. Para resultados precisos, copie e cole o texto completo da descrição da vaga (não o URL).', 'We detected a URL instead of a job description. For accurate results, please copy and paste the full job description text (not the URL).', 'Detectamos un enlace en lugar de una descripción de vacante. Para obtener resultados precisos, copia y pega el texto completo de la descripción de la vacante (no la URL).')}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isAnalysing && (
        <div className="flex items-center justify-center gap-2 py-6">
          <div className="w-4 h-4 border-2 border-[#C9A961] border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] text-[#888]">{pick('A analisar...', 'Analysing...', 'Analizando...')}</span>
        </div>
      )}

      {/* Results */}
      {result && !isAnalysing && (
        <>
          {/* Score Dashboard */}
          <div className="bg-[#fafaf9] border border-[#e8e8e6] rounded-lg p-4">
            <div className="flex items-center justify-around">
              <div className="relative">
                <ScoreRing score={result.globalScore} label={pick('Global', 'Overall', 'Global')} size={68} color={scoreColor(result.globalScore)} />
              </div>
              <div className="relative">
                <ScoreRing score={result.keywordScore} label="Keywords" size={56} color={scoreColor(result.keywordScore)} />
              </div>
              <div className="relative">
                <ScoreRing score={result.formatScore} label={pick('Formato', 'Format', 'Formato')} size={56} color={scoreColor(result.formatScore)} />
              </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-[#e8e8e6]">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-[10px] text-[#666]">{result.foundCount} {pick('encontradas', 'found', 'encontradas')}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] text-[#666]">{result.partialCount} {pick('parciais', 'partial', 'parciales')}</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" />
                <span className="text-[10px] text-[#666]">{result.missingCount} {pick('em falta', 'missing', 'faltantes')}</span>
              </div>
            </div>

            {/* Summary */}
            <p className="text-[10px] text-[#666] font-light text-center mt-2">{result.summary}</p>
          </div>

          {/* Paywall for non-paid standalone users */}
          {!hasAccess ? (
            <div className="relative">
              {/* Blurred preview */}
              <div className="filter blur-[6px] pointer-events-none select-none opacity-60">
                <div className="bg-white border border-[#e8e8e6] rounded-lg p-4 space-y-3">
                  <div className="flex gap-2">
                    {[
                      pick('Editor CV', 'CV Editor', 'Editor CV'),
                      pick('Keywords', 'Keywords', 'Palabras clave'),
                      pick('Formato', 'Format', 'Formato'),
                    ].map(tab => (
                      <div key={tab} className="px-3 py-1.5 rounded-md bg-[#f0f0ee] text-[10px] text-[#888]">{tab}</div>
                    ))}
                  </div>
                  <div className="h-48 bg-[#fafaf9] rounded-lg" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-6 bg-[#f0f0ee] rounded" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Paywall overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
                <div className="text-center space-y-3 max-w-[260px]">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#C9A961]/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#C9A961]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#333]">
                      {pick('Live Match Completo', 'Full Live Match', 'Análisis en Vivo Completo')}
                    </p>
                    <p className="text-[10px] text-[#888] font-light mt-1">
                      {pick('Desbloqueie o editor com highlights, tabela de keywords e checklist de formato ATS.', 'Unlock the editor with highlights, keyword table and ATS format checklist.', 'Desbloquea el editor con highlights, tabla de palabras clave y checklist de formato ATS.')}
                    </p>
                  </div>
                  <div className="space-y-1.5 text-left">
                    {[
                      pick('CV anotado com keywords destacadas', 'Annotated CV with highlighted keywords', 'CV anotado con palabras clave destacadas'),
                      pick('Sugestões de reformulação inline', 'Inline reformulation suggestions', 'Sugerencias de reformulación inline'),
                      pick('Checklist de formato ATS completa', 'Complete ATS format checklist', 'Checklist completa de formato ATS'),
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#C9A961] shrink-0" />
                        <span className="text-[10px] text-[#555]">{item}</span>
                      </div>
                    ))}
                  </div>
                  {onRequestPayment && (
                    <button
                      onClick={onRequestPayment}
                      className="mt-2 px-4 py-2 bg-gradient-to-r from-[#C9A961] to-[#B8943F] text-white text-[11px] font-medium rounded-lg hover:shadow-md transition-all flex items-center gap-1.5 mx-auto"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {pick('Desbloquear Relatório Completo', 'Unlock Full Report', 'Desbloquear informe completo')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="flex gap-1 bg-[#f5f5f3] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                    activeTab === 'editor' ? 'bg-white text-[#333] shadow-sm' : 'text-[#888] hover:text-[#555]'
                  }`}
                >
                  <FileSearch className="w-3 h-3" />
                  {pick('Editor CV', 'CV Editor', 'Editor CV')}
                </button>
                <button
                  onClick={() => setActiveTab('keywords')}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                    activeTab === 'keywords' ? 'bg-white text-[#333] shadow-sm' : 'text-[#888] hover:text-[#555]'
                  }`}
                >
                  <Search className="w-3 h-3" />
                  {pick('Keywords', 'Keywords', 'Palabras clave')} ({result.totalCount})
                </button>
                <button
                  onClick={() => setActiveTab('format')}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                    activeTab === 'format' ? 'bg-white text-[#333] shadow-sm' : 'text-[#888] hover:text-[#555]'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  {pick('Formato', 'Format', 'Formato')} ({result.formatChecks.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'editor' && (
                <LiveMatchEditor
                  cvText={cvText}
                  annotations={result.annotations}
                  missingKeywords={result.keywords.filter(k => k.status === 'missing')}
                  lang={lang}
                />
              )}

              {activeTab === 'keywords' && (
                <div className="border border-[#e8e8e6] rounded-lg overflow-hidden bg-white">
                  {/* Filter tabs */}
                  <div className="flex gap-0 border-b border-[#e8e8e6] bg-[#fafaf9]">
                    {[
                      { key: 'all', label: pick('Todas', 'All', 'Todas'), count: result.totalCount },
                      { key: 'found', label: pick('Encontradas', 'Found', 'Encontradas'), count: result.foundCount, color: 'text-green-600' },
                      { key: 'partial', label: pick('Parciais', 'Partial', 'Parciales'), count: result.partialCount, color: 'text-amber-600' },
                      { key: 'missing', label: pick('Em Falta', 'Missing', 'Faltante'), count: result.missingCount, color: 'text-red-600' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        className={`flex-1 px-2 py-1.5 text-[9px] font-medium border-b-2 transition-colors ${
                          'border-transparent text-[#888] hover:text-[#555]'
                        }`}
                      >
                        <span className={tab.color || ''}>{tab.label}</span>
                        <span className="ml-0.5 text-[#bbb]">({tab.count})</span>
                      </button>
                    ))}
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {result.keywords.map((kw, i) => (
                      <KeywordRow key={i} kw={kw} lang={lang} />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'format' && (
                <div className="space-y-1.5">
                  {result.formatChecks.map((fc, i) => (
                    <div key={i} className={`p-2.5 rounded-lg border ${
                      fc.status === 'pass' ? 'border-green-200 bg-green-50' :
                      fc.status === 'warning' ? 'border-amber-200 bg-amber-50' :
                      'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start gap-1.5">
                        {fc.status === 'pass' ? <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> :
                         fc.status === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" /> :
                         <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />}
                        <div>
                          <p className="text-[11px] font-medium text-[#333]">{fc.check}</p>
                          <p className="text-[10px] text-[#666] font-light">{fc.detail}</p>
                          {fc.fix && (
                            <p className="text-[10px] text-[#C9A961] font-light mt-0.5 flex items-center gap-0.5">
                              <ArrowRight className="w-2.5 h-2.5 shrink-0" /> {fc.fix}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Empty state */}
      {!result && !isAnalysing && !jdText.trim() && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#f5f5f3] flex items-center justify-center mb-3">
            <Crosshair className="w-5 h-5 text-[#ccc]" />
          </div>
          <p className="text-[11px] text-[#888] font-light max-w-[200px]">
            {pick('Cole a descrição da vaga acima para ver a compatibilidade ATS em tempo real.', 'Paste the job description above to see ATS compatibility in real-time.', 'Pega la descripción de la vacante arriba para ver la compatibilidad ATS en tiempo real.')}
          </p>
        </div>
      )}
    </div>
  );
}
