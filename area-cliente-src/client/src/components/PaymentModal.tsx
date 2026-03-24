/*
 * Design: Consultoria de Luxo Silenciosa
 * Modal de pagamento unificado — idêntico ao Career Path / Career Intelligence
 * Funcionalidades: MB WAY (polling robusto) + Stripe + PayPal
 *                  Cupões de desconto parcial e 100% (vouchers)
 *                  Google Ads (AW-17015553005 + G-8GQ1KM9FQS) + Meta Pixel tracking
 *                  Suporte PT e EN via i18n
 * Backend: share2inspire-beckend.lm.r.appspot.com
 */
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  X, Smartphone, ArrowRight, ArrowLeft, Check,
  Loader2, AlertCircle, CreditCard, CheckCircle2,
  Tag, Gift,
} from 'lucide-react';

type PlanKey = 'monthly' | 'semiannual' | 'annual';
type PayMethod = 'mbway' | 'stripe' | 'paypal';
type Step = 'form' | 'processing' | 'polling' | 'success' | 'error';

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

const planPrices: Record<PlanKey, number> = {
  monthly: 9.90,
  semiannual: 49,
  annual: 89,
};

const planDurations: Record<PlanKey, number> = {
  monthly: 30,
  semiannual: 180,
  annual: 365,
};

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €';
}

// ── Google Ads + Meta Pixel tracking ──
function trackPurchase(orderId: string, amount: number, planLabel: string) {
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        send_to: 'AW-17015553005',
        transaction_id: orderId,
        value: amount,
        currency: 'EUR',
        items: [{ item_name: `Share2Inspire - ${planLabel}`, price: amount }],
      });
      (window as any).gtag('event', 'purchase', {
        send_to: 'G-8GQ1KM9FQS',
        transaction_id: orderId,
        value: amount,
        currency: 'EUR',
      });
    }
  } catch {}
  try {
    if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', 'Purchase', {
        value: amount,
        currency: 'EUR',
        content_name: `Share2Inspire - ${planLabel}`,
        content_ids: [orderId],
      });
    }
  } catch {}
}

// ── Affiliate tracking ──
function trackAffiliate(orderId: string, amount: number) {
  try {
    const ref = sessionStorage.getItem('affiliate_ref') || localStorage.getItem('affiliate_ref');
    if (ref && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'affiliate_conversion', {
        affiliate_ref: ref,
        transaction_id: orderId,
        value: amount,
        currency: 'EUR',
      });
    }
  } catch {}
}

type Props = {
  plan: PlanKey;
  onClose: () => void;
};

