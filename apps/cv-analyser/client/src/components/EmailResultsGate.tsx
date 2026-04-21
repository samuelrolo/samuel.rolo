import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pick } from '@/i18n';

interface EmailResultsGateProps {
  productLabel: string;
  previewTitle: string;
  previewDescription: string;
  metrics?: any[];
  highlights?: any[];
  ctaLabel?: string;
  onCtaClick: () => void;
}

export default function EmailResultsGate({
  previewTitle,
  previewDescription,
  ctaLabel,
  onCtaClick,
}: EmailResultsGateProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="max-w-md mx-auto text-center space-y-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">{previewTitle}</h3>
        <p className="text-sm leading-relaxed text-slate-500">{previewDescription}</p>

        <div className="pt-1">
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
          {pick('Resultado imediato. Plano de ação incluído.', 'Immediate result. Action plan included.', 'Resultado inmediato. Plan de acción incluido.')}
        </p>
      </div>
    </div>
  );
}
