/**
 * MemberArea — Hub central do membro
 * Tabs: Ferramentas · Análises · Vagas · Conteúdos
 * Free users → UpgradePage
 * Subscriber → tabs diferenciados por tier (essential/growth/pro)
 * Análises: última de cada tipo em destaque, restantes colapsáveis
 */
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useI18n, type Lang } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type MemberContent } from '@/lib/supabase';
import { Link, useLocation } from 'wouter';
import CareerProgress from '@/components/CareerProgress';
import CvMaker from '@/components/CvMaker';
import UpgradePage from './UpgradePage';
import VagasFeed from '@/components/VagasFeed';
import SavedJobsTracker from '@/components/SavedJobsTracker';
import MemberRotatingBanner from '@/components/MemberRotatingBanner';
import JobContacts from '@/components/JobContacts';
import AnalysisResultsFull from '@/components/AnalysisResults';
import AnalysisDetailRenderer from '@/components/AnalysisDetailRenderer';
import SalaryRealityCheck from '@/components/SalaryRealityCheck';
import ExtraAnalysisPaymentModal, { type ExtraAnalysisProduct } from '@/components/ExtraAnalysisPaymentModal';
import { transformGeminiResponse } from '@/lib/analysisTransformer';
import { countries } from '@/lib/countries';
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from 'sonner';
import {
  Loader2, Upload, FileText, BarChart3, Linkedin, Bot,
  Sparkles, Route, Lock, ExternalLink, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, Tag, ArrowRight, Globe, MapPin,
  Search, BookOpen, Play, Headphones, Mail, Megaphone, Briefcase,
  Clock, Trash2, RefreshCw, Compass, FileSearch, Wrench, Download, Send, Share2,
  Target, Layers, TrendingUp, Euro, CalendarClock,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || window.__SUPABASE_ANON_KEY__||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const HYPER_TASK_URL = `${SUPABASE_URL}/functions/v1/hyper-task`;

function getPlanTier(plan?: string): 'essential' | 'growth' | 'pro' {
  if (!plan) return 'essential';
  const p = plan.toLowerCase();
  if (p.includes('pro') || p === 'annual') return 'pro';
  if (p.includes('growth') || p === 'semiannual') return 'growth';
  return 'essential';
}

// ─── Tab System ─────────────────────────────────────────────────────────────
type TabId = 'tools' | 'analyses' | 'jobs' | 'content';

const TABS: { id: TabId; labelPt: string; labelEn: string; icon: typeof Wrench }[] = [
  { id: 'tools',    labelPt: 'Ferramentas',  labelEn: 'Tools',     icon: Wrench },
  { id: 'analyses', labelPt: 'Análises',     labelEn: 'Analyses',  icon: FileSearch },
  { id: 'jobs',     labelPt: 'Vagas',        labelEn: 'Jobs',      icon: Briefcase },
  { id: 'content',  labelPt: 'Conteúdos',    labelEn: 'Content',   icon: BookOpen },
];

// ─── Saved Analysis Types Config ────────────────────────────────────────────
type SavedAnalysis = {
  id: string;
  user_id: string;
  analysis_type: string;
  data: Record<string, any>;
  created_at: string;
};

const TOOL_CONFIG: Record<string, { label: string; icon: typeof FileSearch; color: string; bgColor: string; borderColor: string }> = {
  cv_analyser:         { label: 'CV Analyser',         icon: FileSearch, color: 'text-blue-600',    bgColor: 'bg-blue-50',    borderColor: 'border-blue-200' },
  linkedin_roaster:    { label: 'LinkedIn Roaster',    icon: Linkedin,   color: 'text-amber-600',   bgColor: 'bg-amber-50',   borderColor: 'border-amber-200' },
  career_path:         { label: 'Career Path',         icon: Compass,    color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  career_intelligence: { label: 'Career Intelligence', icon: BarChart3,  color: 'text-violet-600',  bgColor: 'bg-violet-50',  borderColor: 'border-violet-200' },
  career_energy:       { label: 'Career Energy Score', icon: Sparkles,   color: 'text-pink-600',    bgColor: 'bg-pink-50',    borderColor: 'border-pink-200' },
  salary_reality_check: {  label: 'Salary Reality Check',  icon: Euro,  color: 'text-amber-600',  bgColor: 'bg-amber-50',  borderColor: 'border-amber-200',},
};

// Weekly limits (combined CV Analyser + LinkedIn Roaster)
const WEEKLY_LIMITS: Record<string, number> = {
  essential: 1,
  growth: 5,
  pro: 999, // unlimited
};

const contentTypes = ['all', 'ebook', 'article', 'video', 'podcast'] as const;

// ─── Blog RSS Feed ───────────────────────────────────────────────────────────
const BLOG_ARTICLES = [
  { title: 'AI Career Path: Como a Inteligência Artificial Está a Transformar Carreiras', url: 'https://www.share2inspire.pt/blog/artigos/ai-career-path-vs-traditional-coaching', desc: 'A inteligência artificial está a redefinir o mercado de trabalho. Descobre como posicionar a tua carreira na era da IA.' },
  { title: 'Entrevista Presencial vs Remota: Guia Completo', url: 'https://www.share2inspire.pt/blog/artigos/entrevista-presencial-vs-remota', desc: 'Dicas práticas para te destacares tanto em entrevistas presenciais como remotas.' },
  { title: 'Como Vencer o Filtro ATS: Guia Definitivo', url: 'https://www.share2inspire.pt/blog/artigos/guia-superar-ats-curriculo', desc: '75% dos currículos são rejeitados automaticamente. Aprende a passar nos filtros ATS.' },
  { title: '7 Erros Fatais no CV que Estão a Sabotar a Tua Carreira', url: 'https://www.share2inspire.pt/blog/artigos/7-erros-cv-candidatos-rejeitados', desc: 'Os erros mais comuns que impedem o teu CV de chegar às mãos certas.' },
  { title: 'CV vs LinkedIn: Como Alinhar os Dois para Maximizar Oportunidades', url: 'https://www.share2inspire.pt/blog/artigos/cv-linkedin-importancia', desc: 'Estratégias para manter consistência entre o teu CV e perfil LinkedIn.' },
  { title: 'LinkedIn para Recrutadores: O Que Eles Realmente Procuram', url: 'https://www.share2inspire.pt/blog/artigos/melhorar-linkedin-pesquisas', desc: 'Descobre como os recrutadores usam o LinkedIn e otimiza o teu perfil.' },
  { title: 'Posicionamento Profissional: Como Destacar-te no Mercado', url: 'https://www.share2inspire.pt/blog/artigos/posicionamento-mercado', desc: 'Técnicas de posicionamento para te diferenciares da concorrência.' },
  { title: 'Como Negociar Salário: Guia Prático', url: 'https://www.share2inspire.pt/blog/artigos/como-negociar-salario-portugal', desc: 'Estratégias comprovadas para negociar o salário que mereces.' },
  { title: 'Big 4 Recrutamento: Como Entrar nas Maiores Consultoras', url: 'https://www.share2inspire.pt/blog/artigos/recrutamento-big4-guia-candidatos', desc: 'O guia completo para entrares nas Big 4: Deloitte, PwC, EY e KPMG.' },
  { title: 'Big 4 por Dentro: A Realidade de Trabalhar nas Maiores Consultoras', url: 'https://www.share2inspire.pt/blog/artigos/big4-insider-10-anos', desc: 'Salários, cultura, progressão e a verdade sobre trabalhar nas Big 4.' },
];

// ─── Analysis Result Display ─────────────────────────────────────────────────
function AnalysisResult({ data, onClose, lang }: { data: any; onClose: () => void; lang: Lang }) {
  // Normalize: try multiple paths to find the actual analysis payload
  const raw = data?.analysis || data;
  if (!raw) return null;

  // Deep-normalize score field (overallScore, overall_score, ats_score, atsScore, score)
  const normalizeScore = (obj: any): number | undefined => {
    if (!obj) return undefined;
    for (const k of ['score', 'overallScore', 'overall_score', 'ats_score', 'atsScore']) {
      if (typeof obj[k] === 'number') return obj[k];
    }
    if (obj.analysis) return normalizeScore(obj.analysis);
    return undefined;
  };

  // Deep-normalize arrays (keywords, strengths, improvements, recommendations)
  const normalizeArray = (obj: any, ...keys: string[]): string[] => {
    if (!obj) return [];
    for (const k of keys) {
      if (Array.isArray(obj[k]) && obj[k].length > 0) return obj[k].map((v: any) => typeof v === 'string' ? v : (v?.text || v?.title || v?.description || JSON.stringify(v)));
    }
    if (obj.analysis) return normalizeArray(obj.analysis, ...keys);
    return [];
  };

  const normalizeString = (obj: any, ...keys: string[]): string | undefined => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (typeof obj[k] === 'string' && obj[k].trim()) return obj[k];
    }
    if (obj.analysis) return normalizeString(obj.analysis, ...keys);
    return undefined;
  };

  const analysis = raw;
  // _toolType = 'career_intelligence' is set explicitly by runCareerIntelligence — never treat CI results as Career Path.
  // Also exclude market_analysis from detection since Career Intelligence responses contain that field.
  const isCareerIntelligence = !!(data?._toolType === 'career_intelligence' || analysis?._toolType === 'career_intelligence');
  const isCareerPath = !isCareerIntelligence && !!(data?.career_paths || analysis?.career_paths || analysis?.career_path || data?.career_path);
  const cpData = isCareerPath ? (data?.career_path || analysis?.career_path || data?.career_paths ? data : analysis) : null;
  const isLinkedInFormat = analysis?.candidate_profile || data?.candidate_profile;
  const linkedinData = isLinkedInFormat ? (data?.candidate_profile ? data : analysis) : null;
  // Detect linkedin_roast format (teaser + analise_completa)
  const isLinkedInRoast = !!(analysis?.teaser || analysis?.analise_completa || data?.teaser || data?.analise_completa);
  const roastData = isLinkedInRoast ? (analysis?.teaser ? analysis : data) : null;

  // Normalized fields for standard/fallback rendering
  const nScore = normalizeScore(analysis);
  const nSummary = normalizeString(analysis, 'summary', 'executive_summary', 'resumo');
  const nKeywords = normalizeArray(analysis, 'keywords', 'key_skills', 'skills', 'tags');
  const nStrengths = normalizeArray(analysis, 'strengths', 'pontos_fortes');
  const nImprovements = normalizeArray(analysis, 'improvements', 'areas_to_improve', 'gaps', 'melhorias');
  const nRecommendations = normalizeArray(analysis, 'recommendations', 'recomendacoes', 'suggestions');

  return (
    <div className="mt-4 border border-gold/20 rounded-lg bg-[#fafaf9] p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-semibold text-[#1a1a1a]">
            {t('member.cv.analysisComplete')}
          </h4>
        </div>
        <button onClick={onClose} className="text-xs text-[#999] hover:text-[#1a1a1a] transition-colors">
          {t('member.lib.close')}
        </button>
      </div>

      {/* Career Path / Career Intelligence */}
      {cpData && (() => {
        const cp = cpData.career_path || cpData;
        const name = cpData.name || cpData.candidate_name || '';
        const currentRole = cpData.current_role || '';
        return (
          <div className="space-y-5">
            {/* Header with name and role */}
            {(name || currentRole) && (
              <div className="flex items-center gap-3 pb-3 border-b border-[#e5e5e5]">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center"><span className="text-sm font-bold text-emerald-700">{name.charAt(0) || '?'}</span></div>
                <div>
                  {name && <p className="text-sm font-semibold text-[#1a1a1a]">{name}</p>}
                  {currentRole && <p className="text-xs text-[#666]">{currentRole}</p>}
                </div>
              </div>
            )}

            {/* Market Context (Career Intelligence) */}
            {cp.market_context && (
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center shrink-0"><Globe className="w-4 h-4 text-gold" /></div>
                  <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider">{t('member.result.marketContext')}</h5>
                </div>
                {cp.market_context.aligned_companies && (
                  <div className="p-3 bg-[#fafaf9] rounded border border-[#eee]">
                    <p className="text-[10px] font-semibold text-gold mb-2">{t('member.result.alignedCompanies')}</p>
                    {typeof cp.market_context.aligned_companies === 'object' && !Array.isArray(cp.market_context.aligned_companies) ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(cp.market_context.aligned_companies).filter(([key]) => key !== 'aligned_companies_note').map(([sector, companies]: [string, any]) => (
                          <div key={sector} className="space-y-1">
                            <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider">{sector}</p>
                            <ul className="space-y-0.5">{(Array.isArray(companies) ? companies : [companies]).map((c: string, idx: number) => (<li key={idx} className="text-xs text-[#666] flex items-start gap-1"><span className="text-gold mt-0.5 shrink-0">•</span><span>{c}</span></li>))}</ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#666]">{typeof cp.market_context.aligned_companies === 'string' ? cp.market_context.aligned_companies : JSON.stringify(cp.market_context.aligned_companies)}</p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cp.market_context.demand_level && (
                    <div className="p-3 bg-[#fafaf9] rounded border border-[#eee]"><p className="text-[10px] font-semibold text-gold mb-1">{t('member.result.demandLevel')}</p><p className="text-xs text-[#666]">{cp.market_context.demand_level}</p></div>
                  )}
                  {cp.market_context.competitiveness && (
                    <div className="p-3 bg-[#fafaf9] rounded border border-[#eee]"><p className="text-[10px] font-semibold text-gold mb-1">{t('member.result.competitiveness')}</p><p className="text-xs text-[#666]">{cp.market_context.competitiveness}</p></div>
                  )}
                </div>
                {cp.market_context.differentiator && (
                  <div className="p-3 bg-gold/5 rounded border border-gold/20"><p className="text-[10px] font-semibold text-gold mb-1">{t('member.result.whatSetYouApart')}</p><p className="text-xs text-[#666]">{cp.market_context.differentiator}</p></div>
                )}
              </div>
            )}

            {/* Current Positioning */}
            {cp.current_positioning && (
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-lg space-y-3">
                <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider">{t('member.result.currentPositioning')}</h5>
                <div className="grid grid-cols-2 gap-2">
                  {cp.current_positioning.seniority_level && (
                    <div className="p-2 bg-[#fafaf9] rounded"><p className="text-[10px] text-[#999] uppercase">{t('member.result.seniorityLevel')}</p><p className="text-xs font-medium text-[#1a1a1a]">{cp.current_positioning.seniority_level}</p></div>
                  )}
                  {cp.current_positioning.primary_domain && (
                    <div className="p-2 bg-[#fafaf9] rounded"><p className="text-[10px] text-[#999] uppercase">{lang === 'pt' ? 'Domínio Principal' : lang === 'es' ? 'Dominio Principal' : 'Primary Domain'}</p><p className="text-xs font-medium text-[#1a1a1a]">{cp.current_positioning.primary_domain}</p></div>
                  )}
                </div>
                {cp.current_positioning.seniority_justification && <p className="text-xs text-[#666] leading-relaxed">{cp.current_positioning.seniority_justification}</p>}
                {cp.current_positioning.market_value_assessment && (
                  <div className="p-2 bg-emerald-50 border border-emerald-100 rounded"><p className="text-[10px] text-emerald-700 uppercase font-medium mb-1">{lang === 'pt' ? 'Valor de Mercado' : lang === 'es' ? 'Valor de Mercado' : 'Market Value'}</p><p className="text-xs text-emerald-800 leading-relaxed">{cp.current_positioning.market_value_assessment}</p></div>
                )}
                {cp.current_positioning.competitive_advantages && Array.isArray(cp.current_positioning.competitive_advantages) && cp.current_positioning.competitive_advantages.length > 0 && (
                  <div><p className="text-[10px] text-emerald-700 uppercase font-medium mb-1">{lang === 'pt' ? 'Vantagens Competitivas' : lang === 'es' ? 'Ventajas Competitivas' : 'Competitive Advantages'}</p><ul className="space-y-1">{cp.current_positioning.competitive_advantages.map((a: string, i: number) => (<li key={i} className="text-xs text-[#333] flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">+</span><span>{a}</span></li>))}</ul></div>
                )}
                {cp.current_positioning.blind_spots && Array.isArray(cp.current_positioning.blind_spots) && cp.current_positioning.blind_spots.length > 0 && (
                  <div><p className="text-[10px] text-amber-700 uppercase font-medium mb-1">{lang === 'pt' ? 'Pontos Cegos' : lang === 'es' ? 'Puntos Ciegos' : 'Blind Spots'}</p><ul className="space-y-1">{cp.current_positioning.blind_spots.map((b: string, i: number) => (<li key={i} className="text-xs text-[#333] flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">!</span><span>{b}</span></li>))}</ul></div>
                )}
              </div>
            )}

            {/* CV-LinkedIn Cross Analysis */}
            {cp.cv_linkedin_cross_analysis && (
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-lg space-y-2">
                <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider">{lang === 'pt' ? 'Análise Cruzada CV-LinkedIn' : lang === 'es' ? 'Análisis Cruzado CV-LinkedIn' : 'CV-LinkedIn Cross Analysis'}</h5>
                {cp.cv_linkedin_cross_analysis.consistency_score && (
                  <div className="flex items-center gap-2"><span className="text-xs text-[#999]">{lang === 'pt' ? 'Consistência:' : lang === 'es' ? 'Consistencia:' : 'Consistency:'}</span><span className={`text-xs font-semibold ${cp.cv_linkedin_cross_analysis.consistency_score === 'High' ? 'text-emerald-600' : cp.cv_linkedin_cross_analysis.consistency_score === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>{cp.cv_linkedin_cross_analysis.consistency_score}</span></div>
                )}
                {cp.cv_linkedin_cross_analysis.optimization_suggestions && Array.isArray(cp.cv_linkedin_cross_analysis.optimization_suggestions) && (
                  <ul className="space-y-1">{cp.cv_linkedin_cross_analysis.optimization_suggestions.map((s: string, i: number) => (<li key={i} className="text-xs text-[#333] flex items-start gap-1.5"><span className="text-blue-500 mt-0.5">→</span><span>{s}</span></li>))}</ul>
                )}
              </div>
            )}

            {/* Next Roles */}
            {cp.next_roles && Array.isArray(cp.next_roles) && cp.next_roles.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3">{lang === 'pt' ? 'Próximos Papéis Sugeridos' : lang === 'es' ? 'Próximos Roles Sugeridos' : 'Suggested Next Roles'}</h5>
                <div className="space-y-3">
                  {cp.next_roles.map((role: any, i: number) => (
                    <div key={i} className="p-3 bg-white border border-[#e5e5e5] rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h6 className="text-sm font-medium text-[#1a1a1a]">{role.role_title}</h6>
                        {role.fit_percentage && <span className="text-xs font-bold text-gold">{role.fit_percentage}% fit</span>}
                      </div>
                      {role.timeline && <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mb-2 ${role.timeline.includes('Short') || role.timeline.includes('Curto') ? 'bg-emerald-50 text-emerald-700' : role.timeline.includes('Medium') || role.timeline.includes('Médio') ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{role.timeline}</span>}
                      {role.why_this_role && <p className="text-xs text-[#666] leading-relaxed mb-2">{role.why_this_role}</p>}
                      {role.salary_range && <p className="text-xs text-gold font-medium">{role.salary_range}</p>}
                      {role.typical_companies && Array.isArray(role.typical_companies) && (
                        <div className="mt-2 flex flex-wrap gap-1">{role.typical_companies.map((c: string, j: number) => (<span key={j} className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[10px] text-[#666]">{c}</span>))}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Paths (Career Intelligence format with success_probability/logic/ideal_for) */}
            {cp.strategic_paths && Array.isArray(cp.strategic_paths) && cp.strategic_paths.length > 0 && (
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center shrink-0"><Compass className="w-4 h-4 text-gold" /></div>
                  <div>
                    <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider">{lang === 'pt' ? 'Caminhos Estratégicos de Carreira' : lang === 'es' ? 'Caminos Estratégicos de Carrera' : 'Strategic Career Paths'}</h5>
                    <p className="text-[10px] text-[#999] mt-0.5">{lang === 'pt' ? 'Caminhos distintos baseados no teu perfil' : lang === 'es' ? 'Caminos distintos basados en tu perfil' : 'Distinct paths based on your profile'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {cp.strategic_paths.map((path: any, i: number) => (
                    <div key={i} className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                      <div className="p-3 bg-[#fafaf9] flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded">{lang === 'pt' ? 'CAMINHO' : lang === 'es' ? 'CAMINO' : 'PATH'} {i + 1}</span>
                          <span className="text-sm font-semibold text-[#1a1a1a]">{path.path_name || path.name}</span>
                        </div>
                        {path.success_probability && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{path.success_probability}% {lang === 'pt' ? 'sucesso' : lang === 'es' ? 'éxito' : 'success'}</span>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        {path.logic && <p className="text-xs text-[#666] leading-relaxed">{path.logic}</p>}
                        {path.description && !path.logic && <p className="text-xs text-[#666] leading-relaxed">{path.description}</p>}
                        {path.ideal_for && (
                          <div className="p-2 bg-[#fafaf9] rounded border border-[#eee]"><p className="text-[10px] font-semibold text-gold mb-1">{lang === 'pt' ? 'IDEAL PARA' : lang === 'es' ? 'IDEAL PARA' : 'IDEAL FOR'}</p><p className="text-xs text-[#666]">{path.ideal_for}</p></div>
                        )}
                        {path.associated_roles && Array.isArray(path.associated_roles) && path.associated_roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">{path.associated_roles.map((role: string, j: number) => (<span key={j} className="text-[10px] bg-[#f5f5f4] px-2 py-0.5 rounded text-[#666] border border-[#e5e5e5]">{role}</span>))}</div>
                        )}
                        {path.target_roles && Array.isArray(path.target_roles) && !path.associated_roles && (
                          <div className="flex flex-wrap gap-1 mt-1">{path.target_roles.map((r: string, j: number) => (<span key={j} className="px-2 py-0.5 bg-violet-50 border border-violet-100 rounded text-[10px] text-violet-700">{r}</span>))}</div>
                        )}
                        {path.required_skills && Array.isArray(path.required_skills) && (
                          <div className="flex flex-wrap gap-1 mt-2">{path.required_skills.map((s: string, j: number) => (<span key={j} className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700">{s}</span>))}</div>
                        )}
                        {path.timeline && <p className="text-[10px] text-[#999] mt-2">{path.timeline}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Development Plan */}
            {cp.development_plan && (
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-lg space-y-3">
                <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider">{lang === 'pt' ? 'Plano de Desenvolvimento' : lang === 'es' ? 'Plan de Desarrollo' : 'Development Plan'}</h5>
                {cp.development_plan.immediate_actions && Array.isArray(cp.development_plan.immediate_actions) && (
                  <div><p className="text-[10px] text-emerald-700 uppercase font-medium mb-1">{lang === 'pt' ? 'Ações Imediatas (0-3 meses)' : lang === 'es' ? 'Acciones Inmediatas (0-3 meses)' : 'Immediate Actions (0-3 months)'}</p><ul className="space-y-1">{cp.development_plan.immediate_actions.map((a: any, i: number) => (<li key={i} className="text-xs text-[#333] flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">→</span><span>{typeof a === 'string' ? a : a.action || a.description || JSON.stringify(a)}</span></li>))}</ul></div>
                )}
                {cp.development_plan.medium_term_goals && Array.isArray(cp.development_plan.medium_term_goals) && (
                  <div><p className="text-[10px] text-amber-700 uppercase font-medium mb-1">{lang === 'pt' ? 'Objetivos Médio Prazo (3-12 meses)' : lang === 'es' ? 'Objetivos a Medio Plazo (3-12 meses)' : 'Medium-term Goals (3-12 months)'}</p><ul className="space-y-1">{cp.development_plan.medium_term_goals.map((g: any, i: number) => (<li key={i} className="text-xs text-[#333] flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">→</span><span>{typeof g === 'string' ? g : g.goal || g.description || JSON.stringify(g)}</span></li>))}</ul></div>
                )}
                {cp.development_plan.long_term_vision && (
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded"><p className="text-[10px] text-blue-700 uppercase font-medium mb-1">{lang === 'pt' ? 'Visão de Longo Prazo' : lang === 'es' ? 'Visión a Largo Plazo' : 'Long-term Vision'}</p><p className="text-xs text-blue-800 leading-relaxed">{typeof cp.development_plan.long_term_vision === 'string' ? cp.development_plan.long_term_vision : JSON.stringify(cp.development_plan.long_term_vision)}</p></div>
                )}
              </div>
            )}

            {/* Action Plan by Path (Career Intelligence) */}
            {cp.action_plan_by_path && Array.isArray(cp.action_plan_by_path) && cp.action_plan_by_path.length > 0 && (
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center shrink-0"><Target className="w-4 h-4 text-gold" /></div>
                  <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider">{lang === 'pt' ? 'Plano de Acção por Caminho' : lang === 'es' ? 'Plan de Acción por Camino' : 'Action Plan by Path'}</h5>
                </div>
                <div className="space-y-3">
                  {cp.action_plan_by_path.map((plan: any, i: number) => (
                    <div key={i} className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                      <div className="p-3 bg-[#fafaf9] flex items-center gap-2">
                        <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded">{lang === 'pt' ? 'CAMINHO' : lang === 'es' ? 'CAMINO' : 'PATH'} {i + 1}</span>
                        <span className="text-sm font-semibold text-[#1a1a1a]">{plan.path_name}</span>
                        {plan.is_recommended && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{lang === 'pt' ? 'Recomendado' : lang === 'es' ? 'Recomendado' : 'Recommended'}</span>}
                      </div>
                      <div className="p-3 space-y-2">
                        {plan.actions && Array.isArray(plan.actions) && plan.actions.map((action: any, j: number) => (
                          <div key={j} className="flex items-start gap-3 p-2 border border-[#eee] rounded-lg">
                            <span className="text-[10px] font-bold text-white bg-gold px-1.5 py-0.5 rounded shrink-0 mt-0.5">{action.timeframe}</span>
                            <div>
                              <p className="text-xs font-semibold text-[#1a1a1a]">{action.action}</p>
                              {action.is_critical === true && <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{lang === 'pt' ? 'Passo-chave' : lang === 'es' ? 'Paso clave' : 'Key step'}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strategic Comparison (table format) */}
            {cp.strategic_comparison && Array.isArray(cp.strategic_comparison) && cp.strategic_comparison.length > 0 && (
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center shrink-0"><BarChart3 className="w-4 h-4 text-gold" /></div>
                  <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider">{lang === 'pt' ? 'Comparação Estratégica' : lang === 'es' ? 'Comparación Estratégica' : 'Strategic Comparison'}</h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#e5e5e5]">
                        <th className="text-left py-2 pr-3 font-semibold text-[#999]">{lang === 'pt' ? 'Critério' : lang === 'es' ? 'Criterio' : 'Criteria'}</th>
                        {cp.strategic_comparison.map((item: any, i: number) => (<th key={i} className="text-center py-2 px-2 font-semibold text-[#1a1a1a]">{item.path_name}</th>))}
                      </tr>
                    </thead>
                    <tbody>
                      {[{ key: 'success_probability', label: lang === 'pt' ? 'Probabilidade de sucesso' : lang === 'es' ? 'Probabilidad de éxito' : 'Success probability', suffix: '%' }, { key: 'estimated_time', label: lang === 'pt' ? 'Tempo estimado' : lang === 'es' ? 'Tiempo estimado' : 'Estimated time', suffix: '' }, { key: 'effort_level', label: lang === 'pt' ? 'Esforço' : lang === 'es' ? 'Esfuerzo' : 'Effort', suffix: '' }, { key: 'risk_level', label: lang === 'pt' ? 'Risco' : lang === 'es' ? 'Riesgo' : 'Risk', suffix: '' }, { key: 'salary_impact', label: lang === 'pt' ? 'Impacto salarial' : lang === 'es' ? 'Impacto salarial' : 'Salary impact', suffix: '' }, { key: 'profile_fit', label: lang === 'pt' ? 'Alinhamento' : lang === 'es' ? 'Alineamiento' : 'Profile fit', suffix: '' }].filter(row => cp.strategic_comparison.some((item: any) => item[row.key])).map((row) => (
                        <tr key={row.key} className="border-b border-[#eee]">
                          <td className="py-2 pr-3 text-[#666] font-medium">{row.label}</td>
                          {cp.strategic_comparison.map((item: any, i: number) => (<td key={i} className="text-center py-2 px-2 text-[#1a1a1a]">{item[row.key]}{row.suffix}</td>))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Fallback: pros/cons format */}
                {cp.strategic_comparison[0]?.pros && (
                  <div className="space-y-2 mt-3">
                    {cp.strategic_comparison.map((comp: any, i: number) => (
                      <div key={i} className="p-3 bg-[#fafaf9] rounded border border-[#eee]">
                        <h6 className="text-xs font-medium text-[#1a1a1a] mb-1">{comp.path_name}</h6>
                        {comp.pros && Array.isArray(comp.pros) && <div className="mb-1"><span className="text-[10px] text-emerald-700 font-medium">Pros:</span> <span className="text-xs text-[#666]">{comp.pros.join(', ')}</span></div>}
                        {comp.cons && Array.isArray(comp.cons) && <div><span className="text-[10px] text-red-700 font-medium">Cons:</span> <span className="text-xs text-[#666]">{comp.cons.join(', ')}</span></div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trade-offs (Career Intelligence) */}
            {cp.tradeoffs && Array.isArray(cp.tradeoffs) && cp.tradeoffs.length > 0 && (
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center shrink-0"><Layers className="w-4 h-4 text-gold" /></div>
                  <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider">{lang === 'pt' ? 'Trade-offs por Caminho' : lang === 'es' ? 'Trade-offs por Camino' : 'Trade-offs by Path'}</h5>
                </div>
                <div className="space-y-3">
                  {cp.tradeoffs.map((t: any, i: number) => (
                    <div key={i} className="border border-[#e5e5e5] rounded-lg p-3 space-y-3">
                      <p className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-2">
                        <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded">{i + 1}</span>
                        {t.path_name}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                          <p className="text-[10px] font-semibold text-emerald-600 mb-1">{lang === 'pt' ? 'GANHAS' : lang === 'es' ? 'GANAS' : 'YOU GAIN'}</p>
                          <p className="text-xs text-[#666]">{t.you_gain}</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-[10px] font-semibold text-red-500 mb-1">{lang === 'pt' ? 'ABDICAS' : lang === 'es' ? 'CEDES' : 'YOU GIVE UP'}</p>
                          <p className="text-xs text-[#666]">{t.you_give_up}</p>
                        </div>
                      </div>
                      {t.hidden_risk && (
                        <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-[10px] font-semibold text-amber-600 mb-1">{lang === 'pt' ? 'RISCO OCULTO' : lang === 'es' ? 'RIESGO OCULTO' : 'HIDDEN RISK'}</p>
                          <p className="text-xs text-[#666]">{t.hidden_risk}</p>
                        </div>
                      )}
                      {t.real_scenario && (
                        <div className="p-2 bg-[#fafaf9] rounded-lg border border-[#eee]">
                          <p className="text-[10px] font-semibold text-[#999] mb-1">{lang === 'pt' ? 'CENÁRIO REAL' : lang === 'es' ? 'ESCENARIO REAL' : 'REAL SCENARIO'}</p>
                          <p className="text-xs text-[#666]">{t.real_scenario}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Recommendation */}
            {cp.decision_recommendation && (
              <div className="p-4 bg-gold/5 border-2 border-gold/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-gold/30 bg-gold/10 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-gold" /></div>
                  <h5 className="text-xs font-semibold text-gold uppercase tracking-wider">{lang === 'pt' ? 'Decisão Recomendada' : lang === 'es' ? 'Decisión Recomendada' : 'Recommended Decision'}</h5>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#e5e5e5]">
                  {cp.decision_recommendation.recommended_path && <p className="text-sm font-bold text-[#1a1a1a] mb-2">{cp.decision_recommendation.recommended_path}</p>}
                  {cp.decision_recommendation.justification && <p className="text-xs text-[#666] leading-relaxed">{cp.decision_recommendation.justification}</p>}
                </div>
                {cp.decision_recommendation.when_to_switch && (
                  <div className="p-3 bg-white rounded-lg border border-[#e5e5e5]">
                    <p className="text-[10px] font-semibold text-amber-600 mb-1">{lang === 'pt' ? 'QUANDO CONSIDERAR OUTRO CAMINHO' : lang === 'es' ? 'CUÁNDO CONSIDERAR OTRO CAMINO' : 'WHEN TO CONSIDER ANOTHER PATH'}</p>
                    <p className="text-xs text-[#666]">{cp.decision_recommendation.when_to_switch}</p>
                  </div>
                )}
                {cp.decision_recommendation.why_better_than_others && (
                  <div className="p-3 bg-white rounded-lg border border-[#e5e5e5]">
                    <p className="text-[10px] font-semibold text-emerald-600 mb-1">{lang === 'pt' ? 'PORQUE ESTE CAMINHO É O MELHOR PARA TI' : lang === 'es' ? 'POR QUÉ ESTE CAMINO ES EL MEJOR PARA TI' : 'WHY THIS PATH IS BEST FOR YOU'}</p>
                    <p className="text-xs text-[#666]">{cp.decision_recommendation.why_better_than_others}</p>
                  </div>
                )}
              </div>
            )}

            {/* Career Potential Score */}
            {cp.career_potential_score && (
              <div className="p-4 bg-white border border-[#e5e5e5] rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-gold" /></div>
                  <h5 className="text-xs font-semibold text-[#666] uppercase tracking-wider">{lang === 'pt' ? 'Score de Potencial de Carreira' : lang === 'es' ? 'Puntuación de Potencial de Carrera' : 'Career Potential Score'}</h5>
                </div>
                {typeof cp.career_potential_score === 'object' ? (
                  <div className="space-y-2">
                    {Object.entries(cp.career_potential_score).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-[#fafaf9] rounded border border-[#eee]">
                        <span className="text-xs text-[#666] capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-semibold text-[#1a1a1a]">{typeof val === 'number' ? `${val}/100` : String(val)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#666]">{String(cp.career_potential_score)}</p>
                )}
              </div>
            )}

            {/* Fallback: render any remaining fields */}
            {!cp.current_positioning && !cp.next_roles && !cp.strategic_paths && (
              <div className="space-y-3">
                {Object.entries(cp).filter(([k]) => !['success', 'mode', 'name', 'candidate_name', 'current_role'].includes(k)).map(([key, val]) => {
                  if (typeof val === 'string' && val.trim()) return (<div key={key} className="mb-2"><h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</h5><p className="text-sm text-[#333] leading-relaxed">{val}</p></div>);
                  if (typeof val === 'object' && val !== null) return (<div key={key} className="mb-2"><h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</h5><pre className="text-xs text-[#666] whitespace-pre-wrap bg-[#fafaf9] p-2 rounded border border-[#eee]">{JSON.stringify(val, null, 2)}</pre></div>);
                  return null;
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* LinkedIn Roast (new format: teaser + analise_completa) */}
      {roastData && !cpData && (
        <div className="space-y-4">
          {/* Score + Hook */}
          {roastData.teaser && (
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full border-2 border-gold/30 flex items-center justify-center bg-gold/5">
                <span className="text-lg font-bold text-gold">{roastData.teaser.nota_geral}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#999] uppercase tracking-wider mb-0.5">{lang === 'pt' ? 'Nota Global' : lang === 'es' ? 'Nota Global' : 'Overall Score'}</p>
                <p className="text-sm text-[#333] leading-relaxed">{roastData.teaser.hook_vendas}</p>
              </div>
            </div>
          )}
          {/* Executive Summary */}
          {roastData.analise_completa?.sumario_executivo && (
            <div className="p-3 bg-white border border-[#e5e5e5] rounded-lg">
              <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">{lang === 'pt' ? 'Sumário Executivo' : lang === 'es' ? 'Resumen Ejecutivo' : 'Executive Summary'}</h5>
              <p className="text-sm text-[#333] leading-relaxed">{roastData.analise_completa.sumario_executivo}</p>
            </div>
          )}
          {/* Algorithm Visibility */}
          {roastData.analise_completa?.visibilidade_algoritmo && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded">
              <span className="text-xs font-medium text-blue-700">{lang === 'pt' ? 'Visibilidade no Algoritmo:' : lang === 'es' ? 'Visibilidad en el Algoritmo:' : 'Algorithm Visibility:'}</span>
              <span className="text-xs text-blue-800 font-semibold">{roastData.analise_completa.visibilidade_algoritmo}</span>
            </div>
          )}
          {/* Dimensions */}
          {roastData.analise_completa?.dimensoes && (
            <div>
              <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-3">{lang === 'pt' ? 'Avaliação por Dimensão' : lang === 'es' ? 'Evaluación por Dimensión' : 'Dimension Assessment'}</h5>
              <div className="space-y-2">
                {Object.entries(roastData.analise_completa.dimensoes).map(([key, dim]: [string, any]) => (
                  <div key={key} className="p-3 bg-white border border-[#e5e5e5] rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[#1a1a1a] capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className={`text-xs font-bold ${dim.score >= 7 ? 'text-emerald-600' : dim.score >= 5 ? 'text-amber-600' : 'text-red-600'}`}>{dim.score}/10</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full mb-2"><div className={`h-full rounded-full ${dim.score >= 7 ? 'bg-emerald-500' : dim.score >= 5 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${dim.score * 10}%` }} /></div>
                    <p className="text-xs text-[#666] leading-relaxed">{dim.analise}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Strengths */}
          {roastData.analise_completa?.pontos_fortes && roastData.analise_completa.pontos_fortes.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Pontos Fortes' : lang === 'es' ? 'Puntos Fuertes' : 'Strengths'}</h5>
              <ul className="space-y-1">{roastData.analise_completa.pontos_fortes.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-emerald-500 mt-0.5">+</span><span>{s}</span></li>))}</ul>
            </div>
          )}
          {/* Areas to Improve */}
          {roastData.analise_completa?.areas_melhoria && roastData.analise_completa.areas_melhoria.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-3">{lang === 'pt' ? 'Áreas de Melhoria' : lang === 'es' ? 'Áreas de Mejora' : 'Areas to Improve'}</h5>
              <div className="space-y-3">
                {roastData.analise_completa.areas_melhoria.map((item: any, i: number) => (
                  <div key={i} className="p-3 bg-white border border-[#e5e5e5] rounded-lg">
                    <h6 className="text-sm font-medium text-[#1a1a1a] mb-1">{item.area}</h6>
                    <p className="text-xs text-[#666] leading-relaxed mb-2">{item.diagnostico}</p>
                    <div className="p-2 bg-emerald-50 border border-emerald-100 rounded">
                      <p className="text-[10px] text-emerald-700 uppercase font-medium mb-1">{lang === 'pt' ? 'Recomendação' : lang === 'es' ? 'Recomendación' : 'Recommendation'}</p>
                      <p className="text-xs text-emerald-800 leading-relaxed">{item.recomendacao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Suggested Headlines */}
          {roastData.analise_completa?.headlines_sugeridas && roastData.analise_completa.headlines_sugeridas.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-violet-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Headlines Sugeridas' : lang === 'es' ? 'Titulares Sugeridos' : 'Suggested Headlines'}</h5>
              <div className="space-y-1.5">
                {roastData.analise_completa.headlines_sugeridas.map((h: string, i: number) => (
                  <div key={i} className="p-2 bg-violet-50 border border-violet-100 rounded text-xs text-violet-800">"{h}"</div>
                ))}
              </div>
            </div>
          )}
          {/* SEO Keywords */}
          {roastData.analise_completa?.dicas_seo && roastData.analise_completa.dicas_seo.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Palavras-chave SEO' : lang === 'es' ? 'Palabras clave SEO' : 'SEO Keywords'}</h5>
              <div className="flex flex-wrap gap-1.5">
                {roastData.analise_completa.dicas_seo.map((kw: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-[11px] text-blue-700 font-medium">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {/* Education Analysis */}
          {roastData.analise_completa?.analise_formacao && (
            <div className="p-3 bg-white border border-[#e5e5e5] rounded-lg">
              <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">{lang === 'pt' ? 'Análise de Formação' : lang === 'es' ? 'Análisis de Formación' : 'Education Analysis'}</h5>
              <p className="text-sm text-[#333] leading-relaxed">{roastData.analise_completa.analise_formacao}</p>
            </div>
          )}
          {/* Network Analysis */}
          {roastData.analise_completa?.analise_rede && (
            <div className="p-3 bg-white border border-[#e5e5e5] rounded-lg">
              <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">{lang === 'pt' ? 'Análise de Rede' : lang === 'es' ? 'Análisis de Red' : 'Network Analysis'}</h5>
              <p className="text-sm text-[#333] leading-relaxed">{roastData.analise_completa.analise_rede}</p>
            </div>
          )}
          {/* Priority Recommendation */}
          {roastData.analise_completa?.recomendacao_prioritaria && (
            <div className="p-3 bg-gold/5 border border-gold/20 rounded-lg">
              <h5 className="text-xs font-medium text-gold uppercase tracking-wider mb-2">{lang === 'pt' ? 'Recomendação Prioritária' : lang === 'es' ? 'Recomendación Prioritaria' : 'Priority Recommendation'}</h5>
              <p className="text-sm text-[#333] leading-relaxed font-medium">{roastData.analise_completa.recomendacao_prioritaria}</p>
            </div>
          )}
        </div>
      )}

      {/* LinkedIn Roaster (legacy format: candidate_profile) */}
      {linkedinData && !cpData && !roastData && (
        <div className="space-y-4">
          {linkedinData.executive_summary?.global_score && (
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-gold/30 flex items-center justify-center">
                <span className="text-lg font-bold text-gold">{linkedinData.executive_summary.global_score}</span>
              </div>
              <div>
                <p className="text-xs text-[#999]">{lang === 'pt' ? 'Pontuação global' : lang === 'es' ? 'Puntuación global' : 'Overall score'}</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{linkedinData.executive_summary.global_score}/100</p>
              </div>
            </div>
          )}
          {linkedinData.candidate_profile && (
            <div>
              <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">{lang === 'pt' ? 'Perfil Detetado' : lang === 'es' ? 'Perfil Detectado' : 'Detected Profile'}</h5>
              <div className="grid grid-cols-2 gap-2">
                {linkedinData.candidate_profile.detected_name && linkedinData.candidate_profile.detected_name !== 'N/A' && (
                  <div className="p-2 bg-white border border-[#e5e5e5] rounded"><p className="text-[10px] text-[#999] uppercase">{lang === 'pt' ? 'Nome' : lang === 'es' ? 'Nombre' : 'Name'}</p><p className="text-xs font-medium text-[#1a1a1a]">{linkedinData.candidate_profile.detected_name}</p></div>
                )}
                {linkedinData.candidate_profile.detected_role && linkedinData.candidate_profile.detected_role !== 'N/A' && (
                  <div className="p-2 bg-white border border-[#e5e5e5] rounded"><p className="text-[10px] text-[#999] uppercase">{lang === 'pt' ? 'Função' : lang === 'es' ? 'Función' : 'Role'}</p><p className="text-xs font-medium text-[#1a1a1a]">{linkedinData.candidate_profile.detected_role}</p></div>
                )}
              </div>
              {linkedinData.candidate_profile.key_skills && linkedinData.candidate_profile.key_skills.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {linkedinData.candidate_profile.key_skills.map((skill: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-gold/5 border border-gold/20 rounded text-[10px] text-gold font-medium">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {linkedinData.global_summary && (
            <div>
              {linkedinData.global_summary.strengths && linkedinData.global_summary.strengths.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Pontos Fortes' : lang === 'es' ? 'Puntos Fuertes' : 'Strengths'}</h5>
                  <ul className="space-y-1">{linkedinData.global_summary.strengths.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-emerald-500 mt-0.5">+</span><span>{s}</span></li>))}</ul>
                </div>
              )}
              {(linkedinData.global_summary.improvements || linkedinData.global_summary.gaps || []).length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Áreas a Melhorar' : lang === 'es' ? 'Áreas a Mejorar' : 'Areas to Improve'}</h5>
                  <ul className="space-y-1">{(linkedinData.global_summary.improvements || linkedinData.global_summary.gaps || []).map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-amber-500 mt-0.5">!</span><span>{s}</span></li>))}</ul>
                </div>
              )}
              {linkedinData.global_summary.recommendations && linkedinData.global_summary.recommendations.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Recomendações' : lang === 'es' ? 'Recomendaciones' : 'Recommendations'}</h5>
                  <ul className="space-y-1">{linkedinData.global_summary.recommendations.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span><span>{s}</span></li>))}</ul>
                </div>
              )}
            </div>
          )}
          {linkedinData.priority_recommendations?.immediate_adjustments && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">{lang === 'pt' ? 'Ajustes Prioritários' : lang === 'es' ? 'Ajustes Prioritarios' : 'Priority Adjustments'}</h5>
              <p className="text-sm text-[#333] leading-relaxed">{linkedinData.priority_recommendations.immediate_adjustments}</p>
            </div>
          )}
          {linkedinData.cv_problems && linkedinData.cv_problems.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-red-700 uppercase tracking-wider mb-3">{lang === 'pt' ? 'Problemas Identificados' : lang === 'es' ? 'Problemas Identificados' : 'Identified Issues'}</h5>
              <div className="space-y-3">
                {linkedinData.cv_problems.map((problem: any, i: number) => (
                  <div key={i} className="p-3 bg-white border border-[#e5e5e5] rounded-lg">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <h6 className="text-sm font-medium text-[#1a1a1a]">{problem.title}</h6>
                    </div>
                    <p className="text-xs text-[#666] leading-relaxed ml-7 mb-2">{problem.description}</p>
                    {problem.rewrite_suggestion && (
                      <div className="ml-7 p-2 bg-emerald-50 border border-emerald-100 rounded">
                        <p className="text-[10px] text-emerald-700 uppercase font-medium mb-1">{lang === 'pt' ? 'Sugestão de melhoria' : lang === 'es' ? 'Sugerencia de mejora' : 'Improvement suggestion'}</p>
                        <p className="text-xs text-emerald-800 leading-relaxed">{problem.rewrite_suggestion}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standard analysis — uses normalized fields */}
      {!cpData && !linkedinData && (
        <>
          {nScore !== undefined && (
            <div className="mb-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-gold/30 flex items-center justify-center"><span className="text-lg font-bold text-gold">{nScore}</span></div>
              <div><p className="text-xs text-[#999]">{lang === 'pt' ? 'Pontuação global' : lang === 'es' ? 'Puntuación global' : 'Overall score'}</p><p className="text-sm font-medium text-[#1a1a1a]">{nScore}/100</p></div>
            </div>
          )}
          {nSummary && (<div className="mb-4"><h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">{lang === 'pt' ? 'Resumo' : lang === 'es' ? 'Resumen' : 'Summary'}</h5><p className="text-sm text-[#333] leading-relaxed">{nSummary}</p></div>)}
          {nKeywords.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">{lang === 'pt' ? 'Competências-chave' : lang === 'es' ? 'Competencias clave' : 'Key Skills'}</h5>
              <div className="flex flex-wrap gap-1.5">
                {nKeywords.map((kw: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-gold/5 border border-gold/20 rounded-full text-[11px] text-[#666] font-medium">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {nStrengths.length > 0 && (<div className="mb-4"><h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Pontos Fortes' : lang === 'es' ? 'Puntos Fuertes' : 'Strengths'}</h5><ul className="space-y-1">{nStrengths.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-emerald-500 mt-0.5">+</span><span>{s}</span></li>))}</ul></div>)}
          {nImprovements.length > 0 && (<div className="mb-4"><h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'A melhorar' : lang === 'es' ? 'A mejorar' : 'To improve'}</h5><ul className="space-y-1">{nImprovements.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-amber-500 mt-0.5">!</span><span>{s}</span></li>))}</ul></div>)}
          {nRecommendations.length > 0 && (<div><h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Recomendações' : lang === 'es' ? 'Recomendaciones' : 'Recommendations'}</h5><ul className="space-y-1">{nRecommendations.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span><span>{s}</span></li>))}</ul></div>)}
          {nScore === undefined && !nSummary && nStrengths.length === 0 && nKeywords.length === 0 && !analysis.candidate_profile && (
            <div className="space-y-3">
              {/* Smart fallback: render any string/number/array fields nicely */}
              {Object.entries(analysis).filter(([k]) => !['source', 'plan', 'tier', 'captured_at', 'email', 'success', 'mode'].includes(k)).map(([key, val]) => {
                if (typeof val === 'string' && val.trim()) return (<div key={key} className="mb-2"><h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</h5><p className="text-sm text-[#333] leading-relaxed">{val}</p></div>);
                if (typeof val === 'number') return (<div key={key} className="mb-2 flex items-center gap-2"><span className="text-xs text-[#999] uppercase">{key.replace(/_/g, ' ')}:</span><span className="text-sm font-semibold text-[#1a1a1a]">{val}</span></div>);
                if (Array.isArray(val) && val.length > 0) return (<div key={key} className="mb-3"><h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-1.5">{key.replace(/_/g, ' ')}</h5><div className="flex flex-wrap gap-1.5">{val.map((v: any, i: number) => (<span key={i} className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[11px] text-[#666]">{typeof v === 'string' ? v : JSON.stringify(v)}</span>))}</div></div>);
                return null;
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── YouTube Video ID extractor ──────────────────────────────────────────────
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MemberArea() {
  const { t, lang, setLang, pick } = useI18n();
  const [, navigate] = useLocation();
  const { profile, subscription, user } = useAuth();
  const [content, setContent] = useState<MemberContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Tool panel states
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [weeklyUsage, setWeeklyUsage] = useState(0);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Career Path states
  const [cpCountry, setCpCountry] = useState('Portugal');
  const [cpRegion, setCpRegion] = useState('');
  const [cpLinkedinUrl, setCpLinkedinUrl] = useState('');
  const [monthlyCareerPathUsed, setMonthlyCareerPathUsed] = useState(0);

  // Career Intelligence states
  const [monthlyCareerIntelUsed, setMonthlyCareerIntelUsed] = useState(0);

  // CV Maker states are now in the CvMaker component

  // Tab navigation
  const [activeTab, setActiveTab] = useState<TabId>('tools');

  // Saved analyses states
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [expandedAnalysisType, setExpandedAnalysisType] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState<SavedAnalysis | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pendingExtraRun, setPendingExtraRun] = useState<'career_path' | 'career_intelligence' | null>(null);
  const [paymentProduct, setPaymentProduct] = useState<ExtraAnalysisProduct | null>(null);

  const [autoTriggerAnalysis, setAutoTriggerAnalysis] = useState<string | null>(null);
  const planTier = getPlanTier(subscription?.plan);
  const weeklyLimit = WEEKLY_LIMITS[planTier] || 2;
  const isProPlan = planTier === 'pro';

  const selectedCountryData = countries.find(c => c.country === cpCountry);
  const availableRegions = selectedCountryData?.regions || [];

  // ─── Fetch content ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase.from('member_content').select('*').order('sort_order', { ascending: true });
      setContent(data || []);
      setLoading(false);
    }
    fetchContent();
  }, []);

  // ─── Fetch weekly usage ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    async function fetchUsage() {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from('user_analyses').select('id').eq('user_id', user!.id).in('analysis_type', ['cv_analyser', 'linkedin_roaster']).gte('created_at', weekStart.toISOString());
      if (!error && data) setWeeklyUsage(data.length);
    }
    fetchUsage();
  }, [user?.id, analysisResult]);

  // ─── Fetch monthly Career Path usage ─────────────────────────────────
  useEffect(() => {
    if (!user?.id || (planTier !== 'pro' && planTier !== 'growth')) return;
    async function fetchCpUsage() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data, error } = await supabase.from('user_analyses').select('id').eq('user_id', user!.id).eq('analysis_type', 'career_path').gte('created_at', monthStart.toISOString());
      if (!error && data) setMonthlyCareerPathUsed(data.length);
    }
    fetchCpUsage();
  }, [user?.id, planTier, analysisResult]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const orderId = sessionStorage.getItem('s2iExtraOrderId');
      const orderType = sessionStorage.getItem('s2iExtraType');
      if (orderId && orderType) {
        // ── Other extra analyses: poll backend ──
        toast.info(t('member.lib.verifyingPayment'));
        window.history.replaceState({}, '', window.location.pathname);
        
        // Polling loop since Stripe webhooks can take a few seconds
        let attempts = 0;
        const checkStatus = () => {
          fetch(`https://share2inspire-beckend.lm.r.appspot.com/api/payment/status/${orderId}`)
            .then(res => res.json())
            .then(data => {
              if (data.paid) {
                sessionStorage.removeItem('s2iExtraOrderId');
                sessionStorage.removeItem('s2iExtraType');
                toast.success(t('member.lib.paymentConfirmed'));
                setAutoTriggerAnalysis(orderType);
              } else if (attempts < 5) {
                attempts++;
                setTimeout(checkStatus, 2000);
              } else {
                toast.error(t('member.lib.paymentTimeout'));
              }
            })
            .catch(e => {
              console.error('Failed to verify payment', e);
            });
        };
        setTimeout(checkStatus, 1500); // initial wait
      }
    }
  }, [lang]);

  // NOTE: useEffect that calls runCareerPath/runCareerIntelligence is placed AFTER those
  // useCallback declarations (below) to avoid TDZ (Temporal Dead Zone) errors.

  // ─── Fetch monthly Career Intelligence usage ─────────────────────────
  useEffect(() => {
    if (!user?.id || (planTier !== 'pro' && planTier !== 'growth')) return;
    async function fetchCiUsage() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data, error } = await supabase.from('user_analyses').select('id').eq('user_id', user!.id).eq('analysis_type', 'career_intelligence').gte('created_at', monthStart.toISOString());
      if (!error && data) setMonthlyCareerIntelUsed(data.length);
    }
    fetchCiUsage();
  }, [user?.id, planTier, analysisResult]);

  // ─── Fetch saved analyses ──────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    setLoadingSaved(true);
    async function fetchSaved() {
      const { data, error } = await supabase.from('user_analyses').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100);
      if (!error && data) setSavedAnalyses(data as SavedAnalysis[]);
      setLoadingSaved(false);
    }
    fetchSaved();
  }, [user?.id, analysisResult]);

  // ─── Content filtering ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let items = [...content];
    if (filter === 'all' || filter === 'article') {
      const blogItems: MemberContent[] = BLOG_ARTICLES.map((article, i) => ({
        id: `blog-${i}`, title: article.title, description: article.desc, content_type: 'article' as const,
        file_url: article.url, thumbnail_url: null, tags: null, is_published: true, required_plan: 'monthly' as const,
        sort_order: 100 + i, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }));
      items = [...items, ...blogItems];
    }
    if (filter !== 'all') items = items.filter(c => c.content_type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(c => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    }
    return items;
  }, [content, filter, search]);

  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const filterLabels: Record<string, string> = {
    all: t('member.allTypes'), ebook: t('member.ebooks'), article: t('member.articles'), video: t('member.videos'), podcast: 'Podcast',
  };

  // ─── CV helpers ─────────────────────────────────────────────────────────
  const extractPdfText = useCallback(async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const c = await page.getTextContent();
      text += c.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text.trim().substring(0, 8000);
  }, []);

  const toBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const readCvText = useCallback(async (file: File): Promise<{ text: string; base64?: string; filename?: string }> => {
    let text = '';
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.name.toLowerCase().endsWith('.docx');
    if (isPdf) {
      try { const ab = await file.arrayBuffer(); text = await extractPdfText(ab); } catch (e) { console.warn('[CV] PDF extraction failed:', e); }
    } else if (isDocx) {
      try { const mammoth = await import('mammoth'); const ab = await file.arrayBuffer(); const r = await mammoth.extractRawText({ arrayBuffer: ab }); text = r.value; } catch (e) { console.warn('[CV] DOCX extraction failed:', e); }
    } else {
      text = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = () => reject(new Error('Erro ao ler.')); reader.readAsText(file); });
    }
    if (isPdf) {
      // Always include base64 for PDFs so backend can use Gemini's native PDF reading
      // This is much more reliable than pdfjs-dist text extraction in the browser
      const base64 = await toBase64(file);
      return { text: text.substring(0, 8000), base64, filename: file.name };
    }
    return { text: text.substring(0, 8000) };
  }, [extractPdfText, toBase64]);

  const downloadProfileCv = useCallback(async (): Promise<{ text: string; base64?: string; filename?: string } | null> => {
    if (!profile?.cv_url) return null;
    try {
      let storagePath = profile.cv_url;
      const bucketMarker = '/user-cvs/';
      const markerIndex = storagePath.indexOf(bucketMarker);
      if (markerIndex !== -1) storagePath = storagePath.substring(markerIndex + bucketMarker.length);
      let blob: Blob | null = null;
      // Method 1: Supabase Storage SDK download (uses auth session)
      try {
        const { data, error } = await supabase.storage.from('user-cvs').download(storagePath);
        if (error) console.warn('[CV] Storage download error:', error.message);
        if (data) blob = data;
      } catch (e) { console.warn('[CV] Storage download exception:', e); }
      // Method 2: Signed URL fallback
      if (!blob) {
        try {
          const { data: signedData, error: signedError } = await supabase.storage.from('user-cvs').createSignedUrl(storagePath, 300);
          if (signedError) console.warn('[CV] Signed URL error:', signedError.message);
          if (signedData?.signedUrl) {
            const resp = await fetch(signedData.signedUrl);
            if (resp.ok) blob = await resp.blob();
          }
        } catch (e) { console.warn('[CV] Signed URL fallback failed:', e); }
      }
      // Method 3: Direct fetch (for public URLs)
      if (!blob && profile.cv_url.startsWith('http')) {
        try { const resp = await fetch(profile.cv_url); if (resp.ok) blob = await resp.blob(); } catch (e) { console.warn('[CV] Direct fetch failed:', e); }
      }
      if (blob) {
        const isPdf = profile.cv_url.toLowerCase().endsWith('.pdf') || blob.type === 'application/pdf';
        const filename = profile.cv_url.split('/').pop() || 'cv.pdf';
        let text = '';
        if (isPdf) {
          try { const ab = await blob.arrayBuffer(); text = await extractPdfText(ab); } catch (e) { console.warn('[CV] Profile PDF extraction failed:', e); }
          // Always include base64 for PDFs so backend can do OCR if text extraction is poor
          const base64 = await toBase64(blob);
          return { text: text.substring(0, 8000), base64, filename };
        } else {
          text = await blob.text();
        }
        return { text: text.substring(0, 8000) };
      }
      console.error('[CV] All download methods failed for:', storagePath);
    } catch (e) { console.error('Error downloading CV:', e); }
    return null;
  }, [profile?.cv_url, extractPdfText, toBase64]);

  const getCvData = useCallback(async () => {
    if (cvFile) return readCvText(cvFile);
    else if (profile?.cv_url) return downloadProfileCv();
    return null;
  }, [cvFile, profile?.cv_url, readCvText, downloadProfileCv]);

  const buildCvRequestBody = (cvData: { text: string; base64?: string; filename?: string }, mode: string, extra?: Record<string, any>): any => {
    const body: any = { mode, language: lang };
    // If we have the original PDF file as base64, prefer sending it to the backend
    // The backend uses Gemini's native PDF reading which is much more reliable than pdfjs-dist text extraction
    if (cvData.base64) {
      body.file = cvData.base64;
      body.filename = cvData.filename || 'cv.pdf';
      // Don't send cv_text when we have the file — let backend extract from PDF directly
      console.log('[CV] Sending PDF file to backend for native extraction (' + (cvData.base64.length / 1024).toFixed(0) + 'KB base64)');
    } else if (cvData.text.trim().length > 0) {
      // Only send text when we don't have the original file (e.g. DOCX, plain text)
      body.cv_text = cvData.text.substring(0, 8000);
      console.log('[CV] Sending extracted text to backend (' + cvData.text.trim().length + ' chars)');
    }
    // If no text and no file, this will fail at the caller level
    if (extra) Object.assign(body, extra);
    return body;
  };

  const fetchWithRetry = useCallback(async (body: any, timeoutMs = 120000, maxRetries = 2): Promise<any> => {
    let response: Response | null = null;
    let responseData: any = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await fetch(HYPER_TASK_URL, { method: 'POST', headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) { responseData = await response.json(); if (responseData.success) return responseData; }
        if (attempt < maxRetries) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (attempt < maxRetries && fetchError.name !== 'AbortError') { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); } else { throw fetchError; }
      }
    }
    if (!response?.ok) throw new Error('Erro na análise IA. Tenta novamente.');
    if (!responseData?.success) throw new Error(responseData?.error || 'Erro na análise IA.');
    return responseData;
  }, []);

  // ─── Tool execution functions ──────────────────────────────────────────
  const runCvAnalysis = useCallback(async () => {
    if (!user?.id || !subscription) return;
    if (weeklyUsage >= weeklyLimit) { setAnalysisError(t('member.lib.weeklyLimitReached')); return; }
    setAnalyzing(true); setAnalysisError(null); setAnalysisResult(null);
    try {
      const cvData = await getCvData();
      if (!cvData || (cvData.text.trim().length < 50 && !cvData.base64)) { setAnalysisError(t('member.lib.couldNotReadCvProfile')); setAnalyzing(false); return; }
      const body = buildCvRequestBody(cvData, 'cv_extraction');
      const result = await fetchWithRetry(body);
      const rawAnalysis = result?.analysis || result;
      const enriched = transformGeminiResponse(rawAnalysis);
      setAnalysisResult({ ...result, _enriched: enriched });
      await supabase.from('user_analyses').insert({ user_id: user.id, analysis_type: 'cv_analyser', data: { source: 'member_area', plan: subscription.plan, tier: planTier, captured_at: new Date().toISOString(), email: profile?.email, analysis: rawAnalysis, enriched } });
      setWeeklyUsage(prev => prev + 1);
    } catch (err: any) { setAnalysisError(err.name === 'AbortError' ? t('member.lib.analysisTooSlow') : (err.message || 'Erro inesperado.')); }
    finally { setAnalyzing(false); }
  }, [user?.id, subscription, weeklyUsage, weeklyLimit, planTier, lang, getCvData, fetchWithRetry]);

  const runLinkedinAnalysis = useCallback(async () => {
    if (!user?.id || !subscription) return;
    if (weeklyUsage >= weeklyLimit) { setAnalysisError(t('member.lib.weeklyLimitReached')); return; }
    const linkedinUrl = profile?.linkedin_url;
    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) { setAnalysisError(t('member.lib.addLinkedinSettingsUrl')); return; }
    setAnalyzing(true); setAnalysisError(null); setAnalysisResult(null);
    try {
      const cvData = await getCvData();
      const body: any = { mode: 'linkedin_roast', linkedin_url: linkedinUrl, language: lang };
      if (cvData && (cvData.text.trim().length >= 50 || cvData.base64)) {
        if (cvData.base64) {
          // Prefer sending the original PDF file for better extraction
          body.file = cvData.base64;
          body.filename = cvData.filename;
        } else {
          body.cv_text = cvData.text.substring(0, 8000);
        }
      }
      const result = await fetchWithRetry(body);
      setAnalysisResult(result);
      await supabase.from('user_analyses').insert({ user_id: user.id, analysis_type: 'linkedin_roaster', data: { source: 'member_area', plan: subscription.plan, tier: planTier, linkedin_url: linkedinUrl, captured_at: new Date().toISOString(), email: profile?.email, analysis: result } });
      setWeeklyUsage(prev => prev + 1);
    } catch (err: any) { setAnalysisError(err.name === 'AbortError' ? t('member.lib.analysisTooSlow') : (err.message || 'Erro inesperado.')); }
    finally { setAnalyzing(false); }
  }, [user?.id, subscription, weeklyUsage, weeklyLimit, planTier, lang, profile, getCvData, fetchWithRetry]);

  const runCareerPath = useCallback(async () => {
    if (!user?.id || !subscription) return;
    const limit = planTier === 'pro' ? 2 : planTier === 'growth' ? 1 : 0;
    const isExtra = monthlyCareerPathUsed >= limit;
    setAnalyzing(true); setAnalysisError(null); setAnalysisResult(null);
    try {
      const cvData = await getCvData();
      if (!cvData || (cvData.text.trim().length < 50 && !cvData.base64)) { setAnalysisError(t('member.lib.couldNotReadCv')); setAnalyzing(false); return; }
      const extractionBody = buildCvRequestBody(cvData, 'cv_extraction');
      const extractionResult = await fetchWithRetry(extractionBody);
      const analysisSource = extractionResult.analysis || extractionResult;
      const cvText = (analysisSource.raw_text || cvData.text).substring(0, 8000);
      const linkedinForCp = cpLinkedinUrl.trim() || profile?.linkedin_url || '';
      const careerPathBody: any = { mode: 'career_path', cv_text: cvText, cv_analysis: JSON.stringify(analysisSource), linkedin_url: linkedinForCp, country: cpCountry, region: cpRegion, language: lang };
      const result = await fetchWithRetry(careerPathBody);
      setAnalysisResult(result);
      const extraPrice = isExtra ? (planTier === 'pro' ? 4.75 : 9.50) : 0;
      await supabase.from('user_analyses').insert({ user_id: user.id, analysis_type: 'career_path', data: { source: 'member_area_pro', plan: subscription.plan, tier: planTier, country: cpCountry, region: cpRegion, captured_at: new Date().toISOString(), email: profile?.email, is_extra: isExtra, extra_price: extraPrice, analysis: result } });
      setMonthlyCareerPathUsed(prev => prev + 1);
    } catch (err: any) { setAnalysisError(err.name === 'AbortError' ? t('member.lib.analysisTooSlow') : (err.message || 'Erro inesperado.')); }
    finally { setAnalyzing(false); }
  }, [user?.id, subscription, planTier, monthlyCareerPathUsed, profile, cpCountry, cpRegion, lang, getCvData, fetchWithRetry]);

  const runCareerIntelligence = useCallback(async () => {
    if (!user?.id || !subscription) return;
    const limit = planTier === 'pro' ? 2 : planTier === 'growth' ? 1 : 0;
    const isExtra = monthlyCareerIntelUsed >= limit;
    setAnalyzing(true); setAnalysisError(null); setAnalysisResult(null);
    try {
      const cvData = await getCvData();
      if (!cvData || (cvData.text.trim().length < 50 && !cvData.base64)) { setAnalysisError(t('member.lib.couldNotReadCv')); setAnalyzing(false); return; }
      const extractionBody = buildCvRequestBody(cvData, 'cv_extraction');
      const extractionResult = await fetchWithRetry(extractionBody);
      const analysisSource = extractionResult.analysis || extractionResult;
      const cvText = (analysisSource.raw_text || cvData.text).substring(0, 8000);
      const linkedinForCi = cpLinkedinUrl.trim() || profile?.linkedin_url || '';
      const ciBody: any = { mode: 'career_path', depth: 'intelligence', cv_text: cvText, cv_analysis: JSON.stringify(analysisSource), linkedin_url: linkedinForCi, country: cpCountry, region: cpRegion, language: lang };
      const result = await fetchWithRetry(ciBody);
      result._toolType = 'career_intelligence';
      setAnalysisResult(result);
      const extraPrice = isExtra ? (planTier === 'pro' ? 9.75 : 19.50) : 0;
      await supabase.from('user_analyses').insert({ user_id: user.id, analysis_type: 'career_intelligence', data: { source: 'member_area_pro', plan: subscription.plan, tier: planTier, country: cpCountry, region: cpRegion, captured_at: new Date().toISOString(), email: profile?.email, is_extra: isExtra, extra_price: extraPrice, analysis: result } });
      setMonthlyCareerIntelUsed(prev => prev + 1);
    } catch (err: any) { setAnalysisError(err.name === 'AbortError' ? t('member.lib.analysisTooSlow') : (err.message || 'Erro inesperado.')); }
    finally { setAnalyzing(false); }
  }, [user?.id, subscription, planTier, monthlyCareerIntelUsed, profile, cpCountry, cpRegion, lang, getCvData, fetchWithRetry]);

  // ─── Auto-trigger after payment return (moved here to avoid TDZ) ──────────
  // runCareerPath and runCareerIntelligence must be declared above before this useEffect
  useEffect(() => {
    if (autoTriggerAnalysis && profile && (profile.cv_url || cvFile)) {
      if (autoTriggerAnalysis === 'career_path') {
        runCareerPath();
      } else if (autoTriggerAnalysis.includes('career_intelligence')) {
        runCareerIntelligence();
      }
      setAutoTriggerAnalysis(null);
    }
  }, [autoTriggerAnalysis, profile, cvFile, runCareerPath, runCareerIntelligence]);

  // ─── Toggle tool panel ──────────────────────────────────────────────────
  const toggleTool = (key: string) => {
    if (expandedTool === key) { setExpandedTool(null); setAnalysisResult(null); setAnalysisError(null); setCvFile(null); }
    else { setExpandedTool(key); setAnalysisResult(null); setAnalysisError(null); setCvFile(null); setTimeout(() => { const el = document.querySelector(`[data-tool-key="${key}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }
  };

  const getStandaloneToolUrl = useCallback((path: string) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (lang === 'en') return `/en${normalizedPath}`;
    if (lang === 'es') return `/es${normalizedPath}`;
    return normalizedPath;
  }, [lang]);

  // ─── Tool definitions ───────────────────────────────────────────────────
  type ToolDef = { key: string; icon: any; color: string; type: 'external' | 'inline' | 'locked' | 'discount' | 'widget'; action?: string; url?: string; discount?: string | null; discountOriginal?: string | null; label: string; desc: string; badge?: number };

  const tools: ToolDef[] = [
    { key: 'cvMaker', icon: FileText, color: 'from-gold/20 to-gold/5', type: 'inline', action: 'cvMaker', label: t('member.tools.cvMakerLabel'), desc: t('member.tools.cvMakerDesc') },
    { key: 'cvAnalyzer', icon: BarChart3, color: 'from-blue-500/15 to-blue-500/5', type: 'external', action: 'cv', url: getStandaloneToolUrl('/cv-analyser/'), label: t('member.tools.cvAnalyzerLabel'), desc: t('member.tools.cvAnalyzerDesc'), badge: savedAnalyses.filter(a => a.analysis_type === 'cv_analyser').length || undefined },
    { key: 'linkedinRoster', icon: Linkedin, color: 'from-sky-500/15 to-sky-500/5', type: 'external', action: 'linkedin', url: getStandaloneToolUrl('/linkedin-roaster/'), label: t('member.tools.linkedinRoasterLabel'), desc: t('member.tools.linkedinRoasterDesc'), badge: savedAnalyses.filter(a => a.analysis_type === 'linkedin_roaster').length || undefined },
    { key: 'careerBot', icon: Bot, color: 'from-purple-500/15 to-purple-500/5', type: 'widget', action: 'openCareerBot', label: t('member.tools.careerAdvisoryLabel'), desc: t('member.tools.careerAdvisoryDesc') },
    { key: 'careerPath', icon: Route, color: 'from-emerald-500/15 to-emerald-500/5', type: 'external', action: 'careerPath', url: getStandaloneToolUrl('/career-path/'), label: t('member.tools.careerPathLabel'), desc: t('member.tools.careerPathDesc'), badge: savedAnalyses.filter(a => a.analysis_type === 'career_path').length || undefined },
    { key: 'careerIntelligence', icon: Sparkles, color: 'from-violet-500/15 to-violet-500/5', type: 'external', action: 'careerIntelligence', url: getStandaloneToolUrl('/career-intelligence/'), label: t('member.tools.careerIntelligenceLabel'), desc: t('member.tools.careerIntelligenceDesc'), badge: savedAnalyses.filter(a => a.analysis_type === 'career_intelligence').length || undefined },
    { key: 'salaryRealityCheck', icon: Euro, color: 'from-amber-500/15 to-amber-500/5', type: 'inline', action: 'salaryRealityCheck', label: t('member.tools.salaryRealityCheckLabel'), desc: t('member.tools.salaryRealityCheckDesc'), badge: savedAnalyses.filter(a => a.analysis_type === 'salary_reality_check').length || undefined },
  ];

  const remainingAnalyses = Math.max(0, weeklyLimit - weeklyUsage);

  // ─── Render inline panel content ────────────────────────────────────────
  const renderInlinePanel = (tool: ToolDef) => {
    if (tool.action === 'cv') {
      const weeklyAvailable = weeklyUsage < weeklyLimit;
      return (
        <div className="space-y-4">
          <div className={`flex items-center gap-2 text-xs rounded px-3 py-2 ${weeklyAvailable ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
            {weeklyAvailable ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{`${weeklyLimit === 999 ? t('member.usage.unlimited') : t('member.usage.weeklyPlanLabel').replace('{limit}', String(weeklyLimit)).replace('{plan}', planTier === 'pro' ? 'Pro' : planTier === 'growth' ? 'Growth' : 'Essential')}`} ({weeklyUsage}/{weeklyLimit === 999 ? '∞' : weeklyLimit})</span>
            {!weeklyAvailable && <span className="ml-auto text-red-600 font-medium text-[10px]">{t('member.usage.weeklyLimitReached')}</span>}
          </div>
          <div>
            {profile?.cv_url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{t('member.cv.profileCvWillUse')}: {profile.cv_filename || 'CV'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t('member.cv.noCvUpload')}</span>
              </div>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#ccc] rounded text-xs text-[#666] hover:border-gold/40 hover:text-gold transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {cvFile ? cvFile.name : t('member.lib.uploadAnotherCvLong')}
            </button>
          </div>
          <button onClick={runCvAnalysis} disabled={analyzing || (!profile?.cv_url && !cvFile) || (weeklyUsage >= weeklyLimit)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-sm font-medium rounded-lg hover:from-[#333] hover:to-[#444] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            {analyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />{t('member.lib.analyzing')}</>) : (<><BarChart3 className="w-4 h-4" />{t('member.lib.runCvAnalysis')}</>)}
          </button>
        </div>
      );
    }

    if (tool.action === 'linkedin') {
      const weeklyAvailable = weeklyUsage < weeklyLimit;
      return (
        <div className="space-y-4">
          <div className={`flex items-center gap-2 text-xs rounded px-3 py-2 ${weeklyAvailable ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
            {weeklyAvailable ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{`${weeklyLimit === 999 ? t('member.usage.unlimited') : t('member.usage.weeklyPlanLabel').replace('{limit}', String(weeklyLimit)).replace('{plan}', planTier === 'pro' ? 'Pro' : planTier === 'growth' ? 'Growth' : 'Essential')}`} ({weeklyUsage}/{weeklyLimit === 999 ? '∞' : weeklyLimit})</span>
            {!weeklyAvailable && <span className="ml-auto text-red-600 font-medium text-[10px]">{t('member.usage.weeklyLimitReached')}</span>}
          </div>
          <div>
            {profile?.linkedin_url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{t('member.li.profileLabel')}: {profile.linkedin_url}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{t('member.lib.addLinkedinProfileUrl')}</span>
              </div>
            )}
          </div>
          <button onClick={runLinkedinAnalysis} disabled={analyzing || !profile?.linkedin_url || (weeklyUsage >= weeklyLimit)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-sm font-medium rounded-lg hover:from-[#333] hover:to-[#444] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            {analyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />{t('member.lib.analyzingLinkedin')}</>) : (<><Linkedin className="w-4 h-4" />{t('member.lib.runLinkedinAnalysis')}</>)}
          </button>
        </div>
      );
    }

    if (tool.action === 'careerPath') {
      const cpLimit = planTier === 'pro' ? 2 : planTier === 'growth' ? 1 : 0;
      const cpAvailable = monthlyCareerPathUsed < cpLimit;
      const cpExtraPrice = '3,75€';
      const cpOriginalPrice = '19€';
      return (
        <div className="space-y-4">
          <div className={`flex items-center gap-2 text-xs rounded px-3 py-2 ${cpAvailable ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
            {cpAvailable ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{t(cpLimit > 1 ? 'member.usage.careerPathIncludedPlural' : 'member.usage.careerPathIncludedSingular').replace('{count}', String(cpLimit)).replace('{plan}', planTier === 'pro' ? 'Pro' : 'Growth')} ({monthlyCareerPathUsed}/{cpLimit})</span>
            {!cpAvailable && <span className="ml-auto text-red-600 font-medium text-[10px]">{t('member.usage.monthlyLimitReached')}</span>}
          </div>
          {!cpAvailable && (
            <div className="flex items-center gap-2 text-xs text-[#666] bg-[#fafaf9] border border-[#e5e5e5] rounded px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>{t('member.lib.extraAnalysisAvailableFor')} {cpExtraPrice} <span className="line-through text-[10px] text-[#999]">{cpOriginalPrice}</span></span>
            </div>
          )}
          <div>
            {profile?.cv_url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700/70 bg-emerald-50/50 border border-emerald-200/50 rounded px-3 py-2"><CheckCircle className="w-3.5 h-3.5" /><span>{t('member.cv.profileCv')}: {profile.cv_filename || 'CV'}</span></div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2"><AlertCircle className="w-3.5 h-3.5" /><span>{t('member.cv.noCvInProfile')}</span></div>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#ccc] rounded text-xs text-[#666] hover:border-gold/40 hover:text-gold transition-colors"><Upload className="w-3.5 h-3.5" />{cvFile ? cvFile.name : t('member.lib.uploadAnotherCv')}</button>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 flex items-center gap-1"><Linkedin className="w-3 h-3" />{t('member.li.profileLabel')} <span className="text-red-400">*</span></label>
            <input type="url" value={cpLinkedinUrl || profile?.linkedin_url || ''} onChange={e => setCpLinkedinUrl(e.target.value)} placeholder={t('member.form.linkedinPlaceholder')} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white placeholder:text-[#bbb]" />
            <p className="text-[9px] text-[#999] mt-1">{t('member.cp.systemAnalyze')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block"><Globe className="w-3 h-3 inline mr-1" />{t('member.lib.country')}</label>
              <select value={cpCountry} onChange={e => { setCpCountry(e.target.value); setCpRegion(''); }} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white">{countries.map(c => (<option key={c.code} value={c.country}>{c.country}</option>))}</select>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block"><MapPin className="w-3 h-3 inline mr-1" />{t('member.lib.region')}</label>
              <select value={cpRegion} onChange={e => setCpRegion(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white"><option value="">{t('member.lib.selectRegion')}</option>{availableRegions.map(r => (<option key={r} value={r}>{r}</option>))}</select>
            </div>
          </div>
          <button onClick={() => { if (!cpAvailable) { setPendingExtraRun('career_path'); } else { runCareerPath(); } }} disabled={analyzing || (!profile?.cv_url && !cvFile)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-sm font-medium rounded-lg hover:from-[#333] hover:to-[#444] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            {analyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />{t('member.cp.generating')}</>) : (<><Route className="w-4 h-4" />{cpAvailable ? t('member.cp.generate') : t('member.lib.generateCareerPathWithPrice').replace('{price}', cpExtraPrice)}</>)}
          </button>
        </div>
      );
    }

    if (tool.action === 'careerIntelligence') {
      const ciLimit = planTier === 'pro' ? 2 : planTier === 'growth' ? 1 : 0;
      const ciAvailable = monthlyCareerIntelUsed < ciLimit;
      const ciExtraPrice = '6,25€';
      const ciOriginalPrice = '39€';
      return (
        <div className="space-y-4">
          <div className={`flex items-center gap-2 text-xs rounded px-3 py-2 ${ciAvailable ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
            {ciAvailable ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{t(ciLimit > 1 ? 'member.usage.careerIntelligenceIncludedPlural' : 'member.usage.careerIntelligenceIncludedSingular').replace('{count}', String(ciLimit)).replace('{plan}', planTier === 'pro' ? 'Pro' : 'Growth')} ({monthlyCareerIntelUsed}/{ciLimit})</span>
            {!ciAvailable && <span className="ml-auto text-red-600 font-medium text-[10px]">{t('member.usage.monthlyLimitReached')}</span>}
          </div>
          {!ciAvailable && (
            <div className="flex items-center gap-2 text-xs text-[#666] bg-[#fafaf9] border border-[#e5e5e5] rounded px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>{t('member.lib.extraAnalysisAvailableFor')} {ciExtraPrice} <span className="line-through text-[10px] text-[#999]">{ciOriginalPrice}</span></span>
            </div>
          )}
          <div>
            {profile?.cv_url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700/70 bg-emerald-50/50 border border-emerald-200/50 rounded px-3 py-2"><CheckCircle className="w-3.5 h-3.5" /><span>{t('member.cv.profileCv')}: {profile.cv_filename || 'CV'}</span></div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2"><AlertCircle className="w-3.5 h-3.5" /><span>{t('member.cv.noCvInProfile')}</span></div>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#ccc] rounded text-xs text-[#666] hover:border-gold/40 hover:text-gold transition-colors"><Upload className="w-3.5 h-3.5" />{cvFile ? cvFile.name : t('member.lib.uploadAnotherCv')}</button>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 flex items-center gap-1"><Linkedin className="w-3 h-3" />{t('member.li.profileLabel')} <span className="text-red-400">*</span></label>
            <input type="url" value={cpLinkedinUrl || profile?.linkedin_url || ''} onChange={e => setCpLinkedinUrl(e.target.value)} placeholder={t('member.form.linkedinPlaceholder')} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white placeholder:text-[#bbb]" />
            <p className="text-[9px] text-[#999] mt-1">{t('member.cp.systemAnalyze')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block"><Globe className="w-3 h-3 inline mr-1" />{t('member.lib.country')}</label>
              <select value={cpCountry} onChange={e => { setCpCountry(e.target.value); setCpRegion(''); }} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white">{countries.map(c => (<option key={c.code} value={c.country}>{c.country}</option>))}</select>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block"><MapPin className="w-3 h-3 inline mr-1" />{t('member.lib.region')}</label>
              <select value={cpRegion} onChange={e => setCpRegion(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white"><option value="">{t('member.lib.selectRegion')}</option>{availableRegions.map(r => (<option key={r} value={r}>{r}</option>))}</select>
            </div>
          </div>
          <button onClick={() => { if (!ciAvailable) { setPendingExtraRun('career_intelligence'); } else { runCareerIntelligence(); } }} disabled={analyzing || (!profile?.cv_url && !cvFile)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-sm font-medium rounded-lg hover:from-[#333] hover:to-[#444] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            {analyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />{t('member.cv.generating')}</>) : (<><Sparkles className="w-4 h-4" />{ciAvailable ? t('member.ci.generate') : t('member.lib.generateCareerIntelligenceWithPrice').replace('{price}', ciExtraPrice)}</>)}
          </button>
        </div>
      );
    }
    if (tool.action === 'cvMaker') {
      return (
        <CvMaker
          lang={lang}
          onLangChange={(newLang) => setLang(newLang as 'pt' | 'en')}
          supabaseUrl={SUPABASE_URL}
          supabaseAnonKey={SUPABASE_ANON_KEY}
          hyperTaskUrl={HYPER_TASK_URL}
          profileName={profile ? `${profile.first_name} ${profile.last_name}` : ''}
          userId={user?.id || ''}
        />
      );
    }
    if (tool.action === 'salaryRealityCheck') {
  return (
    <SalaryRealityCheck
      userEmail={profile?.email || user?.email || ''}
      userName={profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : ''}
    />
  );
}
return null;
  };

  // ─── Analysis helpers ───────────────────────────────────────────────────
  function getAnalysisSummary(analysis: SavedAnalysis): string {
    const data = analysis.data;
    if (!data) return '';
    if (analysis.analysis_type === 'cv_analyser') { const s = data.score ?? data.analysis?.score ?? data.analysis?.atsScore ?? data.analysis?.overall_score; if (s !== undefined) return `Score ATS: ${s}/100`; }
    if (analysis.analysis_type === 'linkedin_roaster') { if (data.score) return `Score: ${data.score}`; if (data.analysis?.teaser?.nota_geral) return `Nota: ${data.analysis.teaser.nota_geral}`; }
    if (analysis.analysis_type === 'career_path') { if (data.career_path?.title) return data.career_path.title; }
    if (analysis.analysis_type === 'career_intelligence') { if (data.strategic_paths && Array.isArray(data.strategic_paths)) return `${data.strategic_paths.length} caminhos estratégicos`; }
    if (analysis.analysis_type === 'career_energy') { if (data.total_score) return `Score: ${data.total_score}${data.level ? ` — ${data.level}` : ''}`; }
    return '';
  }

  function formatDate(dateStr: string) {
    try { return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return dateStr; }
  }

  async function handleDeleteAnalysis(id: string) {
    if (!confirm(t('member.lib.deleteConfirm'))) return;
    setDeletingId(id);
    try { await supabase.from('user_analyses').delete().eq('id', id); setSavedAnalyses(prev => prev.filter(a => a.id !== id)); } catch (e) { console.error('Error deleting analysis:', e); }
    setDeletingId(null);
  }

  // Group analyses by type
  const groupedAnalyses = useMemo(() => {
    const groups: Record<string, SavedAnalysis[]> = {};
    savedAnalyses.forEach(a => { const type = a.analysis_type || 'unknown'; if (!groups[type]) groups[type] = []; groups[type].push(a); });
    return groups;
  }, [savedAnalyses]);

  // ─── Smart next step recommendation ─────────────────────────────────────
  const nextStepSuggestion = useMemo(() => {
    const cvAnalyses = savedAnalyses.filter(a => a.analysis_type === 'cv_analyser');
    const liAnalyses = savedAnalyses.filter(a => a.analysis_type === 'linkedin_roaster');
    const hasCv = !!profile?.cv_url;
    const hasLinkedin = !!profile?.linkedin_url;
    const profileComplete = !!(profile?.first_name && profile?.last_name && profile?.phone && profile?.linkedin_url && profile?.cv_url);

    if (!profileComplete) return { icon: '📋', text: t('member.suggestion.complete'), action: 'profile' as const };
    if (cvAnalyses.length === 0 && hasCv) return { icon: '📄', text: t('member.suggestion.cvAnalyse'), action: 'cv' as const };
    if (liAnalyses.length === 0 && hasLinkedin) return { icon: '🔗', text: t('member.suggestion.linkedin'), action: 'linkedin' as const };
    if (cvAnalyses.length > 0) {
      const bestCvScore = cvAnalyses.reduce((best, a) => {
        const s = a.data?.overall_score || a.data?.score || a.data?.ats_score || 0;
        return Math.max(best, typeof s === 'number' ? s : 0);
      }, 0);
      if (bestCvScore < 70) return { icon: '📈', text: t('member.suggestion.cvImprove'), action: 'cv' as const };
    }
    if (liAnalyses.length > 0) {
      const bestLiScore = liAnalyses.reduce((best, a) => {
        const s = a.data?.overall_score || a.data?.score || 0;
        return Math.max(best, typeof s === 'number' ? s : 0);
      }, 0);
      if (bestLiScore < 70) return { icon: '💡', text: t('member.suggestion.linkedinImprove'), action: 'linkedin' as const };
    }
    if (planTier === 'pro' && !savedAnalyses.some(a => a.analysis_type === 'career_path')) {
      return { icon: '🗺️', text: t('member.suggestion.careerPath'), action: 'careerPath' as const };
    }
    return { icon: '🚀', text: t('member.suggestion.keepGoing'), action: 'tools' as const };
  }, [savedAnalyses, profile, planTier, t]);

  // ─── Dynamic insight message (contextual to user state) ────────────────
  const dynamicInsight = useMemo(() => {
    const cvAnalyses = savedAnalyses.filter(a => a.analysis_type === 'cv_analyser');
    const liAnalyses = savedAnalyses.filter(a => a.analysis_type === 'linkedin_roaster');
    const cpAnalyses = savedAnalyses.filter(a => a.analysis_type === 'career_path');
    const hasCv = !!profile?.cv_url;
    const bestCvScore = cvAnalyses.reduce((best, a) => {
      const s = a.data?.overall_score || a.data?.score || a.data?.ats_score || 0;
      return Math.max(best, typeof s === 'number' ? s : 0);
    }, 0);
    const bestLiScore = liAnalyses.reduce((best, a) => {
      const s = a.data?.overall_score || a.data?.score || 0;
      return Math.max(best, typeof s === 'number' ? s : 0);
    }, 0);

    // Calculate career score for elite check
    const toolsUsed = new Set(savedAnalyses.map(a => a.analysis_type));
    const usedCount = ['cv_analyser', 'linkedin_roaster', 'career_path', 'career_intelligence'].filter(t => toolsUsed.has(t)).length;
    const estimatedScore = (cvAnalyses.length > 0 ? 50 : 0) + (bestCvScore >= 60 ? 75 : 0) + (bestCvScore >= 85 ? 125 : 0)
      + (liAnalyses.length > 0 ? 50 : 0) + (bestLiScore >= 60 ? 75 : 0) + (bestLiScore >= 85 ? 125 : 0)
      + (cpAnalyses.length > 0 ? 75 : 0) + (usedCount >= 2 ? 30 : 0);

    if (estimatedScore >= 700) return { key: 'member.insight.elite', action: 'tools' as const };
    if (!hasCv || cvAnalyses.length === 0) return { key: 'member.insight.noCv', action: 'cv' as const };
    if (bestCvScore > 0 && bestCvScore < 70) return { key: 'member.insight.lowCvScore', action: 'cv' as const };
    if (bestCvScore >= 70 && liAnalyses.length === 0) return { key: 'member.insight.goodCvScore', action: 'linkedin' as const };
    if (liAnalyses.length === 0) return { key: 'member.insight.noLinkedin', action: 'linkedin' as const };
    if (bestLiScore > 0 && bestLiScore < 70) return { key: 'member.insight.lowLiScore', action: 'linkedin' as const };
    if (cpAnalyses.length === 0 && planTier !== 'essential') return { key: 'member.insight.noCareerPath', action: 'careerPath' as const };
    if (usedCount >= 3) return { key: 'member.insight.proTip', action: 'careerIntelligence' as const };
    return { key: 'member.insight.default', action: 'cv' as const };
  }, [savedAnalyses, profile, planTier]);

  // ─── Navigate to tool from next step / insight ─────────────────────────
  const navigateToAction = (action: string) => {
    if (action === 'profile') { navigate('/perfil'); return; }

    const standaloneActionMap: Record<string, string> = {
      cv: getStandaloneToolUrl('/cv-analyser/'),
      linkedin: getStandaloneToolUrl('/linkedin-roaster/'),
      careerPath: getStandaloneToolUrl('/career-path/'),
      careerIntelligence: getStandaloneToolUrl('/career-intelligence/'),
    };

    if (standaloneActionMap[action]) {
      window.location.href = standaloneActionMap[action];
      return;
    }

    setActiveTab('tools');
    const toolKeyMap: Record<string, string> = {
      tools: '',
    };
    const toolKey = toolKeyMap[action] ?? '';
    if (toolKey) {
      setExpandedTool(toolKey);
      setTimeout(() => {
        const el = document.querySelector(`[data-tool-key="${toolKey}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      setTimeout(() => {
        const el = document.querySelector('[data-tool-key]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  // ─── Last activity ─────────────────────────────────────────────────────
  const lastActivity = useMemo(() => {
    if (savedAnalyses.length === 0) return null;
    const latest = savedAnalyses[0]; // already sorted desc
    const diff = Date.now() - new Date(latest.created_at).getTime();
    const days = Math.floor(diff / 86400000);
    let timeStr = '';
    if (days === 0) timeStr = t('member.today');
    else if (days === 1) timeStr = t('member.yesterday');
    else timeStr = t('member.daysAgo').replace('{n}', String(days));
    const typeLabels: Record<string, string> = {
      cv_analyser: t('member.lastCvAnalysis'),
      linkedin_roaster: t('member.lastLinkedinAnalysis'),
    };
    return { label: typeLabels[latest.analysis_type] || t('member.lastActivity'), time: timeStr };
  }, [savedAnalyses, t]);

  // ─── Send Analysis by Email ──────────────────────────────────────────────
  const SEND_EMAIL_URL = `${SUPABASE_URL}/functions/v1/send-analysis-email`;

  const openEmailModal = () => {
    setEmailTo(profile?.email || user?.email || '');
    setEmailSent(false);
    setEmailError(null);
    setEmailModalOpen(true);
  };

  const sendAnalysisEmail = async () => {
    if (!emailTo || !emailTo.includes('@')) {
      setEmailError(t('member.email.invalidEmail'));
      return;
    }
    setEmailSending(true);
    setEmailError(null);
    try {
      const el = document.querySelector('[data-analysis-result]') || document.querySelector('.animate-in.fade-in');
      const htmlContent = el ? el.innerHTML : '<p>Análise não disponível. Acede à tua área de membro para ver o resultado.</p>';
      const toolName = expandedTool || 'Análise';
      const typeMap: Record<string, string> = { cv_analyser: 'CV Analyser', linkedin_roaster: 'LinkedIn Roaster', career_path: 'Career Path', career_intelligence: 'Career Intelligence' };
      const analysisType = typeMap[toolName] || toolName;
      const resp = await fetch(SEND_EMAIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ to_email: emailTo, to_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '', subject: `Share2Inspire — ${analysisType}`, html_content: htmlContent, analysis_type: analysisType }),
      });
      const data = await resp.json();
      if (data.success) { setEmailSent(true); } else { setEmailError(data.error || (t('member.email.errorSend'))); }
    } catch (err: any) {
      setEmailError(err.message || (t('member.email.networkError')));
    } finally {
      setEmailSending(false);
    }
  };

  // ─── Routing: sem subscrição → UpgradePage ─────────────────────────────
  // MUST be after all hooks to respect React's rules of hooks
  const hasActiveSub = subscription && subscription.status === 'active' && new Date(subscription.expires_at) > new Date();
  if (!hasActiveSub) return <UpgradePage />;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#fafaf9]">
      <div className="container max-w-5xl mx-auto px-4">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HEADER — Contextual greeting + plan pills + micro insight          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-3">
            <div>
              <p className="text-gold text-[11px] font-medium tracking-[0.15em] uppercase mb-1">{t('member.title')}</p>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1a1a]">
                {profile?.first_name ? `${t('member.welcome')}, ${profile.first_name}.` : t('member.welcome')}
              </h1>
              <p className="text-xs text-[#888] mt-1">{t('member.greetingContextual')}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#999] font-light flex-wrap">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                planTier === 'pro' ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                planTier === 'growth' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {planTier === 'pro' ? 'Pro' : planTier === 'growth' ? 'Growth' : 'Essential'}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#e5e5e5] rounded-md">
                <Sparkles className="w-3 h-3 text-gold" />
                <span className="text-[10px] font-medium text-[#666]">{weeklyUsage}/{isProPlan ? '∞' : weeklyLimit}</span>
                <span className="text-[10px] text-[#999]">{t('member.cv.thisWeek')}</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#999]">
                <Clock className="w-3 h-3" />
                {daysLeft}d
              </span>
            </div>
          </div>

          {/* Dynamic contextual insight banner */}
          <button
            onClick={() => navigateToAction(dynamicInsight.action)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gold/8 via-gold/4 to-transparent border border-gold/15 rounded-xl hover:border-gold/30 hover:shadow-sm transition-all group cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <p className="flex-1 text-xs text-[#555] leading-relaxed">{t(dynamicInsight.key)}</p>
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-gold uppercase tracking-wider opacity-80 group-hover:opacity-100 transition-opacity">
              {t('member.insight.action')}
              <ArrowRight className="w-3 h-3" />
            </span>
          </button>
        </div>

        <MemberRotatingBanner lang={lang} />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CAREER PROGRESS (expanded) + NEXT STEP + LAST ACTIVITY            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8 p-5 border border-[#e5e5e5] rounded-xl bg-white shadow-sm">
          {/* Career Progress */}
          <CareerProgress variant="compact" />

          {/* Insights row */}
          <div className="mt-4 pt-4 border-t border-[#f0f0f0] grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Next step recommendation — clickable */}
            <button
              onClick={() => navigateToAction(nextStepSuggestion.action)}
              className="flex items-start gap-3 p-3 bg-[#fafaf9] border border-[#f0f0f0] rounded-lg hover:border-gold/20 hover:bg-gold/3 transition-all group cursor-pointer text-left w-full"
            >
              <span className="text-lg leading-none mt-0.5">{nextStepSuggestion.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gold font-medium uppercase tracking-wider mb-0.5">{t('member.nextStep')}</p>
                <p className="text-[11px] text-[#555] leading-relaxed">{nextStepSuggestion.text}</p>
              </div>
              <div className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                <ArrowRight className="w-3 h-3 text-gold" />
              </div>
            </button>

            {/* Last activity */}
            <div className="flex items-start gap-3 p-3 bg-[#fafaf9] border border-[#f0f0f0] rounded-lg">
              <Clock className="w-4 h-4 text-[#bbb] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#999] font-medium uppercase tracking-wider mb-0.5">{t('member.lastActivity')}</p>
                {lastActivity ? (
                  <p className="text-[11px] text-[#555]">{lastActivity.label}: <span className="font-medium text-[#333]">{lastActivity.time}</span></p>
                ) : (
                  <p className="text-[11px] text-[#999]">{t('dash.noAnalysesYet')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Tab Navigation (NO arrows) ─── */}
        <div className="mb-8">
          <nav className="flex gap-1 bg-[#f5f5f4] p-1 rounded-xl">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              // Lock jobs & content for essential
              const isLocked = (tab.id === 'jobs' || tab.id === 'content') && planTier === 'essential';
              return (
                <button
                  key={tab.id}
                  onClick={() => !isLocked && setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : isLocked
                        ? 'text-[#ccc] cursor-default'
                        : 'text-[#888] hover:text-[#555]'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lang === 'pt' ? tab.labelPt : tab.labelEn}</span>
                  {isLocked && <Lock className="w-3 h-3" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ═══════════════════ TAB: TOOLS ═══════════════════ */}
        {activeTab === 'tools' && (
          <div className="animate-in fade-in duration-300 space-y-3">
            {tools.map((tool) => (
              <div key={tool.key} data-tool-key={tool.key} className="border border-[#e5e5e5] rounded-xl overflow-hidden hover:border-gold/20 transition-all duration-300 bg-white shadow-sm">
                {/* External link tool */}
                {tool.type === 'external' && (
                  <a href={tool.url} className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}><tool.icon className="w-4 h-4 text-[#333]" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">{tool.label}</h3>
                        {tool.badge && tool.badge > 0 && <span className="px-1.5 py-0.5 bg-gold/10 text-gold text-[10px] font-semibold rounded-full">{tool.badge}</span>}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-[#e5e5e5] bg-[#fafaf9] text-[10px] font-medium text-[#777]">
                          {pick('Abrir app', 'Open app', 'Abrir app')}
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="text-[11px] text-[#999] font-light truncate">{tool.desc}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#ccc] group-hover:text-gold/50 transition-colors shrink-0" />
                  </a>
                )}
                {/* Widget trigger */}
                {tool.type === 'widget' && (
                  <button onClick={() => { if (tool.action === 'openCareerBot') window.dispatchEvent(new Event('open-career-bot')); }} className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 w-full text-left">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}><tool.icon className="w-4 h-4 text-[#333]" /></div>
                    <div className="flex-1 min-w-0"><h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">{tool.label}</h3><p className="text-[11px] text-[#999] font-light truncate">{tool.desc}</p></div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#ccc] group-hover:text-gold/50 transition-colors shrink-0" />
                  </button>
                )}
                {/* Locked tool */}
                {tool.type === 'locked' && (
                  <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 opacity-50">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}><tool.icon className="w-4 h-4 text-[#333]" /></div>
                    <div className="flex-1 min-w-0"><h3 className="text-sm font-medium text-[#1a1a1a]">{tool.label}</h3><p className="text-[11px] text-[#999] font-light truncate">{tool.desc}</p></div>
                    <Lock className="w-3.5 h-3.5 text-[#ccc] shrink-0" />
                  </div>
                )}
                {/* Discount tool */}
                {tool.type === 'discount' && (
                  <a href={tool.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}><tool.icon className="w-4 h-4 text-[#333]" /></div>
                      <div className="flex-1 min-w-0"><h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">{tool.label}</h3><p className="text-[11px] text-[#999] font-light truncate">{tool.desc}</p></div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-13 sm:ml-0">
                      {tool.discountOriginal && <span className="text-[10px] text-[#bbb] line-through">{tool.discountOriginal}</span>}
                      <span className="flex items-center gap-1 px-2 py-1 bg-gold/5 border border-gold/20 rounded text-[10px] text-gold font-medium"><Tag className="w-3 h-3" />{tool.discount}</span>
                    </div>
                  </a>
                )}
                {/* Inline expandable tool */}
                {tool.type === 'inline' && (
                  <>
                    <button onClick={() => toggleTool(tool.key)} className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 w-full text-left">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}><tool.icon className="w-4 h-4 text-[#333]" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">{tool.label}</h3>
                          {tool.badge && tool.badge > 0 && <span className="px-1.5 py-0.5 bg-gold/10 text-gold text-[10px] font-semibold rounded-full">{tool.badge}</span>}
                        </div>
                        <p className="text-[11px] text-[#999] font-light truncate">{tool.desc}</p>
                      </div>
                      {tool.action === 'careerPath' && (planTier === 'pro' || planTier === 'growth') && (
                        <span className={`px-2 py-1 rounded text-[10px] font-medium shrink-0 mr-2 ${monthlyCareerPathUsed < (planTier === 'pro' ? 3 : 2) ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>{monthlyCareerPathUsed < (planTier === 'pro' ? 2 : 1) ? `${(planTier === 'pro' ? 2 : 1) - monthlyCareerPathUsed} ${t('member.includedMonth')}` : '3,75€'}</span>
                      )}
                      {tool.action === 'careerIntelligence' && (planTier === 'pro' || planTier === 'growth') && (
                        <span className={`px-2 py-1 rounded text-[10px] font-medium shrink-0 mr-2 ${monthlyCareerIntelUsed < (planTier === 'pro' ? 3 : 2) ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>{monthlyCareerIntelUsed < (planTier === 'pro' ? 2 : 1) ? `${(planTier === 'pro' ? 2 : 1) - monthlyCareerIntelUsed} ${t('member.includedMonth')}` : '6,25€'}</span>
                      )}
                      {expandedTool === tool.key ? <ChevronUp className="w-4 h-4 text-gold shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#ccc] group-hover:text-gold/50 transition-colors shrink-0" />}
                    </button>
                    {expandedTool === tool.key && (
                      <div className="border-t border-[#e5e5e5] p-5 bg-[#fafaf9]">
                        {renderInlinePanel(tool)}

                        {/* Mini-cards for previous analyses */}
                        {['cvAnalyzer', 'linkedinRoster', 'careerPath', 'careerIntelligence'].includes(tool.key) && (
                          <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CalendarClock className="w-3.5 h-3.5 text-[#999]" />
                              <span className="text-[10px] font-semibold text-[#999] uppercase tracking-wider">{t('member.analyses.previous')}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(() => {
                                const typeMap: Record<string, string> = {
                                  cvAnalyzer: 'cv_analyser',
                                  linkedinRoster: 'linkedin_roaster',
                                  careerPath: 'career_path',
                                  careerIntelligence: 'career_intelligence'
                                };
                                const type = typeMap[tool.key];
                                const analyses = savedAnalyses.filter(a => a.analysis_type === type).slice(0, 4);
                                
                                if (analyses.length === 0) return <p className="text-[10px] text-[#bbb] italic">{t('member.lib.empty')}</p>;
                                
                                return analyses.map(analysis => (
                                  <button
                                    key={analysis.id}
                                    onClick={() => setViewingAnalysis(analysis)}
                                    className="flex items-center justify-between p-3 bg-white border border-[#e5e5e5] rounded-lg hover:border-gold/30 hover:shadow-sm transition-all group/card"
                                  >
                                    <div className="flex flex-col items-start min-w-0">
                                      <span className="text-[10px] font-medium text-[#1a1a1a] truncate w-full">{getAnalysisSummary(analysis) || t('member.lastActivity')}</span>
                                      <span className="text-[9px] text-[#999]">{formatDate(analysis.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-medium text-gold opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
                                      <span>{t('member.analyses.viewReport')}</span>
                                      <ArrowRight className="w-2.5 h-2.5" />
                                    </div>
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        )}

                        {analysisError && (<div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-4"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{analysisError}</span></div>)}
                        {analysisResult && (
                          analysisResult._enriched ? (
                            <div className="mt-4 border border-gold/20 rounded-lg bg-[#fafaf9] p-4 animate-in fade-in duration-500">
                              <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /><h4 className="text-sm font-semibold text-[#1a1a1a]">{t('member.cv.analysisComplete')}</h4></div><button onClick={() => setAnalysisResult(null)} className="text-xs text-[#999] hover:text-[#1a1a1a] transition-colors">{t('member.lib.close')}</button></div>
                              <div data-analysis-result="true">
                                <AnalysisResultsFull data={analysisResult._enriched} isPaid={true} />
                              </div>
                              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gold/10">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 font-medium"><CheckCircle className="w-3.5 h-3.5" />{t('member.lib.savedToLib')}</div>
                                <button onClick={() => { const el = document.querySelector('[data-analysis-result]'); if (el) { const printWin = window.open('', '_blank'); if (printWin) { printWin.document.write('<html><head><title>An\u00e1lise Share2Inspire</title><style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:800px;margin:0 auto;color:#1a1a1a}h1,h2,h3,h4,h5{margin-top:1.5rem}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}</style></head><body>' + el.innerHTML + '</body></html>'); printWin.document.close(); printWin.print(); } } }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded text-xs text-gold font-medium hover:bg-gold/20 transition-colors"><Download className="w-3.5 h-3.5" />{t('member.lib.print')}</button>
                                <button onClick={openEmailModal} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-xs text-[#666] font-medium hover:border-gold/30 hover:text-gold transition-colors"><Send className="w-3.5 h-3.5" />{t('member.lib.sendByEmail')}</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div data-analysis-result="true">
                                <AnalysisResult data={analysisResult} onClose={() => setAnalysisResult(null)} lang={lang} />
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 font-medium"><CheckCircle className="w-3.5 h-3.5" />{t('member.lib.savedToLib')}</div>
                                <button onClick={() => { const el = document.querySelector('[data-analysis-result]'); if (el) { const printWin = window.open('', '_blank'); if (printWin) { printWin.document.write('<html><head><title>An\u00e1lise Share2Inspire</title><style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:800px;margin:0 auto;color:#1a1a1a}h1,h2,h3,h4,h5{margin-top:1.5rem}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}</style></head><body>' + el.innerHTML + '</body></html>'); printWin.document.close(); printWin.print(); } } }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded text-xs text-gold font-medium hover:bg-gold/20 transition-colors"><Download className="w-3.5 h-3.5" />{t('member.lib.print')}</button>
                                <button onClick={openEmailModal} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-xs text-[#666] font-medium hover:border-gold/30 hover:text-gold transition-colors"><Send className="w-3.5 h-3.5" />{t('member.lib.sendByEmail')}</button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════ TAB: ANALYSES ═══════════════════ */}
        {activeTab === 'analyses' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#1a1a1a]">{t('member.lib.title')}</h2>
                <span className="text-[10px] text-[#999] bg-[#f5f5f4] px-2 py-0.5 rounded-full">{savedAnalyses.length}</span>
              </div>
              <button
                onClick={() => { setLoadingSaved(true); supabase.from('user_analyses').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100).then(({ data }) => { setSavedAnalyses(data as SavedAnalysis[] || []); setLoadingSaved(false); }); }}
                className="flex items-center gap-1 text-[10px] text-[#999] hover:text-gold transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> {t('member.lib.refresh')}
              </button>
            </div>

            {loadingSaved ? (
              <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin text-gold mx-auto" /><p className="text-xs text-[#999] mt-2">{t('dash.loadingAnalyses')}</p></div>
            ) : savedAnalyses.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#e5e5e5] rounded-xl bg-[#fafaf9]">
                <FileSearch className="w-10 h-10 text-[#ddd] mx-auto mb-3" />
                <p className="text-sm text-[#999] mb-1">{t('dash.noAnalysesYet')}</p>
                <p className="text-xs text-[#bbb] mb-4">{t('member.lib.empty')}</p>
                <button onClick={() => setActiveTab('tools')} className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline font-medium">
                  <Wrench className="w-3 h-3" /> {t('member.lib.goToTools')}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedAnalyses).map(([type, items]) => {
                  const config = TOOL_CONFIG[type] || { label: type, icon: FileText, color: 'text-[#999]', bgColor: 'bg-[#f5f5f4]', borderColor: 'border-[#e5e5e5]' };
                  const ToolIcon = config.icon;
                  const isExpanded = expandedAnalysisType === type;
                  const latest = items[0]; // Most recent
                  const rest = items.slice(1);

                  return (
                    <div key={type} className="border border-[#e5e5e5] rounded-xl bg-white shadow-sm overflow-hidden">
                      {/* Type header */}
                      <div className="flex items-center gap-3 p-4 border-b border-[#f0f0f0]">
                        <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                          <ToolIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <span className="text-sm font-semibold text-[#1a1a1a]">{config.label}</span>
                        <span className="text-[10px] text-[#999] bg-[#f5f5f4] px-2 py-0.5 rounded-full">{items.length}</span>
                      </div>

                      {/* Latest analysis — highlighted */}
                      <div className="p-4 bg-gradient-to-r from-[#fafaf9] to-white">
                        <div className="flex items-center gap-1.5 text-[10px] text-gold font-medium uppercase tracking-wider mb-2">
                          <Sparkles className="w-3 h-3" />
                          {t('member.lib.latestAnalysis')}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {getAnalysisSummary(latest) && <p className="text-sm font-medium text-[#1a1a1a] mb-1">{getAnalysisSummary(latest)}</p>}
                            <div className="flex items-center gap-1.5 text-[10px] text-[#999]"><Clock className="w-3 h-3" />{formatDate(latest.created_at)}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button onClick={() => setViewingAnalysis(latest)} className="flex items-center gap-1 text-[11px] text-gold hover:text-[#b8960c] font-medium transition-colors">
                              <ArrowRight className="w-3 h-3" />{t('member.lib.viewResult')}
                            </button>
                            <button onClick={() => handleDeleteAnalysis(latest.id)} disabled={deletingId === latest.id} className="text-[#ddd] hover:text-red-400 transition-colors">
                              {deletingId === latest.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Older analyses — collapsible */}
                      {rest.length > 0 && (
                        <>
                          <button onClick={() => setExpandedAnalysisType(isExpanded ? null : type)} className="w-full flex items-center justify-between px-4 py-2.5 border-t border-[#f0f0f0] text-[11px] text-[#888] hover:text-gold hover:bg-[#fafaf9] transition-all">
                            <span>{isExpanded ? t('member.lib.hideOlder') : t(rest.length > 1 ? 'member.lib.showMorePlural' : 'member.lib.showMoreSingular').replace('{count}', String(rest.length))}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {isExpanded && (
                            <div className="border-t border-[#f0f0f0]">
                              {rest.map((sa) => (
                                <div key={sa.id} className="flex items-center justify-between px-4 py-3 border-b border-[#f5f5f4] last:border-b-0 hover:bg-[#fafaf9] transition-colors group">
                                  <div className="flex-1 min-w-0">
                                    {getAnalysisSummary(sa) && <p className="text-xs font-medium text-[#1a1a1a] mb-0.5">{getAnalysisSummary(sa)}</p>}
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#999]"><Clock className="w-3 h-3" />{formatDate(sa.created_at)}</div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-3">
                                    <button onClick={() => setViewingAnalysis(sa)} className="flex items-center gap-1 text-[10px] text-gold hover:text-[#b8960c] font-medium transition-colors opacity-0 group-hover:opacity-100">
                                      <ArrowRight className="w-3 h-3" />{t('member.lib.view')}
                                    </button>
                                    <button onClick={() => handleDeleteAnalysis(sa.id)} disabled={deletingId === sa.id} className="text-[#ddd] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                      {deletingId === sa.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════ TAB: JOBS ═══════════════════ */}
        {activeTab === 'jobs' && (
          <div className="animate-in fade-in duration-300 space-y-8">
            {/* ── Saved Jobs Tracker (extensão + manual) ── */}
            <SavedJobsTracker lang={lang} />

            {/* ── Job Contacts / Networking CRM ── */}
            <JobContacts lang={lang} />

            {/* ── Job Feed (Adzuna) ── */}
            {planTier !== 'essential' ? (
              <VagasFeed lang={lang} countryCode={selectedCountryData?.code || 'PT'} countryName={cpCountry} region={cpRegion || undefined} />
            ) : (
              <section className="p-8 border border-dashed border-[#e5e5e5] rounded-xl bg-[#fafaf9] text-center">
                <Lock className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
                <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">{t('member.jobs.feedTitle')}</h3>
                <p className="text-xs text-[#999] font-light mb-4 max-w-sm mx-auto">{t('member.lockedVagas')}</p>
                <Link href="/planos" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold/10 border border-gold/20 text-gold text-xs font-medium rounded-lg hover:bg-gold/20 transition-all"><Sparkles className="w-3.5 h-3.5" />{t('member.upgradeCta')}</Link>
              </section>
            )}
          </div>
        )}

        {/* ═══════════════════ TAB: CONTENT ═══════════════════ */}
        {activeTab === 'content' && (
          <div className="animate-in fade-in duration-300">
            {planTier === 'essential' ? (
              <section className="p-8 border border-dashed border-[#e5e5e5] rounded-xl bg-[#fafaf9] text-center">
                <Lock className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
                <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">{t('member.content')}</h3>
                <p className="text-xs text-[#999] font-light mb-4 max-w-sm mx-auto">{t('member.lockedContent')}</p>
                <Link href="/planos" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold/10 border border-gold/20 text-gold text-xs font-medium rounded-lg hover:bg-gold/20 transition-all"><Sparkles className="w-3.5 h-3.5" />{t('member.upgradeCta')}</Link>
              </section>
            ) : (
              <section>
                <h2 className="text-sm font-semibold text-[#1a1a1a] mb-1">{t('member.content')}</h2>
                <p className="text-xs text-[#999] font-light mb-6">{t('member.contentDesc')}</p>

                {/* AI Templates */}
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { icon: FileText, color: 'from-gold/20 to-gold/5', event: 'open-career-bot-cover-letter', title: t('member.coverLetter'), desc: t('member.coverLetterDesc'), cta: t('member.generate'), ctaIcon: 'bot' },
                    { icon: Mail, color: 'from-blue-500/15 to-blue-500/5', event: 'open-career-bot-networking-email', title: t('member.networkingEmail'), desc: t('member.networkingEmailDesc'), cta: t('member.generate'), ctaIcon: 'bot' },
                    { icon: Megaphone, color: 'from-sky-500/15 to-sky-500/5', event: 'open-career-bot-linkedin-post', title: t('member.linkedinPost'), desc: t('member.linkedinPostDesc'), cta: t('member.generate'), ctaIcon: 'bot' },
                    { icon: Linkedin, color: 'from-[#0A66C2]/15 to-[#0A66C2]/5', event: 'open-headline-generator', title: t('member.linkedinHeadline'), desc: t('member.linkedinHeadlineDesc'), cta: t('member.generateHeadlines'), ctaIcon: 'sparkle' },
                  ].map((tpl) => (
                    <div key={tpl.event} className="p-4 border border-[#e5e5e5] rounded-xl hover:border-gold/30 transition-all group flex flex-col h-full bg-white shadow-sm">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tpl.color} flex items-center justify-center mb-3`}><tpl.icon className="w-4.5 h-4.5 text-[#333]" /></div>
                      <h3 className="text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1 group-hover:text-gold transition-colors">{tpl.title}</h3>
                      <p className="text-[10px] sm:text-[11px] text-[#999] font-light leading-relaxed mb-3 line-clamp-2 flex-1">{tpl.desc}</p>
                      <button onClick={() => window.dispatchEvent(new Event(tpl.event))} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 mt-auto" style={{ background: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)' }}>
                        {tpl.ctaIcon === 'sparkle' ? <Sparkles className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}{tpl.cta}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex gap-2 flex-wrap">
                    {contentTypes.map((type) => (
                      <button key={type} onClick={() => setFilter(type)} className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-300 ${filter === type ? 'bg-gold/10 border border-gold/20 text-gold font-medium' : 'border border-[#e5e5e5] text-[#888] hover:text-[#1a1a1a]/60 hover:border-[#ddd]'}`}>{filterLabels[type]}</button>
                    ))}
                  </div>
                  <div className="relative w-full sm:w-auto sm:ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('member.search')} className="pl-8 pr-3 py-2 bg-[#f7f7f6] border border-[#e5e5e5] rounded-lg text-xs text-[#1a1a1a] placeholder-[#aaa] focus:border-gold/30 focus:outline-none transition-colors w-full sm:w-56" />
                  </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                  <div className="py-20 text-center"><div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" /></div>
                ) : filtered.length === 0 ? (
                  <div className="py-20 text-center"><BookOpen className="w-8 h-8 text-[#ccc] mx-auto mb-3" /><p className="text-sm text-[#999] font-light">{t('member.noContent')}</p></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((item) => {
                      const isVideo = item.content_type === 'video';
                      const isPodcast = item.content_type === 'podcast';
                      const youtubeId = isVideo && item.file_url ? getYouTubeId(item.file_url) : null;

                      if (isPodcast) {
                        return (
                          <div key={item.id} className="border border-[#e5e5e5] rounded-xl overflow-hidden col-span-1 sm:col-span-2 lg:col-span-3 bg-white shadow-sm">
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-3"><span className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[10px] text-[#999] uppercase tracking-wider flex items-center gap-1"><Headphones className="w-3 h-3" />podcast</span></div>
                              <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">{item.title}</h3>
                              <p className="text-[11px] text-[#999] font-light leading-relaxed mb-3">{item.description}</p>
                              <iframe style={{ borderRadius: '12px' }} src={item.file_url} width="100%" height="352" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
                            </div>
                          </div>
                        );
                      }

                      if (isVideo && youtubeId) {
                        return (
                          <div key={item.id} className="border border-[#e5e5e5] rounded-xl overflow-hidden hover:border-gold/20 transition-all duration-500 bg-white shadow-sm">
                            <div className="aspect-video bg-black"><iframe src={`https://www.youtube.com/embed/${youtubeId}`} title={item.title} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
                            <div className="p-4"><div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[10px] text-[#999] uppercase tracking-wider flex items-center gap-1"><Play className="w-3 h-3" />video</span></div><h3 className="text-sm font-medium text-[#1a1a1a] mb-1">{item.title}</h3><p className="text-[11px] text-[#999] font-light line-clamp-2 leading-relaxed">{item.description}</p></div>
                          </div>
                        );
                      }

                      return (
                        <a key={item.id} href={item.file_url} target="_blank" rel="noopener noreferrer" className="group border border-[#e5e5e5] rounded-xl overflow-hidden hover:border-gold/20 transition-all duration-500 bg-white shadow-sm">
                          {item.thumbnail_url && (<div className="aspect-[16/9] bg-white/[0.02] overflow-hidden"><img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" /></div>)}
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[10px] text-[#999] uppercase tracking-wider">{item.content_type}</span></div>
                            <h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors mb-1">{item.title}</h3>
                            <p className="text-[11px] text-[#999] font-light line-clamp-2 leading-relaxed">{item.description}</p>
                            <div className="mt-3 flex items-center gap-1 text-[11px] text-gold/50 group-hover:text-gold transition-colors"><span>{t('member.access')}</span><ArrowRight className="w-3 h-3" /></div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

      </div>

      {/* ═══════════════════ ANALYSIS RESULT VIEWER ═══════════════════ */}
      {viewingAnalysis && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto pt-8 pb-8" onClick={() => setViewingAnalysis(null)}>
          <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl border border-[#e5e5e5] animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-[#f0f0f0] bg-white/95 backdrop-blur-sm rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${(TOOL_CONFIG[viewingAnalysis.analysis_type] || { bgColor: 'bg-[#f5f5f4]' }).bgColor} flex items-center justify-center`}>
                  {(() => { const Icon = (TOOL_CONFIG[viewingAnalysis.analysis_type] || { icon: FileSearch }).icon; return <Icon className={`w-4 h-4 ${(TOOL_CONFIG[viewingAnalysis.analysis_type] || { color: 'text-[#999]' }).color}`} />; })()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">{(TOOL_CONFIG[viewingAnalysis.analysis_type] || { label: viewingAnalysis.analysis_type }).label}</h3>
                  <p className="text-[10px] text-[#999]">{formatDate(viewingAnalysis.created_at)}</p>
                </div>
              </div>
              <button onClick={() => setViewingAnalysis(null)} className="px-3 py-1.5 text-xs text-[#999] hover:text-[#1a1a1a] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f4] transition-all">
                {t('member.lib.close')}
              </button>
            </div>
            <div className="p-6">
              {viewingAnalysis.analysis_type === 'cv_analyser' && viewingAnalysis.data?.enriched ? (
                <AnalysisResultsFull data={viewingAnalysis.data.enriched} isPaid={true} />
              ) : (
                <AnalysisDetailRenderer analysisType={viewingAnalysis.analysis_type} data={viewingAnalysis.data} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ EXTRA PAYMENT CONFIRMATION MODAL ═══════════════════ */}
      {pendingExtraRun && !paymentProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setPendingExtraRun(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"><Euro className="w-5 h-5 text-amber-600" /></div>
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a]">{t('member.extra.confirmTitle')}</h3>
                <p className="text-[11px] text-[#999]">{t('member.extra.limitReached')}</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#1a1a1a] font-medium">{pendingExtraRun === 'career_path' ? 'Career Path' : 'Career Intelligence'}</span>
                <span className="text-sm font-bold text-[#1a1a1a]">
                  {pendingExtraRun === 'career_path' ? '3,75€' : '6,25€'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#999]">
                <span>{t('member.extra.normalPrice')}</span>
                <span className="line-through">{pendingExtraRun === 'career_path' ? '19€' : '39€'}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-600">
                <span>{t('member.extra.memberDiscount')}</span>
                <span className="font-medium">
                  {pendingExtraRun === 'career_path' ? (planTier === 'pro' ? '-75%' : '-50%') : (planTier === 'pro' ? '-75%' : '-50%')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setPendingExtraRun(null)} className="flex-1 px-4 py-2.5 text-xs font-medium text-[#666] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f4] transition-colors">{t('member.lib.cancel')}</button>
              <button onClick={() => {
                const type = pendingExtraRun!;
                const isCp = type === 'career_path';
                const price = isCp ? (planTier === 'pro' ? 4.75 : 9.50) : (planTier === 'pro' ? 9.75 : 19.50);
                const origPrice = isCp ? 19 : 39;
                const discount = planTier === 'pro' ? '-75%' : '-50%';
                setPendingExtraRun(null);
                setPaymentProduct({
                  type,
                  label: isCp ? 'Career Path' : 'Career Intelligence',
                  price,
                  originalPrice: origPrice,
                  discountLabel: discount,
                  stripeProductType: isCp
                    ? (planTier === 'pro' ? 'career_path_member_pro' : 'career_path_member_growth')
                    : (planTier === 'pro' ? 'career_intelligence_member_pro' : 'career_intelligence_full'),
                });
              }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-gradient-to-r from-[#1a1a1a] to-[#333] rounded-lg hover:from-[#333] hover:to-[#444] transition-all">
                <Sparkles className="w-3.5 h-3.5" />{t('member.lib.payAndGenerate')}
              </button>
            </div>
          </div>
        </div>
      )}

 {paymentProduct && (
  <ExtraAnalysisPaymentModal
    product={paymentProduct}
    onClose={() => setPaymentProduct(null)}
    onPaymentSuccess={async () => {
      setPaymentProduct(null);
      if (paymentProduct.type === 'career_path') {
        runCareerPath();
      } else if (paymentProduct.type === 'career_intelligence') {
        runCareerIntelligence();
      }
    }}
  />
)}

      {/* ═══════════════════ EMAIL MODAL ═══════════════════ */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEmailModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center"><Mail className="w-5 h-5 text-gold" /></div>
              <div>
                <h3 className="text-sm font-semibold text-[#1a1a1a]">{t('member.email.title')}</h3>
                <p className="text-[11px] text-[#999]">{t('member.email.subtitle')}</p>
              </div>
            </div>
            {emailSent ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#1a1a1a] mb-1">{t('member.email.success')}</p>
                <p className="text-xs text-[#999] mb-4">{`${t('member.email.sentTo')} ${emailTo}`}</p>
                <button onClick={() => setEmailModalOpen(false)} className="px-4 py-2 bg-gold text-white text-xs font-medium rounded-lg hover:bg-gold/90 transition-colors">{t('member.lib.close')}</button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-[#666] mb-1.5">{t('member.email.destLabel')}</label>
                  <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="email@exemplo.com" className="w-full px-3 py-2.5 text-sm border border-[#e5e5e5] rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 bg-[#fafaf9]" />
                </div>
                {emailError && (<div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{emailError}</span></div>)}
                <div className="flex items-center gap-3">
                  <button onClick={() => setEmailModalOpen(false)} className="flex-1 px-4 py-2.5 text-xs font-medium text-[#666] border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f4] transition-colors">{t('member.lib.cancel')}</button>
                  <button onClick={sendAnalysisEmail} disabled={emailSending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-gold rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50">
                    {emailSending ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />{t('member.email.sending')}</>) : (<><Send className="w-3.5 h-3.5" />{t('member.email.send')}</>)}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
