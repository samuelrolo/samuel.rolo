/**
 * ExtraAnalysisPaymentModal
 * Modal de pagamento para análises extra (quando o utilizador excede o limite do plano).
 * Suporta: MB WAY, Multibanco, Stripe, PayPal
 * Após pagamento confirmado, executa a análise automaticamente via onPaymentSuccess callback.
 * Backend: share2inspire-beckend.lm.r.appspot.com
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import {
  X, Smartphone, ArrowRight, ArrowLeft, Check,
  Copy, Loader2, AlertCircle, CreditCard, Building2,
  Sparkles, CheckCircle2,
} from 'lucide-react';

type PayMethod = 'mbway' | 'multibanco' | 'stripe' | 'paypal';
type Step = 'select' | 'form' | 'processing' | 'polling' | 'mbref' | 'success' | 'error';

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

export type ExtraAnalysisProduct = {
  type: 'career_path' | 'career_intelligence';
  label: string;
  price: number;          // final price after member discount (e.g. 9.75)
  originalPrice: number;  // original price (e.g. 39)
  discountLabel: string;  // e.g. "-75%"
  stripeProductType: string; // e.g. 'career_intelligence_member_pro'
};

type Props = {
  product: ExtraAnalysisProduct;
  onClose: () => void;
  onPaymentSuccess: () => void;
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
          // Trigger the analysis after a brief delay
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
    if (!name.trim()) { setError(lang === 'pt' ? 'Introduz o teu nome' : 'Enter your name'); return; }
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

  // ── Multibanco payment ────────────────────────────────────
  async function handleMultibanco() {
    if (!name.trim()) { setError(lang === 'pt' ? 'Introduz o teu nome' : 'Enter your name'); return; }
    setStep('processing');
    setError('');
    const oid = `S2I-EXTRA-MB-${Date.now()}`;
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
          description: `Share2Inspire - ${product.label} (Extra)`,
        }),
      });
      const data = await res.json();
      if (data.success && data.entity && data.reference) {
        setMbEntity(data.entity);
        setMbReference(data.reference);
        setStep('mbref');
        trackPurchase(finalPrice, oid, product.label);
      } else {
        setError(data.error || data.message || (lang === 'pt' ? 'Erro ao gerar referência' : 'Error generating reference'));
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
      // Store info for post-payment callback
      sessionStorage.setItem('s2iExtraOrderId', oid);
      sessionStorage.setItem('s2iExtraType', product.type);
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || (lang === 'pt' ? 'Erro ao processar pagamento' : 'Payment processing error'));
      setStep('error');
    }
  }

  // ── PayPal payment ────────────────────────────────────────
  async function handlePayPal() {
    if (!email) { setError(lang === 'pt' ? 'Introduz o teu email' : 'Enter your email'); return; }
    const oid = `S2I-EXTRA-PAYPAL-${Date.now()}`;
    window.open(`https://paypal.me/SamuelRolo/${finalPrice.toFixed(2)}EUR`, '_blank');
    trackPurchase(finalPrice, oid, product.label);
    setStep('success');
    setTimeout(() => onPaymentSuccess(), 1500);
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
              <button onClick={goBack} className="text-[#999] hover:text-[#1a1a1a] transition-colors">
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

          {/* ── Step: Select payment method ── */}
          {step === 'select' && (
            <div className="space-y-3">
              <p className="text-xs text-[#999] mb-3">
                {lang === 'pt' ? 'Escolhe o método de pagamento:' : 'Choose payment method:'}
              </p>
              <button onClick={() => selectMethod('mbway')} className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg hover:border-[#1a1a1a] transition-colors group">
                <Smartphone className="w-5 h-5 text-[#999] group-hover:text-[#1a1a1a]" />
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-[#1a1a1a]">MB WAY</span>
                  <p className="text-[10px] text-[#999]">{lang === 'pt' ? 'Pagamento instantâneo' : 'Instant payment'}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-[#1a1a1a]" />
              </button>
              <button onClick={() => selectMethod('multibanco')} className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg hover:border-[#1a1a1a] transition-colors group">
                <Building2 className="w-5 h-5 text-[#999] group-hover:text-[#1a1a1a]" />
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-[#1a1a1a]">Multibanco</span>
                  <p className="text-[10px] text-[#999]">{lang === 'pt' ? 'Referência para pagamento' : 'Payment reference'}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-[#1a1a1a]" />
              </button>
              <button onClick={() => selectMethod('stripe')} className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg hover:border-[#1a1a1a] transition-colors group">
                <CreditCard className="w-5 h-5 text-[#999] group-hover:text-[#1a1a1a]" />
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-[#1a1a1a]">{lang === 'pt' ? 'Cartão de Crédito / Débito' : 'Credit / Debit Card'}</span>
                  <p className="text-[10px] text-[#999]">Visa, Mastercard, Apple Pay</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-[#1a1a1a]" />
              </button>
              <button onClick={() => selectMethod('paypal')} className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-[#e5e5e5] rounded-lg hover:border-[#1a1a1a] transition-colors group">
                <span className="text-sm font-bold text-[#003087]">P</span>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-[#1a1a1a]">PayPal</span>
                  <p className="text-[10px] text-[#999]">{lang === 'pt' ? 'Pagar com PayPal' : 'Pay with PayPal'}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#ccc] group-hover:text-[#1a1a1a]" />
              </button>
            </div>
          )}

          {/* ── Step: Form ── */}
          {step === 'form' && (
            <div className="space-y-4">
              {method === 'mbway' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#666] mb-1">{lang === 'pt' ? 'Nome' : 'Name'}</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#1a1a1a]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#666] mb-1">{lang === 'pt' ? 'Telemóvel' : 'Phone'}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#999]">+351</span>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="912 345 678" className="flex-1 px-3 py-2 text-sm bg-white border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#1a1a1a]" />
                    </div>
                  </div>
                </>
              )}
              {method === 'multibanco' && (
                <div>
                  <label className="block text-xs font-medium text-[#666] mb-1">{lang === 'pt' ? 'Nome' : 'Name'}</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#1a1a1a]" />
                </div>
              )}
              {(method === 'stripe' || method === 'paypal') && (
                <div>
                  <label className="block text-xs font-medium text-[#666] mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#1a1a1a]" />
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-semibold text-[#1a1a1a]">{lang === 'pt' ? 'Total:' : 'Total:'} {formatPrice(finalPrice)}</span>
                <button onClick={handleConfirm} className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-gradient-to-r from-[#1a1a1a] to-[#333] rounded-lg hover:from-[#333] hover:to-[#444] transition-all">
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

          {/* ── Step: Multibanco reference ── */}
          {step === 'mbref' && (
            <div className="space-y-4 py-2">
              <div className="bg-white border border-[#e5e5e5] rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#999]">{lang === 'pt' ? 'Entidade' : 'Entity'}</span>
                  <span className="font-mono font-semibold text-[#1a1a1a]">{mbEntity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#999]">{lang === 'pt' ? 'Referência' : 'Reference'}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#1a1a1a]">{mbReference}</span>
                    <button onClick={copyReference} className="text-[#999] hover:text-[#1a1a1a]">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#999]">{lang === 'pt' ? 'Valor' : 'Amount'}</span>
                  <span className="font-semibold text-[#1a1a1a]">{formatPrice(finalPrice)}</span>
                </div>
              </div>
              <p className="text-xs text-[#999] text-center">
                {lang === 'pt'
                  ? 'Após o pagamento, a análise será gerada automaticamente. Podes fechar esta janela.'
                  : 'After payment, the analysis will be generated automatically. You can close this window.'}
              </p>
              <button onClick={onClose} className="w-full px-4 py-2.5 text-xs font-medium text-[#666] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f4] transition-colors">
                {lang === 'pt' ? 'Fechar' : 'Close'}
              </button>
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
              <button onClick={goBack} className="px-4 py-2 text-xs font-medium text-[#666] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f4] transition-colors">
                {lang === 'pt' ? 'Tentar novamente' : 'Try again'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
