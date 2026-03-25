/*
 * Design: Consultoria de Luxo Silenciosa
 * Modal de pagamento unificado com:
 * - MB WAY + polling de confirmação (igual ao Career Path / Career Intelligence)
 * - Multibanco
 * - Stripe (cartão)
 * - PayPal
 * - Cupões de desconto parcial e 100%
 * - Vouchers
 * - Google Ads + Meta Pixel tracking
 * - Affiliate tracking
 * Backend: share2inspire-beckend.lm.r.appspot.com
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  X, Smartphone, ArrowRight, ArrowLeft, Check,
  Copy, Loader2, AlertCircle, CreditCard, Building2,
  Tag, CheckCircle2,
} from 'lucide-react';

type PlanKey = 'monthly' | 'semiannual' | 'annual';
type PayMethod = 'mbway' | 'multibanco' | 'stripe' | 'paypal';
type Step = 'select' | 'form' | 'processing' | 'polling' | 'mbref' | 'success' | 'error';

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

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

function formatPhone(phone: string) {
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 9) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
  }
  return phone;
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
  // Google Ads conversion
  if ((window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'conversion',
      send_to: 'AW-17015553005/9nRUCPa9l_AbEO330rE_',
      value,
      currency: 'EUR',
      transaction_id: transactionId,
    });
  }
  // GA4 purchase event
  trackGtag('purchase', {
    event_category: 'ecommerce',
    items: [{ item_name: `Subscrição ${planLabel}` }],
    value,
    currency: 'EUR',
    transaction_id: transactionId,
  });
  // Meta Pixel
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

type Props = {
  plan: PlanKey;
  onClose: () => void;
};

export default function PaymentModal({ plan, onClose }: Props) {
  const { t } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [step, setStep] = useState<Step>('select');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Multibanco reference data
  const [mbEntity, setMbEntity] = useState('');
  const [mbReference, setMbReference] = useState('');
  const [orderId, setOrderId] = useState('');

  // MB WAY polling state
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Discount / coupon state
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountValid, setDiscountValid] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);

  const basePrice = planPrices[plan];
  const finalPrice = discountPercent > 0 ? basePrice * (1 - discountPercent / 100) : basePrice;

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      setName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
      setEmail(profile.email || user?.email || '');
      if (profile.phone) setPhone(profile.phone);
    } else if (user) {
      setEmail(user.email || '');
      const meta = user.user_metadata;
      if (meta?.first_name) setName(`${meta.first_name} ${meta.last_name || ''}`.trim());
    }
  }, [profile, user]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const planLabels: Record<PlanKey, string> = {
    monthly: t('sub.monthly'),
    semiannual: t('sub.semiannual'),
    annual: t('sub.annual'),
  };

  const periodLabels: Record<PlanKey, string> = {
    monthly: t('sub.month'),
    semiannual: t('sub.semester'),
    annual: t('sub.year'),
  };

  function selectMethod(m: PayMethod) {
    setMethod(m);
    setStep('form');
    setError('');
  }

  function goBack() {
    if (step === 'form') {
      setMethod(null);
      setStep('select');
      setError('');
    } else if (step === 'error') {
      setStep('form');
      setError('');
    }
  }

  // Create subscription record in Supabase
  const createSubscription = useCallback(async (_payMethod: string, _payRef: string, status: string) => {
    if (!user) return;
    const now = new Date();
    const endDate = new Date(now.getTime() + planDurations[plan] * 24 * 60 * 60 * 1000);
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: plan,
      status: status,
      price_eur: finalPrice,
      started_at: status === 'active' ? now.toISOString() : null,
      expires_at: status === 'active' ? endDate.toISOString() : null,
    });
  }, [user, plan, finalPrice, discountPercent, discountApplied, discountCode]);

  // ── Discount code validation ──────────────────────────────
  const handleDiscountValidate = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      // Step 1: Check discount_coupons table
      const couponRes = await fetch(
        `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,partner_name,max_uses,current_uses,valid_from,valid_until,applicable_products`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError('Este código ainda não está ativo.'); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError('Este código já expirou.'); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError('Este código atingiu o limite de utilizações.'); return; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('subscription')) {
          setDiscountError('Este código não é aplicável a subscrições.');
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

      // Step 2: Check vouchers table
      const vRes = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const rows = await vRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const v = rows[0];
        if (!v.is_active) { setDiscountError('Este código já foi utilizado'); return; }
        if (v.used_analyses >= v.total_analyses) { setDiscountError('Este código já não tem utilizações disponíveis'); return; }
        if (v.voucher_type !== 'subscription' && !v.includes_subscription) {
          setDiscountError('Este código não é válido para subscrições');
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
      setDiscountError('Código inválido ou expirado');
    } catch {
      setDiscountError('Erro ao validar código');
    } finally {
      setDiscountLoading(false);
    }
  };

  // ── MB WAY polling ────────────────────────────────────────
  const startPolling = (oid: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    let attempts = 0;
    const maxAttempts = 60;
    let consecutiveErrors = 0;
    const startTime = Date.now();
    const MIN_BEFORE_EXPIRED = 90000;
    setPollingExpired(false);
    setPollingMsg('Confirma o pagamento na app MB WAY do teu telemóvel...');

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: oid }),
        });
        if (!res.ok) {
          consecutiveErrors++;
          if (consecutiveErrors >= 8) {
            clearInterval(pollingIntervalRef.current!);
            setPollingExpired(true);
            setPollingMsg('Não foi possível verificar. Usa o botão "Já paguei" abaixo.');
          }
          return;
        }
        consecutiveErrors = 0;
        const data = await res.json();
        if (data.paid) {
          clearInterval(pollingIntervalRef.current!);
          // Activate subscription
          await createSubscription('mbway', oid, 'active');
          await refreshProfile();
          trackPurchase(finalPrice, oid, planLabels[plan]);
          setStep('success');
          return;
        }
        const elapsed = Date.now() - startTime;
        if (data.expired) {
          if (elapsed < MIN_BEFORE_EXPIRED) {
            setPollingMsg('A verificar pagamento... Confirma na app MB WAY.');
          } else {
            clearInterval(pollingIntervalRef.current!);
            setPollingExpired(true);
            setPollingMsg('O pagamento expirou. Usa o botão abaixo se já pagaste.');
          }
          return;
        }
        if (elapsed < 30000) {
          setPollingMsg('Confirma o pagamento na app MB WAY do teu telemóvel...');
        } else if (elapsed < 60000) {
          setPollingMsg('Ainda a aguardar... Verifica a app MB WAY.');
        } else {
          setPollingMsg('A aguardar confirmação... Se já aprovaste, aguarda mais uns segundos.');
        }
        if (attempts >= maxAttempts) {
          clearInterval(pollingIntervalRef.current!);
          setPollingExpired(true);
          setPollingMsg('Tempo esgotado. Se já pagaste, usa o botão abaixo.');
        }
      } catch { consecutiveErrors++; }
    }, 5000);
  };

  const handleManualCheck = async () => {
    if (!orderId) return;
    setPollingMsg('A verificar pagamento...');
    setPollingExpired(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.paid) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        await createSubscription('mbway', orderId, 'active');
        await refreshProfile();
        trackPurchase(finalPrice, orderId, planLabels[plan]);
        setStep('success');
      } else {
        setPollingMsg('Pagamento ainda não confirmado. Verifica a app MB WAY.');
        setPollingExpired(true);
      }
    } catch {
      setPollingMsg('Erro ao verificar. Tenta novamente.');
      setPollingExpired(true);
    }
  };

  // ── MB WAY payment ────────────────────────────────────────
  async function handleMbWay() {
    const cleanPhone = phone.replace(/\D/g, '').replace(/^(\+?351)/, '');
    if (cleanPhone.length < 9) { setError(t('pay.errorPhone')); return; }
    if (!name.trim()) { setError(t('pay.errorName')); return; }
    setStep('processing');
    setError('');
    const oid = `S2I-MBWAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    setOrderId(oid);
    trackFbq('AddPaymentInfo');
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: oid,
          amount: finalPrice.toFixed(2),
          mobileNumber: `351${cleanPhone}`,
          phone: `351${cleanPhone}`,
          email,
          customerName: name,
          customerEmail: email,
          name,
          description: `Share2Inspire - Subscrição ${planLabels[plan]}`,
          paymentMethod: 'mbway',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await createSubscription('mbway', oid, 'pending');
        setStep('polling');
        startPolling(oid);
      } else {
        setError(data.error || data.message || t('pay.errorGeneric'));
        setStep('error');
      }
    } catch {
      setError(t('pay.errorGeneric'));
      setStep('error');
    }
  }

  // ── Multibanco payment ────────────────────────────────────
  async function handleMultibanco() {
    if (!name.trim()) { setError(t('pay.errorName')); return; }
    setStep('processing');
    setError('');
    const oid = `S2I-MB-${Date.now()}`;
    setOrderId(oid);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/multibanco`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: oid,
          amount: finalPrice.toFixed(2),
          customerName: name,
          customerEmail: email,
          description: `Share2Inspire - Subscrição ${planLabels[plan]}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.entity && data.reference) {
        setMbEntity(data.entity);
        setMbReference(data.reference);
        setStep('mbref');
        await createSubscription('multibanco', `${data.entity}/${data.reference}`, 'pending');
        trackPurchase(finalPrice, oid, planLabels[plan]);
      } else {
        setError(data.error || data.message || t('pay.errorGeneric'));
        setStep('error');
      }
    } catch {
      setError(t('pay.errorGeneric'));
      setStep('error');
    }
  }

  // ── Stripe payment ────────────────────────────────────────
  async function handleStripe() {
    if (!email) { setError('Introduz o teu email'); return; }
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
          plan: plan,
          description: `Share2Inspire - Subscrição ${planLabels[plan]}`,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.url) throw new Error(data.error || 'Erro ao criar sessão de pagamento');
      sessionStorage.setItem('s2iSubOrderId', oid);
      sessionStorage.setItem('s2iSubPlan', plan);
      sessionStorage.setItem('s2iSubEmail', email);
      sessionStorage.setItem('stripeSessionId', data.sessionId || '');
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || t('pay.errorGeneric'));
      setStep('error');
    }
  }

  // ── PayPal payment ────────────────────────────────────────
  async function handlePayPal() {
    if (!email) { setError('Introduz o teu email'); return; }
    const oid = `S2I-PAYPAL-${Date.now()}`;
    window.open(`https://paypal.me/SamuelRolo/${finalPrice.toFixed(2)}EUR`, '_blank');
    await createSubscription('paypal', oid, 'pending');
    trackPurchase(finalPrice, oid, planLabels[plan]);
    setStep('success');
  }

  function handleConfirm() {
    if (method === 'mbway') handleMbWay();
    else if (method === 'multibanco') handleMultibanco();
    else if (method === 'stripe') handleStripe();
    else if (method === 'paypal') handlePayPal();
  }

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(mbReference);
    } catch {
      const input = document.createElement('input');
      input.value = mbReference;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#F0F0EE] border border-[#e5e5e5] rounded-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] sticky top-0 bg-[#F0F0EE] z-10">
          <div className="flex items-center gap-3">
            {(step === 'form' || step === 'error') && (
              <button onClick={goBack} className="text-[#999] hover:text-[#1a1a1a]/60 transition-colors">
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
              {discountPercent > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#bbb] line-through font-light">{formatPrice(basePrice)}</span>
                  <span className="text-lg font-semibold text-[#C9A961]">{formatPrice(finalPrice)}</span>
                  <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded">-{discountPercent}%</span>
                </div>
              ) : (
                <span className="text-lg font-semibold text-[#C9A961]">{formatPrice(basePrice)}</span>
              )}
              <span className="text-xs text-[#999] font-light ml-1 block text-right">{periodLabels[plan]}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">

          {/* ── Step: Method Selection ── */}
          {step === 'select' && (
            <div className="space-y-3">
              <p className="text-xs text-[#888] font-light mb-4">{t('pay.method')}</p>

              {/* MB WAY */}
              <button
                onClick={() => selectMethod('mbway')}
                className="w-full flex items-center gap-4 p-4 border border-[#e5e5e5] rounded hover:border-[#C9A961]/40 transition-all duration-300 group bg-white"
              >
                <div className="w-10 h-10 bg-[#E4002B]/10 rounded flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-[#E4002B]" />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-sm font-medium text-[#1a1a1a]">MB WAY</span>
                  <span className="block text-xs text-[#aaa] font-light">Pagamento instantâneo</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-[#C9A961] transition-colors" />
              </button>

              {/* Multibanco */}
              <button
                onClick={() => selectMethod('multibanco')}
                className="w-full flex items-center gap-4 p-4 border border-[#e5e5e5] rounded hover:border-[#C9A961]/40 transition-all duration-300 group bg-white"
              >
                <div className="w-10 h-10 bg-[#003087]/10 rounded flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#003087]" />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-sm font-medium text-[#1a1a1a]">Multibanco</span>
                  <span className="block text-xs text-[#aaa] font-light">Referência para pagamento</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-[#C9A961] transition-colors" />
              </button>

              {/* Cartão (Stripe) */}
              <button
                onClick={() => selectMethod('stripe')}
                className="w-full flex items-center gap-4 p-4 border border-[#e5e5e5] rounded hover:border-[#C9A961]/40 transition-all duration-300 group bg-white"
              >
                <div className="w-10 h-10 bg-[#635BFF]/10 rounded flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#635BFF]" />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-sm font-medium text-[#1a1a1a]">Cartão</span>
                  <span className="block text-xs text-[#aaa] font-light">Visa, Mastercard, etc.</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-[#C9A961] transition-colors" />
              </button>

              {/* PayPal */}
              <button
                onClick={() => selectMethod('paypal')}
                className="w-full flex items-center gap-4 p-4 border border-[#e5e5e5] rounded hover:border-[#C9A961]/40 transition-all duration-300 group bg-white"
              >
                <div className="w-10 h-10 bg-[#003087]/10 rounded flex items-center justify-center">
                  <span className="text-[#003087] font-bold text-sm">PP</span>
                </div>
                <div className="text-left flex-1">
                  <span className="block text-sm font-medium text-[#1a1a1a]">PayPal</span>
                  <span className="block text-xs text-[#aaa] font-light">Pagamento via PayPal</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-[#C9A961] transition-colors" />
              </button>

              {/* Discount code section */}
              <div className="pt-3 border-t border-[#e5e5e5]">
                {discountApplied && discountPercent > 0 ? (
                  <div className="flex items-center gap-2 text-green-600 text-xs bg-green-50 border border-green-200 rounded px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Cupão <strong>{discountCode.toUpperCase()}</strong> aplicado — {discountPercent}% desconto</span>
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
                      <Tag className="w-3 h-3" /> Código de desconto
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(null); }}
                        onKeyDown={e => e.key === 'Enter' && handleDiscountValidate()}
                        placeholder="CÓDIGO"
                        className="flex-1 px-3 py-2 text-xs border border-[#e5e5e5] rounded bg-white text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#C9A961]/40 uppercase"
                      />
                      <button
                        onClick={handleDiscountValidate}
                        disabled={discountLoading || !discountCode.trim() || discountValid}
                        className="px-4 py-2 text-xs font-medium bg-[#1a1a1a] text-white rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                      >
                        {discountLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : discountValid ? <Check className="w-3 h-3 text-green-400" /> : 'Aplicar'}
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
            </div>
          )}

          {/* ── Step: Form ── */}
          {step === 'form' && (
            <div className="space-y-4">
              <p className="text-xs text-[#888] font-light">
                {method === 'mbway' ? 'MB WAY' : method === 'multibanco' ? 'Multibanco' : method === 'stripe' ? 'Cartão' : 'PayPal'}
                {' — '}{formatPrice(finalPrice)}{discountPercent > 0 ? ` (${discountPercent}% desconto aplicado)` : ''}
              </p>

              {/* Name */}
              <div>
                <label className="block text-[10px] text-[#999] uppercase tracking-wider mb-1.5">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="O teu nome"
                  className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] rounded bg-white text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#C9A961]/40"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] text-[#999] uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] rounded bg-white text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#C9A961]/40"
                />
              </div>

              {/* Phone (MB WAY only) */}
              {method === 'mbway' && (
                <div>
                  <label className="block text-[10px] text-[#999] uppercase tracking-wider mb-1.5">Número de telemóvel</label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 py-2.5 text-sm border border-[#e5e5e5] rounded bg-white text-[#999] shrink-0">🇵🇹 +351</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="9XX XXX XXX"
                      className="flex-1 px-3 py-2.5 text-sm border border-[#e5e5e5] rounded bg-white text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#C9A961]/40"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-[#C9A961] text-[#1a1a1a] text-sm font-semibold rounded hover:bg-[#d4b574] transition-all duration-300 flex items-center justify-center gap-2 mt-2"
              >
                {t('pay.confirm')} — {formatPrice(finalPrice)}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step: Processing ── */}
          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#C9A961] animate-spin mx-auto" />
              <p className="text-sm text-[#555] font-light">{t('pay.processing')}</p>
            </div>
          )}

          {/* ── Step: MB WAY Polling ── */}
          {step === 'polling' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-[#E4002B]/10 border border-[#E4002B]/20 rounded-full flex items-center justify-center mx-auto">
                <Smartphone className="w-7 h-7 text-[#E4002B]" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[#1a1a1a] mb-2">{t('pay.mbwaySent')}</p>
                <p className="text-xs text-[#888] font-light leading-relaxed max-w-xs mx-auto">
                  {t('pay.mbwaySentDesc')}
                </p>
                {phone && (
                  <p className="text-sm text-[#C9A961] font-medium mt-3">+351 {formatPhone(phone)}</p>
                )}
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-center gap-2 text-[#aaa] text-xs">
                  {!pollingExpired && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{pollingMsg || t('pay.waiting')}</span>
                </div>
              </div>
              {pollingExpired && (
                <button
                  onClick={handleManualCheck}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A961] text-[#1a1a1a] text-sm font-semibold rounded hover:bg-[#d4b574] transition-all duration-300"
                >
                  <Check className="w-4 h-4" />
                  Já paguei — verificar agora
                </button>
              )}
              <div className="pt-1">
                <p className="text-[10px] text-[#bbb] font-light">
                  A subscrição será ativada automaticamente após confirmação do pagamento.
                </p>
              </div>
            </div>
          )}

          {/* ── Step: Multibanco Reference ── */}
          {step === 'mbref' && (
            <div className="py-4 space-y-5">
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-[#003087]/10 border border-[#003087]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-6 h-6 text-[#003087]" />
                </div>
                <p className="text-sm font-medium text-[#1a1a1a]">Referência Multibanco</p>
              </div>
              <div className="bg-[#f7f7f6] border border-[#e5e5e5] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#999] uppercase tracking-wider">{t('pay.mbEntity')}</span>
                  <span className="text-lg font-mono font-semibold text-[#1a1a1a] tracking-wider">{mbEntity}</span>
                </div>
                <div className="border-t border-[#e5e5e5]" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#999] uppercase tracking-wider">{t('pay.mbReference')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-semibold text-[#1a1a1a] tracking-wider">{mbReference}</span>
                    <button onClick={copyReference} className="text-[#aaa] hover:text-[#C9A961] transition-colors" title={t('pay.copyRef')}>
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#e5e5e5]" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#999] uppercase tracking-wider">{t('pay.mbAmount')}</span>
                  <span className="text-lg font-semibold text-[#C9A961]">{formatPrice(finalPrice)}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#999] font-light leading-relaxed text-center">
                {t('pay.mbInstructions')}
              </p>
              <button onClick={onClose} className="w-full py-2.5 border border-[#ddd] text-[#555] text-sm font-light rounded hover:border-[#C9A961]/30 hover:text-[#1a1a1a] transition-all duration-300">
                Fechar
              </button>
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
                onClick={() => { onClose(); window.location.href = '/area-cliente/membro'; }}
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
                <p className="text-lg font-semibold text-[#1a1a1a] mb-2">Erro no pagamento</p>
                <p className="text-xs text-red-400/80 font-light leading-relaxed max-w-xs mx-auto">
                  {error || t('pay.errorGeneric')}
                </p>
              </div>
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#ddd] text-[#555] text-sm font-light rounded hover:border-[#C9A961]/30 hover:text-[#1a1a1a] transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
