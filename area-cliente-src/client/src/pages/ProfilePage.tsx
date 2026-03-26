/**
 * Design: Consultoria de Luxo Silenciosa
 * ProfilePage — Página dedicada ao perfil do utilizador
 * Secções: Dados pessoais, CV, Subscrição, Progresso de Carreira, Análises Guardadas
 * Layout: 2+1 colunas em desktop, stack em mobile
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'wouter';
import CareerProgress from '@/components/CareerProgress';
import {
  Loader2, Upload, Download, FileText, Check, ArrowRight,
  BarChart3, FileSearch, Compass, Clock, Trash2,
  Linkedin, RefreshCw, BookOpen, Lock, Wrench,
  ChevronDown, ChevronUp, CalendarClock, Sparkles, User,
  Mail, Phone, MapPin, ExternalLink, Edit3, Save, X,
} from 'lucide-react';

type SavedAnalysis = {
  id: string;
  user_id: string;
  analysis_type: string;
  data: Record<string, any>;
  created_at: string;
};

const TOOL_CONFIG: Record<string, { label: string; icon: typeof FileSearch; color: string; bgColor: string }> = {
  cv_analyser:         { label: 'CV Analyser',         icon: FileSearch, color: 'text-blue-600',    bgColor: 'bg-blue-50' },
  linkedin_roaster:    { label: 'LinkedIn Roaster',    icon: Linkedin,   color: 'text-amber-600',   bgColor: 'bg-amber-50' },
  career_path:         { label: 'Career Path',         icon: Compass,    color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  career_intelligence: { label: 'Career Intelligence', icon: BarChart3,  color: 'text-violet-600',  bgColor: 'bg-violet-50' },
  career_energy:       { label: 'Career Energy Score', icon: Sparkles,   color: 'text-pink-600',    bgColor: 'bg-pink-50' },
};

function getPlanTier(plan?: string): 'free' | 'essential' | 'growth' | 'pro' {
  if (!plan) return 'free';
  const p = plan.toLowerCase();
  if (p.includes('pro') || p === 'annual') return 'pro';
  if (p.includes('growth') || p === 'semiannual') return 'growth';
  return 'essential';
}

const planLabels: Record<string, string> = {
  monthly: 'Mensal', semiannual: 'Semestral', annual: 'Anual',
  essential_monthly: 'Essential · Mensal', essential_semiannual: 'Essential · Semestral', essential_annual: 'Essential · Anual',
  growth_monthly: 'Growth · Mensal', growth_semiannual: 'Growth · Semestral', growth_annual: 'Growth · Anual',
  pro_monthly: 'Pro · Mensal', pro_semiannual: 'Pro · Semestral', pro_annual: 'Pro · Anual',
};

export default function ProfilePage() {
  const { t, lang } = useI18n();
  const { user, profile, subscription, updateProfile, refreshProfile, hasActiveSubscription } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // CV
  const [uploading, setUploading] = useState(false);
  const [cvUploaded, setCvUploaded] = useState(false);

  // Analyses
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  // Career progress
  const [showCareerDetail, setShowCareerDetail] = useState(false);

  const isSubscriber = hasActiveSubscription();
  const tier = getPlanTier(subscription?.plan);

  // Populate form fields when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setLinkedin(profile.linkedin_url || '');
    }
  }, [profile]);

  // Load saved analyses
  useEffect(() => {
    if (!user?.id) return;
    setLoadingAnalyses(true);
    async function fetchAnalyses() {
      const { data, error } = await supabase
        .from('user_analyses').select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) setAnalyses(data as SavedAnalysis[]);
      setLoadingAnalyses(false);
    }
    fetchAnalyses();
  }, [user?.id]);

  // Group analyses by type
  const groupedAnalyses = useMemo(() => {
    const groups: Record<string, SavedAnalysis[]> = {};
    analyses.forEach(a => {
      const type = a.analysis_type || 'unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(a);
    });
    return groups;
  }, [analyses]);

  // Subscription helpers
  const daysLeft = useMemo(() => {
    if (!subscription?.expires_at) return null;
    return Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000));
  }, [subscription]);

  const renewalPct = useMemo(() => {
    if (!subscription?.expires_at || !subscription?.created_at) return 0;
    const total = new Date(subscription.expires_at).getTime() - new Date(subscription.created_at).getTime();
    const elapsed = Date.now() - new Date(subscription.created_at).getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }, [subscription]);

  // Handlers
  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await updateProfile({ first_name: firstName, last_name: lastName, phone, address, linkedin_url: linkedin });
    setSaving(false);
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile || file.size > 10 * 1024 * 1024) return;
    setUploading(true);
    setCvUploaded(false);
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
    } catch (err) {
      console.error('CV upload error:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAnalysis(id: string) {
    if (!confirm(lang === 'pt' ? 'Tens a certeza que queres apagar esta análise?' : 'Are you sure you want to delete this analysis?')) return;
    setDeletingId(id);
    try {
      await supabase.from('user_analyses').delete().eq('id', id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Error deleting analysis:', e);
    }
    setDeletingId(null);
  }

  function getAnalysisSummary(analysis: SavedAnalysis): string {
    const data = analysis.data;
    if (!data) return '';
    if (analysis.analysis_type === 'cv_analyser') {
      const s = data.score ?? data.analysis?.score ?? data.analysis?.atsScore ?? data.analysis?.overall_score;
      if (s !== undefined) return `Score ATS: ${s}/100`;
    }
    if (analysis.analysis_type === 'linkedin_roaster') {
      if (data.score) return `Score: ${data.score}`;
      if (data.analysis?.teaser?.nota_geral) return `Nota: ${data.analysis.teaser.nota_geral}`;
    }
    if (analysis.analysis_type === 'career_path') {
      if (data.career_path?.title) return data.career_path.title;
    }
    if (analysis.analysis_type === 'career_intelligence') {
      if (data.strategic_paths && Array.isArray(data.strategic_paths)) return `${data.strategic_paths.length} caminhos estratégicos`;
    }
    if (analysis.analysis_type === 'career_energy') {
      if (data.total_score) return `Score: ${data.total_score}${data.level ? ` — ${data.level}` : ''}`;
    }
    return '';
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  }

  const tierColors: Record<string, { bg: string; text: string }> = {
    pro: { bg: 'bg-violet-100', text: 'text-violet-700' },
    growth: { bg: 'bg-blue-100', text: 'text-blue-700' },
    essential: { bg: 'bg-gold/10', text: 'text-gold' },
    free: { bg: 'bg-[#f0f0ef]', text: 'text-[#999]' },
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container max-w-5xl mx-auto px-4">

        {/* ─── Page Header ─── */}
        <div className="mb-10">
          <h1 className="text-xl font-semibold text-[#1a1a1a] mb-1">
            {lang === 'pt' ? 'Meu Perfil' : 'My Profile'}
          </h1>
          <p className="text-sm text-[#888] font-light">
            {lang === 'pt' ? 'Gere os teus dados pessoais, CV e subscrição.' : 'Manage your personal data, CV and subscription.'}
          </p>
        </div>

        {/* ─── Row 1: Personal Data (2 cols) + CV & Subscription (1 col) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

          {/* Personal Data — 2 cols */}
          <section className="lg:col-span-2 border border-[#e5e5e5] rounded-xl p-6 bg-white">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gold" />
                <h2 className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
                  {lang === 'pt' ? 'Dados Pessoais' : 'Personal Info'}
                </h2>
              </div>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 text-[11px] text-gold hover:text-gold/80 font-medium transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  {lang === 'pt' ? 'Editar' : 'Edit'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-[11px] text-white bg-gold px-3 py-1.5 rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50 font-medium"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {lang === 'pt' ? 'Guardar' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      if (profile) {
                        setFirstName(profile.first_name || '');
                        setLastName(profile.last_name || '');
                        setPhone(profile.phone || '');
                        setAddress(profile.address || '');
                        setLinkedin(profile.linkedin_url || '');
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] text-[#999] hover:text-[#666] transition-colors"
                  >
                    <X className="w-3 h-3" />
                    {lang === 'pt' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>

            {saved && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                <Check className="w-3.5 h-3.5" />
                {t('dash.saved')}
              </div>
            )}

            {editMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{lang === 'pt' ? 'Nome' : 'First Name'}</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/30 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{lang === 'pt' ? 'Apelido' : 'Last Name'}</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/30 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{lang === 'pt' ? 'Telemóvel' : 'Phone'}</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/30 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{lang === 'pt' ? 'Morada' : 'Address'}</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/30 focus:outline-none transition-colors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">LinkedIn</label>
                  <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/30 focus:outline-none transition-colors" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-[#ccc] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{lang === 'pt' ? 'Nome' : 'Name'}</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">{profile?.first_name} {profile?.last_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#ccc] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">Email</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#ccc] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{lang === 'pt' ? 'Telemóvel' : 'Phone'}</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">{profile?.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#ccc] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{lang === 'pt' ? 'Morada' : 'Address'}</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">{profile?.address || '—'}</p>
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-start gap-3">
                  <Linkedin className="w-4 h-4 text-[#ccc] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">LinkedIn</p>
                    {profile?.linkedin_url ? (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gold hover:underline flex items-center gap-1">
                        {profile.linkedin_url.replace(/^https?:\/\/(www\.)?/, '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-[#1a1a1a]">—</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Right column: CV + Subscription */}
          <div className="space-y-5">

            {/* CV Card */}
            <section className="border border-[#e5e5e5] rounded-xl p-5 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-gold" />
                <h2 className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
                  {lang === 'pt' ? 'Currículo' : 'CV / Resume'}
                </h2>
              </div>

              {profile?.cv_url ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-[#fafaf9] border border-[#f0f0f0] rounded-lg">
                    <FileText className="w-5 h-5 text-gold shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1a1a1a] truncate">{profile.cv_filename || 'CV'}</p>
                      <p className="text-[10px] text-[#999]">{profile.cv_uploaded_at ? formatDate(profile.cv_uploaded_at) : ''}</p>
                    </div>
                    <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gold hover:underline flex items-center gap-1 shrink-0">
                      <Download className="w-3 h-3" /> {lang === 'pt' ? 'Ver' : 'View'}
                    </a>
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-[#ddd] rounded-lg text-xs text-[#888] hover:border-gold/30 hover:text-gold transition-all disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {lang === 'pt' ? 'Substituir CV' : 'Replace CV'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-[#ddd] mx-auto mb-2" />
                  <p className="text-xs text-[#999] mb-3">{t('dash.noCv')}</p>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#1a1a1a] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {t('dash.uploadCv')}
                  </button>
                  <p className="text-[10px] text-[#bbb] mt-2">{t('dash.maxFileSize')}</p>
                </div>
              )}

              {cvUploaded && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  {t('dash.cvUploaded')}
                </div>
              )}
            </section>

            {/* Subscription Card */}
            <section className="border border-[#e5e5e5] rounded-xl p-5 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <CalendarClock className="w-4 h-4 text-gold" />
                <h2 className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
                  {lang === 'pt' ? 'Subscrição' : 'Subscription'}
                </h2>
              </div>

              {subscription && isSubscriber ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase ${tierColors[tier]?.bg || ''} ${tierColors[tier]?.text || ''}`}>
                      {tier === 'pro' ? 'Pro' : tier === 'growth' ? 'Growth' : 'Essential'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {lang === 'pt' ? 'Ativa' : 'Active'}
                    </span>
                  </div>
                  <div className="text-xs text-[#666]">
                    <p>{planLabels[subscription.plan] || subscription.plan}</p>
                  </div>
                  {/* Renewal progress bar */}
                  <div>
                    <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden mb-1.5">
                      <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${renewalPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#999]">
                      <span>{daysLeft} {lang === 'pt' ? 'dias restantes' : 'days left'}</span>
                      <span>{new Date(subscription.expires_at).toLocaleDateString('pt-PT')}</span>
                    </div>
                  </div>
                  <Link href="/planos" className="flex items-center gap-1 text-[10px] text-gold hover:underline font-medium">
                    {lang === 'pt' ? 'Gerir plano' : 'Manage plan'} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-xs text-[#999] mb-3">{t('dash.noSubscription')}</p>
                  <Link href="/planos" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-[#1a1a1a] text-xs font-medium rounded-lg hover:bg-gold/90 transition-colors">
                    {t('dash.seePlans')} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ─── Row 2: Career Progress (collapsible) ─── */}
        {isSubscriber && (
          <section className="border border-[#e5e5e5] rounded-xl bg-white overflow-hidden mb-6">
            <button
              onClick={() => setShowCareerDetail(prev => !prev)}
              className="w-full flex items-center justify-between p-5 hover:bg-[#fafaf9] transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gold" />
                <h2 className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
                  {lang === 'pt' ? 'Progresso de Carreira' : 'Career Progress'}
                </h2>
              </div>
              {showCareerDetail ? <ChevronUp className="w-4 h-4 text-[#999]" /> : <ChevronDown className="w-4 h-4 text-[#999]" />}
            </button>
            {showCareerDetail ? (
              <div className="px-5 pb-5 border-t border-[#f0f0f0]">
                <div className="pt-4">
                  <CareerProgress variant="detailed" />
                </div>
              </div>
            ) : (
              <div className="px-5 pb-5">
                <CareerProgress variant="compact" />
              </div>
            )}
          </section>
        )}

        {/* ─── Row 3: Saved Analyses — dynamic cards grouped by type ─── */}
        <section className="border border-[#e5e5e5] rounded-xl p-6 bg-white">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-gold" />
              <h2 className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
                {lang === 'pt' ? 'Análises Guardadas' : 'Saved Analyses'}
              </h2>
              <span className="text-[10px] text-[#999] bg-[#f5f5f4] px-2 py-0.5 rounded-full">{analyses.length}</span>
            </div>
            <button
              onClick={() => {
                setLoadingAnalyses(true);
                supabase.from('user_analyses').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100)
                  .then(({ data }) => { setAnalyses(data || []); setLoadingAnalyses(false); });
              }}
              className="flex items-center gap-1 text-[10px] text-[#999] hover:text-gold transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {lang === 'pt' ? 'Atualizar' : 'Refresh'}
            </button>
          </div>

          {loadingAnalyses ? (
            <div className="py-10 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-gold mx-auto" />
              <p className="text-xs text-[#999] mt-2">{t('dash.loadingAnalyses')}</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-8 h-8 text-[#ddd] mx-auto mb-3" />
              <p className="text-sm text-[#999] mb-1">{t('dash.noAnalysesYet')}</p>
              <p className="text-xs text-[#bbb] mb-4">
                {lang === 'pt' ? 'As análises que fizeres na Área de Membro aparecerão aqui.' : 'Analyses you run in the Member Area will appear here.'}
              </p>
              <Link href="/membros" className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline font-medium">
                {lang === 'pt' ? 'Ir para Área de Membro' : 'Go to Member Area'} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAnalyses).map(([type, items]) => {
                const config = TOOL_CONFIG[type] || { label: type, icon: FileText, color: 'text-[#999]', bgColor: 'bg-[#f5f5f4]' };
                const ToolIcon = config.icon;
                const isExpanded = expandedType === type;
                const visible = isExpanded ? items : items.slice(0, 3);

                return (
                  <div key={type}>
                    {/* Type header */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={`w-7 h-7 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                        <ToolIcon className={`w-3.5 h-3.5 ${config.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-[#1a1a1a]">{config.label}</span>
                      <span className="text-[10px] text-[#999] bg-[#f5f5f4] px-1.5 py-0.5 rounded">{items.length}</span>
                    </div>

                    {/* Analysis cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {visible.map((sa) => {
                        const summary = getAnalysisSummary(sa);
                        return (
                          <div key={sa.id} className="group relative p-4 border border-[#f0f0f0] rounded-lg hover:border-gold/15 transition-all bg-[#fafaf9] hover:bg-white">
                            {/* Score/summary */}
                            {summary && (
                              <p className="text-xs font-medium text-[#1a1a1a] mb-1.5 line-clamp-2">{summary}</p>
                            )}
                            {/* Date */}
                            <div className="flex items-center gap-1.5 text-[10px] text-[#999]">
                              <Clock className="w-3 h-3" />
                              {formatDate(sa.created_at)}
                            </div>
                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteAnalysis(sa.id)}
                              disabled={deletingId === sa.id}
                              className="absolute top-3 right-3 text-[#ddd] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              {deletingId === sa.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Show more/less */}
                    {items.length > 3 && (
                      <button
                        onClick={() => setExpandedType(isExpanded ? null : type)}
                        className="mt-2 text-[10px] text-gold hover:underline font-medium"
                      >
                        {isExpanded
                          ? (lang === 'pt' ? 'Mostrar menos' : 'Show less')
                          : (lang === 'pt' ? `Ver mais ${items.length - 3} análises` : `Show ${items.length - 3} more`)}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
