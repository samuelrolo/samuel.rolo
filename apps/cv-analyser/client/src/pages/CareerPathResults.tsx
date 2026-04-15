// Career Path Results — Produto independente Share2Inspire
// Mostra preview gratuito + desbloqueia roadmap completo por €19,99
// Career Path only — no bundle


import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, ArrowLeft, Home as HomeIcon, Compass, Lock, CheckCircle2,
  Ticket, Unlock, Target, Sparkles, Calendar, Rocket, GraduationCap,
  Briefcase, Globe, Users, MapPin, ExternalLink, Linkedin, FileCheck,
  Mail, Send, TrendingUp, Award, Info, CreditCard, AlertCircle,
  Zap, DollarSign, BarChart3, Star, ChevronRight, ChevronDown, ChevronUp, Download, Copy, Check, Save, Building2
} from "lucide-react";
import { trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion, incrementCouponUsage } from "@/lib/affiliate";
import { redirectToCheckout } from '../lib/webviewPayment';
import { finishAndClean } from "@/lib/storageCleanup";
import { t, pick, getLang } from '@/i18n/translations';
import { localePath } from '@/i18n/useTranslation';
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";
import { normalizeCareerPathPayload } from "@/lib/analysisPayload";
import { fetchPaymentStatus, getFirstStoredValue } from "@/lib/paymentAccess";
import { saveToUserAnalyses } from "@/lib/saveToUserAnalyses";
import { couponSupportsProduct } from '@/lib/couponProductCompatibility';

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

const buildCandidateProfile = (analysis: any) => {
  const base = analysis?.raw || analysis?.analysis || analysis || {};
  const nested = analysis?.candidate_profile || analysis?.cv_analysis?.candidate_profile || base?.candidate_profile || analysis?.profile || base?.profile || {};

  return {
    ...nested,
    detected_name:
      nested?.detected_name ||
      nested?.name ||
      analysis?.detected_name ||
      analysis?.name ||
      analysis?.candidate_name ||
      base?.detected_name ||
      base?.name ||
      base?.candidate_name ||
      '',
    detected_role:
      nested?.detected_role ||
      nested?.primary_role ||
      analysis?.detected_role ||
      analysis?.current_role ||
      analysis?.perceivedRole ||
      base?.detected_role ||
      base?.current_role ||
      '',
    seniority:
      nested?.seniority ||
      analysis?.seniority ||
      analysis?.perceivedSeniority ||
      base?.seniority ||
      '',
    total_years_exp:
      nested?.total_years_exp ||
      analysis?.total_years_exp ||
      base?.total_years_exp ||
      '',
  };
};

/**
 * Fire-and-forget: log career path purchase to cv_analysis table for dashboard.
 * Never blocks the user flow. Errors are silently caught.
 */
