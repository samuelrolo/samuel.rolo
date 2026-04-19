/*
 * Design: Consultoria de Luxo Silenciosa
 * Modal de pagamento unificado — Stripe Only
 * - Stripe Checkout (cartão, com renovação automática)
 * - Cupões de desconto parcial e 100%
 * - Vouchers
 * - Google Ads + Meta Pixel tracking
 * - Affiliate tracking
 * Backend: share2inspire-beckend.lm.r.appspot.com
 */
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useI18n, type Lang } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  X, ArrowRight, Check,
  Loader2, AlertCircle, CreditCard,
  Tag, CheckCircle2,
} from 'lucide-react';

type PeriodKey = 'monthly' | 'semiannual' | 'annual';
type Tier = 'essential' | 'growth' | 'pro';
type Step = 'select' | 'processing' | 'success' | 'error';

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

const planPrices: Record<Tier, Record<PeriodKey, number>> = {
  essential: { monthly: 6.99, semiannual: 35.99, annual: 66.99 },
  growth: { monthly: 14.49, semiannual: 74.99, annual: 138.99 },
  pro: { monthly: 29.99, semiannual: 154.99, annual: 287.99 },
};

const planDurations: Record<PeriodKey, number> = {
  monthly: 30,
  semiannual: 180,
  annual: 365,
};

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €';
}

function pick(lang: Lang, pt: string, en: string, es: string): string {
  if (lang === 'pt') return pt;
  if (lang === 'es') return es;
  return en;
}

/** Extract the period from a plan string like "essential_monthly" or just "monthly" */
function extractPeriod(planStr: string): PeriodKey {
  if (planStr.includes('monthly')) return 'monthly';
  if (planStr.includes('semiannual')) return 'semiannual';
  if (planStr.includes('annual')) return 'annual';
  return 'monthly';
}

function extractTier(planStr: string): Tier {
  if (planStr.includes('growth')) return 'growth';
  if (planStr.includes('pro')) return 'pro';
  return 'essential';
}

// ── Tracking helpers ──────────────────────────────────────────
function trackGtag(eventName: string, params?: Record<string, any>) {
  try {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', eventName, params);
    }
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({ event: eventName, ...params });
    }
  } catch { /* silent */ }
}

function trackFbq(eventName: string, params?: Record<string, any>) {
  try {
    if (typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', eventName, params);
    }
  } catch { /* silent */ }
}

function trackPurchase(value: number, transactionId: string, planLabel: string) {
  if ((window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'conversion',
      send_to: 'AW-17015553005/9nRUCPa9l_AbEO330rE_',
      value,
      currency: 'EUR',
      transaction_id: transactionId,
    });
  }
  trackGtag('purchase', {
    event_category: 'ecommerce',
    items: [{ item_name: `Subscrição ${planLabel}` }],
    value,
    currency: 'EUR',
    transaction_id: transactionId,
  });
  trackFbq('Purchase', { value, currency: 'EUR', content_name: `subscription_${planLabel}` });
}

// ── Coupon usage increment ────────────────────────────────────
async function incrementCouponUsage(code: string) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const rows = await res.json();
    if (rows?.length > 0) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ current_uses: (rows[0].current_uses || 0) + 1 }),
        }
      );
    }
  } catch { /* silent */ }
}

// ── Props ─────────────────────────────────────────────────────
// Supports both calling conventions:
//   Plans.tsx:       <PaymentModal plan="essential_monthly" onClose={...} />
//   UpgradePage.tsx: <PaymentModal isOpen planKey="essential_monthly" price={9.90} onClose={...} />
type Props = {
  onClose: () => void;
  plan?: string;
  planKey?: string;
  isOpen?: boolean;
  price?: number;
};

