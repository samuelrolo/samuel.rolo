/**
 * Tipos para secções modulares do currículo com drag-and-drop
 */

export type SectionType =
  | "personal-info"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certifications"
  | "courses"
  | "references"
  | "additional-info";

export interface SectionConfig {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  order: number;
}

/**
 * Configuração padrão de secções
 */
export const DEFAULT_SECTIONS: SectionConfig[] = [
  {
    id: "personal-info",
    type: "personal-info",
    title: "Informação Pessoal",
    visible: true,
    order: 0,
  },
  {
    id: "summary",
    type: "summary",
    title: "Perfil Profissional",
    visible: true,
    order: 1,
  },
  {
    id: "experience",
    type: "experience",
    title: "Experiência Profissional",
    visible: true,
    order: 2,
  },
  {
    id: "education",
    type: "education",
    title: "Formação Académica",
    visible: true,
    order: 3,
  },
  {
    id: "skills",
    type: "skills",
    title: "Competências",
    visible: true,
    order: 4,
  },
  {
    id: "languages",
    type: "languages",
    title: "Idiomas",
    visible: true,
    order: 5,
  },
  {
    id: "certifications",
    type: "certifications",
    title: "Certificações",
    visible: false,
    order: 6,
  },
  {
    id: "courses",
    type: "courses",
    title: "Cursos",
    visible: false,
    order: 7,
  },
  {
    id: "references",
    type: "references",
    title: "Referências",
    visible: false,
    order: 8,
  },
  {
    id: "additional-info",
    type: "additional-info",
    title: "Informação Adicional",
    visible: false,
    order: 9,
  },
];

/**
 * Labels amigáveis para tipos de secção
 */
export const SECTION_LABELS: Record<SectionType, string> = {
  "personal-info": "Informação Pessoal",
  summary: "Perfil Profissional",
  experience: "Experiência Profissional",
  education: "Formação Académica",
  skills: "Competências",
  languages: "Idiomas",
  certifications: "Certificações",
  courses: "Cursos",
  references: "Referências",
  "additional-info": "Informação Adicional",
};

/**
 * Descrições das secções
 */
export const SECTION_DESCRIPTIONS: Record<SectionType, string> = {
  "personal-info": "Nome, contactos e informação básica",
  summary: "Breve descrição do seu perfil profissional",
  experience: "Histórico de experiência profissional",
  education: "Formação académica e qualificações",
  skills: "Competências técnicas e soft skills",
  languages: "Idiomas que domina",
  certifications: "Certificações profissionais",
  courses: "Cursos e formações complementares",
  references: "Referências profissionais",
  "additional-info": "Prémios, atividades, interesses",
};
