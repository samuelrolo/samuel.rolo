import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as resumeDb from "../resume-db";

export const templateRouter = router({
  /**
   * Listar todos os templates disponíveis
   */
  list: publicProcedure.query(async () => {
    const templates = await resumeDb.getAllTemplates();
    return templates.map(t => ({
      ...t,
      config: t.config ? JSON.parse(t.config) : null,
    }));
  }),

  /**
   * Obter um template específico
   */
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const template = await resumeDb.getTemplateById(input.id);
      
      if (!template) {
        return null;
      }

      return {
        ...template,
        config: template.config ? JSON.parse(template.config) : null,
      };
    }),
});
