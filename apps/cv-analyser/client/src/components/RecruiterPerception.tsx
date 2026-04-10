// RecruiterPerception.tsx - Estilo Share2Inspire
import { Lock, Eye, Clock, AlertCircle, MessageSquare } from "lucide-react";
import { t, pick, getLang } from '@/i18n';

interface RecruiterPerceptionProps {
  roles: string[];
  perceivedRole?: string;
  perceivedSeniority?: string;
  isPaid?: boolean;
  deepAnalysis?: {
    attentionMap?: string[];
    frictionPoints?: string[];
    involuntaryMessages?: string[];
  };
}

const RecruiterPerception = ({ roles, perceivedRole, perceivedSeniority, isPaid = false, deepAnalysis }: RecruiterPerceptionProps) => {
  const lang = getLang();
  const displayRole = perceivedRole || (roles.length > 0 ? roles[0] : (t('profissional')));
  const displaySeniority = perceivedSeniority || 'Mid-level';

  const defaultAttentionMap = lang === 'en' ? [
    "Name and professional title — first impression in 2 seconds",
    "Latest professional experience — role and company",
    "Key skills listed — quick matching with the vacancy",
    "Academic background — validation of base qualifications",
  ] : lang === 'es' ? [
    "Nombre y título profesional — primera impresión en 2 segundos",
    "Última experiencia profesional — cargo y empresa",
    "Competencias clave listadas — matching rápido con la vacante",
    "Formación académica — validación de cualificaciones base",
  ] : [
    "Nome e título profissional — primeira impressão em 2 segundos",
    "Última experiência profissional — cargo e empresa",
    "Competências-chave listadas — matching rápido com a vaga",
    "Formação académica — validação de qualificações base",
  ];

  const defaultFrictionPoints = lang === 'en' ? [
    "High text density may hinder quick reading",
    "Long sections without bullets or visual highlights",
    "Contact information may not be sufficiently visible",
  ] : lang === 'es' ? [
    "Alta densidad de texto puede dificultar la lectura rápida",
    "Secciones largas sin viñetas o destacados visuales",
    "La información de contacto puede no ser suficientemente visible",
  ] : [
    "Densidade de texto elevada pode dificultar a leitura rápida",
    "Secções longas sem bullets ou destaques visuais",
    "Informação de contacto pode não estar suficientemente visível",
  ];

  const defaultInvoluntaryMessages = lang === 'en' ? [
    "Professional with consistent trajectory and career progression",
    "Results-oriented profile with diversified experience",
    "Candidate with leadership potential and strategic vision",
  ] : lang === 'es' ? [
    "Profesional con trayectoria consistente y progresión de carrera",
    "Perfil orientado a resultados con experiencia diversificada",
    "Candidato con potencial de liderazgo y visión estratégica",
  ] : [
    "Profissional com trajectória consistente e progressão de carreira",
    "Perfil orientado para resultados com experiência diversificada",
    "Candidato com potencial de liderança e visão estratégica",
  ];

  const attentionMap = deepAnalysis?.attentionMap?.length ? deepAnalysis.attentionMap : defaultAttentionMap;
  const frictionPoints = deepAnalysis?.frictionPoints?.length ? deepAnalysis.frictionPoints : defaultFrictionPoints;
  const involuntaryMessages = deepAnalysis?.involuntaryMessages?.length ? deepAnalysis.involuntaryMessages : defaultInvoluntaryMessages;

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0">
          <Eye className="w-5 h-5 text-[#C9A961]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">{t('primeiros_5_segundos_de_leitura')}</h3>
          <p className="text-xs text-muted-foreground">{t('o_que_um_recrutador_retm')}</p>
        </div>
      </div>

      {/* Keywords/tags - always visible */}
      <div className="flex flex-wrap gap-2">
        {roles.map((role, i) => (
          <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-[#C9A961]/10 text-[#C9A961] border border-[#C9A961]/20">
            {role}
          </span>
        ))}
      </div>

      {/* Visible insights */}
      <div className="space-y-2 pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground">
          <>→ {t('perfil_percebido')}: <span className="font-semibold text-foreground">{displayRole}</span> ({displaySeniority})</>
        </p>
        <p className="text-sm text-muted-foreground">
          <>→ {pick(
              <>O recrutador identifica <span className="font-semibold text-foreground">{roles.length} competências-chave</span> nos primeiros 5 segundos</>,
              <>The recruiter identifies <span className="font-semibold text-foreground">{roles.length} key skills</span> in the first 5 seconds</>,
              <>El reclutador identifica <span className="font-semibold text-foreground">{roles.length} competencias clave</span> en los primeros 5 segundos</>
            )}</>
        </p>
      </div>

      {/* Unlocked or locked content */}
      {isPaid ? (
        <div className="space-y-4 pt-2 border-t border-border">
          {/* Attention map */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold text-foreground">{t('mapa_de_ateno_dos_primeiros')}</p>
            </div>
            {attentionMap.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground pl-1">
                <span className="text-[#C9A961] font-bold mt-0.5">{i + 1}.</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Friction points */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <p className="text-xs font-semibold text-foreground">{t('pontos_de_frico_na_leitura')}</p>
            </div>
            {frictionPoints.map((item, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                <p className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-yellow-500">⚠</span>
                  <span>{item}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Involuntary messages */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold text-foreground">{t('mensagens_que_o_teu_cv')}</p>
            </div>
            {involuntaryMessages.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground pl-1">
                <span className="text-[#C9A961]">→</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
            <Lock className="w-5 h-5 text-[#C9A961] mb-1" />
            <p className="text-xs font-medium text-muted-foreground">{t('anlise_completa_da_percepo_no')}</p>
          </div>
          <div className="select-none space-y-1.5 text-sm text-muted-foreground p-3">
            <p>{t('mapa_de_ateno_dos_primeiros_2')}</p>
            <p>{t('pontos_de_frico_na_leitura_2')}</p>
            <p>{t('mensagens_involuntrias_que_o_teu')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterPerception;
