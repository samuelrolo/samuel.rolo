// RecruiterPerception.tsx - Estilo Share2Inspire
import { Lock, Eye, Clock, AlertCircle, MessageSquare } from "lucide-react";
import { t, getLang } from '@/i18n';

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

  const defaultAttentionMap = [
    t('recruiter_default_attention_name_title', lang),
    t('recruiter_default_attention_latest_experience', lang),
    t('recruiter_default_attention_key_skills', lang),
    t('recruiter_default_attention_education', lang),
  ];

  const defaultFrictionPoints = [
    t('recruiter_default_friction_text_density', lang),
    t('recruiter_default_friction_long_sections', lang),
    t('recruiter_default_friction_contact_visibility', lang),
  ];

  const defaultInvoluntaryMessages = [
    t('recruiter_default_message_consistent_trajectory', lang),
    t('recruiter_default_message_results_oriented', lang),
    t('recruiter_default_message_leadership_potential', lang),
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
          <>
            → <span className="font-semibold text-foreground">{t('recruiter_identifies_key_skills', lang, { count: String(roles.length) })}</span>
          </>
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
