/*
 * Design: Consultoria de Luxo Silenciosa
 * Página de planos: 3 tiers (Essential/Growth/Pro) × 3 períodos (Mensal/Semestral/Anual)
 * Toggle de período no topo, 3 cards com benefícios diferenciados
 */
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Check, ChevronDown, ChevronUp, Sparkles, ArrowRight, Lock, X, Zap, BarChart3 } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

type Period = 'monthly' | 'semiannual' | 'annual';
type Tier = 'essential' | 'growth' | 'pro';

interface PriceMap {
  monthly: number;
  semiannual: number;
  annual: number;
}

interface TierConfig {
  tier: Tier;
  icon: React.ReactNode;
  prices: PriceMap;
  tagline: string;
  benefits: string[];
  limit: string;
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
    tagline: 'sub.essential.tagline',
    benefits: [
      'sub.essential.b1',
      'sub.essential.b2',
      'sub.essential.b3',
      'sub.essential.b4',
      'sub.essential.b5',
      'sub.essential.b6',
    ],
    limit: 'sub.essential.limit',
    notIncluded: ['sub.notIncluded.vagas', 'sub.notIncluded.ebooks', 'sub.notIncluded.careerPath', 'sub.notIncluded.careerIntel'],
  },
  {
    tier: 'growth',
    icon: <BarChart3 className="w-4 h-4" />,
    prices: { monthly: 19.90, semiannual: 99, annual: 159 },
    tagline: 'sub.growth.tagline',
    benefits: [
      'sub.growth.b1',
      'sub.growth.b2',
      'sub.growth.b3',
      'sub.growth.b4',
      'sub.growth.b5',
    ],
    limit: 'sub.growth.limit',
    bonuses: ['sub.growth.bonus'],
    notIncluded: ['sub.notIncluded.careerIntel'],
    badge: 'sub.recommended',
    highlight: true,
  },
  {
    tier: 'pro',
    icon: <Zap className="w-4 h-4" />,
    prices: { monthly: 39, semiannual: 199, annual: 299 },
    tagline: 'sub.pro.tagline',
    benefits: [
      'sub.pro.b1',
      'sub.pro.b2',
      'sub.pro.b3',
      'sub.pro.b4',
      'sub.pro.b5',
    ],
    limit: 'sub.pro.limit',
    bonuses: ['sub.pro.bonus1', 'sub.pro.bonus2'],
    badge: 'sub.bestValue',
  },
];

const faqs = [
  { q: 'sub.faq1q', a: 'sub.faq1a' },
  { q: 'sub.faq2q', a: 'sub.faq2a' },
  { q: 'sub.faq3q', a: 'sub.faq3a' },
  { q: 'sub.faq4q', a: 'sub.faq4a' },
];

const periodLabels: Record<Period, string> = {
  monthly: 'sub.monthly',
  semiannual: 'sub.semiannual',
  annual: 'sub.annual',
};

const periodSuffix: Record<Period, string> = {
  monthly: 'sub.month',
  semiannual: 'sub.semester',
  annual: 'sub.year',
};

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €';
}

