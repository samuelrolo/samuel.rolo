import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pick } from '@/i18n';

interface EmailResultsGateProps {
  productLabel: string;
  product?: string;
  previewTitle: string;
  previewDescription: string;
  metrics?: any[];
  highlights?: any[];
  ctaLabel?: string;
  onCtaClick: () => void;
  onDiscountCtaClick?: () => void;
}

export default function EmailResultsGate({
  product,
  previewTitle,
  previewDescription,
  ctaLabel,
  onCtaClick,
  onDiscountCtaClick,
}: EmailResultsGateProps) {
  const isCvAnalyser = product === 'cv-analyser';
  const DISCOUNT_SECONDS = 5 * 60; // 5 minutes
  const startRef = useRef<number>(() => {
    const stored = sessionStorage.getItem('ips_discount_start');
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    sessionStorage.setItem('ips_discount_start', String(now));
    return now;
  });

  // Initialize startRef properly
  if (typeof startRef.current === 'function') {
    startRef.current = (startRef.current as any)();
  }

  const getRemaining = () => {
    const elapsed = Math.floor((Date.now() - (startRef.current as number)) / 1000);
    return Math.max(0, DISCOUNT_SECONDS - elapsed);
  };

  const [remaining, setRemaining] = useState(getRemaining);
  const discountActive = remaining > 0;

  useEffect(() => {
    if (!discountActive) return;
    const interval = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [discountActive]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Discount countdown banner */}
      {isCvAnalyser && discountActive && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              {pick('Oferta expira em', 'Offer expires in', 'Oferta expira en')}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-700 tabular-nums">{timeStr}</p>
          <p className="mt-2 text-sm font-semibold text-red-600">
            {pick('50% de desconto — apenas agora', '50% off — only now', '50% de descuento — solo ahora')}
          </p>
        </div>
      )}

      {/* CTA block */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">{previewTitle}</h3>
          <p className="text-sm leading-relaxed text-slate-500">{previewDescription}</p>

          {isCvAnalyser && discountActive && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-lg text-slate-400 line-through">€6,99</span>
              <span className="text-2xl font-bold text-red-600">€3,49</span>
            </div>
          )}

          <div className="pt-1">
            <Button
              type="button"
              onClick={isCvAnalyser && discountActive && onDiscountCtaClick ? onDiscountCtaClick : onCtaClick}
              className="w-full rounded-xl bg-[#C9A961] py-6 text-sm sm:text-base font-bold text-white hover:bg-[#B8954F] shadow-md shadow-[#C9A961]/20 hover:shadow-lg transition-all duration-200"
            >
              <span className="inline-flex items-center justify-center gap-2 text-center">
                {isCvAnalyser && discountActive
                  ? pick('Corrigir o meu CV — 50% desconto', 'Fix my CV — 50% off', 'Corregir mi CV — 50% descuento')
                  : (ctaLabel || pick('Desbloquear relatório completo', 'Unlock full report', 'Desbloquear informe completo'))
                }
                <ArrowRight className="h-4 w-4 shrink-0" />
              </span>
            </Button>
          </div>

          <p className="text-xs text-slate-400">
            {pick('Resultado imediato. Plano de ação incluído.', 'Immediate result. Action plan included.', 'Resultado inmediato. Plan de acción incluido.')}
          </p>
        </div>
      </div>
    </div>
  );
}
