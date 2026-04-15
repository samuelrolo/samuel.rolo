// Pack Estudante — Resultados Integrados | Share2Inspire
// Dashboard unificado: análise inteligente CV + LinkedIn para estudantes
import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, BarChart3,
  Linkedin, ArrowRight, GraduationCap, Sparkles, Globe, Target, Users,
  Eye, Shield, Zap, FileText, TrendingUp, Award, Star, Copy, Check,
  Briefcase, BookOpen, Search, RefreshCw, Download, Calendar, MapPin, ArrowLeft
} from "lucide-react";
import S2IFooter from "@/components/S2IFooter";
import S2IHeader from "@/components/S2IHeader";
import { finishAndClean, clearSensitiveData } from "@/lib/storageCleanup";
import { useLocation } from "wouter";
import { t, pick, getLang, localePath } from '@/i18n';
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";
import { fetchPaymentStatus, getFirstStoredValue } from "@/lib/paymentAccess";
import { Button } from "@/components/ui/button";

// ─── Helpers ───
const scoreColor = (s: number, studentScale = false) => {
  const threshold = studentScale ? 65 : 70;
  return s >= threshold ? 'text-green-600' : s >= 50 ? 'text-amber-600' : 'text-red-600';
};
const scoreBg = (s: number) => {
  return s >= 65 ? 'bg-green-50 border-green-200' : s >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
};
const scoreRing = (s: number) => s >= 65 ? 'stroke-green-500' : s >= 50 ? 'stroke-amber-500' : 'stroke-red-500';
const nivelBadge = (nivel: string) => {
  const l = (nivel || '').toLowerCase();
  if (l.includes('destacado') || l.includes('outstanding')) return 'bg-green-100 text-green-700 border-green-300';
  if (l.includes('competitivo') || l.includes('competitive')) return 'bg-blue-100 text-blue-700 border-blue-300';
  return 'bg-amber-100 text-amber-700 border-amber-300';
};

// Safe text renderer — converts any API value to a renderable string
const safeText = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.txt) return String(val.txt);
    if (val.text) return String(val.text);
    if (val.descricao) return String(val.descricao);
    if (val.valor !== undefined && val.analise) return String(val.analise);
    if (Array.isArray(val)) return val.map(v => safeText(v)).filter(Boolean).join(', ');
    const firstStr = Object.values(val).find(v => typeof v === 'string');
    if (firstStr) return String(firstStr);
    try { return JSON.stringify(val); } catch { return '[data]'; }
  }
  return String(val);
};

