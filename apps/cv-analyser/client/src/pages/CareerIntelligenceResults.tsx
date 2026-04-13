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
import { trackAffiliateConversion, incrementCouponUsage } from "@/lib/affiliate";
import { redirectToCheckout } from '../lib/webviewPayment';
import { finishAndClean } from "@/lib/storageCleanup";
import { t, pick, getLang } from '@/i18n';
import { localePath } from '@/i18n/useTranslation';
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";
import { normalizeCareerIntelligencePayload } from "@/lib/analysisPayload";
import { transformGeminiResponse } from "@/lib/transformGeminiResponse";
import { saveToUserAnalyses } from "@/lib/saveToUserAnalyses";

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

/* ─── Gold Icon wrapper ─── */
function GoldIcon({ children, size = "w-10 h-10" }: { children: React.ReactNode; size?: string }) {
  return (
    <div className={`${size} rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0`}>
      {children}
    </div>
  );
}

export default function CareerIntelligenceResults() {
  usePageSEO(pageSeo.careerIntelligenceResults);

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
        career_goal: (localStorage.getItem('careerGoal') || sessionStorage.getItem('careerGoal')) || '',
        results_html: document.querySelector('.career-intelligence-results')?.innerHTML || '',
      });
      setSavedToAccount(true);
    } catch (err: any) {
      if (err?.message === 'SESSION_EXPIRED' || err?.message === 'NOT_LOGGED_IN') {
        setSaveError(t('sesso_expirada_faz_login_novamente'));
        setIsLoggedIn(false);
      } else {
        setSaveError(t('erro_ao_guardar_tenta_novamente'));
      }
    } finally {
      setSavingToAccount(false);
    }
  };

  const genMessages = [
    pick("A analisar o teu perfil profissional...", "Analysing your professional profile...", "Analizando tu perfil profesional..."),
    pick("A mapear competências e experiência...", "Mapping competencies and experience...", "Mapeando competencias y experiencia..."),
    pick("A identificar caminhos estratégicos...", "Identifying strategic career paths...", "Identificando caminos estratégicos..."),
    pick("A calcular probabilidades de sucesso...", "Calculating success probabilities...", "Calculando probabilidades de éxito..."),
    pick("A avaliar trade-offs por caminho...", "Evaluating trade-offs per path...", "Evaluando trade-offs por camino..."),
    pick("A comparar cenários de carreira...", "Comparing career scenarios...", "Comparando escenarios profesionales..."),
    pick("A construir a recomendação de decisão...", "Building your decision recommendation...", "Construyendo tu recomendación de decisión..."),
    pick("A gerar o teu relatório Career Intelligence...", "Generating your Career Intelligence report...", "Generando tu informe de Career Intelligence..."),
  ];

  useEffect(() => {
    if (!isGenerating) { setGenStep(0); return; }
    const interval = setInterval(() => {
      setGenStep(prev => prev < genMessages.length - 1 ? prev + 1 : prev);
    }, 5000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const lang = getLang();
  const isEN = lang === 'en';
  const isES = lang === 'es';
  const careerIntelligenceHomePath = '/';
  const getCareerIntelligenceProfile = (analysis: any) => {
    return analysis?.candidate_profile || analysis?.cv_analysis?.candidate_profile || analysis?.profile || {};
  };
  const hasCareerIntelligenceStructure = (analysis: any) => {
    if (!analysis || typeof analysis !== 'object') return false;
    return Boolean(
      analysis.market_context ||
      analysis.decision_recommendation ||
      analysis.career_potential_score ||
      (Array.isArray(analysis.strategic_paths) && analysis.strategic_paths.length > 0) ||
      (Array.isArray(analysis.action_plan_by_path) && analysis.action_plan_by_path.length > 0) ||
      (Array.isArray(analysis.strategic_comparison) && analysis.strategic_comparison.length > 0) ||
      (Array.isArray(analysis.tradeoffs) && analysis.tradeoffs.length > 0)
    );
  };
  const readCareerIntelligenceData = () => {
    const raw =
      localStorage.getItem('careerIntelligenceData') ||
      sessionStorage.getItem('careerIntelligenceData') ||
      localStorage.getItem('careerPathData') ||
      sessionStorage.getItem('careerPathData');

    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      const normalized = normalizeCareerIntelligencePayload(parsed, (localStorage.getItem('analysisLang') || sessionStorage.getItem('analysisLang')) || lang);
      return hasCareerIntelligenceStructure(normalized.analysis) ? normalized.analysis : null;
    } catch {
      return null;
    }
  };
  const siteHomePath = pick('/', '/en/', '/es/');
  const defaultPaymentMethod: 'mbway' | 'stripe' | 'paypal' = isEN ? 'stripe' : 'mbway';
  const paymentMethodOptions: Array<'mbway' | 'stripe' | 'paypal'> = isEN
    ? ['stripe', 'paypal']
    : ['mbway', 'stripe', 'paypal'];
  const paymentMethodLabel = (method: 'mbway' | 'stripe' | 'paypal') => method === 'mbway' ? 'MB WAY' : method === 'stripe' ? pick('Cartão', 'Card', 'Tarjeta') : 'PayPal';
  const paymentPhonePlaceholder = pick('9XXXXXXXX', '+1 555 123 4567', '6XXXXXXXX');

  const CUR = t('bca53fde');
  const CURRENCY_CODE = t('eur');

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
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>(defaultPaymentMethod);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // ─── Load data from sessionStorage ───
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
    const isStripeReturn = paymentStatus === 'success' && !!sessionId;

    const cvData = (localStorage.getItem('careerPathCvAnalysis') || sessionStorage.getItem('careerPathCvAnalysis'));
    const linkedin = (localStorage.getItem('careerPathLinkedinUrl') || sessionStorage.getItem('careerPathLinkedinUrl'));
    const paidFlag = (localStorage.getItem('careerPathPaid') || sessionStorage.getItem('careerPathPaid'));
    const savedData = readCareerIntelligenceData();

    if (!cvData && !isStripeReturn) {
      setLocation(careerIntelligenceHomePath);
      return;
    }

    if (cvData) {
      try {
        const parsedCv = JSON.parse(cvData);
        const analysisLanguage = ((localStorage.getItem('analysisLang') || sessionStorage.getItem('analysisLang')) || lang) as 'pt' | 'en' | 'es';
        const rawCvAnalysis = parsedCv?.analysis || parsedCv;
        const normalizedCv = transformGeminiResponse(rawCvAnalysis, analysisLanguage);
        setCvAnalysis({
          ...parsedCv,
          ...normalizedCv,
          raw: rawCvAnalysis,
          candidate_profile: parsedCv?.candidate_profile || parsedCv?.cv_analysis?.candidate_profile || rawCvAnalysis?.candidate_profile || {},
          profile: parsedCv?.profile || rawCvAnalysis?.profile || {},
        });
      } catch {
        if (!isStripeReturn) {
          setLocation(careerIntelligenceHomePath);
          return;
        }
      }
    }

    if (!cvData && isStripeReturn) {
      const savedEmail = (localStorage.getItem('cpPaymentEmail') || sessionStorage.getItem('cpPaymentEmail'));
      if (savedEmail) setEmail(savedEmail);
    }

    if (linkedin) setLinkedinUrl(linkedin);

    if (paidFlag === 'true') {
      const ciFullFlag = (localStorage.getItem('careerIntelligenceFull') || sessionStorage.getItem('careerIntelligenceFull'));
      const ciNeedsRegen = (localStorage.getItem('ciNeedsRegeneration') || sessionStorage.getItem('ciNeedsRegeneration'));
      
      if (ciFullFlag === 'true' && (ciNeedsRegen === 'true' || !savedData)) {
        // Career Intelligence was paid — always generate fresh analysis with the
        // country/region the user selected in the CI form (not from Career Path).
        (localStorage.removeItem('ciNeedsRegeneration'), sessionStorage.removeItem('ciNeedsRegeneration'));
        setIsPaid(true);
        setTimeout(() => { generateAnalysis(); }, 300);
      } else if (savedData) {
        setCareerData(savedData);
        setIsPaid(true);
      } else if (ciFullFlag === 'true') {
        setIsPaid(true);
        setTimeout(() => { generateAnalysis(); }, 300);
      }
    }

    // Handle cancelled payment — clean URL and redirect to the localized Career Intelligence entry page
    if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
      setLocation(careerIntelligenceHomePath);
      return;
    }

    if (paymentStatus === 'success' && sessionId) {
      fetch(`${BACKEND_URL}/api/payment/stripe-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      }).then(res => res.json()).then(data => {
        if (data.success && data.paid) {
          const stripeAmount = data.amount || 49;
          const productType = data.product_type || 'career_intelligence_full';
          if (productType === 'career_intelligence_full') {
            localStorage.setItem('careerPathPaid', 'true');
            localStorage.setItem('careerIntelligenceProPaid', 'true');
            localStorage.setItem('careerIntelligenceFull', 'true');
            sessionStorage.setItem('careerPathPaid', 'true');
            sessionStorage.setItem('careerIntelligenceProPaid', 'true');
            sessionStorage.setItem('careerIntelligenceFull', 'true');
            trackPurchase('career_intelligence_full', stripeAmount, `CI-STRIPE-${sessionId}`);
            trackAffiliateConversion({ product: 'career_intelligence_full', amount: stripeAmount, currency: t('eur'), payment_method: 'stripe', transaction_id: `CI-STRIPE-${sessionId}` });
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
      const cvText = (localStorage.getItem('careerPathCvText') || sessionStorage.getItem('careerPathCvText')) || '';
      const response = await fetch(`${SUPABASE_URL}/functions/v1/hyper-task`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'career_intelligence',
          cv_text: cvText,
          linkedin_url: linkedinUrl || undefined,
          language: (localStorage.getItem('analysisLang') || sessionStorage.getItem('analysisLang')) || lang,
          country: (localStorage.getItem('analysisCountry') || sessionStorage.getItem('analysisCountry')) || undefined,
          region: (localStorage.getItem('analysisRegion') || sessionStorage.getItem('analysisRegion')) || undefined,
        }),
      });

      const data = await response.json();
      if (!data.success && !data.career_intelligence && !data.career_path) {
        throw new Error(data.error || (t('erro_ao_gerar_career_intelligence')));
      }

      const normalizedCareerIntelligence = normalizeCareerIntelligencePayload(data, (localStorage.getItem('analysisLang') || sessionStorage.getItem('analysisLang')) || lang);
      const ciData = normalizedCareerIntelligence.analysis;
      setCareerData(ciData);
      setIsPaid(true);
      localStorage.setItem('careerPathPaid', 'true');
      localStorage.setItem('careerIntelligenceData', JSON.stringify(normalizedCareerIntelligence));
      sessionStorage.setItem('careerIntelligenceData', JSON.stringify(normalizedCareerIntelligence));
      localStorage.setItem('careerPathData', JSON.stringify(normalizedCareerIntelligence));
      sessionStorage.setItem('careerPathData', JSON.stringify(normalizedCareerIntelligence));

      // Save to user_analyses for area-cliente
      // Delay to capture HTML after React renders the full results
      setTimeout(async () => {
        try {
          await saveToUserAnalyses('career_intelligence', {
            strategic_paths: ciData.strategic_paths || [],
            decision_recommendation: ciData.decision_recommendation || {},
            market_context: ciData.market_context || {},
            career_potential_score: ciData.career_potential_score || {},
            career_goal: (localStorage.getItem('careerGoal') || sessionStorage.getItem('careerGoal')) || '',
            results_html: document.querySelector('.career-intelligence-results')?.innerHTML || '',
          });
          setSavedToAccount(true);
        } catch (e: any) {
          console.warn('[S2I] Auto-save after generation failed:', e?.message);
        }
      }, 1500);
    } catch (err: any) {
      setGenerateError(err.message || (t('erro_ao_gerar_career_intelligence_2')));
    } finally {
      setIsGenerating(false);
    }
  }, [linkedinUrl]);

  // ─── Discount code validation ───
  const handleDiscountSubmit = async () => {
    if (!discountCode.trim()) { setDiscountError(t('introduz_um_cdigo')); return; }
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
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError(t('este_cdigo_ainda_no_est')); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError(t('este_cdigo_j_expirou')); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError(t('este_cdigo_atingiu_o_limite')); return; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('career_intelligence') && !products.includes('career_intelligence_full')) {
          setDiscountError(t('este_cdigo_no_aplicvel_aqui')); return;
        }
        if (coupon.discount_percent === 100) {
          trackPurchase('career_intelligence_full', 0, `COUPON-${code}`);
          trackAffiliateConversion({ product: 'career_intelligence_full', amount: 0, currency: t('eur'), payment_method: 'coupon', transaction_id: `COUPON-${code}` });
          incrementCouponUsage(code);
          localStorage.setItem('careerPathPaid', 'true');
          localStorage.setItem('careerIntelligenceProPaid', 'true');
          localStorage.setItem('careerIntelligenceFull', 'true');
          setIsPaid(true);
          setShowDiscountModal(false);
          setTimeout(() => { generateAnalysis(); }, 300);
          return;
        }
        // Partial discount — not yet handled for CI full, just show error
        setDiscountError(t('descontos_parciais_no_esto_disponveis'));
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
        if (!v.is_active) { setDiscountError(t('este_cdigo_j_foi_utilizado')); return; }
        if (v.used_analyses >= v.total_analyses) { setDiscountError(t('este_cdigo_j_no_tem_2')); return; }
        if (v.voucher_type !== 'career_intelligence' && v.voucher_type !== 'career_intelligence_full' && v.voucher_type !== 'complete') {
          setDiscountError(t('este_cdigo_no_vlido_para_2')); return;
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
        trackAffiliateConversion({ product: 'career_intelligence_full', amount: 0, currency: t('eur'), payment_method: 'voucher', transaction_id: `CI-VOUCHER-${code}` });
        localStorage.setItem('careerPathPaid', 'true');
        localStorage.setItem('careerIntelligenceProPaid', 'true');
        localStorage.setItem('careerIntelligenceFull', 'true');
        setIsPaid(true);
        setShowDiscountModal(false);
        setTimeout(() => { generateAnalysis(); }, 300);
        return;
      }

      setDiscountError(t('cdigo_invlido_ou_expirado'));
    } catch (err: any) {
      setDiscountError(err.message || (t('erro_ao_validar_cdigo')));
    } finally {
      setDiscountLoading(false);
    }
  };

  // ─── Payment handlers ───
  const CI_PRICE = getLang() === 'en' ? 49 : 49;
  const CI_PRICE_DISPLAY = pick(`${CI_PRICE}€`, `$${CI_PRICE}`, `${CI_PRICE}€`);

  const openPaymentModal = () => {
    setPaymentStep('payment');
    setPaymentError(null);
    setPaymentMethod(defaultPaymentMethod);
    setShowPaymentModal(true);
  };

  const handleMBWayPayment = async () => {
    if (!email) { setPaymentError(t('introduz_o_teu_email')); return; }
    if (!phone) { setPaymentError(t('introduz_o_teu_nmero_de')); return; }
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const orderId = `CI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ciOrderId', orderId);
      localStorage.setItem('cpPaymentEmail', email);
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
      if (!data.success) throw new Error(data.error || (t('erro_ao_iniciar_pagamento')));
      setPaymentStep('polling');
      setPollingMsg(t('confirma_o_pagamento_na_app'));
      startPolling(orderId);
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError(pick('Por favor, introduz o teu email', 'Please enter your email', 'Por favor, introduce tu correo electrónico')); return; }
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
          language: lang,
          currency: CURRENCY_CODE.toLowerCase(),
          amount: CI_PRICE,
          success_url: `${window.location.origin}${localePath('/career-intelligence/results')}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}${localePath('/career-intelligence/results')}?payment=cancelled`,
        }),
      });
      const data = await response.json();
      if (!data.success || !data.url) throw new Error(data.error || pick('Erro ao criar sessão de checkout', 'Error creating checkout session', 'Error al crear la sesión de checkout'));
      localStorage.setItem('ciOrderId', orderId);
      localStorage.setItem('cpPaymentEmail', email);
      localStorage.setItem('stripeSessionId', data.sessionId);
      redirectToCheckout(data.url);
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!email) { setPaymentError(t('introduz_o_teu_email')); return; }
    localStorage.setItem('cpPaymentEmail', email);
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
          setPollingMsg(t('o_pagamento_expirou_usa_o'));
          return;
        }
        if (elapsed < 30000) setPollingMsg(t('confirma_o_pagamento_na_app_2'));
        else if (elapsed < 60000) setPollingMsg(t('ainda_a_aguardar_verifica_a'));
        else setPollingMsg(t('a_aguardar_confirmao'));
        if (attempts >= 60) { clearInterval(interval); setPollingExpired(true); }
      } catch { consecutiveErrors++; }
    }, 5000);
  };

  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMsg(t('a_verificar_pagamento'));
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
        setPollingMsg(t('pagamento_ainda_no_confirmado_tenta'));
      }
    } catch {
      setPollingExpired(true);
      setPollingMsg(t('erro_ao_verificar_tenta_novamente_2'));
    }
  };

  const unlockAndGenerate = (orderId: string) => {
    setShowPaymentModal(false);
    localStorage.setItem('careerPathPaid', 'true');
    localStorage.setItem('careerIntelligenceProPaid', 'true');
    localStorage.setItem('careerIntelligenceFull', 'true');
    trackPurchase('career_intelligence_full', CI_PRICE, orderId);
    trackAffiliateConversion({ product: 'career_intelligence_full', amount: CI_PRICE, currency: t('eur'), payment_method: paymentMethod, transaction_id: orderId });
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
    const targetEmail = reportEmail || email || (localStorage.getItem('cpPaymentEmail') || sessionStorage.getItem('cpPaymentEmail')) || '';
    if (!targetEmail) { setReportError(t('introduz_um_email_vlido')); return; }
    setReportSending(true);
    setReportError(null);
    try {
      const ciEmailRoute = t('sendcareerintelligenceemail');
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
      setReportError(t('erro_ao_enviar_email_tenta'));
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

  const candidateProfile = getCareerIntelligenceProfile(cvAnalysis);
  const profileName = candidateProfile.detected_name || cvAnalysis.name || cvAnalysis.candidate_name || (t('o_teu_perfil'));
  const currentRole = candidateProfile.detected_role || cvAnalysis.current_role || cvAnalysis.perceivedRole || (t('profissional'));
  const seniority = candidateProfile.seniority || cvAnalysis.perceivedSeniority || cvAnalysis.seniority || '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLocation(careerIntelligenceHomePath)}
              className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('voltar')}</span>
            </button>
            <a href={siteHomePath} className="flex items-center" aria-label="Share2Inspire">
              <img src="/logo-s2i.png" alt="Share2Inspire" loading="lazy" decoding="async" width="220" height="48" className="h-10 sm:h-11 w-auto object-contain" />
            </a>
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
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
                <span className="text-xs sm:text-sm font-semibold text-green-600">{t('relatrio_completo')}</span>
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
                  <span className="hidden sm:inline">{t('tenho_cdigo')}</span>
                  <span className="sm:hidden">{t('cdigo')}</span>
                </Button>
                <Button
                  onClick={() => openPaymentModal()}
                  size="sm"
                  className="bg-[#C9A961] hover:bg-[#A88B4E] text-white text-xs sm:text-sm font-semibold px-3 sm:px-5 py-1.5 sm:py-2"
                >
                  <span className="hidden sm:inline">{t('desbloquear_anlise')}</span>
                  <span className="sm:hidden">{t('desbloquear')}</span>
                </Button>
              </>
            )}
            <button
              onClick={() => finishAndClean(setLocation)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <HomeIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-2 sm:px-6 py-4 sm:py-10 space-y-4 sm:space-y-8">
        {/* Hero Profile Card */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/[0.03] via-[#C9A961]/[0.08] to-foreground/[0.03]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,169,97,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(201,169,97,0.05) 0%, transparent 50%)' }} />
          
          <div className="relative px-3 sm:px-8 py-5 sm:py-10">
            <div className="flex justify-between items-start mb-6">
              {isPaid ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-green-600">{t('relatrio_career_intelligence')}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                  <span className="text-xs font-semibold text-[#C9A961]">{t('prvisualizao')}</span>
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
                  <span className="text-xs font-medium text-[#0077B5]">{pick('LinkedIn', 'LinkedIn', 'LinkedIn')}</span>
                </a>
              )}
            </div>
          </div>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A961]/40 to-transparent" />
        </div>

        {/* Generating state */}
        {isGenerating && (
          <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/10 border-2 border-[#C9A961]/20 rounded-2xl p-4 sm:p-10 text-center space-y-4 sm:space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-[#C9A961]/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#C9A961] animate-spin" />
              <Scale className="absolute inset-0 m-auto w-6 h-6 text-[#C9A961]" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-foreground transition-all duration-500">
                {genMessages[genStep]}
              </p>
              <p className="text-xs text-muted-foreground">
                {pick(`Passo ${genStep + 1} de ${genMessages.length}`, `Step ${genStep + 1} of ${genMessages.length}`, `Paso ${genStep + 1} de ${genMessages.length}`)}
              </p>
            </div>
            <div className="max-w-sm mx-auto">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C9A961] to-[#E8D5A3] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(((genStep + 1) / genMessages.length) * 100, 95)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60">
              {t('isto_pode_demorar_at_60')}
            </p>
          </div>
        )}

        {/* Error state */}
        {generateError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{t('erro_ao_gerar_career_intelligence')}</p>
              <p>{generateError}</p>
              <button onClick={generateAnalysis} className="mt-2 text-red-600 underline text-xs">{t('tentar_novamente')}</button>
            </div>
          </div>
        )}

        {/* ═══ PAID CONTENT — Career Intelligence Results ═══ */}
        {isPaid && careerData && !isGenerating && (
          <div className="career-intelligence-results space-y-6">

            {/* Market Context */}
            {careerData.market_context && (
             <div className="bg-card border border-border rounded-xl p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Globe className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('contexto_de_mercado')}</p>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/20 rounded-lg border border-border">
                    <p className="text-[10px] font-semibold text-[#C9A961] mb-2">{t('empresas_alinhadas')}</p>
                    {typeof careerData.market_context.aligned_companies === 'object' && !Array.isArray(careerData.market_context.aligned_companies) ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(careerData.market_context.aligned_companies).filter(([key]) => key !== 'aligned_companies_note').map(([sector, companies]: [string, any]) => (
                          <div key={sector} className="space-y-1">
                            <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">{sector}</p>
                            <ul className="space-y-0.5">
                              {(Array.isArray(companies) ? companies : [companies]).map((company: string, idx: number) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                  <span className="text-[#C9A961] mt-0.5 shrink-0">•</span>
                                  <span>{company}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{typeof careerData.market_context.aligned_companies === 'string' ? careerData.market_context.aligned_companies : JSON.stringify(careerData.market_context.aligned_companies)}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/20 rounded-lg border border-border">
                      <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{t('nvel_de_procura')}</p>
                      <p className="text-xs text-muted-foreground">{careerData.market_context.demand_level}</p>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg border border-border">
                      <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{t('competitividade')}</p>
                      <p className="text-xs text-muted-foreground">{careerData.market_context.competitiveness}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-[#C9A961]/5 to-transparent rounded-lg border border-[#C9A961]/20">
                    <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{t('o_que_te_diferencia')}</p>
                    <p className="text-xs text-muted-foreground">{careerData.market_context.differentiator}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Strategic Career Paths */}
            {careerData.strategic_paths && careerData.strategic_paths.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Compass className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('caminhos_estratgicos_de_carreira')}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t('trs_caminhos_distintos_baseados_no')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {careerData.strategic_paths.map((path: any, i: number) => (
                    <div key={i} className="border border-border rounded-xl overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{t('caminho')} {i + 1}</span>
                          <span className="text-sm font-semibold text-foreground">{path.name}</span>
                        </div>
                        {path.success_probability && (
                          <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            {path.success_probability}% {t('sucesso')}
                          </span>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm text-muted-foreground">{path.logic}</p>
                        <div className="p-2 bg-muted/20 rounded-lg">
                          <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{t('ideal_para')}</p>
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
              <div className="bg-card border border-border rounded-xl p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Target className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('plano_de_aco_por_caminho')}</p>
                </div>
                <div className="space-y-4">
                  {careerData.action_plan_by_path.map((plan: any, i: number) => (
                    <div key={i} className="border border-border rounded-xl overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center gap-2">
                        <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{t('caminho')} {i + 1}</span>
                        <span className="text-sm font-semibold text-foreground">{plan.path_name}</span>
                        {plan.is_recommended && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            {t('recomendado')}
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
                                <span className="text-[10px] text-amber-600 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{t('passochave')}</span>
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
              <div className="bg-card border border-border rounded-xl p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><BarChart3 className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('comparao_estratgica')}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">{t('critrio')}</th>
                        {careerData.strategic_comparison.map((item: any, i: number) => (
                          <th key={i} className="text-center py-2 px-2 font-semibold text-foreground">{item.path_name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 'success_probability', label: t('probabilidade_de_sucesso'), suffix: '%' },
                        { key: 'estimated_time', label: t('tempo_estimado'), suffix: '' },
                        { key: 'effort_level', label: t('esforo'), suffix: '' },
                        { key: 'risk_level', label: t('risco'), suffix: '' },
                        { key: 'salary_impact', label: t('impacto_salarial'), suffix: '' },
                        { key: 'profile_fit', label: t('alinhamento'), suffix: '' },
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
              <div className="bg-card border border-border rounded-xl p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Scale className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('tradeoffs_por_caminho')}</p>
                </div>
                <div className="space-y-4">
                  {careerData.tradeoffs.map((tradeoff: any, i: number) => (
                    <div key={i} className="border border-border rounded-xl p-3 space-y-3">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{i + 1}</span>
                        {tradeoff.path_name}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                          <p className="text-[10px] font-semibold text-green-600 mb-1">{t('ganhas')}</p>
                          <p className="text-xs text-muted-foreground">{tradeoff.you_gain}</p>
                        </div>
                        <div className="p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                          <p className="text-[10px] font-semibold text-red-500 mb-1">{t('abdicas')}</p>
                          <p className="text-xs text-muted-foreground">{tradeoff.you_give_up}</p>
                        </div>
                      </div>
                      <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                        <p className="text-[10px] font-semibold text-amber-600 mb-1">{t('risco_oculto')}</p>
                        <p className="text-xs text-muted-foreground">{tradeoff.hidden_risk}</p>
                      </div>
                      <div className="p-2 bg-muted/20 rounded-lg">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1">{t('cenrio_real')}</p>
                        <p className="text-xs text-muted-foreground">{tradeoff.real_scenario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Recommendation */}
            {careerData.decision_recommendation && (
              <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/15 border-2 border-[#C9A961]/30 rounded-2xl p-3 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Zap className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{t('deciso_recomendada')}</p>
                </div>
                <div className="p-4 bg-card rounded-xl border border-border">
                  <p className="text-sm font-bold text-foreground mb-2">{careerData.decision_recommendation.recommended_path}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{careerData.decision_recommendation.justification}</p>
                </div>
                {careerData.decision_recommendation.when_to_switch && (
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="text-[10px] font-semibold text-amber-600 mb-1">{t('quando_considerar_outro_caminho')}</p>
                    <p className="text-xs text-muted-foreground">{careerData.decision_recommendation.when_to_switch}</p>
                  </div>
                )}
                {careerData.decision_recommendation.why_better_than_others && (
                  <div className="p-3 bg-card rounded-lg border border-border">
                    <p className="text-[10px] font-semibold text-green-600 mb-1">{t('porque_este_caminho_o_melhor')}</p>
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
                  <p className="text-base font-semibold text-foreground">{t('queres_um_roadmap_detalhado_de')}</p>
                  <p className="text-xs text-muted-foreground">{t('o_career_path_dte_prximos')}</p>
                </div>
              </div>
              <a
                href={t('careerpath')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
              >
                <Compass className="w-4 h-4" />
                {t('experimentar_career_path')}
              </a>
            </div>

            {/* Send by email */}
            <div className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-3 sm:p-8 space-y-5">
              <div className="flex items-center gap-3">
                <GoldIcon>
                  <Mail className="w-5 h-5 text-[#C9A961]" />
                </GoldIcon>
                <div>
                  <p className="text-base font-semibold text-foreground">{t('receber_career_intelligence_por_email')}</p>
                  <p className="text-xs text-muted-foreground">{t('envia_o_relatrio_completo_para')}</p>
                </div>
              </div>
              {reportSent ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <p className="text-sm text-green-600">{t('relatrio_enviado_com_sucesso_verifica')}</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={reportEmail || email || (localStorage.getItem('cpPaymentEmail') || sessionStorage.getItem('cpPaymentEmail')) || ''}
                      onChange={(e) => setReportEmail(e.target.value)}
                      placeholder={t('seuemailcom')}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                    />
                    <Button
                      onClick={handleSendReport}
                      disabled={reportSending}
                      className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold px-6"
                    >
                      {reportSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />{t('enviar')}</>}
                    </Button>
                  </div>
                  {reportError && <p className="text-sm text-red-500">{reportError}</p>}
                </>
              )}
            </div>

            {/* ═══ Save to Área de Cliente ═══ */}
            <div className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-3 sm:p-8 space-y-5">
              <div className="flex items-center gap-3">
                <GoldIcon>
                  <Save className="w-5 h-5 text-[#C9A961]" />
                </GoldIcon>
                <div>
                  <p className="text-base font-semibold text-foreground">{t('guardar_na_rea_de_cliente')}</p>
                  <p className="text-xs text-muted-foreground">{t('acede_aos_teus_resultados_a')}</p>
                </div>
              </div>
              {!isLoggedIn ? (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700">{t('faz_login_para_guardar_os')} <button type="button" onClick={() => window.dispatchEvent(new Event('s2i:open-login-modal'))} className="underline font-semibold text-[#C9A961] hover:text-[#A88B4E]">{t('iniciar_sesso')}</button></p>
                </div>
              ) : savedToAccount ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <p className="text-sm text-green-600">{t('guardado_com_sucesso_consulta_no')}</p>
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
                    {t('guardar_na_minha_conta')}
                  </Button>
                  {saveError && <p className="text-sm text-red-500">{saveError}</p>}
                </>
              )}
            </div>

            {/* ═══ Share Career Intelligence Result on LinkedIn ═══ */}
            {(() => {
              const score = careerData?.career_potential_score?.overall_score || 70;
              const label = score >= 80 ? pick('Excelente', 'Excellent', 'Excelente') : score >= 65 ? pick('Forte', 'Strong', 'Sólido') : score >= 50 ? pick('Promissor', 'Promising', 'Prometedor') : pick('Em desenvolvimento', 'Developing', 'En desarrollo');
              const topPct = Math.max(5, 100 - score);
              const today = new Date().toLocaleDateString(t('ptpt'), { year: 'numeric', month: 'long' });
              const recommendedPath = careerData?.decision_recommendation?.recommended_path || (t('career_intelligence'));

              const generatePostText = () => {
                return pick(
                  `Acabei de ter a minha carreira analisada estrategicamente pelo Career Intelligence da @share2inspire_, com recurso a inteligência artificial.\n\nCareer Potential Score: ${score}/100 — ${label}\nTop ${topPct}% dos profissionais analisados.\n\nEsta análise deu-me 3 caminhos estratégicos de carreira, uma comparação completa com trade-offs e uma recomendação clara sobre qual caminho seguir.\n\nSe estás a decidir o teu próximo passo de carreira — recomendo.\n\n🔗 https://share2inspire.pt/career-intelligence\n\n#CareerIntelligence #EstratégiaDeCarreira #Carreira #Share2Inspire`,
                  `I just had my career strategically analysed by @share2inspire_'s AI Career Intelligence tool.\n\nCareer Potential Score: ${score}/100 — ${label}\nTop ${topPct}% of analysed professionals.\n\nThis gave me 3 strategic career paths, a full comparison with trade-offs, and a clear recommendation on which path to take.\n\nIf you're deciding your next career move — I highly recommend it.\n\n🔗 https://share2inspire.pt/en/career-intelligence\n\n#CareerIntelligence #CareerStrategy #ProfessionalGrowth #Share2Inspire`,
                  `Acabo de analizar estratégicamente mi carrera con la herramienta de IA Career Intelligence de @share2inspire_.\n\nCareer Potential Score: ${score}/100 — ${label}\nTop ${topPct}% de los profesionales analizados.\n\nEste análisis me dio 3 caminos estratégicos de carrera, una comparación completa con trade-offs y una recomendación clara sobre qué camino seguir.\n\nSi estás decidiendo tu próximo paso profesional — lo recomiendo.\n\n🔗 https://share2inspire.pt/career-intelligence\n\n#CareerIntelligence #EstrategiaProfesional #Carrera #Share2Inspire`
                );
              };

          const generateCertImage = () => {
            const lang = getLang();
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
                ctx.fillText(t('dos_profissionais_analisados'), 400, 308);

                // Strategic paths
                const paths = careerData?.strategic_paths?.slice(0, 3) || [];
                if (paths.length > 0) {
                  ctx.fillStyle = '#C9A961';
                  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                  ctx.letterSpacing = '2px';
                  ctx.fillText(t('caminhos_estratgicos'), 90, 365);
                  ctx.letterSpacing = '0px';

                  paths.forEach((path: any, i: number) => {
                    const y = 390 + i * 40;
                    ctx.fillStyle = '#C9A961';
                    ctx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                    ctx.fillText(`${t('caminho_2')} ${i + 1}`, 90, y + 12);
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
                <div className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-3 sm:p-8 space-y-5">
                  <div className="flex items-center gap-3">
                    <GoldIcon>
                      <Award className="w-5 h-5 text-[#C9A961]" />
                    </GoldIcon>
                    <div>
                      <p className="text-base font-semibold text-foreground">{t('partilhar_resultado_do_career_intelligence')}</p>
                      <p className="text-xs text-muted-foreground">{t('gera_um_post_elegante_para_3')}</p>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Linkedin className="w-4 h-4 text-[#0077B5]" />
                      <span className="text-xs font-semibold text-muted-foreground">{t('prvisualizao_do_post')}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{generatePostText()}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={copyPost}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0077B5] hover:bg-[#005F8D] text-white font-semibold text-sm transition-colors"
                    >
                      {postCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {postCopied ? (t('copiado')) : (t('copiar_post_linkedin'))}
                    </button>
                    <button
                      onClick={generateCertImage}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {t('descarregar_imagem_career_intelligence')}
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center">
                    {t('a_imagem_est_optimizada_para')}
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
              <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{t('desbloquear_career_intelligence')}</p>
              <p className="text-4xl font-bold text-foreground">{CI_PRICE_DISPLAY}</p>
              <p className="text-sm text-muted-foreground">{t('anlise_estratgica_de_carreira_com')}</p>
            </div>

            {/* What's included */}
            <div className="bg-card border-2 border-border rounded-2xl p-3 sm:p-8 space-y-5">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#C9A961]" />
                <p className="text-sm font-semibold text-foreground">{t('o_que_o_career_intelligence')}</p>
              </div>
              <div className="space-y-2">
                {[
                  pick('Contexto de mercado e posicionamento competitivo', 'Market context and competitive positioning', 'Contexto de mercado y posicionamiento competitivo'),
                  pick('3 caminhos estratégicos de carreira adaptados ao teu perfil', '3 strategic career paths tailored to your profile', '3 caminos estratégicos de carrera adaptados a tu perfil'),
                  pick('Plano de acção para cada caminho', 'Action plan for each path', 'Plan de acción para cada camino'),
                  pick('Tabela comparativa completa (probabilidade, esforço, risco, salário)', 'Full comparison table (probability, effort, risk, salary)', 'Tabla comparativa completa (probabilidad, esfuerzo, riesgo, salario)'),
                  pick('Análise de trade-offs por caminho', 'Trade-offs analysis per path', 'Análisis de trade-offs por camino'),
                  pick('Decisão recomendada clara com justificação', 'Clear recommended decision with justification', 'Decisión recomendada clara con justificación'),
                ].map((item, i) => (
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
                  {pick(`Desbloquear Career Intelligence — ${CI_PRICE_DISPLAY}`, `Unlock Career Intelligence — ${CI_PRICE_DISPLAY}`, `Desbloquear Career Intelligence — ${CI_PRICE_DISPLAY}`)}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('pagamento_seguro_via_mb_way')}
                </p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowDiscountModal(true)}
                className="text-sm text-[#C9A961] hover:underline flex items-center gap-1 mx-auto"
              >
                <Ticket className="w-4 h-4" />
                {t('j_tenho_um_cdigo_de')}
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
              {t('desbloquear_career_intelligence_2')}
            </DialogTitle>
          </DialogHeader>

          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-[#C9A961]/10 to-[#C9A961]/5 rounded-xl border border-[#C9A961]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('anlise_estratgica_de_carreira')}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t('3_caminhos_comparao_recomendao')}</p>
                  </div>
                  <p className="text-lg font-bold text-[#C9A961]">{CI_PRICE_DISPLAY}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">{pick('Email', 'Email', 'Correo electrónico')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('seuemailcom')}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">{t('mtodo_de_pagamento_2')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethodOptions.map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        paymentMethod === method
                          ? method === 'stripe'
                            ? 'border-[#635BFF] bg-[#635BFF]/5 text-foreground'
                            : method === 'paypal'
                              ? 'border-[#0070BA] bg-[#0070BA]/5 text-foreground'
                              : 'border-[#C9A961] bg-[#C9A961]/5 text-foreground'
                          : method === 'stripe'
                            ? 'border-border text-muted-foreground hover:border-[#635BFF]/50'
                            : method === 'paypal'
                              ? 'border-border text-muted-foreground hover:border-[#0070BA]/50'
                              : 'border-border text-muted-foreground hover:border-[#C9A961]/50'
                      }`}
                    >
                      {paymentMethodLabel(method)}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'mbway' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">{t('telemvel_mb_way')}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={paymentPhonePlaceholder}
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
                  {t('voltar')}
                </Button>
                <Button
                  onClick={paymentMethod === 'stripe' ? handleStripePayment : paymentMethod === 'mbway' ? handleMBWayPayment : handlePayPalPayment}
                  disabled={paymentLoading}
                  className="flex-1 font-semibold text-white bg-[#C9A961] hover:bg-[#A88B4E]"
                >
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (pick(`Pagar ${CI_PRICE_DISPLAY}`, `Pay ${CI_PRICE_DISPLAY}`, `Pagar ${CI_PRICE_DISPLAY}`))}
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
                  {t('j_paguei_verificar_novamente')}
                </Button>
              )}
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-base font-bold text-foreground">{t('pagamento_confirmado')}</p>
              <p className="text-sm text-muted-foreground">{t('a_gerar_o_teu_relatrio')}</p>
              <Button onClick={handlePaymentSuccess} className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold">
                <Scale className="w-4 h-4 mr-2" />
                {t('gerar_relatrio')}
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
              {t('cdigo_de_desconto')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('introduz_o_teu_cdigo_para_2')}
            </p>
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder={t('inserir_cdigo')}
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
              {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Unlock className="w-4 h-4 mr-2" />{t('validar_cdigo')}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
