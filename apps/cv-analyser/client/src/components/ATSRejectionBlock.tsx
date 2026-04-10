// ATSRejectionBlock.tsx - Estilo Share2Inspire
import { AlertTriangle, Lock, Info, CheckCircle, ShieldAlert, TrendingDown } from "lucide-react";
import { useState } from "react";
import { t, pick, getLang } from '@/i18n';

interface ATSRejectionBlockProps {
  rejectionRate: number;
  topFactor?: string;
  isPaid?: boolean;
  detailedFactors?: string[];
  atsSystems?: string[];
  quickFixes?: string[];
}

const ATSRejectionBlock = ({ rejectionRate, topFactor, isPaid = false, detailedFactors, atsSystems, quickFixes }: ATSRejectionBlockProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const lang = getLang();
  const severity = rejectionRate > 60
    ? (t('elevada'))
    : rejectionRate > 40
      ? (t('moderada'))
      : (t('baixa'));

  const visibleFactor = topFactor || (
    rejectionRate > 60 
      ? (t('estrutura_do_cv_dificulta_a'))
      : rejectionRate > 40
        ? (t('algumas_palavraschave_relevantes_em_falta'))
        : (t('boa_compatibilidade_com_a_maioria'))
  );

  const getDetailedFactors = (): string[] => {
    if (detailedFactors && detailedFactors.length > 0) return detailedFactors;
    if (rejectionRate > 60) {
      return lang === 'en' ? [
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
      return lang === 'en' ? [
        "Some sector keywords could be more explicit",
        "Date or location format may vary between ATS systems",
        "Skills section could be more detailed for automatic matching",
      ] : [
        "Algumas palavras-chave do sector poderiam ser mais explícitas",
        "Formato de datas ou localização pode variar entre sistemas ATS",
        "Secção de competências poderia ser mais detalhada para matching automático",
      ];
    }
    return lang === 'en' ? [
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
        { name: "Workday", compat: t('baixa'), color: "text-red-500" },
        { name: "SAP SF", compat: t('baixa'), color: "text-red-500" },
        { name: "Taleo", compat: t('moderada'), color: "text-yellow-500" },
        { name: "Greenhouse", compat: t('moderada'), color: "text-yellow-500" },
      ];
    } else if (rejectionRate > 40) {
      return [
        { name: "Workday", compat: t('moderada'), color: "text-yellow-500" },
        { name: "SAP SF", compat: t('boa'), color: "text-green-500" },
        { name: "Taleo", compat: t('moderada'), color: "text-yellow-500" },
        { name: "Greenhouse", compat: t('boa'), color: "text-green-500" },
      ];
    }
    return [
      { name: "Workday", compat: t('boa'), color: "text-green-500" },
      { name: "SAP SF", compat: t('boa'), color: "text-green-500" },
      { name: "Taleo", compat: t('boa'), color: "text-green-500" },
      { name: "Greenhouse", compat: t('excelente_2'), color: "text-green-600" },
    ];
  };

  const getReductionTips = (): string[] => {
    if (rejectionRate > 60) {
      return lang === 'en' ? [
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
      return lang === 'en' ? [
        "Enrich the skills section with sector-specific technical terms",
        "Standardise date format (MM/YYYY)",
        "Add keywords from target job descriptions",
      ] : [
        "Enriquecer a secção de competências com termos técnicos do sector",
        "Standardizar formato de datas (MM/AAAA)",
        "Adicionar palavras-chave da descrição de funções alvo",
      ];
    }
    return lang === 'en' ? [
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
            <p className="text-xs font-semibold tracking-wider text-red-500">{t('estimativa_de_rejeio_automtica_em')}</p>
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
                  <p className="font-semibold mb-1">{t('o_que_o_ats')}</p>
                  <p>{lang === 'en' ? 'Applicant Tracking System — software used by 75% of companies to automatically filter CVs before a recruiter sees them.' : lang === 'es' ? 'Applicant Tracking System — software utilizado por el 75% de las empresas para filtrar CVs automáticamente antes de que un reclutador los vea.' : 'Applicant Tracking System — software usado por 75% das empresas para filtrar CVs automaticamente antes de um recrutador os ver.'}</p>
                  <div className="absolute -top-1.5 left-3 w-3 h-3 bg-foreground rotate-45" />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-bold text-foreground">{rejectionRate}%</span>
            <span className="text-sm text-muted-foreground">{t('de_probabilidade')}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              rejectionRate > 60 ? 'bg-red-500/10 text-red-500' : 
              rejectionRate > 40 ? 'bg-yellow-500/10 text-yellow-500' : 
              'bg-green-500/10 text-green-500'
            }`}>{severity}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t('com_base_em_parsing_palavraschave')}</p>
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
            <span>{t('detetmos_um_fator_que_est')}</span>
          </p>
        </div>
      )}

      {isPaid ? (
        <div className="space-y-4">
          {/* Interpretação qualitativa */}
          <div className="p-4 rounded-lg bg-[#C9A961]/5 border border-[#C9A961]/20">
            <p className="text-sm text-foreground leading-relaxed">
              {rejectionRate <= 20 ? (
                pick(
                  <>O teu CV tem uma <strong>excelente compatibilidade</strong> com sistemas ATS. Com apenas {rejectionRate}% de probabilidade de rejeição automática, o teu CV passa pela maioria dos filtros sem problemas, chegando às mãos de recrutadores humanos na grande maioria das candidaturas online.</>,
                  <>Your CV has <strong>excellent compatibility</strong> with ATS systems. With only {rejectionRate}% probability of automatic rejection, your CV passes through most filters without issues, reaching human recruiters in the vast majority of online applications.</>,
                  <>Tu CV tiene una <strong>excelente compatibilidad</strong> con sistemas ATS. Con solo {rejectionRate}% de probabilidad de rechazo automático, tu CV pasa por la mayoría de los filtros sin problemas, llegando a manos de reclutadores humanos en la gran mayoría de las candidaturas online.</>
                )
              ) : rejectionRate <= 40 ? (
                pick(
                  <>O teu CV tem uma <strong>boa compatibilidade</strong> com sistemas ATS. Com {rejectionRate}% de probabilidade de rejeição, a maioria dos sistemas consegue ler o teu CV correctamente. Pequenas optimizações nas palavras-chave e na estrutura podem reduzir esta taxa significativamente.</>,
                  <>Your CV has <strong>good compatibility</strong> with ATS systems. With {rejectionRate}% probability of rejection, most systems can read your CV correctly. Small optimisations in keywords and structure can significantly reduce this rate.</>,
                  <>Tu CV tiene una <strong>buena compatibilidad</strong> con sistemas ATS. Con {rejectionRate}% de probabilidad de rechazo, la mayoría de los sistemas puede leer tu CV correctamente. Pequeñas optimizaciones en palabras clave y estructura pueden reducir esta tasa significativamente.</>
                )
              ) : rejectionRate <= 60 ? (
                pick(
                  <>O teu CV tem uma <strong>compatibilidade moderada</strong> com sistemas ATS. Com {rejectionRate}% de probabilidade de rejeição, cerca de metade das candidaturas online podem ser filtradas antes de chegar a um recrutador.</>,
                  <>Your CV has <strong>moderate compatibility</strong> with ATS systems. With {rejectionRate}% probability of rejection, about half of online applications may be filtered before reaching a recruiter.</>,
                  <>Tu CV tiene una <strong>compatibilidad moderada</strong> con sistemas ATS. Con {rejectionRate}% de probabilidad de rechazo, aproximadamente la mitad de las candidaturas online pueden ser filtradas antes de llegar a un reclutador.</>
                )
              ) : (
                pick(
                  <>O teu CV tem uma <strong>compatibilidade baixa</strong> com sistemas ATS. Com {rejectionRate}% de probabilidade de rejeição, a maioria das candidaturas online será filtrada automaticamente. É urgente reformular a estrutura.</>,
                  <>Your CV has <strong>low compatibility</strong> with ATS systems. With {rejectionRate}% probability of rejection, most online applications will be automatically filtered. It is urgent to restructure the format.</>,
                  <>Tu CV tiene una <strong>compatibilidad baja</strong> con sistemas ATS. Con {rejectionRate}% de probabilidad de rechazo, la mayoría de las candidaturas online será filtrada automáticamente. Es urgente reformular la estructura.</>
                )
              )}
            </p>
          </div>

          {/* Factores detalhados */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold text-foreground">{t('factores_que_afectam_a_compatibilidade')}</p>
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
              <p className="text-xs font-semibold text-foreground">{t('compatibilidade_por_sistema_ats')}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {getATSSystems().map((s, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-muted/20 border border-border flex justify-between items-center min-w-0 gap-2">
                  <span className="text-xs font-medium text-foreground whitespace-nowrap">{s.name}</span>
                  <span className={`text-xs font-semibold ${s.color} whitespace-nowrap`}>{s.compat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Como reduzir */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <p className="text-xs font-semibold text-foreground">{t('como_reduzir_esta_taxa_em')}</p>
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
          <span className="text-xs text-[#C9A961] font-medium">{t('vu00ea_o_detalhe_no_relatu00f3rio')}</span>
        </div>
      )}
    </div>
  );
};

export default ATSRejectionBlock;
