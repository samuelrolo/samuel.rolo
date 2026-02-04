import { ResumeData } from "@shared/resume-types";

export interface TemplateProps {
  data: ResumeData;
  className?: string;
}

/**
 * Componente base para todos os templates de currículo
 * Define a interface comum que todos os templates devem seguir
 */
export function TemplateBase({ data, className }: TemplateProps) {
  return (
    <div className={className}>
      {/* Este é apenas um placeholder - cada template terá sua própria implementação */}
      <div className="p-8 bg-white">
        <h1>{data.personalInfo.fullName}</h1>
        <p>{data.personalInfo.title}</p>
      </div>
    </div>
  );
}
