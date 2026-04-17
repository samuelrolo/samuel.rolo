import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" };
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const ADMIN_EMAIL = "samuelrolo@gmail.com";
const BRAND_NAME = "Share2Inspire";
const BRAND_URL = "https://www.share2inspire.pt";
const BRAND_LOGO = "https://www.share2inspire.pt/images/logo.webp";
const OPENAI_BASE_URL = (Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, "");
const OPENAI_MODEL = Deno.env.get("SUPPORT_REPLY_MODEL") || "gemini-2.5-flash";
const GEMINI_MODEL = Deno.env.get("SUPPORT_REPLY_GEMINI_MODEL") || "gemini-2.5-flash";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

type SupportAction = "suggest_reply" | "send_reply" | "generate_voucher";
type Lang = "pt" | "en" | "es";
type JsonRecord = Record<string, unknown>;

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestBody {
  message_id?: number | string;
  action?: SupportAction;
  reply_text?: string;
  reply_subject?: string;
  discount_percent?: number;
  applicable_product?: string;
  valid_until?: string;
  validity_days?: number;
  max_uses?: number;
  voucher_code?: string;
}

interface ContactMessage extends JsonRecord {
  id: number;
  name?: string | null;
  email?: string | null;
  subject?: string | null;
  message?: string | null;
  created_at?: string | null;
  admin_notes?: string | null;
  lang?: string | null;
  language?: string | null;
  status?: string | null;
  responded_at?: string | null;
  reply_text?: string | null;
}

function jsonResponse(payload: JsonRecord, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
}

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function langLabels(lang: Lang) {
  if (lang === "en") {
    return {
      hello: "Hello",
      subjectFallback: "your message to Share2Inspire",
      supportTitle: "Customer Support",
      supportIntro: "Thank you for contacting us. Below you will find our reply.",
      replySent: "Reply sent successfully",
      voucherTitle: "Exclusive support voucher",
      team: "Share2Inspire Team",
      footer: "You received this email because you contacted Share2Inspire.",
      signature: "Best regards",
    };
  }

  if (lang === "es") {
    return {
      hello: "Hola",
      subjectFallback: "tu mensaje a Share2Inspire",
      supportTitle: "Atención al Cliente",
      supportIntro: "Gracias por ponerte en contacto con nosotros. A continuación encontrarás nuestra respuesta.",
      replySent: "Respuesta enviada correctamente",
      voucherTitle: "Voucher exclusivo de soporte",
      team: "Equipo Share2Inspire",
      footer: "Has recibido este correo porque contactaste con Share2Inspire.",
      signature: "Un saludo",
    };
  }

  return {
    hello: "Olá",
    subjectFallback: "a tua mensagem para a Share2Inspire",
    supportTitle: "Suporte ao Cliente",
    supportIntro: "Obrigado pelo teu contacto. Em baixo encontras a nossa resposta.",
    replySent: "Resposta enviada com sucesso",
    voucherTitle: "Voucher exclusivo de suporte",
    team: "Equipa Share2Inspire",
    footer: "Recebeste este email porque contactaste a Share2Inspire.",
    signature: "Com os melhores cumprimentos",
  };
}

