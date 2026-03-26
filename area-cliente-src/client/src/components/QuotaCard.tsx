/*
 * QuotaCard — mostra o uso semanal de análises por tier
 * Exibe barra de progresso + dias até reset
 * Pro tier: exibe "∞" sem barra
 */
import { Infinity as InfinityIcon } from 'lucide-react';

interface QuotaCardProps {
  used: number;
  limit: number;        // passar 999 para Pro (ilimitado)
  resetDay?: string;    // ex: "2ª feira"
}

export default function QuotaCard({ used, limit, resetDay = '2ª feira' }: QuotaCardProps) {
  const isUnlimited = limit >= 999;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const remaining = isUnlimited ? '∞' : Math.max(0, limit - used);

  // Cor da barra conforme uso
  const barColor =
    pct >= 100 ? 'bg-red-300' :
    pct >= 80  ? 'bg-amber-400' :
    'bg-gold';

  return (
    <div className="bg-[#f7f7f6] rounded-lg p-4">
      <p className="text-[10px] text-[#aaa] font-light uppercase tracking-widest mb-2">
        Análises esta semana
      </p>

      {isUnlimited ? (
        <div className="flex items-center gap-2">
          <InfinityIcon className="w-5 h-5 text-gold" />
          <span className="text-sm font-medium text-[#1a1a1a]">Uso contínuo</span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-semibold text-[#1a1a1a]">{used}</span>
            <span className="text-sm text-[#bbb] font-light">/ {limit}</span>
            <span className="ml-auto text-xs text-[#999] font-light">
              {remaining} disponíve{remaining === 1 ? 'l' : 'is'}
            </span>
          </div>
          <div className="h-[3px] rounded-full bg-[#e8e8e6] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-[#bbb] font-light mt-1.5">
            Renova {resetDay}
          </p>
        </>
      )}
    </div>
  );
}
