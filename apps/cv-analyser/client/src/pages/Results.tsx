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
import { getMemberPlanTier } from "@/lib/memberAuth";
import { transformGeminiResponse } from "@/lib/transformGeminiResponse";
import { redirectToCheckout } from '../lib/webviewPayment';
import { finishAndClean } from "@/lib/storageCleanup";
import { t, pick, getLang } from '@/i18n';

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';

function isLinkedInJobUrl(text: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  return (t.includes('linkedin.com/jobs') || t.includes('linkedin.com/job')) && t.startsWith('http');
}
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

/**
 * Save analysis result to user_analyses table if user is authenticated via Supabase.
 * Checks for existing Supabase session and saves the analysis data.
 */
async function saveToUserAnalyses(analysisType: string, data: Record<string, any>): Promise<boolean> {
  // Try to get Supabase session from localStorage
  const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  if (!storageKey) {
    console.warn('[S2I] No Supabase auth token found in localStorage');
    throw new Error('NOT_LOGGED_IN');
  }
  const stored = localStorage.getItem(storageKey);
  if (!stored) throw new Error('NOT_LOGGED_IN');
  const parsed = JSON.parse(stored);
  let accessToken = parsed?.access_token;
  const refreshToken = parsed?.refresh_token;
  const userId = parsed?.user?.id;
  if (!accessToken || !userId) throw new Error('NOT_LOGGED_IN');

  // Check if we already saved this analysis (avoid duplicates)
  const dedupKey = `s2i_saved_${analysisType}_${sessionStorage.getItem('analysisId') || Date.now()}`;
  if (sessionStorage.getItem(dedupKey)) return true; // Already saved

  const payload = {
    user_id: userId,
    analysis_type: analysisType,
    data: { ...data, captured_at: new Date().toISOString() },
    created_at: new Date().toISOString()
  };

  // First attempt with current access token
  let res = await fetch(`${SUPABASE_URL}/rest/v1/user_analyses`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  // If 401, try to refresh the token and retry
  if (res.status === 401 && refreshToken) {
    console.log('[S2I] Access token expired, attempting refresh...');
    try {
      const refreshRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      if (refreshRes.ok) {
        const newSession = await refreshRes.json();
        accessToken = newSession.access_token;
        // Update localStorage with new session
        localStorage.setItem(storageKey, JSON.stringify(newSession));
        console.log('[S2I] Token refreshed successfully, retrying save...');
        // Retry the save with new token
        res = await fetch(`${SUPABASE_URL}/rest/v1/user_analyses`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
      } else {
        console.warn('[S2I] Token refresh failed:', refreshRes.status);
        throw new Error('SESSION_EXPIRED');
      }
    } catch (refreshErr: any) {
      if (refreshErr.message === 'SESSION_EXPIRED') throw refreshErr;
      console.warn('[S2I] Token refresh error:', refreshErr);
      throw new Error('SESSION_EXPIRED');
    }
  }

  if (res.ok) {
    sessionStorage.setItem(dedupKey, 'true');
    console.log('[S2I] Analysis saved to user_analyses:', analysisType);
    return true;
  } else {
    const errText = await res.text().catch(() => '');
    console.error('[S2I] Save failed:', res.status, errText);
    throw new Error(res.status === 401 ? 'SESSION_EXPIRED' : `SAVE_FAILED_${res.status}`);
  }
}

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
              <p className="text-[10px] text-muted-foreground">{t('ms_bruto')}</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-[10px] text-muted-foreground mb-1">{t('mediana')}</p>
              <p className="text-xl font-bold text-[#C9A961]">{CUR}{sd.median.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{t('ms_bruto')}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-1">{t('percentil_75')}</p>
              <p className="text-xl font-bold text-foreground">{CUR}{sd.percentile75.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{t('ms_bruto')}</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20">
              <p className="text-[10px] text-muted-foreground mb-1">{t('top_perfis_de_topo')}</p>
              <p className="text-xl font-bold text-[#C9A961]">{CUR}{sd.topMax.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{t('ms_bruto')}</p>
            </div>
          </div>

          {/* Benefits section - only when paid */}
          {!blurred && sd.benefits && sd.benefits.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-foreground mb-3">{pick(`Benefícios típicos para ${perceivedSeniority || 'este nível'} na indústria:`, `Typical benefits for ${perceivedSeniority || 'this level'} in the industry:`, `Beneficios típicos para ${perceivedSeniority || 'este nivel'} en la industria:`)}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sd.benefits.map((b: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-[#C9A961] mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              {sd.benefitsNote && (
                <p className="text-xs text-muted-foreground mt-3 italic">{sd.benefitsNote}</p>
              )}
              {sd.source && (
                <p className="text-[10px] text-muted-foreground/60 mt-2">{t('fonte')}: {sd.source}</p>
              )}
            </div>
          )}

          {blurred && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {t('valores_estimados_com_base_em')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Automation Risk ─── */
function AutomationRiskBlock({ blurred, automationRisk }: { blurred: boolean; automationRisk?: any }) {
  const lang = getLang();
  const isEN = lang === 'en';
  const isES = lang === 'es';
  const ar = automationRisk || { percentage: 35, level: t('mdio'), description: t('anlise_detalhada_do_risco_de'), recommendations: [] };
  const barColor = ar.percentage <= 25 ? 'from-green-400 to-green-500' : ar.percentage <= 50 ? 'from-yellow-400 to-orange-400' : 'from-orange-400 to-red-500';
  const levelColor = ar.percentage <= 25 ? 'text-green-600 bg-green-500/10' : ar.percentage <= 50 ? 'text-yellow-600 bg-yellow-500/10' : 'text-red-600 bg-red-500/10';
  return (
    <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Bot className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('potencial_de_substituio_por_ia')}</p>
            <Tooltip
              label={t('o_que_o_potencial_de')}
              text={t('estimativa_da_probabilidade_de_as')}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('risco_de_automao_da_tua')}</p>
        </div>
      </div>

      <div className="relative">
        {blurred && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
            <Lock className="w-6 h-6 text-[#C9A961] mb-2" />
            <p className="text-sm font-semibold text-foreground">{t('disponvel_no_relatrio_completo')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('descobre_o_risco_de_automao')}</p>
          </div>
        )}
        <div className={blurred ? 'select-none' : ''}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('baixo_risco')}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${levelColor}`}>{ar.level} — {ar.percentage}%</span>
              </div>
              <span className="text-xs text-muted-foreground">{t('alto_risco')}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`} style={{ width: `${ar.percentage}%` }} />
            </div>
            {!blurred && (
              <>
                <p className="text-sm text-muted-foreground">{ar.description}</p>
                {ar.recommendations && ar.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-foreground mb-2">{t('recomendaes_para_mitigar_o_risco')}</p>
                    {ar.recommendations.map((r: string, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground flex items-start gap-2 mb-1">
                        <span className="text-[#C9A961] shrink-0">→</span> {r}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
            {blurred && <p className="text-sm text-muted-foreground">{t('anlise_detalhada_do_risco_de_2')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PayPal SVG Icon ─── */
function PayPalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
    </svg>
  );
}

export default function Results() {
  const lang = getLang();
  useEffect(() => { document.title = "Resultados da Análise de CV | Share2Inspire"; }, []);

  const [, setLocation] = useLocation();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'payment' | 'polling' | 'success'>('confirm');
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'paypal' | 'stripe'>(() => {
    const pEN = window.location.pathname.startsWith('/en/');
    const pPT = !pEN && (window.location.pathname.startsWith('/cv-analyser') || window.location.pathname.startsWith('/career-path'));
    if (pEN) return 'stripe';
    if (pPT) return 'mbway';
    return sessionStorage.getItem('analysisLang') === 'en' ? 'stripe' : 'mbway';
  });
  const isEN = lang === 'en';

  // Currency & pricing: PT = EUR, EN = USD
  const CUR = t('bca53fde');
  const P = isEN
    ? { cv: '9.99', cp: '19.99', career: '19.99' }
    : { cv: '9,99', cp: '19,99', career: '19,99' };
  const CURRENCY_CODE = t('eur');
  const [pollingMessage, setPollingMessage] = useState(() => {
    const pEN = window.location.pathname.startsWith('/en/');
    const pPT = !pEN && (window.location.pathname.startsWith('/cv-analyser') || window.location.pathname.startsWith('/career-path'));
    const en = pEN ? true : pPT ? false : sessionStorage.getItem('analysisLang') === 'en';
    return pick('A aguardar aprovação no MB WAY...', 'Waiting for MB WAY approval...', 'Esperando la aprobación en MB WAY...');
  });
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string; analyses: number; voucher_type?: string; includes_career_path?: boolean }>({
    name: t('relatrio_cv'),
    price: t('999'),
    analyses: 1,
    voucher_type: 'standard',
    includes_career_path: false,
  });

  // Upsell popup state (shown during analysis loading)

  
  // Unified discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null);
  // Applied partial discount coupon
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const getDiscountedPrice = (price: string) => {
    if (!appliedCoupon) return price;
    const num = parseFloat(price.replace(',', '.'));
    const discounted = Math.round(num * (1 - appliedCoupon.percent / 100) * 100) / 100;
    return lang === 'en' ? discounted.toFixed(2) : discounted.toFixed(2).replace('.', ',');
  };
  const getDiscountedPriceNum = (price: string) => {
    const num = parseFloat(price.replace(',', '.'));
    if (!appliedCoupon) return num;
    return Math.round(num * (1 - appliedCoupon.percent / 100) * 100) / 100;
  };

  // Email report state
  const [reportEmail, setReportEmail] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [postCopied, setPostCopied] = useState(false);
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

  const handleSaveToAccount = async () => {
    setSavingToAccount(true);
    setSaveError(null);
    try {
      const cvData = sessionStorage.getItem('cvAnalysis');
      const parsed = cvData ? JSON.parse(cvData) : {};
      await saveToUserAnalyses('cv_analyser', {
        score: parsed.atsScore || parsed.overallScore || parsed.score,
        analysis: {
          atsScore: parsed.atsScore,
          overallScore: parsed.overallScore,
          keywords: parsed.keywords,
          recommendations: parsed.recommendations,
        },
        results_html: document.querySelector('.results-container')?.innerHTML || '',
        analysis_id: sessionStorage.getItem('analysisId'),
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

  // Career Path state
  const [careerPathData, setCareerPathData] = useState<any>(null);
  const [careerPathLoading, setCareerPathLoading] = useState(false);
  const [careerPathError, setCareerPathError] = useState<string | null>(null);
  const [showCareerPathModal, setShowCareerPathModal] = useState(false);
  const [careerPathIsUpgrade, setCareerPathIsUpgrade] = useState(false); // true when coming from post-CV upsell (14.99)
  const [careerPathLinkedin, setCareerPathLinkedin] = useState("");
  const [careerPathEmail, setCareerPathEmail] = useState("");
  const [careerPathPhone, setCareerPathPhone] = useState("");
  const [careerPathPaymentStep, setCareerPathPaymentStep] = useState<'info' | 'payment' | 'polling' | 'generating' | 'done'>('info');
  const [careerPathPaymentMethod, setCareerPathPaymentMethod] = useState<'mbway' | 'paypal' | 'stripe'>(() => {
    const pEN = window.location.pathname.startsWith('/en/');
    const pPT = !pEN && (window.location.pathname.startsWith('/cv-analyser') || window.location.pathname.startsWith('/career-path'));
    if (pEN) return 'stripe';
    if (pPT) return 'mbway';
    return sessionStorage.getItem('analysisLang') === 'en' ? 'stripe' : 'mbway';
  });
  const [careerPathPollingMsg, setCareerPathPollingMsg] = useState('');
  const [cvText, setCvText] = useState('');
  const [showLiveMatch, setShowLiveMatch] = useState(false);
  const [jobScrapeStatus, setJobScrapeStatus] = useState<'idle' | 'scraping' | 'reanalyzing' | 'done' | 'error'>('idle');
  const [jobScrapeMessage, setJobScrapeMessage] = useState('');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const loadingMessages = [
    pick('A analisar o teu perfil profissional...', 'Analysing your professional profile...', 'Analizando tu perfil profesional...'),
    pick('A mapear trajectórias de progressão...', 'Mapping career progression paths...', 'Mapeando trayectorias de progresión...'),
    pick('A identificar próximos cargos recomendados...', 'Identifying recommended next roles...', 'Identificando los próximos puestos recomendados...'),
    pick('A cruzar CV com LinkedIn...', 'Cross-referencing CV with LinkedIn...', 'Cruzando el CV con LinkedIn...'),
    pick('A gerar plano de formação personalizado...', 'Generating personalised training plan...', 'Generando un plan de formación personalizado...'),
    pick('A construir o teu roadmap de carreira a 5 anos...', 'Building your 5-year career roadmap...', 'Construyendo tu hoja de ruta profesional a 5 años...'),
    pick('A preparar o teu relatório Career Path...', 'Preparing your Career Path report...', 'Preparando tu informe de Career Path...'),
  ];
  useEffect(() => {
    if (careerPathPaymentStep !== 'generating') return;
    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % loadingMessages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [careerPathPaymentStep, loadingMessages.length]);

  useEffect(() => {
    const data = sessionStorage.getItem('cvAnalysis');
    if (!data) {
      setLocation('/');
      return;
    }
    try {
      setAnalysisData(JSON.parse(data));
    } catch (err) {
      console.error('Error parsing analysis data:', err);
      setLocation('/');
    }
    
    // Load CV text for Live Match
    const storedCvText = sessionStorage.getItem('cvText');
    if (storedCvText) setCvText(storedCvText);

    // Check if already paid (from previous session)
    const paidStatus = sessionStorage.getItem('isPaid');
    if (paidStatus === 'true') {
      setIsPaid(true);
    }

    // Auto-unlock for active members (Essential, Growth, or Pro)
    const memberTier = getMemberPlanTier();
    if (memberTier && memberTier !== 'none') {
      setIsPaid(true);
      sessionStorage.setItem('isPaid', 'true');
    }

    // Restore applied coupon from sessionStorage (set by Home.tsx / HomeEN.tsx)
    const savedCouponCode = sessionStorage.getItem('appliedCouponCode');
    const savedCouponPercent = sessionStorage.getItem('appliedCouponPercent');
    if (savedCouponCode && savedCouponPercent) {
      setAppliedCoupon({ code: savedCouponCode, percent: parseInt(savedCouponPercent, 10) });
      // Clean up so it's not re-applied on next visit
      sessionStorage.removeItem('appliedCouponCode');
      sessionStorage.removeItem('appliedCouponPercent');
    }
    // Also restore coupon from Stripe redirect
    const stripeCoupon = sessionStorage.getItem('appliedCouponBeforeStripe');
    if (stripeCoupon) {
      try {
        setAppliedCoupon(JSON.parse(stripeCoupon));
        sessionStorage.removeItem('appliedCouponBeforeStripe');
      } catch (_) {}
    }

    // Restore Career Path data from sessionStorage (survives page refresh)
    const savedCareerPathData = sessionStorage.getItem('careerPathData');
    if (savedCareerPathData) {
      try {
        const cpParsed = JSON.parse(savedCareerPathData);
        setCareerPathData(cpParsed);
        setCareerPathPaymentStep('done');
        sessionStorage.setItem('careerPathIncluded', 'true');
        console.log('[Results] Restored Career Path data from sessionStorage');
      } catch (e) {
        console.warn('[Results] Error restoring Career Path data:', e);
      }
    }

    // Check for Stripe payment return
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    // Handle cancelled payment — clean URL and redirect to home
    if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
      setLocation(t('6666cd76'));
      return;
    }

    if (paymentStatus === 'success' && sessionId) {
      // Restore selectedPlan from sessionStorage (lost during Stripe redirect)
      const savedPlan = sessionStorage.getItem('selectedPlanBeforeStripe');
      let restoredPlan: any = null;
      if (savedPlan) {
        try {
          restoredPlan = JSON.parse(savedPlan);
          setSelectedPlan(restoredPlan);
        } catch (e) { console.error('Error restoring plan:', e); }
        sessionStorage.removeItem('selectedPlanBeforeStripe');
      }

      // Verify payment with backend
      fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/stripe-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.paid) {
            setIsPaid(true);
            sessionStorage.setItem('isPaid', 'true');
            const priceVal = restoredPlan ? parseFloat(String(restoredPlan.price).replace(',', '.')) : 9.99;
            const productName = restoredPlan?.includes_career_path ? 'bundle' : 'cv_analyser';
            trackPurchase(productName, priceVal, `CV-STRIPE-${sessionId}`);
            if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: priceVal, currency: t('eur')});
            trackAffiliateConversion({ product: productName, amount: priceVal, currency: t('eur'), payment_method: 'stripe', transaction_id: `CV-STRIPE-${sessionId}` });
            updateAnalysisPayment(String(priceVal), 'stripe', `CV-STRIPE-${sessionId}`);

            // If bundle plan, auto-trigger Career Path flow
            if (restoredPlan?.includes_career_path) {
              sessionStorage.setItem('careerPathIncluded', 'true');
              const savedEmail = sessionStorage.getItem('paymentEmail') || '';
              setCareerPathEmail(savedEmail);
              // Show payment modal in success state with LinkedIn input
              setPaymentStep('success');
              setShowPaymentModal(true);
            }

            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
          }
        })
        .catch(err => console.error('Stripe verify error:', err));
    }
    // Auto-generate Career Path when coming from Bundle flow
    const bundleCareerPathPaid = sessionStorage.getItem('careerPathPaid');
    if (bundleCareerPathPaid === 'true') {
      sessionStorage.setItem('careerPathIncluded', 'true');
      const bundleLinkedin = sessionStorage.getItem('careerPathLinkedinUrl') || '';
      const bundleEmail = sessionStorage.getItem('paymentEmail') || '';
      setCareerPathLinkedin(bundleLinkedin);
      setCareerPathEmail(bundleEmail);
      setCareerPathPaymentStep('generating');
      // Remove flag so it doesn't re-trigger on refresh
      sessionStorage.removeItem('careerPathPaid');
      // DEFINITIVE FIX: Call the Career Path API directly here, reading all data
      // from sessionStorage (not React state) to avoid race conditions.
      // We use a self-invoking async function to call the API immediately.
      (async () => {
        console.log('[Bundle→CareerPath] Auto-generating Career Path...');
        try {
          // Use the actual CV text stored by BundleHome, NOT the transformed analysis JSON
          const cvTextForCP = sessionStorage.getItem('careerPathCvText') || '';
          const linkedinForCP = sessionStorage.getItem('careerPathLinkedinUrl') || bundleLinkedin || '';
          console.log('[Bundle→CareerPath] cv_text length:', cvTextForCP.length, 'linkedin:', linkedinForCP ? 'yes' : 'no');
          const cpResponse = await fetch(`${SUPABASE_URL}/functions/v1/hyper-task`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              mode: 'career_path',
              cv_text: cvTextForCP,
              linkedin_url: linkedinForCP || undefined,
              language: t('pt'),
              country: sessionStorage.getItem('analysisCountry') || (t('portugal')),
              region: sessionStorage.getItem('analysisRegion') || '',
            })
          });
          const cpData = await cpResponse.json();
          console.log('[Bundle→CareerPath] Response:', cpData.success, !!cpData.career_path);
          if (cpData.success || cpData.career_path) {
            const cpResult = cpData.career_path || cpData;
            setCareerPathData(cpResult);
            setCareerPathPaymentStep('done');
            // Also persist to sessionStorage so it survives page refresh
            sessionStorage.setItem('careerPathData', JSON.stringify(cpResult));
          } else {
            console.error('[Bundle→CareerPath] API error:', cpData.error);
            setCareerPathError(cpData.error || 'Erro ao gerar Career Path');
          }
        } catch (cpErr: any) {
          console.error('[Bundle→CareerPath] Fetch error:', cpErr);
          setCareerPathError(cpErr.message || 'Erro ao gerar Career Path');
        }
      })();
    }
  }, [setLocation]);
  // Upsell popup removed — only show payment modal when user clicks "Unlock Full Analysis""

  const unlockFullReport = useCallback(() => {
    setIsPaid(true);
    sessionStorage.setItem('isPaid', 'true');

    // ── LinkedIn Job Scraping (post-payment only) ──
    // If the user pasted a LinkedIn URL, scrape the real JD and re-analyse
    const savedJobDesc = sessionStorage.getItem('jobDescription') || '';
    if (isLinkedInJobUrl(savedJobDesc)) {
      (async () => {
        try {
          setJobScrapeStatus('scraping');
          setJobScrapeMessage(t('a_extrair_descrio_real_da'));
          console.log('[JOB_SCRAPE] Detected LinkedIn URL, scraping:', savedJobDesc);

          const scrapeRes = await fetch(`${BACKEND_URL}/api/scrape-linkedin-job`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_url: savedJobDesc })
          });
          const scrapeData = await scrapeRes.json();

          if (scrapeData.success && scrapeData.job_data?.full_text) {
            const realJobText = scrapeData.job_data.full_text;
            console.log('[JOB_SCRAPE] Got real JD:', realJobText.substring(0, 200));

            // Store the scraped job text for Live Match
            sessionStorage.setItem('scrapedJobText', realJobText);
            sessionStorage.setItem('scrapedJobTitle', scrapeData.job_data.title || '');

            // Re-analyse with the real job description
            setJobScrapeStatus('reanalyzing');
            setJobScrapeMessage(t('a_reanalisar_cv_com_requisitos'));

            const storedCvText = sessionStorage.getItem('cvText') || '';
            const storedCvFile = sessionStorage.getItem('cvFile') || '';
            const country = sessionStorage.getItem('analysisCountry') || 'Portugal';
            const region = sessionStorage.getItem('analysisRegion') || '';

            const requestBody: any = {
              mode: 'cv_extraction',
              country,
              region: region || undefined,
              job_description: realJobText.substring(0, 5000)
            };

            if (storedCvFile) {
              requestBody.file = storedCvFile;
              requestBody.filename = sessionStorage.getItem('cvFilename') || 'cv.pdf';
            } else if (storedCvText) {
              requestBody.cv_text = storedCvText.substring(0, 8000);
            }

            const reanalysisRes = await fetch(SUPABASE_EDGE_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
            });

            if (reanalysisRes.ok) {
              const reanalysisData = await reanalysisRes.json();
              if (reanalysisData.success) {
                const newSource = reanalysisData.analysis || reanalysisData;
                const newResult = transformGeminiResponse(newSource);
                console.log('[JOB_SCRAPE] Re-analysis complete. New jobMatch:', newResult.jobMatch?.jobTitle);

                // Update analysis data with the new results
                setAnalysisData(newResult);
                sessionStorage.setItem('cvAnalysis', JSON.stringify(newResult));

                setJobScrapeStatus('done');
                setJobScrapeMessage(pick(`Análise atualizada com dados reais de "${scrapeData.job_data.title}"`, `Analysis updated with real data from "${scrapeData.job_data.title}"`, `Análisis actualizado con datos reales de "${scrapeData.job_data.title}"`));
              } else {
                console.warn('[JOB_SCRAPE] Re-analysis failed:', reanalysisData.error);
                setJobScrapeStatus('done');
                setJobScrapeMessage(pick(`Vaga extraída: "${scrapeData.job_data.title}" — use o Live Match para comparação detalhada`, `Job extracted: "${scrapeData.job_data.title}" — use Live Match for detailed comparison`, `Oferta extraída: "${scrapeData.job_data.title}" — usa Live Match para una comparación detallada`));
              }
            } else {
              console.warn('[JOB_SCRAPE] Re-analysis HTTP error:', reanalysisRes.status);
              setJobScrapeStatus('done');
              setJobScrapeMessage(pick(`Vaga extraída: "${scrapeData.job_data.title}" — use o Live Match para comparação detalhada`, `Job extracted: "${scrapeData.job_data.title}" — use Live Match for detailed comparison`, `Oferta extraída: "${scrapeData.job_data.title}" — usa Live Match para una comparación detallada`));
            }
          } else {
            console.warn('[JOB_SCRAPE] Scraping failed:', scrapeData.error);
            setJobScrapeStatus('error');
            setJobScrapeMessage(t('no_foi_possvel_extrair_detalhes'));
          }
        } catch (err: any) {
          console.error('[JOB_SCRAPE] Error:', err);
          setJobScrapeStatus('error');
          setJobScrapeMessage(t('erro_ao_extrair_vaga_use'));
        }
      })();
    }

    // Save to user_analyses for area-cliente dashboard
    // IMPORTANT: Delay capture until after React re-renders with isPaid=true
    // so we capture the UNLOCKED content, not the blurred/locked version
    setTimeout(async () => {
      try {
        const cvData = sessionStorage.getItem('cvAnalysis');
        if (cvData) {
          const parsed = JSON.parse(cvData);
          await saveToUserAnalyses('cv_analyser', {
            score: parsed.atsScore || parsed.overallScore || parsed.score,
            analysis: {
              atsScore: parsed.atsScore,
              overallScore: parsed.overallScore,
              keywords: parsed.keywords,
              recommendations: parsed.recommendations,
            },
            results_html: document.querySelector('.results-container')?.innerHTML || '',
            analysis_id: sessionStorage.getItem('analysisId'),
          });
          setSavedToAccount(true);
        }
      } catch (e: any) {
        console.warn('[S2I] Auto-save after payment failed:', e?.message);
        // Don't block the user - they can still manually save later
      }
    }, 1500); // Wait 1.5s for React to re-render unlocked content
  }, [isEN]);

  const openPaymentModal = (plan?: { name: string; price: string; analyses: number }) => {
    if (plan) {
      setSelectedPlan(plan);
    }
    
    // Clear old payment state to avoid checking expired payments
    sessionStorage.removeItem('orderId');
    sessionStorage.removeItem('requestId');
    sessionStorage.removeItem('paymentEmail');
    
    setShowPaymentModal(true);
    setPaymentStep('confirm');
    setPaymentError(null);
    setPollingMessage(t('a_aguardar_aprovao_no_mb'));
  };

  const handleStripePayment = async () => {
    if (!email) {
      setPaymentError(pick('Por favor, introduz o teu email', 'Please enter your email', 'Por favor, introduce tu correo electrónico'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError(pick('Por favor, introduz um email válido', 'Please enter a valid email', 'Por favor, introduce un correo electrónico válido'));
      return;
    }
    setLoading(true);
    setPaymentError(null);
    try {
      const priceNum = parseFloat(selectedPlan.price.replace(',', '.'));
      const orderId = `CVA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const country = sessionStorage.getItem('analysisCountry') || '';
      const region = sessionStorage.getItem('analysisRegion') || '';
      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: email.split('@')[0],
          product_type: 'cv_analysis',
          orderId,
          language: t('pt'),
          country,
          region,
          currency: CURRENCY_CODE.toLowerCase(),
          amount: getDiscountedPriceNum(selectedPlan.price),
          description: `CV Analyser — ${selectedPlan.name} — Share2Inspire`,
          success_url: `${window.location.origin}${t('cvanalyser')}/results?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}${t('cvanalyser')}/results?payment=cancelled`,
        })
      });
      const data = await response.json();
      if (!data.success || !data.url) {
        throw new Error(data.error || pick('Erro ao criar sessão de checkout', 'Error creating checkout session', 'Error al crear la sesión de checkout'));
      }
      sessionStorage.setItem('orderId', orderId);
      sessionStorage.setItem('paymentEmail', email);
      updateAnalysisEmail(email);
      sessionStorage.setItem('stripeSessionId', data.sessionId);
      // Save selectedPlan and coupon before redirect so it survives page reload
      sessionStorage.setItem('selectedPlanBeforeStripe', JSON.stringify(selectedPlan));
      if (appliedCoupon) sessionStorage.setItem('appliedCouponBeforeStripe', JSON.stringify(appliedCoupon));
      redirectToCheckout(data.url);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : pick('Erro ao processar pagamento', 'Error processing payment', 'Error al procesar el pago'));
    } finally {
      setLoading(false);
    }
  };

  const handleMBWayPayment = async () => {
    if (!email || !phone) {
      setPaymentError(t('por_favor_preenche_todos_os'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError(t('por_favor_introduz_um_email'));
      return;
    }

    const phoneRegex = /^(9[1236]\d{7}|2\d{8})$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPaymentError(t('por_favor_introduz_um_nmero'));
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const analysisDataStr = sessionStorage.getItem('cvAnalysis');
      
      if (!analysisDataStr) {
        throw new Error(t('dados_do_cv_no_encontrados'));
      }

      const parsedAnalysis = JSON.parse(analysisDataStr);
      const priceNum = getDiscountedPriceNum(selectedPlan.price);
      const orderId = `CVA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const cleanPhone = phone.replace(/\D/g, '').replace(/^(\+?351)/, '');
      const formattedPhone = `351${cleanPhone}`;
      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/mbway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          phone: formattedPhone,
          orderId: orderId,
          amount: priceNum.toFixed(2),
          paymentMethod: 'mbway',
          description: appliedCoupon ? `CV Analyser - ${selectedPlan.name} (${appliedCoupon.percent}% off)` : `CV Analyser - ${selectedPlan.name}`,
          name: email.split('@')[0],
          analysisData: parsedAnalysis
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('[PAYMENT] Backend error:', data);
        throw new Error(data.error || (t('erro_ao_processar_pagamento_tenta')));
      }
      
      sessionStorage.setItem('orderId', orderId);
      sessionStorage.setItem('paymentEmail', email);
      updateAnalysisEmail(email);
      if (data.requestId) {
        sessionStorage.setItem('requestId', data.requestId);
      }
      
      // Move to polling step
      setPaymentStep('polling');
      setPollingMessage(t('confirma_o_pagamento_na_app'));
      startPolling(orderId);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : (t('erro_ao_processar_pagamento')));
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!email) {
      setPaymentError(t('por_favor_introduz_o_teu'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError(t('por_favor_introduz_um_email'));
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const priceNum = getDiscountedPriceNum(selectedPlan.price);
      sessionStorage.setItem('paymentEmail', email);
      updateAnalysisEmail(email);
      
      // Open PayPal.me directly
      window.open(`https://paypal.me/SamuelRolo/${priceNum}${CURRENCY_CODE}`, '_blank');
      
      // For PayPal, we need manual confirmation - go to success step
      if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: priceNum, currency: CURRENCY_CODE});
      setPaymentStep('success');
    } catch (err) {
      setPaymentError(t('erro_ao_abrir_paypal_tenta'));
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (typeof window.fbq === 'function') window.fbq('track', 'AddPaymentInfo');
    if (paymentMethod === 'stripe') {
      handleStripePayment();
    } else if (paymentMethod === 'mbway') {
      handleMBWayPayment();
    } else {
      handlePayPalPayment();
    }
  };

  // Store polling interval ref so "Já paguei" can re-trigger
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [pollingExpired, setPollingExpired] = useState(false);

  const startPolling = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 60 * 5s = 5 minutes max
    let consecutiveErrors = 0;
    const startTime = Date.now();
    const MIN_BEFORE_EXPIRED = 90000; // Ignore 'expired' in first 90 seconds
    setCurrentOrderId(orderId);
    setPollingExpired(false);
    
    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(
          `https://share2inspire-beckend.lm.r.appspot.com/api/payment/check-payment-status`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          }
        );
        
        if (!response.ok) {
          consecutiveErrors++;
          console.warn(`[POLLING] Erro ${response.status} (tentativa ${attempts}/${maxAttempts})`);
          if (consecutiveErrors >= 8) {
            console.warn('[POLLING] 8 erros consecutivos, a parar polling');
            clearInterval(pollInterval);
            setPollingExpired(true);
            setPollingMessage(t('no_foi_possvel_verificar_o'));
          }
          return;
        }
        
        consecutiveErrors = 0;
        const data = await response.json();
        
        if (data.paid) {
          console.log('[POLLING] Pagamento confirmado!');
          clearInterval(pollInterval);
          
          // Create voucher in Supabase
          if (selectedPlan.analyses > 1 || selectedPlan.includes_career_path) {
            await createVoucher(email, selectedPlan, orderId);
          }
          
          // Unlock full report
          unlockFullReport();
          updateAnalysisPayment(selectedPlan.price, 'mbway', orderId);
          
          // If complete plan, auto-trigger Career Path generation
          if (selectedPlan.includes_career_path) {
            sessionStorage.setItem('careerPathIncluded', 'true');
            setCareerPathEmail(email);
          }
          
          if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: parseFloat(selectedPlan.price.replace(',', '.')), currency: CURRENCY_CODE});
          setPaymentStep('success');
          return;
        }
        
        const elapsed = Date.now() - startTime;
        if (data.expired) {
          if (elapsed < MIN_BEFORE_EXPIRED) {
            // Ignore early expired — ifthenpay sometimes returns expired too soon
            console.log(`[POLLING] Ignorando expired prematuro (${Math.round(elapsed/1000)}s < 90s)`);
            setPollingMessage(t('a_verificar_pagamento_confirma_na'));
          } else {
            console.warn('[POLLING] Pagamento expirado após', Math.round(elapsed/1000), 's');
            clearInterval(pollInterval);
            setPollingExpired(true);
            setPollingMessage(t('o_pagamento_expirou_usa_o'));
          }
          return;
        }
        
        // Still pending — update message based on time
        if (elapsed < 30000) {
          setPollingMessage(t('confirma_o_pagamento_na_app'));
        } else if (elapsed < 60000) {
          setPollingMessage(t('ainda_a_aguardar_verifica_a'));
        } else {
          setPollingMessage(t('a_aguardar_confirmao_se_j'));
        }
        
        if (attempts >= maxAttempts) {
          console.warn('[POLLING] Timeout atingido');
          clearInterval(pollInterval);
          setPollingExpired(true);
          setPollingMessage(t('tempo_esgotado_se_j_aprovaste'));
        }
      } catch (err) {
        console.error('Erro no polling:', err);
        consecutiveErrors++;
        if (consecutiveErrors >= 8) {
          clearInterval(pollInterval);
          setPollingExpired(true);
          setPollingMessage(t('erro_de_ligao_usa_o'));
        }
      }
    }, 5000); // Poll every 5 seconds
  };

  // Manual re-check for "Já paguei" button
  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMessage(t('a_verificar_pagamento'));
    setPollingExpired(false);
    try {
      const response = await fetch(
        `https://share2inspire-beckend.lm.r.appspot.com/api/payment/check-payment-status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: currentOrderId })
        }
      );
      const data = await response.json();
      if (data.paid) {
        if (selectedPlan.analyses > 1 || selectedPlan.includes_career_path) {
          await createVoucher(email, selectedPlan, currentOrderId);
        }
        unlockFullReport();
        updateAnalysisPayment(selectedPlan.price, 'mbway', currentOrderId);
        if (selectedPlan.includes_career_path) {
          sessionStorage.setItem('careerPathIncluded', 'true');
          setCareerPathEmail(email);
        }
        if (typeof window.fbq === 'function') window.fbq('track', 'Purchase', {value: parseFloat(selectedPlan.price.replace(',', '.')), currency: CURRENCY_CODE});
        setPaymentStep('success');
      } else {
        setPollingExpired(true);
        setPollingMessage(t('pagamento_ainda_no_confirmado_se'));
        // Restart polling for another 2 minutes
        startPolling(currentOrderId);
      }
    } catch {
      setPollingExpired(true);
      setPollingMessage(t('erro_ao_verificar_tenta_novamente'));
    }
  };

  // Create voucher in Supabase for multi-analysis plans
  const createVoucher = async (userEmail: string, plan: { name: string; price: string; analyses: number; voucher_type?: string; includes_career_path?: boolean }, orderId: string) => {
    try {
      const code = `S2I-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          code: code,
          email: userEmail,
          plan_name: plan.name,
          total_analyses: plan.analyses,
          used_analyses: 1, // First analysis is used now
          amount_paid: parseFloat(plan.price.replace(',', '.')),
          order_id: orderId,
          payment_method: 'mbway',
          voucher_type: plan.voucher_type || 'standard',
          includes_career_path: plan.includes_career_path || false
        })
      });
      
      if (response.ok) {
        const [voucher] = await response.json();
        console.log('[VOUCHER] Criado:', voucher);
        // Store voucher code for display
        sessionStorage.setItem('voucherCode', code);
        sessionStorage.setItem('voucherRemaining', String(plan.analyses - 1));
        // If complete plan, auto-unlock career path
        if (plan.includes_career_path) {
          sessionStorage.setItem('careerPathIncluded', 'true');
        }
        // Send voucher code by email — but NOT for bundles (analysis is immediate)
        if (!plan.includes_career_path) {
          await sendVoucherEmail(userEmail, code, plan.name, plan.analyses);
        }
      }
    } catch (err) {
      console.error('[VOUCHER] Erro ao criar:', err);
    }
  };

  // Validate discount code (checks discount_coupons first, then vouchers)
  const handleDiscountValidation = async () => {
    if (!discountCode.trim()) {
      setDiscountError(t('introduz_um_cdigo'));
      return;
    }

    setDiscountLoading(true);
    setDiscountError(null);
    setDiscountSuccess(null);
    const code = discountCode.trim().toUpperCase();

    try {
      // Step 1: Check discount_coupons table
      const couponRes = await fetch(
        `${SUPABASE_URL}/rest/v1/discount_coupons?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=code,discount_percent,max_uses,current_uses,valid_from,valid_until,applicable_products`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const coupons = await couponRes.json();
      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) { setDiscountError(t('este_cdigo_ainda_no_est')); return; }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) { setDiscountError(t('este_cdigo_j_expirou')); return; }
        if (coupon.max_uses !== null && (coupon.current_uses || 0) >= coupon.max_uses) { setDiscountError(t('este_cdigo_atingiu_o_limite')); return; }
        const products = coupon.applicable_products || [];
        if (products.length > 0 && !products.includes('all') && !products.includes('cv_analyser') && !products.includes('cv_report')) { setDiscountError(t('este_cdigo_no_aplicvel_aqui')); return; }
        if (coupon.discount_percent === 100) {
          setDiscountSuccess(t('cdigo_vlido_anlise_desbloqueada'));
          unlockFullReport();
          updateAnalysisPayment('0', 'coupon', code);
          // Increment coupon usage counter
          incrementCouponUsage(code);
          // Track affiliate conversion even for free coupons
          trackAffiliateConversion({ product: 'cv_analyser', amount: 0, currency: t('eur'), payment_method: 'coupon', transaction_id: `COUPON-${code}` });
          setTimeout(() => { setShowDiscountModal(false); setDiscountCode(''); setDiscountSuccess(null); }, 2500);
          return;
        }
        // Partial discount — apply it
        setAppliedCoupon({ code, percent: coupon.discount_percent });
        incrementCouponUsage(code);
        setDiscountSuccess(pick(`Desconto de ${coupon.discount_percent}% aplicado!`, `${coupon.discount_percent}% discount applied!`, `¡Descuento de ${coupon.discount_percent}% aplicado!`));
        setTimeout(() => { setShowDiscountModal(false); setDiscountCode(''); setDiscountSuccess(null); }, 2000);
        return;
      }

      // Step 2: Check vouchers table
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=*`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      );

      if (!response.ok) throw new Error(t('erro_ao_verificar_cdigo'));
      const vouchers = await response.json();
      
      if (vouchers.length === 0) {
        setDiscountError(t('cdigo_invlido_ou_j_utilizado'));
        return;
      }

      const voucher = vouchers[0];
      const remaining = voucher.total_analyses - voucher.used_analyses;

      if (remaining <= 0) {
        setDiscountError(t('este_cdigo_j_no_tem'));
        return;
      }

      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${voucher.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Prefer': 'return=representation' },
          body: JSON.stringify({ used_analyses: voucher.used_analyses + 1, is_active: remaining - 1 > 0, updated_at: new Date().toISOString() })
        }
      );

      if (updateResponse.ok) {
        setDiscountSuccess(pick(`Código válido! Análise desbloqueada. Restam ${remaining - 1} análise(s).`, `Valid code! Analysis unlocked. ${remaining - 1} use(s) remaining.`, `¡Código válido! Análisis desbloqueado. Quedan ${remaining - 1} análisis.`));
        unlockFullReport();
        updateAnalysisPayment(selectedPlan.price, 'voucher', code);
        
        if (voucher.includes_career_path || voucher.voucher_type === 'complete') {
          sessionStorage.setItem('careerPathIncluded', 'true');
          setDiscountSuccess(pick(`Código válido! Análise + Career Path desbloqueados. Restam ${remaining - 1} análise(s).`, `Valid code! Analysis + Career Path unlocked. ${remaining - 1} use(s) remaining.`, `¡Código válido! Análisis + Career Path desbloqueados. Quedan ${remaining - 1} análisis.`));
        }
        
        setTimeout(() => { setShowDiscountModal(false); setDiscountCode(''); setDiscountSuccess(null); }, 2500);
      } else {
        throw new Error(t('erro_ao_utilizar_cdigo'));
      }
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : (t('erro_ao_verificar_cdigo')));
    } finally {
      setDiscountLoading(false);
    }
  };



  // Career Path: initiate payment and generate
  const handleCareerPathPayment = async () => {
    if (!careerPathEmail) {
      setCareerPathError(t('introduz_o_teu_email'));
      return;
    }
    if (careerPathPaymentMethod === 'mbway' && !careerPathPhone) {
      setCareerPathError(t('introduz_o_teu_nmero_de'));
      return;
    }
    setCareerPathError(null);
    setCareerPathPaymentStep('polling');
    setCareerPathPollingMsg(t('confirma_o_pagamento_na_app_2'));

    try {
      const orderId = `CP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const cpAmount = careerPathIsUpgrade ? '14.99' : '19.99';
      const cpCurrencyCode = t('eur_2');

      if (careerPathPaymentMethod === 'stripe') {
        const stripeRes = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/stripe-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: careerPathEmail,
            name: careerPathEmail.split('@')[0],
            product_type: 'career_path',
            orderId,
            language: t('pt'),
            country: sessionStorage.getItem('analysisCountry') || '',
            region: sessionStorage.getItem('analysisRegion') || '',
            currency: cpCurrencyCode,
            amount: parseFloat(cpAmount),
            description: 'Career Path — Share2Inspire',
            success_url: `${window.location.origin}${t('cvanalyser')}/results?payment=success&session_id={CHECKOUT_SESSION_ID}&product=career_path`,
            cancel_url: `${window.location.origin}${t('cvanalyser')}/results?payment=cancelled`,
          })
        });
        const stripeData = await stripeRes.json();
        if (!stripeData.success || !stripeData.url) {
          throw new Error(stripeData.error || pick('Erro ao criar sessão de checkout', 'Error creating checkout session', 'Error al crear la sesión de checkout'));
        }
        sessionStorage.setItem('orderId', orderId);
        sessionStorage.setItem('paymentEmail', careerPathEmail);
        updateAnalysisEmail(careerPathEmail);
        sessionStorage.setItem('stripeSessionId', stripeData.sessionId);
        window.location.href = stripeData.url;
        return;
      }

      if (careerPathPaymentMethod === 'paypal') {
        window.open(`https://paypal.me/SamuelRolo/${cpAmount}${cpCurrencyCode.toUpperCase()}`, '_blank');
        setCareerPathPaymentStep('generating');
        await generateCareerPath();
        return;
      }

      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/mbway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: careerPathEmail,
          phone: (() => { const cp = careerPathPhone.replace(/\D/g, '').replace(/^(\+?351)/, ''); return `351${cp}`; })(),
          orderId,
          amount: cpAmount,
          paymentMethod: 'mbway',
          description: 'CV Analyser - Career Path Add-on',
          name: careerPathEmail.split('@')[0],
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || (t('erro_no_pagamento')));

      let attempts = 0;
      const maxAttempts = 60; // 60 * 5s = 5 minutes
      const cpStartTime = Date.now();
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/check-payment-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          });
          const pollData = await res.json();
          if (pollData.paid) {
            clearInterval(pollInterval);
            setCareerPathPaymentStep('generating');
            setCareerPathPollingMsg(t('pagamento_confirmado_a_gerar_o'));
            await generateCareerPath();
          } else if (pollData.expired) {
            const elapsed = Date.now() - cpStartTime;
            if (elapsed < 90000) {
              // Ignore early expired
              console.log(`[CP-POLLING] Ignorando expired prematuro (${Math.round(elapsed/1000)}s)`);
              setCareerPathPollingMsg(t('a_verificar_pagamento_confirma_na'));
            } else {
              clearInterval(pollInterval);
              setCareerPathError(t('pagamento_expirado_tenta_novamente'));
              setCareerPathPaymentStep('payment');
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setCareerPathError(t('tempo_esgotado_se_j_pagaste'));
            setCareerPathPaymentStep('payment');
          } else {
            // Update message based on time
            const elapsed = Date.now() - cpStartTime;
            if (elapsed < 30000) {
              setCareerPathPollingMsg(t('confirma_o_pagamento_na_app_2'));
            } else if (elapsed < 60000) {
              setCareerPathPollingMsg(t('ainda_a_aguardar_verifica_a'));
            } else {
              setCareerPathPollingMsg(t('a_aguardar_confirmao_se_j'));
            }
          }
        } catch { /* ignore polling errors */ }
      }, 5000);
    } catch (err: any) {
      setCareerPathError(err.message || (t('erro_ao_processar_pagamento')));
      setCareerPathPaymentStep('payment');
    }
  };

  const generateCareerPath = async () => {
    setCareerPathLoading(true);
    setCareerPathError(null);
    try {
      const cvData = sessionStorage.getItem('cvAnalysis');
      // IMPORTANT: Read linkedin from sessionStorage first (reliable for Bundle flow),
      // fallback to React state (for manual Career Path purchase flow)
      const linkedinFromStorage = sessionStorage.getItem('careerPathLinkedinUrl') || '';
      const linkedinUrl = linkedinFromStorage || careerPathLinkedin || '';
      console.log('[CareerPath] Generating with linkedin:', linkedinUrl, 'country:', sessionStorage.getItem('analysisCountry'));
      const response = await fetch(`${SUPABASE_URL}/functions/v1/hyper-task`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'career_path',
          cv_text: cvData || '',
          linkedin_url: linkedinUrl || undefined,
          language: t('pt'),
          country: sessionStorage.getItem('analysisCountry') || (t('portugal')),
          region: sessionStorage.getItem('analysisRegion') || '',
        })
      });

      const data = await response.json();
      console.log('[CareerPath] Response:', data.success, !!data.career_path);
      if (!data.success && !data.career_path) throw new Error(data.error || (t('erro_ao_gerar_career_path')));
      
      setCareerPathData(data.career_path || data);
      setCareerPathPaymentStep('done');
      setShowCareerPathModal(false);
    } catch (err: any) {
      console.error('[CareerPath] Error:', err);
      setCareerPathError(err.message || (t('erro_ao_gerar_career_path')));
    } finally {
      setCareerPathLoading(false);
    }
  };

  // Send voucher code by email after payment
  const sendVoucherEmail = async (userEmail: string, code: string, planName: string, totalAnalyses: number) => {
    try {
      await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/send-voucher-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userEmail.split('@')[0],
          voucherCode: code,
          planName: planName,
          totalAnalyses: totalAnalyses,
          remainingAnalyses: totalAnalyses,
        })
      });
      console.log('[VOUCHER-EMAIL] Email de voucher enviado para:', userEmail);
    } catch (err) {
      console.error('[VOUCHER-EMAIL] Erro ao enviar email:', err);
    }
  };

  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A961]" />
      </div>
    );
  }

  // Defensive guard: ensure quadrants is always a valid array
  const safeQuadrants = (analysisData.quadrants && Array.isArray(analysisData.quadrants) && analysisData.quadrants.length > 0)
    ? analysisData.quadrants
    : [
        { title: t('estrutura'), score: 65, benchmark: 70, impactPhrase: t('organizao_e_clareza_do_cv') },
        { title: t('contedo'), score: 70, benchmark: 72, impactPhrase: t('qualidade_e_relevncia_do_contedo') },
        { title: t('formao'), score: 68, benchmark: 65, impactPhrase: t('formao_acadmica_e_contnua') },
        { title: t('experincia'), score: 72, benchmark: 70, impactPhrase: t('experincia_profissional') },
      ];
  const activeAnalysisData = (!analysisData.quadrants || !Array.isArray(analysisData.quadrants) || analysisData.quadrants.length === 0)
    ? { ...analysisData, quadrants: safeQuadrants }
    : analysisData;

  const avgScore = analysisData.quadrants.reduce((sum, q) => sum + q.score, 0) / analysisData.quadrants.length;
  const percentile = Math.round(Math.min(95, Math.max(5, avgScore * 0.95)));
  // Translate quadrant titles for EN (handles both new EN titles and legacy PT titles from sessionStorage)
  const quadrantTitleEN: Record<string, string> = {
    'Estrutura': 'Structure', 'Structure': 'Structure',
    'Conteúdo': 'Content', 'Content': 'Content',
    'Formação': 'Education', 'Education': 'Education',
    'Experiência': 'Experience', 'Experience': 'Experience',
  };
  const dimensions = analysisData.quadrants.map((q: any) => ({
    label: lang === 'en' ? (quadrantTitleEN[q.title] || q.title) : q.title,
    score: q.score,
    benchmark: q.benchmark
  }));
  // Send report by email — sends analysis data to backend for HTML email generation (like Career Path)
  const handleSendReport = async () => {
    const targetEmail = reportEmail || email || sessionStorage.getItem('paymentEmail') || '';
    if (targetEmail) updateAnalysisEmail(targetEmail);
    if (!targetEmail) {
      setReportError(t('introduz_um_email_vlido'));
      return;
    }
    setReportSending(true);
    setReportError(null);
    try {
      const vCode = sessionStorage.getItem('voucherCode');
      const vRemaining = sessionStorage.getItem('voucherRemaining');
      const emailRoute = t('sendcvreportemail');
      const response = await fetch(`https://share2inspire-beckend.lm.r.appspot.com/api/payment/${emailRoute}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetEmail.split('@')[0],
          analysisData,
          country: sessionStorage.getItem('analysisCountry') || (t('portugal')),
          region: sessionStorage.getItem('analysisRegion') || '',
          voucherCode: vCode || undefined,
          remainingAnalyses: vRemaining ? parseInt(vRemaining) : undefined,
        })
      });
      const data = await response.json();
      if (data.success) {
        setReportSent(true);
      } else {
        throw new Error(data.error || (t('erro_ao_enviar')));
      }
    } catch (err: any) {
      console.error('Erro ao enviar relatório:', err);
      setReportError(err.message || (t('erro_ao_enviar_o_relatrio')));
    } finally {
      setReportSending(false);
    }
  };

  const storedVoucherCode = sessionStorage.getItem('voucherCode');
  const storedVoucherRemaining = sessionStorage.getItem('voucherRemaining');

  return (
    <div className="min-h-screen bg-background">
      {/* Header - responsivo */}
      <header className="border-b border-foreground/10 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 bg-background/90 backdrop-blur-lg z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('voltar')}</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <GoldIcon size="w-6 h-6 sm:w-7 sm:h-7">
                <FileCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C9A961]" />
              </GoldIcon>
              <span className="text-sm sm:text-base font-semibold text-foreground">CV Analyser</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isPaid ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                <span className="text-xs sm:text-sm font-semibold text-green-600">{t('relatrio_completo')}</span>
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
                  <span className="hidden sm:inline">{t('desbloquear_anlise_completa')}</span>
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

      <main className="results-container max-w-4xl mx-auto px-2 sm:px-6 py-4 sm:py-10 space-y-4 sm:space-y-8">
        {/* Report Label */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isPaid ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{t('relatrio_completo_todas_as_seces')}</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-[#C9A961]" />
              <span>{t('relatrio_gratuito_anlise_resumida_do')}</span>
            </>
          )}
        </div>

        {/* Voucher info banner (only if remaining analyses > 0) */}
        {isPaid && storedVoucherCode && storedVoucherRemaining && parseInt(storedVoucherRemaining) > 0 && (
          <div className="bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-[#C9A961]" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t('o_teu_cdigo_para_futuras')}</p>
                <p className="text-lg font-mono font-bold text-[#C9A961]">{storedVoucherCode}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t('anlises_restantes')}</p>
              <p className="text-2xl font-bold text-[#C9A961]">{storedVoucherRemaining}</p>
            </div>
          </div>
        )}

        {/* ═══ ATS Rejection ═══ */}
        <ATSRejectionBlock rejectionRate={analysisData.atsRejectionRate} topFactor={analysisData.atsTopFactor} isPaid={isPaid} detailedFactors={analysisData.detailedAtsAnalysis?.factors} atsSystems={analysisData.detailedAtsAnalysis?.atsSystems} quickFixes={analysisData.detailedAtsAnalysis?.quickFixes} />

        {/* ═══ ATS Deep Scan ═══ */}
        {analysisData.atsDeepScan && (
          <ATSDeepScanBlock data={analysisData.atsDeepScan} isPaid={isPaid} onUnlock={() => openPaymentModal()} />
        )}

        {/* ═══ LinkedIn Job Scraping Status Banner ═══ */}
        {jobScrapeStatus !== 'idle' && (
          <div className={`rounded-lg p-4 mb-6 flex items-center gap-3 border ${
            jobScrapeStatus === 'scraping' || jobScrapeStatus === 'reanalyzing'
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
              : jobScrapeStatus === 'done'
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
          }`}>
            {(jobScrapeStatus === 'scraping' || jobScrapeStatus === 'reanalyzing') && (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
            )}
            {jobScrapeStatus === 'done' && (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            )}
            {jobScrapeStatus === 'error' && (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {jobScrapeStatus === 'scraping' && (t('extrao_da_vaga_linkedin'))}
                {jobScrapeStatus === 'reanalyzing' && (t('reanlise_com_dados_reais'))}
                {jobScrapeStatus === 'done' && (t('dados_da_vaga_atualizados'))}
                {jobScrapeStatus === 'error' && (t('problema_na_extrao'))}
              </p>
              <p className="text-xs text-muted-foreground">{jobScrapeMessage}</p>
            </div>
          </div>
        )}

        {/* ═══ Job Match Section (only when user provided a job posting) ═══ */}
        {analysisData.jobMatch && analysisData.jobMatch.atsCompatibilityScore != null && (
          <div className="bg-card border-2 border-[#C9A961]/30 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#C9A961]" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{t('anlise_de_compatibilidade_com_a')}</p>
                {analysisData.jobMatch.jobTitle && <p className="text-sm text-muted-foreground">{analysisData.jobMatch.jobTitle}</p>}
              </div>
            </div>
            <div className="flex flex-col items-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                  <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8" strokeDasharray={`${analysisData.jobMatch.atsCompatibilityScore * 3.267} 326.7`}
                    className={analysisData.jobMatch.atsCompatibilityScore >= 75 ? 'stroke-green-500' : analysisData.jobMatch.atsCompatibilityScore >= 50 ? 'stroke-yellow-500' : 'stroke-red-500'} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-foreground">{analysisData.jobMatch.atsCompatibilityScore}</div>
                  <div className="text-xs text-muted-foreground">/100</div>
                </div>
              </div>
              {analysisData.jobMatch.overallFit && <p className="text-xs text-muted-foreground mt-2 text-center">{analysisData.jobMatch.overallFit}</p>}
            </div>
            {isPaid ? (
              <>
                {analysisData.jobMatch.keywordGaps && analysisData.jobMatch.keywordGaps.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-red-500 mb-2">{t('palavraschave_em_falta')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisData.jobMatch.keywordGaps.map((gap: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 border border-red-500/20">{gap}</span>
                      ))}
                    </div>
                  </div>
                )}
                {analysisData.jobMatch.matchedKeywords && analysisData.jobMatch.matchedKeywords.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-2">{t('palavraschave_encontradas')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisData.jobMatch.matchedKeywords.map((kw: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600 border border-green-500/20">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {analysisData.jobMatch.keywordGaps && analysisData.jobMatch.keywordGaps.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-red-500 mb-2">{t('palavraschave_em_falta')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 border border-red-500/20">
                        {pick(`${analysisData.jobMatch.keywordGaps.length} palavras-chave identificadas`, `${analysisData.jobMatch.keywordGaps.length} keywords identified`, `${analysisData.jobMatch.keywordGaps.length} palabras clave identificadas`)}
                      </span>
                    </div>
                  </div>
                )}
                {analysisData.jobMatch.matchedKeywords && analysisData.jobMatch.matchedKeywords.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-green-600 mb-2">{t('palavraschave_encontradas')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600 border border-green-500/20">
                        {pick(`${analysisData.jobMatch.matchedKeywords.length} palavras-chave encontradas`, `${analysisData.jobMatch.matchedKeywords.length} keywords matched`, `${analysisData.jobMatch.matchedKeywords.length} palabras clave encontradas`)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-[#C9A961]/5 border border-[#C9A961]/20 flex items-center gap-2 cursor-pointer hover:bg-[#C9A961]/10 transition-colors" onClick={() => openPaymentModal()}>
                  <Lock className="w-3.5 h-3.5 text-[#C9A961]" />
                  <span className="text-xs text-[#C9A961] font-medium">{t('vu00ea_o_detalhe_no_relatu00f3rio')}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ Live Match (after Job Match, as optional tool) ═══ */}
        {cvText && (
          <div className="mb-8">
            {!showLiveMatch ? (
              <button
                onClick={() => setShowLiveMatch(true)}
                className="w-full bg-gradient-to-r from-[#fafaf9] to-[#f5f5f3] border-2 border-dashed border-[#C9A961]/30 rounded-lg p-5 hover:border-[#C9A961]/50 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C9A961] to-[#B8943F] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#333] flex items-center gap-1.5">
                      Live Match
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[#C9A961]/10 text-[#C9A961] border border-[#C9A961]/20">
                        {t('novo')}
                      </span>
                    </p>
                    <p className="text-[11px] text-[#888] font-light">
                      {analysisData.jobMatch
                        ? (t('quer_comparar_com_outra_vaga'))
                        : (t('cole_a_descrio_de_uma'))}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#ccc] group-hover:text-[#C9A961] transition-colors ml-auto" />
                </div>
              </button>
            ) : (
              <div className="bg-card border border-[#e8e8e6] rounded-lg p-5">
                <LiveMatchPanel
                  cvText={cvText}
                  lang={t('pt')}
                  isPaid={isPaid}
                  onRequestPayment={() => openPaymentModal()}
                  initialJD={sessionStorage.getItem('scrapedJobText') || undefined}
                />
              </div>
            )}
          </div>
        )}

        {/* ═══ CV Problems Section (3 specific issues) ═══ */}
        {(isPaid ? (analysisData.cvProblems && analysisData.cvProblems.length > 0) : true) && (
          <div className="bg-card border-2 border-red-500/20 rounded-lg p-6 mb-8">
            {isPaid ? (
              /* ── PAID: show full details ── */
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-red-500">{t('problemas_crticos_detetados')}</p>
                    <p className="text-xs text-muted-foreground">{pick(`${analysisData.cvProblems.length} problemas específicos que estão a prejudicar o teu CV`, `${analysisData.cvProblems.length} specific issues that are hurting your CV`, `${analysisData.cvProblems.length} problemas específicos que están perjudicando tu CV`)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {analysisData.cvProblems.slice(0, 3).map((problem: any, i: number) => (
                    <div key={i} className="border border-border rounded-lg overflow-hidden">
                      <div className="p-4 bg-red-500/5">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{problem.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{problem.description}</p>
                          </div>
                        </div>
                      </div>
                      {problem.fullExplanation && (
                        <div className="p-4 border-t border-border space-y-3">
                          <div>
                            <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-1">{t('explicao_completa')}</p>
                            <p className="text-sm text-foreground">{problem.fullExplanation}</p>
                          </div>
                          {problem.correctionExample && (
                            <div>
                              <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-1">{t('exemplo_de_correo')}</p>
                              <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md font-mono">{problem.correctionExample}</p>
                            </div>
                          )}
                          {problem.rewriteSuggestion && (
                            <div>
                              <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-1">{t('sugesto_de_reescrita')}</p>
                              <div className="text-sm text-foreground bg-green-500/5 border border-green-500/20 p-3 rounded-md">
                                <p>{problem.rewriteSuggestion}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* ── NOT PAID: always show 3 vague problem cards ── */
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-red-500">{t('problemas_crticos_detetados')}</p>
                    <p className="text-xs text-muted-foreground">{pick(`3 problemas específicos que estão a prejudicar o teu CV`, `3 specific issues that are hurting your CV`, `3 problemas específicos que están perjudicando tu CV`)}</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  {[0, 1, 2].map((i: number) => {
                    const areaLabels = [
                      pick('Problema detetado na secção de Experiência', 'Issue found in your Experience section', 'Problema detectado en la sección de Experiencia'),
                      pick('Problema detetado na secção de Perfil/Resumo', 'Issue found in your Profile/Summary section', 'Problema detectado en la sección de Perfil/Resumen'),
                      pick('Problema detetado nas Competências e Credenciais', 'Issue found in your Skills & Credentials', 'Problema detectado en Competencias y Credenciales'),
                    ];
                    const label = areaLabels[i];
                    return (
                      <div key={i} className="border border-border rounded-lg overflow-hidden cursor-pointer hover:border-[#C9A961]/50 transition-colors" onClick={() => openPaymentModal()}>
                        <div className="p-4 bg-red-500/5 flex items-center gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                          <p className="font-semibold text-foreground text-sm">{label}</p>
                        </div>
                        <div className="p-3 border-t border-border bg-[#C9A961]/5 flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-[#C9A961]" />
                          <span className="text-xs text-[#C9A961] font-medium">{t('desbloqueia_para_ver_o_problema')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => openPaymentModal()} className="w-full py-3 px-4 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                  <Unlock className="w-4 h-4" />
                  {t('corrige_estes_3_problemas_agora')}
                </button>
              </>
            )}
          </div>
        )}

        {/* ═══ FINANCIAL IMPACT + REPORT PREVIEW (before paywall) ═══ */}
        {!isPaid && (() => {
          const atsScore = 100 - analysisData.atsRejectionRate;
          const impactLevel = atsScore < 50 ? 'critical' : atsScore < 70 ? 'moderate' : 'low';
          return (
            <div className="space-y-6">
              {/* ── Score Highlight + Financial Impact ── */}
              <div className="bg-gradient-to-br from-card to-[#C9A961]/5 border-2 border-[#C9A961]/30 rounded-2xl p-5 sm:p-6 space-y-4">
                {/* Score Display */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C9A961]" />
                    <p className="text-[11px] font-semibold tracking-wider text-[#C9A961] uppercase">{t('o_teu_score_de_compatibilidade')}</p>
                  </div>
                  <div className="relative mb-4">
                    <ScoreGauge score={atsScore} size={160} strokeWidth={8} />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                        atsScore >= 75 ? 'bg-[#C9A961]/10 text-[#C9A961]' :
                        atsScore >= 50 ? 'bg-amber-500/10 text-amber-600' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {atsScore >= 75 ? (t('bom')) : atsScore >= 50 ? (t('precisa_de_melhoria')) : (t('crtico'))}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center max-w-sm">
                    {pick(
                      `O teu CV tem ${atsScore}/100 de compatibilidade ATS.`,
                      `Your CV has ${atsScore}/100 ATS compatibility.`,
                      `Tu CV tiene ${atsScore}/100 de compatibilidad ATS.`
                    )}
                  </p>
                </div>

                {/* Qualitative Impact Message */}
                <div className="border-t border-[#C9A961]/20 pt-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 justify-center">
                    <AlertTriangle className={`w-3.5 h-3.5 ${impactLevel === 'critical' ? 'text-red-500' : impactLevel === 'moderate' ? 'text-amber-500' : 'text-[#C9A961]'}`} />
                    <p className={`text-[11px] font-semibold tracking-wider ${impactLevel === 'critical' ? 'text-red-500' : impactLevel === 'moderate' ? 'text-amber-500' : 'text-[#C9A961]'}`}>
                      {t('o_que_isto_significa_para')}
                    </p>
                  </div>
                  <div className={`rounded-lg p-4 text-center space-y-1.5 ${
                    impactLevel === 'critical' ? 'bg-red-500/5 border border-red-500/15' :
                    impactLevel === 'moderate' ? 'bg-amber-500/5 border border-amber-500/15' :
                    'bg-[#C9A961]/5 border border-[#C9A961]/15'
                  }`}>
                    <p className={`text-xs font-semibold ${
                      impactLevel === 'critical' ? 'text-red-500' :
                      impactLevel === 'moderate' ? 'text-amber-600' :
                      'text-[#C9A961]'
                    }`}>
                      {impactLevel === 'critical'
                        ? (t('o_teu_cv_pode_estar'))
                        : impactLevel === 'moderate'
                        ? (t('o_teu_cv_tem_margem'))
                        : (t('o_teu_cv_competitivo_mas'))
                      }
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {impactLevel === 'critical'
                        ? (t('a_maioria_dos_sistemas_ats'))
                        : impactLevel === 'moderate'
                        ? (t('alguns_filtros_ats_podem_rejeitar'))
                        : (t('o_teu_cv_passa_na'))
                      }
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center italic">
                    {t('baseado_na_anlise_da_estrutura')
                    }
                  </p>
                </div>
              </div>

              {/* ── Report Preview (✓ visible / 🔒 locked) ── */}
              <div className="bg-card border-2 border-border rounded-2xl p-3 sm:p-8 space-y-5">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#C9A961]" />
                  <p className="text-sm font-semibold text-foreground">{t('o_que_o_teu_relatrio')}</p>
                </div>

                {/* Free items */}
                <div className="space-y-2">
                  {[
                    pick('Score de compatibilidade ATS', 'ATS compatibility score', 'Puntuación de compatibilidad ATS'),
                    pick('3 problemas críticos detetados', '3 critical issues detected', '3 problemas críticos detectados'),
                    pick('Palavras-chave em falta', 'Missing keywords', 'Palabras clave que faltan'),
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                      <span className="text-[10px] font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full ml-auto">{t('grtis')}</span>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Locked items */}
                <div className="space-y-2">
                  {[
                    pick('Live Match (matching de keywords da vaga em tempo real)', 'Live Match (real-time JD keyword matching)', 'Live Match (matching de keywords de la oferta en tiempo real)'),
                    pick('ATS Deep Scan (keywords + checklist de formato)', 'ATS Deep Scan (keywords + format checklist)', 'ATS Deep Scan (keywords + checklist de formato)'),
                    pick('Análise detalhada por quadrante', 'Detailed analysis by quadrant', 'Análisis detallado por cuadrante'),
                    pick('Diagnóstico ATS completo', 'Complete ATS diagnosis', 'Diagnóstico ATS completo'),
                    pick('Sugestões de melhoria personalizadas', 'Personalised improvement suggestions', 'Sugerencias de mejora personalizadas'),
                    pick('Estimativa salarial detalhada', 'Detailed salary estimate', 'Estimación salarial detallada'),
                    pick('Simulação de percepção do recrutador', 'Recruiter perception simulation', 'Simulación de percepción del reclutador'),
                    pick('Posicionamento no mercado (curva normal)', 'Market positioning (normal curve)', 'Posicionamiento en el mercado (curva normal)'),
                    pick('Análise de risco de automação', 'Automation risk analysis', 'Análisis de riesgo de automatización'),
                    pick('Plano de acção de 30 dias', '30-day action plan', 'Plan de acción de 30 días'),
                    pick('Vagas compatíveis', 'Compatible job opportunities', 'Ofertas compatibles'),
                    pick('CV optimizado (sugestões de reescrita)', 'Optimised CV (rewrite suggestions)', 'CV optimizado (sugerencias de reescritura)'),
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 opacity-70">
                      <Lock className="w-4 h-4 text-[#C9A961] shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-2 space-y-3">
                  <Button
                    onClick={() => openPaymentModal()}
                    className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold py-3 text-base"
                  >
                    {pick(`Desbloquear Relatório Completo — desde ${CUR}${P.cv}`, `Unlock Full Report — from ${CUR}${P.cv}`, `Desbloquear Informe Completo — desde ${CUR}${P.cv}`)}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t('pagamento_seguro_via_mb_way')}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══ BLUR OVERLAY WRAPPER ═══ */}
        <div className={!isPaid ? 'relative' : ''}>
          {/* Blurred content layer */}
          <div className={!isPaid ? 'pointer-events-none select-none space-y-6 sm:space-y-8' : 'space-y-6 sm:space-y-8'} style={!isPaid ? { filter: 'blur(6px)', opacity: 0.5 } : {}}>

        {/* ═══ 4 Quadrantes ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GoldIcon size="w-8 h-8">
              <Grid2x2 className="w-4 h-4 text-[#C9A961]" />
            </GoldIcon>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('anlise_por_quadrante')}</p>
              <Tooltip
                label={t('o_que_so_os_quadrantes')}
                text={t('o_teu_cv_avaliado_em')}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysisData.quadrants.map((q, i) => (
              <QuadrantCard
                key={i}
                title={lang === 'en' ? (quadrantTitleEN[q.title] || q.title) : q.title}
                score={q.score}
                benchmark={q.benchmark}
                insight={q.impactPhrase}
                strengths={q.strengths}
                weaknesses={q.weaknesses}
              />
            ))}
          </div>
        </div>

        {/* ═══ Factores de Avaliação ═══ */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-3">
            <GoldIcon>
              <BarChart3 className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('factores_de_avaliao')}</p>
                <Tooltip
                  label={t('o_que_so_os_factores')}
                  text={t('representao_visual_de_cada_dimenso')}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('cada_factor_comparado_com_a')}</p>
            </div>
          </div>
          <div className="space-y-5">
            {analysisData.quadrants.map((q, i) => (
              <DimensionBar key={i} label={lang === 'en' ? (quadrantTitleEN[q.title] || q.title) : q.title} score={q.score} benchmark={q.benchmark} insight={q.impactPhrase} />
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <div className="relative">
              <p className="text-sm text-muted-foreground mb-2">
                {pick(`→ O teu CV está ${avgScore >= 70 ? 'acima' : 'abaixo'} da média global do mercado (${Math.round(avgScore)} vs 69)`, `→ Your CV is ${avgScore >= 70 ? 'above' : 'below'} the global market average (${Math.round(avgScore)} vs 69)`, `→ Tu CV está ${avgScore >= 70 ? 'por encima' : 'por debajo'} del promedio global del mercado (${Math.round(avgScore)} vs 69)`)}
              </p>
              {!isPaid && (
                <div className="relative">
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
                    <Button
                      onClick={() => openPaymentModal()}
                      size="sm"
                      className="bg-[#C9A961] hover:bg-[#A88B4E] text-white"
                    >
                      {t('ver_anlise_detalhada_por_dimenso')}
                    </Button>
                  </div>
                  <div className="select-none space-y-1 text-sm text-muted-foreground">
                    <p>{t('anlise_cruzada_entre_dimenses_e')}</p>
                    <p>{t('recomendaes_especficas_para_cada_dimenso')}</p>
                    <p>{t('comparao_com_perfis_do_mesmo')}</p>
                  </div>
                </div>
              )}
              {isPaid && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{t('anlise_cruzada_entre_dimenses_e')}</p>
                  <p>{t('recomendaes_especficas_para_cada_dimenso')}</p>
                  <p>{t('comparao_com_perfis_do_mesmo')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Compatibilidade ATS ═══ */}
        <div className="bg-card border border-border rounded-lg p-3 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <AlertTriangle className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('compatibilidade_ats')}</p>
                <Tooltip
                  label={t('o_que_a_compatibilidade_ats')}
                  text={t('applicant_tracking_system_software_usado')}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('probabilidade_do_teu_cv_passar')}</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <ScoreGauge score={100 - analysisData.atsRejectionRate} size={160} strokeWidth={8} />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {lang === 'en' ? <>Your CV has <span className="font-semibold text-foreground">{100 - analysisData.atsRejectionRate}%</span> compatibility with ATS systems. {100 - analysisData.atsRejectionRate >= 70 ? 'Good compatibility.' : 'See the full report to learn how to improve.'}</> : <>O teu CV tem <span className="font-semibold text-foreground">{100 - analysisData.atsRejectionRate}%</span> de compatibilidade com sistemas ATS. {100 - analysisData.atsRejectionRate >= 70 ? 'Boa compatibilidade.' : 'Vê o relatório completo para saber como melhorar.'}</>}
            </p>
          </div>
        </div>

        {/* ═══ Percepção do Recrutador ═══ */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <GoldIcon size="w-8 h-8">
              <Eye className="w-4 h-4 text-[#C9A961]" />
            </GoldIcon>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('percepo_do_recrutador')}</p>
              <Tooltip
                label={t('o_que_a_percepo_do')}
                text={t('simulao_do_que_um_recrutador')}
              />
            </div>
          </div>
          <RecruiterPerception isPaid={isPaid} roles={analysisData.keywords} perceivedRole={analysisData.perceivedRole} perceivedSeniority={analysisData.perceivedSeniority} deepAnalysis={analysisData.recruiterDeepAnalysis} />
        </div>

        {/* ═══ Salary ═══ */}
        <SalaryBlock blurred={!isPaid} salaryDetailed={analysisData.salaryDetailed} perceivedSeniority={analysisData.perceivedSeniority} CUR={CUR} />

        {/* ═══ Normal Curve ═══ */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <TrendingUp className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('posicionamento_no_mercado')}</p>
                <Tooltip
                  label={t('o_que_a_curva_normal')}
                  text={t('distribuio_estatstica_que_mostra_onde')}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('curva_normal_onde_te_posicionas')}</p>
            </div>
          </div>

          {/* Values VISIBLE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{t('percentil')}</p>
              <p className="text-xl font-bold text-foreground">{percentile}%</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground">{t('posio')}</p>
              <p className="text-xl font-bold text-[#C9A961]">Top {100 - percentile}%</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{t('score_global')}</p>
              <p className="text-xl font-bold text-foreground">{Math.round(avgScore)}/100</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {lang === 'en' ? <>You are in the <span className="font-semibold text-foreground">percentile {percentile}</span>, which means your CV is better than {percentile}% of CVs analysed in the market.</> : <>→ Estás no <span className="font-semibold text-foreground">percentil {percentile}</span>, o que significa que o teu CV é melhor que {percentile}% dos CVs analisados no mercado.</>}
          </p>

          {/* Interpretação detalhada quando pago */}
          {isPaid && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">{t('interpretao_do_teu_posicionamento')}</p>
              <p className="text-sm text-muted-foreground">
                {lang === 'en' ? (
                  percentile >= 90 ? (
                    <>Your CV is in the <strong className="text-foreground">top {100 - percentile}%</strong> of analysed candidates. This places you in a position of excellence — in a process with 100 candidates, your CV would be better than {percentile} of them. Your profile stands out for the quality of structure, content and presentation. Maintain this level and focus on customising your CV for each specific application.</>
                  ) : percentile >= 75 ? (
                    <>With a score in the <strong className="text-foreground">percentile {percentile}</strong>, your CV ranks above the vast majority of candidates. In a process with 100 candidates, you would surpass {percentile} of them. You are {90 - percentile} percentile points from the top 10% — small adjustments in the identified areas can make the difference to reach excellence.</>
                  ) : percentile >= 50 ? (
                    <>Your CV is in the <strong className="text-foreground">percentile {percentile}</strong>, above average but with significant room for improvement. In a competitive process, you could lose to candidates with more optimised CVs. Focus on the dimensions with the lowest score to quickly move up.</>
                  ) : (
                    <>Your CV is in the <strong className="text-foreground">percentile {percentile}</strong>, below the market average. This means that {100 - percentile}% of analysed CVs are more competitive. The good news is there is plenty of room for improvement — follow the recommendations below to significantly improve your positioning.</>
                  )
                ) : (
                  percentile >= 90 ? (
                    <>O teu CV está no <strong className="text-foreground">top {100 - percentile}%</strong> dos candidatos analisados. Isto coloca-te numa posição de excelência — num processo com 100 candidatos, o teu CV seria melhor que {percentile} deles. O teu perfil destaca-se pela qualidade da estrutura, conteúdo e apresentação. Mantém este nível e foca-te em personalizar o CV para cada candidatura específica.</>
                  ) : percentile >= 75 ? (
                    <>Com um score no <strong className="text-foreground">percentil {percentile}</strong>, o teu CV posiciona-se acima da grande maioria dos candidatos. Num processo com 100 candidatos, superarias {percentile} deles. Estás a {90 - percentile} pontos percentuais do top 10% — pequenos ajustes nas áreas identificadas podem fazer a diferença para atingir a excelência.</>
                  ) : percentile >= 50 ? (
                    <>O teu CV está no <strong className="text-foreground">percentil {percentile}</strong>, acima da média mas com margem significativa de melhoria. Num processo competitivo, poderias perder para candidatos com CVs mais optimizados. Foca-te nas dimensões com score mais baixo para subir rapidamente de posição.</>
                  ) : (
                    <>O teu CV está no <strong className="text-foreground">percentil {percentile}</strong>, abaixo da média do mercado. Isto significa que {100 - percentile}% dos CVs analisados são mais competitivos. A boa notícia é que há muito espaço para melhoria — segue as recomendações abaixo para subir significativamente o teu posicionamento.</>
                  )
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === 'en' ? <>→ To move to the next level, you need to increase your global score by approximately <strong className="text-foreground">{percentile >= 90 ? '2-3' : percentile >= 75 ? '5-8' : '10-15'} points</strong>.</> : <>→ Para subir para o próximo nível, precisas de aumentar o score global em aproximadamente <strong className="text-foreground">{percentile >= 90 ? '2-3' : percentile >= 75 ? '5-8' : '10-15'} pontos</strong>.</>}
              </p>
            </div>
          )}

          {/* Chart - blurred if not paid */}
          <div className="relative">
            {!isPaid && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
                <Lock className="w-6 h-6 text-[#C9A961] mb-2" />
                <p className="text-sm font-semibold text-foreground">{t('grfico_completo_no_relatrio_pago')}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">{t('v_a_curva_de_distribuio')}</p>
                <Button
                  onClick={() => openPaymentModal()}
                  size="sm"
                  className="bg-[#C9A961] hover:bg-[#A88B4E] text-white"
                >
{pick(`Desbloquear desde ${CUR}${P.cv}`, `Unlock from ${CUR}${P.cv}`, `Desbloquear desde ${CUR}${P.cv}`)}
                 </Button>
               </div>
            )}
            <div className={!isPaid ? 'select-none' : ''}>
              <NormalCurveChart percentile={percentile} />
            </div>
          </div>
        </div>

        {/* ═══ Potencial de Automação ═══ */}
        <AutomationRiskBlock blurred={!isPaid} automationRisk={analysisData.automationRisk} />

        {/* ═══ Matriz de Oportunidades ═══ */}
        {!isPaid ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('matriz_de_oportunidades_relatrio_completo')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('o_relatrio_completo_inclui_estas')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<LockedSection
                
                 title={t('anlise_detalhada_por_quadrante')}
                visibleHint={t('breakdown_completo_de_cada_dimenso')}
                previewItems={lang === 'en' ? ['Visual structure and information hierarchy', 'Alignment between skills and target role', 'Keywords and ATS filter compatibility', 'Market positioning'] : ['Estrutura visual e hierarquia de informação', 'Alinhamento entre competências e função-alvo', 'Keywords e compatibilidade com filtros ATS', 'Posicionamento face ao mercado']}
              />
<LockedSection
                
                 title={t('comparao_com_perfis_top_25')}
                visibleHint={t('v_como_o_teu_cv')}
                previewItems={lang === 'en' ? ['Benchmark against best CVs in sector', 'Missing differentiating skills', 'Positioning vs competitors', 'Gap analysis with recommendations'] : ['Benchmark contra os melhores CVs do setor', 'Competências diferenciadoras em falta', 'Posicionamento face a concorrentes', 'Gap analysis com recomendações']}
              />
<LockedSection
                
                 title={t('recomendaes_especficas_15')}
                visibleHint={t('mais_de_15_microinsights_com')}
                previewItems={lang === 'en' ? ['Optimised professional summary rewrite', 'Reformulation with impact metrics', 'ATS keyword optimisation', 'Visual formatting suggestions'] : ['Reescrita otimizada do resumo profissional', 'Reformulação com métricas de impacto', 'Otimização de keywords para ATS', 'Sugestões de formatação visual']}
              />
<LockedSection
                
                 title={t('plano_de_aco_30_dias')}
                visibleHint={t('plano_estruturado_com_35_aces')}
                previewItems={lang === 'en' ? ['3-5 ordered priority actions', 'Implementation timeline', 'Quick improvements checklist', 'Application strategy'] : ['3-5 acções prioritárias ordenadas', 'Timeline de implementação', 'Checklist de melhorias rápidas', 'Estratégia de candidatura']}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ═══ Análise Detalhada por Dimensão ═══ */}
            <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoldIcon size="w-8 h-8">
                  <BarChart3 className="w-4 h-4 text-[#C9A961]" />
                </GoldIcon>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('anlise_detalhada_por_dimenso')}</p>
              </div>
              <div className="space-y-4">
                {analysisData.quadrants.map((q: any, idx: number) => {
                  const gap = q.score - q.benchmark;
                  const isStrong = gap >= 10;
                  const isWeak = gap <= 0;
                  return (
                    <div key={q.title} className="p-3 bg-muted/20 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{lang === 'en' ? (quadrantTitleEN[q.title] || q.title) : q.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{q.score}/100</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${isStrong ? 'text-green-600 bg-green-500/10' : isWeak ? 'text-red-600 bg-red-500/10' : 'text-yellow-600 bg-yellow-500/10'}`}>
                            {gap >= 0 ? '+' : ''}{gap} vs benchmark
                          </span>
                        </div>
                      </div>
                      {q.detailed_feedback ? (
                        <p className="text-sm text-muted-foreground">{q.detailed_feedback}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {isStrong ? (
                            lang === 'en' ? <>✅ <strong>Strong point.</strong> You are {gap} points above the benchmark ({q.benchmark}).</> : <>✅ <strong>Ponto forte.</strong> Estás {gap} pontos acima do benchmark ({q.benchmark}).</>
                          ) : isWeak ? (
                            lang === 'en' ? <>⚠️ <strong>Area for improvement.</strong> You are {Math.abs(gap)} points below the benchmark ({q.benchmark}).</> : <>⚠️ <strong>Área de melhoria.</strong> Estás {Math.abs(gap)} pontos abaixo do benchmark ({q.benchmark}).</>
                          ) : (
                            lang === 'en' ? <>→ <strong>Above average.</strong> You are {gap} points above the benchmark ({q.benchmark}).</> : <>→ <strong>Acima da média.</strong> Estás {gap} pontos acima do benchmark ({q.benchmark}).</>
                          )}
                        </p>
                      )}
                      {q.strengths && q.strengths.length > 0 && (
                        <div className="mt-1">
                          {q.strengths.map((s: string, i: number) => (
                            <p key={i} className="text-sm text-green-600 flex items-start gap-1.5"><span className="shrink-0">✅</span> {s}</p>
                          ))}
                        </div>
                      )}
                      {q.weaknesses && q.weaknesses.length > 0 && (
                        <div className="mt-1">
                          {q.weaknesses.map((w: string, i: number) => (
                            <p key={i} className="text-sm text-red-500 flex items-start gap-1.5"><span className="shrink-0">⚠️</span> {w}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ Matriz de Prioridades ═══ */}
            <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoldIcon size="w-8 h-8">
                  <Target className="w-4 h-4 text-[#C9A961]" />
                </GoldIcon>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('matriz_de_prioridades')}</p>
              </div>
              <p className="text-sm text-muted-foreground">{t('dimenses_ordenadas_por_urgncia_de')}</p>
              <div className="space-y-2">
                {[...dimensions].sort((a: any, b: any) => (a.score - a.benchmark) - (b.score - b.benchmark)).map((dim: any, i: number) => {
                  const gap = dim.score - dim.benchmark;
                  const priority = gap <= 0 ? (t('alta')) : gap <= 10 ? (lang === 'en' ? 'Medium' : lang === 'es' ? 'Media' : 'Média') : (t('baixa'));
                  const prColor = (priority === 'Alta' || priority === 'High') ? 'bg-red-500/10 text-red-600 border-red-500/20' : (priority === 'Média' || priority === 'Medium') ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20';
                  return (
                    <div key={dim.label} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <span className="text-sm font-medium text-foreground">{dim.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{dim.score}/{dim.benchmark}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${prColor}`}>{priority}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ Acções de Melhoria com Antes/Depois ═══ */}
            {analysisData.improvementActions && analysisData.improvementActions.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8">
                    <Sparkles className="w-4 h-4 text-[#C9A961]" />
                  </GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('aces_de_melhoria_antes_vs')}</p>
                </div>
                <p className="text-sm text-muted-foreground">{t('aces_concretas_para_melhorar_o')}</p>
                <div className="space-y-4">
                  {analysisData.improvementActions.map((action: any, i: number) => (
                    <div key={i} className="border border-border rounded-lg overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">#{i + 1}</span>
                          <span className="text-sm font-semibold text-foreground">{action.action}</span>
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded">+{lang === 'en' ? (action.impact === 'Alto' ? 'High' : action.impact === 'Médio' ? 'Medium' : action.impact === 'Baixo' ? 'Low' : action.impact) : action.impact} {t('pontos')}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                        <div className="p-3">
                          <p className="text-[10px] font-semibold text-red-500 mb-1">{t('antes')}</p>
                          <p className="text-sm text-muted-foreground">{typeof action.before === 'object' ? JSON.stringify(action.before) : String(action.before || '')}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] font-semibold text-green-600 mb-1">{t('depois')}</p>
                          <p className="text-sm text-muted-foreground">{typeof action.after === 'object' ? JSON.stringify(action.after) : String(action.after || '')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20">
                  <p className="text-sm text-foreground font-medium">
                    {t('score_estimado_aps_melhorias')}<strong className="text-[#C9A961]">{Math.min(100, Math.round(avgScore) + (analysisData.improvementActions?.reduce((sum: number, a: any) => sum + (a.impact === 'Alto' || a.impact === 'High' ? 8 : a.impact === 'M\u00e9dio' || a.impact === 'Medium' ? 5 : typeof a.impact === 'number' ? a.impact : 3), 0) || 0))}/100</strong>
                  </p>
                </div>
              </div>
            )}

            {/* ═══ Plano de Acção 30 Dias ═══ */}
            <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoldIcon size="w-8 h-8">
                  <Calendar className="w-4 h-4 text-[#C9A961]" />
                </GoldIcon>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('plano_de_aco_30_dias_2')}</p>
              </div>
              <div className="space-y-3">
                {(analysisData.actionPlan || (lang === 'en' ? [
                  { week: 'Week 1-2', title: 'Content Optimisation', tasks: ['Rewrite professional summary with impact metrics', 'Add quantifiable results to each experience', 'Align keywords with target roles'] },
                  { week: 'Week 3', title: 'Structure and Formatting', tasks: ['Optimise visual hierarchy and spacing', 'Ensure ATS compatibility (format, fonts, sections)', 'Add missing sections (certifications, languages, etc.)'] },
                  { week: 'Week 4', title: 'Validation and Adjustments', tasks: ['Get feedback from 2-3 industry professionals', 'Test on different ATS systems', 'Customise versions for specific applications'] },
                ] : [
                  { week: 'Semana 1-2', title: 'Optimização de Conteúdo', tasks: ['Reescrever resumo profissional com métricas de impacto', 'Adicionar resultados quantificáveis a cada experiência', 'Alinhar keywords com as funções-alvo'] },
                  { week: 'Semana 3', title: 'Estrutura e Formatação', tasks: ['Optimizar hierarquia visual e espaçamento', 'Garantir compatibilidade ATS (formato, fontes, secções)', 'Adicionar secções em falta (certificações, idiomas, etc.)'] },
                  { week: 'Semana 4', title: 'Validação e Ajustes', tasks: ['Pedir feedback a 2-3 profissionais da área', 'Testar em diferentes sistemas ATS', 'Personalizar versões para candidaturas específicas'] },
                ])).map((phase: any, i: number) => (
                  <div key={i} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{phase.week}</span>
                      <span className="text-sm font-semibold text-foreground">{phase.title}</span>
                    </div>
                    {phase.tasks.map((task, j) => (
                      <p key={j} className="text-sm text-muted-foreground ml-4 flex items-start gap-2 mb-1">
                        <span className="text-muted-foreground/50 shrink-0">○</span> {task}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}



        {/* ═══ Career Path Loading (Bundle auto-generation) ═══ */}
        {careerPathPaymentStep === 'generating' && !careerPathData && (
          <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/15 border-2 border-[#C9A961]/30 rounded-2xl p-4 sm:p-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#C9A961] mx-auto" />
            <div>
              <p className="text-lg font-semibold text-foreground">{t('a_gerar_o_teu_career')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('a_analisar_o_teu_perfil')}</p>
            </div>
            {careerPathError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{careerPathError}</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ Career Path Cross-sell — Premium Dark Upsell ═══ */}
        {isPaid && !careerPathData && careerPathPaymentStep !== 'generating' && careerPathPaymentStep !== 'done' && (
          <div className="relative overflow-hidden rounded-2xl border border-[#C9A961]/40" style={{background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)'}}>
            {/* Decorative gold accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C9A961] to-transparent" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#C9A961]/5 rounded-full blur-3xl" />
            
            <div className="relative p-4 sm:p-8 space-y-6">
              {/* Header with urgency badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center">
                    <Compass className="w-6 h-6 text-[#C9A961]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{t('o_teu_cv_est_analisado')}</p>
                    <p className="text-sm text-white/50">{t('no_fiques_pelo_diagnstico_constri')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">{t('desconto_de_upgrade')}</span>
                </div>
              </div>

              {/* Cost of inaction comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-[10px] font-bold text-white/40 tracking-wider uppercase">{t('coaching_de_carreira_tradicional')}</p>
                  <p className="text-2xl font-bold text-white/30 line-through">{t('300800')}</p>
                  <p className="text-xs text-white/30">{t('36_sesses_semanas_de_espera')}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#C9A961]/10 border border-[#C9A961]/30 space-y-2">
                  <p className="text-[10px] font-bold text-[#C9A961] tracking-wider uppercase">{t('career_path_ia_preo_de')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-white/40 line-through">{CUR}{P.career}</span>
                    <span className="text-2xl font-bold text-[#C9A961]">{t('1499')}</span>
                  </div>
                  <p className="text-xs text-[#C9A961]/70">{t('instantneo_ia_avanada_personalizado')}</p>
                </div>
              </div>

              {/* What you get — compact grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { icon: <Briefcase className="w-3.5 h-3.5" />, text: t('3_prximos_cargos') },
                  { icon: <TrendingUp className="w-3.5 h-3.5" />, text: t('progresso_salarial') },
                  { icon: <GraduationCap className="w-3.5 h-3.5" />, text: t('plano_de_formao') },
                  { icon: <Linkedin className="w-3.5 h-3.5" />, text: t('cv_vs_linkedin') },
                  { icon: <Users className="w-3.5 h-3.5" />, text: t('estratgia_networking') },
                  { icon: <Target className="w-3.5 h-3.5" />, text: t('plano_306090_dias') },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <span className="text-[#C9A961]">{item.icon}</span>
                    <p className="text-[11px] text-white/70 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  onClick={() => { setCareerPathIsUpgrade(true); setShowCareerPathModal(true); setCareerPathPaymentStep('info'); }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl bg-[#C9A961] hover:bg-[#d4af5a] text-[#0a0a0a] font-bold text-base transition-all shadow-lg shadow-[#C9A961]/20 hover:shadow-[#C9A961]/40"
                >
                  <Compass className="w-5 h-5" />
                  {t('fazer_upgrade_por_1499')}
                </button>
                <p className="text-[10px] text-white/30 text-center">{t('pagamento_nico_relatrio_ia_personalizado')}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Career Path Results (when purchased) ═══ */}
        {careerPathData && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/15 border-2 border-[#C9A961]/30 rounded-2xl p-3 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <GoldIcon><Rocket className="w-5 h-5 text-[#C9A961]" /></GoldIcon>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961]">CAREER PATH</p>
                  <p className="text-lg font-bold text-foreground">{t('o_teu_plano_de_evoluo')}</p>
                </div>
              </div>
              {careerPathData.current_positioning && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground">{t('posicionamento_actual')}</span>
                    <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{careerPathData.current_positioning.seniority_level}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{careerPathData.current_positioning.seniority_justification}</p>
                  <div className="space-y-3 mt-3">
                    <div className="p-3 bg-card rounded-lg border border-border">
                      <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{t('domnio_principal')}</p>
                      <p className="text-sm font-medium text-foreground">{careerPathData.current_positioning.primary_domain}</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border border-border">
                      <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{t('valor_de_mercado')}</p>
                      <p className="text-sm text-foreground">{careerPathData.current_positioning.market_value_assessment}</p>
                    </div>
                  </div>
                  {careerPathData.current_positioning.competitive_advantages && (
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold text-green-600 mb-2">{t('vantagens_competitivas')}</p>
                      <div className="flex flex-wrap gap-2">
                        {careerPathData.current_positioning.competitive_advantages.map((adv: string, i: number) => (
                          <span key={i} className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded border border-green-500/20">{adv}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {careerPathData.current_positioning.blind_spots && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold text-amber-600 mb-2">{t('pontos_cegos')}</p>
                      <div className="flex flex-wrap gap-2">
                        {careerPathData.current_positioning.blind_spots.map((bs: string, i: number) => (
                          <span key={i} className="text-xs bg-amber-500/10 text-amber-600 px-2 py-1 rounded border border-amber-500/20">{bs}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {careerPathData.cv_linkedin_cross_analysis?.consistency_score && (
              <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Linkedin className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">CV vs LINKEDIN</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${careerPathData.cv_linkedin_cross_analysis.consistency_score === 'Alta' ? 'bg-green-500/10 text-green-600' : careerPathData.cv_linkedin_cross_analysis.consistency_score === 'Média' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>{t('consistncia')}: {careerPathData.cv_linkedin_cross_analysis.consistency_score}</span>
                </div>
                {careerPathData.cv_linkedin_cross_analysis.optimization_suggestions?.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-[#C9A961] mt-0.5">→</span><p>{s}</p></div>
                ))}
              </div>
            )}

            {careerPathData.next_roles?.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Briefcase className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('prximos_cargos_recomendados')}</p>
                </div>
                <div className="space-y-4">
                  {careerPathData.next_roles.map((role: any, i: number) => (
                    <div key={i} className="border border-border rounded-lg overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">#{i + 1}</span>
                          <span className="text-sm font-semibold text-foreground">{role.role_title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${(role.timeline?.includes('Curto') || role.timeline?.includes('Short')) ? 'border-green-500/30 text-green-600 bg-green-500/10' : (role.timeline?.includes('Médio') || role.timeline?.includes('Medium')) ? 'border-amber-500/30 text-amber-600 bg-amber-500/10' : 'border-blue-500/30 text-blue-600 bg-blue-500/10'}`}>{role.timeline}</span>
                          {role.fit_percentage && (
                          <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            {role.fit_percentage}% fit
                          </span>
                          )}
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm text-muted-foreground">{role.why_this_role}</p>
                        {role.salary_range && <p className="text-xs text-[#C9A961] font-semibold"><Euro className="w-3 h-3 inline mr-1" />{role.salary_range}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div><p className="text-[10px] font-semibold text-green-600 mb-1">{t('j_tens')}</p>{role.what_you_already_have?.map((item: string, j: number) => <p key={j} className="text-xs text-muted-foreground"><Check className="w-3 h-3 text-green-500 shrink-0 inline" /> {item}</p>)}</div>
                          <div><p className="text-[10px] font-semibold text-amber-600 mb-1">{t('precisas')}</p>{role.what_you_need?.map((item: string, j: number) => <p key={j} className="text-xs text-muted-foreground">○ {item}</p>)}</div>
                        </div>
                        {role.typical_companies && <div className="flex flex-wrap gap-1 mt-1">{role.typical_companies.map((c: string, j: number) => <span key={j} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{c}</span>)}</div>}
                        {/* LinkedIn Search Button */}
                        <div className="mt-3 pt-3 border-t border-border">
                          <a
                            href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role.role_title)}&location=${t('portugal')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5]/10 text-[#0077B5] text-xs font-semibold hover:bg-[#0077B5]/20 transition-colors border border-[#0077B5]/20"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                            {pick(`Procurar "${role.role_title}" no LinkedIn`, `Search "${role.role_title}" on LinkedIn`, `Buscar "${role.role_title}" en LinkedIn`)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {careerPathData.development_plan?.formations && (
              <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><GraduationCap className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('formaes_recomendadas')}</p>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.formations.map((f: any, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground">{f.name}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${(f.priority === 'Alta' || f.priority === 'High') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : (f.priority === 'Média' || f.priority === 'Medium') ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-green-500/10 text-green-600 border border-green-500/20'}`}>{f.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.provider} · {f.duration} · {f.cost}</p>
                      <p className="text-xs text-muted-foreground mt-1">{f.relevance}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(f.name + ' ' + (f.provider || '') + (t('curso')))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#C9A961] hover:underline inline-flex items-center gap-1 px-2 py-1 rounded bg-[#C9A961]/5 border border-[#C9A961]/20"
                        >
                          <ExternalLink className="w-3 h-3" />{t('pesquisar_formao')}
                        </a>
                        <a
                          href={`https://www.coursera.org/search?query=${encodeURIComponent(f.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/5 border border-blue-500/20"
                        >
                          <GraduationCap className="w-3 h-3" />Coursera
                        </a>
                        <a
                          href={`https://www.udemy.com/courses/search/?q=${encodeURIComponent(f.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-500/5 border border-purple-500/20"
                        >
                          <GraduationCap className="w-3 h-3" />Udemy
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Free Micro-Courses */}
            {careerPathData.development_plan?.free_courses && careerPathData.development_plan.free_courses.length > 0 && (
              <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-2 border-green-500/20 rounded-2xl p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Sparkles className="w-4 h-4 text-green-600" /></GoldIcon>
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-green-700">{t('microcursos_gratuitos_para_comear_j')}</p>
                    <p className="text-[10px] text-green-600/70">{t('comea_a_aprender_hoje_sem')}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.free_courses.map((fc: any, i: number) => {
                    const platformSearchUrls: Record<string, string> = {
                      'Coursera': 'https://www.coursera.org/search?query=',
                      'edX': 'https://www.edx.org/search?q=',
                      'LinkedIn Learning': 'https://www.linkedin.com/learning/search?keywords=',
                      'Google Digital Garage': 'https://www.google.com/search?q=site:learndigital.withgoogle.com+',
                      'Khan Academy': 'https://www.khanacademy.org/search?search_again=1&page_search_query=',
                      'freeCodeCamp': 'https://www.freecodecamp.org/news/search/?query=',
                      'Udemy': 'https://www.udemy.com/courses/search/?q=',
                    };
                    const query = fc.search_query || fc.name;
                    const platformBase = fc.platform && platformSearchUrls[fc.platform];
                    const searchUrl = platformBase
                      ? `${platformBase}${encodeURIComponent(query)}`
                      : `https://www.google.com/search?q=${encodeURIComponent(query + ' ' + (fc.platform || '') + (t('curso_gratuito')))}`;
                    return (
                      <div key={i} className="p-3 border border-green-500/20 rounded-lg bg-white/50">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-foreground">{fc.name}</p>
                          <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            {t('gratuito')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {fc.provider && <span className="font-medium">{fc.provider}</span>}
                          {fc.provider && fc.platform && ' \u00b7 '}
                          {fc.platform && <span>{fc.platform}</span>}
                          {fc.duration && ` \u00b7 ${fc.duration}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{fc.relevance}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <a
                            href={searchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-700 hover:underline inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 border border-green-500/20"
                          >
                            <ExternalLink className="w-3 h-3" />{t('encontrar_curso')}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {careerPathData.development_plan?.certifications && (
              <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><FileCheck className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('certificaes_recomendadas')}</p>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.certifications.map((c: any, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-foreground">{c.name}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${(c.priority === 'Alta' || c.priority === 'High') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : (c.priority === 'Média' || c.priority === 'Medium') ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-green-500/10 text-green-600 border border-green-500/20'}`}>{c.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.body} · {c.investment}</p>
                      <p className="text-xs text-muted-foreground mt-1">{c.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {careerPathData.development_plan?.visibility_exercises && (
              <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Globe className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('exerccios_de_visibilidade')}</p>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.visibility_exercises.map((v: any, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-lg">
                      <p className="text-sm font-semibold text-foreground">{v.activity}</p>
                      <p className="text-xs text-muted-foreground mt-1"><MapPin className="w-3 h-3 inline mr-1" />{v.platform} · {v.frequency}</p>
                      <p className="text-xs text-muted-foreground mt-1">{v.expected_impact}</p>
                      <p className="text-xs text-[#C9A961] mt-1 font-medium">→ {t('primeiro_passo')}: {v.concrete_first_step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {careerPathData.development_plan?.networking_strategy && (
              <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Users className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('estratgia_de_networking')}</p>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.networking_strategy.map((n: any, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-lg">
                      <p className="text-sm font-semibold text-foreground">{n.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('alvo')}: {n.target}</p>
                      {n.communities && <div className="flex flex-wrap gap-1 mt-1">{n.communities.map((c: string, j: number) => <span key={j} className="text-[10px] bg-[#C9A961]/10 text-[#C9A961] px-2 py-0.5 rounded">{c}</span>)}</div>}
                      {n.events && <div className="flex flex-wrap gap-1 mt-1">{n.events.map((e: string, j: number) => <span key={j} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{e}</span>)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {careerPathData.immediate_actions && (
              <div className="bg-card border border-border rounded-lg p-2.5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Target className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('aces_imediatas')}</p>
                </div>
                <div className="space-y-2">
                  {careerPathData.immediate_actions.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                      <span className="text-xs font-bold text-white bg-[#C9A961] w-6 h-6 rounded-full flex items-center justify-center shrink-0">{a.priority}</span>
                      <div><p className="text-sm font-semibold text-foreground">{a.action}</p><p className="text-xs text-muted-foreground">{a.timeframe} · {a.expected_outcome}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {careerPathData.long_term_vision && (
              <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/15 border-2 border-[#C9A961]/30 rounded-2xl p-3 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Sparkles className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{t('viso_a_5_anos')}</p>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{careerPathData.long_term_vision.five_year_narrative}</p>
                {careerPathData.long_term_vision.key_milestones && (
                  <div className="space-y-2 mt-3">
                    {careerPathData.long_term_vision.key_milestones.map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-1 rounded shrink-0">{m.year}</span>
                        <p className="text-sm text-muted-foreground">{m.milestone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ LinkedIn CV Certification Post ═══ */}
        {isPaid && (() => {
          const atsCompat = 100 - analysisData.atsRejectionRate;
          const role = analysisData.perceivedRole || (t('profissional'));
          const seniority = analysisData.perceivedSeniority || '';
          const topStrengths = analysisData.quadrants
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
            .map(q => q.title);
          const today = new Date().toLocaleDateString(t('ptpt'), { year: 'numeric', month: 'long' });

          const generatePostText = () => {
            if (isEN) {
              return `Do you know if your CV passes the automatic recruitment filters (ATS)?\n\nI tested mine with a tool that simulates those filters and the result surprised me.\n\n\u2705 ATS Compatibility Score: ${atsCompat}%\n\u2705 Overall Score: ${Math.round(avgScore)}/100 (Percentile ${percentile})\n\u2705 Top strengths: ${topStrengths.join(' & ')}\n\nMost CVs are rejected before a human even reads them. This analysis showed me exactly what to fix — and what was already working.\n\n\ud83d\udd17 https://share2inspire.pt/en/cv-analyser\n\nWhat would your CV score be?\n\n#CVAnalysis #ATS #CareerDevelopment #Share2Inspire`;
            }
            return `Sabes se o teu CV passa nos filtros autom\u00e1ticos de recrutamento (ATS)?\n\nTestei o meu numa ferramenta que simula esses filtros e o resultado surpreendeu-me.\n\n\u2705 Score de Compatibilidade ATS: ${atsCompat}%\n\u2705 Score Global: ${Math.round(avgScore)}/100 (Percentil ${percentile})\n\u2705 Pontos fortes: ${topStrengths.join(' e ')}\n\nA maioria dos CVs \u00e9 rejeitada antes de um humano sequer os ler. Esta an\u00e1lise mostrou-me exactamente o que corrigir \u2014 e o que j\u00e1 estava a funcionar.\n\n\ud83d\udd17 https://share2inspire.pt/cv-analyser\n\nQual seria o score do teu CV?\n\n#An\u00e1liseCV #ATS #Carreira #Share2Inspire`;
          };

          const generateCertImage = () => {
            const lang = getLang();
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 630;
            const ctx = canvas.getContext('2d')!;

            // Dark background
            ctx.fillStyle = '#1a1f2e';
            ctx.fillRect(0, 0, 1200, 630);

            // Gold accent lines top & bottom
            const grd = ctx.createLinearGradient(0, 0, 1200, 0);
            grd.addColorStop(0, '#C9A961');
            grd.addColorStop(1, '#E8D5A3');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 1200, 4);
            ctx.fillRect(0, 626, 1200, 4);

            // Title
            ctx.fillStyle = '#C9A961';
            ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.letterSpacing = '4px';
            ctx.fillText('CV CERTIFICATION', 80, 70);
            ctx.letterSpacing = '0px';

            // Role / Seniority
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '700 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.fillText(role, 80, 120);
            if (seniority) {
              ctx.fillStyle = '#999999';
              ctx.font = '400 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
              ctx.fillText(seniority, 80, 150);
            }

            // Divider
            ctx.fillStyle = '#333';
            ctx.fillRect(80, 170, 420, 1);

            // Scores section
            const scores = [
              { label: lang === 'en' ? 'Overall Score' : lang === 'es' ? 'Puntuación Global' : 'Score Global', value: `${Math.round(avgScore)}/100`, sub: `${t('percentil')} ${percentile}` },
              { label: t('compatibilidade_ats_2'), value: `${atsCompat}%`, sub: atsCompat >= 70 ? (t('boa')) : (t('a_melhorar')) },
            ];

            scores.forEach((s, i) => {
              const x = 80 + i * 260;
              ctx.fillStyle = '#C9A961';
              ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
              ctx.letterSpacing = '2px';
              ctx.fillText(s.label.toUpperCase(), x, 210);
              ctx.letterSpacing = '0px';
              ctx.fillStyle = '#FFFFFF';
              ctx.font = '700 44px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
              ctx.fillText(s.value, x, 262);
              ctx.fillStyle = '#888888';
              ctx.font = '400 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
              ctx.fillText(s.sub, x, 288);
            });

            // Quadrant bars
            ctx.fillStyle = '#C9A961';
            ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.letterSpacing = '2px';
            ctx.fillText(t('dimensu00d5es_da_anu00c1lise'), 80, 335);
            ctx.letterSpacing = '0px';

            analysisData.quadrants.forEach((q, i) => {
              const y = 358 + i * 42;
              ctx.fillStyle = '#CCCCCC';
              ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
              ctx.fillText(q.title, 80, y + 12);
              // Bar background
              ctx.fillStyle = '#2a2f3e';
              ctx.beginPath();
              ctx.roundRect(280, y, 300, 16, 8);
              ctx.fill();
              // Bar fill
              const barGrd = ctx.createLinearGradient(280, 0, 280 + (q.score / 100) * 300, 0);
              barGrd.addColorStop(0, '#C9A961');
              barGrd.addColorStop(1, '#E8D5A3');
              ctx.fillStyle = barGrd;
              ctx.beginPath();
              ctx.roundRect(280, y, (q.score / 100) * 300, 16, 8);
              ctx.fill();
              // Score text
              ctx.fillStyle = '#FFFFFF';
              ctx.font = '700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
              ctx.fillText(`${q.score}`, 595, y + 13);
            });

            // Right side - circular gauge
            // ATS label above gauge
            ctx.fillStyle = '#C9A961';
            ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.letterSpacing = '2px';
            ctx.fillText(t('score_de_compatibilidade_ats'), 880, 130);
            ctx.letterSpacing = '0px';
            ctx.textAlign = 'left';
            const cx = 880, cy = 280, radius = 110;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#2a2f3e';
            ctx.lineWidth = 10;
            ctx.stroke();
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (avgScore / 100) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.strokeStyle = '#C9A961';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.stroke();
            // Score number
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '700 64px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(avgScore)}`, cx, cy + 16);
            ctx.fillStyle = '#888888';
            ctx.font = '400 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.fillText('/100', cx, cy + 46);
            ctx.textAlign = 'left';

            // Label under gauge
            const scoreLabel = avgScore >= 80 ? (t('excelente')) : avgScore >= 65 ? (t('forte')) : avgScore >= 50 ? (t('promissor')) : (t('em_desenvolvimento'));
            ctx.fillStyle = '#C9A961';
            ctx.font = '700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.letterSpacing = '3px';
            ctx.fillText(scoreLabel, cx, cy + 145);
            ctx.letterSpacing = '0px';
            ctx.textAlign = 'left';

            // Footer
            ctx.fillStyle = '#333';
            ctx.fillRect(80, 560, 1040, 1);
            ctx.fillStyle = '#C9A961';
            ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.fillText('Share2Inspire', 80, 595);
            ctx.fillStyle = '#888888';
            ctx.font = '400 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.fillText(`CV Analyser \u2022 ${today}`, 220, 595);
            ctx.textAlign = 'right';
            ctx.fillText('https://share2inspire.pt', 1120, 595);
            ctx.textAlign = 'left';

            // Download
            const link = document.createElement('a');
            link.download = `cv-certification-share2inspire.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          };

          const copyPost = () => {
            navigator.clipboard.writeText(generatePostText());
            setPostCopied(true);
            setTimeout(() => setPostCopied(false), 3000);
          };

          return (
            <div className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-3 sm:p-8 space-y-5">
              <div className="flex items-center gap-3">
                <GoldIcon>
                  <Award className="w-5 h-5 text-[#C9A961]" />
                </GoldIcon>
                <div>
                  <p className="text-base font-semibold text-foreground">{t('partilhar_resultado_profissional')}</p>
                  <p className="text-xs text-muted-foreground">{t('gera_um_post_elegante_para')}</p>
                </div>
              </div>

              {/* Preview of the post */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Linkedin className="w-4 h-4 text-[#0077B5]" />
                  <span className="text-xs font-semibold text-muted-foreground">{t('pru00c9visualizau00c7u00c3o_do_post')}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{generatePostText()}</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={copyPost}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0077B5] hover:bg-[#005F8D] text-white font-semibold text-sm transition-colors"
                >
                  {postCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {postCopied ? (t('copiado')) : (t('copiar_post_linkedin'))}
                </button>
                <button
                  onClick={generateCertImage}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('descarregar_imagem_de_certificau00e7u00e3o')}
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                {t('a_imagem_de_certificau00e7u00e3o_estu00e1')}
              </p>
            </div>
          );
        })()}

        {/* ═══ Send Report by Email (only when paid) ═══ */}
        {isPaid && (
          <div id="report-email-section" className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-3 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <GoldIcon>
                <Mail className="w-5 h-5 text-[#C9A961]" />
              </GoldIcon>
              <div>
                <p className="text-base font-semibold text-foreground">{t('receber_relatrio_por_email')}</p>
                <p className="text-xs text-muted-foreground">{t('envia_o_relatrio_completo_para')}</p>
              </div>
            </div>
            
            {reportSent ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm text-green-600">{t('relatrio_enviado_com_sucesso_verifica')}</p>
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={reportEmail || email || sessionStorage.getItem('paymentEmail') || ''}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder={t('seuemailcom')}
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                  />
                  <Button
                    onClick={handleSendReport}
                    disabled={reportSending}
                    className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold px-6"
                  >
                    {reportSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t('enviar')}
                      </>
                    )}
                  </Button>
                </div>
                {reportError && (
                  <p className="text-sm text-red-500">{reportError}</p>
                )}
                {reportSending && (
                  <p className="text-xs text-muted-foreground">{t('a_enviar_o_relatrio_para')}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ Save to Área de Cliente ═══ */}
        {isPaid && (
          <div className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-3 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center">
                <Save className="w-5 h-5 text-[#C9A961]" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{t('guardar_na_rea_de_cliente')}</p>
                <p className="text-xs text-muted-foreground">{t('acede_aos_teus_resultados_a')}</p>
              </div>
            </div>
            {!isLoggedIn ? (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700">{t('faz_login_para_guardar_os')} <a href="/area-cliente/auth" className="underline font-semibold text-[#C9A961] hover:text-[#A88B4E]">{t('iniciar_sesso')}</a></p>
              </div>
            ) : savedToAccount ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm text-green-600">{t('guardado_com_sucesso_consulta_no')}</p>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleSaveToAccount}
                  disabled={savingToAccount}
                  className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold py-3"
                >
                  {savingToAccount ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {t('guardar_na_minha_conta')}
                </Button>
                {saveError && <p className="text-sm text-red-500">{saveError}</p>}
              </>
            )}
          </div>
        )}

          </div>{/* close blurred content layer */}

          {/* Floating unlock overlay on top of blurred content */}
          {!isPaid && (
            <div className="absolute inset-0 z-10 flex items-start justify-center" style={{ paddingTop: '80px' }}>
              <div className="bg-card/95 backdrop-blur-sm border-2 border-[#C9A961]/30 rounded-2xl p-3 sm:p-8 text-center space-y-5 shadow-2xl max-w-lg mx-4 sticky top-28">
                <Lock className="w-8 h-8 text-[#C9A961] mx-auto" />
                <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{t('desbloqueia_o_teu_relatrio_completo')}</p>

                {/* 2 Clean Options: CV Report vs Full Career Diagnosis */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  {/* Option 1: CV Report */}
                  <button
                    onClick={() => openPaymentModal({ name: t('relatrio_cv'), price: P.cv, analyses: 1, voucher_type: 'standard', includes_career_path: false })}
                    className="p-4 rounded-xl border-2 border-border hover:border-[#C9A961]/40 transition-all bg-background/50 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-foreground">{t('relatrio_cv')}</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{CUR}{P.cv}</p>
                    <p className="text-[10px] text-muted-foreground italic mt-0.5">{t('descobre_como_corrigir_os_problemas')}</p>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {t('anlise_ats_completa')}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {t('sugestes_de_melhoria')}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {t('palavraschave_em_falta_2')}</p>
                    </div>
                  </button>

                  {/* Option 2: Full Career Diagnosis - Highlighted */}
                  <button
                    onClick={() => openPaymentModal({ name: t('diagnstico_de_carreira_completo'), price: P.cp, analyses: 1, voucher_type: 'standard', includes_career_path: true })}
                    className="p-4 rounded-xl border-2 border-[#C9A961] bg-[#C9A961]/5 transition-all relative space-y-2"
                  >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="text-[9px] font-bold bg-[#C9A961] text-white px-2.5 py-0.5 rounded-full whitespace-nowrap">{t('melhor_valor')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#C9A961]" />
                      <p className="text-xs font-semibold text-[#C9A961]">{t('diagnstico_completo')}</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{CUR}{P.cp}</p>
                    <p className="text-[10px] text-[#C9A961]/80 italic mt-0.5">{t('plano_completo_para_melhorar_o')}</p>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {t('anlise_cv_completa')}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> Career Path</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {t('skills_gap')}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {t('estimativa_salarial_2')}</p>
                    </div>
                    <p className="text-[10px] text-[#C9A961]/80 italic">{t('inclui_career_path_baseado_no')}</p>
                  </button>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={() => openPaymentModal({ name: t('diagnstico_de_carreira_completo'), price: P.cp, analyses: 1, voucher_type: 'standard', includes_career_path: true })}
                    className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold py-3 text-sm w-full"
                  >
                    {pick(`Desbloquear Diagnóstico Completo — ${CUR}${P.cp}`, `Unlock Full Diagnosis — ${CUR}${P.cp}`, `Desbloquear Diagnóstico Completo — ${CUR}${P.cp}`)}
                  </Button>
                  <Button
                    onClick={() => openPaymentModal({ name: t('relatrio_cv'), price: P.cv, analyses: 1, voucher_type: 'standard', includes_career_path: false })}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    {pick(`Ou apenas o Relatório CV — ${CUR}${P.cv}`, `Or just the CV Report — ${CUR}${P.cv}`, `O solo el Informe CV — ${CUR}${P.cv}`)}
                  </Button>
                  <Button
                    onClick={() => setShowDiscountModal(true)}
                    variant="outline"
                    size="sm"
                    className="border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/5 w-full"
                  >
                    <Ticket className="w-3.5 h-3.5 mr-1.5" />
                    {t('tenho_um_cdigo')}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">{t('pagamento_seguro_via_mb_way')}</p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1"><Users className="w-3 h-3" /> {t('300_cvs_analisados')}</p>
                  <span className="text-muted-foreground/30">|</span>
                  <p className="text-[10px] text-muted-foreground/70">{t('usada_por_profissionais_de_rh')}</p>
                </div>
              </div>
            </div>
          )}
        </div>{/* close blur overlay wrapper */}
      </main>

      {/* ═══ Payment Modal ═══ */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {paymentStep === 'confirm' && (t('confirmar_pacote'))}
              {paymentStep === 'payment' && (t('dados_de_pagamento'))}
              {paymentStep === 'polling' && (t('a_aguardar_pagamento'))}
              {paymentStep === 'success' && (isPaid ? (t('anlise_desbloqueada')) : (t('pagamento_iniciado')))}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Choose Plan & Confirm */}
          {paymentStep === 'confirm' && (
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t('escolhe_o_teu_pacote')}</p>
                <div className="space-y-2">
                  {[
                    {
                      name: t('relatrio_cv'),
                      price: P.cv,
                      analyses: 1,
                      voucher_type: 'standard',
                      includes_career_path: false,
                      features: isEN
                        ? ['Full ATS analysis', 'Improvement suggestions', 'Missing keywords', 'Salary estimate']
                        : ['Análise ATS completa', 'Sugestões de melhoria', 'Palavras-chave em falta', 'Estimativa salarial'],
                    },
                    {
                      name: t('diagnstico_de_carreira_completo'),
                      price: P.cp,
                      analyses: 1,
                      voucher_type: 'standard',
                      includes_career_path: true,
                      popular: true,
                      features: isEN
                        ? ['Full CV analysis', 'Career Path from LinkedIn', 'Skills gap analysis', 'Salary estimate', 'Training recommendations', 'Application strategy']
                        : ['Análise CV completa', 'Career Path baseado no LinkedIn', 'Análise de skills gap', 'Estimativa salarial', 'Recomendações de formação', 'Estratégia de candidatura'],
                    },
                  ].map((plan) => (
                    <button
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedPlan.name === plan.name
                          ? 'border-[#C9A961] bg-[#C9A961]/5'
                          : 'border-border hover:border-[#C9A961]/30'
                      } ${(plan as any).popular ? 'ring-1 ring-[#C9A961]/20' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedPlan.name === plan.name ? 'border-[#C9A961]' : 'border-muted-foreground/40'
                          }`}>
                            {selectedPlan.name === plan.name && (
                              <div className="w-2 h-2 rounded-full bg-[#C9A961]" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                            {(plan as any).popular && (
                              <span className="text-[9px] font-bold bg-[#C9A961] text-white px-1.5 py-0.5 rounded">{t('melhor_valor')}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-lg font-bold text-[#C9A961]">
                          {appliedCoupon ? (
                            <><span className="text-sm line-through text-slate-400 mr-1">{CUR}{plan.price}</span>{CUR}{getDiscountedPrice(plan.price)}</>
                          ) : (
                            <>{CUR}{plan.price}</>
                          )}
                        </span>
                      </div>
                      <div className="ml-7 space-y-0.5">
                        {(plan as any).features?.map((f: string, fi: number) => (
                          <p key={fi} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {f}
                          </p>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPlan.includes_career_path && (
                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <p className="text-xs font-semibold text-green-600 mb-1">{t('career_path_includo')}</p>
                  <p className="text-xs text-muted-foreground">{t('aps_o_pagamento_o_career')}</p>
                </div>
              )}

              <Button
                onClick={() => setPaymentStep('payment')}
                className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
              >
                {appliedCoupon ? (
                  lang === 'en' ? <>Continue to Payment — <span className="line-through text-slate-400 mr-1">{CUR}{selectedPlan.price}</span> {CUR}{getDiscountedPrice(selectedPlan.price)}</> : <>Continuar para Pagamento — <span className="line-through text-slate-400 mr-1">{CUR}{selectedPlan.price}</span> {CUR}{getDiscountedPrice(selectedPlan.price)}</>
                ) : (
                  pick(`Continuar para Pagamento — ${CUR}${selectedPlan.price}`, `Continue to Payment — ${CUR}${selectedPlan.price}`, `Continuar al Pago — ${CUR}${selectedPlan.price}`)
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Payment */}
          {paymentStep === 'payment' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('mtodo_de_pagamento')}</label>
                <div className={`grid gap-3 ${t('gridcols2')}`}>
                  {lang === 'en' ? (
                    <>
                      <button
                        onClick={() => setPaymentMethod('stripe')}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'stripe'
                            ? 'border-[#635BFF] bg-[#635BFF]/5'
                            : 'border-border hover:border-[#635BFF]/30'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 text-[#635BFF]" />
                        <span className="text-sm font-semibold text-foreground">Card</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'paypal'
                            ? 'border-[#0070BA] bg-[#0070BA]/5'
                            : 'border-border hover:border-[#0070BA]/30'
                        }`}
                      >
                        <PayPalIcon className="w-6 h-6 text-[#0070BA]" />
                        <span className="text-sm font-semibold text-foreground">PayPal</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setPaymentMethod('mbway')}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'mbway'
                            ? 'border-[#C9A961] bg-[#C9A961]/5'
                            : 'border-border hover:border-[#C9A961]/30'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 text-[#C9A961]" />
                        <span className="text-sm font-semibold text-foreground">MB WAY</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'paypal'
                            ? 'border-[#0070BA] bg-[#0070BA]/5'
                            : 'border-border hover:border-[#0070BA]/30'
                        }`}
                      >
                        <PayPalIcon className="w-6 h-6 text-[#0070BA]" />
                        <span className="text-sm font-semibold text-foreground">PayPal</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('seuemailcom')}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                />
              </div>

              {paymentMethod === 'mbway' && (
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    {t('telemvel_mb_way')}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="912345678"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                  />
                </div>
              )}

              {paymentError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-500">{paymentError}</p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">
                    {appliedCoupon ? (
                      <><span className="line-through text-muted-foreground mr-2">{CUR}{selectedPlan.price}</span><span className="text-green-600">{CUR}{getDiscountedPrice(selectedPlan.price)}</span></>
                    ) : (
                      <>{CUR}{selectedPlan.price}</>
                    )}
                  </span>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-green-600 text-right -mt-2">{appliedCoupon.percent}% {t('desconto')} ({appliedCoupon.code})</p>
                )}
                <Button
                  onClick={handlePayment}
                  disabled={loading}
                  className={`w-full font-semibold ${
                    paymentMethod === 'stripe'
                      ? 'bg-[#635BFF] hover:bg-[#5046E5] text-white'
                      : paymentMethod === 'paypal'
                        ? 'bg-[#0070BA] hover:bg-[#005EA6] text-white'
                        : 'bg-[#C9A961] hover:bg-[#A88B4E] text-white'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('a_processar')}
                    </>
                  ) : paymentMethod === 'stripe' ? (
                    'Pay with Card'
                  ) : paymentMethod === 'mbway' ? (
                    t('pagar_com_mb_way')
                  ) : (
                    <>
                      <PayPalIcon className="w-4 h-4 mr-2" />
                      {t('pagar_com_paypal')}
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setPaymentStep('confirm')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('voltar_2')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Polling (MB WAY only) */}
          {paymentStep === 'polling' && (
            <div className="space-y-5 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8 text-[#C9A961]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">{t('pedido_enviado_para_mb_way')}</h3>
                <p className="text-sm text-muted-foreground">
                  {lang === 'en' ? <>Open the MB WAY app on your phone and approve the payment of <span className="font-semibold text-foreground">{CUR}{getDiscountedPrice(selectedPlan.price)}</span>.</> : <>Abre a app MB WAY no telemóvel e aprova o pagamento de <span className="font-semibold text-foreground">{CUR}{getDiscountedPrice(selectedPlan.price)}</span>.</>}
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  {!pollingExpired ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#C9A961]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-sm text-muted-foreground">{pollingMessage}</span>
                </div>
              </div>
              {pollingExpired && (
                <Button
                  onClick={handleManualCheck}
                  className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t('j_paguei_verificar_novamente')}
                </Button>
              )}
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="outline"
                className="w-full"
              >
                {t('fechar_o_pagamento_continua_a')}
              </Button>
            </div>
          )}

          {/* Step 4: Success */}
          {paymentStep === 'success' && (
            <div className="space-y-5 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                {isPaid ? (
                  <Unlock className="w-8 h-8 text-green-500" />
                ) : (
                  <FileCheck className="w-8 h-8 text-[#C9A961]" />
                )}
              </div>
              <div className="space-y-2">
                {isPaid && selectedPlan.includes_career_path ? (
                  <>
                    <h3 className="text-lg font-bold text-green-600">{t('pagamento_confirmado')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('fornece_o_teu_perfil_linkedin')}
                    </p>
                    {/* LinkedIn input for bundle — launches both engines */}
                    <div className="mt-4 space-y-3 text-left">
                      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5" /> {t('o_que_analisamos_do_linkedin')}</p>
                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {t('experincia_profissional')}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {t('rea_de_actuao')}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {t('competncias_identificadas')}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {t('evoluo_de_funes')}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 italic">{t('nenhum_dado_ser_publicado_ou')}</p>
                      </div>
                      <input
                        type="url"
                        value={careerPathLinkedin}
                        onChange={(e) => setCareerPathLinkedin(e.target.value)}
                        placeholder={t('httpslinkedincominteuperfil')}
                        className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961] text-sm"
                      />
                    </div>
                    <div className="p-3 bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-lg mt-2">
                      <p className="text-xs font-semibold text-[#C9A961] mb-1">{t('o_teu_pacote_inclui')}</p>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> {t('relatrio_cv_completo_com_anlise')}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> {t('career_path_com_roadmap_personalizado')}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        // Launch both engines: unlock CV + generate Career Path
                        unlockFullReport();
                        updateAnalysisPayment(P.cp, 'stripe');
                        setShowPaymentModal(false);
                        setShowCareerPathModal(true);
                        setCareerPathPaymentStep('generating');
                        generateCareerPath();
                      }}
                      className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold mt-2"
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      {t('lanar_as_duas_anlises')}
                    </Button>
                  </>
                ) : isPaid ? (
                  <>
                    <h3 className="text-lg font-bold text-green-600">{t('anlise_completa_desbloqueada')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('todas_as_seces_foram_desbloqueadas')}
                    </p>
                    {storedVoucherCode && storedVoucherRemaining && parseInt(storedVoucherRemaining) > 0 && (
                      <div className="mt-4 p-4 bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">{t('o_teu_cdigo_para_futuras')}</p>
                        <p className="text-xl font-mono font-bold text-[#C9A961]">{storedVoucherCode}</p>
                        <p className="text-xs text-muted-foreground mt-1">{pick(`Restam ${storedVoucherRemaining} análise(s)`, `${storedVoucherRemaining} analysis(es) remaining`, `Quedan ${storedVoucherRemaining} análisis`)}</p>
                      </div>
                    )}
                  </>
                ) : paymentMethod === 'paypal' ? (
                  <>
                    <h3 className="text-lg font-bold text-foreground">{t('pagamento_paypal')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('completa_o_pagamento_na_janela')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('para_confirmao_imediata_usa_mb')}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-foreground">{t('pagamento_em_processamento')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('o_pagamento_est_a_ser')}
                    </p>
                  </>
                )}
              </div>
              {/* Show close/view button only for non-career-path success */}
              {!(isPaid && selectedPlan.includes_career_path) && (
                <Button
                  onClick={() => setShowPaymentModal(false)}
                  className={isPaid ? "w-full bg-green-600 hover:bg-green-700 text-white font-semibold" : "w-full"}
                  variant={isPaid ? "default" : "outline"}
                >
                  {isPaid ? (t('ver_anlise_completa')) : (t('fechar'))}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Discount Code Modal ═══ */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#C9A961]" />
              {t('cdigo_de_desconto')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t('introduz_o_teu_cdigo_de')}
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder={t('inserir_cdigo')}
                className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground text-center text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#C9A961] uppercase"
                onKeyDown={(e) => e.key === 'Enter' && handleDiscountValidation()}
              />
            </div>

            {discountError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{discountError}</p>
              </div>
            )}

            {discountSuccess && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-600">{discountSuccess}</p>
              </div>
            )}

            <Button
              onClick={handleDiscountValidation}
              disabled={discountLoading || !discountCode.trim()}
              className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
            >
              {discountLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('a_validar')}
                </>
              ) : (
                t('validar_cdigo')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Career Path Payment Modal ═══ */}
      <Dialog open={showCareerPathModal} onOpenChange={setShowCareerPathModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-[#C9A961]" />
              Career Path {sessionStorage.getItem('careerPathIncluded') === 'true' ? (t('includo')) : careerPathIsUpgrade ? (t('upgrade_1499')) : `— ${CUR}${P.career}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {careerPathPaymentStep === 'info' && (
              <>
                <p className="text-sm text-muted-foreground">{t('para_uma_anlise_mais_completa')}</p>
                <input
                  type="url"
                  value={careerPathLinkedin}
                  onChange={(e) => setCareerPathLinkedin(e.target.value)}
                  placeholder={t('httpslinkedincominteuperfil')}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                />
                <Button
                  onClick={() => {
                    if (sessionStorage.getItem('careerPathIncluded') === 'true') {
                      // Skip payment, go directly to generating
                      setCareerPathPaymentStep('generating');
                      generateCareerPath();
                    } else {
                      setCareerPathPaymentStep('payment');
                    }
                  }}
                  className={`w-full font-semibold ${sessionStorage.getItem('careerPathIncluded') === 'true' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[#C9A961] hover:bg-[#A88B4E] text-white'}`}
                >
                  {sessionStorage.getItem('careerPathIncluded') === 'true' ? (t('gerar_career_path_includo_no')) : (t('continuar_para_pagamento'))}
                </Button>
              </>
            )}

            {careerPathPaymentStep === 'payment' && (
              <>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={careerPathEmail}
                    onChange={(e) => setCareerPathEmail(e.target.value)}
                    placeholder={t('o_teu_email')}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                  />
                  <div className="flex gap-2">
                    {lang === 'pt' && (
                      <button
                        onClick={() => setCareerPathPaymentMethod('mbway')}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${careerPathPaymentMethod === 'mbway' ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border'}`}
                      >
                        <p className="text-sm font-semibold text-foreground">MB WAY</p>
                      </button>
                    )}
                    <button
                      onClick={() => setCareerPathPaymentMethod('stripe')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${careerPathPaymentMethod === 'stripe' ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border'}`}
                    >
                      <p className="text-sm font-semibold text-foreground">{t('carto')}</p>
                    </button>
                    <button
                      onClick={() => setCareerPathPaymentMethod('paypal')}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${careerPathPaymentMethod === 'paypal' ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border'}`}
                    >
                      <p className="text-sm font-semibold text-foreground">PayPal</p>
                    </button>
                  </div>
                  {careerPathPaymentMethod === 'mbway' && (
                    <input
                      type="tel"
                      value={careerPathPhone}
                      onChange={(e) => setCareerPathPhone(e.target.value)}
                      placeholder={t('nmero_de_telemvel')}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                    />
                  )}
                </div>
                {careerPathError && <p className="text-sm text-red-500">{careerPathError}</p>}
                <Button
                  onClick={handleCareerPathPayment}
                  className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
                >
                  {careerPathIsUpgrade
                    ? (t('pagar_1499_e_gerar_career'))
                    : (pick(`Pagar ${CUR}${P.career} e Gerar Career Path`, `Pay ${CUR}${P.career} and Generate Career Path`, `Pagar ${CUR}${P.career} y Generar Career Path`))
                  }
                </Button>
              </>
            )}

            {careerPathPaymentStep === 'polling' && (
              <div className="text-center space-y-3 py-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#C9A961] mx-auto" />
                <p className="text-sm text-muted-foreground">{careerPathPollingMsg}</p>
              </div>
            )}

            {careerPathPaymentStep === 'generating' && (
              <div className="text-center space-y-3 py-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#C9A961] mx-auto" />
                <p className="text-sm font-semibold text-foreground transition-opacity duration-500" key={loadingMsgIndex}>{loadingMessages[loadingMsgIndex]}</p>
                <p className="text-xs text-muted-foreground">{t('isto_pode_demorar_at_30')}</p>
                {careerPathError && <p className="text-sm text-red-500 mt-2">{careerPathError}</p>}
              </div>
            )}

            {careerPathPaymentStep === 'done' && (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <p className="text-sm font-semibold text-green-600">{t('career_path_gerado_com_sucesso')}</p>
                <Button
                  onClick={() => setShowCareerPathModal(false)}
                  className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
                >
                  {t('ver_career_path')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