export default function PaymentModal({ onClose, plan, planKey, price }: Props) {
  const { t, lang } = useI18n();
  const [, navigate] = useLocation();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('select');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Discount / coupon state
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountValid, setDiscountValid] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);

  // Resolve plan string from either prop
  const planStr = plan || planKey || 'essential_monthly';
  const tier = extractTier(planStr);
  const period = extractPeriod(planStr);
  const basePrice = price ?? planPrices[tier][period];
  const finalPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      setName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
      setEmail(profile.email || user?.email || '');
    } else if (user) {
      setEmail(user.email || '');
      const meta = user.user_metadata;
      if (meta?.first_name) setName(`${meta.first_name} ${meta.last_name || ''}`.trim());
    }
  }, [profile, user]);

  const planLabels: Record<PeriodKey, string> = {
    monthly: `${t(`sub.${tier}`)} — ${t('sub.monthly')}`,
    semiannual: `${t(`sub.${tier}`)} — ${t('sub.semiannual')}`,
    annual: `${t(`sub.${tier}`)} — ${t('sub.annual')}`,
  };

  const periodLabels: Record<PeriodKey, string> = {
    monthly: t('sub.month'),
    semiannual: t('sub.semester'),
    annual: t('sub.year'),
  };

  // Create subscription record in Supabase
  const createSubscription = useCallback(async (_payMethod: string, _payRef: string, status: string) => {
    if (!user) return;
    const now = new Date();
    const endDate = new Date(now.getTime() + planDurations[period] * 24 * 60 * 60 * 1000);
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: planStr,
      status: status,
      price_eur: finalPrice,
      started_at: status === 'active' ? now.toISOString() : null,
      expires_at: status === 'active' ? endDate.toISOString() : null,
    });
  }, [user, planStr, period, finalPrice]);

  // ── Discount code validation ──────────────────────────────
  const handleDiscountValidate = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      // Check discount_coupons table
      const couponRes = await fetch(
        `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,partner_name,max_uses,current_uses,valid_from,valid_until,applicable_products`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError(pick(lang, 'Este código ainda não está ativo.', 'This code is not active yet.', 'Este código aún no está activo.')); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError(pick(lang, 'Este código já expirou.', 'This code has already expired.', 'Este código ya ha expirado.')); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError(pick(lang, 'Este código atingiu o limite de utilizações.', 'This code has reached its usage limit.', 'Este código ha alcanzado el límite de usos.')); return; }
        const products = (coupon.applicable_products || []).map((p: string) => String(p).toLowerCase());
        const allowedProducts = ['all', 'subscription', tier, planStr, `${tier}_subscription`, `${tier}_${period}`];
        if (products.length > 0 && !products.some((product: string) => allowedProducts.includes(product))) {
          setDiscountError(pick(lang, 'Este código não é aplicável a este plano.', 'This code does not apply to this plan.', 'Este código no es aplicable a este plan.'));
          return;
        }
        setDiscountPercent(coupon.discount_percent);
        setDiscountValid(true);
        setDiscountApplied(true);

        // If 100% discount, activate subscription immediately
        if (coupon.discount_percent === 100) {
          incrementCouponUsage(code);
          await createSubscription('coupon', `COUPON-${code}`, 'active');
          await refreshProfile();
          setStep('success');
        }
        return;
      }

      // Check vouchers table
      const vRes = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const rows = await vRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const v = rows[0];
        if (!v.is_active) { setDiscountError(pick(lang, 'Este código já foi utilizado', 'This code has already been used', 'Este código ya ha sido utilizado')); return; }
        if (v.used_analyses >= v.total_analyses) { setDiscountError(pick(lang, 'Este código já não tem utilizações disponíveis', 'This code no longer has available uses', 'Este código ya no tiene usos disponibles')); return; }
        if (v.voucher_type !== 'subscription' && !v.includes_subscription) {
          setDiscountError(pick(lang, 'Este código não é válido para subscrições', 'This code is not valid for subscriptions', 'Este código no es válido para suscripciones'));
          return;
        }
        // Mark voucher as used
        await fetch(
          `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${v.id}`,
          {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ used_analyses: v.used_analyses + 1, is_active: (v.used_analyses + 1) < v.total_analyses }),
          }
        );
        // Activate subscription
        await createSubscription('voucher', `VOUCHER-${v.code}`, 'active');
        await refreshProfile();
        setStep('success');
        return;
      }
      setDiscountError(pick(lang, 'Código inválido ou expirado', 'Invalid or expired code', 'Código inválido o caducado'));
    } catch {
      setDiscountError(pick(lang, 'Erro ao validar código', 'Error validating code', 'Error al validar el código'));
    } finally {
      setDiscountLoading(false);
    }
  };

  // ── Stripe Checkout ──────────────────────────────────────
  async function handleStripe() {
    if (!email) { setError(pick(lang, 'Introduz o teu email', 'Enter your email', 'Introduce tu email')); return; }
    setStep('processing');
    setError('');
    trackFbq('AddPaymentInfo');
    const oid = `S2I-STRIPE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          product_type: 'subscription',
          orderId: oid,
          language: 'pt',
          currency: 'eur',
          amount: finalPrice,
          plan: planStr,
          description: `Share2Inspire - Subscrição ${planLabels[period]}`,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.url) throw new Error(data.error || pick(lang, 'Erro ao criar sessão de pagamento', 'Error creating payment session', 'Error al crear la sesión de pago'));
      sessionStorage.setItem('s2iSubOrderId', oid);
      sessionStorage.setItem('s2iSubPlan', planStr);
      sessionStorage.setItem('s2iSubEmail', email);
      sessionStorage.setItem('stripeSessionId', data.sessionId || '');
      // In PWA standalone mode, open Stripe in the native browser to avoid
      // payment issues (MB WAY expiring, redirect failures in WebView)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      if (isStandalone) {
        window.open(data.url, '_blank');
        setStep('select');
      } else {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || t('pay.errorGeneric'));
      setStep('error');
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#F0F0EE] border border-[#e5e5e5] rounded-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] sticky top-0 bg-[#F0F0EE] z-10">
          <h2 className="text-sm font-medium text-[#1a1a1a]">{t('pay.title')}</h2>
          <button onClick={onClose} className="text-[#999] hover:text-[#1a1a1a]/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Summary */}
        <div className="px-6 py-4 bg-white/[0.02] border-b border-[#e5e5e5]">
          <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{t('pay.summary')}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-[#1a1a1a] font-medium">{planLabels[period]}</span>
            <div className="text-right">
              {discountPercent > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#bbb] line-through font-light">{formatPrice(basePrice)}</span>
                  <span className="text-lg font-semibold text-[#C9A961]">{formatPrice(finalPrice)}</span>
                  <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded">-{discountPercent}%</span>
                </div>
              ) : (
                <span className="text-lg font-semibold text-[#C9A961]">{formatPrice(basePrice)}</span>
              )}
              <span className="text-xs text-[#999] font-light ml-1 block text-right">{periodLabels[period]}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">

          {/* ── Step: Main (email + discount + pay button) ── */}
          {step === 'select' && (
            <div className="space-y-4">
              <p className="text-xs text-[#888] font-light mb-2">{t('pay.method')}</p>

              {/* Email */}
              <div>
                <label className="block text-[10px] text-[#999] uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={pick(lang, 'email@exemplo.com', 'email@example.com', 'email@ejemplo.com')}
                  className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] rounded bg-white text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#C9A961]/40"
                />
              </div>

              {/* Discount code section */}
              <div className="pt-3 border-t border-[#e5e5e5]">
                {discountApplied && discountPercent > 0 ? (
                  <div className="flex items-center gap-2 text-green-600 text-xs bg-green-50 border border-green-200 rounded px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{pick(lang, 'Cupão', 'Coupon', 'Cupón')} <strong>{discountCode.toUpperCase()}</strong> {pick(lang, 'aplicado', 'applied', 'aplicado')} — {discountPercent}% {pick(lang, 'desconto', 'discount', 'descuento')}</span>
                    <button
                      onClick={() => { setDiscountApplied(false); setDiscountValid(false); setDiscountPercent(0); setDiscountCode(''); }}
                      className="ml-auto text-[#aaa] hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-[#aaa] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {pick(lang, 'Código de cupão', 'Coupon code', 'Código de cupón')}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(null); }}
                        onKeyDown={e => e.key === 'Enter' && handleDiscountValidate()}
                        placeholder={pick(lang, 'S2I-FREE-XXXX', 'S2I-FREE-XXXX', 'S2I-FREE-XXXX')}
                        className="flex-1 px-3 py-2 text-xs border border-[#e5e5e5] rounded bg-white text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#C9A961]/40 uppercase"
                      />
                      <button
                        onClick={handleDiscountValidate}
                        disabled={discountLoading || !discountCode.trim() || discountValid}
                        className="px-4 py-2 text-xs font-medium bg-[#1a1a1a] text-white rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                      >
                        {discountLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : discountValid ? <Check className="w-3 h-3 text-green-400" /> : pick(lang, 'Aplicar', 'Apply', 'Aplicar')}
                      </button>
                    </div>
                    {discountError && (
                      <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {discountError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Stripe Checkout button */}
              <button
                onClick={handleStripe}
                className="w-full py-3 bg-[#C9A961] text-[#1a1a1a] text-sm font-semibold rounded hover:bg-[#d4b574] transition-all duration-300 flex items-center justify-center gap-2 mt-2"
              >
                <CreditCard className="w-4 h-4" />
                {t('pay.confirm')} — {formatPrice(finalPrice)}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust signals */}
              <div className="text-center space-y-1 pt-1">
                <p className="text-[10px] text-[#aaa] font-light flex items-center justify-center gap-1">
                  <span>✓</span> {pick(lang, 'Pagamento seguro via Stripe', 'Secure payment via Stripe', 'Pago seguro vía Stripe')}
                </p>
                <p className="text-[10px] text-[#aaa] font-light flex items-center justify-center gap-1">
                  <span>✓</span> {pick(lang, 'Renovação automática · Cancela quando quiseres', 'Automatic renewal · Cancel whenever you want', 'Renovación automática · Cancela cuando quieras')}
                </p>
              </div>
            </div>
          )}

          {/* ── Step: Processing ── */}
          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#C9A961] animate-spin mx-auto" />
              <p className="text-sm text-[#555] font-light">{t('pay.processing')}</p>
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[#1a1a1a] mb-2">{t('pay.success')}</p>
                <p className="text-xs text-[#888] font-light leading-relaxed max-w-xs mx-auto">
                  {t('pay.successDesc')}
                </p>
              </div>
              <button
                onClick={() => { onClose(); navigate('/membros'); }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C9A961] text-[#1a1a1a] text-sm font-semibold rounded hover:bg-[#d4b574] transition-all duration-300"
              >
                {t('pay.goToMember')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step: Error ── */}
          {step === 'error' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[#1a1a1a] mb-2">{pick(lang, 'Erro no pagamento', 'Payment error', 'Error en el pago')}</p>
                <p className="text-xs text-red-400/80 font-light leading-relaxed max-w-xs mx-auto">
                  {error || t('pay.errorGeneric')}
                </p>
              </div>
              <button
                onClick={() => { setStep('select'); setError(''); }}
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#ddd] text-[#555] text-sm font-light rounded hover:border-[#C9A961]/30 hover:text-[#1a1a1a] transition-all duration-300"
              >
                {pick(lang, 'Tentar novamente', 'Try again', 'Intentar de nuevo')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