export default function PaymentModal({ plan, onClose }: Props) {
  const { t, lang } = useI18n();
  const { user, profile, refreshProfile } = useAuth();

  const [method, setMethod] = useState<PayMethod>('mbway');
  const [step, setStep] = useState<Step>('form');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');

  // Discount / coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const basePrice = planPrices[plan];
  const finalPrice = discountPercent > 0
    ? Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100
    : basePrice;

  const planLabels: Record<PlanKey, string> = {
    monthly: t('sub.monthly'),
    semiannual: t('sub.semiannual'),
    annual: t('sub.annual'),
  };

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      setEmail(profile.email || user?.email || '');
      if (profile.phone) setPhone(profile.phone);
    } else if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ── Coupon validation ──
  const handleValidateCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      // Check discount_coupons table
      const { data: coupon } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .maybeSingle();

      if (coupon) {
        const now = new Date();
        if (coupon.expires_at && new Date(coupon.expires_at) < now) {
          setCouponError(lang === 'en' ? 'This coupon has expired.' : 'Este cupão expirou.');
          return;
        }
        if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
          setCouponError(lang === 'en' ? 'This coupon has reached its usage limit.' : 'Este cupão atingiu o limite de utilizações.');
          return;
        }

        const pct = coupon.discount_percent ?? 0;

        if (pct >= 100) {
          // Free access — activate subscription immediately
          setCouponCode(code);
          setDiscountPercent(100);
          setCouponSuccess(lang === 'en'
            ? `✓ Coupon ${code} — 100% discount. Activating...`
            : `✓ Cupão ${code} — 100% desconto. A ativar...`);
          setShowCouponInput(false);
          await activateFreeSubscription(code);
          return;
        }

        setCouponCode(code);
        setDiscountPercent(pct);
        const discountedPrice = Math.round(basePrice * (1 - pct / 100) * 100) / 100;
        setCouponSuccess(lang === 'en'
          ? `✓ Coupon ${code} applied — ${pct}% discount (${formatPrice(discountedPrice)})`
          : `✓ Cupão ${code} aplicado — ${pct}% desconto (${formatPrice(discountedPrice)})`);
        setShowCouponInput(false);
        return;
      }

      // Check vouchers table
      const { data: voucher } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', code)
        .eq('used', false)
        .maybeSingle();

      if (voucher) {
        const pct = voucher.discount_percent ?? 100;

        if (pct >= 100) {
          setCouponCode(code);
          setDiscountPercent(100);
          setCouponSuccess(lang === 'en'
            ? `✓ Voucher ${code} — full access activated.`
            : `✓ Voucher ${code} — acesso completo ativado.`);
          setShowCouponInput(false);
          await activateFreeSubscription(code);
          return;
        }

        setCouponCode(code);
        setDiscountPercent(pct);
        const discountedPrice = Math.round(basePrice * (1 - pct / 100) * 100) / 100;
        setCouponSuccess(lang === 'en'
          ? `✓ Voucher ${code} applied — ${pct}% discount (${formatPrice(discountedPrice)})`
          : `✓ Voucher ${code} aplicado — ${pct}% desconto (${formatPrice(discountedPrice)})`);
        setShowCouponInput(false);
        return;
      }

      setCouponError(lang === 'en' ? 'Invalid or expired coupon.' : 'Cupão inválido ou expirado.');
    } catch {
      setCouponError(lang === 'en' ? 'Error validating coupon.' : 'Erro ao validar cupão.');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setDiscountPercent(0);
    setCouponSuccess('');
    setCouponError('');
    setShowCouponInput(false);
  };

  // ── Activate free subscription (100% coupon/voucher) ──
  const activateFreeSubscription = async (code: string) => {
    if (!user) return;
    const now = new Date();
    const endDate = new Date(now.getTime() + planDurations[plan] * 24 * 60 * 60 * 1000);

    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan,
      status: 'active',
      amount_paid: 0,
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      payment_method: 'coupon',
      payment_reference: code,
    });

    // Mark voucher as used if applicable
    await supabase.from('vouchers').update({ used: true, used_at: now.toISOString() }).eq('code', code);
    // Increment coupon usage
    await supabase.rpc('increment_coupon_usage', { coupon_code: code }).catch(() => {});

    await refreshProfile();
    setStep('success');
  };

  // ── Create subscription record in Supabase ──
  const createSubscription = async (payMethod: string, payRef: string, status: string) => {
    if (!user) return;
    const now = new Date();
    const endDate = new Date(now.getTime() + planDurations[plan] * 24 * 60 * 60 * 1000);

    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan,
      status,
      amount_paid: finalPrice,
      start_date: status === 'active' ? now.toISOString() : null,
      end_date: status === 'active' ? endDate.toISOString() : null,
      payment_method: payMethod,
      payment_reference: payRef,
    });
  };

  // ── MB WAY Payment ──
  const handleMBWayPayment = async () => {
    if (!email) { setError(t('pay.errorEmail')); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError(t('pay.errorEmail')); return; }
    const cleanPhone = phone.replace(/\D/g, '').replace(/^(\+?351)/, '');
    if (cleanPhone.length < 9) { setError(t('pay.errorPhone')); return; }

    setLoading(true);
    setError('');

    try {
      const orderId = `S2I-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setCurrentOrderId(orderId);

      const res = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: `351${cleanPhone}`,
          orderId,
          amount: finalPrice.toFixed(2),
          paymentMethod: 'mbway',
          description: `Share2Inspire - ${planLabels[plan]}`,
          name: profile?.first_name || email.split('@')[0],
          coupon_code: couponCode || undefined,
          discount_percent: discountPercent || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || t('pay.errorGeneric'));

      setStep('polling');
      setPollingMsg(t('pay.mbwaySentDesc'));
      startPolling(orderId);

      await createSubscription('mbway', orderId, 'pending');

      // Tracking
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'AddPaymentInfo', { value: finalPrice, currency: 'EUR' });
      }
    } catch (err: any) {
      setError(err.message || t('pay.errorGeneric'));
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // ── Stripe Payment ──
  const handleStripePayment = async () => {
    if (!email) { setError(t('pay.errorEmail')); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError(t('pay.errorEmail')); return; }

    setLoading(true);
    setError('');

    try {
      const orderId = `S2I-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const res = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: profile?.first_name || email.split('@')[0],
          product_type: 'subscription',
          orderId,
          language: lang,
          currency: 'eur',
          amount: finalPrice,
          coupon_code: couponCode || undefined,
          discount_percent: discountPercent || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.url) {
        throw new Error(data.error || t('pay.errorGeneric'));
      }

      await createSubscription('stripe', orderId, 'pending');

      // Store orderId for Stripe return
      sessionStorage.setItem('stripe_order_id', orderId);
      sessionStorage.setItem('stripe_plan', plan);

      // Tracking
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'InitiateCheckout', { value: finalPrice, currency: 'EUR' });
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || t('pay.errorGeneric'));
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // ── PayPal Payment ──
  const handlePayPalPayment = async () => {
    if (!email) { setError(t('pay.errorEmail')); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError(t('pay.errorEmail')); return; }

    const orderId = `S2I-SUB-PAYPAL-${Date.now()}`;

    await createSubscription('paypal', orderId, 'pending');

    trackPurchase(orderId, finalPrice, planLabels[plan]);
    trackAffiliate(orderId, finalPrice);

    window.open(`https://paypal.me/SamuelRolo/${finalPrice.toFixed(2)}EUR`, '_blank');
    setStep('success');
  };

  // ── Handle confirm button ──
  function handleConfirm() {
    if (method === 'mbway') handleMBWayPayment();
    else if (method === 'stripe') handleStripePayment();
    else if (method === 'paypal') handlePayPalPayment();
  }

  // ── Polling for MB WAY status ──
  const startPolling = (orderId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    let attempts = 0;
    const maxAttempts = 60;
    let consecutiveErrors = 0;
    const startTime = Date.now();
    const MIN_BEFORE_EXPIRED = 90000;
    setPollingExpired(false);

    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        if (!res.ok) {
          consecutiveErrors++;
          if (consecutiveErrors >= 8) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setPollingExpired(true);
            setPollingMsg(lang === 'en'
              ? 'Could not verify. Use the "I already paid" button.'
              : 'Não foi possível verificar. Usa o botão "Já paguei".');
          }
          return;
        }

        consecutiveErrors = 0;
        const data = await res.json();

        if (data.paid) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          await handlePaymentConfirmed(orderId);
          return;
        }

        const elapsed = Date.now() - startTime;
        if (data.expired) {
          if (elapsed < MIN_BEFORE_EXPIRED) {
            setPollingMsg(lang === 'en'
              ? 'Verifying payment... Confirm in the MB WAY app.'
              : 'A verificar pagamento... Confirma na app MB WAY.');
          } else {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setPollingExpired(true);
            setPollingMsg(lang === 'en'
              ? 'Payment expired. Use the button below if you already paid.'
              : 'O pagamento expirou. Usa o botão abaixo se já pagaste.');
          }
          return;
        }

        if (elapsed < 30000) {
          setPollingMsg(lang === 'en'
            ? 'Confirm the payment in your MB WAY app...'
            : 'Confirma o pagamento na app MB WAY do teu telemóvel...');
        } else if (elapsed < 60000) {
          setPollingMsg(lang === 'en'
            ? 'Still waiting... Check the MB WAY app.'
            : 'Ainda a aguardar... Verifica a app MB WAY.');
        } else {
          setPollingMsg(lang === 'en'
            ? 'Waiting for confirmation... If you already approved, wait a few more seconds.'
            : 'A aguardar confirmação... Se já aprovaste, aguarda mais uns segundos.');
        }

        if (attempts >= maxAttempts) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPollingExpired(true);
          setPollingMsg(lang === 'en'
            ? 'Timeout. If you already paid, use the button below.'
            : 'Tempo esgotado. Se já pagaste, usa o botão abaixo.');
        }
      } catch {
        consecutiveErrors++;
      }
    }, 5000);
  };

  // ── Manual check ──
  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMsg(lang === 'en' ? 'Checking payment...' : 'A verificar pagamento...');
    setPollingExpired(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentOrderId }),
      });
      const data = await res.json();
      if (data.paid) {
        await handlePaymentConfirmed(currentOrderId);
      } else {
        setPollingExpired(true);
        setPollingMsg(lang === 'en'
          ? 'Payment not yet confirmed. Wait a few seconds and try again.'
          : 'Pagamento ainda não confirmado. Aguarda uns segundos e tenta novamente.');
        startPolling(currentOrderId);
      }
    } catch {
      setPollingExpired(true);
      setPollingMsg(lang === 'en'
        ? 'Error checking. Try again in a few seconds.'
        : 'Erro ao verificar. Tenta novamente em alguns segundos.');
    }
  };

  // ── Payment confirmed ──
  const handlePaymentConfirmed = async (orderId: string) => {
    if (user) {
      const now = new Date();
      const endDate = new Date(now.getTime() + planDurations[plan] * 24 * 60 * 60 * 1000);
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('payment_reference', orderId)
        .eq('user_id', user.id);
    }

    // Fire purchase tracking
    trackPurchase(orderId, finalPrice, planLabels[plan]);
    trackAffiliate(orderId, finalPrice);

    // Increment coupon usage
    if (couponCode) {
      await supabase.rpc('increment_coupon_usage', { coupon_code: couponCode }).catch(() => {});
    }

    await refreshProfile();
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#F0F0EE] border border-[#e5e5e5] rounded-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-3">
            {step === 'error' && (
              <button onClick={() => { setStep('form'); setError(''); }} className="text-[#999] hover:text-[#1a1a1a]/60 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-sm font-medium text-[#1a1a1a]">{t('pay.title')}</h2>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-[#1a1a1a]/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Summary */}
        <div className="px-6 py-4 bg-white/[0.02] border-b border-[#e5e5e5]">
          <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{t('pay.summary')}</p>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-[#1a1a1a] font-medium">{planLabels[plan]}</span>
            <div className="text-right">
              {discountPercent > 0 && discountPercent < 100 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#bbb] line-through">{formatPrice(basePrice)}</span>
                  <span className="text-lg font-semibold text-emerald-600">{formatPrice(finalPrice)}</span>
                </div>
              ) : (
                <span className="text-lg font-semibold text-gold">{formatPrice(finalPrice)}</span>
              )}
            </div>
          </div>
          {/* Applied coupon badge */}
          {couponCode && discountPercent > 0 && discountPercent < 100 && (
            <div className="flex items-center justify-between mt-2 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-xs">
              <span className="text-emerald-700 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {lang === 'en' ? `Coupon ${couponCode} — ${discountPercent}% off` : `Cupão ${couponCode} — ${discountPercent}% desconto`}
              </span>
              <button onClick={handleRemoveCoupon} className="text-emerald-500 hover:text-red-500 transition-colors text-[10px]">
                {lang === 'en' ? 'remove' : 'remover'}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-6">

          {/* ── Step: Payment Form ── */}
          {step === 'form' && (
            <div className="space-y-4">

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <p className="text-xs text-[#888] font-light">{t('pay.method')}</p>
                <div className="flex gap-2">
                  {(['mbway', 'stripe', 'paypal'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`flex-1 p-3 rounded border-2 text-xs font-medium transition-all duration-300 ${
                        method === m
                          ? 'border-gold bg-gold/5 text-[#1a1a1a]'
                          : 'border-[#e5e5e5] text-[#999] hover:border-gold/30'
                      }`}
                    >
                      {m === 'mbway' ? 'MB WAY' : m === 'stripe' ? (lang === 'en' ? 'Card' : 'Cartão') : 'PayPal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs text-[#888] font-light">{t('pay.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded bg-white text-sm text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-gold/40 transition-colors"
                />
              </div>

              {/* Phone (MB WAY only) */}
              {method === 'mbway' && (
                <div className="space-y-1">
                  <label className="text-xs text-[#888] font-light">{t('pay.mbwayPhone')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('pay.mbwayPhonePlaceholder')}
                    className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded bg-white text-sm text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-gold/40 transition-colors"
                  />
                </div>
              )}

              {/* Coupon / Voucher Section */}
              {!couponCode && (
                <div>
                  {!showCouponInput ? (
                    <button
                      onClick={() => setShowCouponInput(true)}
                      className="flex items-center gap-1.5 text-xs text-[#888] hover:text-gold transition-colors"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      {lang === 'en' ? 'Have a coupon or voucher?' : 'Tens um cupão ou voucher?'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs text-[#888] font-light flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {lang === 'en' ? 'Coupon / Voucher code' : 'Código de cupão / voucher'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                          placeholder={lang === 'en' ? 'Enter code' : 'Introduz o código'}
                          className="flex-1 px-3 py-2 border border-[#e5e5e5] rounded bg-white text-sm text-[#1a1a1a] uppercase placeholder:text-[#ccc] placeholder:normal-case focus:outline-none focus:border-gold/40 transition-colors"
                        />
                        <button
                          onClick={handleValidateCoupon}
                          disabled={couponLoading || !couponInput.trim()}
                          className="px-3 py-2 bg-gold text-[#1a1a1a] text-xs font-semibold rounded hover:bg-gold-light transition-all disabled:opacity-50"
                        >
                          {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (lang === 'en' ? 'Apply' : 'Aplicar')}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Coupon success message */}
              {couponSuccess && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />{couponSuccess}
                </p>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
                </p>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-[#e5e5e5] text-[#999] text-sm font-light rounded hover:border-[#ddd] hover:text-[#666] transition-all duration-300"
                >
                  {t('pay.cancel')}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded transition-all duration-300 ${
                    method === 'stripe'
                      ? 'bg-[#635BFF] hover:bg-[#5046E5] text-white'
                      : 'bg-gold hover:bg-gold-light text-[#1a1a1a]'
                  } disabled:opacity-60`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `${lang === 'en' ? 'Pay' : 'Pagar'} ${formatPrice(finalPrice)}`
                  )}
                </button>
              </div>

              {/* Security note */}
              <p className="text-center text-[10px] text-[#bbb] font-light">
                {lang === 'en' ? '🔒 Secure payment' : '🔒 Pagamento seguro'}
              </p>
            </div>
          )}

          {/* ── Step: Processing ── */}
          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-gold/60 animate-spin mx-auto" />
              <p className="text-sm text-[#555] font-light">{t('pay.processing')}</p>
            </div>
          )}

          {/* ── Step: Polling (MB WAY) ── */}
          {step === 'polling' && (
            <div className="py-8 text-center space-y-4">
              {!pollingExpired ? (
                <>
                  <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto">
                    <Smartphone className="w-8 h-8 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a]">{t('pay.mbwaySent')}</p>
                    <p className="text-xs text-[#888] font-light mt-1">{t('pay.mbwaySentDesc')}</p>
                    {phone && (
                      <p className="text-sm text-gold font-medium mt-2">+351 {phone.replace(/\D/g, '').replace(/^351/, '')}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-[#999]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {pollingMsg || t('pay.waiting')}
                  </div>
                  <p className="text-[10px] text-[#bbb]">
                    {lang === 'en'
                      ? 'Subscription will be activated automatically after payment confirmation.'
                      : 'A subscrição será ativada automaticamente após confirmação do pagamento.'}
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-sm font-medium text-[#1a1a1a]">{pollingMsg}</p>
                  <button
                    onClick={handleManualCheck}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold text-[#1a1a1a] text-sm font-semibold rounded hover:bg-gold-light transition-all duration-300"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {lang === 'en' ? 'I already paid — verify' : 'Já paguei — verificar novamente'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[#1a1a1a] mb-1">
                  {t('pay.success')}
                </p>
                <p className="text-xs text-[#888] font-light">{t('pay.successDesc')}</p>
              </div>
              <button
                onClick={() => { onClose(); window.location.href = '/area-cliente/membro'; }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold text-[#1a1a1a] text-sm font-semibold rounded hover:bg-gold-light transition-all duration-300"
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
                <p className="text-lg font-semibold text-[#1a1a1a] mb-2">
                  {lang === 'en' ? 'Payment error' : 'Erro no pagamento'}
                </p>
                <p className="text-xs text-red-400/80 font-light leading-relaxed max-w-xs mx-auto">
                  {error || t('pay.errorGeneric')}
                </p>
              </div>
              <button
                onClick={() => { setStep('form'); setError(''); }}
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#ddd] text-[#555] text-sm font-light rounded hover:border-gold/30 hover:text-[#1a1a1a] transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                {lang === 'en' ? 'Try again' : 'Tentar novamente'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