function logCareerPathToSupabase(cpData: any, paymentId?: string, linkedinUrl?: string) {
  try {
    const cpEmail = (localStorage.getItem('cpPaymentEmail') || sessionStorage.getItem('cpPaymentEmail')) || null;
    const score = cpData?.career_potential_score?.overall_score || cpData?.overall_score || cpData?.score || null;
    const professionalArea = cpData?.candidate_profile?.detected_role || cpData?.candidate_profile?.primary_role || cpData?.title || cpData?.career_title || null;
    const userRating = cpData?.career_potential_score?.overall_score
      ? (cpData.career_potential_score.overall_score >= 80 ? 5 : cpData.career_potential_score.overall_score >= 65 ? 4 : cpData.career_potential_score.overall_score >= 50 ? 3 : 2)
      : null;
    fetch(`${SUPABASE_URL}/rest/v1/cv_analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_email: cpEmail,
        score,
        professional_area: professionalArea,
        user_rating: userRating,
        analysis_type: 'career_path',
        career_path_purchased: true,
        career_path_data: cpData ? JSON.stringify(cpData) : null,
        career_path_payment_id: paymentId || null,
        linkedin_url: linkedinUrl || null,
        payment_status: 'paid',
        payment_method: paymentId?.startsWith('CP-STRIPE') ? 'stripe' : paymentId?.startsWith('CP-PAYPAL') ? 'paypal' : paymentId?.startsWith('CP-VOUCHER') ? 'voucher' : 'stripe',
        payment_amount: paymentId?.startsWith('CP-VOUCHER') ? 0 : 19.99,
        transaction_id: paymentId || null,
        domain: 'share2inspire.pt',
      }),
    }).then(res => res.json()).then(data => {
      if (Array.isArray(data) && data[0]?.id) {
        localStorage.setItem('cpAnalysisId', String(data[0].id));
        console.log('[ANALYTICS] career_path logged, id:', data[0].id);
      }
    }).catch(err => {
      console.warn('[ANALYTICS] Falha ao gravar career path (nao critico):', err.message);
    });
  } catch (e) {
    // Never throw - this is purely analytics
  }
}

/* ─── Gold Icon wrapper ─── */
function GoldIcon({ children, size = "w-10 h-10" }: { children: React.ReactNode; size?: string }) {
  return (
    <div className={`${size} rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0`}>
      {children}
    </div>
  );
}

/* ─── Networking Entity Expandable Card ─── */
function NetworkingEntityCard({ entity }: { entity: any }) {
  const [expanded, setExpanded] = useState(false);
  const typeLabels: Record<string, { label: string; icon: string }> = {
    community: { label: pick('Comunidade', 'Community', 'Comunidad'), icon: '👥' },
    event: { label: pick('Evento', 'Event', 'Evento'), icon: '📅' },
    association: { label: pick('Associação', 'Association', 'Asociación'), icon: '🏛️' },
    conference: { label: pick('Conferência', 'Conference', 'Conferencia'), icon: '🎤' },
  };
  const typeInfo = typeLabels[entity.type] || typeLabels.community;
  return (
    <div className="border border-[#C9A961]/20 rounded-lg overflow-hidden bg-[#C9A961]/5 transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2.5 text-left hover:bg-[#C9A961]/10 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0">{typeInfo.icon}</span>
          <span className="text-xs font-semibold text-foreground truncate">{entity.name}</span>
          <span className="text-[9px] bg-[#C9A961]/15 text-[#C9A961] px-1.5 py-0.5 rounded shrink-0 font-medium">
            {typeInfo.label}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#C9A961] shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-[#C9A961] shrink-0" />}
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-[#C9A961]/10 pt-2">
          {entity.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{entity.description}</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {entity.location && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#C9A961]" />{entity.location}
              </span>
            )}
            {entity.frequency && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#C9A961]" />{entity.frequency}
              </span>
            )}
          </div>
          {entity.website && entity.website !== 'null' && (
            <a
              href={entity.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[#C9A961] hover:underline font-medium mt-1"
            >
              <ExternalLink className="w-3 h-3" />{t('visitar_website')}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Locked Section Preview ─── */
function LockedPreview({ title, items }: { title: string; items: string[] }) {
  const lang = getLang();
  return (
    <div className="relative bg-card border border-border rounded-xl p-5 overflow-hidden">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
        <Lock className="w-5 h-5 text-[#C9A961]" />
        <p className="text-xs font-semibold text-foreground">{t('disponvel_no_relatrio_completo')}</p>
      </div>
      <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-3">{title}</p>
      <div className="space-y-1.5 select-none">
        {items.map((item, i) => (
          <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-[#C9A961] shrink-0">→</span> {item}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ─── Plans ─── */
function getPlans(en: boolean, cur = '€', p = en ? { cv: '19.99', cp: '19.99' } : { cv: '19,99', cp: '19,99' }) {
  return [
    {
      id: 'career_path',
      name: pick('Career Path', 'Career Path', 'Career Path'),
      price: p.cp,
      priceNum: parseFloat(p.cp.replace(',', '.')),
      badge: null,
      popular: false,
      description: pick('Roadmap de carreira completo e personalizado', 'Complete and personalised career roadmap', 'Hoja de ruta profesional completa y personalizada'),
      features: [
        pick('Posicionamento atual e análise de mercado', 'Current positioning and market analysis', 'Posicionamiento actual y análisis de mercado'),
        pick('Próximos 3 cargos recomendados com roadmap', 'Next 3 recommended roles with roadmap', 'Próximos 3 puestos recomendados con hoja de ruta'),
        pick('Análise de gaps de competências', 'Skills gap analysis', 'Análisis de brechas de competencias'),
        pick('Formações e certificações recomendadas', 'Recommended training and certifications', 'Formaciones y certificaciones recomendadas'),
        pick('Estratégia de networking', 'Networking strategy', 'Estrategia de networking'),
        pick('Acções imediatas priorizadas (30/60/90 dias)', 'Prioritised immediate actions (30/60/90 days)', 'Acciones inmediatas priorizadas (30/60/90 días)'),
        pick('Simulação de percepção do recrutador', 'Recruiter perception simulation', 'Simulación de percepción del reclutador'),
        pick('Análise de risco de automação por IA', 'AI automation risk analysis', 'Análisis de riesgo de automatización por IA'),
        pick('Estimativa salarial detalhada', 'Detailed salary estimate', 'Estimación salarial detallada'),
        pick('Acesso vitalício ao relatório', 'Lifetime access to the report', 'Acceso de por vida al informe'),
      ],
      cta: pick('Desbloquear Agora', 'Unlock Now', 'Desbloquear Ahora'),
    }
  ];
}

export default function CareerPathResults() {
  usePageSEO(pageSeo.careerPathResults);

  const [, setLocation] = useLocation();

  // Analysis data
  const [cvAnalysis, setCvAnalysis] = useState<any>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [careerPathData, setCareerPathData] = useState<any>(null);
  const [isPaid, setIsPaid] = useState(() => {
    const cpPaid = localStorage.getItem('careerPathPaid') || sessionStorage.getItem('careerPathPaid');
    return cpPaid === 'true';
  });
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

  const lang = getLang();
  const isEN = lang === 'en';
  const isES = lang === 'es';
  const getAnalysisLanguage = () => ((localStorage.getItem('analysisLang') || sessionStorage.getItem('analysisLang')) || lang) as 'pt' | 'en' | 'es';

  useEffect(() => {
    const analysisLanguage = getAnalysisLanguage();
    localStorage.setItem('analysisLang', analysisLanguage);
    sessionStorage.setItem('analysisLang', analysisLanguage);
  }, [lang]);

  const handleSaveToAccount = async () => {
    setSavingToAccount(true);
    setSaveError(null);
    try {
      await saveToUserAnalyses('career_path', {
        career_potential_score: careerPathData?.career_potential_score || {},
        strategic_paths: careerPathData?.strategic_paths || [],
        action_plan_30_60_90: careerPathData?.action_plan_30_60_90 || {},
        results_html: document.querySelector('.career-path-results')?.innerHTML || '',
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
    pick("A identificar oportunidades de carreira...", "Identifying career opportunities...", "Identificando oportunidades de carrera..."),
    pick("A calcular risco de automação...", "Calculating automation risk...", "Calculando riesgo de automatización..."),
    pick("A estimar faixas salariais para o teu perfil...", "Estimating salary ranges for your profile...", "Estimando rangos salariales para tu perfil..."),
    pick("A construir o teu roadmap de desenvolvimento...", "Building your development roadmap...", "Construyendo tu roadmap de desarrollo..."),
    pick("A selecionar formações e certificações...", "Selecting training and certifications...", "Seleccionando formaciones y certificaciones..."),
    pick("A definir estratégia de networking...", "Defining networking strategy...", "Definiendo la estrategia de networking..."),
    pick("A gerar recomendações personalizadas...", "Generating personalised recommendations...", "Generando recomendaciones personalizadas..."),
    pick("A finalizar o teu Career Path...", "Finalising your Career Path...", "Finalizando tu Career Path..."),
  ];

  useEffect(() => {
    if (!isGenerating) { setGenStep(0); return; }
    const interval = setInterval(() => {
      setGenStep(prev => prev < genMessages.length - 1 ? prev + 1 : prev);
    }, 5000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const careerPathHomePath = '/career-path';
  const getCareerPathProfile = (analysis: any) => buildCandidateProfile(analysis);
  const hasCareerPathStructure = (analysis: any) => {
    if (!analysis || typeof analysis !== 'object') return false;
    return Boolean(
      analysis.career_potential_score ||
      (Array.isArray(analysis.strategic_paths) && analysis.strategic_paths.length > 0) ||
      (Array.isArray(analysis.action_plan_30_60_90) && analysis.action_plan_30_60_90.length > 0) ||
      analysis.market_context ||
      analysis.recruiter_perception
    );
  };
  const readCareerPathData = () => {
    const raw =
      localStorage.getItem('careerPathData') ||
      sessionStorage.getItem('careerPathData');

    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      const normalized = normalizeCareerPathPayload(parsed, getAnalysisLanguage());
      return hasCareerPathStructure(normalized.analysis) ? normalized.analysis : null;
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
      cleaned = cleaned.replace(/\$/g, '€');
      cleaned = cleaned.replace(/USD/gi, 'EUR');
    }
    return cleaned;
  };

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>(defaultPaymentMethod);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const CP_PRICE = 19.99;

  const openPaymentModal = () => {
    const storedEmail = (localStorage.getItem('cpPaymentEmail') || sessionStorage.getItem('cpPaymentEmail')) || '';
    const storedPhone = (localStorage.getItem('cpPaymentPhone') || sessionStorage.getItem('cpPaymentPhone')) || '';
    setEmail(storedEmail);
    setPhone(storedPhone);
    setShowPaymentModal(true);
  };

  const validateCoupon = async () => {
    if (!coupon) return;
    setCouponValidating(true);
    setCouponError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?code=eq.${coupon.toUpperCase()}&active=eq.true`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const v = data[0];
        if (!couponSupportsProduct(v, 'career_path')) {
          setCouponError(pick('Este código não é válido para este produto.', 'This code is not valid for this product.', 'Este código no es válido para este producto.'));
          return;
        }
        if (v.type === 'free') {
          unlockAndGenerate(`CP-VOUCHER-${v.code}-${Date.now()}`);
          incrementCouponUsage(v.code);
        } else {
          setCouponError(pick('Cupão de desconto aplicado!', 'Discount coupon applied!', '¡Cupón de descuento aplicado!'));
        }
      } else {
        setCouponError(pick('Código inválido ou expirado.', 'Invalid or expired code.', 'Código inválido o expirado.'));
      }
    } catch {
      setCouponError(pick('Erro ao validar código.', 'Error validating code.', 'Error al validar el código.'));
    } finally {
      setCouponValidating(false);
    }
  };

  const handlePayment = async () => {
    if (!email || (paymentMethod === 'mbway' && !phone)) {
      setPaymentError(pick('Preenche todos os campos.', 'Fill in all fields.', 'Rellena todos los campos.'));
      return;
    }
    setPaymentLoading(true);
    setPaymentError(null);
    localStorage.setItem('cpPaymentEmail', email);
    sessionStorage.setItem('cpPaymentEmail', email);
    if (phone) {
      localStorage.setItem('cpPaymentPhone', phone);
      sessionStorage.setItem('cpPaymentPhone', phone);
    }

    try {
      const res = await redirectToCheckout({
        productType: 'career_path',
        email,
        phone: paymentMethod === 'mbway' ? phone : undefined,
        method: paymentMethod,
        amount: CP_PRICE,
        originUrl: window.location.href,
        metadata: { linkedinUrl, lang: getAnalysisLanguage() }
      });
      if (!res.success) setPaymentError(res.error || 'Payment failed');
    } catch (err: any) {
      setPaymentError(err.message || 'Payment error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const generateCareerPath = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const analysisLang = getAnalysisLanguage();
      const res = await fetch(t('careerpathapi'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvAnalysis,
          linkedinUrl,
          lang: analysisLang,
          isPaid: true
        })
      });
      const data = await res.json();
      if (data?.analysis) {
        const normalized = normalizeCareerPathPayload(data, analysisLang);
        setCareerPathData(normalized.analysis);
        localStorage.setItem('careerPathData', JSON.stringify(data));
        sessionStorage.setItem('careerPathData', JSON.stringify(data));
        logCareerPathToSupabase(normalized.analysis, `CP-GEN-${Date.now()}`, linkedinUrl);
      } else {
        setGenerateError('Failed to generate career path');
      }
    } catch (err: any) {
      setGenerateError(err.message || 'Generation error');
    } finally {
      setIsGenerating(false);
    }
  };

  const unlockAndGenerate = (orderId: string) => {
    setShowPaymentModal(false);
    localStorage.setItem('careerPathPaid', 'true');
    trackPurchase('career_path_full', CP_PRICE, orderId);
    trackAffiliateConversion({ product: 'career_path_full', amount: CP_PRICE, currency: t('eur'), payment_method: paymentMethod, transaction_id: orderId });
    setIsPaid(true);
    setTimeout(() => { generateCareerPath(); }, 400);
  };

  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'success' | 'error'>('idle');
  const [pollingMsg, setPollingMsg] = useState('');
  const [pollingExpired, setPollingExpired] = useState(false);
  const pollTimer = useRef<any>(null);

  const startPolling = (orderId: string) => {
    setPollingStatus('polling');
    setPollingMsg(t('a_verificar_pagamento'));
    let attempts = 0;
    pollTimer.current = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(pollTimer.current);
        setPollingStatus('error');
        setPollingExpired(true);
        setPollingMsg(t('tempo_expirado_tenta_novamente'));
        return;
      }
      try {
        const res = await fetchPaymentStatus({ orderId, expectedProductTypes: ['career_path'] });
        if (res.success && res.paid) {
          clearInterval(pollTimer.current);
          setPollingStatus('success');
          unlockAndGenerate(orderId);
        }
      } catch {}
    }, 4000);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    await new Promise(resolve => setTimeout(resolve, 350));
    await generateCareerPath();
  };

  /* ─── Send report by email ─── */
  const handleSendReport = async () => {
    const targetEmail = reportEmail || email || (localStorage.getItem('cpPaymentEmail') || sessionStorage.getItem('cpPaymentEmail')) || '';
    if (!targetEmail) { setReportError(t('introduz_um_email_vlido')); return; }
    setReportSending(true);
    setReportError(null);
    try {
      const cpEmailRoute = t('sendcareerpathemail');
      await fetch(`${BACKEND_URL}/api/payment/${cpEmailRoute}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetEmail.split('@')[0],
          careerPathData,
        }),
      });
      setReportSent(true);
    } catch {
      setReportError(t('erro_ao_enviar_email_tenta'));
    } finally {
      setReportSending(false);
    }
  };

  useEffect(() => {
    const cv = localStorage.getItem('careerPathCvAnalysis') || sessionStorage.getItem('careerPathCvAnalysis');
    const li = localStorage.getItem('careerPathLinkedinUrl') || sessionStorage.getItem('careerPathLinkedinUrl');
    if (cv) setCvAnalysis(JSON.parse(cv));
    if (li) setLinkedinUrl(li);

    const existing = readCareerPathData();
    if (existing) setCareerPathData(existing);

    const orderId = getFirstStoredValue(['careerPathVerifiedOrderId', 'careerPathPendingOrderId']);
    const sessionId = getFirstStoredValue(['careerPathVerifiedTransactionId']);
    if (orderId || sessionId) {
      fetchPaymentStatus({ orderId, sessionId, expectedProductTypes: ['career_path'] }).then(res => {
        if (res.success && res.paid) {
          setIsPaid(true);
          localStorage.setItem('careerPathPaid', 'true');
          if (!existing && !isGenerating) generateCareerPath();
        }
      });
    }
  }, []);

  if (!cvAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A961]" />
      </div>
    );
  }

  const cpProfile = getCareerPathProfile(cvAnalysis);
  
  // Critical data check for full-page error state
  const hasCriticalData = cpProfile && cpProfile.detected_name;

  if (!hasCriticalData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-foreground/10 bg-background px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a href={siteHomePath} className="flex items-center">
              <img src="/logo-transparent.webp" alt="Share2Inspire" width="220" height="48" className="h-10 w-auto object-contain" />
            </a>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card rounded-3xl shadow-xl p-8 md:p-12 text-center border border-border">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">😕</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {t('ups_tenta_novamente')}
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {pick(
                'Não conseguimos carregar os teus resultados. Por favor, volta a tentar ou contacta o suporte se o problema persistir.',
                'We couldn\'t load your results. Please try again or contact support if the problem persists.',
                'No pudimos cargar tus resultados. Por favor, inténtalo de nuevo o contacta con soporte si el problema persiste.'
              )}
            </p>
            <Button 
              onClick={() => setLocation(careerPathHomePath)} 
              className="w-full py-6 bg-[#C9A961] hover:bg-[#A88B4E] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#C9A961]/20"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {pick('Voltar atrás', 'Go back', 'Volver atrás')}
            </Button>
          </div>
        </div>
        <footer className="border-t border-foreground/10 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Share2Inspire. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  const profileName = cpProfile.detected_name || cpProfile.name || cvAnalysis?.detected_name || cvAnalysis?.name || cvAnalysis?.candidate_name;
  const currentRole = cpProfile.detected_role || cvAnalysis?.detected_role || cvAnalysis?.current_role || cvAnalysis?.perceivedRole;
  const seniority = cpProfile.seniority || cvAnalysis?.seniority || cvAnalysis?.perceivedSeniority || '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLocation(careerPathHomePath)}
              className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('voltar')}</span>
            </button>
            <a href={localePath('/')} className="flex items-center" aria-label={pick('Share2Inspire', 'Share2Inspire', 'Share2Inspire')}>
              <img src="/logo-transparent.webp" alt={pick('Share2Inspire', 'Share2Inspire', 'Share2Inspire')} loading="lazy" decoding="async" width="220" height="48" className="h-10 sm:h-11 w-auto object-contain" />
            </a>
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              <GoldIcon size="w-6 h-6 sm:w-7 sm:h-7">
                <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C9A961]" />
              </GoldIcon>
              <span className="text-sm sm:text-base font-semibold text-foreground">{pick('Career Path', 'Career Path', 'Career Path')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isPaid ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs sm:text-sm font-semibold text-green-600">{t('relatrio_completo')}</span>
                </div>
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
                  <span className="text-xs font-semibold text-green-600">{pick('Career Path Completo', 'Full Career Path', 'Career Path Completo')}</span>
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
                {currentRole} {seniority && <span className="text-[#C9A961] mx-1.5">•</span>} {seniority}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{pick('Mercado', 'Market', 'Mercado')}</p>
                  <p className="text-xs font-semibold text-foreground">{pick('Portugal', 'Portugal', 'Portugal')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">LinkedIn</p>
                  <p className="text-xs font-semibold text-foreground truncate max-w-[120px] sm:max-w-[200px]">{linkedinUrl ? linkedinUrl.replace('https://', '').replace('www.', '') : 'N/D'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of the component content... */}
      </main>
    </div>
  );
}
