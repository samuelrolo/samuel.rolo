// LinkedIn Roaster — Resultados | Share2Inspire
// Dashboard completo de auditoria LinkedIn com 10 secções
import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown, ChevronUp, Linkedin, Target, Eye, TrendingUp,
  Sparkles, Award, Shield, Zap, FileText, Copy, Check, BarChart3,
  AlertTriangle, CheckCircle2, XCircle, ArrowRight, Flame,
  GraduationCap, Globe, Search, Users, Star, RefreshCw, Download
} from "lucide-react";
import S2IFooter from "@/components/S2IFooter";
import S2IHeader from "@/components/S2IHeader";

// ─── Types ───
interface Dimension { score: number; analise: string; }
interface SectionScore { score: number; analise: string; }
interface Gap { area: string; gap: string; }
interface AreaMelhoria { area: string; diagnostico: string; recomendacao: string; }

interface AnaliseCompleta {
  sumario_executivo: string;
  visibilidade_algoritmo: string;
  dimensoes: Record<string, Dimension>;
  scores_seccao: Record<string, SectionScore>;
  benchmarking: {
    setor: string;
    percentil_estimado: number;
    resumo: string;
    gaps_vs_top: Gap[];
    vantagens_competitivas: string[];
  };
  seo_linkedin: {
    keywords_primarias: string[];
    keywords_secundarias: string[];
    keywords_em_falta: string[];
    keywords_por_seccao: Record<string, string[]>;
    densidade_score: number;
    recomendacoes_seo: string;
  };
  pontos_fortes: string[];
  areas_melhoria: AreaMelhoria[];
  headlines_sugeridas: string[];
  dicas_seo: string[];
  analise_formacao: string;
  analise_rede: string;
  recomendacao_prioritaria: string;
}

// ─── Helpers ───
const scoreColor = (s: number, max = 10) => {
  const n = max === 100 ? s : s * 10;
  return n >= 70 ? 'text-green-600' : n >= 50 ? 'text-amber-600' : 'text-red-600';
};
const scoreBg = (s: number, max = 10) => {
  const n = max === 100 ? s : s * 10;
  return n >= 70 ? 'bg-green-50 border-green-200' : n >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
};
const scoreRing = (s: number) => {
  return s >= 7 ? 'stroke-green-500' : s >= 5 ? 'stroke-amber-500' : 'stroke-red-500';
};
const visibilityColor = (v: string) => {
  const lower = (v || '').toLowerCase();
  if (lower.includes('alta') || lower.includes('high')) return 'bg-green-100 text-green-700 border-green-300';
  if (lower.includes('média') || lower.includes('media') || lower.includes('medium')) return 'bg-amber-100 text-amber-700 border-amber-300';
  return 'bg-red-100 text-red-700 border-red-300';
};

const dimensionLabels: Record<string, string> = {
  headline_sumario: 'Headline & About',
  experiencia_conteudo: 'Experiência',
  formacao_certificacoes: 'Formação',
  rede_alcance: 'Rede & Alcance',
  seo_keywords: 'SEO & Keywords',
};

const sectionLabels: Record<string, string> = {
  headline: 'Headline',
  about: 'About',
  experience: 'Experiência',
  skills: 'Competências',
  education: 'Formação',
  certifications: 'Certificações',
  recommendations: 'Recomendações',
  network: 'Rede',
};

const sectionIcons: Record<string, any> = {
  headline: Target,
  about: FileText,
  experience: TrendingUp,
  skills: Zap,
  education: GraduationCap,
  certifications: Award,
  recommendations: Star,
  network: Users,
};

// ─── Score Circle SVG ───
function ScoreCircle({ score, size = 120, strokeWidth = 8, max = 10 }: { score: number; size?: number; strokeWidth?: number; max?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / max, 1);
  const offset = circumference * (1 - pct);
  const colorClass = max === 10 ? scoreRing(score) : scoreRing(score / 10);
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={radius} className={colorClass} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
    </svg>
  );
}

// ─── Copy Button ───
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-600 transition-colors">
      {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
    </button>
  );
}

