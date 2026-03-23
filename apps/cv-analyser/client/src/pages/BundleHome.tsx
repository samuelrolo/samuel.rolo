// Bundle — CV Analyser + Career Path | Share2Inspire
// Upload CV + LinkedIn → Pagamento → Ambos os motores correm → Resultados
// Preço PT: €29,00
import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Compass, Target, TrendingUp, CheckCircle2, Linkedin, CreditCard, AlertCircle, Ticket, Briefcase, Sparkles, Shield, Check, ArrowRight, Lock, BarChart3, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { trackAnalysisStart, trackPaymentStart, trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion, incrementCouponUsage } from "@/lib/affiliate";
import { transformGeminiResponse } from "@/lib/transformGeminiResponse";
import { countries } from "./en/countries";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

async function saveToUserAnalyses(analysisType: string, data: Record<string, any>) {
  try {
    const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    const accessToken = parsed?.access_token;
    const userId = parsed?.user?.id;
    if (!accessToken || !userId) return;
    const dedupKey = `s2i_saved_${analysisType}_${Date.now()}`;
    if (sessionStorage.getItem(dedupKey)) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_analyses`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ user_id: userId, analysis_type: analysisType, data: { ...data, captured_at: new Date().toISOString() }, created_at: new Date().toISOString() })
    });
    if (res.ok) { sessionStorage.setItem(dedupKey, 'true'); console.log('[S2I] Analysis saved to user_analyses:', analysisType); }
  } catch (e) { console.warn('[S2I] Error saving to user_analyses:', e); }
}
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

const PRICE = '29,00';
const PRICE_NUM = 29.00;


async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text.trim();
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

// transformGeminiResponse imported from @/lib/transformGeminiResponse

export default function BundleHome() {
  useEffect(() => { document.title = "Bundle CV Analyser + Career Path | Share2Inspire"; }, []);
  const [, setLocation] = useLocation();

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const countryData = countries.find(c => c.country === selectedCountry);

  // Steps: hero -> upload -> payment -> analyzing -> done
  const [step, setStep] = useState<'hero' | 'upload' | 'payment' | 'analyzing' | 'done'>('hero');

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>('mbway');
  const [phone, setPhone] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'polling' | 'success'>('payment');
  const [pollingMsg, setPollingMsg] = useState("");
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Unified discount code
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  // Analysis
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMsg, setAnalysisMsg] = useState("");

  const isValidLinkedinUrl = (url: string) => {
    const trimmed = url.trim().toLowerCase();
    return trimmed.includes('linkedin.com/in/') && trimmed.length > 25;
  };

  const loadingMessages = [
    "A extrair dados do teu CV...",
    "A analisar competências e experiência...",
    "A calcular score ATS...",
    "A gerar estimativa salarial...",
    "A mapear o teu Career Path...",
    "A criar roadmap personalizado...",
    "A preparar os teus resultados..."
  ];

  /* ─── Handle Upload & Proceed to Payment ─── */
  const handleProceedToPayment = () => {
    if (!file) { setError('Faz upload do teu CV (PDF ou DOCX)'); return; }
    if (!isValidLinkedinUrl(linkedinUrl)) { setError('Introduz um URL de LinkedIn válido'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Introduz um email válido'); return; }
    if (!selectedCountry) { setError('Selecciona o teu país para resultados localizados'); return; }
    if (!acceptedTerms) { setError('Aceita a Política de Privacidade'); return; }
    setError(null);
    setPaymentStep('payment');
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  /* ─── Run Both Engines ─── */
  const runBothEngines = async () => {
    setStep('analyzing');
    setAnalysisProgress(0);
    setAnalysisMsg(loadingMessages[0]);

    // Progressive loading messages
    const msgInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        const next = Math.min(prev + 1, loadingMessages.length - 1);
        setAnalysisMsg(loadingMessages[next]);
        return next;
      });
    }, 4000);

    try {
      // Extract CV text
      let cvText = "";
      if (file!.type === 'application/pdf') {
        cvText = await extractTextFromPDF(file!);
      } else {
        cvText = await extractTextFromDOCX(file!);
      }

      const reader = new FileReader();
      const base64Content = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file!);
      });

      const useServerExtraction = cvText.length < 50;

      // ─── ENGINE 1: CV Analyser ───
      setAnalysisMsg("A analisar o teu CV com IA...");
      let cvResponseData: any = null;
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        try {
          const requestBody: any = { mode: 'cv_extraction' };
          if (useServerExtraction) {
            requestBody.file = base64Content;
            requestBody.filename = file!.name;
          } else {
            requestBody.cv_text = cvText.substring(0, 8000);
          }
          const response = await fetch(SUPABASE_EDGE_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            cvResponseData = await response.json();
            if (cvResponseData.success) break;
          }
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < maxRetries && fetchError.name !== 'AbortError') {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } else { throw fetchError; }
        }
      }
      if (!cvResponseData?.success) {
        throw new Error('Erro na análise do CV. Tenta novamente.');
      }

      const cvAnalysisSource = cvResponseData.analysis || cvResponseData;
      const cvAnalysisResult = transformGeminiResponse(cvAnalysisSource);

      // Store CV Analyser results
      sessionStorage.setItem('cvAnalysis', JSON.stringify(cvAnalysisResult));
      sessionStorage.setItem('cvFile', base64Content);
      sessionStorage.setItem('cvFilename', file!.name);
      sessionStorage.setItem('analysisLang', 'pt');
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('paymentEmail', email.trim().toLowerCase());
      // Store country/region for Career Path localisation
      sessionStorage.setItem('analysisCountry', selectedCountry || 'Portugal');
      sessionStorage.setItem('analysisRegion', selectedRegion || '');
      window.currentReportData = cvAnalysisSource;

      // ─── ENGINE 2: Career Path ───
      setAnalysisMsg("A gerar o teu Career Path...");

      // Store Career Path data
      sessionStorage.setItem('careerPathCvAnalysis', JSON.stringify(cvAnalysisSource));
      sessionStorage.setItem('careerPathCvText', (cvText || '').substring(0, 8000));
      sessionStorage.setItem('careerPathCvFile', base64Content);
      sessionStorage.setItem('careerPathCvFilename', file!.name);
      sessionStorage.setItem('careerPathLinkedinUrl', linkedinUrl);
      sessionStorage.setItem('careerPathPaid', 'true');

      // Save bundle analysis to Supabase (for Admin analytics)
      try {
        const cp = cvAnalysisSource?.candidate_profile || {};
        const detectedName = cp.name || cp.detected_name || null;
        const detectedPhone = cp.detected_phone && cp.detected_phone !== 'N/A' ? cp.detected_phone : null;
        const score = cvAnalysisResult.overallScore || cvAnalysisResult.ats_score || 0;
        const professionalArea = cp.detected_role || cp.primary_role || null;
        const transactionId = sessionStorage.getItem('transactionId') || `BUNDLE-${Date.now()}`;
        fetch(`${SUPABASE_URL}/rest/v1/cv_analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            score,
            professional_area: professionalArea,
            analysis_type: 'bundle',
            analysis_result: JSON.stringify(cvAnalysisSource),
            cv_text: cvText || null,
            payment_status: 'paid',
            payment_amount: PRICE_NUM,
            transaction_id: transactionId,
            domain: 'share2inspire.pt',
            user_name: detectedName,
            user_email: email.trim().toLowerCase(),
            user_phone: detectedPhone,
          }),
        }).catch(() => {});
      } catch (_) {}

      // Track conversions
      trackPurchase('bundle_cv_career', PRICE_NUM, `BUNDLE-${Date.now()}`);
      if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: PRICE_NUM, currency: 'EUR'});
      trackAffiliateConversion({
        product: 'bundle_cv_career',
        amount: PRICE_NUM,
        currency: 'EUR',
        payment_method: 'mbway',
        customer_email: email,
        transaction_id: `BUNDLE-${Date.now()}`
      });

      clearInterval(msgInterval);
      setAnalysisMsg("Tudo pronto! A redirecionar...");
      setStep('done');

      // Save to user_analyses for area-cliente dashboard
      try {
        const cvScore = cvAnalysisResult.overallScore || cvAnalysisResult.ats_score || 0;
        saveToUserAnalyses('cv_analyser', {
          score: cvScore,
          analysis: { atsScore: cvAnalysisResult.atsScore, overallScore: cvAnalysisResult.overallScore, keywords: cvAnalysisResult.keywords, recommendations: cvAnalysisResult.recommendations },
          analysis_id: `bundle-${Date.now()}`,
        });
      } catch (_) {}

      // Redirect to CV Analyser results (which also shows Career Path link)
      setTimeout(() => {
        window.location.href = '/cv-analyser/results';
      }, 1500);

    } catch (err: any) {
      clearInterval(msgInterval);
      setError(err.message || 'Erro na análise. Tenta novamente.');
      setStep('upload');
    }
  };

  /* ─── Payment Handlers ─── */
  const handleMBWayPayment = async () => {
    if (!email) { setPaymentError('Introduz o teu email'); return; }
    if (!phone) { setPaymentError('Introduz o teu número de telemóvel'); return; }
    setPaymentLoading(true);
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const cleanPhone = phone.replace(/\s/g, '').replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('351') ? cleanPhone : (cleanPhone.length === 9 ? '351' + cleanPhone : cleanPhone);
      const orderId = `BUNDLE-${Date.now()}`;
      trackPaymentStart('bundle_cv_career', PRICE_NUM);
      const response = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          phone: formattedPhone,
          mobileNumber: formattedPhone,
          amount: PRICE_NUM.toFixed(2),
          email,
          product: 'Bundle CV Analyser + Career Path',
          description: 'Bundle completo — CV Analyser + Career Path',
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Erro ao iniciar pagamento');
      setPaymentStep('polling');
      setPollingMsg('Confirma o pagamento na app MB WAY do teu telemóvel...');
      startPolling(orderId);
    } catch (err: any) {
      setPaymentError(err.message || 'Erro ao processar pagamento');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!email) { setPaymentError('Introduz o teu email'); return; }
    trackPaymentStart('bundle_cv_career', PRICE_NUM);
    window.open(`https://paypal.me/SamuelRolo/${PRICE_NUM}EUR`, '_blank');
    setPaymentStep('success');
    if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: PRICE_NUM, currency: 'EUR'});
    trackPurchase('bundle_cv_career', PRICE_NUM, `BUNDLE-PAYPAL-${Date.now()}`);
    trackAffiliateConversion({ product: 'bundle_cv_career', amount: PRICE_NUM, currency: 'EUR', payment_method: 'paypal', customer_email: email, transaction_id: `BUNDLE-PAYPAL-${Date.now()}` });
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError('Introduz o teu email'); return; }
    setPaymentLoading(true);
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const orderId = `BUNDLE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          amount: PRICE_NUM,
          currency: 'eur',
          description: 'Bundle CV Analyser + Career Path — Share2Inspire',
          orderId,
          success_url: `${window.location.origin}/bundle?paid=true`,
          cancel_url: `${window.location.origin}/bundle`,
        }),
      });
      const data = await response.json();
      if (data.url) {
        sessionStorage.setItem('bundlePendingOrderId', orderId);
        sessionStorage.setItem('bundleEmail', email);
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Erro ao processar pagamento');
    } finally {
      setPaymentLoading(false);
    }
  };

  const startPolling = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 60;
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
        if (!res.ok) {
          consecutiveErrors++;
          if (consecutiveErrors >= 8) {
            clearInterval(interval);
            setPollingExpired(true);
            setPollingMsg('Não foi possível verificar. Usa o botão "Já paguei".');
          }
          return;
        }
        consecutiveErrors = 0;
        const data = await res.json();
        if (data.paid) {
          clearInterval(interval);
          setShowPaymentModal(false);
          // Payment confirmed — run both engines
          runBothEngines();
          return;
        }
        const elapsed = Date.now() - startTime;
        if (data.expired && elapsed > 90000) {
          clearInterval(interval);
          setPollingExpired(true);
          setPollingMsg('O pagamento expirou. Usa o botão abaixo se já pagaste.');
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
          clearInterval(interval);
          setPollingExpired(true);
          setPollingMsg('Tempo esgotado. Se já pagaste, usa o botão abaixo.');
        }
      } catch { consecutiveErrors++; }
    }, 5000);
  };

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
        setShowPaymentModal(false);
        runBothEngines();
      } else {
        setPollingExpired(true);
        setPollingMsg('Pagamento ainda não confirmado. Aguarda uns segundos e tenta novamente.');
        startPolling(currentOrderId);
      }
    } catch {
      setPollingMsg('Erro ao verificar. Tenta novamente.');
      setPollingExpired(true);
    }
  };

  /* ─── Unified Discount Code Handler (checks coupons first, then vouchers) ─── */
  const handleDiscountCode = async () => {
    if (!discountCode.trim()) { setDiscountError('Introduz um código'); return; }
    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      // Step 1: Check discount_coupons
      const couponRes = await fetch(`${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,max_uses,current_uses,valid_from,valid_until,applicable_products`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError('Este código ainda não está ativo.'); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError('Este código já expirou.'); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError('Este código atingiu o limite.'); return; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('bundle') && !products.includes('complete')) { setDiscountError('Este código não é aplicável a este pacote.'); return; }
        if (coupon.discount_percent === 100) {
          incrementCouponUsage(code);
          trackAffiliateConversion({ product: 'bundle', amount: 0, currency: 'EUR', payment_method: 'coupon', transaction_id: `COUPON-${code}` });
          setShowDiscountModal(false);
          runBothEngines();
          return;
        }
        setDiscountError('Este código dá desconto parcial. Usa-o no pagamento.');
        return;
      }

      // Step 2: Check vouchers
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&is_active=eq.true`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const vouchers = await res.json();
      if (!vouchers || vouchers.length === 0) { setDiscountError('Código inválido ou já utilizado.'); return; }
      const v = vouchers[0];
      if (v.used_analyses >= v.total_analyses) { setDiscountError('Este código já foi totalmente utilizado.'); return; }
      setShowDiscountModal(false);
      if (v.email) sessionStorage.setItem('paymentEmail', v.email);
      runBothEngines();
    } catch {
      setDiscountError('Erro ao verificar código. Tenta novamente.');
    } finally {
      setDiscountLoading(false);
    }
  };

  // Check for Stripe return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === 'true') {
      const savedEmail = sessionStorage.getItem('bundleEmail');
      if (savedEmail) setEmail(savedEmail);
      // Remove query param
      window.history.replaceState({}, '', '/bundle');
      runBothEngines();
    }
  }, []);

  // Check for PayPal success step
  useEffect(() => {
    if (paymentStep === 'success' && step !== 'analyzing' && step !== 'done') {
      const timer = setTimeout(() => {
        setShowPaymentModal(false);
        runBothEngines();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentStep]);

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" className="h-8" />
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
            <a href="/cv-analyser" className="hover:text-slate-900 transition-colors">CV Analyser</a>
            <a href="/career-path" className="hover:text-slate-900 transition-colors">Career Path</a>
            <a href="/servicos" className="hover:text-slate-900 transition-colors">Serviços</a>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      {step === 'hero' && (
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A961]/10 to-[#C9A961]/5 text-[#C9A961] text-xs font-bold px-4 py-2 rounded-full border border-[#C9A961]/20 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Bundle mais popular
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              CV Analyser <span className="text-[#C9A961]">+</span> Career Path
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Diagnóstico completo do teu CV e roadmap de carreira personalizado. Tudo num só passo, com um único pagamento.
            </p>

            {/* Price */}
            <div className="flex items-center justify-center gap-4">
              <span className="text-4xl font-bold text-slate-900">{PRICE}€</span>
            </div>

            {/* What's included */}
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900">CV Analyser</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Análise ATS completa</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Score de posicionamento</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Estimativa salarial detalhada</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Sugestões de melhoria</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Certificação LinkedIn</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Compass className="w-5 h-5 text-[#C9A961]" />
                  </div>
                  <h3 className="font-bold text-slate-900">Career Path</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Roadmap de carreira a 5 anos</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Próximos cargos recomendados</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Formações sugeridas</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Estratégia de networking</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Skills gap analysis</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={() => setStep('upload')}
              className="h-14 px-10 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all mt-6"
            >
              Começar agora <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs text-slate-400">Pagamento único · Sem subscrição · Resultados imediatos</p>
          </div>
        </div>
      )}

      {/* ─── UPLOAD ─── */}
      {step === 'upload' && (
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Insere os teus dados</h2>
            <p className="text-sm text-slate-500 mt-1">CV + LinkedIn — uma só vez para os dois motores</p>
          </div>

          <div className="space-y-5">
            {/* CV Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" /> Currículo (PDF ou DOCX)
              </label>
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-[#C9A961] bg-white'}`}>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
                />
                {file ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Clica ou arrasta o teu CV</p>
                  </div>
                )}
              </label>
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Linkedin className="w-4 h-4 inline mr-1" /> Perfil LinkedIn
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/o-teu-perfil"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] outline-none transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" /> Email
              </label>
              <input
                type="email"
                placeholder="o-teu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] outline-none transition-all"
              />
            </div>

            {/* Country/Region Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                <Globe className="w-4 h-4 inline mr-1 text-[#C9A961]" /> País <span className="text-slate-400 font-normal text-xs">(para dados salariais e recomendações localizadas)</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                <select
                  value={selectedCountry}
                  onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion(""); }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] outline-none transition-all bg-white text-slate-700"
                >
                  <option value="">Selecciona o teu país...</option>
                  {countries.map(c => (
                    <option key={c.code} value={c.country}>{c.country}</option>
                  ))}
                </select>
                {countryData && countryData.regions.length > 1 && (
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] outline-none transition-all bg-white text-slate-700"
                  >
                    <option value="">Selecciona a região (opcional)...</option>
                    {countryData.regions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-[#C9A961] focus:ring-[#C9A961]"
              />
              <span className="text-xs text-slate-500">
                Li e aceito a <a href="/politica-privacidade" target="_blank" className="text-[#C9A961] underline">Política de Privacidade</a> e os <a href="/termos-condicoes" target="_blank" className="text-[#C9A961] underline">Termos e Condições</a>.
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* CTA */}
            <Button
              onClick={handleProceedToPayment}
              disabled={!file || !isValidLinkedinUrl(linkedinUrl) || !email || !selectedCountry || !acceptedTerms}
              className="w-full h-14 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white disabled:opacity-50 transition-all"
            >
              Pagar e analisar — {PRICE}€
            </Button>

            {/* Discount code link */}
            <button
              onClick={() => { setShowDiscountModal(true); setDiscountCode(''); setDiscountError(null); }}
              className="w-full text-center text-sm text-slate-500 hover:text-[#C9A961] transition-colors flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" /> Tenho um código de desconto
            </button>

            <p className="text-center text-xs text-slate-400">Pagamento seguro via MB WAY ou PayPal</p>

            <button onClick={() => setStep('hero')} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors">
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {/* ─── ANALYZING ─── */}
      {(step === 'analyzing' || step === 'done') && (
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <div className="space-y-6">
            {step === 'analyzing' ? (
              <>
                <Loader2 className="w-12 h-12 text-[#C9A961] animate-spin mx-auto" />
                <h2 className="text-xl font-bold text-slate-900">A processar o teu Bundle</h2>
                <p className="text-sm text-slate-500">{analysisMsg}</p>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-[#C9A961] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((analysisProgress + 1) / loadingMessages.length) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h2 className="text-xl font-bold text-slate-900">Tudo pronto!</h2>
                <p className="text-sm text-slate-500">A redirecionar para os teus resultados...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Payment Modal ─── */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {paymentStep === 'payment' && 'Pagamento — Bundle completo'}
              {paymentStep === 'polling' && 'A aguardar confirmação...'}
              {paymentStep === 'success' && 'Pagamento confirmado!'}
            </DialogTitle>
          </DialogHeader>

          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-600">CV Analyser + Career Path</p>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <span className="text-2xl font-bold text-slate-900">{PRICE}€</span>
                </div>
              </div>

              {/* Payment method tabs */}
              <div className="flex gap-2">
                {(['mbway', 'stripe', 'paypal'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${paymentMethod === m ? 'bg-[#C9A961] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {m === 'mbway' ? 'MB WAY' : m === 'stripe' ? 'Cartão' : 'PayPal'}
                  </button>
                ))}
              </div>

              {paymentMethod === 'mbway' && (
                <div className="space-y-3">
                  <input
                    type="tel"
                    placeholder="Número de telemóvel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] outline-none"
                  />
                  <Button
                    onClick={handleMBWayPayment}
                    disabled={paymentLoading}
                    className="w-full h-12 bg-[#C9A961] hover:bg-[#b8954f] text-white font-semibold rounded-xl"
                  >
                    {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pagar ${PRICE}€ com MB WAY`}
                  </Button>
                </div>
              )}

              {paymentMethod === 'stripe' && (
                <Button
                  onClick={handleStripePayment}
                  disabled={paymentLoading}
                  className="w-full h-12 bg-[#C9A961] hover:bg-[#b8954f] text-white font-semibold rounded-xl"
                >
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pagar ${PRICE}€ com Cartão`}
                </Button>
              )}

              {paymentMethod === 'paypal' && (
                <Button
                  onClick={handlePayPalPayment}
                  className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-xl"
                >
                  Pagar {PRICE}€ com PayPal
                </Button>
              )}

              {paymentError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {paymentError}
                </div>
              )}
            </div>
          )}

          {paymentStep === 'polling' && (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-8 h-8 text-[#C9A961] animate-spin mx-auto" />
              <p className="text-sm text-slate-600">{pollingMsg}</p>
              {pollingExpired && (
                <Button onClick={handleManualCheck} variant="outline" className="text-sm">
                  Já paguei — verificar
                </Button>
              )}
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
              <p className="text-sm text-slate-600">Pagamento confirmado! A iniciar análise...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Discount Code Modal ─── */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Código de desconto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Introduz o código"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-center tracking-widest font-mono focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleDiscountCode()}
            />
            {discountError && (
              <p className="text-red-600 text-sm text-center">{discountError}</p>
            )}
            <Button
              onClick={handleDiscountCode}
              disabled={discountLoading}
              className="w-full h-12 bg-[#C9A961] hover:bg-[#b8954f] text-white font-semibold rounded-xl"
            >
              {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar código'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Share2Inspire — Todos os direitos reservados</p>
        <p className="mt-1">
          <a href="/politica-privacidade" className="hover:text-slate-600">Privacidade</a> · <a href="/termos-condicoes" className="hover:text-slate-600">Termos</a> · <a href="/contactos" className="hover:text-slate-600">Contactos</a>
        </p>
      </footer>
    </div>
  );
}
