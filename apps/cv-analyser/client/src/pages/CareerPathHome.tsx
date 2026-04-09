// Career Path — Produto independente Share2Inspire
// Upload de CV + URL LinkedIn → Pagamento → Análise de carreira com IA
// Preço: €19,99

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Home as HomeIcon, Compass, Target, TrendingUp, Award, Users, Star, CheckCircle2, XCircle, Minus, ChevronDown, ChevronUp, Linkedin, CreditCard, AlertCircle, Ticket, Unlock, Briefcase, BookOpen, Calendar, ExternalLink, Sparkles, Search, Globe, DollarSign, Zap, Lock, ArrowRight, Shield, Check, Eye, Brain, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { sendConversion, trackCVUpload, trackAnalysisStart, trackPaymentStart, trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion, incrementCouponUsage } from "@/lib/affiliate";
import { getMemberPlanTier } from "@/lib/memberAuth";
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
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text;
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/* ─── Testimonials ─── */
const testimonials = [
  {
    name: "Catarina Mendes",
    role: "Gestora de RH",
    text: "O Career Path mostrou-me exatamente o que precisava de fazer para chegar a Diretora de RH em 3 anos. O roadmap foi cirúrgico e realista.",
    rating: 5,
  },
  {
    name: "Rui Ferreira",
    role: "Engenheiro de Software",
    text: "Estava perdido na minha transição para Product Manager. O plano de carreira identificou os gaps certos e as certificações que realmente importam.",
    rating: 5,
  },
  {
    name: "Sofia Lopes",
    role: "Consultora de Estratégia",
    text: "Nunca pensei que uma IA conseguisse cruzar o meu CV com o LinkedIn e perceber o que me faltava para o próximo nível. Impressionante.",
    rating: 5,
  },
];

/* ─── Pricing (inline) ─── */
const PRICE_DISPLAY_BASE = '19,99€';
const PRICE_DISPLAY_GROWTH = '19,99€';
const PRICE_DISPLAY_PRO = '19,99€';

/* (comparison table removed — simplifying homepage) */

const careerPathHeadlinesPT = [
  { text: "Define o teu próximo passo com um plano claro,", highlight: "não com tentativa e erro" },
  { text: "Sai da estagnação e avança com um caminho", highlight: "estruturado para a tua carreira" },
  { text: "Deixa de adivinhar o futuro, constrói um percurso", highlight: "com direção e intenção" },
];
const careerPathHeadlinesEN = [
  { text: "Define your next step with a clear plan,", highlight: "not trial and error" },
  { text: "Break free from stagnation with a", highlight: "structured career path" },
  { text: "Stop guessing the future, build a path", highlight: "with direction and purpose" },
];
const careerPathHeadlinesES = [
  { text: "Define tu próximo paso con un plan claro,", highlight: "no con prueba y error" },
  { text: "Sal del estancamiento y avanza con un camino", highlight: "estructurado para tu carrera" },
  { text: "Deja de adivinar el futuro, construye un recorrido", highlight: "con dirección e intención" },
];

