/*
 * UpgradeBanner — componente de upgrade contextual e não-intrusivo
 * Aparece no final do dashboard de cada tier com mensagem específica
 * Props: fromTier (tier atual) → mostra o próximo nível relevante
 */
import { ArrowRight, Zap } from 'lucide-react';
import { useLocation } from 'wouter';

type Tier = 'free' | 'essential' | 'growth';

interface UpgradeBannerProps {
  fromTier: Tier;
  className?: string;
}

const UPGRADE_COPY: Record<Tier, {
  headline: string;
  sub: string;
  cta: string;
  target: string;
}> = {
  free: {
    headline: 'Faz análises ilimitadas com um plano',
    sub: 'Guarda análises sem limite, acede ao Job Feed, e-books e acompanhamento de carreira a partir de 9,90€/mês.',
    cta: 'Ver planos',
    target: '/planos',
  },
  essential: {
    headline: 'Tens 1 análise/semana. Growth oferece 5.',
    sub: 'Passa para Growth e desbloqueia Job Feed, e-books premium, Career Bot avançado e matching inteligente de vagas.',
    cta: 'Ver Growth — 19,90€/mês',
    target: '/planos',
  },
  growth: {
    headline: 'Análises ilimitadas + Career Intelligence',
    sub: 'Com Pro tens análises sem limite, salary estimation no Job Feed e acesso prioritário a novas funcionalidades.',
    cta: 'Ver Pro — 39€/mês',
    target: '/planos',
  },
};

export default function UpgradeBanner({ fromTier, className = '' }: UpgradeBannerProps) {
  const [, navigate] = useLocation();
  const copy = UPGRADE_COPY[fromTier];

  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 md:p-5 rounded-lg border border-gold/20 bg-[#faf9f6] flex-wrap ${className}`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-7 h-7 rounded flex items-center justify-center bg-gold/10 shrink-0 mt-0.5">
          <Zap className="w-3.5 h-3.5 text-gold" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#1a1a1a] mb-0.5">{copy.headline}</p>
          <p className="text-xs text-[#888] font-light leading-relaxed">{copy.sub}</p>
        </div>
      </div>
      <button
        onClick={() => navigate(copy.target)}
        className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-xs font-medium rounded hover:bg-[#a07d08] transition-colors shrink-0"
      >
        {copy.cta}
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
