import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, CreditCard, Loader2, Mail, Smartphone, Ticket } from 'lucide-react';
import { pick } from '@/i18n';
import { couponSupportsProduct } from '@/lib/couponProductCompatibility';
import { fetchPaymentStatus, persistVerifiedPayment } from '@/lib/paymentAccess';
import { trackPaymentStart, trackPurchase } from '@/lib/gtag';

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

type PaymentMethod = 'mbway' | 'stripe' | 'paypal';
type PaymentStep = 'payment' | 'polling' | 'success';
type Theme = 'orange' | 'emerald' | 'gold';

interface ResultsUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: 'linkedin_roast' | 'student_pack';
  couponProductKey: 'linkedin_roast' | 'student_pack';
  productLabel: string;
  price: number;
  successPath: string;
  theme?: Theme;
  emailStorageKey: string;
  pendingOrderStorageKey: string;
  verifiedSessionStorageKey: string;
  verifiedOrderStorageKey?: string;
  accessTypeStorageKey?: string;
  onPaid: (payload: { email: string; orderId?: string; sessionId?: string; paymentMethod: PaymentMethod | 'coupon' | 'voucher'; amount: number; couponCode?: string; }) => void;
}

const themeMap = {
  orange: {
    softBg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    accentBtn: 'bg-orange-500 hover:bg-orange-600',
  },
  emerald: {
    softBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    accentBtn: 'bg-emerald-600 hover:bg-emerald-700',
  },
  gold: {
    softBg: 'bg-[#C9A961]/10',
    border: 'border-[#C9A961]/30',
    text: 'text-[#A88B4E]',
    accentBtn: 'bg-[#C9A961] hover:bg-[#A88B4E]',
  },
} as const;

