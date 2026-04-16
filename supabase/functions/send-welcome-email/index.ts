import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
const SENDER = { name: "Share2Inspire", email: "geral@share2inspire.pt" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* ═══════════════════════════════════════════════════════════════
   EMAIL TEMPLATES
   ═══════════════════════════════════════════════════════════════ */

function wrapTemplate(bodyHtml: string, lang: string = "pt"): string {
  const isEn = lang === "en";
  const isEs = lang === "es";
  const reviewText = isEn
    ? "How was your experience? Leave us a review"
    : isEs
      ? "¿Cómo fue tu experiencia? Déjanos una reseña"
      : "Como foi a tua experiência? Deixa-nos uma avaliação";
  const followText = isEn ? "Follow us" : isEs ? "Síguenos" : "Segue-nos";
  const unsubText = isEn
    ? "You received this email because you interacted with Share2Inspire."
    : isEs
      ? "Recibiste este correo porque interactuaste con Share2Inspire."
      : "Recebeste este email porque interagiste com o Share2Inspire.";
  const rightsText = isEn ? "All rights reserved." : isEs ? "Todos los derechos reservados." : "Todos os direitos reservados.";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- HEADER -->
<tr><td style="background:linear-gradient(135deg,#0a1628 0%,#162a4a 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
  <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" height="40" style="height:40px;margin-bottom:8px;">
  <div style="font-size:10px;color:#C9A961;letter-spacing:3px;text-transform:uppercase;font-weight:600;">Career Intelligence Platform</div>
</td></tr>

<!-- GOLD ACCENT LINE -->
<tr><td style="height:3px;background:linear-gradient(90deg,#C9A961,#e8d5a3,#C9A961);"></td></tr>

<!-- BODY -->
<tr><td style="background:#ffffff;padding:32px 32px 24px 32px;">
  ${bodyHtml}
</td></tr>

<!-- DIVIDER -->
<tr><td style="background:#ffffff;padding:0 32px;"><hr style="border:none;border-top:1px solid #e8e8ed;margin:0;"></td></tr>

<!-- GOOGLE REVIEW CTA -->
<tr><td style="background:#ffffff;padding:20px 32px;text-align:center;">
  <p style="font-size:13px;color:#555;margin:0 0 10px 0;">${reviewText}</p>
  <a href="https://g.page/r/CZS08nYUvP4qEAE/review" style="display:inline-block;background:#C9A961;color:#0a1628;padding:10px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">⭐ Google Review</a>
</td></tr>

<!-- FOOTER -->
<tr><td style="background:#0a1628;padding:24px 32px;border-radius:0 0 12px 12px;text-align:center;">
  <p style="margin:0 0 12px 0;font-size:12px;color:rgba(255,255,255,0.5);">${followText}</p>
  <p style="margin:0 0 16px 0;">
    <a href="https://www.linkedin.com/company/107046213" style="color:#C9A961;text-decoration:none;margin:0 8px;font-size:14px;">LinkedIn</a>
    <span style="color:rgba(255,255,255,0.2);">|</span>
    <a href="https://www.instagram.com/share2inspire_/" style="color:#C9A961;text-decoration:none;margin:0 8px;font-size:14px;">Instagram</a>
    <span style="color:rgba(255,255,255,0.2);">|</span>
    <a href="https://www.share2inspire.pt" style="color:#C9A961;text-decoration:none;margin:0 8px;font-size:14px;">Website</a>
  </p>
  <p style="margin:0 0 4px 0;font-size:11px;color:rgba(255,255,255,0.35);">${unsubText}</p>
  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);">&copy; 2026 Share2Inspire. ${rightsText}</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

/* ─── Template: Welcome after CV Analysis ─── */
function cvAnalysisWelcomeBody(name: string, lang: string): string {
  const isEn = lang === "en";
  const isEs = lang === "es";
  const firstName = name?.split(" ")[0] || (isEn ? "there" : "");
  const greeting = isEn ? `Hi ${firstName},` : isEs ? `Hola ${firstName},` : `Olá ${firstName},`;

  if (isEn) {
    return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">Welcome to Share2Inspire!</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Thank you for using our <strong>CV Analyser</strong>. Your resume has been analysed and your results are ready.</p>

<div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 8px 0;font-weight:600;">One step to get started:</p>
  <p style="font-size:14px;color:#555;margin:0;">See what your resume is missing based on what employers and ATS systems need today, with specific guidance for exactly what to adjust before applying.</p>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;">Want to go further? Explore our full suite of career tools:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/en/cv-analyser" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📊 CV Analyser Pro</a>
      <span style="font-size:13px;color:#777;"> — Unlock the full ATS Deep Scan, salary estimate & LinkedIn certification</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/en/career-path" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🗺️ Career Path</a>
      <span style="font-size:13px;color:#777;"> — Get a personalised career roadmap with market insights</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/en/linkedin-roaster" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🔥 LinkedIn Roaster</a>
      <span style="font-size:13px;color:#777;"> — Brutally honest feedback on your LinkedIn profile</span>
    </td>
  </tr>
</table>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/en/cv-analyser" style="display:inline-block;background:linear-gradient(135deg,#C9A961,#e8d5a3);color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Check your resume score</a>
</div>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">If you have any questions, simply reply to this email.<br><strong>The Share2Inspire Team</strong></p>`;
  }

  if (isEs) {
    return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">¡Bienvenido a Share2Inspire!</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Gracias por utilizar nuestro <strong>CV Analyser</strong>. Tu currículum ha sido analizado y los resultados están listos.</p>

<div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 8px 0;font-weight:600;">Un paso para empezar:</p>
  <p style="font-size:14px;color:#555;margin:0;">Descubre lo que le falta a tu CV según lo que los empleadores y los sistemas ATS buscan hoy, con orientación específica sobre qué ajustar antes de postularte.</p>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;">¿Quieres ir más lejos? Explora nuestras herramientas de carrera:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/es/cv-analyser" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📊 CV Analyser Pro</a>
      <span style="font-size:13px;color:#777;"> — Desbloquea el ATS Deep Scan completo, estimación salarial y certificación LinkedIn</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/es/career-path" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🗺️ Career Path</a>
      <span style="font-size:13px;color:#777;"> — Obtén una hoja de ruta profesional personalizada con datos del mercado</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/es/linkedin-roaster" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🔥 LinkedIn Roaster</a>
      <span style="font-size:13px;color:#777;"> — Feedback brutalmente honesto sobre tu perfil de LinkedIn</span>
    </td>
  </tr>
</table>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/es/cv-analyser" style="display:inline-block;background:linear-gradient(135deg,#C9A961,#e8d5a3);color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Consulta la puntuación de tu CV</a>
</div>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">Si tienes alguna pregunta, simplemente responde a este correo.<br><strong>El equipo Share2Inspire</strong></p>`;
  }

  return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">Bem-vindo ao Share2Inspire!</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Obrigado por utilizares o nosso <strong>CV Analyser</strong>. O teu currículo foi analisado e os resultados estão prontos.</p>

<div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 8px 0;font-weight:600;">Um passo para começar:</p>
  <p style="font-size:14px;color:#555;margin:0;">Descobre o que falta no teu CV com base no que os empregadores e sistemas ATS procuram hoje, com orientações específicas sobre o que ajustar antes de te candidatares.</p>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;">Queres ir mais longe? Explora as nossas ferramentas de carreira:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/cv-analyser" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📊 CV Analyser Pro</a>
      <span style="font-size:13px;color:#777;"> — Desbloqueia o ATS Deep Scan completo, estimativa salarial e certificação LinkedIn</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/career-path" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🗺️ Career Path</a>
      <span style="font-size:13px;color:#777;"> — Obtém um roadmap de carreira personalizado com insights de mercado</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/linkedin-roaster" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🔥 LinkedIn Roaster</a>
      <span style="font-size:13px;color:#777;"> — Feedback brutalmente honesto sobre o teu perfil LinkedIn</span>
    </td>
  </tr>
</table>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/cv-analyser" style="display:inline-block;background:linear-gradient(135deg,#C9A961,#e8d5a3);color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Verifica o score do teu CV</a>
</div>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">Se tiveres alguma dúvida, basta responder a este email.<br><strong>Equipa Share2Inspire</strong></p>`;
}

/* ─── Template: Welcome after Student Pack Purchase ─── */
function studentPackWelcomeBody(name: string, lang: string): string {
  const isEn = lang === "en";
  const isEs = lang === "es";
  const firstName = name?.split(" ")[0] || (isEn ? "there" : "");
  const greeting = isEn ? `Hi ${firstName},` : isEs ? `Hola ${firstName},` : `Olá ${firstName},`;

  if (isEn) {
    return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">Your Student Pack is ready!</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Thank you for purchasing the <strong>Student Pack</strong>. Your analysis is complete and your results are now available.</p>

<div style="background:#f0fdf4;border-left:4px solid #059669;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 8px 0;font-weight:600;">What is included in your pack:</p>
  <ul style="font-size:14px;color:#555;margin:0;padding-left:20px;line-height:1.8;">
    <li>A CV analysis with practical improvement guidance</li>
    <li>LinkedIn profile feedback to strengthen your positioning</li>
    <li>A clearer starting point for your job search strategy</li>
  </ul>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;">You can now review your results and continue exploring the Share2Inspire tools that best support your next career step.</p>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/en/student-pack/results" style="display:inline-block;background:linear-gradient(135deg,#059669,#34d399);color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">View my Student Pack results</a>
</div>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">If you have any questions, simply reply to this email.<br><strong>The Share2Inspire Team</strong></p>`;
  }

  if (isEs) {
    return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">¡Tu Student Pack está listo!</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Gracias por comprar el <strong>Student Pack</strong>. Tu análisis ha sido completado y los resultados ya están disponibles.</p>

<div style="background:#f0fdf4;border-left:4px solid #059669;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 8px 0;font-weight:600;">Lo que incluye tu pack:</p>
  <ul style="font-size:14px;color:#555;margin:0;padding-left:20px;line-height:1.8;">
    <li>Un análisis de CV con recomendaciones prácticas de mejora</li>
    <li>Feedback de perfil LinkedIn para reforzar tu posicionamiento</li>
    <li>Un punto de partida más claro para tu estrategia de búsqueda de empleo</li>
  </ul>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;">Ya puedes consultar tus resultados y seguir explorando las herramientas de Share2Inspire más adecuadas para tu próximo paso profesional.</p>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/es/student-pack/results" style="display:inline-block;background:linear-gradient(135deg,#059669,#34d399);color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Ver los resultados de mi Student Pack</a>
</div>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">Si tienes alguna pregunta, simplemente responde a este correo.<br><strong>El equipo Share2Inspire</strong></p>`;
  }

  return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">O teu Student Pack está pronto!</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Obrigado por comprares o <strong>Student Pack</strong>. A tua análise foi concluída e os resultados já estão disponíveis.</p>

<div style="background:#f0fdf4;border-left:4px solid #059669;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 8px 0;font-weight:600;">O que está incluído no teu pack:</p>
  <ul style="font-size:14px;color:#555;margin:0;padding-left:20px;line-height:1.8;">
    <li>Uma análise de CV com recomendações práticas de melhoria</li>
    <li>Feedback ao perfil LinkedIn para reforçares o teu posicionamento</li>
    <li>Um ponto de partida mais claro para a tua estratégia de procura de emprego</li>
  </ul>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;">Já podes consultar os teus resultados e continuar a explorar as ferramentas Share2Inspire mais adequadas para o teu próximo passo de carreira.</p>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/estudante/results" style="display:inline-block;background:linear-gradient(135deg,#059669,#34d399);color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Ver os resultados do meu Student Pack</a>
</div>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">Se tiveres alguma dúvida, basta responder a este email.<br><strong>Equipa Share2Inspire</strong></p>`;
}

/* ─── Template: Welcome after LinkedIn Roaster Purchase ─── */
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanInsight(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatLinkedinScoreLabel(value: unknown): string {
  const normalized = cleanInsight(value);
  if (!normalized) return "";
  if (normalized.includes("/")) return normalized;
  const numeric = Number(normalized.replace(',', '.'));
  if (Number.isFinite(numeric) && numeric > 0 && numeric <= 10) {
    return `${normalized}/10`;
  }
  return normalized;
}

function normalizeLinkedinScore(score: unknown, results?: any): string {
  const directScore = formatLinkedinScoreLabel(score);
  if (directScore) return directScore;

  const candidates = [
    results?.teaser?.nota_geral,
    results?.teaser?.overall_score,
    results?.score,
    results?.overall_score,
    results?.analise_completa?.nota_geral,
  ];

  for (const candidate of candidates) {
    const normalized = formatLinkedinScoreLabel(candidate);
    if (normalized) return normalized;
  }

  return "";
}

function getLinkedinHighlights(results?: any): string[] {
  const highlights: string[] = [];
  const candidates = [
    results?.teaser?.hook_vendas,
    results?.analise_completa?.dica_de_ouro,
    results?.analise_completa?.visibilidade_algoritmo ? `Visibilidade no algoritmo: ${results.analise_completa.visibilidade_algoritmo}` : "",
    Array.isArray(results?.analise_completa?.erros_criticos) ? results.analise_completa.erros_criticos[0] : "",
    Array.isArray(results?.analise_completa?.headlines_sugeridas) ? `Headline sugerida: ${results.analise_completa.headlines_sugeridas[0]}` : "",
    results?.analise_completa?.o_roast,
  ];

  for (const candidate of candidates) {
    const normalized = cleanInsight(candidate);
    if (!normalized) continue;
    if (highlights.includes(normalized)) continue;
    highlights.push(normalized);
    if (highlights.length === 2) break;
  }

  return highlights;
}

function renderLinkedinHighlights(highlights: string[]): string {
  if (!highlights.length) return "";
  return `<ul style="font-size:14px;color:#555;margin:0;padding-left:20px;line-height:1.8;">${highlights
    .map((highlight) => `<li>${escapeHtml(highlight)}</li>`)
    .join("")}</ul>`;
}

function linkedinRoasterWelcomeBody(name: string, lang: string, score?: unknown, results?: any): string {
  const isEn = lang === "en";
  const isEs = lang === "es";
  const firstName = name?.split(" ")[0] || (isEn ? "there" : "");
  const greeting = isEn ? `Hi ${firstName},` : isEs ? `Hola ${firstName},` : `Olá ${firstName},`;
  const scoreLabel = normalizeLinkedinScore(score, results);
  const highlights = getLinkedinHighlights(results);
  const scoreCard = scoreLabel
    ? `<div style="background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%);border:1px solid #fdba74;border-radius:10px;padding:18px 20px;margin:20px 0;">
  <p style="font-size:12px;color:#9a3412;margin:0 0 8px 0;font-weight:700;text-transform:uppercase;letter-spacing:.4px;">${isEn ? "LinkedIn Score" : isEs ? "Puntuación de LinkedIn" : "Score LinkedIn"}</p>
  <p style="font-size:24px;color:#9a3412;margin:0;font-weight:800;line-height:1.2;">${escapeHtml(
    isEn
      ? `Your LinkedIn profile scored ${scoreLabel}`
      : isEs
        ? `Tu perfil de LinkedIn obtuvo ${scoreLabel}`
        : `O teu perfil LinkedIn obteve ${scoreLabel}`,
  )}</p>
</div>`
    : "";
  const highlightsBlock = highlights.length
    ? `<div style="background:#f8fafc;border-left:4px solid #ea580c;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 10px 0;font-weight:700;">${isEn ? "Key highlights from your analysis:" : isEs ? "Aspectos clave de tu análisis:" : "Destaques principais da tua análise:"}</p>
  ${renderLinkedinHighlights(highlights)}
</div>`
    : "";

  if (isEn) {
    return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">Your LinkedIn Roast is ready! 🔥</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Thank you for using the <strong>LinkedIn Roaster</strong>. Your results are now available and already include a clear score plus practical priorities to improve your profile.</p>
${scoreCard}
${highlightsBlock}
<p style="font-size:15px;color:#333;line-height:1.7;">Open your report now to review the full roast and apply the recommendations to strengthen your LinkedIn presence.</p>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/en/linkedin-roaster/results" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#f97316);color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">View my LinkedIn Roast</a>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;margin-top:24px;">Want to go even further? Explore our other career tools:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/en/cv-analyser" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📊 CV Analyser</a>
      <span style="font-size:13px;color:#777;"> — Get a deep scan of your resume</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/en/career-path" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🗺️ Career Path</a>
      <span style="font-size:13px;color:#777;"> — Build your personalised career roadmap</span>
    </td>
  </tr>
</table>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">If you have any questions, simply reply to this email.<br><strong>The Share2Inspire Team</strong></p>`;
  }

  if (isEs) {
    return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">¡Tu LinkedIn Roast está listo! 🔥</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Gracias por usar el <strong>LinkedIn Roaster</strong>. Tus resultados ya están disponibles e incluyen una puntuación clara y prioridades concretas para mejorar tu perfil.</p>
${scoreCard}
${highlightsBlock}
<p style="font-size:15px;color:#333;line-height:1.7;">Abre tu informe ahora para ver el roast completo y aplicar las recomendaciones que pueden reforzar tu presencia en LinkedIn.</p>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/es/linkedin-roaster/results" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#f97316);color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Ver mi LinkedIn Roast</a>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;margin-top:24px;">¿Quieres ir más allá? Explora nuestras otras herramientas de carrera:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/es/cv-analyser" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📊 CV Analyser</a>
      <span style="font-size:13px;color:#777;"> — Obtén un escaneo profundo de tu currículum</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/es/career-path" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🗺️ Career Path</a>
      <span style="font-size:13px;color:#777;"> — Construye tu hoja de ruta profesional personalizada</span>
    </td>
  </tr>
</table>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">Si tienes alguna pregunta, simplemente responde a este correo.<br><strong>El equipo Share2Inspire</strong></p>`;
  }

  return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">Os teus resultados do LinkedIn Roaster estão prontos! 🔥</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Obrigado por utilizares o <strong>LinkedIn Roaster</strong>. Os teus resultados já estão disponíveis e incluem o score real do teu perfil, bem como prioridades concretas para o melhorares.</p>
${scoreCard}
${highlightsBlock}
<p style="font-size:15px;color:#333;line-height:1.7;">Abre agora o teu relatório completo para veres o roast na íntegra e aplicares as recomendações que podem reforçar a tua presença no LinkedIn.</p>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/linkedin-roaster/results" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#f97316);color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Ver o meu LinkedIn Roast</a>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;margin-top:24px;">Queres ir mais longe? Explora as nossas outras ferramentas de carreira:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/cv-analyser" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📊 CV Analyser</a>
      <span style="font-size:13px;color:#777;"> — Faz um scan profundo ao teu currículo</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/career-path" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🗺️ Career Path</a>
      <span style="font-size:13px;color:#777;"> — Constrói o teu roadmap de carreira personalizado</span>
    </td>
  </tr>
</table>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">Se tiveres alguma dúvida, basta responder a este email.<br><strong>Equipa Share2Inspire</strong></p>`;
}

/* ─── Template: Welcome after Member Registration ─── */
function iscalColdEmailBody(name: string, lang: string, score: string, highlights: any[], couponCode: string, partnershipRef: string, affiliateLinks: Record<string, string>): string {
  const isEn = lang === "en";
  const isEs = lang === "es";
  const firstName = name?.split(" ")[0] || (isEn ? "there" : "");
  const greeting = isEn ? `Hi ${firstName},` : isEs ? `Hola ${firstName},` : `Olá ${firstName},`;

  const scoreCard = score && score !== "N/A"
    ? `<div style="background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%);border:1px solid #fdba74;border-radius:10px;padding:18px 20px;margin:20px 0;">
  <p style="font-size:12px;color:#9a3412;margin:0 0 8px 0;font-weight:700;text-transform:uppercase;letter-spacing:.4px;">${isEn ? "LinkedIn Score" : isEs ? "Puntuación de LinkedIn" : "Score LinkedIn"}</p>
  <p style="font-size:24px;color:#9a3412;margin:0;font-weight:800;line-height:1.2;">${escapeHtml(
      isEn
        ? `Your LinkedIn profile scored ${score}`
        : isEs
          ? `Tu perfil de LinkedIn obtuvo ${score}`
          : `O teu perfil LinkedIn obteve ${score}`,
    )}</p>
</div>`
    : "";

  const highlightsBlock = highlights && highlights.length > 0
    ? `<div style="background:#f8fafc;border-left:4px solid #ea580c;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 10px 0;font-weight:700;">${isEn ? "Key highlights from your analysis:" : isEs ? "Aspectos clave de tu análisis:" : "Destaques principais da tua análise:"}</p>
  <ul style="font-size:14px;color:#555;margin:0;padding-left:20px;line-height:1.8;">
    ${highlights.map((h: any) => `<li><strong>${escapeHtml(h.area)}:</strong> ${escapeHtml(h.diagnostico)} - ${escapeHtml(h.recomendacao)}</li>`).join("")}
  </ul>
</div>`
    : "";

  const affiliateLinksHtml = affiliateLinks
    ? `<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">Explora mais ferramentas Share2Inspire:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  ${affiliateLinks.linkedin_roaster ? `<tr><td style="padding:4px 0;"><a href="https://${affiliateLinks.linkedin_roaster}" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🔥 LinkedIn Roaster</a></td></tr>` : ""}
  ${affiliateLinks.student_pack ? `<tr><td style="padding:4px 0;"><a href="https://${affiliateLinks.student_pack}" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🎓 Student Pack</a></td></tr>` : ""}
  ${affiliateLinks.cv_analyser ? `<tr><td style="padding:4px 0;"><a href="https://${affiliateLinks.cv_analyser}" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📊 CV Analyser</a></td></tr>` : ""}
</table>`
    : "";

  return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">Olá ${firstName}, o teu perfil LinkedIn foi analisado!</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Como parceiro oficial do ISCAL, a Share2Inspire tem o prazer de te apresentar uma análise gratuita do teu perfil LinkedIn. Vimos o panfleto nos corredores do ISCAL e queremos oferecer-te uma amostra do nosso trabalho.</p>
${scoreCard}
${highlightsBlock}
<p style="font-size:15px;color:#333;line-height:1.7;">Abre o teu relatório completo para veres todos os detalhes e as recomendações personalizadas para otimizar o teu perfil e destacares-te no mercado de trabalho.</p>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/linkedin-roaster/results" style="display:inline-block;background:linear-gradient(135deg,#ea580c,#f97316);color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Ver o meu LinkedIn Roast completo</a>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;margin-top:24px;">Como estudante do ISCAL, tens um desconto exclusivo de 25% em qualquer um dos nossos serviços. Usa o código **${couponCode}** no checkout.</p>

${affiliateLinksHtml}

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">Se tiveres alguma dúvida, basta responder a este email.<br><strong>A Equipa Share2Inspire</strong></p>`;
}

function memberWelcomeBody(name: string, lang: string): string {
  const isEn = lang === "en";
  const isEs = lang === "es";
  const firstName = name?.split(" ")[0] || (isEn ? "there" : "");
  const greeting = isEn ? `Hi ${firstName},` : isEs ? `Hola ${firstName},` : `Olá ${firstName},`;

  if (isEn) {
    return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">Welcome to Share2Inspire!</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Your account has been created successfully. You now have access to the <strong>Share2Inspire Member Area</strong> — your career intelligence hub.</p>

<div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 8px 0;font-weight:600;">What you can do now:</p>
  <ul style="font-size:14px;color:#555;margin:0;padding-left:20px;line-height:1.8;">
    <li>View and manage all your CV analyses</li>
    <li>Access your Career Path roadmap</li>
    <li>Track your professional progress</li>
    <li>Explore exclusive member content</li>
  </ul>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;">Start exploring your tools:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/en/area-cliente/dashboard" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📋 Dashboard</a>
      <span style="font-size:13px;color:#777;"> — Your personal career intelligence overview</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/en/cv-analyser" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📊 CV Analyser</a>
      <span style="font-size:13px;color:#777;"> — Analyse your resume with AI-powered insights</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/en/career-path" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🗺️ Career Path</a>
      <span style="font-size:13px;color:#777;"> — Build your personalised career roadmap</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/en/area-cliente/vagas" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">💼 Job Board</a>
      <span style="font-size:13px;color:#777;"> — Discover curated job opportunities</span>
    </td>
  </tr>
</table>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/en/area-cliente" style="display:inline-block;background:linear-gradient(135deg,#C9A961,#e8d5a3);color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Go to your Member Area</a>
</div>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">If you have any questions, simply reply to this email.<br><strong>The Share2Inspire Team</strong></p>`;
  }

  if (isEs) {
    return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">¡Bienvenido a Share2Inspire!</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">Tu cuenta ha sido creada con éxito. Ahora tienes acceso al <strong>Área de Miembro Share2Inspire</strong> — tu hub de inteligencia profesional.</p>

<div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 8px 0;font-weight:600;">Lo que puedes hacer ahora:</p>
  <ul style="font-size:14px;color:#555;margin:0;padding-left:20px;line-height:1.8;">
    <li>Ver y gestionar todos tus análisis de CV</li>
    <li>Acceder a tu hoja de ruta Career Path</li>
    <li>Seguir tu progreso profesional</li>
    <li>Explorar contenido exclusivo para miembros</li>
  </ul>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;">Empieza a explorar tus herramientas:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/es/area-cliente/dashboard" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📋 Dashboard</a>
      <span style="font-size:13px;color:#777;"> — Tu visión general de inteligencia profesional</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/es/cv-analyser" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📊 CV Analyser</a>
      <span style="font-size:13px;color:#777;"> — Analiza tu currículum con insights de IA</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/es/career-path" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🗺️ Career Path</a>
      <span style="font-size:13px;color:#777;"> — Construye tu hoja de ruta profesional personalizada</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/es/area-cliente/vagas" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">💼 Ofertas de Empleo</a>
      <span style="font-size:13px;color:#777;"> — Descubre oportunidades laborales seleccionadas</span>
    </td>
  </tr>
</table>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/es/area-cliente" style="display:inline-block;background:linear-gradient(135deg,#C9A961,#e8d5a3);color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Acceder al Área de Miembro</a>
</div>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">Si tienes alguna pregunta, simplemente responde a este correo.<br><strong>El equipo Share2Inspire</strong></p>`;
  }

  return `
<h1 style="font-size:24px;color:#0a1628;margin:0 0 8px 0;font-weight:700;">Bem-vindo ao Share2Inspire!</h1>
<p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px 0;">${greeting}</p>
<p style="font-size:15px;color:#333;line-height:1.7;">A tua conta foi criada com sucesso. Agora tens acesso à <strong>Área de Membro Share2Inspire</strong> — o teu hub de inteligência de carreira.</p>

<div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:20px 0;border-radius:4px;">
  <p style="font-size:14px;color:#333;margin:0 0 8px 0;font-weight:600;">O que podes fazer agora:</p>
  <ul style="font-size:14px;color:#555;margin:0;padding-left:20px;line-height:1.8;">
    <li>Ver e gerir todas as tuas análises de CV</li>
    <li>Aceder ao teu roadmap Career Path</li>
    <li>Acompanhar o teu progresso profissional</li>
    <li>Explorar conteúdo exclusivo para membros</li>
  </ul>
</div>

<p style="font-size:15px;color:#333;line-height:1.7;">Começa a explorar as tuas ferramentas:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/area-cliente/dashboard" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📋 Dashboard</a>
      <span style="font-size:13px;color:#777;"> — A tua visão geral de inteligência de carreira</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/cv-analyser" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">📊 CV Analyser</a>
      <span style="font-size:13px;color:#777;"> — Analisa o teu currículo com insights de IA</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/career-path" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">🗺️ Career Path</a>
      <span style="font-size:13px;color:#777;"> — Constrói o teu roadmap de carreira personalizado</span>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 0;">
      <a href="https://www.share2inspire.pt/area-cliente/vagas" style="color:#C9A961;font-weight:600;text-decoration:none;font-size:14px;">💼 Vagas</a>
      <span style="font-size:13px;color:#777;"> — Descobre oportunidades de emprego selecionadas</span>
    </td>
  </tr>
</table>

<div style="text-align:center;margin:24px 0 8px 0;">
  <a href="https://www.share2inspire.pt/area-cliente" style="display:inline-block;background:linear-gradient(135deg,#C9A961,#e8d5a3);color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Aceder à Área de Membro</a>
</div>

<p style="font-size:13px;color:#888;line-height:1.6;margin-top:20px;">Se tiveres alguma dúvida, basta responder a este email.<br><strong>Equipa Share2Inspire</strong></p>`;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN HANDLER
   ═══════════════════════════════════════════════════════════════ */

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const type = payload?.type || payload?.source;
    const email = payload?.email;
    const name = payload?.name;
    const lang = payload?.lang || payload?.language;
    const score = payload?.score;
    const results = payload?.results || payload?.analysis_result || payload?.analysis_json;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!normalizedEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!type || !["cv_analysis", "member_signup", "student_pack", "linkedin_roaster", "iscal_cold_email"].includes(type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid type. Must be "cv_analysis", "member_signup", "student_pack" or "linkedin_roaster"' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!BREVO_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "BREVO_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const language = lang || "pt";
    const emailType = type === "cv_analysis"
      ? "welcome_cv_analysis"
      : type === "student_pack"
        ? "welcome_student_pack"
        : type === "linkedin_roaster"
          ? "welcome_linkedin_roaster"
          ? "welcome_member_signup"
          : type === "iscal_cold_email"
            ? "iscal_cold_email";
    let subject: string;
    let bodyHtml: string;

    if (type === "cv_analysis") {
      subject = language === "en"
        ? "Welcome to Share2Inspire — Your CV Results Are Ready!"
        : language === "es"
          ? "¡Bienvenido a Share2Inspire — Los Resultados de Tu CV Están Listos!"
          : "Bem-vindo ao Share2Inspire — Os Resultados do Teu CV Estão Prontos!";
      bodyHtml = cvAnalysisWelcomeBody(name || "", language);
    } else if (type === "student_pack") {
      subject = language === "en"
        ? "Welcome to Share2Inspire — Your Student Pack Is Ready!"
        : language === "es"
          ? "¡Bienvenido a Share2Inspire — Tu Student Pack Está Listo!"
          : "Bem-vindo ao Share2Inspire — O Teu Student Pack Está Pronto!";
      bodyHtml = studentPackWelcomeBody(name || "", language);
    } else if (type === "linkedin_roaster") {
      subject = language === "en"
        ? "Your LinkedIn Roast is ready! 🔥"
        : language === "es"
          ? "¡Tu LinkedIn Roast está listo! 🔥"
          : "O teu LinkedIn Roast está pronto! 🔥";
      bodyHtml = linkedinRoasterWelcomeBody(name || "", language, score, results);
    } else {
      subject = language === "en"
        ? "Welcome to Share2Inspire — Your Account Is Ready!"
        : language === "es"
          ? "¡Bienvenido a Share2Inspire — Tu Cuenta Está Lista!"
          : "Bem-vindo ao Share2Inspire — A Tua Conta Está Pronta!";
      bodyHtml = memberWelcomeBody(name || "", language);
    } else if (type === "iscal_cold_email") {
      subject = "Análise Gratuita do Teu Perfil LinkedIn - Parceria ISCAL";
      bodyHtml = iscalColdEmailBody(
        name || "",
        language,
        score,
        payload.highlights || [],
        payload.coupon_code || "AEISCAL25%",
        payload.partnership_ref || "Como parceiro oficial do ISCAL",
        payload.affiliate_links || {}
      );
    }

    const htmlContent = wrapTemplate(bodyHtml, language);

    if (supabaseUrl && supabaseKey) {
      // Dedup check: look for any welcome email sent to this address+type in the last 24 hours
      const dedupUrl = `${supabaseUrl}/rest/v1/welcome_emails_log?select=id,email,created_at&type=eq.${encodeURIComponent(type)}&email=eq.${encodeURIComponent(normalizedEmail)}&status=in.(sent,pending)&created_at=gte.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}&limit=1`;
      const dedupRes = await fetch(dedupUrl, {
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      });

      if (dedupRes.ok) {
        const existing = await dedupRes.json();
        if (Array.isArray(existing) && existing.length > 0) {
          console.log(`Skipping duplicate welcome email (${type}) for ${normalizedEmail} — already sent/pending in last 24h`);
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: "duplicate_welcome_email" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        console.warn("Welcome email dedup check failed:", dedupRes.status, await dedupRes.text());
      }

      // Pre-send: insert a "pending" log entry to prevent race conditions
      try {
        await fetch(`${supabaseUrl}/rest/v1/welcome_emails_log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            name: name || null,
            type,
            lang: language,
            status: "pending",
            brevo_message_id: null,
          }),
        });
      } catch (lockErr) {
        console.warn("Failed to insert pending lock:", lockErr);
      }
    }

    // Send via Brevo API
    const brevoRes = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: normalizedEmail, name: name || normalizedEmail }],
        subject,
        htmlContent,
        replyTo: SENDER,
      }),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      console.error("Brevo API error:", brevoRes.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: `Brevo API error: ${brevoRes.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const brevoData = await brevoRes.json();
    console.log(`Welcome email (${type}) sent to ${normalizedEmail}:`, brevoData);

    // Log to welcome_emails_log + email_history (fire-and-forget)
    try {
      if (supabaseUrl && supabaseKey) {
        // Update the pending log entry to "sent" (or insert if pending entry failed)
        const updateUrl = `${supabaseUrl}/rest/v1/welcome_emails_log?email=eq.${encodeURIComponent(normalizedEmail)}&type=eq.${encodeURIComponent(type)}&status=eq.pending`;
        const updateRes = await fetch(updateUrl, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            status: "sent",
            brevo_message_id: brevoData.messageId || null,
          }),
        });
        // If no pending record was found to update, insert a new "sent" record
        if (!updateRes.ok || updateRes.status === 204) {
          // Check if any rows were actually updated by trying a count
          await fetch(`${supabaseUrl}/rest/v1/welcome_emails_log`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({
              email: normalizedEmail,
              name: name || null,
              type,
              lang: language,
              status: "sent",
              brevo_message_id: brevoData.messageId || null,
            }),
          }).catch(() => {});
        }

        // Log to email_history (general history)
        await fetch(`${supabaseUrl}/rest/v1/email_history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            recipient_email: normalizedEmail,
            subject,
            body: bodyHtml,
              email_type: emailType,

            sent_at: new Date().toISOString(),
            status: "sent",
          }),
        });
      }
    } catch (logErr) {
      console.warn("Failed to log email:", logErr);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: brevoData.messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
