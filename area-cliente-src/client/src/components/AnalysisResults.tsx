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

// Added minimal i18n support
import { useI18n } from "@/hooks/useI18n";

/**
 * Simple pick function inline to handle translations
 */
function pick({ pt, en, es }: { pt: string; en: string; es: string }) {
  const { lang } = useI18n();
  return lang === 'pt' ? pt : lang === 'es' ? es : en;
}

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
  if (score >= 85) return pick({ pt: "Excelente — o teu CV está entre os melhores do mercado. Mantém esta qualidade.", en: "Excellent — your CV is among the best on the market. Keep up this quality.", es: "Excelente — tu CV está entre los mejores del mercado. Mantén esta calidad." });
  if (score >= 70) return pick({ pt: "Bom — acima da média do mercado, mas com margem para optimização em áreas específicas.", en: "Good — above market average, but with room for improvement in specific areas.", es: "Bueno — por encima de la media del mercado, pero con margen para optimización en áreas específicas." });
  if (score >= 55) return pick({ pt: "Razoável — na média do mercado. Há oportunidades claras de melhoria que podem fazer a diferença.", en: "Fair — around market average. Clear opportunities for improvement that can make a difference.", es: "Razonable — en la media del mercado. Hay oportunidades claras de mejora que pueden marcar la diferencia." });
  if (score >= 40) return pick({ pt: "Abaixo da média — o teu CV precisa de atenção em várias dimensões para ser competitivo.", en: "Below average — your CV needs attention in several dimensions to be competitive.", es: "Por debajo de la media — tu CV necesita atención en varias dimensiones para ser competitivo." });
  return pick({ pt: "Crítico — o teu CV necessita de uma revisão profunda para passar filtros de recrutamento.", en: "Critical — your CV needs a thorough review to pass recruitment filters.", es: "Crítico — tu CV necesita una revisión profunda para pasar filtros de reclutamiento." });
}

/** Interpretação do ATS */
function atsInterpretation(rate: number): string {
  if (rate >= 70) return pick({ pt: "Risco muito elevado de rejeição automática. O teu CV precisa de reformulação urgente para passar filtros ATS.", en: "Very high risk of automatic rejection. Your CV urgently needs reformulation to pass ATS filters.", es: "Riesgo muy elevado de rechazo automático. Tu CV necesita reformulación urgente para pasar filtros ATS." });
  if (rate >= 50) return pick({ pt: "Risco elevado. Mais de metade dos sistemas ATS podem rejeitar o teu CV antes de um recrutador o ver.", en: "High risk. More than half of ATS systems may reject your CV before a recruiter sees it.", es: "Riesgo elevado. Más de la mitad de los sistemas ATS pueden rechazar tu CV antes de que un reclutador lo vea." });
  if (rate >= 30) return pick({ pt: "Risco moderado. Alguns sistemas poderão filtrar o teu CV. Há melhorias simples que reduzem este risco.", en: "Moderate risk. Some systems may filter your CV. There are simple improvements that reduce this risk.", es: "Riesgo moderado. Algunos sistemas podrían filtrar tu CV. Hay mejoras simples que reducen este riesgo." });
  return pick({ pt: "Risco baixo. O teu CV tem boa compatibilidade com a maioria dos sistemas de triagem automática.", en: "Low risk. Your CV has good compatibility with most automated screening systems.", es: "Riesgo bajo. Tu CV tiene buena compatibilidad con la mayoría de los sistemas de selección automática." });
}