export default function ResultsUnlockModal({
  open,
  onOpenChange,
  productType,
  couponProductKey,
  productLabel,
  price,
  successPath,
  theme = 'gold',
  emailStorageKey,
  pendingOrderStorageKey,
  verifiedSessionStorageKey,
  verifiedOrderStorageKey,
  accessTypeStorageKey,
  onPaid,
}: ResultsUnlockModalProps) {
  const isPT = window.location.pathname.startsWith('/');
  const currentTheme = themeMap[theme];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(window.location.pathname.startsWith('/en/') || window.location.pathname.startsWith('/es/') ? 'stripe' : 'mbway');
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('payment');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);

  const finalPrice = useMemo(() => appliedCoupon ? Math.round(price * (1 - appliedCoupon.percent / 100) * 100) / 100 : price, [appliedCoupon, price]);
  const finalPriceDisplay = useMemo(() => window.location.pathname.startsWith('/en/') ? `€${finalPrice.toFixed(2)}` : `${finalPrice.toFixed(2).replace('.', ',')}€`, [finalPrice]);
  const basePriceDisplay = useMemo(() => window.location.pathname.startsWith('/en/') ? `€${price.toFixed(2)}` : `${price.toFixed(2).replace('.', ',')}€`, [price]);

  const resetModal = () => {
    setPaymentStep('payment');
    setPaymentError(null);
    setPollingMsg('');
    setPollingExpired(false);
    setCurrentOrderId(null);
    setPhone('');
  };

  useEffect(() => {
    if (!open) return;
    const savedEmail = localStorage.getItem(emailStorageKey) || sessionStorage.getItem(emailStorageKey) || '';
    if (savedEmail) setEmail(savedEmail);
    resetModal();
  }, [open, emailStorageKey]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) return;

    let cancelled = false;
    (async () => {
      const status = await fetchPaymentStatus({
        sessionId,
        expectedProductTypes: [productType],
      });
      if (cancelled || !status.success || !status.paid) return;

      persistVerifiedPayment(status, {
        orderIdKeys: verifiedOrderStorageKey ? [verifiedOrderStorageKey] : [],
        sessionIdKeys: [verifiedSessionStorageKey],
      });
      localStorage.removeItem(pendingOrderStorageKey);
      sessionStorage.removeItem(pendingOrderStorageKey);
      if (accessTypeStorageKey) localStorage.setItem(accessTypeStorageKey, 'paid_verified');
      if (status.email) {
        localStorage.setItem(emailStorageKey, status.email);
        sessionStorage.setItem(emailStorageKey, status.email);
      }
      if (typeof (window as any).fbq === 'function') {
        (window as any).fbq('track', 'Purchase', { value: status.amount || finalPrice, currency: status.currency || 'EUR' });
      }
      trackPurchase(productType, status.amount || finalPrice, status.session_id || sessionId);
      onPaid({
        email: status.email || email || '',
        orderId: status.order_id,
        sessionId: status.session_id || sessionId,
        paymentMethod: 'stripe',
        amount: status.amount || finalPrice,
      });
      window.history.replaceState({}, '', successPath);
    })();

    return () => { cancelled = true; };
  }, [productType, successPath, verifiedOrderStorageKey, verifiedSessionStorageKey, pendingOrderStorageKey, accessTypeStorageKey, emailStorageKey, finalPrice, onPaid, email]);

  const validateEmail = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setPaymentError(pick('Introduz o teu email para desbloquear o relatório.', 'Enter your email to unlock the report.', 'Introduce tu correo para desbloquear el informe.'));
      return null;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setPaymentError(pick('Introduz um email válido.', 'Enter a valid email.', 'Introduce un correo válido.'));
      return null;
    }
    return trimmed;
  };

  const persistEmail = (value: string) => {
    localStorage.setItem(emailStorageKey, value);
    sessionStorage.setItem(emailStorageKey, value);
  };

  const markPaid = (payload: { email: string; orderId?: string; sessionId?: string; paymentMethod: PaymentMethod | 'coupon' | 'voucher'; amount: number; couponCode?: string; }) => {
    localStorage.removeItem(pendingOrderStorageKey);
    sessionStorage.removeItem(pendingOrderStorageKey);
    if (payload.orderId && verifiedOrderStorageKey) {
      localStorage.setItem(verifiedOrderStorageKey, payload.orderId);
      sessionStorage.setItem(verifiedOrderStorageKey, payload.orderId);
    }
    if (payload.sessionId) {
      localStorage.setItem(verifiedSessionStorageKey, payload.sessionId);
      sessionStorage.setItem(verifiedSessionStorageKey, payload.sessionId);
    }
    if (accessTypeStorageKey) localStorage.setItem(accessTypeStorageKey, 'paid_verified');
    if (payload.email) persistEmail(payload.email);
    onPaid(payload);
    setPaymentStep('success');
    setTimeout(() => onOpenChange(false), 350);
  };

  const startPolling = (orderId: string) => {
    setCurrentOrderId(orderId);
    setPaymentStep('polling');
    setPollingExpired(false);
    const startedAt = Date.now();
    let attempts = 0;

    const interval = window.setInterval(async () => {
      attempts += 1;
      const status = await fetchPaymentStatus({
        orderId,
        expectedProductTypes: [productType],
      });

      if (status.success && status.paid) {
        window.clearInterval(interval);
        if (typeof (window as any).fbq === 'function') {
          (window as any).fbq('track', 'Purchase', { value: status.amount || finalPrice, currency: status.currency || 'EUR' });
        }
        trackPurchase(productType, status.amount || finalPrice, status.order_id || orderId);
        markPaid({
          email: status.email || email,
          orderId: status.order_id || orderId,
          sessionId: status.session_id,
          paymentMethod: 'mbway',
          amount: status.amount || finalPrice,
        });
        return;
      }

      const elapsed = Date.now() - startedAt;
      setPollingMsg(
        elapsed < 30000
          ? pick('Confirma o pagamento na app e volta aqui dentro de instantes.', 'Confirm the payment in the app and come back in a moment.', 'Confirma el pago en la app y vuelve aquí en unos instantes.')
          : pick('Ainda a aguardar confirmação do pagamento.', 'Still waiting for payment confirmation.', 'Seguimos esperando la confirmación del pago.')
      );

      if (attempts >= 36) {
        window.clearInterval(interval);
        setPollingExpired(true);
        setPollingMsg(pick('Tempo esgotado. Se já pagaste, tenta verificar novamente.', 'Time expired. If you already paid, try verifying again.', 'Tiempo agotado. Si ya pagaste, vuelve a verificar.'));
      }
    }, 5000);
  };

  const handleApplyCode = async () => {
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;
    if (!discountCode.trim()) return;

    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      const couponRes = await fetch(`${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,max_uses,current_uses,valid_from,valid_until,applicable_products`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError(pick('Este código ainda não está ativo.', 'This code is not active yet.', 'Este código aún no está activo.')); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError(pick('Este código já expirou.', 'This code has expired.', 'Este código ya expiró.')); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError(pick('Este código atingiu o limite.', 'This code has reached the limit.', 'Este código alcanzó el límite.')); return; }
        if (!couponSupportsProduct(coupon.applicable_products || [], couponProductKey)) { setDiscountError(pick('Este código não é aplicável a este produto.', 'This code is not applicable to this product.', 'Este código no es aplicable a este producto.')); return; }
        setAppliedCoupon({ code, percent: coupon.discount_percent });
        if (coupon.discount_percent === 100) {
          if (typeof (window as any).fbq === 'function') {
            (window as any).fbq('track', 'Purchase', { value: 0, currency: 'EUR' });
          }
          trackPurchase(productType, 0, `COUPON-${code}`);
          markPaid({ email: normalizedEmail, orderId: `COUPON-${code}`, paymentMethod: 'coupon', amount: 0, couponCode: code });
        }
        return;
      }

      const voucherRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      });
      const vouchers = await voucherRes.json();
      if (Array.isArray(vouchers) && vouchers.length > 0) {
        const voucher = vouchers[0];
        if (!voucher.is_active || voucher.used_analyses >= voucher.total_analyses) {
          setDiscountError(pick('Este código já não tem utilizações disponíveis.', 'This code has no uses left.', 'Este código ya no tiene usos disponibles.'));
          return;
        }
        if (couponProductKey === 'linkedin_roast' && voucher.voucher_type !== 'linkedin_roast') {
          setDiscountError(pick('Este voucher não é válido para o LinkedIn Roaster.', 'This voucher is not valid for LinkedIn Roaster.', 'Este cupón no es válido para LinkedIn Roaster.'));
          return;
        }
        if (couponProductKey === 'student_pack' && voucher.voucher_type !== 'student_pack') {
          setDiscountError(pick('Este voucher não é válido para o Pack Estudante.', 'This voucher is not valid for Student Pack.', 'Este cupón no es válido para Student Pack.'));
          return;
        }
        await fetch(`${SUPABASE_URL}/rest/v1/vouchers?id=eq.${voucher.id}`, {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ used_analyses: voucher.used_analyses + 1, is_active: (voucher.used_analyses + 1) < voucher.total_analyses }),
        });
        trackPurchase(productType, 0, `VOUCHER-${code}`);
        markPaid({ email: normalizedEmail, orderId: `VOUCHER-${code}`, paymentMethod: 'voucher', amount: 0, couponCode: code });
        return;
      }

      setDiscountError(pick('Código inválido ou expirado.', 'Invalid or expired code.', 'Código inválido o expirado.'));
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleMBWayPayment = async () => {
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;
    if (!phone.trim()) {
      setPaymentError(pick('Introduz o teu número de telemóvel.', 'Enter your phone number.', 'Introduce tu número de teléfono.'));
      return;
    }
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const orderId = `${productType === 'student_pack' ? 'STUDPACK' : 'ROAST'}-${Date.now()}`;
      const cleanPhone = phone.replace(/\s/g, '').replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('351') ? cleanPhone : (cleanPhone.length === 9 ? `351${cleanPhone}` : cleanPhone);
      localStorage.setItem(pendingOrderStorageKey, orderId);
      sessionStorage.setItem(pendingOrderStorageKey, orderId);
      if (accessTypeStorageKey) localStorage.setItem(accessTypeStorageKey, 'paid_pending');
      persistEmail(normalizedEmail);
      trackPaymentStart(productType, finalPrice);
      const response = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          phone: formattedPhone,
          mobileNumber: formattedPhone,
          amount: finalPrice.toFixed(2),
          email: normalizedEmail,
          product: `${productLabel} — Share2Inspire`,
          description: appliedCoupon ? `${productLabel} (${appliedCoupon.percent}% ${pick('desconto', 'discount', 'descuento')}: ${appliedCoupon.code})` : `${productLabel} — Share2Inspire`,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || pick('Erro ao iniciar pagamento.', 'Error starting payment.', 'Error al iniciar el pago.'));
      startPolling(orderId);
    } catch (error: any) {
      setPaymentError(error?.message || pick('Erro ao processar pagamento.', 'Error processing payment.', 'Error al procesar el pago.'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleStripePayment = async () => {
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const orderId = `${productType === 'student_pack' ? 'STUDPACK' : 'ROAST'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(pendingOrderStorageKey, orderId);
      sessionStorage.setItem(pendingOrderStorageKey, orderId);
      if (accessTypeStorageKey) localStorage.setItem(accessTypeStorageKey, 'paid_pending');
      persistEmail(normalizedEmail);
      trackPaymentStart(productType, finalPrice);
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0],
          amount: finalPrice,
          currency: 'eur',
          product_type: productType,
          language: window.location.pathname.startsWith('/en/') ? 'en' : window.location.pathname.startsWith('/es/') ? 'es' : 'pt',
          description: appliedCoupon ? `${productLabel} — Share2Inspire (${appliedCoupon.percent}% ${pick('desconto', 'discount', 'descuento')})` : `${productLabel} — Share2Inspire`,
          orderId,
          success_url: `${window.location.origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}${successPath}`,
        }),
      });
      const data = await response.json();
      if (!data?.url) throw new Error(data?.error || pick('Não foi possível abrir o checkout.', 'Could not open checkout.', 'No se pudo abrir el checkout.'));
      window.location.href = data.url;
    } catch (error: any) {
      setPaymentError(error?.message || pick('Erro ao abrir o checkout.', 'Error opening checkout.', 'Error al abrir el checkout.'));
      setPaymentLoading(false);
    }
  };

  const handlePayPalPayment = () => {
    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;
    persistEmail(normalizedEmail);
    trackPaymentStart(productType, finalPrice);
    const orderId = `${productType === 'student_pack' ? 'STUDPACK' : 'ROAST'}-PAYPAL-${Date.now()}`;
    window.open(`https://paypal.me/SamuelRolo/${finalPrice}EUR`, '_blank');
    if (typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', 'Purchase', { value: finalPrice, currency: 'EUR' });
    }
    trackPurchase(productType, finalPrice, orderId);
    markPaid({ email: normalizedEmail, orderId, paymentMethod: 'paypal', amount: finalPrice });
  };

  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    const status = await fetchPaymentStatus({ orderId: currentOrderId, expectedProductTypes: [productType] });
    if (status.success && status.paid) {
      markPaid({ email: status.email || email, orderId: status.order_id || currentOrderId, sessionId: status.session_id, paymentMethod: 'mbway', amount: status.amount || finalPrice });
      return;
    }
    setPollingExpired(true);
    setPollingMsg(pick('Pagamento ainda não confirmado. Tenta novamente dentro de instantes.', 'Payment not yet confirmed. Try again in a moment.', 'Pago todavía no confirmado. Inténtalo de nuevo en unos instantes.'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{pick('Desbloquear relatório completo', 'Unlock full report', 'Desbloquear informe completo')}</DialogTitle>
        </DialogHeader>

        {paymentStep === 'payment' && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${currentTheme.softBg} ${currentTheme.border}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${currentTheme.text}`}>{productLabel}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-600">{pick('Desbloqueio imediato após confirmação.', 'Immediate unlock after confirmation.', 'Desbloqueo inmediato tras la confirmación.')}</p>
                </div>
                <div className="text-right">
                  {appliedCoupon ? (
                    <>
                      <p className="text-sm line-through text-slate-400">{basePriceDisplay}</p>
                      <p className="text-2xl font-bold text-green-600">{finalPriceDisplay}</p>
                    </>
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">{basePriceDisplay}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="unlock-email" className="text-sm font-medium flex items-center gap-2"><Mail className="w-4 h-4 text-slate-500" /> {pick('E-mail', 'Email', 'Correo electrónico')}</label>
              <input id="unlock-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={pick('o-teu@email.com', 'your@email.com', 'tu@email.com')} className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30" />
            </div>

            <div className="space-y-2">
              <label htmlFor="unlock-discount" className="text-sm font-medium flex items-center gap-2"><Ticket className="w-4 h-4 text-slate-500" /> {pick('Cupão ou voucher', 'Coupon or voucher', 'Cupón o voucher')}</label>
              <div className="flex gap-2">
                <input id="unlock-discount" type="text" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder={pick('Código opcional', 'Optional code', 'Código opcional')} className="flex-1 h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30" />
                <Button type="button" variant="outline" onClick={handleApplyCode} disabled={discountLoading} className="h-11 rounded-xl">
                  {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : pick('Aplicar', 'Apply', 'Aplicar')}
                </Button>
              </div>
              {discountError && <p className="text-xs text-red-600">{discountError}</p>}
              {appliedCoupon && <p className="text-xs text-green-600">{pick('Código aplicado:', 'Code applied:', 'Código aplicado:')} <span className="font-semibold">{appliedCoupon.code}</span> — {appliedCoupon.percent}%</p>}
            </div>

            {window.location.pathname.startsWith('/en/') || window.location.pathname.startsWith('/es/') ? null : (
              <div className="grid grid-cols-3 gap-2">
                <Button type="button" variant={paymentMethod === 'mbway' ? 'default' : 'outline'} onClick={() => setPaymentMethod('mbway')} className={`h-11 rounded-xl ${paymentMethod === 'mbway' ? currentTheme.accentBtn + ' text-white' : ''}`}>
                  MB WAY
                </Button>
                <Button type="button" variant={paymentMethod === 'stripe' ? 'default' : 'outline'} onClick={() => setPaymentMethod('stripe')} className={`h-11 rounded-xl ${paymentMethod === 'stripe' ? currentTheme.accentBtn + ' text-white' : ''}`}>
                  Cartão
                </Button>
                <Button type="button" variant={paymentMethod === 'paypal' ? 'default' : 'outline'} onClick={() => setPaymentMethod('paypal')} className={`h-11 rounded-xl ${paymentMethod === 'paypal' ? 'bg-[#0070ba] hover:bg-[#005ea6] text-white' : ''}`}>
                  PayPal
                </Button>
              </div>
            )}

            {paymentMethod === 'mbway' && !(window.location.pathname.startsWith('/en/') || window.location.pathname.startsWith('/es/')) && (
              <div className="space-y-2">
                <label htmlFor="unlock-phone" className="text-sm font-medium flex items-center gap-2"><Smartphone className="w-4 h-4 text-slate-500" /> {pick('Telemóvel', 'Phone', 'Teléfono')}</label>
                <input id="unlock-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={pick('912345678', 'Phone number', 'Número de teléfono')} className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30" />
              </div>
            )}

            {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}

            <div className="space-y-2">
              {paymentMethod === 'mbway' && !(window.location.pathname.startsWith('/en/') || window.location.pathname.startsWith('/es/')) ? (
                <Button type="button" onClick={handleMBWayPayment} disabled={paymentLoading} className={`w-full h-12 rounded-xl text-white ${currentTheme.accentBtn}`}>
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : pick(`Pagar ${finalPriceDisplay} com MB WAY`, `Pay ${finalPriceDisplay} with MB WAY`, `Pagar ${finalPriceDisplay} con MB WAY`)}
                </Button>
              ) : paymentMethod === 'paypal' ? (
                <Button type="button" onClick={handlePayPalPayment} className="w-full h-12 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white">
                  {pick('Pagar com PayPal', 'Pay with PayPal', 'Pagar con PayPal')}
                </Button>
              ) : (
                <Button type="button" onClick={handleStripePayment} disabled={paymentLoading} className={`w-full h-12 rounded-xl text-white ${currentTheme.accentBtn}`}>
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : pick(`Pagar ${finalPriceDisplay} com Cartão`, `Pay ${finalPriceDisplay} with Card`, `Pagar ${finalPriceDisplay} con Tarjeta`)}
                </Button>
              )}
            </div>
          </div>
        )}

        {paymentStep === 'polling' && (
          <div className="py-4 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C9A961]" />
            <p className="text-sm text-slate-600">{pollingMsg || pick('A aguardar confirmação do pagamento...', 'Waiting for payment confirmation...', 'Esperando confirmación del pago...')}</p>
            {pollingExpired && (
              <Button type="button" variant="outline" onClick={handleManualCheck} className="rounded-xl">
                {pick('Já paguei — verificar novamente', 'I already paid — verify again', 'Ya pagué — verificar de nuevo')}
              </Button>
            )}
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="py-4 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-sm text-slate-600">{pick('Pagamento confirmado. O relatório completo está desbloqueado.', 'Payment confirmed. The full report is now unlocked.', 'Pago confirmado. El informe completo ya está desbloqueado.')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
