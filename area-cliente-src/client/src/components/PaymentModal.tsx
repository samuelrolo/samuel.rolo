/*
 * Design: Consultoria de Luxo Silenciosa
 * Modal de pagamento com integração real ifthenpay: MB WAY + Multibanco
 * Backend: share2inspire-beckend.lm.r.appspot.com
 */
import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  X, Smartphone, ArrowRight, ArrowLeft, Check,
  Copy, Loader2, AlertCircle, CreditCard, Building2,
} from 'lucide-react';

type PlanKey = 'monthly' | 'semiannual' | 'annual';
type PayMethod = 'mbway' | 'multibanco';
type Step = 'select' | 'form' | 'processing' | 'waiting' | 'mbref' | 'success' | 'error';

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

function formatPhone(phone: string) {
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 9) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
  }
  return phone;
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

  const price = planPrices[plan];

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
  const createSubscription = useCallback(async (payMethod: string, payRef: string, status: string) => {
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
  }, [user, plan, price]);

  // MB WAY payment
  async function handleMbWay() {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setError(t('pay.errorPhone'));
      return;
    }
    if (!name.trim()) {
      setError(t('pay.errorName'));
      return;
    }

    setStep('processing');
    setError('');

    const oid = `S2I-MBWAY-${Date.now()}`;
    setOrderId(oid);

    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: oid,
          amount: price.toFixed(2),
          mobileNumber: cleanPhone.startsWith('351') ? cleanPhone : `351${cleanPhone}`,
          customerName: name,
          customerEmail: email,
          description: `Share2Inspire - Plano ${planLabels[plan]}`,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStep('waiting');
        // Create pending subscription
        await createSubscription('mbway', oid, 'pending');

        // Google Ads conversion tracking
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'purchase', {
            transaction_id: oid,
            value: price,
            currency: 'EUR',
            items: [{ item_name: `Plano ${planLabels[plan]}`, price: price }],
          });
        }
      } else {
        setError(data.error || data.message || t('pay.errorGeneric'));
        setStep('error');
      }
    } catch {
      setError(t('pay.errorGeneric'));
      setStep('error');
    }
  }

  // Multibanco payment
  async function handleMultibanco() {
    if (!name.trim()) {
      setError(t('pay.errorName'));
      return;
    }

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
          amount: price.toFixed(2),
          customerName: name,
          customerEmail: email,
          description: `Share2Inspire - Plano ${planLabels[plan]}`,
        }),
      });

      const data = await res.json();

      if (data.success && data.entity && data.reference) {
        setMbEntity(data.entity);
        setMbReference(data.reference);
        setStep('mbref');
        // Create pending subscription
        await createSubscription('multibanco', `${data.entity}/${data.reference}`, 'pending');

        // Google Ads conversion tracking
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'purchase', {
            transaction_id: oid,
            value: price,
            currency: 'EUR',
            items: [{ item_name: `Plano ${planLabels[plan]}`, price: price }],
          });
        }
      } else {
        setError(data.error || data.message || t('pay.errorGeneric'));
        setStep('error');
      }
    } catch {
      setError(t('pay.errorGeneric'));
      setStep('error');
    }
  }

  function handleConfirm() {
    if (method === 'mbway') handleMbWay();
    else if (method === 'multibanco') handleMultibanco();
  }

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(mbReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = mbReference;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
              <span className="text-lg font-semibold text-gold">{formatPrice(price)}</span>
              <span className="text-xs text-[#999] font-light ml-1">{periodLabels[plan]}</span>
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
                className="w-full flex items-center gap-4 p-4 border border-[#e5e5e5] rounded hover:border-gold/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-[#E4002B]/10 rounded flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-[#E4002B]" />
                </div>
                <div className="text-left flex-1">
                  <span className="text-sm text-[#1a1a1a] font-medium group-hover:text-gold transition-colors">{t('pay.mbway')}</span>
                  <p className="text-[10px] text-[#999] font-light">Pagamento instantâneo</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#ccc] group-hover:text-gold/50 transition-colors" />
              </button>

              {/* Multibanco */}
              <button
                onClick={() => selectMethod('multibanco')}
                className="w-full flex items-center gap-4 p-4 border border-[#e5e5e5] rounded hover:border-gold/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-[#003087]/10 rounded flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#003087]" />
                </div>
                <div className="text-left flex-1">
                  <span className="text-sm text-[#1a1a1a] font-medium group-hover:text-gold transition-colors">{t('pay.multibanco')}</span>
                  <p className="text-[10px] text-[#999] font-light">Referência multibanco / homebanking</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#ccc] group-hover:text-gold/50 transition-colors" />
              </button>
            </div>
          )}

          {/* ── Step: Form (MB WAY or Multibanco) ── */}
          {step === 'form' && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{t('pay.name')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f7f7f6] border border-[#e5e5e5] rounded px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:border-gold/30 focus:outline-none transition-colors"
                  placeholder="João Silva"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{t('pay.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f7f7f6] border border-[#e5e5e5] rounded px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:border-gold/30 focus:outline-none transition-colors"
                  placeholder="joao@email.com"
                />
              </div>

              {/* Phone (MB WAY only) */}
              {method === 'mbway' && (
                <div>
                  <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1.5">{t('pay.mbwayPhone')}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#888] font-light">+351</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                      maxLength={12}
                      className="flex-1 bg-[#f7f7f6] border border-[#e5e5e5] rounded px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#bbb] focus:border-gold/30 focus:outline-none transition-colors"
                      placeholder={t('pay.mbwayPhonePlaceholder')}
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
                className="w-full py-3 bg-gold text-[#1a1a1a] text-sm font-semibold rounded hover:bg-gold-light transition-all duration-300 flex items-center justify-center gap-2 mt-2"
              >
                {t('pay.confirm')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step: Processing ── */}
          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto" />
              <p className="text-sm text-[#555] font-light">{t('pay.processing')}</p>
            </div>
          )}

          {/* ── Step: Waiting MB WAY ── */}
          {step === 'waiting' && (
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
                  <p className="text-sm text-gold font-medium mt-3">+351 {formatPhone(phone)}</p>
                )}
              </div>
              <div className="pt-4">
                <div className="flex items-center justify-center gap-2 text-[#aaa] text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{t('pay.waiting')}</span>
                </div>
              </div>
              <div className="pt-2">
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

              {/* Reference details */}
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
                    <button
                      onClick={copyReference}
                      className="text-[#aaa] hover:text-gold transition-colors"
                      title={t('pay.copyRef')}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="border-t border-[#e5e5e5]" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#999] uppercase tracking-wider">{t('pay.mbAmount')}</span>
                  <span className="text-lg font-semibold text-gold">{formatPrice(price)}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#999] font-light leading-relaxed text-center">
                {t('pay.mbInstructions')}
              </p>

              <button
                onClick={onClose}
                className="w-full py-2.5 border border-[#ddd] text-[#555] text-sm font-light rounded hover:border-gold/30 hover:text-[#1a1a1a] transition-all duration-300"
              >
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
                onClick={goBack}
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
