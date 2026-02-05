import { z } from "zod";
import { protectedProcedure, router, publicProcedure } from "../_core/trpc";
import * as resumeDb from "../resume-db";
import { TRPCError } from "@trpc/server";
import pdf from "pdf-parse";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_SCOPES = "r_liteprofile r_emailaddress";

export const resumeRouter = router({
  /**
   * Listar todos os currículos do utilizador
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await resumeDb.getUserResumes(ctx.user.id);
  }),

  /**
   * Obter um currículo específico
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const resume = await resumeDb.getResumeById(input.id, ctx.user.id);
      
      if (!resume) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Currículo não encontrado",
        });
      }

      return {
        ...resume,
        data: JSON.parse(resume.data),
      };
    }),

  /**
   * Criar novo currículo
   */
  create: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        title: z.string(),
        data: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const resumeId = await resumeDb.createResume({
        userId: ctx.user.id,
        templateId: input.templateId,
        title: input.title,
        data: JSON.stringify(input.data),
        isPublished: 0,
        linkedinImported: 0,
      });

      return { id: resumeId };
    }),

  /**
   * Atualizar currículo existente
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        data: z.any().optional(),
        isPublished: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const updatePayload: any = {};
      if (updateData.title !== undefined) updatePayload.title = updateData.title;
      if (updateData.data !== undefined) updatePayload.data = JSON.stringify(updateData.data);
      if (updateData.isPublished !== undefined) updatePayload.isPublished = updateData.isPublished;

      await resumeDb.updateResume(id, ctx.user.id, updatePayload);

      return { success: true };
    }),

  /**
   * Eliminar currículo
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await resumeDb.deleteResume(input.id, ctx.user.id);
      return { success: true };
    }),

  /**
   * Verificar se utilizador é premium
   */
  isPremium: protectedProcedure.query(async ({ ctx }) => {
    return await resumeDb.isUserPremium(ctx.user.id);
  }),

  /**
   * Parse LinkedIn PDF and extract resume data
   */
  parseLinkedInPDF: publicProcedure
    .input(
      z.object({
        pdfData: z.string(), // base64 encoded PDF
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Decode base64 to buffer
        const pdfBuffer = Buffer.from(input.pdfData, 'base64');
        
        // Parse PDF
        const data = await pdf(pdfBuffer);
        const text = data.text;

        // Extract information using regex patterns
        const extractedData = {
          personalInfo: {
            fullName: extractName(text),
            title: extractTitle(text),
            email: extractEmail(text),
            phone: extractPhone(text),
            address: extractLocation(text),
            linkedin: extractLinkedIn(text),
          },
          summary: extractSummary(text),
          experience: extractExperience(text),
          education: extractEducation(text),
          skills: extractSkills(text),
          languages: [],
          certifications: [],
          courses: [],
          references: [],
        };

      return extractedData;
    } catch (error) {
      console.error("Error parsing LinkedIn PDF:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao processar o PDF. Verifique se o ficheiro é válido.",
      });
    }
  }),

  /**
   * Obter URL de autorização LinkedIn OAuth
   */
  getLinkedInAuthUrl: publicProcedure
    .input(
      z.object({
        redirectUri: z.string(),
        state: z.string().optional(),
      })
    )
    .query(({ input }) => {
      if (!LINKEDIN_CLIENT_ID) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "LinkedIn OAuth não configurado",
        });
      }

      const params = new URLSearchParams({
        response_type: "code",
        client_id: LINKEDIN_CLIENT_ID,
        redirect_uri: input.redirectUri,
        scope: LINKEDIN_SCOPES,
      });

      if (input.state) {
        params.append("state", input.state);
      }

      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

      return { authUrl };
    }),
});

// Helper functions to extract data from LinkedIn PDF text

function extractName(text: string): string {
  // LinkedIn PDFs typically start with the name in the first lines
  const lines = text.split('\n').filter(line => line.trim());
  return lines[0] || "Nome não encontrado";
}

function extractTitle(text: string): string {
  // Title usually comes after the name
  const lines = text.split('\n').filter(line => line.trim());
  return lines[1] || "Título não encontrado";
}

