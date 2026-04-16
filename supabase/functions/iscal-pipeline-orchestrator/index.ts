import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
const SENDER = { name: "Share2Inspire", email: "geral@share2inspire.pt" };

const SCRAPE_LINKEDIN_BACKEND_URL = "https://share2inspire-beckend.lm.r.appspot.com/api/services/scrape-linkedin";
const HYPER_TASK_EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/hyper-task`;
const SEND_WELCOME_EMAIL_EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-welcome-email`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { search_query } = await req.json();

    if (!search_query) {
      return new Response(JSON.stringify({ error: "Missing search_query" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 1. Search ISCAL profiles on LinkedIn via Apify (using the existing backend)
    // This part will need to be adapted to use the Apify actor directly or a custom endpoint
    // that allows specifying search queries like 'ISCAL' and returning multiple profiles.
    // For now, we'll simulate a single profile for demonstration.
    console.log(`Searching LinkedIn for: ${search_query}`);
    const linkedinProfiles = [
      { linkedin_url: "https://www.linkedin.com/in/example-iscal-student-1", name: "Aluno ISCAL 1", email: "aluno1@iscal.pt" },
      { linkedin_url: "https://www.linkedin.com/in/example-iscal-student-2", name: "Aluno ISCAL 2", email: "aluno2@iscal.pt" },
    ]; // Placeholder for actual Apify search results

    for (const profile of linkedinProfiles) {
      const { linkedin_url, name, email } = profile;

      // 2. Call existing backend for individual profile scraping
      console.log(`Scraping LinkedIn profile: ${linkedin_url}`);
      const scrapeResponse = await fetch(SCRAPE_LINKEDIN_BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedin_url }),
      });

      if (!scrapeResponse.ok) {
        console.error(`Failed to scrape ${linkedin_url}: ${scrapeResponse.status} ${await scrapeResponse.text()}`);
        continue;
      }

      const scrapeData = await scrapeResponse.json();
      const cv_text = scrapeData.cv_text;

      if (!cv_text) {
        console.warn(`No CV text found for ${linkedin_url}`);
        continue;
      }

      // 3. Call hyper-task edge function to generate the Roast
      console.log(`Generating LinkedIn Roast for ${email}`);
      const roastResponse = await fetch(HYPER_TASK_EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }, // Use SERVICE_ROLE_KEY for edge function call
        body: JSON.stringify({
          mode: "linkedin_roast",
          linkedin_url,
          email,
          cv_text,
          language: "pt",
        }),
      });

      if (!roastResponse.ok) {
        console.error(`Failed to generate roast for ${email}: ${roastResponse.status} ${await roastResponse.text()}`);
        continue;
      }

      const roastData = await roastResponse.json();
      const roastAnalysis = roastData.linkedin_roast;
      const score = roastAnalysis?.teaser?.nota_geral || "N/A";
      const highlights = roastAnalysis?.analise_completa?.areas_melhoria || [];

      // 4. Store results in linkedin_roaster_analyses (hyper-task should handle this, but we'll ensure email is present)
      // The hyper-task function already handles saving to linkedin_roaster_analyses.
      // We just need to ensure the email is passed correctly.

      // 5. Send personalized cold email
      console.log(`Sending cold email to ${email}`);
      const sendEmailResponse = await fetch(SEND_WELCOME_EMAIL_EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }, // Use SERVICE_ROLE_KEY for edge function call
        body: JSON.stringify({
          type: "iscal_cold_email", // New type for ISCAL cold email
          email,
          name,
          lang: "pt",
          score,
          highlights,
          // Additional data for the ISCAL cold email template
          coupon_code: "AEISCAL25%",
          partnership_ref: "Como parceiro oficial do ISCAL",
          affiliate_links: {
            linkedin_roaster: "share2inspire.pt/linkedin-roaster?ref=iscal",
            student_pack: "share2inspire.pt/estudante?ref=iscal",
            cv_analyser: "share2inspire.pt/cv-analyser?ref=iscal",
          },
        }),
      });

      if (!sendEmailResponse.ok) {
        console.error(`Failed to send email to ${email}: ${sendEmailResponse.status} ${await sendEmailResponse.text()}`);
      }
    }

    return new Response(JSON.stringify({ success: true, message: "ISCAL pipeline orchestrated successfully" }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("ISCAL pipeline orchestrator error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
