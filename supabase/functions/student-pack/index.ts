const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_MODES = new Set(["cv_extraction", "linkedin_roast"]);

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
    const body = await req.json();
    const mode = String(body?.mode || "").trim();

    if (!ALLOWED_MODES.has(mode)) {
      return new Response(JSON.stringify({ success: false, error: `Modo não permitido em student-pack: ${mode}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ success: false, error: "SUPABASE_URL não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authorization = req.headers.get("authorization") || "";
    const apikey = req.headers.get("apikey") || "";

    const proxyResponse = await fetch(`${supabaseUrl}/functions/v1/hyper-task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { authorization } : {}),
        ...(apikey ? { apikey } : {}),
      },
      body: JSON.stringify(body),
    });

    const responseText = await proxyResponse.text();
    return new Response(responseText, {
      status: proxyResponse.status,
      headers: {
        ...corsHeaders,
        "Content-Type": proxyResponse.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