function extractEmail(text: string): string {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const match = text.match(emailRegex);
  return match ? match[0] : "";
}

function extractPhone(text: string): string {
  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : "";
}

function extractLocation(text: string): string {
  // Look for location patterns
  const locationRegex = /(?:Location|Localização|Morada)[\s:]+([^\n]+)/i;
  const match = text.match(locationRegex);
  return match ? match[1].trim() : "";
}

function extractLinkedIn(text: string): string {
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/i;
  const match = text.match(linkedinRegex);
  return match ? match[0] : "";
}

function extractSummary(text: string): string {
  // Look for summary/about section
  const summaryRegex = /(?:Summary|About|Sobre|Resumo)[\s:]+([^\n]+(?:\n(?!\n)[^\n]+)*)/i;
  const match = text.match(summaryRegex);
  return match ? match[1].trim().slice(0, 500) : "";
}

function extractExperience(text: string): any[] {
  const experiences: any[] = [];
  
  // Look for experience section
  const expSectionRegex = /(?:Experience|Experiência)[\s\S]*?(?=Education|Educação|Skills|$)/i;
  const expSection = text.match(expSectionRegex);
  
  if (expSection) {
    const expText = expSection[0];
    // Split by common patterns (company names are usually bold/capitalized)
    const expEntries = expText.split(/\n(?=[A-Z][^\n]*\n)/);
    
    expEntries.slice(1, 4).forEach((entry, index) => { // Limit to 3 experiences
      const lines = entry.split('\n').filter(line => line.trim());
      if (lines.length >= 2) {
        experiences.push({
          id: `exp-${index + 1}`,
          company: lines[0] || "",
          position: lines[1] || "",
          startDate: new Date().toISOString().slice(0, 7), // Default to current month
          endDate: "",
          current: false,
          description: lines.slice(2).join('\n').slice(0, 300),
          achievements: [],
        });
      }
    });
  }
  
  // Return at least one empty experience if none found
  if (experiences.length === 0) {
    experiences.push({
      id: "exp-1",
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: [],
    });
  }
  
  return experiences;
}

function extractEducation(text: string): any[] {
  const education: any[] = [];
  
  // Look for education section
  const eduSectionRegex = /(?:Education|Educação)[\s\S]*?(?=Skills|Competências|Certifications|$)/i;
  const eduSection = text.match(eduSectionRegex);
  
  if (eduSection) {
    const eduText = eduSection[0];
    const eduEntries = eduText.split(/\n(?=[A-Z][^\n]*\n)/);
    
    eduEntries.slice(1, 3).forEach((entry, index) => { // Limit to 2 education entries
      const lines = entry.split('\n').filter(line => line.trim());
      if (lines.length >= 2) {
        education.push({
          id: `edu-${index + 1}`,
          institution: lines[0] || "",
          degree: lines[1] || "",
          field: "",
          startDate: "",
          endDate: "",
          gpa: "",
          description: "",
        });
      }
    });
  }
  
  // Return at least one empty education if none found
  if (education.length === 0) {
    education.push({
      id: "edu-1",
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
    });
  }
  
  return education;
}

function extractSkills(text: string): any[] {
  const skills: any[] = [];
  
  // Look for skills section
  const skillsSectionRegex = /(?:Skills|Competências)[\s\S]*?(?=Languages|Idiomas|Certifications|$)/i;
  const skillsSection = text.match(skillsSectionRegex);
  
  if (skillsSection) {
    const skillsText = skillsSection[0];
    // Split by common delimiters
    const skillsList = skillsText.split(/[•·,\n]/).filter(s => s.trim() && s.length > 2 && s.length < 50);
    
    skillsList.slice(0, 10).forEach((skill, index) => {
      skills.push({
        id: `skill-${index + 1}`,
        name: skill.trim(),
        level: 70, // Default level
        category: "Técnica",
      });
    });
  }
  
  // Return default skills if none found
  if (skills.length === 0) {
    for (let i = 1; i <= 5; i++) {
      skills.push({
        id: `skill-${i}`,
        name: "",
        level: 70,
        category: "Técnica",
      });
    }
  }
  
  return skills;
}
