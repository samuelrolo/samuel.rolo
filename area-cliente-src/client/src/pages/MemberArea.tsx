/**
 * MemberArea — Hub central do membro
 * Tabs: Ferramentas · Análises · Vagas · Conteúdos
 * Free users → UpgradePage
 * Subscriber → tabs diferenciados por tier (essential/growth/pro)
 * Análises: última de cada tipo em destaque, restantes colapsáveis
 */
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type MemberContent } from '@/lib/supabase';
import { Link } from 'wouter';
import CareerProgress from '@/components/CareerProgress';
import UpgradePage from './UpgradePage';
import VagasFeed from '@/components/VagasFeed';
import AnalysisResultsFull from '@/components/AnalysisResults';
import { transformGeminiResponse } from '@/lib/analysisTransformer';
import { countries } from '@/lib/countries';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Loader2, Upload, FileText, BarChart3, Linkedin, Bot,
  Sparkles, Route, Lock, ExternalLink, AlertCircle, CheckCircle,
  ChevronDown, ChevronUp, Tag, ArrowRight, Globe, MapPin,
  Search, BookOpen, Play, Headphones, Mail, Megaphone, Briefcase,
  Clock, Trash2, RefreshCw, Compass, FileSearch, Wrench, Download, Send,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
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
  { title: 'AI Career Path: Como a Inteligência Artificial Está a Transformar Carreiras', url: 'https://www.share2inspire.pt/blog/artigos/ai-career-path', desc: 'A inteligência artificial está a redefinir o mercado de trabalho. Descobre como posicionar a tua carreira na era da IA.' },
  { title: 'Entrevista Presencial vs Remota: Guia Completo', url: 'https://www.share2inspire.pt/blog/artigos/entrevista-presencial-vs-remota', desc: 'Dicas práticas para te destacares tanto em entrevistas presenciais como remotas.' },
  { title: 'Como Vencer o Filtro ATS: Guia Definitivo', url: 'https://www.share2inspire.pt/blog/artigos/como-vencer-filtro-ats', desc: '75% dos currículos são rejeitados automaticamente. Aprende a passar nos filtros ATS.' },
  { title: '7 Erros Fatais no CV que Estão a Sabotar a Tua Carreira', url: 'https://www.share2inspire.pt/blog/artigos/7-erros-fatais-cv', desc: 'Os erros mais comuns que impedem o teu CV de chegar às mãos certas.' },
  { title: 'CV vs LinkedIn: Como Alinhar os Dois para Maximizar Oportunidades', url: 'https://www.share2inspire.pt/blog/artigos/cv-vs-linkedin', desc: 'Estratégias para manter consistência entre o teu CV e perfil LinkedIn.' },
  { title: 'LinkedIn para Recrutadores: O Que Eles Realmente Procuram', url: 'https://www.share2inspire.pt/blog/artigos/linkedin-recrutadores', desc: 'Descobre como os recrutadores usam o LinkedIn e otimiza o teu perfil.' },
  { title: 'Posicionamento Profissional: Como Destacar-te no Mercado', url: 'https://www.share2inspire.pt/blog/artigos/posicionamento-profissional', desc: 'Técnicas de posicionamento para te diferenciares da concorrência.' },
  { title: 'Como Negociar Salário: Guia Prático', url: 'https://www.share2inspire.pt/blog/artigos/negociar-salario', desc: 'Estratégias comprovadas para negociar o salário que mereces.' },
  { title: 'Big 4 Recrutamento: Como Entrar nas Maiores Consultoras', url: 'https://www.share2inspire.pt/blog/artigos/big4-recrutamento', desc: 'O guia completo para entrares nas Big 4: Deloitte, PwC, EY e KPMG.' },
  { title: 'Big 4 por Dentro: A Realidade de Trabalhar nas Maiores Consultoras', url: 'https://www.share2inspire.pt/blog/artigos/big4-por-dentro', desc: 'Salários, cultura, progressão e a verdade sobre trabalhar nas Big 4.' },
];

