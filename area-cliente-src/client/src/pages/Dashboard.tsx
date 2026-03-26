/*
 * Design: Consultoria de Luxo Silenciosa
 * Dashboard — redesenho UX com:
 *   • quota semanal visível no header
 *   • 6 tabs reordenadas por frequência de uso
 *   • tab "Ferramentas" com estados de lock por tier
 *   • tab "Recursos" separada para subscribers
 *   • estado vazio melhorado para contas gratuitas
 *   • upgrade contextual e não-intrusivo no final de cada tab
 *   • subscription card com barra de renovação e CTAs inline
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link, useLocation } from 'wouter';
import CareerProgress from '@/components/CareerProgress';
import {
  Loader2, Upload, Download, FileText, Check, ArrowRight,
  BarChart3, FileSearch, Compass, Clock, Trash2,
  Linkedin, RefreshCw, BookOpen, Lock, Wrench,
  ChevronDown, ChevronUp, CalendarClock, Sparkles,
} from 'lucide-react';

type SavedAnalysis = {
  id: string;
  user_id: string;
  analysis_type: string;
  data: Record<string, any>;
  created_at: string;
};

type TabId = 'tools' | 'analyses' | 'resources' | 'progress' | 'profile' | 'subscription';

const TOOL_CONFIG: Record<string, { label: string; icon: typeof FileSearch; color: string; link: string }> = {
  cv_analyser:         { label: 'CV Analyser',         icon: FileSearch, color: 'text-blue-400',    link: 'https://share2inspire.pt/cv-analyser' },
  linkedin_roaster:    { label: 'LinkedIn Roaster',    icon: Linkedin,   color: 'text-amber-400',   link: 'https://share2inspire.pt/linkedin-roaster' },
  career_path:         { label: 'Career Path',         icon: Compass,    color: 'text-emerald-400', link: 'https://share2inspire.pt/career-path' },
  career_intelligence: { label: 'Career Intelligence', icon: BarChart3,  color: 'text-violet-400',  link: 'https://share2inspire.pt/career-intelligence' },
  career_energy:       { label: 'Career Energy Score', icon: BarChart3,  color: 'text-purple-400',  link: 'https://share2inspire.pt/#career-energy' },
};

// ── Tier helpers ──────────────────────────────────────────────────────────────
function getPlanTier(plan?: string): 'free' | 'essential' | 'growth' | 'pro' {
  if (!plan) return 'free';
  const p = plan.toLowerCase();
  if (p.includes('pro') || p === 'annual') return 'pro';
  if (p.includes('growth') || p === 'semiannual') return 'growth';
  return 'essential';
}

function getPlanLabel(plan?: string): string {
  const labels: Record<string, string> = { free: '—', essential: 'Essential', growth: 'Growth', pro: 'Pro' };
  return labels[getPlanTier(plan)] ?? plan ?? '';
}

const WEEKLY_LIMITS: Record<string, number> = { free: 0, essential: 1, growth: 5, pro: 999 };
const TIER_ORDER: Record<string, number> = { free: 0, essential: 1, growth: 2, pro: 3 };

// ── All tool definitions ─────────────────────────────────────────────────────
const ALL_TOOLS: { type: string; label: string; icon: typeof FileSearch; desc: string; link: string; minTier: string; quota: string }[] = [
  { type: 'cv_analyser',         label: 'CV Analyser',         icon: FileSearch, desc: 'Análise ATS do teu currículo',          link: 'https://share2inspire.pt/cv-analyser',          minTier: 'free',      quota: 'avulso' },
  { type: 'linkedin_roaster',    label: 'LinkedIn Roaster',    icon: Linkedin,   desc: 'Avaliação do perfil LinkedIn',           link: 'https://share2inspire.pt/linkedin-roaster',     minTier: 'free',      quota: 'avulso' },
  { type: 'career_bot',          label: 'Career Bot',          icon: Sparkles,   desc: 'Assistente de carreira por IA',          link: 'https://share2inspire.pt/career-bot',           minTier: 'essential', quota: 'incluído' },
  { type: 'job_feed',            label: 'Job Feed',            icon: Compass,    desc: 'Vagas com matching inteligente',         link: 'https://share2inspire.pt/vagas',                minTier: 'growth',    quota: 'incluído' },
  { type: 'career_path',         label: 'Career Path',         icon: Compass,    desc: 'Mapeamento de trajetória profissional',  link: 'https://share2inspire.pt/career-path',          minTier: 'growth',    quota: 'bonus' },
  { type: 'career_intelligence', label: 'Career Intelligence', icon: BarChart3,  desc: 'Caminhos estratégicos com dados',        link: 'https://share2inspire.pt/career-intelligence',  minTier: 'pro',       quota: 'incluído' },
];

export default function Dashboard() {
  const { t } = useI18n();
  const { profile, subscription, updateProfile, refreshProfile, hasActiveSubscription } = useAuth();
  const [, navigate] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName,  setLastName]  = useState(profile?.last_name  || '');
  const [phone,     setPhone]     = useState(profile?.phone      || '');
  const [address,   setAddress]   = useState(profile?.address    || '');
  const [linkedin,  setLinkedin]  = useState(profile?.linkedin_url || '');

  useEffect(() => {
    if (profile) {
      setFirstName(p => p || profile.first_name || '');
      setLastName(p  => p || profile.last_name  || '');
      setPhone(p     => p || profile.phone      || '');
      setAddress(p   => p || profile.address    || '');
      setLinkedin(p  => p || profile.linkedin_url || '');
    }
  }, [profile]);

  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cvUploaded, setCvUploaded] = useState(false);

  const isSubscriber = hasActiveSubscription();
  const tier = getPlanTier(subscription?.plan);

  // ── Tabs: reordenadas por frequência de uso ─────────────────────────────────
  const tabs = useMemo<{ key: TabId; label: string; icon: typeof Wrench }[]>(() => {
    const base: { key: TabId; label: string; icon: typeof Wrench }[] = [
      { key: 'tools',    label: 'Ferramentas',  icon: Wrench },
      { key: 'analyses', label: t('dash.myAnalyses'), icon: FileSearch },
    ];
    if (isSubscriber) base.push({ key: 'resources', label: t('dash.resources'), icon: BookOpen });
    base.push(
      { key: 'progress',     label: t('dash.progress'),      icon: BarChart3 },
      { key: 'profile',      label: t('dash.personalInfo'),   icon: FileText },
      { key: 'subscription', label: t('dash.subscription'),   icon: CalendarClock },
    );
    return base;
  }, [isSubscriber, t]);

  const [activeTab, setActiveTab] = useState<TabId>('tools');

  // ── Saved analyses ──────────────────────────────────────────────────────────
  const [analyses,        setAnalyses]        = useState<SavedAnalysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [deletingId,      setDeletingId]      = useState<string | null>(null);
  const [expandedId,      setExpandedId]      = useState<string | null>(null);

  const loadAnalyses = async () => {
    if (!profile?.id) return;
    setLoadingAnalyses(true);
    try {
      const { data, error } = await supabase
        .from('user_analyses').select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (!error && data) setAnalyses(data as SavedAnalysis[]);
    } catch (e) { console.error('Error loading analyses:', e); }
    setLoadingAnalyses(false);
  };

  const [initialLoadDone] = useState(() => false);
  useEffect(() => { if (profile?.id && !initialLoadDone) loadAnalyses(); }, [profile?.id]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await supabase.from('user_analyses').delete().eq('id', id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (e) { console.error('Error deleting analysis:', e); }
    setDeletingId(null);
  };

  const groupedAnalyses = useMemo(() => {
    const groups: Record<string, SavedAnalysis[]> = {};
    analyses.forEach(a => {
      const type = a.analysis_type || 'unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(a);
    });
    return groups;
  }, [analyses]);

  const toolCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    analyses.forEach(a => { counts[a.analysis_type] = (counts[a.analysis_type] || 0) + 1; });
    return counts;
  }, [analyses]);

  // ── Weekly quota ─────────────────────────────────────────────────────────────
  const weeklyUsed = useMemo(() => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    return analyses.filter(a =>
      ['cv_analyser', 'linkedin_roaster'].includes(a.analysis_type) &&
      new Date(a.created_at) >= startOfWeek
    ).length;
  }, [analyses]);

  const weeklyLimit = WEEKLY_LIMITS[tier] ?? 0;

  // ── Resources ────────────────────────────────────────────────────────────────
  const resources = [
    { id: 'ebook-cv', title: t('res.ebookCv'), desc: t('res.ebookCvDesc'), type: 'PDF', size: '155 KB', url: 'https://d2xsxph8kpxj0f.cloudfront.net/105354394/92yTmUfG3DeUMDKSZxzXKb/Ebook_Como_Criar_um_CV_Vencedor_861d8b44.pdf', icon: FileText },
    { id: 'energia',  title: t('res.energiaLiderar'), desc: t('res.energiaLiderarDesc'), type: 'PDF', size: '23 MB',  url: 'https://cvlumvgrbuolrnwrtrgz.supabase.co/storage/v1/object/public/member-resources/Energia_para_Liderar_Premium.pdf', icon: BookOpen },
    { id: 'linkedin', title: t('res.errosLinkedin'), desc: t('res.errosLinkedinDesc'), type: 'PDF', size: '109 KB', url: 'https://cvlumvgrbuolrnwrtrgz.supabase.co/storage/v1/object/public/member-resources/10-erros-linkedin.pdf', icon: Linkedin },
    { id: 'script',   title: t('res.scriptEntrevistas'), desc: t('res.scriptEntrevistasDesc'), type: 'PDF', size: '165 KB', url: 'https://cvlumvgrbuolrnwrtrgz.supabase.co/storage/v1/object/public/member-resources/Script_de_Entrevistas_Share2Inspire.pdf', icon: FileSearch },
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  }

  function sanitizeResultsHtml(html: string): string {
    if (!html) return '';
    let clean = html;
    clean = clean.replace(/<section[^>]*aria-label=["']Notifications[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, '');
    clean = clean.replace(/<section[^>]*aria-live=["']polite["'][^>]*>[\s\S]*?<\/section>/gi, '');
    clean = clean.replace(/\s*data-loc="[^"]*"/g, '');
    clean = clean.replace(/<section[^>]*>\s*<\/section>/gi, '');
    return clean.trim();
  }

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function getAnalysisSummary(analysis: SavedAnalysis): string {
    const data = analysis.data;
    if (!data) return '';
    if (analysis.analysis_type === 'cv_analyser') {
      const s = data.score ?? data.analysis?.score ?? data.analysis?.atsScore ?? data.analysis?.overall_score;
      if (s !== undefined) return `Score ATS: ${s}/100`;
      if (data.results_html) return stripHtml(data.results_html).substring(0, 80) + '...';
    }
    if (analysis.analysis_type === 'linkedin_roaster') {
      if (data.score) return `Score: ${data.score}`;
      if (data.analysis?.teaser?.nota_geral) return `Nota: ${data.analysis.teaser.nota_geral}`;
      if (data.results_text) return data.results_text.substring(0, 80) + '...';
      if (data.email_used) return `${t('dash.profile')}: ${data.email_used}`;
    }
    if (analysis.analysis_type === 'career_path') {
      if (data.career_path?.title) return data.career_path.title;
      if (data.career_path?.summary) return data.career_path.summary.substring(0, 80) + '...';
      if (data.results_html) return stripHtml(sanitizeResultsHtml(data.results_html)).substring(0, 80) + '...';
    }
    if (analysis.analysis_type === 'career_intelligence') {
      if (data.strategic_paths && Array.isArray(data.strategic_paths)) return `${data.strategic_paths.length} caminhos estratégicos identificados`;
      if (data.decision_recommendation?.recommended_path) return data.decision_recommendation.recommended_path;
      if (data.results_html) return stripHtml(sanitizeResultsHtml(data.results_html)).substring(0, 80) + '...';
    }
    if (analysis.analysis_type === 'career_energy') {
      if (data.total_score) return `Score: ${data.total_score}${data.level ? ` — ${data.level}` : ''}`;
    }
    if (data.tool_label) return data.tool_label;
    return '';
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false);
    await updateProfile({ first_name: firstName, last_name: lastName, phone, address, linkedin_url: linkedin });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile || file.size > 10 * 1024 * 1024) return;
    setUploading(true); setCvUploaded(false);
    try {
      const userId = profile.user_id || profile.id;
      const ext = file.name.split('.').pop();
      const path = `${userId}/cv.${ext}`;
      const { error: uploadError } = await supabase.storage.from('user-cvs').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('user-cvs').getPublicUrl(path);
      await updateProfile({ cv_url: urlData.publicUrl, cv_filename: file.name, cv_uploaded_at: new Date().toISOString() } as any);
      await refreshProfile();
      setCvUploaded(true);
      setTimeout(() => setCvUploaded(false), 3000);
    } catch (err) { console.error('CV upload error:', err); }
    finally { setUploading(false); }
  }

  // ── Subscription helpers ─────────────────────────────────────────────────────
  const daysUntilRenewal = useMemo(() => {
    if (!subscription?.expires_at) return null;
    return Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000));
  }, [subscription]);

  const renewalPct = useMemo(() => {
    if (!subscription?.expires_at || !subscription?.created_at) return 0;
    const total = new Date(subscription.expires_at).getTime() - new Date(subscription.created_at).getTime();
    const elapsed = Date.now() - new Date(subscription.created_at).getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }, [subscription]);

  const planLabels: Record<string, string> = {
    monthly: 'Mensal', semiannual: 'Semestral', annual: 'Anual',
    essential_monthly: 'Essential · Mensal', essential_semiannual: 'Essential · Semestral', essential_annual: 'Essential · Anual',
    growth_monthly: 'Growth · Mensal',       growth_semiannual: 'Growth · Semestral',       growth_annual: 'Growth · Anual',
    pro_monthly: 'Pro · Mensal',             pro_semiannual: 'Pro · Semestral',             pro_annual: 'Pro · Anual',
  };

  // ── Upgrade Banner inline component ──────────────────────────────────────────
  function UpgradeBanner({ fromTier }: { fromTier: 'free' | 'essential' | 'growth' }) {
    const msgs: Record<string, { text: string; cta: string; link: string }> = {
      free:      { text: 'Faz análises recorrentes com um plano',                          cta: 'Ver planos',                link: '/planos' },
      essential: { text: 'Tens 1 análise/semana. Growth oferece 5.',                       cta: 'Ver Growth — 19,90€/mês',   link: '/planos' },
      growth:    { text: 'Análises ilimitadas + Career Intelligence com o plano Pro.',     cta: 'Ver Pro — 39€/mês',         link: '/planos' },
    };
    const m = msgs[fromTier];
    return (
      <div className="flex items-center justify-between gap-4 p-4 border border-gold/10 rounded-lg bg-gold/[0.02] flex-wrap">
        <p className="text-xs text-[#888] font-light">{m.text}</p>
        <Link href={m.link} className="text-xs text-gold font-medium flex items-center gap-1 hover:text-[#a07d08] transition-colors whitespace-nowrap">
          {m.cta} <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // ── QuotaCard inline component ───────────────────────────────────────────────
  function QuotaCard({ used, limit, resetDay }: { used: number; limit: number; resetDay: string }) {
    const isPro = limit >= 999;
    const pct = isPro ? 0 : limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    const barColor = pct >= 100 ? 'bg-red-400' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400';
    const remaining = isPro ? '∞' : Math.max(0, limit - used);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#999] font-light">Análises esta semana</span>
          <span className="text-xs font-medium text-[#555]">
            {isPro ? '∞' : `${used} / ${limit}`}
          </span>
        </div>
        {!isPro && (
          <div className="h-[3px] rounded-full bg-[#e8e8e6] overflow-hidden">
            <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#bbb] font-light">{isPro ? 'Ilimitado' : `${remaining} disponíveis`}</span>
          <span className="text-[10px] text-[#bbb] font-light">Renova {resetDay}</span>
        </div>
      </div>
    );
  }

  // ── Empty analyses inline component ──────────────────────────────────────────
  function EmptyAnalyses({ variant }: { variant: 'no-sub' | 'no-data' }) {
    const freeTools = ALL_TOOLS.filter(t => t.minTier === 'free');
    const tools = variant === 'no-sub' ? freeTools : ALL_TOOLS.filter(t => TIER_ORDER[tier] >= TIER_ORDER[t.minTier]);
    return (
      <div className="text-center py-12 border border-[#e5e5e5] rounded-lg">
        <BarChart3 className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
        <p className="text-sm text-[#999] font-light mb-1">
          {variant === 'no-sub' ? 'O teu repositório de análises está vazio' : 'Ainda não tens análises guardadas'}
        </p>
        <p className="text-xs text-[#bbb] font-light mb-4 max-w-sm mx-auto">
          {variant === 'no-sub'
            ? 'Experimenta uma das ferramentas gratuitas e guarda o resultado.'
            : 'Usa as ferramentas e clica em "Guardar" para as ver aqui.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {tools.map(tool => (
            <a key={tool.type} href={tool.link}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gold/60 border border-gold/10 rounded hover:border-gold/30 hover:text-gold transition-all">
              <tool.icon className="w-3 h-3" /> {tool.label}
            </a>
          ))}
        </div>
        {variant === 'no-sub' && (
          <Link href="/planos" className="inline-flex items-center gap-1.5 text-xs text-gold font-medium hover:text-[#a07d08] transition-colors">
            Ver planos <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-4xl mx-auto px-4">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-gold text-[10px] font-light tracking-[0.15em] uppercase mb-1.5">
              {t('dash.title')}
            </p>
            <h1 className="text-2xl font-semibold text-[#1a1a1a]">
              {profile?.first_name ? `${t('dash.hello')}, ${profile.first_name}` : t('dash.title')}
            </h1>
            <p className="text-xs text-[#999] font-light mt-1">
              {isSubscriber
                ? `Plano ${getPlanLabel(subscription?.plan)} · Renova a ${new Date(subscription!.expires_at).toLocaleDateString('pt-PT')}`
                : `Conta gratuita · ${analyses.length} ${analyses.length === 1 ? 'análise guardada' : 'análises guardadas'}`}
            </p>
          </div>
          {/* Quota widget no header — só subscribers */}
          {isSubscriber && (
            <div className="shrink-0 min-w-[180px]">
              <QuotaCard used={weeklyUsed} limit={weeklyLimit} resetDay="2ª feira" />
            </div>
          )}
        </div>

        {/* ── Free-account hero ────────────────────────────────────────────── */}
        {!isSubscriber && (
          <div className="mb-8 p-5 border border-gold/15 rounded-lg bg-[#faf9f6]">
            <p className="text-sm font-medium text-[#1a1a1a] mb-1.5">
              O teu repositório de análises está aqui
            </p>
            <p className="text-xs text-[#888] font-light leading-relaxed mb-4 max-w-xl">
              Cada análise que guardas nas ferramentas fica disponível nesta área, mesmo sem subscrição.
              Para análises recorrentes, Job Feed, e-books e acompanhamento de carreira, considera um plano.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/planos"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-xs font-medium rounded hover:bg-[#a07d08] transition-colors">
                {t('dash.seePlans')} <ArrowRight className="w-3 h-3" />
              </Link>
              <a href="https://share2inspire.pt/cv-analyser"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#e0e0e0] text-[#555] text-xs font-light rounded hover:border-gold/30 hover:text-[#1a1a1a] transition-colors">
                Explorar ferramentas
              </a>
            </div>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-0 mb-8 border-b border-[#e5e5e5] overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-light transition-all duration-300 border-b-2 -mb-[1px] whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-gold text-gold'
                  : 'border-transparent text-[#999] hover:text-[#1a1a1a]/60'
              }`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══ Tab: Ferramentas ═══════════════════════════════════════════════ */}
        {activeTab === 'tools' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_TOOLS.map(tool => {
                const isLocked = TIER_ORDER[tier] < TIER_ORDER[tool.minTier];
                const count = toolCounts[tool.type] || 0;
                const ToolIcon = tool.icon;
                const config = TOOL_CONFIG[tool.type];

                const quotaLabel = (() => {
                  if (isLocked) return `A partir de ${tool.minTier.charAt(0).toUpperCase() + tool.minTier.slice(1)}`;
                  if (tool.minTier === 'free') return 'Análise avulso';
                  if (tier === 'pro' && ['cv_analyser','linkedin_roaster'].includes(tool.type)) return 'Ilimitado';
                  if (['cv_analyser','linkedin_roaster'].includes(tool.type)) return `${weeklyLimit}/semana`;
                  return tool.quota === 'bonus' ? 'Bónus incluído' : 'Incluído no plano';
                })();

                return (
                  <div key={tool.type}
                    className={`relative border rounded-lg p-4 transition-all duration-200 ${
                      isLocked ? 'border-[#e5e5e5] opacity-60' : 'border-[#e5e5e5] hover:border-[#d0d0d0] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                    }`}>
                    {isLocked && (
                      <div className="absolute top-3 right-3">
                        <Lock className="w-3.5 h-3.5 text-[#ccc]" />
                      </div>
                    )}
                    {!isLocked && count > 0 && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-gold/10 border border-gold/15 rounded-full">
                        <span className="text-[10px] text-gold font-medium">{count}</span>
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-lg bg-[#f5f5f4] flex items-center justify-center mb-3">
                      <ToolIcon className={`w-4 h-4 ${config?.color || 'text-gold/60'}`} />
                    </div>
                    <p className="text-sm font-medium text-[#1a1a1a] mb-0.5">{tool.label}</p>
                    <p className="text-xs text-[#999] font-light mb-3 leading-relaxed">{tool.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#bbb] font-light">{quotaLabel}</span>
                      {!isLocked ? (
                        <a href={tool.link}
                          className="text-xs text-gold/70 hover:text-gold font-medium flex items-center gap-1 transition-colors">
                          Usar <ArrowRight className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link href="/planos"
                          className="text-xs text-[#bbb] hover:text-gold font-medium flex items-center gap-1 transition-colors">
                          Upgrade <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {tier !== 'pro' && <UpgradeBanner fromTier={tier === 'free' ? 'free' : tier as 'essential' | 'growth'} />}
          </div>
        )}

        {/* ══ Tab: Análises ══════════════════════════════════════════════════ */}
        {activeTab === 'analyses' && (
          <div className="space-y-6">
            {loadingAnalyses ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 text-gold/40 animate-spin" />
                <span className="ml-2 text-sm text-[#999] font-light">{t('dash.loadingAnalyses')}</span>
              </div>
            ) : analyses.length === 0 ? (
              <EmptyAnalyses variant={isSubscriber ? 'no-data' : 'no-sub'} />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1a1a1a]">
                    {analyses.length} {analyses.length === 1 ? t('dash.analysisSaved') : t('dash.analysesSaved')}
                  </p>
                  <button onClick={loadAnalyses}
                    className="flex items-center gap-1.5 text-xs text-[#999] hover:text-gold transition-colors">
                    <RefreshCw className="w-3 h-3" /> {t('dash.refresh')}
                  </button>
                </div>

                {Object.entries(groupedAnalyses).map(([type, items]) => {
                  const config = TOOL_CONFIG[type];
                  const ToolIcon = config?.icon || FileText;
                  return (
                    <div key={type} id={`saved-${type}`} className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <ToolIcon className={`w-3.5 h-3.5 ${config?.color || 'text-gold/60'}`} />
                        <h3 className="text-xs font-medium text-[#777] uppercase tracking-wider">
                          {config?.label || type} ({items.length})
                        </h3>
                      </div>
                      {items.map(analysis => (
                        <div key={analysis.id}
                          className="border border-[#e8e8e8] rounded-lg overflow-hidden hover:border-[#d8d8d8] transition-colors">
                          <div className="flex items-center justify-between px-4 py-3 cursor-pointer"
                            onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#333] font-light truncate">
                                {getAnalysisSummary(analysis) || t('dash.analysisSaved')}
                              </p>
                              <p className="text-[10px] text-[#bbb] font-light mt-0.5 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDate(analysis.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button onClick={e => { e.stopPropagation(); handleDelete(analysis.id); }}
                                disabled={deletingId === analysis.id}
                                className="p-1.5 text-[#bbb] hover:text-red-400 transition-colors">
                                {deletingId === analysis.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                              {expandedId === analysis.id
                                ? <ChevronUp className="w-3.5 h-3.5 text-[#bbb]" />
                                : <ChevronDown className="w-3.5 h-3.5 text-[#bbb]" />}
                            </div>
                          </div>
                          {expandedId === analysis.id && (
                            <div className="px-4 pb-4 border-t border-[#f0f0f0]">
                              <div className="pt-3 space-y-3">
                                {analysis.data?.score && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#888] font-light">{t('dash.score')}:</span>
                                    <span className="text-sm font-medium text-gold">{analysis.data.score}/100</span>
                                  </div>
                                )}
                                {analysis.data?.total_score && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#888] font-light">{t('dash.score')}:</span>
                                    <span className="text-sm font-medium text-gold">{analysis.data.total_score}{analysis.data.level ? ` — ${analysis.data.level}` : ''}</span>
                                  </div>
                                )}
                                {analysis.data?.archetype && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-[#888] font-light">{t('dash.archetype')}:</span>
                                    <span className="text-sm font-medium text-gold">{analysis.data.archetype}</span>
                                  </div>
                                )}
                                {analysis.data?.results_html && (
                                  <div className="s2i-results-render rounded-lg overflow-hidden bg-[#F0F0EE] border border-[#e5e5e5] p-4"
                                    style={{ maxHeight: 600, overflowY: 'auto' }}
                                    dangerouslySetInnerHTML={{ __html: sanitizeResultsHtml(analysis.data.results_html) }}
                                  />
                                )}
                                {/* Fallback: structured data when no HTML */}
                                {!analysis.data?.results_html && analysis.analysis_type === 'cv_analyser' && analysis.data?.analysis && (
                                  <div className="space-y-2">
                                    {analysis.data.analysis.keywords && (
                                      <div>
                                        <span className="text-xs text-[#888] font-light block mb-1">{t('dash.keywords')}:</span>
                                        <p className="text-xs text-[#666] font-light">
                                          {Array.isArray(analysis.data.analysis.keywords)
                                            ? analysis.data.analysis.keywords.slice(0, 8).join(', ')
                                            : String(analysis.data.analysis.keywords).substring(0, 200)}
                                        </p>
                                      </div>
                                    )}
                                    {analysis.data.analysis.recommendations && (
                                      <div>
                                        <span className="text-xs text-[#888] font-light block mb-1">{t('dash.recommendations')}:</span>
                                        <ul className="space-y-0.5">
                                          {(Array.isArray(analysis.data.analysis.recommendations)
                                            ? analysis.data.analysis.recommendations : []
                                          ).slice(0, 3).map((r: string, i: number) => (
                                            <li key={i} className="text-xs text-[#666] font-light pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gold/40">
                                              {typeof r === 'string' ? r.substring(0, 150) : JSON.stringify(r).substring(0, 150)}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {!analysis.data?.results_html && analysis.analysis_type === 'career_path' && analysis.data?.career_path_json && (
                                  <div className="space-y-2">
                                    {analysis.data.career_path_json.title && <p className="text-xs text-[#555] font-medium">{analysis.data.career_path_json.title}</p>}
                                    {analysis.data.career_path_json.summary && <p className="text-xs text-[#888] font-light leading-relaxed line-clamp-4">{analysis.data.career_path_json.summary.substring(0, 400)}</p>}
                                  </div>
                                )}
                                {!analysis.data?.results_html && analysis.analysis_type === 'career_intelligence' && analysis.data?.strategic_paths && (
                                  <div className="space-y-2">
                                    {analysis.data.decision_recommendation?.recommended_path && <p className="text-xs text-[#555] font-medium">{analysis.data.decision_recommendation.recommended_path}</p>}
                                    {analysis.data.decision_recommendation?.justification && <p className="text-xs text-[#888] font-light leading-relaxed line-clamp-3">{analysis.data.decision_recommendation.justification.substring(0, 300)}</p>}
                                    {Array.isArray(analysis.data.strategic_paths) && analysis.data.strategic_paths.length > 0 && (
                                      <div className="space-y-1">
                                        <span className="text-[10px] text-[#aaa] font-light">Caminhos:</span>
                                        {analysis.data.strategic_paths.map((path: any, i: number) => (
                                          <div key={i} className="flex items-center gap-2 text-xs">
                                            <span className="text-[#C9A961] font-medium">#{i+1}</span>
                                            <span className="text-[#555] font-light">{path.title || path.name || `Caminho ${i+1}`}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {!analysis.data?.results_html && analysis.analysis_type === 'career_energy' && analysis.data?.dimensions && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(analysis.data.dimensions as Record<string, number | null>).map(([dim, val]) => (
                                      val !== null && (
                                        <div key={dim} className="flex items-center justify-between text-xs">
                                          <span className="text-[#888] font-light capitalize">{dim}:</span>
                                          <span className="text-[#555] font-medium">{val}</span>
                                        </div>
                                      )
                                    ))}
                                  </div>
                                )}
                                {!analysis.data?.results_html && analysis.data?.results_text && (
                                  <div>
                                    <span className="text-xs text-[#888] font-light block mb-1">{t('dash.summary')}:</span>
                                    <p className="text-xs text-[#888] font-light leading-relaxed">{analysis.data.results_text.substring(0, 800)}</p>
                                  </div>
                                )}
                                {config?.link && (
                                  <a href={config.link} className="inline-flex items-center gap-1.5 text-xs text-gold/60 hover:text-gold transition-colors">
                                    {t('dash.doAnalysis')} <ArrowRight className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* CV Upload */}
                <div className="border border-[#e5e5e5] rounded-lg p-5">
                  <h3 className="text-sm font-medium text-[#1a1a1a] mb-3">{t('dash.cv')}</h3>
                  {(profile?.cv_url || profile?.cv_file_url) ? (
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-sm text-[#555]">
                        <FileText className="w-4 h-4 text-gold/60" />
                        <span className="font-light">{profile.cv_filename || t('dash.cvUploaded')}</span>
                      </div>
                      <a href={profile.cv_url || profile.cv_file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gold hover:text-[#a07d08] transition-colors">
                        <Download className="w-3.5 h-3.5" /> {t('dash.downloadCv')}
                      </a>
                      <button onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs text-[#999] hover:text-[#555] transition-colors">
                        <Upload className="w-3.5 h-3.5" /> {t('dash.replaceCv')}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-[#999] font-light mb-3">{t('dash.noCv')}</p>
                      <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 border border-[#ddd] rounded text-sm text-[#555] hover:border-gold/30 hover:text-[#1a1a1a] transition-all duration-300">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {t('dash.uploadCv')}
                      </button>
                    </div>
                  )}
                  {cvUploaded && <p className="text-xs text-gold mt-2 font-light">{t('dash.cvUploaded')}</p>}
                  <p className="text-[10px] text-[#bbb] mt-2 font-light">{t('dash.maxFileSize')}</p>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" />
                </div>

                {tier !== 'pro' && <UpgradeBanner fromTier={tier === 'free' ? 'free' : tier as 'essential' | 'growth'} />}
              </>
            )}
          </div>
        )}

        {/* ══ Tab: Recursos ══════════════════════════════════════════════════ */}
        {activeTab === 'resources' && isSubscriber && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resources.map(res => {
                const ResIcon = res.icon;
                return (
                  <div key={res.id}
                    className="flex items-start gap-3 border border-[#e5e5e5] rounded-lg p-4 hover:border-[#d5d5d5] transition-colors">
                    <div className="w-8 h-8 bg-[#f5f5f4] rounded-lg flex items-center justify-center shrink-0">
                      <ResIcon className="w-4 h-4 text-gold/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a1a1a] leading-tight mb-0.5">{res.title}</p>
                      <p className="text-xs text-[#999] font-light mb-2">{res.desc}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[#bbb] uppercase tracking-wider">{res.type} · {res.size}</span>
                        <a href={res.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-gold flex items-center gap-1 hover:text-[#a07d08] transition-colors">
                          <Download className="w-3 h-3" /> Descarregar
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {tier !== 'pro' && <UpgradeBanner fromTier={tier as 'essential' | 'growth'} />}
          </div>
        )}

        {/* ══ Tab: Progresso ═════════════════════════════════════════════════ */}
        {activeTab === 'progress' && <CareerProgress variant="detailed" />}

        {/* ══ Tab: Perfil ════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="border border-[#e5e5e5] rounded-lg p-6 md:p-8">
            <h2 className="text-sm font-medium text-[#1a1a1a] mb-6">{t('dash.personalInfo')}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.firstName')}</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] focus:border-gold/60 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.lastName')}</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] focus:border-gold/60 focus:outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#888] font-light mb-1.5">{t('auth.email')}</label>
                <input type="email" value={profile?.email || ''} disabled
                  className="w-full px-3 py-2.5 bg-white/[0.02] border border-[#e5e5e5] rounded text-sm text-[#888] cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#888] font-light mb-1.5">{t('dash.phone')}</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+351 9XX XXX XXX"
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] focus:border-gold/60 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-[#888] font-light mb-1.5">{t('dash.linkedin')}</label>
                  <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] focus:border-gold/60 focus:outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#888] font-light mb-1.5">{t('dash.address')}</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f5f5f4] border border-[#ddd] rounded text-sm text-[#1a1a1a] focus:border-gold/60 focus:outline-none transition-colors" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-gold text-white text-sm font-medium rounded hover:bg-[#a07d08] disabled:opacity-50 transition-all duration-300 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                  {saved ? t('dash.saved') : t('dash.save')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══ Tab: Subscrição ════════════════════════════════════════════════ */}
        {activeTab === 'subscription' && (
          <div className="space-y-4">
            {isSubscriber && subscription ? (
              <>
                {/* Plan + renewal card */}
                <div className="border border-[#e5e5e5] rounded-lg p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-[#1a1a1a]">
                          {planLabels[subscription.plan] || subscription.plan}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-700 font-medium">
                          {t('dash.active')}
                        </span>
                      </div>
                      <p className="text-xs text-[#999] font-light">
                        Renova a {new Date(subscription.expires_at).toLocaleDateString('pt-PT')}
                        {daysUntilRenewal !== null && ` · ${daysUntilRenewal} dias`}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link href="/planos"
                        className="text-xs text-[#777] border border-[#e0e0e0] px-3 py-1.5 rounded hover:border-gold/30 hover:text-[#555] transition-colors">
                        Mudar plano
                      </Link>
                      <button className="text-xs text-[#bbb] border border-[#e8e8e8] px-3 py-1.5 rounded hover:border-red-200 hover:text-red-400 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-[#bbb] font-light mb-1.5">
                      <span>Período atual</span>
                      <span>{daysUntilRenewal} dias até renovação</span>
                    </div>
                    <div className="h-[3px] rounded-full bg-[#e8e8e6] overflow-hidden">
                      <div className="h-full rounded-full bg-gold/50 transition-all duration-500"
                        style={{ width: `${renewalPct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Weekly quota */}
                <div className="border border-[#e5e5e5] rounded-lg p-5">
                  <p className="text-xs font-medium text-[#777] uppercase tracking-wider mb-3">Uso esta semana</p>
                  <QuotaCard used={weeklyUsed} limit={weeklyLimit} resetDay="2ª feira" />
                </div>

                {/* Member area link */}
                <div className="flex items-center justify-between p-4 border border-[#e5e5e5] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">{t('nav.member')}</p>
                    <p className="text-xs text-[#999] font-light">Ferramentas inline e conteúdos exclusivos</p>
                  </div>
                  <Link href="/membros"
                    className="flex items-center gap-1.5 text-xs text-gold hover:text-[#a07d08] font-medium transition-colors">
                    Aceder <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {tier !== 'pro' && <UpgradeBanner fromTier={tier as 'essential' | 'growth'} />}
              </>
            ) : (
              <div className="border border-[#e5e5e5] rounded-lg p-6">
                <p className="text-sm font-medium text-[#1a1a1a] mb-1">{t('dash.noSubscription')}</p>
                <p className="text-xs text-[#999] font-light mb-4 max-w-sm leading-relaxed">
                  A tua conta gratuita dá acesso ao repositório de análises. Com um plano tens acesso a ferramentas recorrentes e conteúdos exclusivos.
                </p>
                <Link href="/planos"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-white text-sm font-medium rounded hover:bg-[#a07d08] transition-colors">
                  {t('dash.seePlans')} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
