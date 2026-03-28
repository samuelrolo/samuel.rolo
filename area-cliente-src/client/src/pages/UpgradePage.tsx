/*
 * UpgradePage — Mostrado quando o utilizador está autenticado mas sem subscrição activa
 * Design: Consultoria de Luxo Silenciosa
 * Inclui: boas-vindas personalizadas, histórico de análises, benefícios por tier, testemunhos, CTA para planos
 */
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Link } from 'wouter';
import {
  Sparkles, Check, BarChart3, Zap, Star, ArrowRight,
  FileText, Linkedin, Bot, BookOpen, Briefcase, Lock,
  Shield, RefreshCcw, Users, Clock, ChevronDown, ChevronUp,
  FileSearch, Compass, Loader2, CheckCircle
} from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import { useState, useEffect, useMemo } from 'react';

type Tier = 'essential' | 'growth' | 'pro';
type Period = 'monthly' | 'semiannual' | 'annual';
type SavedAnalysis = { id: string; user_id: string; analysis_type: string; data: Record<string, any>; created_at: string; };

interface PriceMap { monthly: number; semiannual: number; annual: number; }
interface TierConfig {
  tier: Tier;
  icon: React.ReactNode;
  prices: PriceMap;
  taglineKey: string;
  benefits: string[];
  limitKey: string;
  roiKey?: string;
  valueAnchorKey?: string;
  bonuses?: string[];
  notIncluded?: string[];
  badge?: string;
  highlight?: boolean;
}

