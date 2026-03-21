// Career Intelligence — Standalone (39€)
// Upload de CV + URL LinkedIn → Pagamento → Análise completa com decisão estratégica
// Inclui tudo do Career Path + comparação, trade-offs, recomendação final

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Home as HomeIcon, Compass, Target, TrendingUp, Award, Users, Star, CheckCircle2, Lock, ChevronDown, Linkedin, CreditCard, AlertCircle, Ticket, Unlock, Briefcase, BookOpen, Calendar, ExternalLink, Sparkles, Search, Globe, DollarSign, Zap, ArrowRight, Shield, Check, Eye, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { sendConversion, trackCVUpload, trackAnalysisStart, trackPaymentStart, trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion } from "@/lib/affiliate";

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
    text: "O Career Intelligence mostrou-me exactamente qual dos 3 caminhos tinha maior probabilidade de sucesso. A comparação lado a lado foi decisiva.",
    rating: 5,
  },
  {
    name: "Rui Ferreira",
    role: "Engenheiro de Software",
    text: "Estava indeciso entre Product Manager e Engineering Manager. A análise de trade-offs e a recomendação final deram-me a clareza que precisava.",
    rating: 5,
  },
  {
    name: "Sofia Lopes",
    role: "Consultora de Estratégia",
    text: "Nunca pensei que uma IA conseguisse comparar caminhos de carreira com este nível de detalhe. A recomendação final foi cirúrgica.",
    rating: 5,
  },
];

const PRICE_DISPLAY = '39€';
const PRICE = '39,00';
const PRICE_NUM = 39.00;

