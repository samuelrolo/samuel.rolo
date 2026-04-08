import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const JSON_H = { ...CORS, "Content-Type": "application/json" };

const MIN_SAMPLES = 3;
const FULL_CONF   = 20;
const PRICE_PREMIUM = 4.99;

function supabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

interface CompPackage {
  country: string; fn: string; industry: string; seniority: string;
  monthly: number; currency: string; months: number;
  bonus_pct: number; bonus_type: string;
  car: string; health: string; pension_pct: number;
  meal_daily: number; flex_annual: number;
  phone?: string;
  remote?: string;
  other_income_annual?: number;
  other_income_items?: Array<{ description: string; amount_annual: number }>;
  tier?: "free" | "premium";
  analysis_id?: number;
  transaction_id?: string;
  payment_method?: string;
  user_email?: string;
  user_name?: string;
}

function computeCTC(p: CompPackage) {
  const base    = p.monthly * p.months;
  const bonus   = base * (p.bonus_pct / 100);
  const car     = ({ none:0, conventional:6000, ev_partial:9000, ev_full:14000 } as Record<string,number>)[p.car] ?? 0;
  const health  = ({ none:0, self:1200, family:2400 } as Record<string,number>)[p.health] ?? 0;
  const pension = base * (p.pension_pct / 100);
  const meal    = p.meal_daily * 220;
  const flex    = p.flex_annual;
  const phone   = p.phone === 'company' ? 600 : 0;
  const remote  = ({ presencial:0, hybrid:1200, full_remote:2400 } as Record<string,number>)[p.remote ?? 'presencial'] ?? 0;
  const other   = p.other_income_annual ?? 0;
  return { base, bonus, car, health, pension, meal, flex, phone, remote, other, ctc: base+bonus+car+health+pension+meal+flex+phone+remote+other };
}

function fmt(n: number) { return Math.round(n).toLocaleString(); }

async function fetchBenchmarkStats(p: CompPackage) {
  const db = supabase();
  const { data } = await db
    .from("comp_benchmark_stats")
    .select("*")
    .eq("country", p.country)
    .eq("fn", p.fn)
    .eq("industry", p.industry)
    .eq("seniority", p.seniority)
    .limit(1)
    .single();
  return data ?? null;
}

async function saveBenchmark(p: CompPackage, c: ReturnType<typeof computeCTC>, result: Record<string,unknown>, sampleSize: number, tier: string) {
  const db = supabase();
  await db.from("comp_benchmarks").insert({
    country: p.country, fn: p.fn, industry: p.industry, seniority: p.seniority,
    currency: p.currency, base_annual: Math.round(c.base),
    bonus_pct: p.bonus_pct, bonus_type: p.bonus_type, car: p.car, health: p.health,
    pension_pct: p.pension_pct, ctc: Math.round(c.ctc),
    ai_percentile_base: result.percentile_base ?? null,
    ai_percentile_total: result.percentile_total ?? null,
    tier, sample_size: sampleSize,
  });
}

async function saveAnalysis(p: CompPackage, c: ReturnType<typeof computeCTC>, freeResult: Record<string,unknown>): Promise<number | null> {
  const db = supabase();
  const { data, error } = await db.from("cv_analysis").insert({
    analysis_type: "salary_reality_check",
    payment_status: "pending",
    payment_amount: PRICE_PREMIUM,
    domain: "share2inspire.pt",
    user_email: p.user_email ?? null,
    user_name: p.user_name ?? null,
    analysis_result: {
      free: freeResult,
      package: {
        country: p.country, fn: p.fn, industry: p.industry, seniority: p.seniority,
        currency: p.currency, monthly: p.monthly, months: p.months,
        bonus_pct: p.bonus_pct, bonus_type: p.bonus_type, car: p.car, health: p.health,
        pension_pct: p.pension_pct, meal_daily: p.meal_daily, flex_annual: p.flex_annual,
        phone: p.phone, remote: p.remote,
        other_income_annual: p.other_income_annual ?? 0,
        other_income_items: p.other_income_items ?? [],
        computed: {
          base: Math.round(c.base), bonus: Math.round(c.bonus), car: Math.round(c.car),
          health: Math.round(c.health), pension: Math.round(c.pension),
          meal: Math.round(c.meal), flex: Math.round(c.flex),
          phone: Math.round(c.phone), remote: Math.round(c.remote),
          other: Math.round(c.other), ctc: Math.round(c.ctc),
        },
      },
    },
    created_at: new Date().toISOString(),
  }).select("id").single();
  if (error) { console.error("saveAnalysis error:", error); return null; }
  return data?.id ?? null;
}

