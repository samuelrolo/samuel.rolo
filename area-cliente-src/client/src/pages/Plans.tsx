/*
 * Design: Consultoria de Luxo Silenciosa
 * Página de planos — melhorias UX:
 *   • banner "plano atual" para subscribers com próximo tier destacado
 *   • badges de poupança em semestral/anual
 *   • preço equivalente por mês para períodos longos
 *   • badges "Atual" / "Upgrade" nos cards
 *   • CTA diferenciado: "Upgrade para X" vs "Subscrever"
 *   • tabela de comparação de features colapsável
 */
import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { supabase } from '@/lib/supabase';
import {
  Check, ChevronDown, ChevronUp, Sparkles, ArrowRight, Lock,
  X, Zap, BarChart3, Info,
} from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

type Period = 'monthly' | 'semiannual' | 'annual';
type Tier = 'essential' | 'growth' | 'pro';

interface PriceMap { monthly: number; semiannual: number; annual: number; }

interface TierConfig {
  tier: Tier; icon: React.ReactNode; prices: PriceMap;
  oldMonthlyPrice?: number;
  tagline: string; benefits: string[]; limit: string;
  bonuses?: string[]; notIncluded?: string[]; badge?: string; highlight?: boolean; roi?: string; valueAnchor?: string;
}

const tiers: TierConfig[] = [
  {
    tier: 'essential', icon: <Check className="w-4 h-4" />,
    prices: { monthly: 6.99, semiannual: 35.99, annual: 66.99 },
    oldMonthlyPrice: 9.90,
    tagline: 'sub.essential.tagline',
    benefits: ['sub.essential.b1','sub.essential.b2','sub.essential.b3','sub.essential.b4','sub.essential.b5','sub.essential.b6'],
    limit: 'sub.essential.limit',
    roi: 'sub.essential.roi', valueAnchor: 'sub.essential.anchor',
    bonuses: ['sub.extra.cp', 'sub.extra.ci'],
    notIncluded: ['sub.notIncluded.vagas','sub.notIncluded.ebooks','sub.notIncluded.careerPath','sub.notIncluded.careerIntel'],
  },
  {
    tier: 'growth', icon: <BarChart3 className="w-4 h-4" />,
    prices: { monthly: 14.49, semiannual: 74.99, annual: 138.99 },
    oldMonthlyPrice: 19.90,
    tagline: 'sub.growth.tagline',
    benefits: ['sub.growth.b1','sub.growth.b2','sub.growth.b3','sub.growth.b4','sub.growth.b5'],
    limit: 'sub.growth.limit',
    roi: 'sub.growth.roi',
    bonuses: ['sub.extra.cp', 'sub.extra.ci'], notIncluded: [],
    badge: 'sub.recommended', highlight: true,
  },
  {
    tier: 'pro', icon: <Zap className="w-4 h-4" />,
    prices: { monthly: 29.99, semiannual: 154.99, annual: 287.99 },
    oldMonthlyPrice: 39.00,
    tagline: 'sub.pro.tagline',
    benefits: ['sub.pro.b1','sub.pro.b2','sub.pro.b3','sub.pro.b4','sub.pro.b5'],
    limit: 'sub.pro.limit',
    roi: 'sub.pro.roi',
    bonuses: ['sub.extra.cp', 'sub.extra.ci'], badge: 'sub.bestValue',
  },
];

const testimonials = [
  { name: 'Ana M.', role: 'Senior Manager', text: 'sub.testimonial1', initials: 'AM', color: 'bg-rose-100 text-rose-700' },
  { name: 'Diogo S.', role: 'Software Engineer', text: 'sub.testimonial2', initials: 'DS', color: 'bg-sky-100 text-sky-700' },
  { name: 'Mariana C.', role: 'Product Manager', text: 'sub.testimonial3', initials: 'MC', color: 'bg-amber-100 text-amber-700' },
];

const faqs = [
  { q: 'sub.faq1q', a: 'sub.faq1a' }, { q: 'sub.faq2q', a: 'sub.faq2a' },
  { q: 'sub.faq3q', a: 'sub.faq3a' }, { q: 'sub.faq4q', a: 'sub.faq4a' },
];