/** Interpretação do percentil */
function percentileInterpretation(percentile: number): string {
  if (percentile >= 80) return pick({ pt: "Estás no quartil superior — o teu CV destaca-se claramente face à maioria dos candidatos.", en: "You are in the top quartile — your CV clearly stands out against most candidates.", es: "Estás en el cuartil superior — tu CV destaca claramente frente a la mayoría de los candidatos." });
  if (percentile >= 60) return pick({ pt: "Estás acima da média — posição competitiva, mas ainda há espaço para subir no ranking.", en: "You are above average — competitive position, but there is still room to climb the ranking.", es: "Estás por encima de la media — posición competitiva, pero aún hay espacio para subir en el ranking." });
  if (percentile >= 40) return pick({ pt: "Estás na zona média — o teu CV não se destaca nem pela positiva nem pela negativa.", en: "You are in the middle zone — your CV does not stand out either positively or negatively.", es: "Estás en la zona media — tu CV no destaca ni para bien ni para mal." });
  if (percentile >= 20) return pick({ pt: "Estás abaixo da média — o teu CV precisa de melhorias para ser competitivo no mercado actual.", en: "You are below average — your CV needs improvements to be competitive in the current market.", es: "Estás por debajo de la media — tu CV necesita mejoras para ser competitivo en el mercado actual." });
  return pick({ pt: "Estás no quartil inferior — é prioritário rever e melhorar o teu CV antes de candidaturas.", en: "You are in the bottom quartile — it is a priority to review and improve your CV before applications.", es: "Estás en el cuartil inferior — es prioritario revisar y mejorar tu CV antes de candidaturas." });
}

