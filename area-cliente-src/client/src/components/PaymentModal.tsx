/*
 * Design: Consultoria de Luxo Silenciosa
 * Modal de pagamento com integração real: MB WAY + Cartão (Stripe) + PayPal
 * Backend: share2inspire-beckend.lm.r.appspot.com
 * Usa as mesmas routes do Career Path
 */
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  X, Smartphone, ArrowRight, ArrowLeft, Check,
  Loader2, AlertCircle, CreditCard, CheckCircle2,
} from 'lucide-react';

type PlanKey = 'monthly' | 'semiannual' | 'annual';
type PayMethod = 'mbway' | 'stripe' | 'paypal';
type Step = 'select' | 'form' | 'processing' | 'polling' | 'success' | 'error';

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

type Props = {
  plan: PlanKey;
  onClose: () => void;
};

export default function PaymentModal({ plan, onClose }: Props) {
  const { t } = useI18n();
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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const price = planPrices[plan];

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

  const planLabels: Record<PlanKey, string> = {
    monthly: t('sub.monthly'),
    semiannual: t('sub.semiannual'),
    annual: t('sub.annual'),
  };

  // Create subscription record in Supabase
  const createSubscription = async (payMethod: string, payRef: string, status: string) => {
    if (!user) return;
    const now = new Date();
    const endDate = new Date(now.getTime() + planDurations[plan] * 24 * 60 * 60 * 1000);

    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: plan,
      status: status,
      price_eur: price,
      started_at: status === 'active' ? now.toISOString() : null,
      expires_at: status === 'active' ? endDate.toISOString() : null,
      payment_method: payMethod,
      payment_reference: payRef,
    });
  };

  // ── MB WAY Payment ──
  const handleMBWayPayment = async () => {
    if (!email) { setError('Introduz o teu email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Email inválido'); return; }
    const cleanPhone = phone.replace(/\D/g, '').replace(/^(\+?351)/, '');
    if (cleanPhone.length < 9) { setError('Número de telemóvel inválido'); return; }

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
          amount: price.toFixed(2),
          paymentMethod: 'mbway',
          description: `Share2Inspire - Plano ${planLabels[plan]}`,
          name: email.split('@')[0],
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erro ao iniciar pagamento');

      setStep('polling');
      setPollingMsg('Confirma o pagamento na app MB WAY do teu telemóvel...');
      startPolling(orderId);

      // Create pending subscription
      await createSubscription('mbway', orderId, 'pending');

      // Google Ads conversion tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'purchase', {
          transaction_id: orderId,
          value: price,
          currency: 'EUR',
          items: [{ item_name: `Plano ${planLabels[plan]}`, price }],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // ── Stripe Payment ──
  const handleStripePayment = async () => {
    if (!email) { setError('Introduz o teu email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Email inválido'); return; }

    setLoading(true);
    setError('');

    try {
      const orderId = `S2I-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const res = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          product_type: 'career_path', // uses the same product type for now
          orderId,
          language: 'pt',
          country: '',
          region: '',
          currency: 'eur',
          amount: price,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento');
      }

      // Create pending subscription
      await createSubscription('stripe', orderId, 'pending');

      // Google Ads conversion tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'purchase', {
          transaction_id: orderId,
          value: price,
          currency: 'EUR',
          items: [{ item_name: `Plano ${planLabels[plan]}`, price }],
        });
      }

      // Redirect to Stripe
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // ── PayPal Payment ──
  const handlePayPalPayment = async () => {
    if (!email) { setError('Introduz o teu email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Email inválido'); return; }

    const orderId = `S2I-SUB-PAYPAL-${Date.now()}`;

    // Create pending subscription
    await createSubscription('paypal', orderId, 'pending');

    // Google Ads conversion tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: orderId,
        value: price,
        currency: 'EUR',
        items: [{ item_name: `Plano ${planLabels[plan]}`, price }],
      });
    }

    window.open(`https://paypal.me/SamuelRolo/${price}EUR`, '_blank');
    setStep('success');
  };
    if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: price, currency: 'EUR'});

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
            setPollingMsg('Não foi possível verificar. Usa o botão "Já paguei".');
          }
          return;
        }

        consecutiveErrors = 0;
        const data = await res.json();

        if (data.paid) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          handlePaymentConfirmed(orderId);
          return;
        }

        const elapsed = Date.now() - startTime;
        if (data.expired) {
          if (elapsed < MIN_BEFORE_EXPIRED) {
            setPollingMsg('A verificar pagamento... Confirma na app MB WAY.');
          } else {
            if (pollingRef.current) clearInterval(pollingRef.current);
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
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPollingExpired(true);
          setPollingMsg('Tempo esgotado. Se já pagaste, usa o botão abaixo.');
        }
      } catch {
        consecutiveErrors++;
      }
    }, 5000);
  };

  // ── Manual check ──
  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMsg('A verificar pagamento...');
    setPollingExpired(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentOrderId }),
      });
      const data = await res.json();
      if (data.paid) {
        handlePaymentConfirmed(currentOrderId);
      } else {
        setPollingExpired(true);
        setPollingMsg('Pagamento ainda não confirmado. Aguarda uns segundos e tenta novamente.');
        startPolling(currentOrderId);
      }
    } catch {
      setPollingExpired(true);
      setPollingMsg('Erro ao verificar. Tenta novamente em alguns segundos.');
    }
  };

  // ── Payment confirmed ──
  const handlePaymentConfirmed = async (orderId: string) => {
    // Update subscription to active
    if (user) {
      const now = new Date();
      const endDate = new Date(now.getTime() + planDurations[plan] * 24 * 60 * 60 * 1000);
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          started_at: now.toISOString(),
          expires_at: endDate.toISOString(),
        })
        .eq('payment_reference', orderId)
        .eq('user_id', user.id);
    }
    await refreshProfile();
    setStep('success');
  };

  // ── Handle confirm button ──
  function handleConfirm() {
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    if (method === 'mbway') handleMBWayPayment();
    else if (method === 'stripe') handleStripePayment();
    else if (method === 'paypal') handlePayPalPayment();
  }

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
              <span className="text-lg font-semibold text-gold">{formatPrice(price)}</span>
            </div>
          </div>
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
                      {m === 'mbway' ? 'MB WAY' : m === 'stripe' ? 'Cartão' : 'PayPal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs text-[#888] font-light">Email</label>
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
                  <label className="text-xs text-[#888] font-light">Telemóvel (MB WAY)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9XXXXXXXX"
                    className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded bg-white text-sm text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-gold/40 transition-colors"
                  />
                </div>
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
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded transition-all duration-300 ${
                    method === 'stripe'
                      ? 'bg-[#635BFF] hover:bg-[#5046E5] text-white'
                      : 'bg-gold hover:bg-gold-light text-[#1a1a1a]'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `Pagar ${formatPrice(price)}`
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Processing ── */}
          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-gold/60 animate-spin mx-auto" />
              <p className="text-sm text-[#555] font-light">A processar pagamento...</p>
            </div>
          )}

          {/* ── Step: Polling (MB WAY) ── */}
          {step === 'polling' && (
            <div className="py-8 text-center space-y-4">
              {!pollingExpired ? (
                <Loader2 className="w-10 h-10 animate-spin text-gold mx-auto" />
              ) : (
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              )}
              <p className="text-sm font-medium text-[#1a1a1a]">{pollingMsg}</p>
              {!pollingExpired && (
                <p className="text-xs text-[#999] font-light">A aguardar confirmação do pagamento...</p>
              )}
              {pollingExpired && (
                <button
                  onClick={handleManualCheck}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold text-[#1a1a1a] text-sm font-semibold rounded hover:bg-gold-light transition-all duration-300"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Já paguei — verificar novamente
                </button>
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
                <p className="text-lg font-semibold text-[#1a1a1a] mb-1">Pagamento confirmado!</p>
                <p className="text-xs text-[#888] font-light">A tua subscrição está agora ativa.</p>
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
                <p className="text-lg font-semibold text-[#1a1a1a] mb-2">Erro no pagamento</p>
                <p className="text-xs text-red-400/80 font-light leading-relaxed max-w-xs mx-auto">
                  {error || t('pay.errorGeneric')}
                </p>
              </div>
              <button
                onClick={() => { setStep('form'); setError(''); }}
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#ddd] text-[#555] text-sm font-light rounded hover:border-gold/30 hover:text-[#1a1a1a] transition-all duration-300"
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