export default function CareerIntelligenceHome() {
  useEffect(() => { document.title = "Career Intelligence — Decisão Estratégica de Carreira com IA | Share2Inspire"; }, []);

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
  const [previewData, setPreviewData] = useState<any>(null);

  const loadingMessages = [
    "A extrair o teu perfil profissional...",
    "A mapear competências e experiência...",
    "A analisar tendências do mercado...",
    "A identificar oportunidades de carreira...",
    "A comparar caminhos estratégicos...",
    "A calcular probabilidades de sucesso...",
    "A analisar trade-offs por caminho...",
    "A construir recomendação final...",
    "A finalizar o teu Career Intelligence..."
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
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>('mbway');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'polling' | 'success'>('payment');
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Voucher state
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponValid, setCouponValid] = useState(false);

  const FINAL_PRICE = couponDiscount > 0 ? PRICE_NUM * (1 - couponDiscount / 100) : PRICE_NUM;
  const FINAL_PRICE_DISPLAY = FINAL_PRICE.toFixed(2).replace('.', ',');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Por favor, carregue um ficheiro PDF ou DOCX');
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

  /* ─── Coupon validation ─── */
  const handleCouponValidate = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), product: 'career_intelligence_full' }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponDiscount(data.discount_percent || 0);
        setCouponValid(true);
      } else {
        setCouponError(data.message || 'Código inválido');
        setCouponValid(false);
      }
    } catch {
      setCouponError('Erro ao validar código');
    } finally {
      setCouponLoading(false);
    }
  };

  /* ─── Voucher validation ─── */
  const handleVoucherSubmit = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Introduz um código de voucher');
      return;
    }
    setVoucherLoading(true);
    setVoucherError(null);
    try {
      const code = voucherCode.trim().toUpperCase();
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const rows = await res.json();
      if (!rows.length) throw new Error('Código inválido ou expirado');
      const v = rows[0];
      if (!v.is_active) throw new Error('Este código já foi utilizado');
      if (v.used_analyses >= v.total_analyses) throw new Error('Este código já não tem utilizações disponíveis');
      if (v.voucher_type !== 'career_intelligence_full' && v.voucher_type !== 'career_intelligence_pro' && v.voucher_type !== 'complete' && !v.includes_career_intelligence_pro) {
        throw new Error('Este código não é válido para o Career Intelligence');
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
      setShowVoucherModal(false);
      // Mark both Career Path and PRO as paid (full product)
      sessionStorage.setItem('careerPathPaid', 'true');
      sessionStorage.setItem('careerIntelligenceProPaid', 'true');
      sessionStorage.setItem('careerIntelligenceFull', 'true');
      sessionStorage.setItem('cpOrderId', `CI-VOUCHER-${v.code}`);
      if (v.email) sessionStorage.setItem('cpPaymentEmail', v.email);
      trackAffiliateConversion({ product: 'career_intelligence_full', amount: 0, currency: 'EUR', payment_method: 'voucher', customer_email: v.email || '', transaction_id: `CI-VOUCHER-${v.code}` });
      setTimeout(() => { setLocation('/results'); }, 400);
    } catch (err: any) {
      setVoucherError(err.message || 'Código inválido');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (!isValidLinkedinUrl(linkedinUrl)) {
      setError('Por favor, introduz o teu perfil LinkedIn (ex: https://linkedin.com/in/o-teu-perfil)');
      return;
    }
    trackAnalysisStart('career_intelligence_full');
    setLoading(true);
    setError(null);

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
          const requestBody: any = { mode: 'cv_extraction' };
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

      if (!response?.ok) throw new Error('Erro na análise IA. Por favor, tente novamente.');
      if (!responseData?.success) throw new Error(responseData?.error || 'Erro na análise IA.');

      const analysisSource = responseData.analysis || responseData;

      if (useServerExtraction && analysisSource.raw_text) {
        cvText = analysisSource.raw_text;
      }

      sessionStorage.setItem('careerPathCvAnalysis', JSON.stringify(analysisSource));
      sessionStorage.setItem('careerPathCvText', (cvText || '').substring(0, 8000));
      sessionStorage.setItem('careerPathCvFile', base64Content);
      sessionStorage.setItem('careerPathCvFilename', file.name);
      sessionStorage.setItem('analysisLang', 'pt');
      if (linkedinUrl) sessionStorage.setItem('careerPathLinkedinUrl', linkedinUrl);

      const profile = analysisSource.candidate_profile || {};
      setPreviewData({
        name: profile.detected_name || 'N/A',
        role: profile.detected_role || 'N/A',
        seniority: profile.seniority || 'N/A',
        experience: profile.total_years_exp || 'N/A',
        skills: (profile.key_skills || []).slice(0, 5),
        nextRole: profile.likely_next_role || null,
      });
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
    setPaymentError(null);

    try {
      const orderId = `CI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('cpOrderId', orderId);
      sessionStorage.setItem('cpPaymentEmail', email);

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

    sessionStorage.setItem('cpPaymentEmail', email);
    trackPaymentStart('career_intelligence_full', FINAL_PRICE);
    window.open(`https://paypal.me/SamuelRolo/${FINAL_PRICE.toFixed(2)}EUR`, '_blank');
    setPaymentStep('success');
    const txId = `CI-PAYPAL-${Date.now()}`;
    trackPurchase('career_intelligence_full', FINAL_PRICE, txId);
    trackAffiliateConversion({ product: 'career_intelligence_full', amount: FINAL_PRICE, currency: 'EUR', payment_method: 'paypal', customer_email: email, transaction_id: txId });
  };

  const handleStripePayment = async () => {
    if (!email) { setPaymentError('Introduz o teu email'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setPaymentError('Email inválido'); return; }
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
          language: 'pt',
          country: '',
          region: '',
          currency: 'eur',
          amount: FINAL_PRICE,
        })
      });
      const data = await response.json();
      if (!data.success || !data.url) throw new Error(data.error || 'Erro ao criar sessão de pagamento');
      sessionStorage.setItem('cpOrderId', orderId);
      sessionStorage.setItem('cpPaymentEmail', email);
      sessionStorage.setItem('stripeSessionId', data.sessionId);
      window.location.href = data.url;
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
          unlockAndRedirect(orderId);
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

  const unlockAndRedirect = (orderId: string) => {
    setShowPaymentModal(false);
    // Mark BOTH Career Path and PRO as paid — full product
    sessionStorage.setItem('careerPathPaid', 'true');
    sessionStorage.setItem('careerIntelligenceProPaid', 'true');
    sessionStorage.setItem('careerIntelligenceFull', 'true');
    trackPurchase('career_intelligence_full', FINAL_PRICE, orderId);
    trackAffiliateConversion({ product: 'career_intelligence_full', amount: FINAL_PRICE, currency: 'EUR', payment_method: paymentMethod, customer_email: email, transaction_id: orderId });
    setTimeout(() => { setLocation('/results'); }, 400);
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
        unlockAndRedirect(currentOrderId);
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
    if (currentOrderId) {
      unlockAndRedirect(currentOrderId);
    } else {
      setShowPaymentModal(false);
      sessionStorage.setItem('careerPathPaid', 'true');
      sessionStorage.setItem('careerIntelligenceProPaid', 'true');
      sessionStorage.setItem('careerIntelligenceFull', 'true');
      setTimeout(() => { setLocation('/results'); }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#C9A961]" />
            <span className="text-lg font-semibold text-foreground">Career Intelligence</span>
            <span className="text-[10px] font-bold bg-[#C9A961] text-white px-2 py-0.5 rounded-full">PRO</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/career-path" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Career Path</a>
            <a href="/cv-analyser" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">CV Analyser</a>
            <a href="/en/career-intelligence" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 hover:bg-[#C9A961]/20 transition-colors text-sm font-medium text-[#C9A961]">
              <Globe className="w-3.5 h-3.5" /><span>EN</span>
            </a>
            <a href="https://www.share2inspire.pt" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground">
              <HomeIcon className="w-4 h-4" /><span>Homepage</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* ═══ STEP 1: HERO ═══ */}
        {step === 'hero' && (
          <div className="space-y-16 animate-in fade-in">
            {/* Hero */}
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/20 text-sm font-medium text-[#C9A961]">
                <Scale className="w-4 h-4" />
                Powered by IA Avançada
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Tens <span className="text-[#C9A961]">3 caminhos</span>.<br />Nós dizemos-te qual escolher.
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A nossa IA analisa o teu CV e LinkedIn, compara os 3 caminhos de carreira com maior potencial e entrega uma recomendação final — com dados, não com intuição.
              </p>
            </div>

            {/* What's included — Career Intelligence vs Career Path */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">Tudo incluído. Uma análise. Uma decisão.</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Career Path features (included) */}
                <div className="space-y-3 p-5 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-semibold text-muted-foreground">Diagnóstico (incluído)</p>
                  </div>
                  {[
                    "Roadmap de carreira personalizado",
                    "Análise de gaps de competências",
                    "Estimativa salarial por etapa",
                    "Formações e certificações recomendadas",
                    "Estratégia de networking",
                    "Plano 30-60-90 dias",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                {/* Career Intelligence PRO features */}
                <div className="space-y-3 p-5 rounded-xl bg-gradient-to-b from-[#C9A961]/5 to-[#C9A961]/10 border-2 border-[#C9A961]/30">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[#C9A961]" />
                    <p className="text-sm font-semibold text-[#C9A961]">Decisão Estratégica (exclusivo)</p>
                  </div>
                  {[
                    "3 caminhos com probabilidade de sucesso",
                    "Comparação lado a lado dos 3 caminhos",
                    "Trade-offs: o que ganhas vs o que abdicas",
                    "Recomendação final com justificação",
                    "Plano de acção por caminho",
                    "Contexto de mercado (empresas, procura)",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground font-medium">
                      <Sparkles className="w-4 h-4 text-[#C9A961] shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center space-y-4">
              <Button
                onClick={() => setStep('upload')}
                className="h-14 px-10 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all"
              >
                <Scale className="w-5 h-5 mr-2" />
                Obter a minha recomendação de carreira
              </Button>
              <p className="text-xs text-muted-foreground">Análise completa por 39€ · Pagamento único · Resultado em &lt; 1 minuto</p>
              <p className="text-xs text-muted-foreground">
                Só precisas do diagnóstico? <a href="/career-path" className="text-[#C9A961] hover:underline">Career Path por 12€ →</a>
              </p>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Shield className="w-5 h-5" />, label: "Dados 100% privados" },
                { icon: <Zap className="w-5 h-5" />, label: "Resultado em < 1 minuto" },
                { icon: <Award className="w-5 h-5" />, label: "Criado por especialistas RH" },
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 text-center">
                  <span className="text-[#C9A961]">{badge.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">3 passos. 1 minuto. 1 decisão.</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: "1", title: "Carrega o teu CV", desc: "Faz upload do CV e partilha o teu LinkedIn.", time: "30 seg" },
                  { step: "2", title: "A IA analisa tudo", desc: "Cruzamos experiência, competências, mercado e probabilidades.", time: "30 seg" },
                  { step: "3", title: "Recebe a recomendação", desc: "3 caminhos comparados + recomendação final fundamentada.", time: "Imediato" },
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
              <h3 className="text-lg font-bold text-white">O equivalente a uma sessão de coaching estratégico.</h3>
              <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                Um coach de carreira cobra entre 300€ e 600€ por sessão para te ajudar a decidir. O Career Intelligence entrega a mesma análise — com dados objectivos, comparação estruturada e recomendação fundamentada — por <strong className="text-[#C9A961]">39€</strong>.
              </p>
            </div>

            {/* Testimonials */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-foreground">O que dizem os utilizadores</h2>
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
              <h2 className="text-2xl font-bold text-foreground">Não precisas de mais opções. Precisas de saber qual escolher.</h2>
              <p className="text-muted-foreground">Diagnóstico completo + decisão estratégica por 39€. Pagamento único. Sem subscrição.</p>
              <Button
                onClick={() => setStep('upload')}
                className="h-14 px-10 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white transition-all"
              >
                <Scale className="w-5 h-5 mr-2" />
                Obter a minha recomendação de carreira
              </Button>
              <p className="text-xs text-muted-foreground">
                Só precisas do diagnóstico? <a href="/career-path" className="text-[#C9A961] hover:underline">Career Path por 12€ →</a>
              </p>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: UPLOAD ═══ */}
        {step === 'upload' && (
          <div className="max-w-xl mx-auto space-y-8 animate-in fade-in">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Career Intelligence</h2>
              <p className="text-sm text-muted-foreground">Carrega o teu CV e partilha o teu LinkedIn para a análise completa com recomendação.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
              {/* CV Upload */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">1. Carrega o teu CV</label>
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
                        <p className="text-sm font-semibold text-foreground">Arrasta o teu CV ou clica para escolher</p>
                        <p className="text-xs text-muted-foreground">PDF ou DOCX (máx. 5MB)</p>
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
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/o-teu-perfil"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]/30 focus:border-[#C9A961] transition-colors text-sm"
                  />
                </div>
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <p className="text-xs font-semibold text-blue-600 mb-1.5 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> O sistema irá analisar automaticamente:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {['Experiência profissional', 'Área de actuação', 'Competências identificadas', 'Evolução de funções'].map((item, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {item}</p>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 italic">Nenhum dado será publicado ou partilhado.</p>
                </div>
              </div>

              {/* Career Goal */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">3. Qual é o teu principal objectivo profissional? <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'grow', label: 'Crescer na área actual' },
                    { value: 'change', label: 'Mudar de área' },
                    { value: 'responsibility', label: 'Mais responsabilidade' },
                    { value: 'salary', label: 'Aumentar salário' },
                    { value: 'tech', label: 'Tecnologia / Inovação' },
                    { value: 'leadership', label: 'Liderança' },
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
                  Concordo com a{" "}
                  <a href="https://www.share2inspire.pt/pages/politica-privacidade.html" target="_blank" rel="noopener noreferrer" className="text-[#C9A961] hover:underline">
                    Política de Privacidade
                  </a>{" "}
                  e autorizo o processamento dos meus dados para análise de carreira.
                </label>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={!file || !acceptedTerms || !isValidLinkedinUrl(linkedinUrl) || loading}
                className="w-full h-14 text-base font-semibold rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {loadingMessages[loadingStep]}
                  </span>
                ) : (
                  "Obter a minha recomendação — 39€"
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
                ← Voltar
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
                Análise concluída
              </div>
              <h2 className="text-xl font-bold text-foreground">O teu perfil percebido pela IA</h2>
              <p className="text-sm text-muted-foreground">Isto é o que os recrutadores vêem quando analisam o teu CV</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="text-center pb-4 border-b border-border">
                <p className="text-lg font-bold text-foreground">{previewData.name}</p>
                <p className="text-sm text-[#C9A961] font-semibold">{previewData.role}</p>
              </div>
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
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-wider mb-2">TOP COMPETÊNCIAS DETETADAS</p>
                <div className="flex flex-wrap gap-2">
                  {previewData.skills.map((skill: string, i: number) => (
                    <span key={i} className="text-xs font-medium bg-[#C9A961]/10 text-[#C9A961] px-3 py-1 rounded-full border border-[#C9A961]/20">{skill}</span>
                  ))}
                </div>
              </div>
              {previewData.nextRole && (
                <div className="p-4 bg-gradient-to-r from-[#C9A961]/5 to-[#C9A961]/10 rounded-xl border border-[#C9A961]/20">
                  <p className="text-[10px] font-semibold text-[#C9A961] tracking-wider mb-1">PRÓXIMO PASSO DE CARREIRA MAIS PROVÁVEL</p>
                  <p className="text-base font-bold text-foreground">{previewData.nextRole}</p>
                  <p className="text-xs text-muted-foreground mt-1">Descobre o roadmap completo + recomendação final ↓</p>
                </div>
              )}
            </div>

            {/* Blurred teaser */}
            <div className="relative bg-card border border-border rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white z-10" />
              <div className="filter blur-sm select-none">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">COMPARAÇÃO ESTRATÉGICA DOS 3 CAMINHOS</p>
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
                  <p className="text-sm font-semibold text-foreground">Análise completa bloqueada</p>
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
                Desbloquear Career Intelligence — €{PRICE}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">Diagnóstico + 3 caminhos + comparação + trade-offs + recomendação final</p>
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
              <Scale className="w-5 h-5 text-[#C9A961]" />
              Career Intelligence — Pagamento
            </DialogTitle>
          </DialogHeader>

          {paymentStep === 'payment' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Career Intelligence</p>
                  <p className="text-xs text-muted-foreground">Diagnóstico + Decisão Estratégica</p>
                </div>
                <div className="text-right">
                  {couponDiscount > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground line-through">{PRICE_DISPLAY}</p>
                      <p className="text-lg font-bold text-[#C9A961]">{FINAL_PRICE_DISPLAY}€</p>
                      <p className="text-[10px] text-green-600 font-semibold">-{couponDiscount}%</p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-[#C9A961]">{PRICE_DISPLAY}</p>
                  )}
                </div>
              </div>

              {/* Coupon */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Código de desconto (opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); setCouponValid(false); setCouponDiscount(0); }}
                    placeholder="CÓDIGO"
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                  />
                  <Button
                    onClick={handleCouponValidate}
                    disabled={couponLoading || !couponCode.trim() || couponValid}
                    variant="outline"
                    className="text-sm"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : couponValid ? <Check className="w-4 h-4 text-green-500" /> : 'Aplicar'}
                  </Button>
                </div>
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                {couponValid && <p className="text-xs text-green-600 font-semibold">Desconto de {couponDiscount}% aplicado!</p>}
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

              {/* Payment method */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Método de pagamento</label>
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
                      {method === 'mbway' ? 'MB WAY' : method === 'stripe' ? 'Cartão' : 'PayPal'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'mbway' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Telemóvel (MB WAY)</label>
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
                <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">Voltar</Button>
                <Button
                  onClick={paymentMethod === 'stripe' ? handleStripePayment : paymentMethod === 'mbway' ? handleMBWayPayment : handlePayPalPayment}
                  disabled={paymentLoading}
                  className={`flex-1 font-semibold text-white ${
                    paymentMethod === 'stripe' ? 'bg-[#635BFF] hover:bg-[#5046E5]' : 'bg-[#C9A961] hover:bg-[#A88B4E]'
                  }`}
                >
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pagar ${FINAL_PRICE_DISPLAY}€`}
                </Button>
              </div>

              <button
                onClick={() => { setShowPaymentModal(false); setTimeout(() => setShowVoucherModal(true), 300); }}
                className="w-full text-sm text-[#C9A961] hover:underline flex items-center justify-center gap-1 pt-1"
              >
                <Ticket className="w-4 h-4" />
                Já tenho um código de voucher
              </button>
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
              {!pollingExpired && <p className="text-xs text-muted-foreground">A aguardar confirmação do pagamento...</p>}
              {pollingExpired && (
                <Button onClick={handleManualCheck} className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold">
                  <CheckCircle2 className="w-4 h-4 mr-2" />Já paguei — verificar novamente
                </Button>
              )}
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-base font-bold text-foreground">Pagamento confirmado!</p>
              <p className="text-sm text-muted-foreground">A gerar o teu Career Intelligence completo...</p>
              <Button onClick={handlePaymentSuccess} className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold">
                Gerar Career Intelligence
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Voucher Modal ─── */}
      <Dialog open={showVoucherModal} onOpenChange={setShowVoucherModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#C9A961]" />
              Código de Voucher
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Introduz o teu código de voucher para desbloquear o Career Intelligence.
            </p>
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Ex: CI-XXXXX-XXXXX"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
              onKeyDown={(e) => e.key === 'Enter' && handleVoucherSubmit()}
            />
            {voucherError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />{voucherError}
              </p>
            )}
            <Button
              onClick={handleVoucherSubmit}
              disabled={voucherLoading || !voucherCode.trim()}
              className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
            >
              {voucherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Unlock className="w-4 h-4 mr-2" />Validar Código</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-foreground/10 py-8 px-6 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 Share2Inspire. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="https://www.share2inspire.pt/pages/politica-privacidade.html" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="https://www.share2inspire.pt/pages/termos-condicoes.html" className="hover:text-foreground transition-colors">Termos</a>
            <a href="/career-path" className="hover:text-foreground transition-colors">Career Path</a>
            <a href="/cv-analyser" className="hover:text-foreground transition-colors">CV Analyser</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
