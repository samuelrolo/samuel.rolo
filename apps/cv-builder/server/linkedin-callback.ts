import { Express, Request, Response } from "express";
import {
  exchangeCodeForToken,
  getLinkedInProfile,
  getLinkedInEmail,
  getLinkedInPositions,
  mapLinkedInDataToResume,
} from "./linkedin-oauth";

/**
 * Registar rota de callback do LinkedIn OAuth
 */
export function registerLinkedInCallback(app: Express) {
  app.get("/api/linkedin/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error, error_description } = req.query;

      // Verificar se houve erro no OAuth
      if (error) {
        console.error("LinkedIn OAuth error:", error, error_description);
        return res.redirect(`/import?error=${encodeURIComponent(error_description as string || "Authentication failed")}`);
      }

      // Verificar se temos o código
      if (!code || typeof code !== "string") {
        return res.redirect("/import?error=missing_code");
      }

      // Construir redirect URI (deve corresponder ao configurado no LinkedIn)
      const redirectUri = `${req.protocol}://${req.get("host")}/api/linkedin/callback`;

      // 1. Trocar código por access token
      const tokenData = await exchangeCodeForToken(code, redirectUri);

      // 2. Obter dados do perfil
      const [profile, email, positions] = await Promise.all([
        getLinkedInProfile(tokenData.access_token),
        getLinkedInEmail(tokenData.access_token),
        getLinkedInPositions(tokenData.access_token),
      ]);

      // 3. Mapear dados para estrutura do CV
      const resumeData = mapLinkedInDataToResume(profile, email, positions);

      // 4. Guardar dados na sessão ou redirecionar com dados
      // Codificar dados em base64 para passar via URL (alternativa: usar sessão)
      const encodedData = Buffer.from(JSON.stringify(resumeData)).toString("base64");

      // Redirecionar para editor com dados importados
      return res.redirect(`/editor?imported=linkedin&data=${encodedData}`);
    } catch (error: any) {
      console.error("Error in LinkedIn callback:", error);
      return res.redirect(`/import?error=${encodeURIComponent(error.message || "Import failed")}`);
    }
  });
}