export default function CareerPathHome() {
  const { t, pick, lang, localePath } = useTranslation();
  const { symbol: CUR } = useCurrency();
  const isPT = lang === 'pt';
  const careerPathHeadlines = pick(careerPathHeadlinesPT, careerPathHeadlinesEN, careerPathHeadlinesES);
  const careerPathExampleHref = lang === 'en' ? '/en/career-path/example/' : '/career-path/example/';
  useEffect(() => { document.title = "Career Path — Roadmap de Carreira com IA | Share2Inspire"; }, []);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % careerPathHeadlines.length), 4000); return () => clearInterval(t); }, []);

  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const isValidLinkedinUrl = (url: string) => {
    const trimmed = url.trim().toLowerCase();
    return trimmed.includes('linkedin.com/in/') && trimmed.length > 25;
  };
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step, setStep] = useState<'hero' | 'upload' | 'preview' | 'analyzing' | 'results'>('hero');
  const [careerGoal, setCareerGoal] = useState<string>('');
  const [country, setCountry] = useState<string>('Portugal');
  const [region, setRegion] = useState<string>('');
  const countryData = countries.find(c => c.country === country);
  const [previewData, setPreviewData] = useState<any>(null);

  // Progressive loading messages for Career Path
  const loadingMessages = [
    pick("A extrair o teu perfil profissional...", "Extracting your professional profile...", "Extrayendo tu perfil profesional..."),
    pick("A mapear competências e experiência...", "Mapping skills and experience...", "Mapeando competencias y experiencia..."),
    pick("A analisar tendências do mercado...", "Analysing market trends...", "Analizando tendencias del mercado..."),
    pick("A identificar oportunidades de carreira...", "Identifying career opportunities...", "Identificando oportunidades de carrera..."),
    pick("A calcular risco de automação...", "Calculating automation risk...", "Calculando riesgo de automatización..."),
    pick("A estimar faixas salariais...", "Estimating salary ranges...", "Estimando rangos salariales..."),
    pick("A construir o teu roadmap de desenvolvimento...", "Building your development roadmap...", "Construyendo tu roadmap de desarrollo..."),
    pick("A gerar recomendações de formação...", "Generating training recommendations...", "Generando recomendaciones de formación..."),
    pick("A finalizar o teu Career Path...", "Finalising your Career Path...", "Finalizando tu Career Path..."),
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < loadingMessages.length - 1 ? prev + 1 : prev);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>(isPT ? 'mbway' : 'stripe');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'polling' | 'success'>('payment');
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Unified discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountValid, setDiscountValid] = useState(false);

  // Member pricing detection
  const memberTier = getMemberPlanTier();
  const isMemberGrowth = memberTier === 'growth';
  const isMemberPro = memberTier === 'pro';
  const hasMemberDiscount = isMemberGrowth || isMemberPro;

  const PRICE = pick('19,99', '19.99', '19,99');
  const PRICE_NUM = 19.99;
  const PRICE_DISPLAY = `${CUR}${PRICE}`;
  const memberProductType = 'career_path';
  const FINAL_PRICE = discountPercent > 0 ? PRICE_NUM * (1 - discountPercent / 100) : PRICE_NUM;
  const FINAL_PRICE_DISPLAY = isPT ? FINAL_PRICE.toFixed(2).replace('.', ',') : FINAL_PRICE.toFixed(2);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
        setError(pick('Por favor, carregue um ficheiro PDF ou DOCX', 'Please upload a PDF or DOCX file', 'Por favor, sube un fichero PDF o DOCX'));
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(pick('O ficheiro não pode exceder 5MB', 'File cannot exceed 5MB', 'El fichero no puede exceder 5MB'));
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
      trackCVUpload();
    }
  };

  /* ─── Unified discount code validation (checks coupons first, then vouchers) ─── */
  const handleDiscountValidate = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      // Step 1: Check discount_coupons
      const couponRes = await fetch(
        `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,partner_name,max_uses,current_uses,valid_from,valid_until,applicable_products`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError('Este código ainda não está ativo.'); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError('Este código já expirou.'); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError('Este código atingiu o limite de utilizações.'); return; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('career_path')) { setDiscountError('Este código não é aplicável ao Career Path.'); return; }
        setDiscountPercent(coupon.discount_percent);
        setDiscountValid(true);
        // If 100% discount, unlock immediately
        if (coupon.discount_percent === 100) {
          incrementCouponUsage(code);
          trackAffiliateConversion({ product: 'career_path', amount: 0, currency: 'EUR', payment_method: 'coupon', transaction_id: `COUPON-${code}` });
          setShowPaymentModal(false);
          localStorage.setItem('careerPathPaid', 'true');
          localStorage.setItem('cpOrderId', `CP-COUPON-${code}`);
          if (email) localStorage.setItem('cpPaymentEmail', email);
          setTimeout(() => { setLocation('/results'); }, 400);
        }
        return;
      }

      // Step 2: Check vouchers table
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const v = rows[0];
        if (!v.is_active) { setDiscountError('Este código já foi utilizado'); return; }
        if (v.used_analyses >= v.total_analyses) { setDiscountError('Este código já não tem utilizações disponíveis'); return; }
        if (v.voucher_type !== 'career_path' && !v.includes_career_path) { setDiscountError('Este código não é válido para o Career Path'); return; }
        await fetch(
          `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${v.id}`,
          {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ used_analyses: v.used_analyses + 1, is_active: (v.used_analyses + 1) < v.total_analyses }),
          }
        );
        setShowPaymentModal(false);
        localStorage.setItem('careerPathPaid', 'true');
        localStorage.setItem('cpOrderId', `CP-VOUCHER-${v.code}`);
        if (v.email) localStorage.setItem('cpPaymentEmail', v.email);
        setTimeout(() => { setLocation('/results'); }, 400);
        return;
      }

      setDiscountError('Código inválido ou expirado');
    } catch {
      setDiscountError('Erro ao validar código');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (!isValidLinkedinUrl(linkedinUrl)) {
      setError('Por favor, introduz o teu perfil LinkedIn (ex: https://linkedin.com/in/o-teu-perfil)');
      return;
    }
    trackAnalysisStart('career_path');
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      let cvText = "";
      if (file.type === 'application/pdf') {
        cvText = await extractTextFromPDF(file);
      } else {
        cvText = await extractTextFromDOCX(file);
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Content = await base64Promise;

      // If pdf.js couldn't extract enough text, send the file to the edge function
      // which uses Gemini Vision to extract text from image-based PDFs
      const useServerExtraction = cvText.length < 50;
      if (useServerExtraction) {
        console.log('[CAREER_PATH] Texto insuficiente no browser (' + cvText.length + ' chars). A enviar PDF para extração via Gemini Vision...');
      }

      // Retry logic for intermittent 500 errors (cold starts, rate limits)
      let response: Response | null = null;
      let responseData: any = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        try {
          const requestBody: any = { mode: 'cv_extraction' };
          if (useServerExtraction) {
            // Send base64 file for server-side Gemini Vision extraction
            requestBody.file = base64Content;
            requestBody.filename = file.name;
          } else {
            requestBody.cv_text = cvText.substring(0, 8000);
          }

          response = await fetch(SUPABASE_EDGE_URL, {
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
            responseData = await response.json();
            if (responseData.success) break;
          }

          // If not last attempt, wait and retry
          if (attempt < maxRetries) {
            console.warn(`[CAREER_PATH] Tentativa ${attempt + 1} falhou (status: ${response?.status}). A tentar novamente...`);
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < maxRetries && fetchError.name !== 'AbortError') {
            console.warn(`[CAREER_PATH] Tentativa ${attempt + 1} falhou (${fetchError.message}). A tentar novamente...`);
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } else {
            throw fetchError;
          }
        }
      }

      if (!response?.ok) {
        throw new Error('Erro na análise IA. Por favor, tente novamente.');
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Erro na análise IA.');
      }

      const analysisSource = responseData.analysis || responseData;

      // If server-side extraction was used, update cvText from the extracted data
      // Check raw_text at top level (responseData.raw_text) and nested (analysisSource.raw_text)
      if (useServerExtraction) {
        const extractedText = responseData.raw_text || analysisSource.raw_text;
        if (extractedText) cvText = extractedText;
      }

      // Store CV data and LinkedIn URL for the results page
      localStorage.setItem('careerPathCvAnalysis', JSON.stringify(analysisSource));
      localStorage.setItem('careerPathCvText', (cvText || '').substring(0, 8000));
      localStorage.setItem('careerPathCvFile', base64Content);
      localStorage.setItem('careerPathCvFilename', file.name);
      localStorage.setItem('analysisLang', 'pt');
      localStorage.setItem('analysisCountry', country);
      localStorage.setItem('analysisRegion', region || '');
      if (linkedinUrl) {
        localStorage.setItem('careerPathLinkedinUrl', linkedinUrl);
      }

      // Show preview before payment
      const profile = analysisSource.candidate_profile || {};
      setPreviewData({
        name: profile.detected_name || 'N/A',
        role: profile.detected_role || 'N/A',
        seniority: profile.seniority || 'N/A',
        experience: profile.total_years_exp || 'N/A',
        skills: (profile.key_skills || []).slice(0, 5),
        nextRole: profile.likely_next_role || null,
      });
      const elapsed = Date.now() - startTime;
      const remaining = 2800 - elapsed;
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

      setLoading(false);
      setStep('preview');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('A análise demorou demasiado. Por favor, tente novamente.');
      } else {
        setError(err.message || 'Erro ao analisar o CV. Por favor, tente novamente.');
      }
      setLoading(false);
    }
  };

  /* ─── Payment handlers ─── */
  const handleMBWayPayment = async () => {
    if (!email) { setPaymentError('Introduz o teu email'); return; }
    if (!phone) { setPaymentError('Introduz o teu número de telemóvel'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError('Email inválido'); return; }

    setPaymentLoading(true);
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    setPaymentError(null);

    try {
      const orderId = `CP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cpOrderId', orderId);
      localStorage.setItem('cpPaymentEmail', email);

      const response = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: (() => { const p = phone.replace(/\D/g, '').replace(/^(\+?351)/, ''); return `351${p}`; })(),
          orderId,
          amount: FINAL_PRICE.toFixed(2),
          paymentMethod: 'mbway',
          description: 'Share2Inspire - Career Path',
          name: email.split('@')[0],
        }),
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError('Email inválido'); return; }

    localStorage.setItem('cpPaymentEmail', email);
    trackPaymentStart('career_path', FINAL_PRICE);
    window.open(`https://paypal.me/SamuelRolo/${FINAL_PRICE}EUR`, '_blank');
    setPaymentStep('success');
    if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: FINAL_PRICE, currency: 'EUR'});
    trackPurchase('career_path', FINAL_PRICE, `CP-PAYPAL-${Date.now()}`);
    trackAffiliateConversion({ product: 'career_path', amount: FINAL_PRICE, currency: 'EUR', payment_method: 'paypal', customer_email: email, transaction_id: `CP-PAYPAL-${Date.now()}` });
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError('Introduz o teu email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError('Email inválido'); return; }
    setPaymentLoading(true);
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const orderId = `CP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          product_type: memberProductType,
          orderId,
          language: 'pt',
          country,
          region,
          currency: 'eur',
          amount: FINAL_PRICE,
          description: 'Career Path — Share2Inspire',
          success_url: `${window.location.origin}/career-path/results?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/career-path`,
        })
      });
      const data = await response.json();
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento');
      }
      localStorage.setItem('cpOrderId', orderId);
      localStorage.setItem('cpPaymentEmail', email);
      localStorage.setItem('stripeSessionId', data.sessionId);
      redirectToCheckout(data.url);
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
    const MIN_BEFORE_EXPIRED = 90000;
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
          localStorage.setItem('careerPathPaid', 'true');
          setTimeout(() => { setLocation('/results'); }, 400);
          return;
        }

        const elapsed = Date.now() - startTime;
        if (data.expired) {
          if (elapsed < MIN_BEFORE_EXPIRED) {
            setPollingMsg('A verificar pagamento... Confirma na app MB WAY.');
          } else {
            clearInterval(interval);
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
        localStorage.setItem('careerPathPaid', 'true');
        setTimeout(() => { setLocation('/results'); }, 400);
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

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    localStorage.setItem('careerPathPaid', 'true');
    setTimeout(() => { setLocation('/results'); }, 400);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Bundle banner removed — one page, one product, one decision */}

      <S2IHeader activePage="career-path" />
      <PromoBanner />

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* ═══ STEP 1: HERO — Promise + Examples (value-first) ═══ */}
        {step === 'hero' && (
          <div className="space-y-16 animate-in fade-in">
            {/* Hero */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/20 text-sm font-medium text-[#C9A961]">
                <Compass className="w-4 h-4" />
                {pick('Powered by IA Avançada', 'Powered by Advanced AI', 'Powered by IA Avanzada')}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" key={headlineIndex} style={{animation: 'fadeInUp 0.6s ease-out'}}>
                {careerPathHeadlines[headlineIndex].text} <span className="text-[#C9A961]">{careerPathHeadlines[headlineIndex].highlight}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {pick('A nossa IA analisa o teu CV e LinkedIn para traçar o teu roadmap de carreira com maior potencial de crescimento — em menos de 1 minuto.', 'Our AI analyses your CV and LinkedIn to map your career roadmap with the highest growth potential — in less than 1 minute.', 'Nuestra IA analiza tu CV y LinkedIn para trazar tu roadmap de carrera con mayor potencial de crecimiento — en menos de 1 minuto.')}
              </p>

              {/* Primary CTA — immediately visible above the fold */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <Button
                  onClick={() => setStep('upload')}
                  className="h-14 px-10 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all shadow-lg shadow-[#C9A961]/20"
                >
                  <Compass className="w-5 h-5 mr-2" />
                  {pick('Descobrir o meu Career Path', 'Discover my Career Path', 'Descubrir mi Career Path')}
                </Button>
                <p className="text-xs text-muted-foreground">{pick(`Pagamento único de ${PRICE_DISPLAY} · Sem subscrição · Resultado em menos de 1 minuto`, `One-time payment of ${PRICE_DISPLAY} · No subscription · Results in less than 1 minute`, `Pago único de ${PRICE_DISPLAY} · Sin suscripción · Resultado en menos de 1 minuto`)}</p>
              </div>

              {/* Trust badges — inline */}
              <div className="flex flex-wrap justify-center gap-6 pt-1">
                {[
                  { icon: <Shield className="w-4 h-4" />, label: pick("Dados 100% privados", "100% private data", "Datos 100% privados") },
                  { icon: <Zap className="w-4 h-4" />, label: pick("Resultado em < 1 min", "Results in < 1 min", "Resultado en < 1 min") },
                  { icon: <Award className="w-4 h-4" />, label: pick("Criado por especialistas RH", "Created by HR specialists", "Creado por especialistas RH") },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="text-[#C9A961]">{badge.icon}</span>
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Showcase: See What You'll Receive ── */}
            <div className="relative rounded-2xl border-2 border-[#C9A961]/30 bg-gradient-to-b from-[#C9A961]/5 to-transparent overflow-hidden">
              <div className="p-8 md:p-10 space-y-6">
                <div className="text-center space-y-3">
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961] uppercase">{t('career_path_real_result_example')}</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t('career_path_see_exactly_what_you_will_receive')}</h2>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                    {t('career_path_showcase_description')}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <a
                      href={careerPathExampleHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-lg bg-white text-[#9a7d3e] border border-[#C9A961]/30 hover:border-[#C9A961] transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t('career_path_view_example')}
                    </a>
                    <button
                      onClick={() => setStep('upload')}
                      className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white transition-all"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      {t('career_path_discover_my_path')}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('career_path_real_report_generated_by_ai')}</p>
                </div>
                {/* Competitive statement */}
                <p className="text-center text-sm md:text-base font-medium italic" style={{ color: '#C9A961' }}>
                  {t('career_path_value_statement', { price: PRICE_DISPLAY })}
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Shield className="w-5 h-5" />, label: pick("Dados 100% privados", "100% private data", "Datos 100% privados") },
                { icon: <Zap className="w-5 h-5" />, label: pick("Resultado em < 1 minuto", "Results in < 1 minute", "Resultado en < 1 minuto") },
                { icon: <Award className="w-5 h-5" />, label: pick("Criado por especialistas RH", "Created by HR specialists", "Creado por especialistas RH") },
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 text-center">
                  <span className="text-[#C9A961]">{badge.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>

            {/* What's Included — Preview */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">{pick('O que vais receber', 'What you will receive', 'Lo que vas a recibir')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: <Compass className="w-4 h-4" />, title: pick("Roadmap de Carreira", "Career Roadmap", "Roadmap de Carrera"), desc: pick("Plano passo-a-passo para os próximos 1-3 anos", "Step-by-step plan for the next 1-3 years", "Plan paso a paso para los próximos 1-3 años") },
                  { icon: <Target className="w-4 h-4" />, title: pick("Análise de Gaps", "Gap Analysis", "Análisis de Gaps"), desc: pick("Competências que te faltam para o próximo nível", "Skills you need for the next level", "Competencias que te faltan para el próximo nivel") },
                  { icon: <DollarSign className="w-4 h-4" />, title: pick("Estimativa Salarial", "Salary Estimate", "Estimación Salarial"), desc: pick("Progressão salarial estimada por etapa", "Estimated salary progression per stage", "Progresión salarial estimada por etapa") },
                  { icon: <BookOpen className="w-4 h-4" />, title: pick("Formações Recomendadas", "Recommended Training", "Formaciones Recomendadas"), desc: pick("Certificações com maior impacto na tua carreira", "Certifications with the highest career impact", "Certificaciones con mayor impacto en tu carrera") },
                  { icon: <Users className="w-4 h-4" />, title: pick("Estratégia de Networking", "Networking Strategy", "Estrategia de Networking"), desc: pick("Quem conhecer e como posicionares-te", "Who to meet and how to position yourself", "A quién conocer y cómo posicionarte") },
                  { icon: <Calendar className="w-4 h-4" />, title: pick("Plano 30-60-90 Dias", "30-60-90 Day Plan", "Plan 30-60-90 Días"), desc: pick("Ações concretas e calendarizadas", "Concrete and scheduled actions", "Acciones concretas y calendarizadas") },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-xl bg-card border border-border">
                    <span className="text-[#C9A961] mt-0.5 shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Como funciona — 3 passos */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">{pick('3 passos. 1 minuto. O teu Career Path.', '3 steps. 1 minute. Your Career Path.', '3 pasos. 1 minuto. Tu Career Path.')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: "1", title: pick("Carrega o teu CV", "Upload your CV", "Sube tu CV"), desc: pick("Faz upload do CV e partilha o teu LinkedIn.", "Upload your CV and share your LinkedIn.", "Sube tu CV y comparte tu LinkedIn."), time: pick("30 seg", "30 sec", "30 seg") },
                  { step: "2", title: pick("A IA analisa tudo", "AI analyses everything", "La IA analiza todo"), desc: pick("Cruzamos experiência, competências e mercado.", "We cross-reference experience, skills and market.", "Cruzamos experiencia, competencias y mercado."), time: pick("30 seg", "30 sec", "30 seg") },
                  { step: "3", title: pick("Recebe o teu Career Path", "Get your Career Path", "Recibe tu Career Path"), desc: pick("Roadmap completo com gaps, formações e acções.", "Complete roadmap with gaps, training and actions.", "Roadmap completo con gaps, formaciones y acciones."), time: pick("Imediato", "Instant", "Inmediato") },
                ].map((item, i) => (
                  <div key={i} className="relative p-5 rounded-xl bg-card border border-border text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center mx-auto">
                      <span className="text-sm font-bold text-[#C9A961]">{item.step}</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                    <span className="text-[10px] text-[#C9A961] font-medium">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Career Intelligence Upsell — dois cards PT ── */}
            <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-[#C9A961]/5 overflow-hidden">
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-foreground">{pick('Quer mais do que um roadmap?', 'Want more than a roadmap?', '¿Quieres más que un roadmap?')}</h3>
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-xl mx-auto">
                  {pick('O', 'The', 'El')} <strong className="text-foreground">Career Intelligence</strong> {pick('compara múltiplas direções estratégicas de carreira lado a lado, analisa trade-offs e dá-te uma recomendação fundamentada — para decidires com confiança.', 'compares multiple strategic career directions side by side, analyses trade-offs and gives you a well-founded recommendation — to decide with confidence.', 'compara múltiples direcciones estratégicas de carrera lado a lado, analiza trade-offs y te da una recomendación fundamentada — para decidir con confianza.')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Opção 1: Upgrade após Career Path */}
                  <div className="p-4 rounded-xl bg-white border border-border flex flex-col h-full">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded-full tracking-wider">{pick('POUPAR', 'SAVE', 'AHORRAR')}</span>
                      <span className="text-sm font-semibold text-foreground">{pick('Começa com Career Path', 'Start with Career Path', 'Empieza con Career Path')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex-1">{pick(`Obtém o teu Career Path por ${PRICE_DISPLAY} e faz upgrade para Career Intelligence por apenas €29.`, `Get your Career Path for ${PRICE_DISPLAY} and upgrade to Career Intelligence for just €29.`, `Obtén tu Career Path por ${PRICE_DISPLAY} y haz upgrade a Career Intelligence por solo 29€.`)}</p>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-lg font-bold text-[#C9A961]">{PRICE_DISPLAY}</span>
                      <span className="text-xs text-muted-foreground">{pick('depois +€29 upgrade', 'then +€29 upgrade', 'luego +29€ upgrade')}</span>
                    </div>
                  </div>
                  {/* Opção 2: Career Intelligence completo */}
                  <div className="p-4 rounded-xl bg-white border border-purple-200 flex flex-col h-full">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full tracking-wider">COMPLETO</span>
                      <span className="text-sm font-semibold text-foreground">Career Intelligence</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex-1">{pick('Tudo do Career Path + comparação estratégica, trade-offs e recomendação final.', 'Everything in Career Path + strategic comparison, trade-offs and final recommendation.', 'Todo del Career Path + comparación estratégica, trade-offs y recomendación final.')}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-lg font-bold text-purple-600">€49</span>
                        <a
                          href={localePath('/career-intelligence')}

                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        {pick('Saber mais', 'Learn more', 'Saber más')} <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">{pick('O que dizem os utilizadores', 'What users say', 'Lo que dicen los usuarios')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {testimonials.map((t, i) => (
                  <div key={i} className="p-5 rounded-xl bg-card border border-border space-y-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center space-y-4 p-8 rounded-2xl bg-[#C9A961]/5 border border-[#C9A961]/20">
              <h2 className="text-2xl font-bold text-foreground">{pick('Começa pelo diagnóstico. A decisão vem depois.', 'Start with the diagnosis. The decision comes later.', 'Empieza por el diagnóstico. La decisión viene después.')}</h2>
              <p className="text-muted-foreground">{pick(`Análise completa por ${PRICE_DISPLAY}. Pagamento único. Sem subscrição. Resultado em menos de 1 minuto.`, `Complete analysis for ${PRICE_DISPLAY}. One-time payment. No subscription. Results in less than 1 minute.`, `Análisis completo por ${PRICE_DISPLAY}. Pago único. Sin suscripción. Resultado en menos de 1 minuto.`)}{hasMemberDiscount && <span className="ml-1 text-green-600 font-medium">(desconto de membro {memberTier === 'pro' ? 'Pro' : 'Growth'})</span>}</p>
              <Button
                onClick={() => setStep('upload')}
                className="h-14 px-10 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all"
              >
                <Compass className="w-5 h-5 mr-2" />
                 {pick('Descobrir o meu Career Path', 'Discover my Career Path', 'Descubrir mi Career Path')}
              </Button>
            </div>
          </div>
        )}
        {/* ═══ STEP 2: UPLOAD — CV + LinkedIn + Career Goal ═══ */}
        {step === 'upload' && (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">{pick('Gerar o teu Career Path', 'Generate your Career Path', 'Generar tu Career Path')}</h2>
              <p className="text-sm text-muted-foreground">{pick('Carrega o teu CV e partilha o teu LinkedIn para uma análise completa.', 'Upload your CV and share your LinkedIn for a complete analysis.', 'Sube tu CV y comparte tu LinkedIn para un análisis completo.')}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
              {/* CV Upload */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">{pick('1. Carrega o teu CV', '1. Upload your CV', '1. Sube tu CV')}</label>
                <label
                  htmlFor="cp-cv-upload"
                  className={`relative block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${file ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border hover:border-[#C9A961]/50 hover:bg-muted/50'}`}
                >
                  <input id="cp-cv-upload" type="file" accept=".pdf,.docx" onChange={handleFileChange} className="sr-only" disabled={loading} />
                  <div className="space-y-2">
                    {file ? (
                      <>
                        <FileText className="w-8 h-8 mx-auto text-[#C9A961]" />
                        <p className="text-sm font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">{pick('Arrasta o teu CV ou clica para escolher', 'Drag your CV or click to choose', 'Arrastra tu CV o haz clic para elegir')}</p>
                        <p className="text-xs text-muted-foreground">{pick('PDF ou DOCX (máx. 5MB)', 'PDF or DOCX (max. 5MB)', 'PDF o DOCX (máx. 5MB)')}</p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-[#0077B5]" />
                  2. LinkedIn <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/o-teu-perfil"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] transition-colors text-sm"
                  />
                </div>
                {/* Transparency note */}
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <p className="text-xs font-semibold text-blue-600 mb-1.5 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {pick('O sistema irá analisar automaticamente:', 'The system will automatically analyse:', 'El sistema analizará automáticamente:')}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {[pick('Experiência profissional', 'Professional experience', 'Experiencia profesional'), pick('Área de actuação', 'Area of expertise', 'Área de actuación'), pick('Competências identificadas', 'Identified skills', 'Competencias identificadas'), pick('Evolução de funções', 'Role progression', 'Evolución de funciones')].map((item, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {item}</p>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 italic">{pick('Nenhum dado será publicado ou partilhado.', 'No data will be published or shared.', 'Ningún dato será publicado ni compartido.')}</p>
                </div>
              </div>

              {/* Career Goal (optional quick question) */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">3. {pick('Qual é o teu principal objectivo profissional?', 'What is your main professional goal?', '¿Cuál es tu principal objetivo profesional?')} <span className="text-muted-foreground font-normal">({pick('opcional', 'optional', 'opcional')})</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'grow', label: pick('Crescer na área actual', 'Grow in current field', 'Crecer en el área actual') },
                    { value: 'change', label: pick('Mudar de área', 'Change field', 'Cambiar de área') },
                    { value: 'responsibility', label: pick('Mais responsabilidade', 'More responsibility', 'Más responsabilidad') },
                    { value: 'salary', label: pick('Aumentar salário', 'Increase salary', 'Aumentar salario') },
                    { value: 'tech', label: pick('Tecnologia / Inovação', 'Technology / Innovation', 'Tecnología / Innovación') },
                    { value: 'leadership', label: pick('Liderança', 'Leadership', 'Liderazgo') },
                  ].map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setCareerGoal(careerGoal === goal.value ? '' : goal.value)}
                      className={`p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
                        careerGoal === goal.value
                          ? 'border-[#C9A961] bg-[#C9A961]/10 text-[#C9A961]'
                          : 'border-border text-muted-foreground hover:border-[#C9A961]/40'
                      }`}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* País e Região */}
              <div className="space-y-3">
                <p className="text-sm font-medium">4. País e região <span className="text-red-500">*</span></p>
                <div className="grid grid-cols-1 gap-3">
                  <select
                    value={country}
                    onChange={(e) => { setCountry(e.target.value); setRegion(''); }}
                    className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40"
                  >
                    <option value="">{pick('Selecciona o teu país...', 'Select your country...', 'Selecciona tu país...')}</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.country}>{c.country}</option>
                    ))}
                  </select>
                  {countryData && countryData.regions.length > 1 && (
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40"
                    >
                      <option value="">Selecciona a região (opcional)...</option>
                      {countryData.regions.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <p className="text-sm font-medium">5. E-mail <span className="text-red-500">*</span></p>
                <input
                  type="email"
                    placeholder={pick('o-teu@email.com', 'your@email.com', 'tu@email.com')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40"
                />
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="cp-terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-[#C9A961]"
                />
                <label htmlFor="cp-terms" className="text-sm text-muted-foreground cursor-pointer">
                  Concordo com a{" "}
                  <a href="https://www.share2inspire.pt/pages/politica-privacidade.html" target="_blank" rel="noopener noreferrer" className="text-[#C9A961] hover:underline">
                    Política de Privacidade
                  </a>{" "}
                  e autorizo o processamento dos meus dados para análise de carreira.
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
              )}

              {/* Submit */}
              <Button
                onClick={handleAnalyze}
                disabled={!file || !acceptedTerms || !isValidLinkedinUrl(linkedinUrl) || !email || !country || loading}
                className="w-full h-14 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {loadingMessages[loadingStep]}
                  </span>
                ) : (
                  pick('Iniciar análise', 'Start analysis', 'Iniciar análisis')
                )}
              </Button>

              {loading && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-[#C9A961] rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(((loadingStep + 1) / loadingMessages.length) * 100, 95)}%` }} />
                  </div>
                  <p className="text-center text-sm text-muted-foreground animate-pulse">
                    {loadingMessages[loadingStep]}
                  </p>
                </div>
              )}

              {/* Back button */}
              <button
                onClick={() => setStep('hero')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                {pick('← Voltar', '← Back', '← Volver')}
              </button>
            </div>
            {/* Comparison table removedd — simplifying homepage */}
          </div>
        )}

        {/* ═══ STEP 2.5: PREVIEW — Psychological funnel before payment ═══ */}
        {step === 'preview' && previewData && (
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Análise concluída
              </div>
              <h2 className="text-xl font-bold text-foreground">O teu perfil percebido pela IA</h2>
              <p className="text-sm text-muted-foreground">Isto é o que os recrutadores vêem quando analisam o teu CV</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              {/* Name & Role */}
              <div className="text-center pb-4 border-b border-border">
                <p className="text-lg font-bold text-foreground">{previewData.name}</p>
                <p className="text-sm text-[#C9A961] font-semibold">{previewData.role}</p>
              </div>

              {/* Seniority & Experience */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-1">SENIORIDADE</p>
                  <p className="text-sm font-bold text-foreground">{previewData.seniority}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-1">EXPERIÊNCIA</p>
                  <p className="text-sm font-bold text-foreground">{previewData.experience}</p>
                </div>
              </div>

              {/* Top Skills */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-2">TOP COMPETÊNCIAS DETETADAS</p>
                <div className="flex flex-wrap gap-2">
                  {previewData.skills.map((skill: string, i: number) => (
                    <span key={i} className="text-xs font-medium bg-[#C9A961]/10 text-[#C9A961] px-3 py-1 rounded-full border border-[#C9A961]/20">{skill}</span>
                  ))}
                </div>
              </div>

              {/* Next Role - the hook */}
              {previewData.nextRole && (
                <div className="p-4 bg-gradient-to-r from-[#C9A961]/5 to-[#C9A961]/10 rounded-xl border border-[#C9A961]/20">
                  <p className="text-[10px] font-semibold text-[#C9A961] tracking-wider mb-1">PRÓXIMO PASSO DE CARREIRA MAIS PROVÁVEL</p>
                  <p className="text-base font-bold text-foreground">{previewData.nextRole}</p>
                  <p className="text-xs text-muted-foreground mt-1">Descobre o roadmap completo para lá chegar ↓</p>
                </div>
              )}
            </div>

            {/* Blurred teaser */}
            <div className="relative bg-card border border-border rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white z-10" />
              <div className="filter blur-sm select-none">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">ROADMAP DE CARREIRA A 5 ANOS</p>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-full mt-3" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="text-center">
                  <Lock className="w-6 h-6 text-[#C9A961] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">Roadmap completo bloqueado</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setPaymentStep('payment');
                  setPaymentError(null);
                  setShowPaymentModal(true);
                }}
                className="w-full h-14 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all"
              >
                <Compass className="w-5 h-5 mr-2" />
                Desbloquear Career Path — {PRICE}€
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">Roadmap personalizado · Formações recomendadas · Próximos cargos · Estratégia de networking</p>
              <button
                onClick={() => setStep('upload')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                ← Voltar
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
              {pick('Career Path — Pagamento', 'Career Path — Payment', 'Career Path — Pago')}
            </DialogTitle>
          </DialogHeader>

          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Career Path</p>
                  <p className="text-xs text-muted-foreground">{pick('Mapa de carreira personalizado', 'Personalised career map', 'Mapa de carrera personalizado')}</p>
                </div>
                <div className="text-right">
                  {discountPercent > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground line-through">{PRICE}€</p>
                      <p className="text-lg font-bold text-[#C9A961]">{FINAL_PRICE_DISPLAY}€</p>
                      <p className="text-[10px] text-green-600 font-semibold">-{discountPercent}%</p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-[#C9A961]">{PRICE}€</p>
                  )}
                </div>
              </div>

              {/* Unified discount code */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">{pick('Código de desconto (opcional)', 'Discount code (optional)', 'Código de descuento (opcional)')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(null); setDiscountValid(false); setDiscountPercent(0); }}
                    placeholder={pick('CÓDIGO', 'CODE', 'CÓDIGO')}
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                    onKeyDown={(e) => e.key === 'Enter' && handleDiscountValidate()}
                  />
                  <Button
                    onClick={handleDiscountValidate}
                    disabled={discountLoading || !discountCode.trim() || discountValid}
                    variant="outline"
                    className="text-sm"
                  >
                    {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : discountValid ? <Check className="w-4 h-4 text-green-500" /> : pick('Aplicar', 'Apply', 'Aplicar')}
                  </Button>
                </div>
                {discountError && <p className="text-xs text-red-500">{discountError}</p>}
                {discountValid && <p className="text-xs text-green-600 font-semibold">{pick(`Desconto de ${discountPercent}% aplicado!`, `${discountPercent}% discount applied!`, `¡Descuento del ${discountPercent}% aplicado!`)}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                />
              </div>

              {FINAL_PRICE > 0 ? (
                <>
                  {/* Payment method */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">{pick('Método de pagamento', 'Payment method', 'Método de pago')}</label>
                    <div className="grid grid-cols-3 gap-2">
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
                          {method === 'mbway' ? 'MB WAY' : method === 'stripe' ? pick('Cartão', 'Card', 'Tarjeta') : 'PayPal'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone (MB WAY only) */}
                  {paymentMethod === 'mbway' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">{pick('Telemóvel (MB WAY)', 'Phone (MB WAY)', 'Móvil (MB WAY)')}</label>
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
                    {pick('Voltar', 'Back', 'Volver')}
                  </Button>
                  <Button
                    onClick={paymentMethod === 'stripe' ? handleStripePayment : paymentMethod === 'mbway' ? handleMBWayPayment : handlePayPalPayment}
                      disabled={paymentLoading}
                      className={`flex-1 font-semibold text-white ${
                        paymentMethod === 'stripe' ? 'bg-[#635BFF] hover:bg-[#5046E5]' : 'bg-[#C9A961] hover:bg-[#A88B4E]'
                      }`}
                    >
                      {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${pick('Pagar', 'Pay', 'Pagar')} ${CUR}${FINAL_PRICE_DISPLAY}`}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1"
                  >
                    {pick('Voltar', 'Back', 'Volver')}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPaymentModal(false);
                      localStorage.setItem('careerPathPaid', 'true');
                      localStorage.setItem('cpOrderId', `CP-FREE-${discountCode || 'PROMO'}`);
                      if (email) localStorage.setItem('cpPaymentEmail', email);
                      setLocation('/results');
                    }}
                    className="flex-1 font-semibold text-white bg-green-600 hover:bg-green-700"
                  >
                    <Unlock className="w-4 h-4 mr-2" /> {pick('Desbloquear grátis', 'Unlock for free', 'Desbloquear gratis')}
                  </Button>
                </div>
              )}


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
                <p className="text-xs text-muted-foreground">A aguardar confirmação do pagamento...</p>
              )}
              {pollingExpired && (
                <Button
                  onClick={handleManualCheck}
                  className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {pick('Já paguei — verificar novamente', 'I already paid — verify again', 'Ya pagué — verificar de nuevo')}
                </Button>
              )}
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-base font-bold text-foreground">{pick('Pagamento confirmado!', 'Payment confirmed!', '¡Pago confirmado!')}</p>
              <p className="text-sm text-muted-foreground">{pick('A gerar o teu Career Path personalizado...', 'Generating your personalised Career Path...', 'Generando tu Career Path personalizado...')}</p>
              <Button
                onClick={handlePaymentSuccess}
                className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
              >
                {pick('Gerar Career Path', 'Generate Career Path', 'Generar Career Path')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>



      {/* ─── Member Area CTA ─── */}
      <div className="max-w-3xl mx-auto px-6 mt-12 mb-8">
        <div className="p-6 bg-gradient-to-r from-[#f9f6ef] to-[#faf8f3] border border-[#C9A961]/20 rounded-2xl text-center">
          <p className="text-base font-bold text-slate-800 mb-2">{pick('Queres acesso regular ao Career Path?', 'Want regular access to Career Path?', '¿Quieres acceso regular al Career Path?')}</p>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">{pick('Com um plano Growth ou Pro, tens Career Path incluído mensalmente + CV Analyser semanal, conteúdos exclusivos e muito mais.', 'With a Growth or Pro plan, get Career Path included monthly + weekly CV Analyser, exclusive content and much more.', 'Con un plan Growth o Pro, tienes Career Path incluido mensualmente + CV Analyser semanal, contenidos exclusivos y mucho más.')}</p>
          <a
            href="https://www.share2inspire.pt/area-cliente/planos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            {pick('Ver planos de subscrição →', 'View subscription plans →', 'Ver planes de suscripción →')}
          </a>
          <p className="text-xs text-slate-400 mt-3">{pick('Career Path incluído a partir do plano Growth (19,99€/mês)', 'Career Path included from the Growth plan (€19.99/month)', 'Career Path incluido a partir del plan Growth (19,99€/mes)')}</p>
        </div>
      </div>

      <S2IFooter />
    </div>
  );
}
