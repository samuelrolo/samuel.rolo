import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pick } from '@/i18n';

export interface EmailGateMetric {
  label: string;
  value: string;
  helper?: string;
  score?: number;
}

export interface EmailGateHighlight {
  title: string;
  description: string;
  icon?: ReactNode;
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
    pick('O que está a bloquear o teu CV nos filtros automáticos', 'What is blocking your CV in automatic filters', 'Qué está bloqueando tu CV en los filtros automáticos'),
    pick('Como os recrutadores percecionam o teu perfil', 'How recruiters perceive your profile', 'Cómo los reclutadores perciben tu perfil'),
    pick('As ações concretas para subir o teu score', 'The concrete actions to raise your score', 'Las acciones concretas para subir tu score'),
  ]), []);

  // Find the main problem highlight (danger severity)
  const mainProblem = highlights.find(h => h.severity === 'danger');

  return (
    <section className="space-y-6">
      {/* ── SINGLE PROBLEM BLOCK — clean, focused ── */}
      {mainProblem && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <AlertTriangle className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">{mainProblem.title}</p>
              <p className="text-sm leading-relaxed text-slate-700">{mainProblem.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── CTA BLOCK — minimal, clear next step ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="max-w-lg mx-auto text-center space-y-5">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{previewTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{previewDescription}</p>
          </div>

          <div className="space-y-2.5 text-left max-w-sm mx-auto">
            {gateBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#C9A961] shrink-0" />
                <p className="text-sm text-slate-600">{benefit}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={onCtaClick}
              className="w-full sm:w-auto px-8 rounded-xl bg-[#C9A961] py-6 text-base font-bold text-white hover:bg-[#B8954F] shadow-md shadow-[#C9A961]/20 hover:shadow-lg transition-all duration-200"
            >
              <span className="inline-flex items-center gap-2">
                {ctaLabel || pick('Ver relatório completo', 'View full report', 'Ver informe completo')}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </div>

          <p className="text-xs text-slate-400">
            {pick('Análise detalhada com plano de ação personalizado.', 'Detailed analysis with personalised action plan.', 'Análisis detallado con plan de acción personalizado.')}
          </p>
        </div>
      </div>
    </section>
  );
}
