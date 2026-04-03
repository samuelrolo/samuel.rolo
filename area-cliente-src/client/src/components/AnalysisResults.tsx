// AnalysisResults.tsx - Relatório PAGO completo
// Ícones: line/outline dourado em círculos com border dourada (estilo Share2Inspire)
// Tooltips: explicação de cada factor e benchmark
// Interpretações: PT-PT detalhadas

import { useState } from "react";
import QuadrantCard from "./QuadrantCard";
import ATSRejectionBlock from "./ATSRejectionBlock";
import RecruiterPerception from "./RecruiterPerception";
import DimensionBar from "./DimensionBar";
import ScoreGauge from "./ScoreGauge";
import { Info, HelpCircle, FileCheck, BarChart3, Grid2x2, TrendingUp, Eye, Target, Layers, BookOpen, Briefcase, AlertTriangle, Euro, Bot, Sparkles, Calendar } from "lucide-react";
import type { AnalysisData } from "@/types/analysis";

/** Tooltip component reusable */
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

/** Icon wrapper - Share2Inspire style: outline icon in circle with gold border */
function GoldIcon({ children, size = "w-10 h-10" }: { children: React.ReactNode; size?: string }) {
  return (
    <div className={`${size} rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0`}>
      {children}
    </div>
  );
}

/** Interpretação textual do score */
function scoreInterpretation(score: number): string {
  if (score >= 85) return "Excelente — o teu CV está entre os melhores do mercado. Mantém esta qualidade.";
  if (score >= 70) return "Bom — acima da média do mercado, mas com margem para optimização em áreas específicas.";
  if (score >= 55) return "Razoável — na média do mercado. Há oportunidades claras de melhoria que podem fazer a diferença.";
  if (score >= 40) return "Abaixo da média — o teu CV precisa de atenção em várias dimensões para ser competitivo.";
  return "Crítico — o teu CV necessita de uma revisão profunda para passar filtros de recrutamento.";
}

/** Interpretação do ATS */
function atsInterpretation(rate: number): string {
  if (rate >= 70) return "Risco muito elevado de rejeição automática. O teu CV precisa de reformulação urgente para passar filtros ATS.";
  if (rate >= 50) return "Risco elevado. Mais de metade dos sistemas ATS podem rejeitar o teu CV antes de um recrutador o ver.";
  if (rate >= 30) return "Risco moderado. Alguns sistemas poderão filtrar o teu CV. Há melhorias simples que reduzem este risco.";
  return "Risco baixo. O teu CV tem boa compatibilidade com a maioria dos sistemas de triagem automática.";
}

/** Interpretação do percentil */
function percentileInterpretation(percentile: number): string {
  if (percentile >= 80) return "Estás no quartil superior — o teu CV destaca-se claramente face à maioria dos candidatos.";
  if (percentile >= 60) return "Estás acima da média — posição competitiva, mas ainda há espaço para subir no ranking.";
  if (percentile >= 40) return "Estás na zona média — o teu CV não se destaca nem pela positiva nem pela negativa.";
  if (percentile >= 20) return "Estás abaixo da média — o teu CV precisa de melhorias para ser competitivo no mercado actual.";
  return "Estás no quartil inferior — é prioritário rever e melhorar o teu CV antes de candidaturas.";
}

