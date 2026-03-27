/*
 * UpgradePage — Mostrado quando o utilizador está autenticado mas sem subscrição activa
 * Design: Consultoria de Luxo Silenciosa
 * Inclui: boas-vindas personalizadas, benefícios por tier, testemunhos, CTA para planos
 */
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { Link } from 'wouter';
import {
  Sparkles, Check, BarChart3, Zap, Star, ArrowRight,
  FileText, Linkedin, Bot, BookOpen, Briefcase, Lock,
  Shield, RefreshCcw, Users
} from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import { useState } from 'react';

type Tier = 'essential' | 'growth' | 'pro';
type Period = 'monthly' | 'semiannual' | 'annual';

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

export default function UpgradePage() {
  const { profile } = useAuth();
  const { t, lang } = useI18n();
  const [period, setPeriod] = useState<Period>('monthly');
  const [payModal, setPayModal] = useState<{ open: boolean; planKey: string; price: number } | null>(null);

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
        <div className="flex justify-center mb-10">
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
                    <span className="text-[10px] text-emerald-600 font-medium">Poupa {saving}%</span>
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
