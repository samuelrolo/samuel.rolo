// Career Intelligence — Standalone (49€)
// Upload de CV + URL LinkedIn → Pagamento → Análise completa com decisão estratégica
// Inclui tudo do Career Path + comparação, trade-offs, recomendação final

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Home as HomeIcon, Compass, Target, TrendingUp, Award, Users, Star, CheckCircle2, Lock, ChevronDown, Linkedin, CreditCard, AlertCircle, Ticket, Unlock, Briefcase, BookOpen, Calendar, ExternalLink, Sparkles, Search, Globe, DollarSign, Zap, ArrowRight, Shield, Check, Eye, Scale, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { sendConversion, trackCVUpload, trackAnalysisStart, trackPaymentStart, trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion } from "@/lib/affiliate";
import { getMemberPlanTier } from "@/lib/memberAuth";
import { getDefaultCountryByLanguage, getCountries, getRegions } from "@/data/countries";
import S2IFooter from "@/components/S2IFooter";
import S2IHeader from "@/components/S2IHeader";
import { redirectToCheckout } from '../lib/webviewPayment';
import PromoBanner from "@/components/PromoBanner";
import useTranslation from "@/i18n/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";
import { getAuthenticatedProfilePrefill } from "@/lib/profilePrefill";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

/** Save analysis to user_analyses for area-cliente dashboard */
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
    if ((localStorage.getItem(dedupKey) || sessionStorage.getItem(dedupKey))) return;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_analyses`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ user_id: userId, analysis_type: analysisType, data: { ...data, captured_at: new Date().toISOString() }, created_at: new Date().toISOString() })
    });
    if (res.ok) { localStorage.setItem(dedupKey, 'true'); console.log('[S2I] Analysis saved to user_analyses:', analysisType); }
  } catch (e) { console.warn('[S2I] Error saving to user_analyses:', e); }
}
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

const getPageLang = () => window.location.pathname.startsWith('/en/') ? 'en' : window.location.pathname.startsWith('/es/') ? 'es' : 'pt';
const getPageBasePath = () => getPageLang() === 'en' ? '/en' : getPageLang() === 'es' ? '/es' : '';

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
const buildTestimonials = (pick: <T,>(pt: T, en: T, es: T) => T) => [
  {
    name: "Catarina Mendes",
    role: pick("Gestora de RH", "HR Manager", "Gestora de RRHH"),
    text: pick("O Career Intelligence deu-me uma estimativa salarial realista para cada caminho. Percebi que o meu perfil valia mais do que pensava — e negociei um aumento de 18%.", "Career Intelligence gave me a realistic salary estimate for each path. I realised my profile was worth more than I thought — and I negotiated an 18% raise.", "Career Intelligence me dio una estimación salarial realista para cada camino. Me di cuenta de que mi perfil valía más de lo que pensaba — y negocié un aumento del 18%."),
    rating: 5,
  },
  {
    name: "Rui Ferreira",
    role: pick("Engenheiro de Software", "Software Engineer", "Ingeniero de Software"),
    text: pick("Estava indeciso entre Product Manager e Engineering Manager. Em vez de meses a pesquisar, tive a resposta em 1 minuto — com dados concretos de mercado e trade-offs claros.", "I was undecided between Product Manager and Engineering Manager. Instead of months researching, I got the answer in 1 minute — with concrete market data and clear trade-offs.", "Estaba indeciso entre Product Manager e Engineering Manager. En vez de meses investigando, tuve la respuesta en 1 minuto — con datos concretos de mercado y trade-offs claros."),
    rating: 5,
  },
  {
    name: "Sofia Lopes",
    role: pick("Consultora de Estratégia", "Strategy Consultant", "Consultora de Estrategia"),
    text: pick("A recomendação final veio com um plano de acção tão detalhado que o usei diretamente na entrevista. Entrei no novo cargo com confiança total.", "The final recommendation came with such a detailed action plan that I used it directly in the interview. I started the new role with total confidence.", "La recomendación final vino con un plan de acción tan detallado que lo usé directamente en la entrevista. Entré en el nuevo cargo con confianza total."),
    rating: 5,
  },
];

const PRICE_DISPLAY_BASE = '49,99€';
const PRICE_BASE = '49,99';
const PRICE_NUM_BASE = 49.99;
const PRICE_DISPLAY_UPGRADE = '29€';
const PRICE_UPGRADE = '29,00';
const PRICE_NUM_UPGRADE = 29.00;
const PRICE_DISPLAY_MEMBER_PRO = '9,99€';
const PRICE_MEMBER_PRO = '9,99';
const PRICE_NUM_MEMBER_PRO = 9.99;

const buildCiHeadlines = (pick: <T,>(pt: T, en: T, es: T) => T) => [
  { text: pick("Toma decisões de carreira com dados,", "Make career decisions with data,", "Toma decisiones de carrera con datos,"), highlight: pick("não com intuição", "not intuition", "no con intuición") },
  { text: pick("Percebe para onde o mercado está a ir", "Understand where the market is heading", "Entiende hacia dónde va el mercado"), highlight: pick("antes de todos os outros", "before everyone else", "antes que todos los demás") },
  { text: pick("Transforma informação em vantagem real", "Turn information into real advantage", "Transforma información en ventaja real"), highlight: pick("na tua evolução profissional", "in your professional growth", "en tu evolución profesional") },
];

export default function CareerIntelligenceHome() {
  const { pick, lang, localePath } = useTranslation();
  const { symbol: CUR } = useCurrency();
  const careerIntelligenceDemoHref = localePath('/career-intelligence/demo');
  const privacyPolicyHref = pick('/politica-privacidade/', '/en/privacy-policy/', '/es/politica-de-privacidad/');
  const careerPathOfferText = pick('Career Path por 19,99€ →', 'Career Path for €19.99 →', 'Career Path por 19,99€ →');
  const paymentMethodLabel = (method: 'mbway' | 'stripe' | 'paypal') => method === 'mbway' ? 'MB WAY' : method === 'stripe' ? pick('Cartão', 'Card', 'Tarjeta') : 'PayPal';
  const discountAppliedText = (percent: number) => pick(`Desconto de ${percent}% aplicado!`, `${percent}% discount applied!`, `¡Descuento de ${percent}% aplicado!`);
  const paymentPhonePlaceholder = pick('9XXXXXXXX', '+351 9XXXXXXXX', '6XXXXXXXX');
  const isPT = lang === 'pt';
  const testimonials = buildTestimonials(pick);
  const ciHeadlines = buildCiHeadlines(pick);
  useEffect(() => { document.title = pick("Career Intelligence — Decisão Estratégica de Carreira com IA | Share2Inspire", "Career Intelligence — Strategic Career Decision with AI | Share2Inspire", "Career Intelligence — Decisión Estratégica de Carrera con IA | Share2Inspire"); }, [pick]);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % ciHeadlines.length), 4000); return () => clearInterval(t); }, []);

  // Detect upgrade from Career Path (via URL param or sessionStorage)
  const isUpgrade = (() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'careerpath') return true;
    return false;
  })();

  // Member Pro pricing (75% discount)
  const memberTier = getMemberPlanTier();
  const isMemberPro = memberTier === 'pro';

  const PRICE_DISPLAY = isMemberPro ? PRICE_DISPLAY_MEMBER_PRO : isUpgrade ? PRICE_DISPLAY_UPGRADE : PRICE_DISPLAY_BASE;
  const PRICE = isMemberPro ? PRICE_MEMBER_PRO : isUpgrade ? PRICE_UPGRADE : PRICE_BASE;
  const PRICE_NUM = isMemberPro ? PRICE_NUM_MEMBER_PRO : isUpgrade ? PRICE_NUM_UPGRADE : PRICE_NUM_BASE;
  const memberProductType = isMemberPro ? 'career_intelligence_member_pro' : 'career_intelligence_full';

  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [savedCvInfo, setSavedCvInfo] = useState<{ filename: string; url: string } | null>(null);
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
  const [country, setCountry] = useState<string>(() => getDefaultCountryByLanguage(lang));
  const [region, setRegion] = useState<string>('');
  const countries = getCountries(lang);
  const regionOptions = getRegions(country, lang);

  useEffect(() => {
    setCountry((current) => current || getDefaultCountryByLanguage(lang));
  }, [lang]);
  const [previewData, setPreviewData] = useState<any>(null);

  const loadingMessages = [
    pick("A extrair o teu perfil profissional...", "Extracting your professional profile...", "Extrayendo tu perfil profesional..."),
    pick("A mapear competências e experiência...", "Mapping skills and experience...", "Mapeando competencias y experiencia..."),
    pick("A analisar tendências do mercado...", "Analysing market trends...", "Analizando tendencias del mercado..."),
    pick("A identificar oportunidades de carreira...", "Identifying career opportunities...", "Identificando oportunidades de carrera..."),
    pick("A comparar caminhos estratégicos...", "Comparing strategic paths...", "Comparando caminos estratégicos..."),
    pick("A calcular probabilidades de sucesso...", "Calculating success probabilities...", "Calculando probabilidades de éxito..."),
    pick("A analisar trade-offs por caminho...", "Analysing trade-offs per path...", "Analizando trade-offs por camino..."),
    pick("A construir recomendação final...", "Building final recommendation...", "Construyendo recomendación final..."),
    pick("A finalizar o teu Career Intelligence...", "Finalising your Career Intelligence...", "Finalizando tu Career Intelligence..."),
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < loadingMessages.length - 1 ? prev + 1 : prev);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  // Sync country/region to sessionStorage in real-time.
  // This ensures CareerIntelligenceResults always uses the country the user
  // selected in THIS form, overriding any value left by a previous Career Path
  // session — which is the root cause of the upgrade-flow country bug.
  useEffect(() => {
    localStorage.setItem('analysisCountry', country);
    localStorage.setItem('analysisRegion', region || '');
  }, [country, region]);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>(isPT ? 'mbway' : 'stripe');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const profile = await getAuthenticatedProfilePrefill();
      if (!active || !profile) return;
      if (profile.cvUrl && profile.cvFilename) {
        setSavedCvInfo({ filename: profile.cvFilename, url: profile.cvUrl });
      }
      if (profile.linkedinUrl) setLinkedinUrl((current) => current || profile.linkedinUrl);
      if (profile.email) setEmail((current) => current || profile.email);
    })();
    return () => { active = false; };
  }, []);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'polling' | 'success'>('payment');
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Unified discount code state (checks discount_coupons then vouchers)
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountValid, setDiscountValid] = useState(false);
  const [discountType, setDiscountType] = useState<'coupon' | 'voucher' | null>(null);

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
      // Step 1: Check discount_coupons via backend
      const couponRes = await fetch(`${BACKEND_URL}/api/payment/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, product: 'career_intelligence_full' }),
      });
      const couponData = await couponRes.json();
      if (couponData.valid && couponData.discount_percent > 0) {
        setDiscountPercent(couponData.discount_percent);
        setDiscountValid(true);
        setDiscountType('coupon');
        return;
      }

      // Step 2: Check vouchers table directly
      const voucherRes = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const rows = await voucherRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const v = rows[0];
        if (!v.is_active) { setDiscountError(pick('Este código já foi utilizado', 'This code has already been used', 'Este código ya fue utilizado')); return; }
        if (v.used_analyses >= v.total_analyses) { setDiscountError(pick('Este código já não tem utilizações disponíveis', 'This code has no uses left', 'Este código ya no tiene usos disponibles')); return; }
        if (v.voucher_type !== 'career_intelligence_full' && v.voucher_type !== 'career_intelligence_pro' && v.voucher_type !== 'complete' && !v.includes_career_intelligence_pro) {
          setDiscountError(pick('Este código não é válido para o Career Intelligence', 'This code is not valid for Career Intelligence', 'Este código no es válido para Career Intelligence')); return;
        }
        // Mark voucher as used
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
        localStorage.setItem('careerIntelligenceProPaid', 'true');
        localStorage.setItem('careerIntelligenceFull', 'true');
        // Force fresh generation with the country selected in THIS form
        localStorage.setItem('ciNeedsRegeneration', 'true');
        (localStorage.removeItem('careerPathData'), sessionStorage.removeItem('careerPathData'));
        localStorage.setItem('cpOrderId', `CI-VOUCHER-${v.code}`);
        if (v.email) localStorage.setItem('cpPaymentEmail', v.email);
        trackAffiliateConversion({ product: 'career_intelligence_full', amount: 0, currency: 'EUR', payment_method: 'voucher', customer_email: v.email || '', transaction_id: `CI-VOUCHER-${v.code}` });
        setTimeout(() => { setLocation('/results'); }, 400);
        return;
      }

      // Not found in either table
      setDiscountError(pick('Código inválido ou expirado', 'Invalid or expired code', 'Código inválido o expirado'));
    } catch {
      setDiscountError(pick('Erro ao validar código', 'Error validating code', 'Error al validar código'));
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (!isValidLinkedinUrl(linkedinUrl)) {
      setError(pick('Por favor, introduz o teu perfil LinkedIn (ex: https://linkedin.com/in/o-teu-perfil)', 'Please enter your LinkedIn profile (e.g. https://linkedin.com/in/your-profile)', 'Por favor, introduce tu perfil LinkedIn (ej: https://linkedin.com/in/tu-perfil)'));
      return;
    }
    trackAnalysisStart('career_intelligence_full');
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

      const useServerExtraction = cvText.length < 50;

      let response: Response | null = null;
      let responseData: any = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        try {
          const requestBody: any = { mode: 'cv_extraction', language: lang };
          if (useServerExtraction) {
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

          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < maxRetries && fetchError.name !== 'AbortError') {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } else {
            throw fetchError;
          }
        }
      }

      if (!response?.ok) throw new Error(pick('Erro na análise IA. Por favor, tente novamente.', 'Error in AI analysis. Please try again.', 'Error en el análisis IA. Por favor, inténtalo de nuevo.'));
      if (!responseData?.success) throw new Error(responseData?.error || pick('Erro na análise IA.', 'Error in AI analysis.', 'Error en el análisis IA.'));

      const analysisSource = responseData.analysis || responseData;

      if (useServerExtraction && analysisSource.raw_text) {
        cvText = analysisSource.raw_text;
      }

      const pageLang = getPageLang();
      localStorage.setItem('careerPathCvAnalysis', JSON.stringify(analysisSource));
      localStorage.setItem('careerPathCvText', (cvText || '').substring(0, 8000));
      localStorage.setItem('careerPathCvFile', base64Content);
      localStorage.setItem('careerPathCvFilename', file.name);
      localStorage.setItem('analysisLang', pageLang);
      localStorage.setItem('analysisCountry', country);
      localStorage.setItem('analysisRegion', region || '');
      if (linkedinUrl) localStorage.setItem('careerPathLinkedinUrl', linkedinUrl);

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
        setError(pick('A análise demorou demasiado. Por favor, tente novamente.', 'The analysis took too long. Please try again.', 'El análisis tardó demasiado. Por favor, inténtalo de nuevo.'));
      } else {
        setError(err.message || pick('Erro ao analisar o CV. Por favor, tente novamente.', 'Error analysing CV. Please try again.', 'Error al analizar el CV. Por favor, inténtalo de nuevo.'));
      }
      setLoading(false);
    }
  };

  /* ─── Payment handlers ─── */
  const handleMBWayPayment = async () => {
    if (!email) { setPaymentError(pick('Introduz o teu email', 'Enter your email', 'Introduce tu email')); return; }
    if (!phone) { setPaymentError(pick('Introduz o teu número de telemóvel', 'Enter your phone number', 'Introduce tu número de móvil')); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError(pick('Email inválido', 'Invalid email', 'Email inválido')); return; }

    // If price is 0 (100% discount), skip payment entirely
    if (FINAL_PRICE <= 0) {
      const orderId = `CI-FREE-${Date.now()}`;
      localStorage.setItem('cpOrderId', orderId);
      localStorage.setItem('cpPaymentEmail', email);
      handlePaymentSuccess();
      return;
    }

    setPaymentLoading(true);
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    setPaymentError(null);

    try {
      const orderId = `CI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
          description: 'Share2Inspire - Career Intelligence',
          name: email.split('@')[0],
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || pick('Erro ao iniciar pagamento', 'Error starting payment', 'Error al iniciar el pago'));

      setPaymentStep('polling');
      setPollingMsg(pick('Confirma o pagamento na app MB WAY do teu telemóvel...', 'Confirm the payment in the MB WAY app on your phone...', 'Confirma el pago en la app MB WAY de tu móvil...'));
      startPolling(orderId);
    } catch (err: any) {
      setPaymentError(err.message || pick('Erro ao processar pagamento', 'Error processing payment', 'Error al procesar el pago'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!email) { setPaymentError(pick('Introduz o teu email', 'Enter your email', 'Introduce tu email')); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError(pick('Email inválido', 'Invalid email', 'Email inválido')); return; }

    // If price is 0 (100% discount), skip payment entirely
    if (FINAL_PRICE <= 0) {
      localStorage.setItem('cpPaymentEmail', email);
      handlePaymentSuccess();
      return;
    }

    localStorage.setItem('cpPaymentEmail', email);
    trackPaymentStart('career_intelligence_full', FINAL_PRICE);
    window.open(`https://paypal.me/SamuelRolo/${FINAL_PRICE.toFixed(2)}EUR`, '_blank');
    setPaymentStep('success');
    if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: FINAL_PRICE, currency: 'EUR'});
    const txId = `CI-PAYPAL-${Date.now()}`;
    trackPurchase('career_intelligence_full', FINAL_PRICE, txId);
    trackAffiliateConversion({ product: 'career_intelligence_full', amount: FINAL_PRICE, currency: 'EUR', payment_method: 'paypal', customer_email: email, transaction_id: txId });
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError(pick('Introduz o teu email', 'Enter your email', 'Introduce tu email')); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError(pick('Email inválido', 'Invalid email', 'Email inválido')); return; }

    // If price is 0 (100% discount), skip payment entirely
    if (FINAL_PRICE <= 0) {
      localStorage.setItem('cpPaymentEmail', email);
      handlePaymentSuccess();
      return;
    }

    setPaymentLoading(true);
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const orderId = `CI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const pageLang = getPageLang();
      const pageBasePath = getPageBasePath();
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          product_type: memberProductType,
          orderId,
          language: pageLang,
          country,
          region,
          currency: 'eur',
          amount: FINAL_PRICE,
          description: 'Career Intelligence — Share2Inspire',
          success_url: `${window.location.origin}${pageBasePath}/career-intelligence/results?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}${pageBasePath}/career-intelligence`,
        })
      });
      const data = await response.json();
      if (!data.success || !data.url) throw new Error(data.error || pick('Erro ao criar sessão de pagamento', 'Error creating payment session', 'Error al crear sesión de pago'));
      localStorage.setItem('cpOrderId', orderId);
      localStorage.setItem('cpPaymentEmail', email);
      localStorage.setItem('stripeSessionId', data.sessionId);
      redirectToCheckout(data.url);
    } catch (err: any) {
      setPaymentError(err.message || pick('Erro ao processar pagamento', 'Error processing payment', 'Error al procesar el pago'));
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
            setPollingMsg(pick('Não foi possível verificar. Usa o botão "Já paguei".', 'Could not verify. Use the "I already paid" button.', 'No se pudo verificar. Usa el botón "Ya pagué".'));
          }
          return;
        }
        consecutiveErrors = 0;
        const data = await res.json();

        if (data.paid) {
          clearInterval(interval);
          unlockAndRedirect(orderId);
          return;
        }

        const elapsed = Date.now() - startTime;
        if (data.expired) {
          if (elapsed < MIN_BEFORE_EXPIRED) {
            setPollingMsg(pick('A verificar pagamento... Confirma na app MB WAY.', 'Verifying payment... Confirm in the MB WAY app.', 'Verificando pago... Confirma en la app MB WAY.'));
          } else {
            clearInterval(interval);
            setPollingExpired(true);
            setPollingMsg(pick('O pagamento expirou. Usa o botão abaixo se já pagaste.', 'Payment expired. Use the button below if you already paid.', 'El pago expiró. Usa el botón de abajo si ya pagaste.'));
          }
          return;
        }

        if (elapsed < 30000) {
          setPollingMsg(pick('Confirma o pagamento na app MB WAY do teu telemóvel...', 'Confirm the payment in the MB WAY app on your phone...', 'Confirma el pago en la app MB WAY de tu móvil...'));
        } else if (elapsed < 60000) {
          setPollingMsg(pick('Ainda a aguardar... Verifica a app MB WAY.', 'Still waiting... Check the MB WAY app.', 'Todavía esperando... Revisa la app MB WAY.'));
        } else {
          setPollingMsg(pick('A aguardar confirmação... Se já aprovaste, aguarda mais uns segundos.', 'Waiting for confirmation... If you already approved, wait a few more seconds.', 'Esperando confirmación... Si ya aprobaste, espera unos segundos más.'));
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingExpired(true);
          setPollingMsg(pick('Tempo esgotado. Se já pagaste, usa o botão abaixo.', 'Time expired. If you already paid, use the button below.', 'Tiempo agotado. Si ya pagaste, usa el botón de abajo.'));
        }
      } catch { consecutiveErrors++; }
    }, 5000);
  };

  const unlockAndRedirect = (orderId: string) => {
    setShowPaymentModal(false);
    // Mark BOTH Career Path and PRO as paid — full product
    localStorage.setItem('careerPathPaid', 'true');
    localStorage.setItem('careerIntelligenceProPaid', 'true');
    localStorage.setItem('careerIntelligenceFull', 'true');
    // Force fresh generation with the country selected in THIS form
    localStorage.setItem('ciNeedsRegeneration', 'true');
    (localStorage.removeItem('careerPathData'), sessionStorage.removeItem('careerPathData'));
    trackPurchase('career_intelligence_full', FINAL_PRICE, orderId);
    if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: FINAL_PRICE, currency: 'EUR'});
    trackAffiliateConversion({ product: 'career_intelligence_full', amount: FINAL_PRICE, currency: 'EUR', payment_method: paymentMethod, customer_email: email, transaction_id: orderId });
    // Save to user_analyses for area-cliente dashboard
    try {
      const cvAnalysis = (localStorage.getItem('careerPathCvAnalysis') || sessionStorage.getItem('careerPathCvAnalysis'));
      const parsed = cvAnalysis ? JSON.parse(cvAnalysis) : {};
      saveToUserAnalyses('career_intelligence', {
        strategic_paths: parsed.strategic_paths || [],
        decision_recommendation: parsed.decision_recommendation || {},
        candidate_profile: parsed.candidate_profile || {},
        career_goal: careerGoal,
        payment_id: orderId,
      });
    } catch (e) { console.warn('[S2I] Error saving career intelligence:', e); }
    setTimeout(() => { setLocation('/results'); }, 400);
  };

  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMsg(pick('A verificar pagamento...', 'Verifying payment...', 'Verificando pago...'));
    setPollingExpired(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentOrderId }),
      });
      const data = await res.json();
      if (data.paid) {
        unlockAndRedirect(currentOrderId);
      } else {
        setPollingExpired(true);
        setPollingMsg(pick('Pagamento ainda não confirmado. Aguarda uns segundos e tenta novamente.', 'Payment not yet confirmed. Wait a few seconds and try again.', 'Pago aún no confirmado. Espera unos segundos e inténtalo de nuevo.'));
        startPolling(currentOrderId);
      }
    } catch {
      setPollingExpired(true);
      setPollingMsg(pick('Erro ao verificar. Tenta novamente em alguns segundos.', 'Error verifying. Try again in a few seconds.', 'Error al verificar. Inténtalo de nuevo en unos segundos.'));
    }
  };

  const handlePaymentSuccess = () => {
    if (currentOrderId) {
      unlockAndRedirect(currentOrderId);
    } else {
      setShowPaymentModal(false);
      localStorage.setItem('careerPathPaid', 'true');
      localStorage.setItem('careerIntelligenceProPaid', 'true');
      localStorage.setItem('careerIntelligenceFull', 'true');
      // Force fresh generation with the country selected in THIS form
      localStorage.setItem('ciNeedsRegeneration', 'true');
      (localStorage.removeItem('careerPathData'), sessionStorage.removeItem('careerPathData'));
      setTimeout(() => { setLocation('/results'); }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <S2IHeader activePage="career-intelligence" />
      <PromoBanner />

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* ═══ STEP 1: HERO ═══ */}
        {step === 'hero' && (
          <div className="space-y-16 animate-in fade-in">
            {/* Hero */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/20 text-sm font-medium text-[#C9A961]">
                <Scale className="w-4 h-4" />
                {pick('Powered by IA Avançada', 'Powered by Advanced AI', 'Powered by IA Avanzada')}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" key={headlineIndex} style={{animation: 'fadeInUp 0.6s ease-out'}}>
                {ciHeadlines[headlineIndex].text} <span className="text-[#C9A961]">{ciHeadlines[headlineIndex].highlight}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {pick('A nossa IA analisa o teu CV e LinkedIn, compara os 3 caminhos de carreira com maior potencial e entrega uma recomendação final — com dados, não com intuição.', 'Our AI analyses your CV and LinkedIn, compares the 3 career paths with the most potential and delivers a final recommendation — with data, not intuition.', 'Nuestra IA analiza tu CV y LinkedIn, compara los 3 caminos de carrera con mayor potencial y entrega una recomendación final — con datos, no con intuición.')}
              </p>

              {/* Primary CTA — immediately visible above the fold */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <Button
                  onClick={() => setStep('upload')}
                  className="h-14 px-10 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all shadow-lg shadow-[#C9A961]/20"
                >
                  <Scale className="w-5 h-5 mr-2" />
                  {pick('Obter a minha recomendação de carreira', 'Get my career recommendation', 'Obtener mi recomendación de carrera')}
                </Button>
                <p className="text-xs text-muted-foreground">{pick('Análise completa por', 'Complete analysis for', 'Análisis completo por')} {PRICE_DISPLAY} · {pick('Pagamento único', 'One-time payment', 'Pago único')} · {pick('Resultado em menos de 1 minuto', 'Result in less than 1 minute', 'Resultado en menos de 1 minuto')}{isUpgrade && <span className="ml-1 text-green-600 font-medium">({pick('preço upgrade Career Path', 'Career Path upgrade price', 'precio upgrade Career Path')})</span>}</p>
              </div>

              {/* Trust badges inline */}
              <div className="flex flex-wrap justify-center gap-6 pt-1">
                {[
                  { icon: <Shield className="w-4 h-4" />, label: pick('Dados 100% privados', '100% Private Data', 'Datos 100% privados') },
                  { icon: <Zap className="w-4 h-4" />, label: pick('Resultado em < 1 min', 'Result in < 1 min', 'Resultado en < 1 min') },
                  { icon: <Award className="w-4 h-4" />, label: pick('Criado por especialistas RH', 'Created by HR experts', 'Creado por expertos en RRHH') },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="text-[#C9A961]">{badge.icon}</span>
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>

            {/* What's included — simplified */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-center text-foreground">{pick('O que recebes com a análise', 'What you get with the analysis', 'Lo que recibes con el análisis')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5 p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Compass className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-muted-foreground">{pick('Diagnóstico completo', 'Complete diagnosis', 'Diagnóstico completo')}</p>
                  </div>
                  {[
                    pick('Roadmap de carreira personalizado', 'Personalised career roadmap', 'Roadmap de carrera personalizado'),
                    pick('Análise de gaps de competências', 'Skills gap analysis', 'Análisis de gaps de competencias'),
                    pick('Estimativa salarial por etapa', 'Salary estimate per stage', 'Estimación salarial por etapa'),
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="space-y-2.5 p-5 rounded-xl bg-gradient-to-b from-[#C9A961]/5 to-[#C9A961]/10 border-2 border-[#C9A961]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-[#C9A961]" />
                    <p className="text-sm font-semibold text-[#C9A961]">{pick('Decisão Estratégica', 'Strategic Decision', 'Decisión Estratégica')}</p>
                  </div>
                  {[
                    pick('3 caminhos comparados com probabilidade de sucesso', '3 paths compared with success probability', '3 caminos comparados con probabilidad de éxito'),
                    pick('Recomendação final com justificação', 'Final recommendation with justification', 'Recomendación final con justificación'),
                    pick('Plano de acção por caminho', 'Action plan per path', 'Plan de acción por camino'),
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground font-medium">
                      <Sparkles className="w-4 h-4 text-[#C9A961] shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center space-y-2">
                <a
                  href={careerIntelligenceDemoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[#C9A961]/60 hover:bg-[#C9A961]/10 text-[#C9A961] font-semibold text-sm transition-all group"
                  style={{ background: 'rgba(201,169,97,0.07)' }}
                >
                  <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {pick('Vê um exemplo de análise', 'View an analysis example', 'Ver un ejemplo de análisis')}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <p className="text-xs text-muted-foreground">
                  {pick('Só o diagnóstico?', 'Just the diagnosis?', '¿Solo el diagnóstico?')} <a href={localePath('/career-path')} className="text-[#C9A961] hover:underline">{careerPathOfferText}</a>
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">{pick('3 passos. 1 minuto. 1 decisão.', '3 steps. 1 minute. 1 decision.', '3 pasos. 1 minuto. 1 decisión.')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: "1", title: pick('Carrega o teu CV', 'Upload your CV', 'Sube tu CV'), desc: pick('Faz upload do CV e partilha o teu LinkedIn.', 'Upload your CV and share your LinkedIn.', 'Sube tu CV y comparte tu LinkedIn.'), time: pick('30 seg', '30 sec', '30 seg') },
                  { step: "2", title: pick('A IA analisa tudo', 'AI analyses everything', 'La IA analiza todo'), desc: pick('Cruzamos experiência, competências, mercado e probabilidades.', 'We cross-reference experience, skills, market and probabilities.', 'Cruzamos experiencia, competencias, mercado y probabilidades.'), time: pick('30 seg', '30 sec', '30 seg') },
                  { step: "3", title: pick('Recebe a recomendação', 'Get the recommendation', 'Recibe la recomendación'), desc: pick('3 caminhos comparados + recomendação final fundamentada.', '3 paths compared + well-founded final recommendation.', '3 caminos comparados + recomendación final fundamentada.'), time: pick('Imediato', 'Instant', 'Inmediato') },
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

            {/* Value anchor */}
            <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-[#C9A961]/20 text-center">
              <Scale className="w-8 h-8 text-[#C9A961] mx-auto" />
              <h3 className="text-lg font-bold text-white">{pick('O equivalente a uma sessão de coaching estratégico.', 'The equivalent of a strategic coaching session.', 'El equivalente a una sesión de coaching estratégico.')}</h3>
              <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                {pick('Um coach de carreira cobra entre 300€ e 600€ por sessão para te ajudar a decidir. O Career Intelligence entrega a mesma análise — com dados objectivos, comparação estruturada e recomendação fundamentada — por', 'A career coach charges between €300 and €600 per session to help you decide. Career Intelligence delivers the same analysis — with objective data, structured comparison and well-founded recommendation — for', 'Un coach de carrera cobra entre 300€ y 600€ por sesión para ayudarte a decidir. El Career Intelligence entrega el mismo análisis — con datos objetivos, comparación estructurada y recomendación fundamentada — por')} <strong className="text-[#C9A961]">{PRICE_DISPLAY}</strong>.
              </p>
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
              <h2 className="text-2xl font-bold text-foreground">{pick('Não precisas de mais opções. Precisas de saber qual escolher.', "You don't need more options. You need to know which to choose.", 'No necesitas más opciones. Necesitas saber cuál elegir.')}</h2>
              <p className="text-muted-foreground">{pick('Diagnóstico completo + decisão estratégica por', 'Complete diagnosis + strategic decision for', 'Diagnóstico completo + decisión estratégica por')} {PRICE_DISPLAY}. {pick('Pagamento único. Sem subscrição.', 'One-time payment. No subscription.', 'Pago único. Sin suscripción.')}</p>
              <Button
                onClick={() => setStep('upload')}
                className="h-auto min-h-[3.5rem] px-4 sm:px-10 py-3 text-sm sm:text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all whitespace-normal"
              >
                <Scale className="w-5 h-5 mr-2 flex-shrink-0" />
                {pick('Obter a minha recomendação de carreira', 'Get my career recommendation', 'Obtener mi recomendación de carrera')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {pick('Só precisas do diagnóstico?', 'Just need the diagnosis?', '¿Solo necesitas el diagnóstico?')} <a href={localePath('/career-path')} className="text-[#C9A961] hover:underline">{careerPathOfferText}</a>
              </p>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: UPLOAD ═══ */}
        {step === 'upload' && (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">{pick("Career Intelligence", "Career Intelligence", "Career Intelligence")}</h2>
              <p className="text-sm text-muted-foreground">{pick('Carrega o teu CV e partilha o teu LinkedIn para a análise completa com recomendação.', 'Upload your CV and share your LinkedIn for the complete analysis with recommendation.', 'Sube tu CV y comparte tu LinkedIn para el análisis completo con recomendación.')}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
              {/* CV Upload */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">1. {pick('Carrega o teu CV', 'Upload your CV', 'Sube tu CV')}</label>
                <label
                  htmlFor="ci-cv-upload"
                  className={`relative block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${file ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border hover:border-[#C9A961]/50 hover:bg-muted/50'}`}
                >
                  <input id="ci-cv-upload" type="file" accept=".pdf,.docx" onChange={handleFileChange} className="sr-only" disabled={loading} />
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
                {!file && savedCvInfo && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(savedCvInfo.url);
                        const blob = await res.blob();
                        const f = new File([blob], savedCvInfo.filename, { type: blob.type || 'application/pdf' });
                        setFile(f);
                        setError(null);
                      } catch {
                        setError(pick('Não foi possível carregar o CV guardado.', 'Could not load the saved CV.', 'No se pudo cargar el CV guardado.'));
                      }
                    }}
                    className="mt-3 text-sm font-medium text-[#C9A961] hover:underline"
                  >
                    {pick('Usar CV guardado: ', 'Use saved CV: ', 'Usar CV guardado: ')}{savedCvInfo.filename}
                  </button>
                )}
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
                    placeholder={pick('https://linkedin.com/in/o-teu-perfil', 'https://linkedin.com/in/your-profile', 'https://linkedin.com/in/tu-perfil')}
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] transition-colors text-sm"
                  />
                </div>
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

              {/* Career Goal */}
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
                <p className="text-sm font-medium">{pick('4. País e região', '4. Country and region', '4. País y región')} <span className="text-red-500">*</span></p>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={country}
                    onChange={(e) => { setCountry(e.target.value); setRegion(''); }}
                    className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40"
                  >
                    <option value="">{pick('Selecciona o teu país...', 'Select your country...', 'Selecciona tu país...')}</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {regionOptions.length > 1 && (
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40"
                    >
                      <option value="">{pick('Selecciona a região (opcional)...', 'Select the region (optional)...', 'Selecciona la región (opcional)...')}</option>
                      {regionOptions.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <p className="text-sm font-medium">{pick('5. E-mail', '5. Email', '5. Correo electrónico')} <span className="text-red-500">*</span></p>
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
                  id="ci-terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 w-4 h-4 rounded border-border accent-[#C9A961]"
                />
                <label htmlFor="ci-terms" className="text-sm text-muted-foreground cursor-pointer">
                  {pick('Concordo com a', 'I agree with the', 'Acepto la')}{' '}
                  <a href={privacyPolicyHref} target="_blank" rel="noopener noreferrer" className="text-[#C9A961] hover:underline">
                    {pick('Política de Privacidade', 'Privacy Policy', 'Política de Privacidad')}
                  </a>{' '}
                  {pick('e autorizo o processamento dos meus dados para análise de carreira.', 'and authorise the processing of my data for career analysis.', 'y autorizo el procesamiento de mis datos para el análisis de carrera.')}
                </label>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
              )}

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

              <button
                onClick={() => setStep('hero')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                {pick('← Voltar', '← Back', '← Volver')}
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2.5: PREVIEW ═══ */}
        {step === 'preview' && previewData && (
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {pick('Análise concluída', 'Analysis completed', 'Análisis completado')}
              </div>
              <h2 className="text-xl font-bold text-foreground">{pick('O teu perfil percebido pela IA', 'Your profile as perceived by AI', 'Tu perfil percibido por la IA')}</h2>
              <p className="text-sm text-muted-foreground">{pick('Isto é o que os recrutadores vêem quando analisam o teu CV', 'This is what recruiters see when they analyse your CV', 'Esto es lo que los reclutadores ven cuando analizan tu CV')}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="text-center pb-4 border-b border-border">
                <p className="text-lg font-bold text-foreground">{previewData.name}</p>
                <p className="text-sm text-[#C9A961] font-semibold">{previewData.role}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-1">{pick('SENIORIDADE', 'SENIORITY', 'SENIORIDAD')}</p>
                  <p className="text-sm font-bold text-foreground">{previewData.seniority}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-center">
                  <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-1">{pick('EXPERIÊNCIA', 'EXPERIENCE', 'EXPERIENCIA')}</p>
                  <p className="text-sm font-bold text-foreground">{previewData.experience}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-2">{pick('TOP COMPETÊNCIAS DETETADAS', 'TOP DETECTED SKILLS', 'TOP COMPETENCIAS DETECTADAS')}</p>
                <div className="flex flex-wrap gap-2">
                  {previewData.skills.map((skill: string, i: number) => (
                    <span key={i} className="text-xs font-medium bg-[#C9A961]/10 text-[#C9A961] px-3 py-1 rounded-full border border-[#C9A961]/20">{skill}</span>
                  ))}
                </div>
              </div>
              {previewData.nextRole && (
                <div className="p-4 bg-gradient-to-r from-[#C9A961]/5 to-[#C9A961]/10 rounded-xl border border-[#C9A961]/20">
                  <p className="text-[10px] font-semibold text-[#C9A961] tracking-wider mb-1">{pick('PRÓXIMO PASSO DE CARREIRA MAIS PROVÁVEL', 'MOST LIKELY NEXT CAREER STEP', 'PRÓXIMO PASO DE CARRERA MÁS PROBABLE')}</p>
                  <p className="text-base font-bold text-foreground">{previewData.nextRole}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pick('Descobre o roadmap completo + recomendação final ↓', 'Discover the complete roadmap + final recommendation ↓', 'Descubre el roadmap completo + recomendación final ↓')}</p>
                </div>
              )}
            </div>

            {/* Blurred teaser */}
            <div className="relative bg-card border border-border rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white z-10" />
              <div className="filter blur-sm select-none">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">{pick('COMPARAÇÃO ESTRATÉGICA DOS 3 CAMINHOS', 'STRATEGIC COMPARISON OF 3 PATHS', 'COMPARACIÓN ESTRATÉGICA DE LOS 3 CAMINOS')}</p>
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
                  <p className="text-sm font-semibold text-foreground">{pick('Análise completa bloqueada', 'Full analysis locked', 'Análisis completo bloqueado')}</p>
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
                <Scale className="w-5 h-5 mr-2" />
                {pick(`Desbloquear Career Intelligence — ${CUR}${PRICE}`, `Unlock Career Intelligence — ${CUR}${PRICE}`, `Desbloquear Career Intelligence — ${CUR}${PRICE}`)}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">{pick('Diagnóstico + 3 caminhos + comparação + trade-offs + recomendação final', 'Diagnosis + 3 paths + comparison + trade-offs + final recommendation', 'Diagnóstico + 3 caminos + comparación + trade-offs + recomendación final')}</p>
              <button
                onClick={() => setStep('upload')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                {pick('← Voltar', '← Back', '← Volver')}
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
              {pick('Career Intelligence — Pagamento', 'Career Intelligence — Payment', 'Career Intelligence — Pago')}
            </DialogTitle>
          </DialogHeader>

          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{pick("Career Intelligence", "Career Intelligence", "Career Intelligence")}</p>
                  <p className="text-xs text-muted-foreground">{pick('Diagnóstico + Decisão Estratégica', 'Diagnosis + Strategic Decision', 'Diagnóstico + Decisión Estratégica')}</p>
                </div>
                <div className="text-right">
                  {discountPercent > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground line-through">{PRICE_DISPLAY}</p>
                      <p className="text-lg font-bold text-[#C9A961]">{FINAL_PRICE_DISPLAY}€</p>
                      <p className="text-[10px] text-green-600 font-semibold">-{discountPercent}%</p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-[#C9A961]">{PRICE_DISPLAY}</p>
                  )}
                </div>
              </div>

              {/* Unified discount code (coupon or voucher) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">{pick('Código de desconto (opcional)', 'Discount code (optional)', 'Código de descuento (opcional)')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError(null); setDiscountValid(false); setDiscountPercent(0); setDiscountType(null); }}
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
                {discountValid && <p className="text-xs text-green-600 font-semibold">{discountAppliedText(discountPercent)}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">{pick('Email', 'Email', 'Email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={pick('seu@email.com', 'your@email.com', 'tu@email.com')}
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
                          {paymentMethodLabel(method)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === 'mbway' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">{pick('Telemóvel (MB WAY)', 'Phone (MB WAY)', 'Móvil (MB WAY)')}</label>
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
                  <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">{pick('Voltar', 'Back', 'Volver')}</Button>
                  <Button
                    onClick={() => {
                      setShowPaymentModal(false);
                      localStorage.setItem('careerPathPaid', 'true');
                      localStorage.setItem('careerIntelligenceProPaid', 'true');
                      localStorage.setItem('careerIntelligenceFull', 'true');
                      // Force fresh generation with the country selected in THIS form
                      localStorage.setItem('ciNeedsRegeneration', 'true');
                      (localStorage.removeItem('careerPathData'), sessionStorage.removeItem('careerPathData'));
                      localStorage.setItem('cpOrderId', `CI-FREE-${discountCode || 'PROMO'}`);
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
              {!pollingExpired && <p className="text-xs text-muted-foreground">{pick('A aguardar confirmação do pagamento...', 'Waiting for payment confirmation...', 'Esperando confirmación del pago...')}</p>}
              {pollingExpired && (
                <Button onClick={handleManualCheck} className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 mr-2" />{pick('Já paguei — verificar novamente', 'I already paid — verify again', 'Ya pagué — verificar de nuevo')}
                </Button>
              )}
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-base font-bold text-foreground">{pick('Pagamento confirmado!', 'Payment confirmed!', '¡Pago confirmado!')}</p>
              <p className="text-sm text-muted-foreground">{pick('A gerar o teu Career Intelligence completo...', 'Generating your complete Career Intelligence...', 'Generando tu Career Intelligence completo...')}</p>
              <Button onClick={handlePaymentSuccess} className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold">
                {pick('Gerar Career Intelligence', 'Generate Career Intelligence', 'Generar Career Intelligence')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>



      {/* ─── Member Area CTA ─── */}
      <div className="max-w-4xl mx-auto px-6 mt-12 mb-8">
        <div className="p-6 bg-gradient-to-r from-[#f9f6ef] to-[#faf8f3] border border-[#C9A961]/20 rounded-2xl text-center">
          <p className="text-base font-bold text-slate-800 mb-2">{pick('Queres acesso regular ao Career Intelligence?', 'Want regular access to Career Intelligence?', '¿Quieres acceso regular al Career Intelligence?')}</p>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">{pick('Com o plano Pro, tens Career Intelligence incluído mensalmente + todas as outras ferramentas, conteúdos exclusivos e muito mais.', 'With the Pro plan, you get Career Intelligence included monthly + all other tools, exclusive content and much more.', 'Con el plan Pro, tienes Career Intelligence incluido mensualmente + todas las demás herramientas, contenidos exclusivos y mucho más.')}</p>
          <a
            href={localePath('/area-cliente/planos')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            {pick('Ver planos de subscrição →', 'View subscription plans →', 'Ver planes de suscripción →')}
          </a>
          <p className="text-xs text-slate-400 mt-3">{pick('Career Intelligence incluído no plano Pro (39,99€/mês)', 'Career Intelligence included in the Pro plan (€39.99/month)', 'Career Intelligence incluido en el plan Pro (39,99€/mes)')}</p>
        </div>
      </div>

      <S2IFooter />
    </div>
  );
}
