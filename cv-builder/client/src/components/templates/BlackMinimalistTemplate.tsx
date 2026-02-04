import { ResumeData } from "@shared/resume-types";
import { Phone, Mail, MapPin, Globe } from "lucide-react";

interface BlackMinimalistTemplateProps {
  data: ResumeData;
}

export function BlackMinimalistTemplate({ data }: BlackMinimalistTemplateProps) {
  const { personalInfo, summary, experience, education, skills } = data;

  return (
    <div className="w-[210mm] h-[297mm] bg-white relative overflow-hidden print:shadow-none shadow-lg">
      {/* Decorative Yellow Triangles */}
      <div className="absolute top-0 left-0 w-0 h-0 border-l-[80px] border-l-transparent border-t-[80px] border-t-yellow-400 border-r-[80px] border-r-yellow-400" style={{ transform: 'rotate(45deg)', transformOrigin: 'top left' }} />
      <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[60px] border-l-transparent border-b-[60px] border-b-yellow-400 border-r-[60px] border-r-yellow-400" style={{ transform: 'rotate(45deg)', transformOrigin: 'bottom right' }} />
      
      <div className="flex h-full">
        {/* Left Sidebar - Black Background */}
        <div className="w-[35%] bg-black text-white p-8 relative z-10">
          {/* Photo - Hexagonal */}
          {personalInfo.photoUrl && (
            <div className="mb-6 flex justify-center">
              <div className="w-48 h-48 relative">
                <div className="absolute inset-0" style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  background: `url(${personalInfo.photoUrl}) center/cover`,
                  filter: 'grayscale(100%)'
                }} />
              </div>
            </div>
          )}

          {/* Name */}
          <h1 className="text-3xl font-bold mb-2 leading-tight">
            {personalInfo.fullName}
          </h1>
          <p className="text-sm uppercase tracking-widest mb-8 text-gray-300">
            {personalInfo.title}
          </p>

          {/* Contact */}
          <div className="mb-8">
            <h2 className="text-lg uppercase tracking-widest mb-4 font-semibold">
              CONTACT
            </h2>
            <div className="space-y-3 text-sm">
              {personalInfo.phone && (
                <div className="flex items-start gap-2">
                  <span className="font-bold">P</span>
                  <span>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.email && (
                <div className="flex items-start gap-2">
                  <span className="font-bold">E</span>
                  <span className="break-all">{personalInfo.email}</span>
                </div>
              )}
              {personalInfo.address && (
                <div className="flex items-start gap-2">
                  <span className="font-bold">A</span>
                  <span>{personalInfo.address}</span>
                </div>
              )}
              {personalInfo.website && (
                <div className="flex items-start gap-2">
                  <span className="font-bold">W</span>
                  <span className="break-all">{personalInfo.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* Education */}
          {education && education.length > 0 && (
            <div>
              <h2 className="text-lg uppercase tracking-widest mb-4 font-semibold">
                EDUCATION
              </h2>
              <div className="space-y-6 text-sm">
                {education.slice(0, 2).map((edu, index) => (
                  <div key={index}>
                    <p className="font-bold mb-1">{edu.institution}</p>
                    <p className="text-gray-300 mb-1">
                      {edu.startDate} - {edu.endDate || 'Present'}
                    </p>

                    <p className="italic text-gray-300">{edu.degree}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content - White Background */}
        <div className="w-[65%] p-8 relative z-10">
          {/* Summary */}
          {summary && (
            <div className="mb-8">
              <h2 className="text-xl uppercase tracking-[0.3em] font-bold mb-2 pb-2 border-t-2 border-b-2 border-black">
                SUMMARY
              </h2>
              <p className="text-sm leading-relaxed text-gray-800">
                {summary}
              </p>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl uppercase tracking-[0.3em] font-bold mb-4 pb-2 border-t-2 border-b-2 border-black">
                EXPERIENCE
              </h2>
              <div className="space-y-6">
                {experience.slice(0, 2).map((exp, index) => (
                  <div key={index}>
                    <h3 className="font-bold text-base mb-1">{exp.company}</h3>
                    <p className="text-sm italic text-gray-600 mb-2">
                      {exp.position} / {exp.startDate} - {exp.endDate || 'present'}
                    </p>
                    {exp.description && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                          <li key={i}>{line.replace(/^[•\-]\s*/, '')}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <div>
              <h2 className="text-xl uppercase tracking-[0.3em] font-bold mb-4 pb-2 border-t-2 border-b-2 border-black">
                SKILLS
              </h2>
              <div className="space-y-3">
                {skills.slice(0, 7).map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{skill.name}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-yellow-400 h-full rounded-full transition-all"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