function getProductCatalog(lang: Lang) {
  if (lang === "en") {
    return `
- CV Analyser: AI CV analysis with ATS compatibility, keyword gaps, structure review and practical recommendations.
- LinkedIn Roaster: direct audit of LinkedIn profile positioning, headline, clarity and recruiter appeal.
- Student Pack: combined offer for students / recent graduates focused on employability fundamentals.
- Career Path: personalised roadmap with suitable next roles, skill gaps and recommended development priorities.
- Career Intelligence: deeper decision support with market context, salary perspective and strategic direction.
- Bundle: combined package joining CV Analyser and Career Path in one purchase.`.trim();
  }

  if (lang === "es") {
    return `
- CV Analyser: análisis del CV con IA, compatibilidad ATS, gaps de palabras clave, estructura y recomendaciones prácticas.
- LinkedIn Roaster: auditoría directa del perfil de LinkedIn, propuesta de valor, visibilidad y atractivo para reclutadores.
- Student Pack: oferta combinada para estudiantes y recién graduados centrada en la empleabilidad.
- Career Path: hoja de ruta personalizada con próximos roles, brechas de competencias y prioridades de desarrollo.
- Career Intelligence: apoyo estratégico para decidir con contexto de mercado, perspectiva salarial y dirección profesional.
- Bundle: paquete combinado que une CV Analyser y Career Path en una sola compra.`.trim();
  }

  return `
- CV Analyser: análise de CV com IA, compatibilidade ATS, gaps de keywords, estrutura e recomendações práticas.
- LinkedIn Roaster: auditoria direta ao perfil de LinkedIn, proposta de valor, visibilidade e atratividade para recrutadores.
- Student Pack: oferta combinada para estudantes / recém-licenciados focada na empregabilidade.
- Career Path: roadmap personalizado com próximos cargos, gaps de competências e prioridades de desenvolvimento.
- Career Intelligence: apoio estratégico à decisão com contexto de mercado, perspetiva salarial e direção profissional.
- Bundle: pacote combinado que junta CV Analyser e Career Path numa só compra.`.trim();
}

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Invalid JSON returned by model");
  }
}

function detectLanguage(message: ContactMessage): Lang {
  const explicit = String(message.lang || message.language || "").toLowerCase();
  if (["pt", "pt-pt", "pt_br", "pt-br"].includes(explicit)) return "pt";
  if (["en", "en-gb", "en-us"].includes(explicit)) return "en";
  if (["es", "es-es", "es-mx"].includes(explicit)) return "es";

  const text = `${message.subject || ""}\n${message.message || ""}`.toLowerCase();
  const spanishHints = ["hola", "gracias", "quiero", "necesito", "ustedes", "perfil", "currículum", "ayuda", "por favor"];
  const englishHints = ["hello", "thank you", "resume", "support", "career", "please", "help", "linkedin"];
  const portugueseHints = ["olá", "obrigado", "currículo", "preciso", "carreira", "ajuda", "por favor", "equipa"];

  const score = (terms: string[]) => terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
  const es = score(spanishHints);
  const en = score(englishHints);
  const pt = score(portugueseHints);

  if (es > en && es > pt) return "es";
  if (en > es && en > pt) return "en";
  return "pt";
}

