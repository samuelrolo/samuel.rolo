// Pack Estudante — Resultados Integrados | Share2Inspire
// Dashboard unificado: CV Analysis + LinkedIn Roast + Consistência CV↔LinkedIn
import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, BarChart3, Linkedin, ArrowRight, GraduationCap, Sparkles, Globe, Menu, X, Download, TrendingUp, Target, Users, Eye, Shield, Zap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import S2IFooter from "@/components/S2IFooter";
import S2IHeader from "@/components/S2IHeader";

// ─── Types ───
interface ConsistencyCheck {
  area: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
  recommendation: string;
}

export default function StudentPackResults() {
  useEffect(() => { document.title = "Resultados — Pack Estudante | Share2Inspire"; }, []);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ consistency: true, cv: false, linkedin: false, plan: true });

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Load data from sessionStorage
  const cvAnalysis = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('studentPackCvAnalysis') || '{}'); } catch { return {}; }
  }, []);
  const cvRaw = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('studentPackCvRaw') || '{}'); } catch { return {}; }
  }, []);
  const linkedinAnalysis = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('studentPackLinkedinAnalysis') || '{}'); } catch { return {}; }
  }, []);

  const isPaid = sessionStorage.getItem('studentPackPaid') === 'true';

  // Redirect if not paid
  useEffect(() => {
    if (!isPaid) { window.location.href = '/estudante'; }
  }, [isPaid]);

  // ─── SCORES ───
  const cvScore = cvAnalysis.overallScore || cvAnalysis.ats_score || 0;
  const linkedinScore = linkedinAnalysis?.teaser_score || linkedinAnalysis?.analysis?.overall_score || linkedinAnalysis?.overall_score || 0;

  // Extract LinkedIn sections from the analysis
  const linkedinRoast = linkedinAnalysis?.analysis || linkedinAnalysis?.roast || linkedinAnalysis || {};
  const linkedinSections = linkedinRoast?.sections || linkedinRoast?.profile_sections || [];
  const linkedinOverall = linkedinRoast?.overall_feedback || linkedinRoast?.summary || '';
  const linkedinName = linkedinRoast?.name || linkedinRoast?.profile_name || cvRaw?.candidate_profile?.name || 'Utilizador';

  // ─── CV Data ───
  const cvRecommendations = cvAnalysis.recommendations || cvAnalysis.top_recommendations || [];
  const cvKeywords = cvAnalysis.keywords || [];
  const cvSalary = cvAnalysis.salary || cvRaw?.salary_estimate || null;
  const cvProfile = cvRaw?.candidate_profile || {};
  const cvScoreBreakdown = cvAnalysis.scoreBreakdown || cvAnalysis.score_breakdown || {};

  // ─── CONSISTENCY ANALYSIS (client-side cross-referencing) ───
  const consistencyChecks = useMemo((): ConsistencyCheck[] => {
    const checks: ConsistencyCheck[] = [];

    // Check 1: Skills alignment
    const cvSkills = (cvAnalysis.keywords || []).map((k: any) => typeof k === 'string' ? k.toLowerCase() : (k.keyword || k.name || '').toLowerCase());
    const linkedinSkills = (linkedinRoast?.skills || []).map((s: any) => typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase());
    const missingOnLinkedin = cvSkills.filter((s: string) => s && !linkedinSkills.some((ls: string) => ls.includes(s) || s.includes(ls)));
    if (missingOnLinkedin.length > 2) {
      checks.push({ area: 'Skills', status: 'fail', detail: `${missingOnLinkedin.length} skills do teu CV não aparecem no LinkedIn: ${missingOnLinkedin.slice(0, 5).join(', ')}`, recommendation: 'Adiciona estas skills ao teu perfil LinkedIn para aumentar a visibilidade junto de recrutadores.' });
    } else if (missingOnLinkedin.length > 0) {
      checks.push({ area: 'Skills', status: 'warning', detail: `${missingOnLinkedin.length} skill(s) do CV em falta no LinkedIn.`, recommendation: 'Considera adicionar estas competências ao teu LinkedIn.' });
    } else {
      checks.push({ area: 'Skills', status: 'pass', detail: 'As skills do teu CV estão alinhadas com o LinkedIn.', recommendation: 'Continua a manter ambos atualizados.' });
    }

    // Check 2: Professional headline
    const cvRole = cvProfile.detected_role || cvProfile.primary_role || '';
    const linkedinHeadline = linkedinRoast?.headline || '';
    if (cvRole && linkedinHeadline) {
      const roleWords = cvRole.toLowerCase().split(/\s+/);
      const headlineWords = linkedinHeadline.toLowerCase();
      const match = roleWords.some((w: string) => w.length > 3 && headlineWords.includes(w));
      checks.push({ area: 'Headline vs Cargo', status: match ? 'pass' : 'warning', detail: match ? `Headline "${linkedinHeadline}" alinhada com o cargo "${cvRole}".` : `O teu CV indica "${cvRole}" mas a headline é "${linkedinHeadline}".`, recommendation: match ? 'Boa consistência!' : `Atualiza a tua headline para incluir "${cvRole}" — recrutadores pesquisam por cargo.` });
    }

    // Check 3: Experience count
    const cvExpCount = (cvRaw?.experience || cvRaw?.work_experience || []).length;
    const linkedinExpCount = linkedinRoast?.experience_count || linkedinSections.filter((s: any) => s.type === 'experience' || s.name?.toLowerCase().includes('experience')).length;
    if (cvExpCount > 0 && linkedinExpCount > 0 && cvExpCount > linkedinExpCount + 1) {
      checks.push({ area: 'Experiências', status: 'fail', detail: `Tens ${cvExpCount} experiências no CV mas apenas ${linkedinExpCount} no LinkedIn.`, recommendation: 'Adiciona as experiências em falta ao LinkedIn para mostrar a tua trajetória completa.' });
    } else if (cvExpCount > 0) {
      checks.push({ area: 'Experiências', status: 'pass', detail: 'Número de experiências consistente entre CV e LinkedIn.', recommendation: 'Mantém ambos sincronizados quando mudares de emprego.' });
    }

    // Check 4: Photo
    if (linkedinRoast?.has_photo === false || linkedinRoast?.photo_status === 'missing') {
      checks.push({ area: 'Foto de Perfil', status: 'fail', detail: 'Não tens foto de perfil no LinkedIn.', recommendation: 'Perfis com foto recebem 21x mais visualizações e 36x mais mensagens. Adiciona uma foto profissional.' });
    }

    // Check 5: About/Summary
    if (linkedinRoast?.about_length !== undefined && linkedinRoast.about_length < 50) {
      checks.push({ area: 'Secção About', status: 'warning', detail: 'A tua secção "Sobre" no LinkedIn está muito curta ou vazia.', recommendation: 'Usa as conquistas do teu CV para escrever um "Sobre" impactante de 3-5 parágrafos.' });
    }

    // Always add at least a generic check if we have few
    if (checks.length < 3) {
      checks.push({ area: 'Palavras-chave ATS vs SEO', status: 'warning', detail: 'As keywords que sistemas ATS procuram no CV nem sempre coincidem com as que o LinkedIn SEO valoriza.', recommendation: 'Usa variações dos mesmos termos: "Gestão de Projetos" no CV, "Project Management" no LinkedIn.' });
    }

    return checks;
  }, [cvAnalysis, linkedinRoast, cvProfile, cvRaw, linkedinSections]);

  const consistencyScore = useMemo(() => {
    if (consistencyChecks.length === 0) return 0;
    const scores = consistencyChecks.map(c => c.status === 'pass' ? 100 : c.status === 'warning' ? 50 : 0);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [consistencyChecks]);

  const globalScore = Math.round((cvScore + linkedinScore + consistencyScore) / 3) || cvScore;

  const statusIcon = (status: string) => {
    if (status === 'pass') return <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />;
    if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
    return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
  };

  const scoreColor = (score: number) => score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = (score: number) => score >= 70 ? 'bg-green-50 border-green-200' : score >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  if (!isPaid) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <S2IHeader activePage="estudante" langToggleHref="/en/student-pack" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* ─── HERO CARD ─── */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 md:p-8 text-white mb-8">
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
            <GraduationCap className="w-4 h-4" /> Pack Estudante — Relatório Completo
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{linkedinName}</h1>
          <p className="text-emerald-200 text-sm mb-6">{cvProfile.detected_role || 'Perfil Profissional'}</p>

          {/* 3 Score Cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white/15 backdrop-blur rounded-xl p-4 text-center">
              <BarChart3 className="w-5 h-5 mx-auto mb-1 text-emerald-200" />
              <p className="text-3xl font-bold">{cvScore}</p>
              <p className="text-xs text-emerald-200">CV Score</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-4 text-center">
              <Linkedin className="w-5 h-5 mx-auto mb-1 text-emerald-200" />
              <p className="text-3xl font-bold">{linkedinScore || '—'}</p>
              <p className="text-xs text-emerald-200">LinkedIn</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-emerald-200" />
              <p className="text-3xl font-bold">{consistencyScore}</p>
              <p className="text-xs text-emerald-200">Consistência</p>
            </div>
          </div>
        </div>

        {/* ─── CONSISTENCY SECTION (unique!) ─── */}
        <div className="bg-white border border-emerald-200 rounded-2xl mb-6 overflow-hidden">
          <button onClick={() => toggleSection('consistency')} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><Sparkles className="w-5 h-5 text-emerald-600" /></div>
              <div className="text-left">
                <h2 className="font-bold text-slate-900">Consistência CV ↔ LinkedIn</h2>
                <p className="text-xs text-slate-500">Exclusivo Pack Estudante</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${scoreColor(consistencyScore)}`}>{consistencyScore}/100</span>
              {expandedSections.consistency ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </button>
          {expandedSections.consistency && (
            <div className="px-5 pb-5 space-y-3">
              {consistencyChecks.map((check, i) => (
                <div key={i} className={`rounded-xl p-4 border ${check.status === 'pass' ? 'bg-green-50/50 border-green-200' : check.status === 'warning' ? 'bg-amber-50/50 border-amber-200' : 'bg-red-50/50 border-red-200'}`}>
                  <div className="flex items-start gap-3">
                    {statusIcon(check.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-sm">{check.area}</h3>
                      <p className="text-sm text-slate-600 mt-1">{check.detail}</p>
                      <p className="text-sm text-slate-800 mt-2 font-medium">💡 {check.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── CV ANALYSIS SECTION ─── */}
        <div className="bg-white border border-slate-200 rounded-2xl mb-6 overflow-hidden">
          <button onClick={() => toggleSection('cv')} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
              <div className="text-left">
                <h2 className="font-bold text-slate-900">Análise do CV</h2>
                <p className="text-xs text-slate-500">Score ATS, recomendações, estimativa salarial</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${scoreColor(cvScore)}`}>{cvScore}/100</span>
              {expandedSections.cv ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </button>
          {expandedSections.cv && (
            <div className="px-5 pb-5 space-y-4">
              {/* Score Breakdown */}
              {Object.keys(cvScoreBreakdown).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(cvScoreBreakdown).map(([key, value]: [string, any]) => (
                    <div key={key} className={`rounded-xl p-3 border text-center ${scoreBg(typeof value === 'number' ? value : value?.score || 0)}`}>
                      <p className={`text-xl font-bold ${scoreColor(typeof value === 'number' ? value : value?.score || 0)}`}>
                        {typeof value === 'number' ? value : value?.score || 0}
                      </p>
                      <p className="text-xs text-slate-600 capitalize">{key.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Recommendations */}
              {cvRecommendations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 text-sm">Top Recomendações</h3>
                  {cvRecommendations.slice(0, 5).map((rec: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                      <span className="text-blue-600 font-bold shrink-0">{i + 1}.</span>
                      <span>{typeof rec === 'string' ? rec : rec.text || rec.recommendation || rec.description || JSON.stringify(rec)}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Salary */}
              {cvSalary && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-900 text-sm mb-2">💰 Estimativa Salarial</h3>
                  <p className="text-sm text-slate-700">{typeof cvSalary === 'string' ? cvSalary : cvSalary.range || cvSalary.estimate || JSON.stringify(cvSalary)}</p>
                </div>
              )}
              {/* Full results link */}
              <a href="/cv-analyser/results" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                Ver resultados completos do CV Analyser <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* ─── LINKEDIN SECTION ─── */}
        <div className="bg-white border border-slate-200 rounded-2xl mb-6 overflow-hidden">
          <button onClick={() => toggleSection('linkedin')} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center"><Linkedin className="w-5 h-5 text-purple-600" /></div>
              <div className="text-left">
                <h2 className="font-bold text-slate-900">Análise LinkedIn</h2>
                <p className="text-xs text-slate-500">Headline, About, Experience, SEO</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${scoreColor(linkedinScore)}`}>{linkedinScore ? `${linkedinScore}/100` : '—'}</span>
              {expandedSections.linkedin ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </button>
          {expandedSections.linkedin && (
            <div className="px-5 pb-5 space-y-4">
              {linkedinOverall && (
                <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
                  <p className="text-sm text-slate-700">{typeof linkedinOverall === 'string' ? linkedinOverall : JSON.stringify(linkedinOverall)}</p>
                </div>
              )}
              {Array.isArray(linkedinSections) && linkedinSections.length > 0 && (
                <div className="space-y-3">
                  {linkedinSections.map((section: any, i: number) => (
                    <div key={i} className="border border-slate-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900 text-sm">{section.name || section.title || section.type || `Secção ${i + 1}`}</h3>
                        {(section.score !== undefined) && <span className={`text-sm font-bold ${scoreColor(section.score)}`}>{section.score}/100</span>}
                      </div>
                      <p className="text-sm text-slate-600">{section.feedback || section.description || section.content || ''}</p>
                      {section.recommendation && <p className="text-sm text-purple-700 mt-2 font-medium">💡 {section.recommendation}</p>}
                    </div>
                  ))}
                </div>
              )}
              {!linkedinOverall && (!Array.isArray(linkedinSections) || linkedinSections.length === 0) && (
                <div className="text-center py-6 text-slate-400">
                  <Linkedin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Dados detalhados do LinkedIn não disponíveis nesta análise.</p>
                  <p className="text-xs mt-1">Experimenta o <a href="/linkedin-roaster" className="text-purple-600 underline">LinkedIn Roaster</a> standalone para uma análise mais profunda.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── ACTION PLAN ─── */}
        <div className="bg-white border border-emerald-200 rounded-2xl mb-6 overflow-hidden">
          <button onClick={() => toggleSection('plan')} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><Target className="w-5 h-5 text-emerald-600" /></div>
              <div className="text-left">
                <h2 className="font-bold text-slate-900">Plano de Ação Integrado</h2>
                <p className="text-xs text-slate-500">O que fazer nas próximas semanas</p>
              </div>
            </div>
            {expandedSections.plan ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {expandedSections.plan && (
            <div className="px-5 pb-5 space-y-4">
              {[
                { week: 'Semana 1-2', title: 'Corrige o CV', icon: <FileText className="w-4 h-4" />, color: 'blue', tasks: cvRecommendations.slice(0, 3).map((r: any) => typeof r === 'string' ? r : r.text || r.recommendation || 'Melhora o teu CV') },
                { week: 'Semana 3', title: 'Otimiza o LinkedIn', icon: <Linkedin className="w-4 h-4" />, color: 'purple', tasks: consistencyChecks.filter(c => c.status !== 'pass').map(c => c.recommendation).slice(0, 3) },
                { week: 'Semana 4', title: 'Alinha e candidata-te', icon: <TrendingUp className="w-4 h-4" />, color: 'emerald', tasks: ['Garante que CV e LinkedIn contam a mesma história', 'Ativa "Open to Work" no LinkedIn (modo privado)', 'Começa a candidatar-te a 5 vagas/semana com o CV atualizado'] },
              ].map((phase, i) => (
                <div key={i} className={`rounded-xl p-4 border border-${phase.color}-200 bg-${phase.color}-50/30`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg bg-${phase.color}-100 flex items-center justify-center text-${phase.color}-600`}>{phase.icon}</div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">{phase.week}</p>
                      <p className="font-semibold text-slate-900 text-sm">{phase.title}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {phase.tasks.map((task: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── CTA: Upgrade ─── */}
        <div className="bg-gradient-to-r from-[#f9f6ef] to-[#faf8f3] border border-[#C9A961]/20 rounded-2xl p-6 text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#C9A961]" />
            <p className="text-sm font-bold text-slate-800">Queres ir mais longe?</p>
          </div>
          <p className="text-xs text-slate-500 mb-4">O Bundle CV Analyser + Career Path inclui roadmap de carreira a 5 anos, formações recomendadas e estratégia de networking personalizada.</p>
          <a href="/bundle" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C9A961] hover:bg-[#b8954f] text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
            Ver Bundle completo — 29€ <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <S2IFooter />
    </div>
  );
}
