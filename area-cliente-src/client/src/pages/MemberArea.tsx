/**
 * Design: Consultoria de Luxo Silenciosa
 * Área de Membro com ferramentas inline, conteúdos exclusivos e estado da subscrição
 * Ferramentas executam diretamente via edge function hyper-task
 * Controlo de limites semanais por plano (combinado CV Analyser + LinkedIn Roaster)
 * Career Path inline para Pro (1 incluído/mês), desconto para Growth
 * Career Intelligence inline para Pro (1 incluído/mês)
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import UpgradePage from './UpgradePage';
import { supabase, type MemberContent } from '@/lib/supabase';
import {
  FileText, BarChart3, Route, Linkedin, Bot, BookOpen,
  ExternalLink, Search, Clock, ArrowRight, ChevronDown, ChevronUp,
  Loader2, AlertCircle, CheckCircle, Upload, Lock, Sparkles, Tag,
  Globe, MapPin, Headphones, Play, Mail, MessageSquare, Megaphone,
  Home, Wrench, Briefcase, User, Download, Trash2, RefreshCw, FileSearch, Compass,
} from 'lucide-react';
import { Link } from 'wouter';
import CareerProgress from '@/components/CareerProgress';
import VagasFeed from '@/components/VagasFeed';
import AnalysisResultsFull from '@/components/AnalysisResults';
import { transformGeminiResponse } from '@/lib/transformGeminiResponse';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ─── Constants ───────────────────────────────────────────────────────────────
const HYPER_TASK_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';
const TOOLS_SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';

// ─── Tab System ──────────────────────────────────────────────────────────────
type TabId = 'overview' | 'tools' | 'jobs' | 'content' | 'profile';
const TABS: { id: TabId; icon: typeof Home; labelPt: string; labelEn: string }[] = [
  { id: 'overview', icon: Home,      labelPt: 'Vis\u00e3o Geral', labelEn: 'Overview' },
  { id: 'tools',    icon: Wrench,    labelPt: 'Ferramentas',  labelEn: 'Tools' },
  { id: 'jobs',     icon: Briefcase, labelPt: 'Vagas',        labelEn: 'Jobs' },
  { id: 'content',  icon: BookOpen,  labelPt: 'Conte\u00fados',   labelEn: 'Content' },
  { id: 'profile',  icon: User,      labelPt: 'Perfil',       labelEn: 'Profile' },
];

// Saved analysis type (for Profile tab)
type SavedAnalysis = {
  id: string;
  user_id: string;
  analysis_type: string;
  data: Record<string, any>;
  created_at: string;
};

// Tool config for saved analyses display
const TOOL_CONFIG: Record<string, { label: string; icon: typeof FileSearch; color: string }> = {
  cv_analyser: { label: 'CV Analyser', icon: FileSearch, color: 'text-blue-400' },
  career_path: { label: 'Career Path', icon: Compass, color: 'text-emerald-400' },
  career_intelligence: { label: 'Career Intelligence', icon: BarChart3, color: 'text-violet-400' },
  linkedin_roaster: { label: 'LinkedIn Roaster', icon: Linkedin, color: 'text-amber-400' },
  career_energy: { label: 'Career Energy', icon: Sparkles, color: 'text-pink-400' },
};

// ─── Country/Region Data ─────────────────────────────────────────────────────
interface CountryRegion {
  country: string;
  code: string;
  currency: string;
  regions: string[];
}

const countries: CountryRegion[] = [
  { country: "Portugal", code: "PT", currency: "EUR", regions: ["Lisboa", "Porto", "Algarve", "Coimbra", "Other"] },
  { country: "United States", code: "US", currency: "USD", regions: ["California", "New York", "Texas", "Florida", "Illinois", "Massachusetts", "Washington", "Colorado", "Georgia", "Other"] },
  { country: "United Kingdom", code: "GB", currency: "GBP", regions: ["London", "South East", "North West", "Scotland", "West Midlands", "Yorkshire", "East of England", "Other"] },
  { country: "Germany", code: "DE", currency: "EUR", regions: ["Bavaria", "Berlin", "Hamburg", "North Rhine-Westphalia", "Baden-Württemberg", "Hesse", "Other"] },
  { country: "France", code: "FR", currency: "EUR", regions: ["Île-de-France (Paris)", "Auvergne-Rhône-Alpes", "Provence-Alpes-Côte d'Azur", "Occitanie", "Nouvelle-Aquitaine", "Other"] },
  { country: "Netherlands", code: "NL", currency: "EUR", regions: ["Randstad (Amsterdam/Rotterdam/The Hague)", "North Brabant", "Gelderland", "Other"] },
  { country: "Spain", code: "ES", currency: "EUR", regions: ["Madrid", "Catalonia (Barcelona)", "Andalusia", "Valencia", "Basque Country", "Other"] },
  { country: "Switzerland", code: "CH", currency: "CHF", regions: ["Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Other"] },
  { country: "Canada", code: "CA", currency: "CAD", regions: ["Ontario (Toronto)", "British Columbia (Vancouver)", "Quebec (Montreal)", "Alberta (Calgary)", "Other"] },
  { country: "Australia", code: "AU", currency: "AUD", regions: ["New South Wales (Sydney)", "Victoria (Melbourne)", "Queensland (Brisbane)", "Western Australia (Perth)", "Other"] },
  { country: "Ireland", code: "IE", currency: "EUR", regions: ["Dublin", "Cork", "Galway", "Limerick", "Other"] },
  { country: "Brazil", code: "BR", currency: "BRL", regions: ["São Paulo", "Rio de Janeiro", "Minas Gerais", "Paraná", "Other"] },
  { country: "Italy", code: "IT", currency: "EUR", regions: ["Lombardy (Milan)", "Lazio (Rome)", "Veneto", "Piedmont (Turin)", "Other"] },
  { country: "Sweden", code: "SE", currency: "SEK", regions: ["Stockholm", "Gothenburg", "Malmö", "Other"] },
  { country: "Singapore", code: "SG", currency: "SGD", regions: ["Central", "East", "West", "Other"] },
  { country: "UAE", code: "AE", currency: "AED", regions: ["Dubai", "Abu Dhabi", "Sharjah", "Other"] },
  { country: "India", code: "IN", currency: "INR", regions: ["Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Other"] },
  { country: "Other", code: "XX", currency: "USD", regions: ["Other"] },
];

// Plan tier detection from subscription plan field
function getPlanTier(plan: string | undefined): 'essential' | 'growth' | 'pro' {
  if (!plan) return 'essential';
  const p = plan.toLowerCase();
  if (p.includes('pro')) return 'pro';
  if (p.includes('growth')) return 'growth';
  if (p === 'annual') return 'pro';
  if (p === 'semiannual') return 'growth';
  return 'essential';
}

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
  const analysis = data?.analysis || data;
  if (!analysis) return null;

  // Career Path has a different structure
  const isCareerPath = data?.career_paths || data?.market_analysis || analysis?.career_paths;
  const cpData = isCareerPath ? (data?.career_paths ? data : analysis) : null;

  // LinkedIn Roaster / CV Extraction has candidate_profile + global_summary
  const isLinkedInFormat = analysis?.candidate_profile || data?.candidate_profile;
  const linkedinData = isLinkedInFormat ? (data?.candidate_profile ? data : analysis) : null;

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

      {/* Career Path specific rendering */}
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
                  {path.salary_range && (
                    <p className="text-xs text-gold mt-1">{path.salary_range}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {cpData.market_analysis && (
            <div>
              <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">
                {lang === 'pt' ? 'Análise de Mercado' : 'Market Analysis'}
              </h5>
              <p className="text-sm text-[#333] leading-relaxed">
                {typeof cpData.market_analysis === 'string' ? cpData.market_analysis : JSON.stringify(cpData.market_analysis)}
              </p>
            </div>
          )}
          {cpData.recommendations && Array.isArray(cpData.recommendations) && (
            <div>
              <h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">
                {lang === 'pt' ? 'Recomendações' : 'Recommendations'}
              </h5>
              <ul className="space-y-1">
                {cpData.recommendations.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-[#333] flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* LinkedIn Roaster / CV Extraction format (candidate_profile + global_summary) */}
      {linkedinData && !cpData && (
        <div className="space-y-4">
          {/* Score */}
          {linkedinData.executive_summary?.global_score && (
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-gold/30 flex items-center justify-center">
                <span className="text-lg font-bold text-gold">{linkedinData.executive_summary.global_score}</span>
              </div>
              <div>
                <p className="text-xs text-[#999]">{lang === 'pt' ? 'Pontuação global' : 'Overall score'}</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{linkedinData.executive_summary.global_score}/100</p>
                {linkedinData.executive_summary.market_positioning && (
                  <p className="text-xs text-[#666] mt-0.5">{linkedinData.executive_summary.market_positioning}</p>
                )}
              </div>
            </div>
          )}

          {linkedinData.candidate_profile && (
            <div>
              <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">
                {lang === 'pt' ? 'Perfil Detetado' : 'Detected Profile'}
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {linkedinData.candidate_profile.detected_name && linkedinData.candidate_profile.detected_name !== 'N/A' && (
                  <div className="p-2 bg-white border border-[#e5e5e5] rounded">
                    <p className="text-[10px] text-[#999] uppercase">{lang === 'pt' ? 'Nome' : 'Name'}</p>
                    <p className="text-xs font-medium text-[#1a1a1a]">{linkedinData.candidate_profile.detected_name}</p>
                  </div>
                )}
                {linkedinData.candidate_profile.detected_role && linkedinData.candidate_profile.detected_role !== 'N/A' && (
                  <div className="p-2 bg-white border border-[#e5e5e5] rounded">
                    <p className="text-[10px] text-[#999] uppercase">{lang === 'pt' ? 'Função' : 'Role'}</p>
                    <p className="text-xs font-medium text-[#1a1a1a]">{linkedinData.candidate_profile.detected_role}</p>
                  </div>
                )}
                {linkedinData.candidate_profile.seniority && linkedinData.candidate_profile.seniority !== 'N/A' && (
                  <div className="p-2 bg-white border border-[#e5e5e5] rounded">
                    <p className="text-[10px] text-[#999] uppercase">{lang === 'pt' ? 'Senioridade' : 'Seniority'}</p>
                    <p className="text-xs font-medium text-[#1a1a1a]">{linkedinData.candidate_profile.seniority}</p>
                  </div>
                )}
                {linkedinData.candidate_profile.total_years_exp && linkedinData.candidate_profile.total_years_exp !== 'N/A' && (
                  <div className="p-2 bg-white border border-[#e5e5e5] rounded">
                    <p className="text-[10px] text-[#999] uppercase">{lang === 'pt' ? 'Experiência' : 'Experience'}</p>
                    <p className="text-xs font-medium text-[#1a1a1a]">{linkedinData.candidate_profile.total_years_exp}</p>
                  </div>
                )}
              </div>
              {linkedinData.candidate_profile.key_skills && linkedinData.candidate_profile.key_skills.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] text-[#999] uppercase mb-1.5">{lang === 'pt' ? 'Competências-chave' : 'Key Skills'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedinData.candidate_profile.key_skills.map((skill: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-gold/5 border border-gold/20 rounded text-[10px] text-gold font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Global Summary */}
          {linkedinData.global_summary && (
            <div>
              {linkedinData.global_summary.strengths && linkedinData.global_summary.strengths.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">
                    {lang === 'pt' ? 'Pontos Fortes' : 'Strengths'}
                  </h5>
                  <ul className="space-y-1">
                    {linkedinData.global_summary.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-[#333] flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* improvements OR gaps - edge function returns 'improvements' */}
              {(linkedinData.global_summary.improvements || linkedinData.global_summary.gaps || []).length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">
                    {lang === 'pt' ? 'Áreas a Melhorar' : 'Areas to Improve'}
                  </h5>
                  <ul className="space-y-1">
                    {(linkedinData.global_summary.improvements || linkedinData.global_summary.gaps || []).map((s: string, i: number) => (
                      <li key={i} className="text-sm text-[#333] flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">!</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {linkedinData.global_summary.recommendations && linkedinData.global_summary.recommendations.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">
                    {lang === 'pt' ? 'Recomendações' : 'Recommendations'}
                  </h5>
                  <ul className="space-y-1">
                    {linkedinData.global_summary.recommendations.map((s: string, i: number) => (
                      <li key={i} className="text-sm text-[#333] flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Priority Recommendations */}
          {linkedinData.priority_recommendations?.immediate_adjustments && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">
                {lang === 'pt' ? 'Ajustes Prioritários' : 'Priority Adjustments'}
              </h5>
              <p className="text-sm text-[#333] leading-relaxed">{linkedinData.priority_recommendations.immediate_adjustments}</p>
            </div>
          )}

          {/* CV Problems / Detailed Issues */}
          {linkedinData.cv_problems && linkedinData.cv_problems.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-red-700 uppercase tracking-wider mb-3">
                {lang === 'pt' ? 'Problemas Identificados' : 'Identified Issues'}
              </h5>
              <div className="space-y-3">
                {linkedinData.cv_problems.map((problem: any, i: number) => (
                  <div key={i} className="p-3 bg-white border border-[#e5e5e5] rounded-lg">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <h6 className="text-sm font-medium text-[#1a1a1a]">{problem.title}</h6>
                    </div>
                    <p className="text-xs text-[#666] leading-relaxed ml-7 mb-2">{problem.description}</p>
                    {problem.full_explanation && (
                      <p className="text-xs text-[#555] leading-relaxed ml-7 mb-2">{problem.full_explanation}</p>
                    )}
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

      {/* Standard analysis rendering (CV with score/summary/strengths) */}
      {!cpData && !linkedinData && (
        <>
          {analysis.score !== undefined && (
            <div className="mb-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-gold/30 flex items-center justify-center">
                <span className="text-lg font-bold text-gold">{analysis.score}</span>
              </div>
              <div>
                <p className="text-xs text-[#999]">{lang === 'pt' ? 'Pontuação global' : 'Overall score'}</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{analysis.score}/100</p>
              </div>
            </div>
          )}

          {analysis.summary && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-[#666] uppercase tracking-wider mb-2">
                {lang === 'pt' ? 'Resumo' : 'Summary'}
              </h5>
              <p className="text-sm text-[#333] leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">
                {lang === 'pt' ? 'Pontos Fortes' : 'Strengths'}
              </h5>
              <ul className="space-y-1">
                {analysis.strengths.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-[#333] flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.improvements && analysis.improvements.length > 0 && (
            <div className="mb-4">
              <h5 className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">
                {lang === 'pt' ? 'A melhorar' : 'To improve'}
              </h5>
              <ul className="space-y-1">
                {analysis.improvements.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-[#333] flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">!</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">
                {lang === 'pt' ? 'Recomendações' : 'Recommendations'}
              </h5>
              <ul className="space-y-1">
                {analysis.recommendations.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-[#333] flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!analysis.score && !analysis.summary && !analysis.strengths && !analysis.candidate_profile && (
            <div className="bg-white border border-[#e5e5e5] rounded p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-[#333] whitespace-pre-wrap">{JSON.stringify(analysis, null, 2)}</pre>
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
  const [monthlyCareerPathUsed, setMonthlyCareerPathUsed] = useState(0);

  // Career Intelligence states
  const [monthlyCareerIntelUsed, setMonthlyCareerIntelUsed] = useState(0);
  // Tab navigation
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  // Profile tab: saved analyses
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  // Profile tab: CV upload
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  // Profile tab: edit mode
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [profileEditMode, setProfileEditMode] = useState(false);

  const planTier = getPlanTier(subscription?.plan);
  const weeklyLimit = WEEKLY_LIMITS[planTier] || 2;
  const isProPlan = planTier === 'pro';

  // Get regions for selected country
  const selectedCountryData = countries.find(c => c.country === cpCountry);
  const availableRegions = selectedCountryData?.regions || [];

  // ─── Fetch content ──────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase
        .from('member_content')
        .select('*')
        .order('sort_order', { ascending: true });
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

      const { data, error } = await supabase
        .from('user_analyses')
        .select('id')
        .eq('user_id', user!.id)
        .in('analysis_type', ['cv_analyser', 'linkedin_roaster'])
        .gte('created_at', weekStart.toISOString());

      if (!error && data) {
        setWeeklyUsage(data.length);
      }
    }
    fetchUsage();
  }, [user?.id, analysisResult]);

  // ─── Fetch monthly Career Path usage (Pro only) ─────────────────────────
  useEffect(() => {
    if (!user?.id || planTier !== 'pro') return;
    async function fetchCpUsage() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await supabase
        .from('user_analyses')
        .select('id')
        .eq('user_id', user!.id)
        .eq('analysis_type', 'career_path')
        .gte('created_at', monthStart.toISOString());

      if (!error && data) {
        setMonthlyCareerPathUsed(data.length);
      }
    }
    fetchCpUsage();
  }, [user?.id, planTier, analysisResult]);

  // ─── Fetch monthly Career Intelligence usage (Pro only) ─────────────────
  useEffect(() => {
    if (!user?.id || planTier !== 'pro') return;
    async function fetchCiUsage() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await supabase
        .from('user_analyses')
        .select('id')
        .eq('user_id', user!.id)
        .eq('analysis_type', 'career_intelligence')
        .gte('created_at', monthStart.toISOString());

      if (!error && data) {
        setMonthlyCareerIntelUsed(data.length);
      }
    }
    fetchCiUsage();
  }, [user?.id, planTier, analysisResult]);

  // Fetch saved analyses for Profile tab
  useEffect(() => {
    if (!user?.id || activeTab !== 'profile') return;
    setLoadingSaved(true);
    async function fetchSaved() {
      const { data } = await supabase
        .from('user_analyses')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setSavedAnalyses(data || []);
      setLoadingSaved(false);
    }
    fetchSaved();
  }, [user?.id, activeTab, analysisResult]);

  // Init profile edit fields
  useEffect(() => {
    if (profile && !profileEditMode) {
      setEditFirstName(profile.first_name || '');
      setEditLastName(profile.last_name || '');
      setEditPhone(profile.phone || '');
      setEditLinkedin(profile.linkedin_url || '');
    }
  }, [profile, profileEditMode]);

  const filtered = useMemo(() => {
    let items = [...content];

    // Add blog articles as virtual content when filter is 'all' or 'article'
    if (filter === 'all' || filter === 'article') {
      const blogItems: MemberContent[] = BLOG_ARTICLES.map((article, i) => ({
        id: `blog-${i}`,
        title: article.title,
        description: article.desc,
        content_type: 'article' as const,
        file_url: article.url,
        thumbnail_url: null,
        tags: null,
        is_published: true,
        required_plan: 'monthly' as const,
        sort_order: 100 + i,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      items = [...items, ...blogItems];
    }

    if (filter !== 'all') items = items.filter(c => c.content_type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(c =>
        c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [content, filter, search]);

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const filterLabels: Record<string, string> = {
    all: t('member.allTypes'),
    ebook: t('member.ebooks'),
    article: t('member.articles'),
    video: t('member.videos'),
    podcast: 'Podcast',
  };

  // ─── Extract text from PDF (same pattern as BundleHome) ─────────────
  const extractPdfText = useCallback(async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text.trim().substring(0, 8000);
  }, []);

  // ─── Convert file/blob to base64 ────────────────────────────────────────
  const toBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  // ─── Read CV text from file (with base64 fallback for server-side extraction) ──
  const readCvText = useCallback(async (file: File): Promise<{ text: string; base64?: string; filename?: string }> => {
    let text = '';
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.name.toLowerCase().endsWith('.docx');

    if (isPdf) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        text = await extractPdfText(arrayBuffer);
      } catch (e) {
        console.warn('[CV] PDF text extraction failed:', e);
      }
    } else if (isDocx) {
      try {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } catch (e) {
        console.warn('[CV] DOCX extraction failed:', e);
      }
    } else {
      text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Erro ao ler o ficheiro.'));
        reader.readAsText(file);
      });
    }

    // If text is too short, prepare base64 for server-side Gemini Vision extraction
    if (text.trim().length < 50 && isPdf) {
      console.log('[CV] Texto insuficiente (' + text.length + ' chars). A preparar base64 para extração server-side...');
      const base64 = await toBase64(file);
      return { text, base64, filename: file.name };
    }

    return { text: text.substring(0, 8000) };
  }, [extractPdfText, toBase64]);

  // ─── Download CV from profile ───────────────────────────────────────────
  const downloadProfileCv = useCallback(async (): Promise<{ text: string; base64?: string; filename?: string } | null> => {
    if (!profile?.cv_url) return null;
    try {
      // cv_url may be a full public URL or a storage path
      // Dashboard saves it as: https://xxx.supabase.co/storage/v1/object/public/user-cvs/userId/cv.pdf
      // But .download() expects just the path: userId/cv.pdf
      let storagePath = profile.cv_url;
      const bucketMarker = '/user-cvs/';
      const markerIndex = storagePath.indexOf(bucketMarker);
      if (markerIndex !== -1) {
        storagePath = storagePath.substring(markerIndex + bucketMarker.length);
        console.log('[CV] Extracted storage path from public URL:', storagePath);
      }

      let blob: Blob | null = null;

      // Try storage download with extracted path
      try {
        const { data } = await supabase.storage
          .from('user-cvs')
          .download(storagePath);
        if (data) blob = data;
      } catch (storageErr) {
        console.warn('[CV] Storage download failed, trying direct fetch...', storageErr);
      }

      // Fallback: fetch directly from the public URL
      if (!blob && profile.cv_url.startsWith('http')) {
        try {
          const resp = await fetch(profile.cv_url);
          if (resp.ok) blob = await resp.blob();
        } catch (fetchErr) {
          console.warn('[CV] Direct fetch also failed:', fetchErr);
        }
      }

      if (blob) {
        const isPdf = profile.cv_url.toLowerCase().endsWith('.pdf') || blob.type === 'application/pdf';
        let text = '';

        if (isPdf) {
          try {
            const arrayBuffer = await blob.arrayBuffer();
            text = await extractPdfText(arrayBuffer);
          } catch (e) {
            console.warn('[CV] Profile PDF text extraction failed:', e);
          }
        } else {
          text = await blob.text();
        }

        // If text is too short and it's a PDF, prepare base64 for server-side extraction
        if (text.trim().length < 50 && isPdf) {
          console.log('[CV] Profile CV texto insuficiente (' + text.length + ' chars). A preparar base64...');
          const base64 = await toBase64(blob);
          const filename = profile.cv_url.split('/').pop() || 'cv.pdf';
          return { text, base64, filename };
        }

        return { text: text.substring(0, 8000) };
      }
    } catch (e) {
      console.error('Error downloading CV:', e);
    }
    return null;
  }, [profile?.cv_url, extractPdfText, toBase64]);

  // ─── Helper: get CV data (text + optional base64 for server fallback) ─────
  const getCvData = useCallback(async (): Promise<{ text: string; base64?: string; filename?: string } | null> => {
    if (cvFile) {
      return readCvText(cvFile);
    } else if (profile?.cv_url) {
      return downloadProfileCv();
    }
    return null;
  }, [cvFile, profile?.cv_url, readCvText, downloadProfileCv]);

  // ─── Helper: build API request body with server-side fallback ───────────
  const buildCvRequestBody = (cvData: { text: string; base64?: string; filename?: string }, mode: string, extra?: Record<string, any>): any => {
    const body: any = { mode, lang };
    const useServerExtraction = cvData.text.trim().length < 50 && cvData.base64;
    if (useServerExtraction) {
      body.file = cvData.base64;
      body.filename = cvData.filename;
      console.log(`[${mode}] A enviar PDF para extração via Gemini Vision...`);
    } else {
      body.cv_text = cvData.text.substring(0, 8000);
    }
    if (extra) Object.assign(body, extra);
    return body;
  };

  // ─── Helper: fetch with retry (same as standalone) ──────────────────────
  const fetchWithRetry = useCallback(async (body: any, timeoutMs = 120000, maxRetries = 2): Promise<any> => {
    let response: Response | null = null;
    let responseData: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        response = await fetch(HYPER_TASK_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          responseData = await response.json();
          if (responseData.success) return responseData;
        }

        if (attempt < maxRetries) {
          console.warn(`[API] Tentativa ${attempt + 1} falhou (status: ${response?.status}). A tentar novamente...`);
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (attempt < maxRetries && fetchError.name !== 'AbortError') {
          console.warn(`[API] Tentativa ${attempt + 1} falhou (${fetchError.message}). A tentar novamente...`);
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        } else {
          throw fetchError;
        }
      }
    }

    if (!response?.ok) throw new Error('Erro na análise IA. Tenta novamente.');
    if (!responseData?.success) throw new Error(responseData?.error || 'Erro na análise IA.');
    return responseData;
  }, []);

  // ─── Run CV Analysis ────────────────────────────────────────────────────
  const runCvAnalysis = useCallback(async () => {
    if (!user?.id || !subscription) return;
    if (weeklyUsage >= weeklyLimit) {
      setAnalysisError(lang === 'pt'
        ? 'Atingiste o limite semanal de análises do teu plano.'
        : 'You have reached your weekly analysis limit.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const cvData = await getCvData();

      if (!cvData || (cvData.text.trim().length < 50 && !cvData.base64)) {
        setAnalysisError(lang === 'pt'
          ? 'Não foi possível ler o CV. Carrega um ficheiro ou atualiza o teu CV no perfil.'
          : 'Could not read CV. Upload a file or update your CV in your profile.');
        setAnalyzing(false);
        return;
      }

      const body = buildCvRequestBody(cvData, 'cv_extraction');
      const result = await fetchWithRetry(body);

      // Transform raw analysis into enriched report (quadrants, ATS, salary, etc.)
      const rawAnalysis = result?.analysis || result;
      const enriched = transformGeminiResponse(rawAnalysis);
      setAnalysisResult({ ...result, _enriched: enriched });

      await supabase.from('user_analyses').insert({
        user_id: user.id,
        analysis_type: 'cv_analyser',
        data: { source: 'member_area', plan: subscription.plan, tier: planTier, captured_at: new Date().toISOString(), email: profile?.email },
      });
      setWeeklyUsage(prev => prev + 1);
    } catch (err: any) {
      setAnalysisError(err.name === 'AbortError'
        ? (lang === 'pt' ? 'A análise demorou demasiado. Tenta novamente.' : 'Analysis took too long. Please try again.')
        : (err.message || 'Erro inesperado.'));
    } finally {
      setAnalyzing(false);
    }
  }, [user?.id, subscription, weeklyUsage, weeklyLimit, planTier, lang, getCvData, fetchWithRetry]);

  // ─── Run LinkedIn Analysis ──────────────────────────────────────────────
  const runLinkedinAnalysis = useCallback(async () => {
    if (!user?.id || !subscription) return;
    if (weeklyUsage >= weeklyLimit) {
      setAnalysisError(lang === 'pt'
        ? 'Atingiste o limite semanal de análises do teu plano.'
        : 'You have reached your weekly analysis limit.');
      return;
    }

    const linkedinUrl = profile?.linkedin_url;
    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) {
      setAnalysisError(lang === 'pt'
        ? 'Adiciona o teu perfil LinkedIn nas definições do perfil.'
        : 'Add your LinkedIn profile URL in your profile settings.');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      // Also get CV data if available for richer analysis
      const cvData = await getCvData();

      const body: any = { mode: 'cv_extraction', linkedin_url: linkedinUrl, lang };
      if (cvData && (cvData.text.trim().length >= 50 || cvData.base64)) {
        if (cvData.text.trim().length < 50 && cvData.base64) {
          body.file = cvData.base64;
          body.filename = cvData.filename;
        } else {
          body.cv_text = cvData.text.substring(0, 8000);
        }
      }

      const result = await fetchWithRetry(body);

      setAnalysisResult(result);

      await supabase.from('user_analyses').insert({
        user_id: user.id,
        analysis_type: 'linkedin_roaster',
        data: {
          source: 'member_area',
          plan: subscription.plan,
          tier: planTier,
          linkedin_url: linkedinUrl,
          captured_at: new Date().toISOString(),
          email: profile?.email,
        },
      });
      setWeeklyUsage(prev => prev + 1);
    } catch (err: any) {
      setAnalysisError(err.name === 'AbortError'
        ? (lang === 'pt' ? 'A análise demorou demasiado. Tenta novamente.' : 'Analysis took too long. Please try again.')
        : (err.message || 'Erro inesperado.'));
    } finally {
      setAnalyzing(false);
    }
  }, [user?.id, subscription, weeklyUsage, weeklyLimit, planTier, lang, profile, getCvData, fetchWithRetry]);

  // ─── Run Career Path ───────────────────────────────────────────────────
  const runCareerPath = useCallback(async () => {
    if (!user?.id || !subscription) return;
    const limit = planTier === 'pro' ? 3 : 0;
    if (monthlyCareerPathUsed >= limit) {
      setAnalysisError(lang === 'pt'
        ? `Atingiste o limite mensal de Career Path (${limit}/mês).`
        : `You reached the monthly Career Path limit (${limit}/month).`);
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const cvData = await getCvData();

      if (!cvData || (cvData.text.trim().length < 50 && !cvData.base64)) {
        setAnalysisError(lang === 'pt'
          ? 'Não foi possível ler o CV. Carrega um ficheiro ou atualiza o teu CV no perfil.'
          : 'Could not read CV. Upload a file or update your CV in your profile.');
        setAnalyzing(false);
        return;
      }

      // First get CV extraction
      const extractionBody = buildCvRequestBody(cvData, 'cv_extraction');
      const extractionResult = await fetchWithRetry(extractionBody);
      const analysisSource = extractionResult.analysis || extractionResult;
      const cvText = (analysisSource.raw_text || cvData.text).substring(0, 8000);

      // Now run career path with the extracted data
      const careerPathBody: any = {
        mode: 'career_path',
        cv_text: cvText,
        cv_analysis: JSON.stringify(analysisSource),
        linkedin_url: profile?.linkedin_url || '',
        country: cpCountry,
        region: cpRegion,
        lang: lang,
      };

      const result = await fetchWithRetry(careerPathBody);

      setAnalysisResult(result);

      await supabase.from('user_analyses').insert({
        user_id: user.id,
        analysis_type: 'career_path',
        data: {
          source: 'member_area_pro',
          plan: subscription.plan,
          tier: planTier,
          country: cpCountry,
          region: cpRegion,
          captured_at: new Date().toISOString(),
          email: profile?.email,
        },
      });

      setMonthlyCareerPathUsed(prev => prev + 1);
    } catch (err: any) {
      setAnalysisError(err.name === 'AbortError'
        ? (lang === 'pt' ? 'A análise demorou demasiado. Tenta novamente.' : 'Analysis took too long. Please try again.')
        : (err.message || 'Erro inesperado.'));
    } finally {
      setAnalyzing(false);
    }
  }, [user?.id, subscription, planTier, monthlyCareerPathUsed, profile, cpCountry, cpRegion, lang, getCvData, fetchWithRetry]);

  // ─── Run Career Intelligence ───────────────────────────────────────────
  const runCareerIntelligence = useCallback(async () => {
    if (!user?.id || !subscription) return;
    const limit = planTier === 'pro' ? 3 : 0;
    if (monthlyCareerIntelUsed >= limit) {
      setAnalysisError(lang === 'pt'
        ? `Atingiste o limite mensal de Career Intelligence (${limit}/mês).`
        : `You reached the monthly Career Intelligence limit (${limit}/month).`);
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const cvData = await getCvData();

      if (!cvData || (cvData.text.trim().length < 50 && !cvData.base64)) {
        setAnalysisError(lang === 'pt'
          ? 'Não foi possível ler o CV. Carrega um ficheiro ou atualiza o teu CV no perfil.'
          : 'Could not read CV. Upload a file or update your CV in your profile.');
        setAnalyzing(false);
        return;
      }

      // First get CV extraction
      const extractionBody = buildCvRequestBody(cvData, 'cv_extraction');
      const extractionResult = await fetchWithRetry(extractionBody);
      const analysisSource = extractionResult.analysis || extractionResult;
      const cvText = (analysisSource.raw_text || cvData.text).substring(0, 8000);

      // Now run career intelligence
      const ciBody: any = {
        mode: 'career_intelligence',
        cv_text: cvText,
        cv_analysis: JSON.stringify(analysisSource),
        linkedin_url: profile?.linkedin_url || '',
        country: cpCountry,
        region: cpRegion,
        lang: lang,
      };

      const result = await fetchWithRetry(ciBody);

      setAnalysisResult(result);

      await supabase.from('user_analyses').insert({
        user_id: user.id,
        analysis_type: 'career_intelligence',
        data: {
          source: 'member_area_pro',
          plan: subscription.plan,
          tier: planTier,
          country: cpCountry,
          region: cpRegion,
          captured_at: new Date().toISOString(),
          email: profile?.email,
        },
      });

      setMonthlyCareerIntelUsed(prev => prev + 1);
    } catch (err: any) {
      setAnalysisError(err.name === 'AbortError'
        ? (lang === 'pt' ? 'A análise demorou demasiado. Tenta novamente.' : 'Analysis took too long. Please try again.')
        : (err.message || 'Erro inesperado.'));
    } finally {
      setAnalyzing(false);
    }
  }, [user?.id, subscription, planTier, monthlyCareerIntelUsed, profile, cpCountry, cpRegion, lang, getCvData, fetchWithRetry]);

  // ─── Toggle tool panel ──────────────────────────────────────────────────
  const toggleTool = (key: string) => {
    if (expandedTool === key) {
      setExpandedTool(null);
      setAnalysisResult(null);
      setAnalysisError(null);
      setCvFile(null);
    } else {
      setExpandedTool(key);
      setAnalysisResult(null);
      setAnalysisError(null);
      setCvFile(null);
      // Scroll the clicked tool into view after a short delay to let React render
      setTimeout(() => {
        const el = document.querySelector(`[data-tool-key="${key}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // ─── Tool definitions ───────────────────────────────────────────────────
  type ToolDef = {
    key: string;
    icon: any;
    color: string;
    type: 'external' | 'inline' | 'locked' | 'discount' | 'widget';
    action?: string;
    url?: string;
    discount?: string | null;
    discountOriginal?: string | null;
    label: string;
    desc: string;
  };

  const tools: ToolDef[] = [
    {
      key: 'cvMaker',
      icon: FileText,
      color: 'from-gold/20 to-gold/5',
      type: 'external',
      url: 'https://share2inspire.pt/cv-builder/',
      label: 'CV Maker',
      desc: lang === 'pt' ? 'Cria CVs profissionais com templates otimizados' : 'Create professional CVs with optimized templates',
    },
    {
      key: 'cvAnalyzer',
      icon: BarChart3,
      color: 'from-blue-500/15 to-blue-500/5',
      type: 'inline',
      action: 'cv',
      label: 'CV Analyser',
      desc: lang === 'pt' ? 'Análise completa e detalhada do teu CV com IA' : 'Complete AI-powered analysis of your CV',
    },
    {
      key: 'linkedinRoster',
      icon: Linkedin,
      color: 'from-sky-500/15 to-sky-500/5',
      type: 'inline',
      action: 'linkedin',
      label: 'LinkedIn Roaster',
      desc: lang === 'pt' ? 'Otimiza o teu perfil LinkedIn com feedback IA' : 'Optimize your LinkedIn profile with AI feedback',
    },
    {
      key: 'careerBot',
      icon: Bot,
      color: 'from-purple-500/15 to-purple-500/5',
      type: 'widget',
      action: 'openCareerBot',
      label: 'Career Advisory',
      desc: lang === 'pt' ? 'Assistente pessoal de carreira com IA' : 'Personal AI career assistant',
    },
    {
      key: 'careerPath',
      icon: Route,
      color: 'from-emerald-500/15 to-emerald-500/5',
      type: planTier === 'pro' ? 'inline' : planTier === 'growth' ? 'inline' : 'locked',
      action: 'careerPath',
      url: 'https://share2inspire.pt/career-path/',
      discount: planTier === 'growth' ? '8,99€' : planTier === 'pro' ? '4,99€' : null,
      discountOriginal: (planTier === 'growth' || planTier === 'pro') ? '19€' : null,
      label: 'Career Path',
      desc: lang === 'pt' ? 'Planeamento estratégico da tua carreira' : 'Strategic career planning',
    },
    {
      key: 'careerIntelligence',
      icon: Sparkles,
      color: 'from-violet-500/15 to-violet-500/5',
      type: planTier === 'pro' ? 'inline' : 'locked',
      action: 'careerIntelligence',
      url: 'https://share2inspire.pt/career-intelligence/',
      discount: planTier === 'pro' ? '9,99€' : null,
      discountOriginal: planTier === 'pro' ? '39€' : null,
      label: 'Career Intelligence',
      desc: lang === 'pt' ? 'Análise avançada de mercado e posicionamento' : 'Advanced market analysis and positioning',
    },
  ];

  const remainingAnalyses = Math.max(0, weeklyLimit - weeklyUsage);

  // ─── Render inline panel content ────────────────────────────────────────
  const renderInlinePanel = (tool: ToolDef) => {
    if (tool.action === 'cv') {
      return (
        <div className="space-y-4">
          {/* CV source info */}
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

          {/* File upload */}
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#ccc] rounded text-xs text-[#666] hover:border-gold/40 hover:text-gold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {cvFile ? cvFile.name : (lang === 'pt' ? 'Ou carrega outro CV (PDF, DOCX, TXT)' : 'Or upload another CV (PDF, DOCX, TXT)')}
            </button>
          </div>

          {/* Execute */}
          <button
            onClick={runCvAnalysis}
            disabled={analyzing || (!profile?.cv_url && !cvFile) || (weeklyUsage >= weeklyLimit)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{lang === 'pt' ? 'A analisar...' : 'Analyzing...'}</>
            ) : (
              <><BarChart3 className="w-4 h-4" />{lang === 'pt' ? 'Executar análise de CV' : 'Run CV analysis'}</>
            )}
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

          <button
            onClick={runLinkedinAnalysis}
            disabled={analyzing || !profile?.linkedin_url || (weeklyUsage >= weeklyLimit)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{lang === 'pt' ? 'A analisar perfil LinkedIn...' : 'Analyzing LinkedIn profile...'}</>
            ) : (
              <><Linkedin className="w-4 h-4" />{lang === 'pt' ? 'Analisar perfil LinkedIn' : 'Analyze LinkedIn profile'}</>
            )}
          </button>
        </div>
      );
    }

    if (tool.action === 'careerPath') {
      const cpAvailable = monthlyCareerPathUsed < 1;
      return (
        <div className="space-y-4">
          {/* Pro included badge */}
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{lang === 'pt' ? '1 Career Path incluído por mês no plano Pro' : '1 Career Path included per month on Pro plan'}</span>
            {!cpAvailable && (
              <span className="ml-auto text-amber-600 font-medium">
                {lang === 'pt' ? '(já utilizado este mês)' : '(already used this month)'}
              </span>
            )}
          </div>

          {/* CV source */}
          <div>
            {profile?.cv_url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700/70 bg-emerald-50/50 border border-emerald-200/50 rounded px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'CV do perfil' : 'Profile CV'}: {profile.cv_filename || 'CV'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'Sem CV no perfil. Carrega um ficheiro.' : 'No CV in profile. Upload a file.'}</span>
              </div>
            )}
          </div>

          {/* File upload */}
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#ccc] rounded text-xs text-[#666] hover:border-gold/40 hover:text-gold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {cvFile ? cvFile.name : (lang === 'pt' ? 'Ou carrega outro CV' : 'Or upload another CV')}
            </button>
          </div>

          {/* Country & Region dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">
                <Globe className="w-3 h-3 inline mr-1" />{lang === 'pt' ? 'País' : 'Country'}
              </label>
              <select
                value={cpCountry}
                onChange={e => { setCpCountry(e.target.value); setCpRegion(''); }}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.country}>{c.country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">
                <MapPin className="w-3 h-3 inline mr-1" />{lang === 'pt' ? 'Região' : 'Region'}
              </label>
              <select
                value={cpRegion}
                onChange={e => setCpRegion(e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white"
              >
                <option value="">{lang === 'pt' ? 'Selecionar região...' : 'Select region...'}</option>
                {availableRegions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Execute */}
          <button
            onClick={runCareerPath}
            disabled={analyzing || !cpAvailable || (!profile?.cv_url && !cvFile)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{lang === 'pt' ? 'A gerar Career Path...' : 'Generating Career Path...'}</>
            ) : (
              <><Route className="w-4 h-4" />{lang === 'pt' ? 'Gerar Career Path' : 'Generate Career Path'}</>
            )}
          </button>
        </div>
      );
    }

    if (tool.action === 'careerIntelligence') {
      const ciAvailable = monthlyCareerIntelUsed < 1;
      return (
        <div className="space-y-4">
          {/* Pro included badge */}
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{lang === 'pt' ? '1 Career Intelligence incluído por mês no plano Pro' : '1 Career Intelligence included per month on Pro plan'}</span>
            {!ciAvailable && (
              <span className="ml-auto text-amber-600 font-medium">
                {lang === 'pt' ? '(já utilizado este mês)' : '(already used this month)'}
              </span>
            )}
          </div>

          {/* CV source */}
          <div>
            {profile?.cv_url ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700/70 bg-emerald-50/50 border border-emerald-200/50 rounded px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'CV do perfil' : 'Profile CV'}: {profile.cv_filename || 'CV'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{lang === 'pt' ? 'Sem CV no perfil. Carrega um ficheiro.' : 'No CV in profile. Upload a file.'}</span>
              </div>
            )}
          </div>

          {/* File upload */}
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#ccc] rounded text-xs text-[#666] hover:border-gold/40 hover:text-gold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {cvFile ? cvFile.name : (lang === 'pt' ? 'Ou carrega outro CV' : 'Or upload another CV')}
            </button>
          </div>

          {/* Country & Region dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">
                <Globe className="w-3 h-3 inline mr-1" />{lang === 'pt' ? 'País' : 'Country'}
              </label>
              <select
                value={cpCountry}
                onChange={e => { setCpCountry(e.target.value); setCpRegion(''); }}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.country}>{c.country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wider mb-1 block">
                <MapPin className="w-3 h-3 inline mr-1" />{lang === 'pt' ? 'Região' : 'Region'}
              </label>
              <select
                value={cpRegion}
                onChange={e => setCpRegion(e.target.value)}
                className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] focus:border-gold/30 focus:outline-none bg-white"
              >
                <option value="">{lang === 'pt' ? 'Selecionar região...' : 'Select region...'}</option>
                {availableRegions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Execute */}
          <button
            onClick={runCareerIntelligence}
            disabled={analyzing || !ciAvailable || (!profile?.cv_url && !cvFile)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{lang === 'pt' ? 'A gerar análise...' : 'Generating analysis...'}</>
            ) : (
              <><Sparkles className="w-4 h-4" />{lang === 'pt' ? 'Gerar Career Intelligence' : 'Generate Career Intelligence'}</>
            )}
          </button>
        </div>
      );
    }

    return null;
  };

  // ─── Routing automático: sem subscrição activa → UpgradePage ─────────────
  const hasActiveSub = subscription && subscription.status === 'active' && new Date(subscription.expires_at) > new Date();
  if (!hasActiveSub) {
    return <UpgradePage />;
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="text-gold text-xs font-light tracking-[0.15em] uppercase mb-2">{t('member.title')}</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1a1a]">
              {profile?.first_name ? `${t('member.welcome')}, ${profile.first_name}.` : t('member.welcome')}
            </h1>
          </div>
          {subscription && (
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#999] font-light flex-wrap">
              <span className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${
                planTier === 'pro' ? 'bg-violet-100 text-violet-700 border border-violet-200' :
                planTier === 'growth' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                'bg-gold/10 text-gold border border-gold/20'
              }`}>
                {planTier === 'pro' ? 'Pro' : planTier === 'growth' ? 'Growth' : 'Essential'}
              </span>
              <Clock className="w-3.5 h-3.5" />
              <span>{t('member.planExpires')} {new Date(subscription.expires_at).toLocaleDateString('pt-PT')}</span>
              <span className="px-2 py-0.5 bg-gold/10 border border-gold/20 rounded text-gold text-[10px] font-medium">
                {daysLeft} {t('member.daysLeft')}
              </span>
            </div>
           )}
        </div>

        {/* ─── Tab Navigation ─── */}
        <div className="mb-8 border-b border-[#e5e5e5]">
          <nav className="flex gap-0 -mb-px overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'border-gold text-gold'
                      : 'border-transparent text-[#999] hover:text-[#666] hover:border-[#ddd]'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {lang === 'pt' ? tab.labelPt : tab.labelEn}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ═══════════════════ TAB: OVERVIEW ═══════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">

        {/* Usage indicator */}
        {subscription && (
          <div className="mb-8 p-4 border border-[#e5e5e5] rounded-lg bg-[#fafaf9]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs font-medium text-[#1a1a1a]">
                  {t('member.analysesThisWeek')}
                </span>
                <span className="text-[10px] text-[#aaa] font-light">
                  (CV Analyser + LinkedIn Roaster)
                </span>
              </div>
              <span className="text-xs text-[#999]">
                {`${weeklyUsage}/${weeklyLimit}`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (weeklyUsage / weeklyLimit) * 100)}%` }}
              />
            </div>
            {remainingAnalyses > 0 && (
              <p className="text-[10px] text-[#999] mt-1.5">
                {`${remainingAnalyses} ${t('member.remaining')}`}
              </p>
            )}
            {remainingAnalyses === 0 && (
              <p className="text-[10px] text-amber-600 mt-1.5">
                {lang === 'pt' ? 'Limite semanal atingido. Renova na próxima semana.' : 'Weekly limit reached. Resets next week.'}
              </p>
            )}
          </div>
        )}

        {/* Career Progress */}
        <section className="mb-12">
          <h2 className="text-sm font-medium text-[#1a1a1a] mb-1">
            {t('member.myCareerProfile')}
          </h2>
          <p className="text-xs text-[#999] font-light mb-4">
            {t('member.myCareerProfileDesc')}
          </p>
          <CareerProgress variant="compact" />
        </section>

        {/* Vagas Feed — Growth+ only */}
        {planTier !== 'essential' ? (
          <VagasFeed lang={lang} countryCode={selectedCountryData?.code || 'PT'} countryName={cpCountry} region={cpRegion || undefined} />
        ) : (
          <section className="mb-16 p-6 border border-dashed border-[#e5e5e5] rounded-lg bg-[#fafaf9] text-center">
            <Lock className="w-6 h-6 text-[#ccc] mx-auto mb-3" />
            <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">{lang === 'pt' ? 'Feed de Vagas' : 'Job Feed'}</h3>
            <p className="text-xs text-[#999] font-light mb-4 max-w-sm mx-auto">{t('member.lockedVagas')}</p>
            <a href="/planos" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold/10 border border-gold/20 text-gold text-xs font-medium rounded hover:bg-gold/20 transition-all">
              <Sparkles className="w-3.5 h-3.5" />
              {t('member.upgradeCta')}
            </a>
          </section>
        )}

          {/* Quick links to other tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => setActiveTab('tools')} className="p-4 border border-[#e5e5e5] rounded-lg hover:border-gold/30 transition-all text-left group">
              <Wrench className="w-5 h-5 text-[#999] group-hover:text-gold mb-2 transition-colors" />
              <p className="text-xs font-medium text-[#1a1a1a]">{lang === 'pt' ? 'Ferramentas' : 'Tools'}</p>
              <p className="text-[10px] text-[#999]">{lang === 'pt' ? 'Analisa o teu CV' : 'Analyse your CV'}</p>
            </button>
            <button onClick={() => setActiveTab('jobs')} className="p-4 border border-[#e5e5e5] rounded-lg hover:border-gold/30 transition-all text-left group">
              <Briefcase className="w-5 h-5 text-[#999] group-hover:text-gold mb-2 transition-colors" />
              <p className="text-xs font-medium text-[#1a1a1a]">{lang === 'pt' ? 'Vagas' : 'Jobs'}</p>
              <p className="text-[10px] text-[#999]">{lang === 'pt' ? 'Oportunidades para ti' : 'Opportunities for you'}</p>
            </button>
            <button onClick={() => setActiveTab('content')} className="p-4 border border-[#e5e5e5] rounded-lg hover:border-gold/30 transition-all text-left group">
              <BookOpen className="w-5 h-5 text-[#999] group-hover:text-gold mb-2 transition-colors" />
              <p className="text-xs font-medium text-[#1a1a1a]">{lang === 'pt' ? 'Conte\u00fados' : 'Content'}</p>
              <p className="text-[10px] text-[#999]">{lang === 'pt' ? 'Artigos e recursos' : 'Articles & resources'}</p>
            </button>
            <button onClick={() => setActiveTab('profile')} className="p-4 border border-[#e5e5e5] rounded-lg hover:border-gold/30 transition-all text-left group">
              <User className="w-5 h-5 text-[#999] group-hover:text-gold mb-2 transition-colors" />
              <p className="text-xs font-medium text-[#1a1a1a]">{lang === 'pt' ? 'Perfil' : 'Profile'}</p>
              <p className="text-[10px] text-[#999]">{lang === 'pt' ? 'Dados e an\u00e1lises' : 'Data & analyses'}</p>
            </button>
          </div>

          </div>
        )}

        {/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 TAB: TOOLS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */}
        {activeTab === 'tools' && (
          <div className="animate-in fade-in duration-300">
        <section className="mb-16">
          <h2 className="text-sm font-medium text-[#1a1a1a] mb-1">{t('member.tools')}</h2>
          <p className="text-xs text-[#999] font-light mb-6">
            {lang === 'pt' ? 'Acede às tuas ferramentas incluídas na subscrição.' : 'Access your tools included in your subscription.'}
          </p>
          <div className="space-y-3">
            {tools.map((tool) => (
              <div key={tool.key} data-tool-key={tool.key} className="border border-[#e5e5e5] rounded-lg overflow-hidden hover:border-gold/20 transition-all duration-500">
                {/* External link tool */}
                {tool.type === 'external' && (
                  <a href={tool.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}>
                      <tool.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#333]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">{tool.label}</h3>
                      <p className="text-[10px] sm:text-[11px] text-[#999] font-light truncate">{tool.desc}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#ccc] group-hover:text-gold/50 transition-colors shrink-0" />
                  </a>
                )}

                {/* Widget trigger tool */}
                {tool.type === 'widget' && (
                  <button
                    onClick={() => {
                      if (tool.action === 'openCareerBot') {
                        window.dispatchEvent(new Event('open-career-bot'));
                      }
                    }}
                    className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 w-full text-left"
                  >
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}>
                      <tool.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#333]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">{tool.label}</h3>
                      <p className="text-[10px] sm:text-[11px] text-[#999] font-light truncate">{tool.desc}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#ccc] group-hover:text-gold/50 transition-colors shrink-0" />
                  </button>
                )}

                {/* Locked tool */}
                {tool.type === 'locked' && (
                  <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 opacity-50">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}>
                      <tool.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#333]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-medium text-[#1a1a1a]">{tool.label}</h3>
                      <p className="text-[10px] sm:text-[11px] text-[#999] font-light truncate">{tool.desc}</p>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-[#ccc] shrink-0" />
                  </div>
                )}

                {/* Discount tool (external link + discount badge) */}
                {tool.type === 'discount' && (
                  <a href={tool.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}>
                        <tool.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#333]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">{tool.label}</h3>
                        <p className="text-[10px] sm:text-[11px] text-[#999] font-light truncate">{tool.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-12 sm:ml-0">
                      {tool.discountOriginal && (
                        <span className="text-[10px] text-[#bbb] line-through">{tool.discountOriginal}</span>
                      )}
                      <span className="flex items-center gap-1 px-2 py-1 bg-gold/5 border border-gold/20 rounded text-[10px] text-gold font-medium">
                        <Tag className="w-3 h-3" />
                        {tool.discount}
                      </span>
                    </div>
                  </a>
                )}

                {/* Inline expandable tool */}
                {tool.type === 'inline' && (
                  <>
                    <button onClick={() => toggleTool(tool.key)} className="group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 w-full text-left">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center bg-gradient-to-br ${tool.color} shrink-0`}>
                        <tool.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#333]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">{tool.label}</h3>
                        <p className="text-[10px] sm:text-[11px] text-[#999] font-light truncate">{tool.desc}</p>
                      </div>
                      {tool.action === 'careerPath' && planTier === 'pro' && (
                        <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-700 font-medium shrink-0 mr-2">
                          {monthlyCareerPathUsed < 1
                            ? `1 ${t('member.includedMonth')}`
                            : t('member.used')
                          }
                        </span>
                      )}
                      {tool.action === 'careerIntelligence' && planTier === 'pro' && (
                        <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-[10px] text-emerald-700 font-medium shrink-0 mr-2">
                          {monthlyCareerIntelUsed < 1
                            ? `1 ${t('member.includedMonth')}`
                            : t('member.used')
                          }
                        </span>
                      )}
                      {expandedTool === tool.key ? (
                        <ChevronUp className="w-4 h-4 text-gold shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#ccc] group-hover:text-gold/50 transition-colors shrink-0" />
                      )}
                    </button>

                    {expandedTool === tool.key && (
                      <div className="border-t border-[#e5e5e5] p-5 bg-[#fafaf9]">
                        {renderInlinePanel(tool)}

                        {/* Error */}
                        {analysisError && (
                          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-4">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{analysisError}</span>
                          </div>
                        )}

                        {/* Result */}
                        {analysisResult && (
                          analysisResult._enriched ? (
                            <div className="mt-4 border border-gold/20 rounded-lg bg-[#fafaf9] p-4 animate-in fade-in duration-500">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  <h4 className="text-sm font-semibold text-[#1a1a1a]">
                                    {lang === 'pt' ? 'Análise concluída' : 'Analysis complete'}
                                  </h4>
                                </div>
                                <button onClick={() => setAnalysisResult(null)} className="text-xs text-[#999] hover:text-[#1a1a1a] transition-colors">
                                  {lang === 'pt' ? 'Fechar' : 'Close'}
                                </button>
                              </div>
                              <AnalysisResultsFull data={analysisResult._enriched} />
                            </div>
                          ) : (
                            <AnalysisResult data={analysisResult} onClose={() => setAnalysisResult(null)} lang={lang} />
                          )
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
         </section>
          </div>
        )}

        {/* ═══════════════════ TAB: JOBS ═══════════════════ */}
        {activeTab === 'jobs' && (
          <div className="animate-in fade-in duration-300">
            {planTier !== 'essential' ? (
              <VagasFeed lang={lang} countryCode={selectedCountryData?.code || 'PT'} countryName={cpCountry} region={cpRegion || undefined} />
            ) : (
              <section className="p-6 border border-dashed border-[#e5e5e5] rounded-lg bg-[#fafaf9] text-center">
                <Lock className="w-6 h-6 text-[#ccc] mx-auto mb-3" />
                <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">{lang === 'pt' ? 'Feed de Vagas' : 'Job Feed'}</h3>
                <p className="text-xs text-[#999] font-light mb-4 max-w-sm mx-auto">{t('member.lockedVagas')}</p>
                <a href="/planos" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold/10 border border-gold/20 text-gold text-xs font-medium rounded hover:bg-gold/20 transition-all">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('member.upgradeCta')}
                </a>
              </section>
            )}
          </div>
        )}

        {/* ═══════════════════ TAB: CONTENT ═══════════════════ */}
        {activeTab === 'content' && (
          <div className="animate-in fade-in duration-300">
        {/* Content — Growth+ only */}
        {planTier === 'essential' ? (
          <section className="p-6 border border-dashed border-[#e5e5e5] rounded-lg bg-[#fafaf9] text-center">
            <Lock className="w-6 h-6 text-[#ccc] mx-auto mb-3" />
            <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">{t('member.content')}</h3>
            <p className="text-xs text-[#999] font-light mb-4 max-w-sm mx-auto">{t('member.lockedContent')}</p>
            <a href="/planos" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold/10 border border-gold/20 text-gold text-xs font-medium rounded hover:bg-gold/20 transition-all">
              <Sparkles className="w-3.5 h-3.5" />
              {t('member.upgradeCta')}
            </a>
          </section>
        ) : (
        <section>
          <h2 className="text-sm font-medium text-[#1a1a1a] mb-1">{t('member.content')}</h2>
          <p className="text-xs text-[#999] font-light mb-6">{t('member.contentDesc')}</p>

          {/* AI Templates — Career Bot powered */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              {
                icon: FileText,
                color: 'from-gold/20 to-gold/5',
                event: 'open-career-bot-cover-letter',
                title: t('member.coverLetter'),
                desc: t('member.coverLetterDesc'),
                cta: t('member.generate'),
                btnStyle: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)',
                ctaIcon: 'bot',
              },
              {
                icon: Mail,
                color: 'from-blue-500/15 to-blue-500/5',
                event: 'open-career-bot-networking-email',
                title: t('member.networkingEmail'),
                desc: t('member.networkingEmailDesc'),
                cta: t('member.generate'),
                btnStyle: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)',
                ctaIcon: 'bot',
              },
              {
                icon: Megaphone,
                color: 'from-sky-500/15 to-sky-500/5',
                event: 'open-career-bot-linkedin-post',
                title: t('member.linkedinPost'),
                desc: t('member.linkedinPostDesc'),
                cta: t('member.generate'),
                btnStyle: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)',
                ctaIcon: 'bot',
              },
              {
                icon: Linkedin,
                color: 'from-[#0A66C2]/15 to-[#0A66C2]/5',
                event: 'open-headline-generator',
                title: t('member.linkedinHeadline'),
                desc: t('member.linkedinHeadlineDesc'),
                cta: t('member.generateHeadlines'),
                btnStyle: 'linear-gradient(135deg, #BFA14A 0%, #8F7A3A 100%)',
                ctaIcon: 'sparkle',
              },
            ].map((tpl) => (
              <div key={tpl.event} className="p-3 sm:p-4 border border-[#e5e5e5] rounded-lg hover:border-gold/30 transition-all group flex flex-col h-full">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${tpl.color} flex items-center justify-center mb-2 sm:mb-3`}>
                  <tpl.icon className="w-4.5 h-4.5 text-[#333]" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1 group-hover:text-gold transition-colors">{tpl.title}</h3>
                <p className="text-[10px] sm:text-[11px] text-[#999] font-light leading-relaxed mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-none flex-1">{tpl.desc}</p>
                <button
                  onClick={() => window.dispatchEvent(new Event(tpl.event))}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium text-white transition-all hover:opacity-90 mt-auto"
                  style={{ background: tpl.btnStyle }}
                >
                  {tpl.ctaIcon === 'sparkle' ? <Sparkles className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  {tpl.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex gap-2 flex-wrap">
              {contentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 text-xs rounded transition-all duration-300 ${
                    filter === type
                      ? 'bg-gold/10 border border-gold/20 text-gold font-medium'
                      : 'border border-[#e5e5e5] text-[#888] hover:text-[#1a1a1a]/60 hover:border-[#ddd]'
                  }`}
                >
                  {filterLabels[type]}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-auto sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('member.search')}
                className="pl-8 pr-3 py-2 bg-[#f7f7f6] border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] placeholder-[#aaa] focus:border-gold/30 focus:outline-none transition-colors w-full sm:w-56"
              />
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
              <p className="text-sm text-[#999] font-light">{t('member.noContent')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => {
                const isVideo = item.content_type === 'video';
                const isPodcast = item.content_type === 'podcast';
                const youtubeId = isVideo && item.file_url ? getYouTubeId(item.file_url) : null;

                // Podcast card with Spotify embed
                if (isPodcast) {
                  return (
                    <div key={item.id} className="border border-[#e5e5e5] rounded overflow-hidden col-span-1 sm:col-span-2 lg:col-span-3">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[10px] text-[#999] uppercase tracking-wider flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            podcast
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">{item.title}</h3>
                        <p className="text-[11px] text-[#999] font-light leading-relaxed mb-3">{item.description}</p>
                        <iframe
                          style={{ borderRadius: '12px' }}
                          src={item.file_url}
                          width="100%"
                          height="352"
                          frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  );
                }

                // Video card with YouTube embed
                if (isVideo && youtubeId) {
                  return (
                    <div key={item.id} className="border border-[#e5e5e5] rounded overflow-hidden hover:border-gold/20 transition-all duration-500">
                      <div className="aspect-video bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId}`}
                          title={item.title}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[10px] text-[#999] uppercase tracking-wider flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            video
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-[#1a1a1a] mb-1">{item.title}</h3>
                        <p className="text-[11px] text-[#999] font-light line-clamp-2 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  );
                }

                // Standard content card (ebook, article, template)
                return (
                  <a
                    key={item.id}
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group border border-[#e5e5e5] rounded overflow-hidden hover:border-gold/20 transition-all duration-500"
                  >
                    {item.thumbnail_url && (
                      <div className="aspect-[16/9] bg-white/[0.02] overflow-hidden">
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[10px] text-[#999] uppercase tracking-wider">
                          {item.content_type}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors mb-1">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-[#999] font-light line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1 text-[11px] text-gold/50 group-hover:text-gold transition-colors">
                        <span>{t('member.access')}</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
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

        {/* ═══════════════════ TAB: PROFILE ═══════════════════ */}
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in duration-300">

            {/* Personal Info */}
            <section className="border border-[#e5e5e5] rounded-lg p-6 bg-[#fafaf9]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-[#1a1a1a]">{lang === 'pt' ? 'Dados Pessoais' : 'Personal Info'}</h2>
                {!profileEditMode ? (
                  <button onClick={() => setProfileEditMode(true)} className="text-xs text-gold hover:underline">
                    {lang === 'pt' ? 'Editar' : 'Edit'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!user?.id) return;
                        setProfileSaving(true);
                        await supabase.from('user_profiles').update({
                          first_name: editFirstName,
                          last_name: editLastName,
                          phone: editPhone,
                          linkedin_url: editLinkedin,
                        }).eq('user_id', user.id);
                        setProfileSaving(false);
                        setProfileEditMode(false);
                        window.location.reload();
                      }}
                      disabled={profileSaving}
                      className="text-xs text-white bg-gold px-3 py-1 rounded hover:bg-gold/90 transition-colors disabled:opacity-50"
                    >
                      {profileSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'pt' ? 'Guardar' : 'Save')}
                    </button>
                    <button onClick={() => setProfileEditMode(false)} className="text-xs text-[#999] hover:text-[#666]">
                      {lang === 'pt' ? 'Cancelar' : 'Cancel'}
                    </button>
                  </div>
                )}
              </div>
              {profileEditMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">{lang === 'pt' ? 'Nome' : 'First Name'}</label>
                    <input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] bg-white focus:border-gold/30 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">{lang === 'pt' ? 'Apelido' : 'Last Name'}</label>
                    <input value={editLastName} onChange={e => setEditLastName(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] bg-white focus:border-gold/30 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">{lang === 'pt' ? 'Telefone' : 'Phone'}</label>
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] bg-white focus:border-gold/30 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#999] uppercase tracking-wider block mb-1">LinkedIn</label>
                    <input value={editLinkedin} onChange={e => setEditLinkedin(e.target.value)} className="w-full px-3 py-2 border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] bg-white focus:border-gold/30 focus:outline-none" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{lang === 'pt' ? 'Nome' : 'Name'}</p>
                    <p className="text-xs font-medium text-[#1a1a1a]">{profile?.first_name} {profile?.last_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">Email</p>
                    <p className="text-xs font-medium text-[#1a1a1a]">{profile?.email || user?.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{lang === 'pt' ? 'Telefone' : 'Phone'}</p>
                    <p className="text-xs font-medium text-[#1a1a1a]">{profile?.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">LinkedIn</p>
                    <p className="text-xs font-medium text-[#1a1a1a] truncate">{profile?.linkedin_url ? <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">{profile.linkedin_url.replace(/^https?:\/\/(www\.)?/, '')}</a> : '-'}</p>
                  </div>
                </div>
              )}
            </section>

            {/* CV Upload */}
            <section className="border border-[#e5e5e5] rounded-lg p-6 bg-[#fafaf9]">
              <h2 className="text-sm font-medium text-[#1a1a1a] mb-4">{lang === 'pt' ? 'Curr\u00edculo' : 'CV / Resume'}</h2>
              {profile?.cv_url ? (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gold" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1a1a1a] truncate">{profile.cv_filename || 'CV'}</p>
                    <p className="text-[10px] text-[#999]">{profile.cv_uploaded_at ? new Date(profile.cv_uploaded_at).toLocaleDateString('pt-PT') : ''}</p>
                  </div>
                  <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline flex items-center gap-1">
                    <Download className="w-3 h-3" /> {lang === 'pt' ? 'Ver' : 'View'}
                  </a>
                </div>
              ) : (
                <p className="text-xs text-[#999]">{lang === 'pt' ? 'Nenhum CV carregado. Carrega um CV na tab Ferramentas para usar as ferramentas de an\u00e1lise.' : 'No CV uploaded. Upload a CV in the Tools tab to use analysis tools.'}</p>
              )}
            </section>

            {/* Subscription Info */}
            {subscription && (
              <section className="border border-[#e5e5e5] rounded-lg p-6 bg-[#fafaf9]">
                <h2 className="text-sm font-medium text-[#1a1a1a] mb-4">{lang === 'pt' ? 'Subscri\u00e7\u00e3o' : 'Subscription'}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{lang === 'pt' ? 'Plano' : 'Plan'}</p>
                    <p className="text-xs font-medium text-[#1a1a1a]">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        planTier === 'pro' ? 'bg-violet-100 text-violet-700' :
                        planTier === 'growth' ? 'bg-blue-100 text-blue-700' :
                        'bg-gold/10 text-gold'
                      }`}>
                        {planTier === 'pro' ? 'Pro' : planTier === 'growth' ? 'Growth' : 'Essential'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{lang === 'pt' ? 'Estado' : 'Status'}</p>
                    <p className="text-xs font-medium text-emerald-600">{subscription.status === 'active' ? (lang === 'pt' ? 'Ativa' : 'Active') : subscription.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{lang === 'pt' ? 'Expira' : 'Expires'}</p>
                    <p className="text-xs font-medium text-[#1a1a1a]">{new Date(subscription.expires_at).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">{lang === 'pt' ? 'Dias restantes' : 'Days left'}</p>
                    <p className="text-xs font-medium text-[#1a1a1a]">{daysLeft}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Career Progress (detailed) */}
            <section className="border border-[#e5e5e5] rounded-lg p-6 bg-[#fafaf9]">
              <h2 className="text-sm font-medium text-[#1a1a1a] mb-4">{lang === 'pt' ? 'Progresso de Carreira' : 'Career Progress'}</h2>
              <CareerProgress variant="detailed" />
            </section>

            {/* Saved Analyses */}
            <section className="border border-[#e5e5e5] rounded-lg p-6 bg-[#fafaf9]">
              <h2 className="text-sm font-medium text-[#1a1a1a] mb-4">{lang === 'pt' ? 'An\u00e1lises Guardadas' : 'Saved Analyses'}</h2>
              {loadingSaved ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gold mx-auto" />
                </div>
              ) : savedAnalyses.length === 0 ? (
                <p className="text-xs text-[#999] text-center py-8">{lang === 'pt' ? 'Ainda n\u00e3o tens an\u00e1lises guardadas. Usa as ferramentas para gerar a tua primeira an\u00e1lise.' : 'No saved analyses yet. Use the tools to generate your first analysis.'}</p>
              ) : (
                <div className="space-y-3">
                  {savedAnalyses.map((sa) => {
                    const config = TOOL_CONFIG[sa.analysis_type] || { label: sa.analysis_type, icon: FileText, color: 'text-[#999]' };
                    const ToolIcon = config.icon;
                    return (
                      <div key={sa.id} className="flex items-center gap-3 p-3 border border-[#e5e5e5] rounded-lg hover:border-gold/20 transition-all">
                        <ToolIcon className={`w-4 h-4 ${config.color} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#1a1a1a]">{config.label}</p>
                          <p className="text-[10px] text-[#999]">{new Date(sa.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <button
                          onClick={async () => {
                            if (confirm(lang === 'pt' ? 'Tens a certeza que queres apagar esta an\u00e1lise?' : 'Are you sure you want to delete this analysis?')) {
                              await supabase.from('user_analyses').delete().eq('id', sa.id);
                              setSavedAnalyses(prev => prev.filter(a => a.id !== sa.id));
                            }
                          }}
                          className="text-[#ccc] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        )}

      </div>
    </div>
  );
}