export default function Plans() {
  const { t } = useI18n();
  const { user, subscription, hasActiveSubscription } = useAuth();
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState<Period>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentPlanKey = subscription && hasActiveSubscription() ? subscription.plan : null;

  function handleSubscribe(tier: Tier) {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Plan key format: essential_monthly, growth_semiannual, pro_annual
    setSelectedPlan(`${tier}_${period}`);
  }

  function getPlanPrice(planKey: string): number {
    const [tier, per] = planKey.split('_') as [Tier, Period];
    const tierConfig = tiers.find(t => t.tier === tier);
    return tierConfig ? tierConfig.prices[per] : 0;
  }

  function getPlanLabel(planKey: string): string {
    const [tier, per] = planKey.split('_') as [Tier, Period];
    return `${t(`sub.${tier}`)} — ${t(periodLabels[per])}`;
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs text-gold font-medium">{t('sub.founderBadge')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#1a1a1a] mb-4">{t('sub.title')}</h1>
          <p className="text-[#888] font-light max-w-lg mx-auto">{t('sub.subtitle')}</p>

          {/* Free account CTA if not logged in */}
          {!user && (
            <div className="mt-8 p-4 bg-white/[0.02] border border-[#e5e5e5] rounded-lg max-w-md mx-auto">
              <p className="text-sm text-[#555] font-light mb-3">
                {t('sub.freeCtaText')}
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 px-5 py-2 border border-gold/30 text-gold text-sm font-medium rounded hover:bg-gold/10 transition-all duration-300"
              >
                {t('sub.freeCtaBtn')}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Period Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-[#f5f5f4] rounded-lg p-1 gap-0.5">
            {(['monthly', 'semiannual', 'annual'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  period === p
                    ? 'bg-white text-[#1a1a1a] shadow-sm'
                    : 'text-[#888] hover:text-[#555]'
                }`}
              >
                {t(periodLabels[p])}
              </button>
            ))}
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-20">
          {tiers.map((tierConfig) => {
            const price = tierConfig.prices[period];
            const planKey = `${tierConfig.tier}_${period}`;
            const isCurrent = currentPlanKey === planKey;

            return (
              <div
                key={tierConfig.tier}
                className={`relative p-6 md:p-8 rounded border transition-all duration-500 flex flex-col ${
                  tierConfig.highlight
                    ? 'border-gold/30 bg-[#f7f7f6] shadow-[0_0_30px_oklch(0.74_0.10_85/0.08)]'
                    : 'border-[#e5e5e5] hover:border-[#ddd]'
                }`}
              >
                {/* Badge */}
                {tierConfig.badge && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-3 py-1 bg-gold text-[#1a1a1a] text-[10px] font-semibold uppercase tracking-wider rounded">
                      {t(tierConfig.badge)}
                    </span>
                  </div>
                )}

                {/* Tier name + icon + tagline */}
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-gold/60">{tierConfig.icon}</span>
                  <h3 className="text-sm font-semibold text-[#2a2a2a] uppercase tracking-wider">
                    {t(`sub.${tierConfig.tier}`)}
                  </h3>
                </div>
                <p className="text-[11px] text-[#999] font-light mb-4 italic">{t(tierConfig.tagline)}</p>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold text-[#1a1a1a]">{formatPrice(price)}</span>
                    <span className="text-xs text-[#999] font-light">{t(periodSuffix[period])}</span>
                  </div>
                </div>

                {/* Weekly limit badge */}
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold/8 border border-gold/15 rounded text-[11px] text-gold font-medium">
                    <Zap className="w-3 h-3" />
                    {t(tierConfig.limit)}
                  </span>
                </div>

                {/* Benefits */}
                <ul className="space-y-2.5 mb-2 flex-1">
                  {tierConfig.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-gold/60 mt-0.5 shrink-0" />
                      <span className="text-xs text-[#666] font-light leading-relaxed">{t(b)}</span>
                    </li>
                  ))}
                </ul>

                {/* Bonuses */}
                {tierConfig.bonuses && tierConfig.bonuses.length > 0 && (
                  <div className="mb-4 pt-3 border-t border-[#eee]">
                    <span className="text-[10px] text-gold font-medium uppercase tracking-wider">{t('sub.bonusLabel')}</span>
                    <ul className="space-y-2 mt-2">
                      {tierConfig.bonuses.map((e) => (
                        <li key={e} className="flex items-start gap-2.5">
                          <Sparkles className="w-3 h-3 text-gold/50 mt-0.5 shrink-0" />
                          <span className="text-xs text-[#555] font-light leading-relaxed">{t(e)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Not included */}
                {tierConfig.notIncluded && tierConfig.notIncluded.length > 0 && (
                  <div className="mb-5 pt-3 border-t border-[#eee]">
                    <ul className="space-y-2">
                      {tierConfig.notIncluded.map((ni) => (
                        <li key={ni} className="flex items-start gap-2.5">
                          <X className="w-3.5 h-3.5 text-[#ccc] mt-0.5 shrink-0" />
                          <span className="text-xs text-[#bbb] font-light leading-relaxed">{t(ni)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA */}
                {isCurrent ? (
                  <div className="w-full py-2.5 text-center text-sm text-gold/60 font-light border border-gold/20 rounded mt-auto">
                    {t('sub.current')}
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(tierConfig.tier)}
                    className={`w-full py-2.5 text-sm font-medium rounded transition-all duration-300 flex items-center justify-center gap-2 mt-auto ${
                      tierConfig.highlight
                        ? 'bg-gold text-[#1a1a1a] hover:bg-gold-light'
                        : 'border border-[#ddd] text-[#333] hover:border-gold/30 hover:text-[#1a1a1a]'
                    }`}
                  >
                    {!user && <Lock className="w-3.5 h-3.5" />}
                    {!user ? t('sub.createToSubscribe') : t('sub.subscribe')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Limited offer note */}
        <div className="text-center mb-20">
          <p className="text-xs text-[#aaa] font-light">{t('sub.limitedOffer')}</p>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-[#1a1a1a] mb-8 text-center">{t('sub.faq')}</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-[#e5e5e5] rounded overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-light text-[#2a2a2a]">{t(faq.q)}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-[#999] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#999] shrink-0" />
                  )}
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
        <PaymentModal
          plan={selectedPlan}
          price={getPlanPrice(selectedPlan)}
          planLabel={getPlanLabel(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
}
