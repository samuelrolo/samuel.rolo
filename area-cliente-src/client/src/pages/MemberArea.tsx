/*
 * Design: Consultoria de Luxo Silenciosa
 * Área de Membro com ferramentas inline, conteúdos exclusivos e estado da subscrição
 * Ferramentas executam diretamente via edge function hyper-task
 * Controlo de limites semanais por plano (combinado CV Analyser + LinkedIn Roaster)
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type MemberContent } from '@/lib/supabase';
import {
  FileText, BarChart3, Route, Linkedin, Bot, BookOpen,
  ExternalLink, Search, Clock, ArrowRight, ChevronDown, ChevronUp,
  Loader2, AlertCircle, CheckCircle, Upload, Lock, Sparkles, Tag
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────
const HYPER_TASK_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

// Plan tier detection from subscription plan field
function getPlanTier(plan: string | undefined): 'essential' | 'growth' | 'pro' {
  if (!plan) return 'essential';
  const p = plan.toLowerCase();
  if (p.includes('pro')) return 'pro';
  if (p.includes('growth')) return 'growth';
  // Legacy plans: annual → pro, semiannual → growth, monthly → essential
  if (p === 'annual') return 'pro';
  if (p === 'semiannual') return 'growth';
  return 'essential';
}

// Weekly limits (combined CV Analyser + LinkedIn Roaster)
const WEEKLY_LIMITS: Record<string, number> = {
  essential: 2,
  growth: 5,
  pro: 10,
};

const contentTypes = ['all', 'ebook', 'article', 'template', 'video'] as const;

// ─── Analysis Result Display ─────────────────────────────────────────────────
function AnalysisResult({ data, onClose }: { data: any; onClose: () => void }) {
  const analysis = data?.analysis || data;
  
  if (!analysis) return null;

  return (
    <div className="mt-4 border border-gold/20 rounded-lg bg-[#fafaf9] p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-semibold text-[#1a1a1a]">Análise concluída</h4>
        </div>
        <button onClick={onClose} className="text-xs text-[#999] hover:text-[#1a1a1a] transition-colors">
          Fechar
        </button>
      </div>
      
      {/* Score */}
      {analysis.score !== undefined && (
        <div className="mb-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border-2 border-gold/30 flex items-center justify-center">
            <span className="text-lg font-bold text-gold">{analysis.score}</span>
          </div>
          <div>
            <p className="text-xs text-[#999]">Pontuação global</p>
            <p className="text-sm font-medium text-[#1a1a1a]">{analysis.score}/100</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {analysis.summary && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">Resumo</h5>
          <p className="text-sm text-[#333] leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">Pontos Fortes</h5>
          <ul className="space-y-1">
            {analysis.strengths.map((s: string, i: number) => (
              <li key={i} className="text-sm text-[#333] flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {analysis.improvements && analysis.improvements.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">A melhorar</h5>
          <ul className="space-y-1">
            {analysis.improvements.map((s: string, i: number) => (
              <li key={i} className="text-sm text-[#333] flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">!</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">Recomendações</h5>
          <ul className="space-y-1">
            {analysis.recommendations.map((s: string, i: number) => (
              <li key={i} className="text-sm text-[#333] flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw JSON fallback if no structured fields */}
      {!analysis.score && !analysis.summary && !analysis.strengths && (
        <div className="bg-white border border-[#e5e5e5] rounded p-4 max-h-96 overflow-auto">
          <pre className="text-xs text-[#333] whitespace-pre-wrap">{JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MemberArea() {
  const { t, lang } = useI18n();
  const { profile, subscription, user } = useAuth();
  const [content, setContent] = useState<MemberContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Tool panel states
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [weeklyUsage, setWeeklyUsage] = useState(0);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const planTier = getPlanTier(subscription?.plan);
  const weeklyLimit = WEEKLY_LIMITS[planTier] || 2;
  const isProPlan = planTier === 'pro';

  // ─── Fetch content ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase
        .from('member_content')
        .select('*')
        .order('created_at', { ascending: false });
      setContent(data || []);
      setLoading(false);
    }
    fetchContent();
  }, []);

  // ─── Fetch weekly usage ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    async function fetchUsage() {
      // Calculate start of current week based on subscription start
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('user_analyses')
        .select('id')
        .eq('user_id', user!.id)
        .in('analysis_type', ['cv_analyser', 'linkedin_roaster'])
        .gte('created_at', weekStart.toISOString());

      if (!error && data) {
        setWeeklyUsage(data.length);
      }
    }
    fetchUsage();
  }, [user?.id, analysisResult]);

  const filtered = useMemo(() => {
    let items = content;
    if (filter !== 'all') items = items.filter(c => c.content_type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(c =>
        c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    return items;
  }, [content, filter, search]);

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const filterLabels: Record<string, string> = {
    all: t('member.allTypes'),
    ebook: t('member.ebooks'),
    article: t('member.articles'),
    template: t('member.templates'),
    video: t('member.videos'),
  };

  // ─── Read CV text from file ─────────────────────────────────────────────
  const readCvText = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        resolve(text.substring(0, 8000));
      };
      reader.onerror = () => reject(new Error('Erro ao ler o ficheiro.'));
      reader.readAsText(file);
    });
  }, []);

  // ─── Download CV from profile ───────────────────────────────────────────
  const downloadProfileCv = useCallback(async (): Promise<string | null> => {
    if (!profile?.cv_url) return null;
    try {
      const { data } = await supabase.storage
        .from('user-cvs')
        .download(profile.cv_url);
      if (data) {
        const text = await data.text();
        return text.substring(0, 8000);
      }
    } catch (e) {
      console.error('Error downloading CV:', e);
    }
    return null;
  }, [profile?.cv_url]);

  // ─── Run CV Analysis ────────────────────────────────────────────────────
  const runCvAnalysis = useCallback(async () => {
    if (!user?.id || !subscription) return;
    if (weeklyUsage >= weeklyLimit) {
      setAnalysisError(lang === 'pt'
        ? 'Atingiste o limite semanal de análises do teu plano.'
        : 'You have reached your weekly analysis limit.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      let cvText: string | null = null;

      // Try uploaded file first, then profile CV
      if (cvFile) {
        cvText = await readCvText(cvFile);
      } else if (profile?.cv_url) {
        cvText = await downloadProfileCv();
      }

      if (!cvText || cvText.trim().length < 50) {
        setAnalysisError(lang === 'pt'
          ? 'Não foi possível ler o CV. Carrega um ficheiro ou atualiza o teu CV no perfil.'
          : 'Could not read CV. Upload a file or update your CV in your profile.');
        setAnalyzing(false);
        return;
      }

      const body: any = {
        mode: 'cv_extraction',
        cv_text: cvText.substring(0, 8000),
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) throw new Error('Erro na análise IA. Tenta novamente.');

      const result = await response.json();
      if (!result?.success) throw new Error(result?.error || 'Erro na análise IA.');

      setAnalysisResult(result);

      // Log usage
      await supabase.from('user_analyses').insert({
        user_id: user.id,
        analysis_type: 'cv_analyser',
        data: {
          source: 'member_area',
          plan: subscription.plan,
          tier: planTier,
          captured_at: new Date().toISOString(),
          email: profile?.email,
        },
      });

      setWeeklyUsage(prev => prev + 1);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setAnalysisError(lang === 'pt'
          ? 'A análise demorou demasiado. Tenta novamente.'
          : 'Analysis took too long. Please try again.');
      } else {
        setAnalysisError(err.message || 'Erro inesperado.');
      }
    } finally {
      setAnalyzing(false);
    }
  }, [user?.id, subscription, weeklyUsage, weeklyLimit, cvFile, profile, planTier, lang, readCvText, downloadProfileCv]);

  // ─── Run LinkedIn Analysis ──────────────────────────────────────────────
  const runLinkedinAnalysis = useCallback(async () => {
    if (!user?.id || !subscription) return;
    if (weeklyUsage >= weeklyLimit) {
      setAnalysisError(lang === 'pt'
        ? 'Atingiste o limite semanal de análises do teu plano.'
        : 'You have reached your weekly analysis limit.');
      return;
    }

    const linkedinUrl = profile?.linkedin_url;
    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) {
      setAnalysisError(lang === 'pt'
        ? 'Adiciona o teu URL do LinkedIn no perfil para usar esta ferramenta.'
        : 'Add your LinkedIn URL in your profile to use this tool.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      // Step 1: Scrape LinkedIn
      const scrapeRes = await fetch(`${BACKEND_URL}/api/services/scrape-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin_url: linkedinUrl }),
      });

      if (!scrapeRes.ok) throw new Error('Erro ao extrair dados do LinkedIn.');

      const scrapeData = await scrapeRes.json();
      if (!scrapeData?.success || !scrapeData?.cv_text) {
        throw new Error(scrapeData?.error || 'Não foi possível extrair dados do LinkedIn.');
      }

      // Step 2: Analyze
      const body = {
        mode: 'cv_extraction',
        cv_text: scrapeData.cv_text.substring(0, 8000),
        linkedin_url: linkedinUrl,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(HYPER_TASK_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) throw new Error('Erro na análise IA. Tenta novamente.');

      const result = await response.json();
      if (!result?.success) throw new Error(result?.error || 'Erro na análise IA.');

      setAnalysisResult(result);

      // Log usage
      await supabase.from('user_analyses').insert({
        user_id: user.id,
        analysis_type: 'linkedin_roaster',
        data: {
          source: 'member_area',
          plan: subscription.plan,
          tier: planTier,
          linkedin_url: linkedinUrl,
          captured_at: new Date().toISOString(),
          email: profile?.email,
        },
      });

      setWeeklyUsage(prev => prev + 1);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setAnalysisError(lang === 'pt'
          ? 'A análise demorou demasiado. Tenta novamente.'
          : 'Analysis took too long. Please try again.');
      } else {
        setAnalysisError(err.message || 'Erro inesperado.');
      }
    } finally {
      setAnalyzing(false);
    }
  }, [user?.id, subscription, weeklyUsage, weeklyLimit, profile, planTier, lang]);

  // ─── Toggle tool panel ──────────────────────────────────────────────────
  const toggleTool = (key: string) => {
    if (expandedTool === key) {
      setExpandedTool(null);
      setAnalysisResult(null);
      setAnalysisError(null);
      setCvFile(null);
    } else {
      setExpandedTool(key);
      setAnalysisResult(null);
      setAnalysisError(null);
      setCvFile(null);
    }
  };

  // ─── Tool definitions ───────────────────────────────────────────────────
  const tools = [
    {
      key: 'cvMaker',
      icon: FileText,
      color: 'from-gold/20 to-gold/5',
      type: 'external' as const,
      url: 'https://share2inspire.pt/cv-analyser/',
    },
    {
      key: 'cvAnalyzer',
      icon: BarChart3,
      color: 'from-blue-500/15 to-blue-500/5',
      type: 'inline' as const,
      action: 'cv',
    },
    {
      key: 'linkedinRoster',
      icon: Linkedin,
      color: 'from-sky-500/15 to-sky-500/5',
      type: 'inline' as const,
      action: 'linkedin',
    },
    {
      key: 'careerBot',
      icon: Bot,
      color: 'from-purple-500/15 to-purple-500/5',
      type: 'external' as const,
      url: 'https://share2inspire.pt/career-bot/',
    },
    {
      key: 'careerPath',
      icon: Route,
      color: 'from-emerald-500/15 to-emerald-500/5',
      type: 'locked' as const,
      discount: planTier === 'pro' ? 'included' : planTier === 'growth' ? '14€' : null,
    },
  ];

  const remainingAnalyses = Math.max(0, weeklyLimit - weeklyUsage);

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="text-gold text-xs font-light tracking-[0.15em] uppercase mb-2">{t('member.title')}</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1a1a]">
              {profile?.first_name ? `${t('member.welcome')}, ${profile.first_name}.` : t('member.welcome')}
            </h1>
          </div>
          {subscription && (
            <div className="flex items-center gap-3 text-xs text-[#999] font-light">
              <Clock className="w-3.5 h-3.5" />
              <span>{t('member.planExpires')} {new Date(subscription.expires_at).toLocaleDateString('pt-PT')}</span>
              <span className="px-2 py-0.5 bg-gold/10 border border-gold/20 rounded text-gold text-[10px] font-medium">
                {daysLeft} {t('member.daysLeft')}
              </span>
            </div>
          )}
        </div>

        {/* Usage indicator */}
        {subscription && (
          <div className="mb-8 p-4 border border-[#e5e5e5] rounded-lg bg-[#fafaf9]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-medium text-[#1a1a1a]">
                  {lang === 'pt' ? 'Análises esta semana' : 'Analyses this week'}
                </span>
              </div>
              <span className="text-xs text-[#999]">
                {isProPlan
                  ? (lang === 'pt' ? 'Uso contínuo e regular' : 'Continuous regular use')
                  : `${weeklyUsage}/${weeklyLimit}`
                }
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (weeklyUsage / weeklyLimit) * 100)}%` }}
              />
            </div>
            {!isProPlan && remainingAnalyses > 0 && (
              <p className="text-[10px] text-[#999] mt-1.5">
                {lang === 'pt'
                  ? `${remainingAnalyses} análise${remainingAnalyses !== 1 ? 's' : ''} restante${remainingAnalyses !== 1 ? 's' : ''} esta semana`
                  : `${remainingAnalyses} analysis${remainingAnalyses !== 1 ? 'es' : ''} remaining this week`
                }
              </p>
            )}
            {!isProPlan && remainingAnalyses === 0 && (
              <p className="text-[10px] text-amber-600 mt-1.5">
                {lang === 'pt'
                  ? 'Limite semanal atingido. Renova na próxima semana.'
                  : 'Weekly limit reached. Resets next week.'
                }
              </p>
            )}
          </div>
        )}

        {/* Tools */}
        <section className="mb-16">
          <h2 className="text-sm font-medium text-[#1a1a1a] mb-1">{t('member.tools')}</h2>
          <p className="text-xs text-[#999] font-light mb-6">
            {lang === 'pt'
              ? 'Acede às tuas ferramentas incluídas na subscrição.'
              : 'Access your tools included in your subscription.'
            }
          </p>
          <div className="space-y-3">
            {tools.map((tool) => (
              <div key={tool.key} className="border border-[#e5e5e5] rounded-lg overflow-hidden hover:border-gold/20 transition-all duration-500">
                {/* Tool header */}
                {tool.type === 'external' ? (
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-5"
                  >
                    <div className={`w-10 h-10 rounded flex items-center justify-center bg-gradient-to-br ${tool.color}`}>
                      <tool.icon className="w-4.5 h-4.5 text-[#333]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">
                        {t(`member.${tool.key}`)}
                      </h3>
                      <p className="text-[11px] text-[#999] font-light truncate">
                        {t(`member.${tool.key}Desc`)}
                      </p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#ccc] group-hover:text-gold/50 transition-colors shrink-0" />
                  </a>
                ) : tool.type === 'locked' ? (
                  <div className="flex items-center gap-4 p-5 opacity-60">
                    <div className={`w-10 h-10 rounded flex items-center justify-center bg-gradient-to-br ${tool.color}`}>
                      <tool.icon className="w-4.5 h-4.5 text-[#333]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#1a1a1a]">
                        {t(`member.${tool.key}`)}
                      </h3>
                      <p className="text-[11px] text-[#999] font-light truncate">
                        {t(`member.${tool.key}Desc`)}
                      </p>
                    </div>
                    {tool.discount === 'included' ? (
                      <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-700 font-medium shrink-0">
                        {lang === 'pt' ? '1 incluído/mês' : '1 included/month'}
                      </span>
                    ) : tool.discount ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gold/5 border border-gold/20 rounded text-[10px] text-gold font-medium shrink-0">
                        <Tag className="w-3 h-3" />
                        {tool.discount}
                      </span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#ccc] shrink-0" />
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => toggleTool(tool.key)}
                    className="group flex items-center gap-4 p-5 w-full text-left"
                  >
                    <div className={`w-10 h-10 rounded flex items-center justify-center bg-gradient-to-br ${tool.color}`}>
                      <tool.icon className="w-4.5 h-4.5 text-[#333]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">
                        {t(`member.${tool.key}`)}
                      </h3>
                      <p className="text-[11px] text-[#999] font-light truncate">
                        {t(`member.${tool.key}Desc`)}
                      </p>
                    </div>
                    {expandedTool === tool.key ? (
                      <ChevronUp className="w-4 h-4 text-gold shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#ccc] group-hover:text-gold/50 transition-colors shrink-0" />
                    )}
                  </button>
                )}

                {/* Expanded panel for CV Analyzer */}
                {tool.type === 'inline' && tool.action === 'cv' && expandedTool === tool.key && (
                  <div className="border-t border-[#e5e5e5] p-5 bg-[#fafaf9]">
                    <div className="space-y-4">
                      {/* CV source info */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          {profile?.cv_url ? (
                            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{lang === 'pt' ? 'CV do perfil será utilizado' : 'Profile CV will be used'}: {profile.cv_filename || 'CV'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{lang === 'pt' ? 'Sem CV no perfil. Carrega um ficheiro abaixo.' : 'No CV in profile. Upload a file below.'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* File upload option */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#ccc] rounded text-xs text-[#666] hover:border-gold/40 hover:text-gold transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {cvFile
                            ? cvFile.name
                            : (lang === 'pt' ? 'Ou carrega outro CV (PDF, DOCX, TXT)' : 'Or upload another CV (PDF, DOCX, TXT)')
                          }
                        </button>
                      </div>

                      {/* Execute button */}
                      <button
                        onClick={runCvAnalysis}
                        disabled={analyzing || (!profile?.cv_url && !cvFile) || (weeklyUsage >= weeklyLimit)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {lang === 'pt' ? 'A analisar...' : 'Analyzing...'}
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 h-4" />
                            {lang === 'pt' ? 'Executar análise de CV' : 'Run CV analysis'}
                          </>
                        )}
                      </button>

                      {/* Error */}
                      {analysisError && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{analysisError}</span>
                        </div>
                      )}

                      {/* Result */}
                      {analysisResult && (
                        <AnalysisResult data={analysisResult} onClose={() => setAnalysisResult(null)} />
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded panel for LinkedIn Roaster */}
                {tool.type === 'inline' && tool.action === 'linkedin' && expandedTool === tool.key && (
                  <div className="border-t border-[#e5e5e5] p-5 bg-[#fafaf9]">
                    <div className="space-y-4">
                      {/* LinkedIn URL info */}
                      <div>
                        {profile?.linkedin_url ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{lang === 'pt' ? 'Perfil LinkedIn do teu perfil' : 'LinkedIn from your profile'}: {profile.linkedin_url}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{lang === 'pt' ? 'Adiciona o teu URL do LinkedIn no perfil para usar esta ferramenta.' : 'Add your LinkedIn URL in your profile to use this tool.'}</span>
                          </div>
                        )}
                      </div>

                      {/* Execute button */}
                      <button
                        onClick={runLinkedinAnalysis}
                        disabled={analyzing || !profile?.linkedin_url || (weeklyUsage >= weeklyLimit)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {lang === 'pt' ? 'A analisar perfil LinkedIn...' : 'Analyzing LinkedIn profile...'}
                          </>
                        ) : (
                          <>
                            <Linkedin className="w-4 h-4" />
                            {lang === 'pt' ? 'Analisar perfil LinkedIn' : 'Analyze LinkedIn profile'}
                          </>
                        )}
                      </button>

                      {/* Error */}
                      {analysisError && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{analysisError}</span>
                        </div>
                      )}

                      {/* Result */}
                      {analysisResult && (
                        <AnalysisResult data={analysisResult} onClose={() => setAnalysisResult(null)} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Content */}
        <section>
          <h2 className="text-sm font-medium text-[#1a1a1a] mb-1">{t('member.content')}</h2>
          <p className="text-xs text-[#999] font-light mb-6">{t('member.contentDesc')}</p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              {contentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 text-xs rounded transition-all duration-300 ${
                    filter === type
                      ? 'bg-gold/10 border border-gold/20 text-gold font-medium'
                      : 'border border-[#e5e5e5] text-[#888] hover:text-[#1a1a1a]/60 hover:border-[#ddd]'
                  }`}
                >
                  {filterLabels[type]}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('member.search')}
                className="pl-8 pr-3 py-2 bg-[#f7f7f6] border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] placeholder-[#aaa] focus:border-gold/30 focus:outline-none transition-colors w-56"
              />
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
              <p className="text-sm text-[#999] font-light">{t('member.noContent')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <a
                  key={item.id}
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group border border-[#e5e5e5] rounded overflow-hidden hover:border-gold/20 transition-all duration-500"
                >
                  {item.thumbnail_url && (
                    <div className="aspect-[16/9] bg-white/[0.02] overflow-hidden">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[10px] text-[#999] uppercase tracking-wider">
                        {item.content_type}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors mb-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#999] font-light line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-gold/50 group-hover:text-gold transition-colors">
                      <span>Aceder</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
