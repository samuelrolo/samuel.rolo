// CV Analyser v2 - Results Page - Build 2026-02-17
// Free report: ATS score, 4 quadrants, benchmarks, recruiter perception, SALARY IN BLUR
// Paid: Everything unlocked + normal curve + detailed analysis + action plan
// Payment: MB WAY + PayPal options
// Voucher: Code validation for multi-analysis plans via Supabase

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import ATSRejectionBlock from "@/components/ATSRejectionBlock";
import ATSDeepScanBlock from "@/components/ATSDeepScanBlock";
import LiveMatchPanel from "@/components/LiveMatchPanel";
import QuadrantCard from "@/components/QuadrantCard";
import DimensionBar from "@/components/DimensionBar";
import ScoreGauge from "@/components/ScoreGauge";
import RecruiterPerception from "@/components/RecruiterPerception";
import LockedSection from "@/components/LockedSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Home as HomeIcon, FileCheck, Lock, TrendingUp, Euro, Info, BarChart3, Grid2x2, Eye, AlertTriangle, Bot, CreditCard, CheckCircle2, Mail, Ticket, Unlock, Target, Sparkles, Calendar, Send, Rocket, GraduationCap, Briefcase, Globe, Users, MapPin, ExternalLink, Linkedin, Compass, Download, Copy, Award, Share2, AlertCircle, Flame, DollarSign, Shield, Star, ChevronRight, Zap, Check, Save } from "lucide-react";
import type { AnalysisData } from "@/types/analysis";
import { trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion, incrementCouponUsage } from "@/lib/affiliate";
import { getValidatedMemberPlanTier } from "@/lib/memberAuth";
import { transformGeminiResponse } from "@/lib/transformGeminiResponse";
import { fetchPaymentStatus } from "@/lib/paymentAccess";
import { redirectToCheckout } from '../lib/webviewPayment';
import { finishAndClean } from "@/lib/storageCleanup";
import { t, pick, getLang } from '@/i18n';
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";
import { saveToUserAnalyses } from '@/lib/saveToUserAnalyses';
import { couponSupportsProduct } from '@/lib/couponProductCompatibility';

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

function isLinkedInJobUrl(text: string): boolean {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return false;
  return (t.includes('linkedin.com/jobs') || t.includes('linkedin.com/job')) && t.startsWith('http');
}
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

/**
 * Update the cv_analysis record with the user's email.
 * Called when user enters email for payment or report sending.
 */
function updateAnalysisEmail(email: string) {
  try {
    const analysisId = sessionStorage.getItem('analysisId');
    if (!analysisId || !email) return;
    fetch(`${SUPABASE_URL}/rest/v1/cv_analysis?id=eq.${analysisId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ user_email: email, user_name: email.split('@')[0] }),
    }).then(res => {
      console.log('[ANALYTICS] cv_analysis email updated, status:', res.status);
    }).catch(() => {});
  } catch (e) {}
}

function updateAnalysisPayment(amount: string, method: string, transactionId?: string) {
  try {
    const analysisId = sessionStorage.getItem('analysisId');
    if (!analysisId) return;
    const numAmount = parseFloat(amount.replace(',', '.'));
    const payload: any = {
      payment_status: 'paid',
      payment_amount: numAmount,
      payment_method: method,
      analysis_type: 'paid',
    };
    if (transactionId) payload.transaction_id = transactionId;
    fetch(`${SUPABASE_URL}/rest/v1/cv_analysis?id=eq.${analysisId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
    }).then(res => {
      console.log('[ANALYTICS] cv_analysis payment updated, status:', res.status, 'amount:', numAmount);
    }).catch(() => {});
  } catch (e) {}
}

