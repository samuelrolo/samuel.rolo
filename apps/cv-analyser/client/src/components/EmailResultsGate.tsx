import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, CreditCard, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pick } from '@/i18n';

export interface EmailGateMetric {
  label: string;
  value: string;
  helper?: string;
  /** numeric score 0-100 for color coding */
  score?: number;
}

export interface EmailGateHighlight {
  title: string;
  description: string;
  icon?: ReactNode;
  /** 'danger' | 'warning' | 'ok' */
  severity?: 'danger' | 'warning' | 'ok';
}

interface EmailResultsGateProps {
  productLabel: string;
  previewTitle: string;
  previewDescription: string;
  metrics?: EmailGateMetric[];
  highlights?: EmailGateHighlight[];
  ctaLabel?: string;
  onCtaClick: () => void;
}

function metricColor(score?: number) {
  if (score == null) return { border: 'border-slate-200', bg: 'bg-white/90', text: 'text-slate-900', dot: 'bg-slate-400' };
  if (score < 50) return { border: 'border-red-300', bg: 'bg-red-50/80', text: 'text-red-700', dot: 'bg-red-500' };
  if (score < 75) return { border: 'border-amber-300', bg: 'bg-amber-50/80', text: 'text-amber-700', dot: 'bg-amber-500' };
  return { border: 'border-green-300', bg: 'bg-green-50/80', text: 'text-green-700', dot: 'bg-green-500' };
}

function highlightStyle(severity?: string) {
  if (severity === 'danger') return { border: 'border-red-200', bg: 'bg-red-50/60', iconBg: 'bg-red-100 text-red-600', titleColor: 'text-red-800' };
  if (severity === 'warning') return { border: 'border-amber-200', bg: 'bg-amber-50/60', iconBg: 'bg-amber-100 text-amber-600', titleColor: 'text-amber-800' };
  return { border: 'border-green-200', bg: 'bg-green-50/60', iconBg: 'bg-green-100 text-green-600', titleColor: 'text-green-800' };
}

export default function EmailResultsGate({
  productLabel,
  previewTitle,
  previewDescription,
  metrics = [],
  highlights = [],
  ctaLabel,
  onCtaClick,
}: EmailResultsGateProps) {
  const gateBenefits = useMemo(() => ([
    pick('Descobre o que está a bloquear o teu CV nos filtros automáticos.', 'Find out what is blocking your CV in automatic filters.', 'Descubre qué está bloqueando tu CV en los filtros automáticos.'),
    pick('Vê como os recrutadores percecionam o teu perfil antes de te conhecerem.', 'See how recruiters perceive your profile before meeting you.', 'Mira cómo los reclutadores perciben tu perfil antes de conocerte.'),
    pick('Recebe ações concretas para aumentar a tua probabilidade de entrevista.', 'Get concrete actions to increase your interview probability.', 'Recibe acciones concretas para aumentar tu probabilidad de entrevista.'),
  ]), []);

  return (
    <section className="space-y-5">
      {/* ── DIAGNOSTIC BLOCK ── */}
      <div className="rounded-3xl border-2 border-red-200/60 bg-gradient-to-br from-red-50/40 via-white to-amber-50/30 p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            {pick('Diagnóstico', 'Diagnosis', 'Diagnóstico')}
          </span>
          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 border border-slate-200">
            {productLabel}
          </span>
        </div>

        <div className="space-y-2 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{previewTitle}</h2>
          <p className="text-sm md:text-base leading-relaxed text-slate-600 max-w-3xl">{previewDescription}</p>
        </div>

        {/* ── METRICS with color coding ── */}
        {metrics.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3 mb-6">
            {metrics.map((metric) => {
              const c = metricColor(metric.score);
              return (
                <div key={`${metric.label}-${metric.value}`} className={`rounded-2xl border-2 ${c.border} ${c.bg} p-4 relative overflow-hidden`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">{metric.label}</p>
                  </div>
                  <p className={`text-3xl font-black ${c.text}`}>{metric.value}</p>
                  {metric.helper && <p className={`mt-2 text-xs font-semibold leading-relaxed ${c.text} opacity-80`}>{metric.helper}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── HIGHLIGHTS as problem cards ── */}
        {highlights.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {highlights.map((highlight, index) => {
              const s = highlightStyle(highlight.severity);
              return (
                <div key={`${highlight.title}-${index}`} className={`rounded-2xl border-2 ${s.border} ${s.bg} p-4`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${s.iconBg}`}>
                      {highlight.severity === 'danger' ? <XCircle className="h-4 w-4" /> :
                       highlight.severity === 'warning' ? <AlertCircle className="h-4 w-4" /> :
                       highlight.icon || <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${s.titleColor}`}>{highlight.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">{highlight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CTA BLOCK ── */}
      <div className="rounded-3xl border-2 border-red-300/40 bg-white p-6 md:p-8 shadow-lg shadow-red-500/5">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {pick('O teu CV está a perder entrevistas', 'Your CV is losing interviews', 'Tu CV está perdiendo entrevistas')}
            </div>
            <h3 className="mt-4 text-2xl font-bold text-slate-900">
              {pick('Cada candidatura com este CV reduz as tuas chances.', 'Every application with this CV reduces your chances.', 'Cada candidatura con este CV reduce tus oportunidades.')}
            </h3>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600">
              {pick('O relatório completo mostra exatamente o que está a travar o teu CV, como os recrutadores o veem e o que corrigir primeiro para começares a ser chamado.', 'The full report shows exactly what is holding back your CV, how recruiters see it, and what to fix first to start getting called.', 'El informe completo muestra exactamente qué está frenando tu CV, cómo lo ven los reclutadores y qué corregir primero para empezar a ser llamado.')}
            </p>

            <div className="mt-5 space-y-3">
              {gateBenefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-red-200/50 bg-red-50/30 p-5">
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
                  {pick('Não esperes mais', 'Don\'t wait longer', 'No esperes más')}
                </p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-800">
                  {pick('Cada dia com este CV é uma entrevista que podes estar a perder. O relatório mostra o caminho exato para corrigir.', 'Every day with this CV is an interview you may be losing. The report shows the exact path to fix it.', 'Cada día con este CV es una entrevista que puedes estar perdiendo. El informe muestra el camino exacto para corregir.')}
                </p>
              </div>

              <Button type="button" onClick={onCtaClick} className="w-full rounded-2xl bg-red-600 py-7 text-base font-bold text-white hover:bg-red-700 shadow-lg shadow-red-600/30 hover:shadow-xl hover:shadow-red-600/40 transition-all duration-200 ring-2 ring-red-500/20">
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {ctaLabel || pick('Aumentar as minhas chances de entrevista', 'Increase my chances of getting interviews', 'Aumentar mis oportunidades de entrevista')}
                </span>
              </Button>

              <p className="text-xs font-semibold leading-relaxed text-red-600/80 text-center">
                {pick('Vê exatamente o que está a bloquear o teu CV e como corrigir.', 'See exactly what is blocking your CV and how to fix it.', 'Mira exactamente qué está bloqueando tu CV y cómo corregirlo.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
