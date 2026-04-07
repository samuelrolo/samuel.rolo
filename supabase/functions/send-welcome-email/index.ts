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
  const reviewText = isEn
    ? "How was your experience? Leave us a review"
    : "Como foi a tua experiência? Deixa-nos uma avaliação";
  const followText = isEn ? "Follow us" : "Segue-nos";
  const unsubText = isEn
    ? "You received this email because you interacted with Share2Inspire."
    : "Recebeste este email porque interagiste com o Share2Inspire.";
  const rightsText = isEn ? "All rights reserved." : "Todos os direitos reservados.";

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
  const firstName = name?.split(" ")[0] || (isEn ? "there" : "");
  const greeting = isEn ? `Hi ${firstName},` : `Olá ${firstName},`;

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
  const firstName = name?.split(" ")[0] || (isEn ? "there" : "");
  const greeting = isEn ? `Hi ${firstName},` : `Olá ${firstName},`;

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

/* ─── Template: Welcome after Member Registration ─── */
function memberWelcomeBody(name: string, lang: string): string {
  const isEn = lang === "en";
  const firstName = name?.split(" ")[0] || (isEn ? "there" : "");
  const greeting = isEn ? `Hi ${firstName},` : `Olá ${firstName},`;

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

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!type || !["cv_analysis", "member_signup", "student_pack"].includes(type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid type. Must be "cv_analysis", "member_signup" or "student_pack"' }),
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
    let subject: string;
    let bodyHtml: string;

    if (type === "cv_analysis") {
      subject = language === "en"
        ? "Welcome to Share2Inspire — Your CV Results Are Ready!"
        : "Bem-vindo ao Share2Inspire — Os Resultados do Teu CV Estão Prontos!";
      bodyHtml = cvAnalysisWelcomeBody(name || "", language);
    } else if (type === "student_pack") {
      subject = language === "en"
        ? "Welcome to Share2Inspire — Your Student Pack Is Ready!"
        : "Bem-vindo ao Share2Inspire — O Teu Student Pack Está Pronto!";
      bodyHtml = studentPackWelcomeBody(name || "", language);
    } else {
      subject = language === "en"
        ? "Welcome to Share2Inspire — Your Account Is Ready!"
        : "Bem-vindo ao Share2Inspire — A Tua Conta Está Pronta!";
      bodyHtml = memberWelcomeBody(name || "", language);
    }

    const htmlContent = wrapTemplate(bodyHtml, language);

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
        to: [{ email, name: name || email }],
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
    console.log(`Welcome email (${type}) sent to ${email}:`, brevoData);

    // Log to welcome_emails_log + email_history (fire-and-forget)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      if (supabaseUrl && supabaseKey) {
        // Log to welcome_emails_log (dashboard monitoring)
        await fetch(`${supabaseUrl}/rest/v1/welcome_emails_log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({
            email,
            name: name || null,
            type,
            lang: language,
            status: "sent",
            brevo_message_id: brevoData.messageId || null,
          }),
        });

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
            recipient_email: email,
            subject,
            body: bodyHtml,
              email_type: type === "cv_analysis"
                ? "welcome_cv_analysis"
                : type === "student_pack"
                  ? "welcome_student_pack"
                  : "welcome_member_signup",

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