// ─── Expandable Section ───
function Section({ title, subtitle, icon: Icon, children, defaultOpen = false, badge }: {
  title: string; subtitle?: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl mb-5 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-orange-600" />
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

// ════════════════════════════════════════
// ─── MAIN COMPONENT ───
// ════════════════════════════════════════
export default function LinkedInRoasterResults() {
  useEffect(() => { document.title = "Resultados — LinkedIn Roaster | Share2Inspire"; }, []);

  // Load from sessionStorage
  const rawData = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('linkedinRoasterAnalysis') || '{}'); } catch { return {}; }
  }, []);

  const isPaid = sessionStorage.getItem('linkedinRoasterPaid') === 'true';

  useEffect(() => {
    if (!isPaid) { window.location.href = '/linkedin-roaster'; }
  }, [isPaid]);

  // Extract teaser & analysis
  const teaser = rawData?.teaser || rawData?.data?.teaser || {};
  const analysis: AnaliseCompleta = rawData?.analise_completa || rawData?.data?.analise_completa || rawData?.analysis || {};

  const notaGeral = teaser?.nota_geral || 0;
  const hookVendas = teaser?.hook_vendas || '';
  const visibilidade = analysis?.visibilidade_algoritmo || '';
  const sumario = analysis?.sumario_executivo || '';

  // Sections
  const dimensoes = analysis?.dimensoes || {};
  const scoresSeccao = analysis?.scores_seccao || {};
  const benchmarking = analysis?.benchmarking || {} as any;
  const seoLinkedin = analysis?.seo_linkedin || {} as any;
  const pontosFortes = analysis?.pontos_fortes || [];
  const areasMelhoria = analysis?.areas_melhoria || [];
  const headlinesSugeridas = analysis?.headlines_sugeridas || [];
  const analiseFormacao = analysis?.analise_formacao || '';
  const analiseRede = analysis?.analise_rede || '';
  const recomendacaoPrioritaria = analysis?.recomendacao_prioritaria || '';

  const [expandedMelhoria, setExpandedMelhoria] = useState<number | null>(null);
  const [seoTab, setSeoTab] = useState('headline');

  if (!isPaid) return null;

  const hasData = notaGeral > 0 || sumario || Object.keys(dimensoes).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <S2IHeader activePage="linkedin-roaster" langToggleHref="/en/linkedin-roaster" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Action buttons */}
        <div className="flex justify-end gap-2 mb-6">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-600 transition-colors">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
          <button onClick={() => { sessionStorage.removeItem('linkedinRoasterAnalysis'); sessionStorage.removeItem('linkedinRoasterPaid'); window.location.href = '/linkedin-roaster'; }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-sm font-medium text-orange-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Reanalisar
          </button>
        </div>

        {!hasData ? (
          <div className="text-center py-20">
            <Linkedin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">Sem dados de análise</h2>
            <p className="text-slate-500 mb-6">A análise não retornou resultados. Isto pode acontecer se o perfil for privado.</p>
            <a href="/linkedin-roaster" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold">
              <Flame className="w-5 h-5" /> Tentar novamente
            </a>
          </div>
        ) : (
          <>
            {/* ═══ SECÇÃO 1 — HERO / TEASER ═══ */}
            <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-2xl p-6 md:p-8 text-white mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-orange-300 text-xs font-bold uppercase tracking-wider mb-4">
                  <Flame className="w-4 h-4" /> LinkedIn Roaster — Relatório Completo
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Score Circle */}
                  <div className="relative shrink-0">
                    <ScoreCircle score={notaGeral} size={140} strokeWidth={10} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{notaGeral}</span>
                      <span className="text-xs text-slate-300">/10</span>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    {hookVendas && (
                      <p className="text-lg md:text-xl font-semibold text-orange-200 mb-3 leading-relaxed">"{hookVendas}"</p>
                    )}
                    {visibilidade && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${visibilityColor(visibilidade)}`}>
                        <Eye className="w-3.5 h-3.5" /> Visibilidade: {visibilidade.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ SECÇÃO 2 — SUMÁRIO EXECUTIVO ═══ */}
            {sumario && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8963E] mb-3">
                  <Sparkles className="w-4 h-4" /> Sumário Executivo
                </div>
                <p className="text-slate-700 leading-relaxed text-base md:text-lg">{sumario}</p>
              </div>
            )}

            {/* ═══ SECÇÃO 3 — DIMENSÕES (5 barras) ═══ */}
            {Object.keys(dimensoes).length > 0 && (
              <Section title="Análise por Dimensão" subtitle="5 áreas-chave do teu perfil" icon={BarChart3} defaultOpen={true}
                badge={<span className="text-sm font-bold text-slate-400">{Object.keys(dimensoes).length} dimensões</span>}>
                <div className="space-y-4">
                  {Object.entries(dimensoes).map(([key, dim]) => (
                    <DimensionBar key={key} label={dimensionLabels[key] || key.replace(/_/g, ' ')} score={dim.score} analise={dim.analise} />
                  ))}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 4 — SCORES POR SECÇÃO (grid 2×4) ═══ */}
            {Object.keys(scoresSeccao).length > 0 && (
              <Section title="Scores por Secção" subtitle="Análise detalhada de cada parte do perfil" icon={Target} defaultOpen={true}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(scoresSeccao).map(([key, sec]) => {
                    const IconComp = sectionIcons[key] || FileText;
                    return (
                      <div key={key} className={`rounded-xl p-4 border ${scoreBg(sec.score)} transition-all hover:shadow-md`}>
                        <div className="flex items-center gap-2 mb-2">
                          <IconComp className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{sectionLabels[key] || key}</span>
                        </div>
                        <p className={`text-2xl font-bold mb-1 ${scoreColor(sec.score)}`}>{sec.score}<span className="text-xs text-slate-400">/10</span></p>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{sec.analise}</p>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 5 — BENCHMARKING ═══ */}
            {benchmarking?.setor && (
              <Section title="Benchmarking" subtitle={`Comparação com profissionais de ${benchmarking.setor}`} icon={TrendingUp} defaultOpen={true}
                badge={<span className={`text-sm font-bold ${scoreColor(benchmarking.percentil_estimado || 0, 100)}`}>Top {100 - (benchmarking.percentil_estimado || 50)}%</span>}>
                <div className="space-y-4">
                  {/* Percentile bar */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">Percentil no setor {benchmarking.setor}</span>
                      <span className={`text-2xl font-bold ${scoreColor(benchmarking.percentil_estimado || 0, 100)}`}>{benchmarking.percentil_estimado || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000"
                        style={{ width: `${benchmarking.percentil_estimado || 0}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Estás melhor que {benchmarking.percentil_estimado}% dos perfis analisados neste setor</p>
                  </div>

                  {benchmarking.resumo && <p className="text-sm text-slate-700 leading-relaxed">{benchmarking.resumo}</p>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gaps */}
                    {Array.isArray(benchmarking.gaps_vs_top) && benchmarking.gaps_vs_top.length > 0 && (
                      <div className="bg-red-50/50 border border-red-200 rounded-xl p-4">
                        <h4 className="font-semibold text-red-700 text-sm mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Gaps vs Top Performers</h4>
                        <ul className="space-y-2">
                          {benchmarking.gaps_vs_top.map((g: Gap, i: number) => (
                            <li key={i} className="text-sm text-slate-700">
                              <span className="font-medium text-red-600">{g.area}:</span> {g.gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Advantages */}
                    {Array.isArray(benchmarking.vantagens_competitivas) && benchmarking.vantagens_competitivas.length > 0 && (
                      <div className="bg-green-50/50 border border-green-200 rounded-xl p-4">
                        <h4 className="font-semibold text-green-700 text-sm mb-3 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Vantagens Competitivas</h4>
                        <ul className="space-y-2">
                          {benchmarking.vantagens_competitivas.map((v: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {v}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 6 — PONTOS FORTES VS ÁREAS DE MELHORIA ═══ */}
            {(pontosFortes.length > 0 || areasMelhoria.length > 0) && (
              <Section title="Pontos Fortes vs Áreas de Melhoria" icon={Shield} defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  {pontosFortes.length > 0 && (
                    <div className="bg-green-50/30 border border-green-200 rounded-xl p-4">
                      <h4 className="font-semibold text-green-700 text-sm mb-3">✅ Pontos Fortes</h4>
                      <ul className="space-y-2.5">
                        {pontosFortes.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Areas for improvement */}
                  {areasMelhoria.length > 0 && (
                    <div className="bg-amber-50/30 border border-amber-200 rounded-xl p-4">
                      <h4 className="font-semibold text-amber-700 text-sm mb-3">⚠️ Áreas de Melhoria</h4>
                      <div className="space-y-2">
                        {areasMelhoria.map((a, i) => (
                          <div key={i} className="border border-amber-200 rounded-lg overflow-hidden">
                            <button onClick={() => setExpandedMelhoria(expandedMelhoria === i ? null : i)}
                              className="w-full flex items-center justify-between p-3 text-left hover:bg-amber-50 transition-colors">
                              <span className="text-sm font-medium text-slate-800">{a.area}</span>
                              {expandedMelhoria === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expandedMelhoria === i && (
                              <div className="px-3 pb-3 space-y-2 border-t border-amber-100">
                                <p className="text-xs text-slate-600 pt-2"><strong>Diagnóstico:</strong> {a.diagnostico}</p>
                                <p className="text-xs text-orange-700 font-medium">💡 {a.recomendacao}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 7 — SEO LINKEDIN ═══ */}
            {(seoLinkedin?.keywords_primarias?.length > 0 || seoLinkedin?.densidade_score) && (
              <Section title="SEO LinkedIn" subtitle="Otimização para o algoritmo do LinkedIn" icon={Search} defaultOpen={false}
                badge={seoLinkedin.densidade_score ? <span className={`text-sm font-bold ${scoreColor(seoLinkedin.densidade_score)}`}>{seoLinkedin.densidade_score}/10</span> : undefined}>
                <div className="space-y-4">
                  {/* Density score bar */}
                  {seoLinkedin.densidade_score && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">Densidade SEO</span>
                        <span className={`text-xl font-bold ${scoreColor(seoLinkedin.densidade_score)}`}>{seoLinkedin.densidade_score}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                          style={{ width: `${(seoLinkedin.densidade_score / 10) * 100}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Keywords badges */}
                  <div className="space-y-3">
                    {seoLinkedin.keywords_primarias?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Keywords Primárias</p>
                        <div className="flex flex-wrap gap-1.5">
                          {seoLinkedin.keywords_primarias.map((kw: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-medium">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {seoLinkedin.keywords_secundarias?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Keywords Secundárias</p>
                        <div className="flex flex-wrap gap-1.5">
                          {seoLinkedin.keywords_secundarias.map((kw: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-medium">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {seoLinkedin.keywords_em_falta?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Keywords em Falta</p>
                        <div className="flex flex-wrap gap-1.5">
                          {seoLinkedin.keywords_em_falta.map((kw: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full text-xs font-medium">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Keywords by section tabs */}
                  {seoLinkedin.keywords_por_seccao && Object.keys(seoLinkedin.keywords_por_seccao).length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Keywords por Secção</p>
                      <div className="flex gap-1 mb-3 overflow-x-auto">
                        {Object.keys(seoLinkedin.keywords_por_seccao).map(tab => (
                          <button key={tab} onClick={() => setSeoTab(tab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${seoTab === tab ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                            {sectionLabels[tab] || tab}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(seoLinkedin.keywords_por_seccao[seoTab] || []).map((kw: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-full text-xs font-medium">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {seoLinkedin.recomendacoes_seo && (
                    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-slate-700 leading-relaxed">💡 {seoLinkedin.recomendacoes_seo}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 8 — HEADLINES SUGERIDAS ═══ */}
            {headlinesSugeridas.length > 0 && (
              <Section title="Headlines Sugeridas" subtitle="3 opções prontas a usar" icon={Sparkles} defaultOpen={true}>
                <div className="space-y-3">
                  {headlinesSugeridas.map((h, i) => (
                    <div key={i} className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs font-bold text-orange-500 bg-orange-100 rounded-full w-7 h-7 flex items-center justify-center shrink-0">{i + 1}</span>
                        <p className="text-sm font-medium text-slate-800 truncate">{h}</p>
                      </div>
                      <CopyButton text={h} />
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 9 — ANÁLISES NARRATIVAS ═══ */}
            {(analiseFormacao || analiseRede) && (
              <Section title="Análises Detalhadas" subtitle="Formação, rede e presença digital" icon={Award} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analiseFormacao && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-[#B8963E]" /> Formação & Certificações
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{analiseFormacao}</p>
                    </div>
                  )}
                  {analiseRede && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h4 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#B8963E]" /> Rede & Presença Digital
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{analiseRede}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ═══ SECÇÃO 10 — RECOMENDAÇÃO PRIORITÁRIA (CTA FINAL) ═══ */}
            {recomendacaoPrioritaria && (
              <div className="bg-gradient-to-r from-[#f9f6ef] to-[#faf8f3] border-2 border-[#C9A961]/30 rounded-2xl p-6 md:p-8 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B8963E] mb-3">
                  <Target className="w-4 h-4" /> Recomendação Prioritária
                </div>
                <p className="text-base md:text-lg font-medium text-slate-800 leading-relaxed mb-6">{recomendacaoPrioritaria}</p>
                <div className="flex flex-wrap gap-3">
                  <a href="/cv-analyser" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
                    Analisar o meu CV <ArrowRight className="w-4 h-4" />
                  </a>
                  <a href="/career-path" className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#C9A961] text-[#B8963E] text-sm font-semibold rounded-xl hover:bg-[#C9A961]/10 transition-colors">
                    Criar Career Path <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Cross-sell */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-slate-800">Queres CV + LinkedIn juntos?</p>
              </div>
              <p className="text-xs text-slate-500 mb-4">O Pack Estudante combina análise CV + LinkedIn num só relatório cruzado por apenas 7,99€.</p>
              <a href="/estudante" className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
                Ver Pack Estudante — Poupar 43% <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </>
        )}
      </div>

      <S2IFooter />
    </div>
  );
}

// ─── Dimension Bar Component ───
function DimensionBar({ label, score, analise }: { label: string; score: number; analise: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-xl border transition-all ${expanded ? 'bg-orange-50/30 border-orange-200' : 'border-slate-200 hover:border-orange-200'}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-4 p-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-800">{label}</span>
            <span className={`text-lg font-bold ${scoreColor(score)}`}>{score}<span className="text-xs text-slate-400">/10</span></span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${(score / 10) * 100}%` }} />
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <p className="text-sm text-slate-600 leading-relaxed">{analise}</p>
        </div>
      )}
    </div>
  );
}
