// Bundle — CV Analyser + Career Path | Share2Inspire
// Upload CV + LinkedIn → Pagamento → Ambos os motores correm → Resultados
// Preço PT: €29,00
import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Compass, Target, TrendingUp, CheckCircle2, Linkedin, CreditCard, AlertCircle, Ticket, Briefcase, Sparkles, Shield, Check, ArrowRight, Lock, BarChart3, Zap, Globe, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { trackAnalysisStart, trackPaymentStart, trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion, incrementCouponUsage } from "@/lib/affiliate";
import { transformGeminiResponse } from "@/lib/transformGeminiResponse";
import { countries } from "./en/countries";
import S2IFooter from "@/components/S2IFooter";
import S2IHeader from "@/components/S2IHeader";
import { redirectToCheckout } from '../lib/webviewPayment';
import PromoBanner from "@/components/PromoBanner";
import useTranslation from "@/i18n/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";

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

const bundleHeadlinesPT = [
  { text: "Do diagnóstico à ação, tudo o que precisas para", highlight: "acelerar a tua carreira" },
  { text: "Percebe onde estás e define exatamente", highlight: "para onde vais" },
  { text: "Analisa o teu CV, traça o teu caminho e", highlight: "avança com confiança" },
];
const bundleHeadlinesEN = [
  { text: "From diagnosis to action, everything you need to", highlight: "accelerate your career" },
  { text: "Understand where you are and define exactly", highlight: "where you're going" },
  { text: "Analyse your CV, map your path and", highlight: "move forward with confidence" },
];
const bundleHeadlinesES = [
  { text: "Del diagnóstico a la acción, todo lo que necesitas para", highlight: "acelerar tu carrera" },
  { text: "Entiende dónde estás y define exactamente", highlight: "hacia dónde vas" },
  { text: "Analiza tu CV, traza tu camino y", highlight: "avanza con confianza" },
];

