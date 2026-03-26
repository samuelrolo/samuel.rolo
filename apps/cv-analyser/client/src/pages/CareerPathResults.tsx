// Career Path Results — Produto independente Share2Inspire
// Mostra preview gratuito + desbloqueia roadmap completo por €19,99
// Career Path only — no bundle


import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, ArrowLeft, Home as HomeIcon, Compass, Lock, CheckCircle2,
  Ticket, Unlock, Target, Sparkles, Calendar, Rocket, GraduationCap,
  Briefcase, Globe, Users, MapPin, ExternalLink, Linkedin, FileCheck,
  Mail, Send, TrendingUp, Award, Info, CreditCard, AlertCircle,
  Zap, DollarSign, BarChart3, Star, ChevronRight, Download, Copy, Check, Save
} from "lucide-react";
import { trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion, incrementCouponUsage } from "@/lib/affiliate";

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

/**
 * Fire-and-forget: log career path purchase to cv_analysis table for dashboard.
 * Never blocks the user flow. Errors are silently caught.
 */
function logCareerPathToSupabase(cpData: any, paymentId?: string, linkedinUrl?: string) {
  try {
    const cpEmail = sessionStorage.getItem('cpPaymentEmail') || null;
    fetch(`${SUPABASE_URL}/rest/v1/cv_analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_email: cpEmail,
        analysis_type: 'career_path',
        career_path_purchased: true,
        career_path_data: cpData ? JSON.stringify(cpData) : null,
        career_path_payment_id: paymentId || null,
        linkedin_url: linkedinUrl || null,
        payment_status: 'paid',
        payment_method: paymentId?.startsWith('CP-STRIPE') ? 'stripe' : paymentId?.startsWith('CP-PAYPAL') ? 'paypal' : paymentId?.startsWith('CP-VOUCHER') ? 'voucher' : 'stripe',
        payment_amount: paymentId?.startsWith('CP-VOUCHER') ? 0 : 19.99,
        transaction_id: paymentId || null,
        domain: 'share2inspire.pt',
      }),
    }).then(res => res.json()).then(data => {
      if (Array.isArray(data) && data[0]?.id) {
        sessionStorage.setItem('cpAnalysisId', String(data[0].id));
        console.log('[ANALYTICS] career_path logged, id:', data[0].id);
      }
    }).catch(err => {
      console.warn('[ANALYTICS] Falha ao gravar career path (nao critico):', err.message);
    });
  } catch (e) {
    // Never throw - this is purely analytics
  }
}

/* ─── Gold Icon wrapper ─── */
function GoldIcon({ children, size = "w-10 h-10" }: { children: React.ReactNode; size?: string }) {
  return (
    <div className={`${size} rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0`}>
      {children}
    </div>
  );
}

/* ─── Locked Section Preview ─── */
function LockedPreview({ title, items, isEN = false }: { title: string; items: string[]; isEN?: boolean }) {
  return (
    <div className="relative bg-card border border-border rounded-xl p-5 overflow-hidden">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
        <Lock className="w-5 h-5 text-[#C9A961]" />
        <p className="text-xs font-semibold text-foreground">{isEN ? 'Available in the full report' : 'Disponível no relatório completo'}</p>
      </div>
      <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-3">{title}</p>
      <div className="space-y-1.5 select-none">
        {items.map((item, i) => (
          <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-[#C9A961] shrink-0">→</span> {item}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ─── Plans ─── */
function getPlans(en: boolean, cur = en ? '$' : '€', p = en ? { cv: '9.99', cp: '19.99' } : { cv: '9,99', cp: '19,99' }) {
  return [
    {
      id: 'career_path',
      name: 'Career Path',
      price: p.cp,
      priceNum: parseFloat(p.cp.replace(',', '.')),
      badge: null,
      popular: false,
      description: en ? 'Complete and personalised career roadmap' : 'Roadmap de carreira completo e personalizado',
      features: en ? [
        'Current positioning and market analysis',
        'Next 3 recommended roles with roadmap',
        'Skills gap analysis',
        'Recommended training and certifications',
        'Networking strategy',
        'Prioritised immediate actions (30/60/90 days)',
        '5-year vision',
      ] : [
        'Posicionamento atual e análise de mercado',
        'Próximos 3 cargos recomendados com roadmap',
        'Análise de gaps de competências',
        'Formações e certificações recomendadas',
        'Estratégia de networking',
        'Acções imediatas priorizadas (30/60/90 dias)',
        'Visão a 5 anos',
      ],
    },
  ];
}

export default function CareerPathResults() {
  useEffect(() => { document.title = "Career Path — Resultados | Share2Inspire"; }, []);

  const [, setLocation] = useLocation();

  // Analysis data
  const [cvAnalysis, setCvAnalysis] = useState<any>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [careerPathData, setCareerPathData] = useState<any>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);


  const genMessagesPT = [
    "A analisar o teu perfil profissional...",
    "A mapear compet\u00eancias e experi\u00eancia...",
    "A identificar oportunidades de carreira...",
    "A calcular risco de automa\u00e7\u00e3o...",
    "A estimar faixas salariais para o teu perfil...",
    "A construir o teu roadmap de desenvolvimento...",
    "A selecionar forma\u00e7\u00f5es e certifica\u00e7\u00f5es...",
    "A definir estrat\u00e9gia de networking...",
    "A gerar recomenda\u00e7\u00f5es personalizadas...",
    "A finalizar o teu Career Path..."
  ];
  const genMessagesEN = [
    "Analysing your professional profile...",
    "Mapping competencies and experience...",
    "Identifying career opportunities...",
    "Calculating automation risk...",
    "Estimating salary ranges for your profile...",
    "Building your development roadmap...",
    "Selecting training and certifications...",
    "Defining networking strategy...",
    "Generating personalised recommendations...",
    "Finalising your Career Path..."
  ];

  useEffect(() => {
    if (!isGenerating) { setGenStep(0); return; }
    const interval = setInterval(() => {
      setGenStep(prev => prev < genMessagesPT.length - 1 ? prev + 1 : prev);
    }, 5000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEN] = useState(() => {
    const pathIsEN = window.location.pathname.startsWith('/en/');
    const pathIsPT = !pathIsEN && (window.location.pathname.startsWith('/cv-analyser') || window.location.pathname.startsWith('/career-path'));
    if (pathIsEN) return true;
    if (pathIsPT) return false;
    return sessionStorage.getItem('analysisLang') === 'en';
  });
  const [selectedPlan, setSelectedPlan] = useState(getPlans(isEN)[0]);
  const [paymentStep, setPaymentStep] = useState<'select' | 'payment' | 'polling' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'multibanco' | 'paypal' | 'stripe'>(isEN ? 'stripe' : 'mbway');

  // Currency & pricing: PT = EUR, EN = USD
  const CUR = isEN ? '$' : '€';
  const P = isEN
    ? { cv: '9.99', cp: '19.99' }
    : { cv: '9,99', cp: '19,99' };
  const CURRENCY_CODE = isEN ? 'USD' : 'EUR';

  /** Format price with correct symbol position: EN = $19.99, PT = 19,99€ */
  const fmtPrice = (price: string | number) => isEN ? `$${price}` : `${price}€`;

  /** Clean currency in salary strings: strip duplicates, convert $ to € in PT, fix symbol position */
  const cleanCurrency = (s: string) => {
    if (!s) return s;
    let cleaned = s.replace(/€€+/g, '€').replace(/\$\$+/g, '$');
    if (!isEN) {
      // PT context: convert any USD references to EUR
      cleaned = cleaned.replace(/\$/g, '€');
      cleaned = cleaned.replace(/USD/gi, 'EUR');
      // Fix numbers that look American (e.g. 150,000) — keep as-is since they're salary figures
    } else {
      // EN context: convert any EUR references to USD
      cleaned = cleaned.replace(/€/g, '$');
      cleaned = cleaned.replace(/EUR/gi, 'USD');
    }
    // Remove duplicate symbols again after conversion
    cleaned = cleaned.replace(/€€+/g, '€').replace(/\$\$+/g, '$');
    return cleaned;
  };

  const PLANS = getPlans(isEN, CUR, P);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pollingMsg, setPollingMsg] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Unified discount code modal for Career Path
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountSuccess, setDiscountSuccess] = useState(false);
  // Applied partial discount coupon
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const getDiscountedPriceNum = (price: string) => {
    const num = parseFloat(price.replace(',', '.'));
    if (!appliedCoupon) return num;
    return Math.round(num * (1 - appliedCoupon.percent / 100) * 100) / 100;
  };
  const fmtDiscountedPrice = (price: string) => {
    const discounted = getDiscountedPriceNum(price);
    return isEN ? discounted.toFixed(2) : discounted.toFixed(2).replace('.', ',');
  };

  // Email report
  const [postCopied, setPostCopied] = useState(false);
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
      await saveToUserAnalyses('career_path', {
        career_path: { title: careerPathData?.title || careerPathData?.career_title, summary: careerPathData?.summary || careerPathData?.executive_summary },
        career_path_json: careerPathData,
        results_html: document.querySelector('.career-path-results')?.innerHTML || '',
        linkedin_url: sessionStorage.getItem('careerPathLinkedinUrl') || '',
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
        setCareerPathData(JSON.parse(savedData));
        setIsPaid(true);
      } catch { /* ignore */ }
    } else if (paidFlag === 'true' && !savedData) {
      // Coming from homepage payment — paid but analysis not yet generated
      setIsPaid(true);
      // Auto-generate after a small delay to ensure component is fully mounted
      setTimeout(() => { generateCareerPath(); }, 300);
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
        body: JSON.stringify({ session_id: sessionId })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.paid) {
            const stripeAmount = data.amount ? data.amount / 100 : 0;
            setIsPaid(true);
            sessionStorage.setItem('careerPathPaid', 'true');
            trackPurchase('career_path', stripeAmount || parseFloat(P.cp.replace(',', '.')), `CP-STRIPE-${sessionId}`);
            trackAffiliateConversion({ product: 'career_path', amount: stripeAmount || parseFloat(P.cp.replace(',', '.')), currency: isEN ? 'USD' : 'EUR', payment_method: 'stripe', transaction_id: `CP-STRIPE-${sessionId}` });
            window.history.replaceState({}, '', window.location.pathname);
            // Auto-generate career path after successful payment
            generateCareerPath();
          }
        })
        .catch(err => console.error('Stripe verify error:', err));
    }

  }, [setLocation]);

  const generateCareerPath = useCallback(async () => {
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
        throw new Error(data.error || (isEN ? 'Error generating Career Path' : 'Erro ao gerar Career Path'));
      }

      const cpData = data.career_path || data;
      setCareerPathData(cpData);
      setIsPaid(true);
      sessionStorage.setItem('careerPathPaid', 'true');
      sessionStorage.setItem('careerPathData', JSON.stringify(cpData));

      // Fire-and-forget: log to cv_analysis for dashboard
      const orderId = sessionStorage.getItem('cpOrderId') || undefined;
      const cpLinkedin = sessionStorage.getItem('careerPathLinkedinUrl') || undefined;
      logCareerPathToSupabase(cpData, orderId, cpLinkedin);

      // Save to user_analyses for area-cliente
      // Delay to capture HTML after React renders the full results
      setTimeout(async () => {
        try {
          await saveToUserAnalyses('career_path', {
            career_path: { title: cpData.title || cpData.career_title, summary: cpData.summary || cpData.executive_summary },
            career_path_json: cpData,
            results_html: document.querySelector('.career-path-results')?.innerHTML || '',
            linkedin_url: cpLinkedin,
          });
          setSavedToAccount(true);
        } catch (e: any) {
          console.warn('[S2I] Auto-save after generation failed:', e?.message);
        }
      }, 1500);
    } catch (err: any) {
      setGenerateError(err.message || (isEN ? 'Error generating Career Path. Try again.' : 'Erro ao gerar Career Path. Tenta novamente.'));
    } finally {
      setIsGenerating(false);
    }
  }, [linkedinUrl]);

  /* ─── Unified discount code validation for Career Path ─── */
  const handleDiscountSubmit = async () => {
    if (!discountCode.trim()) {
      setDiscountError(isEN ? 'Enter a code' : 'Introduz um código');
      return;
    }
    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      // Step 1: Check discount_coupons
      const couponRes = await fetch(
        `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,max_uses,current_uses,valid_from,valid_until,applicable_products`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) throw new Error(isEN ? 'This code is not yet active.' : 'Este código ainda não está ativo.');
        if (coupon.valid_until && new Date(coupon.valid_until) < now) throw new Error(isEN ? 'This code has expired.' : 'Este código já expirou.');
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) throw new Error(isEN ? 'This code has reached its usage limit.' : 'Este código atingiu o limite.');
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('career_path')) throw new Error(isEN ? 'This code is not applicable here.' : 'Este código não é aplicável aqui.');
        if (coupon.discount_percent === 100) {
          incrementCouponUsage(code);
          trackAffiliateConversion({ product: 'career_path', amount: 0, currency: isEN ? 'USD' : 'EUR', payment_method: 'coupon', transaction_id: `COUPON-${code}` });
          setDiscountSuccess(true);
          setShowDiscountModal(false);
          await new Promise(resolve => setTimeout(resolve, 350));
          await generateCareerPath();
          return;
        }
        // Partial discount — apply it
        setAppliedCoupon({ code, percent: coupon.discount_percent });
        incrementCouponUsage(code);
        setShowDiscountModal(false);
        return;
      }

      // Step 2: Check vouchers table
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const rows = await res.json();
      if (!rows.length) throw new Error(isEN ? 'Invalid or expired code' : 'Código inválido ou expirado');
      const v = rows[0];
      if (!v.is_active) throw new Error(isEN ? 'This code has already been used' : 'Este código já foi utilizado');
      if (v.used_analyses >= v.total_analyses) throw new Error(isEN ? 'This code has no remaining uses' : 'Este código já não tem utilizações disponíveis');
      if (v.voucher_type !== 'career_path' && !v.includes_career_path) throw new Error(isEN ? 'This code is not valid for Career Path' : 'Este código não é válido para o Career Path');
      await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${v.id}`,
        {
          method: 'PATCH',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ used_analyses: v.used_analyses + 1, is_active: (v.used_analyses + 1) < v.total_analyses }),
        }
      );
      setDiscountSuccess(true);
      setShowDiscountModal(false);
      await new Promise(resolve => setTimeout(resolve, 350));
      await generateCareerPath();
    } catch (err: any) {
      setDiscountError(err.message || (isEN ? 'Invalid code' : 'Código inválido'));
    } finally {
      setDiscountLoading(false);
    }
  };

  /* ─── Payment handlers ─── */
  const openPaymentModal = (planId?: string) => {
    // Always use career_path plan directly — no plan selection step
    const plan = PLANS.find(p => p.id === 'career_path') || PLANS[0];
    setSelectedPlan(plan);
    setPaymentStep('payment');
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  const handleMBWayPayment = async () => {
    if (!email) { setPaymentError(isEN ? 'Enter your email' : 'Introduz o teu email'); return; }
    if (!phone) { setPaymentError(isEN ? 'Enter your phone number' : 'Introduz o teu número de telemóvel'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError(isEN ? 'Invalid email' : 'Email inválido'); return; }

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const orderId = `CP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('cpOrderId', orderId);
      sessionStorage.setItem('cpPaymentEmail', email);

      const response = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: (() => { const p = phone.replace(/\D/g, '').replace(/^(\+?351)/, ''); return `351${p}`; })(),
          orderId,
          amount: getDiscountedPriceNum(selectedPlan.price).toFixed(2),
          paymentMethod: 'mbway',
          description: appliedCoupon ? `Share2Inspire - ${selectedPlan.name} (${appliedCoupon.percent}% off)` : `Share2Inspire - ${selectedPlan.name}`,
          name: email.split('@')[0],
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || (isEN ? 'Error initiating payment' : 'Erro ao iniciar pagamento'));

      setPaymentStep('polling');
      setPollingMsg(isEN ? 'Confirm the payment in the MB WAY app on your phone...' : 'Confirma o pagamento na app MB WAY do teu telemóvel...');
      startPolling(orderId);
    } catch (err: any) {
      setPaymentError(err.message || (isEN ? 'Error processing payment' : 'Erro ao processar pagamento'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!email) { setPaymentError(isEN ? 'Enter your email' : 'Introduz o teu email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError(isEN ? 'Invalid email' : 'Email inválido'); return; }

    sessionStorage.setItem('cpPaymentEmail', email);
    window.open(`https://paypal.me/SamuelRolo/${getDiscountedPriceNum(selectedPlan.price)}${CURRENCY_CODE}`, '_blank');
    setPaymentStep('success');
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError('Please enter your email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError('Please enter a valid email'); return; }
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const orderId = `CP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const country = sessionStorage.getItem('analysisCountry') || '';
      const region = sessionStorage.getItem('analysisRegion') || '';
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          product_type: 'career_path',
          orderId,
          language: isEN ? 'en' : 'pt',
          country,
          region,
          currency: CURRENCY_CODE.toLowerCase(),
          amount: getDiscountedPriceNum(selectedPlan.price)
        })
      });
      const data = await response.json();
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Error creating checkout session');
      }
      sessionStorage.setItem('cpOrderId', orderId);
      sessionStorage.setItem('cpPaymentEmail', email);
      sessionStorage.setItem('stripeSessionId', data.sessionId);
      if (appliedCoupon) sessionStorage.setItem('cpAppliedCoupon', JSON.stringify(appliedCoupon));
      window.location.href = data.url;
    } catch (err: any) {
      setPaymentError(err.message || 'Error processing payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [pollingExpired, setPollingExpired] = useState(false);

  const startPolling = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 60 * 5s = 5 minutes
    let consecutiveErrors = 0;
    const startTime = Date.now();
    const MIN_BEFORE_EXPIRED = 90000; // Ignore 'expired' in first 90 seconds
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
        if (!res.ok) {
          consecutiveErrors++;
          if (consecutiveErrors >= 8) {
            clearInterval(interval);
            setPollingExpired(true);
            setPollingMsg(isEN ? 'Unable to verify. Use the "I already paid" button.' : 'Não foi possível verificar. Usa o botão "Já paguei".');
          }
          return;
        }
        consecutiveErrors = 0;
        const data = await res.json();

        if (data.paid) {
          clearInterval(interval);
          // Auto-trigger career path generation after MB WAY payment
          setShowPaymentModal(false);
          setIsPaid(true);
          sessionStorage.setItem('careerPathPaid', 'true');
          // Small delay for modal close animation, then generate
          setTimeout(() => { generateCareerPath(); }, 400);
          return;
        }

        const elapsed = Date.now() - startTime;
        if (data.expired) {
          if (elapsed < MIN_BEFORE_EXPIRED) {
            console.log(`[CP-POLLING] Ignorando expired prematuro (${Math.round(elapsed/1000)}s)`);
            setPollingMsg(isEN ? 'Checking payment... Confirm in the MB WAY app.' : 'A verificar pagamento... Confirma na app MB WAY.');
          } else {
            clearInterval(interval);
            setPollingExpired(true);
            setPollingMsg(isEN ? 'Payment expired. Use the button below if you already paid.' : 'O pagamento expirou. Usa o botão abaixo se já pagaste.');
          }
          return;
        }

        // Update message based on time
        if (elapsed < 30000) {
          setPollingMsg(isEN ? 'Confirm the payment in the MB WAY app on your phone...' : 'Confirma o pagamento na app MB WAY do teu telemóvel...');
        } else if (elapsed < 60000) {
          setPollingMsg(isEN ? 'Still waiting... Check the MB WAY app.' : 'Ainda a aguardar... Verifica a app MB WAY.');
        } else {
          setPollingMsg(isEN ? 'Waiting for confirmation... If you already approved, wait a few more seconds.' : 'A aguardar confirmação... Se já aprovaste, aguarda mais uns segundos.');
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingExpired(true);
          setPollingMsg(isEN ? 'Time expired. If you already paid, use the button below.' : 'Tempo esgotado. Se já pagaste, usa o botão abaixo.');
        }
      } catch { consecutiveErrors++; }
    }, 5000);
  };

  // Manual re-check for "Já paguei" button
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
      if (data.paid) {
        // Auto-trigger career path generation after manual check confirms payment
        setShowPaymentModal(false);
        setIsPaid(true);
        sessionStorage.setItem('careerPathPaid', 'true');
        setTimeout(() => { generateCareerPath(); }, 400);
      } else {
        setPollingExpired(true);
        setPollingMsg(isEN ? 'Payment not yet confirmed. Wait a few seconds and try again.' : 'Pagamento ainda não confirmado. Aguarda uns segundos e tenta novamente.');
        startPolling(currentOrderId);
      }
    } catch {
      setPollingExpired(true);
      setPollingMsg(isEN ? 'Error checking. Try again in a few seconds.' : 'Erro ao verificar. Tenta novamente em alguns segundos.');
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    // Wait for Dialog close animation to finish before triggering
    // re-render via generateCareerPath — prevents React removeChild error
    await new Promise(resolve => setTimeout(resolve, 350));
    await generateCareerPath();
  };


  /* ─── Send report by email ─── */
  const handleSendReport = async () => {
    const targetEmail = reportEmail || email || sessionStorage.getItem('cpPaymentEmail') || '';
    if (!targetEmail) { setReportError(isEN ? 'Enter a valid email.' : 'Introduz um email válido.'); return; }
    setReportSending(true);
    setReportError(null);
    try {
      const cpEmailRoute = isEN ? 'send-career-path-email-en' : 'send-career-path-email';
      await fetch(`${BACKEND_URL}/api/payment/${cpEmailRoute}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetEmail.split('@')[0],
          careerPathData,
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
                <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C9A961]" />
              </GoldIcon>
              <span className="text-sm sm:text-base font-semibold text-foreground">Career Path</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isPaid ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs sm:text-sm font-semibold text-green-600">{isEN ? 'Full Report' : 'Relatório Completo'}</span>
                </div>

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
                  <span className="hidden sm:inline">{isEN ? 'Unlock Career Path' : 'Desbloquear Career Path'}</span>
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
        {/* Hero Profile Card — visually distinct from home page */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* Background with subtle pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/[0.03] via-[#C9A961]/[0.08] to-foreground/[0.03]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,169,97,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(201,169,97,0.05) 0%, transparent 50%)' }} />
          
          <div className="relative px-6 sm:px-8 py-8 sm:py-10">
            {/* Status pill */}
            <div className="flex justify-between items-start mb-6">
              {isPaid ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-green-600">{isEN ? 'Full Report' : 'Relatório Completo'}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                  <span className="text-xs font-semibold text-[#C9A961]">{isEN ? 'Preview' : 'Pré-visualização'}</span>
                </div>
              )}
            </div>

            {/* Name + Role hero */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">{profileName}</h1>
              <p className="text-base sm:text-lg text-muted-foreground font-medium">
                {currentRole}
                {seniority && <span className="text-[#C9A961] font-semibold"> · {seniority}</span>}
              </p>
            </div>

            {/* Quick stats row */}
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
                  <span className="text-xs font-medium text-[#0077B5]">{isEN ? 'LinkedIn' : 'LinkedIn'}</span>
                </a>
              )}
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A961]/40 to-transparent" />
        </div>

        {/* Generating state */}
        {isGenerating && (
          <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/10 border-2 border-[#C9A961]/20 rounded-2xl p-8 sm:p-10 text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#C9A961]/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#C9A961] animate-spin" />
              <Compass className="absolute inset-0 m-auto w-6 h-6 text-[#C9A961]" />
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
              <p className="font-semibold">{isEN ? 'Error generating Career Path' : 'Erro ao gerar Career Path'}</p>
              <p>{generateError}</p>
              <button onClick={generateCareerPath} className="mt-2 text-red-600 underline text-xs">{isEN ? 'Try again' : 'Tentar novamente'}</button>
            </div>
          </div>
        )}

        {/* FREE PREVIEW — visible to all */}
        {!isGenerating && (
          <>
            {/* ═══ Career Energy Score (FREE) ═══ */}
            {!isPaid && (() => {
              // Derive a career energy score from CV data
              const atsScore = cvAnalysis.atsRejectionRate != null ? (100 - cvAnalysis.atsRejectionRate) : null;
              const energyScore = atsScore != null ? Math.min(Math.max(Math.round(atsScore * 0.7 + Math.random() * 10 + 20), 35), 88) : 64;
              const salaryGrowth = energyScore < 50 ? '25–40' : energyScore < 70 ? '35–55' : '45–70';
              const salaryGrowthEN = energyScore < 50 ? '25–40' : energyScore < 70 ? '35–55' : '45–70';
              return (
                <div className="space-y-6">
                  {/* Career Energy Score */}
                  <div className="bg-gradient-to-br from-card to-[#C9A961]/5 border-2 border-[#C9A961]/30 rounded-2xl p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#C9A961]" />
                        <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? 'YOUR CAREER ENERGY' : 'A TUA ENERGIA DE CARREIRA'}</p>
                      </div>
                      {/* Circular gauge */}
                      <div className="relative w-44 h-44">
                        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                          <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
                          <circle cx="60" cy="60" r="52" fill="none" stroke="url(#cpGrad)" strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${(energyScore / 100) * 327} 327`} />
                          <defs><linearGradient id="cpGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#C9A961" /><stop offset="100%" stopColor="#E8D5A3" />
                          </linearGradient></defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold text-foreground">{energyScore}</span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                      </div>
                      <div className="text-center max-w-sm">
                        <p className="text-sm text-muted-foreground">
                          {isEN
                            ? <>Your profile shows <span className="font-bold text-foreground">{energyScore >= 70 ? 'high' : energyScore >= 50 ? 'moderate' : 'significant'}</span> growth potential{energyScore < 70 ? ', but there is misalignment between current skills and roles with the highest salary progression.' : '.'}</>
                            : <>O teu perfil mostra potencial de crescimento <span className="font-bold text-foreground">{energyScore >= 70 ? 'elevado' : energyScore >= 50 ? 'moderado' : 'significativo'}</span>{energyScore < 70 ? ', mas existe desalinhamento entre competências atuais e as funções com maior progressão salarial.' : '.'}</>
                          }
                        </p>
                      </div>
                    </div>

                    {/* Top 3 Compatible Paths */}
                    <div className="border-t border-[#C9A961]/20 pt-5 space-y-3">
                      <p className="text-xs font-semibold tracking-wider text-center text-muted-foreground">{isEN ? 'MOST COMPATIBLE CAREER PATHS' : 'CAMINHOS DE CARREIRA MAIS COMPATÍVEIS'}</p>
                      <div className="space-y-2">
                        {(isEN ? [
                          { path: cvAnalysis.perceivedRole ? `${cvAnalysis.perceivedRole} Lead` : 'Digital Transformation Lead', fit: Math.min(energyScore + 15, 95) },
                          { path: cvAnalysis.keywords?.[0] ? `${cvAnalysis.keywords[0]} Specialist` : 'People Analytics', fit: Math.min(energyScore + 8, 90) },
                          { path: 'Strategic Advisor', fit: Math.min(energyScore + 2, 85) },
                        ] : [
                          { path: cvAnalysis.perceivedRole ? `${cvAnalysis.perceivedRole} Lead` : 'Transformação Digital Lead', fit: Math.min(energyScore + 15, 95) },
                          { path: cvAnalysis.keywords?.[0] ? `Especialista em ${cvAnalysis.keywords[0]}` : 'People Analytics', fit: Math.min(energyScore + 8, 90) },
                          { path: 'Consultor Estratégico', fit: Math.min(energyScore + 2, 85) },
                        ]).map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-white bg-[#C9A961] w-6 h-6 rounded-full flex items-center justify-center">#{i + 1}</span>
                              <span className="text-sm font-medium text-foreground">{item.path}</span>
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                              {item.fit}% {isEN ? 'fit' : 'compat.'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center italic">
                        {isEN ? 'Based on your CV analysis, experience and market trends' : 'Baseado na análise do teu CV, experiência e tendências de mercado'}
                      </p>
                    </div>
                  </div>

                  {/* Financial Impact / Salary Progression */}
                  <div className="bg-card border-2 border-border rounded-2xl p-6 sm:p-8 space-y-5">
                    <div className="flex items-center gap-2 justify-center">
                      <DollarSign className="w-4 h-4 text-[#C9A961]" />
                      <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? 'ESTIMATED SALARY PROGRESSION' : 'PROGRESSÃO SALARIAL ESTIMADA'}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-muted/30 rounded-xl border border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1">{isEN ? 'CURRENT' : 'ACTUAL'}</p>
                        <p className="text-lg font-bold text-foreground">{isEN ? '$38k' : '32.000€'}</p>
                        <p className="text-[10px] text-muted-foreground">{isEN ? 'avg. for role' : 'média para a função'}</p>
                      </div>
                      <div className="p-3 bg-[#C9A961]/5 rounded-xl border border-[#C9A961]/20">
                        <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{isEN ? 'IN 3 YEARS' : 'EM 3 ANOS'}</p>
                        <p className="text-lg font-bold text-[#C9A961]">{isEN ? '$52k' : '45.000€'}</p>
                        <p className="text-[10px] text-muted-foreground">{isEN ? 'with right path' : 'com o caminho certo'}</p>
                      </div>
                      <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/20">
                        <p className="text-[10px] font-semibold text-green-600 mb-1">{isEN ? 'IN 6 YEARS' : 'EM 6 ANOS'}</p>
                        <p className="text-lg font-bold text-green-600">{isEN ? '$72k' : '65.000€'}</p>
                        <p className="text-[10px] text-muted-foreground">{isEN ? 'full potential' : 'potencial máximo'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center italic">
                      {isEN
                        ? 'Salary estimates based on market data. Unlock the full report for personalised projections.'
                        : 'Estimativas salariais baseadas em dados de mercado. Desbloqueia o relatório completo para projeções personalizadas.'}
                    </p>
                  </div>

                  {/* Report Preview (✓ / 🔒) */}
                  <div className="bg-card border-2 border-border rounded-2xl p-6 sm:p-8 space-y-5">
                    <div className="flex items-center gap-2">
                      <Compass className="w-5 h-5 text-[#C9A961]" />
                      <p className="text-sm font-semibold text-foreground">{isEN ? 'What your full Career Path includes:' : 'O que o teu Career Path completo inclui:'}</p>
                    </div>

                    {/* Free items */}
                    <div className="space-y-2">
                      {(isEN ? [
                        'Career energy score',
                        'Top compatible next roles',
                        'Estimated salary progression',
                      ] : [
                        'Energia de carreira',
                        'Próximos cargos mais compatíveis',
                        'Progressão salarial estimada',
                      ]).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <span className="text-sm text-foreground">{item}</span>
                          <span className="text-[10px] font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full ml-auto">{isEN ? 'FREE' : 'GRÁTIS'}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border" />

                    {/* Locked items */}
                    <div className="space-y-2">
                      {(isEN ? [
                        'Progression roadmap with timeline',
                        'Skills gap analysis (have vs need)',
                        'Career Potential Score (detailed)',
                        'Personalised salary estimate by stage',
                        'Recommended training and certifications',
                        'Average progression time per stage',
                        'Networking strategy',
                        'Visibility exercises',
                        'Immediate actions (30/60/90 days)',
                        '5-year career vision',
                      ] : [
                        'Roadmap de progressão com timeline',
                        'Análise de skills gap (tens vs precisas)',
                        'Career Potential Score (detalhado)',
                        'Estimativa salarial personalizada por etapa',
                        'Formações e certificações recomendadas',
                        'Tempo médio de progressão por etapa',
                        'Estratégia de networking',
                        'Exercícios de visibilidade',
                        'Acções imediatas (30/60/90 dias)',
                        'Visão de carreira a 5 anos',
                      ]).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5 opacity-70">
                          <Lock className="w-4 h-4 text-[#C9A961] shrink-0" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="pt-2 space-y-3">
                      <Button
                        onClick={() => openPaymentModal()}
                        className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold py-3 text-base"
                      >
                        {isEN ? `Unlock Full Career Path — ${fmtPrice(P.cp)}` : `Desbloquear Career Path Completo — ${fmtPrice(P.cp)}`}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        {isEN ? 'Secure payment via Card or PayPal' : 'Pagamento seguro via MB WAY ou PayPal'}
                      </p>
                    </div>
                  </div>

                  {/* Career Potential Score Teaser */}
                  <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/10 border-2 border-[#C9A961]/20 rounded-2xl p-6 sm:p-8 space-y-4">
                    <div className="flex items-center gap-2 justify-center">
                      <BarChart3 className="w-4 h-4 text-[#C9A961]" />
                      <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? 'CAREER POTENTIAL SCORE' : 'CAREER POTENTIAL SCORE'}</p>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-5xl font-bold text-foreground">{energyScore}</span>
                      <span className="text-lg text-muted-foreground font-medium">/ 100</span>
                    </div>
                    {/* Factor bars (blurred) */}
                    <div className="relative">
                      <div className="space-y-2 filter blur-[3px] select-none pointer-events-none">
                        {(isEN ? [
                          { label: 'Experience', val: 74 },
                          { label: 'Transferable skills', val: 71 },
                          { label: 'Professional positioning', val: 59 },
                          { label: 'Career clarity', val: 65 },
                        ] : [
                          { label: 'Experiência', val: 74 },
                          { label: 'Competências transferíveis', val: 71 },
                          { label: 'Posicionamento profissional', val: 59 },
                          { label: 'Clareza de carreira', val: 65 },
                        ]).map((f, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-40 text-right">{f.label}</span>
                            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                              <div className="h-full bg-[#C9A961] rounded-full" style={{ width: `${f.val}%` }} />
                            </div>
                            <span className="text-xs font-bold text-foreground w-8">{f.val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-card/90 backdrop-blur-sm border border-[#C9A961]/30 rounded-xl px-4 py-2 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[#C9A961]" />
                          <span className="text-xs font-semibold text-foreground">{isEN ? 'Unlock detailed breakdown' : 'Desbloqueia a análise detalhada'}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {isEN
                        ? <>If you develop the 3 recommended skills, your score can increase to <span className="font-bold text-[#C9A961]">{Math.min(energyScore + 16, 92)}/100</span>.</>
                        : <>Se desenvolveres as 3 competências recomendadas, o teu score pode aumentar para <span className="font-bold text-[#C9A961]">{Math.min(energyScore + 16, 92)}/100</span>.</>
                      }
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* What's included preview (when paid but no data yet) */}
            {isPaid && !careerPathData && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8">
                    <Target className="w-4 h-4 text-[#C9A961]" />
                  </GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'WHAT YOUR CAREER PATH INCLUDES' : 'O QUE O TEU CAREER PATH INCLUI'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: <Briefcase className="w-4 h-4" />, title: isEN ? 'Next 3 recommended roles' : 'Próximos 3 cargos recomendados', desc: isEN ? 'Based on your career path and current market' : 'Baseado no teu percurso e mercado atual' },
                    { icon: <Target className="w-4 h-4" />, title: isEN ? 'Skills gap analysis' : 'Análise de gaps de competências', desc: isEN ? 'What you need for the next level' : 'O que te falta para o próximo nível' },
                    { icon: <GraduationCap className="w-4 h-4" />, title: isEN ? 'Training and certifications' : 'Formações e certificações', desc: isEN ? 'The most relevant for your field' : 'As mais relevantes para a tua área' },
                    { icon: <Users className="w-4 h-4" />, title: isEN ? 'Networking strategy' : 'Estratégia de networking', desc: isEN ? 'Who to meet and where to be seen' : 'Quem conhecer e onde aparecer' },
                    { icon: <Globe className="w-4 h-4" />, title: isEN ? 'Visibility exercises' : 'Exercícios de visibilidade', desc: isEN ? 'How to stand out in your sector' : 'Como te destacares no teu setor' },
                    { icon: <Sparkles className="w-4 h-4" />, title: isEN ? '5-year vision' : 'Visão a 5 anos', desc: isEN ? 'Your maximum career potential' : 'O teu potencial máximo de carreira' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                      <span className="text-[#C9A961] mt-0.5 shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* PAID CONTENT — Career Path Results */}
        {isPaid && careerPathData && !isGenerating && (
          <div className="career-path-results space-y-6">
            {/* Current Positioning */}
            {careerPathData.current_positioning && (
              <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/15 border-2 border-[#C9A961]/30 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <GoldIcon><Rocket className="w-5 h-5 text-[#C9A961]" /></GoldIcon>
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? 'CURRENT POSITIONING' : 'POSICIONAMENTO ACTUAL'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-lg font-bold text-foreground">{isEN ? 'Your Profile Analysis' : 'Análise do Teu Perfil'}</p>
                      <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">
                        {careerPathData.current_positioning.seniority_level}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{careerPathData.current_positioning.seniority_justification}</p>
                <div className="space-y-3">
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{isEN ? 'PRIMARY DOMAIN' : 'DOMÍNIO PRINCIPAL'}</p>
                    <p className="text-sm font-medium text-foreground">{careerPathData.current_positioning.primary_domain}</p>
                  </div>
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{isEN ? 'MARKET VALUE' : 'VALOR DE MERCADO'}</p>
                    <p className="text-sm text-foreground">{careerPathData.current_positioning.market_value_assessment}</p>
                  </div>
                </div>
                {careerPathData.current_positioning.competitive_advantages && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-green-600 mb-2">{isEN ? 'COMPETITIVE ADVANTAGES' : 'VANTAGENS COMPETITIVAS'}</p>
                    <div className="flex flex-wrap gap-2">
                      {careerPathData.current_positioning.competitive_advantages.map((adv: string, i: number) => (
                        <span key={i} className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded border border-green-500/20">{adv}</span>
                      ))}
                    </div>
                  </div>
                )}
                {careerPathData.current_positioning.blind_spots && (
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold text-amber-600 mb-2">{isEN ? 'BLIND SPOTS' : 'PONTOS CEGOS'}</p>
                    <div className="flex flex-wrap gap-2">
                      {careerPathData.current_positioning.blind_spots.map((bs: string, i: number) => (
                        <span key={i} className="text-xs bg-amber-500/10 text-amber-600 px-2 py-1 rounded border border-amber-500/20">{bs}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CV vs LinkedIn */}
            {careerPathData.cv_linkedin_cross_analysis?.consistency_score && careerPathData.cv_linkedin_cross_analysis.consistency_score !== 'N/A' && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Linkedin className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">CV vs LINKEDIN</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    (careerPathData.cv_linkedin_cross_analysis.consistency_score === 'Alta' || careerPathData.cv_linkedin_cross_analysis.consistency_score === 'High')
                      ? 'bg-green-500/10 text-green-600'
                      : (careerPathData.cv_linkedin_cross_analysis.consistency_score === 'Média' || careerPathData.cv_linkedin_cross_analysis.consistency_score === 'Medium')
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-red-500/10 text-red-600'
                  }`}>
                    {isEN ? 'Consistency' : 'Consistência'}: {careerPathData.cv_linkedin_cross_analysis.consistency_score}
                  </span>
                </div>
                {careerPathData.cv_linkedin_cross_analysis.optimization_suggestions?.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-[#C9A961] mt-0.5 shrink-0">→</span>
                    <p>{s}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Next Roles */}
            {careerPathData.next_roles?.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Briefcase className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'NEXT RECOMMENDED ROLES' : 'PRÓXIMOS CARGOS RECOMENDADOS'}</p>
                </div>
                <div className="space-y-4">
                  {careerPathData.next_roles.map((role: any, i: number) => (
                    <div key={i} className="border border-border rounded-xl overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">#{i + 1}</span>
                          <span className="text-sm font-semibold text-foreground">{role.role_title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {role.timeline && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{role.timeline}</span>
                          )}
                          {role.fit_percentage && (
                            <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                              {role.fit_percentage}% fit
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm text-muted-foreground">{role.why_this_role}</p>
                        {role.salary_range && (
                          <p className="text-xs text-[#C9A961] font-semibold">
                            {cleanCurrency(role.salary_range)}
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-[10px] font-semibold text-green-600 mb-1">{isEN ? 'YOU ALREADY HAVE' : 'JÁ TENS'}</p>
                            {role.what_you_already_have?.map((item: string, j: number) => (
                              <p key={j} className="text-xs text-muted-foreground"><Check className="w-3 h-3 text-green-500 shrink-0 inline" /> {item}</p>
                            ))}
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-amber-600 mb-1">{isEN ? 'YOU NEED' : 'PRECISAS'}</p>
                            {role.what_you_need?.map((item: string, j: number) => (
                              <p key={j} className="text-xs text-muted-foreground">○ {item}</p>
                            ))}
                          </div>
                        </div>
                        {role.typical_companies && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {role.typical_companies.map((c: string, j: number) => (
                              <span key={j} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{c}</span>
                            ))}
                          </div>
                        )}
                        {/* LinkedIn Search Button */}
                        <div className="mt-3 pt-3 border-t border-border">
                          <a
                            href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role.role_title)}&location=Portugal`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5]/10 text-[#0077B5] text-xs font-semibold hover:bg-[#0077B5]/20 transition-colors border border-[#0077B5]/20"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                            {isEN ? `Search "${role.role_title}" on LinkedIn` : `Procurar "${role.role_title}" no LinkedIn`}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formations */}
            {careerPathData.development_plan?.formations && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><GraduationCap className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'RECOMMENDED TRAINING' : 'FORMAÇÕES RECOMENDADAS'}</p>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.formations.map((f: any, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground">{f.name}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          f.priority === 'Alta' ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : f.priority === 'Média' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-green-500/10 text-green-600 border border-green-500/20'
                        }`}>{f.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.provider} · {f.duration} · {f.cost}</p>
                      <p className="text-xs text-muted-foreground mt-1">{f.relevance}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(f.name + ' ' + (f.provider || '') + ' curso')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#C9A961] hover:underline inline-flex items-center gap-1 px-2 py-1 rounded bg-[#C9A961]/5 border border-[#C9A961]/20"
                        >
                          <ExternalLink className="w-3 h-3" />{isEN ? 'Search training' : 'Pesquisar formação'}
                        </a>
                        <a
                          href={`https://www.coursera.org/search?query=${encodeURIComponent(f.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/5 border border-blue-500/20"
                        >
                          <GraduationCap className="w-3 h-3" />Coursera
                        </a>
                        <a
                          href={`https://www.udemy.com/courses/search/?q=${encodeURIComponent(f.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500/5 border border-purple-500/20"
                        >
                          <GraduationCap className="w-3 h-3" />Udemy
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Free Micro-Courses — AI-generated, different from paid formations */}
            {careerPathData.development_plan?.free_courses && careerPathData.development_plan.free_courses.length > 0 && (
              <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-2 border-green-500/20 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Sparkles className="w-4 h-4 text-green-600" /></GoldIcon>
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-green-700">{isEN ? 'FREE MICRO-COURSES TO START NOW' : 'MICRO-CURSOS GRATUITOS PARA COMEÇAR JÁ'}</p>
                    <p className="text-[10px] text-green-600/70">{isEN ? 'Start learning today at zero cost' : 'Começa a aprender hoje sem qualquer custo'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.free_courses.map((fc: any, i: number) => {
                    const platformSearchUrls: Record<string, string> = {
                      'Coursera': 'https://www.coursera.org/search?query=',
                      'edX': 'https://www.edx.org/search?q=',
                      'LinkedIn Learning': 'https://www.linkedin.com/learning/search?keywords=',
                      'Google Digital Garage': 'https://www.google.com/search?q=site:learndigital.withgoogle.com+',
                      'Khan Academy': 'https://www.khanacademy.org/search?search_again=1&page_search_query=',
                      'freeCodeCamp': 'https://www.freecodecamp.org/news/search/?query=',
                      'Udemy': 'https://www.udemy.com/courses/search/?q=',
                    };
                    const query = fc.search_query || fc.name;
                    const platformBase = fc.platform && platformSearchUrls[fc.platform];
                    const searchUrl = platformBase
                      ? `${platformBase}${encodeURIComponent(query)}`
                      : `https://www.google.com/search?q=${encodeURIComponent(query + ' ' + (fc.platform || '') + ' free course')}`;
                    return (
                      <div key={i} className="p-3 border border-green-500/20 rounded-lg bg-white/50">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-foreground">{fc.name}</p>
                          <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            {isEN ? 'FREE' : 'GRATUITO'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {fc.provider && <span className="font-medium">{fc.provider}</span>}
                          {fc.provider && fc.platform && ' · '}
                          {fc.platform && <span>{fc.platform}</span>}
                          {fc.duration && ` · ${fc.duration}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{fc.relevance}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <a
                            href={searchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-700 hover:underline inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 border border-green-500/20"
                          >
                            <ExternalLink className="w-3 h-3" />{isEN ? 'Find course' : 'Encontrar curso'}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Certifications */}
            {careerPathData.development_plan?.certifications && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><FileCheck className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'RECOMMENDED CERTIFICATIONS' : 'CERTIFICAÇÕES RECOMENDADAS'}</p>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.certifications.map((c: any, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          c.priority === 'Alta' ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : c.priority === 'Média' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-green-500/10 text-green-600 border border-green-500/20'
                        }`}>{c.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.body} · {c.investment}</p>
                      <p className="text-xs text-muted-foreground mt-1">{c.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visibility Exercises */}
            {careerPathData.development_plan?.visibility_exercises && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Globe className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'VISIBILITY EXERCISES' : 'EXERCÍCIOS DE VISIBILIDADE'}</p>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.visibility_exercises.map((v: any, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-lg">
                      <p className="text-sm font-semibold text-foreground">{v.activity}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />{v.platform} · {v.frequency}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{v.expected_impact}</p>
                      <p className="text-xs text-[#C9A961] mt-1 font-medium">→ {isEN ? 'First step' : 'Primeiro passo'}: {v.concrete_first_step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Networking Strategy */}
            {careerPathData.development_plan?.networking_strategy && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Users className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'NETWORKING STRATEGY' : 'ESTRATÉGIA DE NETWORKING'}</p>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.networking_strategy.map((n: any, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-lg">
                      <p className="text-sm font-semibold text-foreground">{n.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">{isEN ? 'Target' : 'Alvo'}: {n.target}</p>
                      {n.communities && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {n.communities.map((c: string, j: number) => (
                            <span key={j} className="text-[10px] bg-[#C9A961]/10 text-[#C9A961] px-2 py-0.5 rounded">{c}</span>
                          ))}
                        </div>
                      )}
                      {n.events && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {n.events.map((e: string, j: number) => (
                            <span key={j} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{e}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Immediate Actions */}
            {careerPathData.immediate_actions && (
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Target className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'IMMEDIATE ACTIONS' : 'ACÇÕES IMEDIATAS'}</p>
                </div>
                <div className="space-y-2">
                  {careerPathData.immediate_actions.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                      <span className="text-xs font-bold text-white bg-[#C9A961] w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {a.priority}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{a.action}</p>
                        <p className="text-xs text-muted-foreground">{a.timeframe} · {a.expected_outcome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Long Term Vision */}
            {careerPathData.long_term_vision && (
              <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/15 border-2 border-[#C9A961]/30 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Sparkles className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? '5-YEAR VISION' : 'VISÃO A 5 ANOS'}</p>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{careerPathData.long_term_vision.five_year_narrative}</p>
                {careerPathData.long_term_vision.key_milestones && (
                  <div className="space-y-2 mt-3">
                    {careerPathData.long_term_vision.key_milestones.map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-1 rounded shrink-0">{m.year}</span>
                        <p className="text-sm text-muted-foreground">{m.milestone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cross-sell: Career Intelligence */}
            <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <GoldIcon>
                  <Zap className="w-5 h-5 text-[#C9A961]" />
                </GoldIcon>
                <div>
                  <p className="text-base font-semibold text-foreground">{isEN ? 'Want a strategic career decision?' : 'Queres uma decisão estratégica de carreira?'}</p>
                  <p className="text-xs text-muted-foreground">{isEN ? 'Career Intelligence compares strategic career directions with data, trade-offs and a clear recommendation.' : 'O Career Intelligence compara direções estratégicas de carreira com dados, trade-offs e uma recomendação clara.'}</p>
                </div>
              </div>
              <a
                href={isEN ? '/en/career-intelligence?upgrade=careerpath' : '/career-intelligence?upgrade=careerpath'}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
              >
                <Zap className="w-4 h-4" />
                {isEN ? 'Discover Career Intelligence' : 'Descobrir Career Intelligence'}
              </a>
            </div>

            {/* Cross-sell: CV Analyser */}
            <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <GoldIcon>
                  <FileCheck className="w-5 h-5 text-[#C9A961]" />
                </GoldIcon>
                <div>
                  <p className="text-base font-semibold text-foreground">{isEN ? 'Want to optimise your CV too?' : 'Quer otimizar o teu CV também?'}</p>
                  <p className="text-xs text-muted-foreground">{isEN ? 'CV Analyser analyses your CV with ATS score, benchmarks and action plan' : 'O CV Analyser analisa o teu CV com score ATS, benchmarks e plano de acção'}</p>
                </div>
              </div>
              <a
                href="/cv-analyser"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
              >
                <FileCheck className="w-4 h-4" />
                {isEN ? 'Try CV Analyser — FREE' : 'Experimentar CV Analyser — GRÁTIS'}
              </a>
            </div>

            {/* Send by email */}
            <div id="cp-report-email-section" className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-8 space-y-5">
              <div className="flex items-center gap-3">
                <GoldIcon>
                  <Mail className="w-5 h-5 text-[#C9A961]" />
                </GoldIcon>
                <div>
                  <p className="text-base font-semibold text-foreground">{isEN ? 'Receive Career Path by Email' : 'Receber Career Path por Email'}</p>
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

            {/* ═══ Share Career Path Result on LinkedIn ═══ */}
            {(() => {
              const score = careerPathData?.career_potential_score?.overall_score || 70;
              const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Strong' : score >= 50 ? 'Promising' : 'Developing';
              const topPct = Math.max(5, 100 - score);
              const today = new Date().toLocaleDateString(isEN ? 'en-GB' : 'pt-PT', { year: 'numeric', month: 'long' });
              const topRole = careerPathData?.career_progression?.progression_stages?.[0]?.role_title || (isEN ? 'Career Path' : 'Career Path');

              const generatePostText = () => {
                if (isEN) {
                  return `I just had my career analysed by @share2inspire_'s AI Career Path tool.\n\nCareer Potential Score: ${score}/100 — ${label}\nTop ${topPct}% of analysed professionals.\n\nThis gave me a clear, data-driven view of my career trajectory, next roles, and what skills to develop.\n\nIf you're thinking about your next career move — I highly recommend it.\n\n\ud83d\udd17 https://share2inspire.pt/en/career-path\n\n#CareerPath #CareerDevelopment #ProfessionalGrowth #Share2Inspire`;
                }
                return `Acabei de ter a minha carreira analisada pelo Career Path da @share2inspire_, com recurso a intelig\u00eancia artificial.\n\nCareer Potential Score: ${score}/100 — ${label}\nTop ${topPct}% dos profissionais analisados.\n\nEsta an\u00e1lise deu-me uma vis\u00e3o clara e baseada em dados sobre a minha traject\u00f3ria de carreira, pr\u00f3ximos cargos e compet\u00eancias a desenvolver.\n\nSe est\u00e1s a pensar no teu pr\u00f3ximo passo de carreira \u2014 recomendo.\n\n\ud83d\udd17 https://share2inspire.pt/career-path\n\n#CareerPath #DesenvolvimentoProfissional #Carreira #Share2Inspire`;
              };

              const generateCertImage = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1200;
                canvas.height = 630;
                const ctx = canvas.getContext('2d')!;

                // Background
                ctx.fillStyle = '#FAFAF8';
                ctx.fillRect(0, 0, 1200, 630);

                // Gold accent line top
                const grd = ctx.createLinearGradient(0, 0, 1200, 0);
                grd.addColorStop(0, '#C9A961');
                grd.addColorStop(1, '#E8D5A3');
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, 1200, 6);

                // Gold accent line bottom
                ctx.fillStyle = grd;
                ctx.fillRect(0, 624, 1200, 6);

                // Left gold vertical accent
                ctx.fillStyle = '#C9A961';
                ctx.fillRect(60, 60, 3, 510);

                // Title
                ctx.fillStyle = '#C9A961';
                ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.letterSpacing = '4px';
                ctx.fillText('CAREER PATH', 90, 100);
                ctx.letterSpacing = '0px';

                // Role
                ctx.fillStyle = '#1A1A1A';
                ctx.font = '700 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(topRole, 90, 155);

                // Divider
                ctx.fillStyle = '#E5E5E5';
                ctx.fillRect(90, 180, 400, 1);

                // Scores section
                ctx.fillStyle = '#C9A961';
                ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.letterSpacing = '2px';
                ctx.fillText(isEN ? 'CAREER POTENTIAL SCORE' : 'CAREER POTENTIAL SCORE', 90, 225);
                ctx.letterSpacing = '0px';
                ctx.fillStyle = '#1A1A1A';
                ctx.font = '700 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(`${score}/100`, 90, 280);
                ctx.fillStyle = '#666666';
                ctx.font = '400 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(label, 90, 308);

                // Top %
                ctx.fillStyle = '#C9A961';
                ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.letterSpacing = '2px';
                ctx.fillText(isEN ? 'RANKING' : 'RANKING', 400, 225);
                ctx.letterSpacing = '0px';
                ctx.fillStyle = '#1A1A1A';
                ctx.font = '700 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(`Top ${topPct}%`, 400, 280);
                ctx.fillStyle = '#666666';
                ctx.font = '400 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                ctx.fillText(isEN ? 'of analysed professionals' : 'dos profissionais analisados', 400, 308);

                // Progression stages
                const stages = careerPathData?.career_progression?.progression_stages?.slice(0, 4) || [];
                if (stages.length > 0) {
                  ctx.fillStyle = '#C9A961';
                  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                  ctx.letterSpacing = '2px';
                  ctx.fillText(isEN ? 'CAREER PROGRESSION' : 'PROGRESS\u00c3O DE CARREIRA', 90, 365);
                  ctx.letterSpacing = '0px';

                  stages.forEach((stage: any, i: number) => {
                    const y = 390 + i * 40;
                    ctx.fillStyle = '#C9A961';
                    ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                    ctx.fillText(`${isEN ? 'Year' : 'Ano'} ${stage.timeline || i + 1}`, 90, y + 12);
                    ctx.fillStyle = '#555555';
                    ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                    ctx.fillText(stage.role_title || '', 200, y + 12);
                  });
                }

                // Right side - circular score
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
                ctx.fillText(`Career Path \u2022 ${today}`, 230, 600);
                ctx.textAlign = 'right';
                ctx.fillText('https://share2inspire.pt', 1110, 600);
                ctx.textAlign = 'left';

                // Download
                const link = document.createElement('a');
                link.download = 'career-path-share2inspire.png';
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
                      <p className="text-base font-semibold text-foreground">{isEN ? 'Share Your Career Path Result' : 'Partilhar Resultado do Career Path'}</p>
                      <p className="text-xs text-muted-foreground">{isEN ? 'Generate an elegant LinkedIn post based on your career analysis' : 'Gera um post elegante para LinkedIn baseado na an\u00e1lise da tua carreira'}</p>
                    </div>
                  </div>

                  {/* Preview of the post */}
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Linkedin className="w-4 h-4 text-[#0077B5]" />
                      <span className="text-xs font-semibold text-muted-foreground">{isEN ? 'POST PREVIEW' : 'PR\u00c9-VISUALIZA\u00c7\u00c3O DO POST'}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{generatePostText()}</p>
                  </div>

                  {/* Action buttons */}
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
                      {isEN ? 'Download Career Path Image' : 'Descarregar Imagem Career Path'}
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center">
                    {isEN ? 'The image is optimised for LinkedIn posts (1200\u00d7630px)' : 'A imagem est\u00e1 optimizada para posts no LinkedIn (1200\u00d7630px)'}
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
              <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? 'UNLOCK CAREER PATH' : 'DESBLOQUEAR CAREER PATH'}</p>
              <p className="text-4xl font-bold text-foreground">{fmtPrice(P.cp)}</p>
              <p className="text-sm text-muted-foreground">{isEN ? 'Full report with personalised roadmap' : 'Relatório completo com roadmap personalizado'}</p>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    plan.popular
                      ? 'border-[#C9A961] bg-[#C9A961]/5 shadow-lg'
                      : 'border-border bg-card hover:border-[#C9A961]/50'
                  }`}
                  onClick={() => openPaymentModal(plan.id)}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#C9A961] text-white text-xs font-bold whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">{fmtPrice(plan.price)}</span>
                    </div>
                    <Button
                      onClick={(e) => { e.stopPropagation(); openPaymentModal(plan.id); }}
                      className={`w-full text-sm font-semibold ${
                        plan.popular
                          ? 'bg-[#C9A961] hover:bg-[#A88B4E] text-white'
                          : 'bg-foreground hover:bg-foreground/90 text-background'
                      }`}
                    >
                      {isEN ? 'Choose' : 'Escolher'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center space-y-2">
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
              <Compass className="w-5 h-5 text-[#C9A961]" />
              {isEN ? 'Unlock Career Path' : 'Desbloquear Career Path'}
            </DialogTitle>
          </DialogHeader>

          {paymentStep === 'select' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPlan.id === plan.id
                        ? 'border-[#C9A961] bg-[#C9A961]/5'
                        : 'border-border hover:border-[#C9A961]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        {appliedCoupon ? (
                          <>
                            <p className="text-sm line-through text-muted-foreground">{fmtPrice(plan.price)}</p>
                            <p className="text-lg font-bold text-green-600">{fmtPrice(fmtDiscountedPrice(plan.price))}</p>
                          </>
                        ) : (
                          <p className="text-lg font-bold text-foreground">{fmtPrice(plan.price)}</p>
                        )}
                        {plan.badge && <span className="text-[10px] font-bold text-[#C9A961]">{plan.badge}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setPaymentStep('payment')}
                className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
              >
                {appliedCoupon ? (
                  isEN ? <>Continue with {selectedPlan.name} — <span className="line-through text-slate-400 mr-1">{fmtPrice(selectedPlan.price)}</span> {fmtPrice(fmtDiscountedPrice(selectedPlan.price))}</> : <>Continuar com {selectedPlan.name} — <span className="line-through text-slate-400 mr-1">{fmtPrice(selectedPlan.price)}</span> {fmtPrice(fmtDiscountedPrice(selectedPlan.price))}</>
                ) : (
                  isEN ? `Continue with ${selectedPlan.name} — ${fmtPrice(selectedPlan.price)}` : `Continuar com ${selectedPlan.name} — ${fmtPrice(selectedPlan.price)}`
                )}
              </Button>
            </div>
          )}

          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20">
                <p className="text-sm font-semibold text-foreground">{selectedPlan.name}</p>
                {appliedCoupon ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm line-through text-muted-foreground">{fmtPrice(selectedPlan.price)}</p>
                    <p className="text-lg font-bold text-green-600">{fmtPrice(fmtDiscountedPrice(selectedPlan.price))}</p>
                    <span className="text-xs text-green-600">(-{appliedCoupon.percent}%)</span>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-[#C9A961]">{fmtPrice(selectedPlan.price)}</p>
                )}
              </div>

              {/* Email */}
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

              {/* Payment method */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">{isEN ? 'Payment method' : 'Método de pagamento'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {isEN ? (
                    <>
                      <button
                        onClick={() => setPaymentMethod('stripe')}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          paymentMethod === 'stripe'
                            ? 'border-[#635BFF] bg-[#635BFF]/5 text-foreground'
                            : 'border-border text-muted-foreground hover:border-[#635BFF]/50'
                        }`}
                      >
                        Card
                      </button>
                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          paymentMethod === 'paypal'
                            ? 'border-[#0070BA] bg-[#0070BA]/5 text-foreground'
                            : 'border-border text-muted-foreground hover:border-[#0070BA]/50'
                        }`}
                      >
                        PayPal
                      </button>
                    </>
                  ) : (
                    <>  
                      {(['mbway', 'stripe', 'paypal'] as const).map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            paymentMethod === method
                              ? 'border-[#C9A961] bg-[#C9A961]/5 text-foreground'
                              : 'border-border text-muted-foreground hover:border-[#C9A961]/50'
                          }`}
                        >
                          {method === 'mbway' ? 'MB WAY' : method === 'stripe' ? 'Cartão' : 'PayPal'}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Phone (MB WAY only) */}
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
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1"
                >
                  {isEN ? 'Back' : 'Voltar'}
                </Button>
                <Button
                  onClick={paymentMethod === 'stripe' ? handleStripePayment : paymentMethod === 'mbway' ? handleMBWayPayment : handlePayPalPayment}
                  disabled={paymentLoading}
                  className={`flex-1 font-semibold text-white ${
                    paymentMethod === 'stripe' ? 'bg-[#635BFF] hover:bg-[#5046E5]' : 'bg-[#C9A961] hover:bg-[#A88B4E]'
                  }`}
                >
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : appliedCoupon ? (
                    isEN ? `Pay ${fmtPrice(fmtDiscountedPrice(selectedPlan.price))}` : `Pagar ${fmtPrice(fmtDiscountedPrice(selectedPlan.price))}`
                  ) : (
                    isEN ? `Pay ${fmtPrice(selectedPlan.price)}` : `Pagar ${fmtPrice(selectedPlan.price)}`
                  )}
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
              {!pollingExpired && (
                <p className="text-xs text-muted-foreground">{isEN ? 'Waiting for payment confirmation...' : 'A aguardar confirmação do pagamento...'}</p>
              )}
              {pollingExpired && (
                <Button
                  onClick={handleManualCheck}
                  className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
                >
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
              <p className="text-sm text-muted-foreground">{isEN ? 'Generating your personalised Career Path...' : 'A gerar o teu Career Path personalizado...'}</p>
              <Button
                onClick={handlePaymentSuccess}
                className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
              >
                <Rocket className="w-4 h-4 mr-2" />
                {isEN ? 'Generate Career Path' : 'Gerar Career Path'}
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
              {isEN ? 'Enter your code to unlock the Career Path.' : 'Introduz o teu código para desbloquear o Career Path.'}
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