// ─── Analysis Result Display ─────────────────────────────────────────────────
function AnalysisResult({ data, onClose, lang }: { data: any; onClose: () => void; lang: string }) {
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
  const isCareerPath = data?.career_paths || data?.market_analysis || analysis?.career_paths;
  const cpData = isCareerPath ? (data?.career_paths ? data : analysis) : null;
  const isLinkedInFormat = analysis?.candidate_profile || data?.candidate_profile;
  const linkedinData = isLinkedInFormat ? (data?.candidate_profile ? data : analysis) : null;

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
            {lang === 'pt' ? 'Análise concluída' : 'Analysis complete'}
          </h4>
        </div>
        <button onClick={onClose} className="text-xs text-[#999] hover:text-[#1a1a1a] transition-colors">
          {lang === 'pt' ? 'Fechar' : 'Close'}
        </button>
      </div>

      {/* Career Path */}
      {cpData && (
        <div className="space-y-4">
          {cpData.career_paths && Array.isArray(cpData.career_paths) && (
            <div>
              <h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-3">
                {lang === 'pt' ? 'Caminhos de Carreira Sugeridos' : 'Suggested Career Paths'}
              </h5>
              {cpData.career_paths.map((path: any, i: number) => (
                <div key={i} className="mb-3 p-3 bg-white border border-[#e5e5e5] rounded">
                  <h6 className="text-sm font-medium text-[#1a1a1a] mb-1">{path.title || path.role || `Caminho ${i + 1}`}</h6>
                  <p className="text-xs text-[#666] leading-relaxed">{path.description || path.summary}</p>
                  {path.salary_range && <p className="text-xs text-gold mt-1">{path.salary_range}</p>}
                </div>
              ))}
            </div>
          )}
          {cpData.market_analysis && (
            <div>
              <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Análise de Mercado' : 'Market Analysis'}</h5>
              <p className="text-sm text-[#333] leading-relaxed">{typeof cpData.market_analysis === 'string' ? cpData.market_analysis : JSON.stringify(cpData.market_analysis)}</p>
            </div>
          )}
          {cpData.recommendations && Array.isArray(cpData.recommendations) && (
            <div>
              <h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Recomendações' : 'Recommendations'}</h5>
              <ul className="space-y-1">
                {cpData.recommendations.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-amber-500 mt-0.5">→</span><span>{r}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* LinkedIn Roaster */}
      {linkedinData && !cpData && (
        <div className="space-y-4">
          {linkedinData.executive_summary?.global_score && (
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-gold/30 flex items-center justify-center">
                <span className="text-lg font-bold text-gold">{linkedinData.executive_summary.global_score}</span>
              </div>
              <div>
                <p className="text-xs text-[#999]">{lang === 'pt' ? 'Pontuação global' : 'Overall score'}</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{linkedinData.executive_summary.global_score}/100</p>
              </div>
            </div>
          )}
          {linkedinData.candidate_profile && (
            <div>
              <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">{lang === 'pt' ? 'Perfil Detetado' : 'Detected Profile'}</h5>
              <div className="grid grid-cols-2 gap-2">
                {linkedinData.candidate_profile.detected_name && linkedinData.candidate_profile.detected_name !== 'N/A' && (
                  <div className="p-2 bg-white border border-[#e5e5e5] rounded"><p className="text-[10px] text-[#999] uppercase">{lang === 'pt' ? 'Nome' : 'Name'}</p><p className="text-xs font-medium text-[#1a1a1a]">{linkedinData.candidate_profile.detected_name}</p></div>
                )}
                {linkedinData.candidate_profile.detected_role && linkedinData.candidate_profile.detected_role !== 'N/A' && (
                  <div className="p-2 bg-white border border-[#e5e5e5] rounded"><p className="text-[10px] text-[#999] uppercase">{lang === 'pt' ? 'Função' : 'Role'}</p><p className="text-xs font-medium text-[#1a1a1a]">{linkedinData.candidate_profile.detected_role}</p></div>
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
                  <h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Pontos Fortes' : 'Strengths'}</h5>
                  <ul className="space-y-1">{linkedinData.global_summary.strengths.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-emerald-500 mt-0.5">+</span><span>{s}</span></li>))}</ul>
                </div>
              )}
              {(linkedinData.global_summary.improvements || linkedinData.global_summary.gaps || []).length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Áreas a Melhorar' : 'Areas to Improve'}</h5>
                  <ul className="space-y-1">{(linkedinData.global_summary.improvements || linkedinData.global_summary.gaps || []).map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-amber-500 mt-0.5">!</span><span>{s}</span></li>))}</ul>
                </div>
              )}
              {linkedinData.global_summary.recommendations && linkedinData.global_summary.recommendations.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Recomendações' : 'Recommendations'}</h5>
                  <ul className="space-y-1">{linkedinData.global_summary.recommendations.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span><span>{s}</span></li>))}</ul>
                </div>
              )}
            </div>
          )}
          {linkedinData.priority_recommendations?.immediate_adjustments && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">{lang === 'pt' ? 'Ajustes Prioritários' : 'Priority Adjustments'}</h5>
              <p className="text-sm text-[#333] leading-relaxed">{linkedinData.priority_recommendations.immediate_adjustments}</p>
            </div>
          )}
          {linkedinData.cv_problems && linkedinData.cv_problems.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-red-700 uppercase tracking-wider mb-3">{lang === 'pt' ? 'Problemas Identificados' : 'Identified Issues'}</h5>
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
                        <p className="text-[10px] text-emerald-700 uppercase font-medium mb-1">{lang === 'pt' ? 'Sugestão de melhoria' : 'Improvement suggestion'}</p>
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
              <div><p className="text-xs text-[#999]">{lang === 'pt' ? 'Pontuação global' : 'Overall score'}</p><p className="text-sm font-medium text-[#1a1a1a]">{nScore}/100</p></div>
            </div>
          )}
          {nSummary && (<div className="mb-4"><h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">{lang === 'pt' ? 'Resumo' : 'Summary'}</h5><p className="text-sm text-[#333] leading-relaxed">{nSummary}</p></div>)}
          {nKeywords.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">{lang === 'pt' ? 'Competências-chave' : 'Key Skills'}</h5>
              <div className="flex flex-wrap gap-1.5">
                {nKeywords.map((kw: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-gold/5 border border-gold/20 rounded-full text-[11px] text-[#666] font-medium">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {nStrengths.length > 0 && (<div className="mb-4"><h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Pontos Fortes' : 'Strengths'}</h5><ul className="space-y-1">{nStrengths.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-emerald-500 mt-0.5">+</span><span>{s}</span></li>))}</ul></div>)}
          {nImprovements.length > 0 && (<div className="mb-4"><h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'A melhorar' : 'To improve'}</h5><ul className="space-y-1">{nImprovements.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-amber-500 mt-0.5">!</span><span>{s}</span></li>))}</ul></div>)}
          {nRecommendations.length > 0 && (<div><h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">{lang === 'pt' ? 'Recomendações' : 'Recommendations'}</h5><ul className="space-y-1">{nRecommendations.map((s: string, i: number) => (<li key={i} className="text-sm text-[#333] flex items-start gap-2"><span className="text-blue-500 mt-0.5">→</span><span>{s}</span></li>))}</ul></div>)}
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
  const { t, lang } = useI18n();
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

  // Tab navigation
  const [activeTab, setActiveTab] = useState<TabId>('tools');

  // Saved analyses states
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [expandedAnalysisType, setExpandedAnalysisType] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState<SavedAnalysis | null>(null);

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
    if (text.trim().length < 50 && isPdf) {
      const base64 = await toBase64(file);
      return { text, base64, filename: file.name };
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
      try { const { data } = await supabase.storage.from('user-cvs').download(storagePath); if (data) blob = data; } catch (e) { console.warn('[CV] Storage download failed:', e); }
      if (!blob && profile.cv_url.startsWith('http')) { try { const resp = await fetch(profile.cv_url); if (resp.ok) blob = await resp.blob(); } catch (e) { console.warn('[CV] Direct fetch failed:', e); } }
      if (blob) {
        const isPdf = profile.cv_url.toLowerCase().endsWith('.pdf') || blob.type === 'application/pdf';
        let text = '';
        if (isPdf) { try { const ab = await blob.arrayBuffer(); text = await extractPdfText(ab); } catch (e) { console.warn('[CV] Profile PDF extraction failed:', e); } } else { text = await blob.text(); }
        if (text.trim().length < 50 && isPdf) { const base64 = await toBase64(blob); return { text, base64, filename: profile.cv_url.split('/').pop() || 'cv.pdf' }; }
        return { text: text.substring(0, 8000) };
      }
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
    if (cvData.text.trim().length < 50 && cvData.base64) { body.file = cvData.base64; body.filename = cvData.filename; } else { body.cv_text = cvData.text.substring(0, 8000); }
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
    if (weeklyUsage >= weeklyLimit) { setAnalysisError(lang === 'pt' ? 'Atingiste o limite semanal de análises do teu plano.' : 'You have reached your weekly analysis limit.'); return; }
    setAnalyzing(true); setAnalysisError(null); setAnalysisResult(null);
    try {
      const cvData = await getCvData();
      if (!cvData || (cvData.text.trim().length < 50 && !cvData.base64)) { setAnalysisError(lang === 'pt' ? 'Não foi possível ler o CV. Carrega um ficheiro ou atualiza o teu CV no perfil.' : 'Could not read CV.'); setAnalyzing(false); return; }
      const body = buildCvRequestBody(cvData, 'cv_extraction');
      const result = await fetchWithRetry(body);
      const rawAnalysis = result?.analysis || result;
      const enriched = transformGeminiResponse(rawAnalysis);
      setAnalysisResult({ ...result, _enriched: enriched });
      await supabase.from('user_analyses').insert({ user_id: user.id, analysis_type: 'cv_analyser', data: { source: 'member_area', plan: subscription.plan, tier: planTier, captured_at: new Date().toISOString(), email: profile?.email, analysis: rawAnalysis, enriched } });
      setWeeklyUsage(prev => prev + 1);
    } catch (err: any) { setAnalysisError(err.name === 'AbortError' ? (lang === 'pt' ? 'A análise demorou demasiado.' : 'Analysis took too long.') : (err.message || 'Erro inesperado.')); }
    finally { setAnalyzing(false); }
  }, [user?.id, subscription, weeklyUsage, weeklyLimit, planTier, lang, getCvData, fetchWithRetry]);

  const runLinkedinAnalysis = useCallback(async () => {
    if (!user?.id || !subscription) return;
    if (weeklyUsage >= weeklyLimit) { setAnalysisError(lang === 'pt' ? 'Atingiste o limite semanal de análises do teu plano.' : 'You have reached your weekly analysis limit.'); return; }
    const linkedinUrl = profile?.linkedin_url;
    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) { setAnalysisError(lang === 'pt' ? 'Adiciona o teu perfil LinkedIn nas definições do perfil.' : 'Add your LinkedIn profile URL.'); return; }
    setAnalyzing(true); setAnalysisError(null); setAnalysisResult(null);
    try {
      const cvData = await getCvData();
      const body: any = { mode: 'cv_extraction', linkedin_url: linkedinUrl, language: lang };
      if (cvData && (cvData.text.trim().length >= 50 || cvData.base64)) { if (cvData.text.trim().length < 50 && cvData.base64) { body.file = cvData.base64; body.filename = cvData.filename; } else { body.cv_text = cvData.text.substring(0, 8000); } }
      const result = await fetchWithRetry(body);
      setAnalysisResult(result);
      await supabase.from('user_analyses').insert({ user_id: user.id, analysis_type: 'linkedin_roaster', data: { source: 'member_area', plan: subscription.plan, tier: planTier, linkedin_url: linkedinUrl, captured_at: new Date().toISOString(), email: profile?.email, analysis: result } });
      setWeeklyUsage(prev => prev + 1);
    } catch (err: any) { setAnalysisError(err.name === 'AbortError' ? (lang === 'pt' ? 'A análise demorou demasiado.' : 'Analysis took too long.') : (err.message || 'Erro inesperado.')); }
    finally { setAnalyzing(false); }
  }, [user?.id, subscription, weeklyUsage, weeklyLimit, planTier, lang, profile, getCvData, fetchWithRetry]);

  const runCareerPath = useCallback(async () => {
    if (!user?.id || !subscription) return;
    const limit = planTier === 'pro' ? 3 : planTier === 'growth' ? 2 : 0;
    if (monthlyCareerPathUsed >= limit) { setAnalysisError(lang === 'pt' ? `Atingiste o limite mensal de Career Path (${limit}/mês).` : `Monthly Career Path limit reached.`); return; }
    setAnalyzing(true); setAnalysisError(null); setAnalysisResult(null);
    try {
      const cvData = await getCvData();
      if (!cvData || (cvData.text.trim().length < 50 && !cvData.base64)) { setAnalysisError(lang === 'pt' ? 'Não foi possível ler o CV.' : 'Could not read CV.'); setAnalyzing(false); return; }
      const extractionBody = buildCvRequestBody(cvData, 'cv_extraction');
      const extractionResult = await fetchWithRetry(extractionBody);
      const analysisSource = extractionResult.analysis || extractionResult;
      const cvText = (analysisSource.raw_text || cvData.text).substring(0, 8000);
      const linkedinForCp = cpLinkedinUrl.trim() || profile?.linkedin_url || '';
      const careerPathBody: any = { mode: 'career_path', cv_text: cvText, cv_analysis: JSON.stringify(analysisSource), linkedin_url: linkedinForCp, country: cpCountry, region: cpRegion, language: lang };
      const result = await fetchWithRetry(careerPathBody);
      setAnalysisResult(result);
      await supabase.from('user_analyses').insert({ user_id: user.id, analysis_type: 'career_path', data: { source: 'member_area_pro', plan: subscription.plan, tier: planTier, country: cpCountry, region: cpRegion, captured_at: new Date().toISOString(), email: profile?.email, analysis: result } });
      setMonthlyCareerPathUsed(prev => prev + 1);
    } catch (err: any) { setAnalysisError(err.name === 'AbortError' ? (lang === 'pt' ? 'A análise demorou demasiado.' : 'Analysis took too long.') : (err.message || 'Erro inesperado.')); }
    finally { setAnalyzing(false); }
  }, [user?.id, subscription, planTier, monthlyCareerPathUsed, profile, cpCountry, cpRegion, lang, getCvData, fetchWithRetry]);

  const runCareerIntelligence = useCallback(async () => {
    if (!user?.id || !subscription) return;
    const limit = planTier === 'pro' ? 3 : planTier === 'growth' ? 2 : 0;
    if (monthlyCareerIntelUsed >= limit) { setAnalysisError(lang === 'pt' ? `Atingiste o limite mensal de Career Intelligence (${limit}/mês).` : `Monthly Career Intelligence limit reached.`); return; }
    setAnalyzing(true); setAnalysisError(null); setAnalysisResult(null);
    try {
      const cvData = await getCvData();
      if (!cvData || (cvData.text.trim().length < 50 && !cvData.base64)) { setAnalysisError(lang === 'pt' ? 'Não foi possível ler o CV.' : 'Could not read CV.'); setAnalyzing(false); return; }
      const extractionBody = buildCvRequestBody(cvData, 'cv_extraction');
      const extractionResult = await fetchWithRetry(extractionBody);
      const analysisSource = extractionResult.analysis || extractionResult;
      const cvText = (analysisSource.raw_text || cvData.text).substring(0, 8000);
      const linkedinForCi = cpLinkedinUrl.trim() || profile?.linkedin_url || '';
      const ciBody: any = { mode: 'career_path', cv_text: cvText, cv_analysis: JSON.stringify(analysisSource), linkedin_url: linkedinForCi, country: cpCountry, region: cpRegion, language: lang };
      const result = await fetchWithRetry(ciBody);
      setAnalysisResult(result);
      await supabase.from('user_analyses').insert({ user_id: user.id, analysis_type: 'career_intelligence', data: { source: 'member_area_pro', plan: subscription.plan, tier: planTier, country: cpCountry, region: cpRegion, captured_at: new Date().toISOString(), email: profile?.email, analysis: result } });
      setMonthlyCareerIntelUsed(prev => prev + 1);
    } catch (err: any) { setAnalysisError(err.name === 'AbortError' ? (lang === 'pt' ? 'A análise demorou demasiado.' : 'Analysis took too long.') : (err.message || 'Erro inesperado.')); }
    finally { setAnalyzing(false); }
  }, [user?.id, subscription, planTier, monthlyCareerIntelUsed, profile, cpCountry, cpRegion, lang, getCvData, fetchWithRetry]);

  // ─── Toggle tool panel ──────────────────────────────────────────────────
  const toggleTool = (key: string) => {
    if (expandedTool === key) { setExpandedTool(null); setAnalysisResult(null); setAnalysisError(null); setCvFile(null); }
    else { setExpandedTool(key); setAnalysisResult(null); setAnalysisError(null); setCvFile(null); setTimeout(() => { const el = document.querySelector(`[data-tool-key="${key}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }
  };

  // ─── Tool definitions ───────────────────────────────────────────────────
  type ToolDef = { key: string; icon: any; color: string; type: 'external' | 'inline' | 'locked' | 'discount' | 'widget'; action?: string; url?: string; discount?: string | null; discountOriginal?: string | null; label: string; desc: string; badge?: number };

  const tools: ToolDef[] = [
    { key: 'cvMaker', icon: FileText, color: 'from-gold/20 to-gold/5', type: 'external', url: 'https://share2inspire.pt/cv-builder/', label: 'CV Maker', desc: lang === 'pt' ? 'Cria CVs profissionais com templates otimizados' : 'Create professional CVs with optimized templates' },
    { key: 'cvAnalyzer', icon: BarChart3, color: 'from-blue-500/15 to-blue-500/5', type: 'inline', action: 'cv', label: 'CV Analyser', desc: lang === 'pt' ? 'Análise completa e detalhada do teu CV com IA' : 'Complete AI-powered analysis of your CV', badge: savedAnalyses.filter(a => a.analysis_type === 'cv_analyser').length || undefined },
    { key: 'linkedinRoster', icon: Linkedin, color: 'from-sky-500/15 to-sky-500/5', type: 'inline', action: 'linkedin', label: 'LinkedIn Roaster', desc: lang === 'pt' ? 'Otimiza o teu perfil LinkedIn com feedback IA' : 'Optimize your LinkedIn profile with AI feedback', badge: savedAnalyses.filter(a => a.analysis_type === 'linkedin_roaster').length || undefined },
    { key: 'careerBot', icon: Bot, color: 'from-purple-500/15 to-purple-500/5', type: 'widget', action: 'openCareerBot', label: 'Career Advisory', desc: lang === 'pt' ? 'Assistente pessoal de carreira com IA' : 'Personal AI career assistant' },
    { key: 'careerPath', icon: Route, color: 'from-emerald-500/15 to-emerald-500/5', type: planTier === 'pro' ? 'inline' : planTier === 'growth' ? 'inline' : 'locked', action: 'careerPath', url: 'https://share2inspire.pt/career-path/', discount: planTier === 'growth' ? '9,50€' : planTier === 'pro' ? '4,75€' : null, discountOriginal: (planTier === 'growth' || planTier === 'pro') ? '19€' : null, label: 'Career Path', desc: lang === 'pt' ? 'Planeamento estratégico da tua carreira' : 'Strategic career planning', badge: savedAnalyses.filter(a => a.analysis_type === 'career_path').length || undefined },
    { key: 'careerIntelligence', icon: Sparkles, color: 'from-violet-500/15 to-violet-500/5', type: (planTier === 'pro' || planTier === 'growth') ? 'inline' : 'locked', action: 'careerIntelligence', url: 'https://share2inspire.pt/career-intelligence/', discount: planTier === 'growth' ? '19,50€' : planTier === 'pro' ? '9,75€' : null, discountOriginal: (planTier === 'growth' || planTier === 'pro') ? '39€' : null, label: 'Career Intelligence', desc: lang === 'pt' ? 'Análise avançada de mercado e posicionamento' : 'Advanced market analysis and positioning', badge: savedAnalyses.filter(a => a.analysis_type === 'career_intelligence').length || undefined },
  ];

  const remainingAnalyses = Math.max(0, weeklyLimit - weeklyUsage);

  // ─── Render inline panel content ────────────────────────────────────────
  const renderInlinePanel = (tool: ToolDef) => {
    if (tool.action === 'cv') {
      return (
        <div className="space-y-4">
          <div>
            {profile?.cv_url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'CV do perfil será utilizado' : 'Profile CV will be used'}: {profile.cv_filename || 'CV'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'Sem CV no perfil. Carrega um ficheiro abaixo.' : 'No CV in profile. Upload a file below.'}</span>
              </div>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#ccc] rounded text-xs text-[#666] hover:border-gold/40 hover:text-gold transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {cvFile ? cvFile.name : (lang === 'pt' ? 'Ou carrega outro CV (PDF, DOCX, TXT)' : 'Or upload another CV')}
            </button>
          </div>
          <button onClick={runCvAnalysis} disabled={analyzing || (!profile?.cv_url && !cvFile) || (weeklyUsage >= weeklyLimit)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-sm font-medium rounded-lg hover:from-[#333] hover:to-[#444] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            {analyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />{lang === 'pt' ? 'A analisar...' : 'Analyzing...'}</>) : (<><BarChart3 className="w-4 h-4" />{lang === 'pt' ? 'Executar análise de CV' : 'Run CV analysis'}</>)}
          </button>
        </div>
      );
    }

    if (tool.action === 'linkedin') {
      return (
        <div className="space-y-4">
          <div>
            {profile?.linkedin_url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'Perfil LinkedIn' : 'LinkedIn profile'}: {profile.linkedin_url}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'Adiciona o teu URL do LinkedIn no perfil.' : 'Add your LinkedIn URL in your profile.'}</span>
              </div>
            )}
          </div>
          <button onClick={runLinkedinAnalysis} disabled={analyzing || !profile?.linkedin_url || (weeklyUsage >= weeklyLimit)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-sm font-medium rounded-lg hover:from-[#333] hover:to-[#444] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            {analyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />{lang === 'pt' ? 'A analisar perfil LinkedIn...' : 'Analyzing LinkedIn...'}</>) : (<><Linkedin className="w-4 h-4" />{lang === 'pt' ? 'Analisar perfil LinkedIn' : 'Analyze LinkedIn profile'}</>)}
          </button>
        </div>
      );
    }

    if (tool.action === 'careerPath') {
      const cpLimit = planTier === 'pro' ? 3 : planTier === 'growth' ? 2 : 0;
      const cpAvailable = monthlyCareerPathUsed < cpLimit;
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{lang === 'pt' ? `${cpLimit} Career Path incluído${cpLimit > 1 ? 's' : ''} por mês no plano ${planTier === 'pro' ? 'Pro' : 'Growth'}` : `${cpLimit} Career Path included per month on ${planTier === 'pro' ? 'Pro' : 'Growth'} plan`} ({monthlyCareerPathUsed}/{cpLimit})</span>
            {!cpAvailable && <span className="ml-auto text-amber-600 font-medium">{lang === 'pt' ? '(limite atingido este mês)' : '(limit reached this month)'}</span>}
          </div>
          <div>
            {profile?.cv_url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700/70 bg-emerald-50/50 border border-emerald-200/50 rounded px-3 py-2"><CheckCircle className="w-3.5 h-3.5" /><span>{lang === 'pt' ? 'CV do perfil' : 'Profile CV'}: {profile.cv_filename || 'CV'}</span></div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2"><AlertCircle className="w-3.5 h-3.5" /><span>{lang === 'pt' ? 'Sem CV no perfil.' : 'No CV in profile.'}</span></div>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#ccc] rounded text-xs text-[#666] hover:border-gold/40 hover:text-gold transition-colors"><Upload className="w-3.5 h-3.5" />{cvFile ? cvFile.name : (lang === 'pt' ? 'Ou carrega outro CV' : 'Or upload another CV')}</button>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 flex items-center gap-1"><Linkedin className="w-3 h-3" />{lang === 'pt' ? 'LinkedIn' : 'LinkedIn'} <span className="text-red-400">*</span></label>
            <input type="url" value={cpLinkedinUrl || profile?.linkedin_url || ''} onChange={e => setCpLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/o-teu-perfil" className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white placeholder:text-[#bbb]" />
            <p className="text-[9px] text-[#999] mt-1">{lang === 'pt' ? 'O sistema irá analisar automaticamente: experiência profissional, competências, área de actuação e evolução de funções.' : 'The system will automatically analyze: professional experience, skills, area of activity and role evolution.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block"><Globe className="w-3 h-3 inline mr-1" />{lang === 'pt' ? 'País' : 'Country'}</label>
              <select value={cpCountry} onChange={e => { setCpCountry(e.target.value); setCpRegion(''); }} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white">{countries.map(c => (<option key={c.code} value={c.country}>{c.country}</option>))}</select>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block"><MapPin className="w-3 h-3 inline mr-1" />{lang === 'pt' ? 'Região' : 'Region'}</label>
              <select value={cpRegion} onChange={e => setCpRegion(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white"><option value="">{lang === 'pt' ? 'Selecionar região...' : 'Select region...'}</option>{availableRegions.map(r => (<option key={r} value={r}>{r}</option>))}</select>
            </div>
          </div>
          <button onClick={runCareerPath} disabled={analyzing || !cpAvailable || (!profile?.cv_url && !cvFile)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-sm font-medium rounded-lg hover:from-[#333] hover:to-[#444] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            {analyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />{lang === 'pt' ? 'A gerar Career Path...' : 'Generating Career Path...'}</>) : (<><Route className="w-4 h-4" />{lang === 'pt' ? 'Gerar Career Path' : 'Generate Career Path'}</>)}
          </button>
        </div>
      );
    }

    if (tool.action === 'careerIntelligence') {
      const ciLimit = planTier === 'pro' ? 3 : planTier === 'growth' ? 2 : 0;
      const ciAvailable = monthlyCareerIntelUsed < ciLimit;
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{lang === 'pt' ? `${ciLimit} Career Intelligence incluído${ciLimit > 1 ? 's' : ''} por mês no plano ${planTier === 'pro' ? 'Pro' : 'Growth'}` : `${ciLimit} Career Intelligence included per month on ${planTier === 'pro' ? 'Pro' : 'Growth'} plan`} ({monthlyCareerIntelUsed}/{ciLimit})</span>
            {!ciAvailable && <span className="ml-auto text-amber-600 font-medium">{lang === 'pt' ? '(limite atingido este mês)' : '(limit reached this month)'}</span>}
          </div>
          <div>
            {profile?.cv_url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700/70 bg-emerald-50/50 border border-emerald-200/50 rounded px-3 py-2"><CheckCircle className="w-3.5 h-3.5" /><span>{lang === 'pt' ? 'CV do perfil' : 'Profile CV'}: {profile.cv_filename || 'CV'}</span></div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2"><AlertCircle className="w-3.5 h-3.5" /><span>{lang === 'pt' ? 'Sem CV no perfil.' : 'No CV in profile.'}</span></div>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#ccc] rounded text-xs text-[#666] hover:border-gold/40 hover:text-gold transition-colors"><Upload className="w-3.5 h-3.5" />{cvFile ? cvFile.name : (lang === 'pt' ? 'Ou carrega outro CV' : 'Or upload another CV')}</button>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 flex items-center gap-1"><Linkedin className="w-3 h-3" />{lang === 'pt' ? 'LinkedIn' : 'LinkedIn'} <span className="text-red-400">*</span></label>
            <input type="url" value={cpLinkedinUrl || profile?.linkedin_url || ''} onChange={e => setCpLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/o-teu-perfil" className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white placeholder:text-[#bbb]" />
            <p className="text-[9px] text-[#999] mt-1">{lang === 'pt' ? 'O sistema irá analisar automaticamente: experiência profissional, competências, área de actuação e evolução de funções.' : 'The system will automatically analyze: professional experience, skills, area of activity and role evolution.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block"><Globe className="w-3 h-3 inline mr-1" />{lang === 'pt' ? 'País' : 'Country'}</label>
              <select value={cpCountry} onChange={e => { setCpCountry(e.target.value); setCpRegion(''); }} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white">{countries.map(c => (<option key={c.code} value={c.country}>{c.country}</option>))}</select>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block"><MapPin className="w-3 h-3 inline mr-1" />{lang === 'pt' ? 'Região' : 'Region'}</label>
              <select value={cpRegion} onChange={e => setCpRegion(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white"><option value="">{lang === 'pt' ? 'Selecionar região...' : 'Select region...'}</option>{availableRegions.map(r => (<option key={r} value={r}>{r}</option>))}</select>
            </div>
          </div>
          <button onClick={runCareerIntelligence} disabled={analyzing || !ciAvailable || (!profile?.cv_url && !cvFile)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#333] text-white text-sm font-medium rounded-lg hover:from-[#333] hover:to-[#444] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm">
            {analyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />{lang === 'pt' ? 'A gerar análise...' : 'Generating analysis...'}</>) : (<><Sparkles className="w-4 h-4" />{lang === 'pt' ? 'Gerar Career Intelligence' : 'Generate Career Intelligence'}</>)}
          </button>
        </div>
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
    if (!confirm(lang === 'pt' ? 'Tens a certeza que queres apagar esta análise?' : 'Are you sure you want to delete this analysis?')) return;
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
    if (action === 'profile') { window.location.href = '/area-cliente/perfil'; return; }
    setActiveTab('tools');
    const toolKeyMap: Record<string, string> = {
      cv: 'cvAnalyzer', linkedin: 'linkedinRoster', careerPath: 'careerPath',
      careerIntelligence: 'careerIntelligence', tools: '',
    };
    const toolKey = toolKeyMap[action] ?? '';
    if (toolKey) {
      setExpandedTool(toolKey);
      setTimeout(() => {
        const el = document.querySelector(`[data-tool-key="${toolKey}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      // For 'tools' action — just scroll to the tools section
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
                <span className="text-[10px] text-[#999]">{lang === 'pt' ? 'esta semana' : 'this week'}</span>
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
                  <a href={tool.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}><tool.icon className="w-4 h-4 text-[#333]" /></div>
                    <div className="flex-1 min-w-0"><h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">{tool.label}</h3><p className="text-[11px] text-[#999] font-light truncate">{tool.desc}</p></div>
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
                        <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-700 font-medium shrink-0 mr-2">{monthlyCareerPathUsed < (planTier === 'pro' ? 3 : 2) ? `${(planTier === 'pro' ? 3 : 2) - monthlyCareerPathUsed} ${t('member.includedMonth')}` : t('member.used')}</span>
                      )}
                      {tool.action === 'careerIntelligence' && (planTier === 'pro' || planTier === 'growth') && (
                        <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-700 font-medium shrink-0 mr-2">{monthlyCareerIntelUsed < (planTier === 'pro' ? 3 : 2) ? `${(planTier === 'pro' ? 3 : 2) - monthlyCareerIntelUsed} ${t('member.includedMonth')}` : t('member.used')}</span>
                      )}
                      {expandedTool === tool.key ? <ChevronUp className="w-4 h-4 text-gold shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#ccc] group-hover:text-gold/50 transition-colors shrink-0" />}
                    </button>
                    {expandedTool === tool.key && (
                      <div className="border-t border-[#e5e5e5] p-5 bg-[#fafaf9]">
                        {renderInlinePanel(tool)}
                        {analysisError && (<div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-4"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{analysisError}</span></div>)}
                        {analysisResult && (
                          analysisResult._enriched ? (
                            <div className="mt-4 border border-gold/20 rounded-lg bg-[#fafaf9] p-4 animate-in fade-in duration-500">
                              <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /><h4 className="text-sm font-semibold text-[#1a1a1a]">{lang === 'pt' ? 'Análise concluída' : 'Analysis complete'}</h4></div><button onClick={() => setAnalysisResult(null)} className="text-xs text-[#999] hover:text-[#1a1a1a] transition-colors">{lang === 'pt' ? 'Fechar' : 'Close'}</button></div>
                              <AnalysisResultsFull data={analysisResult._enriched} />
                              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gold/10">
                                <button onClick={() => { const el = document.querySelector('[data-analysis-result]'); if (el) { const printWin = window.open('', '_blank'); if (printWin) { printWin.document.write('<html><head><title>An\u00e1lise Share2Inspire</title><style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:800px;margin:0 auto;color:#1a1a1a}h1,h2,h3,h4,h5{margin-top:1.5rem}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}</style></head><body>' + el.innerHTML + '</body></html>'); printWin.document.close(); printWin.print(); } } }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded text-xs text-gold font-medium hover:bg-gold/20 transition-colors"><Download className="w-3.5 h-3.5" />{lang === 'pt' ? 'Guardar / Imprimir' : 'Save / Print'}</button>
                                <button onClick={() => { const subject = encodeURIComponent(lang === 'pt' ? 'A minha an\u00e1lise Share2Inspire' : 'My Share2Inspire Analysis'); const body = encodeURIComponent(lang === 'pt' ? 'Segue em anexo a minha an\u00e1lise. Para ver o resultado completo, acede \u00e0 tua \u00e1rea de membro em https://www.share2inspire.pt/area-cliente/membros' : 'Please find my analysis attached. For the full result, visit your member area at https://www.share2inspire.pt/area-cliente/membros'); window.open(`mailto:?subject=${subject}&body=${body}`, '_blank'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-xs text-[#666] font-medium hover:border-gold/30 hover:text-gold transition-colors"><Send className="w-3.5 h-3.5" />{lang === 'pt' ? 'Enviar por e-mail' : 'Send by email'}</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <AnalysisResult data={analysisResult} onClose={() => setAnalysisResult(null)} lang={lang} />
                              <div className="flex items-center gap-3 mt-3">
                                <button onClick={() => { const el = document.querySelector('[data-analysis-result]') || document.querySelector('.animate-in.fade-in'); if (el) { const printWin = window.open('', '_blank'); if (printWin) { printWin.document.write('<html><head><title>An\u00e1lise Share2Inspire</title><style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:800px;margin:0 auto;color:#1a1a1a}h1,h2,h3,h4,h5{margin-top:1.5rem}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}</style></head><body>' + el.innerHTML + '</body></html>'); printWin.document.close(); printWin.print(); } } }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded text-xs text-gold font-medium hover:bg-gold/20 transition-colors"><Download className="w-3.5 h-3.5" />{lang === 'pt' ? 'Guardar / Imprimir' : 'Save / Print'}</button>
                                <button onClick={() => { const subject = encodeURIComponent(lang === 'pt' ? 'A minha an\u00e1lise Share2Inspire' : 'My Share2Inspire Analysis'); const body = encodeURIComponent(lang === 'pt' ? 'Segue em anexo a minha an\u00e1lise. Para ver o resultado completo, acede \u00e0 tua \u00e1rea de membro em https://www.share2inspire.pt/area-cliente/membros' : 'Please find my analysis attached. For the full result, visit your member area at https://www.share2inspire.pt/area-cliente/membros'); window.open(`mailto:?subject=${subject}&body=${body}`, '_blank'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-xs text-[#666] font-medium hover:border-gold/30 hover:text-gold transition-colors"><Send className="w-3.5 h-3.5" />{lang === 'pt' ? 'Enviar por e-mail' : 'Send by email'}</button>
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
                <h2 className="text-sm font-semibold text-[#1a1a1a]">{lang === 'pt' ? 'Biblioteca de Análises' : 'Analysis Library'}</h2>
                <span className="text-[10px] text-[#999] bg-[#f5f5f4] px-2 py-0.5 rounded-full">{savedAnalyses.length}</span>
              </div>
              <button
                onClick={() => { setLoadingSaved(true); supabase.from('user_analyses').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(100).then(({ data }) => { setSavedAnalyses(data as SavedAnalysis[] || []); setLoadingSaved(false); }); }}
                className="flex items-center gap-1 text-[10px] text-[#999] hover:text-gold transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> {lang === 'pt' ? 'Atualizar' : 'Refresh'}
              </button>
            </div>

            {loadingSaved ? (
              <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin text-gold mx-auto" /><p className="text-xs text-[#999] mt-2">{t('dash.loadingAnalyses')}</p></div>
            ) : savedAnalyses.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#e5e5e5] rounded-xl bg-[#fafaf9]">
                <FileSearch className="w-10 h-10 text-[#ddd] mx-auto mb-3" />
                <p className="text-sm text-[#999] mb-1">{t('dash.noAnalysesYet')}</p>
                <p className="text-xs text-[#bbb] mb-4">{lang === 'pt' ? 'Usa as ferramentas para gerar a tua primeira análise.' : 'Use the tools to generate your first analysis.'}</p>
                <button onClick={() => setActiveTab('tools')} className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline font-medium">
                  <Wrench className="w-3 h-3" /> {lang === 'pt' ? 'Ir para Ferramentas' : 'Go to Tools'}
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
                          {lang === 'pt' ? 'Última análise' : 'Latest analysis'}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {getAnalysisSummary(latest) && <p className="text-sm font-medium text-[#1a1a1a] mb-1">{getAnalysisSummary(latest)}</p>}
                            <div className="flex items-center gap-1.5 text-[10px] text-[#999]"><Clock className="w-3 h-3" />{formatDate(latest.created_at)}</div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button onClick={() => setViewingAnalysis(latest)} className="flex items-center gap-1 text-[11px] text-gold hover:text-[#b8960c] font-medium transition-colors">
                              <ArrowRight className="w-3 h-3" />{lang === 'pt' ? 'Ver resultado' : 'View result'}
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
                            <span>{isExpanded ? (lang === 'pt' ? 'Ocultar anteriores' : 'Hide older') : (lang === 'pt' ? `Ver mais ${rest.length} análise${rest.length > 1 ? 's' : ''}` : `Show ${rest.length} more`)}</span>
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
                                      <ArrowRight className="w-3 h-3" />{lang === 'pt' ? 'Ver' : 'View'}
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
          <div className="animate-in fade-in duration-300">
            {planTier !== 'essential' ? (
              <VagasFeed lang={lang} countryCode={selectedCountryData?.code || 'PT'} countryName={cpCountry} region={cpRegion || undefined} />
            ) : (
              <section className="p-8 border border-dashed border-[#e5e5e5] rounded-xl bg-[#fafaf9] text-center">
                <Lock className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
                <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">{lang === 'pt' ? 'Feed de Vagas' : 'Job Feed'}</h3>
                <p className="text-xs text-[#999] font-light mb-4 max-w-sm mx-auto">{t('member.lockedVagas')}</p>
                <a href="/planos" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold/10 border border-gold/20 text-gold text-xs font-medium rounded-lg hover:bg-gold/20 transition-all"><Sparkles className="w-3.5 h-3.5" />{t('member.upgradeCta')}</a>
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
                <a href="/planos" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold/10 border border-gold/20 text-gold text-xs font-medium rounded-lg hover:bg-gold/20 transition-all"><Sparkles className="w-3.5 h-3.5" />{t('member.upgradeCta')}</a>
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
                {lang === 'pt' ? 'Fechar' : 'Close'}
              </button>
            </div>
            <div className="p-6">
              <AnalysisResult data={viewingAnalysis.data} onClose={() => setViewingAnalysis(null)} lang={lang} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