async function verifyPayment(analysisId: number, transactionId?: string, paymentMethod?: string): Promise<boolean> {
  const db = supabase();
  const { data } = await db
    .from("cv_analysis")
    .select("payment_status")
    .eq("id", analysisId)
    .eq("analysis_type", "salary_reality_check")
    .single();

  if (data?.payment_status === "paid") return true;

  if (transactionId && (!paymentMethod || paymentMethod === "stripe")) {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (key) {
      try {
        const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${transactionId}`, {
          headers: { Authorization: `Bearer ${key}` },
        });
        const session = await res.json();
        if (session.payment_status === "paid") {
          await db.from("cv_analysis").update({
            payment_status: "paid",
            transaction_id: transactionId,
            payment_method: "stripe",
            updated_at: new Date().toISOString(),
          }).eq("id", analysisId);
          return true;
        }
      } catch (e) { console.error("Stripe verify error:", e); }
    }
  }
  return false;
}

function buildPrompt(p: CompPackage, c: ReturnType<typeof computeCTC>, isPremium: boolean, stats: Record<string,unknown> | null) {
  const sym = ({ EUR:"€", GBP:"£", USD:"$", CHF:"CHF", BRL:"R$", AOA:"Kz" } as Record<string,string>)[p.currency] ?? "€";
  const hasSufficientData  = stats !== null && Number(stats.sample_count) >= MIN_SAMPLES;
  const useRealPercentiles = stats !== null && Number(stats.sample_count) >= FULL_CONF;

  let benchCtx = "";
  if (hasSufficientData && stats) {
    const n = Number(stats.sample_count);
    benchCtx = `\n\n## Dados reais Share2Inspire (${n} análises para este perfil exacto)\nBase P25=${sym}${fmt(Number(stats.p25_base))} P50=${sym}${fmt(Number(stats.p50_base))} P75=${sym}${fmt(Number(stats.p75_base))} P90=${sym}${fmt(Number(stats.p90_base))}\nCTC P25=${sym}${fmt(Number(stats.p25_total))} P50=${sym}${fmt(Number(stats.p50_total))} P75=${sym}${fmt(Number(stats.p75_total))} P90=${sym}${fmt(Number(stats.p90_total))}\n${ useRealPercentiles ? `INSTRUÇÃO: usa EXACTAMENTE estes valores para p25/p50/p75/p90.` : `INSTRUÇÃO: usa estes dados como âncora principal. Complementa com o teu conhecimento de mercado.` }`;
  }

  let otherIncomeDesc = "";
  if (c.other > 0) {
    const items = p.other_income_items ?? [];
    if (items.length > 0) {
      otherIncomeDesc = `, outros rendimentos (${items.map(i => `${i.description}: ${sym}${fmt(i.amount_annual)}/ano`).join(', ')})=${sym}${fmt(c.other)}`;
    } else {
      otherIncomeDesc = `, outros rendimentos=${sym}${fmt(c.other)}/ano`;
    }
  }

  const phoneDesc = p.phone === 'company' ? `, telemóvel empresa=${sym}${fmt(c.phone)}` : "";
  const remoteDesc = p.remote && p.remote !== 'presencial' ? `, trabalho remoto (${p.remote})=${sym}${fmt(c.remote)}` : "";

  const profile = `Perfil: ${p.fn}, ${p.seniority}, ${p.industry}, ${p.country}.\nPacote: base ${sym}${fmt(c.base)}/ano (${p.months}m), bónus ${p.bonus_pct}% ${p.bonus_type}=${sym}${fmt(c.bonus)}, viatura ${p.car}=${sym}${fmt(c.car)}, saúde ${p.health}=${sym}${fmt(c.health)}, pensão ${p.pension_pct}%, refeição ${sym}${fmt(c.meal)}/ano, flex ${sym}${fmt(c.flex)}/ano${phoneDesc}${remoteDesc}${otherIncomeDesc}, CTC TOTAL ${sym}${fmt(c.ctc)}.`;

  const jsonFields = isPremium
    ? `{"percentile_base":<int>,"percentile_total":<int>,"p25_base":<int>,"p50_base":<int>,"p75_base":<int>,"p90_base":<int>,"p25_total":<int>,"p50_total":<int>,"p75_total":<int>,"p90_total":<int>,"market_label":"<máx 12 palavras PT>","differentiators":["<x>","<x>","<x>"],"strengths":"<3 frases PT>","considerations":"<3 frases PT>","strategic_advice":"<3 frases PT>","negotiation_tips":"<2 frases PT>","red_flags":["<risco se existir>"],"next_steps":["<acção 1>","<acção 2>","<acção 3>"]}`
    : `{"percentile_base":<int>,"percentile_total":<int>,"p25_base":<int>,"p50_base":<int>,"p75_base":<int>,"p90_base":<int>,"p25_total":<int>,"p50_total":<int>,"p75_total":<int>,"p90_total":<int>,"market_label":"<máx 12 palavras PT>","differentiators":["<x>","<x>","<x>"],"strengths":"<2 frases PT>","considerations":"<2 frases PT>","strategic_advice":"<1 frase teaser PT>"}`;

  return {
    prompt: `És um analista sénior de compensação global. Responde APENAS com JSON válido, sem markdown.\n\n${profile}${benchCtx}\n\nDevolve: ${jsonFields}`,
    useRealPercentiles,
  };
}

async function callGemini(prompt: string, isPremium: boolean): Promise<Record<string,unknown>> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");
  const model = isPremium ? "gemini-2.5-pro" : "gemini-3.1-flash-lite-preview";
  const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body: Record<string,unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: isPremium ? 2048 : 1024, responseMimeType: "application/json" },
  };
  if (isPremium) (body.generationConfig as Record<string,unknown>).thinkingConfig = { thinkingBudget: 8192 };
  const res = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").replace(/```json|```/g,"").trim();
  return JSON.parse(text);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error:"Method not allowed" }), { status:405, headers:JSON_H });

  try {
    const pkg = await req.json() as CompPackage;

    for (const f of ["country","fn","industry","seniority","monthly","currency","months"]) {
      if (!pkg[f as keyof CompPackage])
        return new Response(JSON.stringify({ error:`Campo obrigatório: ${f}` }), { status:400, headers:JSON_H });
    }

    const c            = computeCTC(pkg);
    const stats        = await fetchBenchmarkStats(pkg);
    const sampleCount  = Number(stats?.sample_count ?? 0);

    if (pkg.tier === "premium" && pkg.analysis_id) {
      const isPaid = await verifyPayment(pkg.analysis_id, pkg.transaction_id, pkg.payment_method);
      if (!isPaid) {
        return new Response(JSON.stringify({ error:"Pagamento não verificado" }), { status:402, headers:JSON_H });
      }
      const { prompt, useRealPercentiles } = buildPrompt(pkg, c, true, stats);
      const aiResult = await callGemini(prompt, true);
      const final = { ...aiResult };
      if (useRealPercentiles && stats) {
        final.p25_base=Math.round(Number(stats.p25_base)); final.p50_base=Math.round(Number(stats.p50_base));
        final.p75_base=Math.round(Number(stats.p75_base)); final.p90_base=Math.round(Number(stats.p90_base));
        final.p25_total=Math.round(Number(stats.p25_total)); final.p50_total=Math.round(Number(stats.p50_total));
        final.p75_total=Math.round(Number(stats.p75_total)); final.p90_total=Math.round(Number(stats.p90_total));
      }
      await supabase().from("cv_analysis").update({
        analysis_result: { ...(await supabase().from("cv_analysis").select("analysis_result").eq("id",pkg.analysis_id).single()).data?.analysis_result, premium: final },
        updated_at: new Date().toISOString(),
      }).eq("id", pkg.analysis_id);
      saveBenchmark(pkg, c, final, sampleCount, "premium");
      return new Response(JSON.stringify({
        ...final,
        computed: { base:Math.round(c.base), bonus:Math.round(c.bonus), car:Math.round(c.car), health:Math.round(c.health), pension:Math.round(c.pension), meal:Math.round(c.meal), flex:Math.round(c.flex), phone:Math.round(c.phone), remote:Math.round(c.remote), other:Math.round(c.other), ctc:Math.round(c.ctc) },
        meta: { tier:"premium", model:"gemini-2.5-pro", benchmark_source: sampleCount>=FULL_CONF?"real_data":sampleCount>=MIN_SAMPLES?"ai_anchored":"ai_only", sample_count:sampleCount },
      }), { status:200, headers:JSON_H });
    }

    const { prompt, useRealPercentiles } = buildPrompt(pkg, c, false, stats);
    const aiResult = await callGemini(prompt, false);
    const final = { ...aiResult };
    if (useRealPercentiles && stats) {
      final.p25_base=Math.round(Number(stats.p25_base)); final.p50_base=Math.round(Number(stats.p50_base));
      final.p75_base=Math.round(Number(stats.p75_base)); final.p90_base=Math.round(Number(stats.p90_base));
      final.p25_total=Math.round(Number(stats.p25_total)); final.p50_total=Math.round(Number(stats.p50_total));
      final.p75_total=Math.round(Number(stats.p75_total)); final.p90_total=Math.round(Number(stats.p90_total));
    }
    const analysisId = await saveAnalysis(pkg, c, final);
    saveBenchmark(pkg, c, final, sampleCount, "free");

    return new Response(JSON.stringify({
      ...final,
      computed: { base:Math.round(c.base), bonus:Math.round(c.bonus), car:Math.round(c.car), health:Math.round(c.health), pension:Math.round(c.pension), meal:Math.round(c.meal), flex:Math.round(c.flex), phone:Math.round(c.phone), remote:Math.round(c.remote), other:Math.round(c.other), ctc:Math.round(c.ctc) },
      analysis_id: analysisId,
      payment_amount: PRICE_PREMIUM,
      meta: { tier:"free", model:"gemini-3.1-flash-lite-preview", benchmark_source: sampleCount>=FULL_CONF?"real_data":sampleCount>=MIN_SAMPLES?"ai_anchored":"ai_only", sample_count:sampleCount },
    }), { status:200, headers:JSON_H });

  } catch (error) {
    console.error("salary-reality-check:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }), { status:500, headers:JSON_H });
  }
});
