// RecruiterPerception.tsx - Estilo Share2Inspire
import { Lock, Eye, Clock, AlertCircle, MessageSquare } from "lucide-react";

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
  isEN?: boolean;
}

const RecruiterPerception = ({ roles, perceivedRole, perceivedSeniority, isPaid = false, deepAnalysis, isEN = false }: RecruiterPerceptionProps) => {
  const pick = ({ pt, en, es }: { pt: string; en: string; es: string }) => isEN ? en : pt; // es unused here but kept for structure

  const displayRole = perceivedRole || (roles.length > 0 ? roles[0] : pick({ pt: 'Profissional', en: 'Professional', es: '' }));
  const displaySeniority = perceivedSeniority || pick({ pt: 'Intermédio', en: 'Mid-level', es: '' });

  const defaultAttentionMap = [
    pick({ pt: "Nome e título profissional — primeira impressão em 2 segundos", en: "Name and professional title — first impression in 2 seconds", es: "" }),
    pick({ pt: "Última experiência profissional — cargo e empresa", en: "Latest professional experience — role and company", es: "" }),
    pick({ pt: "Competências-chave listadas — matching rápido com a vaga", en: "Key skills listed — quick matching with the vacancy", es: "" }),
    pick({ pt: "Formação académica — validação de qualificações base", en: "Academic background — validation of base qualifications", es: "" }),
  ];

  const defaultFrictionPoints = [
    pick({ pt: "Densidade de texto elevada pode dificultar a leitura rápida", en: "High text density may hinder quick reading", es: "" }),
    pick({ pt: "Secções longas sem bullets ou destaques visuais", en: "Long sections without bullets or visual highlights", es: "" }),
    pick({ pt: "Informação de contacto pode não estar suficientemente visível", en: "Contact information may not be sufficiently visible", es: "" }),
  ];

  const defaultInvoluntaryMessages = [
    pick({ pt: "Profissional com trajectória consistente e progressão de carreira", en: "Professional with consistent trajectory and career progression", es: "" }),
    pick({ pt: "Perfil orientado para resultados com experiência diversificada", en: "Results-oriented profile with diversified experience", es: "" }),
    pick({ pt: "Candidato com potencial de liderança e visão estratégica", en: "Candidate with leadership potential and strategic vision", es: "" }),
  ];

  const attentionMap = deepAnalysis?.attentionMap?.length ? deepAnalysis.attentionMap : defaultAttentionMap;
  const frictionPoints = deepAnalysis?.frictionPoints?.length ? deepAnalysis.frictionPoints : defaultFrictionPoints;
  const involuntaryMessages = deepAnalysis?.involuntaryMessages?.length ? deepAnalysis.involuntaryMessages : defaultInvoluntaryMessages;

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0">
          <Eye className="w-5 h-5 text-[#C9A961]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">{pick({ pt: 'Primeiros 5 segundos de leitura', en: 'First 5 seconds of reading', es: '' })}</h3>
          <p className="text-xs text-muted-foreground">{pick({ pt: 'O que um recrutador retém do teu CV', en: 'What a recruiter retains from your CV', es: '' })}</p>
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
          {pick({
            pt: <>{'→ Perfil percebido como: '}<span className="font-semibold text-foreground">{displayRole}</span> ({displaySeniority})</>,
            en: <>{'→ Perceived profile: '}<span className="font-semibold text-foreground">{displayRole}</span> ({displaySeniority})</>,
            es: <></>
          })}
        </p>
        <p className="text-sm text-muted-foreground">
          {pick({
            pt: <>{'→ O recrutador identifica '}<span className="font-semibold text-foreground">{roles.length} competências-chave</span>{' nos primeiros 5 segundos'}</>,
            en: <>{'→ The recruiter identifies '}<span className="font-semibold text-foreground">{roles.length} key skills</span>{' in the first 5 seconds'}</>,
            es: <></>
          })}
        </p>
      </div>

      {/* Unlocked or locked content */}
      {isPaid ? (
        <div className="space-y-4 pt-2 border-t border-border">
          {/* Attention map */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold text-foreground">{pick({ pt: 'Mapa de atenção dos primeiros 30 segundos:', en: 'Attention map of the first 30 seconds:', es: '' })}</p>
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
              <p className="text-xs font-semibold text-foreground">{pick({ pt: 'Pontos de fricção na leitura:', en: 'Reading friction points:', es: '' })}</p>
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
              <p className="text-xs font-semibold text-foreground">{pick({ pt: 'Mensagens que o teu CV transmite:', en: 'Messages your CV conveys:', es: '' })}</p>
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
            <p className="text-xs font-medium text-muted-foreground">{pick({ pt: 'Análise completa da percepção no relatório pago', en: 'Full perception analysis in the paid report', es: '' })}</p>
          </div>
          <div className="select-none space-y-1.5 text-sm text-muted-foreground p-3">
            <p>{pick({ pt: '→ Mapa de atenção dos primeiros 30 segundos', en: '→ Attention map of the first 30 seconds', es: '' })}</p>
            <p>{pick({ pt: '→ Pontos de fricção na leitura do recrutador', en: '→ Recruiter reading friction points', es: '' })}</p>
            <p>{pick({ pt: '→ Mensagens involuntárias que o teu CV transmite', en: '→ Involuntary messages your CV conveys', es: '' })}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterPerception;
