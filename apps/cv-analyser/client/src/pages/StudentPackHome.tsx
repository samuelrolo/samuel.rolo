// Pack Estudante / Student Pack — CV Analyser + LinkedIn Roaster | Share2Inspire
// Unified i18n component (PT/EN/ES) — uses pick() for all UI text
// PT: single unified engine (student-pack edge fn), EN/ES: two separate engines (hyper-task)
import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle2, Linkedin, CreditCard, AlertCircle, Ticket, Sparkles, Check, ArrowRight, BarChart3, Zap, Globe, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { trackPaymentStart, trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion, incrementCouponUsage } from "@/lib/affiliate";
import { buildUnifiedStudentPackPayload } from "@/lib/analysisPayload";
import { getDefaultCountryByLanguage, getCountries, getRegions } from "@/data/countries";
import S2IFooter from "@/components/S2IFooter";
import S2IHeader from "@/components/S2IHeader";
import { redirectToCheckout } from '../lib/webviewPayment';
import PromoBanner from "@/components/PromoBanner";
import useTranslation from "@/i18n/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";
import { downloadAuthenticatedProfileCv, getAuthenticatedProfilePrefill } from "@/lib/profilePrefill";
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";
import { saveToUserAnalyses } from "@/lib/saveToUserAnalyses";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const PRICE_NUM = 7.99;
const PRICE_PT = '7,99';
const PRICE_ORIGINAL_PT = '13,98';
const PRICE_ORIGINAL_EN = '13.98';


async function extractTextFromPDF(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text.trim();
}

async function extractTextFromDOCX(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  return (await mammoth.extractRawText({ arrayBuffer: ab })).value.trim();
}