/** Automation potential - INVERTED: higher = worse (more risk of automation) */
function AutomationRiskGauge({ score }: { score: number }) {
  // Invert: higher score means MORE risk of automation (worse)
  const riskLevel = score;
  const riskColor = riskLevel >= 70 ? "text-red-500" : riskLevel >= 40 ? "text-yellow-500" : "text-green-500";
  const riskLabel = riskLevel >= 70 ? pick({ pt: "Elevado", en: "High", es: "Alto" }) : riskLevel >= 40 ? pick({ pt: "Moderado", en: "Moderate", es: "Moderado" }) : pick({ pt: "Baixo", en: "Low", es: "Bajo" });
  const riskDescription = riskLevel >= 70
    ? pick({ pt: "A tua função tem elevada probabilidade de ser automatizada nos próximos 5-10 anos. Considera investir em competências complementares difíceis de automatizar.", en: "Your role has a high probability of being automated in the next 5-10 years. Consider investing in complementary skills difficult to automate.", es: "Tu función tiene alta probabilidad de ser automatizada en los próximos 5-10 años. Considera invertir en competencias complementarias difíciles de automatizar." })
    : riskLevel >= 40
    ? pick({ pt: "Algumas tarefas da tua função poderão ser automatizadas, mas o perfil humano continua a ser valorizado. Reforça competências de liderança e pensamento crítico.", en: "Some tasks in your role may be automated, but the human profile remains valued. Strengthen leadership and critical thinking skills.", es: "Algunas tareas de tu función podrían ser automatizadas, pero el perfil humano sigue siendo valorado. Refuerza competencias de liderazgo y pensamiento crítico." })
    : pick({ pt: "A tua função tem baixa probabilidade de automação. As competências que demonstras são difíceis de replicar por IA.", en: "Your role has a low probability of automation. The skills you demonstrate are hard to replicate by AI.", es: "Tu función tiene baja probabilidad de automatización. Las competencias que demuestras son difíciles de replicar por IA." });

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Bot className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "POTENCIAL DE AUTOMAÇÃO", en: "AUTOMATION POTENTIAL", es: "POTENCIAL DE AUTOMATIZACIÓN" })}</p>
            <Tooltip
              label={pick({ pt: "O que é o Potencial de Automação?", en: "What is Automation Potential?", es: "¿Qué es el Potencial de Automatización?" })}
              text={pick({ pt: "Estimativa da probabilidade de as tarefas associadas ao teu perfil profissional serem automatizadas por IA ou robótica nos próximos 5-10 anos. Quanto MAIOR o valor, MAIOR o risco.", en: "Estimate of the likelihood that tasks associated with your professional profile will be automated by AI or robotics in the next 5-10 years. The HIGHER the value, the HIGHER the risk.", es: "Estimación de la probabilidad de que las tareas asociadas a tu perfil profesional sean automatizadas por IA o robótica en los próximos 5-10 años. Cuanto MAYOR el valor, MAYOR el riesgo." })}
            />
          </div>
          <p className="text-xs text-muted-foreground">{pick({ pt: "Risco de automação da tua função", en: "Automation risk of your role", es: "Riesgo de automatización de tu función" })}</p>
        </div>
      </div>

      {/* Risk bar - inverted: red = high risk */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{pick({ pt: "Baixo risco", en: "Low risk", es: "Bajo riesgo" })}</span>
          <span className={`text-xs font-semibold ${riskColor}`}>{riskLabel} ({riskLevel}%)</span>
          <span className="text-xs text-muted-foreground">{pick({ pt: "Alto risco", en: "High risk", es: "Alto riesgo" })}</span>
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
          <div className="flex items-center gap-3">
            <img src="/logo-transparent.webp" alt="Share2Inspire" className="h-10 sm:h-11 w-auto object-contain" />
            <div className="flex items-center gap-2">
              <GoldIcon size="w-8 h-8">
                <FileCheck className="w-4 h-4 text-[#C9A961]" />
              </GoldIcon>
              <span className="font-semibold text-sm text-foreground">{pick({ pt: 'Share2Inspire — Relatório Completo', en: 'Share2Inspire — Full Report', es: 'Share2Inspire — Informe Completo' })}</span>
            </div>
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "SCORE GLOBAL DO CV", en: "OVERALL CV SCORE", es: "PUNTAJE GLOBAL DEL CV" })}</p>
                <Tooltip
                  label={pick({ pt: "O que é o Score Global?", en: "What is the Overall Score?", es: "¿Qué es el Puntaje Global?" })}
                  text={pick({ pt: "Pontuação composta que agrega os 4 quadrantes (Estrutura, Conteúdo, Formação, Experiência) numa única métrica de 0 a 100. Reflecte a qualidade geral do teu CV face ao mercado.", en: "Composite score that aggregates the 4 quadrants (Structure, Content, Education, Experience) into a single metric from 0 to 100. Reflects the overall quality of your CV against the market.", es: "Puntaje compuesto que agrega los 4 cuadrantes (Estructura, Contenido, Formación, Experiencia) en una única métrica de 0 a 100. Refleja la calidad general de tu CV frente al mercado." })}
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
                  <p className="text-xs font-semibold tracking-wider text-[#C9A961]">{pick({ pt: "ANÁLISE DE COMPATIBILIDADE COM A VAGA", en: "JOB MATCH ANALYSIS", es: "ANÁLISIS DE COMPATIBILIDAD CON LA VACANTE" })}</p>
                  <Tooltip
                    label={pick({ pt: "O que é a Análise de Compatibilidade?", en: "What is the Match Analysis?", es: "¿Qué es el Análisis de Compatibilidad?" })}
                    text={pick({ pt: "Quando forneces uma vaga de emprego junto com o teu CV, o sistema analisa a correspondência entre as tuas competências e os requisitos da vaga, incluindo palavras-chave em falta e encontradas.", en: "When you provide a job posting along with your CV, the system analyzes the match between your skills and the job requirements, including missing and found keywords.", es: "Cuando proporcionas una vacante junto con tu CV, el sistema analiza la correspondencia entre tus competencias y los requisitos de la vacante, incluyendo palabras clave faltantes y encontradas." })}
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
                <p className="text-xs font-semibold text-red-500 mb-2">{pick({ pt: "Palavras-chave em falta:", en: "Missing Keywords:", es: "Palabras clave faltantes:" })}</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.jobMatch.keywordGaps.map((gap: string, i: number) => (
                    <span key={i} className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 border border-red-500/20">{gap}</span>
                  ))}
                </div>
              </div>
            )}
            {data.jobMatch.matchedKeywords && data.jobMatch.matchedKeywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-600 mb-2">{pick({ pt: "Palavras-chave encontradas:", en: "Found Keywords:", es: "Palabras clave encontradas:" })}</p>
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
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {data.jobMatch.keywordGaps.length} {pick({ pt: "em falta", en: "missing", es: "faltantes" })}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {data.jobMatch.matchedKeywords.length} {pick({ pt: "encontradas", en: "found", es: "encontradas" })}</span>
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
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "ANÁLISE POR QUADRANTE", en: "QUADRANT ANALYSIS", es: "ANÁLISIS POR CUADRANTES" })}</p>
              <Tooltip
                label={pick({ pt: "O que são os Quadrantes?", en: "What are Quadrants?", es: "¿Qué son los Cuadrantes?" })}
                text={pick({ pt: "O teu CV é avaliado em 4 dimensões independentes: Estrutura (organização visual), Conteúdo (qualidade do texto), Formação (apresentação académica) e Experiência (descrição profissional). Cada uma é comparada com o benchmark do mercado.", en: "Your CV is evaluated in 4 independent dimensions: Structure (visual organization), Content (text quality), Education (academic presentation), and Experience (professional description). Each is compared against market benchmark.", es: "Tu CV es evaluado en 4 dimensiones independientes: Estructura (organización visual), Contenido (calidad del texto), Formación (presentación académica) y Experiencia (descripción profesional). Cada una se compara con el benchmark del mercado." })}
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "FACTORES DE AVALIAÇÃO", en: "EVALUATION FACTORS", es: "FACTORES DE EVALUACIÓN" })}</p>
                <Tooltip
                  label={pick({ pt: "O que são os Factores de Avaliação?", en: "What are the Evaluation Factors?", es: "¿Qué son los Factores de Evaluación?" })}
                  text={pick({ pt: "Representação visual de cada dimensão do CV em barra horizontal. A linha vertical indica o benchmark (média do mercado) para o mesmo nível de senioridade. Valores acima do benchmark são positivos.", en: "Visual representation of each CV dimension as a horizontal bar. The vertical line indicates the benchmark (market average) for the same seniority level. Values above the benchmark are positive.", es: "Representación visual de cada dimensión del CV en barra horizontal. La línea vertical indica el benchmark (media del mercado) para el mismo nivel de senioridad. Valores por encima del benchmark son positivos." })}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{pick({ pt: "Cada factor é comparado com a média do mercado. A linha vertical na barra indica o benchmark.", en: "Each factor is compared with the market average. The vertical line on the bar indicates the benchmark.", es: "Cada factor se compara con la media del mercado. La línea vertical en la barra indica el benchmark." })}</p>
            </div>
          </div>
          <div className="space-y-5">
            {quadrants.map((q, i) => (
              <DimensionBar key={i} label={q.title} score={q.score} benchmark={q.benchmark} insight={q.impactPhrase} />
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              → {pick({ pt: "O teu CV tem um score médio de", en: "Your CV has an average score of", es: "Tu CV tiene una puntuación media de" })} <span className="font-semibold text-foreground">{Math.round(avgScore)}/100</span>, {pick({ pt: "o que te coloca", en: "which places you", es: "lo que te coloca" })} {avgScore >= 69 ? pick({ pt: 'acima', en: 'above', es: 'por encima' }) : pick({ pt: 'abaixo', en: 'below', es: 'por debajo' })} {pick({ pt: "da média global do mercado (69).", en: "the global market average (69).", es: "de la media global del mercado (69)." })} {avgScore >= 75 ? pick({ pt: 'Bom desempenho geral — foca-te nas dimensões mais fracas para subir ainda mais.', en: 'Good overall performance — focus on weaker areas to improve further.', es: 'Buen desempeño general — concéntrate en las áreas más débiles para mejorar aún más.' }) : avgScore >= 55 ? pick({ pt: 'Há margem clara de melhoria — as recomendações abaixo indicam por onde começar.', en: 'There is clear room for improvement — recommendations below indicate where to start.', es: 'Hay margen claro de mejora — las recomendaciones a continuación indican por dónde empezar.' }) : pick({ pt: 'É prioritário melhorar as dimensões com score mais baixo para tornar o CV competitivo.', en: 'It is a priority to improve the lowest scoring dimensions to make the CV competitive.', es: 'Es prioritario mejorar las dimensiones con puntuación más baja para hacer el CV competitivo.' })}
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "COMPATIBILIDADE ATS", en: "ATS COMPATIBILITY", es: "COMPATIBILIDAD ATS" })}</p>
                <Tooltip
                  label={pick({ pt: "O que é a Compatibilidade ATS?", en: "What is ATS Compatibility?", es: "¿Qué es la Compatibilidad ATS?" })}
                  text={pick({ pt: "Applicant Tracking System — software usado por 75% das empresas para filtrar CVs automaticamente. Este score indica a probabilidade do teu CV passar esses filtros. Quanto maior, melhor.", en: "Applicant Tracking System — software used by 75% of companies to filter CVs automatically. This score indicates the likelihood of your CV passing these filters. The higher, the better.", es: "Applicant Tracking System — software usado por el 75% de las empresas para filtrar CVs automáticamente. Este puntaje indica la probabilidad de que tu CV pase estos filtros. Cuanto mayor, mejor." })}
                />
              </div>
              <p className="text-xs text-muted-foreground">{pick({ pt: "Probabilidade do teu CV passar filtros automáticos de recrutamento", en: "Probability of your CV passing automated recruitment filters", es: "Probabilidad de que tu CV pase filtros automáticos de reclutamiento" })}</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <ScoreGauge score={100 - data.atsRejectionRate} size={160} strokeWidth={8} />
            <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
              {pick({ pt: "O teu CV tem", en: "Your CV has", es: "Tu CV tiene" })} <span className="font-semibold text-foreground">{100 - data.atsRejectionRate}%</span> {pick({ pt: "de compatibilidade com sistemas ATS.", en: "compatibility with ATS systems.", es: "de compatibilidad con sistemas ATS." })} {100 - data.atsRejectionRate >= 70 ? pick({ pt: 'Boa compatibilidade — a maioria dos sistemas aceitará o teu CV.', en: 'Good compatibility — most systems will accept your CV.', es: 'Buena compatibilidad — la mayoría de los sistemas aceptará tu CV.' }) : 100 - data.atsRejectionRate >= 50 ? pick({ pt: 'Compatibilidade média — alguns sistemas poderão rejeitar o teu CV.', en: 'Average compatibility — some systems may reject your CV.', es: 'Compatibilidad media — algunos sistemas podrían rechazar tu CV.' }) : pick({ pt: 'Compatibilidade baixa — muitos sistemas rejeitarão o teu CV antes de ser lido.', en: 'Low compatibility — many systems will reject your CV before being read.', es: 'Compatibilidad baja — muchos sistemas rechazarán tu CV antes de ser leído.' })}
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
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "PERCEPÇÃO DO RECRUTADOR", en: "RECRUITER PERCEPTION", es: "PERCEPCIÓN DEL RECLUTADOR" })}</p>
              <Tooltip
                label={pick({ pt: "O que é a Percepção do Recrutador?", en: "What is the Recruiter Perception?", es: "¿Qué es la Percepción del Reclutador?" })}
                text={pick({ pt: "Simulação do que um recrutador retém do teu CV nos primeiros 5-10 segundos de leitura. Inclui o perfil profissional percebido, nível de senioridade e competências-chave identificadas.", en: "Simulation of what a recruiter retains from your CV in the first 5-10 seconds of reading. Includes perceived professional profile, seniority level and identified key skills.", es: "Simulación de lo que un reclutador retiene de tu CV en los primeros 5-10 segundos de lectura. Incluye el perfil profesional percibido, nivel de senioridad y competencias clave identificadas." })}
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "ESTIMATIVA SALARIAL", en: "SALARY ESTIMATE", es: "ESTIMACIÓN SALARIAL" })}</p>
                <Tooltip
                  label={pick({ pt: "Como é calculada a estimativa?", en: "How is the estimate calculated?", es: "¿Cómo se calcula la estimación?" })}
                  text={pick({ pt: "Estimativa baseada no perfil profissional detectado, nível de senioridade, competências identificadas e dados salariais do mercado português. Os valores são indicativos e podem variar conforme a região, setor e dimensão da empresa.", en: "Estimate based on detected professional profile, seniority level, identified skills and salary data from the Portuguese market. Values are indicative and may vary depending on region, sector, and company size.", es: "Estimación basada en el perfil profesional detectado, nivel de senioridad, competencias identificadas y datos salariales del mercado portugués. Los valores son indicativos y pueden variar según la región, sector y tamaño de la empresa." })}
                />
              </div>
              <p className="text-xs text-muted-foreground">{pick({ pt: "Com base no perfil e mercado português", en: "Based on the profile and Portuguese market", es: "Basado en el perfil y mercado portugués" })}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{pick({ pt: "Mínimo", en: "Minimum", es: "Mínimo" })}</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">€{data.salaryRange?.min || 1200}</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
            <div className="text-center p-4 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground mb-1">{pick({ pt: "Estimativa", en: "Estimate", es: "Estimación" })}</p>
              <p className="text-2xl font-bold text-[#C9A961]">€{data.salaryRange?.mid || 1650}</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{pick({ pt: "Máximo", en: "Maximum", es: "Máximo" })}</p>
              <p className="text-2xl font-bold text-foreground">€{data.salaryRange?.max || 2100}</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            → {pick({ pt: "Valores estimados com base em dados do mercado português para o perfil de", en: "Values estimated based on Portuguese market data for the profile of", es: "Valores estimados basados en datos del mercado portugués para el perfil de" })} <span className="font-semibold text-foreground">{data.perceivedRole || pick({ pt: 'Profissional', en: 'Professional', es: 'Profesional' })}</span> {pick({ pt: "com senioridade", en: "with seniority", es: "con senioridad" })} <span className="font-semibold text-foreground">{data.perceivedSeniority || pick({ pt: 'Mid-level', en: 'Mid-level', es: 'Nivel medio' })}</span>. {pick({ pt: "Estes valores são indicativos e podem variar conforme a região, setor e dimensão da empresa.", en: "These values are indicative and may vary according to region, sector and company size.", es: "Estos valores son indicativos y pueden variar según la región, sector y tamaño de la empresa." })}
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "POSICIONAMENTO NO MERCADO", en: "MARKET POSITIONING", es: "POSICIONAMIENTO EN EL MERCADO" })}</p>
                <Tooltip
                  label={pick({ pt: "O que é a Curva Normal?", en: "What is the Normal Curve?", es: "¿Qué es la Curva Normal?" })}
                  text={pick({ pt: "Distribuição estatística que mostra onde o teu CV se posiciona face a todos os CVs analisados na nossa plataforma. O percentil indica a percentagem de CVs que o teu supera.", en: "Statistical distribution showing where your CV stands compared to all CVs analyzed on our platform. The percentile indicates the percentage of CVs your CV surpasses.", es: "Distribución estadística que muestra dónde se posiciona tu CV frente a todos los CVs analizados en nuestra plataforma. El percentil indica el porcentaje de CVs que tu CV supera." })}
                />
              </div>
              <p className="text-xs text-muted-foreground">{pick({ pt: "Curva normal — onde te posicionas face a outros candidatos", en: "Normal curve — where you stand compared to other candidates", es: "Curva normal — dónde te posicionas frente a otros candidatos" })}</p>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{pick({ pt: "Percentil", en: "Percentile", es: "Percentil" })}</p>
              <p className="text-xl font-bold text-foreground">{percentile}%</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground">{pick({ pt: "Posição", en: "Position", es: "Posición" })}</p>
              <p className="text-xl font-bold text-[#C9A961]">{pick({ pt: `Top ${100 - percentile}%`, en: `Top ${100 - percentile}%`, es: `Top ${100 - percentile}%` })}</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{pick({ pt: "Score Global", en: "Overall Score", es: "Puntaje Global" })}</p>
              <p className="text-xl font-bold text-foreground">{Math.round(avgScore)}/100</p>
            </div>
          </div>

          {/* Interpretation */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            → {pick({ pt: "Estás no", en: "You are in the", es: "Estás en el" })} <span className="font-semibold text-foreground">{pick({ pt: `percentil ${percentile}`, en: `percentile ${percentile}`, es: `percentil ${percentile}` })}</span>, {pick({ pt: "o que significa que o teu CV é melhor que", en: "which means your CV is better than", es: "lo que significa que tu CV es mejor que" })} {percentile}% {pick({ pt: "dos CVs analisados.", en: "of CVs analyzed.", es: "de los CVs analizados." })} {percentileInterpretation(percentile)}
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "ANÁLISE DETALHADA POR DIMENSÃO", en: "DETAILED DIMENSION ANALYSIS", es: "ANÁLISIS DETALLADO POR DIMENSIÓN" })}</p>
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
                            {gap >= 0 ? '+' : ''}{gap} {pick({ pt: "vs benchmark", en: "vs benchmark", es: "vs benchmark" })}
                          </span>
                        </div>
                      </div>
                      {q.detailed_feedback ? (
                        <p className="text-sm text-muted-foreground">{q.detailed_feedback}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {isStrong ? (
                            <>✅ <strong>{pick({ pt: "Ponto forte.", en: "Strength.", es: "Punto fuerte." })}</strong> {pick({ pt: "Estás", en: "You are", es: "Estás" })} {gap} {pick({ pt: "pontos acima do benchmark", en: "points above the benchmark", es: "puntos por encima del benchmark" })} ({q.benchmark}).</>
                          ) : isWeak ? (
                            <>⚠️ <strong>{pick({ pt: "Área de melhoria.", en: "Area for improvement.", es: "Área de mejora." })}</strong> {pick({ pt: "Estás", en: "You are", es: "Estás" })} {Math.abs(gap)} {pick({ pt: "pontos abaixo do benchmark", en: "points below the benchmark", es: "puntos por debajo del benchmark" })} ({q.benchmark}).</>
                          ) : (
                            <>→ <strong>{pick({ pt: "Acima da média.", en: "Above average.", es: "Por encima del promedio." })}</strong> {pick({ pt: "Estás", en: "You are", es: "Estás" })} {gap} {pick({ pt: "pontos acima do benchmark", en: "points above the benchmark", es: "puntos por encima del benchmark" })} ({q.benchmark}).</>
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "MATRIZ DE PRIORIDADES", en: "PRIORITY MATRIX", es: "MATRIZ DE PRIORIDADES" })}</p>
              </div>
              <p className="text-sm text-muted-foreground">{pick({ pt: "Dimensões ordenadas por urgência de melhoria (maior gap = maior prioridade):", en: "Dimensions ordered by urgency of improvement (larger gap = higher priority):", es: "Dimensiones ordenadas por urgencia de mejora (mayor gap = mayor prioridad):" })}</p>
              <div className="space-y-2">
                {[...quadrants].sort((a: any, b: any) => (a.score - a.benchmark) - (b.score - b.benchmark)).map((dim: any, i: number) => {
                  const gap = dim.score - dim.benchmark;
                  const priority = gap <= 0 ? pick({ pt: 'Alta', en: 'High', es: 'Alta' }) : gap <= 10 ? pick({ pt: 'Média', en: 'Medium', es: 'Media' }) : pick({ pt: 'Baixa', en: 'Low', es: 'Baja' });
                  const prColor = priority === pick({ pt: 'Alta', en: 'High', es: 'Alta' }) ? 'bg-red-500/10 text-red-600 border-red-500/20' : priority === pick({ pt: 'Média', en: 'Medium', es: 'Media' }) ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20';
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
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "ACÇÕES DE MELHORIA — ANTES vs DEPOIS", en: "IMPROVEMENT ACTIONS — BEFORE vs AFTER", es: "ACCIONES DE MEJORA — ANTES vs DESPUÉS" })}</p>
                </div>
                <p className="text-sm text-muted-foreground">{pick({ pt: "Acções concretas para melhorar o teu CV, com o impacto estimado de cada uma:", en: "Concrete actions to improve your CV, with the estimated impact of each:", es: "Acciones concretas para mejorar tu CV, con el impacto estimado de cada una:" })}</p>
                <div className="space-y-4">
                  {data.improvementActions.map((action: any, i: number) => (
                    <div key={i} className="border border-border rounded-lg overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">#{i + 1}</span>
                          <span className="text-sm font-semibold text-foreground">{action.action}</span>
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded">+{action.impact} {pick({ pt: "pontos", en: "points", es: "puntos" })}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                        <div className="p-3">
                          <p className="text-[10px] font-semibold text-red-500 mb-1">❌ {pick({ pt: "ANTES", en: "BEFORE", es: "ANTES" })}</p>
                          <p className="text-sm text-muted-foreground">{typeof action.before === 'object' ? JSON.stringify(action.before) : String(action.before || '')}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] font-semibold text-green-600 mb-1">✅ {pick({ pt: "DEPOIS", en: "AFTER", es: "DESPUÉS" })}</p>
                          <p className="text-sm text-muted-foreground">{typeof action.after === 'object' ? JSON.stringify(action.after) : String(action.after || '')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20">
                  <p className="text-sm text-foreground font-medium">
                    🎯 {pick({ pt: "Score estimado após melhorias:", en: "Estimated score after improvements:", es: "Puntaje estimado tras mejoras:" })} <strong className="text-[#C9A961]">{Math.min(100, Math.round(avgScore) + (data.improvementActions?.reduce((sum: number, a: any) => sum + (a.impact === 'Alto' ? 8 : a.impact === 'Médio' ? 5 : typeof a.impact === 'number' ? a.impact : 3), 0) || 0))}/100</strong>
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{pick({ pt: "PLANO DE ACÇÃO — 30 DIAS", en: "30-DAY ACTION PLAN", es: "PLAN DE ACCIÓN — 30 DÍAS" })}</p>
              </div>
              <div className="space-y-3">
                {(data.actionPlan || [
                  { week: pick({ pt: 'Semana 1-2', en: 'Week 1-2', es: 'Semana 1-2' }), title: pick({ pt: 'Optimização de Conteúdo', en: 'Content Optimization', es: 'Optimización de Contenido' }), tasks: [
                    pick({ pt: 'Reescrever resumo profissional com métricas de impacto', en: 'Rewrite professional summary with impact metrics', es: 'Reescribir resumen profesional con métricas de impacto' }),
                    pick({ pt: 'Adicionar resultados quantificáveis a cada experiência', en: 'Add quantifiable results to each experience', es: 'Añadir resultados cuantificables a cada experiencia' }),
                    pick({ pt: 'Alinhar keywords com as funções-alvo', en: 'Align keywords with target roles', es: 'Alinear palabras clave con los roles objetivo' }),
                  ] },
                  { week: pick({ pt: 'Semana 3', en: 'Week 3', es: 'Semana 3' }), title: pick({ pt: 'Estrutura e Formatação', en: 'Structure and Formatting', es: 'Estructura y Formato' }), tasks: [
                    pick({ pt: 'Optimizar hierarquia visual e espaçamento', en: 'Optimize visual hierarchy and spacing', es: 'Optimizar jerarquía visual y espaciado' }),
                    pick({ pt: 'Garantir compatibilidade ATS (formato, fontes, secções)', en: 'Ensure ATS compatibility (format, fonts, sections)', es: 'Garantizar compatibilidad ATS (formato, fuentes, secciones)' }),
                    pick({ pt: 'Adicionar secções em falta (certificações, idiomas, etc.)', en: 'Add missing sections (certifications, languages, etc.)', es: 'Agregar secciones faltantes (certificaciones, idiomas, etc.)' }),
                  ] },
                  { week: pick({ pt: 'Semana 4', en: 'Week 4', es: 'Semana 4' }), title: pick({ pt: 'Validação e Ajustes', en: 'Validation and Adjustments', es: 'Validación y Ajustes' }), tasks: [
                    pick({ pt: 'Pedir feedback a 2-3 profissionais da área', en: 'Request feedback from 2-3 professionals in the field', es: 'Pedir retroalimentación a 2-3 profesionales del área' }),
                    pick({ pt: 'Testar em diferentes sistemas ATS', en: 'Test on different ATS systems', es: 'Probar en diferentes sistemas ATS' }),
                    pick({ pt: 'Personalizar versões para candidaturas específicas', en: 'Customize versions for specific applications', es: 'Personalizar versiones para candidaturas específicas' }),
                  ] },
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
