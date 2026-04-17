// Pack Estudante — Resultados Integrados | Share2Inspire
// Dashboard unificado: análise inteligente CV + LinkedIn para estudantes
import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, BarChart3,
  Linkedin, ArrowRight, GraduationCap, Sparkles, Globe, Target, Users,
  Eye, Shield, Zap, FileText, TrendingUp, Award, Star, Copy, Check,
  Briefcase, BookOpen, Search, RefreshCw, Download, Calendar, MapPin
} from "lucide-react";
import S2IFooter from "@/components/S2IFooter";
import S2IHeader from "@/components/S2IHeader";
import { finishAndClean, clearSensitiveData } from "@/lib/storageCleanup";
import { useLocation } from "wouter";
import { t, pick, getLang, localePath } from '@/i18n';
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";
import { fetchPaymentStatus, getFirstStoredValue } from "@/lib/paymentAccess";

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
// Handles: {txt, href}, {text, url}, arrays, nested objects, nulls
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

const urgencyBadgeClass = (urgency: string) => {
  const normalized = normalizeLabelKey(urgency);
  if (normalized.includes('primeiro_estagio') || normalized.includes('first_internship') || normalized.includes('internship') || normalized.includes('practicas')) {
    return 'bg-red-50 text-red-700';
  }
  if (normalized.includes('primeiro_emprego') || normalized.includes('first_job') || normalized.includes('primer_empleo')) {
    return 'bg-amber-50 text-amber-700';
  }
  return 'bg-green-50 text-green-700';
};

// Deep sanitizer — recursively converts {txt,href} objects to strings throughout the data
const deepSanitize = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (typeof obj === 'object') {
    // Check if this is a {txt, href} leaf node
    if (obj.txt && typeof obj.txt === 'string' && (obj.href !== undefined || Object.keys(obj).length <= 3)) {
      return obj.txt;
    }
    if (obj.text && typeof obj.text === 'string' && (obj.url !== undefined || Object.keys(obj).length <= 3)) {
      return obj.text;
    }
    if (Array.isArray(obj)) return obj.map(deepSanitize);
    const result: any = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = deepSanitize(val);
    }
    return result;
  }
  return obj;
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

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-600 transition-colors shrink-0">
      {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> {pick('Copiado!', 'Copied!', '¡Copiado!')}</> : <><Copy className="w-3.5 h-3.5" /> {pick('Copiar', 'Copy', 'Copiar')}</>}
    </button>
  );
}

