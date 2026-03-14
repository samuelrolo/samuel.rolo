import { ResumeData } from "@shared/resume-types";
import { VisualConfig, COLOR_SCHEMES, TYPOGRAPHY_FONTS, PHOTO_SIZES, BORDER_WIDTHS } from "@shared/visual-config-types";
import { SectionConfig } from "@shared/section-types";
import {
  PersonalInfoSection,
  SummarySection,
  ExperienceSection,
  EducationSection,
  SkillsSection,
  LanguagesSection,
  CertificationsSection,
  CoursesSection,
  ReferencesSection,
  AdditionalInfoSection,
} from "./sections";

export interface ModularTemplateProps {
  data: ResumeData;
  visualConfig: VisualConfig;
  sections: SectionConfig[];
  className?: string;
}

/**
 * Template modular que renderiza secções dinamicamente baseado na configuração
 */
export function ModularTemplate({ data, visualConfig, sections, className = "" }: ModularTemplateProps) {
  const colors = visualConfig.customColors || COLOR_SCHEMES[visualConfig.colorScheme];
  const fontFamily = TYPOGRAPHY_FONTS[visualConfig.typography];
  
  // Ordenar secções pela ordem definida e filtrar apenas as visíveis
  const visibleSections = sections
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  // Estilos base do template
  const templateStyle = {
    fontFamily,
    color: colors.text,
    backgroundColor: colors.background,
  };

  // Renderizar secção baseada no tipo
  const renderSection = (section: SectionConfig) => {
    const sectionProps = {
      data,
      colors,
      visualConfig,
      title: section.title,
    };

    switch (section.type) {
      case "personal-info":
        return <PersonalInfoSection key={section.id} {...sectionProps} />;
      case "summary":
        return <SummarySection key={section.id} {...sectionProps} />;
      case "experience":
        return <ExperienceSection key={section.id} {...sectionProps} />;
      case "education":
        return <EducationSection key={section.id} {...sectionProps} />;
      case "skills":
        return <SkillsSection key={section.id} {...sectionProps} />;
      case "languages":
        return <LanguagesSection key={section.id} {...sectionProps} />;
      case "certifications":
        return <CertificationsSection key={section.id} {...sectionProps} />;
      case "courses":
        return <CoursesSection key={section.id} {...sectionProps} />;
      case "references":
        return <ReferencesSection key={section.id} {...sectionProps} />;
      case "additional-info":
        return <AdditionalInfoSection key={section.id} {...sectionProps} />;
      default:
        return null;
    }
  };

  // Renderizar baseado no layout escolhido
  const renderLayout = () => {
    switch (visualConfig.layout) {
      case "single-column":
        return (
          <div className="max-w-[210mm] mx-auto">
            {visibleSections.map(renderSection)}
          </div>
        );

      case "two-column":
        // Dividir secções em duas colunas
        const leftSections = visibleSections.filter(s => 
          ["personal-info", "skills", "languages", "certifications"].includes(s.type)
        );
        const rightSections = visibleSections.filter(s => 
          !["personal-info", "skills", "languages", "certifications"].includes(s.type)
        );

        return (
          <div className="grid grid-cols-[35%_65%] gap-6 max-w-[210mm] mx-auto">
            <div className="space-y-6">
              {leftSections.map(renderSection)}
            </div>
            <div className="space-y-6">
              {rightSections.map(renderSection)}
            </div>
          </div>
        );

      case "sidebar":
        // Sidebar à esquerda com conteúdo principal à direita
        const sidebarSections = visibleSections.filter(s => 
          ["personal-info", "skills", "languages"].includes(s.type)
        );
        const mainSections = visibleSections.filter(s => 
          !["personal-info", "skills", "languages"].includes(s.type)
        );

        return (
          <div className="grid grid-cols-[30%_70%] max-w-[210mm] mx-auto">
            <div 
              className="p-6 space-y-6" 
              style={{ backgroundColor: colors.secondary, color: colors.background }}
            >
              {sidebarSections.map(renderSection)}
            </div>
            <div className="p-6 space-y-6">
              {mainSections.map(renderSection)}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={`bg-white ${className}`} 
      style={{ 
        ...templateStyle,
        width: "210mm", 
        minHeight: "297mm",
      }}
    >
      {renderLayout()}
    </div>
  );
}