function buildEmailHtml(params: { lang: Lang; recipientName?: string | null; replyText: string; subject?: string | null; voucherCode?: string | null; }) {
  const { lang, recipientName, replyText, subject, voucherCode } = params;
  const t = langLabels(lang);
  const firstName = recipientName?.trim()?.split(/\s+/)?.[0] || "";
  const greeting = `${t.hello}${firstName ? ` ${escapeHtml(firstName)}` : ""},`;
  const replyHtml = escapeHtml(replyText).replace(/\n\n+/g, "</p><p style=\"margin:0 0 14px 0;\">").replace(/\n/g, "<br>");
  const voucherBlock = voucherCode
    ? `<div style="margin:20px 0;padding:16px 18px;background:#f8f6f0;border:1px solid rgba(201,169,97,0.35);border-left:4px solid #C9A961;border-radius:8px;"><div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a7440;margin-bottom:6px;">${escapeHtml(t.voucherTitle)}</div><div style="font-size:24px;font-weight:800;color:#0a1628;letter-spacing:0.08em;">${escapeHtml(voucherCode)}</div></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#243042;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg,#0a1628 0%,#162a4a 100%);border-radius:14px 14px 0 0;text-align:center;">
              <img src="${BRAND_LOGO}" alt="${BRAND_NAME}" height="40" style="height:40px;margin-bottom:10px;">
              <div style="font-size:10px;color:#C9A961;letter-spacing:0.24em;text-transform:uppercase;font-weight:700;">${escapeHtml(t.supportTitle)}</div>
            </td>
          </tr>
          <tr><td style="height:3px;background:linear-gradient(90deg,#C9A961,#ead8aa,#C9A961);"></td></tr>
          <tr>
            <td style="background:#ffffff;padding:30px 32px 24px 32px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">${greeting}</p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#475569;">${escapeHtml(t.supportIntro)}</p>
              ${subject ? `<div style="margin:0 0 18px 0;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:4px;">Original subject</div><div style="font-size:14px;color:#0f172a;font-weight:600;">${escapeHtml(subject)}</div></div>` : ""}
              <div style="padding:18px 20px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 10px 30px -24px rgba(15,23,42,0.35);">
                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.8;color:#334155;">${replyHtml}</p>
              </div>
              ${voucherBlock}
              <p style="margin:18px 0 0 0;font-size:14px;line-height:1.8;color:#475569;">${escapeHtml(t.signature)},<br><strong>${escapeHtml(t.team)}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#0a1628;padding:24px 32px;border-radius:0 0 14px 14px;text-align:center;">
              <p style="margin:0 0 10px 0;font-size:12px;color:rgba(255,255,255,0.72);">${escapeHtml(t.footer)}</p>
              <p style="margin:0;">
                <a href="${BRAND_URL}" style="color:#C9A961;text-decoration:none;font-size:13px;font-weight:600;">share2inspire.pt</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) throw new HttpError(401, "Missing Authorization header");

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const apiKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      "apikey": apiKey,
      "Authorization": authHeader,
    },
  });

  if (!res.ok) {
    const reason = res.status === 401 ? "Invalid or expired admin session" : "Unauthorized user";
    throw new HttpError(res.status === 401 ? 401 : 403, reason);
  }

  const user = await res.json();
  const email = String(user?.email || "").toLowerCase();
  if (email !== ADMIN_EMAIL.toLowerCase()) throw new HttpError(403, "Forbidden");
  return user;
}

async function getMessage(db: ReturnType<typeof supabaseAdmin>, messageId: number) {
  const { data, error } = await db.from("contact_messages").select("*").eq("id", messageId).single();
  if (error || !data) throw new Error("Support message not found");
  return data as ContactMessage;
}

async function callGeminiCompatibleJSON(prompt: string) {
  if (GEMINI_API_KEY) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            responseMimeType: "application/json",
          },
        }),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM request failed: ${errorText}`);
    }
    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content || typeof content !== "string") throw new Error("Empty model response");
    return extractJson(content);
  }

  if (!OPENAI_API_KEY) throw new Error("Neither GEMINI_API_KEY nor OPENAI_API_KEY is configured");
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: "You are a senior customer support strategist for Share2Inspire. Always return valid JSON only. Keep the tone professional, empathetic, clear and commercially relevant without sounding pushy.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM request failed: ${errorText}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("Empty model response");
  return extractJson(content);
}

function buildSuggestionsPrompt(message: ContactMessage, lang: Lang) {
  const langInstruction = lang === "en"
    ? "Write everything in English."
    : lang === "es"
      ? "Escribe todo en español."
      : "Escreve tudo em português europeu.";

  return `
${langInstruction}
You are preparing support replies for Share2Inspire.
Use this product context:
${getProductCatalog(lang)}

Customer message metadata:
- Name: ${message.name || "Unknown"}
- Email: ${message.email || "Unknown"}
- Subject: ${message.subject || "No subject"}
- Message: ${message.message || ""}

Task:
Generate 3 different reply suggestions for an admin to choose from.
Each suggestion must:
- directly answer the customer message;
- sound human, confident and helpful;
- optionally reference a relevant Share2Inspire product only if it genuinely helps the user;
- avoid inventing discounts, promises or unavailable features;
- be concise but complete enough to send as an email.

Return strictly JSON in this format:
{
  "language": "${lang}",
  "suggestions": [
    {"subject": "...", "body": "..."},
    {"subject": "...", "body": "..."},
    {"subject": "...", "body": "..."}
  ]
}`.trim();
}

