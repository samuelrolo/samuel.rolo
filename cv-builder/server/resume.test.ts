import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { BASE_RESUME_TEMPLATE } from "@shared/resume-types";
import { DEFAULT_SECTIONS } from "@shared/section-types";
import { DEFAULT_VISUAL_CONFIG } from "@shared/visual-config-types";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("resume router", () => {
  it("should have resume router defined in app router", () => {
    expect(appRouter._def.procedures).toHaveProperty("resume.list");
    expect(appRouter._def.procedures).toHaveProperty("resume.create");
    expect(appRouter._def.procedures).toHaveProperty("resume.update");
    expect(appRouter._def.procedures).toHaveProperty("resume.delete");
  });
});

describe("template router", () => {
  it("should list all available templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.template.list();

    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
    
    // Verificar estrutura do primeiro template
    if (templates.length > 0) {
      const template = templates[0];
      expect(template).toHaveProperty("id");
      expect(template).toHaveProperty("name");
      expect(template).toHaveProperty("description");
    }
  });

  it("should get a specific template by id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Primeiro obter lista de templates
    const templates = await caller.template.list();
    
    if (templates.length > 0) {
      const templateId = templates[0]!.id;
      const template = await caller.template.get({ id: templateId });

      expect(template).not.toBeNull();
      if (template) {
        expect(template.id).toBe(templateId);
        expect(template).toHaveProperty("name");
      }
    }
  });
});

describe("visual configuration", () => {
  it("should have valid default visual config", () => {
    expect(DEFAULT_VISUAL_CONFIG).toHaveProperty("layout");
    expect(DEFAULT_VISUAL_CONFIG).toHaveProperty("colorScheme");
    expect(DEFAULT_VISUAL_CONFIG).toHaveProperty("typography");
    expect(DEFAULT_VISUAL_CONFIG).toHaveProperty("iconStyle");
    expect(DEFAULT_VISUAL_CONFIG).toHaveProperty("geometricStyle");
    expect(DEFAULT_VISUAL_CONFIG).toHaveProperty("designPack");
    expect(DEFAULT_VISUAL_CONFIG).toHaveProperty("photoConfig");
    expect(DEFAULT_VISUAL_CONFIG).toHaveProperty("backgroundConfig");
    expect(DEFAULT_VISUAL_CONFIG).toHaveProperty("visualElements");
  });

  it("should have valid base resume template", () => {
    expect(BASE_RESUME_TEMPLATE).toHaveProperty("personalInfo");
    expect(BASE_RESUME_TEMPLATE).toHaveProperty("experience");
    expect(BASE_RESUME_TEMPLATE).toHaveProperty("education");
    expect(BASE_RESUME_TEMPLATE).toHaveProperty("skills");
    
    // Verificar que modelo base tem dados pré-preenchidos
    expect(BASE_RESUME_TEMPLATE.personalInfo.fullName).not.toBe("");
    expect(BASE_RESUME_TEMPLATE.experience.length).toBeGreaterThan(0);
    expect(BASE_RESUME_TEMPLATE.education.length).toBeGreaterThan(0);
    expect(BASE_RESUME_TEMPLATE.skills.length).toBe(5);
  });

  it("should have valid default sections", () => {
    expect(Array.isArray(DEFAULT_SECTIONS)).toBe(true);
    expect(DEFAULT_SECTIONS.length).toBeGreaterThan(0);
    
    // Verificar que secções essenciais estão presentes e visíveis
    const personalInfo = DEFAULT_SECTIONS.find(s => s.type === "personal-info");
    const experience = DEFAULT_SECTIONS.find(s => s.type === "experience");
    const education = DEFAULT_SECTIONS.find(s => s.type === "education");
    const skills = DEFAULT_SECTIONS.find(s => s.type === "skills");
    
    expect(personalInfo).toBeDefined();
    expect(personalInfo?.visible).toBe(true);
    expect(experience).toBeDefined();
    expect(experience?.visible).toBe(true);
    expect(education).toBeDefined();
    expect(education?.visible).toBe(true);
    expect(skills).toBeDefined();
    expect(skills?.visible).toBe(true);
  });
});
