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
  student_pack:        { label: 'Student Pack',        icon: BookOpen,   color: 'text-sky-400',     link: 'https://share2inspire.pt/student-pack' },
  bundle:              { label: 'Bundle',              icon: Sparkles,   color: 'text-fuchsia-400', link: 'https://share2inspire.pt/bundle' },
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
  { type: 'student_pack',        label: 'Student Pack',        icon: BookOpen,   desc: 'Recursos essenciais para estudantes',     link: 'https://share2inspire.pt/student-pack',         minTier: 'free',      quota: 'avulso' },
  { type: 'bundle',              label: 'Bundle',              icon: Sparkles,   desc: 'Pack completo de recursos de carreira',   link: 'https://share2inspire.pt/bundle',               minTier: 'free',      quota: 'avulso' },
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
