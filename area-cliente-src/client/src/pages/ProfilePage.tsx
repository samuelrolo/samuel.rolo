/**
 * ProfilePage — Página dedicada ao perfil do utilizador
 * Redesign: Avatar/foto, completeness checklist, CV ativo com score,
 * subscrição enriquecida com utilização e benefícios, privacidade
 * Layout: balanced grid with personal data + CV on left, subscription on right
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Link } from 'wouter';
import {
  Loader2, Upload, Download, FileText, Check, ArrowRight,
  Clock, Linkedin, User, Mail, Phone, MapPin,
  ExternalLink, Edit3, Save, X, CreditCard, Shield,
  Camera, BarChart3, Sparkles, ChevronDown, ChevronUp,
  Lock, Trash2, Eye,
} from 'lucide-react';

// ─── Avatars ────────────────────────────────────────────────────────────────
const AVATAR_OPTIONS = [
  { id: 'a1', emoji: '👤', bg: '#f5f5f4' },
  { id: 'a2', emoji: '🧑‍💼', bg: '#EFF5FC' },
  { id: 'a3', emoji: '👩‍💻', bg: '#EDF7F1' },
  { id: 'a4', emoji: '🧑‍🎓', bg: '#FBF3E7' },
  { id: 'a5', emoji: '🦊', bg: '#FBF0F4' },
  { id: 'a6', emoji: '🐺', bg: '#EEF7E8' },
  { id: 'a7', emoji: '🦅', bg: '#F5F0FF' },
  { id: 'a8', emoji: '🦁', bg: '#FFF8E6' },
];

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

const WEEKLY_LIMITS: Record<string, number> = { essential: 2, growth: 10, pro: 999 };

export default function ProfilePage() {
  const { t, lang } = useI18n();
  const { user, profile, subscription, updateProfile, refreshProfile, hasActiveSubscription } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

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

  // Avatar
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Analyses data for CV score
  const [cvScore, setCvScore] = useState<number | null>(null);
  const [cvAnalysed, setCvAnalysed] = useState(false);
  const [weeklyUsage, setWeeklyUsage] = useState(0);
  const [lastCvAnalysisDate, setLastCvAnalysisDate] = useState<string | null>(null);

  const isSubscriber = hasActiveSubscription();
  const tier = getPlanTier(subscription?.plan);
  const weeklyLimit = WEEKLY_LIMITS[tier] || 2;
  const isProPlan = tier === 'pro';

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

  // Fetch CV analysis data
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('user_analyses')
        .select('data, created_at')
        .eq('user_id', user.id)
        .eq('analysis_type', 'cv_analyser')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setCvAnalysed(true);
        setLastCvAnalysisDate(data[0].created_at);
        const d = data[0].data;
        const s = d?.overall_score || d?.score || d?.ats_score || d?.analysis?.score || d?.analysis?.atsScore || null;
        if (typeof s === 'number') setCvScore(s);
      }
    })();
  }, [user?.id]);

  // Fetch weekly usage
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('user_analyses')
        .select('id')
        .eq('user_id', user.id)
        .in('analysis_type', ['cv_analyser', 'linkedin_roaster'])
        .gte('created_at', weekStart.toISOString());
      if (data) setWeeklyUsage(data.length);
    })();
  }, [user?.id]);

  // Profile completeness
  const completeness = useMemo(() => {
    const checks = [
      { key: 'profile.checklist.name', done: !!(profile?.first_name && profile?.last_name) },
      { key: 'profile.checklist.cv', done: !!profile?.cv_url },
      { key: 'profile.checklist.linkedin', done: !!profile?.linkedin_url },
      { key: 'profile.checklist.phone', done: !!profile?.phone },
    ];
    const done = checks.filter(c => c.done).length;
    const pct = Math.round((done / checks.length) * 100);
    return { checks, done, total: checks.length, pct };
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

  // Plan benefits
  const benefits = useMemo(() => {
    const base = [
      { label: t('member.cvAnalyses'), included: true },
      { label: t('member.linkedinAnalyses'), included: true },
      { label: 'Career Advisory', included: true },
      { label: t('member.careerProgress'), included: true },
    ];
    if (tier === 'growth' || tier === 'pro') {
      base.push({ label: t('member.jobFeed'), included: true });
      base.push({ label: t('member.ebooksResources'), included: true });
    }
    if (tier === 'pro') {
      base.push({ label: 'Career Path', included: true });
      base.push({ label: 'Career Intelligence', included: true });
    }
    return base;
  }, [tier, t]);

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
      setCvAnalysed(false);
      setCvScore(null);
      setTimeout(() => setCvUploaded(false), 3000);
    } catch (err) {
      console.error('CV upload error:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);
    try {
      const userId = profile.user_id || profile.id;
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;
      const { error } = await supabase.storage.from('user-avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('user-avatars').getPublicUrl(path);
      await updateProfile({ avatar_url: urlData.publicUrl } as any);
      await refreshProfile();
      setShowAvatarPicker(false);
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarSelect(emoji: string) {
    await updateProfile({ avatar_url: `emoji:${emoji}` } as any);
    await refreshProfile();
    setShowAvatarPicker(false);
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return t('member.today');
    if (days === 1) return t('member.yesterday');
    return t('member.daysAgo').replace('{n}', String(days));
  }

  const tierConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pro:       { label: 'Pro',       bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200' },
    growth:    { label: 'Growth',    bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
    essential: { label: 'Essential', bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200' },
    free:      { label: 'Free',      bg: 'bg-gray-50',    text: 'text-gray-500',   border: 'border-gray-200' },
  };
  const tc = tierConfig[tier] || tierConfig.free;

  // Avatar rendering
  const avatarUrl = (profile as any)?.avatar_url;
  const isEmojiAvatar = avatarUrl?.startsWith('emoji:');
  const avatarEmoji = isEmojiAvatar ? avatarUrl!.replace('emoji:', '') : null;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#fafaf9]">
      <div className="container max-w-5xl mx-auto px-4">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HEADER — Avatar + Greeting + Completeness                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-6 p-5 bg-white border border-[#e5e5e5] rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#e5e5e5] bg-[#f5f5f4] flex items-center justify-center shadow-sm">
                {avatarUrl && !isEmojiAvatar ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : avatarEmoji ? (
                  <span className="text-2xl">{avatarEmoji}</span>
                ) : (
                  <User className="w-7 h-7 text-[#ccc]" />
                )}
              </div>
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-[#e5e5e5] rounded-md flex items-center justify-center shadow-sm hover:border-gold/40 transition-colors"
              >
                <Camera className="w-3 h-3 text-[#888]" />
              </button>
            </div>

            {/* Greeting + Status */}
            <div className="flex-1 min-w-0">
              <p className="text-gold text-[10px] font-medium tracking-[0.15em] uppercase mb-0.5">
                {t('profile.myAccount')}
              </p>
              <h1 className="text-lg md:text-xl font-semibold text-[#1a1a1a] mb-0.5">
                {profile?.first_name
                  ? `${t('profile.greeting')}, ${profile.first_name}.`
                  : t('profile.myAccount')}
              </h1>
              <p className="text-[11px] text-[#888]">{t('profile.readyNext')}</p>
            </div>

            {/* Completeness ring */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-12 h-12">
                <svg viewBox="0 0 100 100" className="w-12 h-12" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e5e5" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={completeness.pct === 100 ? '#22c55e' : '#BFA14A'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - completeness.pct / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-[#1a1a1a]">{completeness.pct}%</span>
                </div>
              </div>
              <div className="text-[10px] text-[#888]">
                <p className="font-medium text-[#666]">{t('profile.profileStatus')}</p>
                <p>{completeness.done}/{completeness.total} {t('profile.complete')}</p>
              </div>
            </div>
          </div>

          {/* Avatar picker dropdown */}
          {showAvatarPicker && (
            <div className="mt-3 p-3 bg-[#fafaf9] border border-[#e5e5e5] rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-2">{t('profile.chooseAvatar')}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {AVATAR_OPTIONS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleAvatarSelect(a.emoji)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg hover:scale-110 transition-transform border border-transparent hover:border-gold/30"
                    style={{ background: a.bg }}
                  >
                    {a.emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <button
                  onClick={() => avatarFileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-[#666] border border-dashed border-[#ddd] rounded-lg hover:border-gold/30 hover:text-gold transition-all"
                >
                  {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {t('profile.uploadPhoto')}
                </button>
              </div>
            </div>
          )}

          {/* Completeness checklist */}
          {completeness.pct < 100 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {completeness.checks.map(c => (
                <div
                  key={c.key}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] transition-colors ${
                    c.done
                      ? 'bg-emerald-50/60 text-emerald-700 border border-emerald-100'
                      : 'bg-[#fafaf9] text-[#999] border border-[#f0f0f0]'
                  }`}
                >
                  {c.done ? <Check className="w-3 h-3 text-emerald-500 shrink-0" /> : <div className="w-3 h-3 rounded-full border border-[#ddd] shrink-0" />}
                  <span className="truncate">{t(c.key)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MAIN GRID — Balanced 2-column layout                              */}
        {/* Left: Personal Data + CV  |  Right: Subscription + Member Link    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

          {/* ═══ LEFT COLUMN: Personal Data + CV ═══ */}
          <div className="space-y-5">

            {/* ─── Personal Data ─── */}
            <section className="border border-[#e5e5e5] rounded-xl p-5 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-gold" />
                  </div>
                  <h2 className="text-sm font-semibold text-[#1a1a1a]">{t('profile.personalData')}</h2>
                </div>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 text-[11px] text-gold hover:text-gold/80 font-medium transition-colors">
                    <Edit3 className="w-3 h-3" /> {t('profile.edit')}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 text-[11px] text-white bg-gold px-3 py-1.5 rounded-md hover:bg-gold/90 transition-colors disabled:opacity-50 font-medium">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {t('profile.save')}
                    </button>
                    <button onClick={() => { setEditMode(false); if (profile) { setFirstName(profile.first_name || ''); setLastName(profile.last_name || ''); setPhone(profile.phone || ''); setAddress(profile.address || ''); setLinkedin(profile.linkedin_url || ''); } }} className="flex items-center gap-1 text-[11px] text-[#999] hover:text-[#666] transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {saved && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 animate-in fade-in duration-300">
                  <Check className="w-3.5 h-3.5" /> {t('dash.saved')}
                </div>
              )}

              {editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">{t('profile.firstName')}</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/40 focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">{t('profile.lastName')}</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/40 focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">{t('profile.phone')}</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/40 focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">{t('profile.address')}</label>
                    <input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/40 focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">LinkedIn</label>
                    <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm text-[#1a1a1a] bg-[#fafaf9] focus:border-gold/40 focus:ring-1 focus:ring-gold/20 focus:outline-none transition-all" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <User className="w-3.5 h-3.5 text-[#ccc] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{t('profile.firstName')}</p>
                      <p className="text-sm font-medium text-[#1a1a1a]">{profile?.first_name} {profile?.last_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-3.5 h-3.5 text-[#ccc] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{t('profile.email')}</p>
                      <p className="text-sm font-medium text-[#1a1a1a]">{profile?.email || user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-3.5 h-3.5 text-[#ccc] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{t('profile.phone')}</p>
                      <p className="text-sm font-medium text-[#1a1a1a]">{profile?.phone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ccc] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{t('profile.address')}</p>
                      <p className="text-sm font-medium text-[#1a1a1a]">{profile?.address || '—'}</p>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-start gap-2.5">
                    <Linkedin className="w-3.5 h-3.5 text-[#ccc] mt-0.5 shrink-0" />
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

            {/* ─── CV Active Widget ─── */}
            <section className="border border-[#e5e5e5] rounded-xl p-5 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-gold" />
                </div>
                <h2 className="text-sm font-semibold text-[#1a1a1a]">{t('profile.cv')}</h2>
              </div>

              {profile?.cv_url ? (
                <div className="space-y-3">
                  {/* File info */}
                  <div className="flex items-center gap-3 p-3 bg-[#fafaf9] border border-[#f0f0f0] rounded-lg">
                    <FileText className="w-5 h-5 text-gold shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1a1a1a] truncate">{profile.cv_filename || 'CV'}</p>
                      <p className="text-[10px] text-[#999]">{profile.cv_uploaded_at ? formatDate(profile.cv_uploaded_at) : ''}</p>
                    </div>
                    <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gold hover:underline flex items-center gap-1 shrink-0">
                      <Eye className="w-3 h-3" /> {lang === 'pt' ? 'Ver' : 'View'}
                    </a>
                  </div>

                  {/* Status + Score */}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${
                      cvAnalysed ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {cvAnalysed ? (
                        <><Check className="w-2.5 h-2.5" /> {t('profile.cvStatus.analysed')}</>
                      ) : (
                        <><BarChart3 className="w-2.5 h-2.5" /> {t('profile.cvStatus.notAnalysed')}</>
                      )}
                    </span>
                    {cvScore !== null && (
                      <span className="text-[10px] font-medium text-[#666]">
                        Score: <span className={`font-semibold ${cvScore >= 70 ? 'text-emerald-600' : cvScore >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{cvScore}/100</span>
                      </span>
                    )}
                  </div>

                  {/* Last analysis date */}
                  {lastCvAnalysisDate && (
                    <p className="text-[10px] text-[#999] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t('member.lastCvAnalysis')}: {timeAgo(lastCvAnalysisDate)}
                    </p>
                  )}

                  {/* Quick actions */}
                  <div className="flex gap-2">
                    {isSubscriber && (
                      <Link href="/membros" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a1a1a] text-white text-[10px] font-medium rounded-lg hover:bg-[#333] transition-colors">
                        <BarChart3 className="w-3 h-3" /> {t('profile.cvAnalyse')}
                      </Link>
                    )}
                    <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#ddd] rounded-lg text-[10px] text-[#888] hover:border-gold/30 hover:text-gold transition-all disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      {t('profile.cvReplace')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-[#ddd] mx-auto mb-2" />
                  <p className="text-xs text-[#999] mb-3">{t('dash.noCv')}</p>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#1a1a1a] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {t('dash.uploadCv')}
                  </button>
                  <p className="text-[10px] text-[#bbb] mt-2">{t('dash.maxFileSize')}</p>
                </div>
              )}

              {cvUploaded && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 animate-in fade-in duration-300">
                  <Check className="w-3.5 h-3.5" /> {t('dash.cvUploaded')}
                </div>
              )}
            </section>
          </div>

          {/* ═══ RIGHT COLUMN: Subscription + Member Link ═══ */}
          <div className="space-y-5">

            {/* ─── Subscription Enriched Widget ─── */}
            <section className="border border-[#e5e5e5] rounded-xl p-5 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-gold" />
                </div>
                <h2 className="text-sm font-semibold text-[#1a1a1a]">{t('profile.subscription')}</h2>
              </div>

              {subscription && isSubscriber ? (
                <div className="space-y-3">
                  {/* Tier badge + status */}
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

                  {/* Usage bar */}
                  <div className="p-3 bg-[#fafaf9] border border-[#f0f0f0] rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-[#999]">{t('member.usageTitle')}</span>
                      <span className="text-[10px] font-medium text-[#666]">
                        {weeklyUsage}/{isProPlan ? '∞' : weeklyLimit}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: isProPlan ? '15%' : `${Math.min(100, (weeklyUsage / weeklyLimit) * 100)}%`,
                          background: isProPlan ? '#8b5cf6' : weeklyUsage >= weeklyLimit ? '#ef4444' : '#BFA14A',
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-[#bbb] mt-1">
                      {weeklyUsage} {t('member.usedThisWeek')}
                      {!isProPlan && ` · ${Math.max(0, weeklyLimit - weeklyUsage)} ${t('profile.remaining')}`}
                    </p>
                  </div>

                  {/* Benefits checklist */}
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-2">{t('profile.benefits')}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#666]">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{b.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Renewal progress */}
                  <div>
                    <div className="w-full h-1 bg-[#e5e5e5] rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-500" style={{ width: `${renewalPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-[#999]">
                      <span>{daysLeft} {lang === 'pt' ? 'dias restantes' : 'days left'}</span>
                      <span>{new Date(subscription.expires_at).toLocaleDateString('pt-PT')}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex gap-2">
                    <Link href="/membros" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a1a1a] text-white text-[10px] font-medium rounded-lg hover:bg-[#333] transition-colors">
                      <Sparkles className="w-3 h-3" /> {t('profile.useBenefit')}
                    </Link>
                    <Link href="/planos" className="flex items-center gap-1 px-3 py-2 text-[10px] text-gold border border-gold/20 rounded-lg hover:bg-gold/5 font-medium transition-colors">
                      {t('profile.managePlan')}
                    </Link>
                  </div>
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

            {/* ─── Quick link to Member Area ─── */}
            <Link href="/membros" className="flex items-center justify-between p-4 border border-[#e5e5e5] rounded-xl bg-white shadow-sm hover:border-gold/20 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold/15 to-gold/5 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">
                    {t('profile.memberArea')}
                  </p>
                  <p className="text-[10px] text-[#999]">{t('profile.memberAreaDesc')}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-gold transition-colors" />
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PRIVACY & SECURITY                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="p-4 bg-[#fafaf9] border border-[#f0f0f0] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-3.5 h-3.5 text-[#bbb]" />
            <span className="text-[10px] text-[#999] font-medium uppercase tracking-wider">{t('profile.privacy.title')}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-[#999]">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>{t('profile.privacy.secure')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#999]">
              <Trash2 className="w-3 h-3 text-[#ccc]" />
              <span>{t('profile.privacy.delete')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#999]">
              <Shield className="w-3 h-3 text-[#ccc]" />
              <span>{t('profile.privacy.noCvShare')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