const TOOL_CONFIG: Record<string, { label: string; icon: typeof FileSearch; color: string; bgColor: string; borderColor: string }> = {
  cv_analyser:         { label: 'CV Analyser',         icon: FileSearch, color: 'text-blue-600',    bgColor: 'bg-blue-50',    borderColor: 'border-blue-200' },
  linkedin_roaster:    { label: 'LinkedIn Roaster',    icon: Linkedin,   color: 'text-amber-600',   bgColor: 'bg-amber-50',   borderColor: 'border-amber-200' },
  career_path:         { label: 'Career Path',         icon: Compass,    color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  career_intelligence: { label: 'Career Intelligence', icon: BarChart3,  color: 'text-violet-600',  bgColor: 'bg-violet-50',  borderColor: 'border-violet-200' },
  career_energy:       { label: 'Career Energy Score', icon: Sparkles,   color: 'text-pink-600',    bgColor: 'bg-pink-50',    borderColor: 'border-pink-200' },
};

const tiers: TierConfig[] = [
  {
    tier: 'essential',
    icon: <Check className="w-4 h-4" />,
    prices: { monthly: 9.90, semiannual: 49, annual: 79 },
    taglineKey: 'sub.essential.tagline',
    benefits: ['sub.essential.b1','sub.essential.b2','sub.essential.b3','sub.essential.b4','sub.essential.b5','sub.essential.b6'],
    limitKey: 'sub.essential.limit',
    roiKey: 'sub.essential.roi',
    valueAnchorKey: 'sub.essential.anchor',
    notIncluded: ['sub.notIncluded.vagas','sub.notIncluded.ebooks','sub.notIncluded.careerPath','sub.notIncluded.careerIntel'],
  },
  {
    tier: 'growth',
    icon: <BarChart3 className="w-4 h-4" />,
    prices: { monthly: 19.90, semiannual: 99, annual: 159 },
    taglineKey: 'sub.growth.tagline',
    benefits: ['sub.growth.b1','sub.growth.b2','sub.growth.b3','sub.growth.b4','sub.growth.b5'],
    limitKey: 'sub.growth.limit',
    roiKey: 'sub.growth.roi',
    bonuses: ['sub.growth.bonus'],
    notIncluded: ['sub.notIncluded.careerIntel'],
    badge: 'sub.recommended',
    highlight: true,
  },
  {
    tier: 'pro',
    icon: <Zap className="w-4 h-4" />,
    prices: { monthly: 39, semiannual: 199, annual: 299 },
    taglineKey: 'sub.pro.tagline',
    benefits: ['sub.pro.b1','sub.pro.b2','sub.pro.b3','sub.pro.b4','sub.pro.b5'],
    limitKey: 'sub.pro.limit',
    roiKey: 'sub.pro.roi',
    bonuses: ['sub.pro.bonus1','sub.pro.bonus2'],
    badge: 'sub.bestValue',
  },
];

const testimonials = [
  { name: 'Ana M.', role: 'Senior Manager', textKey: 'sub.testimonial1', initials: 'AM', color: 'bg-rose-100 text-rose-700' },
  { name: 'Diogo S.', role: 'Software Engineer', textKey: 'sub.testimonial2', initials: 'DS', color: 'bg-sky-100 text-sky-700' },
  { name: 'Mariana C.', role: 'Product Manager', textKey: 'sub.testimonial3', initials: 'MC', color: 'bg-amber-100 text-amber-700' },
];

const previewFeatures = [
  { icon: FileText, labelPt: 'CV Analyser', labelEn: 'CV Analyser', descPt: 'Análise detalhada do teu CV com score ATS', descEn: 'Detailed CV analysis with ATS score' },
  { icon: Linkedin, labelPt: 'LinkedIn Roaster', labelEn: 'LinkedIn Roaster', descPt: 'Feedback profundo ao teu perfil LinkedIn', descEn: 'Deep feedback on your LinkedIn profile' },
  { icon: Bot, labelPt: 'Career Bot', labelEn: 'Career Bot', descPt: 'Assistente IA de carreira personalizado', descEn: 'Personalised AI career assistant' },
  { icon: BookOpen, labelPt: 'Conteúdos Premium', labelEn: 'Premium Content', descPt: 'E-books, templates e recursos exclusivos', descEn: 'E-books, templates and exclusive resources' },
  { icon: Briefcase, labelPt: 'Feed de Vagas', labelEn: 'Jobs Feed', descPt: 'Vagas curadas com match inteligente', descEn: 'Curated jobs with intelligent matching' },
  { icon: BarChart3, labelPt: 'Career Path', labelEn: 'Career Path', descPt: 'Planeamento estratégico de carreira com IA', descEn: 'AI-powered strategic career planning' },
];

/* ─── Mini AnalysisResult viewer (simplified for free users) ─── */
function AnalysisResultMini({ data, lang }: { data: any; lang: string }) {
  const raw = data?.analysis || data;
  if (!raw) return <p className="text-xs text-[#999] italic">{lang === 'pt' ? 'Sem dados detalhados' : 'No detailed data'}</p>;

  const normalizeScore = (obj: any): number | undefined => {
    if (!obj) return undefined;
    for (const k of ['score', 'overallScore', 'overall_score', 'ats_score', 'atsScore']) {
      if (typeof obj[k] === 'number') return obj[k];
    }
    if (obj.analysis) return normalizeScore(obj.analysis);
    return undefined;
  };

  const normalizeArray = (obj: any, ...keys: string[]): string[] => {
    if (!obj) return [];
    for (const k of keys) {
      if (Array.isArray(obj[k]) && obj[k].length > 0) return obj[k].map((v: any) => typeof v === 'string' ? v : (v?.text || v?.title || v?.description || JSON.stringify(v)));
    }
    if (obj.analysis) return normalizeArray(obj.analysis, ...keys);
    return [];
  };

  const normalizeString = (obj: any, ...keys: string[]): string | undefined => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (typeof obj[k] === 'string' && obj[k].trim()) return obj[k];
    }
    if (obj.analysis) return normalizeString(obj.analysis, ...keys);
    return undefined;
  };

  const analysis = raw;
  const nScore = normalizeScore(analysis);
  const nSummary = normalizeString(analysis, 'summary', 'executive_summary', 'resumo');
  const nKeywords = normalizeArray(analysis, 'keywords', 'key_skills', 'skills', 'tags');
  const nStrengths = normalizeArray(analysis, 'strengths', 'pontos_fortes');
  const nImprovements = normalizeArray(analysis, 'improvements', 'areas_to_improve', 'gaps', 'melhorias');
  const nRecommendations = normalizeArray(analysis, 'recommendations', 'recomendacoes', 'suggestions');

  // Check for results_html
  const resultsHtml = data?.results_html || data?.analysis?.results_html;

  return (
    <div className="space-y-4">
      {nScore !== undefined && (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-gold/30 flex items-center justify-center">
            <span className="text-base font-bold text-gold">{nScore}</span>
          </div>
          <div>
            <p className="text-[10px] text-[#999]">{lang === 'pt' ? 'Pontuação global' : 'Overall score'}</p>
            <p className="text-sm font-medium text-[#1a1a1a]">{nScore}/100</p>
          </div>
        </div>
      )}
      {nSummary && (
        <div>
          <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-1">{lang === 'pt' ? 'Resumo' : 'Summary'}</h5>
          <p className="text-sm text-[#333] leading-relaxed">{nSummary}</p>
        </div>
      )}
      {nKeywords.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">{lang === 'pt' ? 'Competências-chave' : 'Key Skills'}</h5>
          <div className="flex flex-wrap gap-1.5">
            {nKeywords.slice(0, 10).map((kw, i) => (
              <span key={i} className="px-2 py-0.5 bg-gold/5 border border-gold/20 rounded-full text-[10px] text-[#666] font-medium">{kw}</span>
            ))}
          </div>
        </div>
      )}
      {nStrengths.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">{lang === 'pt' ? 'Pontos Fortes' : 'Strengths'}</h5>
          <ul className="space-y-1">{nStrengths.slice(0, 5).map((s, i) => (<li key={i} className="text-xs text-[#333] flex items-start gap-2"><span className="text-emerald-500 mt-0.5">+</span><span>{s}</span></li>))}</ul>
        </div>
      )}
      {nImprovements.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">{lang === 'pt' ? 'A melhorar' : 'To improve'}</h5>
          <ul className="space-y-1">{nImprovements.slice(0, 5).map((s, i) => (<li key={i} className="text-xs text-[#333] flex items-start gap-2"><span className="text-amber-500 mt-0.5">!</span><span>{s}</span></li>))}</ul>
        </div>
      )}
      {nRecommendations.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">{lang === 'pt' ? 'Recomendações' : 'Recommendations'}</h5>
          <ul className="space-y-1">{nRecommendations.slice(0, 5).map((s, i) => (<li key={i} className="text-xs text-[#333] flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span><span>{s}</span></li>))}</ul>
        </div>
      )}
      {resultsHtml && (
        <div>
          <details className="group">
            <summary className="cursor-pointer text-xs text-gold hover:text-[#b8960c] font-medium flex items-center gap-1 transition-colors">
              <ArrowRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
              {lang === 'pt' ? 'Ver análise completa' : 'View full analysis'}
            </summary>
            <div className="mt-3 p-4 bg-white border border-[#e5e5e5] rounded-lg overflow-auto max-h-[500px]">
              <div className="s2i-results-render" dangerouslySetInnerHTML={{ __html: resultsHtml }} />
            </div>
          </details>
        </div>
      )}
      {nScore === undefined && !nSummary && nStrengths.length === 0 && nKeywords.length === 0 && !resultsHtml && (
        <div className="space-y-2">
          {Object.entries(analysis).filter(([k]) => !['source', 'plan', 'tier', 'captured_at', 'email', 'success', 'mode'].includes(k)).slice(0, 6).map(([key, val]) => {
            if (typeof val === 'string' && val.trim()) return (<div key={key}><h5 className="text-[10px] font-medium text-[#666] uppercase tracking-wider mb-0.5">{key.replace(/_/g, ' ')}</h5><p className="text-xs text-[#333] leading-relaxed line-clamp-3">{val}</p></div>);
            if (typeof val === 'number') return (<div key={key} className="flex items-center gap-2"><span className="text-[10px] text-[#999] uppercase">{key.replace(/_/g, ' ')}:</span><span className="text-xs font-semibold text-[#1a1a1a]">{val}</span></div>);
            if (Array.isArray(val) && val.length > 0) return (<div key={key}><h5 className="text-[10px] font-medium text-[#666] uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</h5><div className="flex flex-wrap gap-1">{val.slice(0, 6).map((v: any, i: number) => (<span key={i} className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[10px] text-[#666]">{typeof v === 'string' ? v : JSON.stringify(v).slice(0, 50)}</span>))}</div></div>);
            return null;
          })}
        </div>
      )}
    </div>
  );
}

