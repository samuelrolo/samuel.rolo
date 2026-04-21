import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Lock, Sparkles, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pick } from '@/i18n';

export interface EmailGateMetric {
  label: string;
  value: string;
  helper?: string;
}

export interface EmailGateHighlight {
  title: string;
  description: string;
  icon?: ReactNode;
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
    <section className="space-y-6">
      <div className="rounded-3xl border border-[#C9A961]/20 bg-gradient-to-br from-[#fffdf8] via-white to-[#faf6ea] p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A88B4E]">
            <Sparkles className="h-3.5 w-3.5" />
            {pick('Diagnóstico do CV', 'CV diagnosis', 'Diagnóstico del CV')}
          </span>
          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 border border-slate-200">
            {productLabel}
          </span>
        </div>

        <div className="space-y-3 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{previewTitle}</h2>
          <p className="text-sm md:text-base leading-relaxed text-slate-600 max-w-3xl">{previewDescription}</p>
        </div>

        {metrics.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3 mb-6">
            {metrics.map((metric) => (
              <div key={`${metric.label}-${metric.value}`} className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 mb-2">{metric.label}</p>
                <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                {metric.helper && <p className="mt-2 text-xs leading-relaxed text-slate-500">{metric.helper}</p>}
              </div>
            ))}
          </div>
        )}

        {highlights.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {highlights.map((highlight, index) => (
              <div key={`${highlight.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#C9A961]/20 bg-[#C9A961]/10 text-[#A88B4E]">
                    {highlight.icon || <ArrowRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{highlight.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{highlight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border-2 border-[#C9A961]/25 bg-white p-6 md:p-8 shadow-lg shadow-[#C9A961]/8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600">
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

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {pick('O que vais receber', 'What you will get', 'Lo que recibirás')}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {pick('Análise completa com diagnóstico ATS, percepção do recrutador, estimativa salarial e plano de ação priorizado para aumentar a tua probabilidade de entrevista.', 'Full analysis with ATS diagnosis, recruiter perception, salary estimate and prioritised action plan to increase your interview probability.', 'Análisis completo con diagnóstico ATS, percepción del reclutador, estimación salarial y plan de acción priorizado para aumentar tu probabilidad de entrevista.')}
                </p>
              </div>

              <Button type="button" onClick={onCtaClick} className="w-full rounded-2xl bg-[#C9A961] py-6 text-sm font-semibold text-white hover:bg-[#B8954F]">
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {ctaLabel || pick('Aumentar as minhas chances de entrevista', 'Increase my chances of getting interviews', 'Aumentar mis oportunidades de entrevista')}
                </span>
              </Button>

              <p className="text-xs leading-relaxed text-slate-500">
                {pick('Vê exatamente o que está a bloquear o teu CV e como corrigir.', 'See exactly what is blocking your CV and how to fix it.', 'Mira exactamente qué está bloqueando tu CV y cómo corregirlo.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
