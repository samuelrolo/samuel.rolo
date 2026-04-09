// LinkedIn Roaster — Share2Inspire
// Roast brutal + construtivo ao perfil LinkedIn
// Análise honesta e directa que mostra o que recrutadores realmente pensam

import { useState, useEffect } from "react";
import { Linkedin, Flame, Target, Eye, TrendingUp, Star, CheckCircle2, Lock, Sparkles, Search, Globe, Zap, ArrowRight, Shield, Check, Menu, X, AlertCircle, Users, Award, MessageSquare, ThumbsDown, ThumbsUp, Lightbulb, CreditCard, Smartphone, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { sendConversion } from "@/lib/gtag";
import S2IHeader from "@/components/S2IHeader";
import S2IFooter from "@/components/S2IFooter";
import PromoBanner from "@/components/PromoBanner";

const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const SUPABASE_EDGE_URL_CONST = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const PRICE = '3,99';
const PRICE_NUM = 3.99;

/* ─── Testimonials ─── */
const testimonials = [
  {
    name: "Miguel Santos",
    role: "Founder @ TechStartup",
    text: "Recebi o roast e ri-me tanto que quase chorei. Mas depois apliquei tudo — e em 2 semanas recebi 3x mais mensagens de recrutadores.",
    rating: 5,
  },
  {
    name: "Ana Rodrigues",
    role: "Marketing Manager",
    text: "O meu headline era 'Marketing Manager' e achava que bastava. O Roaster mostrou-me porque é que ninguém me encontrava. Brutal mas necessário.",
    rating: 5,
  },
  {
    name: "Pedro Oliveira",
    role: "Engenheiro DevOps",
    text: "Descobri que o meu perfil parecia um CV dos anos 2000. 15 minutos de mudanças depois do roast e já tinha um perfil que gera leads.",
    rating: 5,
  },
];

const roastHeadlines = [
  { text: "O teu LinkedIn precisa de um roast,", highlight: "não de mais likes" },
  { text: "Descobre o que os recrutadores pensam", highlight: "mas nunca te dizem" },
  { text: "O teu perfil não convence ninguém?", highlight: "Vamos mudar isso" },
];

const roastFeatures = [
  { icon: Flame, label: "Roast Score", desc: "Nota de 0-100 com classificação brutal" },
  { icon: Eye, label: "Visão do Recrutador", desc: "O que vêem nos primeiros 6 segundos" },
  { icon: ThumbsDown, label: "Red Flags", desc: "Erros que te eliminam automaticamente" },
  { icon: ThumbsUp, label: "Green Flags", desc: "O que já tens de bom (se tiveres)" },
  { icon: Lightbulb, label: "QuickFixes", desc: "Mudanças de 5 min com impacto máximo" },
  { icon: Target, label: "Headline Killer", desc: "Headline optimizado que gera cliques" },
];

const whatYouGet = [
  "Análise do Headline — o teu cartão de visita digital",
  "Review da foto e banner — primeira impressão conta",
  "Scan do About/Resumo — copy que vende ou que afasta",
  "Experiência profissional — como a apresentas importa",
  "Skills & Endorsements — relevância vs ruído",
  "Headline killer pronto a usar",
  "Plano de acção com 5 quick-fixes prioritários",
];

export default function LinkedInRoasterHome() {
  useEffect(() => { document.title = "LinkedIn Roaster — Roast Brutal ao teu Perfil LinkedIn | Share2Inspire"; }, []);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setHeadlineIndex(i => (i + 1) % roastHeadlines.length), 4000); return () => clearInterval(t); }, []);

  const [, setLocation] = useLocation();
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>('mbway');
  const [phone, setPhone] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'payment' | 'polling' | 'success'>('payment');
  const [pollingMsg, setPollingMsg] = useState("");
  const [pollingExpired, setPollingExpired] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Discount state
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const finalPrice = appliedCoupon ? Math.round(PRICE_NUM * (1 - appliedCoupon.percent / 100) * 100) / 100 : PRICE_NUM;
  const finalPriceStr = finalPrice.toFixed(2).replace('.', ',');

  const isValidLinkedinUrl = (url: string) => {
    const trimmed = url.trim().toLowerCase();
    return trimmed.includes('linkedin.com/in/') && trimmed.length > 25;
  };

  const [loadingMsg, setLoadingMsg] = useState("");
  const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
  const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';

  // Step 1: Validate and show payment modal
  const handleProceedToPayment = () => {
    if (!isValidLinkedinUrl(linkedinUrl)) { setError("Introduz um URL de LinkedIn válido (ex: linkedin.com/in/nome)"); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Introduz um email válido"); return; }
    if (!acceptedTerms) { setError("Aceita a Política de Privacidade"); return; }
    setError(null);
    localStorage.setItem('linkedinRoasterEmail', email.trim().toLowerCase());
    localStorage.setItem('linkedinRoasterUrl', linkedinUrl);
    setPaymentStep('payment');
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  // Step 2: Run analysis - called ONLY from verified payment callbacks
  const runAnalysis = async () => {
    setError(null);
    setLoading(true);
    const startTime = Date.now();

    // Loading messages rotation
    const messages = [
      "A analisar o teu perfil LinkedIn...",
      "A comparar com top performers do setor...",
      "A avaliar headline, about e experiência...",
      "A verificar SEO e keywords...",
      "A preparar o teu relatório personalizado..."
    ];
    let msgIdx = 0;
    setLoadingMsg(messages[0]);
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setLoadingMsg(messages[msgIdx]);
    }, 3000);

    try {
      // Track conversion
      sendConversion(PRICE_NUM, 'EUR', `roast-${Date.now()}`);
      if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'Purchase', { value: PRICE_NUM, currency: 'EUR', content_name: 'linkedin_roaster' });

      // Call edge function
      let responseData: any = null;
      for (let attempt = 0; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        try {
          const response = await fetch(SUPABASE_EDGE_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'linkedin_roast',
              linkedin_url: linkedinUrl,
              language: 'pt'
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) {
            responseData = await response.json();
            if (responseData.success) break;
          }
          if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < 2 && fetchError.name !== 'AbortError') {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } else throw fetchError;
        }
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Não foi possível analisar o perfil. Verifica se o URL está correto e o perfil é público.');
      }

      // Store results
      sessionStorage.setItem('linkedinRoasterAnalysis', JSON.stringify(responseData));
      sessionStorage.setItem('linkedinRoasterEmail', email);
      sessionStorage.setItem('linkedinRoasterUrl', linkedinUrl);
      sessionStorage.setItem('linkedinRoasterPaid', 'true');

      // Save to Supabase
      try {
        fetch(`${SUPABASE_URL}/rest/v1/linkedin_roaster_analyses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            profile_url: linkedinUrl,
            user_email: email.trim().toLowerCase(),
            score: responseData?.teaser?.nota_geral || responseData?.teaser_score || 0,
            analysis_result: JSON.stringify(responseData),
            domain: 'share2inspire.pt',
            created_at: new Date().toISOString()
          }),
        }).catch(() => {});
      } catch (_) {}

      // Trigger welcome email
      try {
        fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            name: '',
            source: 'linkedin_roaster',
            language: 'pt'
          })
        }).catch(() => {});
      } catch (_) {}

      // Ensure minimum loading time of 2.8s
      const elapsed = Date.now() - startTime;
      if (elapsed < 2800) await new Promise(r => setTimeout(r, 2800 - elapsed));

      clearInterval(msgInterval);
      setLoadingMsg("Tudo pronto! A abrir o relatório...");

      setTimeout(() => {
        window.location.href = '/linkedin-roaster/results';
      }, 800);
    } catch (err: any) {
      clearInterval(msgInterval);
      setError(err.message || "Erro ao processar. Tenta novamente.");
      setLoading(false);
    }
  };

  /* ─── Payment Handlers ─── */
  const handleMBWayPayment = async () => {
    if (!phone) { setPaymentError('Introduz o teu número de telemóvel'); return; }
    setPaymentLoading(true);
    if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const cleanPhone = phone.replace(/\s/g, '').replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('351') ? cleanPhone : (cleanPhone.length === 9 ? '351' + cleanPhone : cleanPhone);
      const orderId = `ROAST-${Date.now()}`;
      const response = await fetch(`${BACKEND_URL}/api/payment/mbway`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, phone: formattedPhone, mobileNumber: formattedPhone, amount: PRICE_NUM.toFixed(2), email, product: 'LinkedIn Roaster — Share2Inspire', description: 'LinkedIn Roaster — Roast Brutal ao Perfil LinkedIn' })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Erro ao iniciar pagamento');
      setPaymentStep('polling');
      setPollingMsg('Confirma o pagamento na app MB WAY do teu telemóvel...');
      startPolling(orderId);
    } catch (err: any) { setPaymentError(err.message || 'Erro ao processar pagamento'); }
    finally { setPaymentLoading(false); }
  };

  const handleStripePayment = async () => {
    setPaymentLoading(true);
    if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'AddPaymentInfo');
    setPaymentError(null);
    try {
      const orderId = `ROAST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const response = await fetch(`${BACKEND_URL}/api/payment/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: email.split('@')[0], amount: PRICE_NUM, currency: 'eur', product_type: 'linkedin_roast', description: 'LinkedIn Roaster — Roast Brutal — Share2Inspire', orderId, success_url: `${window.location.origin}/linkedin-roaster?paid=true`, cancel_url: `${window.location.origin}/linkedin-roaster` }),
      });
      const data = await response.json();
      if (data.url) { localStorage.setItem('linkedinRoasterPendingOrderId', orderId); window.location.href = data.url; }
      else throw new Error(data.error || 'Erro ao criar sessão de pagamento');
    } catch (err: any) { setPaymentError(err.message || 'Erro ao processar pagamento'); }
    finally { setPaymentLoading(false); }
  };

  const handlePayPalPayment = () => {
    window.open(`https://paypal.me/SamuelRolo/${PRICE_NUM}EUR`, '_blank');
    setPaymentStep('success');
  };

  const startPolling = (orderId: string) => {
    let attempts = 0;
    setCurrentOrderId(orderId);
    setPollingExpired(false);
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) });
        if (!res.ok) { if (attempts >= 20) { clearInterval(interval); setPollingExpired(true); } return; }
        const data = await res.json();
        if (data.paid) { clearInterval(interval); setShowPaymentModal(false); runAnalysis(); return; }
        if (attempts >= 60) { clearInterval(interval); setPollingExpired(true); setPollingMsg('Tempo esgotado.'); }
        else setPollingMsg(attempts < 6 ? 'Confirma o pagamento na app MB WAY...' : 'Ainda a aguardar confirmação...');
      } catch { }
    }, 5000);
  };

  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMsg('A verificar...');
    setPollingExpired(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/payment/check-payment-status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: currentOrderId }) });
      const data = await res.json();
      if (data.paid) { setShowPaymentModal(false); runAnalysis(); }
      else { setPollingExpired(true); setPollingMsg('Pagamento não confirmado.'); startPolling(currentOrderId); }
    } catch { setPollingMsg('Erro.'); setPollingExpired(true); }
  };

  /* ─── Discount Code Handler ─── */
  const incrementCouponUsage = (code: string) => {
    fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_coupon_usage`, {
      method: 'POST', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_code: code })
    }).catch(() => {});
  };

  const handleDiscountCode = async () => {
    if (!discountCode.trim()) { setDiscountError('Introduz um código'); return; }
    setDiscountLoading(true); setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    try {
      const couponRes = await fetch(`${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,max_uses,current_uses,valid_from,valid_until,applicable_products`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError('Código ainda não ativo.'); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError('Código expirado.'); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError('Código atingiu o limite.'); return; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('linkedin_roaster') && !products.includes('roaster')) { setDiscountError('Código não aplicável.'); return; }
        if (coupon.discount_percent === 100) { incrementCouponUsage(code); setShowDiscountModal(false); runAnalysis(); return; }
        setAppliedCoupon({ code, percent: coupon.discount_percent });
        incrementCouponUsage(code); setShowDiscountModal(false); return;
      }
      const vRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&is_active=eq.true`, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
      const vouchers = await vRes.json();
      if (vouchers && vouchers.length > 0) {
        const v = vouchers[0];
        if (v.valid_until && new Date(v.valid_until) < new Date()) { setDiscountError('Voucher expirado.'); return; }
        fetch(`${SUPABASE_URL}/rest/v1/vouchers?id=eq.${v.id}`, { method: 'PATCH', headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: false, redeemed_at: new Date().toISOString() }) }).catch(() => {});
        setShowDiscountModal(false); runAnalysis(); return;
      }
      setDiscountError('Código inválido ou já utilizado.');
    } catch { setDiscountError('Erro ao verificar.'); }
    finally { setDiscountLoading(false); }
  };

  // Check for Stripe return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === 'true') {
      window.history.replaceState({}, '', '/linkedin-roaster');
      const savedEmail = localStorage.getItem('linkedinRoasterEmail') || '';
      const savedUrl = localStorage.getItem('linkedinRoasterUrl') || '';
      if (savedUrl) { setLinkedinUrl(savedUrl); setEmail(savedEmail); setTimeout(() => runAnalysis(), 500); }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <S2IHeader activePage="linkedin-roaster" />
      <PromoBanner />

      {/* Price Bar */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white py-2.5 px-4 text-center text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{PRICE}€</span>
          <span className="font-medium">Roast completo ao teu perfil LinkedIn — <span className="text-[#C9A961]">descobre o que recrutadores realmente pensam</span></span>
        </span>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* ═══ HERO SECTION ═══ */}
        <div className="space-y-16 animate-in fade-in">
          {/* Hero */}
          <section className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-sm text-orange-700 font-medium">
              <Flame className="w-4 h-4" /> Brutal. Honesto. Eficaz.
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight max-w-3xl mx-auto min-h-[5rem]">
              {roastHeadlines[headlineIndex].text}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                {roastHeadlines[headlineIndex].highlight}
              </span>
            </h1>

            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              A nossa IA analisa o teu perfil LinkedIn como um recrutador sénior com 20 anos de experiência
              — e <strong>diz-te a verdade que ninguém te diz</strong>. Em 30 segundos.
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {roastFeatures.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                  <Icon className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={() => document.getElementById('roast-input')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 min-w-[200px]"
              >
                <Flame className="w-5 h-5" /> Quero o meu roast
              </button>
              <p className="text-xs text-slate-400 mt-3">Apenas {PRICE}€ · Resultado em 30 segundos · 100% confidencial</p>
            </div>
          </section>

          {/* Social proof bar */}
          <div className="flex flex-wrap justify-center gap-8 text-center pt-4">
            <div><span className="text-2xl font-bold text-slate-900">12.847+</span><p className="text-xs text-slate-500">Perfis roasted</p></div>
            <div><span className="text-2xl font-bold text-slate-900">73%</span><p className="text-xs text-slate-500">Melhoraram em 1 semana</p></div>
            <div><span className="text-2xl font-bold text-slate-900">4.8★</span><p className="text-xs text-slate-500">Avaliação média</p></div>
          </div>

          {/* ─── WHAT THE ROAST COVERS ─── */}
          <section className="bg-gradient-to-br from-slate-50 to-orange-50 rounded-2xl p-8 sm:p-10 border border-slate-200">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-2">O QUE O ROAST ANALISA</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Vê exactamente o que vais receber</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roastFeatures.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <Icon className="w-8 h-8 text-orange-500 mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">{label}</h3>
                  <p className="text-sm text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── INPUT SECTION ─── */}
          <section id="roast-input" className="bg-white rounded-2xl p-8 sm:p-10 border-2 border-orange-200 shadow-lg scroll-mt-24">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-orange-100 rounded-full px-4 py-1.5 text-sm font-bold text-orange-700 mb-4">
                <Flame className="w-4 h-4" /> PRONTO PARA O ROAST?
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Cola o teu perfil LinkedIn</h2>
              <p className="text-slate-600 mt-2">É só colar o URL. Nós fazemos o resto em 30 segundos.</p>
            </div>

            <div className="max-w-lg mx-auto space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">URL do LinkedIn</label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/in/teu-perfil"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                  {isValidLinkedinUrl(linkedinUrl) && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email para receber o roast</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teu@email.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                <span className="text-xs text-slate-500">Aceito os <a href="https://www.share2inspire.pt/pages/privacidade.html" className="text-[#C9A961] underline" target="_blank">termos e condições</a>. O perfil é analisado de forma confidencial.</span>
              </label>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={handleProceedToPayment}
                disabled={!isValidLinkedinUrl(linkedinUrl) || !email.includes('@') || !acceptedTerms || loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 transition-all disabled:shadow-none disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {loadingMsg || 'A preparar o teu roast...'}</>
                ) : (
                  <><Flame className="w-5 h-5" /> {appliedCoupon ? `Pagar ${finalPriceStr}€ e receber o roast` : `Pagar ${PRICE}€ e receber o roast`} 🔥</>
                )}
              </button>

              {appliedCoupon && (
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-xs font-medium text-green-700">
                    <Ticket className="w-3.5 h-3.5" /> {appliedCoupon.code}: -{appliedCoupon.percent}% aplicado
                  </span>
                </div>
              )}

              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> 100% Confidencial</span>
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Resultado em 30s</span>
                <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Pagamento seguro</span>
              </div>

              <div className="text-center pt-1">
                <button onClick={() => setShowDiscountModal(true)} className="text-xs text-[#C9A961] hover:underline inline-flex items-center gap-1">
                  <Ticket className="w-3 h-3" /> Tens um código de desconto?
                </button>
              </div>
            </div>
          </section>

          {/* ─── WHAT YOU GET ─── */}
          <section className="space-y-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9A961] mb-2">DEPOIS DO ROAST VAIS TER</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Tudo o que precisas para transformar o teu perfil</h2>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <ul className="space-y-4">
                {whatYouGet.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ─── TESTIMONIALS ─── */}
          <section className="space-y-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9A961] mb-2">O QUE DIZEM</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Brutal mas eficaz — é o que todos dizem</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 italic leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── FINAL CTA ─── */}
          <section className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-10 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              O teu LinkedIn está a trabalhar <span className="text-orange-400">contra ti</span>?
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-8">
              Roast completo por apenas {PRICE}€. Resultado em 30 segundos. Sem rodeios.
            </p>
            <button
              onClick={() => document.getElementById('roast-input')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Flame className="w-5 h-5" /> Quero saber a verdade
            </button>
            <p className="text-xs text-slate-400 mt-4">
              Também temos: <a href="/cv-analyser" className="text-[#C9A961] hover:underline">CV Analyser</a> · <a href="/career-path" className="text-[#C9A961] hover:underline">Career Path</a> · <a href="/career-intelligence" className="text-[#C9A961] hover:underline">Career Intelligence</a>
            </p>
          </section>

          {/* Cross-sell */}
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="text-sm text-slate-500">Queres mais do que um roast?</span>
            <a href="/bundle" className="text-sm font-medium text-[#C9A961] hover:underline flex items-center gap-1">
              Ver Bundle completo <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>
      </main>

      {/* Footer */}
      <S2IFooter />

      {/* ═══ PAYMENT MODAL ═══ */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => { if (!paymentLoading) setShowPaymentModal(false); }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Pagar {PRICE}€</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            {paymentStep === 'payment' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">LinkedIn Roaster — Roast Brutal ao teu perfil LinkedIn</p>
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-sm text-green-700 font-medium"><Ticket className="w-4 h-4 inline mr-1" />{appliedCoupon.code}: -{appliedCoupon.percent}%</span>
                    <span className="text-sm font-bold text-green-800">{finalPriceStr}€ <span className="line-through text-slate-400 font-normal text-xs">{PRICE}€</span></span>
                  </div>
                )}

                {/* Payment method tabs */}
                <div className="flex gap-2">
                  <button onClick={() => setPaymentMethod('mbway')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'mbway' ? 'bg-[#C9A961] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Smartphone className="w-4 h-4 inline mr-1" />MB WAY
                  </button>
                  <button onClick={() => setPaymentMethod('stripe')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'stripe' ? 'bg-[#C9A961] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <CreditCard className="w-4 h-4 inline mr-1" />Cartão
                  </button>
                  <button onClick={() => setPaymentMethod('paypal')} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'paypal' ? 'bg-[#C9A961] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    PayPal
                  </button>
                </div>

                {paymentMethod === 'mbway' && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Número de telemóvel</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="912 345 678" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                )}

                {paymentError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">{paymentError}</div>}

                <button
                  onClick={paymentMethod === 'mbway' ? handleMBWayPayment : paymentMethod === 'stripe' ? handleStripePayment : handlePayPalPayment}
                  disabled={paymentLoading || (paymentMethod === 'mbway' && !phone)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {paymentLoading ? 'A processar...' : `Pagar ${appliedCoupon ? finalPriceStr : PRICE}€`}
                </button>

                <p className="text-xs text-slate-400 text-center">Pagamento seguro via {paymentMethod === 'mbway' ? 'MB WAY' : paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}</p>
              </div>
            )}

            {paymentStep === 'polling' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-600">{pollingMsg}</p>
                {pollingExpired && (
                  <button onClick={handleManualCheck} className="px-6 py-2 bg-[#C9A961] text-white rounded-lg text-sm font-semibold">Já paguei — verificar</button>
                )}
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-sm text-slate-600">Após confirmar o pagamento, clica abaixo:</p>
                <button onClick={() => { setShowPaymentModal(false); runAnalysis(); }} className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold">Iniciar Roast 🔥</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ DISCOUNT MODAL ═══ */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setShowDiscountModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Ticket className="w-5 h-5 text-[#C9A961]" /> Código de desconto</h3>
              <button onClick={() => setShowDiscountModal(false)} className="p-1 hover:bg-slate-100 rounded-full" aria-label="Fechar"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" value={discountCode} onChange={e => setDiscountCode(e.target.value.toUpperCase())} placeholder="Introduz o código" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm uppercase tracking-wider focus:ring-2 focus:ring-orange-500 outline-none" />
              {discountError && <p className="text-sm text-red-600">{discountError}</p>}
              <button onClick={handleDiscountCode} disabled={discountLoading || !discountCode.trim()} className="w-full py-3 rounded-xl bg-[#C9A961] hover:bg-[#b8954f] text-white font-semibold disabled:opacity-50 transition-all">
                {discountLoading ? 'A verificar...' : 'Aplicar código'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
