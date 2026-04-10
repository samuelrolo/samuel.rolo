// CV Analyser v2 - Share2Inspire - Build 2026-02-16
// Uses Supabase Edge Function (hyper-task) for Gemini AI analysis
// Sections: Hero, Upload, Trust Badges, What's Included, Social Proof, Pricing, Comparison, Benefits

declare global {
  interface Window {
    currentReportData: any;
  }
}

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Home as HomeIcon, FileCheck, BarChart3, Grid2x2, TrendingUp, Eye, ChevronDown, ChevronUp, Star, Users, Award, Zap, Shield, Target, Clock, CheckCircle2, XCircle, Minus, Compass, Briefcase, Link, Globe, Check, Menu, X, Search, FileSearch, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import { trackCVUpload, trackAnalysisStart, trackAnalysisComplete, trackPaymentStart, trackPurchase } from "@/lib/gtag";
import mammoth from "mammoth";
import { transformGeminiResponse } from "@/lib/transformGeminiResponse";
import { getDefaultCountryByLanguage, getCountries, getRegions } from "@/data/countries";
import S2IFooter from "@/components/S2IFooter";
import S2IHeader from "@/components/S2IHeader";
import useTranslation from "@/i18n/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";
import { getAuthenticatedProfilePrefill } from "@/lib/profilePrefill";

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

/**
 * Fire-and-forget: send welcome email after CV analysis.
 * Never blocks the user flow. Errors are silently caught.
 */
function sendWelcomeEmail(email: string, name: string, lang: string = 'pt') {
  try {
    // Avoid sending duplicate emails in the same session
    const sentKey = `welcome_email_sent_${email}`;
    if (sessionStorage.getItem(sentKey)) return;
    sessionStorage.setItem(sentKey, 'true');
    fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type: 'cv_analysis', email, name, lang }),
    }).then(res => {
      console.log('[WELCOME] Email sent, status:', res.status);
    }).catch(err => {
      console.warn('[WELCOME] Failed to send welcome email (non-critical):', err.message);
    });
  } catch (e) {
    // Never throw - this is purely engagement
  }
}

/**
 * Fire-and-forget: log analysis to cv_analysis table for dashboard.
 * Never blocks the user flow. Errors are silently caught.
 */
