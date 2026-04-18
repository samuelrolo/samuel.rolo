const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
const SENDER = { name: "Share2Inspire", email: "geral@share2inspire.pt" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SupportedLang = "pt" | "en" | "es";

type TypeLabels = {
  pt: string;
  en: string;
  es: string;
};

const TYPE_LABELS: Record<string, TypeLabels> = {
  cv_analysis: { pt: "Análise de CV", en: "CV Analysis", es: "Análisis de CV" },
  career_path: { pt: "Career Path", en: "Career Path", es: "Career Path" },
  career_intelligence: { pt: "Career Intelligence", en: "Career Intelligence", es: "Career Intelligence" },
  linkedin_roast: { pt: "Auditoria LinkedIn", en: "LinkedIn Audit", es: "Auditoría de LinkedIn" },
};

function normalizeLanguage(value?: string): SupportedLang {
  if (value === "en" || value === "es") return value;
  return "pt";
}

function normalizeAnalysisType(value?: string): keyof typeof TYPE_LABELS {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "cv_analysis";
  if (["cv analyser", "cv analyzer", "cv analysis", "cv_analyser", "paid", "free"].includes(raw)) return "cv_analysis";
  if (["career path", "career_path"].includes(raw)) return "career_path";
  if (["career intelligence", "career_intelligence"].includes(raw)) return "career_intelligence";
  if (["linkedin roaster", "linkedin roast", "linkedin_roast"].includes(raw)) return "linkedin_roast";
  return "cv_analysis";
}

function wrapTemplate(params: { lang: SupportedLang; reportTitle: string; analysisHtml: string }) {
  const { lang, reportTitle, analysisHtml } = params;
  const isEn = lang === "en";
  const isEs = lang === "es";

  const intro = isEn
    ? "Here is your analysis report from Share2Inspire."
    : isEs
      ? "Aquí tienes tu informe de análisis de Share2Inspire."
      : "Aqui está o teu relatório de análise da Share2Inspire.";

  const ctaLabel = isEn ? "Go to Member Area" : isEs ? "Ir al Área de Miembro" : "Ir para Área de Membro";
  const exploreLabel = isEn ? "Want to explore more tools?" : isEs ? "¿Quieres explorar más herramientas?" : "Queres explorar mais ferramentas?";
  const footerLabel = isEn
    ? "You received this email because you used Share2Inspire."
    : isEs
      ? "Recibiste este correo porque utilizaste Share2Inspire."
      : "Recebeste este email porque utilizaste o Share2Inspire.";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f6f4ef;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="max-width:680px;width:100%;">
          <tr>
            <td style="text-align:center;padding:0 0 20px;">
              <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" style="height:40px;" />
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #e8e4dc;border-radius:14px;padding:32px 28px;box-shadow:0 8px 24px rgba(0,0,0,0.04);">
              <h1 style="margin:0 0 8px;font-size:26px;line-height:1.2;color:#1a1a1a;">${reportTitle}</h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#666;">${intro}</p>
              <div style="border-top:1px solid #eee;padding-top:24px;">${analysisHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding:24px 8px 8px;">
              <p style="margin:0 0 12px;font-size:12px;color:#888;">${exploreLabel}</p>
              <a href="https://www.share2inspire.pt/area-cliente/membros" style="display:inline-block;background:#c8a45a;color:#ffffff;padding:11px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">${ctaLabel}</a>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding:18px 8px 0;color:#999;font-size:11px;line-height:1.6;">
              <p style="margin:0 0 6px;">${footerLabel}</p>
              <p style="margin:0;">&copy; 2026 Share2Inspire</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "BREVO_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const recipientEmail = body.recipient_email || body.to_email || body.email || "";
    const recipientName = body.recipient_name || body.to_name || body.name || "";
    const analysisHtml = body.analysis_html || body.html_content || body.html || "";
    const subjectOverride = body.subject || "";
    const lang = normalizeLanguage(body.language);
    const analysisType = normalizeAnalysisType(body.analysis_type);
    const typeLabel = TYPE_LABELS[analysisType];
    const reportTitle = lang === "en" ? typeLabel.en : lang === "es" ? typeLabel.es : typeLabel.pt;
    const subject = subjectOverride || (lang === "en"
      ? `Your ${typeLabel.en} Report — Share2Inspire`
      : lang === "es"
        ? `Tu Informe de ${typeLabel.es} — Share2Inspire`
        : `O teu Relatório de ${typeLabel.pt} — Share2Inspire`);

    if (!recipientEmail) {
      return new Response(JSON.stringify({ success: false, error: "recipient_email é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!analysisHtml) {
      return new Response(JSON.stringify({ success: false, error: "analysis_html é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const htmlContent = wrapTemplate({ lang, reportTitle, analysisHtml });

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: recipientEmail, name: recipientName || undefined }],
        subject,
        htmlContent,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: payload?.message || "Falha ao enviar email", details: payload }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, messageId: payload?.messageId || null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
