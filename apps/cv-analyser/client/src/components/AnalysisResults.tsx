// AnalysisResults.tsx - Relatório PAGO completo
// i18n: All strings use t() from centralised translations
import { useState } from "react";
import QuadrantCard from "./QuadrantCard";
import ATSRejectionBlock from "./ATSRejectionBlock";
import RecruiterPerception from "./RecruiterPerception";
import DimensionBar from "./DimensionBar";
import ScoreGauge from "./ScoreGauge";
import { Info, FileCheck, BarChart3, Grid2x2, TrendingUp, Eye, Target, AlertTriangle, Euro, Bot } from "lucide-react";
import { t, getLang } from "@/i18n";
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

/** Icon wrapper - Share2Inspire style */
function GoldIcon({ children, size = "w-10 h-10" }: { children: React.ReactNode; size?: string }) {
  return (
    <div className={`${size} rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0`}>
      {children}
    </div>
  );
}

/** Score interpretation - i18n */
function scoreInterpretation(score: number): string {
  if (score >= 85) return t('score_excelente');
  if (score >= 70) return t('score_bom');
  if (score >= 55) return t('score_razoavel');
  if (score >= 40) return t('score_abaixo');
  return t('score_critico');
}

/** ATS interpretation - i18n */
function atsInterpretation(rate: number): string {
  if (rate >= 70) return t('ats_risco_muito_elevado');
  if (rate >= 50) return t('ats_risco_elevado');
  if (rate >= 30) return t('ats_risco_moderado');
  return t('ats_risco_baixo');
}

/** Percentile interpretation - i18n */
function percentileInterpretation(percentile: number): string {
  if (percentile >= 80) return t('percentil_quartil_superior');
  if (percentile >= 60) return t('percentil_acima_media');
  if (percentile >= 40) return t('percentil_zona_media');
  if (percentile >= 20) return t('percentil_abaixo_media');
  return t('percentil_quartil_inferior');
}

/** Automation potential - INVERTED: higher = worse (more risk of automation) */
function AutomationRiskGauge({ score }: { score: number }) {
  const riskLevel = score;
  const riskColor = riskLevel >= 70 ? "text-red-500" : riskLevel >= 40 ? "text-yellow-500" : "text-green-500";
  const riskLabel = riskLevel >= 70 ? t('elevado') : riskLevel >= 40 ? t('moderado') : t('baixo');
  const riskDescription = riskLevel >= 70
    ? t('automacao_elevado')
    : riskLevel >= 40
    ? t('automacao_moderado')
    : t('automacao_baixo');

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Bot className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('potencial_de_automacao')}</p>
            <Tooltip
              label={t('o_que_e_potencial_automacao')}
              text={t('automacao_tooltip')}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t('risco_automacao_funcao')}</p>
        </div>
      </div>

      {/* Risk bar - inverted: red = high risk */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('baixo_risco_label')}</span>
          <span className={`text-xs font-semibold ${riskColor}`}>{riskLabel} ({riskLevel}%)</span>
          <span className="text-xs text-muted-foreground">{t('alto_risco_label')}</span>
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

