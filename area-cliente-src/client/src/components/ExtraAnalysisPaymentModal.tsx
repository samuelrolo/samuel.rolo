/**
 * ExtraAnalysisPaymentModal
 * Modal de pagamento para análises extra (quando o utilizador excede o limite do plano).
 * Suporta: MB WAY, Stripe (Cartão), PayPal — alinhado com o standalone.
 * Após pagamento confirmado, executa a análise automaticamente via onPaymentSuccess callback.
 * Backend: share2inspire-beckend.lm.r.appspot.com
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import {
  X, Smartphone, ArrowLeft, Check,
  Copy, Loader2, AlertCircle, CreditCard,
  Sparkles, CheckCircle2,
} from 'lucide-react';

type PayMethod = 'mbway' | 'stripe' | 'paypal';
type Step = 'method' | 'processing' | 'polling' | 'success' | 'error';

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

export type ExtraAnalysisProduct = {
  type: 'career_path' | 'career_intelligence';
  label: string;
  price: number;
  originalPrice: number;
  discountLabel: string;
  stripeProductType: string;
};

type Props = {
  product: ExtraAnalysisProduct;
  onClose: () => void;
  onPaymentSuccess: () => void;
};

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €';
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

function trackPurchase(value: number, transactionId: string, productLabel: string) {
  if ((window as any).dataLayer) {
    (window as any).dataLayer.push({
      event: 'conversion',
      send_to: 'AW-16929498025/extra_analysis',
      value,
      currency: 'EUR',
      transaction_id: transactionId,
    });
  }
  trackGtag('purchase', {
    value,
    currency: 'EUR',
    transaction_id: transactionId,
  });
  trackFbq('Purchase', { value, currency: 'EUR', content_name: `extra_${productLabel}` });
}

export default function ExtraAnalysisPaymentModal({ product, onClose, onPaymentSuccess }: Props) {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const [method, setMethod] = useState<PayMethod>('mbway');
  const [step, setStep] = useState<Step>('method');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');

  // MB WAY polling state
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finalPrice = product.price;

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

  // ── MB WAY polling ────────────────────────────────────────
  const startPolling = (oid: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    let attempts = 0;
    const maxAttempts = 60;
    let consecutiveErrors = 0;
    const startTime = Date.now();
    const MIN_BEFORE_EXPIRED = 90000;
    setPollingExpired(false);
    setPollingMsg(lang === 'pt' ? 'Confirma o pagamento na app MB WAY do teu telemóvel...' : 'Confirm the payment in the MB WAY app on your phone...');

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
            setPollingMsg(lang === 'pt' ? 'Não foi possível verificar. Usa o botão "Já paguei" abaixo.' : 'Unable to verify. Use the "I already paid" button below.');
          }
          return;
        }
        consecutiveErrors = 0;
        const data = await res.json();
        if (data.paid) {
          clearInterval(pollingIntervalRef.current!);
          trackPurchase(finalPrice, oid, product.label);
          setStep('success');
          setTimeout(() => onPaymentSuccess(), 1500);
          return;
        }
        const elapsed = Date.now() - startTime;
        if (data.expired) {
          if (elapsed < MIN_BEFORE_EXPIRED) {
            setPollingMsg(lang === 'pt' ? 'A verificar pagamento... Confirma na app MB WAY.' : 'Verifying payment... Confirm in MB WAY app.');
          } else {
            clearInterval(pollingIntervalRef.current!);
            setPollingExpired(true);
            setPollingMsg(lang === 'pt' ? 'O pagamento expirou. Usa o botão abaixo se já pagaste.' : 'Payment expired. Use the button below if you already paid.');
          }
          return;
        }
        if (elapsed < 30000) {
          setPollingMsg(lang === 'pt' ? 'Confirma o pagamento na app MB WAY do teu telemóvel...' : 'Confirm the payment in the MB WAY app...');
        } else if (elapsed < 60000) {
          setPollingMsg(lang === 'pt' ? 'Ainda a aguardar... Verifica a app MB WAY.' : 'Still waiting... Check the MB WAY app.');
        } else {
          setPollingMsg(lang === 'pt' ? 'A aguardar confirmação... Se já aprovaste, aguarda mais uns segundos.' : 'Waiting for confirmation...');
        }
        if (attempts >= maxAttempts) {
          clearInterval(pollingIntervalRef.current!);
          setPollingExpired(true);
          setPollingMsg(lang === 'pt' ? 'Tempo esgotado. Se já pagaste, usa o botão abaixo.' : 'Timed out. If you already paid, use the button below.');
        }
      } catch { consecutiveErrors++; }
    }, 5000);
  };

  const handleManualCheck = async () => {
    if (!orderId) return;
    setPollingMsg(lang === 'pt' ? 'A verificar pagamento...' : 'Verifying payment...');
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
        trackPurchase(finalPrice, orderId, product.label);
        setStep('success');
        setTimeout(() => onPaymentSuccess(), 1500);
      } else {
        setPollingMsg(lang === 'pt' ? 'Pagamento ainda não confirmado. Verifica a app MB WAY.' : 'Payment not yet confirmed. Check the MB WAY app.');
        setPollingExpired(true);
      }
    } catch {
      setPollingMsg(lang === 'pt' ? 'Erro ao verificar. Tenta novamente.' : 'Error verifying. Try again.');
      setPollingExpired(true);
    }
  };

  // ── MB WAY payment ────────────────────────────────────────
  async function handleMbWay() {
    const cleanPhone = phone.replace(/\D/g, '').replace(/^(\+?351)/, '');
    if (cleanPhone.length < 9) { setError(lang === 'pt' ? 'Número de telemóvel inválido' : 'Invalid phone number'); return; }
    if (!email) { setError(lang === 'pt' ? 'Introduz o teu email' : 'Enter your email'); return; }
    setStep('processing');
    setError('');
    const oid = `S2I-EXTRA-MBWAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
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
          description: `Share2Inspire - ${product.label} (Extra)`,
          paymentMethod: 'mbway',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('polling');
        startPolling(oid);
      } else {
        setError(data.error || data.message || (lang === 'pt' ? 'Erro ao processar pagamento' : 'Payment processing error'));
        setStep('error');
      }
    } catch {
      setError(lang === 'pt' ? 'Erro ao processar pagamento' : 'Payment processing error');
      setStep('error');
    }
  }

  // ── Stripe payment ────────────────────────────────────────
  async function handleStripe() {
    if (!email) { setError(lang === 'pt' ? 'Introduz o teu email' : 'Enter your email'); return; }
    setStep('processing');
    setError('');
    trackFbq('AddPaymentInfo');
    const oid = `S2I-EXTRA-STRIPE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          product_type: product.stripeProductType,
          orderId: oid,
          language: lang || 'pt',
          currency: 'eur',
          amount: finalPrice,
          description: `Share2Inspire - ${product.label} (Extra)`,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.url) throw new Error(data.error || 'Erro ao criar sessão de pagamento');
      sessionStorage.setItem('s2iExtraOrderId', oid);
      sessionStorage.setItem('s2iExtraType', product.type);
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
      setError(err.message || (lang === 'pt' ? 'Erro ao processar pagamento' : 'Payment processing error'));
      setStep('error');
    }
  }

  // ── PayPal payment ────────────────────────────────────────
  async function handlePayPal() {
    if (!email) { setError(lang === 'pt' ? 'Introduz o teu email' : 'Enter your email'); return; }
    const oid = `S2I-EXTRA-PAYPAL-${Date.now()}`;
    sessionStorage.setItem('s2iExtraOrderId', oid);
    sessionStorage.setItem('s2iExtraType', product.type);
    window.open(`https://paypal.me/SamuelRolo/${finalPrice.toFixed(2)}EUR`, '_blank');
    trackPurchase(finalPrice, oid, product.label);
    setStep('success');
    setTimeout(() => onPaymentSuccess(), 1500);
  }

  function handleConfirm() {
    if (method === 'mbway') handleMbWay();
    else if (method === 'stripe') handleStripe();
    else if (method === 'paypal') handlePayPal();
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
            {step === 'error' && (
              <button onClick={() => { setStep('method'); setError(''); }} className="text-[#999] hover:text-[#1a1a1a] transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold text-[#1a1a1a]">
                {lang === 'pt' ? 'Pagamento — Análise Extra' : 'Payment — Extra Analysis'}
              </h2>
              <p className="text-[11px] text-[#999]">{product.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-[#1a1a1a] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Product summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1a1a1a] font-medium">{product.label}</span>
              <span className="text-sm font-bold text-[#1a1a1a]">{formatPrice(product.price)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#999]">
              <span>{lang === 'pt' ? 'Preço normal' : 'Normal price'}</span>
              <span className="line-through">{formatPrice(product.originalPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-600">
              <span>{lang === 'pt' ? 'Desconto membro' : 'Member discount'}</span>
              <span className="font-medium">{product.discountLabel}</span>
            </div>
          </div>

          {/* ── Step: Method selection + form (inline like standalone) ── */}
          {step === 'method' && (
            <div className="space-y-5">
              {/* Method tabs — grid 3 cols like standalone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1a1a1a]">
                  {lang === 'pt' ? 'Método de pagamento' : 'Payment method'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mbway', 'stripe', 'paypal'] as PayMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() => { setMethod(m); setError(''); }}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        method === m
                          ? 'border-[#C9A961] bg-[#C9A961]/5 text-[#1a1a1a]'
                          : 'border-[#e5e5e5] text-[#999] hover:border-[#C9A961]/50'
                      }`}
                    >
                      {m === 'mbway' ? 'MB WAY' : m === 'stripe' ? (lang === 'pt' ? 'Cartão' : 'Card') : 'PayPal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form fields based on selected method */}
              <div className="space-y-3">
                {/* Email — always shown */}
                <div>
                  <label className="block text-xs font-medium text-[#666] mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>

                {/* Phone — only for MB WAY */}
                {method === 'mbway' && (
                  <div>
                    <label className="block text-xs font-medium text-[#666] mb-1">
                      {lang === 'pt' ? 'Telemóvel' : 'Phone'}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#999]">+351</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="912 345 678"
                        className="flex-1 px-3 py-2 text-sm bg-white border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#1a1a1a]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Confirm button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold text-[#1a1a1a]">
                  {lang === 'pt' ? 'Total:' : 'Total:'} {formatPrice(finalPrice)}
                </span>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-gradient-to-r from-[#1a1a1a] to-[#333] rounded-lg hover:from-[#333] hover:to-[#444] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {lang === 'pt' ? 'Pagar e gerar' : 'Pay and generate'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Processing ── */}
          {step === 'processing' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 text-[#1a1a1a] animate-spin" />
              <p className="text-sm text-[#666]">{lang === 'pt' ? 'A processar pagamento...' : 'Processing payment...'}</p>
            </div>
          )}

          {/* ── Step: MB WAY polling ── */}
          {step === 'polling' && (
            <div className="flex flex-col items-center gap-4 py-6">
              {!pollingExpired && <Loader2 className="w-8 h-8 text-[#1a1a1a] animate-spin" />}
              <p className="text-sm text-[#666] text-center">{pollingMsg}</p>
              {pollingExpired && (
                <button onClick={handleManualCheck} className="px-4 py-2 text-xs font-medium text-white bg-[#1a1a1a] rounded-lg hover:bg-[#333] transition-colors">
                  {lang === 'pt' ? 'Já paguei — verificar' : 'I already paid — verify'}
                </button>
              )}
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-semibold text-[#1a1a1a] mb-1">
                  {lang === 'pt' ? 'Pagamento confirmado!' : 'Payment confirmed!'}
                </h3>
                <p className="text-xs text-[#999]">
                  {lang === 'pt' ? 'A gerar a tua análise...' : 'Generating your analysis...'}
                </p>
              </div>
              <Loader2 className="w-5 h-5 text-[#1a1a1a] animate-spin" />
            </div>
          )}

          {/* ── Step: Error ── */}
          {step === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <p className="text-sm text-red-700 text-center">{error}</p>
              <button onClick={() => { setStep('method'); setError(''); }} className="px-4 py-2 text-xs font-medium text-[#666] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f4] transition-colors">
                {lang === 'pt' ? 'Tentar novamente' : 'Try again'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