function logAnalysisToSupabase(analysisResult: any, analysisSource: any, cvText?: string) {
  try {
    const score = analysisResult.overallScore || null;
    const professionalArea = analysisResult.perceivedRole || null;
    // Extract candidate name, email and phone from Gemini response
    const cp = analysisSource?.candidate_profile || analysisSource?.analysis?.candidate_profile || {};
    const detectedName = cp.detected_name || null;
    const detectedEmail = cp.detected_email && cp.detected_email !== 'N/A' ? cp.detected_email : null;
    // Use mandatory email from form as primary, Gemini detection as fallback
    const userEmail = sessionStorage.getItem('paymentEmail') || detectedEmail;
    const detectedPhone = cp.detected_phone && cp.detected_phone !== 'N/A' ? cp.detected_phone : null;
    const userRating = score >= 80 ? 5 : score >= 65 ? 4 : score >= 50 ? 3 : score > 0 ? 2 : null;
    // Check if this is a paid analysis (voucher used or LinkedIn paid)
    const isPaid = sessionStorage.getItem('isPaid') === 'true';
    const voucherCode = sessionStorage.getItem('voucherCode') || null;
    const paymentAmount = sessionStorage.getItem('paymentAmount') || null;
    const transactionId = sessionStorage.getItem('transactionId') || null;
    fetch(`${SUPABASE_URL}/rest/v1/cv_analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        score: score,
        professional_area: professionalArea,
        user_rating: userRating,
        analysis_type: isPaid ? 'paid' : 'free',
        analysis_result: analysisSource ? JSON.stringify(analysisSource) : null,
        cv_text: cvText || null,
        payment_status: isPaid ? 'paid' : 'pending',
        payment_amount: paymentAmount ? parseFloat(paymentAmount) : null,
        transaction_id: transactionId,
        domain: 'share2inspire.pt',
        user_name: detectedName,
        user_email: userEmail,
        user_phone: detectedPhone,
      }),
    }).then(res => res.json()).then(data => {
      if (Array.isArray(data) && data[0]?.id) {
        sessionStorage.setItem('analysisId', String(data[0].id));
        console.log('[ANALYTICS] cv_analysis logged, id:', data[0].id);
      }
    }).catch(err => {
      console.warn('[ANALYTICS] Falha ao gravar analise (nao critico):', err.message);
    });
  } catch (e) {
    // Never throw - this is purely analytics
  }
}

/** Extract text from a PDF file using pdf.js */
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

/** Extract text from a DOCX file using mammoth */
async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// transformGeminiResponse imported from @/lib/transformGeminiResponse

/* ─── Testimonials Data ─── */
const testimonials = [
  {
    name: "Ana Rodrigues",
    role: "Marketing Manager",
    text: "Recebi o relatório em minutos. As sugestões eram tão específicas que consegui melhorar o meu CV nessa mesma noite. Resultado: 3 entrevistas na semana seguinte.",
    rating: 5,
  },
  {
    name: "Pedro Santos",
    role: "Engenheiro de Software",
    text: "A análise por quadrantes mostrou-me exactamente onde o meu CV estava fraco. Depois de aplicar as recomendações, passei filtros ATS que antes me rejeitavam.",
    rating: 5,
  },
  {
    name: "Mariana Costa",
    role: "Gestora de Projetos",
    text: "Valia muito mais do que os €9,99 que paguei. O posicionamento na curva normal foi um eye-opener — percebi que estava no percentil 40 e agora estou no 75.",
    rating: 5,
  },
];

/* ─── Pricing Data ─── */
const pricingPlans = [
  {
    name: "Essencial",
    price: "9,99",
    analyses: 1,
    perUnit: "9,99",
    popular: false,
    badge: null,
    features: ["Análise completa desbloqueada", "ATS Deep Scan + Análise de Keywords", "Live Match — compara CV vs vaga", "Curva normal de posicionamento", "Estimativa salarial detalhada", "Certificação LinkedIn"],
  },

  {
    name: "Profissional",
    price: "15,99",
    analyses: 3,
    perUnit: "5,33",
    popular: false,
    badge: null,
    features: ["3 análises completas", "ATS Deep Scan + Análise de Keywords", "Live Match — compara CV vs vaga", "Código reutilizável para futuras análises", "Certificação LinkedIn", "Suporte prioritário por email"],
  },
  {
    name: "Premium",
    price: "20,49",
    analyses: 5,
    perUnit: "4,10",
    popular: false,
    badge: null,
    features: ["5 análises completas", "ATS Deep Scan + Análise de Keywords", "Live Match — compara CV vs vaga", "Código reutilizável para futuras análises", "Certificação LinkedIn", "Partilha com amigos/colegas"],
  },
];

/* ─── Comparison Data ─── */
const comparisonFeatures = [
  { feature: "Análise por IA avançada", us: true, competitor1: true, competitor2: false },
  { feature: "Relatório em Português", us: true, competitor1: false, competitor2: true },
  { feature: "Score ATS real", us: true, competitor1: true, competitor2: false },
  { feature: "ATS Deep Scan (3 scores)", us: true, competitor1: false, competitor2: false },
  { feature: "Análise de Keywords", us: true, competitor1: true, competitor2: false },
  { feature: "Live Match (CV vs Vaga)", us: true, competitor1: false, competitor2: false },
  { feature: "Checklist de Formato ATS", us: true, competitor1: false, competitor2: false },
  { feature: "Curva normal de posicionamento", us: true, competitor1: false, competitor2: false },
  { feature: "Estimativa salarial", us: true, competitor1: false, competitor2: false },
  { feature: "Análise gratuita incluída", us: true, competitor1: false, competitor2: true },
  { feature: "Relatório PDF detalhado", us: true, competitor1: true, competitor2: false },
  { feature: "Career Path (roadmap de carreira)", us: true, competitor1: false, competitor2: false },
  { feature: "Certificação LinkedIn partilhável", us: true, competitor1: false, competitor2: false },
  { feature: "Cruzamento CV vs LinkedIn", us: true, competitor1: false, competitor2: false },
  { feature: "Preço", usText: "Desde €9,99", comp1Text: "€19,99/mês", comp2Text: "€9,99" },
];

export default function Home() {
  const { pick, lang, localePath } = useTranslation();
  const { symbol: CUR } = useCurrency();
  const isPT = lang === 'pt';
  useEffect(() => { document.title = "CV Analyser — Análise de CV com IA | Share2Inspire"; }, []);

  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedCvInfo, setSavedCvInfo] = useState<{filename: string; url: string} | null>(null);

  // Load saved CV, email and LinkedIn from user_profiles if logged in
  useEffect(() => {
    let active = true;
    (async () => {
      const profile = await getAuthenticatedProfilePrefill();
      if (!active || !profile) return;
      if (profile.cvUrl && profile.cvFilename) {
        setSavedCvInfo({ filename: profile.cvFilename, url: profile.cvUrl });
      }
      if (profile.email) setAnalysisEmail((current) => current || profile.email);
      if (profile.linkedinUrl) setLinkedInUrl((current) => current || profile.linkedinUrl);
    })();
    return () => { active = false; };
  }, []);


  // Save CV to Supabase Storage after analysis
  function persistCvToStorage(base64Content: string, filename: string) {
    try {
      const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (!storageKey) return;
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const accessToken = parsed?.access_token;
      const userId = parsed?.user?.id;
      if (!accessToken || !userId) return;
      // Convert base64 to blob
      const byteString = atob(base64Content.split(',')[1] || base64Content);
      const mimeString = base64Content.split(',')[0]?.split(':')[1]?.split(';')[0] || 'application/pdf';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeString });
      const ext = filename.split('.').pop() || 'pdf';
      const path = `${userId}/cv.${ext}`;
      fetch(`${SUPABASE_URL}/storage/v1/object/user-cvs/${path}`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'x-upsert': 'true' },
        body: blob
      }).then(r => {
        if (r.ok) {
          const storagePath = `${SUPABASE_URL}/storage/v1/object/authenticated/user-cvs/${path}`;
          fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}`, {
            method: 'PATCH',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ cv_url: storagePath, cv_filename: filename, cv_uploaded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          }).catch(() => {});
          console.log('[S2I] CV saved to storage');
        }
      }).catch(e => console.warn('[S2I] CV storage error:', e));
    } catch (e) { /* silent */ }
  }

  // Progressive loading messages for CV Analyser
  const loadingMessages = [
    pick("A extrair dados do teu CV...", "Extracting data from your CV...", "Extrayendo datos de tu CV..."),
    pick("A identificar competências-chave...", "Identifying key skills...", "Identificando competencias clave..."),
    pick("A analisar experiência profissional...", "Analysing professional experience...", "Analizando experiencia profesional..."),
    pick("A comparar com o mercado de trabalho...", "Comparing with the job market...", "Comparando con el mercado laboral..."),
    pick("A calcular compatibilidade ATS...", "Calculating ATS compatibility...", "Calculando compatibilidad ATS..."),
    pick("A avaliar pontos fortes e áreas de melhoria...", "Evaluating strengths and areas for improvement...", "Evaluando puntos fuertes y áreas de mejora..."),
    pick("A gerar recomendações personalizadas...", "Generating personalised recommendations...", "Generando recomendaciones personalizadas..."),
    pick("A finalizar o relatório...", "Finalising the report...", "Finalizando el informe..."),
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < loadingMessages.length - 1 ? prev + 1 : prev);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [wantsJobMatch, setWantsJobMatch] = useState(false);
  const [jobInput, setJobInput] = useState("");
  const [showEmailLink, setShowEmailLink] = useState(false);
  const [emailForLink, setEmailForLink] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(false);

  // Rotating headlines — conversion-focused
  const headlines = [
    { text: pick("O teu CV está a ser rejeitado por", "Is your CV being rejected by", "¿Tu CV está siendo rechazado por"), highlight: pick("robôs?", "robots?", "robots?") },
    { text: pick("87% dos CVs nunca chegam ao", "87% of CVs never reach the", "El 87% de los CVs nunca llegan al"), highlight: pick("recrutador", "recruiter", "reclutador") },
    { text: pick("Descobre o que os recrutadores realmente", "Find out what recruiters really", "Descubre lo que los reclutadores realmente"), highlight: pick("veem", "see", "ven") },
  ];
  const [headlineIdx, setHeadlineIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIdx(prev => (prev + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [showBuyVoucher, setShowBuyVoucher] = useState(false);
  const [voucherEmail, setVoucherEmail] = useState("");
  const [voucherSelectedPlan, setVoucherSelectedPlan] = useState(0);
  const [voucherPhone, setVoucherPhone] = useState("");
  const [voucherPaymentLoading, setVoucherPaymentLoading] = useState(false);
  const [voucherPaymentStatus, setVoucherPaymentStatus] = useState<'idle' | 'polling' | 'success' | 'error'>('idle');
  const [voucherPaymentError, setVoucherPaymentError] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [showLinkedInPaywall, setShowLinkedInPaywall] = useState(false);
  const [showNoCvOptions, setShowNoCvOptions] = useState(false);
  const [linkedInVoucherCode, setLinkedInVoucherCode] = useState("");
  const [linkedInVoucherError, setLinkedInVoucherError] = useState<string | null>(null);
  const [linkedInVoucherValidating, setLinkedInVoucherValidating] = useState(false);
  // LinkedIn paywall inline payment
  // Country and region for localised analysis
  const [selectedCountry, setSelectedCountry] = useState<string>(() => getDefaultCountryByLanguage(lang));
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const countries = getCountries(lang);
  const regionOptions = getRegions(selectedCountry, lang);

  useEffect(() => {
    setSelectedCountry((current) => current || getDefaultCountryByLanguage(lang));
  }, [lang]);

  // Mandatory email for analysis
  const [analysisEmail, setAnalysisEmail] = useState("");
  const [analysisEmailError, setAnalysisEmailError] = useState<string | null>(null);

  // Email validation: must be real format, reject obvious fakes
  const validateEmail = (email: string): { valid: boolean; error?: string } => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return { valid: false, error: pick('Introduz o teu email para continuar.', 'Enter your email to continue.', 'Introduce tu email para continuar.') };
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmed)) return { valid: false, error: 'Formato de email inválido.' };
    // Block disposable/fake patterns
    const fakePatterns = ['teste', 'test', 'exemplo', 'example', 'fake', 'asdf', 'qwer', 'aaa', 'bbb', 'ccc', 'xxx', 'yyy', 'zzz', 'noreply', 'noemail', 'abc@', '123@', 'admin@admin', 'user@user', 'email@email', 'mail@mail', 'a@a', 'b@b'];
    const localPart = trimmed.split('@')[0];
    const domain = trimmed.split('@')[1];
    // Block if local part is entirely a fake pattern
    if (fakePatterns.some(p => localPart === p || domain?.startsWith(p + '.'))) return { valid: false, error: 'Por favor, usa o teu email verdadeiro.' };
    // Block very short local parts (a@, ab@)
    if (localPart.length < 3) return { valid: false, error: 'Por favor, usa o teu email verdadeiro.' };
    // Block repeated chars (aaa@, bbb@)
    if (/^(.)\1{2,}$/.test(localPart)) return { valid: false, error: 'Por favor, usa o teu email verdadeiro.' };
    // Block common fake domains
    const fakeDomains = ['teste.com', 'teste.pt', 'test.com', 'test.pt', 'exemplo.com', 'exemplo.pt', 'example.com', 'fake.com', 'noemail.com', 'email.com', 'mail.com', 'aaa.com', 'bbb.com'];
    if (fakeDomains.includes(domain)) return { valid: false, error: 'Por favor, usa o teu email verdadeiro.' };
    return { valid: true };
  };

  const [liPaywallStep, setLiPaywallStep] = useState<'choose' | 'pay'>('choose');
  const [liPaywallPlan, setLiPaywallPlan] = useState(0);
  const [liPaywallEmail, setLiPaywallEmail] = useState("");
  const [liPaywallPhone, setLiPaywallPhone] = useState("");
  const [liPaywallLoading, setLiPaywallLoading] = useState(false);
  const [liPaywallStatus, setLiPaywallStatus] = useState<'idle' | 'polling' | 'success' | 'error'>('idle');
  const [liPaywallError, setLiPaywallError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Por favor, carregue um ficheiro PDF, DOCX ou imagem (PNG/JPEG)');
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('O ficheiro não pode exceder 5MB');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
      trackCVUpload();
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (!selectedCountry) {
      setError(pick('Selecciona o teu país para resultados localizados.', 'Select your country for localised results.', 'Selecciona tu país para resultados localizados.'));
      return;
    }
    // Validate mandatory email
    const emailCheck = validateEmail(analysisEmail);
    if (!emailCheck.valid) {
      setAnalysisEmailError(emailCheck.error || 'Email obrigatório.');
      setError(emailCheck.error || 'Introduz o teu email para continuar.');
      return;
    }
    setAnalysisEmailError(null);
    sessionStorage.setItem('paymentEmail', analysisEmail.trim().toLowerCase());
    trackAnalysisStart('cv_analyser');
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      console.log('[CV_ENGINE] Iniciando análise:', file.name, file.type);

      let cvText = "";
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        // Images always use server-side Gemini Vision extraction
        cvText = '';
      } else if (file.type === 'application/pdf') {
        cvText = await extractTextFromPDF(file);
      } else {
        cvText = await extractTextFromDOCX(file);
      }

      console.log('[CV_ENGINE] Texto extraído, comprimento:', cvText.length);

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
        console.log('[CV_ENGINE] Texto insuficiente no browser (' + cvText.length + ' chars). A enviar PDF para extração via Gemini Vision...');
      } else {
        console.log('[GEMINI] A enviar CV para análise IA via Supabase Edge Function...');
      }

      // Retry logic for intermittent 500 errors (cold starts, rate limits)
      let response: Response | null = null;
      let responseData: any = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        try {
          const requestBody: any = {
            mode: 'cv_extraction',
            country: selectedCountry,
            region: selectedRegion || undefined,
            ...(jobInput.trim() ? { job_description: jobInput.trim().substring(0, 3000) } : {})
          };
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
            console.log('[GEMINI] Resposta recebida:', JSON.stringify(responseData).substring(0, 200));
            if (responseData.success) break;
          }

          // If not last attempt, wait and retry
          if (attempt < maxRetries) {
            console.warn(`[CV_ENGINE] Tentativa ${attempt + 1} falhou (status: ${response?.status}). A tentar novamente...`);
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } else {
            const errorText = await response?.text().catch(() => 'Unknown error');
            console.error('[GEMINI] Erro do backend após retries:', response?.status, errorText);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < maxRetries && fetchError.name !== 'AbortError') {
            console.warn(`[CV_ENGINE] Tentativa ${attempt + 1} falhou (${fetchError.message}). A tentar novamente...`);
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

      // Pass full response - analysis data is at root level, not under .analysis
      const analysisSource = responseData.analysis || responseData;
      const analysisResult = transformGeminiResponse(analysisSource);

      window.currentReportData = analysisSource;

      // Clear previous payment/unlock state for new analysis
      sessionStorage.removeItem('isPaid');
      sessionStorage.removeItem('careerPathIncluded');
      sessionStorage.removeItem('careerPathPaid');
      sessionStorage.removeItem('careerPathData');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('paymentEmail');

      sessionStorage.setItem('cvAnalysis', JSON.stringify(analysisResult));
      sessionStorage.setItem('cvFile', base64Content);
      sessionStorage.setItem('cvFilename', file.name);
      sessionStorage.setItem('analysisLang', 'pt');
      // Store extracted CV text for Live Match feature
      if (cvText && cvText.length > 0) {
        sessionStorage.setItem('cvText', cvText.substring(0, 15000));
      }
      sessionStorage.setItem('analysisCountry', selectedCountry);
      sessionStorage.setItem('analysisRegion', selectedRegion);
      if (jobInput.trim()) {
        sessionStorage.setItem('jobDescription', jobInput.trim());
      } else {
        sessionStorage.removeItem('jobDescription');
      }

      console.log('[CV_ENGINE] Análise completa:', JSON.stringify(analysisResult).substring(0, 200));

      // Fire-and-forget: log to cv_analysis for dashboard
      logAnalysisToSupabase(analysisResult, analysisSource, cvText);

      // Fire-and-forget: send welcome email
      const welcomeEmail = sessionStorage.getItem('paymentEmail') || analysisEmail;
      const cpWelcome = analysisSource?.candidate_profile || analysisSource?.analysis?.candidate_profile || {};
      const welcomeName = cpWelcome.detected_name || '';
      if (welcomeEmail) sendWelcomeEmail(welcomeEmail, welcomeName, 'pt');

      // Persist CV to Supabase Storage for future sessions
      persistCvToStorage(base64Content, file.name);

      // Save to user_analyses for area-cliente dashboard
      try {
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (storageKey) {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            const accessToken = parsed?.access_token;
            const userId = parsed?.user?.id;
            if (accessToken && userId) {
              fetch(`${SUPABASE_URL}/rest/v1/user_analyses`, {
                method: 'POST',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                body: JSON.stringify({ user_id: userId, analysis_type: 'cv_analyser', data: { ...analysisResult, captured_at: new Date().toISOString(), email: analysisEmail }, created_at: new Date().toISOString() })
              }).catch(() => {});
            }
          }
        }
      } catch (e) { /* silent */ }

      const elapsed = Date.now() - startTime;
      const remaining = 2800 - elapsed;
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

      setLocation('/results');

    } catch (err: any) {
      console.error('[CV_ENGINE] Erro:', err);
      if (err.name === 'AbortError') {
        setError('A análise demorou demasiado. Por favor, tente novamente.');
      } else {
        setError(err.message || 'Erro ao analisar o CV. Por favor, tente novamente.');
      }
      setLoading(false);
    }
  };

  // Validate discount code against discount_coupons then vouchers
  const validateVoucherForLinkedIn = async (code: string): Promise<boolean> => {
    setLinkedInVoucherValidating(true);
    setLinkedInVoucherError(null);
    try {
      // Step 1: Check discount_coupons (100% discount = free access)
      const couponRes = await fetch(`${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,partner_name,max_uses,current_uses,valid_from,valid_until,applicable_products`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setLinkedInVoucherError('Este código ainda não está ativo.'); return false; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setLinkedInVoucherError('Este código já expirou.'); return false; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setLinkedInVoucherError('Este código atingiu o limite de utilizações.'); return false; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('cv_analyser') && !products.includes('linkedin_analysis')) {
          setLinkedInVoucherError('Este código não é aplicável a esta análise.'); return false;
        }
        if (coupon.discount_percent === 100) {
          // 100% discount = free access, same as voucher
          sessionStorage.setItem('isPaid', 'true');
          sessionStorage.setItem('voucherCode', code);
          sessionStorage.setItem('paymentAmount', '0');
          sessionStorage.setItem('transactionId', `COUPON-${code}`);
          setShowLinkedInPaywall(false);
          // Increment coupon usage counter
          const { incrementCouponUsage } = await import('@/lib/affiliate');
          incrementCouponUsage(code);
          return true;
        }
        // Partial discount — store it in sessionStorage for the Results page payment modal
        sessionStorage.setItem('appliedCouponCode', code);
        sessionStorage.setItem('appliedCouponPercent', String(coupon.discount_percent));
        const { incrementCouponUsage } = await import('@/lib/affiliate');
        incrementCouponUsage(code);
        setLinkedInVoucherError(`Desconto de ${coupon.discount_percent}% aplicado! Será usado no pagamento.`);
        // Close paywall after a brief delay to show the message
        setTimeout(() => { setShowLinkedInPaywall(false); }, 1500);
        return true;
      }

      // Step 2: Check vouchers table
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const vouchers = await res.json();
      if (!Array.isArray(vouchers) || vouchers.length === 0) {
        setLinkedInVoucherError('Código inválido. Verifica e tenta novamente.');
        return false;
      }
      const voucher = vouchers[0];
      const remaining = (voucher.total_analyses || 0) - (voucher.used_analyses || 0);
      if (remaining <= 0) {
        setLinkedInVoucherError('Este código já não tem análises disponíveis.');
        return false;
      }
      // Valid! Store payment info
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('voucherCode', code);
      sessionStorage.setItem('voucherId', String(voucher.id));
      sessionStorage.setItem('remainingAnalyses', String(remaining));
      sessionStorage.setItem('paymentAmount', String(voucher.amount_paid || 0));
      sessionStorage.setItem('transactionId', voucher.order_id || '');
      setShowLinkedInPaywall(false);
      return true;
    } catch (err) {
      setLinkedInVoucherError('Erro ao validar código. Tenta novamente.');
      return false;
    } finally {
      setLinkedInVoucherValidating(false);
    }
  };

  // Handle LinkedIn URL analysis (analyse profile without CV file)
  const handleLinkedInAnalyze = async () => {
    if (!linkedInUrl.toLowerCase().includes('linkedin.com')) {
      setError(pick('Introduz um URL de LinkedIn válido (ex: https://linkedin.com/in/o-teu-perfil)', 'Enter a valid LinkedIn URL (e.g. https://linkedin.com/in/your-profile)', 'Introduce un URL de LinkedIn válido (ej: https://linkedin.com/in/tu-perfil)'));
      return;
    }
    if (!selectedCountry) {
      setError(pick('Selecciona o teu país para resultados localizados.', 'Select your country for localised results.', 'Selecciona tu país para resultados localizados.'));
      return;
    }
    if (!acceptedTerms) {
      setError(pick('Aceita a Política de Privacidade para continuar.', 'Accept the Privacy Policy to continue.', 'Acepta la Política de Privacidad para continuar.'));
      return;
    }
    // Validate mandatory email
    const emailCheck = validateEmail(analysisEmail);
    if (!emailCheck.valid) {
      setAnalysisEmailError(emailCheck.error || 'Email obrigatório.');
      setError(emailCheck.error || 'Introduz o teu email para continuar.');
      return;
    }
    setAnalysisEmailError(null);
    sessionStorage.setItem('paymentEmail', analysisEmail.trim().toLowerCase());

    // Check if user has a valid voucher/payment
    const isPaid = sessionStorage.getItem('isPaid') === 'true';
    if (!isPaid) {
      // Show paywall - LinkedIn analysis is premium only
      setShowLinkedInPaywall(true);
      setLiPaywallStep('choose');
      setLiPaywallPlan(0);
      setLiPaywallEmail('');
      setLiPaywallPhone('');
      setLiPaywallLoading(false);
      setLiPaywallStatus('idle');
      setLiPaywallError(null);
      return;
    }

    trackAnalysisStart('cv_analyser_linkedin');
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      console.log('[CV_ENGINE] Iniciando análise via LinkedIn:', linkedInUrl);

      // Step 1: Scrape LinkedIn profile via backend (Apify)
      console.log('[CV_ENGINE] Step 1: A extrair dados do perfil LinkedIn via Apify...');
      const scrapeResponse = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/services/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin_url: linkedInUrl })
      });

      if (!scrapeResponse.ok) {
        const scrapeError = await scrapeResponse.json().catch(() => ({}));
        throw new Error(scrapeError?.error || 'Erro ao extrair dados do perfil LinkedIn.');
      }

      const scrapeData = await scrapeResponse.json();
      if (!scrapeData?.success || !scrapeData?.cv_text) {
        throw new Error(scrapeData?.error || 'Não foi possível extrair dados do perfil LinkedIn.');
      }

      console.log('[CV_ENGINE] Step 1 OK: Extraídos', scrapeData.cv_text.length, 'chars do perfil', scrapeData.profile_name);

      // Step 2: Send extracted text to edge function for AI analysis
      console.log('[CV_ENGINE] Step 2: A enviar para análise IA...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const requestBody: any = {
        mode: 'cv_extraction',
        country: selectedCountry,
        region: selectedRegion || undefined,
        cv_text: scrapeData.cv_text.substring(0, 8000),
        linkedin_url: linkedInUrl,
        ...(jobInput.trim() ? { job_description: jobInput.trim().substring(0, 3000) } : {})
      };

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

      if (!response.ok) {
        throw new Error('Erro na análise IA. Por favor, tente novamente.');
      }

      const responseData = await response.json();
      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Erro na análise IA.');
      }

      const analysisSource = responseData.analysis || responseData;
      const analysisResult = transformGeminiResponse(analysisSource);

      window.currentReportData = analysisSource;

      // Don't remove isPaid for LinkedIn - it's already validated
      sessionStorage.removeItem('careerPathIncluded');
      sessionStorage.removeItem('careerPathPaid');
      sessionStorage.removeItem('careerPathData');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('paymentEmail');

      sessionStorage.setItem('cvAnalysis', JSON.stringify(analysisResult));
      sessionStorage.setItem('cvFile', '');
      sessionStorage.setItem('cvFilename', 'linkedin-profile');
      sessionStorage.setItem('analysisLang', 'pt');
      // Store scraped text for Live Match (LinkedIn flow)
      if (scrapeData?.cv_text) {
        sessionStorage.setItem('cvText', scrapeData.cv_text.substring(0, 15000));
      }
      sessionStorage.setItem('analysisCountry', selectedCountry);
      sessionStorage.setItem('analysisRegion', selectedRegion);
      sessionStorage.setItem('linkedinUrl', linkedInUrl);
      // LinkedIn analysis is always paid - keep isPaid flag
      sessionStorage.setItem('isPaid', 'true');
      if (jobInput.trim()) {
        sessionStorage.setItem('jobDescription', jobInput.trim());
      } else {
        sessionStorage.removeItem('jobDescription');
      }

      logAnalysisToSupabase(analysisResult, analysisSource, `LinkedIn: ${linkedInUrl}`);

      // Fire-and-forget: send welcome email (LinkedIn flow)
      const liEmail = sessionStorage.getItem('paymentEmail') || '';
      if (liEmail) sendWelcomeEmail(liEmail, '', 'pt');

      const elapsed = Date.now() - startTime;
      const remaining = 2800 - elapsed;
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

      setLocation('/results');

    } catch (err: any) {
      console.error('[CV_ENGINE] Erro LinkedIn:', err);
      if (err.name === 'AbortError') {
        setError('A análise demorou demasiado. Por favor, tente novamente.');
      } else {
        setError(err.message || 'Erro ao analisar o perfil LinkedIn. Por favor, tente novamente.');
      }
      setLoading(false);
    }
  };

  // Handle LinkedIn paywall inline payment (buy + auto-analyse)
  const handleLiPaywallPurchase = async () => {
    if (!liPaywallEmail.includes('@')) {
      setLiPaywallError('Introduz um email válido.');
      return;
    }
    if (!liPaywallPhone || liPaywallPhone.length < 9) {
      setLiPaywallError('Introduz um número de telemóvel válido.');
      return;
    }
    const plan = pricingPlans[liPaywallPlan];
    setLiPaywallLoading(true);
    setLiPaywallError(null);
    setLiPaywallStatus('idle');
    try {
      // Format phone with 351 prefix (same as working payment page)
      const cleanPhone = liPaywallPhone.replace(/\s/g, '').replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('351') ? cleanPhone : (cleanPhone.length === 9 ? '351' + cleanPhone : cleanPhone);
      const orderId = `LI-${Date.now()}`;
      // Create MBWay payment
      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/mbway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          phone: formattedPhone,
          mobileNumber: formattedPhone,
          amount: plan.price.replace(',', '.'),
          email: liPaywallEmail,
          product: `CV Analyser - ${plan.name} (LinkedIn)`,
          description: `LinkedIn ${plan.name} - ${plan.analyses} análise(s)`,
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Erro ao iniciar pagamento');
      setLiPaywallStatus('polling');
      // Poll for payment confirmation using /status/ endpoint (same as working payment page)
      let paid = false;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const checkRes = await fetch(`https://share2inspire-beckend.lm.r.appspot.com/api/payment/status/${orderId}`);
          const checkData = await checkRes.json();
          if (checkData.paid === true || checkData.status === 'PAID') {
            paid = true;
            break;
          }
        } catch (pollErr) {
          console.error('[PAYMENT] Polling error:', pollErr);
        }
      }
      if (!paid) throw new Error('Tempo de pagamento expirado. Tenta novamente.');
      // Create voucher with error handling
      const code = `S2I-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const voucherPayload = {
        code: code,
        email: liPaywallEmail,
        plan_name: plan.name,
        total_analyses: plan.analyses,
        used_analyses: 0,
        amount_paid: parseFloat(plan.price.replace(',', '.')),
        order_id: orderId,
        payment_method: 'mbway',
        voucher_type: 'standard',
        is_active: true,
      };
      const voucherRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(voucherPayload)
      });
      if (!voucherRes.ok) {
        const errBody = await voucherRes.text();
        console.error('[PAYMENT] Voucher INSERT failed:', voucherRes.status, errBody);
        // Retry once with minimal payload
        const retryPayload = { code, email: liPaywallEmail, total_analyses: plan.analyses, used_analyses: 0, amount_paid: parseFloat(plan.price.replace(',', '.')), voucher_type: 'standard', is_active: true };
        const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(retryPayload)
        });
        if (!retryRes.ok) {
          console.error('[PAYMENT] Voucher INSERT retry failed:', retryRes.status);
          throw new Error('Pagamento confirmado mas erro ao criar voucher. Contacta suporte com ref: ' + orderId);
        }
      }
      const voucherData = await voucherRes.json();
      console.log('[PAYMENT] Voucher created:', code, voucherData);
      // No voucher email for LinkedIn flow — payment unlocks analysis directly
      // Payment confirmed! Set paid flag and auto-trigger LinkedIn analysis
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('paymentEmail', liPaywallEmail.trim().toLowerCase());
      sessionStorage.setItem('voucherCode', code);
      sessionStorage.setItem('paymentAmount', plan.price.replace(',', '.'));
      sessionStorage.setItem('transactionId', orderId);
      // Track purchase conversion
      trackPurchase('cv_analyser_linkedin', parseFloat(plan.price.replace(',', '.')), orderId);
      setLiPaywallStatus('success');
      setShowLinkedInPaywall(false);
      // Auto-trigger LinkedIn analysis
      handleLinkedInAnalyze();
    } catch (err: any) {
      setLiPaywallError(err.message || 'Erro no pagamento.');
      setLiPaywallStatus('error');
    } finally {
      setLiPaywallLoading(false);
    }
  };

  // Handle voucher purchase (buy now, upload later)
  const handleVoucherPurchase = async () => {
    if (!voucherEmail.includes('@')) {
      setVoucherPaymentError('Introduz um email válido.');
      return;
    }
    if (!voucherPhone || voucherPhone.length < 9) {
      setVoucherPaymentError('Introduz um número de telemóvel válido.');
      return;
    }
    const plan = pricingPlans[voucherSelectedPlan];
    setVoucherPaymentLoading(true);
    setVoucherPaymentError(null);
    setVoucherPaymentStatus('idle');
    try {
      // Format phone with 351 prefix (same as working payment page)
      const cleanVoucherPhone = voucherPhone.replace(/\s/g, '').replace(/\D/g, '');
      const formattedVoucherPhone = cleanVoucherPhone.startsWith('351') ? cleanVoucherPhone : (cleanVoucherPhone.length === 9 ? '351' + cleanVoucherPhone : cleanVoucherPhone);
      const orderId = `VC-${Date.now()}`;
      // Create MBWay payment
      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/mbway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          phone: formattedVoucherPhone,
          mobileNumber: formattedVoucherPhone,
          amount: plan.price.replace(',', '.'),
          email: voucherEmail,
          product: `CV Analyser - ${plan.name} (Voucher)`,
          description: `Voucher ${plan.name} - ${plan.analyses} análise(s)`,
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Erro ao iniciar pagamento');
      setVoucherPaymentStatus('polling');
      // Poll for payment confirmation using /status/ endpoint (same as working payment page)
      let paid = false;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const checkRes = await fetch(`https://share2inspire-beckend.lm.r.appspot.com/api/payment/status/${orderId}`);
          const checkData = await checkRes.json();
          if (checkData.paid === true || checkData.status === 'PAID') {
            paid = true;
            break;
          }
        } catch (pollErr) {
          console.error('[PAYMENT] Polling error:', pollErr);
        }
      }
      if (!paid) throw new Error('Tempo de pagamento expirado. Tenta novamente.');
      // Create voucher with error handling
      const code = `S2I-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const voucherPayload = {
        code: code,
        email: voucherEmail,
        plan_name: plan.name,
        total_analyses: plan.analyses,
        used_analyses: 0,
        amount_paid: parseFloat(plan.price.replace(',', '.')),
        order_id: orderId,
        payment_method: 'mbway',
        voucher_type: 'standard',
        is_active: true,
      };
      const voucherRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(voucherPayload)
      });
      if (!voucherRes.ok) {
        const errorText = await voucherRes.text();
        console.error('[PAYMENT] Voucher INSERT failed:', voucherRes.status, errorText);
        // Retry with minimal payload
        const retryPayload = { code, email: voucherEmail, total_analyses: plan.analyses, used_analyses: 0, amount_paid: parseFloat(plan.price.replace(',', '.')), voucher_type: 'standard', is_active: true };
        const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(retryPayload)
        });
        if (!retryRes.ok) {
          console.error('[PAYMENT] Voucher INSERT retry failed:', retryRes.status);
          throw new Error('Pagamento confirmado mas erro ao criar voucher. Contacta suporte com ref: ' + orderId);
        }
      }
      const voucherData = await voucherRes.json();
      console.log('[PAYMENT] Voucher created:', code, voucherData);
      // Send voucher email
      await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/send-voucher-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: voucherEmail,
          name: voucherEmail.split('@')[0],
          voucherCode: code,
          planName: plan.name,
          totalAnalyses: plan.analyses,
          remainingAnalyses: plan.analyses,
        })
      });
      setVoucherCode(code);
      sessionStorage.setItem('paymentEmail', voucherEmail.trim().toLowerCase());
      // Track purchase conversion
      trackPurchase('cv_analyser_voucher', parseFloat(plan.price.replace(',', '.')), orderId);
      setVoucherPaymentStatus('success');
    } catch (err: any) {
      setVoucherPaymentError(err.message || 'Erro no pagamento.');
      setVoucherPaymentStatus('error');
    } finally {
      setVoucherPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <S2IHeader activePage="cv-analyser" />

      {/* Bundle Banner — Value-focused, no explicit price */}
      <a href="/bundle" className="block bg-gradient-to-r from-[#1A1A1A] to-[#2d2d2d] border-b border-[#C9A961]/30 hover:from-[#222] hover:to-[#333] transition-all cursor-pointer">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-[10px] bg-gradient-to-r from-[#C9A961] to-[#E8D5A3] text-[#1a1a2e] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase shrink-0">Mais popular</span>
          <span className="text-sm text-white">
            <strong className="text-[#C9A961]">Bundle</strong> — Diagnóstico CV + Roadmap de Carreira num só passo
          </span>
          <span className="text-xs bg-[#C9A961] text-white px-3 py-1 rounded-full font-semibold shrink-0">Descobrir →</span>
        </div>
      </a>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-6 md:py-16">
        <div className="text-center space-y-3 md:space-y-6 mb-6 md:mb-12">
          <h1 className="text-2xl md:text-5xl font-bold text-foreground leading-tight transition-opacity duration-500" key={headlineIdx}>
            {headlines[headlineIdx].text} <span className="text-[#C9A961]">{headlines[headlineIdx].highlight}</span>
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {pick('Análise gratuita em 30 segundos. Descobre se o teu CV passa nos sistemas de recrutamento.', 'Free analysis in 30 seconds. Find out if your CV passes recruitment systems.', 'Análisis gratuito en 30 segundos. Descubre si tu CV pasa los sistemas de selección.')}
          </p>

          {/* Feature Cards — what you get */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 max-w-3xl mx-auto pt-2">
            {[
              { icon: <BarChart3 className="w-5 h-5 text-[#C9A961]" />, label: pick("Score ATS", "ATS Score", "Score ATS") },
              { icon: <Grid2x2 className="w-5 h-5 text-[#C9A961]" />, label: pick("4 Quadrantes", "4 Quadrants", "4 Cuadrantes") },
              { icon: <TrendingUp className="w-5 h-5 text-[#C9A961]" />, label: "Benchmarks" },
              { icon: <Eye className="w-5 h-5 text-[#C9A961]" />, label: pick("Visão Recrutador", "Recruiter View", "Vista Reclutador") },
              { icon: <Target className="w-5 h-5 text-[#C9A961]" />, label: "Keywords" },
              { icon: <Zap className="w-5 h-5 text-[#C9A961]" />, label: pick("Em 30 segundos", "In 30 seconds", "En 30 segundos") },
            ].map((card, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-2.5 md:p-3 rounded-xl bg-muted/30 border border-border hover:border-[#C9A961]/40 transition-all">
                {card.icon}
                <span className="text-[10px] md:text-xs font-semibold text-foreground text-center leading-tight">{card.label}</span>
              </div>
            ))}
          </div>

          <a
            href="/cv-analyser/demo.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 hover:bg-[#C9A961]/20 transition-all text-sm font-medium text-[#C9A961] hover:scale-105"
          >
            <Eye className="w-4 h-4" />
            {pick('Vê o que vais receber', 'See what you will get', 'Ve lo que vas a recibir')}
          </a>
        </div>

        {/* Upload Card */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-12 space-y-5 md:space-y-8">
          {/* Mobile: Direct CTA Button */}
          <div className="md:hidden space-y-3">
            <label
              htmlFor="cv-upload-mobile"
              className={`block w-full py-4 px-6 rounded-xl text-center cursor-pointer font-semibold text-base transition-all duration-200 ${
                file ? 'bg-[#C9A961]/10 border-2 border-[#C9A961] text-foreground' : 'bg-[#C9A961] hover:bg-[#A88B4E] text-white'
              }`}
            >
              <input
                id="cv-upload-mobile"
                type="file"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="sr-only"
                disabled={loading}
              />
              {file ? (
                <span className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-[#C9A961]" />
                  {file.name}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Analisar Meu CV Agora
                </span>
              )}
            </label>
            <p className="text-[11px] text-muted-foreground text-center">PDF, DOCX ou Imagem • Grátis • Dados eliminados após análise</p>
            {!file && savedCvInfo && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    // Use authenticated endpoint for private bucket
                    const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                    const stored = storageKey ? localStorage.getItem(storageKey) : null;
                    const accessToken = stored ? JSON.parse(stored)?.access_token : null;
                    const userId = stored ? JSON.parse(stored)?.user?.id : null;
                    const filePath = `${userId}/cv.pdf`;
                    const downloadUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/user-cvs/${filePath}`;
                    const res = await fetch(downloadUrl, {
                      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` }
                    });
                    if (!res.ok) throw new Error('Download failed');
                    const blob = await res.blob();
                    const f = new File([blob], savedCvInfo.filename, { type: blob.type || 'application/pdf' });
                    setFile(f);
                  } catch { setError('Não foi possível carregar o CV guardado.'); }
                }}
                className="text-xs text-[#C9A961] hover:underline font-medium text-center w-full mt-1"
              >
                <FileCheck className="w-3.5 h-3.5 inline mr-1" />
                Usar CV guardado: {savedCvInfo.filename}
              </button>
            )}
          </div>

          {/* Desktop: Full drag & drop area */}
          <div className="hidden md:block">
            {/* Value bullets */}
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p className="font-semibold text-foreground text-base">Depois da análise vais ver:</p>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#C9A961] shrink-0" /> Score de compatibilidade ATS</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#C9A961] shrink-0" /> ATS Deep Scan + Análise de Keywords</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#C9A961] shrink-0" /> Live Match — compara CV vs vaga</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#C9A961] shrink-0" /> Problemas críticos que bloqueiam entrevistas</div>
            </div>
            {/* Upload Area */}
            <div className="space-y-4">
              <label
                htmlFor="cv-upload"
                className={`
                  relative block w-full border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                  transition-all duration-200
                  ${file ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border hover:border-[#C9A961]/50 hover:bg-muted/50'}
                `}
              >
                <input
                  id="cv-upload"
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={loading}
                />
                
                <div className="space-y-4">
                  {file ? (
                    <>
                      <FileText className="w-12 h-12 mx-auto text-[#C9A961]" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Arrasta o teu CV ou clica para escolher
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOCX ou Imagem (máx. 5MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
              {!file && savedCvInfo && (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                        const stored = storageKey ? localStorage.getItem(storageKey) : null;
                        const accessToken = stored ? JSON.parse(stored)?.access_token : null;
                        const userId = stored ? JSON.parse(stored)?.user?.id : null;
                        const filePath = `${userId}/cv.pdf`;
                        const downloadUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/user-cvs/${filePath}`;
                        const res = await fetch(downloadUrl, {
                          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` }
                        });
                        if (!res.ok) throw new Error('Download failed');
                        const blob = await res.blob();
                        const f = new File([blob], savedCvInfo.filename, { type: blob.type || 'application/pdf' });
                        setFile(f);
                      } catch { setError('Não foi possível carregar o CV guardado.'); }
                    }}
                    className="text-xs text-[#C9A961] hover:underline font-medium"
                  >
                    <FileCheck className="w-3.5 h-3.5 inline mr-1" />
                    Usar CV guardado: {savedCvInfo.filename}
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5 mt-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Análise automática. O ficheiro é eliminado após o processamento.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Alternatives: LinkedIn + Email Link */}
          <div className="flex flex-col gap-2 pt-1">
            {/* LinkedIn button + panel */}
            <button
              type="button"
              onClick={() => { setShowLinkedIn(!showLinkedIn); setShowEmailLink(false); }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-sm text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Usar perfil LinkedIn
            </button>
            {showLinkedIn && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Cola o URL do teu perfil LinkedIn para extrairmos os dados automaticamente.</p>
                <span className="text-[10px] bg-[#C9A961]/20 text-[#C9A961] px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2">PREMIUM</span>
              </div>
              <input
                type="url"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder="https://linkedin.com/in/o-teu-perfil"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
              />
              <p className="text-xs text-muted-foreground/70">Analisamos o teu perfil público do LinkedIn como se fosse um CV. <span className="text-[#C9A961]">Requer pacote pago.</span></p>
            </div>
          )}

          </div>

          {/* Sem CV no telemóvel? — unified toggle with two options */}
          <button
            type="button"
            onClick={() => setShowNoCvOptions(!showNoCvOptions)}
            className="w-full text-center text-xs text-muted-foreground/70 hover:text-[#C9A961] transition-colors py-1"
          >
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {pick('Sem o CV no telemóvel?', 'No CV on your phone?', '¿Sin CV en el móvil?')} <span className="underline underline-offset-2">{pick('Vê as opções', 'See options', 'Ver opciones')}</span>
            </span>
          </button>

          {showNoCvOptions && (
            <div className="animate-in slide-in-from-top-2 duration-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Option 1: Buy voucher */}
                <button
                  type="button"
                  onClick={() => { setShowBuyVoucher(true); setShowEmailLink(false); setShowNoCvOptions(false); setTimeout(() => { document.querySelector('[data-buy-voucher]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#C9A961]" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{pick('Comprar Análise Agora', 'Buy Analysis Now', 'Comprar Análisis Ahora')}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{pick('Recebe um voucher por email e faz upload do CV mais tarde no PC.', 'Receive a voucher by email and upload your CV later on PC.', 'Recibe un voucher por email y sube tu CV más tarde en el PC.')}</p>
                </button>
                {/* Option 2: Send link by email */}
                <button
                  type="button"
                  onClick={() => { setShowEmailLink(true); setShowBuyVoucher(false); setShowNoCvOptions(false); setTimeout(() => { document.querySelector('[data-email-link]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#C9A961]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <p className="text-sm font-medium text-foreground">{pick('Enviar Link por Email', 'Send Link by Email', 'Enviar Enlace por Email')}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{pick('Recebe o link no email e testa a análise gratuita no computador.', 'Receive the link by email and test the free analysis on your computer.', 'Recibe el enlace por email y prueba el análisis gratuito en el ordenador.')}</p>
                </button>
              </div>
            </div>
          )}

          {/* Email link panel (shown when option 2 is selected) */}
          {showEmailLink && (
            <div data-email-link className="space-y-2 animate-in slide-in-from-top-2 duration-200 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">{pick('Recebe o link no teu email para testares mais tarde no computador.', 'Receive the link in your email to test later on your computer.', 'Recibe el enlace en tu email para probarlo más tarde en tu ordenador.')}</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailForLink}
                  onChange={(e) => setEmailForLink(e.target.value)}
                  placeholder="o.teu@email.com"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (emailForLink.includes('@')) {
                      fetch(`${SUPABASE_URL}/rest/v1/email_links`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
                        body: JSON.stringify({ email: emailForLink, link: window.location.href, source: 'cv-analyser-pt' })
                      }).catch(() => {});
                      fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/send-link-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: emailForLink,
                          name: emailForLink.split('@')[0],
                          link: 'https://www.share2inspire.pt/cv-analyser',
                          source: 'cv-analyser-pt'
                        })
                      }).catch(() => {});
                      setEmailSent(true);
                      setTimeout(() => { setShowEmailLink(false); setEmailSent(false); }, 3000);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors"
                >
                  {emailSent ? 'Enviado!' : 'Enviar'}
                </button>
              </div>
            </div>
          )}

          {showBuyVoucher && (
            <div data-buy-voucher className="space-y-3 animate-in slide-in-from-top-2 duration-200 p-4 rounded-lg bg-muted/30 border border-border">
              {voucherPaymentStatus === 'success' && voucherCode ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">{pick('Pagamento confirmado!', 'Payment confirmed!', '¡Pago confirmado!')}</p>
                  <p className="text-xs text-muted-foreground">O teu código de voucher:</p>
                  <p className="text-lg font-bold text-[#C9A961] bg-[#C9A961]/10 rounded-lg py-2 px-4 inline-block tracking-wider">{voucherCode}</p>
                  <p className="text-xs text-muted-foreground">Enviámos o código para <strong>{voucherEmail}</strong>. Usa-o na página de resultados após fazeres upload do teu CV.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Compra agora e recebe um código por email. Depois, faz upload do CV no computador e insere o código para desbloquear a análise completa.</p>
                  
                  {/* Plan Selection */}
                  <div className="grid grid-cols-3 gap-2">
                    {pricingPlans.map((plan, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setVoucherSelectedPlan(i)}
                        className={`p-2 rounded-lg border text-center transition-all text-xs ${
                          voucherSelectedPlan === i
                            ? 'border-[#C9A961] bg-[#C9A961]/10 text-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-[#C9A961]/50'
                        }`}
                      >
                        <p className="font-semibold">{plan.price}€</p>
                        <p className="text-[10px] text-muted-foreground">{plan.analyses} análise{plan.analyses > 1 ? 's' : ''}</p>
                      </button>
                    ))}
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={voucherEmail}
                      onChange={(e) => setVoucherEmail(e.target.value)}
                      placeholder="o.teu@email.com"
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                    />
                    <input
                      type="tel"
                      value={voucherPhone}
                      onChange={(e) => setVoucherPhone(e.target.value)}
                      placeholder={pick('Telemóvel MB Way (9xxxxxxxx)', 'MB Way phone (9xxxxxxxx)', 'Móvil MB Way (9xxxxxxxx)')}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                    />
                  </div>

                  {voucherPaymentError && (
                    <p className="text-xs text-red-500">{voucherPaymentError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleVoucherPurchase}
                    disabled={voucherPaymentLoading}
                    className="w-full py-2.5 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {voucherPaymentStatus === 'polling' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {pick('Aguardar confirmação MB Way...', 'Awaiting MB Way confirmation...', 'Esperando confirmación MB Way...')}</>
                    ) : voucherPaymentLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {pick('A processar...', 'Processing...', 'Procesando...')}</>
                    ) : (
                      <>{pick('Comprar Voucher', 'Buy Voucher', 'Comprar Voucher')} — {pricingPlans[voucherSelectedPlan].price}€</>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Job Posting Toggle */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setWantsJobMatch(!wantsJobMatch)}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-[#C9A961]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{pick('Queres analisar para uma vaga específica?', 'Want to analyse for a specific job?', '¿Quieres analizar para una oferta específica?')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pick('Compara o teu CV com os requisitos da vaga', 'Compare your CV with the job requirements', 'Compara tu CV con los requisitos de la oferta')}</p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 ${
                wantsJobMatch ? 'bg-[#C9A961]' : 'bg-muted'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  wantsJobMatch ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>

            {wantsJobMatch && (
              <div className="space-y-2 pl-2 animate-in slide-in-from-top-2 duration-200">
                <label htmlFor="job-input" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  Link do anúncio e/ou nome da função
                </label>
                <textarea
                  id="job-input"
                  value={jobInput}
                  onChange={(e) => setJobInput(e.target.value)}
                  placeholder={pick("Ex: https://linkedin.com/jobs/... ou 'Data Analyst - Lisboa, experiência em Python e SQL'", "E.g.: https://linkedin.com/jobs/... or 'Data Analyst - London, Python and SQL experience'", "Ej: https://linkedin.com/jobs/... o 'Data Analyst - Madrid, experiencia en Python y SQL'")}
                  className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961] resize-y"
                  disabled={loading}
                />
                <p className="text-[11px] text-muted-foreground/70">{pick('Cola o link do anúncio de emprego, o nome da função, ou a descrição da vaga. Quanto mais detalhes, melhor a análise.', 'Paste the job posting link, job title, or job description. The more details, the better the analysis.', 'Pega el enlace de la oferta, el nombre del puesto o la descripción. Cuantos más detalles, mejor el análisis.')}</p>
              </div>
            )}
          </div>

          {/* Country/Region Selector */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              <Globe className="w-4 h-4 text-[#C9A961]" />
              {pick('País e região', 'Country and region', 'País y región')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              <select
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion(''); }}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                disabled={loading}
              >
                <option value="">{pick('Selecciona o teu país...', 'Select your country...', 'Selecciona tu país...')}</option>
                {countries.map(c => (
                  <option key={c.code} value={c.value}>{c.label}</option>
                ))}
              </select>
              {regionOptions.length > 1 && (
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                  disabled={loading}
                >
                  <option value="">{pick('Selecciona a região (opcional)...', 'Select region (optional)...', 'Selecciona la región (opcional)...')}</option>
                  {regionOptions.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground/70">{pick('Para estimativas salariais e recomendações adaptadas ao teu mercado.', 'For salary estimates and recommendations tailored to your market.', 'Para estimaciones salariales y recomendaciones adaptadas a tu mercado.')}</p>
          </div>

          {/* Mandatory Email Field */}
          <div className="space-y-1">
            <label htmlFor="analysis-email" className="text-sm font-medium text-foreground flex items-center gap-1">
              <svg className="w-4 h-4 text-[#C9A961]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              {pick('O teu email', 'Your email', 'Tu email')} <span className="text-red-500">*</span>
            </label>
            <input
              id="analysis-email"
              type="email"
              value={analysisEmail}
              onChange={(e) => { setAnalysisEmail(e.target.value); setAnalysisEmailError(null); }}
              placeholder="o.teu@email.com"
              className={`w-full px-3 py-2.5 rounded-lg border ${analysisEmailError ? 'border-red-500 ring-2 ring-red-500/30' : 'border-border'} bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]`}
              disabled={loading}
            />
            {analysisEmailError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {analysisEmailError}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground/70">{pick('Necessário para receberes os resultados e certificação.', 'Required to receive your results and certification.', 'Necesario para recibir tus resultados y certificación.')}</p>
          </div>

          {/* Privacy Terms Checkbox */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border text-[#C9A961] focus:ring-[#C9A961] cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
              {pick('Concordo com a', 'I agree to the', 'Acepto la')}{' '}
              <a 
                href="https://www.share2inspire.pt/pages/politica-privacidade" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#C9A961] hover:underline"
              >
                {pick('Política de Privacidade', 'Privacy Policy', 'Política de Privacidad')}
              </a>
              {' '}{pick('e autorizo o processamento dos meus dados para análise do CV.', 'and authorise the processing of my data for CV analysis.', 'y autorizo el procesamiento de mis datos para el análisis del CV.')}
            </label>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={() => {
              if (linkedInUrl && linkedInUrl.toLowerCase().includes('linkedin.com') && showLinkedIn) {
                handleLinkedInAnalyze();
              } else {
                handleAnalyze();
              }
            }}
            disabled={loading || !acceptedTerms || !analysisEmail.trim() || !selectedCountry || (!file && !(linkedInUrl && linkedInUrl.toLowerCase().includes('linkedin.com') && showLinkedIn))}
            className="w-full h-12 text-base font-semibold bg-[#C9A961] hover:bg-[#A88B4E] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {loadingMessages[loadingStep]}
              </>
            ) : linkedInUrl && linkedInUrl.toLowerCase().includes('linkedin.com') && showLinkedIn ? (
              'Analisar Perfil LinkedIn'
            ) : (
              'Analisar CV Gratuitamente'
            )}
          </Button>

          {/* LinkedIn Paywall Modal */}
          {showLinkedInPaywall && (
            <div className="animate-in slide-in-from-top-2 duration-300 p-5 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#2a2a2a] border border-[#C9A961]/30 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-[#C9A961]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
                <h3 className="text-lg font-bold text-white">Análise LinkedIn é Premium</h3>
                <p className="text-sm text-white/70">A análise via LinkedIn requer um pacote pago. Obtém um relatório completo com score ATS, estimativa salarial e recomendações personalizadas.</p>
              </div>

              {/* Discount code input */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Já tens um código de desconto?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkedInVoucherCode}
                    onChange={(e) => setLinkedInVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Inserir código"
                    className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961] uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!linkedInVoucherCode.trim()) {
                        setLinkedInVoucherError('Introduz um código.');
                        return;
                      }
                      const valid = await validateVoucherForLinkedIn(linkedInVoucherCode.trim());
                      if (valid) {
                        handleLinkedInAnalyze();
                      }
                    }}
                    disabled={linkedInVoucherValidating}
                    className="px-4 py-2 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {linkedInVoucherValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Validar
                  </button>
                </div>
                {linkedInVoucherError && (
                  <p className="text-xs text-red-400">{linkedInVoucherError}</p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-xs text-white/50">ou compra agora</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              {/* Step 1: Choose plan */}
              {liPaywallStep === 'choose' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {pricingPlans.map((plan, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setLiPaywallPlan(i);
                          setLiPaywallStep('pay');
                        }}
                        className="p-3 rounded-lg border border-white/20 bg-white/5 hover:border-[#C9A961]/50 hover:bg-[#C9A961]/10 transition-all text-center"
                      >
                        <p className="text-lg font-bold text-[#C9A961]">{plan.price}€</p>
                        <p className="text-xs text-white/60">{plan.analyses} análise{plan.analyses > 1 ? 's' : ''}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{plan.perUnit}€/un.</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Email + Phone + Pay */}
              {liPaywallStep === 'pay' && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLiPaywallStep('choose')}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors"
                    >
                      {pick('← Voltar', '← Back', '← Volver')}
                    </button>
                    <span className="text-sm font-semibold text-[#C9A961]">
                      {pricingPlans[liPaywallPlan].name} — {pricingPlans[liPaywallPlan].price}€
                    </span>
                  </div>

                  <input
                    type="email"
                    value={liPaywallEmail}
                    onChange={(e) => setLiPaywallEmail(e.target.value)}
                    placeholder="o.teu@email.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                  />
                  <input
                    type="tel"
                    value={liPaywallPhone}
                    onChange={(e) => setLiPaywallPhone(e.target.value)}
                    placeholder={pick('Telemóvel MB Way (9xxxxxxxx)', 'MB Way phone (9xxxxxxxx)', 'Móvil MB Way (9xxxxxxxx)')}
                    className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                  />

                  {liPaywallError && (
                    <p className="text-xs text-red-400">{liPaywallError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleLiPaywallPurchase}
                    disabled={liPaywallLoading}
                    className="w-full py-3 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {liPaywallStatus === 'polling' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Confirma no telemóvel (MB Way)...</>
                    ) : liPaywallLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {pick('A processar...', 'Processing...', 'Procesando...')}</>
                    ) : (
                      <>{pick('Comprar e Analisar', 'Buy and Analyse', 'Comprar y Analizar')} — {pricingPlans[liPaywallPlan].price}€</>
                    )}
                  </button>
                  <p className="text-[10px] text-white/40 text-center">{pick('Pagamento seguro via MB Way. A análise inicia automaticamente.', 'Secure payment via Stripe/PayPal. Analysis starts automatically.', 'Pago seguro. El análisis comienza automáticamente.')}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setShowLinkedInPaywall(false); setLiPaywallStep('choose'); }}
                disabled={liPaywallLoading}
                className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors py-1 disabled:opacity-30"
              >
                {pick('Cancelar', 'Cancel', 'Cancelar')}
              </button>
            </div>
          )}

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

          {/* Comparison Table — inline dropdown */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setPricingOpen(!pricingOpen)}
              className="w-full flex items-center justify-between py-2 text-left"
            >
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C9A961]" />
                {pick('CV Analyser vs Outras Soluções', 'CV Analyser vs Other Solutions', 'CV Analyser vs Otras Soluciones')}
              </span>
              {pricingOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {pricingOpen && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-semibold text-foreground text-xs">{pick('Funcionalidade', 'Feature', 'Funcionalidad')}</th>
                      <th className="p-3 text-center">
                        <span className="text-xs font-bold text-[#C9A961]">CV Analyser</span>
                      </th>
                      <th className="p-3 text-xs font-medium text-muted-foreground text-center">Resumeworded</th>
                      <th className="p-3 text-xs font-medium text-muted-foreground text-center">Kickresume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((row, i) => (
                      <tr key={i} className={`border-t border-border ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="p-3 text-xs text-foreground">{row.feature}</td>
                        {row.usText ? (
                          <>
                            <td className="p-3 text-center text-xs font-bold text-[#C9A961]">{row.usText}</td>
                            <td className="p-3 text-center text-xs text-muted-foreground">{row.comp1Text}</td>
                            <td className="p-3 text-center text-xs text-muted-foreground">{row.comp2Text}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 text-center">
                              {row.us ? <CheckCircle2 className="w-4 h-4 text-[#C9A961] mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                            </td>
                            <td className="p-3 text-center">
                              {row.competitor1 ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                            </td>
                            <td className="p-3 text-center">
                              {row.competitor2 ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5 text-[#C9A961]" />
              </div>
              <p className="text-sm font-medium text-foreground">{pick('Análise instantânea', 'Instant Analysis', 'Análisis Instantáneo')}</p>
              <p className="text-xs text-muted-foreground">{pick('Resultados em 30 segundos', 'Results in 30 seconds', 'Resultados en 30 segundos')}</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <Target className="w-5 h-5 text-[#C9A961]" />
              </div>
              <p className="text-sm font-medium text-foreground">Powered by AI</p>
              <p className="text-xs text-muted-foreground">{pick('Análise com Google Gemini', 'Analysis with Google Gemini', 'Análisis con Google Gemini')}</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-[#C9A961]" />
              </div>
              <p className="text-sm font-medium text-foreground">{pick('100% Privado', '100% Private', '100% Privado')}</p>
              <p className="text-xs text-muted-foreground">{pick('Os teus dados são seguros', 'Your data is secure', 'Tus datos están seguros')}</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: What You Get (Free Analysis) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 space-y-8">
          <h2 className="text-2xl font-bold text-center text-foreground">
            {pick('O que inclui a análise gratuita?', "What's included in the free analysis?", '¿Qué incluye el análisis gratuito?')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{pick('Score ATS', 'ATS Score', 'Score ATS')}</h3>
              <p className="text-sm text-muted-foreground">
                {pick('Probabilidade de rejeição automática por sistemas de recrutamento', 'Probability of automatic rejection by recruitment systems', 'Probabilidad de rechazo automático por sistemas de selección')}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <FileSearch className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">ATS Deep Scan</h3>
              <p className="text-sm text-muted-foreground">
                {pick('Análise profunda com 3 scores: ATS Global, Keywords e Formato', 'Deep analysis with 3 scores: Global ATS, Keywords and Format', 'Análisis profundo con 3 scores: ATS Global, Keywords y Formato')}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Search className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{pick('Análise de Keywords', 'Keyword Analysis', 'Análisis de Keywords')}</h3>
              <p className="text-sm text-muted-foreground">
                {pick('Tabela detalhada de keywords encontradas, parciais e em falta no teu CV', 'Detailed table of keywords found, partial and missing in your CV', 'Tabla detallada de keywords encontradas, parciales y ausentes en tu CV')}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Crosshair className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Live Match</h3>
              <p className="text-sm text-muted-foreground">
                {pick('Cola a descrição da vaga e vê a compatibilidade em tempo real', 'Paste the job description and see the compatibility in real time', 'Pega la descripción del puesto y ve la compatibilidad en tiempo real')}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Grid2x2 className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{pick('4 Quadrantes', '4 Quadrants', '4 Cuadrantes')}</h3>
              <p className="text-sm text-muted-foreground">
                {pick('Análise de estrutura, conteúdo, formação e experiência', 'Analysis of structure, content, education and experience', 'Análisis de estructura, contenido, formación y experiencia')}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{pick('Percepção + Benchmarks', 'Perception + Benchmarks', 'Percepción + Benchmarks')}</h3>
              <p className="text-sm text-muted-foreground">
                {pick('Como os recrutadores vêem o teu perfil e comparação com médias do mercado', 'How recruiters see your profile and comparison with market averages', 'Cómo los reclutadores ven tu perfil y comparación con medias del mercado')}
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Social Proof */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 space-y-10">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-[#C9A961]" />
              </div>
              <p className="text-3xl font-bold text-foreground">5.000+</p>
              <p className="text-sm text-muted-foreground">{pick('Profissionais ajudados', 'Professionals helped', 'Profesionales ayudados')}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 text-[#C9A961]" />
              </div>
              <p className="text-3xl font-bold text-foreground">4.8/5</p>
              <div className="flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'text-[#C9A961] fill-[#C9A961]' : 'text-[#C9A961]/40 fill-[#C9A961]/40'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{pick('Avaliação média', 'Average rating', 'Valoración media')}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-[#C9A961]" />
              </div>
              <p className="text-3xl font-bold text-foreground">87%</p>
              <p className="text-sm text-muted-foreground">{pick('Conseguiram entrevista', 'Got an interview', 'Consiguieron entrevista')}</p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-center text-foreground">{pick('O que dizem os nossos utilizadores', 'What our users say', 'Lo que dicen nuestros usuarios')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= t.rating ? 'text-[#C9A961] fill-[#C9A961]' : 'text-muted'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center text-sm font-bold text-[#C9A961]">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Pricing (Collapsible) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20">
          <button
            onClick={() => setPricingOpen(!pricingOpen)}
            className="w-full bg-card border border-border rounded-xl p-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Award className="w-6 h-6 text-[#C9A961]" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-foreground">Pacotes de Análise Completa</h2>
                <p className="text-sm text-muted-foreground">Desde €9,99 por análise</p>
              </div>
            </div>
            {pricingOpen ? (
              <ChevronUp className="w-6 h-6 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            )}
          </button>

          {pricingOpen && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-300">
              {pricingPlans.map((plan, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl border p-6 space-y-5 ${
                    plan.popular
                      ? 'bg-[#C9A961] text-white border-[#C9A961]'
                      : 'bg-card border-border'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-4 py-1 rounded-full">
                      {pick('Mais Popular', 'Most Popular', 'Más Popular')}
                    </div>
                  )}
                  {plan.badge && (
                    <div className="absolute -top-3 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>{plan.name}</h3>
                    <p className={`text-sm ${plan.popular ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {plan.name === 'Completo' ? 'CV + Career Path' : `${plan.analyses} ${plan.analyses === 1 ? pick('Análise Completa', 'Full Analysis', 'Análisis Completo') : pick('Análises Completas', 'Full Analyses', 'Análisis Completos')}`}
                    </p>
                  </div>
                  <div className="space-y-0">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>{plan.price}€</span>
                    </div>
                    <p className={`text-sm ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {plan.name === 'Completo' ? (
                        <>CV Analyser + Career Path</>
                      ) : (
                        <>{plan.perUnit}€ {pick('por análise', 'per analysis', 'por análisis')}</>
                      )}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f, j) => (
                      <li key={j} className={`text-sm flex items-start gap-2 ${plan.popular ? 'text-white/90' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-white' : 'text-[#C9A961]'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full font-semibold ${
                      plan.popular
                        ? 'bg-white text-[#C9A961] hover:bg-white/90'
                        : 'bg-[#C9A961] text-white hover:bg-[#A88B4E]'
                    }`}
                  >
                    {pick('Escolher Pacote', 'Choose Plan', 'Elegir Plan')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison table moved to upload card above */}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Unique Benefits */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 space-y-8">
          <h2 className="text-2xl font-bold text-center text-foreground">
            {pick('Porquê o CV Analyser?', 'Why CV Analyser?', '¿Por qué CV Analyser?')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <Target className="w-6 h-6 text-[#C9A961]" />, title: pick("Feito para Portugal", "Made for Your Market", "Hecho para tu Mercado"), desc: pick("Análise adaptada ao mercado português. Relatórios em português de Portugal, com benchmarks locais e referências salariais nacionais.", "Analysis tailored to your local market. Reports in your language, with local benchmarks and salary references.", "Análisis adaptado a tu mercado local. Informes en tu idioma, con benchmarks locales y referencias salariales.") },
              { icon: <TrendingUp className="w-6 h-6 text-[#C9A961]" />, title: pick("Curva Normal Exclusiva", "Exclusive Normal Curve", "Curva Normal Exclusiva"), desc: pick("Vê exactamente onde te posicionas face a outros candidatos. Nenhum outro serviço oferece este nível de comparação visual.", "See exactly where you stand against other candidates. No other service offers this level of visual comparison.", "Ve exactamente dónde te posicionas frente a otros candidatos. Ningún otro servicio ofrece este nivel de comparación visual.") },
              { icon: <Clock className="w-6 h-6 text-[#C9A961]" />, title: pick("Resultados em 30 Segundos", "Results in 30 Seconds", "Resultados en 30 Segundos"), desc: pick("Enquanto outros serviços demoram horas ou dias, o CV Analyser dá-te feedback imediato com IA de última geração.", "While other services take hours or days, CV Analyser gives you immediate feedback with cutting-edge AI.", "Mientras otros servicios tardan horas o días, CV Analyser te da feedback inmediato con IA de última generación.") },
              { icon: <Shield className="w-6 h-6 text-[#C9A961]" />, title: pick("Preço Justo, Sem Subscrição", "Fair Price, No Subscription", "Precio Justo, Sin Suscripción"), desc: pick("Paga apenas quando precisas. Sem mensalidades, sem compromissos. A partir de €9,99 por análise completa.", "Pay only when you need it. No monthly fees, no commitments. From €9.99 per full analysis.", "Paga solo cuando lo necesitas. Sin mensualidades, sin compromisos. Desde €9,99 por análisis completo.") },
            ].map((card, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-3 flex flex-col min-h-[180px]">
                <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0">
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground flex-1">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Final CTA */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 mb-10 bg-[#C9A961] rounded-2xl p-8 md:p-12 text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {pick('Pronto para melhorar o teu CV?', 'Ready to improve your CV?', '¿Listo para mejorar tu CV?')}
          </h2>
          <p className="text-white/80 max-w-lg mx-auto">
            {pick('Começa com a análise gratuita. Sem cartão de crédito, sem compromisso. Descobre o que os recrutadores realmente pensam.', 'Start with the free analysis. No credit card, no commitment. Find out what recruiters really think.', 'Empieza con el análisis gratuito. Sin tarjeta de crédito, sin compromiso. Descubre lo que los reclutadores realmente piensan.')}
          </p>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-[#C9A961] hover:bg-white/90 font-semibold px-8 py-3 text-base"
          >
            {pick('Começar Análise Gratuita', 'Start Free Analysis', 'Comenzar Análisis Gratuito')}
          </Button>
        </div>

        {/* ─── Member Area CTA ─── */}
        <div className="mt-16 mb-10 p-8 bg-gradient-to-r from-[#f9f6ef] to-[#faf8f3] border border-[#C9A961]/20 rounded-2xl text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            <p className="text-base font-bold text-slate-800">{pick('Queres acesso regular a esta ferramenta?', 'Want regular access to this tool?', '¿Quieres acceso regular a esta herramienta?')}</p>
          </div>
          <p className="text-sm text-slate-500 mb-5 leading-relaxed max-w-lg mx-auto">{pick('Com um plano de subscrição, tens análises de CV incluídas todas as semanas, Career Path, conteúdos exclusivos, feed de vagas personalizado e muito mais.', 'With a subscription plan, you get weekly CV analyses, Career Path, exclusive content, personalised job feed and much more.', 'Con un plan de suscripción, tienes análisis de CV incluidos cada semana, Career Path, contenidos exclusivos, feed de empleos personalizado y mucho más.')}</p>
          <a
            href="https://www.share2inspire.pt/area-cliente/planos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            {pick('Ver planos de subscrição →', 'View subscription plans →', 'Ver planes de suscripción →')}
          </a>
          <p className="text-xs text-slate-400 mt-3">{pick('A partir de 9,99€/mês · Cancela quando quiseres', 'From €9.99/month · Cancel anytime', 'Desde 9,99€/mes · Cancela cuando quieras')}</p>
        </div>

      </main>
      <S2IFooter />
    </div>
  );
}
