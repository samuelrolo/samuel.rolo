import { TemplateProps } from "./TemplateBase";
import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react";

/**
 * Template 1: Black and White Simple Infographic
 * Layout horizontal com secções destacadas em cinza claro
 */
export function BlackWhiteSimpleTemplate({ data, className = "" }: TemplateProps) {
  return (
    <div className={`bg-white ${className}`} style={{ width: "210mm", minHeight: "297mm", fontFamily: "Arial, sans-serif" }}>
      {/* Header Section */}
      <div className="bg-black text-white p-8">
        <h1 className="text-4xl font-bold mb-2">{data.personalInfo.fullName}</h1>
        <p className="text-xl text-gray-300">{data.personalInfo.title}</p>
      </div>

      {/* Contact Info Bar */}
      <div className="bg-gray-200 px-8 py-4 flex flex-wrap gap-6 text-sm">
        {data.personalInfo.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>{data.personalInfo.email}</span>
          </div>
        )}
        {data.personalInfo.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{data.personalInfo.phone}</span>
          </div>
        )}
        {data.personalInfo.address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{data.personalInfo.address}</span>
          </div>
        )}
        {data.personalInfo.linkedin && (
          <div className="flex items-center gap-2">
            <Linkedin className="w-4 h-4" />
            <span>{data.personalInfo.linkedin}</span>
          </div>
        )}
        {data.personalInfo.website && (
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>{data.personalInfo.website}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Summary */}
        {data.summary && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">PERFIL PROFISSIONAL</h2>
            <p className="text-gray-700 leading-relaxed">{data.summary}</p>
          </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">EXPERIÊNCIA PROFISSIONAL</h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold">{exp.position}</h3>
                    <p className="text-gray-600">{exp.company}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(exp.startDate).toLocaleDateString("pt-PT", { month: "short", year: "numeric" })} -{" "}
                    {exp.current ? "Presente" : new Date(exp.endDate!).toLocaleDateString("pt-PT", { month: "short", year: "numeric" })}
                  </div>
                </div>
                {exp.description && <p className="text-gray-700 mb-2">{exp.description}</p>}
                {exp.achievements.length > 0 && (
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {exp.achievements.map((achievement, idx) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">FORMAÇÃO ACADÉMICA</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{edu.degree}</h3>
                    <p className="text-gray-600">{edu.institution}</p>
                    {edu.field && <p className="text-gray-500 text-sm">{edu.field}</p>}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : "Presente"}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">COMPETÊNCIAS</h2>
            <div className="grid grid-cols-2 gap-4">
              {data.skills.map((skill) => (
                <div key={skill.id}>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{skill.name}</span>
                    <span className="text-sm text-gray-500">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div className="bg-black h-2 rounded" style={{ width: `${skill.level}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">IDIOMAS</h2>
            <div className="grid grid-cols-3 gap-4">
              {data.languages.map((lang) => (
                <div key={lang.id} className="text-center">
                  <p className="font-semibold">{lang.name}</p>
                  <p className="text-sm text-gray-600">{lang.level}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">CERTIFICAÇÕES</h2>
            {data.certifications.map((cert) => (
              <div key={cert.id} className="mb-3">
                <h3 className="font-bold">{cert.name}</h3>
                <p className="text-sm text-gray-600">
                  {cert.issuer} • {new Date(cert.date).getFullYear()}
                </p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
