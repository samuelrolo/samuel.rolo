// Pack Estudante — CV Analyser + LinkedIn Roaster | Share2Inspire
// Upload CV + LinkedIn → Pagamento → Ambos os motores correm → Resultados integrados
// Preço PT: €7,99
import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Target, TrendingUp, CheckCircle2, Linkedin, CreditCard, AlertCircle, Ticket, Sparkles, Shield, Check, ArrowRight, Lock, BarChart3, Zap, Globe, Menu, X, GraduationCap, Users, Eye } from "lucide-react";
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
    if (res.ok) { sessionStorage.setItem(dedupKey, 'true'); }
  } catch (e) { console.warn('[S2I] Error saving:', e); }
}

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const PRICE = '7,99';
const PRICE_NUM = 7.99;
const PRICE_ORIGINAL = '13,98';

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

const headlines = [
  { text: "Prepara o teu CV e LinkedIn para", highlight: "conquistar o primeiro emprego" },
  { text: "Dois motores de IA a trabalhar por ti para", highlight: "lançar a tua carreira" },
  { text: "Descobre o que recrutadores vêem no teu perfil e", highlight: "corrige antes de candidatar" },
];

export default function StudentPackHome() {
  useEffect(() => { document.title = "Pack Estudante — CV Analyser + LinkedIn Roaster | Share2Inspire"; }, []);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % headlines.length), 4000); return () => clearInterval(t); }, []);
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

  // Steps
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

  // Discount
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const finalPrice = appliedCoupon ? Math.round(PRICE_NUM * (1 - appliedCoupon.percent / 100) * 100) / 100 : PRICE_NUM;
  const finalPriceStr = finalPrice.toFixed(2).replace('.', ',');

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
    "A analisar o teu perfil LinkedIn...",
    "A cruzar dados CV ↔ LinkedIn...",
    "A gerar recomendações integradas...",
    "A preparar o teu relatório completo..."
  ];

  /* ─── Handle Proceed to Payment ─── */
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

  /* ─── Run Both Engines (CV Analyser + LinkedIn Roaster) ─── */
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
      for (let attempt = 0; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        try {
          const requestBody: any = { mode: 'cv_extraction', language: 'pt', country: selectedCountry, region: selectedRegion };
          if (useServerExtraction) { requestBody.file = base64Content; requestBody.filename = file!.name; }
          else { requestBody.cv_text = cvText.substring(0, 8000); }
          const response = await fetch(SUPABASE_EDGE_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) { cvResponseData = await response.json(); if (cvResponseData.success) break; }
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < 2 && fetchError.name !== 'AbortError') await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          else throw fetchError;
        }
      }
      if (!cvResponseData?.success) throw new Error('Erro na análise do CV. Tenta novamente.');

      // ─── ENGINE 2: LinkedIn Roaster ───
      setAnalysisMsg("A analisar o teu perfil LinkedIn...");
      let linkedinResponseData: any = null;
      for (let attempt = 0; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        try {
          const response = await fetch(SUPABASE_EDGE_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'linkedin_roast', linkedin_url: linkedinUrl, language: 'pt', country: selectedCountry, region: selectedRegion }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) { linkedinResponseData = await response.json(); if (linkedinResponseData.success) break; }
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < 2 && fetchError.name !== 'AbortError') await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          else throw fetchError;
        }
      }

      // ─── STORE RESULTS ───
      setAnalysisMsg("A cruzar dados CV ↔ LinkedIn...");
      const cvAnalysisSource = cvResponseData.analysis || cvResponseData;
      const cvAnalysisResult = transformGeminiResponse(cvAnalysisSource);

      // Store everything in sessionStorage for StudentPackResults
      sessionStorage.setItem('studentPackCvAnalysis', JSON.stringify(cvAnalysisResult));
      sessionStorage.setItem('studentPackCvRaw', JSON.stringify(cvAnalysisSource));
      sessionStorage.setItem('studentPackLinkedinAnalysis', JSON.stringify(linkedinResponseData || {}));
      sessionStorage.setItem('studentPackEmail', email.trim().toLowerCase());
      sessionStorage.setItem('studentPackCountry', selectedCountry || 'Portugal');
      sessionStorage.setItem('studentPackRegion', selectedRegion || '');
      sessionStorage.setItem('studentPackLinkedinUrl', linkedinUrl);
      sessionStorage.setItem('studentPackPaid', 'true');

      // Also store for regular CV results (compatibility)
      sessionStorage.setItem('cvAnalysis', JSON.stringify(cvAnalysisResult));
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('paymentEmail', email.trim().toLowerCase());
      sessionStorage.setItem('analysisCountry', selectedCountry || 'Portugal');
      sessionStorage.setItem('analysisRegion', selectedRegion || '');

      // Save to Supabase
      try {
        const cp = cvAnalysisSource?.candidate_profile || {};
        const transactionId = `STUDPACK-${Date.now()}`;
        fetch(`${SUPABASE_URL}/rest/v1/cv_analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            score: cvAnalysisResult.overallScore || 0,
            professional_area: cp.detected_role || null,
            analysis_type: 'student_pack',
            analysis_result: JSON.stringify(cvAnalysisSource),
            cv_text: cvText || null,
            payment_status: 'paid',
            payment_amount: finalPrice,
            transaction_id: transactionId,
            domain: 'share2inspire.pt',
            user_name: cp.name || cp.detected_name || null,
            user_email: email.trim().toLowerCase(),
            linkedin_url: linkedinUrl,
          }),
        }).catch(() => {});
      } catch (_) {}

      // Track conversions
      trackPurchase('student_pack', finalPrice, `STUDPACK-${Date.now()}`);
      if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', { value: finalPrice, currency: 'EUR' });
      trackAffiliateConversion({ product: 'student_pack', amount: finalPrice, currency: 'EUR', payment_method: paymentMethod, customer_email: email, transaction_id: `STUDPACK-${Date.now()}` });

      // Ensure minimum loading time of 2.8s
      const elapsed = Date.now() - startTime;
      if (elapsed < 2800) await new Promise(r => setTimeout(r, 2800 - elapsed));

      clearInterval(msgInterval);
      setAnalysisMsg("Tudo pronto! A redirecionar...");
      setStep('done');

      // Save to user_analyses
      try { saveToUserAnalyses('student_pack', { cv_score: cvAnalysisResult.overallScore || 0, linkedin_score: linkedinResponseData?.teaser_score || null, analysis_id: `studpack-${Date.now()}` }); } catch (_) {}

      setTimeout(() => { window.location.href = '/estudante/results'; }, 1500);
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
      const orderId = `STUDPACK-${Date.now()}`;
      trackPaymentStart('student_pack', finalPrice);
      const response = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, phone: formattedPhone, mobileNumber: formattedPhone, amount: finalPrice.toFixed(2), email, product: 'Pack Estudante — CV Analyser + LinkedIn Roaster', description: appliedCoupon ? `Pack Estudante (${appliedCoupon.percent}% desconto: ${appliedCoupon.code})` : 'Pack Estudante — CV Analyser + LinkedIn Roaster' })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Erro ao iniciar pagamento');
      setPaymentStep('polling');
      setPollingMsg('Confirma o pagamento na app MB WAY do teu telemóvel...');
      startPolling(orderId);
    } catch (err: any) { setPaymentError(err.message || 'Erro ao processar pagamento'); }
    finally { setPaymentLoading(false); }
  };

  const handlePayPalPayment = async () => {
    if (!email) { setPaymentError('Introduz o teu email'); return; }
    trackPaymentStart('student_pack', finalPrice);
    window.open(`https://paypal.me/SamuelRolo/${finalPrice}EUR`, '_blank');
    setPaymentStep('success');
    if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', { value: finalPrice, currency: 'EUR' });
    trackPurchase('student_pack', finalPrice, `STUDPACK-PAYPAL-${Date.now()}`);
    trackAffiliateConversion({ product: 'student_pack', amount: finalPrice, currency: 'EUR', payment_method: 'paypal', customer_email: email, transaction_id: `STUDPACK-PAYPAL-${Date.now()}` });
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError('Introduz o teu email'); return; }
    setPaymentLoading(true);
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const orderId = `STUDPACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: email.split('@')[0], amount: finalPrice, currency: 'eur', description: appliedCoupon ? `Pack Estudante — Share2Inspire (${appliedCoupon.percent}% desconto)` : 'Pack Estudante — CV Analyser + LinkedIn Roaster — Share2Inspire', orderId, success_url: `${window.location.origin}/estudante?paid=true`, cancel_url: `${window.location.origin}/estudante` }),
      });
      const data = await response.json();
      if (data.url) { sessionStorage.setItem('studentPackPendingOrderId', orderId); sessionStorage.setItem('studentPackEmail', email); redirectToCheckout(data.url); }
      else throw new Error(data.error || 'Erro ao criar sessão de pagamento');
    } catch (err: any) { setPaymentError(err.message || 'Erro ao processar pagamento'); }
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
        if (!res.ok) { consecutiveErrors++; if (consecutiveErrors >= 8) { clearInterval(interval); setPollingExpired(true); setPollingMsg('Não foi possível verificar. Usa o botão "Já paguei".'); } return; }
        consecutiveErrors = 0;
        const data = await res.json();
        if (data.paid) { clearInterval(interval); setShowPaymentModal(false); runBothEngines(); return; }
        const elapsed = Date.now() - startTime;
        if (data.expired && elapsed > 90000) { clearInterval(interval); setPollingExpired(true); setPollingMsg('O pagamento expirou.'); return; }
        setPollingMsg(elapsed < 30000 ? 'Confirma o pagamento na app MB WAY...' : elapsed < 60000 ? 'Ainda a aguardar...' : 'A aguardar confirmação...');
        if (attempts >= 60) { clearInterval(interval); setPollingExpired(true); setPollingMsg('Tempo esgotado.'); }
      } catch { consecutiveErrors++; }
    }, 5000);
  };

  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMsg('A verificar pagamento...');
    setPollingExpired(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: currentOrderId }) });
      const data = await res.json();
      if (data.paid) { setShowPaymentModal(false); runBothEngines(); }
      else { setPollingExpired(true); setPollingMsg('Pagamento ainda não confirmado.'); startPolling(currentOrderId); }
    } catch { setPollingMsg('Erro ao verificar.'); setPollingExpired(true); }
  };

  /* ─── Discount Code Handler ─── */
  const handleDiscountCode = async () => {
    if (!discountCode.trim()) { setDiscountError('Introduz um código'); return; }
    setDiscountLoading(true);
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      const couponRes = await fetch(`${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,max_uses,current_uses,valid_from,valid_until,applicable_products`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError('Este código ainda não está ativo.'); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError('Este código já expirou.'); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError('Este código atingiu o limite.'); return; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('student_pack') && !products.includes('student')) { setDiscountError('Este código não é aplicável a este pacote.'); return; }
        if (coupon.discount_percent === 100) { incrementCouponUsage(code); setShowDiscountModal(false); runBothEngines(); return; }
        setAppliedCoupon({ code, percent: coupon.discount_percent });
        incrementCouponUsage(code);
        setShowDiscountModal(false);
        return;
      }
      // Check vouchers
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&is_active=eq.true`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      const vouchers = await res.json();
      if (!vouchers || vouchers.length === 0) { setDiscountError('Código inválido ou já utilizado.'); return; }
      const v = vouchers[0];
      if (v.used_analyses >= v.total_analyses) { setDiscountError('Este código já foi totalmente utilizado.'); return; }
      setShowDiscountModal(false);
      if (v.email) sessionStorage.setItem('paymentEmail', v.email);
      runBothEngines();
    } catch { setDiscountError('Erro ao verificar código.'); }
    finally { setDiscountLoading(false); }
  };

  // Check Stripe return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === 'true') {
      const savedEmail = sessionStorage.getItem('studentPackEmail');
      if (savedEmail) setEmail(savedEmail);
      window.history.replaceState({}, '', '/estudante');
      runBothEngines();
    }
  }, []);

  useEffect(() => {
    if (paymentStep === 'success' && step !== 'analyzing' && step !== 'done') {
      const timer = setTimeout(() => { setShowPaymentModal(false); runBothEngines(); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentStep]);

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      <S2IHeader activePage="estudante" langToggleHref="/en/student-pack" />

      {/* ─── HERO ─── */}
      {step === 'hero' && (
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 text-emerald-600 text-xs font-bold px-4 py-2 rounded-full border border-emerald-500/20 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" /> Oferta Estudante — Poupas 43%
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight" key={headlineIndex} style={{animation: 'fadeInUp 0.6s ease-out'}}>
              {headlines[headlineIndex].text} <span className="text-emerald-600">{headlines[headlineIndex].highlight}</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              CV Analyser + LinkedIn Roaster. Analisa o teu CV, audita o teu LinkedIn e descobre exatamente o que corrigir — tudo num relatório integrado.
            </p>
            <div className="flex items-center justify-center gap-4">
              {appliedCoupon ? (
                <>
                  <span className="text-2xl line-through text-slate-400">{PRICE}€</span>
                  <span className="text-4xl font-bold text-green-600">{finalPriceStr}€</span>
                </>
              ) : (
                <>
                  <span className="text-lg line-through text-slate-400">{PRICE_ORIGINAL}€</span>
                  <span className="text-4xl font-bold text-slate-900">{PRICE}€</span>
                  <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Poupas 43%</span>
                </>
              )}
            </div>
            <Button onClick={() => setStep('upload')} className="h-16 px-12 text-lg font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] mt-4">
              Começar agora <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <p className="text-xs text-slate-400">Pagamento único · Sem subscrição · Resultados imediatos</p>
          </div>

          {/* What's included */}
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-14">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
                <div><h3 className="font-bold text-slate-900">CV Analyser</h3><p className="text-xs text-slate-400">Valor: 9,99€</p></div>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Análise ATS completa com score</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Top 3 problemas do CV com soluções</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Estimativa salarial detalhada</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Risco de automação da profissão</li>
              </ul>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><Linkedin className="w-5 h-5 text-purple-600" /></div>
                <div><h3 className="font-bold text-slate-900">LinkedIn Roaster</h3><p className="text-xs text-slate-400">Valor: 3,99€</p></div>
              </div>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Auditoria completa do perfil</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Headline & About optimization</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> SEO keywords para recrutadores</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Score de visibilidade</li>
              </ul>
            </div>
          </div>

          {/* Exclusive: Consistency Check */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Exclusivo do Pack Estudante
              </div>
              <h3 className="text-lg font-bold text-slate-900">Consistência CV ↔ LinkedIn</h3>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">Cruzamos automaticamente os dois relatórios para detectar inconsistências: skills em falta, headline desalinhada, experiências que faltam no LinkedIn — e dizemos-te exatamente o que corrigir.</p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-center text-slate-900 mb-8">Como funciona?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Upload className="w-5 h-5 text-emerald-600" />, title: "Carrega o teu CV", desc: "Upload do CV + URL do LinkedIn. Uma única vez para os dois motores." },
                { icon: <CreditCard className="w-5 h-5 text-emerald-600" />, title: "Paga €7,99", desc: "Pagamento único via MB WAY, Cartão ou PayPal. Sem subscrição." },
                { icon: <Zap className="w-5 h-5 text-emerald-600" />, title: "Relatório integrado", desc: "Recebe análise CV + LinkedIn + consistência cruzada em < 1 minuto." },
              ].map((s, i) => (
                <div key={i} className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">{s.icon}</div>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div><p className="text-3xl font-bold text-emerald-600">+500</p><p className="text-xs text-slate-500 mt-1">Profissionais ajudados</p></div>
              <div><p className="text-3xl font-bold text-emerald-600">5★</p><p className="text-xs text-slate-500 mt-1">Avaliação média</p></div>
              <div><p className="text-3xl font-bold text-emerald-600">43%</p><p className="text-xs text-slate-500 mt-1">Desconto estudante</p></div>
            </div>
          </div>

          {/* Second CTA */}
          <div className="mt-14 text-center">
            <Button onClick={() => setStep('upload')} className="h-16 px-12 text-lg font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]">
              Começar agora <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
            <p className="text-xs text-slate-400 mt-3">Pagamento seguro via MB WAY, Cartão ou PayPal</p>
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
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2"><FileText className="w-4 h-4 inline mr-1" /> Currículo (PDF ou DOCX)</label>
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-emerald-500 bg-white'}`}>
                <input type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                {file ? (<div className="flex items-center gap-2 text-green-700"><CheckCircle2 className="w-5 h-5" /><span className="text-sm font-medium">{file.name}</span></div>) : (<div className="text-center"><Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" /><p className="text-sm text-slate-500">Clica ou arrasta o teu CV</p></div>)}
              </label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2"><Linkedin className="w-4 h-4 inline mr-1" /> Perfil LinkedIn</label>
              <input type="url" placeholder="https://linkedin.com/in/o-teu-perfil" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2"><CreditCard className="w-4 h-4 inline mr-1" /> Email</label>
              <input type="email" placeholder="o-teu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700"><Globe className="w-4 h-4 inline mr-1 text-emerald-600" /> País <span className="text-slate-400 font-normal text-xs">(para dados salariais)</span></label>
              <select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion(""); }} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all bg-white text-slate-700">
                <option value="">Selecciona o teu país...</option>
                {countries.map(c => (<option key={c.code} value={c.country}>{c.country}</option>))}
              </select>
              {countryData && countryData.regions.length > 1 && (
                <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all bg-white text-slate-700">
                  <option value="">Selecciona a região (opcional)...</option>
                  {countryData.regions.map(r => (<option key={r} value={r}>{r}</option>))}
                </select>
              )}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-xs text-slate-500">Li e aceito a <a href="/politica-privacidade" target="_blank" className="text-emerald-600 underline">Política de Privacidade</a> e os <a href="/termos-condicoes" target="_blank" className="text-emerald-600 underline">Termos e Condições</a>.</span>
            </label>
            {error && (<div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>)}
            <Button onClick={handleProceedToPayment} disabled={!file || !isValidLinkedinUrl(linkedinUrl) || !email || !selectedCountry || !acceptedTerms} className="w-full h-14 text-base font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-all">
              {appliedCoupon ? (<>Pagar — <span className="line-through text-slate-300 mr-1">{PRICE}€</span> {finalPriceStr}€</>) : (<>Pagar e analisar — {PRICE}€</>)}
            </Button>
            {appliedCoupon ? (
              <div className="w-full text-center text-sm text-green-600 bg-green-50 rounded-xl py-2 px-3 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Cupão <span className="font-bold">{appliedCoupon.code}</span> — {appliedCoupon.percent}% desconto
                <button onClick={() => setAppliedCoupon(null)} className="ml-2 text-xs text-slate-400 hover:text-red-500 underline">remover</button>
              </div>
            ) : (
              <button onClick={() => { setShowDiscountModal(true); setDiscountCode(''); setDiscountError(null); }} className="w-full text-center text-sm text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2">
                <Ticket className="w-4 h-4" /> Tenho um código de desconto
              </button>
            )}
            <p className="text-center text-xs text-slate-400">Pagamento seguro via MB WAY, Cartão ou PayPal</p>
            <button onClick={() => setStep('hero')} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors">← Voltar</button>
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
                <h2 className="text-xl font-bold text-slate-900">A processar o teu Pack Estudante</h2>
                <p className="text-sm text-slate-500">{analysisMsg}</p>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: `${((analysisProgress + 1) / loadingMessages.length) * 100}%` }} />
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
              {paymentStep === 'payment' && 'Pagamento — Pack Estudante'}
              {paymentStep === 'polling' && 'A aguardar confirmação...'}
              {paymentStep === 'success' && 'Pagamento confirmado!'}
            </DialogTitle>
          </DialogHeader>
          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-600">CV Analyser + LinkedIn Roaster</p>
                <div className="flex items-center justify-center gap-3 mt-1">
                  {appliedCoupon ? (<><span className="text-lg line-through text-slate-400">{PRICE}€</span><span className="text-2xl font-bold text-green-600">{finalPriceStr}€</span></>) : (<span className="text-2xl font-bold text-slate-900">{PRICE}€</span>)}
                </div>
                {appliedCoupon && (<p className="text-xs text-green-600 mt-1">Cupão {appliedCoupon.code} — {appliedCoupon.percent}% desconto</p>)}
              </div>
              <div className="flex gap-2">
                {(['mbway', 'stripe', 'paypal'] as const).map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${paymentMethod === m ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {m === 'mbway' ? 'MB WAY' : m === 'stripe' ? 'Cartão' : 'PayPal'}
                  </button>
                ))}
              </div>
              {paymentMethod === 'mbway' && (
                <div className="space-y-3">
                  <input type="tel" placeholder="Número de telemóvel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" />
                  <Button onClick={handleMBWayPayment} disabled={paymentLoading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
                    {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pagar ${finalPriceStr}€ com MB WAY`}
                  </Button>
                </div>
              )}
              {paymentMethod === 'stripe' && (
                <Button onClick={handleStripePayment} disabled={paymentLoading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pagar ${finalPriceStr}€ com Cartão`}
                </Button>
              )}
              {paymentMethod === 'paypal' && (
                <Button onClick={handlePayPalPayment} className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-xl">
                  Pagar {finalPriceStr}€ com PayPal
                </Button>
              )}
              {paymentError && (<div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl"><AlertCircle className="w-4 h-4 shrink-0" />{paymentError}</div>)}
            </div>
          )}
          {paymentStep === 'polling' && (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm text-slate-600">{pollingMsg}</p>
              {pollingExpired && (<Button onClick={handleManualCheck} variant="outline" className="text-sm">Já paguei — verificar</Button>)}
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

      {/* ─── Discount Modal ─── */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-center">Código de desconto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <input type="text" placeholder="Introduz o código" value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-center tracking-widest font-mono focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none" onKeyDown={(e) => e.key === 'Enter' && handleDiscountCode()} />
            {discountError && (<p className="text-red-600 text-sm text-center">{discountError}</p>)}
            <Button onClick={handleDiscountCode} disabled={discountLoading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
              {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar código'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <S2IFooter />
    </div>
  );
}
