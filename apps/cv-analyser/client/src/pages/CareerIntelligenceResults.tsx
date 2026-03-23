// CareerIntelligenceResults.tsx
// Dedicated results page for Career Intelligence — fully independent from Career Path
// Shows: Profile, Market Context, 3 Strategic Paths, Action Plan, Comparison, Trade-offs, Decision

import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, ArrowLeft, Home as HomeIcon, CheckCircle2,
  Lock, Target, Sparkles, Briefcase, Globe, Linkedin,
  ExternalLink, TrendingUp, Award, AlertCircle,
  Zap, BarChart3, Download, Copy, Scale, Compass,
  Mail, Send, Ticket, Unlock, Save
} from "lucide-react";
import { trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion } from "@/lib/affiliate";

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

/** Save analysis to user_analyses for area-cliente dashboard */
async function saveToUserAnalyses(analysisType: string, data: Record<string, any>): Promise<boolean> {
  const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  if (!storageKey) throw new Error('NOT_LOGGED_IN');
  const stored = localStorage.getItem(storageKey);
  if (!stored) throw new Error('NOT_LOGGED_IN');
  const parsed = JSON.parse(stored);
  let accessToken = parsed?.access_token;
  const refreshToken = parsed?.refresh_token;
  const userId = parsed?.user?.id;
  if (!accessToken || !userId) throw new Error('NOT_LOGGED_IN');
  const dedupKey = `s2i_saved_${analysisType}_${Date.now()}`;
  if (sessionStorage.getItem(dedupKey)) return true;
  const payload = { user_id: userId, analysis_type: analysisType, data: { ...data, captured_at: new Date().toISOString() }, created_at: new Date().toISOString() };
  let res = await fetch(`${SUPABASE_URL}/rest/v1/user_analyses`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(payload)
  });
  if (res.status === 401 && refreshToken) {
    console.log('[S2I] Access token expired, attempting refresh...');
    const refreshRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (refreshRes.ok) {
      const newSession = await refreshRes.json();
      accessToken = newSession.access_token;
      localStorage.setItem(storageKey, JSON.stringify(newSession));
      res = await fetch(`${SUPABASE_URL}/rest/v1/user_analyses`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(payload)
      });
    } else { throw new Error('SESSION_EXPIRED'); }
  }
  if (res.ok) { sessionStorage.setItem(dedupKey, 'true'); console.log('[S2I] Analysis saved:', analysisType); return true; }
  throw new Error(res.status === 401 ? 'SESSION_EXPIRED' : `SAVE_FAILED_${res.status}`);
}

/* ─── Gold Icon wrapper ─── */
function GoldIcon({ children, size = "w-10 h-10" }: { children: React.ReactNode; size?: string }) {
  return (
    <div className={`${size} rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0`}>
      {children}
    </div>
  );
}

