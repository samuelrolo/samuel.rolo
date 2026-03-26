/*
 * EmptyAnalyses — estado vazio para utilizadores sem análises guardadas
 * Duas variantes:
 *   'no-sub'  → registado mas sem subscrição (repositório vazio)
 *   'no-data' → subscriber sem análises feitas ainda
 */
import { ArrowRight, FileSearch, Linkedin, Compass, BarChart3 } from 'lucide-react';

interface EmptyAnalysesProps {
  variant: 'no-sub' | 'no-data';
  onNavigatePlans?: () => void;
}

const FREE_TOOLS = [
  { icon: FileSearch, label: 'CV Analyser', href: 'https://share2inspire.pt/cv-analyser' },
  { icon: Linkedin,   label: 'LinkedIn Roaster', href: 'https://share2inspire.pt/linkedin-roaster' },
];

const ALL_TOOLS = [
  { icon: FileSearch, label: 'CV Analyser', href: 'https://share2inspire.pt/cv-analyser' },
  { icon: Linkedin,   label: 'LinkedIn Roaster', href: 'https://share2inspire.pt/linkedin-roaster' },
  { icon: Compass,    label: 'Career Path', href: 'https://share2inspire.pt/career-path' },
  { icon: BarChart3,  label: 'Career Intelligence', href: 'https://share2inspire.pt/career-intelligence' },
];

export default function EmptyAnalyses({ variant, onNavigatePlans }: EmptyAnalysesProps) {
  const isFreeTier = variant === 'no-sub';

  return (
    <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 text-center border-b border-[#f0f0f0]">
        <div className="w-10 h-10 bg-gold/8 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileSearch className="w-4.5 h-4.5 text-gold/50" />
        </div>
        <h3 className="text-sm font-medium text-[#1a1a1a] mb-2">
          {isFreeTier
            ? 'O teu repositório está vazio'
            : 'Ainda não tens análises guardadas'}
        </h3>
        <p className="text-xs text-[#999] font-light leading-relaxed max-w-xs mx-auto">
          {isFreeTier
            ? 'Faz uma análise nas ferramentas gratuitas e guarda-a aqui para consultares a qualquer momento.'
            : 'Usa as ferramentas do teu plano e guarda os resultados para acompanhar a evolução ao longo do tempo.'}
        </p>
      </div>

      {/* Tools shortcuts */}
      <div className="px-6 py-5">
        <p className="text-[10px] text-[#bbb] font-light uppercase tracking-widest mb-3">
          {isFreeTier ? 'Ferramentas gratuitas' : 'Aceder às ferramentas'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(isFreeTier ? FREE_TOOLS : ALL_TOOLS).map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 border border-[#e8e8e8] rounded hover:border-gold/30 hover:text-gold transition-all duration-200 group"
            >
              <Icon className="w-3.5 h-3.5 text-[#bbb] group-hover:text-gold/70 transition-colors" />
              <span className="text-xs text-[#666] font-light group-hover:text-[#333] transition-colors">
                {label}
              </span>
              <ArrowRight className="w-3 h-3 text-[#ddd] group-hover:text-gold/50 ml-auto transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* Free tier: upgrade prompt */}
      {isFreeTier && (
        <div className="px-6 pb-6">
          <div className="h-px bg-[#f0f0f0] mb-4" />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#999] font-light leading-relaxed">
              Com um plano tens análises recorrentes e o histórico cresce automaticamente.
            </p>
            {onNavigatePlans && (
              <button
                onClick={onNavigatePlans}
                className="text-xs text-gold font-medium flex items-center gap-1 shrink-0 hover:text-[#a07d08] transition-colors"
              >
                Ver planos <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
