// ATSRejectionBlock.tsx - Estilo Share2Inspire
import { AlertTriangle, Lock, Info, CheckCircle, ShieldAlert, TrendingDown } from "lucide-react";
import { useState } from "react";

interface ATSRejectionBlockProps {
  rejectionRate: number;
  topFactor?: string;
  isPaid?: boolean;
  detailedFactors?: string[];
  atsSystems?: string[];
  quickFixes?: string[];
  isEN?: boolean;
}

const ATSRejectionBlock = ({ rejectionRate, topFactor, isPaid = false, detailedFactors, atsSystems, quickFixes, isEN = false }: ATSRejectionBlockProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const severity = rejectionRate > 60
    ? (isEN ? 'High' : 'Elevada')
    : rejectionRate > 40
      ? (isEN ? 'Moderate' : 'Moderada')
      : (isEN ? 'Low' : 'Baixa');

  const visibleFactor = topFactor || (
    rejectionRate > 60 
      ? (isEN ? 'CV structure makes automatic reading by ATS systems difficult' : 'Estrutura do CV dificulta a leitura automática por sistemas ATS')
      : rejectionRate > 40
        ? (isEN ? 'Some relevant keywords missing for automatic filters' : 'Algumas palavras-chave relevantes em falta para filtros automáticos')
        : (isEN ? 'Good compatibility with most screening systems' : 'Boa compatibilidade com a maioria dos sistemas de triagem')
  );

  const getDetailedFactors = (): string[] => {
    if (detailedFactors && detailedFactors.length > 0) return detailedFactors;
    if (rejectionRate > 60) {
      return isEN ? [
        "Complex formatting with tables or columns that confuse ATS parsers",
        "Lack of sector-specific keywords in the skills section",
        "Non-standard headers or sections that ATS cannot recognise",
        "Excessive use of graphics or visual elements not readable by ATS",
      ] : [
        "Formatação complexa com tabelas ou colunas que confundem parsers ATS",
        "Falta de palavras-chave específicas do sector na secção de competências",
        "Headers ou secções não standard que o ATS não reconhece",
        "Uso excessivo de gráficos ou elementos visuais não legíveis por ATS",
      ];
    } else if (rejectionRate > 40) {
      return isEN ? [
        "Some sector keywords could be more explicit",
        "Date or location format may vary between ATS systems",
        "Skills section could be more detailed for automatic matching",
      ] : [
        "Algumas palavras-chave do sector poderiam ser mais explícitas",
        "Formato de datas ou localização pode variar entre sistemas ATS",
        "Secção de competências poderia ser mais detalhada para matching automático",
      ];
    }
    return isEN ? [
      "Clear and well-organised structure for automatic reading",
      "Good density of relevant keywords for the sector",
      "Format compatible with most screening systems",
    ] : [
      "Estrutura clara e bem organizada para leitura automática",
      "Boa densidade de palavras-chave relevantes para o sector",
      "Formato compatível com a maioria dos sistemas de triagem",
    ];
  };

  const getATSSystems = () => {
    if (rejectionRate > 60) {
      return [
        { name: "Workday", compat: isEN ? "Low" : "Baixa", color: "text-red-500" },
        { name: "SAP SF", compat: isEN ? "Low" : "Baixa", color: "text-red-500" },
        { name: "Taleo", compat: isEN ? "Moderate" : "Moderada", color: "text-yellow-500" },
        { name: "Greenhouse", compat: isEN ? "Moderate" : "Moderada", color: "text-yellow-500" },
      ];
    } else if (rejectionRate > 40) {
      return [
        { name: "Workday", compat: isEN ? "Moderate" : "Moderada", color: "text-yellow-500" },
        { name: "SAP SF", compat: isEN ? "Good" : "Boa", color: "text-green-500" },
        { name: "Taleo", compat: isEN ? "Moderate" : "Moderada", color: "text-yellow-500" },
        { name: "Greenhouse", compat: isEN ? "Good" : "Boa", color: "text-green-500" },
      ];
    }
    return [
      { name: "Workday", compat: isEN ? "Good" : "Boa", color: "text-green-500" },
      { name: "SAP SF", compat: isEN ? "Good" : "Boa", color: "text-green-500" },
      { name: "Taleo", compat: isEN ? "Good" : "Boa", color: "text-green-500" },
      { name: "Greenhouse", compat: isEN ? "Excellent" : "Excelente", color: "text-green-600" },
    ];
  };

  const getReductionTips = (): string[] => {
    if (rejectionRate > 60) {
      return isEN ? [
        "Convert CV to single-column format without tables",
        "Add a 'Key Skills' section with sector-specific terms",
        "Use standard headers: 'Professional Experience', 'Education', 'Skills'",
        "Remove graphics and replace with descriptive text",
      ] : [
        "Converter o CV para formato de coluna única sem tabelas",
        "Adicionar secção 'Competências-Chave' com termos específicos do sector",
        "Usar headers standard: 'Experiência Profissional', 'Formação', 'Competências'",
        "Remover gráficos e substituir por texto descritivo",
      ];
    } else if (rejectionRate > 40) {
      return isEN ? [
        "Enrich the skills section with sector-specific technical terms",
        "Standardise date format (MM/YYYY)",
        "Add keywords from target job descriptions",
      ] : [
        "Enriquecer a secção de competências com termos técnicos do sector",
        "Standardizar formato de datas (MM/AAAA)",
        "Adicionar palavras-chave da descrição de funções alvo",
      ];
    }
    return isEN ? [
      "Keep the current structure — it is well optimised",
      "Customise keywords for each specific application",
      "Regularly update with new sector terms",
    ] : [
      "Manter a estrutura actual - está bem optimizada",
      "Personalizar palavras-chave para cada candidatura específica",
      "Actualizar regularmente com novos termos do sector",
    ];
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6 space-y-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-[#C9A961]" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-red-500">{isEN ? 'ATS AUTOMATIC REJECTION ESTIMATE' : 'ESTIMATIVA DE REJEIÇÃO AUTOMÁTICA EM ATS'}</p>
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="p-0.5 rounded-full hover:bg-muted transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {showTooltip && (
                <div className="absolute left-0 top-6 z-50 w-72 p-3 rounded-lg bg-foreground text-background text-xs leading-relaxed shadow-xl">
                  <p className="font-semibold mb-1">{isEN ? 'What is ATS?' : 'O que é o ATS?'}</p>
                  <p>{isEN ? 'Applicant Tracking System — software used by 75% of companies to automatically filter CVs before a recruiter sees them.' : 'Applicant Tracking System — software usado por 75% das empresas para filtrar CVs automaticamente antes de um recrutador os ver.'}</p>
                  <div className="absolute -top-1.5 left-3 w-3 h-3 bg-foreground rotate-45" />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-bold text-foreground">{rejectionRate}%</span>
            <span className="text-sm text-muted-foreground">{isEN ? 'probability' : 'de probabilidade'}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              rejectionRate > 60 ? 'bg-red-500/10 text-red-500' : 
              rejectionRate > 40 ? 'bg-yellow-500/10 text-yellow-500' : 
              'bg-green-500/10 text-green-500'
            }`}>{severity}</span>
          </div>
          <p className="text-xs text-muted-foreground">{isEN ? 'Based on parsing, keywords and structure.' : 'Com base em parsing, palavras-chave e estrutura.'}</p>
        </div>
      </div>

      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-1000" style={{ width: `${rejectionRate}%` }} />
      </div>

      {isPaid ? (
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-sm text-foreground flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span>{visibleFactor}</span>
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-sm text-foreground flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span>{isEN ? 'We detected a factor that is penalising your CV in ATS systems.' : 'Detetámos um fator que está a penalizar o teu CV nos sistemas ATS.'}</span>
          </p>
        </div>
      )}

      {isPaid ? (
        <div className="space-y-4">
          {/* Interpretação qualitativa */}
          <div className="p-4 rounded-lg bg-[#C9A961]/5 border border-[#C9A961]/20">
            <p className="text-sm text-foreground leading-relaxed">
              {rejectionRate <= 20 ? (
                isEN
                  ? <>Your CV has <strong>excellent compatibility</strong> with ATS systems. With only {rejectionRate}% probability of automatic rejection, your CV passes through most filters without issues, reaching human recruiters in the vast majority of online applications.</>
                  : <>O teu CV tem uma <strong>excelente compatibilidade</strong> com sistemas ATS. Com apenas {rejectionRate}% de probabilidade de rejeição automática, o teu CV passa pela maioria dos filtros sem problemas, chegando às mãos de recrutadores humanos na grande maioria das candidaturas online.</>
              ) : rejectionRate <= 40 ? (
                isEN
                  ? <>Your CV has <strong>good compatibility</strong> with ATS systems. With {rejectionRate}% probability of rejection, most systems can read your CV correctly. Small optimisations in keywords and structure can significantly reduce this rate.</>
                  : <>O teu CV tem uma <strong>boa compatibilidade</strong> com sistemas ATS. Com {rejectionRate}% de probabilidade de rejeição, a maioria dos sistemas consegue ler o teu CV correctamente. Pequenas optimizações nas palavras-chave e na estrutura podem reduzir esta taxa significativamente.</>
              ) : rejectionRate <= 60 ? (
                isEN
                  ? <>Your CV has <strong>moderate compatibility</strong> with ATS systems. With {rejectionRate}% probability of rejection, about half of online applications may be filtered before reaching a recruiter.</>
                  : <>O teu CV tem uma <strong>compatibilidade moderada</strong> com sistemas ATS. Com {rejectionRate}% de probabilidade de rejeição, cerca de metade das candidaturas online podem ser filtradas antes de chegar a um recrutador.</>
              ) : (
                isEN
                  ? <>Your CV has <strong>low compatibility</strong> with ATS systems. With {rejectionRate}% probability of rejection, most online applications will be automatically filtered. It is urgent to restructure the format.</>
                  : <>O teu CV tem uma <strong>compatibilidade baixa</strong> com sistemas ATS. Com {rejectionRate}% de probabilidade de rejeição, a maioria das candidaturas online será filtrada automaticamente. É urgente reformular a estrutura.</>
              )}
            </p>
          </div>

          {/* Factores detalhados */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold text-foreground">{isEN ? 'Factors affecting compatibility:' : 'Factores que afectam a compatibilidade:'}</p>
            </div>
            {getDetailedFactors().map((f, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-[#C9A961] font-bold">{i + 1}.</span>
                  <span>{f}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Compatibilidade por sistema */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold text-foreground">{isEN ? 'Compatibility by ATS system:' : 'Compatibilidade por sistema ATS:'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {getATSSystems().map((s, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-muted/20 border border-border flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground">{s.name}</span>
                  <span className={`text-xs font-semibold ${s.color}`}>{s.compat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Como reduzir */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <p className="text-xs font-semibold text-foreground">{isEN ? 'How to reduce this rate in 48h:' : 'Como reduzir esta taxa em 48h:'}</p>
            </div>
            {getReductionTips().map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-[#C9A961]/5 border border-[#C9A961]/20 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#C9A961]" />
          <span className="text-xs text-[#C9A961] font-medium">{isEN ? 'See the detail in the full report' : 'V\u00ea o detalhe no relat\u00f3rio completo'}</span>
        </div>
      )}
    </div>
  );
};

export default ATSRejectionBlock;