export default function CareerIntelligenceResults() {
  useEffect(() => { document.title = "Career Intelligence — Resultados | Share2Inspire"; }, []);

  const [, setLocation] = useLocation();

  // Analysis data
  const [cvAnalysis, setCvAnalysis] = useState<any>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [careerData, setCareerData] = useState<any>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Post sharing
  const [postCopied, setPostCopied] = useState(false);

  // Email report
  const [reportEmail, setReportEmail] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Save to Área de Cliente
  const [savingToAccount, setSavingToAccount] = useState(false);
  const [savedToAccount, setSavedToAccount] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try { const p = JSON.parse(stored); if (p?.access_token && p?.user?.id) setIsLoggedIn(true); } catch {}
      }
    }
  }, []);

  const handleSaveToAccount = async () => {
    setSavingToAccount(true);
    setSaveError(null);
    try {
      await saveToUserAnalyses('career_intelligence', {
        strategic_paths: careerData?.strategic_paths || [],
        decision_recommendation: careerData?.decision_recommendation || {},
        market_context: careerData?.market_context || {},
        career_potential_score: careerData?.career_potential_score || {},
        career_goal: sessionStorage.getItem('careerGoal') || '',
        results_html: document.querySelector('.career-intelligence-results')?.innerHTML || '',
      });
      setSavedToAccount(true);
    } catch (err: any) {
      if (err?.message === 'SESSION_EXPIRED' || err?.message === 'NOT_LOGGED_IN') {
        setSaveError(isEN ? 'Session expired. Please log in again in your Account area and return here.' : 'Sessão expirada. Faz login novamente na Área de Cliente e volta aqui.');
        setIsLoggedIn(false);
      } else {
        setSaveError(isEN ? 'Error saving. Try again.' : 'Erro ao guardar. Tenta novamente.');
      }
    } finally {
      setSavingToAccount(false);
    }
  };

  const genMessagesPT = [
    "A analisar o teu perfil profissional...",
    "A mapear competências e experiência...",
    "A identificar caminhos estratégicos...",
    "A calcular probabilidades de sucesso...",
    "A avaliar trade-offs por caminho...",
    "A comparar cenários de carreira...",
    "A construir a recomendação de decisão...",
    "A gerar o teu relatório Career Intelligence...",
  ];
  const genMessagesEN = [
    "Analysing your professional profile...",
    "Mapping competencies and experience...",
    "Identifying strategic career paths...",
    "Calculating success probabilities...",
    "Evaluating trade-offs per path...",
    "Comparing career scenarios...",
    "Building your decision recommendation...",
    "Generating your Career Intelligence report...",
  ];

  useEffect(() => {
    if (!isGenerating) { setGenStep(0); return; }
    const interval = setInterval(() => {
      setGenStep(prev => prev < genMessagesPT.length - 1 ? prev + 1 : prev);
    }, 5000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const [isEN] = useState(() => {
    const pathIsEN = window.location.pathname.startsWith('/en/');
    if (pathIsEN) return true;
    return sessionStorage.getItem('analysisLang') === 'en';
  });

  const CUR = isEN ? '$' : '€';
  const CURRENCY_CODE = isEN ? 'USD' : 'EUR';

  /** Clean currency in salary strings: strip duplicates, convert $ to € in PT, fix symbol position */
  const cleanCurrency = (s: string) => {
    if (!s) return s;
    let cleaned = s.replace(/€€+/g, '€').replace(/\$\$+/g, '$');
    if (!isEN) {
      cleaned = cleaned.replace(/\$/g, '€');
      cleaned = cleaned.replace(/USD/gi, 'EUR');
    } else {
      cleaned = cleaned.replace(/€/g, '$');
      cleaned = cleaned.replace(/EUR/gi, 'USD');
    }
    cleaned = cleaned.replace(/€€+/g, '€').replace(/\$\$+/g, '$');
    return cleaned;
  };

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Discount code state
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'polling' | 'success'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>(isEN ? 'stripe' : 'mbway');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // ─── Load data from sessionStorage ───
  useEffect(() => {
    const cvData = sessionStorage.getItem('careerPathCvAnalysis');
    const linkedin = sessionStorage.getItem('careerPathLinkedinUrl');
    const paidFlag = sessionStorage.getItem('careerPathPaid');
    const savedData = sessionStorage.getItem('careerPathData');

    if (!cvData) {
      setLocation('/');
      return;
    }

    try {
      setCvAnalysis(JSON.parse(cvData));
    } catch {
      setLocation('/');
      return;
    }

    if (linkedin) setLinkedinUrl(linkedin);

    if (paidFlag === 'true' && savedData) {
      try {
        setCareerData(JSON.parse(savedData));
        setIsPaid(true);
      } catch { /* ignore */ }
    } else if (paidFlag === 'true' && !savedData) {
      setIsPaid(true);
      setTimeout(() => { generateAnalysis(); }, 300);
    }

    // Check for Stripe payment return
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    // Handle cancelled payment — clean URL and redirect to home
    if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
      setLocation('/');
      return;
    }

    if (paymentStatus === 'success' && sessionId) {
      fetch(`${BACKEND_URL}/api/payment/stripe-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).then(res => res.json()).then(data => {
        if (data.paid) {
          const stripeAmount = data.amount || 49;
          const productType = data.product_type || 'career_intelligence_full';
          if (productType === 'career_intelligence_full') {
            sessionStorage.setItem('careerPathPaid', 'true');
            sessionStorage.setItem('careerIntelligenceProPaid', 'true');
            sessionStorage.setItem('careerIntelligenceFull', 'true');
            trackPurchase('career_intelligence_full', stripeAmount, `CI-STRIPE-${sessionId}`);
            trackAffiliateConversion({ product: 'career_intelligence_full', amount: stripeAmount, currency: isEN ? 'USD' : 'EUR', payment_method: 'stripe', transaction_id: `CI-STRIPE-${sessionId}` });
          }
          setIsPaid(true);
          generateAnalysis();
          window.history.replaceState({}, '', window.location.pathname);
        }
      }).catch(() => {});
    }
  }, []);

  // ─── Generate Career Intelligence analysis ───
  const generateAnalysis = useCallback(async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const cvText = sessionStorage.getItem('careerPathCvText') || '';
      const response = await fetch(`${SUPABASE_URL}/functions/v1/hyper-task`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'career_path',
          cv_text: cvText,
          linkedin_url: linkedinUrl || undefined,
          language: sessionStorage.getItem('analysisLang') || 'pt',
          country: sessionStorage.getItem('analysisCountry') || undefined,
          region: sessionStorage.getItem('analysisRegion') || undefined,
        }),
      });

      const data = await response.json();
      if (!data.success && !data.career_path) {
        throw new Error(data.error || (isEN ? 'Error generating Career Intelligence' : 'Erro ao gerar Career Intelligence'));
      }

      const ciData = data.career_path || data;
      setCareerData(ciData);
      setIsPaid(true);
      sessionStorage.setItem('careerPathPaid', 'true');
      sessionStorage.setItem('careerPathData', JSON.stringify(ciData));

      // Save to user_analyses for area-cliente
      // Delay to capture HTML after React renders the full results
      setTimeout(async () => {
        try {
          await saveToUserAnalyses('career_intelligence', {
            strategic_paths: ciData.strategic_paths || [],
            decision_recommendation: ciData.decision_recommendation || {},
            market_context: ciData.market_context || {},
            career_potential_score: ciData.career_potential_score || {},
            career_goal: sessionStorage.getItem('careerGoal') || '',
            results_html: document.querySelector('.career-intelligence-results')?.innerHTML || '',
          });
          setSavedToAccount(true);
        } catch (e: any) {
          console.warn('[S2I] Auto-save after generation failed:', e?.message);
        }
      }, 1500);
    } catch (err: any) {
      setGenerateError(err.message || (isEN ? 'Error generating Career Intelligence. Try again.' : 'Erro ao gerar Career Intelligence. Tenta novamente.'));
    } finally {
      setIsGenerating(false);
    }
  }, [linkedinUrl]);

  // ─── Discount code validation ───
  const handleDiscountSubmit = async () => {
    if (!discountCode.trim()) { setDiscountError(isEN ? 'Enter a code' : 'Introduz um código'); return; }
    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      // Check discount_coupons
      const couponRes = await fetch(
        `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,max_uses,current_uses,valid_from,valid_until,applicable_products`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError(isEN ? 'This code is not yet active.' : 'Este código ainda não está ativo.'); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError(isEN ? 'This code has expired.' : 'Este código já expirou.'); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError(isEN ? 'This code has reached its usage limit.' : 'Este código atingiu o limite.'); return; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('career_intelligence') && !products.includes('career_intelligence_full')) {
          setDiscountError(isEN ? 'This code is not applicable here.' : 'Este código não é aplicável aqui.'); return;
        }
        if (coupon.discount_percent === 100) {
          trackPurchase('career_intelligence_full', 0, `COUPON-${code}`);
          trackAffiliateConversion({ product: 'career_intelligence_full', amount: 0, currency: isEN ? 'USD' : 'EUR', payment_method: 'coupon', transaction_id: `COUPON-${code}` });
          sessionStorage.setItem('careerPathPaid', 'true');
          sessionStorage.setItem('careerIntelligenceProPaid', 'true');
          sessionStorage.setItem('careerIntelligenceFull', 'true');
          setIsPaid(true);
          setShowDiscountModal(false);
          setTimeout(() => { generateAnalysis(); }, 300);
          return;
        }
        // Partial discount — not yet handled for CI full, just show error
        setDiscountError(isEN ? 'Partial discounts are not available for this product.' : 'Descontos parciais não estão disponíveis para este produto.');
        return;
      }

      // Check vouchers
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const v = rows[0];
        if (!v.is_active) { setDiscountError(isEN ? 'This code has already been used' : 'Este código já foi utilizado'); return; }
        if (v.used_analyses >= v.total_analyses) { setDiscountError(isEN ? 'This code has no remaining uses' : 'Este código já não tem utilizações disponíveis'); return; }
        if (v.voucher_type !== 'career_intelligence' && v.voucher_type !== 'career_intelligence_full' && v.voucher_type !== 'complete') {
          setDiscountError(isEN ? 'This code is not valid for Career Intelligence' : 'Este código não é válido para o Career Intelligence'); return;
        }
        await fetch(
          `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${v.id}`,
          {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ used_analyses: (v.used_analyses || 0) + 1, is_active: ((v.used_analyses || 0) + 1) < v.total_analyses }),
          }
        );
        trackPurchase('career_intelligence_full', 0, `CI-VOUCHER-${code}`);
        trackAffiliateConversion({ product: 'career_intelligence_full', amount: 0, currency: isEN ? 'USD' : 'EUR', payment_method: 'voucher', transaction_id: `CI-VOUCHER-${code}` });
        sessionStorage.setItem('careerPathPaid', 'true');
        sessionStorage.setItem('careerIntelligenceProPaid', 'true');
        sessionStorage.setItem('careerIntelligenceFull', 'true');
        setIsPaid(true);
        setShowDiscountModal(false);
        setTimeout(() => { generateAnalysis(); }, 300);
        return;
      }

      setDiscountError(isEN ? 'Invalid or expired code' : 'Código inválido ou expirado');
    } catch (err: any) {
      setDiscountError(err.message || (isEN ? 'Error validating code' : 'Erro ao validar código'));
    } finally {
      setDiscountLoading(false);
    }
  };

  // ─── Payment handlers ───
  const CI_PRICE = isEN ? 49 : 49;
  const CI_PRICE_DISPLAY = isEN ? `$${CI_PRICE}` : `${CI_PRICE}€`;

  const openPaymentModal = () => {
    setPaymentStep('payment');
    setPaymentError(null);
    setPaymentMethod(isEN ? 'stripe' : 'mbway');
    setShowPaymentModal(true);
  };

  const handleMBWayPayment = async () => {
    if (!email) { setPaymentError(isEN ? 'Enter your email' : 'Introduz o teu email'); return; }
    if (!phone) { setPaymentError(isEN ? 'Enter your phone number' : 'Introduz o teu número de telemóvel'); return; }
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const orderId = `CI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ciOrderId', orderId);
      sessionStorage.setItem('cpPaymentEmail', email);
      const response = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: (() => { const p = phone.replace(/\D/g, '').replace(/^(\+?351)/, ''); return `351${p}`; })(),
          orderId,
          amount: CI_PRICE.toFixed(2),
          paymentMethod: 'mbway',
          description: 'Share2Inspire - Career Intelligence',
          name: email.split('@')[0],
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || (isEN ? 'Error initiating payment' : 'Erro ao iniciar pagamento'));
      setPaymentStep('polling');
      setPollingMsg(isEN ? 'Confirm the payment in the MB WAY app on your phone...' : 'Confirma o pagamento na app MB WAY do teu telemóvel...');
      startPolling(orderId);
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError('Please enter your email'); return; }
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const orderId = `CI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          product_type: 'career_intelligence_full',
          orderId,
          language: isEN ? 'en' : 'pt',
          currency: CURRENCY_CODE.toLowerCase(),
          amount: CI_PRICE,
        }),
      });
      const data = await response.json();
      if (!data.success || !data.url) throw new Error(data.error || 'Error creating checkout session');
      sessionStorage.setItem('ciOrderId', orderId);
      sessionStorage.setItem('cpPaymentEmail', email);
      sessionStorage.setItem('stripeSessionId', data.sessionId);
      window.location.href = data.url;
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!email) { setPaymentError(isEN ? 'Enter your email' : 'Introduz o teu email'); return; }
    sessionStorage.setItem('cpPaymentEmail', email);
    window.open(`https://paypal.me/SamuelRolo/${CI_PRICE}${CURRENCY_CODE}`, '_blank');
    setPaymentStep('success');
  };

  const startPolling = (orderId: string) => {
    let attempts = 0;
    let consecutiveErrors = 0;
    const startTime = Date.now();
    setCurrentOrderId(orderId);
    setPollingExpired(false);
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        if (!res.ok) { consecutiveErrors++; if (consecutiveErrors >= 8) { clearInterval(interval); setPollingExpired(true); } return; }
        consecutiveErrors = 0;
        const data = await res.json();
        if (data.paid) {
          clearInterval(interval);
          unlockAndGenerate(orderId);
          return;
        }
        const elapsed = Date.now() - startTime;
        if (data.expired && elapsed > 90000) {
          clearInterval(interval);
          setPollingExpired(true);
          setPollingMsg(isEN ? 'Payment expired. Use the button below if you already paid.' : 'O pagamento expirou. Usa o botão abaixo se já pagaste.');
          return;
        }
        if (elapsed < 30000) setPollingMsg(isEN ? 'Confirm the payment in the MB WAY app...' : 'Confirma o pagamento na app MB WAY...');
        else if (elapsed < 60000) setPollingMsg(isEN ? 'Still waiting... Check the MB WAY app.' : 'Ainda a aguardar... Verifica a app MB WAY.');
        else setPollingMsg(isEN ? 'Waiting for confirmation...' : 'A aguardar confirmação...');
        if (attempts >= 60) { clearInterval(interval); setPollingExpired(true); }
      } catch { consecutiveErrors++; }
    }, 5000);
  };

  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMsg(isEN ? 'Checking payment...' : 'A verificar pagamento...');
    setPollingExpired(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentOrderId }),
      });
      const data = await res.json();
      if (data.paid) { unlockAndGenerate(currentOrderId); }
      else {
        setPollingExpired(true);
        setPollingMsg(isEN ? 'Payment not yet confirmed. Try again.' : 'Pagamento ainda não confirmado. Tenta novamente.');
      }
    } catch {
      setPollingExpired(true);
      setPollingMsg(isEN ? 'Error checking. Try again.' : 'Erro ao verificar. Tenta novamente.');
    }
  };

  const unlockAndGenerate = (orderId: string) => {
    setShowPaymentModal(false);
    sessionStorage.setItem('careerPathPaid', 'true');
    sessionStorage.setItem('careerIntelligenceProPaid', 'true');
    sessionStorage.setItem('careerIntelligenceFull', 'true');
    trackPurchase('career_intelligence_full', CI_PRICE, orderId);
    trackAffiliateConversion({ product: 'career_intelligence_full', amount: CI_PRICE, currency: isEN ? 'USD' : 'EUR', payment_method: paymentMethod, transaction_id: orderId });
    setIsPaid(true);
    setTimeout(() => { generateAnalysis(); }, 400);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    await new Promise(resolve => setTimeout(resolve, 350));
    await generateAnalysis();
  };

  // ─── Send report by email ───
  const handleSendReport = async () => {
    const targetEmail = reportEmail || email || sessionStorage.getItem('cpPaymentEmail') || '';
    if (!targetEmail) { setReportError(isEN ? 'Enter a valid email.' : 'Introduz um email válido.'); return; }
    setReportSending(true);
    setReportError(null);
    try {
      const ciEmailRoute = isEN ? 'send-career-intelligence-email-en' : 'send-career-intelligence-email';
      await fetch(`${BACKEND_URL}/api/payment/${ciEmailRoute}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetEmail.split('@')[0],
          careerIntelligenceData: careerData,
        }),
      });
      setReportSent(true);
    } catch {
      setReportError(isEN ? 'Error sending email. Try again.' : 'Erro ao enviar email. Tenta novamente.');
    } finally {
      setReportSending(false);
    }
  };

  if (!cvAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A961]" />
      </div>
    );
  }

  const profileName = cvAnalysis.name || cvAnalysis.candidate_name || 'o teu perfil';
  const currentRole = cvAnalysis.current_role || cvAnalysis.perceivedRole || 'Profissional';
  const seniority = cvAnalysis.perceivedSeniority || cvAnalysis.seniority || '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{isEN ? 'Back' : 'Voltar'}</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <GoldIcon size="w-6 h-6 sm:w-7 sm:h-7">
                <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C9A961]" />
              </GoldIcon>
              <span className="text-sm sm:text-base font-semibold text-foreground">Career Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isPaid ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                <span className="text-xs sm:text-sm font-semibold text-green-600">{isEN ? 'Full Report' : 'Relatório Completo'}</span>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setShowDiscountModal(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm font-medium border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/5"
                >
                  <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">{isEN ? 'I have a code' : 'Tenho código'}</span>
                  <span className="sm:hidden">{isEN ? 'Code' : 'Código'}</span>
                </Button>
                <Button
                  onClick={() => openPaymentModal()}
                  size="sm"
                  className="bg-[#C9A961] hover:bg-[#A88B4E] text-white text-xs sm:text-sm font-semibold px-3 sm:px-5 py-1.5 sm:py-2"
                >
                  <span className="hidden sm:inline">{isEN ? 'Unlock Analysis' : 'Desbloquear Análise'}</span>
                  <span className="sm:hidden">{isEN ? 'Unlock' : 'Desbloquear'}</span>
                </Button>
              </>
            )}
            <a
              href="https://www.share2inspire.pt"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <HomeIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Hero Profile Card */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/[0.03] via-[#C9A961]/[0.08] to-foreground/[0.03]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,169,97,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(201,169,97,0.05) 0%, transparent 50%)' }} />
          
          <div className="relative px-6 sm:px-8 py-8 sm:py-10">
            <div className="flex justify-between items-start mb-6">
              {isPaid ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-green-600">{isEN ? 'Career Intelligence Report' : 'Relatório Career Intelligence'}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                  <span className="text-xs font-semibold text-[#C9A961]">{isEN ? 'Preview' : 'Pré-visualização'}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">{profileName}</h1>
              <p className="text-base sm:text-lg text-muted-foreground font-medium">
                {currentRole}
                {seniority && <span className="text-[#C9A961] font-semibold"> · {seniority}</span>}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
                <Briefcase className="w-3.5 h-3.5 text-[#C9A961]" />
                <span className="text-xs font-medium text-foreground">{currentRole}</span>
              </div>
              {seniority && (
                <div className="flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
                  <TrendingUp className="w-3.5 h-3.5 text-[#C9A961]" />
                  <span className="text-xs font-medium text-foreground">{seniority}</span>
                </div>
              )}
              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 hover:border-[#0077B5]/30 transition-colors">
                  <Linkedin className="w-3.5 h-3.5 text-[#0077B5]" />
                  <span className="text-xs font-medium text-[#0077B5]">LinkedIn</span>
                </a>
              )}
            </div>
          </div>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A961]/40 to-transparent" />
        </div>

        {/* Generating state */}
        {isGenerating && (
          <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/10 border-2 border-[#C9A961]/20 rounded-2xl p-8 sm:p-10 text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#C9A961]/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#C9A961] animate-spin" />
              <Scale className="absolute inset-0 m-auto w-6 h-6 text-[#C9A961]" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-foreground transition-all duration-500">
                {isEN ? genMessagesEN[genStep] : genMessagesPT[genStep]}
              </p>
              <p className="text-xs text-muted-foreground">
                {isEN ? `Step ${genStep + 1} of ${genMessagesEN.length}` : `Passo ${genStep + 1} de ${genMessagesPT.length}`}
              </p>
            </div>
            <div className="max-w-sm mx-auto">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C9A961] to-[#E8D5A3] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(((genStep + 1) / genMessagesPT.length) * 100, 95)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60">
              {isEN ? 'This may take up to 60 seconds' : 'Isto pode demorar até 60 segundos'}
            </p>
          </div>
        )}

        {/* Error state */}
        {generateError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{isEN ? 'Error generating Career Intelligence' : 'Erro ao gerar Career Intelligence'}</p>
              <p>{generateError}</p>
              <button onClick={generateAnalysis} className="mt-2 text-red-600 underline text-xs">{isEN ? 'Try again' : 'Tentar novamente'}</button>
            </div>
          </div>
        )}

        {/* ═══ PAID CONTENT — Career Intelligence Results ═══ */}
        {isPaid && careerData && !isGenerating && (
          <div className="career-intelligence-results space-y-6">

            {/* Market Context */}
            {careerData.market_context && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Globe className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'MARKET CONTEXT' : 'CONTEXTO DE MERCADO'}</p>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{isEN ? 'ALIGNED COMPANIES' : 'EMPRESAS ALINHADAS'}</p>
                    <p className="text-xs text-muted-foreground">{careerData.market_context.aligned_companies}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/20 rounded-lg border border-border">
                      <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{isEN ? 'DEMAND LEVEL' : 'NÍVEL DE PROCURA'}</p>
                      <p className="text-xs text-muted-foreground">{careerData.market_context.demand_level}</p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg border border-border">
                      <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{isEN ? 'COMPETITIVENESS' : 'COMPETITIVIDADE'}</p>
                      <p className="text-xs text-muted-foreground">{careerData.market_context.competitiveness}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-[#C9A961]/5 to-transparent rounded-lg border border-[#C9A961]/20">
                    <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{isEN ? 'WHAT SETS YOU APART' : 'O QUE TE DIFERENCIA'}</p>
                    <p className="text-xs text-muted-foreground">{careerData.market_context.differentiator}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Strategic Career Paths */}
            {careerData.strategic_paths && careerData.strategic_paths.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Compass className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'STRATEGIC CAREER PATHS' : 'CAMINHOS ESTRATÉGICOS DE CARREIRA'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{isEN ? 'Three distinct paths based on your profile' : 'Três caminhos distintos baseados no teu perfil'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {careerData.strategic_paths.map((path: any, i: number) => (
                    <div key={i} className="border border-border rounded-xl overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{isEN ? 'PATH' : 'CAMINHO'} {i + 1}</span>
                          <span className="text-sm font-semibold text-foreground">{path.name}</span>
                        </div>
                        {path.success_probability && (
                          <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            {path.success_probability}% {isEN ? 'success' : 'sucesso'}
                          </span>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm text-muted-foreground">{path.logic}</p>
                        <div className="p-2 bg-muted/20 rounded-lg">
                          <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{isEN ? 'IDEAL FOR' : 'IDEAL PARA'}</p>
                          <p className="text-xs text-muted-foreground">{path.ideal_for}</p>
                        </div>
                        {path.associated_roles && path.associated_roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {path.associated_roles.map((role: string, j: number) => (
                              <span key={j} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{role}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan by Path */}
            {careerData.action_plan_by_path && careerData.action_plan_by_path.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Target className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'ACTION PLAN BY PATH' : 'PLANO DE ACÇÃO POR CAMINHO'}</p>
                </div>
                <div className="space-y-4">
                  {careerData.action_plan_by_path.map((plan: any, i: number) => (
                    <div key={i} className="border border-border rounded-xl overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center gap-2">
                        <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{isEN ? 'PATH' : 'CAMINHO'} {i + 1}</span>
                        <span className="text-sm font-semibold text-foreground">{plan.path_name}</span>
                        {plan.is_recommended && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            {isEN ? 'Recommended' : 'Recomendado'}
                          </span>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        {plan.actions && plan.actions.map((action: any, j: number) => (
                          <div key={j} className="flex items-start gap-3 p-2 border border-border/50 rounded-lg">
                            <span className="text-[10px] font-bold text-white bg-[#C9A961] px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                              {action.timeframe}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{action.action}</p>
                              {action.is_critical === true && (
                                <span className="text-[10px] text-amber-600 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{isEN ? 'Key step' : 'Passo-chave'}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Comparison */}
            {careerData.strategic_comparison && careerData.strategic_comparison.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><BarChart3 className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'STRATEGIC COMPARISON' : 'COMPARAÇÃO ESTRATÉGICA'}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">{isEN ? 'Criteria' : 'Critério'}</th>
                        {careerData.strategic_comparison.map((item: any, i: number) => (
                          <th key={i} className="text-center py-2 px-2 font-semibold text-foreground">{item.path_name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'success_probability', label: isEN ? 'Success probability' : 'Probabilidade de sucesso', suffix: '%' },
                        { key: 'estimated_time', label: isEN ? 'Estimated time' : 'Tempo estimado', suffix: '' },
                        { key: 'effort_level', label: isEN ? 'Effort' : 'Esforço', suffix: '' },
                        { key: 'risk_level', label: isEN ? 'Risk' : 'Risco', suffix: '' },
                        { key: 'salary_impact', label: isEN ? 'Salary impact' : 'Impacto salarial', suffix: '' },
                        { key: 'profile_fit', label: isEN ? 'Profile fit' : 'Alinhamento', suffix: '' },
                      ].map((row) => (
                        <tr key={row.key} className="border-b border-border/50">
                          <td className="py-2 pr-3 text-muted-foreground font-medium">{row.label}</td>
                          {careerData.strategic_comparison.map((item: any, i: number) => (
                            <td key={i} className="text-center py-2 px-2 text-foreground">
                              {row.key === 'salary_impact' ? cleanCurrency(String(item[row.key] || '')) : item[row.key]}{row.suffix}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Trade-offs */}
            {careerData.tradeoffs && careerData.tradeoffs.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Scale className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'TRADE-OFFS BY PATH' : 'TRADE-OFFS POR CAMINHO'}</p>
                </div>
                <div className="space-y-4">
                  {careerData.tradeoffs.map((t: any, i: number) => (
                    <div key={i} className="border border-border rounded-xl p-3 space-y-3">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{i + 1}</span>
                        {t.path_name}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                          <p className="text-[10px] font-semibold text-green-600 mb-1">{isEN ? 'YOU GAIN' : 'GANHAS'}</p>
                          <p className="text-xs text-muted-foreground">{t.you_gain}</p>
                        </div>
                        <div className="p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                          <p className="text-[10px] font-semibold text-red-500 mb-1">{isEN ? 'YOU GIVE UP' : 'ABDICAS'}</p>
                          <p className="text-xs text-muted-foreground">{t.you_give_up}</p>
                        </div>
                      </div>
                      <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                        <p className="text-[10px] font-semibold text-amber-600 mb-1">{isEN ? 'HIDDEN RISK' : 'RISCO OCULTO'}</p>
                        <p className="text-xs text-muted-foreground">{t.hidden_risk}</p>
                      </div>
                      <div className="p-2 bg-muted/20 rounded-lg">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1">{isEN ? 'REAL SCENARIO' : 'CENÁRIO REAL'}</p>
                        <p className="text-xs text-muted-foreground">{t.real_scenario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Recommendation */}
            {careerData.decision_recommendation && (
              <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/15 border-2 border-[#C9A961]/30 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Zap className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? 'RECOMMENDED DECISION' : 'DECISÃO RECOMENDADA'}</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="text-sm font-bold text-foreground mb-2">{careerData.decision_recommendation.recommended_path}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{careerData.decision_recommendation.justification}</p>
                </div>
                {careerData.decision_recommendation.when_to_switch && (
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="text-[10px] font-semibold text-amber-600 mb-1">{isEN ? 'WHEN TO CONSIDER ANOTHER PATH' : 'QUANDO CONSIDERAR OUTRO CAMINHO'}</p>
                    <p className="text-xs text-muted-foreground">{careerData.decision_recommendation.when_to_switch}</p>
                  </div>
                )}
                {careerData.decision_recommendation.why_better_than_others && (
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="text-[10px] font-semibold text-green-600 mb-1">{isEN ? 'WHY THIS PATH IS BEST FOR YOU' : 'PORQUE ESTE CAMINHO É O MELHOR PARA TI'}</p>
                    <p className="text-xs text-muted-foreground">{careerData.decision_recommendation.why_better_than_others}</p>
                  </div>
                )}
              </div>
            )}

            {/* Cross-sell: Career Path */}
            <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <GoldIcon>
                  <Compass className="w-5 h-5 text-[#C9A961]" />
                </GoldIcon>
                <div>
                  <p className="text-base font-semibold text-foreground">{isEN ? 'Want a detailed career roadmap?' : 'Queres um roadmap detalhado de carreira?'}</p>
                  <p className="text-xs text-muted-foreground">{isEN ? 'Career Path gives you next roles, training, certifications, networking strategy and 5-year vision' : 'O Career Path dá-te próximos cargos, formações, certificações, estratégia de networking e visão a 5 anos'}</p>
                </div>
              </div>
              <a
                href={isEN ? '/en/career-path' : '/career-path'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
              >
                <Compass className="w-4 h-4" />
                {isEN ? 'Try Career Path' : 'Experimentar Career Path'}
              </a>
            </div>

            {/* Send by email */}
            <div className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-8 space-y-5">
              <div className="flex items-center gap-3">
                <GoldIcon>
                  <Mail className="w-5 h-5 text-[#C9A961]" />
                </GoldIcon>
                <div>
                  <p className="text-base font-semibold text-foreground">{isEN ? 'Receive Career Intelligence by Email' : 'Receber Career Intelligence por Email'}</p>
                  <p className="text-xs text-muted-foreground">{isEN ? 'Send the full report to your email' : 'Envia o relatório completo para o teu email'}</p>
                </div>
              </div>
              {reportSent ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <p className="text-sm text-green-600">{isEN ? 'Report sent successfully! Check your inbox (and spam folder).' : 'Relatório enviado com sucesso! Verifica a tua caixa de email (e spam).'}</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={reportEmail || email || sessionStorage.getItem('cpPaymentEmail') || ''}
                      onChange={(e) => setReportEmail(e.target.value)}
                      placeholder={isEN ? 'your@email.com' : 'seu@email.com'}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                    />
                    <Button
                      onClick={handleSendReport}
                      disabled={reportSending}
                      className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold px-6"
                    >
                      {reportSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />{isEN ? 'Send' : 'Enviar'}</>}
                    </Button>
                  </div>
                  {reportError && <p className="text-sm text-red-500">{reportError}</p>}
                </>
              )}
            </div>

            {/* ═══ Save to Área de Cliente ═══ */}
            <div className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-8 space-y-5">
              <div className="flex items-center gap-3">
                <GoldIcon>
                  <Save className="w-5 h-5 text-[#C9A961]" />
                </GoldIcon>
                <div>
                  <p className="text-base font-semibold text-foreground">{isEN ? 'Save to My Account' : 'Guardar na Área de Cliente'}</p>
                  <p className="text-xs text-muted-foreground">{isEN ? 'Access your results anytime from your dashboard' : 'Acede aos teus resultados a qualquer momento no teu dashboard'}</p>
                </div>
              </div>
              {!isLoggedIn ? (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700">{isEN ? 'Log in to save your results.' : 'Faz login para guardar os teus resultados.'} <a href="/area-cliente/auth" className="underline font-semibold text-[#C9A961] hover:text-[#A88B4E]">{isEN ? 'Log in' : 'Iniciar sessão'}</a></p>
                </div>
              ) : savedToAccount ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <p className="text-sm text-green-600">{isEN ? 'Saved successfully! View in your dashboard.' : 'Guardado com sucesso! Consulta no teu dashboard.'}</p>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleSaveToAccount}
                    disabled={savingToAccount}
                    className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold py-3"
                  >
                    {savingToAccount ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isEN ? 'Save to My Account' : 'Guardar na Minha Conta'}
                  </Button>
                  {saveError && <p className="text-sm text-red-500">{saveError}</p>}
                </>
              )}
            </div>

            {/* ═══ Share Career Intelligence Result on LinkedIn ═══ */}
            {(() => {
              const score = careerData?.career_potential_score?.overall_score || 70;
              const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Strong' : score >= 50 ? 'Promising' : 'Developing';
              const topPct = Math.max(5, 100 - score);
              const today = new Date().toLocaleDateString(isEN ? 'en-GB' : 'pt-PT', { year: 'numeric', month: 'long' });
              const recommendedPath = careerData?.decision_recommendation?.recommended_path || (isEN ? 'Career Intelligence' : 'Career Intelligence');

              const generatePostText = () => {
                if (isEN) {
                  return `I just had my career strategically analysed by @share2inspire_'s AI Career Intelligence tool.\n\nCareer Potential Score: ${score}/100 — ${label}\nTop ${topPct}% of analysed professionals.\n\nThis gave me 3 strategic career paths, a full comparison with trade-offs, and a clear recommendation on which path to take.\n\nIf you're deciding your next career move — I highly recommend it.\n\n🔗 https://share2inspire.pt/en/career-intelligence\n\n#CareerIntelligence #CareerStrategy #ProfessionalGrowth #Share2Inspire`;
                }
                return `Acabei de ter a minha carreira analisada estrategicamente pelo Career Intelligence da @share2inspire_, com recurso a inteligência artificial.\n\nCareer Potential Score: ${score}/100 — ${label}\nTop ${topPct}% dos profissionais analisados.\n\nEsta análise deu-me 3 caminhos estratégicos de carreira, uma comparação completa com trade-offs e uma recomendação clara sobre qual caminho seguir.\n\nSe estás a decidir o teu próximo passo de carreira — recomendo.\n\n🔗 https://share2inspire.pt/career-intelligence\n\n#CareerIntelligence #EstratégiaDeCarreira #Carreira #Share2Inspire`;
              };

              const generateCertImage = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1200;
                canvas.height = 630;
                const ctx = canvas.getContext('2d')!;

                ctx.fillStyle = '#FAFAF8';
                ctx.fillRect(0, 0, 1200, 630);

                const grd = ctx.createLinearGradient(0, 0, 1200, 0);
                grd.addColorStop(0, '#C9A961');
                grd.addColorStop(1, '#E8D5A3');
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, 1200, 6);
                ctx.fillStyle = grd;
                ctx.fillRect(0, 624, 1200, 6);

                ctx.fillStyle = '#C9A961';
                ctx.fillRect(60, 60, 3, 510);

                // Title
                ctx.fillStyle = '#C9A961';
                ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.letterSpacing = '4px';
                ctx.fillText('CAREER INTELLIGENCE', 90, 100);
                ctx.letterSpacing = '0px';

                // Recommended path
                ctx.fillStyle = '#1A1A1A';
                ctx.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                const pathText = recommendedPath.length > 40 ? recommendedPath.substring(0, 40) + '...' : recommendedPath;
                ctx.fillText(pathText, 90, 155);

                ctx.fillStyle = '#E5E5E5';
                ctx.fillRect(90, 180, 400, 1);

                // Score
                ctx.fillStyle = '#C9A961';
                ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.letterSpacing = '2px';
                ctx.fillText('CAREER POTENTIAL SCORE', 90, 225);
                ctx.letterSpacing = '0px';
                ctx.fillStyle = '#1A1A1A';
                ctx.font = '700 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(`${score}/100`, 90, 280);
                ctx.fillStyle = '#666666';
                ctx.font = '400 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(label, 90, 308);

                // Ranking
                ctx.fillStyle = '#C9A961';
                ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.letterSpacing = '2px';
                ctx.fillText('RANKING', 400, 225);
                ctx.letterSpacing = '0px';
                ctx.fillStyle = '#1A1A1A';
                ctx.font = '700 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(`Top ${topPct}%`, 400, 280);
                ctx.fillStyle = '#666666';
                ctx.font = '400 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(isEN ? 'of analysed professionals' : 'dos profissionais analisados', 400, 308);

                // Strategic paths
                const paths = careerData?.strategic_paths?.slice(0, 3) || [];
                if (paths.length > 0) {
                  ctx.fillStyle = '#C9A961';
                  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                  ctx.letterSpacing = '2px';
                  ctx.fillText(isEN ? 'STRATEGIC PATHS' : 'CAMINHOS ESTRATÉGICOS', 90, 365);
                  ctx.letterSpacing = '0px';

                  paths.forEach((path: any, i: number) => {
                    const y = 390 + i * 40;
                    ctx.fillStyle = '#C9A961';
                    ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                    ctx.fillText(`${isEN ? 'Path' : 'Caminho'} ${i + 1}`, 90, y + 12);
                    ctx.fillStyle = '#555555';
                    ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                    ctx.fillText(path.name || '', 200, y + 12);
                  });
                }

                // Circular score
                const cx = 900, cy = 280, radius = 100;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fillStyle = '#FAFAF8';
                ctx.fill();
                ctx.strokeStyle = '#F0F0F0';
                ctx.lineWidth = 8;
                ctx.stroke();
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (score / 100) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, startAngle, endAngle);
                ctx.strokeStyle = '#C9A961';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.stroke();
                ctx.fillStyle = '#1A1A1A';
                ctx.font = '700 56px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${score}`, cx, cy + 12);
                ctx.fillStyle = '#666666';
                ctx.font = '400 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText('/100', cx, cy + 38);
                ctx.textAlign = 'left';

                // Footer
                ctx.fillStyle = '#E5E5E5';
                ctx.fillRect(90, 570, 1020, 1);
                ctx.fillStyle = '#C9A961';
                ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText('Share2Inspire', 90, 600);
                ctx.fillStyle = '#888888';
                ctx.font = '400 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(`Career Intelligence • ${today}`, 230, 600);
                ctx.textAlign = 'right';
                ctx.fillText('https://share2inspire.pt', 1110, 600);
                ctx.textAlign = 'left';

                const link = document.createElement('a');
                link.download = 'career-intelligence-share2inspire.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
              };

              const copyPost = () => {
                navigator.clipboard.writeText(generatePostText());
                setPostCopied(true);
                setTimeout(() => setPostCopied(false), 3000);
              };

              return (
                <div className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-6 sm:p-8 space-y-5">
                  <div className="flex items-center gap-3">
                    <GoldIcon>
                      <Award className="w-5 h-5 text-[#C9A961]" />
                    </GoldIcon>
                    <div>
                      <p className="text-base font-semibold text-foreground">{isEN ? 'Share Your Career Intelligence Result' : 'Partilhar Resultado do Career Intelligence'}</p>
                      <p className="text-xs text-muted-foreground">{isEN ? 'Generate an elegant LinkedIn post based on your strategic analysis' : 'Gera um post elegante para LinkedIn baseado na tua análise estratégica'}</p>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Linkedin className="w-4 h-4 text-[#0077B5]" />
                      <span className="text-xs font-semibold text-muted-foreground">{isEN ? 'POST PREVIEW' : 'PRÉ-VISUALIZAÇÃO DO POST'}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{generatePostText()}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={copyPost}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0077B5] hover:bg-[#005F8D] text-white font-semibold text-sm transition-colors"
                    >
                      {postCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {postCopied ? (isEN ? 'Copied!' : 'Copiado!') : (isEN ? 'Copy LinkedIn Post' : 'Copiar Post LinkedIn')}
                    </button>
                    <button
                      onClick={generateCertImage}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {isEN ? 'Download Career Intelligence Image' : 'Descarregar Imagem Career Intelligence'}
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center">
                    {isEN ? 'The image is optimised for LinkedIn posts (1200×630px)' : 'A imagem está optimizada para posts no LinkedIn (1200×630px)'}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* PRICING CTA (only when NOT paid) */}
        {!isPaid && !isGenerating && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? 'UNLOCK CAREER INTELLIGENCE' : 'DESBLOQUEAR CAREER INTELLIGENCE'}</p>
              <p className="text-4xl font-bold text-foreground">{CI_PRICE_DISPLAY}</p>
              <p className="text-sm text-muted-foreground">{isEN ? 'Strategic career analysis with 3 paths, comparison and recommendation' : 'Análise estratégica de carreira com 3 caminhos, comparação e recomendação'}</p>
            </div>

            {/* What's included */}
            <div className="bg-card border-2 border-border rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#C9A961]" />
                <p className="text-sm font-semibold text-foreground">{isEN ? 'What Career Intelligence includes:' : 'O que o Career Intelligence inclui:'}</p>
              </div>
              <div className="space-y-2">
                {(isEN ? [
                  'Market context and competitive positioning',
                  '3 strategic career paths tailored to your profile',
                  'Action plan for each path',
                  'Full comparison table (probability, effort, risk, salary)',
                  'Trade-offs analysis per path',
                  'Clear recommended decision with justification',
                ] : [
                  'Contexto de mercado e posicionamento competitivo',
                  '3 caminhos estratégicos de carreira adaptados ao teu perfil',
                  'Plano de acção para cada caminho',
                  'Tabela comparativa completa (probabilidade, esforço, risco, salário)',
                  'Análise de trade-offs por caminho',
                  'Decisão recomendada clara com justificação',
                ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#C9A961] shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  onClick={() => openPaymentModal()}
                  className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold py-3 text-base"
                >
                  {isEN ? `Unlock Career Intelligence — ${CI_PRICE_DISPLAY}` : `Desbloquear Career Intelligence — ${CI_PRICE_DISPLAY}`}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {isEN ? 'Secure payment via Card or PayPal' : 'Pagamento seguro via MB WAY ou PayPal'}
                </p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowDiscountModal(true)}
                className="text-sm text-[#C9A961] hover:underline flex items-center gap-1 mx-auto"
              >
                <Ticket className="w-4 h-4" />
                {isEN ? 'I already have a discount code' : 'Já tenho um código de desconto'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ─── Payment Modal ─── */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#C9A961]" />
              {isEN ? 'Unlock Career Intelligence' : 'Desbloquear Career Intelligence'}
            </DialogTitle>
          </DialogHeader>

          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-[#C9A961]/10 to-[#C9A961]/5 rounded-xl border border-[#C9A961]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{isEN ? 'Strategic career analysis' : 'Análise estratégica de carreira'}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{isEN ? '3 Paths + Comparison + Recommendation' : '3 Caminhos + Comparação + Recomendação'}</p>
                  </div>
                  <p className="text-lg font-bold text-[#C9A961]">{CI_PRICE_DISPLAY}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEN ? 'your@email.com' : 'seu@email.com'}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">{isEN ? 'Payment method' : 'Método de pagamento'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {isEN ? (
                    <>
                      <button
                        onClick={() => setPaymentMethod('stripe')}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          paymentMethod === 'stripe' ? 'border-[#635BFF] bg-[#635BFF]/5 text-foreground' : 'border-border text-muted-foreground hover:border-[#635BFF]/50'
                        }`}
                      >Card</button>
                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          paymentMethod === 'paypal' ? 'border-[#0070BA] bg-[#0070BA]/5 text-foreground' : 'border-border text-muted-foreground hover:border-[#0070BA]/50'
                        }`}
                      >PayPal</button>
                    </>
                  ) : (
                    <>
                      {(['mbway', 'stripe', 'paypal'] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            paymentMethod === method ? 'border-[#C9A961] bg-[#C9A961]/5 text-foreground' : 'border-border text-muted-foreground hover:border-[#C9A961]/50'
                          }`}
                        >
                          {method === 'mbway' ? 'MB WAY' : method === 'stripe' ? 'Cartão' : 'PayPal'}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {paymentMethod === 'mbway' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">{isEN ? 'Phone (MB WAY)' : 'Telemóvel (MB WAY)'}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9XXXXXXXX"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                  />
                </div>
              )}

              {paymentError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />{paymentError}
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
                  {isEN ? 'Back' : 'Voltar'}
                </Button>
                <Button
                  onClick={paymentMethod === 'stripe' ? handleStripePayment : paymentMethod === 'mbway' ? handleMBWayPayment : handlePayPalPayment}
                  disabled={paymentLoading}
                  className="flex-1 font-semibold text-white bg-[#C9A961] hover:bg-[#A88B4E]"
                >
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEN ? `Pay ${CI_PRICE_DISPLAY}` : `Pagar ${CI_PRICE_DISPLAY}`)}
                </Button>
              </div>
            </div>
          )}

          {paymentStep === 'polling' && (
            <div className="text-center space-y-4 py-4">
              {!pollingExpired ? (
                <Loader2 className="w-10 h-10 animate-spin text-[#C9A961] mx-auto" />
              ) : (
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              )}
              <p className="text-sm font-semibold text-foreground">{pollingMsg}</p>
              {pollingExpired && (
                <Button onClick={handleManualCheck} className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isEN ? 'I already paid — check again' : 'Já paguei — verificar novamente'}
                </Button>
              )}
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-base font-bold text-foreground">{isEN ? 'Payment confirmed!' : 'Pagamento confirmado!'}</p>
              <p className="text-sm text-muted-foreground">{isEN ? 'Generating your Career Intelligence report...' : 'A gerar o teu relatório Career Intelligence...'}</p>
              <Button onClick={handlePaymentSuccess} className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold">
                <Scale className="w-4 h-4 mr-2" />
                {isEN ? 'Generate Report' : 'Gerar Relatório'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Discount Code Modal ─── */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#C9A961]" />
              {isEN ? 'Discount Code' : 'Código de Desconto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isEN ? 'Enter your code to unlock Career Intelligence.' : 'Introduz o teu código para desbloquear o Career Intelligence.'}
            </p>
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder={isEN ? 'Enter code' : 'Inserir código'}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
              onKeyDown={(e) => e.key === 'Enter' && handleDiscountSubmit()}
            />
            {discountError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />{discountError}
              </p>
            )}
            <Button
              onClick={handleDiscountSubmit}
              disabled={discountLoading || !discountCode.trim()}
              className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
            >
              {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Unlock className="w-4 h-4 mr-2" />{isEN ? 'Validate Code' : 'Validar Código'}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