export default function UpgradePage() {
  const { profile, user } = useAuth();
  const { t, lang } = useI18n();
  const [period, setPeriod] = useState<Period>('monthly');
  const [payModal, setPayModal] = useState<{ open: boolean; planKey: string; price: number } | null>(null);

  // ─── Analysis history for free users ───
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [expandedAnalysisType, setExpandedAnalysisType] = useState<string | null>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState<SavedAnalysis | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoadingSaved(false); return; }
    async function fetchSaved() {
      const { data, error } = await supabase.from('user_analyses').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50);
      if (!error && data) setSavedAnalyses(data as SavedAnalysis[]);
      setLoadingSaved(false);
    }
    fetchSaved();
  }, [user?.id]);

  const groupedAnalyses = useMemo(() => {
    const groups: Record<string, SavedAnalysis[]> = {};
    savedAnalyses.forEach(a => { const type = a.analysis_type || 'unknown'; if (!groups[type]) groups[type] = []; groups[type].push(a); });
    return groups;
  }, [savedAnalyses]);

  function getAnalysisSummary(analysis: SavedAnalysis): string {
    const data = analysis.data;
    if (!data) return '';
    if (analysis.analysis_type === 'cv_analyser') {
      const s = data.score ?? data.analysis?.score ?? data.analysis?.atsScore ?? data.analysis?.overall_score ?? data.analysis?.overallScore;
      if (s !== undefined) return `Score ATS: ${s}/100`;
    }
    if (analysis.analysis_type === 'linkedin_roaster') {
      if (data.score) return `Score: ${data.score}`;
      if (data.analysis?.teaser?.nota_geral) return `Nota: ${data.analysis.teaser.nota_geral}`;
    }
    if (analysis.analysis_type === 'career_path') {
      const cp = data.career_path_json || data.career_path || data.analysis?.career_path;
      if (cp?.current_positioning?.primary_domain) return cp.current_positioning.primary_domain;
      if (data.career_path?.title) return data.career_path.title;
    }
    if (analysis.analysis_type === 'career_intelligence') {
      const paths = data.strategic_paths || data.analysis?.career_path?.strategic_paths;
      if (paths && Array.isArray(paths)) return `${paths.length} ${lang === 'pt' ? 'caminhos estratégicos' : 'strategic paths'}`;
    }
    if (analysis.analysis_type === 'career_energy') {
      if (data.total_score) return `Score: ${data.total_score}${data.level ? ` — ${data.level}` : ''}`;
    }
    return '';
  }

  function formatDate(dateStr: string) {
    try { return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return dateStr; }
  }

  const firstName = profile?.first_name;
  const greeting = lang === 'pt'
    ? `${firstName ? `Olá, ${firstName}` : 'Olá'} — a tua conta está activa.`
    : `${firstName ? `Hi, ${firstName}` : 'Hi'} — your account is active.`;

  const subGreeting = lang === 'pt'
    ? 'Subscreve para desbloquear todas as ferramentas e acelerar a tua carreira.'
    : 'Subscribe to unlock all tools and accelerate your career.';

  function getSaving(prices: PriceMap): number | null {
    if (period === 'monthly') return null;
    const months = period === 'semiannual' ? 6 : 12;
    const equiv = prices[period] / months;
    return Math.round((1 - equiv / prices.monthly) * 100);
  }

  function handleSubscribe(tier: Tier) {
    const tierConfig = tiers.find(t => t.tier === tier)!;
    const price = tierConfig.prices[period];
    const planKey = `${tier}_${period}`;
    setPayModal({ open: true, planKey, price });
  }

  const periodLabels: Record<Period, string> = {
    monthly: lang === 'pt' ? 'Mensal' : 'Monthly',
    semiannual: lang === 'pt' ? 'Semestral' : 'Semiannual',
    annual: lang === 'pt' ? 'Anual' : 'Annual',
  };
  const periodSuffix: Record<Period, string> = {
    monthly: lang === 'pt' ? '/mês' : '/month',
    semiannual: lang === 'pt' ? '/semestre' : '/semester',
    annual: lang === 'pt' ? '/ano' : '/year',
  };

  const hasAnalyses = savedAnalyses.length > 0;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container max-w-5xl mx-auto px-4">

        {/* ─── Welcome Header ─── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold font-medium tracking-wide mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            {lang === 'pt' ? 'Área de Membro' : 'Member Area'}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1a1a] mb-3">{greeting}</h1>
          <p className="text-[#666] font-light max-w-lg mx-auto">{subGreeting}</p>

          {/* Social proof badge */}
          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-[#f5f5f3] border border-[#e5e5e5] rounded-full text-xs text-[#555] font-light">
            <Users className="w-3.5 h-3.5 text-gold" />
            <span>+500 {t('sub.usersImproved')}</span>
          </div>
        </div>

        {/* ═══════════════════ ANALYSIS HISTORY ═══════════════════ */}
        {(hasAnalyses || loadingSaved) && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-gold" />
                <h2 className="text-sm font-semibold text-[#1a1a1a]">
                  {lang === 'pt' ? 'As tuas Análises' : 'Your Analyses'}
                </h2>
                {hasAnalyses && (
                  <span className="text-[10px] text-[#999] bg-[#f5f5f4] px-2 py-0.5 rounded-full">{savedAnalyses.length}</span>
                )}
              </div>
              {hasAnalyses && (
                <button
                  onClick={() => {
                    setLoadingSaved(true);
                    supabase.from('user_analyses').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50)
                      .then(({ data }) => { setSavedAnalyses(data as SavedAnalysis[] || []); setLoadingSaved(false); });
                  }}
                  className="flex items-center gap-1 text-[10px] text-[#999] hover:text-gold transition-colors"
                >
                  <RefreshCcw className="w-3 h-3" /> {lang === 'pt' ? 'Atualizar' : 'Refresh'}
                </button>
              )}
            </div>

            {loadingSaved ? (
              <div className="py-12 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-gold mx-auto" />
                <p className="text-xs text-[#999] mt-2">{lang === 'pt' ? 'A carregar análises...' : 'Loading analyses...'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedAnalyses).map(([type, items]) => {
                  const config = TOOL_CONFIG[type] || { label: type, icon: FileText, color: 'text-[#999]', bgColor: 'bg-[#f5f5f4]', borderColor: 'border-[#e5e5e5]' };
                  const ToolIcon = config.icon;
                  const isExpanded = expandedAnalysisType === type;
                  const latest = items[0];
                  const rest = items.slice(1);

                  return (
                    <div key={type} className="border border-[#e5e5e5] rounded-xl bg-white shadow-sm overflow-hidden">
                      {/* Type header */}
                      <div className="flex items-center gap-3 p-4 border-b border-[#f0f0f0]">
                        <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                          <ToolIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <span className="text-sm font-semibold text-[#1a1a1a]">{config.label}</span>
                        <span className="text-[10px] text-[#999] bg-[#f5f5f4] px-2 py-0.5 rounded-full">{items.length}</span>
                      </div>

                      {/* Latest analysis — highlighted */}
                      <div className="p-4 bg-gradient-to-r from-[#fafaf9] to-white">
                        <div className="flex items-center gap-1.5 text-[10px] text-gold font-medium uppercase tracking-wider mb-2">
                          <Sparkles className="w-3 h-3" />
                          {lang === 'pt' ? 'Última análise' : 'Latest analysis'}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {getAnalysisSummary(latest) && <p className="text-sm font-medium text-[#1a1a1a] mb-1">{getAnalysisSummary(latest)}</p>}
                            <div className="flex items-center gap-1.5 text-[10px] text-[#999]"><Clock className="w-3 h-3" />{formatDate(latest.created_at)}</div>
                          </div>
                          <button onClick={() => setViewingAnalysis(viewingAnalysis?.id === latest.id ? null : latest)} className="flex items-center gap-1 text-[11px] text-gold hover:text-[#b8960c] font-medium transition-colors ml-3">
                            <ArrowRight className="w-3 h-3" />{lang === 'pt' ? 'Ver resultado' : 'View result'}
                          </button>
                        </div>
                        {/* Inline expanded view for latest */}
                        {viewingAnalysis?.id === latest.id && (
                          <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
                            <AnalysisResultMini data={latest.data} lang={lang} />
                          </div>
                        )}
                      </div>

                      {/* Older analyses — collapsible */}
                      {rest.length > 0 && (
                        <>
                          <button onClick={() => setExpandedAnalysisType(isExpanded ? null : type)} className="w-full flex items-center justify-between px-4 py-2.5 border-t border-[#f0f0f0] text-[11px] text-[#888] hover:text-gold hover:bg-[#fafaf9] transition-all">
                            <span>{isExpanded ? (lang === 'pt' ? 'Ocultar anteriores' : 'Hide older') : (lang === 'pt' ? `Ver mais ${rest.length} análise${rest.length > 1 ? 's' : ''}` : `Show ${rest.length} more`)}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {isExpanded && (
                            <div className="border-t border-[#f0f0f0]">
                              {rest.map((sa) => (
                                <div key={sa.id} className="border-b border-[#f5f5f4] last:border-b-0">
                                  <div className="flex items-center justify-between px-4 py-3 hover:bg-[#fafaf9] transition-colors group cursor-pointer" onClick={() => setViewingAnalysis(viewingAnalysis?.id === sa.id ? null : sa)}>
                                    <div className="flex-1 min-w-0">
                                      {getAnalysisSummary(sa) && <p className="text-xs font-medium text-[#1a1a1a] mb-0.5">{getAnalysisSummary(sa)}</p>}
                                      <div className="flex items-center gap-1.5 text-[10px] text-[#999]"><Clock className="w-3 h-3" />{formatDate(sa.created_at)}</div>
                                    </div>
                                    <span className="flex items-center gap-1 text-[10px] text-gold hover:text-[#b8960c] font-medium transition-colors opacity-0 group-hover:opacity-100 ml-3">
                                      <ArrowRight className="w-3 h-3" />{lang === 'pt' ? 'Ver' : 'View'}
                                    </span>
                                  </div>
                                  {viewingAnalysis?.id === sa.id && (
                                    <div className="px-4 pb-4">
                                      <div className="p-4 bg-[#fafaf9] border border-[#e5e5e5] rounded-lg">
                                        <AnalysisResultMini data={sa.data} lang={lang} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Upsell nudge within analysis section */}
                <div className="p-4 border border-gold/20 rounded-xl bg-gold/5 flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gold flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-[#1a1a1a]">
                      {lang === 'pt' ? 'Queres mais análises e ferramentas avançadas?' : 'Want more analyses and advanced tools?'}
                    </p>
                    <p className="text-[10px] text-[#888] mt-0.5">
                      {lang === 'pt' ? 'Subscreve um plano para aceder a todas as ferramentas sem limites.' : 'Subscribe to a plan to access all tools without limits.'}
                    </p>
                  </div>
                  <a href="#plans" className="flex items-center gap-1 text-xs text-gold hover:text-[#b8960c] font-medium transition-colors whitespace-nowrap">
                    {lang === 'pt' ? 'Ver planos' : 'View plans'} <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Preview: Locked Features ─── */}
        <div className="mb-16">
          <h2 className="text-sm font-medium text-[#1a1a1a] mb-1 text-center">
            {lang === 'pt' ? 'O que vais desbloquear' : 'What you will unlock'}
          </h2>
          <p className="text-xs text-[#999] font-light text-center mb-8">
            {lang === 'pt' ? 'Ferramentas exclusivas para membros Share2Inspire' : 'Exclusive tools for Share2Inspire members'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previewFeatures.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="relative p-4 border border-[#e5e5e5] rounded-xl bg-[#fafaf9] overflow-hidden group">
                  {/* Lock overlay */}
                  <div className="absolute inset-0 bg-[#fafaf9]/80 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-[#999]">
                      <Lock className="w-3.5 h-3.5" />
                      {lang === 'pt' ? 'Requer subscrição' : 'Requires subscription'}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#1a1a1a]">{lang === 'pt' ? feat.labelPt : feat.labelEn}</p>
                      <p className="text-[10px] text-[#999] font-light mt-0.5">{lang === 'pt' ? feat.descPt : feat.descEn}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Period Toggle ─── */}
        <div id="plans" className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 bg-[#f0f0ef] rounded-lg border border-[#e5e5e5]">
            {(['monthly','semiannual','annual'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  period === p
                    ? 'bg-white text-[#1a1a1a] shadow-sm'
                    : 'text-[#888] hover:text-[#555]'
                }`}
              >
                {periodLabels[p]}
                {p !== 'monthly' && (
                  <span className="ml-1.5 text-[10px] text-emerald-600 font-semibold">
                    {getSaving(tiers[0].prices) !== null ? `-${getSaving(tiers[0].prices)}%` : ''}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Plan Cards ─── */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {tiers.map((tc) => {
            const price = tc.prices[period];
            const saving = getSaving(tc.prices);
            return (
              <div
                key={tc.tier}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                  tc.highlight
                    ? 'border-gold bg-white shadow-lg shadow-gold/10 scale-[1.02]'
                    : 'border-[#e5e5e5] bg-[#fafaf9] hover:border-[#ccc] hover:shadow-sm'
                }`}
              >
                {/* Badge */}
                {tc.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold text-[#1a1a1a] text-[10px] font-semibold rounded-full whitespace-nowrap">
                    {t(tc.badge)}
                  </div>
                )}

                {/* Header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tc.highlight ? 'bg-gold text-[#1a1a1a]' : 'bg-[#f0f0ef] text-[#555]'}`}>
                      {tc.icon}
                    </div>
                    <span className="text-sm font-semibold text-[#1a1a1a] capitalize">{tc.tier}</span>
                  </div>
                  <p className="text-[11px] text-[#888] font-light">{t(tc.taglineKey)}</p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#1a1a1a]">€{price.toFixed(2).replace('.',',')}</span>
                    <span className="text-xs text-[#999] font-light">{periodSuffix[period]}</span>
                  </div>
                  {saving && (
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {lang === 'pt' ? `Poupas ${saving}%` : `Save ${saving}%`}
                    </span>
                  )}
                  {/* ROI */}
                  {tc.roiKey && (
                    <p className="text-[10px] text-gold font-medium mt-1.5 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {t(tc.roiKey)}
                    </p>
                  )}
                  {/* Value anchor */}
                  {tc.valueAnchorKey && period === 'monthly' && (
                    <p className="text-[10px] text-[#aaa] font-light mt-0.5">{t(tc.valueAnchorKey)}</p>
                  )}
                </div>

                {/* Benefits */}
                <ul className="space-y-2 mb-5 flex-1">
                  {tc.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-[#555] font-light">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {t(b)}
                    </li>
                  ))}
                  {tc.bonuses?.map((b, i) => (
                    <li key={`bonus-${i}`} className="flex items-start gap-2 text-[11px] text-gold font-medium">
                      <Star className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {t(b)}
                    </li>
                  ))}
                  {tc.notIncluded?.map((b, i) => (
                    <li key={`no-${i}`} className="flex items-start gap-2 text-[11px] text-[#bbb] font-light line-through">
                      <span className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-center">—</span>
                      {t(b)}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe(tc.tier)}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    tc.highlight
                      ? 'bg-gold hover:bg-gold-light text-[#1a1a1a]'
                      : 'bg-[#1a1a1a] hover:bg-[#333] text-white'
                  }`}
                >
                  {t('sub.subscribe')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Guarantee */}
                <p className="text-[10px] text-[#aaa] font-light text-center mt-2.5 flex items-center justify-center gap-1">
                  <RefreshCcw className="w-3 h-3" />
                  {lang === 'pt' ? 'Cancela quando quiseres' : 'Cancel anytime'}
                </p>
              </div>
            );
          })}
        </div>

        {/* ─── Testimonials ─── */}
        <div className="mb-16">
          <h2 className="text-sm font-medium text-[#1a1a1a] text-center mb-8">
            {t('sub.testimonialsTitle')}
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((tm, i) => (
              <div key={i} className="p-5 border border-[#e5e5e5] rounded-xl bg-[#fafaf9]">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-3 h-3 text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-xs text-[#555] font-light leading-relaxed mb-4 italic">{t(tm.textKey)}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${tm.color}`}>{tm.initials}</div>
                  <div>
                    <p className="text-xs font-medium text-[#1a1a1a]">{tm.name}</p>
                    <p className="text-[10px] text-[#999] font-light">{tm.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Trust Badges ─── */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-8 border-t border-[#e5e5e5]">
          <div className="flex items-center gap-2 text-xs text-[#888] font-light">
            <Shield className="w-4 h-4 text-gold" />
            {lang === 'pt' ? 'Pagamento seguro SSL' : 'Secure SSL payment'}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#888] font-light">
            <RefreshCcw className="w-4 h-4 text-gold" />
            {lang === 'pt' ? 'Cancela a qualquer momento' : 'Cancel anytime'}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#888] font-light">
            <Users className="w-4 h-4 text-gold" />
            {lang === 'pt' ? '+500 membros activos' : '+500 active members'}
          </div>
        </div>

        {/* ─── Back to Plans ─── */}
        <div className="text-center mt-8">
          <Link
            href="/planos"
            className="text-xs text-[#999] hover:text-[#555] font-light transition-colors underline underline-offset-2"
          >
            {lang === 'pt' ? 'Ver comparação completa de planos' : 'View full plan comparison'}
          </Link>
        </div>
      </div>

      {/* Payment Modal */}
      {payModal?.open && (
        <PaymentModal
          isOpen={payModal.open}
          onClose={() => setPayModal(null)}
          planKey={payModal.planKey}
          price={payModal.price}
        />
      )}
    </div>
  );
}
