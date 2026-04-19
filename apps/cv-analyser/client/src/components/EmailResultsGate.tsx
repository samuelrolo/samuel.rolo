import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Lock, Mail, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pick } from '@/i18n';
import { isValidEmailGateEmail, persistEmailGate } from '@/lib/emailGate';

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
  storageKey: string;
  initialEmail?: string;
  productLabel: string;
  previewTitle: string;
  previewDescription: string;
  metrics?: EmailGateMetric[];
  highlights?: EmailGateHighlight[];
  onUnlocked?: (email: string) => void | Promise<void>;
}

export default function EmailResultsGate({
  storageKey,
  initialEmail = '',
  productLabel,
  previewTitle,
  previewDescription,
  metrics = [],
  highlights = [],
  onUnlocked,
}: EmailResultsGateProps) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const gateBenefits = useMemo(() => ([
    pick('Recebes também o resultado no teu email para consultares mais tarde.', 'We also send your result by email so you can revisit it later.', 'También te enviamos el resultado por correo para consultarlo más tarde.'),
    pick('Desbloqueias o relatório completo imediatamente após confirmar o email.', 'You unlock the full report immediately after confirming your email.', 'Desbloqueas el informe completo inmediatamente después de confirmar el correo.'),
    pick('Manténs acesso rápido ao valor principal sem perder o contexto da análise.', 'You keep quick access to the key value without losing the context of the analysis.', 'Mantienes acceso rápido al valor principal sin perder el contexto del análisis.'),
  ]), []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!isValidEmailGateEmail(normalizedEmail)) {
      setError(pick('Introduz um email válido para receber e desbloquear o relatório.', 'Enter a valid email to receive and unlock the report.', 'Introduce un correo válido para recibir y desbloquear el informe.'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      persistEmailGate(storageKey, normalizedEmail);
      await onUnlocked?.(normalizedEmail);
    } catch (err) {
      console.error('[EmailGate] Unlock error:', err);
      setError(pick('Não foi possível concluir o desbloqueio agora. Tenta novamente.', 'We could not complete the unlock right now. Please try again.', 'No hemos podido completar el desbloqueo ahora. Inténtalo de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-[#C9A961]/20 bg-gradient-to-br from-[#fffdf8] via-white to-[#faf6ea] p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A88B4E]">
            <Sparkles className="h-3.5 w-3.5" />
            {pick('Preview da análise', 'Analysis preview', 'Vista previa del análisis')}
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
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A961]/20 bg-[#C9A961]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A88B4E]">
              <Lock className="h-3.5 w-3.5" />
              {pick('Desbloquear relatório completo', 'Unlock full report', 'Desbloquear informe completo')}
            </div>
            <h3 className="mt-4 text-2xl font-bold text-slate-900">
              {pick('Recebe a análise completa no teu email e vê todos os detalhes agora.', 'Get the full analysis by email and view every detail now.', 'Recibe el análisis completo por correo y ve todos los detalles ahora.')}
            </h3>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600">
              {pick('Este passo serve para te enviar o resultado e abrir imediatamente o relatório integral, com todas as recomendações, comparações e próximos passos.', 'This step lets us send you the result and immediately open the full report, with all recommendations, comparisons and next steps.', 'Este paso nos permite enviarte el resultado y abrir inmediatamente el informe completo, con todas las recomendaciones, comparaciones y próximos pasos.')}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={`email-gate-${storageKey}`} className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {pick('Email para receber a análise', 'Email to receive the analysis', 'Correo para recibir el análisis')}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id={`email-gate-${storageKey}`}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={pick('o-teu@email.com', 'your@email.com', 'tu@email.com')}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#C9A961] focus:ring-2 focus:ring-[#C9A961]/15"
                    autoComplete="email"
                    required
                  />
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <Button type="submit" disabled={submitting} className="w-full rounded-2xl bg-[#C9A961] py-6 text-sm font-semibold text-white hover:bg-[#B8954F]">
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Send className="h-4 w-4 animate-pulse" />
                    {pick('A desbloquear relatório...', 'Unlocking report...', 'Desbloqueando informe...')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {pick('Receber análise completa', 'Receive full analysis', 'Recibir análisis completo')}
                  </span>
                )}
              </Button>

              <p className="text-xs leading-relaxed text-slate-500">
                {pick('Ao continuar, guardamos este email para te enviar o resultado e manter o teu acesso ao relatório desbloqueado neste dispositivo.', 'By continuing, we save this email to send your result and keep the unlocked report available on this device.', 'Al continuar, guardamos este correo para enviarte el resultado y mantener el informe desbloqueado en este dispositivo.')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