export default function StudentPackHome() {
  const { pick, lang, localePath } = useTranslation();
  const { symbol: CUR, code: currencyCode, codeUpper: currencyCodeUpper } = useCurrency();
  const isPT = lang === 'pt';
  usePageSEO(pageSeo.studentPack);

  const headlines = [
    { text: pick("Prepara o teu CV e LinkedIn para", "Prepare your CV and LinkedIn to", "Prepara tu CV y LinkedIn para"), highlight: pick("conquistar o primeiro emprego", "land your first job", "conquistar tu primer empleo") },
    { text: pick("Dois motores de IA a trabalhar por ti para", "Two AI engines working for you to", "Dos motores de IA trabajando para ti para"), highlight: pick("lançar a tua carreira", "launch your career", "lanzar tu carrera") },
    { text: pick("Descobre o que recrutadores vêem no teu perfil e", "Discover what recruiters see and", "Descubre lo que los reclutadores ven en tu perfil y"), highlight: pick("corrige antes de candidatar", "fix it before applying", "corrígelo antes de aplicar") },
  ];

  const loadingMessages = [
    pick("A extrair dados do teu CV...", "Extracting CV data...", "Extrayendo datos de tu CV..."),
    pick("A analisar competências e experiência...", "Analysing skills and experience...", "Analizando competencias y experiencia..."),
    pick("A analisar o teu perfil LinkedIn...", "Analysing your LinkedIn profile...", "Analizando tu perfil de LinkedIn..."),
    pick("A cruzar dados CV ↔ LinkedIn...", "Cross-referencing CV ↔ LinkedIn...", "Cruzando datos CV ↔ LinkedIn..."),
    pick("A gerar recomendações integradas...", "Generating integrated recommendations...", "Generando recomendaciones integradas..."),
    pick("A preparar o teu relatório completo...", "Preparing your complete report...", "Preparando tu informe completo..."),
  ];

  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % headlines.length), 4000); return () => clearInterval(t); }, []);

  const [file, setFile] = useState<File | null>(null);
  const profileCvAutofillRef = useRef(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [savedCvInfo, setSavedCvInfo] = useState<{ filename: string; url: string } | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(() => getDefaultCountryByLanguage(lang));
  const [selectedRegion, setSelectedRegion] = useState("");
  const countries = getCountries(lang);
  const regionOptions = getRegions(selectedCountry, lang);

  useEffect(() => {
    setSelectedCountry((current) => current || getDefaultCountryByLanguage(lang));
  }, [lang]);

  useEffect(() => {
    let active = true;
    (async () => {
      const profile = await getAuthenticatedProfilePrefill();
      if (!active || !profile) return;
      if (profile.cvUrl && profile.cvFilename) {
        setSavedCvInfo({ filename: profile.cvFilename, url: profile.cvUrl });
        if (!profileCvAutofillRef.current) {
          try {
            const restoredFile = await downloadAuthenticatedProfileCv(profile);
            if (!active || profileCvAutofillRef.current) return;
            setFile((current) => current || restoredFile);
          } catch {
            // keep manual upload available if auto-restore fails
          }
        }
      }
      if (profile.email) setEmail((current) => current || profile.email);
      if (profile.linkedinUrl) setLinkedinUrl((current) => current || profile.linkedinUrl);
    })();
    return () => { active = false; };
  }, []);

  const [step, setStep] = useState<'hero' | 'upload' | 'payment' | 'analyzing' | 'done'>('hero');

  // Payment — PT has mbway; EN/ES only stripe/paypal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>(isPT ? 'mbway' : 'stripe');
  const [phone, setPhone] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'polling' | 'success'>('payment');
  const [pollingMsg, setPollingMsg] = useState("");
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const finalPrice = appliedCoupon ? Math.round(PRICE_NUM * (1 - appliedCoupon.percent / 100) * 100) / 100 : PRICE_NUM;
  const finalPriceStr = isPT ? finalPrice.toFixed(2).replace('.', ',') : finalPrice.toFixed(2);

  const setStudentPackAccessType = (value: 'free' | 'paid_pending' | 'paid_verified') => {
    localStorage.setItem('studentPackAccessType', value);
  };

  const getStudentPackTransactionId = () => (
    localStorage.getItem('studentPackVerifiedTransactionId')
    || currentOrderId
    || localStorage.getItem('studentPackPendingOrderId')
    || ''
  );

  const persistStudentPackAnalysis = async (payload: Record<string, any>) => {
    const accessType = localStorage.getItem('studentPackAccessType');
    const transactionId = getStudentPackTransactionId();
    const paymentStatus = accessType === 'free' ? 'free' : 'pending';
    await fetch(`${BACKEND_URL}/api/cv-analysis/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        payment_status: paymentStatus,
        payment_amount: accessType === 'free' ? 0 : finalPrice,
        transaction_id: transactionId || null,
      })
    }).catch(() => {});
  };

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMsg, setAnalysisMsg] = useState("");

  const isValidLinkedinUrl = (url: string) => url.trim().toLowerCase().includes('linkedin.com/in/') && url.trim().length > 25;

  /* ─── Proceed to Payment ─── */
  const handleProceedToPayment = async () => {
    if (!file) { setError(pick('Faz upload do teu CV (PDF ou DOCX)', 'Upload your CV (PDF or DOCX)', 'Sube tu CV (PDF o DOCX)')); return; }
    if (!isValidLinkedinUrl(linkedinUrl)) { setError(pick('Introduz um URL de LinkedIn válido', 'Enter a valid LinkedIn URL', 'Introduce una URL de LinkedIn válida')); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(pick('Introduz um email válido', 'Enter a valid email', 'Introduce un email válido')); return; }
    if (!selectedCountry) { setError(pick('Selecciona o teu país para resultados localizados', 'Select your country', 'Selecciona tu país')); return; }
    if (!acceptedTerms) { setError(pick('Aceita a Política de Privacidade', 'Accept the Privacy Policy', 'Acepta la Política de Privacidad')); return; }
    setError(null);
    try {
      let cvText = '';
      if (file.type === 'application/pdf') { cvText = await extractTextFromPDF(file); }
      else { cvText = await extractTextFromDOCX(file); }
      localStorage.setItem('studentPackCvText', cvText);
      localStorage.setItem('studentPackLinkedinUrl', linkedinUrl);
      localStorage.setItem('studentPackEmail', email.trim().toLowerCase());
      localStorage.setItem('studentPackCountry', selectedCountry || 'Portugal');
      localStorage.setItem('studentPackRegion', selectedRegion || '');
    } catch (e) { console.warn('[StudentPack] Pre-extraction warning:', e); }
    setPaymentStep('payment');
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  /* ─── Run Engines ─── */
  const runBothEngines = async () => {
    setStep('analyzing');
    setAnalysisProgress(0);
    setAnalysisMsg(loadingMessages[0]);
    const startTime = Date.now();
    const msgInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        const next = Math.min(prev + 1, loadingMessages.length - 1);
        setAnalysisMsg(loadingMessages[next]);
        return next;
      });
    }, 4500);

    try {
      let cvText = "";
      let base64Content = "";
      if (file) {
        cvText = file.type === 'application/pdf' ? await extractTextFromPDF(file) : await extractTextFromDOCX(file);
        const reader = new FileReader();
        base64Content = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        cvText = localStorage.getItem('studentPackCvText') || '';
        if (!cvText) throw new Error(pick('CV não disponível após pagamento. Por favor contacta support@share2inspire.pt', 'CV not available after payment. Please contact support@share2inspire.pt', 'CV no disponible tras el pago. Contacta support@share2inspire.pt'));
      }
      const currentLinkedinUrl = linkedinUrl || localStorage.getItem('studentPackLinkedinUrl') || '';
      if (currentLinkedinUrl && !linkedinUrl) setLinkedinUrl(currentLinkedinUrl);
      const currentCountry = selectedCountry || localStorage.getItem('studentPackCountry') || 'Portugal';
      const currentRegion = selectedRegion || localStorage.getItem('studentPackRegion') || '';
      const currentEmail = email || localStorage.getItem('studentPackEmail') || '';
      const useServerExtraction = cvText.length < 50 && !!base64Content;

      if (isPT) {
        // ─── PT: two-engine approach (same as EN/ES) ───
        setAnalysisMsg(pick("A analisar o teu CV com IA...", "Analysing your CV with AI...", "Analizando tu CV con IA..."));
        // Engine 1: CV extraction
        let cvResponseDataPT: any = null;
        for (let attempt = 0; attempt <= 2; attempt++) {
          const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 120000);
          try {
            const body: any = { mode: 'cv_extraction', email: currentEmail.trim().toLowerCase(), language: 'pt', country: currentCountry, region: currentRegion };
            if (useServerExtraction && base64Content) { body.file = base64Content; body.filename = file?.name || 'cv.pdf'; } else { body.cv_text = cvText.substring(0, 8000); }
            const res = await fetch(SUPABASE_EDGE_URL, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) { cvResponseDataPT = await res.json(); if (cvResponseDataPT.success) break; }
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } catch (e: any) { clearTimeout(tid); if (attempt < 2 && e.name !== 'AbortError') await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); else throw e; }
        }
        if (!cvResponseDataPT?.success) throw new Error(pick('Erro na análise do CV. Tenta novamente.', 'Error analysing CV. Please try again.', 'Error al analizar el CV. Inténtalo de nuevo.'));
        setAnalysisMsg(pick("A cruzar com o teu perfil LinkedIn...", "Cross-referencing with your LinkedIn profile...", "Cruzando con tu perfil LinkedIn..."));
        // Engine 2: LinkedIn roast
        let linkedinResponseDataPT: any = null;
        for (let attempt = 0; attempt <= 2; attempt++) {
          const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 120000);
          try {
            const res = await fetch(SUPABASE_EDGE_URL, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'linkedin_roast', email: currentEmail.trim().toLowerCase(), linkedin_url: currentLinkedinUrl, language: 'pt', country: currentCountry, region: currentRegion }), signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) { linkedinResponseDataPT = await res.json(); if (linkedinResponseDataPT.success) break; }
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } catch (e: any) { clearTimeout(tid); if (attempt < 2 && e.name !== 'AbortError') await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); else throw e; }
        }
        const cvAnalysisSourcePT = cvResponseDataPT.analysis || cvResponseDataPT;
        const unifiedStudentPackPT = buildUnifiedStudentPackPayload({
          cvRaw: cvAnalysisSourcePT,
          linkedinRaw: linkedinResponseDataPT || {},
          language: 'pt',
        });
        const cvAnalysisResultPT = unifiedStudentPackPT.sources.cv_normalized;
        sessionStorage.setItem('studentPackAnalysis', JSON.stringify(unifiedStudentPackPT));
        sessionStorage.setItem('studentPackCvAnalysis', JSON.stringify(cvAnalysisResultPT));
        sessionStorage.setItem('studentPackCvRaw', JSON.stringify(unifiedStudentPackPT.sources.cv_raw));
        sessionStorage.setItem('studentPackLinkedinAnalysis', JSON.stringify(unifiedStudentPackPT.sources.linkedin));
        sessionStorage.setItem('studentPackEmail', currentEmail);
        sessionStorage.setItem('studentPackCountry', currentCountry);
        sessionStorage.setItem('studentPackRegion', currentRegion);
        sessionStorage.setItem('studentPackLinkedinUrl', currentLinkedinUrl);
        sessionStorage.setItem('studentPackPaid', 'true');
        sessionStorage.setItem('cvAnalysis', JSON.stringify(cvAnalysisResultPT));
        sessionStorage.setItem('isPaid', 'true');
        sessionStorage.setItem('analysisLang', 'pt');
        const analyticsTransactionIdPT = getStudentPackTransactionId() || `STUDPACK-PT-${Date.now()}`;
        try {
          const cp = cvAnalysisSourcePT?.candidate_profile || {};
          await persistStudentPackAnalysis({
            score: cvAnalysisResultPT.overallScore || 0,
            professional_area: cp.detected_role || null,
            analysis_type: 'student_pack',
            analysis_result: cvAnalysisSourcePT,
            cv_text: cvText || null,
            user_name: cp.name || null,
            user_email: currentEmail.trim().toLowerCase(),
            linkedin_url: currentLinkedinUrl,
          });
        } catch (_) {}
        try { fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: currentEmail.trim().toLowerCase(), name: cvAnalysisSourcePT?.candidate_profile?.name || '', source: 'student_pack', language: 'pt' }) }).catch(() => {}); } catch (_e) {}
        trackPurchase('student_pack', finalPrice, analyticsTransactionIdPT);
        if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'Purchase', { value: finalPrice, currency: 'EUR' });
        trackAffiliateConversion({ product: 'student_pack', amount: finalPrice, currency: 'EUR', payment_method: paymentMethod, customer_email: currentEmail, transaction_id: analyticsTransactionIdPT });
        const elapsed = Date.now() - startTime;
        if (elapsed < 800) await new Promise(r => setTimeout(r, 800 - elapsed));
        clearInterval(msgInterval);
        setAnalysisMsg(pick("Tudo pronto! A redirecionar...", "All done! Redirecting...", "¡Todo listo! Redirigiendo..."));
        setStep('done');
        try { saveToUserAnalyses('student_pack', { score: cvAnalysisResultPT.overallScore || 0, analysis_id: `studpack-${Date.now()}` }); } catch (_) {}
        setTimeout(() => { window.location.href = localePath('/estudante') + '/results'; }, 300);
      } else {
        // ─── EN/ES: two separate engines ───
        const langCode = lang;
        // Engine 1: CV
        let cvResponseData: any = null;
        for (let attempt = 0; attempt <= 2; attempt++) {
          const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 120000);
          try {
            const body: any = { mode: 'cv_extraction', language: langCode, country: currentCountry, region: currentRegion };
            if (useServerExtraction && base64Content) { body.file = base64Content; body.filename = file?.name || 'cv.pdf'; } else { body.cv_text = cvText.substring(0, 8000); }
            const res = await fetch(SUPABASE_EDGE_URL, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) { cvResponseData = await res.json(); if (cvResponseData.success) break; }
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } catch (e: any) { clearTimeout(tid); if (attempt < 2 && e.name !== 'AbortError') await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); else throw e; }
        }
        if (!cvResponseData?.success) throw new Error(pick('Erro na análise do CV.', 'Error analysing CV. Please try again.', 'Error al analizar el CV. Inténtalo de nuevo.'));
        // Engine 2: LinkedIn
        let linkedinResponseData: any = null;
        for (let attempt = 0; attempt <= 2; attempt++) {
          const ctrl = new AbortController(); const tid = setTimeout(() => ctrl.abort(), 120000);
          try {
            const res = await fetch(SUPABASE_EDGE_URL, { method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'linkedin_roast', linkedin_url: currentLinkedinUrl, language: langCode, country: currentCountry, region: currentRegion }), signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) { linkedinResponseData = await res.json(); if (linkedinResponseData.success) break; }
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } catch (e: any) { clearTimeout(tid); if (attempt < 2 && e.name !== 'AbortError') await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); else throw e; }
        }
        const cvAnalysisSource = cvResponseData.analysis || cvResponseData;
        const unifiedStudentPack = buildUnifiedStudentPackPayload({
          cvRaw: cvAnalysisSource,
          linkedinRaw: linkedinResponseData || {},
          language: langCode,
        });
        const cvAnalysisResult = unifiedStudentPack.sources.cv_normalized;
        sessionStorage.setItem('studentPackAnalysis', JSON.stringify(unifiedStudentPack));
        sessionStorage.setItem('studentPackCvAnalysis', JSON.stringify(cvAnalysisResult));
        sessionStorage.setItem('studentPackCvRaw', JSON.stringify(unifiedStudentPack.sources.cv_raw));
        sessionStorage.setItem('studentPackLinkedinAnalysis', JSON.stringify(unifiedStudentPack.sources.linkedin));
        sessionStorage.setItem('studentPackEmail', currentEmail);
        sessionStorage.setItem('studentPackCountry', currentCountry);
        sessionStorage.setItem('studentPackRegion', currentRegion || '');
        sessionStorage.setItem('studentPackLinkedinUrl', currentLinkedinUrl);
        sessionStorage.setItem('studentPackPaid', 'true');
        sessionStorage.setItem('cvAnalysis', JSON.stringify(cvAnalysisResult));
        sessionStorage.setItem('isPaid', 'true');
        sessionStorage.setItem('analysisLang', langCode);
        const analyticsTransactionId = getStudentPackTransactionId() || `STUDPACK-${langCode.toUpperCase()}-${Date.now()}`;
        try {
          const cp = cvAnalysisSource?.candidate_profile || {};
          await persistStudentPackAnalysis({
            score: cvAnalysisResult.overallScore || 0,
            professional_area: cp.detected_role || null,
            analysis_type: 'student_pack',
            analysis_result: cvAnalysisSource,
            user_name: cp.name || null,
            user_email: currentEmail.trim().toLowerCase(),
            linkedin_url: currentLinkedinUrl,
          });
        } catch (_) {}
        trackPurchase('student_pack', finalPrice, analyticsTransactionId);
        if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'Purchase', { value: finalPrice, currency: currencyCodeUpper });
        trackAffiliateConversion({ product: 'student_pack', amount: finalPrice, currency: currencyCodeUpper, payment_method: paymentMethod, customer_email: currentEmail, transaction_id: analyticsTransactionId });
        const elapsed = Date.now() - startTime;
        if (elapsed < 800) await new Promise(r => setTimeout(r, 800 - elapsed));
        clearInterval(msgInterval);
        setAnalysisMsg(pick("Tudo pronto! A redirecionar...", "All done! Redirecting...", "¡Todo listo! Redirigiendo..."));
        setStep('done');
        setTimeout(() => { window.location.href = localePath('/estudante') + '/results'; }, 300);
      }
    } catch (err: any) {
      clearInterval(msgInterval);
      setError(err.message || pick('Erro na análise. Tenta novamente.', 'Error. Please try again.', 'Error. Inténtalo de nuevo.'));
      setStep('upload');
    }
  };

  /* ─── Payment Handlers ─── */
  const handleMBWayPayment = async () => {
    if (!email) { setPaymentError(pick('Introduz o teu email', 'Enter your email', 'Introduce tu email')); return; }
    if (!phone) { setPaymentError(pick('Introduz o teu número de telemóvel', 'Enter your phone number', 'Introduce tu número de teléfono')); return; }
    setPaymentLoading(true);
    if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const cleanPhone = phone.replace(/\s/g, '').replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('351') ? cleanPhone : (cleanPhone.length === 9 ? '351' + cleanPhone : cleanPhone);
      const orderId = `STUDPACK-${Date.now()}`;
      localStorage.removeItem('studentPackVerifiedTransactionId');
      localStorage.setItem('studentPackPendingOrderId', orderId);
      setStudentPackAccessType('paid_pending');
      trackPaymentStart('student_pack', finalPrice);
      const response = await fetch(`${BACKEND_URL}/api/payment/mbway`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, phone: formattedPhone, mobileNumber: formattedPhone, amount: finalPrice.toFixed(2), email, product: pick('Pack Estudante — CV Analyser + LinkedIn Roaster', 'Student Pack — CV Analyser + LinkedIn Roaster', 'Pack Estudiante — CV Analyser + LinkedIn Roaster'), description: appliedCoupon ? `${pick('Pack Estudante', 'Student Pack', 'Pack Estudiante')} (${appliedCoupon.percent}% ${pick('desconto', 'discount', 'descuento')}: ${appliedCoupon.code})` : pick('Pack Estudante — CV Analyser + LinkedIn Roaster', 'Student Pack — CV Analyser + LinkedIn Roaster', 'Pack Estudiante — CV Analyser + LinkedIn Roaster') }) });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || pick('Erro ao iniciar pagamento', 'Error starting payment', 'Error al iniciar el pago'));
      setPaymentStep('polling');
      setPollingMsg(pick('Confirma o pagamento na app MB WAY do teu telemóvel...', 'Confirm the payment in the MB WAY app on your phone...', 'Confirma el pago en la app MB WAY de tu móvil...'));
      startPolling(orderId);
    } catch (err: any) { setPaymentError(err.message || pick('Erro ao processar pagamento', 'Error processing payment', 'Error al procesar el pago')); }
    finally { setPaymentLoading(false); }
  };

  const handlePayPalPayment = async () => {
    if (!email) { setPaymentError(pick('Introduz o teu email', 'Enter your email', 'Introduce tu email')); return; }
    const paypalTransactionId = `STUDPACK-PAYPAL-${Date.now()}`;
    localStorage.removeItem('studentPackVerifiedTransactionId');
    localStorage.setItem('studentPackPendingOrderId', paypalTransactionId);
    setStudentPackAccessType('paid_pending');
    trackPaymentStart('student_pack', finalPrice);
    window.open(`https://paypal.me/SamuelRolo/${finalPrice}EUR`, '_blank');
    setPaymentStep('success');
    if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'Purchase', { value: finalPrice, currency: currencyCodeUpper });
    trackPurchase('student_pack', finalPrice, paypalTransactionId);
    trackAffiliateConversion({ product: 'student_pack', amount: finalPrice, currency: currencyCodeUpper, payment_method: 'paypal', customer_email: email, transaction_id: paypalTransactionId });
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError(pick('Introduz o teu email', 'Enter your email', 'Introduce tu email')); return; }
    setPaymentLoading(true);
    if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const orderId = `STUDPACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const successPath = localePath('/estudante');
      const cancelPath = localePath('/estudante');
      localStorage.removeItem('studentPackVerifiedTransactionId');
      setStudentPackAccessType('paid_pending');
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name: email.split('@')[0], amount: finalPrice, currency: currencyCode, product_type: 'student_pack', language: lang, description: appliedCoupon ? `${pick('Pack Estudante', 'Student Pack', 'Pack Estudiante')} — Share2Inspire (${appliedCoupon.percent}% ${pick('desconto', 'discount', 'descuento')})` : pick('Pack Estudante — CV Analyser + LinkedIn Roaster — Share2Inspire', 'Student Pack — CV Analyser + LinkedIn Roaster — Share2Inspire', 'Pack Estudiante — CV Analyser + LinkedIn Roaster — Share2Inspire'), orderId, success_url: `${window.location.origin}${successPath}`, cancel_url: `${window.location.origin}${cancelPath}` }) });
      const data = await response.json();
      if (data.url) { localStorage.setItem('studentPackPendingOrderId', orderId); localStorage.setItem('studentPackEmail', email); redirectToCheckout(data.url); }
      else throw new Error(data.error || pick('Erro ao criar sessão de pagamento', 'Error creating payment session', 'Error al crear la sesión de pago'));
    } catch (err: any) { setPaymentError(err.message || pick('Erro ao processar pagamento', 'Error processing payment', 'Error al procesar el pago')); }
    finally { setPaymentLoading(false); }
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
        const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) });
        if (!res.ok) { consecutiveErrors++; if (consecutiveErrors >= 8) { clearInterval(interval); setPollingExpired(true); setPollingMsg(pick('Não foi possível verificar. Usa o botão "Já paguei".', 'Could not verify. Use the "I already paid" button.', 'No se pudo verificar. Usa el botón "Ya pagué".')); } return; }
        consecutiveErrors = 0;
        const data = await res.json();
        if (data.paid) { clearInterval(interval); setShowPaymentModal(false); runBothEngines(); return; }
        const elapsed = Date.now() - startTime;
        if (data.expired && elapsed > 90000) { clearInterval(interval); setPollingExpired(true); setPollingMsg(pick('O pagamento expirou.', 'Payment expired.', 'El pago expiró.')); return; }
        setPollingMsg(elapsed < 30000 ? pick('Confirma o pagamento na app MB WAY...', 'Confirm the payment in MB WAY...', 'Confirma el pago en MB WAY...') : elapsed < 60000 ? pick('Ainda a aguardar...', 'Still waiting...', 'Todavía esperando...') : pick('A aguardar confirmação...', 'Waiting for confirmation...', 'Esperando confirmación...'));
        if (attempts >= 60) { clearInterval(interval); setPollingExpired(true); setPollingMsg(pick('Tempo esgotado.', 'Time expired.', 'Tiempo agotado.')); }
      } catch { consecutiveErrors++; }
    }, 5000);
  };

  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMsg(pick('A verificar pagamento...', 'Checking payment...', 'Verificando el pago...'));
    setPollingExpired(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: currentOrderId }) });
      const data = await res.json();
      if (data.paid) { setStudentPackAccessType('paid_verified'); setShowPaymentModal(false); runBothEngines(); }
      else { setPollingExpired(true); setPollingMsg(pick('Pagamento ainda não confirmado.', 'Payment not yet confirmed.', 'Pago aún no confirmado.')); startPolling(currentOrderId); }
    } catch { setPollingMsg(pick('Erro ao verificar.', 'Error verifying.', 'Error al verificar.')); setPollingExpired(true); }
  };

  /* ─── Discount Code Handler ─── */
  const handleDiscountCode = async () => {
    if (!discountCode.trim()) { setDiscountError(pick('Introduz um código', 'Enter a code', 'Introduce un código')); return; }
    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      const couponRes = await fetch(`${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,max_uses,current_uses,valid_from,valid_until,applicable_products`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError(pick('Este código ainda não está ativo.', 'This code is not yet active.', 'Este código aún no está activo.')); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError(pick('Este código já expirou.', 'This code has expired.', 'Este código ha expirado.')); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError(pick('Este código atingiu o limite.', 'This code has reached its limit.', 'Este código ha alcanzado su límite.')); return; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('student_pack') && !products.includes('student')) { setDiscountError(pick('Este código não é aplicável a este pacote.', 'Code not applicable to this package.', 'Código no aplicable a este paquete.')); return; }
        if (coupon.discount_percent === 100) { localStorage.removeItem('studentPackPendingOrderId'); localStorage.removeItem('studentPackVerifiedTransactionId'); setStudentPackAccessType('free'); incrementCouponUsage(code); setShowDiscountModal(false); runBothEngines(); return; }
        setAppliedCoupon({ code, percent: coupon.discount_percent });
        incrementCouponUsage(code);
        setShowDiscountModal(false);
        return;
      }
      // Check vouchers
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&is_active=eq.true`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      const vouchers = await res.json();
      if (!vouchers || vouchers.length === 0) { setDiscountError(pick('Código inválido ou já utilizado.', 'Invalid or already used code.', 'Código inválido o ya utilizado.')); return; }
      const v = vouchers[0];
      if (v.used_analyses >= v.total_analyses) { setDiscountError(pick('Este código já foi totalmente utilizado.', 'This code has been fully used.', 'Este código ya ha sido totalmente utilizado.')); return; }
      setShowDiscountModal(false);
      if (v.email) sessionStorage.setItem('paymentEmail', v.email);
      localStorage.removeItem('studentPackPendingOrderId');
      localStorage.removeItem('studentPackVerifiedTransactionId');
      setStudentPackAccessType('free');
      runBothEngines();
    } catch { setDiscountError(pick('Erro ao verificar código.', 'Error verifying code.', 'Error al verificar el código.')); }
    finally { setDiscountLoading(false); }
  };

  // Check Stripe return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) return;

    const verifyStripeReturn = async () => {
      setError(null);
      setStep('analyzing');
      setAnalysisProgress(0);
      setAnalysisMsg(pick('A validar o pagamento no servidor...', 'Validating payment on the server...', 'Validando el pago en el servidor...'));
      try {
        const savedEmail = localStorage.getItem('studentPackEmail');
        if (savedEmail) setEmail(savedEmail);
        const res = await fetch(`${BACKEND_URL}/api/payment/stripe-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || pick('Não foi possível validar o pagamento.', 'Could not validate the payment.', 'No se pudo validar el pago.'));
        if (!data.paid) throw new Error(pick('O pagamento ainda não foi confirmado pelo Stripe.', 'The payment has not yet been confirmed by Stripe.', 'Stripe aún no ha confirmado el pago.'));
        localStorage.setItem('studentPackVerifiedTransactionId', sessionId);
        localStorage.removeItem('studentPackPendingOrderId');
        setStudentPackAccessType('paid_verified');
        window.history.replaceState({}, '', localePath('/estudante'));
        await runBothEngines();
      } catch (err: any) {
        window.history.replaceState({}, '', localePath('/estudante'));
        setStep('upload');
        setError(err.message || pick('Erro ao validar o pagamento. Tenta novamente.', 'Error validating payment. Please try again.', 'Error al validar el pago. Inténtalo de nuevo.'));
      }
    };

    verifyStripeReturn();
  }, []);

  useEffect(() => {
    if (paymentStep === 'success' && step !== 'analyzing' && step !== 'done') {
      const timer = setTimeout(() => { setShowPaymentModal(false); runBothEngines(); }, 350);
      return () => clearTimeout(timer);
    }
  }, [paymentStep]);

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      <S2IHeader activePage="estudante" />
      {isPT && <PromoBanner />}

      {/* ─── HERO ─── */}
      {step === 'hero' && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-20">
          <div className="text-center space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-emerald-600 text-xs font-bold px-4 py-2 rounded-full border border-emerald-500/20 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" />
              {pick("Oferta Estudante — Poupas 43%", "Student Offer — Save 43%", "Oferta Estudiante — Ahorra 43%")}
            </div>
            <h1 className="text-2xl md:text-5xl font-bold text-slate-900 leading-tight" key={headlineIndex} style={{animation: 'fadeInUp 0.6s ease-out'}}>
              {headlines[headlineIndex].text} <span className="text-emerald-600">{headlines[headlineIndex].highlight}</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              {pick(
                "CV Analyser + LinkedIn Roaster. Analisa o teu CV, audita o teu LinkedIn e descobre exatamente o que corrigir — tudo num relatório integrado.",
                "CV Analyser + LinkedIn Roaster. Analyse your CV, audit your LinkedIn and discover exactly what to fix — all in one integrated report.",
                "CV Analyser + LinkedIn Roaster. Analiza tu CV, audita tu LinkedIn y descubre exactamente qué corregir — todo en un informe integrado."
              )}
            </p>
            <div className="flex items-center justify-center gap-4">
              {appliedCoupon ? (
                <>
                  <span className="text-2xl line-through text-slate-400">{isPT ? `${PRICE_PT}€` : `${CUR}${PRICE_NUM.toFixed(2)}`}</span>
                  <span className="text-4xl font-bold text-green-600">{isPT ? `${finalPriceStr}€` : `${CUR}${finalPriceStr}`}</span>
                </>
              ) : (
                <>
                  <span className="text-lg line-through text-slate-400">{isPT ? `${PRICE_ORIGINAL_PT}€` : `${CUR}${PRICE_ORIGINAL_EN}`}</span>
                  <span className="text-4xl font-bold text-slate-900">{isPT ? `${PRICE_PT}€` : `${CUR}${PRICE_NUM.toFixed(2)}`}</span>
                  <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{pick("Poupas 43%", "Save 43%", "Ahorra 43%")}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-col">
            <div className="text-center mt-6 md:mt-8">
              <Button onClick={() => setStep('upload')} className="h-14 md:h-16 px-10 md:px-12 text-base md:text-lg font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
                {pick("Começar agora", "Get started", "Empezar ahora")} <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2" />
              </Button>
              <p className="text-xs text-slate-400 mt-2">
                {pick("Pagamento único · Sem subscrição · Resultados imediatos", "One-time payment · No subscription · Immediate results", "Pago único · Sin suscripción · Resultados inmediatos")}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4 max-w-3xl mx-auto mt-6 md:mt-14 w-full">
              <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 text-left space-y-2 md:space-y-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center shrink-0"><BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /></div>
                  <div><h3 className="font-bold text-slate-900 text-sm md:text-base">{pick("CV Analyser", "CV Analyser", "CV Analyser")}</h3><p className="text-[10px] md:text-xs text-slate-400">{pick("Valor: 9,99€", "Value: €9.99", "Valor: €9,99")}</p></div>
                </div>
                <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-slate-600">
                  <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500 mt-0.5 shrink-0" /> <span>{pick("Análise ATS com score", "ATS analysis with score", "Análisis ATS con puntuación")}</span></li>
                  <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500 mt-0.5 shrink-0" /> <span>{pick("Top 3 problemas + soluções", "Top 3 issues + solutions", "Top 3 problemas + soluciones")}</span></li>
                  <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500 mt-0.5 shrink-0" /> <span>{pick("Estimativa salarial", "Salary estimate", "Estimación salarial")}</span></li>
                  <li className="hidden md:flex items-start gap-1.5"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick("Risco de automação da profissão", "Profession automation risk", "Riesgo de automatización de la profesión")}</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl md:rounded-2xl p-4 md:p-6 text-left space-y-2 md:space-y-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-50 rounded-lg md:rounded-xl flex items-center justify-center shrink-0"><Linkedin className="w-4 h-4 md:w-5 md:h-5 text-purple-600" /></div>
                  <div><h3 className="font-bold text-slate-900 text-sm md:text-base">{pick("LinkedIn Roaster", "LinkedIn Roaster", "LinkedIn Roaster")}</h3><p className="text-[10px] md:text-xs text-slate-400">{pick("Valor: 3,99€", "Value: €3.99", "Valor: €3,99")}</p></div>
                </div>
                <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-slate-600">
                  <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500 mt-0.5 shrink-0" /> <span>{pick("Auditoria do perfil", "Profile audit", "Auditoría del perfil")}</span></li>
                  <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500 mt-0.5 shrink-0" /> <span>{pick("Optimização de Headline & About", "Headline & About optimization", "Optimización de Headline y About")}</span></li>
                  <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500 mt-0.5 shrink-0" /> <span>{pick("Keywords SEO", "SEO keywords", "Palabras clave SEO")}</span></li>
                  <li className="hidden md:flex items-start gap-1.5"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> {pick("Score de visibilidade", "Visibility score", "Puntuación de visibilidad")}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 md:mt-8 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-4 md:p-6 text-center space-y-2 md:space-y-3">
              <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> {pick("Exclusivo do Pack Estudante", "Student Pack Exclusive", "Exclusivo del Pack Estudiante")}
              </div>
              <h3 className="text-base md:text-lg font-bold text-slate-900">{pick("Consistência CV ↔ LinkedIn", "CV ↔ LinkedIn Consistency", "Consistencia CV ↔ LinkedIn")}</h3>
              <p className="text-xs md:text-sm text-slate-600 max-w-lg mx-auto">
                {pick(
                  "Cruzamos automaticamente os dois relatórios para detectar inconsistências: skills em falta, headline desalinhada, experiências que faltam no LinkedIn — e dizemos-te exatamente o que corrigir.",
                  "We automatically cross-reference both reports to detect inconsistencies: missing skills, misaligned headline, experiences missing from LinkedIn — and tell you exactly what to fix.",
                  "Cruzamos automáticamente los dos informes para detectar inconsistencias: habilidades faltantes, titular desalineado, experiencias que faltan en LinkedIn — y te decimos exactamente qué corregir."
                )}
              </p>
            </div>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-center text-slate-900 mb-8">{pick("Como funciona?", "How does it work?", "¿Cómo funciona?")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Upload className="w-5 h-5 text-emerald-600" />, title: pick("Carrega o teu CV", "Upload your CV", "Sube tu CV"), desc: pick("Upload do CV + URL do LinkedIn. Uma única vez para os dois motores.", "Upload CV + LinkedIn URL. Once for both engines.", "Sube el CV + URL de LinkedIn. Una sola vez para los dos motores.") },
                { icon: <CreditCard className="w-5 h-5 text-emerald-600" />, title: pick(`Paga ${finalPriceStr}€`, `Pay ${CUR}${finalPriceStr}`, `Paga ${CUR}${finalPriceStr}`), desc: pick("Pagamento único via MB WAY, Cartão ou PayPal. Sem subscrição.", "One-time payment via Card or PayPal. No subscription.", "Pago único con Tarjeta o PayPal. Sin suscripción.") },
                { icon: <Zap className="w-5 h-5 text-emerald-600" />, title: pick("Relatório integrado", "Integrated report", "Informe integrado"), desc: pick("Recebe análise CV + LinkedIn + consistência cruzada em < 1 minuto.", "Get CV + LinkedIn + cross-consistency analysis in < 1 minute.", "Recibe análisis CV + LinkedIn + consistencia cruzada en < 1 minuto.") },
              ].map((s, i) => (
                <div key={i} className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">{s.icon}</div>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div><p className="text-3xl font-bold text-emerald-600">+500</p><p className="text-xs text-slate-500 mt-1">{pick("Profissionais ajudados", "Professionals helped", "Profesionales ayudados")}</p></div>
              <div><p className="text-3xl font-bold text-emerald-600">5★</p><p className="text-xs text-slate-500 mt-1">{pick("Avaliação média", "Average rating", "Valoración media")}</p></div>
              <div><p className="text-3xl font-bold text-emerald-600">43%</p><p className="text-xs text-slate-500 mt-1">{pick("Desconto estudante", "Student discount", "Descuento estudiante")}</p></div>
            </div>
          </div>

          <div className="mt-14 text-center">
            <Button onClick={() => setStep('upload')} className="h-16 px-12 text-lg font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
              {pick("Começar agora", "Get started", "Empezar ahora")} <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <p className="text-xs text-slate-400 mt-3">
              {pick("Pagamento seguro via MB WAY, Cartão ou PayPal", "Secure payment via Card or PayPal", "Pago seguro con Tarjeta o PayPal")}
            </p>
          </div>
        </div>
      )}

      {/* ─── UPLOAD ─── */}
      {step === 'upload' && (
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{pick("Insere os teus dados", "Enter your details", "Introduce tus datos")}</h2>
            <p className="text-sm text-slate-500 mt-1">{pick("CV + LinkedIn — uma só vez para os dois motores", "CV + LinkedIn — once for both engines", "CV + LinkedIn — una sola vez para los dos motores")}</p>
          </div>
          <div className="space-y-5">
            <div>
              <label htmlFor="student-pack-cv-upload" className="block text-sm font-semibold text-slate-700 mb-2"><FileText className="w-4 h-4 inline mr-1" /> {pick("Currículo (PDF ou DOCX)", "CV (PDF or DOCX)", "Currículum (PDF o DOCX)")}</label>
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-emerald-500 bg-white'}`}>
                <input id="student-pack-cv-upload" type="file" accept=".pdf,.docx" aria-label={pick('Carregar currículo', 'Upload CV', 'Subir currículum')} className="hidden" onChange={(e) => { if (e.target.files?.[0]) { profileCvAutofillRef.current = true; setFile(e.target.files[0]); } }} />
                {file ? (<div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="w-5 h-5" /><span className="text-sm font-medium">{file.name}</span></div>) : (<div className="text-center"><Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm text-slate-500">{pick("Clica ou arrasta o teu CV", "Click or drag your CV", "Haz clic o arrastra tu CV")}</p></div>)}
              </label>
              {!file && savedCvInfo && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const f = await downloadAuthenticatedProfileCv({
                        email,
                        linkedinUrl,
                        cvUrl: savedCvInfo.url,
                        cvFilename: savedCvInfo.filename,
                      });
                      profileCvAutofillRef.current = true;
                      setFile(f);
                      setError(null);
                    } catch {
                      setError(pick('Não foi possível carregar o CV guardado.', 'Could not load the saved CV.', 'No se pudo cargar el CV guardado.'));
                    }
                  }}
                  className="mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-800 underline"
                >
                  {pick('Usar CV guardado: ', 'Use saved CV: ', 'Usar CV guardado: ')}{savedCvInfo.filename}
                </button>
              )}
            </div>
            <div>
              <label htmlFor="student-pack-linkedin" className="block text-sm font-semibold text-slate-700 mb-2"><Linkedin className="w-4 h-4 inline mr-1" /> {pick("Perfil LinkedIn", "LinkedIn Profile", "Perfil de LinkedIn")}</label>
              <input id="student-pack-linkedin" type="url" aria-label={pick('Perfil LinkedIn', 'LinkedIn profile', 'Perfil de LinkedIn')} placeholder={pick('https://linkedin.com/in/o-teu-perfil', 'https://linkedin.com/in/your-profile', 'https://linkedin.com/in/tu-perfil')} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div>
              <label htmlFor="student-pack-email" className="block text-sm font-semibold text-slate-700 mb-2"><CreditCard className="w-4 h-4 inline mr-1" /> {pick('E-mail', 'Email', 'Correo electrónico')}</label>
              <input id="student-pack-email" type="email" aria-label={pick('E-mail', 'Email', 'Correo electrónico')} placeholder={pick("o-teu@email.com", "your@email.com", "tu@email.com")} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label htmlFor="student-pack-country" className="block text-sm font-semibold text-slate-700"><Globe className="w-4 h-4 inline mr-1 text-emerald-600" /> {pick("País", "Country", "País")} <span className="text-slate-400 font-normal text-xs">({pick("para dados salariais", "for salary data", "para datos salariales")})</span></label>
              <select id="student-pack-country" aria-label={pick('País', 'Country', 'País')} value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion(""); }} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all bg-white text-slate-700">
                <option value="">{pick("Selecciona o teu país...", "Select your country...", "Selecciona tu país...")}</option>
                {countries.map(c => (<option key={c.code} value={c.value}>{c.label}</option>))}
              </select>
              {regionOptions.length > 1 && (
                <select id="student-pack-region" aria-label={pick('Região', 'Region', 'Región')} value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all bg-white text-slate-700">
                  <option value="">{pick("Selecciona a região (opcional)...", "Select region (optional)...", "Selecciona la región (opcional)...")}</option>
                  {regionOptions.map(r => (<option key={r.value} value={r.value}>{r.label}</option>))}
                </select>
              )}
            </div>
            <label htmlFor="student-pack-terms" className="flex items-start gap-3 cursor-pointer">
              <input id="student-pack-terms" type="checkbox" aria-label={pick('Aceitar política de privacidade e termos', 'Accept privacy policy and terms', 'Aceptar política de privacidad y términos')} checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-xs text-slate-500">
                {pick("Li e aceito a ", "I accept the ", "Acepto la ")}
                <a href={localePath('/politica-privacidade')} target="_blank" className="text-emerald-600 underline">{pick("Política de Privacidade", "Privacy Policy", "Política de Privacidad")}</a>
                {pick(" e os ", " and ", " y los ")}
                <a href="/termos-condicoes" target="_blank" className="text-emerald-600 underline">{pick("Termos e Condições", "Terms & Conditions", "Términos y Condiciones")}</a>.
              </span>
            </label>
            {error && (<div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>)}
            <Button onClick={handleProceedToPayment} disabled={!file || !isValidLinkedinUrl(linkedinUrl) || !email || !selectedCountry || !acceptedTerms} className="w-full h-14 text-base font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-all">
              {appliedCoupon
                ? <>{pick("Pagar — ", "Pay — ", "Pagar — ")}<span className="line-through text-slate-300 mr-1">{isPT ? `${PRICE_PT}€` : `${CUR}${PRICE_NUM.toFixed(2)}`}</span> {isPT ? `${finalPriceStr}€` : `${CUR}${finalPriceStr}`}</>
                : <>{pick("Pagar e analisar — ", "Pay and analyse — ", "Pagar y analizar — ")}{isPT ? `${PRICE_PT}€` : `${CUR}${PRICE_NUM.toFixed(2)}`}</>
              }
            </Button>
            {appliedCoupon ? (
              <div className="w-full text-center text-sm text-green-600 bg-green-50 rounded-xl py-2 px-3 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> {pick("Cupão", "Coupon", "Cupón")} <span className="font-bold">{appliedCoupon.code}</span> — {appliedCoupon.percent}% {pick("desconto", "off", "descuento")}
                <button onClick={() => setAppliedCoupon(null)} className="ml-2 text-xs text-slate-400 hover:text-red-500 underline">{pick("remover", "remove", "eliminar")}</button>
              </div>
            ) : (
              <button onClick={() => { setShowDiscountModal(true); setDiscountCode(''); setDiscountError(null); }} className="w-full text-center text-sm text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2">
                <Ticket className="w-4 h-4" /> {pick("Tenho um código de desconto", "I have a discount code", "Tengo un código de descuento")}
              </button>
            )}
            <p className="text-center text-xs text-slate-400">
              {pick("Pagamento seguro via MB WAY, Cartão ou PayPal", "Secure payment via Card or PayPal", "Pago seguro con Tarjeta o PayPal")}
            </p>
            <button onClick={() => setStep('hero')} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors">
              {pick("← Voltar", "← Back", "← Volver")}
            </button>
          </div>
        </div>
      )}

      {/* ─── ANALYZING / DONE ─── */}
      {(step === 'analyzing' || step === 'done') && (
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <div className="space-y-6">
            {step === 'analyzing' ? (
              <>
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
                <h2 className="text-xl font-bold text-slate-900">{pick("A processar o teu Pack Estudante", "Processing your Student Pack", "Procesando tu Pack Estudiante")}</h2>
                <p className="text-sm text-slate-500">{analysisMsg}</p>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: `${((analysisProgress + 1) / loadingMessages.length) * 100}%` }} />
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h2 className="text-xl font-bold text-slate-900">{pick("Tudo pronto!", "All done!", "¡Todo listo!")}</h2>
                <p className="text-sm text-slate-500">{pick("A redirecionar para os teus resultados...", "Redirecting to your results...", "Redirigiendo a tus resultados...")}</p>
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
              {paymentStep === 'payment' && pick('Pagamento — Pack Estudante', 'Payment — Student Pack', 'Pago — Pack Estudiante')}
              {paymentStep === 'polling' && pick('A aguardar confirmação...', 'Awaiting confirmation...', 'Esperando confirmación...')}
              {paymentStep === 'success' && pick('Pagamento confirmado!', 'Payment confirmed!', '¡Pago confirmado!')}
            </DialogTitle>
          </DialogHeader>
          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-600">{pick("CV Analyser + LinkedIn Roaster", "CV Analyser + LinkedIn Roaster", "CV Analyser + LinkedIn Roaster")}</p>
                <div className="flex items-center justify-center gap-3 mt-1">
                  {appliedCoupon
                    ? <><span className="text-lg line-through text-slate-400">{isPT ? `${PRICE_PT}€` : `${CUR}${PRICE_NUM.toFixed(2)}`}</span><span className="text-2xl font-bold text-green-600">{isPT ? `${finalPriceStr}€` : `${CUR}${finalPriceStr}`}</span></>
                    : <span className="text-2xl font-bold text-slate-900">{isPT ? `${PRICE_PT}€` : `${CUR}${PRICE_NUM.toFixed(2)}`}</span>
                  }
                </div>
                {appliedCoupon && (<p className="text-xs text-green-600 mt-1">{pick("Cupão", "Coupon", "Cupón")} {appliedCoupon.code} — {appliedCoupon.percent}% {pick("desconto", "off", "descuento")}</p>)}
              </div>
              <div className="flex gap-2">
                {(isPT ? (['mbway', 'stripe', 'paypal'] as const) : (['stripe', 'paypal'] as const)).map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m as any)} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${paymentMethod === m ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {m === 'mbway' ? 'MB WAY' : m === 'stripe' ? pick('Cartão', 'Card', 'Tarjeta') : 'PayPal'}
                  </button>
                ))}
              </div>
              {paymentMethod === 'mbway' && isPT && (
                <div className="space-y-3">
                  <input type="tel" aria-label={pick('Número de telemóvel', 'Phone number', 'Número de teléfono')} placeholder={pick('Número de telemóvel', 'Phone number', 'Número de teléfono')} value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                  <Button onClick={handleMBWayPayment} disabled={paymentLoading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
                    {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : pick(`Pagar ${finalPriceStr}€ com MB WAY`, `Pay ${finalPriceStr}€ with MB WAY`, `Pagar ${finalPriceStr}€ con MB WAY`)}
                  </Button>
                </div>
              )}
              {paymentMethod === 'stripe' && (
                <Button onClick={handleStripePayment} disabled={paymentLoading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${pick("Pagar", "Pay", "Pagar")} ${isPT ? `${finalPriceStr}€` : `${CUR}${finalPriceStr}`} ${pick("com Cartão", "with Card", "con Tarjeta")}`}
                </Button>
              )}
              {paymentMethod === 'paypal' && (
                <Button onClick={handlePayPalPayment} className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-xl">
                  {pick("Pagar", "Pay", "Pagar")} {isPT ? `${finalPriceStr}€` : `${CUR}${finalPriceStr}`} {pick("com PayPal", "with PayPal", "con PayPal")}
                </Button>
              )}
              {paymentError && (<div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl"><AlertCircle className="w-4 h-4 shrink-0" />{paymentError}</div>)}
            </div>
          )}
          {paymentStep === 'polling' && (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm text-slate-600">{pollingMsg}</p>
              {pollingExpired && (<Button onClick={handleManualCheck} variant="outline" className="text-sm">{pick("Já paguei — verificar", "I paid — verify", "Ya pagué — verificar")}</Button>)}
            </div>
          )}
          {paymentStep === 'success' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
              <p className="text-sm text-slate-600">{pick("Pagamento confirmado! A iniciar análise...", "Payment confirmed! Starting analysis...", "¡Pago confirmado! Iniciando análisis...")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Discount Modal ─── */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-center">{pick("Código de desconto", "Discount code", "Código de descuento")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <input type="text" aria-label={pick('Código de desconto', 'Discount code', 'Código de descuento')} placeholder={pick("Introduz o código", "Enter code", "Introduce el código")} value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-center tracking-widest font-mono focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleDiscountCode()} />
            {discountError && (<p className="text-red-600 text-sm text-center">{discountError}</p>)}
            <Button onClick={handleDiscountCode} disabled={discountLoading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
              {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : pick('Validar código', 'Validate code', 'Validar código')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <S2IFooter />
    </div>
  );
}