/* ─── Tooltip reusable ─── */
function Tooltip({ label, text }: { label: string; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="p-0.5 rounded-full hover:bg-muted transition-colors"
      >
        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-[#C9A961] transition-colors" />
      </button>
      {show && (
        <div className="absolute left-0 top-6 z-50 w-72 p-3 rounded-lg bg-foreground text-background text-xs leading-relaxed shadow-xl">
          <p className="font-semibold mb-1">{label}</p>
          <p>{text}</p>
          <div className="absolute -top-1.5 left-3 w-3 h-3 bg-foreground rotate-45" />
        </div>
      )}
    </div>
  );
}

/* ─── Gold Icon wrapper (Share2Inspire style) ─── */
function GoldIcon({ children, size = "w-10 h-10" }: { children: React.ReactNode; size?: string }) {
  return (
    <div className={`${size} rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0`}>
      {children}
    </div>
  );
}

/* ─── Normal Curve SVG Component ─── */
function NormalCurveChart({ percentile }: { percentile: number }) {
  const lang = getLang();
  const width = 400;
  const height = 180;
  const padding = 30;
  const curveWidth = width - padding * 2;
  const curveHeight = height - padding * 2;

  const points = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = padding + (i / 100) * curveWidth;
      const z = (i - 50) / 16.67;
      const y = padding + curveHeight - (curveHeight * 0.95 * Math.exp(-0.5 * z * z));
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }, [curveWidth, curveHeight]);

  const fillPoints = useMemo(() => {
    const pts: string[] = [`${padding},${padding + curveHeight}`];
    for (let i = 0; i <= 100; i++) {
      const x = padding + (i / 100) * curveWidth;
      const z = (i - 50) / 16.67;
      const y = padding + curveHeight - (curveHeight * 0.95 * Math.exp(-0.5 * z * z));
      pts.push(`${x},${y}`);
    }
    pts.push(`${padding + curveWidth},${padding + curveHeight}`);
    return pts.join(' ');
  }, [curveWidth, curveHeight]);

  const userX = padding + (percentile / 100) * curveWidth;
  const userZ = (percentile - 50) / 16.67;
  const userY = padding + curveHeight - (curveHeight * 0.95 * Math.exp(-0.5 * userZ * userZ));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-md mx-auto">
      <polygon points={fillPoints} fill="#C9A961" opacity="0.1" />
      <polyline points={points} fill="none" stroke="#C9A961" strokeWidth="2.5" />
      <line x1={userX} y1={userY} x2={userX} y2={padding + curveHeight} stroke="#C9A961" strokeWidth="2" strokeDasharray="4,4" />
      <circle cx={userX} cy={userY} r="6" fill="#C9A961" stroke="white" strokeWidth="2" />
      <text x={userX} y={userY - 14} textAnchor="middle" className="text-xs font-bold fill-[#C9A961]">
        {t('tu')} ({percentile}%)
      </text>
      <text x={padding} y={height - 5} textAnchor="start" className="text-[10px] fill-current text-muted-foreground">0%</text>
      <text x={padding + curveWidth / 2} y={height - 5} textAnchor="middle" className="text-[10px] fill-current text-muted-foreground">{t('mdia')}</text>
      <text x={padding + curveWidth} y={height - 5} textAnchor="end" className="text-[10px] fill-current text-muted-foreground">100%</text>
      <line x1={padding} y1={padding + curveHeight} x2={padding + curveWidth} y2={padding + curveHeight} stroke="currentColor" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

