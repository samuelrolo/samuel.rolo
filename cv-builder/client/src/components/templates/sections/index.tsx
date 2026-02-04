import { ResumeData } from "@shared/resume-types";
import { VisualConfig, ColorConfig } from "@shared/visual-config-types";
import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react";

export interface SectionProps {
  data: ResumeData;
  colors: ColorConfig;
  visualConfig: VisualConfig;
  title: string;
}

/**
 * Personal Info Section
 */
export function PersonalInfoSection({ data, colors, visualConfig, title }: SectionProps) {
  const { personalInfo } = data;
  const showIcons = visualConfig.visualElements.showContactIcons;

  return (
    <div className="mb-6">
      {visualConfig.visualElements.showPhoto && personalInfo.photoUrl && (
        <div className="mb-4 flex justify-center">
          <img
            src={personalInfo.photoUrl}
            alt={personalInfo.fullName}
            className={`object-cover ${
              visualConfig.photoConfig.shape === "circle" ? "rounded-full" : 
              visualConfig.photoConfig.shape === "rounded-square" ? "rounded-lg" : ""
            }`}
            style={{
              width: `${require("@shared/visual-config-types").PHOTO_SIZES[visualConfig.photoConfig.size]}px`,
              height: `${require("@shared/visual-config-types").PHOTO_SIZES[visualConfig.photoConfig.size]}px`,
              border: `${require("@shared/visual-config-types").BORDER_WIDTHS[visualConfig.photoConfig.borderWidth]}px solid ${visualConfig.photoConfig.borderColor}`,
            }}
          />
        </div>
      )}
      
      <h1 className="text-3xl font-bold mb-2" style={{ color: colors.primary }}>
        {personalInfo.fullName}
      </h1>
      <p className="text-xl mb-4" style={{ color: colors.accent }}>
        {personalInfo.title}
      </p>

      <div className="space-y-2 text-sm">
        {personalInfo.email && (
          <div className="flex items-center gap-2">
            {showIcons && <Mail className="w-4 h-4" style={{ color: colors.primary }} />}
            <span>{personalInfo.email}</span>
          </div>
        )}
        {personalInfo.phone && (
          <div className="flex items-center gap-2">
            {showIcons && <Phone className="w-4 h-4" style={{ color: colors.primary }} />}
            <span>{personalInfo.phone}</span>
          </div>
        )}
        {personalInfo.address && (
          <div className="flex items-center gap-2">
            {showIcons && <MapPin className="w-4 h-4" style={{ color: colors.primary }} />}
            <span>{personalInfo.address}</span>
          </div>
        )}
        {personalInfo.linkedin && (
          <div className="flex items-center gap-2">
            {showIcons && <Linkedin className="w-4 h-4" style={{ color: colors.primary }} />}
            <span>{personalInfo.linkedin}</span>
          </div>
        )}
        {personalInfo.website && (
          <div className="flex items-center gap-2">
            {showIcons && <Globe className="w-4 h-4" style={{ color: colors.primary }} />}
            <span>{personalInfo.website}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Summary Section
 */
export function SummarySection({ data, colors, visualConfig, title }: SectionProps) {
  if (!data.summary) return null;

  return (
    <section className="mb-6">
      <h2 
        className="text-xl font-bold mb-3" 
        style={{ 
          color: colors.primary,
          borderBottom: visualConfig.visualElements.showSectionDividers ? `2px solid ${colors.primary}` : "none",
          paddingBottom: visualConfig.visualElements.showSectionDividers ? "0.5rem" : "0",
        }}
      >
        {title}
      </h2>
      <p className="leading-relaxed">{data.summary}</p>
    </section>
  );
}

/**
 * Experience Section
 */
export function ExperienceSection({ data, colors, visualConfig, title }: SectionProps) {
  if (data.experience.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 
        className="text-xl font-bold mb-3" 
        style={{ 
          color: colors.primary,
          borderBottom: visualConfig.visualElements.showSectionDividers ? `2px solid ${colors.primary}` : "none",
          paddingBottom: visualConfig.visualElements.showSectionDividers ? "0.5rem" : "0",
        }}
      >
        {title}
      </h2>
      {data.experience.map((exp) => (
        <div key={exp.id} className="mb-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold" style={{ color: colors.primary }}>
                {exp.position}
              </h3>
              <p className="font-medium" style={{ color: colors.accent }}>
                {exp.company}
              </p>
            </div>
            <div className="text-sm" style={{ color: colors.accent }}>
              {new Date(exp.startDate).toLocaleDateString("pt-PT", { month: "short", year: "numeric" })} -{" "}
              {exp.current ? "Presente" : new Date(exp.endDate!).toLocaleDateString("pt-PT", { month: "short", year: "numeric" })}
            </div>
          </div>
          {exp.description && <p className="mb-2 text-sm">{exp.description}</p>}
          {exp.achievements.length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-sm">
              {exp.achievements.map((achievement, idx) => (
                <li key={idx}>{achievement}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}

/**
 * Education Section
 */
export function EducationSection({ data, colors, visualConfig, title }: SectionProps) {
  if (data.education.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 
        className="text-xl font-bold mb-3" 
        style={{ 
          color: colors.primary,
          borderBottom: visualConfig.visualElements.showSectionDividers ? `2px solid ${colors.primary}` : "none",
          paddingBottom: visualConfig.visualElements.showSectionDividers ? "0.5rem" : "0",
        }}
      >
        {title}
      </h2>
      {data.education.map((edu) => (
        <div key={edu.id} className="mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold" style={{ color: colors.primary }}>
                {edu.degree}
              </h3>
              <p className="font-medium" style={{ color: colors.accent }}>
                {edu.institution}
              </p>
              {edu.field && <p className="text-sm">{edu.field}</p>}
            </div>
            <div className="text-sm" style={{ color: colors.accent }}>
              {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : "Presente"}
            </div>
          </div>
          {edu.description && <p className="text-sm mt-2">{edu.description}</p>}
        </div>
      ))}
    </section>
  );
}

/**
 * Skills Section
 */
export function SkillsSection({ data, colors, visualConfig, title }: SectionProps) {
  if (data.skills.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 
        className="text-xl font-bold mb-3" 
        style={{ 
          color: colors.primary,
          borderBottom: visualConfig.visualElements.showSectionDividers ? `2px solid ${colors.primary}` : "none",
          paddingBottom: visualConfig.visualElements.showSectionDividers ? "0.5rem" : "0",
        }}
      >
        {title}
      </h2>
      <div className="space-y-3">
        {data.skills.map((skill) => (
          <div key={skill.id}>
            <div className="flex justify-between mb-1 text-sm">
              <span className="font-semibold">{skill.name}</span>
              {visualConfig.visualElements.showSkillBars && (
                <span style={{ color: colors.accent }}>{skill.level}%</span>
              )}
            </div>
            {visualConfig.visualElements.showSkillBars && (
              <div className="w-full h-2 rounded" style={{ backgroundColor: colors.secondary }}>
                <div 
                  className="h-2 rounded transition-all" 
                  style={{ 
                    width: `${skill.level}%`,
                    backgroundColor: colors.primary,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Languages Section
 */
export function LanguagesSection({ data, colors, visualConfig, title }: SectionProps) {
  if (data.languages.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 
        className="text-xl font-bold mb-3" 
        style={{ 
          color: colors.primary,
          borderBottom: visualConfig.visualElements.showSectionDividers ? `2px solid ${colors.primary}` : "none",
          paddingBottom: visualConfig.visualElements.showSectionDividers ? "0.5rem" : "0",
        }}
      >
        {title}
      </h2>
      <div className="space-y-2">
        {data.languages.map((lang) => (
          <div key={lang.id} className="flex justify-between items-center">
            <span className="font-semibold">{lang.name}</span>
            <span className="text-sm" style={{ color: colors.accent }}>{lang.level}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Certifications Section
 */
export function CertificationsSection({ data, colors, visualConfig, title }: SectionProps) {
  if (data.certifications.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 
        className="text-xl font-bold mb-3" 
        style={{ 
          color: colors.primary,
          borderBottom: visualConfig.visualElements.showSectionDividers ? `2px solid ${colors.primary}` : "none",
          paddingBottom: visualConfig.visualElements.showSectionDividers ? "0.5rem" : "0",
        }}
      >
        {title}
      </h2>
      {data.certifications.map((cert) => (
        <div key={cert.id} className="mb-3">
          <h3 className="font-bold">{cert.name}</h3>
          <p className="text-sm" style={{ color: colors.accent }}>
            {cert.issuer} • {new Date(cert.date).getFullYear()}
          </p>
          {cert.credentialId && <p className="text-xs mt-1">ID: {cert.credentialId}</p>}
        </div>
      ))}
    </section>
  );
}

/**
 * Courses Section
 */
export function CoursesSection({ data, colors, visualConfig, title }: SectionProps) {
  if (data.courses.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 
        className="text-xl font-bold mb-3" 
        style={{ 
          color: colors.primary,
          borderBottom: visualConfig.visualElements.showSectionDividers ? `2px solid ${colors.primary}` : "none",
          paddingBottom: visualConfig.visualElements.showSectionDividers ? "0.5rem" : "0",
        }}
      >
        {title}
      </h2>
      {data.courses.map((course) => (
        <div key={course.id} className="mb-3">
          <h3 className="font-bold">{course.name}</h3>
          <p className="text-sm" style={{ color: colors.accent }}>
            {course.institution} • {new Date(course.date).getFullYear()}
          </p>
        </div>
      ))}
    </section>
  );
}

/**
 * References Section
 */
export function ReferencesSection({ data, colors, visualConfig, title }: SectionProps) {
  if (data.references.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 
        className="text-xl font-bold mb-3" 
        style={{ 
          color: colors.primary,
          borderBottom: visualConfig.visualElements.showSectionDividers ? `2px solid ${colors.primary}` : "none",
          paddingBottom: visualConfig.visualElements.showSectionDividers ? "0.5rem" : "0",
        }}
      >
        {title}
      </h2>
      {data.references.map((ref) => (
        <div key={ref.id} className="mb-4">
          <h3 className="font-bold">{ref.name}</h3>
          {ref.position && ref.company && (
            <p className="text-sm" style={{ color: colors.accent }}>
              {ref.position} • {ref.company}
            </p>
          )}
          {ref.email && <p className="text-sm">{ref.email}</p>}
          {ref.phone && <p className="text-sm">{ref.phone}</p>}
        </div>
      ))}
    </section>
  );
}

/**
 * Additional Info Section
 */
export function AdditionalInfoSection({ data, colors, visualConfig, title }: SectionProps) {
  if (!data.additionalInfo) return null;

  const { awards, activities, interests } = data.additionalInfo;
  const hasContent = (awards && awards.length > 0) || (activities && activities.length > 0) || (interests && interests.length > 0);

  if (!hasContent) return null;

  return (
    <section className="mb-6">
      <h2 
        className="text-xl font-bold mb-3" 
        style={{ 
          color: colors.primary,
          borderBottom: visualConfig.visualElements.showSectionDividers ? `2px solid ${colors.primary}` : "none",
          paddingBottom: visualConfig.visualElements.showSectionDividers ? "0.5rem" : "0",
        }}
      >
        {title}
      </h2>
      
      {awards && awards.length > 0 && (
        <div className="mb-3">
          <h3 className="font-semibold mb-2" style={{ color: colors.accent }}>Prémios</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {awards.map((award, idx) => (
              <li key={idx}>{award}</li>
            ))}
          </ul>
        </div>
      )}

      {activities && activities.length > 0 && (
        <div className="mb-3">
          <h3 className="font-semibold mb-2" style={{ color: colors.accent }}>Atividades</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {activities.map((activity, idx) => (
              <li key={idx}>{activity}</li>
            ))}
          </ul>
        </div>
      )}

      {interests && interests.length > 0 && (
        <div className="mb-3">
          <h3 className="font-semibold mb-2" style={{ color: colors.accent }}>Interesses</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {interests.map((interest, idx) => (
              <li key={idx}>{interest}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
