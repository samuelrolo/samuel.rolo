import { ResumeData } from "@shared/resume-types";
import { Phone, Mail, MapPin, Globe } from "lucide-react";

interface GreenBusinessTemplateProps {
  data: ResumeData;
}

export function GreenBusinessTemplate({ data }: GreenBusinessTemplateProps) {
  const { personalInfo, summary, experience, education, skills, references } = data;

  return (
    <div className="w-[210mm] h-[297mm] bg-white relative overflow-hidden print:shadow-none shadow-lg">
      {/* Decorative Shapes */}
      {/* Green triangles top left */}
      <div className="absolute top-0 left-0">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <polygon points="0,0 150,0 0,80" fill="#00B050" />
          <polygon points="0,80 80,0 150,0 0,150" fill="#008040" opacity="0.8" />
        </svg>
      </div>
      
      {/* Gray diagonal shapes top right */}
      <div className="absolute top-0 right-0">
        <svg width="200" height="100" viewBox="0 0 200 100">
          <polygon points="100,0 200,0 200,100" fill="#E0E0E0" />
          <polygon points="0,0 100,0 200,100 100,100" fill="#D0D0D0" opacity="0.5" />
        </svg>
      </div>

      <div className="flex h-full relative z-10">
        {/* Left Sidebar - White Background */}
        <div className="w-[30%] p-8 pt-32">
          {/* Photo - Circular */}
          {personalInfo.photoUrl && (
            <div className="mb-8 flex justify-center">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200">
                <img 
                  src={personalInfo.photoUrl} 
                  alt={personalInfo.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="mb-8">
            <h2 className="text-base uppercase tracking-widest mb-4 font-bold">
              CONTACT
            </h2>
            <div className="space-y-3 text-sm">
              {personalInfo.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-all">{personalInfo.email}</span>
                </div>
              )}
              {personalInfo.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{personalInfo.address}</span>
                </div>
              )}
              {personalInfo.website && (
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-all text-xs">{personalInfo.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* Education */}
          {education && education.length > 0 && (
            <div className="mb-8">
              <h2 className="text-base uppercase tracking-widest mb-4 font-bold">
                EDUCATION
              </h2>
              <div className="space-y-5 text-sm">
                {education.slice(0, 2).map((edu, index) => (
                  <div key={index}>
                    <p className="font-bold mb-1">
                      {edu.startDate.split('-')[0]} - {edu.endDate ? edu.endDate.split('-')[0] : 'Present'}
                    </p>
                    <p className="font-semibold uppercase text-xs mb-1">{edu.institution}</p>
                    <p className="text-gray-700">• {edu.degree}</p>
                    {edu.gpa && (
                      <p className="text-gray-600 text-xs">• GPA: {edu.gpa}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <div>
              <h2 className="text-base uppercase tracking-widest mb-4 font-bold">
                SKILLS
              </h2>
              <ul className="space-y-2 text-sm">
                {skills.slice(0, 7).map((skill, index) => (
                  <li key={index} className="text-gray-700">• {skill.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Content - White Background */}
        <div className="w-[70%] p-8 pt-16">
          {/* Name and Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-gray-700 uppercase tracking-wide">
              {personalInfo.fullName}
            </h1>
            <div className="mb-4">
              <p className="text-lg text-gray-600 uppercase tracking-wider">
                {personalInfo.title}
              </p>
              <div className="w-20 h-1 bg-green-500 mt-2"></div>
            </div>
          </div>

          {/* Profile */}
          {summary && (
            <div className="mb-8">
              <h2 className="text-lg uppercase tracking-widest font-bold mb-3 pb-2 border-t-2 border-black">
                PROFILE
              </h2>
              <p className="text-sm leading-relaxed text-gray-700">
                {summary}
              </p>
            </div>
          )}

          {/* Work Experience with Timeline */}
          {experience && experience.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg uppercase tracking-widest font-bold mb-4 pb-2 border-t-2 border-black">
                WORK EXPERIENCE
              </h2>
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-gray-300"></div>
                
                <div className="space-y-8">
                  {experience.slice(0, 2).map((exp, index) => (
                    <div key={index} className="relative pl-12">
                      {/* Timeline circle */}
                      <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-blue-900 border-4 border-white shadow-md"></div>
                      
                      <div>
                        <h3 className="font-bold text-base mb-1">{exp.company}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {exp.position} / {exp.startDate.split('-')[0]} - {exp.endDate ? exp.endDate.split('-')[0] : 'present'}
                        </p>
                        {exp.description && (
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                              <li key={i}>{line.replace(/^[•\-]\s*/, '')}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* References */}
          {references && references.length > 0 && (
            <div>
              <h2 className="text-lg uppercase tracking-widest font-bold mb-4 pb-2 border-t-2 border-black">
                REFERENCE
              </h2>
              <div className="grid grid-cols-2 gap-6 text-sm">
                {references.slice(0, 2).map((ref, index) => (
                  <div key={index}>
                    <p className="font-bold mb-1">{ref.name}</p>
                    <p className="text-gray-600 text-xs mb-2">{ref.company} / {ref.position}</p>
                    {ref.phone && (
                      <p className="text-gray-700 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {ref.phone}
                      </p>
                    )}
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
