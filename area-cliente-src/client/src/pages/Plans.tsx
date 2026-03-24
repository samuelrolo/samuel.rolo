/*
 * Design: Consultoria de Luxo Silenciosa
 * Página de planos de subscrição com pricing cards diferenciados por plano
 * Fluxo: Se não autenticado → redireciona para criar conta/login
 *        Se autenticado → abre modal de pagamento
 */
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Check, ChevronDown, ChevronUp, Sparkles, ArrowRight, Lock, X } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

type PlanKey = 'monthly' | 'semiannual' | 'annual';

const plans: {
  key: PlanKey;
  price: number;
  futurePrice: number;
  period: string;
  badge?: string;
  highlight?: boolean;
  tagline: string;
  benefits: string[];
  extras?: string[];
}[] = [
  {
    key: 'monthly',
    price: 9.90,
    futurePrice: 20,
    period: 'sub.month',
    tagline: 'sub.m.tagline',
    benefits: ['sub.m.b1', 'sub.m.b2', 'sub.m.b3', 'sub.m.b4', 'sub.m.b5'],
  },
  {
    key: 'semiannual',
    price: 49,
    futurePrice: 90,
    period: 'sub.semester',
    badge: 'sub.popular',
    highlight: true,
    tagline: 'sub.s.tagline',
    benefits: ['sub.s.b1', 'sub.s.b2', 'sub.s.b3', 'sub.s.b4'],
    extras: ['sub.s.b5'],
  },
  {
    key: 'annual',
    price: 89,
    futurePrice: 149,
    period: 'sub.year',
    badge: 'sub.bestValue',
    tagline: 'sub.a.tagline',
    benefits: ['sub.a.b1', 'sub.a.b2', 'sub.a.b3', 'sub.a.b4'],
    extras: ['sub.a.b5', 'sub.a.b6'],
  },
];

const faqs = [
  { q: 'sub.faq1q', a: 'sub.faq1a' },
  { q: 'sub.faq2q', a: 'sub.faq2a' },
  { q: 'sub.faq3q', a: 'sub.faq3a' },
];

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €';
}

function savingsPercent(price: number, futurePrice: number) {
  return Math.round(((futurePrice - price) / futurePrice) * 100);
}

export default function Plans() {
  const { t } = useI18n();
  const { user, subscription, hasActiveSubscription } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentPlan = subscription && hasActiveSubscription() ? subscription.plan : null;

  function handleSubscribe(planKey: PlanKey) {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSelectedPlan(planKey);
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
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
                Cria a tua conta <span className="text-gold font-medium">gratuita</span> e guarda todas as tuas análises num só lugar.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 px-5 py-2 border border-gold/30 text-gold text-sm font-medium rounded hover:bg-gold/10 transition-all duration-300"
              >
                Criar conta gratuita
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-20">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            const savings = savingsPercent(plan.price, plan.futurePrice);
            return (
              <div
                key={plan.key}
                className={`relative p-6 md:p-8 rounded border transition-all duration-500 flex flex-col ${
                  plan.highlight
                    ? 'border-gold/30 bg-[#f7f7f6] shadow-[0_0_30px_oklch(0.74_0.10_85/0.08)]'
                    : 'border-[#e5e5e5] hover:border-[#ddd]'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-6">
                    <span className="px-3 py-1 bg-gold text-[#1a1a1a] text-[10px] font-semibold uppercase tracking-wider rounded">
                      {t(plan.badge)}
                    </span>
                  </div>
                )}

                {/* Plan name + tagline */}
                <h3 className="text-sm font-medium text-[#2a2a2a] mb-0.5">{t(`sub.${plan.key}`)}</h3>
                <p className="text-[11px] text-[#999] font-light mb-3 italic">{t(plan.tagline)}</p>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-semibold text-[#1a1a1a]">{formatPrice(plan.price)}</span>
                    <span className="text-xs text-[#999] font-light">{t(plan.period)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-[#aaa] line-through font-light">{formatPrice(plan.futurePrice)}</span>
                    <span className="text-xs text-gold font-medium">{t('sub.save')} {savings}%</span>
                  </div>
                </div>

                {/* Benefits */}
                <ul className="space-y-2.5 mb-2 flex-1">
                  {plan.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-gold/60 mt-0.5 shrink-0" />
                      <span className="text-xs text-[#666] font-light leading-relaxed">{t(b)}</span>
                    </li>
                  ))}
                </ul>

                {/* Extras / Bonus */}
                {plan.extras && plan.extras.length > 0 && (
                  <div className="mb-5 pt-3 border-t border-[#eee]">
                    <span className="text-[10px] text-gold font-medium uppercase tracking-wider">Bónus</span>
                    <ul className="space-y-2 mt-2">
                      {plan.extras.map((e) => (
                        <li key={e} className="flex items-start gap-2.5">
                          <Sparkles className="w-3 h-3 text-gold/50 mt-0.5 shrink-0" />
                          <span className="text-xs text-[#555] font-light leading-relaxed">{t(e)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Not included (monthly only) */}
                {plan.key === 'monthly' && (
                  <div className="mb-5 pt-3 border-t border-[#eee]">
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2.5">
                        <X className="w-3.5 h-3.5 text-[#ccc] mt-0.5 shrink-0" />
                        <span className="text-xs text-[#bbb] font-light leading-relaxed">Career Path</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <X className="w-3.5 h-3.5 text-[#ccc] mt-0.5 shrink-0" />
                        <span className="text-xs text-[#bbb] font-light leading-relaxed">Career Intelligence</span>
                      </li>
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
                    onClick={() => handleSubscribe(plan.key)}
                    className={`w-full py-2.5 text-sm font-medium rounded transition-all duration-300 flex items-center justify-center gap-2 mt-auto ${
                      plan.highlight
                        ? 'bg-gold text-[#1a1a1a] hover:bg-gold-light'
                        : 'border border-[#ddd] text-[#333] hover:border-gold/30 hover:text-[#1a1a1a]'
                    }`}
                  >
                    {!user && <Lock className="w-3.5 h-3.5" />}
                    {!user ? 'Criar conta para subscrever' : t('sub.subscribe')}
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
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
}