const normalizeLabelKey = (value: string) => (value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' e ')
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const translatedScoreLabel = (rawKey: string) => {
  const normalized = normalizeLabelKey(rawKey);
  const exactMap: Record<string, string> = {
    conteudo_e_estrutura: pick('Conteúdo e Estrutura', 'Content and Structure', 'Contenido y Estructura'),
    content_and_structure: pick('Conteúdo e Estrutura', 'Content and Structure', 'Contenido y Estructura'),
    palavras_chave: pick('Palavras-chave', 'Keywords', 'Palabras clave'),
    palavras_chave_ats: pick('Palavras-chave e ATS', 'Keywords and ATS', 'Palabras clave y ATS'),
    ats_keywords: pick('Palavras-chave e ATS', 'Keywords and ATS', 'Palabras clave y ATS'),
    experiencia: pick('Experiência', 'Experience', 'Experiencia'),
    experience: pick('Experiência', 'Experience', 'Experiencia'),
    formacao: pick('Formação', 'Education', 'Formación'),
    education: pick('Formação', 'Education', 'Formación'),
    educacao: pick('Educação', 'Education', 'Educación'),
    hard_skills: pick('Hard Skills', 'Hard Skills', 'Hard Skills'),
    soft_skills: pick('Soft Skills', 'Soft Skills', 'Soft Skills'),
    headline: pick('Headline', 'Headline', 'Titular'),
    sobre: pick('Sobre', 'About', 'Acerca de'),
    about: pick('Sobre', 'About', 'Acerca de'),
    resumo: pick('Resumo', 'Summary', 'Resumen'),
    experiencia_profissional: pick('Experiência Profissional', 'Professional Experience', 'Experiencia Profesional'),
    professional_experience: pick('Experiência Profissional', 'Professional Experience', 'Experiencia Profesional'),
    educacao_e_certificacoes: pick('Educação e Certificações', 'Education and Certifications', 'Educación y Certificaciones'),
    education_and_certifications: pick('Educação e Certificações', 'Education and Certifications', 'Educación y Certificaciones'),
    visibilidade_e_seo: pick('Visibilidade e SEO', 'Visibility and SEO', 'Visibilidad y SEO'),
    visibility_and_seo: pick('Visibilidade e SEO', 'Visibility and SEO', 'Visibilidad y SEO'),
    foto_e_banner: pick('Foto e Banner', 'Photo and Banner', 'Foto y Banner'),
    photo_and_banner: pick('Foto e Banner', 'Photo and Banner', 'Foto y Banner'),
    coerencia: pick('Coerência', 'Consistency', 'Coherencia'),
    consistency: pick('Coerência', 'Consistency', 'Coherencia'),
  };

  if (exactMap[normalized]) return exactMap[normalized];

  const tokenMap: Record<string, string> = {
    ats: 'ATS',
    seo: 'SEO',
    cv: 'CV',
    linkedin: 'LinkedIn',
    conteudo: pick('Conteúdo', 'Content', 'Contenido'),
    content: pick('Conteúdo', 'Content', 'Contenido'),
    estrutura: pick('Estrutura', 'Structure', 'Estructura'),
    structure: pick('Estrutura', 'Structure', 'Estructura'),
    palavras: pick('Palavras', 'Keywords', 'Palabras'),
    chave: pick('Chave', 'Keywords', 'Clave'),
    keywords: pick('Keywords', 'Keywords', 'Keywords'),
    experiencia: pick('Experiência', 'Experience', 'Experiencia'),
    experience: pick('Experiência', 'Experience', 'Experiencia'),
    formacao: pick('Formação', 'Education', 'Formación'),
    education: pick('Educação', 'Education', 'Educación'),
    educacao: pick('Educação', 'Education', 'Educación'),
    headline: pick('Headline', 'Headline', 'Titular'),
    sobre: pick('Sobre', 'About', 'Acerca de'),
    about: pick('Sobre', 'About', 'Acerca de'),
    resumo: pick('Resumo', 'Summary', 'Resumen'),
    skills: pick('Skills', 'Skills', 'Competencias'),
    visibilidade: pick('Visibilidade', 'Visibility', 'Visibilidad'),
    visibility: pick('Visibilidade', 'Visibility', 'Visibilidad'),
    foto: pick('Foto', 'Photo', 'Foto'),
    photo: pick('Foto', 'Photo', 'Foto'),
    banner: pick('Banner', 'Banner', 'Banner'),
    coerencia: pick('Coerência', 'Consistency', 'Coherencia'),
    consistency: pick('Coerência', 'Consistency', 'Coherencia'),
    certificacoes: pick('Certificações', 'Certifications', 'Certificaciones'),
    certifications: pick('Certificações', 'Certifications', 'Certificaciones'),
    profissional: pick('Profissional', 'Professional', 'Profesional'),
    professional: pick('Profissional', 'Professional', 'Profesional'),
    and: pick('e', 'and', 'y'),
    e: pick('e', 'and', 'y'),
  };

  return normalized
    .split('_')
    .filter(Boolean)
    .map(token => tokenMap[token] || token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
};

function ScoreCircle({ score, size = 120, strokeWidth = 8, max = 100 }: { score: number; size?: number; strokeWidth?: number; max?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / max, 1);
  const offset = circumference * (1 - pct);
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={radius} className={scoreRing(score)} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
    </svg>
  );
}

function Section({ title, subtitle, icon: Icon, children, defaultOpen = false, badge, color = 'emerald' }: {
  title: string; subtitle?: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode; color?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl mb-5 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
          <div className="text-left">
            <h2 className="font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {badge}
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>
      {open && <div className="px-5 pb-5 overflow-x-auto">{children}</div>}
    </div>
  );
}