/* ─── Salary Block ─── */
function SalaryBlock({ blurred, salaryDetailed, perceivedSeniority, CUR = '€' }: { blurred: boolean; salaryDetailed?: any; perceivedSeniority?: string; CUR?: string }) {
  const lang = getLang();
  const isEN = lang === 'en';
  const isES = lang === 'es';
  const sd = salaryDetailed || { percentile25: 1400, median: 1800, percentile75: 2400, topMax: 3200, benefits: [], benefitsNote: '', source: '' };
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Euro className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('estimativa_salarial')}</p>
            <Tooltip
              label={t('como_calculada_a_estimativa')}
              text={t('estimativa_baseada_no_perfil_profissional')}
            />
          </div>
          <p className="text-xs text-muted-foreground">{pick(`Com base no perfil (${perceivedSeniority || 'N/D'}) e mercado português`, `Based on profile (${perceivedSeniority || 'N/A'}) and market data`, `Basado en el perfil (${perceivedSeniority || 'N/D'}) y los datos del mercado`)}</p>
        </div>
      </div>

      <div className="relative">
        {blurred && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
            <Lock className="w-8 h-8 text-[#C9A961] mb-2" />
            <p className="text-sm font-semibold text-foreground">{t('desbloqueia_para_ver_o_valor')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('disponvel_no_relatrio_completo')}</p>
          </div>
        )}
        <div className={blurred ? 'select-none' : ''}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-1">{t('percentil_25')}</p>
              <p className="text-xl font-bold text-foreground">{CUR}{sd.percentile25.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-[10px] text-[#C9A961] font-bold mb-1">{t('mediana')}</p>
              <p className="text-xl font-bold text-foreground">{CUR}{sd.median.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-1">{t('percentil_75')}</p>
              <p className="text-xl font-bold text-foreground">{CUR}{sd.percentile75.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-1">{t('mximo_estimado')}</p>
              <p className="text-xl font-bold text-foreground">{CUR}{sd.topMax.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Automation Risk Block ─── */
function AutomationRiskBlock({ blurred, automationRisk }: { blurred: boolean; automationRisk?: any }) {
  const lang = getLang();
  const risk = automationRisk || { score: 35, level: 'Baixo', explanation: '', impact: '' };
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Bot className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('risco_de_automao_por_ia')}</p>
          <p className="text-xs text-muted-foreground">{t('anlise_do_impacto_da_ia')}</p>
        </div>
      </div>
      <div className="relative">
        {blurred && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
            <Lock className="w-8 h-8 text-[#C9A961] mb-2" />
            <p className="text-sm font-semibold text-foreground">{t('desbloqueia_para_ver_o_risco')}</p>
          </div>
        )}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${blurred ? 'select-none' : ''}`}>
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#C9A961" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * risk.score) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-90">
                <span className="text-2xl font-bold text-foreground">{risk.score}%</span>
                <span className="text-[10px] font-bold text-[#C9A961] uppercase">{risk.level}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-foreground mb-1">{t('explicao')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{risk.explanation || t('anlise_detalhada_do_teu_perfil')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground mb-1">{t('impacto_nas_funes')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{risk.impact || t('como_a_ia_vai_transformar')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  usePageSEO(pageSeo.results);
  const [, setLocation] = useLocation();
  const lang = getLang();
  const siteHomePath = pick('/', '/en/', '/es/');

  // Analysis data
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [cvText, setCvText] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // UI State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'payment' | 'polling' | 'success'>('confirm');
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'stripe' | 'paypal'>('mbway');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pollingMessage, setPollingMessage] = useState('');
  const [showLiveMatch, setShowLiveMatch] = useState(false);
  const [savingToAccount, setSavingToAccount] = useState(false);
  const [savedToAccount, setSavedToAccount] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [highlightedActionLetter, setHighlightedActionLetter] = useState<string | null>(null);

  const P = { cv: '19,99', cp: '29,99' };
  const CUR = '€';
  const CURRENCY_CODE = 'EUR';

  useEffect(() => {
    const stored = sessionStorage.getItem('analysisData');
    const text = sessionStorage.getItem('cvText');
    const paid = sessionStorage.getItem('isPaid') === 'true';
    
    if (stored) {
      try {
        setAnalysisData(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing analysis data', e);
      }
    }
    if (text) setCvText(text);
    setIsPaid(paid);

    // Check login status
    const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (storageKey) {
      const storedAuth = localStorage.getItem(storageKey);
      if (storedAuth) {
        try {
          const p = JSON.parse(storedAuth);
          if (p?.access_token && p?.user?.id) setIsLoggedIn(true);
        } catch {}
      }
    }
  }, []);

  const handleSaveToAccount = async () => {
    if (!analysisData) return;
    setSavingToAccount(true);
    setSaveError(null);
    try {
      await saveToUserAnalyses('cv_analyser', {
        score: Math.round(analysisData.quadrants.reduce((sum, q) => sum + q.score, 0) / analysisData.quadrants.length),
        quadrants: analysisData.quadrants,
        cv_problems: analysisData.cvProblems || [],
        ats_rejection_rate: analysisData.atsRejectionRate,
        results_html: document.querySelector('main')?.innerHTML || '',
      });
      setSavedToAccount(true);
    } catch (err: any) {
      setSaveError(err.message || t('erro_ao_guardar_tenta_novamente'));
    } finally {
      setSavingToAccount(false);
    }
  };

  const openPaymentModal = (plan?: any) => {
    setPaymentStep('confirm');
    setShowPaymentModal(true);
  };

  const unlockFullReport = () => {
    setIsPaid(true);
    sessionStorage.setItem('isPaid', 'true');
  };

  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A961]" />
      </div>
    );
  }

  // Critical data check for full-page error state
  const hasCriticalData = analysisData && analysisData.candidateProfile && analysisData.candidateProfile.name;

  if (!hasCriticalData) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-foreground/10 bg-background px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a href={siteHomePath} className="flex items-center">
              <img src="/logo-s2i.webp" alt="Share2Inspire" width="220" height="48" className="h-10 w-auto object-contain" />
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
              onClick={() => setLocation(siteHomePath)} 
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

  const profileName = analysisData.candidateProfile.name || analysisData.candidateProfile.detected_name;
  const avgScore = analysisData.quadrants.reduce((sum, q) => sum + q.score, 0) / analysisData.quadrants.length;
  const percentile = Math.round(Math.min(95, Math.max(5, avgScore * 0.95)));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLocation(siteHomePath)}
              className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('voltar')}</span>
            </button>
            <a href={siteHomePath} className="flex items-center" aria-label="Share2Inspire">
              <img src="/logo-s2i.webp" alt="Share2Inspire" loading="lazy" decoding="async" width="220" height="48" className="h-10 sm:h-11 w-auto object-contain" />
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isPaid ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                <span className="text-xs sm:text-sm font-semibold text-green-600">{t('relatrio_completo')}</span>
              </div>
            ) : (
              <Button
                onClick={() => openPaymentModal()}
                size="sm"
                className="bg-[#C9A961] hover:bg-[#A88B4E] text-white text-xs sm:text-sm font-semibold px-3 sm:px-5 py-1.5 sm:py-2"
              >
                {t('desbloquear_anlise')}
              </Button>
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
          <div className="relative px-3 sm:px-8 py-5 sm:py-10">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">{profileName}</h1>
              <p className="text-base sm:text-lg text-muted-foreground font-medium">
                {analysisData.candidateProfile.perceivedRole} {analysisData.candidateProfile.perceivedSeniority && <span className="text-[#C9A961] mx-1.5">•</span>} {analysisData.candidateProfile.perceivedSeniority}
              </p>
            </div>
          </div>
        </div>

        {/* Rest of the component content... */}
      </main>
    </div>
  );
}