const periodLabels: Record<Period,string> = { monthly:'sub.monthly', semiannual:'sub.semiannual', annual:'sub.annual' };
const periodSuffix: Record<Period,string> = { monthly:'sub.month', semiannual:'sub.semester', annual:'sub.year' };
const TIER_ORDER: Record<Tier,number> = { essential:1, growth:2, pro:3 };

function formatPrice(p: number) { return p.toFixed(2).replace('.',',') + ' €'; }

function getBillingMonths(period: Period): number {
  return period === 'semiannual' ? 6 : period === 'annual' ? 12 : 1;
}

function getOldPriceForPeriod(oldMonthlyPrice: number | undefined, period: Period): number | null {
  if (!oldMonthlyPrice) return null;
  return oldMonthlyPrice * getBillingMonths(period);
}

function savingsPct(currentPrice: number, oldPrice: number | null): number | null {
  if (!oldPrice || oldPrice <= currentPrice) return null;
  return Math.round((1 - currentPrice / oldPrice) * 100);
}

function getPlanTier(plan?: string): Tier | null {
  if (!plan) return null;
  const p = plan.toLowerCase();
  if (p.includes('pro') || p === 'annual') return 'pro';
  if (p.includes('growth') || p === 'semiannual') return 'growth';
  if (p.includes('essential')) return 'essential';
  return null;
}

const COMPARISON_KEYS: [string, string, string, string][] = [
  ['cmp.cvAnalyser',          '1{w}',       '5{w}',             'cmp.unlimited'],
  ['cmp.linkedinRoaster',     '1{w}',       '5{w}',             'cmp.unlimited'],
  ['cmp.careerBot',           'cmp.base',    'cmp.advanced',     'cmp.advanced'],
  ['cmp.careerProgress',      '\u2713',           '\u2713',                '\u2713'],
  ['cmp.blogArticles',        '\u2713',           '\u2713',                '\u2713'],
  ['cmp.jobFeed',             '\u2014',           'cmp.smartMatching','cmp.matchingSalary'],
  ['cmp.ebooksTemplates',     '\u2014',           '\u2713',                '\u2713'],
  ['cmp.careerPathBonus',     '\u2014',           'cmp.included1',          'cmp.included2'],
  ['cmp.careerIntelligence',  '\u2014',           'cmp.included1',          'cmp.included2'],
  ['cmp.extraAnalyses',       'CP 3,75€ · CI 6,25€', 'CP 3,75€ · CI 6,25€', 'CP 3,75€ · CI 6,25€'],
  ['cmp.priorityProcessing',  '\u2014',           '\u2014',                '\u2713'],
  ['cmp.earlyAccess',         '\u2014',           '\u2014',                '\u2713'],
];

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