function buildSingleReplyPrompt(message: ContactMessage, lang: Lang) {
  const langInstruction = lang === "en"
    ? "Write everything in English."
    : lang === "es"
      ? "Escribe todo en español."
      : "Escreve tudo em português europeu.";

  return `
${langInstruction}
You are preparing one final support reply for Share2Inspire.
Use this product context:
${getProductCatalog(lang)}

Customer message metadata:
- Name: ${message.name || "Unknown"}
- Email: ${message.email || "Unknown"}
- Subject: ${message.subject || "No subject"}
- Message: ${message.message || ""}

Write one polished reply that can be sent immediately by email.
Do not include placeholders.
Do not invent discounts, refunds or guarantees.
Return strictly JSON in this format:
{
  "subject": "...",
  "body": "..."
}`.trim();
}

async function findCouponTable(db: ReturnType<typeof supabaseAdmin>) {
  const candidates = ["discount_coupons", "discount_codes", "coupons", "vouchers"];
  for (const table of candidates) {
    const { error } = await db.from(table).select("*", { count: "exact", head: true }).limit(1);
    if (!error) return table;
  }
  return null;
}

function generateVoucherCode() {
  return `S2I-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

async function createVoucher(db: ReturnType<typeof supabaseAdmin>, message: ContactMessage, body: RequestBody) {
  const table = await findCouponTable(db);
  if (!table) throw new Error("No supported coupon table was found");

  const discountPercent = Number(body.discount_percent ?? 0);
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
    throw new Error("discount_percent must be between 1 and 100");
  }

  const applicableProduct = (body.applicable_product || "all").trim().toLowerCase();
  const validityDays = Number(body.validity_days ?? 30);
  const validUntil = body.valid_until
    ? new Date(body.valid_until)
    : new Date(Date.now() + (Number.isFinite(validityDays) ? validityDays : 30) * 86400000);

  if (Number.isNaN(validUntil.getTime())) throw new Error("Invalid validity date");

  const code = (body.voucher_code || generateVoucherCode()).trim().toUpperCase();
  const nowIso = new Date().toISOString();
  const maxUses = Math.max(1, Number(body.max_uses ?? 1));

  if (table === "discount_coupons") {
    const payload: JsonRecord = {
      code,
      discount_percent: discountPercent,
      partner_name: "Share2Inspire Support",
      description: `Voucher de suporte gerado para ${message.email || "cliente sem email"}`,
      applicable_products: [applicableProduct],
      max_uses: maxUses,
      current_uses: 0,
      valid_until: validUntil.toISOString(),
      is_active: true,
    };
    const { data, error } = await db.from(table).insert(payload).select("*").single();
    if (error) throw new Error(`Could not create voucher in ${table}: ${error.message}`);
    return { table, code, valid_until: validUntil.toISOString(), record: data };
  }

  if (["discount_codes", "coupons"].includes(table)) {
    const payload: JsonRecord = {
      code,
      discount_percent: discountPercent,
      applicable_products: [applicableProduct],
      valid_from: nowIso,
      valid_until: validUntil.toISOString(),
      max_uses: maxUses,
      current_uses: 0,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
    };
    const { data, error } = await db.from(table).insert(payload).select("*").single();
    if (error) throw new Error(`Could not create voucher in ${table}: ${error.message}`);
    return { table, code, valid_until: validUntil.toISOString(), record: data };
  }


  const voucherPayload: JsonRecord = {
    code,
    email: message.email || null,
    plan_name: applicableProduct === "all" ? "Support Voucher" : applicableProduct,
    total_analyses: maxUses,
    used_analyses: 0,
    amount_paid: "0",
    payment_method: "support",
    voucher_type: applicableProduct === "all" ? "support" : applicableProduct,
    includes_career_path: applicableProduct === "career_path",
    is_active: true,
    created_at: nowIso,
  };

  const { data, error } = await db.from(table).insert(voucherPayload).select("*").single();
  if (error) throw new Error(`Could not create voucher in ${table}: ${error.message}`);
  return { table, code, valid_until: validUntil.toISOString(), record: data };
}

async function sendBrevoEmail(params: { toEmail: string; toName?: string | null; subject: string; htmlContent: string; }) {
  if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY is not configured");

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: BRAND_NAME, email: "geral@share2inspire.pt" },
      to: [{ email: params.toEmail, name: params.toName || undefined }],
      subject: params.subject,
      htmlContent: params.htmlContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo send failed: ${errorText}`);
  }

  return response.json();
}

