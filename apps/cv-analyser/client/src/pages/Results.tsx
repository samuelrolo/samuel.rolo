// CV Analyser v2 - Results Page - Build 2026-02-17
// Free report: ATS score, 4 quadrants, benchmarks, recruiter perception, SALARY IN BLUR
// Paid: Everything unlocked + normal curve + detailed analysis + action plan
// Payment: MB WAY + PayPal options
// Voucher: Code validation for multi-analysis plans via Supabase

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import ATSRejectionBlock from "@/components/ATSRejectionBlock";
import QuadrantCard from "@/components/QuadrantCard";
import DimensionBar from "@/components/DimensionBar";
import ScoreGauge from "@/components/ScoreGauge";
import RecruiterPerception from "@/components/RecruiterPerception";
import LockedSection from "@/components/LockedSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Home as HomeIcon, FileCheck, Lock, TrendingUp, Euro, Info, BarChart3, Grid2x2, Eye, AlertTriangle, Bot, CreditCard, CheckCircle2, Mail, Ticket, Unlock, Target, Sparkles, Calendar, Send, Rocket, GraduationCap, Briefcase, Globe, Users, MapPin, ExternalLink, Linkedin, Compass, Download, Copy, Award, Share2, AlertCircle, Flame, DollarSign, Shield, Star, ChevronRight, Zap, Check } from "lucide-react";
import type { AnalysisData } from "@/types/analysis";
import { trackPurchase } from "@/lib/gtag";
import { trackAffiliateConversion } from "@/lib/affiliate";

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

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
function NormalCurveChart({ percentile, isEN = false }: { percentile: number; isEN?: boolean }) {
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
        {isEN ? 'You' : 'Tu'} ({percentile}%)
      </text>
      <text x={padding} y={height - 5} textAnchor="start" className="text-[10px] fill-current text-muted-foreground">0%</text>
      <text x={padding + curveWidth / 2} y={height - 5} textAnchor="middle" className="text-[10px] fill-current text-muted-foreground">{isEN ? 'Average' : 'Média'}</text>
      <text x={padding + curveWidth} y={height - 5} textAnchor="end" className="text-[10px] fill-current text-muted-foreground">100%</text>
      <line x1={padding} y1={padding + curveHeight} x2={padding + curveWidth} y2={padding + curveHeight} stroke="currentColor" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

/* ─── Salary Block ─── */
function SalaryBlock({ blurred, salaryDetailed, perceivedSeniority, isEN = false, CUR = '€' }: { blurred: boolean; salaryDetailed?: any; perceivedSeniority?: string; isEN?: boolean; CUR?: string }) {
  const sd = salaryDetailed || { percentile25: 1400, median: 1800, percentile75: 2400, topMax: 3200, benefits: [], benefitsNote: '', source: '' };
  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Euro className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'SALARY ESTIMATE' : 'ESTIMATIVA SALARIAL'}</p>
            <Tooltip
              label={isEN ? 'How is the estimate calculated?' : 'Como é calculada a estimativa?'}
              text={isEN ? 'Estimate based on detected professional profile, seniority level, identified skills and salary data for your market. Values are indicative and may vary by region, sector and company size.' : 'Estimativa baseada no perfil profissional detectado, nível de senioridade, competências identificadas e dados salariais do mercado português (Hays, Michael Page, Mercer). Os valores são indicativos e podem variar conforme a região, setor e dimensão da empresa.'}
            />
          </div>
          <p className="text-xs text-muted-foreground">{isEN ? `Based on profile (${perceivedSeniority || 'N/A'}) and market data` : `Com base no perfil (${perceivedSeniority || 'N/D'}) e mercado português`}</p>
        </div>
      </div>

      <div className="relative">
        {blurred && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
            <Lock className="w-8 h-8 text-[#C9A961] mb-2" />
            <p className="text-sm font-semibold text-foreground">{isEN ? 'Unlock to see the exact value' : 'Desbloqueia para ver o valor exacto'}</p>
            <p className="text-xs text-muted-foreground mt-1">{isEN ? 'Available in the full report' : 'Disponível no relatório completo'}</p>
          </div>
        )}
        <div className={blurred ? 'select-none' : ''}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-1">{isEN ? '25th Percentile' : 'Percentil 25'}</p>
              <p className="text-xl font-bold text-foreground">{CUR}{sd.percentile25.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{isEN ? '/month (gross)' : '/mês (bruto)'}</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-[10px] text-muted-foreground mb-1">{isEN ? 'Median' : 'Mediana'}</p>
              <p className="text-xl font-bold text-[#C9A961]">{CUR}{sd.median.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{isEN ? '/month (gross)' : '/mês (bruto)'}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-1">{isEN ? '75th Percentile' : 'Percentil 75'}</p>
              <p className="text-xl font-bold text-foreground">{CUR}{sd.percentile75.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{isEN ? '/month (gross)' : '/mês (bruto)'}</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20">
              <p className="text-[10px] text-muted-foreground mb-1">{isEN ? 'Top (Top Profiles)' : 'Top (Perfis de Topo)'}</p>
              <p className="text-xl font-bold text-[#C9A961]">{CUR}{sd.topMax.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{isEN ? '/month (gross)' : '/mês (bruto)'}</p>
            </div>
          </div>

          {/* Benefits section - only when paid */}
          {!blurred && sd.benefits && sd.benefits.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-foreground mb-3">{isEN ? `Typical benefits for ${perceivedSeniority || 'this level'} in the industry:` : `Benefícios típicos para ${perceivedSeniority || 'este nível'} na indústria:`}</p>
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
                <p className="text-[10px] text-muted-foreground/60 mt-2">{isEN ? 'Source' : 'Fonte'}: {sd.source}</p>
              )}
            </div>
          )}

          {blurred && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {isEN ? 'Estimated values based on market data for your profile' : 'Valores estimados com base em dados do mercado português para o teu perfil'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Automation Risk ─── */
function AutomationRiskBlock({ blurred, automationRisk, isEN = false }: { blurred: boolean; automationRisk?: any; isEN?: boolean }) {
  const ar = automationRisk || { percentage: 35, level: isEN ? 'Medium' : 'Médio', description: isEN ? 'Detailed automation risk analysis for your profile' : 'Análise detalhada do risco de automação para o teu perfil', recommendations: [] };
  const barColor = ar.percentage <= 25 ? 'from-green-400 to-green-500' : ar.percentage <= 50 ? 'from-yellow-400 to-orange-400' : 'from-orange-400 to-red-500';
  const levelColor = ar.percentage <= 25 ? 'text-green-600 bg-green-500/10' : ar.percentage <= 50 ? 'text-yellow-600 bg-yellow-500/10' : 'text-red-600 bg-red-500/10';
  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Bot className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'AI REPLACEMENT POTENTIAL' : 'POTENCIAL DE SUBSTITUIÇÃO POR IA'}</p>
            <Tooltip
              label={isEN ? 'What is the Automation Potential?' : 'O que é o Potencial de Automação?'}
              text={isEN ? 'Estimate of the probability that tasks associated with your professional profile will be automated by AI or robotics in the next 5-10 years. The HIGHER the value, the HIGHER the risk.' : 'Estimativa da probabilidade de as tarefas associadas ao teu perfil profissional serem automatizadas por IA ou robótica nos próximos 5-10 anos. Quanto MAIOR o valor, MAIOR o risco.'}
            />
          </div>
          <p className="text-xs text-muted-foreground">{isEN ? 'Automation risk for your role in the next 5-10 years' : 'Risco de automação da tua função nos próximos 5-10 anos'}</p>
        </div>
      </div>

      <div className="relative">
        {blurred && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
            <Lock className="w-6 h-6 text-[#C9A961] mb-2" />
            <p className="text-sm font-semibold text-foreground">{isEN ? 'Available in the full report' : 'Disponível no relatório completo'}</p>
            <p className="text-xs text-muted-foreground mt-1">{isEN ? 'Discover the automation risk for your role' : 'Descobre o risco de automação da tua função'}</p>
          </div>
        )}
        <div className={blurred ? 'select-none' : ''}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{isEN ? 'Low risk' : 'Baixo risco'}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${levelColor}`}>{ar.level} — {ar.percentage}%</span>
              </div>
              <span className="text-xs text-muted-foreground">{isEN ? 'High risk' : 'Alto risco'}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`} style={{ width: `${ar.percentage}%` }} />
            </div>
            {!blurred && (
              <>
                <p className="text-sm text-muted-foreground">{ar.description}</p>
                {ar.recommendations && ar.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-foreground mb-2">{isEN ? 'Recommendations to mitigate the risk:' : 'Recomendações para mitigar o risco:'}</p>
                    {ar.recommendations.map((r: string, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground flex items-start gap-2 mb-1">
                        <span className="text-[#C9A961] shrink-0">→</span> {r}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
            {blurred && <p className="text-sm text-muted-foreground">{isEN ? '→ Detailed automation risk analysis for your profile' : '→ Análise detalhada do risco de automação para o teu perfil'}</p>}
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
  useEffect(() => { document.title = "Resultados da Análise de CV | Share2Inspire"; }, []);

  const [, setLocation] = useLocation();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
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
  const [isEN] = useState(() => {
    const pathIsEN = window.location.pathname.startsWith('/en/');
    const pathIsPT = !pathIsEN && (window.location.pathname.startsWith('/cv-analyser') || window.location.pathname.startsWith('/career-path'));
    if (pathIsEN) return true;
    if (pathIsPT) return false;
    return sessionStorage.getItem('analysisLang') === 'en';
  });

  // Currency & pricing: PT = EUR, EN = USD
  const CUR = isEN ? '$' : '€';
  const P = isEN
    ? { cv: '5.99', cp: '19.99', career: '19.99' }
    : { cv: '3,99', cp: '12,00', career: '12,00' };
  const CURRENCY_CODE = isEN ? 'USD' : 'EUR';
  const [pollingMessage, setPollingMessage] = useState(() => {
    const pEN = window.location.pathname.startsWith('/en/');
    const pPT = !pEN && (window.location.pathname.startsWith('/cv-analyser') || window.location.pathname.startsWith('/career-path'));
    const en = pEN ? true : pPT ? false : sessionStorage.getItem('analysisLang') === 'en';
    return en ? 'Waiting for MB WAY approval...' : 'A aguardar aprovação no MB WAY...';
  });
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string; analyses: number; voucher_type?: string; includes_career_path?: boolean }>({
    name: isEN ? 'CV Report' : 'Relatório CV',
    price: isEN ? '5.99' : '3,99',
    analyses: 1,
    voucher_type: 'standard',
    includes_career_path: false,
  });

  // Upsell popup state (shown during analysis loading)

  
  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);

  // Email report state
  const [reportEmail, setReportEmail] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [postCopied, setPostCopied] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Career Path state
  const [careerPathData, setCareerPathData] = useState<any>(null);
  const [careerPathLoading, setCareerPathLoading] = useState(false);
  const [careerPathError, setCareerPathError] = useState<string | null>(null);
  const [showCareerPathModal, setShowCareerPathModal] = useState(false);
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
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const loadingMessages = isEN
    ? [
        'Analysing your professional profile...',
        'Mapping career progression paths...',
        'Identifying recommended next roles...',
        'Cross-referencing CV with LinkedIn...',
        'Generating personalised training plan...',
        'Building your 5-year career roadmap...',
        'Preparing your Career Path report...',
      ]
    : [
        'A analisar o teu perfil profissional...',
        'A mapear trajectórias de progressão...',
        'A identificar próximos cargos recomendados...',
        'A cruzar CV com LinkedIn...',
        'A gerar plano de formação personalizado...',
        'A construir o teu roadmap de carreira a 5 anos...',
        'A preparar o teu relatório Career Path...',
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
    
    // Check if already paid (from previous session)
    const paidStatus = sessionStorage.getItem('isPaid');
    if (paidStatus === 'true') {
      setIsPaid(true);
    }

    // Check for Stripe payment return
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
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
            const priceVal = restoredPlan ? parseFloat(String(restoredPlan.price).replace(',', '.')) : 3.99;
            const productName = restoredPlan?.includes_career_path ? 'bundle' : 'cv_analyser';
            trackPurchase(productName, priceVal, `CV-STRIPE-${sessionId}`);
            trackAffiliateConversion({ product: productName, amount: priceVal, currency: isEN ? 'USD' : 'EUR', payment_method: 'stripe', transaction_id: `CV-STRIPE-${sessionId}` });
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
      // Set state and trigger generation after a short delay to allow state to settle
      setCareerPathLinkedin(bundleLinkedin);
      setCareerPathEmail(bundleEmail);
      setCareerPathPaymentStep('generating');
      // Remove flag so it doesn't re-trigger on refresh
      sessionStorage.removeItem('careerPathPaid');
    }
  }, [setLocation]);

  // Auto-generate Career Path when careerPathPaymentStep becomes 'generating' from bundle
  // Note: generateCareerPath is defined below but hoisted via closure
  const autoGenerateRef = useRef<boolean>(false);
  useEffect(() => {
    if (careerPathPaymentStep === 'generating' && !careerPathData && !careerPathLoading && !autoGenerateRef.current) {
      autoGenerateRef.current = true;
      // Small delay to ensure state is settled
      setTimeout(() => {
        generateCareerPath().finally(() => { autoGenerateRef.current = false; });
      }, 300);
    }
  }, [careerPathPaymentStep, careerPathData, careerPathLoading]);
  // Upsell popup removed — only show payment modal when user clicks "Unlock Full Analysis""

  const unlockFullReport = useCallback(() => {
    setIsPaid(true);
    sessionStorage.setItem('isPaid', 'true');
  }, []);

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
    setPollingMessage(isEN ? 'Waiting for MB WAY approval...' : 'A aguardar aprovação no MB WAY...');
  };

  const handleStripePayment = async () => {
    if (!email) {
      setPaymentError('Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError('Please enter a valid email');
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
          language: isEN ? 'en' : 'pt',
          country,
          region,
          currency: CURRENCY_CODE.toLowerCase(),
          amount: parseFloat(selectedPlan.price.replace(',', '.'))
        })
      });
      const data = await response.json();
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Error creating checkout session');
      }
      sessionStorage.setItem('orderId', orderId);
      sessionStorage.setItem('paymentEmail', email);
      updateAnalysisEmail(email);
      sessionStorage.setItem('stripeSessionId', data.sessionId);
      // Save selectedPlan before redirect so it survives page reload
      sessionStorage.setItem('selectedPlanBeforeStripe', JSON.stringify(selectedPlan));
      window.location.href = data.url;
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  const handleMBWayPayment = async () => {
    if (!email || !phone) {
      setPaymentError(isEN ? 'Please fill in all fields' : 'Por favor, preenche todos os campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError(isEN ? 'Please enter a valid email' : 'Por favor, introduz um email válido');
      return;
    }

    const phoneRegex = /^(9[1236]\d{7}|2\d{8})$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPaymentError(isEN ? 'Please enter a valid phone number' : 'Por favor, introduz um número de telemóvel válido');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const analysisDataStr = sessionStorage.getItem('cvAnalysis');
      
      if (!analysisDataStr) {
        throw new Error(isEN ? 'CV data not found' : 'Dados do CV não encontrados');
      }

      const parsedAnalysis = JSON.parse(analysisDataStr);
      const priceNum = parseFloat(selectedPlan.price.replace(',', '.'));
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
          description: `CV Analyser - ${selectedPlan.name}`,
          name: email.split('@')[0],
          analysisData: parsedAnalysis
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('[PAYMENT] Backend error:', data);
        throw new Error(data.error || (isEN ? 'Error processing payment. Try again.' : 'Erro ao processar pagamento. Tenta novamente.'));
      }
      
      sessionStorage.setItem('orderId', orderId);
      sessionStorage.setItem('paymentEmail', email);
      updateAnalysisEmail(email);
      if (data.requestId) {
        sessionStorage.setItem('requestId', data.requestId);
      }
      
      // Move to polling step
      setPaymentStep('polling');
      setPollingMessage(isEN ? 'Confirm the payment in the MB WAY app on your phone...' : 'Confirma o pagamento na app MB WAY do teu telemóvel...');
      startPolling(orderId);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : (isEN ? 'Error processing payment' : 'Erro ao processar pagamento'));
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!email) {
      setPaymentError(isEN ? 'Please enter your email' : 'Por favor, introduz o teu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError(isEN ? 'Please enter a valid email' : 'Por favor, introduz um email válido');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const priceNum = parseFloat(selectedPlan.price.replace(',', '.'));
      sessionStorage.setItem('paymentEmail', email);
      updateAnalysisEmail(email);
      
      // Open PayPal.me directly
      window.open(`https://paypal.me/SamuelRolo/${priceNum}${CURRENCY_CODE}`, '_blank');
      
      // For PayPal, we need manual confirmation - go to success step
      setPaymentStep('success');
    } catch (err) {
      setPaymentError(isEN ? 'Error opening PayPal. Try again.' : 'Erro ao abrir PayPal. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
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
            setPollingMessage(isEN ? 'Unable to verify payment. Use the "I already paid" button to re-check.' : 'Não foi possível verificar o pagamento. Usa o botão "Já paguei" para re-verificar.');
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
          
          setPaymentStep('success');
          return;
        }
        
        const elapsed = Date.now() - startTime;
        if (data.expired) {
          if (elapsed < MIN_BEFORE_EXPIRED) {
            // Ignore early expired — ifthenpay sometimes returns expired too soon
            console.log(`[POLLING] Ignorando expired prematuro (${Math.round(elapsed/1000)}s < 90s)`);
            setPollingMessage(isEN ? 'Checking payment... Confirm in the MB WAY app.' : 'A verificar pagamento... Confirma na app MB WAY.');
          } else {
            console.warn('[POLLING] Pagamento expirado após', Math.round(elapsed/1000), 's');
            clearInterval(pollInterval);
            setPollingExpired(true);
            setPollingMessage(isEN ? 'Payment expired. Use the button below if you already paid.' : 'O pagamento expirou. Usa o botão abaixo se já pagaste.');
          }
          return;
        }
        
        // Still pending — update message based on time
        if (elapsed < 30000) {
          setPollingMessage(isEN ? 'Confirm the payment in the MB WAY app on your phone...' : 'Confirma o pagamento na app MB WAY do teu telemóvel...');
        } else if (elapsed < 60000) {
          setPollingMessage(isEN ? 'Still waiting... Check the MB WAY app.' : 'Ainda a aguardar... Verifica a app MB WAY.');
        } else {
          setPollingMessage(isEN ? 'Waiting for confirmation... If you already approved, wait a few more seconds.' : 'A aguardar confirmação... Se já aprovaste, aguarda mais uns segundos.');
        }
        
        if (attempts >= maxAttempts) {
          console.warn('[POLLING] Timeout atingido');
          clearInterval(pollInterval);
          setPollingExpired(true);
          setPollingMessage(isEN ? 'Time expired. If you already approved the payment, use the button below.' : 'Tempo esgotado. Se já aprovaste o pagamento, usa o botão abaixo.');
        }
      } catch (err) {
        console.error('Erro no polling:', err);
        consecutiveErrors++;
        if (consecutiveErrors >= 8) {
          clearInterval(pollInterval);
          setPollingExpired(true);
          setPollingMessage(isEN ? 'Connection error. Use the button below if you already paid.' : 'Erro de ligação. Usa o botão abaixo se já pagaste.');
        }
      }
    }, 5000); // Poll every 5 seconds
  };

  // Manual re-check for "Já paguei" button
  const handleManualCheck = async () => {
    if (!currentOrderId) return;
    setPollingMessage(isEN ? 'Checking payment...' : 'A verificar pagamento...');
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
        setPaymentStep('success');
      } else {
        setPollingExpired(true);
        setPollingMessage(isEN ? 'Payment not yet confirmed. If you already paid, wait a few seconds and try again.' : 'Pagamento ainda não confirmado. Se já pagaste, aguarda uns segundos e tenta novamente.');
        // Restart polling for another 2 minutes
        startPolling(currentOrderId);
      }
    } catch {
      setPollingExpired(true);
      setPollingMessage(isEN ? 'Error checking. Try again in a few seconds.' : 'Erro ao verificar. Tenta novamente em alguns segundos.');
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
        // Send voucher code by email automatically
        await sendVoucherEmail(userEmail, code, plan.name, plan.analyses);
      }
    } catch (err) {
      console.error('[VOUCHER] Erro ao criar:', err);
    }
  };

  // Validate voucher code
  const handleVoucherValidation = async () => {
    if (!voucherCode.trim()) {
      setVoucherError(isEN ? 'Enter a voucher code' : 'Introduz um código de voucher');
      return;
    }

    setVoucherLoading(true);
    setVoucherError(null);
    setVoucherSuccess(null);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(voucherCode.trim().toUpperCase())}&is_active=eq.true&select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(isEN ? 'Error verifying code' : 'Erro ao verificar código');
      }

      const vouchers = await response.json();
      
      if (vouchers.length === 0) {
        setVoucherError(isEN ? 'Invalid or already used code' : 'Código inválido ou já utilizado');
        return;
      }

      const voucher = vouchers[0];
      const remaining = voucher.total_analyses - voucher.used_analyses;

      if (remaining <= 0) {
        setVoucherError(isEN ? 'This code has no analyses remaining' : 'Este código já não tem análises disponíveis');
        return;
      }

      // Use one analysis
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${voucher.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            used_analyses: voucher.used_analyses + 1,
            is_active: remaining - 1 > 0,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (updateResponse.ok) {
        setVoucherSuccess(isEN ? `Valid code! Analysis unlocked. ${remaining - 1} use(s) remaining.` : `Código válido! Análise desbloqueada. Restam ${remaining - 1} análise(s).`);
        unlockFullReport();
        updateAnalysisPayment(selectedPlan.price, 'voucher', voucherCode);
        
        // If voucher includes career path, auto-unlock it
        if (voucher.includes_career_path || voucher.voucher_type === 'complete') {
          sessionStorage.setItem('careerPathIncluded', 'true');
          setVoucherSuccess(isEN ? `Valid code! Analysis + Career Path unlocked. ${remaining - 1} use(s) remaining.` : `Código válido! Análise + Career Path desbloqueados. Restam ${remaining - 1} análise(s).`);
        }
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowVoucherModal(false);
          setVoucherCode("");
          setVoucherSuccess(null);
        }, 2500);
      } else {
        throw new Error(isEN ? 'Error using code' : 'Erro ao utilizar código');
      }
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : (isEN ? 'Error verifying code' : 'Erro ao verificar código'));
    } finally {
      setVoucherLoading(false);
    }
  };



  // Career Path: initiate payment and generate
  const handleCareerPathPayment = async () => {
    if (!careerPathEmail) {
      setCareerPathError(isEN ? 'Enter your email' : 'Introduz o teu email');
      return;
    }
    if (careerPathPaymentMethod === 'mbway' && !careerPathPhone) {
      setCareerPathError(isEN ? 'Enter your phone number' : 'Introduz o teu número de telemóvel');
      return;
    }
    setCareerPathError(null);
    setCareerPathPaymentStep('polling');
    setCareerPathPollingMsg(isEN ? 'Confirm the payment in the MB WAY app...' : 'Confirma o pagamento na app MB WAY...');

    try {
      const orderId = `CP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const cpAmount = isEN ? '12.50' : '10.00';
      const cpCurrencyCode = isEN ? 'usd' : 'eur';

      if (careerPathPaymentMethod === 'stripe') {
        const stripeRes = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/stripe-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: careerPathEmail,
            name: careerPathEmail.split('@')[0],
            product_type: 'career_path',
            orderId,
            language: isEN ? 'en' : 'pt',
            country: sessionStorage.getItem('analysisCountry') || '',
            region: sessionStorage.getItem('analysisRegion') || '',
            currency: cpCurrencyCode,
            amount: parseFloat(cpAmount)
          })
        });
        const stripeData = await stripeRes.json();
        if (!stripeData.success || !stripeData.url) {
          throw new Error(stripeData.error || 'Error creating checkout session');
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
      if (!data.success) throw new Error(data.error || (isEN ? 'Payment error' : 'Erro no pagamento'));

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
            setCareerPathPollingMsg(isEN ? 'Payment confirmed! Generating your Career Path...' : 'Pagamento confirmado! A gerar o teu Career Path...');
            await generateCareerPath();
          } else if (pollData.expired) {
            const elapsed = Date.now() - cpStartTime;
            if (elapsed < 90000) {
              // Ignore early expired
              console.log(`[CP-POLLING] Ignorando expired prematuro (${Math.round(elapsed/1000)}s)`);
              setCareerPathPollingMsg(isEN ? 'Checking payment... Confirm in the MB WAY app.' : 'A verificar pagamento... Confirma na app MB WAY.');
            } else {
              clearInterval(pollInterval);
              setCareerPathError(isEN ? 'Payment expired. Try again.' : 'Pagamento expirado. Tenta novamente.');
              setCareerPathPaymentStep('payment');
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setCareerPathError(isEN ? 'Time expired. If you already paid, try again.' : 'Tempo esgotado. Se já pagaste, tenta novamente.');
            setCareerPathPaymentStep('payment');
          } else {
            // Update message based on time
            const elapsed = Date.now() - cpStartTime;
            if (elapsed < 30000) {
              setCareerPathPollingMsg(isEN ? 'Confirm the payment in the MB WAY app...' : 'Confirma o pagamento na app MB WAY...');
            } else if (elapsed < 60000) {
              setCareerPathPollingMsg(isEN ? 'Still waiting... Check the MB WAY app.' : 'Ainda a aguardar... Verifica a app MB WAY.');
            } else {
              setCareerPathPollingMsg(isEN ? 'Waiting for confirmation... If you already approved, wait a few more seconds.' : 'A aguardar confirmação... Se já aprovaste, aguarda mais uns segundos.');
            }
          }
        } catch { /* ignore polling errors */ }
      }, 5000);
    } catch (err: any) {
      setCareerPathError(err.message || (isEN ? 'Error processing payment' : 'Erro ao processar pagamento'));
      setCareerPathPaymentStep('payment');
    }
  };

  const generateCareerPath = async () => {
    setCareerPathLoading(true);
    try {
      const cvData = sessionStorage.getItem('cvAnalysis');
      const response = await fetch(`${SUPABASE_URL}/functions/v1/hyper-task`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'career_path',
          cv_text: cvData || '',
          linkedin_url: careerPathLinkedin || undefined,
          language: isEN ? 'en' : 'pt',
          country: sessionStorage.getItem('analysisCountry') || (isEN ? '' : 'Portugal'),
          region: sessionStorage.getItem('analysisRegion') || '',
        })
      });

      const data = await response.json();
      if (!data.success && !data.career_path) throw new Error(data.error || (isEN ? 'Error generating Career Path' : 'Erro ao gerar Career Path'));
      
      setCareerPathData(data.career_path || data);
      setCareerPathPaymentStep('done');
      setShowCareerPathModal(false);
    } catch (err: any) {
      setCareerPathError(err.message || (isEN ? 'Error generating Career Path' : 'Erro ao gerar Career Path'));
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
        { title: isEN ? 'Structure' : 'Estrutura', score: 65, benchmark: 70, impactPhrase: isEN ? 'CV organisation and clarity' : 'Organização e clareza do CV' },
        { title: isEN ? 'Content' : 'Conteúdo', score: 70, benchmark: 72, impactPhrase: isEN ? 'Content quality and relevance' : 'Qualidade e relevância do conteúdo' },
        { title: isEN ? 'Education' : 'Formação', score: 68, benchmark: 65, impactPhrase: isEN ? 'Academic and continuous education' : 'Formação académica e contínua' },
        { title: isEN ? 'Experience' : 'Experiência', score: 72, benchmark: 70, impactPhrase: isEN ? 'Professional experience' : 'Experiência profissional' },
      ];
  if (!analysisData.quadrants || !Array.isArray(analysisData.quadrants) || analysisData.quadrants.length === 0) {
    analysisData = { ...analysisData, quadrants: safeQuadrants };
  }

  const avgScore = analysisData.quadrants.reduce((sum, q) => sum + q.score, 0) / analysisData.quadrants.length;
  const percentile = Math.round(Math.min(95, Math.max(5, avgScore * 0.95)));
  const dimensions = analysisData.quadrants.map(q => ({ label: q.title, score: q.score, benchmark: q.benchmark }));
  // Send report by email — sends analysis data to backend for HTML email generation (like Career Path)
  const handleSendReport = async () => {
    const targetEmail = reportEmail || email || sessionStorage.getItem('paymentEmail') || '';
    if (targetEmail) updateAnalysisEmail(targetEmail);
    if (!targetEmail) {
      setReportError(isEN ? 'Enter a valid email.' : 'Introduz um email válido.');
      return;
    }
    setReportSending(true);
    setReportError(null);
    try {
      const vCode = sessionStorage.getItem('voucherCode');
      const vRemaining = sessionStorage.getItem('voucherRemaining');
      const emailRoute = isEN ? 'send-cv-report-email-en' : 'send-cv-report-email';
      const response = await fetch(`https://share2inspire-beckend.lm.r.appspot.com/api/payment/${emailRoute}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetEmail.split('@')[0],
          analysisData,
          country: sessionStorage.getItem('analysisCountry') || (isEN ? '' : 'Portugal'),
          region: sessionStorage.getItem('analysisRegion') || '',
          voucherCode: vCode || undefined,
          remainingAnalyses: vRemaining ? parseInt(vRemaining) : undefined,
        })
      });
      const data = await response.json();
      if (data.success) {
        setReportSent(true);
      } else {
        throw new Error(data.error || (isEN ? 'Error sending' : 'Erro ao enviar'));
      }
    } catch (err: any) {
      console.error('Erro ao enviar relatório:', err);
      setReportError(err.message || (isEN ? 'Error sending the report. Try again.' : 'Erro ao enviar o relatório. Tenta novamente.'));
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
              <span className="hidden sm:inline">{isEN ? 'Back' : 'Voltar'}</span>
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
                <span className="text-xs sm:text-sm font-semibold text-green-600">{isEN ? 'Full Report' : 'Relatório Completo'}</span>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setShowVoucherModal(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm font-medium border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/5"
                >
                  <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">{isEN ? 'I have a code' : 'Tenho código'}</span>
                  <span className="sm:hidden">{isEN ? 'Code' : 'Código'}</span>
                </Button>
                <Button
                  onClick={() => openPaymentModal()}
                  size="sm"
                  className="bg-[#C9A961] hover:bg-[#A88B4E] text-white text-xs sm:text-sm font-semibold px-3 sm:px-5 py-1.5 sm:py-2"
                >
                  <span className="hidden sm:inline">{isEN ? 'Unlock Full Analysis' : 'Desbloquear Análise Completa'}</span>
                  <span className="sm:hidden">{isEN ? 'Unlock' : 'Desbloquear'}</span>
                </Button>
              </>
            )}
            <a 
              href="https://www.share2inspire.pt" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <HomeIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Report Label */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isPaid ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{isEN ? 'Full Report — All sections unlocked' : 'Relatório Completo — Todas as secções desbloqueadas'}</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-[#C9A961]" />
              <span>{isEN ? 'Free Report — Summary analysis of your CV' : 'Relatório Gratuito — Análise resumida do teu CV'}</span>
            </>
          )}
        </div>

        {/* Voucher info banner (only if remaining analyses > 0) */}
        {isPaid && storedVoucherCode && storedVoucherRemaining && parseInt(storedVoucherRemaining) > 0 && (
          <div className="bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-[#C9A961]" />
              <div>
                <p className="text-sm font-semibold text-foreground">{isEN ? 'Your code for future analyses:' : 'O teu código para futuras análises:'}</p>
                <p className="text-lg font-mono font-bold text-[#C9A961]">{storedVoucherCode}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{isEN ? 'Remaining analyses' : 'Análises restantes'}</p>
              <p className="text-2xl font-bold text-[#C9A961]">{storedVoucherRemaining}</p>
            </div>
          </div>
        )}

        {/* ═══ ATS Rejection ═══ */}
        <ATSRejectionBlock rejectionRate={analysisData.atsRejectionRate} topFactor={analysisData.atsTopFactor} isPaid={isPaid} detailedFactors={analysisData.detailedAtsAnalysis?.factors} atsSystems={analysisData.detailedAtsAnalysis?.atsSystems} quickFixes={analysisData.detailedAtsAnalysis?.quickFixes} isEN={isEN} />

        {/* ═══ Job Match Section (only when user provided a job posting) ═══ */}
        {analysisData.jobMatch && analysisData.jobMatch.atsCompatibilityScore != null && (
          <div className="bg-card border-2 border-[#C9A961]/30 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#C9A961]" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? 'JOB MATCH ANALYSIS' : 'ANÁLISE DE COMPATIBILIDADE COM A VAGA'}</p>
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
                    <p className="text-xs font-semibold text-red-500 mb-2">{isEN ? 'Missing keywords:' : 'Palavras-chave em falta:'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisData.jobMatch.keywordGaps.map((gap: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 border border-red-500/20">{gap}</span>
                      ))}
                    </div>
                  </div>
                )}
                {analysisData.jobMatch.matchedKeywords && analysisData.jobMatch.matchedKeywords.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-2">{isEN ? 'Matched keywords:' : 'Palavras-chave encontradas:'}</p>
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
                    <p className="text-xs font-semibold text-red-500 mb-2">{isEN ? 'Missing keywords:' : 'Palavras-chave em falta:'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 border border-red-500/20">
                        {isEN ? `${analysisData.jobMatch.keywordGaps.length} keywords identified` : `${analysisData.jobMatch.keywordGaps.length} palavras-chave identificadas`}
                      </span>
                    </div>
                  </div>
                )}
                {analysisData.jobMatch.matchedKeywords && analysisData.jobMatch.matchedKeywords.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-green-600 mb-2">{isEN ? 'Matched keywords:' : 'Palavras-chave encontradas:'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600 border border-green-500/20">
                        {isEN ? `${analysisData.jobMatch.matchedKeywords.length} keywords matched` : `${analysisData.jobMatch.matchedKeywords.length} palavras-chave encontradas`}
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-[#C9A961]/5 border border-[#C9A961]/20 flex items-center gap-2 cursor-pointer hover:bg-[#C9A961]/10 transition-colors" onClick={() => openPaymentModal()}>
                  <Lock className="w-3.5 h-3.5 text-[#C9A961]" />
                  <span className="text-xs text-[#C9A961] font-medium">{isEN ? 'See the detail in the full report' : 'V\u00ea o detalhe no relat\u00f3rio completo'}</span>
                </div>
              </>
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
                    <p className="text-xs font-semibold tracking-wider text-red-500">{isEN ? 'CRITICAL ISSUES DETECTED' : 'PROBLEMAS CRÍTICOS DETETADOS'}</p>
                    <p className="text-xs text-muted-foreground">{isEN ? `${analysisData.cvProblems.length} specific issues that are hurting your CV` : `${analysisData.cvProblems.length} problemas específicos que estão a prejudicar o teu CV`}</p>
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
                            <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-1">{isEN ? 'FULL EXPLANATION' : 'EXPLICAÇÃO COMPLETA'}</p>
                            <p className="text-sm text-foreground">{problem.fullExplanation}</p>
                          </div>
                          {problem.correctionExample && (
                            <div>
                              <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-1">{isEN ? 'CORRECTION EXAMPLE' : 'EXEMPLO DE CORREÇÃO'}</p>
                              <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md font-mono">{problem.correctionExample}</p>
                            </div>
                          )}
                          {problem.rewriteSuggestion && (
                            <div>
                              <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-1">{isEN ? 'SUGGESTED REWRITE' : 'SUGESTÃO DE REESCRITA'}</p>
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
                    <p className="text-xs font-semibold tracking-wider text-red-500">{isEN ? 'CRITICAL ISSUES DETECTED' : 'PROBLEMAS CRÍTICOS DETETADOS'}</p>
                    <p className="text-xs text-muted-foreground">{isEN ? `3 specific issues that are hurting your CV` : `3 problemas específicos que estão a prejudicar o teu CV`}</p>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  {[0, 1, 2].map((i: number) => {
                    const areaLabels = isEN
                      ? ['Issue found in your Experience section', 'Issue found in your Profile/Summary section', 'Issue found in your Skills & Credentials']
                      : ['Problema detetado na secção de Experiência', 'Problema detetado na secção de Perfil/Resumo', 'Problema detetado nas Competências e Credenciais'];
                    const label = areaLabels[i];
                    return (
                      <div key={i} className="border border-border rounded-lg overflow-hidden cursor-pointer hover:border-[#C9A961]/50 transition-colors" onClick={() => openPaymentModal()}>
                        <div className="p-4 bg-red-500/5 flex items-center gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                          <p className="font-semibold text-foreground text-sm">{label}</p>
                        </div>
                        <div className="p-3 border-t border-border bg-[#C9A961]/5 flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-[#C9A961]" />
                          <span className="text-xs text-[#C9A961] font-medium">{isEN ? 'Unlock to see the problem and how to fix it' : 'Desbloqueia para ver o problema e como o corrigir'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => openPaymentModal()} className="w-full py-3 px-4 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                  <Unlock className="w-4 h-4" />
                  {isEN ? 'Fix these 3 issues now and boost your interview chances' : 'Corrige estes 3 problemas agora e aumenta as tuas hipóteses de entrevista'}
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
                    <p className="text-[11px] font-semibold tracking-wider text-[#C9A961] uppercase">{isEN ? 'Your ATS Compatibility Score' : 'O teu Score de Compatibilidade ATS'}</p>
                  </div>
                  <div className="relative mb-4">
                    <ScoreGauge score={atsScore} size={160} strokeWidth={8} />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                        atsScore >= 75 ? 'bg-[#C9A961]/10 text-[#C9A961]' :
                        atsScore >= 50 ? 'bg-amber-500/10 text-amber-600' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {atsScore >= 75 ? (isEN ? 'Good' : 'Bom') : atsScore >= 50 ? (isEN ? 'Needs improvement' : 'Precisa de melhoria') : (isEN ? 'Critical' : 'Crítico')}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center max-w-sm">
                    {isEN
                      ? <>Your CV has <span className="font-semibold text-foreground">{atsScore}/100</span> ATS compatibility.</>
                      : <>O teu CV tem <span className="font-semibold text-foreground">{atsScore}/100</span> de compatibilidade ATS.</>
                    }
                  </p>
                </div>

                {/* Qualitative Impact Message */}
                <div className="border-t border-[#C9A961]/20 pt-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 justify-center">
                    <AlertTriangle className={`w-3.5 h-3.5 ${impactLevel === 'critical' ? 'text-red-500' : impactLevel === 'moderate' ? 'text-amber-500' : 'text-[#C9A961]'}`} />
                    <p className={`text-[11px] font-semibold tracking-wider ${impactLevel === 'critical' ? 'text-red-500' : impactLevel === 'moderate' ? 'text-amber-500' : 'text-[#C9A961]'}`}>
                      {isEN ? 'WHAT THIS MEANS FOR YOU' : 'O QUE ISTO SIGNIFICA PARA TI'}
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
                        ? (isEN ? 'Your CV may be limiting your career opportunities' : 'O teu CV pode estar a limitar as tuas oportunidades de carreira')
                        : impactLevel === 'moderate'
                        ? (isEN ? 'Your CV has room for significant improvement' : 'O teu CV tem margem para melhoria significativa')
                        : (isEN ? 'Your CV is competitive but can still be optimised' : 'O teu CV é competitivo mas ainda pode ser optimizado')
                      }
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {impactLevel === 'critical'
                        ? (isEN ? 'Most ATS systems will filter out your CV before a recruiter sees it. The full report shows exactly what to fix.' : 'A maioria dos sistemas ATS vai filtrar o teu CV antes de um recrutador o ver. O relatório completo mostra exactamente o que corrigir.')
                        : impactLevel === 'moderate'
                        ? (isEN ? 'Some ATS filters may reject your CV. The full report identifies the specific gaps and how to close them.' : 'Alguns filtros ATS podem rejeitar o teu CV. O relatório completo identifica os gaps específicos e como os resolver.')
                        : (isEN ? 'Your CV passes most ATS filters. The full report reveals fine-tuning opportunities to stand out further.' : 'O teu CV passa na maioria dos filtros ATS. O relatório completo revela oportunidades de afinação para te destacares ainda mais.')
                      }
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center italic">
                    {isEN
                      ? 'Based on analysis of your CV structure, keywords, and formatting against current ATS standards.'
                      : 'Baseado na análise da estrutura, palavras-chave e formatação do teu CV face aos padrões ATS actuais.'
                    }
                  </p>
                </div>
              </div>

              {/* ── Report Preview (✓ visible / 🔒 locked) ── */}
              <div className="bg-card border-2 border-border rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#C9A961]" />
                  <p className="text-sm font-semibold text-foreground">{isEN ? 'What your full report includes:' : 'O que o teu relatório completo inclui:'}</p>
                </div>

                {/* Free items */}
                <div className="space-y-2">
                  {(isEN ? [
                    'ATS compatibility score',
                    '3 critical issues detected',
                    'Missing keywords',
                  ] : [
                    'Score de compatibilidade ATS',
                    '3 problemas críticos detetados',
                    'Palavras-chave em falta',
                  ]).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-foreground">{item}</span>
                      <span className="text-[10px] font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full ml-auto">{isEN ? 'FREE' : 'GRÁTIS'}</span>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Locked items */}
                <div className="space-y-2">
                  {(isEN ? [
                    'Detailed analysis by quadrant',
                    'Complete ATS diagnosis',
                    'Personalised improvement suggestions',
                    'Detailed salary estimate',
                    'Recruiter perception simulation',
                    'Market positioning (normal curve)',
                    'Automation risk analysis',
                    '30-day action plan',
                    'Compatible job opportunities',
                    'Optimised CV (rewrite suggestions)',
                  ] : [
                    'Análise detalhada por quadrante',
                    'Diagnóstico ATS completo',
                    'Sugestões de melhoria personalizadas',
                    'Estimativa salarial detalhada',
                    'Simulação de percepção do recrutador',
                    'Posicionamento no mercado (curva normal)',
                    'Análise de risco de automação',
                    'Plano de acção de 30 dias',
                    'Vagas compatíveis',
                    'CV optimizado (sugestões de reescrita)',
                  ]).map((item, i) => (
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
                    {isEN ? `Unlock Full Report — from ${CUR}${P.cv}` : `Desbloquear Relatório Completo — desde ${CUR}${P.cv}`}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {isEN ? 'Secure payment via Card or PayPal' : 'Pagamento seguro via MB WAY ou PayPal'}
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
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'QUADRANT ANALYSIS' : 'ANÁLISE POR QUADRANTE'}</p>
              <Tooltip
                label={isEN ? 'What are the Quadrants?' : 'O que são os Quadrantes?'}
                text={isEN ? 'Your CV is evaluated in 4 independent dimensions: Structure (visual organisation), Content (text quality), Education (academic presentation) and Experience (professional description). Each is compared with the market benchmark.' : 'O teu CV é avaliado em 4 dimensões independentes: Estrutura (organização visual), Conteúdo (qualidade do texto), Formação (apresentação académica) e Experiência (descrição profissional). Cada uma é comparada com o benchmark do mercado.'}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysisData.quadrants.map((q, i) => (
              <QuadrantCard
                key={i}
                title={q.title}
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'EVALUATION FACTORS' : 'FACTORES DE AVALIAÇÃO'}</p>
                <Tooltip
                  label={isEN ? 'What are the Evaluation Factors?' : 'O que são os Factores de Avaliação?'}
                  text={isEN ? 'Visual representation of each CV dimension in a horizontal bar. The vertical line indicates the benchmark (market average) for the same seniority level. Values above the benchmark are positive.' : 'Representação visual de cada dimensão do CV em barra horizontal. A linha vertical indica o benchmark (média do mercado) para o mesmo nível de senioridade. Valores acima do benchmark são positivos.'}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{isEN ? 'Each factor is compared with the market average. The vertical line on the bar indicates the benchmark.' : 'Cada factor é comparado com a média do mercado. A linha vertical na barra indica o benchmark.'}</p>
            </div>
          </div>
          <div className="space-y-5">
            {analysisData.quadrants.map((q, i) => (
              <DimensionBar key={i} label={q.title} score={q.score} benchmark={q.benchmark} insight={q.impactPhrase} />
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <div className="relative">
              <p className="text-sm text-muted-foreground mb-2">
                {isEN ? `→ Your CV is ${avgScore >= 70 ? 'above' : 'below'} the global market average (${Math.round(avgScore)} vs 69)` : `→ O teu CV está ${avgScore >= 70 ? 'acima' : 'abaixo'} da média global do mercado (${Math.round(avgScore)} vs 69)`}
              </p>
              {!isPaid && (
                <div className="relative">
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
                    <Button
                      onClick={() => openPaymentModal()}
                      size="sm"
                      className="bg-[#C9A961] hover:bg-[#A88B4E] text-white"
                    >
                      {isEN ? 'View Detailed Analysis by Dimension' : 'Ver Análise Detalhada por Dimensão'}
                    </Button>
                  </div>
                  <div className="select-none space-y-1 text-sm text-muted-foreground">
                    <p>{isEN ? '→ Cross-analysis between dimensions and impact on global score' : '→ Análise cruzada entre dimensões e impacto no score global'}</p>
                    <p>{isEN ? '→ Specific recommendations for each dimension' : '→ Recomendações específicas para cada dimensão'}</p>
                    <p>{isEN ? '→ Comparison with profiles at the same seniority level' : '→ Comparação com perfis do mesmo nível de senioridade'}</p>
                  </div>
                </div>
              )}
              {isPaid && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{isEN ? '→ Cross-analysis between dimensions and impact on global score' : '→ Análise cruzada entre dimensões e impacto no score global'}</p>
                  <p>{isEN ? '→ Specific recommendations for each dimension' : '→ Recomendações específicas para cada dimensão'}</p>
                  <p>{isEN ? '→ Comparison with profiles at the same seniority level' : '→ Comparação com perfis do mesmo nível de senioridade'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Compatibilidade ATS ═══ */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <AlertTriangle className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'ATS COMPATIBILITY' : 'COMPATIBILIDADE ATS'}</p>
                <Tooltip
                  label={isEN ? 'What is ATS Compatibility?' : 'O que é a Compatibilidade ATS?'}
                  text={isEN ? 'Applicant Tracking System — software used by 75% of companies to automatically filter CVs. This score indicates the probability of your CV passing those filters. The higher, the better.' : 'Applicant Tracking System — software usado por 75% das empresas para filtrar CVs automaticamente. Este score indica a probabilidade do teu CV passar esses filtros. Quanto maior, melhor.'}
                />
              </div>
              <p className="text-xs text-muted-foreground">{isEN ? 'Probability of your CV passing automatic filters' : 'Probabilidade do teu CV passar filtros automáticos'}</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <ScoreGauge score={100 - analysisData.atsRejectionRate} size={160} strokeWidth={8} />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {isEN ? <>Your CV has <span className="font-semibold text-foreground">{100 - analysisData.atsRejectionRate}%</span> compatibility with ATS systems. {100 - analysisData.atsRejectionRate >= 70 ? 'Good compatibility.' : 'See the full report to learn how to improve.'}</> : <>O teu CV tem <span className="font-semibold text-foreground">{100 - analysisData.atsRejectionRate}%</span> de compatibilidade com sistemas ATS. {100 - analysisData.atsRejectionRate >= 70 ? 'Boa compatibilidade.' : 'Vê o relatório completo para saber como melhorar.'}</>}
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
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'RECRUITER PERCEPTION' : 'PERCEPÇÃO DO RECRUTADOR'}</p>
              <Tooltip
                label={isEN ? 'What is Recruiter Perception?' : 'O que é a Percepção do Recrutador?'}
                text={isEN ? 'Simulation of what a recruiter retains from your CV in the first 5-10 seconds of reading. Includes perceived professional profile, seniority level and key skills identified.' : 'Simulação do que um recrutador retém do teu CV nos primeiros 5-10 segundos de leitura. Inclui o perfil profissional percebido, nível de senioridade e competências-chave identificadas.'}
              />
            </div>
          </div>
          <RecruiterPerception isPaid={isPaid} roles={analysisData.keywords} perceivedRole={analysisData.perceivedRole} perceivedSeniority={analysisData.perceivedSeniority} deepAnalysis={analysisData.recruiterDeepAnalysis} isEN={isEN} />
        </div>

        {/* ═══ Salary ═══ */}
        <SalaryBlock blurred={!isPaid} salaryDetailed={analysisData.salaryDetailed} perceivedSeniority={analysisData.perceivedSeniority} isEN={isEN} CUR={CUR} />

        {/* ═══ Normal Curve ═══ */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <TrendingUp className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'MARKET POSITIONING' : 'POSICIONAMENTO NO MERCADO'}</p>
                <Tooltip
                  label={isEN ? 'What is the Normal Curve?' : 'O que é a Curva Normal?'}
                  text={isEN ? 'Statistical distribution showing where your CV ranks compared to all CVs analysed on our platform. The percentile indicates the percentage of CVs yours surpasses.' : 'Distribuição estatística que mostra onde o teu CV se posiciona face a todos os CVs analisados na nossa plataforma. O percentil indica a percentagem de CVs que o teu supera.'}
                />
              </div>
              <p className="text-xs text-muted-foreground">{isEN ? 'Normal curve — where you rank compared to other candidates' : 'Curva normal — onde te posicionas face a outros candidatos'}</p>
            </div>
          </div>

          {/* Values VISIBLE */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{isEN ? 'Percentile' : 'Percentil'}</p>
              <p className="text-xl font-bold text-foreground">{percentile}%</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground">{isEN ? 'Position' : 'Posição'}</p>
              <p className="text-xl font-bold text-[#C9A961]">Top {100 - percentile}%</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{isEN ? 'Global Score' : 'Score Global'}</p>
              <p className="text-xl font-bold text-foreground">{Math.round(avgScore)}/100</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {isEN ? <>You are in the <span className="font-semibold text-foreground">percentile {percentile}</span>, which means your CV is better than {percentile}% of CVs analysed in the market.</> : <>→ Estás no <span className="font-semibold text-foreground">percentil {percentile}</span>, o que significa que o teu CV é melhor que {percentile}% dos CVs analisados no mercado.</>}
          </p>

          {/* Interpretação detalhada quando pago */}
          {isPaid && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">{isEN ? 'Interpretation of your positioning:' : 'Interpretação do teu posicionamento:'}</p>
              <p className="text-sm text-muted-foreground">
                {isEN ? (
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
                {isEN ? <>→ To move to the next level, you need to increase your global score by approximately <strong className="text-foreground">{percentile >= 90 ? '2-3' : percentile >= 75 ? '5-8' : '10-15'} points</strong>.</> : <>→ Para subir para o próximo nível, precisas de aumentar o score global em aproximadamente <strong className="text-foreground">{percentile >= 90 ? '2-3' : percentile >= 75 ? '5-8' : '10-15'} pontos</strong>.</>}
              </p>
            </div>
          )}

          {/* Chart - blurred if not paid */}
          <div className="relative">
            {!isPaid && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
                <Lock className="w-6 h-6 text-[#C9A961] mb-2" />
                <p className="text-sm font-semibold text-foreground">{isEN ? 'Full chart in Paid Report' : 'Gráfico completo no Relatório Pago'}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">{isEN ? 'See the distribution curve and your exact position' : 'Vê a curva de distribuição e a tua posição exacta'}</p>
                <Button
                  onClick={() => openPaymentModal()}
                  size="sm"
                  className="bg-[#C9A961] hover:bg-[#A88B4E] text-white"
                >
{isEN ? `Unlock from ${CUR}${P.cv}` : `Desbloquear desde ${CUR}${P.cv}`}
                 </Button>
               </div>
            )}
            <div className={!isPaid ? 'select-none' : ''}>
              <NormalCurveChart percentile={percentile} isEN={isEN} />
            </div>
          </div>
        </div>

        {/* ═══ Potencial de Automação ═══ */}
        <AutomationRiskBlock blurred={!isPaid} automationRisk={analysisData.automationRisk} isEN={isEN} />

        {/* ═══ Matriz de Oportunidades ═══ */}
        {!isPaid ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'OPPORTUNITIES MATRIX — FULL REPORT' : 'MATRIZ DE OPORTUNIDADES — RELATÓRIO COMPLETO'}</p>
              <p className="text-xs text-muted-foreground mt-1">{isEN ? 'The full report includes these 4 detailed sections. Here you can see what each one covers.' : 'O relatório completo inclui estas 4 secções detalhadas. Aqui podes ver o que cada uma cobre.'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<LockedSection
                 isEN={isEN}
                 title={isEN ? 'Detailed analysis by quadrant' : 'Análise detalhada por quadrante'}
                visibleHint={isEN ? 'Complete breakdown of each dimension with strengths and weaknesses identified.' : 'Breakdown completo de cada dimensão com pontos fortes e fracos identificados.'}
                previewItems={isEN ? ['Visual structure and information hierarchy', 'Alignment between skills and target role', 'Keywords and ATS filter compatibility', 'Market positioning'] : ['Estrutura visual e hierarquia de informação', 'Alinhamento entre competências e função-alvo', 'Keywords e compatibilidade com filtros ATS', 'Posicionamento face ao mercado']}
              />
<LockedSection
                 isEN={isEN}
                 title={isEN ? 'Comparison with top 25% profiles' : 'Comparação com perfis top 25%'}
                visibleHint={isEN ? 'See how your CV compares with the best in your sector.' : 'Vê como o teu CV se compara com os melhores do teu setor.'}
                previewItems={isEN ? ['Benchmark against best CVs in sector', 'Missing differentiating skills', 'Positioning vs competitors', 'Gap analysis with recommendations'] : ['Benchmark contra os melhores CVs do setor', 'Competências diferenciadoras em falta', 'Posicionamento face a concorrentes', 'Gap analysis com recomendações']}
              />
<LockedSection
                 isEN={isEN}
                 title={isEN ? 'Specific recommendations (15+)' : 'Recomendações específicas (15+)'}
                visibleHint={isEN ? 'Over 15 micro-insights with concrete actions to improve your CV.' : 'Mais de 15 micro-insights com acções concretas para melhorar o teu CV.'}
                previewItems={isEN ? ['Optimised professional summary rewrite', 'Reformulation with impact metrics', 'ATS keyword optimisation', 'Visual formatting suggestions'] : ['Reescrita otimizada do resumo profissional', 'Reformulação com métricas de impacto', 'Otimização de keywords para ATS', 'Sugestões de formatação visual']}
              />
<LockedSection
                 isEN={isEN}
                 title={isEN ? 'Action plan (30 days)' : 'Plano de acção (30 dias)'}
                visibleHint={isEN ? 'Structured plan with 3-5 priority actions and implementation timeline.' : 'Plano estruturado com 3-5 acções prioritárias e timeline de implementação.'}
                previewItems={isEN ? ['3-5 ordered priority actions', 'Implementation timeline', 'Quick improvements checklist', 'Application strategy'] : ['3-5 acções prioritárias ordenadas', 'Timeline de implementação', 'Checklist de melhorias rápidas', 'Estratégia de candidatura']}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ═══ Análise Detalhada por Dimensão ═══ */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoldIcon size="w-8 h-8">
                  <BarChart3 className="w-4 h-4 text-[#C9A961]" />
                </GoldIcon>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'DETAILED ANALYSIS BY DIMENSION' : 'ANÁLISE DETALHADA POR DIMENSÃO'}</p>
              </div>
              <div className="space-y-4">
                {analysisData.quadrants.map((q: any, idx: number) => {
                  const gap = q.score - q.benchmark;
                  const isStrong = gap >= 10;
                  const isWeak = gap <= 0;
                  return (
                    <div key={q.title} className="p-3 bg-muted/20 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{q.title}</span>
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
                            isEN ? <>✅ <strong>Strong point.</strong> You are {gap} points above the benchmark ({q.benchmark}).</> : <>✅ <strong>Ponto forte.</strong> Estás {gap} pontos acima do benchmark ({q.benchmark}).</>
                          ) : isWeak ? (
                            isEN ? <>⚠️ <strong>Area for improvement.</strong> You are {Math.abs(gap)} points below the benchmark ({q.benchmark}).</> : <>⚠️ <strong>Área de melhoria.</strong> Estás {Math.abs(gap)} pontos abaixo do benchmark ({q.benchmark}).</>
                          ) : (
                            isEN ? <>→ <strong>Above average.</strong> You are {gap} points above the benchmark ({q.benchmark}).</> : <>→ <strong>Acima da média.</strong> Estás {gap} pontos acima do benchmark ({q.benchmark}).</>
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
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoldIcon size="w-8 h-8">
                  <Target className="w-4 h-4 text-[#C9A961]" />
                </GoldIcon>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'PRIORITY MATRIX' : 'MATRIZ DE PRIORIDADES'}</p>
              </div>
              <p className="text-sm text-muted-foreground">{isEN ? 'Dimensions ordered by improvement urgency (larger gap = higher priority):' : 'Dimensões ordenadas por urgência de melhoria (maior gap = maior prioridade):'}</p>
              <div className="space-y-2">
                {[...dimensions].sort((a: any, b: any) => (a.score - a.benchmark) - (b.score - b.benchmark)).map((dim: any, i: number) => {
                  const gap = dim.score - dim.benchmark;
                  const priority = gap <= 0 ? (isEN ? 'High' : 'Alta') : gap <= 10 ? (isEN ? 'Medium' : 'Média') : (isEN ? 'Low' : 'Baixa');
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
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8">
                    <Sparkles className="w-4 h-4 text-[#C9A961]" />
                  </GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'IMPROVEMENT ACTIONS — BEFORE vs AFTER' : 'ACÇÕES DE MELHORIA — ANTES vs DEPOIS'}</p>
                </div>
                <p className="text-sm text-muted-foreground">{isEN ? 'Concrete actions to improve your CV, with the estimated impact of each one:' : 'Acções concretas para melhorar o teu CV, com o impacto estimado de cada uma:'}</p>
                <div className="space-y-4">
                  {analysisData.improvementActions.map((action: any, i: number) => (
                    <div key={i} className="border border-border rounded-lg overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">#{i + 1}</span>
                          <span className="text-sm font-semibold text-foreground">{action.action}</span>
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded">+{action.impact} {isEN ? 'points' : 'pontos'}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                        <div className="p-3">
                          <p className="text-[10px] font-semibold text-red-500 mb-1">{isEN ? '❌ BEFORE' : '❌ ANTES'}</p>
                          <p className="text-sm text-muted-foreground">{action.before}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] font-semibold text-green-600 mb-1">{isEN ? '✅ AFTER' : '✅ DEPOIS'}</p>
                          <p className="text-sm text-muted-foreground">{action.after}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20">
                  <p className="text-sm text-foreground font-medium">
                    {isEN ? '🎯 Estimated score after improvements: ' : '🎯 Score estimado após melhorias: '}<strong className="text-[#C9A961]">{Math.min(100, Math.round(avgScore) + (analysisData.improvementActions?.reduce((sum: number, a: any) => sum + (a.impact === 'Alto' || a.impact === 'High' ? 8 : a.impact === 'M\u00e9dio' || a.impact === 'Medium' ? 5 : typeof a.impact === 'number' ? a.impact : 3), 0) || 0))}/100</strong>
                  </p>
                </div>
              </div>
            )}

            {/* ═══ Plano de Acção 30 Dias ═══ */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoldIcon size="w-8 h-8">
                  <Calendar className="w-4 h-4 text-[#C9A961]" />
                </GoldIcon>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'ACTION PLAN — 30 DAYS' : 'PLANO DE ACÇÃO — 30 DIAS'}</p>
              </div>
              <div className="space-y-3">
                {(analysisData.actionPlan || (isEN ? [
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



        {/* ═══ Career Path Cross-sell (produto independente) ═══ */}
        {isPaid && (
          <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/15 border-2 border-[#C9A961]/30 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <GoldIcon>
                <Compass className="w-5 h-5 text-[#C9A961]" />
              </GoldIcon>
              <div>
                <p className="text-base font-semibold text-foreground">{isEN ? 'What is your next career step?' : 'Qual é o teu próximo passo de carreira?'}</p>
                <p className="text-xs text-muted-foreground">{isEN ? 'Career Path creates a personalised roadmap with concrete steps to get where you want' : 'O Career Path cria um roadmap personalizado com os passos concretos para chegares onde queres'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: <Briefcase className="w-4 h-4" />, text: isEN ? 'Next 3 recommended roles with roadmap' : 'Próximos 3 cargos recomendados com roadmap' },
                { icon: <GraduationCap className="w-4 h-4" />, text: isEN ? 'Recommended training and certifications' : 'Formações e certificações recomendadas' },
                { icon: <Globe className="w-4 h-4" />, text: isEN ? 'Visibility exercises and online presence' : 'Exercícios de visibilidade e presença online' },
                { icon: <Users className="w-4 h-4" />, text: isEN ? 'Networking strategy and communities' : 'Estratégia de networking e comunidades' },
                { icon: <Linkedin className="w-4 h-4" />, text: isEN ? 'CV vs LinkedIn cross-analysis' : 'Cruzamento CV vs LinkedIn' },
                { icon: <Target className="w-4 h-4" />, text: isEN ? 'Immediate actions for 30, 60 and 90 days' : 'Acções imediatas para 30, 60 e 90 dias' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#C9A961] mt-0.5">{item.icon}</span>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div>
                <span className="text-3xl font-bold text-foreground">{`${CUR}${P.career}`}</span>
                <span className="text-sm text-muted-foreground ml-2">{isEN ? '/ analysis' : '/ análise'}</span>

              </div>
              <a
                href={isEN ? '/en/career-path' : '/career-path'}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold text-base transition-colors"
              >
                <Compass className="w-4 h-4" />
                {isEN ? 'Try Career Path' : 'Experimentar Career Path'}
              </a>
            </div>
          </div>
        )}

        {/* ═══ Career Path Results (when purchased) ═══ */}
        {careerPathData && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/15 border-2 border-[#C9A961]/30 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <GoldIcon><Rocket className="w-5 h-5 text-[#C9A961]" /></GoldIcon>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961]">CAREER PATH</p>
                  <p className="text-lg font-bold text-foreground">{isEN ? 'Your Professional Evolution Plan' : 'O Teu Plano de Evolução Profissional'}</p>
                </div>
              </div>
              {careerPathData.current_positioning && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'CURRENT POSITIONING' : 'POSICIONAMENTO ACTUAL'}</span>
                    <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{careerPathData.current_positioning.seniority_level}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{careerPathData.current_positioning.seniority_justification}</p>
                  <div className="space-y-3 mt-3">
                    <div className="p-3 bg-card rounded-lg border border-border">
                      <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{isEN ? 'PRIMARY DOMAIN' : 'DOMÍNIO PRINCIPAL'}</p>
                      <p className="text-sm font-medium text-foreground">{careerPathData.current_positioning.primary_domain}</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border border-border">
                      <p className="text-[10px] font-semibold text-[#C9A961] mb-1">{isEN ? 'MARKET VALUE' : 'VALOR DE MERCADO'}</p>
                      <p className="text-sm text-foreground">{careerPathData.current_positioning.market_value_assessment}</p>
                    </div>
                  </div>
                  {careerPathData.current_positioning.competitive_advantages && (
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold text-green-600 mb-2">{isEN ? 'COMPETITIVE ADVANTAGES' : 'VANTAGENS COMPETITIVAS'}</p>
                      <div className="flex flex-wrap gap-2">
                        {careerPathData.current_positioning.competitive_advantages.map((adv: string, i: number) => (
                          <span key={i} className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded border border-green-500/20">{adv}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {careerPathData.current_positioning.blind_spots && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold text-amber-600 mb-2">{isEN ? 'BLIND SPOTS' : 'PONTOS CEGOS'}</p>
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
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Linkedin className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">CV vs LINKEDIN</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${careerPathData.cv_linkedin_cross_analysis.consistency_score === 'Alta' ? 'bg-green-500/10 text-green-600' : careerPathData.cv_linkedin_cross_analysis.consistency_score === 'Média' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>{isEN ? 'Consistency' : 'Consistência'}: {careerPathData.cv_linkedin_cross_analysis.consistency_score}</span>
                </div>
                {careerPathData.cv_linkedin_cross_analysis.optimization_suggestions?.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-[#C9A961] mt-0.5">→</span><p>{s}</p></div>
                ))}
              </div>
            )}

            {careerPathData.next_roles?.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Briefcase className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'NEXT RECOMMENDED ROLES' : 'PRÓXIMOS CARGOS RECOMENDADOS'}</p>
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
                          <div><p className="text-[10px] font-semibold text-green-600 mb-1">{isEN ? 'YOU ALREADY HAVE' : 'JÁ TENS'}</p>{role.what_you_already_have?.map((item: string, j: number) => <p key={j} className="text-xs text-muted-foreground"><Check className="w-3 h-3 text-green-500 shrink-0 inline" /> {item}</p>)}</div>
                          <div><p className="text-[10px] font-semibold text-amber-600 mb-1">{isEN ? 'YOU NEED' : 'PRECISAS'}</p>{role.what_you_need?.map((item: string, j: number) => <p key={j} className="text-xs text-muted-foreground">○ {item}</p>)}</div>
                        </div>
                        {role.typical_companies && <div className="flex flex-wrap gap-1 mt-1">{role.typical_companies.map((c: string, j: number) => <span key={j} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{c}</span>)}</div>}
                        {/* LinkedIn Search Button */}
                        <div className="mt-3 pt-3 border-t border-border">
                          <a
                            href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role.role_title)}&location=${isEN ? '' : 'Portugal'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5]/10 text-[#0077B5] text-xs font-semibold hover:bg-[#0077B5]/20 transition-colors border border-[#0077B5]/20"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                            {isEN ? `Search "${role.role_title}" on LinkedIn` : `Procurar "${role.role_title}" no LinkedIn`}
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
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><GraduationCap className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'RECOMMENDED TRAINING' : 'FORMAÇÕES RECOMENDADAS'}</p>
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
                          href={`https://www.google.com/search?q=${encodeURIComponent(f.name + ' ' + (f.provider || '') + (isEN ? ' course' : ' curso'))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#C9A961] hover:underline inline-flex items-center gap-1 px-2 py-1 rounded bg-[#C9A961]/5 border border-[#C9A961]/20"
                        >
                          <ExternalLink className="w-3 h-3" />{isEN ? 'Search training' : 'Pesquisar formação'}
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
              <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-2 border-green-500/20 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Sparkles className="w-4 h-4 text-green-600" /></GoldIcon>
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-green-700">{isEN ? 'FREE MICRO-COURSES TO START NOW' : 'MICRO-CURSOS GRATUITOS PARA COMEÇAR JÁ'}</p>
                    <p className="text-[10px] text-green-600/70">{isEN ? 'Start learning today at zero cost' : 'Começa a aprender hoje sem qualquer custo'}</p>
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
                      : `https://www.google.com/search?q=${encodeURIComponent(query + ' ' + (fc.platform || '') + (isEN ? ' free course' : ' curso gratuito'))}`;
                    return (
                      <div key={i} className="p-3 border border-green-500/20 rounded-lg bg-white/50">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-foreground">{fc.name}</p>
                          <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                            {isEN ? 'FREE' : 'GRATUITO'}
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
                            <ExternalLink className="w-3 h-3" />{isEN ? 'Find course' : 'Encontrar curso'}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {careerPathData.development_plan?.certifications && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><FileCheck className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'RECOMMENDED CERTIFICATIONS' : 'CERTIFICAÇÕES RECOMENDADAS'}</p>
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
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Globe className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'VISIBILITY EXERCISES' : 'EXERCÍCIOS DE VISIBILIDADE'}</p>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.visibility_exercises.map((v: any, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-lg">
                      <p className="text-sm font-semibold text-foreground">{v.activity}</p>
                      <p className="text-xs text-muted-foreground mt-1"><MapPin className="w-3 h-3 inline mr-1" />{v.platform} · {v.frequency}</p>
                      <p className="text-xs text-muted-foreground mt-1">{v.expected_impact}</p>
                      <p className="text-xs text-[#C9A961] mt-1 font-medium">→ {isEN ? 'First step' : 'Primeiro passo'}: {v.concrete_first_step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {careerPathData.development_plan?.networking_strategy && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Users className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'NETWORKING STRATEGY' : 'ESTRATÉGIA DE NETWORKING'}</p>
                </div>
                <div className="space-y-3">
                  {careerPathData.development_plan.networking_strategy.map((n: any, i: number) => (
                    <div key={i} className="p-3 border border-border rounded-lg">
                      <p className="text-sm font-semibold text-foreground">{n.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">{isEN ? 'Target' : 'Alvo'}: {n.target}</p>
                      {n.communities && <div className="flex flex-wrap gap-1 mt-1">{n.communities.map((c: string, j: number) => <span key={j} className="text-[10px] bg-[#C9A961]/10 text-[#C9A961] px-2 py-0.5 rounded">{c}</span>)}</div>}
                      {n.events && <div className="flex flex-wrap gap-1 mt-1">{n.events.map((e: string, j: number) => <span key={j} className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">{e}</span>)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {careerPathData.immediate_actions && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Target className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{isEN ? 'IMMEDIATE ACTIONS' : 'ACÇÕES IMEDIATAS'}</p>
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
              <div className="bg-gradient-to-br from-[#C9A961]/5 to-[#C9A961]/15 border-2 border-[#C9A961]/30 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8"><Sparkles className="w-4 h-4 text-[#C9A961]" /></GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? '5-YEAR VISION' : 'VISÃO A 5 ANOS'}</p>
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
          const role = analysisData.perceivedRole || (isEN ? 'Professional' : 'Profissional');
          const seniority = analysisData.perceivedSeniority || '';
          const topStrengths = analysisData.quadrants
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
            .map(q => q.title);
          const today = new Date().toLocaleDateString(isEN ? 'en-GB' : 'pt-PT', { year: 'numeric', month: 'long' });

          const generatePostText = () => {
            if (isEN) {
              return `Do you know if your CV passes the automatic recruitment filters (ATS)?\n\nI tested mine with a tool that simulates those filters and the result surprised me.\n\n\u2705 ATS Compatibility Score: ${atsCompat}%\n\u2705 Overall Score: ${Math.round(avgScore)}/100 (Percentile ${percentile})\n\u2705 Top strengths: ${topStrengths.join(' & ')}\n\nMost CVs are rejected before a human even reads them. This analysis showed me exactly what to fix — and what was already working.\n\n\ud83d\udd17 https://share2inspire.pt/en/cv-analyser\n\nWhat would your CV score be?\n\n#CVAnalysis #ATS #CareerDevelopment #Share2Inspire`;
            }
            return `Sabes se o teu CV passa nos filtros autom\u00e1ticos de recrutamento (ATS)?\n\nTestei o meu numa ferramenta que simula esses filtros e o resultado surpreendeu-me.\n\n\u2705 Score de Compatibilidade ATS: ${atsCompat}%\n\u2705 Score Global: ${Math.round(avgScore)}/100 (Percentil ${percentile})\n\u2705 Pontos fortes: ${topStrengths.join(' e ')}\n\nA maioria dos CVs \u00e9 rejeitada antes de um humano sequer os ler. Esta an\u00e1lise mostrou-me exactamente o que corrigir \u2014 e o que j\u00e1 estava a funcionar.\n\n\ud83d\udd17 https://share2inspire.pt/cv-analyser\n\nQual seria o score do teu CV?\n\n#An\u00e1liseCV #ATS #Carreira #Share2Inspire`;
          };

          const generateCertImage = () => {
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
              { label: isEN ? 'Overall Score' : 'Score Global', value: `${Math.round(avgScore)}/100`, sub: `${isEN ? 'Percentile' : 'Percentil'} ${percentile}` },
              { label: isEN ? 'ATS Compatibility' : 'Compatibilidade ATS', value: `${atsCompat}%`, sub: atsCompat >= 70 ? (isEN ? 'Good' : 'Boa') : (isEN ? 'Needs improvement' : 'A melhorar') },
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
            ctx.fillText(isEN ? 'ANALYSIS DIMENSIONS' : 'DIMENS\u00d5ES DA AN\u00c1LISE', 80, 335);
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
            ctx.fillText(isEN ? 'ATS COMPATIBILITY SCORE' : 'SCORE DE COMPATIBILIDADE ATS', 880, 130);
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
            const scoreLabel = avgScore >= 80 ? (isEN ? 'EXCELLENT' : 'EXCELENTE') : avgScore >= 65 ? (isEN ? 'STRONG' : 'FORTE') : avgScore >= 50 ? (isEN ? 'PROMISING' : 'PROMISSOR') : (isEN ? 'DEVELOPING' : 'EM DESENVOLVIMENTO');
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
            <div className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3">
                <GoldIcon>
                  <Award className="w-5 h-5 text-[#C9A961]" />
                </GoldIcon>
                <div>
                  <p className="text-base font-semibold text-foreground">{isEN ? 'Share Your Professional Result' : 'Partilhar Resultado Profissional'}</p>
                  <p className="text-xs text-muted-foreground">{isEN ? 'Generate an elegant LinkedIn post based on your CV analysis' : 'Gera um post elegante para LinkedIn baseado na an\u00e1lise do teu CV'}</p>
                </div>
              </div>

              {/* Preview of the post */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Linkedin className="w-4 h-4 text-[#0077B5]" />
                  <span className="text-xs font-semibold text-muted-foreground">{isEN ? 'POST PREVIEW' : 'PR\u00c9-VISUALIZA\u00c7\u00c3O DO POST'}</span>
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
                  {postCopied ? (isEN ? 'Copied!' : 'Copiado!') : (isEN ? 'Copy LinkedIn Post' : 'Copiar Post LinkedIn')}
                </button>
                <button
                  onClick={generateCertImage}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {isEN ? 'Download Certification Image' : 'Descarregar Imagem de Certifica\u00e7\u00e3o'}
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                {isEN ? 'The certification image is optimised for LinkedIn posts (1200\u00d7630px)' : 'A imagem de certifica\u00e7\u00e3o est\u00e1 optimizada para posts no LinkedIn (1200\u00d7630px)'}
              </p>
            </div>
          );
        })()}

        {/* ═══ Send Report by Email (only when paid) ═══ */}
        {isPaid && (
          <div id="report-email-section" className="bg-card border-2 border-[#C9A961]/20 rounded-2xl p-8 space-y-5">
            <div className="flex items-center gap-3">
              <GoldIcon>
                <Mail className="w-5 h-5 text-[#C9A961]" />
              </GoldIcon>
              <div>
                <p className="text-base font-semibold text-foreground">{isEN ? 'Receive Report by Email' : 'Receber Relatório por Email'}</p>
                <p className="text-xs text-muted-foreground">{isEN ? 'Send the full report to your email' : 'Envia o relatório completo para o teu email'}</p>
              </div>
            </div>
            
            {reportSent ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm text-green-600">{isEN ? 'Report sent successfully! Check your inbox (and spam folder).' : 'Relatório enviado com sucesso! Verifica a tua caixa de email (e spam).'}</p>
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={reportEmail || email || sessionStorage.getItem('paymentEmail') || ''}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder={isEN ? 'your@email.com' : 'seu@email.com'}
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
                        {isEN ? 'Send' : 'Enviar'}
                      </>
                    )}
                  </Button>
                </div>
                {reportError && (
                  <p className="text-sm text-red-500">{reportError}</p>
                )}
                {reportSending && (
                  <p className="text-xs text-muted-foreground">{isEN ? 'Sending the report to your email...' : 'A enviar o relatório para o teu email...'}</p>
                )}
              </>
            )}
          </div>
        )}

          </div>{/* close blurred content layer */}

          {/* Floating unlock overlay on top of blurred content */}
          {!isPaid && (
            <div className="absolute inset-0 z-10 flex items-start justify-center" style={{ paddingTop: '80px' }}>
              <div className="bg-card/95 backdrop-blur-sm border-2 border-[#C9A961]/30 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl max-w-lg mx-4 sticky top-28">
                <Lock className="w-8 h-8 text-[#C9A961] mx-auto" />
                <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{isEN ? 'UNLOCK YOUR FULL REPORT' : 'DESBLOQUEIA O TEU RELATÓRIO COMPLETO'}</p>

                {/* 2 Clean Options: CV Report vs Full Career Diagnosis */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  {/* Option 1: CV Report */}
                  <button
                    onClick={() => openPaymentModal({ name: isEN ? 'CV Report' : 'Relatório CV', price: P.cv, analyses: 1, voucher_type: 'standard', includes_career_path: false })}
                    className="p-4 rounded-xl border-2 border-border hover:border-[#C9A961]/40 transition-all bg-background/50 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs font-semibold text-foreground">{isEN ? 'CV Report' : 'Relatório CV'}</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{CUR}{P.cv}</p>
                    <p className="text-[10px] text-muted-foreground italic mt-0.5">{isEN ? 'Discover how to fix the critical issues we found' : 'Descobre como corrigir os problemas críticos que encontrámos'}</p>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {isEN ? 'Full ATS analysis' : 'Análise ATS completa'}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {isEN ? 'Improvement suggestions' : 'Sugestões de melhoria'}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {isEN ? 'Missing keywords' : 'Palavras-chave em falta'}</p>
                    </div>
                  </button>

                  {/* Option 2: Full Career Diagnosis - Highlighted */}
                  <button
                    onClick={() => openPaymentModal({ name: isEN ? 'Full Career Diagnosis' : 'Diagnóstico de Carreira Completo', price: P.cp, analyses: 1, voucher_type: 'standard', includes_career_path: true })}
                    className="p-4 rounded-xl border-2 border-[#C9A961] bg-[#C9A961]/5 transition-all relative space-y-2"
                  >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="text-[9px] font-bold bg-[#C9A961] text-white px-2.5 py-0.5 rounded-full whitespace-nowrap">{isEN ? 'BEST VALUE' : 'MELHOR VALOR'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#C9A961]" />
                      <p className="text-xs font-semibold text-[#C9A961]">{isEN ? 'Full Career Diagnosis' : 'Diagnóstico Completo'}</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{CUR}{P.cp}</p>
                    <p className="text-[10px] text-[#C9A961]/80 italic mt-0.5">{isEN ? 'Full plan to improve your CV and career positioning' : 'Plano completo para melhorar o teu CV e posicionamento de carreira'}</p>
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {isEN ? 'Full CV analysis' : 'Análise CV completa'}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> Career Path</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {isEN ? 'Skills gap' : 'Skills gap'}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-[#C9A961] shrink-0" /> {isEN ? 'Salary estimate' : 'Estimativa salarial'}</p>
                    </div>
                    <p className="text-[10px] text-[#C9A961]/80 italic">{isEN ? 'Includes Career Path from your LinkedIn' : 'Inclui Career Path baseado no teu LinkedIn'}</p>
                  </button>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={() => openPaymentModal({ name: isEN ? 'Full Career Diagnosis' : 'Diagnóstico de Carreira Completo', price: P.cp, analyses: 1, voucher_type: 'standard', includes_career_path: true })}
                    className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold py-3 text-sm w-full"
                  >
                    {isEN ? `Unlock Full Diagnosis — ${CUR}${P.cp}` : `Desbloquear Diagnóstico Completo — ${CUR}${P.cp}`}
                  </Button>
                  <Button
                    onClick={() => openPaymentModal({ name: isEN ? 'CV Report' : 'Relatório CV', price: P.cv, analyses: 1, voucher_type: 'standard', includes_career_path: false })}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    {isEN ? `Or just the CV Report — ${CUR}${P.cv}` : `Ou apenas o Relatório CV — ${CUR}${P.cv}`}
                  </Button>
                  <Button
                    onClick={() => setShowVoucherModal(true)}
                    variant="outline"
                    size="sm"
                    className="border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/5 w-full"
                  >
                    <Ticket className="w-3.5 h-3.5 mr-1.5" />
                    {isEN ? 'I have a code' : 'Tenho um código'}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">{isEN ? 'Secure payment via Card or PayPal' : 'Pagamento seguro via MB WAY ou PayPal'}</p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1"><Users className="w-3 h-3" /> {isEN ? '300+ CVs analysed' : '300+ CVs analisados'}</p>
                  <span className="text-muted-foreground/30">|</span>
                  <p className="text-[10px] text-muted-foreground/70">{isEN ? 'Used by HR professionals to simulate ATS filters' : 'Usada por profissionais de RH para simular filtros ATS'}</p>
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
              {paymentStep === 'confirm' && (isEN ? 'Confirm Package' : 'Confirmar Pacote')}
              {paymentStep === 'payment' && (isEN ? 'Payment Details' : 'Dados de Pagamento')}
              {paymentStep === 'polling' && (isEN ? 'Waiting for payment' : 'A aguardar pagamento')}
              {paymentStep === 'success' && (isPaid ? (isEN ? 'Analysis Unlocked!' : 'Análise Desbloqueada!') : (isEN ? 'Payment Started' : 'Pagamento Iniciado'))}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Choose Plan & Confirm */}
          {paymentStep === 'confirm' && (
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{isEN ? 'Choose your package:' : 'Escolhe o teu pacote:'}</p>
                <div className="space-y-2">
                  {[
                    {
                      name: isEN ? 'CV Report' : 'Relatório CV',
                      price: P.cv,
                      analyses: 1,
                      voucher_type: 'standard',
                      includes_career_path: false,
                      features: isEN
                        ? ['Full ATS analysis', 'Improvement suggestions', 'Missing keywords', 'Salary estimate']
                        : ['Análise ATS completa', 'Sugestões de melhoria', 'Palavras-chave em falta', 'Estimativa salarial'],
                    },
                    {
                      name: isEN ? 'Full Career Diagnosis' : 'Diagnóstico de Carreira Completo',
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
                              <span className="text-[9px] font-bold bg-[#C9A961] text-white px-1.5 py-0.5 rounded">{isEN ? 'BEST VALUE' : 'MELHOR VALOR'}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-lg font-bold text-[#C9A961]">{CUR}{plan.price}</span>
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
                  <p className="text-xs font-semibold text-green-600 mb-1">{isEN ? 'Career Path included!' : 'Career Path incluído!'}</p>
                  <p className="text-xs text-muted-foreground">{isEN ? 'After payment, the Career Path will be generated automatically from your CV data.' : 'Após o pagamento, o Career Path será gerado automaticamente a partir dos dados do teu CV.'}</p>
                </div>
              )}

              <Button
                onClick={() => setPaymentStep('payment')}
                className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
              >
                {isEN ? `Continue to Payment — ${CUR}${selectedPlan.price}` : `Continuar para Pagamento — ${CUR}${selectedPlan.price}`}
              </Button>
            </div>
          )}

          {/* Step 2: Payment */}
          {paymentStep === 'payment' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{isEN ? 'Payment Method' : 'Método de Pagamento'}</label>
                <div className={`grid gap-3 ${isEN ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {isEN ? (
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
                  placeholder={isEN ? 'your@email.com' : 'seu@email.com'}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                />
              </div>

              {paymentMethod === 'mbway' && (
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    {isEN ? 'Phone (MB WAY)' : 'Telemóvel (MB WAY)'}
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
                  <span className="text-lg font-bold text-foreground">{CUR}{selectedPlan.price}</span>
                </div>
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
                      {isEN ? 'Processing...' : 'A processar...'}
                    </>
                  ) : paymentMethod === 'stripe' ? (
                    'Pay with Card'
                  ) : paymentMethod === 'mbway' ? (
                    isEN ? 'Pay with MB WAY' : 'Pagar com MB WAY'
                  ) : (
                    <>
                      <PayPalIcon className="w-4 h-4 mr-2" />
                      {isEN ? 'Pay with PayPal' : 'Pagar com PayPal'}
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setPaymentStep('confirm')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isEN ? '← Back' : '← Voltar'}
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
                <h3 className="text-lg font-bold text-foreground">{isEN ? 'Request sent to MB WAY' : 'Pedido enviado para MB WAY'}</h3>
                <p className="text-sm text-muted-foreground">
                  {isEN ? <>Open the MB WAY app on your phone and approve the payment of <span className="font-semibold text-foreground">{CUR}{selectedPlan.price}</span>.</> : <>Abre a app MB WAY no telemóvel e aprova o pagamento de <span className="font-semibold text-foreground">{CUR}{selectedPlan.price}</span>.</>}
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
                  {isEN ? 'I already paid — check again' : 'Já paguei — verificar novamente'}
                </Button>
              )}
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="outline"
                className="w-full"
              >
                {isEN ? 'Close (payment continues to be verified)' : 'Fechar (o pagamento continua a ser verificado)'}
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
                    <h3 className="text-lg font-bold text-green-600">{isEN ? 'Payment confirmed!' : 'Pagamento confirmado!'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isEN ? 'Provide your LinkedIn profile so we can launch both analyses: CV Report + Career Path.' : 'Fornece o teu perfil LinkedIn para lançarmos as duas análises: Relatório CV + Career Path.'}
                    </p>
                    {/* LinkedIn input for bundle — launches both engines */}
                    <div className="mt-4 space-y-3 text-left">
                      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5" /> {isEN ? 'What we analyse from LinkedIn:' : 'O que analisamos do LinkedIn:'}</p>
                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {isEN ? 'Professional experience' : 'Experiência profissional'}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {isEN ? 'Area of expertise' : 'Área de actuação'}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {isEN ? 'Identified skills' : 'Competências identificadas'}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Check className="w-3 h-3 text-blue-500 shrink-0" /> {isEN ? 'Role progression' : 'Evolução de funções'}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 italic">{isEN ? 'No data will be published or shared.' : 'Nenhum dado será publicado ou partilhado.'}</p>
                      </div>
                      <input
                        type="url"
                        value={careerPathLinkedin}
                        onChange={(e) => setCareerPathLinkedin(e.target.value)}
                        placeholder={isEN ? 'https://linkedin.com/in/your-profile' : 'https://linkedin.com/in/teu-perfil'}
                        className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961] text-sm"
                      />
                    </div>
                    <div className="p-3 bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-lg mt-2">
                      <p className="text-xs font-semibold text-[#C9A961] mb-1">{isEN ? 'Your bundle includes:' : 'O teu pacote inclui:'}</p>
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> {isEN ? 'Full CV Report with ATS analysis' : 'Relatório CV completo com análise ATS'}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> {isEN ? 'Career Path with personalised roadmap' : 'Career Path com roadmap personalizado'}</p>
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
                      {isEN ? 'Launch both analyses' : 'Lançar as duas análises'}
                    </Button>
                  </>
                ) : isPaid ? (
                  <>
                    <h3 className="text-lg font-bold text-green-600">{isEN ? 'Full Analysis Unlocked!' : 'Análise Completa Desbloqueada!'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isEN ? 'All sections have been unlocked. Scroll down to see the full analysis.' : 'Todas as secções foram desbloqueadas. Faz scroll para ver a análise completa.'}
                    </p>
                    {storedVoucherCode && storedVoucherRemaining && parseInt(storedVoucherRemaining) > 0 && (
                      <div className="mt-4 p-4 bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">{isEN ? 'Your code for future analyses:' : 'O teu código para futuras análises:'}</p>
                        <p className="text-xl font-mono font-bold text-[#C9A961]">{storedVoucherCode}</p>
                        <p className="text-xs text-muted-foreground mt-1">{isEN ? `${storedVoucherRemaining} analysis(es) remaining` : `Restam ${storedVoucherRemaining} análise(s)`}</p>
                      </div>
                    )}
                  </>
                ) : paymentMethod === 'paypal' ? (
                  <>
                    <h3 className="text-lg font-bold text-foreground">{isEN ? 'PayPal Payment' : 'Pagamento PayPal'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isEN ? 'Complete the payment in the PayPal window. After confirmation, the analysis will be unlocked manually within 24h.' : 'Completa o pagamento na janela do PayPal. Após confirmação, a análise será desbloqueada manualmente em até 24h.'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {isEN ? 'For immediate confirmation, use Card payment.' : 'Para confirmação imediata, usa MB WAY.'}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-foreground">{isEN ? 'Payment processing' : 'Pagamento em processamento'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isEN ? 'Payment is being verified. The analysis will be unlocked automatically.' : 'O pagamento está a ser verificado. A análise será desbloqueada automaticamente.'}
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
                  {isPaid ? (isEN ? 'View Full Analysis' : 'Ver Análise Completa') : (isEN ? 'Close' : 'Fechar')}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Voucher Modal ═══ */}
      <Dialog open={showVoucherModal} onOpenChange={setShowVoucherModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#C9A961]" />
              {isEN ? 'Enter Code' : 'Inserir Código'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {isEN ? 'If you purchased a multi-analysis package, enter the code you received to unlock this analysis.' : 'Se compraste um pacote com múltiplas análises, introduz o código que recebeste para desbloquear esta análise.'}
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="S2I-XXXXXX"
                className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground text-center text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#C9A961] uppercase"
              />
            </div>

            {voucherError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{voucherError}</p>
              </div>
            )}

            {voucherSuccess && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-600">{voucherSuccess}</p>
              </div>
            )}

            <Button
              onClick={handleVoucherValidation}
              disabled={voucherLoading || !voucherCode.trim()}
              className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
            >
              {voucherLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEN ? 'Validating...' : 'A validar...'}
                </>
              ) : (
                isEN ? 'Validate Code' : 'Validar Código'
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
              Career Path {sessionStorage.getItem('careerPathIncluded') === 'true' ? (isEN ? '— Included' : '— Incluído') : `— ${CUR}${P.career}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {careerPathPaymentStep === 'info' && (
              <>
                <p className="text-sm text-muted-foreground">{isEN ? 'For a more complete analysis, you can provide your LinkedIn profile (optional):' : 'Para uma análise mais completa, podes fornecer o teu perfil LinkedIn (opcional):'}</p>
                <input
                  type="url"
                  value={careerPathLinkedin}
                  onChange={(e) => setCareerPathLinkedin(e.target.value)}
                  placeholder={isEN ? 'https://linkedin.com/in/your-profile' : 'https://linkedin.com/in/teu-perfil'}
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
                  {sessionStorage.getItem('careerPathIncluded') === 'true' ? (isEN ? 'Generate Career Path (included in package)' : 'Gerar Career Path (incluído no pacote)') : (isEN ? 'Continue to payment' : 'Continuar para pagamento')}
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
                    placeholder={isEN ? 'Your email' : 'O teu email'}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                  />
                  <div className="flex gap-2">
                    {!isEN && (
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
                      <p className="text-sm font-semibold text-foreground">{isEN ? 'Card' : 'Cartão'}</p>
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
                      placeholder={isEN ? 'Phone number' : 'Número de telemóvel'}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                    />
                  )}
                </div>
                {careerPathError && <p className="text-sm text-red-500">{careerPathError}</p>}
                <Button
                  onClick={handleCareerPathPayment}
                  className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
                >
                  {isEN ? `Pay ${CUR}${P.career} and Generate Career Path` : `Pagar ${CUR}${P.career} e Gerar Career Path`}
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
                <p className="text-xs text-muted-foreground">{isEN ? 'This may take up to 30 seconds.' : 'Isto pode demorar até 30 segundos.'}</p>
                {careerPathError && <p className="text-sm text-red-500 mt-2">{careerPathError}</p>}
              </div>
            )}

            {careerPathPaymentStep === 'done' && (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                <p className="text-sm font-semibold text-green-600">{isEN ? 'Career Path generated successfully!' : 'Career Path gerado com sucesso!'}</p>
                <Button
                  onClick={() => setShowCareerPathModal(false)}
                  className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
                >
                  {isEN ? 'View Career Path' : 'Ver Career Path'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