export default function Plans() {
  const { t } = useI18n();
  const { user, subscription, hasActiveSubscription, refreshProfile } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [period, setPeriod] = useState<Period>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  // Handle Stripe Checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');

    if (payment === 'success' && sessionId && user) {
      setStripeStatus('verifying');
      // Verify payment with backend and activate subscription
      const verifyPayment = async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/payment/stripe-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          const data = await res.json();
          if (data.success && data.paid) {
            // Also create subscription record from frontend as fallback
            const storedPlan = sessionStorage.getItem('s2iSubPlan') || 'essential_monthly';
            const planDurations: Record<string, number> = {
              monthly: 30, semiannual: 180, annual: 365,
            };
            const periodKey = storedPlan.includes('annual') ? 'annual' : storedPlan.includes('semiannual') ? 'semiannual' : 'monthly';
            const now = new Date();
            const endDate = new Date(now.getTime() + (planDurations[periodKey] || 30) * 24 * 60 * 60 * 1000);

            // Check if subscription already created by webhook
            const { data: existingSub } = await supabase
              .from('subscriptions')
              .select('id')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .limit(1)
              .single();

            if (!existingSub) {
              await supabase.from('subscriptions').insert({
                user_id: user.id,
                plan: storedPlan,
                status: 'active',
                price_eur: data.amount ? data.amount / 100 : getPlanPrice(storedPlan),
                started_at: now.toISOString(),
                expires_at: endDate.toISOString(),
                payment_method: 'stripe',
                payment_reference: data.order_id || sessionId,
              });
            }

            // Refresh auth context to pick up new subscription
            if (refreshProfile) await refreshProfile();
            setStripeStatus('success');
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            // Clean session storage
            sessionStorage.removeItem('s2iSubOrderId');
            sessionStorage.removeItem('s2iSubPlan');
            sessionStorage.removeItem('s2iSubEmail');
            sessionStorage.removeItem('stripeSessionId');
          } else {
            setStripeStatus('error');
          }
        } catch (err) {
          console.error('[Plans] Stripe verify error:', err);
          setStripeStatus('error');
        }
      };
      verifyPayment();
    } else if (payment === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  const currentTier = hasActiveSubscription() ? getPlanTier(subscription?.plan) : null;

  function handleSubscribe(tier: Tier) {
    if (!user) {
      openLoginModal();
      return;
    }
    setSelectedPlan(`${tier}_${period}`);
  }

  function getPlanPrice(planKey: string): number {
    const [tier, per] = planKey.split('_') as [Tier, Period];
    const tierConfig = tiers.find(t => t.tier === tier);
    return tierConfig ? tierConfig.prices[per] : 0;
  }

  function getPlanLabelStr(planKey: string): string {
    const [tier, per] = planKey.split('_') as [Tier, Period];
    return `${t(`sub.${tier}`)} — ${t(periodLabels[per])}`;
  }

  const isCurrent = (tier: Tier) => currentTier === tier;
  const isUpgrade = (tier: Tier) => currentTier !== null && TIER_ORDER[tier] > TIER_ORDER[currentTier];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          {/* Social Proof Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-[#888] font-light mb-6">
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full ring-2 ring-white bg-rose-100 text-rose-700 text-[8px] font-bold">AM</span>
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full ring-2 ring-white bg-sky-100 text-sky-700 text-[8px] font-bold">DS</span>
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full ring-2 ring-white bg-amber-100 text-amber-700 text-[8px] font-bold">MC</span>
            </div>
            <span>+500 {t('sub.usersImproved')}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs text-gold font-medium">{t('sub.founderBadge')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#1a1a1a] mb-4">{t('sub.title')}</h1>
          <p className="text-[#888] font-light max-w-lg mx-auto">{t('sub.subtitle')}</p>

          {/* Free account CTA */}
          {!user && (
            <div className="mt-8 p-4 border border-[#e5e5e5] rounded-lg max-w-md mx-auto">
              <p className="text-sm text-[#555] font-light mb-3">{t('sub.freeCtaText')}</p>
              <button onClick={openLoginModal}
                className="inline-flex items-center gap-2 px-5 py-2 border border-gold/30 text-gold text-sm font-medium rounded hover:bg-gold/10 transition-all duration-300">
                {t('sub.freeCtaBtn')} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Current plan banner */}
          {currentTier && (
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5f5f4] border border-[#e5e5e5] rounded-lg text-sm text-[#555] font-light">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {t('plans.currentPlan')}: <span className="font-medium text-[#1a1a1a] capitalize">{currentTier}</span>
              </div>
              {currentTier !== 'pro' && (
                <div className="inline-flex items-center gap-1.5 text-xs text-[#999] font-light">
                  <Info className="w-3.5 h-3.5 text-gold/60" />
                  {t('plans.upgradeAvailable')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Period Toggle with savings badges */}
        <div className="flex flex-col items-center mb-12 gap-2">
          <div className="inline-flex bg-[#f5f5f4] rounded-lg p-1 gap-0.5">
            {(['monthly','semiannual','annual'] as Period[]).map(p => {
              const savings = savingsPct(tiers[1].prices[p], getOldPriceForPeriod(tiers[1].oldMonthlyPrice, p));
              return (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`relative px-5 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                    period === p ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#888] hover:text-[#555]'
                  }`}>
                  {t(periodLabels[p])}
                  {savings && (
                    <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 bg-gold text-white text-[9px] font-semibold rounded-full leading-none whitespace-nowrap">
                      -{savings}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {period !== 'monthly' && (
            <p className="text-xs text-[#aaa] font-light">
              {period === 'semiannual' ? t('plans.semiannualPayment') : t('plans.annualPayment')} — {t('plans.noHiddenCosts')}
            </p>
          )}
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-10">
          {tiers.map(tc => {
            const price = tc.prices[period];
            const months = getBillingMonths(period);
            const oldPrice = getOldPriceForPeriod(tc.oldMonthlyPrice, period);
            const savings = savingsPct(price, oldPrice);
            const current = isCurrent(tc.tier);
            const upgrade = isUpgrade(tc.tier);

            return (
              <div key={tc.tier}
                className={`relative p-6 md:p-8 rounded border transition-all duration-500 flex flex-col ${
                  tc.highlight
                    ? 'border-gold/30 bg-[#f7f7f6] shadow-[0_0_30px_oklch(0.74_0.10_85/0.08)]'
                    : 'border-[#e5e5e5] hover:border-[#ddd]'
                } ${current ? 'ring-1 ring-gold/20' : ''}`}
              >
                {/* Badge */}
                {tc.badge && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-3 py-1 bg-gold text-[#1a1a1a] text-[10px] font-semibold uppercase tracking-wider rounded">
                      {t(tc.badge)}
                    </span>
                  </div>
                )}

                {/* Tier name + Atual/Upgrade badge */}
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-gold/60">{tc.icon}</span>
                  <h3 className="text-sm font-semibold text-[#2a2a2a] uppercase tracking-wider">
                    {t(`sub.${tc.tier}`)}
                  </h3>
                  {current && (
                    <span className="ml-auto px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[9px] text-emerald-700 font-medium">
                      {t('plans.current')}
                    </span>
                  )}
                  {upgrade && !current && (
                    <span className="ml-auto px-2 py-0.5 bg-gold/10 border border-gold/20 rounded text-[9px] text-gold font-medium">
                      {t('plans.upgrade')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#999] font-light mb-4 italic">{t(tc.tagline)}</p>

                {/* Price + equivalent per month */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {oldPrice && oldPrice > price && (
                      <span className="text-sm text-[#bbb] line-through font-light">{formatPrice(oldPrice)}</span>
                    )}
                    <span className="text-3xl font-semibold text-[#1a1a1a]">{formatPrice(price)}</span>
                    <span className="text-xs text-[#999] font-light">{t(periodSuffix[period])}</span>
                    {savings && (
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-700 font-semibold">-{savings}%</span>
                    )}
                  </div>
                  {period !== 'monthly' && (
                    <p className="text-[11px] text-[#bbb] font-light mt-0.5">
                      ≈ {formatPrice(price / months)} {t('plans.perMonth')}
                    </p>
                  )}
                </div>

                {/* Weekly limit badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold/8 border border-gold/15 rounded text-[11px] text-gold font-medium">
                    <Zap className="w-3 h-3" />
                    {t(tc.limit)}
                  </span>
                </div>

                {/* Benefits */}
                <ul className="space-y-2.5 mb-2 flex-1">
                  {tc.benefits.map(b => (
                    <li key={b} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-gold/60 mt-0.5 shrink-0" />
                      <span className="text-xs text-[#666] font-light leading-relaxed">{t(b)}</span>
                    </li>
                  ))}
                </ul>

                {/* Bonuses */}
                {tc.bonuses && tc.bonuses.length > 0 && (
                  <div className="mb-4 pt-3 border-t border-[#eee]">
                    <span className="text-[10px] text-gold font-medium uppercase tracking-wider">{t('sub.bonusLabel')}</span>
                    <ul className="space-y-2 mt-2">
                      {tc.bonuses.map(e => (
                        <li key={e} className="flex items-start gap-2.5">
                          <Sparkles className="w-3 h-3 text-gold/50 mt-0.5 shrink-0" />
                          <span className="text-xs text-[#555] font-light leading-relaxed">{t(e)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Not included */}
                {tc.notIncluded && tc.notIncluded.length > 0 && (
                  <div className="mb-5 pt-3 border-t border-[#eee]">
                    <ul className="space-y-2">
                      {tc.notIncluded.map(ni => (
                        <li key={ni} className="flex items-start gap-2.5">
                          <X className="w-3.5 h-3.5 text-[#ccc] mt-0.5 shrink-0" />
                          <span className="text-xs text-[#bbb] font-light leading-relaxed">{t(ni)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ROI & Value Anchor */}
                <div className="mt-auto pt-4">
                  {tc.roi && (
                    <div className="mb-3 text-center">
                      <p className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 inline-block">{t(tc.roi)}</p>
                    </div>
                  )}
                  {tc.valueAnchor && (
                    <div className="mb-3 text-center">
                      <p className="text-[11px] text-[#999] font-light">{t(tc.valueAnchor)}</p>
                    </div>
                  )}
                </div>

                {/* CTA */}
                {current ? (
                  <div className="w-full py-2.5 text-center text-sm text-gold/60 font-light border border-gold/20 rounded mt-auto">
                    {t('sub.current')}
                  </div>
                ) : (
                  <div className="mt-auto">
                    <button onClick={() => handleSubscribe(tc.tier)}
                      className="w-full py-2.5 text-sm font-medium rounded transition-all duration-300 flex items-center justify-center gap-2 bg-gold text-[#1a1a1a] hover:bg-[#a07d08] hover:text-white">
                      {!user && <Lock className="w-3.5 h-3.5" />}
                      {!user
                        ? t('sub.createToSubscribe')
                        : upgrade
                          ? `${t('plans.upgradeTo')} ${t(`sub.${tc.tier}`)}`
                          : t('sub.subscribe')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {/* Ajuste 5: Garantia de satisfação */}
                    <p className="text-center text-[10px] text-[#bbb] font-light mt-1.5 flex items-center justify-center gap-1">
                      <Check className="w-2.5 h-2.5" /> {t('plans.cancelAnytime')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Feature comparison toggle */}
        <div className="mb-20">
          <button onClick={() => setShowComparison(v => !v)}
            className="flex items-center gap-2 mx-auto text-xs text-[#aaa] hover:text-[#666] transition-colors font-light">
            {showComparison ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showComparison ? t('plans.hideComparison') : t('plans.showComparison')}
          </button>

          {showComparison && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5e5e5]">
                    <th className="text-left py-3 px-4 text-[#888] font-medium w-1/2">{t('cmp.feature')}</th>
                    <th className="text-center py-3 px-2 text-[#888] font-medium">Essential</th>
                    <th className="text-center py-3 px-2 text-[#888] font-medium bg-gold/5">Growth</th>
                    <th className="text-center py-3 px-2 text-[#888] font-medium">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_KEYS.map(([featureKey, essKey, groKey, proKey], i) => {
                                        const resolveVal = (v: string) => {
                      if (v === '\u2713' || v === '\u2014') return v;
                      if (v.includes('{w}')) return v.replace('{w}', t('cmp.perWeek'));
                      if (v.startsWith('cmp.')) return t(v);
                      return v;
                    };
                    const cell = (val: string, bgClass = '') => {
                      const resolved = resolveVal(val);
                      return (
                        <td className={`py-2.5 px-2 text-center text-[#888] ${bgClass}`}>
                          {resolved === '\u2713' ? <Check className="w-3.5 h-3.5 text-gold/60 mx-auto" />
                            : resolved === '\u2014' ? <X className="w-3 h-3 text-[#ddd] mx-auto" />
                            : resolved}
                        </td>
                      );
                    };
                    return (
                      <tr key={i} className={`border-b border-[#f0f0f0] ${i % 2 === 0 ? '' : 'bg-[#fafafa]'}`}>
                        <td className="py-2.5 px-4 text-[#555] font-light">{t(featureKey)}</td>
                        {cell(essKey)}
                        {cell(groKey, 'bg-gold/5')}
                        {cell(proKey)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Limited offer */}
        {/* Testimonials */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-xl font-semibold text-[#1a1a1a] mb-8 text-center">{t('sub.testimonialsTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-[#f7f7f6] border border-[#e5e5e5] rounded-lg p-6 text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-sm font-bold ${testimonial.color}`}>{testimonial.initials}</div>
                <p className="text-sm text-[#555] font-light italic mb-4">{t(testimonial.text)}</p>
                <p className="text-xs font-semibold text-[#1a1a1a]">{testimonial.name}</p>
                <p className="text-[10px] text-[#999]">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-20">
          <p className="text-xs text-[#bbb] font-light">{t('sub.limitedOffer')}</p>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-[#1a1a1a] mb-8 text-center">{t('sub.faq')}</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-[#e5e5e5] rounded overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="text-sm font-light text-[#2a2a2a]">{t(faq.q)}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-[#999] shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-[#999] shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-xs text-[#888] font-light leading-relaxed">{t(faq.a)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && user && (
        <PaymentModal plan={selectedPlan as any} onClose={() => setSelectedPlan(null)} />
      )}
    </div>
  );
}