function Section({ title, subtitle, icon: Icon, children, defaultOpen = false, badge, color = 'emerald' }: {
  title: string; subtitle?: string; icon: any; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode; color?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bgMap: Record<string, string> = { emerald: 'bg-emerald-50', blue: 'bg-blue-50', purple: 'bg-purple-50', amber: 'bg-amber-50', red: 'bg-red-50', slate: 'bg-slate-50' };
  const txtMap: Record<string, string> = { emerald: 'text-emerald-600', blue: 'text-blue-600', purple: 'text-purple-600', amber: 'text-amber-600', red: 'text-red-600', slate: 'text-slate-600' };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl mb-5 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${bgMap[color] || bgMap.emerald} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${txtMap[color] || txtMap.emerald}`} />
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
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = 'emerald' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const colorMap: Record<string, string> = { emerald: 'from-emerald-400 to-emerald-600', blue: 'from-blue-400 to-blue-600', amber: 'from-amber-400 to-amber-600', red: 'from-red-400 to-red-600' };
  return (
    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${colorMap[color] || colorMap.emerald} transition-all duration-1000`}
        style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Legacy adapter: convert EN/ES two-engine data into unified PT-style structure ───
function adaptLegacyToUnified(legacy: any): any {
  const cv = legacy.cv || {};
  const li = legacy.linkedin || {};
  const liTeaser = li.teaser || li.data?.teaser || {};
  const liAnalysis = li.analise_completa || li.data?.analise_completa || li.analysis || li;
  const rawCv = (() => { try { return JSON.parse(sessionStorage.getItem('studentPackCvRaw') || '{}'); } catch { return {}; } })();
  const cp = rawCv.candidate_profile || {};
  const overallScore = cv.overallScore || 0;
  const nivel = overallScore >= 75 ? pick('Destacado', 'Outstanding', 'Destacado') : overallScore >= 50 ? pick('Competitivo', 'Competitive', 'Competitivo') : pick('Em Desenvolvimento', 'In Development', 'En Desarrollo');
  // Build scores_cv from quadrants
  const scoresCv: Record<string, any> = {};
  if (Array.isArray(cv.quadrants)) {
    for (const q of cv.quadrants) {
      const key = (q.title || '').toLowerCase().replace(/[^a-z]/g, '_');
      if (key) scoresCv[key] = { valor: q.score || 0, benchmark_estudantes: q.benchmark || 65 };
    }
  }
  // Build scores_linkedin from dimensoes
  const scoresLinkedin: Record<string, any> = {};
  if (liAnalysis.dimensoes) {
    for (const [k, v] of Object.entries(liAnalysis.dimensoes as Record<string, any>)) {
      scoresLinkedin[k] = { valor: v?.score || 0, analise: v?.analise || '' };
    }
  }
  // Strengths / weaknesses from quadrants
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (Array.isArray(cv.quadrants)) {
    for (const q of cv.quadrants) {
      if (Array.isArray(q.strengths)) strengths.push(...q.strengths);
      if (Array.isArray(q.weaknesses)) weaknesses.push(...q.weaknesses);
    }
  }
  // CV problems → marca_pessoal.problemas_criticos_cv
  const problemasCv = Array.isArray(cv.cvProblems) ? cv.cvProblems.map((p: any) => ({
    problema: p.title || p.problema || '',
    descricao: p.description || p.descricao || '',
    explicacao_completa: p.explanation || p.explicacao_completa || '',
    exemplo_correcao: p.fix || p.exemplo_correcao || '',
    reescrita_sugerida: p.rewrite || p.reescrita_sugerida || ''
  })) : [];
  // Action plan → plano_90_dias
  // actionPlan30Days can be: string[] or {week, title, actions:[]}[]
  const rawActions = Array.isArray(cv.actionPlan30Days) ? cv.actionPlan30Days : [];
  const plano90: any = {};
  if (rawActions.length > 0) {
    // Check if items are structured objects with week/title/actions
    const isStructured = rawActions.length > 0 && typeof rawActions[0] === 'object' && rawActions[0] !== null && (rawActions[0].actions || rawActions[0].week);
    if (isStructured) {
      // Map each structured item directly to a phase
      const phaseKeys = ['semana_1_2', 'semana_3_4', 'mes_2', 'mes_3'];
      rawActions.slice(0, 4).forEach((item: any, i: number) => {
        const key = phaseKeys[i];
        const tema = item.title || item.tema || pick('Fase ' + (i + 1), 'Phase ' + (i + 1), 'Fase ' + (i + 1));
        const acoes: string[] = Array.isArray(item.actions) ? item.actions.map((a: any) => typeof a === 'string' ? a : a.action || a.acao || JSON.stringify(a))
          : Array.isArray(item.tasks) ? item.tasks.map((a: any) => typeof a === 'string' ? a : a.action || a.acao || JSON.stringify(a))
          : typeof item.action === 'string' ? [item.action]
          : typeof item.acao === 'string' ? [item.acao]
          : [];
        if (acoes.length > 0) plano90[key] = { tema, acoes };
      });
    } else {
      // Flat string array: chunk into 4 phases
      const chunk = Math.ceil(rawActions.length / 4);
      const phases = [
        { key: 'semana_1_2', tema: pick('Fundação', 'Foundation', 'Fundación') },
        { key: 'semana_3_4', tema: pick('Optimização', 'Optimization', 'Optimización') },
        { key: 'mes_2', tema: pick('Expansão', 'Expansion', 'Expansión') },
        { key: 'mes_3', tema: pick('Consolidação', 'Consolidation', 'Consolidación') }
      ];
      phases.forEach((ph, i) => {
        const slice = rawActions.slice(i * chunk, (i + 1) * chunk);
        if (slice.length > 0) plano90[ph.key] = { tema: ph.tema, acoes: slice.map((a: any) => typeof a === 'string' ? a : a.action || a.acao || JSON.stringify(a)) };
      });
    }
  }
  // LinkedIn headlines from areas_melhoria
  const headlines: string[] = [];
  if (Array.isArray(liAnalysis.areas_melhoria)) {
    for (const am of liAnalysis.areas_melhoria) {
      if (am.recomendacao) headlines.push(am.recomendacao);
    }
  }
  return {
    perfil: {
      nome: cp.name || cp.nome || cp.detected_name || '',
      curso: cp.detected_role || cp.area || '',
      area_alvo: cv.perceivedRole || cp.detected_role || '',
      resumo_executivo: liAnalysis.sumario_executivo || liTeaser.hook_vendas || ''
    },
    score_global: {
      valor: overallScore,
      nivel,
      interpretacao: liAnalysis.sumario_executivo || liTeaser.hook_vendas || '',
      vs_mercado_entrada: liAnalysis.benchmarking?.resumo || ''
    },
    auditoria_perfil_dual: {
      coerencia_cv_linkedin: overallScore >= 65 ? pick('Alta', 'High', 'Alta') : overallScore >= 45 ? pick('Média', 'Medium', 'Media') : pick('Baixa', 'Low', 'Baja'),
      analise_coerencia: liAnalysis.sumario_executivo || liTeaser.hook_vendas || '',
      primeira_impressao_cv: strengths.slice(0, 2).join('. ') || '',
      primeira_impressao_linkedin: liTeaser.hook_vendas || liAnalysis.hook_vendas || liAnalysis.sumario_executivo || '',
      scores_cv: scoresCv,
      scores_linkedin: scoresLinkedin
    },
    prontidao_mercado: {
      score_estagio: Math.min(100, Math.round(overallScore * 1.1)),
      score_primeiro_emprego: Math.min(100, overallScore),
      analise_prontidao: liAnalysis.recomendacao_prioritaria || liTeaser.hook_vendas || '',
      o_que_ja_tens: strengths.slice(0, 5),
      o_que_ainda_precisas: weaknesses.slice(0, 5)
    },
    capital_academico: {
      pontos_fortes_academicos: strengths.slice(0, 4),
      oportunidades_nao_aproveitadas: weaknesses.slice(0, 4)
    },
    competencias_transferiveis: {
      mapa_competencias: (cv.keywords || []).slice(0, 6).map((kw: string, idx: number) => {
        // Try to find evidence from quadrant strengths or weaknesses
        const allStrengths = strengths.concat(weaknesses);
        const relevantEvidence = allStrengths.find((s: string) => s.toLowerCase().includes(kw.toLowerCase().substring(0, 6))) || allStrengths[idx] || '';
        return {
          competencia: kw,
          origem: pick('CV', 'CV', 'CV'),
          traducao_mercado: kw,
          evidencia_sugerida: relevantEvidence ? relevantEvidence.substring(0, 120) : pick('Identificada no CV', 'Identified in CV', 'Identificada en el CV')
        };
      }),
      gaps_criticos: []
    },
    estrategia_keywords_unificada: {
      ats_score: cv.atsRejectionRate != null ? (100 - cv.atsRejectionRate) : 0,
      seo_linkedin_score: liAnalysis.dimensoes?.visibilidade_seo?.score || 0,
      keywords_presentes: (cv.keywords || []).map((kw: string) => ({ keyword: kw, onde: 'CV' })),
      keywords_em_falta: []
    },
    marca_pessoal_estudante: {
      headline_linkedin_sugeridas: (Array.isArray(liAnalysis.headlines_sugeridas) && liAnalysis.headlines_sugeridas.length > 0 ? liAnalysis.headlines_sugeridas : headlines).slice(0, 3),
      resumo_linkedin_sugerido: liAnalysis.resumo_linkedin_sugerido || '',
      problemas_criticos_cv: problemasCv,
      acoes_linkedin_prioritarias: Array.isArray(liAnalysis.areas_melhoria) ? liAnalysis.areas_melhoria.map((am: any) => am.diagnostico || am.recomendacao || '').filter(Boolean).slice(0, 5) : []
    },
    primeiros_cargos_alvo: [],
    plano_90_dias: plano90,
    recomendacao_prioritaria: liAnalysis.recomendacao_prioritaria || liTeaser.hook_vendas || ''
  };
}

// ════════════════════════════════════════
// ─── MAIN COMPONENT ───
// ════════════════════════════════════════
export default function StudentPackResults() {
  const [, setLocation] = useLocation();
  const lang = getLang();
  usePageSEO(pageSeo.studentPackResults);

  const rawData = useMemo(() => {
    try {
      // Try new student_pack format first
      const sp = sessionStorage.getItem('studentPackAnalysis');
      if (sp) return JSON.parse(sp);
      // Fallback to old separate format
      const cvA = sessionStorage.getItem('studentPackCvAnalysis');
      const liA = sessionStorage.getItem('studentPackLinkedinAnalysis');
      if (cvA) return { _legacy: true, cv: JSON.parse(cvA), linkedin: JSON.parse(liA || '{}') };
      return {};
    } catch { return {}; }
  }, []);

  const [isPaid, setIsPaid] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifyAccess = async () => {
      const hasAnalysis = Boolean(sessionStorage.getItem('studentPackAnalysis') || sessionStorage.getItem('studentPackCvAnalysis'));
      const storedPaidFlag = sessionStorage.getItem('studentPackPaid') === 'true';
      const orderId = getFirstStoredValue(['studentPackVerifiedOrderId', 'studentPackPendingOrderId']);
      const sessionId = getFirstStoredValue(['studentPackVerifiedTransactionId']);
      const hasPaymentMarker = Boolean(orderId || sessionId);

      if (!hasAnalysis) {
        if (!cancelled) {
          setAccessChecked(true);
          window.location.href = localePath('/estudante');
        }
        return;
      }

      if (storedPaidFlag || hasPaymentMarker) {
        setIsPaid(true);
      }

      const paymentStatus = await fetchPaymentStatus({
        orderId,
        sessionId,
        expectedProductTypes: ['student_pack'],
      });

      if (!cancelled) {
        if (paymentStatus.success && paymentStatus.paid) {
          setIsPaid(true);
          sessionStorage.setItem('studentPackPaid', 'true');
        } else if (!(storedPaidFlag && hasAnalysis)) {
          window.location.href = localePath('/estudante');
          return;
        }
        setAccessChecked(true);
      }
    };

    verifyAccess();
    return () => { cancelled = true; };
  }, []);

  // For legacy EN/ES data, adapt to unified format; otherwise use as-is
  const unified = useMemo(() => rawData?._legacy ? adaptLegacyToUnified(rawData) : null, [rawData]);

  // Extract data from the unified student_pack response, sanitize to prevent {txt,href} objects crashing React
  const analysis = deepSanitize(unified || rawData?.analysis || rawData?.data || rawData || {});
  const perfilRaw = analysis?.perfil || {};
  // Bulletproof name fallback: try multiple sources
  const perfil = (() => {
    if (perfilRaw.nome) return perfilRaw;
    // Try extracting name from raw CV data in sessionStorage
    try {
      const cvRawStr = sessionStorage.getItem('studentPackCvRaw');
      if (cvRawStr) {
        const cvRawData = JSON.parse(cvRawStr);
        const cp = cvRawData?.candidate_profile || cvRawData;
        const fallbackName = cp?.detected_name || cp?.name || cp?.nome || '';
        if (fallbackName) return { ...perfilRaw, nome: fallbackName };
      }
      // Also try the full analysis object
      const spStr = sessionStorage.getItem('studentPackAnalysis');
      if (spStr) {
        const spData = JSON.parse(spStr);
        const srcCvRaw = spData?.sources?.cv_raw;
        const cp2 = srcCvRaw?.candidate_profile || {};
        const fallbackName2 = cp2?.detected_name || cp2?.name || cp2?.nome || '';
        if (fallbackName2) return { ...perfilRaw, nome: fallbackName2 };
      }
    } catch {}
    // Ultimate fallback: extract name from executive summary text
    try {
      const summaryText = perfilRaw?.resumo_executivo || analysis?.score_global?.resumo_executivo || '';
      if (summaryText) {
        // Pattern: "O/A [Name] apresenta" or "[Name], tu/o teu" or first capitalized words
        const m = summaryText.match(/^(?:O|A|El|La)\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)*)\s+(?:apresenta|refleja|reflects|shows|demonstra|possui|tiene|has|situa|posiciona)/i)
          || summaryText.match(/([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)*),\s+(?:tu|o teu|el tu|your|the)/i);
        if (m?.[1]) return { ...perfilRaw, nome: m[1] };
      }
    } catch {}
    return perfilRaw;
  })();
  const scoreGlobal = analysis?.score_global || {};
  const auditoria = analysis?.auditoria_perfil_dual || {};
  const capitalAcademico = analysis?.capital_academico || {};
  const competencias = analysis?.competencias_transferiveis || {};
  const prontidao = analysis?.prontidao_mercado || {};
  const keywords = analysis?.estrategia_keywords_unificada || {};
  const marcaPessoal = analysis?.marca_pessoal_estudante || {};
  const cargosAlvo = analysis?.primeiros_cargos_alvo || [];
  const plano90 = analysis?.plano_90_dias || {};
  const recomendacaoPrioritaria = analysis?.recomendacao_prioritaria || '';

  const globalScore = scoreGlobal?.valor || 0;
  const nivel = scoreGlobal?.nivel || '';

  const [expandedCargo, setExpandedCargo] = useState<number | null>(0);
  const [expandedProblema, setExpandedProblema] = useState<number | null>(null);

  if (!accessChecked || !isPaid) return null;

  const hasData = globalScore > 0 || perfil?.nome || Object.keys(auditoria).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <S2IHeader activePage="estudante" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Action buttons */}
        <div className="flex justify-end gap-2 mb-6">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600 transition-colors">
            <Download className="w-4 h-4" /> {t('exportar_pdf')}
          </button>
          <button 
            onClick={() => { 
                clearSensitiveData(); 
                window.location.href = localePath('/estudante'); 
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-sm font-medium text-emerald-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> {t('nova_anlise')}
          </button>
          <button 
            onClick={() => finishAndClean(setLocation)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md"
          >
            {t('concluir')}
          </button>
        </div>

        {!hasData ? (
          <div className="text-center py-20">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">{pick('Sem dados de análise', 'No analysis data', 'Sin datos de análisis')}</h2>
            <p className="text-slate-500 mb-6">{pick('A análise não retornou resultados. Tenta novamente.', 'The analysis did not return any results. Please try again.', 'El análisis no devolvió resultados. Inténtalo de nuevo.')}</p>
            <a href={localePath('/estudante')} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold">
              <GraduationCap className="w-5 h-5" /> {pick('Tentar novamente', 'Try again', 'Intentar de nuevo')}
            </a>
          </div>
        ) : (
          <>
            {/* ═══ SECÇÃO 1 — HERO ═══ */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 md:p-8 text-white mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-4">
                  <GraduationCap className="w-4 h-4" /> {pick('Relatório Completo', 'Complete Report', 'Informe Completo')}
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
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">{pick('Pack Estudante', 'Student Pack', 'Pack Estudante')}</h1>
                    {(perfil?.curso || perfil?.area_alvo) && (
                      <p className="text-emerald-200 text-sm mb-3">{perfil?.curso || perfil?.area_alvo}</p>
                    )}
                    {nivel && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${nivelBadge(nivel)}`}>
                        <Star className="w-3.5 h-3.5" /> {nivel}
                      </span>
                    )}
                    {scoreGlobal?.percentil_estudantes && (
                      <span className="ml-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white">
                        {pick(`Top ${100 - scoreGlobal.percentil_estudantes}% estudantes`, `Top ${100 - scoreGlobal.percentil_estudantes}% students`, `Top ${100 - scoreGlobal.percentil_estudantes}% estudiantes`)}
                      </span>
                    )}
                  </div>
                </div>

                {perfil?.resumo_executivo && (
                  <p className="text-emerald-100 text-sm leading-relaxed mt-6">{perfil.resumo_executivo}</p>
                )}
              </div>
            </div>

            {/* Score interpretation */}
            {scoreGlobal?.interpretacao && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8963E] mb-3">
                  <Sparkles className="w-4 h-4" /> {pick('O que significa o teu score', 'What your score means', 'Qué significa tu puntuación')}
                </div>
                <p className="text-slate-700 leading-relaxed">{scoreGlobal.interpretacao}</p>
                {scoreGlobal?.vs_mercado_entrada && (
                  <p className="text-slate-600 text-sm mt-3 italic">{scoreGlobal.vs_mercado_entrada}</p>
                )}
              </div>
            )}

            {/* ═══ SECÇÃO 2 — AUDITORIA DUAL ═══ */}
            {Object.keys(auditoria).length > 0 && (
              <Section title={pick('Auditoria de Perfil Dual', 'Dual Profile Audit', 'Auditoría de Perfil Dual')} subtitle={pick('CV + LinkedIn como sistema único', 'CV + LinkedIn as a single system', 'CV + LinkedIn como un sistema único')} icon={Eye} defaultOpen={true} color="blue"
                badge={auditoria.coerencia_cv_linkedin && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    ['Alta', 'High'].includes(auditoria.coerencia_cv_linkedin) ? 'bg-green-50 text-green-700 border-green-200' :
                    ['Média', 'Medium', 'Media'].includes(auditoria.coerencia_cv_linkedin) ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>{pick('Coerência', 'Consistency', 'Coherencia')}: {auditoria.coerencia_cv_linkedin}</span>
                )}>
                <div className="space-y-4">
                  {auditoria.analise_coerencia && (
                    <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 border border-blue-100 rounded-xl p-4">{auditoria.analise_coerencia}</p>
                  )}

                  {/* First impressions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {auditoria.primeira_impressao_cv && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-500" /> {pick('Primeira Impressão — CV', 'First Impression — CV', 'Primera Impresión — CV')}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{auditoria.primeira_impressao_cv}</p>
                      </div>
                    )}
                    {auditoria.primeira_impressao_linkedin && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-1.5"><Linkedin className="w-4 h-4 text-blue-600" /> {pick('Primeira Impressão — LinkedIn', 'First Impression — LinkedIn', 'Primera Impresión — LinkedIn')}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{auditoria.primeira_impressao_linkedin}</p>
                      </div>
                    )}
                  </div>

                  {/* CV Scores */}
                  {auditoria.scores_cv && (
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-500" /> {pick('Scores CV', 'CV Scores', 'Puntuaciones CV')}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(auditoria.scores_cv).map(([key, val]: [string, any]) => (
                          <div key={key} className={`rounded-xl p-3 border ${scoreBg(val?.valor || 0)}`}>
                            <p className={`text-2xl font-bold ${scoreColor(val?.valor || 0, true)}`}>{val?.valor || 0}</p>
                            <p className="text-xs text-slate-600 font-medium">{translatedScoreLabel(key)}</p>
                            {val?.benchmark_estudantes && <p className="text-[10px] text-slate-400 mt-1">{pick('Referência', 'Benchmark', 'Referencia')}: {val.benchmark_estudantes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LinkedIn Scores */}
                  {auditoria.scores_linkedin && (
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-1.5"><Linkedin className="w-4 h-4 text-blue-600" /> {pick('Scores LinkedIn', 'LinkedIn Scores', 'Puntuaciones LinkedIn')}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(auditoria.scores_linkedin).map(([key, val]: [string, any]) => (
                          <div key={key} className={`rounded-xl p-3 border ${scoreBg((val?.valor || 0) * 10)}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-600">{translatedScoreLabel(key)}</span>
                              <span className={`text-lg font-bold ${scoreColor((val?.valor || 0) * 10, true)}`}>{val?.valor || 0}<span className="text-xs text-slate-400">/10</span></span>
                            </div>
                            {val?.analise && <p className="text-xs text-slate-500 leading-relaxed">{val.analise}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 3 — PRONTIDÃO PARA O MERCADO ═══ */}
            {(prontidao?.score_estagio || prontidao?.score_primeiro_emprego) && (
              <Section title={pick('Prontidão para o Mercado', 'Market Readiness', 'Preparación para el Mercado')} subtitle={pick('Estágio vs primeiro emprego', 'Internship vs first job', 'Prácticas vs primer empleo')} icon={Target} defaultOpen={true} color="emerald"
                badge={<span className={`text-sm font-bold ${scoreColor(prontidao.score_estagio || 0, true)}`}>{pick('Estágio', 'Internship', 'Prácticas')}: {prontidao.score_estagio || 0}%</span>}>
                <div className="space-y-4">
                  {/* Two score bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">{pick('Estágio', 'Internship', 'Prácticas')}</span>
                        <span className={`text-2xl font-bold ${scoreColor(prontidao.score_estagio || 0, true)}`}>{prontidao.score_estagio || 0}%</span>
                      </div>
                      <ProgressBar value={prontidao.score_estagio || 0} color="emerald" />
                    </div>
                    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">{pick('Primeiro Emprego', 'First Job', 'Primer Empleo')}</span>
                        <span className={`text-2xl font-bold ${scoreColor(prontidao.score_primeiro_emprego || 0, true)}`}>{prontidao.score_primeiro_emprego || 0}%</span>
                      </div>
                      <ProgressBar value={prontidao.score_primeiro_emprego || 0} color="blue" />
                    </div>
                  </div>

                  {prontidao.analise_prontidao && (
                    <p className="text-sm text-slate-700 leading-relaxed">{prontidao.analise_prontidao}</p>
                  )}

                  {/* What you have vs what you need */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(prontidao.o_que_ja_tens) && prontidao.o_que_ja_tens.length > 0 && (
                      <div className="bg-green-50/30 border border-green-200 rounded-xl p-4">
                        <h4 className="font-semibold text-green-700 text-sm mb-3">✅ {pick('O que já tens', 'What you already have', 'Lo que ya tienes')}</h4>
                        <ul className="space-y-2">
                          {prontidao.o_que_ja_tens.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(prontidao.o_que_ainda_precisas) && prontidao.o_que_ainda_precisas.length > 0 && (
                      <div className="bg-amber-50/30 border border-amber-200 rounded-xl p-4">
                        <h4 className="font-semibold text-amber-700 text-sm mb-3">⚠️ {pick('O que ainda precisas', 'What you still need', 'Lo que aún necesitas')}</h4>
                        <ul className="space-y-2">
                          {prontidao.o_que_ainda_precisas.map((item: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {prontidao.diferenciadores_vs_pares && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                      <h4 className="font-semibold text-emerald-700 text-sm mb-2 flex items-center gap-1.5"><Star className="w-4 h-4" /> {pick('O que te diferencia dos teus pares', 'What sets you apart from your peers', 'Lo que te diferencia de tus pares')}</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{prontidao.diferenciadores_vs_pares}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 4 — CAPITAL ACADÉMICO ═══ */}
            {Object.keys(capitalAcademico).length > 0 && (
              <Section title={pick('Capital Académico', 'Academic Capital', 'Capital Académico')} subtitle={pick('Maximiza o valor do teu percurso', 'Maximize the value of your journey', 'Maximiza el valor de tu recorrido')} icon={GraduationCap} defaultOpen={true} color="purple">
                <div className="space-y-4">
                  {capitalAcademico.instituicao_prestigio && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">{pick('Peso da instituição', 'Institution weight', 'Peso de la institución')}:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        ['Alta', 'High'].includes(capitalAcademico.instituicao_prestigio) ? 'bg-green-50 text-green-700 border-green-200' :
                        ['Emergente', 'Emerging'].includes(capitalAcademico.instituicao_prestigio) ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>{capitalAcademico.instituicao_prestigio}</span>
                    </div>
                  )}

                  {Array.isArray(capitalAcademico.pontos_fortes_academicos) && capitalAcademico.pontos_fortes_academicos.length > 0 && (
                    <div className="bg-green-50/30 border border-green-200 rounded-xl p-4">
                      <h4 className="font-semibold text-green-700 text-sm mb-3">🎓 {pick('Pontos Fortes Académicos', 'Academic Strengths', 'Fortalezas Académicas')}</h4>
                      <ul className="space-y-2">
                        {capitalAcademico.pontos_fortes_academicos.map((p: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(capitalAcademico.oportunidades_nao_aproveitadas) && capitalAcademico.oportunidades_nao_aproveitadas.length > 0 && (
                    <div className="bg-amber-50/30 border border-amber-200 rounded-xl p-4">
                      <h4 className="font-semibold text-amber-700 text-sm mb-3">💡 {pick('Oportunidades Não Aproveitadas', 'Missed Opportunities', 'Oportunidades No Aprovechadas')}</h4>
                      <ul className="space-y-2">
                        {capitalAcademico.oportunidades_nao_aproveitadas.map((o: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {capitalAcademico.como_maximizar_formacao && (
                    <p className="text-sm text-slate-700 leading-relaxed bg-purple-50/30 border border-purple-100 rounded-xl p-4">{capitalAcademico.como_maximizar_formacao}</p>
                  )}

                  {/* Certificações recomendadas */}
                  {Array.isArray(capitalAcademico.certificacoes_recomendadas) && capitalAcademico.certificacoes_recomendadas.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-3">📜 {pick('Certificações Recomendadas', 'Recommended Certifications', 'Certificaciones Recomendadas')}</h4>
                      <div className="space-y-3">
                        {capitalAcademico.certificacoes_recomendadas.map((cert: any, i: number) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-semibold text-slate-900 text-sm">{cert.nome}</h5>
                                <p className="text-xs text-slate-500">{cert.entidade}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{cert.custo}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyBadgeClass(cert.urgencia || '')}`}>{cert.urgencia}</span>
                              </div>
                            </div>
                            {cert.impacto && <p className="text-xs text-slate-600">{cert.impacto}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 5 — COMPETÊNCIAS TRANSFERÍVEIS ═══ */}
            {(competencias?.mapa_competencias?.length > 0 || competencias?.gaps_criticos?.length > 0) && (
              <Section title={pick('Competências Transferíveis', 'Transferable Skills', 'Competencias Transferibles')} subtitle={pick('Do académico para o profissional', 'From academia to professional life', 'De lo académico a lo profesional')} icon={Zap} defaultOpen={true} color="amber">
                <div className="space-y-4">
                  {Array.isArray(competencias.mapa_competencias) && competencias.mapa_competencias.map((comp: any, i: number) => (
                    <div key={i} className="bg-gradient-to-r from-amber-50/30 to-orange-50/30 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <h5 className="font-semibold text-slate-900 text-sm">{comp.competencia}</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div><span className="font-semibold text-slate-500">{pick('Origem', 'Origin', 'Origen')}:</span> <span className="text-slate-700">{comp.origem}</span></div>
                        <div><span className="font-semibold text-slate-500">{pick('No mercado', 'In the market', 'En el mercado')}:</span> <span className="text-slate-700">{comp.traducao_mercado}</span></div>
                        <div><span className="font-semibold text-slate-500">{pick('Evidência', 'Evidence', 'Evidencia')}:</span> <span className="text-slate-700">{comp.evidencia_sugerida}</span></div>
                      </div>
                    </div>
                  ))}

                  {Array.isArray(competencias.gaps_criticos) && competencias.gaps_criticos.length > 0 && (
                    <div className="bg-red-50/30 border border-red-200 rounded-xl p-4">
                      <h4 className="font-semibold text-red-700 text-sm mb-3">⚠️ {pick('Gaps Críticos', 'Critical Gaps', 'Brechas Críticas')}</h4>
                      <div className="space-y-2">
                        {competencias.gaps_criticos.map((gap: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 text-sm">
                            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-slate-800">{gap.competencia}</span>
                              <span className="text-slate-500"> — {gap.como_adquirir}</span>
                              <span className="text-xs text-red-600 ml-1">({gap.prazo})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 6 — ESTRATÉGIA DE KEYWORDS ═══ */}
            {(keywords?.keywords_presentes?.length > 0 || keywords?.keywords_em_falta?.length > 0) && (
              <Section title={pick('Estratégia de Keywords Unificada', 'Unified Keyword Strategy', 'Estrategia Unificada de Keywords')} subtitle={pick('ATS + SEO LinkedIn', 'ATS + LinkedIn SEO', 'ATS + SEO de LinkedIn')} icon={Search} defaultOpen={false} color="blue"
                badge={keywords.ats_score ? <span className="text-xs font-bold text-slate-500">ATS: {keywords.ats_score}% · SEO: {keywords.seo_linkedin_score}/10</span> : undefined}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                      <p className={`text-2xl font-bold ${scoreColor(keywords.ats_score || 0, true)}`}>{keywords.ats_score || 0}%</p>
                      <p className="text-xs text-slate-600">{pick('Pontuação ATS', 'ATS Score', 'Puntuación ATS')}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                      <p className={`text-2xl font-bold ${scoreColor((keywords.seo_linkedin_score || 0) * 10, true)}`}>{keywords.seo_linkedin_score || 0}/10</p>
                      <p className="text-xs text-slate-600">{pick('SEO LinkedIn', 'LinkedIn SEO', 'SEO LinkedIn')}</p>
                    </div>
                  </div>

                  {Array.isArray(keywords.keywords_presentes) && keywords.keywords_presentes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">{pick('Keywords Presentes', 'Present Keywords', 'Keywords Presentes')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {keywords.keywords_presentes.map((kw: any, i: number) => (
                          <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            ['Ambos', 'Both'].includes(kw.onde) ? 'bg-green-50 text-green-700 border-green-200' :
                            kw.onde === 'CV' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>{kw.keyword} <span className="opacity-60">({kw.onde})</span></span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(keywords.keywords_em_falta) && keywords.keywords_em_falta.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">{pick('Keywords em Falta', 'Missing Keywords', 'Keywords que Faltan')}</p>
                      <div className="space-y-2">
                        {keywords.keywords_em_falta.map((kw: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm bg-red-50/50 border border-red-100 rounded-lg p-2.5">
                            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-red-700">{kw.keyword}</span>
                              <span className="text-slate-500 text-xs"> → {kw.onde_adicionar}</span>
                              {kw.justificacao && <p className="text-xs text-slate-500 mt-0.5">{kw.justificacao}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {keywords.recomendacao_keywords && (
                    <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/30 border border-blue-100 rounded-xl p-4">💡 {keywords.recomendacao_keywords}</p>
                  )}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 7 — MARCA PESSOAL ═══ */}
            {Object.keys(marcaPessoal).length > 0 && (
              <Section title={pick('Marca Pessoal', 'Personal Brand', 'Marca Personal')} subtitle={pick('Headlines, About e correções prioritárias', 'Headlines, About and priority fixes', 'Titulares, About y correcciones prioritarias')} icon={Sparkles} defaultOpen={true} color="emerald">
                <div className="space-y-4">
                  {/* Headlines sugeridas */}
                  {Array.isArray(marcaPessoal.headline_linkedin_sugeridas) && marcaPessoal.headline_linkedin_sugeridas.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-3">✨ {pick('Headlines LinkedIn Sugeridas', 'Suggested LinkedIn Headlines', 'Titulares Sugeridos para LinkedIn')}</h4>
                      <div className="space-y-2.5">
                        {marcaPessoal.headline_linkedin_sugeridas.map((h: string, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 rounded-full w-7 h-7 flex items-center justify-center shrink-0">{i + 1}</span>
                              <p className="text-sm font-medium text-slate-800">{h}</p>
                            </div>
                            <CopyBtn text={h} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resumo LinkedIn sugerido */}
                  {marcaPessoal.resumo_linkedin_sugerido && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5"><Linkedin className="w-4 h-4 text-blue-600" /> {pick('Resumo LinkedIn — Pronto a usar', 'LinkedIn Summary — Ready to use', 'Resumen de LinkedIn — Listo para usar')}</h4>
                        <CopyBtn text={marcaPessoal.resumo_linkedin_sugerido} />
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{marcaPessoal.resumo_linkedin_sugerido}</p>
                    </div>
                  )}

                  {/* Problemas críticos CV */}
                  {Array.isArray(marcaPessoal.problemas_criticos_cv) && marcaPessoal.problemas_criticos_cv.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-3">🔧 {pick('Problemas Críticos do CV', 'Critical CV Issues', 'Problemas Críticos del CV')}</h4>
                      <div className="space-y-2">
                        {marcaPessoal.problemas_criticos_cv.map((p: any, i: number) => (
                          <div key={i} className="border border-red-200 rounded-xl overflow-hidden">
                            <button onClick={() => setExpandedProblema(expandedProblema === i ? null : i)}
                              className="w-full flex items-center justify-between p-4 hover:bg-red-50/30 transition-colors">
                              <div className="flex items-center gap-2 text-left">
                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                <div>
                                  <span className="font-medium text-slate-800 text-sm">{p.problema}</span>
                                  {p.descricao && <p className="text-xs text-slate-500 mt-0.5">{p.descricao}</p>}
                                </div>
                              </div>
                              {expandedProblema === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expandedProblema === i && (
                              <div className="px-4 pb-4 space-y-3 border-t border-red-100">
                                {p.explicacao_completa && <p className="text-xs text-slate-600 pt-3">{p.explicacao_completa}</p>}
                                {p.exemplo_correcao && (
                                  <div className="bg-green-50/50 border border-green-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-green-700 mb-1">{pick('Exemplo de correção', 'Correction example', 'Ejemplo de corrección')}:</p>
                                    <p className="text-xs text-slate-700">{p.exemplo_correcao}</p>
                                  </div>
                                )}
                                {p.reescrita_sugerida && (
                                  <div className="flex items-start justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                    <p className="text-xs text-slate-700 flex-1">{p.reescrita_sugerida}</p>
                                    <CopyBtn text={p.reescrita_sugerida} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ações LinkedIn prioritárias */}
                  {Array.isArray(marcaPessoal.acoes_linkedin_prioritarias) && marcaPessoal.acoes_linkedin_prioritarias.length > 0 && (
                    <div className="bg-blue-50/30 border border-blue-200 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-700 text-sm mb-3 flex items-center gap-1.5"><Linkedin className="w-4 h-4" /> {pick('Ações LinkedIn Prioritárias', 'Priority LinkedIn Actions', 'Acciones Prioritarias en LinkedIn')}</h4>
                      <ul className="space-y-2">
                        {marcaPessoal.acoes_linkedin_prioritarias.map((a: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-blue-600 font-bold shrink-0">{i + 1}.</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 8 — PRIMEIROS CARGOS ALVO ═══ */}
            {Array.isArray(cargosAlvo) && cargosAlvo.length > 0 && (
              <Section title={pick('Primeiros Cargos Alvo', 'First Target Roles', 'Primeros Puestos Objetivo')} subtitle={pick('Onde candidatar-te', 'Where to apply', 'Dónde postularte')} icon={Briefcase} defaultOpen={true} color="blue">
                <div className="space-y-3">
                  {cargosAlvo.map((cargo: any, i: number) => (
                    <div key={i} className={`border rounded-xl overflow-hidden transition-all ${expandedCargo === i ? 'border-blue-300 shadow-md' : 'border-slate-200'}`}>
                      <button onClick={() => setExpandedCargo(expandedCargo === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 hover:bg-blue-50/30 transition-colors">
                        <div className="flex items-center gap-3 text-left">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scoreBg(cargo.fit_percentagem || 0)}`}>
                            <span className={`text-lg font-bold ${scoreColor(cargo.fit_percentagem || 0, true)}`}>{cargo.fit_percentagem || 0}%</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-slate-900 text-sm">{cargo.titulo}</h5>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{cargo.tipo}</span>
                              {cargo.salary_range && <span className="text-xs text-emerald-600 font-medium">{typeof cargo.salary_range === 'object' ? `${cargo.salary_range.moeda || '€'}${cargo.salary_range.min || '?'}–${cargo.salary_range.max || '?'}/${cargo.salary_range.periodo || pick('mês', 'month', 'mes')}` : `€${cargo.salary_range}/${pick('mês', 'month', 'mes')}`}</span>}
                            </div>
                          </div>
                        </div>
                        {expandedCargo === i ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </button>
                      {expandedCargo === i && (
                        <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                          {cargo.porque_este_cargo && <p className="text-sm text-slate-700 pt-3">{cargo.porque_este_cargo}</p>}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Array.isArray(cargo.o_que_ja_tens) && (
                              <div className="bg-green-50/30 rounded-lg p-3">
                                <p className="text-xs font-semibold text-green-700 mb-2">✅ {pick('O que já tens', 'What you already have', 'Lo que ya tienes')}</p>
                                <ul className="space-y-1">{cargo.o_que_ja_tens.map((item: string, j: number) => (
                                  <li key={j} className="text-xs text-slate-600 flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />{item}</li>
                                ))}</ul>
                              </div>
                            )}
                            {Array.isArray(cargo.o_que_ainda_precisas) && (
                              <div className="bg-amber-50/30 rounded-lg p-3">
                                <p className="text-xs font-semibold text-amber-700 mb-2">⚠️ {pick('O que precisas', 'What you need', 'Lo que necesitas')}</p>
                                <ul className="space-y-1">{cargo.o_que_ainda_precisas.map((item: string, j: number) => (
                                  <li key={j} className="text-xs text-slate-600 flex items-start gap-1"><AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />{item}</li>
                                ))}</ul>
                              </div>
                            )}
                          </div>
                          {Array.isArray(cargo.empresas_onde_candidatar) && (
                            <div className="bg-blue-50/30 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> {pick('Empresas onde candidatar', 'Companies to apply to', 'Empresas donde postular')}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {cargo.empresas_onde_candidatar.map((e: string, j: number) => (
                                  <span key={j} className="px-2.5 py-1 bg-white border border-blue-200 text-slate-700 rounded-full text-xs">{e}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 9 — PLANO 90 DIAS ═══ */}
            {Object.keys(plano90).length > 1 && (
              <Section title={pick('Plano 90 Dias', '90-Day Plan', 'Plan de 90 Días')} subtitle={pick('Da análise à acção', 'From analysis to action', 'Del análisis a la acción')} icon={Calendar} defaultOpen={true} color="emerald">
                <div className="space-y-4">
                  {[
                    { key: 'semana_1_2', label: pick('Semanas 1-2', 'Weeks 1-2', 'Semanas 1-2'), color: 'emerald', icon: FileText },
                    { key: 'semana_3_4', label: pick('Semanas 3-4', 'Weeks 3-4', 'Semanas 3-4'), color: 'blue', icon: Search },
                    { key: 'mes_2', label: pick('Mês 2', 'Month 2', 'Mes 2'), color: 'purple', icon: Users },
                    { key: 'mes_3', label: pick('Mês 3', 'Month 3', 'Mes 3'), color: 'amber', icon: TrendingUp },
                  ].map(({ key, label, color: phaseColor, icon: PhaseIcon }) => {
                    const phase = (plano90 as any)[key];
                    if (!phase) return null;
                    return (
                      <div key={key} className={`rounded-xl p-4 border border-${phaseColor}-200 bg-${phaseColor}-50/30`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-8 h-8 rounded-lg bg-${phaseColor}-100 flex items-center justify-center`}>
                            <PhaseIcon className={`w-4 h-4 text-${phaseColor}-600`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">{label}</p>
                            <p className="font-semibold text-slate-900 text-sm">{phase.tema}</p>
                          </div>
                        </div>
                        <ul className="space-y-2">
                          {(phase.acoes || []).map((acao: string, j: number) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                              <div className="w-4 h-4 border-2 border-slate-300 rounded mt-0.5 shrink-0" />
                              {acao}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 10 — RECOMENDAÇÃO PRIORITÁRIA ═══ */}
            {recomendacaoPrioritaria && (
              <div className="bg-gradient-to-r from-[#f9f6ef] to-[#faf8f3] border-2 border-[#C9A961]/30 rounded-2xl p-6 md:p-8 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8963E] mb-3">
                  <Target className="w-4 h-4" /> {pick('Recomendação Prioritária', 'Priority Recommendation', 'Recomendación Prioritaria')}
                </div>
                <p className="text-base md:text-lg font-medium text-slate-800 leading-relaxed mb-6">{recomendacaoPrioritaria}</p>
                <div className="flex flex-wrap gap-3">
                  <a href={localePath('/cv-analyser')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
                    {pick('CV Analyser Pro', 'CV Analyser Pro', 'CV Analyser Pro')} <ArrowRight className="w-4 h-4" />
                  </a>
                  <a href={localePath('/career-path')} className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#C9A961] text-[#B8963E] text-sm font-semibold rounded-xl hover:bg-[#C9A961]/10 transition-colors">
                    {pick('Career Path', 'Career Path', 'Career Path')} <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <S2IFooter />
    </div>
  );
}
