/**
 * ProfilePage — Página dedicada ao perfil do utilizador
 * Secções: Dados pessoais, CV, Subscrição
 * SEM Career Progress, SEM Análises (vivem na Área de Membro)
 */
import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'wouter';
import {
  Loader2, Upload, Download, FileText, Check, ArrowRight,
  Clock, Linkedin, User, Mail, Phone, MapPin,
  ExternalLink, Edit3, Save, X, CalendarClock, CreditCard,
} from 'lucide-react';

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

  // Subscription helpers
  const daysLeft = (() => {
    if (!subscription?.expires_at) return null;
    return Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / 86400000));
  })();

  const renewalPct = (() => {
    if (!subscription?.expires_at || !subscription?.created_at) return 0;
    const total = new Date(subscription.expires_at).getTime() - new Date(subscription.created_at).getTime();
    const elapsed = Date.now() - new Date(subscription.created_at).getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  })();

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

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  }

  const tierConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pro:       { label: 'Pro',       bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200' },
    growth:    { label: 'Growth',    bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
    essential: { label: 'Essential', bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200' },
    free:      { label: 'Free',      bg: 'bg-gray-50',    text: 'text-gray-500',   border: 'border-gray-200' },
  };
  const tc = tierConfig[tier] || tierConfig.free;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container max-w-4xl mx-auto px-4">

        {/* ─── Page Header ─── */}
        <div className="mb-8">
          <p className="text-gold text-[11px] font-medium tracking-[0.15em] uppercase mb-1">
            {lang === 'pt' ? 'A minha conta' : 'My account'}
          </p>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">
            {profile?.first_name
              ? `${lang === 'pt' ? 'Olá' : 'Hello'}, ${profile.first_name}`
              : (lang === 'pt' ? 'Meu Perfil' : 'My Profile')}
          </h1>
        </div>

        {/* ─── Row 1: Personal Data (2 cols) + Right sidebar (CV + Subscription) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

          {/* ═══ Personal Data — 2 cols ═══ */}
          <section className="lg:col-span-2 border border-[#e5e5e5] rounded-xl p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-gold" />
                </div>
                <h2 className="text-sm font-semibold text-[#1a1a1a]">
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
                  </button>
                </div>
              )}
            </div>

            {saved && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 animate-in fade-in duration-300">
                <Check className="w-3.5 h-3.5" />
                {t('dash.saved')}
              </div>
            )}

            {editMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{lang === 'pt' ? 'Nome' : 'First Name'}</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/40 focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{lang === 'pt' ? 'Apelido' : 'Last Name'}</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/40 focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{lang === 'pt' ? 'Telemóvel' : 'Phone'}</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/40 focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{lang === 'pt' ? 'Morada' : 'Address'}</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/40 focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">LinkedIn</label>
                  <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/40 focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all" />
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

          {/* ═══ Right column: CV + Subscription ═══ */}
          <div className="space-y-5">

            {/* CV Card */}
            <section className="border border-[#e5e5e5] rounded-xl p-5 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-gold" />
                </div>
                <h2 className="text-sm font-semibold text-[#1a1a1a]">
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
                <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 animate-in fade-in duration-300">
                  <Check className="w-3.5 h-3.5" />
                  {t('dash.cvUploaded')}
                </div>
              )}
            </section>

            {/* Subscription Card */}
            <section className="border border-[#e5e5e5] rounded-xl p-5 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-gold" />
                </div>
                <h2 className="text-sm font-semibold text-[#1a1a1a]">
                  {lang === 'pt' ? 'Subscrição' : 'Subscription'}
                </h2>
              </div>

              {subscription && isSubscriber ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${tc.bg} ${tc.text} border ${tc.border}`}>
                      {tc.label}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      {lang === 'pt' ? 'Ativa' : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-[#666]">{planLabels[subscription.plan] || subscription.plan}</p>
                  {/* Renewal progress bar */}
                  <div>
                    <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden mb-1.5">
                      <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-500" style={{ width: `${renewalPct}%` }} />
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
                  <Link href="/planos" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-xs font-medium rounded-lg hover:bg-gold/90 transition-colors">
                    {t('dash.seePlans')} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </section>

            {/* Quick link to Member Area */}
            <Link href="/membros" className="flex items-center justify-between p-4 border border-[#e5e5e5] rounded-xl bg-white shadow-sm hover:border-gold/20 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold/15 to-gold/5 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">
                    {lang === 'pt' ? 'Área de Membro' : 'Member Area'}
                  </p>
                  <p className="text-[10px] text-[#999]">
                    {lang === 'pt' ? 'Ferramentas, análises e recursos' : 'Tools, analyses and resources'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-gold transition-colors" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
