import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const SUPABASE_URL = "https://cvlumvgrbuolrnwrtrgz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU2NzU3MTcsImV4cCI6MjAxMTI1MTcxN30.J4P_2r3hPA5M2f5sA3i-2a-pL_9z-401yV2i-i_4-yA";

const SCRAPE_LINKEDIN_BACKEND_URL = "https://share2inspire-beckend.lm.r.appspot.com/api/services/scrape-linkedin";
const HYPER_TASK_EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/hyper-task`;
const SEND_WELCOME_EMAIL_EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-welcome-email`;

async function testIscalPipeline() {
  try {
    const linkedinProfiles = [
      { linkedin_url: "https://www.linkedin.com/in/samuelrolo/", name: "Samuel Rolo", email: "samuel.rolo@gmail.com" },
    ];

    for (const profile of linkedinProfiles) {
      const { linkedin_url, name, email } = profile;

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

      console.log(`Generating LinkedIn Roast for ${email}`);
      const roastResponse = await fetch(HYPER_TASK_EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
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

      console.log(`Sending cold email to ${email}`);
      const sendEmailResponse = await fetch(SEND_WELCOME_EMAIL_EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: "iscal_cold_email",
          email,
          name,
          lang: "pt",
          score,
          highlights,
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

      console.log("Test completed successfully for profile:", profile.linkedin_url);
    }
  } catch (error) {
    console.error("Test script error:", error);
  }
}

testIscalPipeline();
