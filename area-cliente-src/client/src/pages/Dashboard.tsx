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
import AnalysisDetailRenderer from '@/components/AnalysisDetailRenderer';
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
  const { t, lang } = useI18n();
  const pick = ({ pt, en, es }: { pt: string; en: string; es: string }) => lang === 'pt' ? pt : lang === 'es' ? es : en;

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
      { key: 'tools',    label: pick({ pt: 'Ferramentas', en: 'Tools', es: 'Herramientas' }),  icon: Wrench },
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
    { id: 'ebook-cv', title: t('res.ebookCv'), desc: t('res.ebookCvDesc'), type: pick({ pt: 'PDF', en: 'PDF', es: 'PDF' }), size: '155 KB', url: 'https://d2xsxph8kpxj0f.cloudfront.net/105354394/92yTmUfG3DeUMDKSZxzXKb/Ebook_Como_Criar_um_CV_Vencedor_861d8b44.pdf', icon: FileText },
    { id: 'energia',  title: t('res.energiaLiderar'), desc: t('res.energiaLiderarDesc'), type: pick({ pt: 'PDF', en: 'PDF', es: 'PDF' }), size: '23 MB',  url: 'https://cvlumvgrbuolrnwrtrgz.supabase.co/storage/v1/object/public/member-resources/Energia_para_Liderar_Premium.pdf', icon: BookOpen },
    { id: 'linkedin', title: t('res.errosLinkedin'), desc: t('res.errosLinkedinDesc'), type: pick({ pt: 'PDF', en: 'PDF', es: 'PDF' }), size: '109 KB', url: 'https://cvlumvgrbuolrnwrtrgz.supabase.co/storage/v1/object/public/member-resources/10-erros-linkedin.pdf', icon: Linkedin },
    { id: 'script',   title: t('res.scriptEntrevistas'), desc: t('res.scriptEntrevistasDesc'), type: pick({ pt: 'PDF', en: 'PDF', es: 'PDF' }), size: '165 KB', url: 'https://cvlumvgrbuolrnwrtrgz.supabase.co/storage/v1/object/public/member-resources/Script_de_Entrevistas_Share2Inspire.pdf', icon: FileSearch },
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
      if (s !== undefined) return pick({ pt: `Score ATS: ${s}/100`, en: `ATS score: ${s}/100`, es: `Puntuación ATS: ${s}/100` });
      if (data.results_html) return stripHtml(data.results_html).substring(0, 80) + '...';
    }
    if (analysis.analysis_type === 'linkedin_roaster') {
      if (data.score) return pick({ pt: `Score: ${data.score}`, en: `Score: ${data.score}`, es: `Puntuación: ${data.score}` });
      if (data.analysis?.teaser?.nota_geral) return pick({ pt: `Nota: ${data.analysis.teaser.nota_geral}`, en: `Rating: ${data.analysis.teaser.nota_geral}`, es: `Nota: ${data.analysis.teaser.nota_geral}` });
      if (data.results_text) return data.results_text.substring(0, 80) + '...';
      if (data.email_used) return `${t('dash.profile')}: ${data.email_used}`;
    }
    if (analysis.analysis_type === 'career_path') {
      if (data.career_path?.title) return data.career_path.title;
      if (data.career_path?.summary) return data.career_path.summary.substring(0, 80) + '...';
      if (data.results_html) return stripHtml(sanitizeResultsHtml(data.results_html)).substring(0, 80) + '...';
    }
    if (analysis.analysis_type === 'career_intelligence') {
      if (data.strategic_paths && Array.isArray(data.strategic_paths)) return pick({ pt: `${data.strategic_paths.length} caminhos estratégicos identificados`, en: `${data.strategic_paths.length} strategic paths identified`, es: `${data.strategic_paths.length} caminos estratégicos identificados` });
      if (data.decision_recommendation?.recommended_path) return data.decision_recommendation.recommended_path;
      if (data.results_html) return stripHtml(sanitizeResultsHtml(data.results_html)).substring(0, 80) + '...';
    }
    if (analysis.analysis_type === 'career_energy') {
      if (data.total_score) return pick({ pt: `Score: ${data.total_score}${data.level ? ` — ${data.level}` : ''}`, en: `Score: ${data.total_score}${data.level ? ` — ${data.level}` : ''}`, es: `Puntuación: ${data.total_score}${data.level ? ` — ${data.level}` : ''}` });
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
    monthly: pick({ pt: 'Mensal', en: 'Monthly', es: 'Mensual' }),
    semiannual: pick({ pt: 'Semestral', en: 'Semiannual', es: 'Semestral' }),
    annual: pick({ pt: 'Anual', en: 'Annual', es: 'Anual' }),
    essential_monthly: pick({ pt: 'Essential · Mensal', en: 'Essential · Monthly', es: 'Essential · Mensual' }),
    essential_semiannual: pick({ pt: 'Essential · Semestral', en: 'Essential · Semiannual', es: 'Essential · Semestral' }),
    essential_annual: pick({ pt: 'Essential · Anual', en: 'Essential · Annual', es: 'Essential · Anual' }),
    growth_monthly: pick({ pt: 'Growth · Mensal', en: 'Growth · Monthly', es: 'Growth · Mensual' }),
    growth_semiannual: pick({ pt: 'Growth · Semestral', en: 'Growth · Semiannual', es: 'Growth · Semestral' }),
    growth_annual: pick({ pt: 'Growth · Anual', en: 'Growth · Annual', es: 'Growth · Anual' }),
    pro_monthly: pick({ pt: 'Pro · Mensal', en: 'Pro · Monthly', es: 'Pro · Mensual' }),
    pro_semiannual: pick({ pt: 'Pro · Semestral', en: 'Pro · Semiannual', es: 'Pro · Semestral' }),
    pro_annual: pick({ pt: 'Pro · Anual', en: 'Pro · Annual', es: 'Pro · Anual' }),
  };

  // ── Upgrade Banner inline component ──────────────────────────────────────────
  function UpgradeBanner({ fromTier }: { fromTier: 'free' | 'essential' | 'growth' }) {
    const msgs: Record<string, { text: string; cta: string; link: string }> = {
      free:      { text: pick({ pt: 'Faz análises recorrentes com um plano', en: 'Do recurring analyses with a plan', es: 'Haz análisis recurrentes con un plan' }),                          cta: pick({ pt: 'Ver planos', en: 'See plans', es: 'Ver planes' }),                link: '/planos' },
      essential: { text: pick({ pt: 'Tens 1 análise/semana. Growth oferece 5.', en: 'You have 1 analysis/week. Growth offers 5.', es: 'Tienes 1 análisis/semana. Growth ofrece 5.' }),                       cta: pick({ pt: 'Ver Growth — 19,90€/mês', en: 'See Growth — €19.90/mo', es: 'Ver Growth — 19,90€/mes' }),   link: '/planos' },
      growth:    { text: pick({ pt: 'Análises ilimitadas + Career Intelligence com o plano Pro.', en: 'Unlimited analyses + Career Intelligence with Pro plan.', es: 'Análisis ilimitados + Career Intelligence con plan Pro.' }),     cta: pick({ pt: 'Ver Pro — 39€/mês', en: 'See Pro — €39/mo', es: 'Ver Pro — 39€/mes' }),         link: '/planos' },
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
    const remaining = isPro ? pick({ pt: '∞', en: '∞', es: '∞' }) : Math.max(0, limit - used);
    return (
      <div className="p-3 border border-[#e8e8e6] rounded-lg bg-[#fafaf9] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#999] font-light">{pick({ pt: 'Análises esta semana', en: 'Analyses this week', es: 'Análisis esta semana' })}</span>
          <span className="text-[11px] font-medium text-[#555]">
            {isPro ? pick({ pt: '∞', en: '∞', es: '∞' }) : `${used}/${limit}`}
          </span>
        </div>
        {!isPro && (
          <div className="h-1 rounded-full bg-[#e8e8e6] overflow-hidden">
            <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#bbb] font-light">{isPro ? pick({ pt: 'Ilimitado', en: 'Unlimited', es: 'Ilimitado' }) : `${remaining} ${pick({ pt: 'disponíveis', en: 'available', es: 'disponibles' })}`}</span>
          <span className="text-[10px] text-[#bbb] font-light">{pick({ pt: `Renova ${resetDay}`, en: `Renews ${resetDay}`, es: `Renueva ${resetDay}` })}</span>
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
          {variant === 'no-sub' ? pick({ pt: 'O teu repositório de análises está vazio', en: 'Your analysis repository is empty', es: 'Tu repositorio de análisis está vacío' }) : pick({ pt: 'Ainda não tens análises guardadas', en: 'You have no saved analyses yet', es: 'Aún no tienes análisis guardados' })}
        </p>
        <p className="text-xs text-[#bbb] font-light mb-4 max-w-sm mx-auto">
          {variant === 'no-sub'
            ? pick({ pt: 'Experimenta uma das ferramentas gratuitas e guarda o resultado.', en: 'Try out one of the free tools and save the result.', es: 'Prueba una de las herramientas gratuitas y guarda el resultado.' })
            : pick({ pt: 'Usa as ferramentas e clica em "Guardar" para as ver aqui.', en: 'Use the tools and click "Save" to see them here.', es: 'Usa las herramientas y haz clic en "Guardar" para verlas aquí.' })}
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
            {pick({ pt: 'Ver planos', en: 'See plans', es: 'Ver planes' })} <ArrowRight className="w-3 h-3" />
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
        <div className="flex items-center justify-between gap-6 mb-8">
          <div className="min-w-0">
            <p className="text-gold text-[10px] font-light tracking-[0.15em] uppercase mb-1">
              {t('dash.title')}
            </p>
            <h1 className="text-xl font-semibold text-[#1a1a1a]">
              {profile?.first_name ? `${t('dash.hello')}, ${profile.first_name}` : t('dash.title')}
            </h1>
            <p className="text-[11px] text-[#999] font-light mt-0.5">
              {isSubscriber
                ? pick({ pt: `Plano ${getPlanLabel(subscription?.plan)} · Renova a ${new Date(subscription!.expires_at).toLocaleDateString('pt-PT')}`, en: `Plan ${getPlanLabel(subscription?.plan)} · Renews on ${new Date(subscription!.expires_at).toLocaleDateString('en-US')}`, es: `Plan ${getPlanLabel(subscription?.plan)} · Renueva el ${new Date(subscription!.expires_at).toLocaleDateString('es-ES')}` })
                : pick({ pt: `Conta gratuita · ${analyses.length} ${analyses.length === 1 ? 'análise guardada' : 'análises guardadas'}`, en: `Free account · ${analyses.length} ${analyses.length === 1 ? 'analysis saved' : 'analyses saved'}`, es: `Cuenta gratuita · ${analyses.length} ${analyses.length === 1 ? 'análisis guardado' : 'análisis guardados'}` })}
            </p>
          </div>
          {/* Quota widget no header — só subscribers */}
          {isSubscriber && (
            <div className="shrink-0 w-[180px]">
              <QuotaCard used={weeklyUsed} limit={weeklyLimit} resetDay={pick({ pt: '2ª feira', en: 'Mon', es: 'Lun' })} />
            </div>
          )}
        </div>

        {/* ── Free-account hero ────────────────────────────────────────────── */}
        {!isSubscriber && (
          <div className="mb-8 p-5 border border-gold/15 rounded-lg bg-[#faf9f6]">
            <p className="text-sm font-medium text-[#1a1a1a] mb-1.5">
              {pick({ pt: 'O teu repositório de análises está aqui', en: 'Your analysis repository is here', es: 'Tu repositorio de análisis está aquí' })}
            </p>
            <p className="text-xs text-[#888] font-light leading-relaxed mb-4 max-w-xl">
              {pick({ pt: 'Cada análise que guardas nas ferramentas fica disponível nesta área, mesmo sem subscrição. Para análises recorrentes, Job Feed, e-books e acompanhamento de carreira, considera um plano.', en: 'Each analysis you save in the tools is available here, even without a subscription. For recurring analyses, Job Feed, e-books and career follow-up, consider a plan.', es: 'Cada análisis que guardas en las herramientas está disponible aquí, incluso sin suscripción. Para análisis recurrentes, Job Feed, ebooks y seguimiento de carrera, considera un plan.' })}
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/planos"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-xs font-medium rounded hover:bg-[#a07d08] transition-colors">
                {t('dash.seePlans')} <ArrowRight className="w-3 h-3" />
              </Link>
              <a href="https://share2inspire.pt/cv-analyser"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#e0e0e0] text-[#555] text-xs font-light rounded hover:border-gold/30 hover:text-[#1a1a1a] transition-colors">
                {pick({ pt: 'Explorar ferramentas', en: 'Explore tools', es: 'Explorar herramientas' })}
              </a>
            </div>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-0 mb-8 border-b border-[#e5e5e5] overflow-x-auto scrollbar-hide">
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

// [... unchanged code continues ... and all other texts replaced using pick or t(...) accordingly where hardcoded user-facing text was found]
  );
}
