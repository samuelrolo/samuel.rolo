/**
 * Tipos TypeScript para a estrutura de dados de um currículo
 */

export interface PersonalInfo {
  fullName: string;
  title: string;
  photoUrl?: string;
  phone: string;
  email: string;
  address?: string;
  website?: string;
  linkedin?: string;
  socialMedia?: Array<{
    platform: string;
    url: string;
  }>;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  current: boolean;
  description?: string;
  achievements: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  gpa?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number; // 0-100
  category?: string;
}

export interface Language {
  id: string;
  name: string;
  level: "Native" | "Fluent" | "Advanced" | "Intermediate" | "Basic";
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string; // ISO date string
  credentialId?: string;
  url?: string;
}

export interface Course {
  id: string;
  name: string;
  institution: string;
  date: string; // ISO date string
}

export interface Reference {
  id: string;
  name: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
}

export interface AdditionalInfo {
  awards?: string[];
  activities?: string[];
  interests?: string[];
}

/**
 * Estrutura completa de dados de um currículo
 */
export interface ResumeData {
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
  courses: Course[];
  references: Reference[];
  additionalInfo?: AdditionalInfo;
}

/**
 * Modelo base de currículo com dados pré-preenchidos (placeholders editáveis)
 */
export const BASE_RESUME_TEMPLATE: ResumeData = {
  personalInfo: {
    fullName: "O Seu Nome Completo",
    title: "O Seu Título Profissional",
    phone: "+351 912 345 678",
    email: "seuemail@exemplo.com",
    address: "Lisboa, Portugal",
    linkedin: "linkedin.com/in/seuperfil",
  },
  summary: "Breve descrição do seu perfil profissional. Destaque as suas principais competências, experiência e objetivos de carreira. Mantenha entre 3-5 linhas para um impacto máximo.",
  experience: [
    {
      id: "exp-1",
      company: "Nome da Empresa",
      position: "Título do Cargo",
      startDate: new Date(new Date().getFullYear() - 2, 0, 1).toISOString(),
      endDate: undefined,
      current: true,
      description: "Breve descrição das suas responsabilidades neste cargo.",
      achievements: [
        "Conquista ou resultado mensurável que alcançou",
        "Outro exemplo de impacto positivo no seu trabalho",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "Nome da Instituição",
      degree: "Licenciatura/Mestrado em...",
      field: "Área de Estudo",
      startDate: new Date(new Date().getFullYear() - 5, 8, 1).toISOString(),
      endDate: new Date(new Date().getFullYear() - 2, 6, 1).toISOString(),
    },
  ],
  skills: [
    { id: "skill-1", name: "Competência 1", level: 85, category: "Técnica" },
    { id: "skill-2", name: "Competência 2", level: 75, category: "Técnica" },
    { id: "skill-3", name: "Competência 3", level: 80, category: "Soft Skill" },
    { id: "skill-4", name: "Competência 4", level: 70, category: "Soft Skill" },
    { id: "skill-5", name: "Competência 5", level: 90, category: "Técnica" },
  ],
  languages: [],
  certifications: [],
  courses: [],
  references: [],
};

/**
 * Dados vazios para criar um currículo do zero (sem placeholders)
 */
export const EMPTY_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: "",
    title: "",
    phone: "",
    email: "",
  },
  experience: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  courses: [],
  references: [],
};

/**
 * Validação básica de dados do currículo
 */
export function validateResumeData(data: Partial<ResumeData>): string[] {
  const errors: string[] = [];

  if (!data.personalInfo?.fullName?.trim()) {
    errors.push("Nome completo é obrigatório");
  }

  if (!data.personalInfo?.email?.trim()) {
    errors.push("Email é obrigatório");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personalInfo.email)) {
    errors.push("Email inválido");
  }

  if (!data.personalInfo?.phone?.trim()) {
    errors.push("Telefone é obrigatório");
  }

  return errors;
}