async function markMessageResponded(db: ReturnType<typeof supabaseAdmin>, message: ContactMessage, finalReply: string) {
  const nowIso = new Date().toISOString();
  const updateAttempts: JsonRecord[] = [
    { responded_at: nowIso, status: "responded", reply_text: finalReply, updated_at: nowIso },
    { responded_at: nowIso, reply_text: finalReply, updated_at: nowIso },
    { status: "responded", reply_text: finalReply, updated_at: nowIso },
    { status: "responded", updated_at: nowIso },
    {
      admin_notes: `${message.admin_notes ? `${message.admin_notes}\n\n` : ""}[Support reply ${nowIso}]\n${finalReply.slice(0, 1200)}`,
    },
  ];

  const errors: string[] = [];
  for (const payload of updateAttempts) {
    const { error } = await db.from("contact_messages").update(payload).eq("id", message.id);
    if (!error) return { success: true, payload };
    errors.push(error.message);
  }

  return { success: false, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  try {
    await requireAdmin(req);

    const body = await req.json() as RequestBody;
    const action = body.action;
    const messageId = Number(body.message_id);

    if (!action || !["suggest_reply", "send_reply", "generate_voucher"].includes(action)) {
      return jsonResponse({ success: false, error: "Invalid action" }, 400);
    }

    if (!Number.isFinite(messageId) || messageId <= 0) {
      return jsonResponse({ success: false, error: "Invalid message_id" }, 400);
    }

    const db = supabaseAdmin();
    const message = await getMessage(db, messageId);
    const lang = detectLanguage(message);

    if (action === "suggest_reply") {
      const result = await callGeminiCompatibleJSON(buildSuggestionsPrompt(message, lang));
      const suggestions = Array.isArray(result?.suggestions)
        ? result.suggestions
            .filter((item: unknown) => item && typeof item === "object")
            .slice(0, 3)
        : [];

      return jsonResponse({
        success: true,
        action,
        language: lang,
        message_id: message.id,
        suggestions,
      });
    }

    if (action === "generate_voucher") {
      const voucher = await createVoucher(db, message, body);
      return jsonResponse({
        success: true,
        action,
        language: lang,
        message_id: message.id,
        voucher_code: voucher.code,
        valid_until: voucher.valid_until,
        table_used: voucher.table,
        applicable_product: body.applicable_product || "all",
        discount_percent: body.discount_percent,
      });
    }

    const manualReply = (body.reply_text || "").trim();
    const autoReply = manualReply
      ? null
      : await callGeminiCompatibleJSON(buildSingleReplyPrompt(message, lang));

    const finalSubject = (body.reply_subject || autoReply?.subject || `Re: ${message.subject || langLabels(lang).subjectFallback}`).trim();
    const finalReply = (manualReply || autoReply?.body || "").trim();
    if (!finalReply) {
      return jsonResponse({ success: false, error: "reply_text is required when no automatic reply can be generated" }, 400);
    }

    if (!message.email) {
      return jsonResponse({ success: false, error: "The contact message does not have an email address" }, 400);
    }

    const sendResult = await sendBrevoEmail({
      toEmail: message.email,
      toName: message.name || null,
      subject: finalSubject,
      htmlContent: buildEmailHtml({
        lang,
        recipientName: message.name || null,
        replyText: finalReply,
        subject: message.subject || null,
        voucherCode: body.voucher_code || null,
      }),
    });

    const updateResult = await markMessageResponded(db, message, finalReply);

    return jsonResponse({
      success: true,
      action,
      language: lang,
      message_id: message.id,
      email: message.email,
      subject: finalSubject,
      reply_text: finalReply,
      email_result: sendResult,
      message_updated: updateResult.success,
      update_details: updateResult,
      message: langLabels(lang).replySent,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    console.error("support-reply error", {
      status,
      message: error instanceof Error ? error.message : "Unexpected error",
    });

    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    }, status);
  }
});