const AnalysisResults = ({ data }: { data: AnalysisData }) => {
  const lang = getLang();
  const avgScore = data.quadrants.reduce((sum, q) => sum + q.score, 0) / data.quadrants.length;
  const percentile = Math.round(Math.min(95, Math.max(5, avgScore * 0.95)));
  const automationRisk = Math.round(Math.max(15, Math.min(85, 100 - avgScore + (Math.random() * 10 - 5))));

  const aboveBelow = avgScore >= 69 ? t('acima') : t('abaixo');
  const scoreAdvice = avgScore >= 75 ? t('bom_desempenho') : avgScore >= 55 ? t('margem_melhoria') : t('prioritario_melhorar');
  const atsCompat = 100 - data.atsRejectionRate;
  const atsAdvice = atsCompat >= 70 ? t('boa_compatibilidade') : atsCompat >= 50 ? t('compatibilidade_media') : t('compatibilidade_baixa');
  const currencySymbol = '€';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4 sticky top-0 bg-background/90 backdrop-blur-lg z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GoldIcon size="w-8 h-8">
              <FileCheck className="w-4 h-4 text-[#C9A961]" />
            </GoldIcon>
            <span className="font-semibold text-sm text-foreground">{t('relatorio_completo')}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* ═══ Score Global ═══ */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <Target className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('score_global_do_cv')}</p>
                <Tooltip label={t('o_que_e_o_score_global')} text={t('score_global_tooltip')} />
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

        {/* ═══ ATS Rejection ═══ */}
        <div className="space-y-2">
          <ATSRejectionBlock rejectionRate={data.atsRejectionRate} topFactor={data.atsTopFactor} />
          <p className="text-sm text-muted-foreground px-2 leading-relaxed">
            {atsInterpretation(data.atsRejectionRate)}
          </p>
        </div>

        {/* ═══ 4 Quadrantes ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GoldIcon size="w-8 h-8">
              <Grid2x2 className="w-4 h-4 text-[#C9A961]" />
            </GoldIcon>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('analise_por_quadrante')}</p>
              <Tooltip label={t('o_que_sao_os_quadrantes')} text={t('quadrantes_tooltip')} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.quadrants.map((q: any, i: number) => (
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('factores_de_avaliacao')}</p>
                <Tooltip label={t('o_que_sao_factores')} text={t('factores_tooltip')} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('factores_subtitulo')}</p>
            </div>
          </div>
          <div className="space-y-5">
            {data.quadrants.map((q, i) => (
              <DimensionBar key={i} label={q.title} score={q.score} benchmark={q.benchmark} insight={q.impactPhrase} />
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              → {t('score_medio_text')} <span className="font-semibold text-foreground">{Math.round(avgScore)}/100</span>, {t('que_te_coloca')} {aboveBelow} {t('da_media_global')} {scoreAdvice}
            </p>
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
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('compatibilidade_ats')}</p>
                <Tooltip label={t('o_que_e_compatibilidade_ats')} text={t('ats_tooltip')} />
              </div>
              <p className="text-xs text-muted-foreground">{t('ats_subtitulo')}</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <ScoreGauge score={atsCompat} size={160} strokeWidth={8} />
            <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
              {t('cv_tem_compatibilidade')} <span className="font-semibold text-foreground">{atsCompat}%</span> {t('de_compatibilidade_ats')} {atsAdvice}
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
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('percepcao_do_recrutador')}</p>
              <Tooltip label={t('o_que_e_percepcao')} text={t('percepcao_tooltip')} />
            </div>
          </div>
          <RecruiterPerception roles={data.keywords} perceivedRole={data.perceivedRole} perceivedSeniority={data.perceivedSeniority} />
        </div>

        {/* ═══ Estimativa Salarial ═══ */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <GoldIcon>
              <Euro className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('estimativa_salarial_section')}</p>
                <Tooltip label={t('como_e_calculada')} text={t('estimativa_salarial_tooltip')} />
              </div>
              <p className="text-xs text-muted-foreground">{t('com_base_no_perfil')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('minimo')}</p>
              <p className="text-2xl font-bold text-foreground">{currencySymbol}{data.salaryRange?.min || 1200}</p>
              <p className="text-xs text-muted-foreground">{t('mes')}</p>
            </div>
            <div className="text-center p-4 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground mb-1">{t('estimativa')}</p>
              <p className="text-2xl font-bold text-[#C9A961]">{currencySymbol}{data.salaryRange?.mid || 1650}</p>
              <p className="text-xs text-muted-foreground">{t('mes')}</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t('maximo')}</p>
              <p className="text-2xl font-bold text-foreground">{currencySymbol}{data.salaryRange?.max || 2100}</p>
              <p className="text-xs text-muted-foreground">{t('mes')}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            → {t('valores_estimados_perfil')} <span className="font-semibold text-foreground">{data.perceivedRole || t('profissional')}</span> {t('com_senioridade')} <span className="font-semibold text-foreground">{data.perceivedSeniority || 'Mid-level'}</span>. {t('valores_indicativos')}
          </p>
        </div>

        {/* ═══ Potencial de Automação ═══ */}
        <AutomationRiskGauge score={automationRisk} />

        {/* ═══ Posicionamento no Mercado ═══ */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <TrendingUp className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">{t('posicionamento_no_mercado')}</p>
                <Tooltip label={t('o_que_e_curva_normal')} text={t('curva_normal_tooltip')} />
              </div>
              <p className="text-xs text-muted-foreground">{t('curva_normal_subtitulo')}</p>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{t('percentil')}</p>
              <p className="text-xl font-bold text-foreground">{percentile}%</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground">{t('posicao')}</p>
              <p className="text-xl font-bold text-[#C9A961]">Top {100 - percentile}%</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{t('score_global')}</p>
              <p className="text-xl font-bold text-foreground">{Math.round(avgScore)}/100</p>
            </div>
          </div>

          {/* Interpretation */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            → {t('estas_no_percentil')} <span className="font-semibold text-foreground">{t('percentil').toLowerCase()} {percentile}</span>, {t('o_que_significa')} {percentile}% {t('dos_cvs_analisados')} {percentileInterpretation(percentile)}
          </p>
        </div>
      </main>
    </div>
  );
};

export default AnalysisResults;