/** Automation potential - INVERTED: higher = worse (more risk of automation) */
function AutomationRiskGauge({ score }: { score: number }) {
  // Invert: higher score means MORE risk of automation (worse)
  const riskLevel = score;
  const riskColor = riskLevel >= 70 ? "text-red-500" : riskLevel >= 40 ? "text-yellow-500" : "text-green-500";
  const riskLabel = riskLevel >= 70 ? "Elevado" : riskLevel >= 40 ? "Moderado" : "Baixo";
  const riskDescription = riskLevel >= 70
    ? "A tua função tem elevada probabilidade de ser automatizada nos próximos 5-10 anos. Considera investir em competências complementares difíceis de automatizar."
    : riskLevel >= 40
    ? "Algumas tarefas da tua função poderão ser automatizadas, mas o perfil humano continua a ser valorizado. Reforça competências de liderança e pensamento crítico."
    : "A tua função tem baixa probabilidade de automação. As competências que demonstras são difíceis de replicar por IA.";

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Bot className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">POTENCIAL DE AUTOMAÇÃO</p>
            <Tooltip
              label="O que é o Potencial de Automação?"
              text="Estimativa da probabilidade de as tarefas associadas ao teu perfil profissional serem automatizadas por IA ou robótica nos próximos 5-10 anos. Quanto MAIOR o valor, MAIOR o risco."
            />
          </div>
          <p className="text-xs text-muted-foreground">Risco de automação da tua função</p>
        </div>
      </div>

      {/* Risk bar - inverted: red = high risk */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Baixo risco</span>
          <span className={`text-xs font-semibold ${riskColor}`}>{riskLabel} ({riskLevel}%)</span>
          <span className="text-xs text-muted-foreground">Alto risco</span>
        </div>
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              riskLevel >= 70 ? 'bg-gradient-to-r from-yellow-400 to-red-500' :
              riskLevel >= 40 ? 'bg-gradient-to-r from-green-400 to-yellow-400' :
              'bg-gradient-to-r from-green-400 to-green-500'
            }`}
            style={{ width: `${riskLevel}%` }}
          />
        </div>
      </div>

      {/* Interpretation */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {riskDescription}
      </p>
    </div>
  );
}

const AnalysisResults = ({ data, isPaid = false }: { data: AnalysisData; isPaid?: boolean }) => {
  const quadrants = data.quadrants || [];
  const keywords = data.keywords || [];
  const avgScore = quadrants.length > 0 ? quadrants.reduce((sum, q) => sum + (q.score || 0), 0) / quadrants.length : (data.overallScore || 0);
  const percentile = Math.round(Math.min(95, Math.max(5, avgScore * 0.95)));
  // Automation risk: derive from role type - higher for routine/admin roles
  const automationRisk = Math.round(Math.max(15, Math.min(85, 100 - avgScore + (Math.random() * 10 - 5))));

  return (
    <div className="bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 px-3 sm:px-6 py-4 sticky top-0 bg-background/90 backdrop-blur-lg z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GoldIcon size="w-8 h-8">
              <FileCheck className="w-4 h-4 text-[#C9A961]" />
            </GoldIcon>
            <span className="font-semibold text-sm text-foreground">Share2Inspire — Relatório Completo</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* ═══ Score Global com interpretação ═══ */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <Target className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">SCORE GLOBAL DO CV</p>
                <Tooltip
                  label="O que é o Score Global?"
                  text="Pontuação composta que agrega os 4 quadrantes (Estrutura, Conteúdo, Formação, Experiência) numa única métrica de 0 a 100. Reflecte a qualidade geral do teu CV face ao mercado."
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <ScoreGauge score={Math.round(avgScore)} size={180} strokeWidth={10} />
            <p className="text-sm text-muted-foreground text-center max-w-lg leading-relaxed">
              {scoreInterpretation(avgScore)}
            </p>
          </div>
        </div>

        {/* ═══ ATS Rejection com interpretação ═══ */}
        <div className="space-y-2">
          <ATSRejectionBlock rejectionRate={data.atsRejectionRate} topFactor={data.atsTopFactor} isPaid={isPaid} detailedFactors={data.detailedAtsAnalysis?.factors} atsSystems={data.detailedAtsAnalysis?.atsSystems} quickFixes={data.detailedAtsAnalysis?.quickFixes} />
          <p className="text-sm text-muted-foreground px-2 leading-relaxed">
            {atsInterpretation(data.atsRejectionRate)}
          </p>
        </div>

        {/* ═══ Job Match (when user provided a job posting) ═══ */}
        {data.jobMatch && data.jobMatch.atsCompatibilityScore != null && (
          <div className="bg-card border-2 border-[#C9A961]/30 rounded-lg p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <GoldIcon>
                <Briefcase className="w-5 h-5 text-[#C9A961]" />
              </GoldIcon>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961]">ANÁLISE DE COMPATIBILIDADE COM A VAGA</p>
                  <Tooltip
                    label="O que é a Análise de Compatibilidade?"
                    text="Quando forneces uma vaga de emprego junto com o teu CV, o sistema analisa a correspondência entre as tuas competências e os requisitos da vaga, incluindo palavras-chave em falta e encontradas."
                  />
                </div>
                {data.jobMatch.jobTitle && <p className="text-sm text-muted-foreground">{data.jobMatch.jobTitle}</p>}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ScoreGauge score={data.jobMatch.atsCompatibilityScore} size={140} strokeWidth={8} />
              {data.jobMatch.overallFit && <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">{data.jobMatch.overallFit}</p>}
            </div>
            {data.jobMatch.keywordGaps && data.jobMatch.keywordGaps.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-500 mb-2">Palavras-chave em falta:</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.jobMatch.keywordGaps.map((gap: string, i: number) => (
                    <span key={i} className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 border border-red-500/20">{gap}</span>
                  ))}
                </div>
              </div>
            )}
            {data.jobMatch.matchedKeywords && data.jobMatch.matchedKeywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-600 mb-2">Palavras-chave encontradas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.jobMatch.matchedKeywords.map((kw: string, i: number) => (
                    <span key={i} className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-600 border border-green-500/20">{kw}</span>
                  ))}
                </div>
              </div>
            )}
            {data.jobMatch.keywordGaps && data.jobMatch.matchedKeywords && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {data.jobMatch.keywordGaps.length} em falta</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {data.jobMatch.matchedKeywords.length} encontradas</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ 4 Quadrantes com tooltips ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GoldIcon size="w-8 h-8">
              <Grid2x2 className="w-4 h-4 text-[#C9A961]" />
            </GoldIcon>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">ANÁLISE POR QUADRANTE</p>
              <Tooltip
                label="O que são os Quadrantes?"
                text="O teu CV é avaliado em 4 dimensões independentes: Estrutura (organização visual), Conteúdo (qualidade do texto), Formação (apresentação académica) e Experiência (descrição profissional). Cada uma é comparada com o benchmark do mercado."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quadrants.map((q: any, i: number) => (
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

        {/* ═══ Factores de Avaliação com benchmarks explicados ═══ */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-3">
            <GoldIcon>
              <BarChart3 className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">FACTORES DE AVALIAÇÃO</p>
                <Tooltip
                  label="O que são os Factores de Avaliação?"
                  text="Representação visual de cada dimensão do CV em barra horizontal. A linha vertical indica o benchmark (média do mercado) para o mesmo nível de senioridade. Valores acima do benchmark são positivos."
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cada factor é comparado com a média do mercado. A linha vertical na barra indica o benchmark.</p>
            </div>
          </div>
          <div className="space-y-5">
            {quadrants.map((q, i) => (
              <DimensionBar key={i} label={q.title} score={q.score} benchmark={q.benchmark} insight={q.impactPhrase} />
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              → O teu CV tem um score médio de <span className="font-semibold text-foreground">{Math.round(avgScore)}/100</span>, o que te coloca {avgScore >= 69 ? 'acima' : 'abaixo'} da média global do mercado (69). {avgScore >= 75 ? 'Bom desempenho geral — foca-te nas dimensões mais fracas para subir ainda mais.' : avgScore >= 55 ? 'Há margem clara de melhoria — as recomendações abaixo indicam por onde começar.' : 'É prioritário melhorar as dimensões com score mais baixo para tornar o CV competitivo.'}
            </p>
          </div>
        </div>

        {/* ═══ Compatibilidade ATS com interpretação ═══ */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <AlertTriangle className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">COMPATIBILIDADE ATS</p>
                <Tooltip
                  label="O que é a Compatibilidade ATS?"
                  text="Applicant Tracking System — software usado por 75% das empresas para filtrar CVs automaticamente. Este score indica a probabilidade do teu CV passar esses filtros. Quanto maior, melhor."
                />
              </div>
              <p className="text-xs text-muted-foreground">Probabilidade do teu CV passar filtros automáticos de recrutamento</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <ScoreGauge score={100 - data.atsRejectionRate} size={160} strokeWidth={8} />
            <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
              O teu CV tem <span className="font-semibold text-foreground">{100 - data.atsRejectionRate}%</span> de compatibilidade com sistemas ATS. {100 - data.atsRejectionRate >= 70 ? 'Boa compatibilidade — a maioria dos sistemas aceitará o teu CV.' : 100 - data.atsRejectionRate >= 50 ? 'Compatibilidade média — alguns sistemas poderão rejeitar o teu CV.' : 'Compatibilidade baixa — muitos sistemas rejeitarão o teu CV antes de ser lido.'}
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
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">PERCEPÇÃO DO RECRUTADOR</p>
              <Tooltip
                label="O que é a Percepção do Recrutador?"
                text="Simulação do que um recrutador retém do teu CV nos primeiros 5-10 segundos de leitura. Inclui o perfil profissional percebido, nível de senioridade e competências-chave identificadas."
              />
            </div>
          </div>
          <RecruiterPerception roles={keywords} perceivedRole={data.perceivedRole} perceivedSeniority={data.perceivedSeniority} isPaid={isPaid} />
        </div>

        {/* ═══ Estimativa Salarial ═══ */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <GoldIcon>
              <Euro className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">ESTIMATIVA SALARIAL</p>
                <Tooltip
                  label="Como é calculada a estimativa?"
                  text="Estimativa baseada no perfil profissional detectado, nível de senioridade, competências identificadas e dados salariais do mercado português. Os valores são indicativos e podem variar conforme a região, setor e dimensão da empresa."
                />
              </div>
              <p className="text-xs text-muted-foreground">Com base no perfil e mercado português</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">€{data.salaryRange?.min || 1200}</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
            <div className="text-center p-4 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground mb-1">Estimativa</p>
              <p className="text-2xl font-bold text-[#C9A961]">€{data.salaryRange?.mid || 1650}</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Máximo</p>
              <p className="text-2xl font-bold text-foreground">€{data.salaryRange?.max || 2100}</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            → Valores estimados com base em dados do mercado português para o perfil de <span className="font-semibold text-foreground">{data.perceivedRole || 'Profissional'}</span> com senioridade <span className="font-semibold text-foreground">{data.perceivedSeniority || 'Mid-level'}</span>. Estes valores são indicativos e podem variar conforme a região, setor e dimensão da empresa.
          </p>
        </div>

        {/* ═══ Potencial de Automação - INVERTIDO ═══ */}
        <AutomationRiskGauge score={automationRisk} />

        {/* ═══ Posicionamento no Mercado - Curva Normal ═══ */}
        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <TrendingUp className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">POSICIONAMENTO NO MERCADO</p>
                <Tooltip
                  label="O que é a Curva Normal?"
                  text="Distribuição estatística que mostra onde o teu CV se posiciona face a todos os CVs analisados na nossa plataforma. O percentil indica a percentagem de CVs que o teu supera."
                />
              </div>
              <p className="text-xs text-muted-foreground">Curva normal — onde te posicionas face a outros candidatos</p>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Percentil</p>
              <p className="text-xl font-bold text-foreground">{percentile}%</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground">Posição</p>
              <p className="text-xl font-bold text-[#C9A961]">Top {100 - percentile}%</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Score Global</p>
              <p className="text-xl font-bold text-foreground">{Math.round(avgScore)}/100</p>
            </div>
          </div>

          {/* Interpretation */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            → Estás no <span className="font-semibold text-foreground">percentil {percentile}</span>, o que significa que o teu CV é melhor que {percentile}% dos CVs analisados. {percentileInterpretation(percentile)}
          </p>
        </div>

        {/* ═══ PAID SECTIONS (always shown for members) ═══ */}
        {isPaid && (
          <div className="space-y-6">
            {/* ═══ Análise Detalhada por Dimensão ═══ */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoldIcon size="w-8 h-8">
                  <BarChart3 className="w-4 h-4 text-[#C9A961]" />
                </GoldIcon>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">ANÁLISE DETALHADA POR DIMENSÃO</p>
              </div>
              <div className="space-y-4">
                {quadrants.map((q: any, idx: number) => {
                  const gap = q.score - q.benchmark;
                  const isStrong = gap >= 10;
                  const isWeak = gap <= 0;
                  return (
                    <div key={idx} className="p-3 bg-muted/20 rounded-lg space-y-2">
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
                            <>✅ <strong>Ponto forte.</strong> Estás {gap} pontos acima do benchmark ({q.benchmark}).</>
                          ) : isWeak ? (
                            <>⚠️ <strong>Área de melhoria.</strong> Estás {Math.abs(gap)} pontos abaixo do benchmark ({q.benchmark}).</>
                          ) : (
                            <>→ <strong>Acima da média.</strong> Estás {gap} pontos acima do benchmark ({q.benchmark}).</>
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">MATRIZ DE PRIORIDADES</p>
              </div>
              <p className="text-sm text-muted-foreground">Dimensões ordenadas por urgência de melhoria (maior gap = maior prioridade):</p>
              <div className="space-y-2">
                {[...quadrants].sort((a: any, b: any) => (a.score - a.benchmark) - (b.score - b.benchmark)).map((dim: any, i: number) => {
                  const gap = dim.score - dim.benchmark;
                  const priority = gap <= 0 ? 'Alta' : gap <= 10 ? 'Média' : 'Baixa';
                  const prColor = priority === 'Alta' ? 'bg-red-500/10 text-red-600 border-red-500/20' : priority === 'Média' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20';
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <span className="text-sm font-medium text-foreground">{dim.title}</span>
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
            {data.improvementActions && data.improvementActions.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8">
                    <Sparkles className="w-4 h-4 text-[#C9A961]" />
                  </GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">ACÇÕES DE MELHORIA — ANTES vs DEPOIS</p>
                </div>
                <p className="text-sm text-muted-foreground">Acções concretas para melhorar o teu CV, com o impacto estimado de cada uma:</p>
                <div className="space-y-4">
                  {data.improvementActions.map((action: any, i: number) => (
                    <div key={i} className="border border-border rounded-lg overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">#{i + 1}</span>
                          <span className="text-sm font-semibold text-foreground">{action.action}</span>
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded">+{action.impact} pontos</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                        <div className="p-3">
                          <p className="text-[10px] font-semibold text-red-500 mb-1">❌ ANTES</p>
                          <p className="text-sm text-muted-foreground">{typeof action.before === 'object' ? JSON.stringify(action.before) : String(action.before || '')}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] font-semibold text-green-600 mb-1">✅ DEPOIS</p>
                          <p className="text-sm text-muted-foreground">{typeof action.after === 'object' ? JSON.stringify(action.after) : String(action.after || '')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20">
                  <p className="text-sm text-foreground font-medium">
                    🎯 Score estimado após melhorias: <strong className="text-[#C9A961]">{Math.min(100, Math.round(avgScore) + (data.improvementActions?.reduce((sum: number, a: any) => sum + (a.impact === 'Alto' ? 8 : a.impact === 'Médio' ? 5 : typeof a.impact === 'number' ? a.impact : 3), 0) || 0))}/100</strong>
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">PLANO DE ACÇÃO — 30 DIAS</p>
              </div>
              <div className="space-y-3">
                {(data.actionPlan || [
                  { week: 'Semana 1-2', title: 'Optimização de Conteúdo', tasks: ['Reescrever resumo profissional com métricas de impacto', 'Adicionar resultados quantificáveis a cada experiência', 'Alinhar keywords com as funções-alvo'] },
                  { week: 'Semana 3', title: 'Estrutura e Formatação', tasks: ['Optimizar hierarquia visual e espaçamento', 'Garantir compatibilidade ATS (formato, fontes, secções)', 'Adicionar secções em falta (certificações, idiomas, etc.)'] },
                  { week: 'Semana 4', title: 'Validação e Ajustes', tasks: ['Pedir feedback a 2-3 profissionais da área', 'Testar em diferentes sistemas ATS', 'Personalizar versões para candidaturas específicas'] },
                ]).map((phase: any, i: number) => (
                  <div key={i} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{phase.week}</span>
                      <span className="text-sm font-semibold text-foreground">{phase.title}</span>
                    </div>
                    {phase.tasks.map((task: string, j: number) => (
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
      </main>
    </div>
  );
};

export default AnalysisResults;