function ProgressBar({ value, color = 'emerald' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full bg-${color}-500 transition-all duration-1000`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function StudentPackResults() {
  const [, setLocation] = useLocation();
  const lang = getLang();
  usePageSEO(pageSeo.studentPackResults);

  const [data, setData] = useState<any>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      const raw = sessionStorage.getItem('studentPackAnalysis');
      const storedPaid = sessionStorage.getItem('studentPackPaid') === 'true';
      const orderId = getFirstStoredValue(['studentPackVerifiedOrderId', 'studentPackPendingOrderId']);
      const sessionId = getFirstStoredValue(['studentPackVerifiedTransactionId']);

      if (!raw) {
        setAccessChecked(true);
        setLocation(localePath('/estudante'));
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const normalized = parsed?.analysis && typeof parsed.analysis === 'object' ? parsed.analysis : parsed;
        setData(normalized);
      } catch {
        setLocation(localePath('/estudante'));
        return;
      }

      if (storedPaid || orderId || sessionId) {
        setIsPaid(true);
      }

      const status = await fetchPaymentStatus({ orderId, sessionId, expectedProductTypes: ['student_pack'] });
      if (status.success && status.paid) {
        setIsPaid(true);
        sessionStorage.setItem('studentPackPaid', 'true');
      } else if (!storedPaid) {
        setLocation(localePath('/estudante'));
        return;
      }
      setAccessChecked(true);
    };
    verifyAccess();
  }, []);

  if (!accessChecked || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-500">{pick('A carregar o teu relatório...', 'Loading your report...', 'Cargando tu informe...')}</p>
        </div>
      </div>
    );
  }

  // Critical data check for full-page error state
  const hasCriticalData = data && data.perfil && data.perfil.nome;

  if (!hasCriticalData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <S2IHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-slate-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">😕</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              {t('ups_tenta_novamente')}
            </h1>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {pick(
                'Não conseguimos carregar os teus resultados. Por favor, volta a tentar ou contacta o suporte se o problema persistir.',
                'We couldn\'t load your results. Please try again or contact support if the problem persists.',
                'No pudimos cargar tus resultados. Por favor, inténtalo de nuevo o contacta con soporte si el problema persiste.'
              )}
            </p>
            <Button 
              onClick={() => setLocation(localePath('/estudante'))} 
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {pick('Voltar atrás', 'Go back', 'Volver atrás')}
            </Button>
          </div>
        </div>
        <S2IFooter />
      </div>
    );
  }

  const {
    perfil, score_global: scoreGlobal, auditoria_perfil_dual: auditoria,
    prontidao_mercado: prontidao, capital_academico: capital,
    competencias_transferiveis: competencias, estrategia_keywords_unificada: keywords,
    marca_pessoal_estudante: marca, primeiros_cargos_alvo: cargos,
    plano_90_dias: plano, recomendacao_prioritaria: recomendacao
  } = data;

  const globalScore = scoreGlobal?.valor || 0;
  const nivel = scoreGlobal?.nivel || '';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <S2IHeader />

      <div className="max-w-5xl mx-auto px-4 pt-8 pb-20">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <a href={localePath('/estudante')} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> {pick('Voltar', 'Back', 'Volver')}
          </a>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> {pick('Exportar PDF', 'Export PDF', 'Exportar PDF')}
          </button>
          <button onClick={() => { finishAndClean(); setLocation(localePath('/estudante')); }} className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900 transition-colors shadow-sm">
            {t('concluir')}
          </button>
        </div>

        {/* ═══ SECÇÃO 1 — HERO ═══ */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 md:p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-4">
              <GraduationCap className="w-4 h-4" /> {pick('Pack Estudante — Relatório Completo', 'Student Pack — Full Report', 'Pack Estudiante — Informe Completo')}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative shrink-0">
                <ScoreCircle score={globalScore} size={140} strokeWidth={10} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{globalScore}</span>
                  <span className="text-xs text-emerald-200">/100</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">{perfil.nome}</h1>
                <p className="text-emerald-200 text-sm mb-3">{perfil.curso || perfil.area_alvo}</p>
                {nivel && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${nivelBadge(nivel)}`}>
                    <Star className="w-3.5 h-3.5" /> {nivel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rest of the component content... */}
      </div>
      <S2IFooter />
    </div>
  );
}