export default function BundleHome() {
  const { pick, lang, localePath } = useTranslation();
  const { symbol: CUR } = useCurrency();
  const PRICE = pick('29,00', '29', '29');
  const bundleHeadlines = pick(bundleHeadlinesPT, bundleHeadlinesEN, bundleHeadlinesES);
  const isPT = lang === 'pt';
  useEffect(() => { document.title = "Bundle CV Analyser + Career Path | Share2Inspire"; }, []);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % bundleHeadlines.length), 4000); return () => clearInterval(t); }, []);
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
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>(isPT ? 'mbway' : 'stripe');
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
  // Applied discount state
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const finalPrice = appliedCoupon ? Math.round(PRICE_NUM * (1 - appliedCoupon.percent / 100) * 100) / 100 : PRICE_NUM;
  const finalPriceStr = isPT ? finalPrice.toFixed(2).replace('.', ',') : finalPrice.toFixed(2);

  // Analysis
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMsg, setAnalysisMsg] = useState("");

  const isValidLinkedinUrl = (url: string) => {
    const trimmed = url.trim().toLowerCase();
    return trimmed.includes('linkedin.com/in/') && trimmed.length > 25;
  };

  const loadingMessages = [
    pick("A extrair dados do teu CV...", "Extracting data from your CV...", "Extrayendo datos de tu CV..."),
    pick("A analisar competências e experiência...", "Analysing skills and experience...", "Analizando competencias y experiencia..."),
    pick("A calcular score ATS...", "Calculating ATS score...", "Calculando puntuación ATS..."),
    pick("A gerar estimativa salarial...", "Generating salary estimate...", "Generando estimación salarial..."),
    pick("A mapear o teu Career Path...", "Mapping your Career Path...", "Mapeando tu Career Path..."),
    pick("A criar roadmap personalizado...", "Creating personalised roadmap...", "Creando roadmap personalizado..."),
    pick("A preparar os teus resultados...", "Preparing your results...", "Preparando tus resultados..."),
  ];

  /* ─── Handle Upload & Proceed to Payment ─── */
  const handleProceedToPayment = async () => {
    if (!file) { setError(pick('Faz upload do teu CV (PDF ou DOCX)', 'Upload your CV (PDF or DOCX)', 'Sube tu CV (PDF o DOCX)')); return; }
    if (!isValidLinkedinUrl(linkedinUrl)) { setError(pick('Introduz um URL de LinkedIn válido', 'Enter a valid LinkedIn URL', 'Introduce una URL de LinkedIn válida')); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(pick('Introduz um email válido', 'Enter a valid email', 'Introduce un email válido')); return; }
    if (!selectedCountry) { setError(pick('Selecciona o teu país para resultados localizados', 'Please select your country for localised results', 'Selecciona tu país para resultados localizados')); return; }
    if (!acceptedTerms) { setError(pick('Aceita a Política de Privacidade', 'Accept the Privacy Policy', 'Acepta la Política de Privacidad')); return; }
    setError(null);

    try {
      let cvText = "";
      if (file.type === 'application/pdf') cvText = await extractTextFromPDF(file);
      else cvText = await extractTextFromDOCX(file);
      localStorage.setItem('bundleCvText', cvText);
      localStorage.setItem('bundleLinkedinUrl', linkedinUrl);
      localStorage.setItem('bundleEmail', email.trim().toLowerCase());
      localStorage.setItem('bundleCountry', selectedCountry || (isPT ? 'Portugal' : ''));
      localStorage.setItem('bundleRegion', selectedRegion || '');
    } catch (e) { console.warn('[Bundle] Pre-extraction error', e); }

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
      let base64Content = "";
      let cvFilename = "cv.pdf";
      if (file) {
        if (file.type === 'application/pdf') cvText = await extractTextFromPDF(file);
        else cvText = await extractTextFromDOCX(file);
        cvFilename = file.name;
        const reader = new FileReader();
        base64Content = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        cvText = localStorage.getItem('bundleCvText') || sessionStorage.getItem('bundleCvText') || '';
        if (!cvText) throw new Error('CV não foi restaurado. Tenta novamente ou avisa o suporte.');
      }
      
      const currentLinkedinUrl = linkedinUrl || localStorage.getItem('bundleLinkedinUrl') || sessionStorage.getItem('bundleLinkedinUrl') || '';
      if (currentLinkedinUrl && !linkedinUrl) setLinkedinUrl(currentLinkedinUrl);
      const currentEmail = email || localStorage.getItem('bundleEmail') || sessionStorage.getItem('bundleEmail') || localStorage.getItem('paymentEmail') || '';
      const currentCountry = selectedCountry || localStorage.getItem('bundleCountry') || sessionStorage.getItem('bundleCountry') || 'Portugal';
      const currentRegion = selectedRegion || localStorage.getItem('bundleRegion') || sessionStorage.getItem('bundleRegion') || '';
      
      const useServerExtraction = cvText.length < 50 && !!base64Content;

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
            requestBody.filename = cvFilename;
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
      sessionStorage.setItem('cvFilename', cvFilename);
      sessionStorage.setItem('analysisLang', 'pt');
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('paymentEmail', currentEmail.trim().toLowerCase());
      // Store country/region for Career Path localisation
      sessionStorage.setItem('analysisCountry', currentCountry);
      sessionStorage.setItem('analysisRegion', currentRegion);
      window.currentReportData = cvAnalysisSource;

      // ─── ENGINE 2: Career Path ───
      setAnalysisMsg("A gerar o teu Career Path...");

      // Store Career Path data
      sessionStorage.setItem('careerPathCvAnalysis', JSON.stringify(cvAnalysisSource));
      sessionStorage.setItem('careerPathCvText', (cvText || '').substring(0, 8000));
      sessionStorage.setItem('careerPathCvFile', base64Content);
      sessionStorage.setItem('careerPathCvFilename', cvFilename);
      sessionStorage.setItem('careerPathLinkedinUrl', currentLinkedinUrl);
      sessionStorage.setItem('careerPathPaid', 'true');

      // Save bundle analysis to Supabase (for Admin analytics)
      try {
        const cp = cvAnalysisSource?.candidate_profile || {};
        const detectedName = cp.name || cp.detected_name || null;
        const detectedPhone = cp.detected_phone && cp.detected_phone !== 'N/A' ? cp.detected_phone : null;
        const score = cvAnalysisResult.overallScore || cvAnalysisResult.ats_score || 0;
        const professionalArea = cp.detected_role || cp.primary_role || null;
        const userRating = score >= 80 ? 5 : score >= 65 ? 4 : score >= 50 ? 3 : score > 0 ? 2 : null;
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
            user_rating: userRating,
            analysis_type: 'bundle',
            analysis_result: JSON.stringify(cvAnalysisSource),
            cv_text: cvText || null,
            payment_status: 'paid',
            payment_amount: finalPrice,
            transaction_id: transactionId,
            domain: 'share2inspire.pt',
            user_name: detectedName,
            user_email: currentEmail.trim().toLowerCase(),
            user_phone: detectedPhone,
          }),
        }).catch(() => {});
      } catch (_) {}

      // Track conversions
      trackPurchase('bundle_cv_career', finalPrice, `BUNDLE-${Date.now()}`);
      if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: finalPrice, currency: 'EUR'});
      trackAffiliateConversion({
        product: 'bundle_cv_career',
        amount: finalPrice,
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
      trackPaymentStart('bundle_cv_career', finalPrice);
      const response = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          phone: formattedPhone,
          mobileNumber: formattedPhone,
          amount: finalPrice.toFixed(2),
          email,
          product: 'Bundle CV Analyser + Career Path',
          description: appliedCoupon ? `Bundle completo — CV Analyser + Career Path (${appliedCoupon.percent}% desconto: ${appliedCoupon.code})` : 'Bundle completo — CV Analyser + Career Path',
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
    trackPaymentStart('bundle_cv_career', finalPrice);
    window.open(`https://paypal.me/SamuelRolo/${finalPrice}EUR`, '_blank');
    setPaymentStep('success');
    if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: finalPrice, currency: 'EUR'});
    trackPurchase('bundle_cv_career', finalPrice, `BUNDLE-PAYPAL-${Date.now()}`);
    trackAffiliateConversion({ product: 'bundle_cv_career', amount: finalPrice, currency: 'EUR', payment_method: 'paypal', customer_email: email, transaction_id: `BUNDLE-PAYPAL-${Date.now()}` });
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
          amount: finalPrice,
          currency: 'eur',
          product_type: 'bundle',
          description: appliedCoupon ? `Bundle CV Analyser + Career Path — Share2Inspire (${appliedCoupon.percent}% desconto)` : 'Bundle CV Analyser + Career Path — Share2Inspire',
          orderId,
          success_url: `${window.location.origin}/bundle?paid=true`,
          cancel_url: `${window.location.origin}/bundle`,
        }),
      });
      const data = await response.json();
      if (data.url) {
        localStorage.setItem('bundlePendingOrderId', orderId);
        localStorage.setItem('bundleEmail', email);
        sessionStorage.setItem('bundlePendingOrderId', orderId);
        sessionStorage.setItem('bundleEmail', email);
        redirectToCheckout(data.url);
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
        // Partial discount — apply it and close modal
        setAppliedCoupon({ code, percent: coupon.discount_percent });
        incrementCouponUsage(code);
        setShowDiscountModal(false);
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
      const savedEmail = localStorage.getItem('bundleEmail') || sessionStorage.getItem('bundleEmail');
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
      <S2IHeader activePage="bundle" />
      <PromoBanner />

      {/* ─── HERO ─── */}
      {step === 'hero' && (
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
          {/* ─── Hero ─── */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C9A961]/10 to-[#C9A961]/5 text-[#C9A961] text-xs font-bold px-4 py-2 rounded-full border border-[#C9A961]/20 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              {pick('Bundle mais popular', 'Most popular bundle', 'Bundle más popular')}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight" key={headlineIndex} style={{animation: 'fadeInUp 0.6s ease-out'}}>
              {bundleHeadlines[headlineIndex].text} <span className="text-[#C9A961]">{bundleHeadlines[headlineIndex].highlight}</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {pick('CV Analyser + Career Path. Diagnóstico completo do teu CV e roadmap de carreira personalizado. Tudo num só passo, com um único pagamento.', 'CV Analyser + Career Path. Complete diagnosis of your CV and personalised career roadmap. All in one step, with a single payment.', 'CV Analyser + Career Path. Diagnóstico completo de tu CV y roadmap de carrera personalizado. Todo en un solo paso, con un único pago.')}
            </p>

            {/* Price */}
            <div className="flex items-center justify-center gap-4">
              {appliedCoupon ? (
                <>
                  <span className="text-2xl line-through text-slate-400">{CUR}{PRICE}</span>
                  <span className="text-4xl font-bold text-green-600">{CUR}{finalPriceStr}</span>
                </>
              ) : (
                <>
                  <span className="text-lg line-through text-slate-400">{CUR}38</span>
                  <span className="text-4xl font-bold text-slate-900">{CUR}{PRICE}</span>
                  <span className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">{pick('Poupas 9€', 'Save €9', 'Ahorras 9€')}</span>
                </>
              )}
            </div>

            {/* Primary CTA — large and prominent */}
            <Button
              onClick={() => setStep('upload')}
              className="h-16 px-12 text-lg font-bold rounded-2xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] mt-4"
            >
              {pick('Começar agora', 'Start now', 'Empezar ahora')} <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <p className="text-xs text-slate-400">{pick('Pagamento único · Sem subscrição · Resultados imediatos', 'One-time payment · No subscription · Instant results', 'Pago único · Sin suscripción · Resultados inmediatos')}</p>
          </div>

          {/* ─── What's included ─── */}
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-14">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">CV Analyser</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick('Análise ATS completa', 'Complete ATS analysis', 'Análisis ATS completo')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick('ATS Deep Scan + Análise de Keywords', 'ATS Deep Scan + Keyword Analysis', 'ATS Deep Scan + Análisis de Keywords')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick('Live Match — compara CV vs vaga', 'Live Match — compare CV vs job', 'Live Match — compara CV vs oferta')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick('Score de posicionamento', 'Positioning score', 'Score de posicionamiento')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick('Estimativa salarial detalhada', 'Detailed salary estimate', 'Estimación salarial detallada')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick('Certificação LinkedIn', 'LinkedIn Certification', 'Certificación LinkedIn')}</li>
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
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick('Roadmap de carreira a 5 anos', '5-year career roadmap', 'Roadmap de carrera a 5 años')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick('Próximos cargos recomendados', 'Recommended next roles', 'Próximos cargos recomendados')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick('Formações sugeridas', 'Suggested training', 'Formaciones sugeridas')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick('Estratégia de networking', 'Networking strategy', 'Estrategia de networking')}</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Skills gap analysis</li>
              </ul>
            </div>
          </div>

          {/* ─── How it works ─── */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-center text-slate-900 mb-8">{pick('Como funciona?', 'How it works', '¿Cómo funciona?')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { num: "1", icon: <Upload className="w-5 h-5 text-[#C9A961]" />, title: pick("Carrega o teu CV", "Upload your CV", "Sube tu CV"), desc: pick("Faz upload do teu CV em PDF ou DOCX e indica o teu perfil LinkedIn.", "Upload your CV in PDF or DOCX and enter your LinkedIn profile.", "Sube tu CV en PDF o DOCX e indica tu perfil LinkedIn.") },
                { num: "2", icon: <CreditCard className="w-5 h-5 text-[#C9A961]" />, title: pick("Pagamento seguro", "Secure payment", "Pago seguro"), desc: pick("Paga via MB WAY ou PayPal. Pagamento único, sem subscrição.", "Pay via card or PayPal. One-time payment, no subscription.", "Paga con tarjeta o PayPal. Pago único, sin suscripción.") },
                { num: "3", icon: <Zap className="w-5 h-5 text-[#C9A961]" />, title: pick("Resultados imediatos", "Instant results", "Resultados inmediatos"), desc: pick("Recebe o diagnóstico do CV e o roadmap de carreira em menos de 1 minuto.", "Get your CV diagnosis and career roadmap in less than 1 minute.", "Recibe el diagnóstico del CV y el roadmap de carrera en menos de 1 minuto.") },
              ].map((s, i) => (
                <div key={i} className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#C9A961]/10 border border-[#C9A961]/20 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Why the bundle ─── */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-center text-slate-900 mb-8">{pick('Porquê o Bundle?', 'Why the Bundle?', '¿Por qué el Bundle?')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: <Shield className="w-5 h-5 text-[#C9A961]" />, title: pick("Poupas 9€", "Save €9", "Ahorras 9€"), desc: pick("Separadamente custariam 38€. Em bundle, pagas apenas 29€.", "Separately they would cost €38. In a bundle, you pay only €29.", "Por separado costarían 38€. En bundle, pagas solo 29€.") },
                { icon: <Zap className="w-5 h-5 text-[#C9A961]" />, title: pick("Upload único", "Single upload", "Carga única"), desc: pick("Carregas o CV uma vez e os dois motores correm em paralelo.", "Upload your CV once and both engines run in parallel.", "Subes el CV una vez y los dos motores corren en paralelo.") },
                { icon: <Target className="w-5 h-5 text-[#C9A961]" />, title: pick("Visão completa", "Complete vision", "Visión completa"), desc: pick("Sabes onde estás (CV Analyser) e para onde ir (Career Path).", "Know where you are (CV Analyser) and where to go (Career Path).", "Sabes dónde estás (CV Analyser) y hacia dónde ir (Career Path).") },
                { icon: <TrendingUp className="w-5 h-5 text-[#C9A961]" />, title: pick("Decisões com dados", "Data-driven decisions", "Decisiones con datos"), desc: pick("Relatório integrado com score, salários e roadmap num só lugar.", "Integrated report with score, salaries and roadmap in one place.", "Informe integrado con score, salarios y roadmap en un solo lugar.") },
              ].map((card, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-xl">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-[#C9A961]/10 flex items-center justify-center">{card.icon}</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{card.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Social proof ─── */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-[#C9A961]">+500</p>
                <p className="text-xs text-slate-500 mt-1">{pick('Profissionais ajudados', 'Professionals helped', 'Profesionales ayudados')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#C9A961]">5★</p>
                <p className="text-xs text-slate-500 mt-1">{pick('Avaliação média', 'Average rating', 'Valoración media')}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#C9A961]">98%</p>
                <p className="text-xs text-slate-500 mt-1">{pick('Taxa de satisfação', 'Satisfaction rate', 'Tasa de satisfacción')}</p>
              </div>
            </div>
          </div>

          {/* ─── Second CTA ─── */}
          <div className="mt-14 text-center">
            <Button
              onClick={() => setStep('upload')}
              className="h-16 px-12 text-lg font-bold rounded-2xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              {pick('Começar agora', 'Start now', 'Empezar ahora')} <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <p className="text-xs text-slate-400 mt-3">{pick('Pagamento seguro via MB WAY ou PayPal', 'Secure payment via card or PayPal', 'Pago seguro con tarjeta o PayPal')}</p>
          </div>

          {/* ─── Member Area CTA ─── */}
          <div className="mt-14 p-6 bg-gradient-to-r from-[#f9f6ef] to-[#faf8f3] border border-[#C9A961]/20 rounded-2xl text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#C9A961]" />
              <p className="text-sm font-bold text-slate-800">{pick('Queres acesso regular a estas ferramentas?', 'Want regular access to these tools?', '¿Quieres acceso regular a estas herramientas?')}</p>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">{pick('Com um plano de subscrição, tens análises incluídas todas as semanas, conteúdos exclusivos, feed de vagas personalizado e muito mais — tudo numa única plataforma.', 'With a subscription plan, get weekly analyses, exclusive content, personalised job feed and much more — all in one platform.', 'Con un plan de suscripción, tienes análisis incluidos cada semana, contenidos exclusivos, feed de ofertas personalizado y mucho más — todo en una única plataforma.')}</p>
            <a
              href="https://www.share2inspire.pt/area-cliente/planos"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              {pick('Ver planos de subscrição', 'View subscription plans', 'Ver planes de suscripción')} <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-[10px] text-slate-400 mt-2">{pick('A partir de 9,99€/mês · Cancela quando quiseres', 'From €9.99/month · Cancel anytime', 'Desde 9,99€/mes · Cancela cuando quieras')}</p>
          </div>
        </div>
      )}

      {/* ─── UPLOAD ─── */}
      {step === 'upload' && (
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{pick('Insere os teus dados', 'Enter your details', 'Introduce tus datos')}</h2>
            <p className="text-sm text-slate-500 mt-1">{pick('CV + LinkedIn — uma só vez para os dois motores', 'CV + LinkedIn — one upload for both engines', 'CV + LinkedIn — una sola vez para los dos motores')}</p>
          </div>

          <div className="space-y-5">
            {/* CV Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" /> {pick('Currículo (PDF ou DOCX)', 'CV (PDF or DOCX)', 'Currículum (PDF o DOCX)')}
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
                    <p className="text-sm text-slate-500">{pick('Clica ou arrasta o teu CV', 'Click or drag your CV', 'Haz clic o arrastra tu CV')}</p>
                  </div>
                )}
              </label>
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Linkedin className="w-4 h-4 inline mr-1" /> {pick('Perfil LinkedIn', 'LinkedIn Profile', 'Perfil LinkedIn')}
              </label>
              <input
                type="url"
                placeholder={pick('https://linkedin.com/in/o-teu-perfil', 'https://linkedin.com/in/your-profile', 'https://linkedin.com/in/tu-perfil')}
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
                placeholder={pick('o-teu@email.com', 'your@email.com', 'tu@email.com')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] outline-none transition-all"
              />
            </div>

            {/* Country/Region Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                <Globe className="w-4 h-4 inline mr-1 text-[#C9A961]" /> {pick('País', 'Country', 'País')} <span className="text-slate-400 font-normal text-xs">{pick('(para dados salariais e recomendações localizadas)', '(for salary data and localised recommendations)', '(para datos salariales y recomendaciones localizadas)')}</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                <select
                  value={selectedCountry}
                  onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion(""); }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] outline-none transition-all bg-white text-slate-700"
                >
                  <option value="">{pick('Selecciona o teu país...', 'Select your country...', 'Selecciona tu país...')}</option>
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
                    <option value="">{pick('Selecciona a região (opcional)...', 'Select your region (optional)...', 'Selecciona la región (opcional)...')}</option>
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
                {pick('Li e aceito a', 'I have read and accept the', 'He leído y acepto la')} <a href="/politica-privacidade" target="_blank" className="text-[#C9A961] underline">{pick('Política de Privacidade', 'Privacy Policy', 'Política de Privacidad')}</a> {pick('e os', 'and the', 'y los')} <a href="/termos-condicoes" target="_blank" className="text-[#C9A961] underline">{pick('Termos e Condições', 'Terms and Conditions', 'Términos y Condiciones')}</a>.
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
              {appliedCoupon ? (
                <>{pick('Pagar e analisar', 'Pay and analyse', 'Pagar y analizar')} — <span className="line-through text-slate-400 mr-1">{CUR}{PRICE}</span> {CUR}{finalPriceStr}</>
              ) : (
                <>{pick('Pagar e analisar', 'Pay and analyse', 'Pagar y analizar')} — {CUR}{PRICE}</>
              )}
            </Button>

            {/* Discount code link / applied badge */}
            {appliedCoupon ? (
              <div className="w-full text-center text-sm text-green-600 bg-green-50 rounded-xl py-2 px-3 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                {pick('Cupão', 'Coupon', 'Cupón')} <span className="font-bold">{appliedCoupon.code}</span> {pick('aplicado', 'applied', 'aplicado')} — {appliedCoupon.percent}% {pick('desconto', 'discount', 'descuento')}
                <button onClick={() => setAppliedCoupon(null)} className="ml-2 text-xs text-slate-400 hover:text-red-500 underline">{pick('remover', 'remove', 'eliminar')}</button>
              </div>
            ) : (
              <button
                onClick={() => { setShowDiscountModal(true); setDiscountCode(''); setDiscountError(null); }}
                className="w-full text-center text-sm text-slate-500 hover:text-[#C9A961] transition-colors flex items-center justify-center gap-2"
              >
                <Ticket className="w-4 h-4" /> {pick('Tenho um código de desconto', 'I have a discount code', 'Tengo un código de descuento')}
              </button>
            )}

            <p className="text-center text-xs text-slate-400">{pick('Pagamento seguro via MB WAY ou PayPal', 'Secure payment via card or PayPal', 'Pago seguro con tarjeta o PayPal')}</p>

            <button onClick={() => setStep('hero')} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors">
              {pick('← Voltar', '← Back', '← Volver')}
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
                <h2 className="text-xl font-bold text-slate-900">{pick('A processar o teu Bundle', 'Processing your Bundle', 'Procesando tu Bundle')}</h2>
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
                <h2 className="text-xl font-bold text-slate-900">{pick('Tudo pronto!', 'All done!', '¡Todo listo!')}</h2>
                <p className="text-sm text-slate-500">{pick('A redirecionar para os teus resultados...', 'Redirecting to your results...', 'Redirigiendo a tus resultados...')}</p>
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
              {paymentStep === 'payment' && pick('Pagamento — Bundle completo', 'Payment — Complete Bundle', 'Pago — Bundle completo')}
              {paymentStep === 'polling' && pick('A aguardar confirmação...', 'Waiting for confirmation...', 'Esperando confirmación...')}
              {paymentStep === 'success' && pick('Pagamento confirmado!', 'Payment confirmed!', '¡Pago confirmado!')}
            </DialogTitle>
          </DialogHeader>

          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-600">CV Analyser + Career Path</p>
                <div className="flex items-center justify-center gap-3 mt-1">
                  {appliedCoupon ? (
                    <>
                      <span className="text-lg line-through text-slate-400">{PRICE}€</span>
                      <span className="text-2xl font-bold text-green-600">{finalPriceStr}€</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-slate-900">{PRICE}€</span>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-green-600 mt-1">{pick('Cupão', 'Coupon', 'Cupón')} {appliedCoupon.code} — {appliedCoupon.percent}% {pick('desconto', 'discount', 'descuento')}</p>
                )}
              </div>

              {/* Payment method tabs */}
              <div className="flex gap-2">
                {(isPT ? ['mbway', 'stripe', 'paypal'] as const : ['stripe', 'paypal'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${paymentMethod === m ? 'bg-[#C9A961] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {m === 'mbway' ? 'MB WAY' : m === 'stripe' ? pick('Cartão', 'Card', 'Tarjeta') : 'PayPal'}
                  </button>
                ))}
              </div>

              {paymentMethod === 'mbway' && (
                <div className="space-y-3">
                  <input
                    type="tel"
                    placeholder={pick('Número de telemóvel', 'Phone number', 'Número de móvil')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] outline-none"
                  />
                  <Button
                    onClick={handleMBWayPayment}
                    disabled={paymentLoading}
                    className="w-full h-12 bg-[#C9A961] hover:bg-[#b8954f] text-white font-semibold rounded-xl"
                  >
                    {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${pick('Pagar', 'Pay', 'Pagar')} ${CUR}${finalPriceStr} ${pick('com MB WAY', 'with MB WAY', 'con MB WAY')}`}
                  </Button>
                </div>
              )}

              {paymentMethod === 'stripe' && (
                <Button
                  onClick={handleStripePayment}
                  disabled={paymentLoading}
                  className="w-full h-12 bg-[#C9A961] hover:bg-[#b8954f] text-white font-semibold rounded-xl"
                >
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${pick('Pagar', 'Pay', 'Pagar')} ${CUR}${finalPriceStr} ${pick('com Cartão', 'with Card', 'con Tarjeta')}`}
                </Button>
              )}

              {paymentMethod === 'paypal' && (
                <Button
                  onClick={handlePayPalPayment}
                  className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-xl"
                >
                  {pick('Pagar', 'Pay', 'Pagar')} {CUR}{finalPriceStr} {pick('com PayPal', 'with PayPal', 'con PayPal')}
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
                  {pick('Já paguei — verificar', 'I already paid — verify', 'Ya pagué — verificar')}
                </Button>
              )}
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
              <p className="text-sm text-slate-600">{pick('Pagamento confirmado! A iniciar análise...', 'Payment confirmed! Starting analysis...', '¡Pago confirmado! Iniciando análisis...')}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Discount Code Modal ─── */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{pick('Código de desconto', 'Discount code', 'Código de descuento')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              placeholder={pick('Introduz o código', 'Enter the code', 'Introduce el código')}
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
              {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : pick('Validar código', 'Validate code', 'Validar código')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <S2IFooter />
    </div>
  );
}
