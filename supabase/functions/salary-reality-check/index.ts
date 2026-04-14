import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const JSON_H = { ...CORS, "Content-Type": "application/json" };

const MIN_SAMPLES = 3;
const FULL_CONF = 20;
const PRICE_PREMIUM = 4.99;
const PT_SPECIFIC_DEDUCTION = 4350;
const PT_EMPLOYEE_SS_RATE = 0.11;
const PT_DEPENDENT_CREDIT = 600;
const PT_SELF_DISABILITY_CREDIT = 1900;
const PT_DISABLED_DEPENDENT_CREDIT = 712.5;

const PT_PIT_BRACKETS = [
  { upTo: 8059, rate: 0.13 },
  { upTo: 12160, rate: 0.165 },
  { upTo: 17233, rate: 0.22 },
  { upTo: 22306, rate: 0.25 },
  { upTo: 28400, rate: 0.32 },
  { upTo: 41629, rate: 0.355 },
  { upTo: 44987, rate: 0.435 },
  { upTo: 83696, rate: 0.45 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.48 },
] as const;

type JsonRecord = Record<string, unknown>;

function supabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

interface CompPackage {
  country: string;
  fn: string;
  industry: string;
  seniority: string;
  monthly: number;
  currency: string;
  months: number;
  bonus_pct: number;
  bonus_type: string;
  car: string;
  health: string;
  pension_pct: number;
  meal_daily: number;
  flex_annual: number;
  phone?: string;
  remote?: string;
  other_income_annual?: number;
  other_income_items?: Array<{ description: string; amount_annual: number }>;
  dependents?: number;
  disability_self?: boolean;
  disability_dependent?: boolean;
  years_experience?: number;
  marital_status?: "single" | "married_two_holders" | "married_single_holder" | string;
  tier?: "free" | "premium";
  analysis_id?: number;
  transaction_id?: string;
  payment_method?: string;
  user_email?: string;
  user_name?: string;
}

function round(n: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round((n + Number.EPSILON) * factor) / factor;
}

function fmt(n: number) {
  return Math.round(n).toLocaleString();
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function carAnnualValue(car?: string) {
  return ({
    none: 0,
    conventional: 6000,
    company: 9000,
    avg: 9000,
    ev_partial: 9000,
    ev_full: 14000,
  } as Record<string, number>)[car ?? "none"] ?? 0;
}

function healthAnnualValue(health?: string) {
  return ({
    none: 0,
    self: 1200,
    family: 2400,
    company: 2400,
  } as Record<string, number>)[health ?? "none"] ?? 0;
}

function phoneAnnualValue(phone?: string) {
  return ({
    none: 0,
    company: 600,
  } as Record<string, number>)[phone ?? "none"] ?? 0;
}

function remoteAnnualValue(remote?: string) {
  return ({
    presencial: 0,
    hybrid: 1200,
    company: 1200,
    full_remote: 2400,
  } as Record<string, number>)[remote ?? "presencial"] ?? 0;
}

function computeCTC(p: CompPackage) {
  const base = p.monthly * p.months;
  const bonus = base * (p.bonus_pct / 100);
  const car = carAnnualValue(p.car);
  const health = healthAnnualValue(p.health);
  const pension = base * (p.pension_pct / 100);
  const meal = p.meal_daily * 220;
  const flex = p.flex_annual;
  const phone = phoneAnnualValue(p.phone);
  const remote = remoteAnnualValue(p.remote);
  const other = p.other_income_annual ?? 0;

  return {
    base,
    bonus,
    car,
    health,
    pension,
    meal,
    flex,
    phone,
    remote,
    other,
    ctc: base + bonus + car + health + pension + meal + flex + phone + remote + other,
  };
}

function computeProgressiveTax(taxableIncome: number) {
  let remaining = Math.max(0, taxableIncome);
  let lower = 0;
  let total = 0;

  for (const bracket of PT_PIT_BRACKETS) {
    if (remaining <= 0) break;
    const bandSize = bracket.upTo - lower;
    const taxableAtBand = Math.min(remaining, bandSize);
    total += taxableAtBand * bracket.rate;
    remaining -= taxableAtBand;
    lower = bracket.upTo;
  }

  return total;
}

function estimatePortugalNetSalary(p: CompPackage) {
  const annualGross = p.monthly * p.months;
  const grossMonthly = p.monthly;
  const ssAnnual = annualGross * PT_EMPLOYEE_SS_RATE;
  const ssContribution = grossMonthly * PT_EMPLOYEE_SS_RATE;
  const familyQuotient = (p.marital_status ?? "single") === "single" ? 1 : 2;
  const dependents = Math.max(0, Math.round(p.dependents ?? 0));

  const taxableAnnual = Math.max(0, annualGross - ssAnnual - PT_SPECIFIC_DEDUCTION);
  const taxablePerQuotient = taxableAnnual / familyQuotient;
  const grossPIT = computeProgressiveTax(taxablePerQuotient) * familyQuotient;

  const credits =
    dependents * PT_DEPENDENT_CREDIT +
    (p.disability_self ? PT_SELF_DISABILITY_CREDIT : 0) +
    (p.disability_dependent ? PT_DISABLED_DEPENDENT_CREDIT : 0);

  const irsAnnual = Math.max(0, grossPIT - credits);
  const annualNet = Math.max(0, annualGross - ssAnnual - irsAnnual);
  const netMonthly = annualNet / Math.max(1, p.months || 14);
  const irsMonthly = irsAnnual / Math.max(1, p.months || 14);
  const irsRate = annualGross > 0 ? (irsAnnual / annualGross) * 100 : 0;

  return {
    model: "pt_2025_2026_simplified",
    gross_annual: round(annualGross),
    gross_monthly: round(grossMonthly),
    ss_annual: round(ssAnnual),
    ss_contribution: round(ssContribution),
    taxable_annual: round(taxableAnnual),
    irs_annual: round(irsAnnual),
    irs_monthly: round(irsMonthly),
    net_annual: round(annualNet),
    net_monthly: round(netMonthly),
    irs_rate: round(irsRate, 2),
    assumptions: {
      marital_status: p.marital_status ?? "single",
      dependents,
      disability_self: Boolean(p.disability_self),
      disability_dependent: Boolean(p.disability_dependent),
      specific_deduction: PT_SPECIFIC_DEDUCTION,
      employee_ss_rate: PT_EMPLOYEE_SS_RATE,
    },
  };
}

function buildSimplifiedBenchmark(p50Total: number, ctc: number) {
  const median = Math.max(1, round(p50Total || ctc || 0));
  const low = round(median * 0.7);
  const high = round(median * 1.3);
  const span = Math.max(1, high - low);
  const positionPercent = round(clamp(((ctc - low) / span) * 100, 0, 100), 1);
  const variancePct = round(((ctc - median) / median) * 100, 1);

  let positionLabel = "Dentro da faixa";
  if (ctc < low) positionLabel = "Abaixo da faixa";
  if (ctc > high) positionLabel = "Acima da faixa";

  return {
    benchmark_low_total: low,
    benchmark_median_total: median,
    benchmark_high_total: high,
    ctc_position_percent: positionPercent,
    benchmark_variance_pct: variancePct,
    position_label: positionLabel,
  };
}

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

async function saveBenchmark(
  p: CompPackage,
  c: ReturnType<typeof computeCTC>,
  result: JsonRecord,
  sampleSize: number,
  tier: string,
) {
  const db = supabase();
  await db.from("comp_benchmarks").insert({
    country: p.country,
    fn: p.fn,
    industry: p.industry,
    seniority: p.seniority,
    currency: p.currency,
    base_annual: Math.round(c.base),
    bonus_pct: p.bonus_pct,
    bonus_type: p.bonus_type,
    car: p.car,
    health: p.health,
    pension_pct: p.pension_pct,
    ctc: Math.round(c.ctc),
    ai_percentile_base: result.percentile_base ?? null,
    ai_percentile_total: result.percentile_total ?? null,
    tier,
    sample_size: sampleSize,
  });
}

async function saveAnalysis(
  p: CompPackage,
  c: ReturnType<typeof computeCTC>,
  tax: ReturnType<typeof estimatePortugalNetSalary>,
  freeResult: JsonRecord,
): Promise<number | null> {
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
        country: p.country,
        fn: p.fn,
        industry: p.industry,
        seniority: p.seniority,
        years_experience: p.years_experience ?? null,
        marital_status: p.marital_status ?? "single",
        dependents: p.dependents ?? 0,
        disability_self: Boolean(p.disability_self),
        disability_dependent: Boolean(p.disability_dependent),
        currency: p.currency,
        monthly: p.monthly,
        months: p.months,
        bonus_pct: p.bonus_pct,
        bonus_type: p.bonus_type,
        car: p.car,
        health: p.health,
        pension_pct: p.pension_pct,
        meal_daily: p.meal_daily,
        flex_annual: p.flex_annual,
        phone: p.phone,
        remote: p.remote,
        other_income_annual: p.other_income_annual ?? 0,
        other_income_items: p.other_income_items ?? [],
        tax_summary: tax,
        computed: {
          base: Math.round(c.base),
          bonus: Math.round(c.bonus),
          car: Math.round(c.car),
          health: Math.round(c.health),
          pension: Math.round(c.pension),
          meal: Math.round(c.meal),
          flex: Math.round(c.flex),
          phone: Math.round(c.phone),
          remote: Math.round(c.remote),
          other: Math.round(c.other),
          ctc: Math.round(c.ctc),
          gross_monthly: tax.gross_monthly,
          net_monthly: tax.net_monthly,
          ss_contribution: tax.ss_contribution,
          irs_rate: tax.irs_rate,
        },
      },
    },
    created_at: new Date().toISOString(),
  }).select("id").single();

  if (error) {
    console.error("saveAnalysis error:", error);
    return null;
  }

  return data?.id ?? null;
}

async function verifyPayment(
  analysisId: number,
  transactionId?: string,
  paymentMethod?: string,
): Promise<boolean> {
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
      } catch (e) {
        console.error("Stripe verify error:", e);
      }
    }
  }

  return false;
}

function buildPrompt(
  p: CompPackage,
  c: ReturnType<typeof computeCTC>,
  tax: ReturnType<typeof estimatePortugalNetSalary>,
  isPremium: boolean,
  stats: JsonRecord | null,
) {
  const sym = ({ EUR: "€", GBP: "£", USD: "$", CHF: "CHF", BRL: "R$", AOA: "Kz" } as Record<string, string>)[p.currency] ?? "€";
  const hasSufficientData = stats !== null && Number(stats.sample_count) >= MIN_SAMPLES;
  const useRealPercentiles = stats !== null && Number(stats.sample_count) >= FULL_CONF;

  let benchCtx = "";
  if (hasSufficientData && stats) {
    const n = Number(stats.sample_count);
    benchCtx = `\n\n## Dados reais Share2Inspire (${n} análises para este perfil exacto)\nBase P25=${sym}${fmt(Number(stats.p25_base))} P50=${sym}${fmt(Number(stats.p50_base))} P75=${sym}${fmt(Number(stats.p75_base))} P90=${sym}${fmt(Number(stats.p90_base))}\nCTC P25=${sym}${fmt(Number(stats.p25_total))} P50=${sym}${fmt(Number(stats.p50_total))} P75=${sym}${fmt(Number(stats.p75_total))} P90=${sym}${fmt(Number(stats.p90_total))}\n${useRealPercentiles ? "INSTRUÇÃO: usa EXACTAMENTE estes valores para p25/p50/p75/p90." : "INSTRUÇÃO: usa estes dados como âncora principal. Complementa com conhecimento de mercado actual."}`;
  }

  let otherIncomeDesc = "";
  if (c.other > 0) {
    const items = p.other_income_items ?? [];
    if (items.length > 0) {
      otherIncomeDesc = `, outros rendimentos (${items.map((i) => `${i.description}: ${sym}${fmt(i.amount_annual)}/ano`).join(", ")})=${sym}${fmt(c.other)}`;
    } else {
      otherIncomeDesc = `, outros rendimentos=${sym}${fmt(c.other)}/ano`;
    }
  }

  const phoneDesc = p.phone === "company" ? `, telemóvel empresa=${sym}${fmt(c.phone)}` : "";
  const remoteDesc = p.remote && p.remote !== "presencial" ? `, trabalho remoto (${p.remote})=${sym}${fmt(c.remote)}` : "";

  const profile = [
    `Perfil: ${p.fn}, ${p.seniority}, ${p.industry}, ${p.country}.`,
    `Experiência: ${p.years_experience ?? 0} anos. Estado civil: ${p.marital_status ?? "single"}. Dependentes: ${p.dependents ?? 0}. Incapacidade própria >=65%: ${p.disability_self ? "sim" : "não"}. Dependente com incapacidade >=65%: ${p.disability_dependent ? "sim" : "não"}.`,
    `Pacote: base ${sym}${fmt(c.base)}/ano (${p.months}m), bónus ${p.bonus_pct}% ${p.bonus_type}=${sym}${fmt(c.bonus)}, viatura ${p.car}=${sym}${fmt(c.car)}, saúde ${p.health}=${sym}${fmt(c.health)}, pensão ${p.pension_pct}%, refeição ${sym}${fmt(c.meal)}/ano, flex ${sym}${fmt(c.flex)}/ano${phoneDesc}${remoteDesc}${otherIncomeDesc}, CTC TOTAL ${sym}${fmt(c.ctc)}.`,
    `Estimativa fiscal mensal (Portugal simplificado): bruto ${sym}${fmt(tax.gross_monthly)}, SS ${sym}${fmt(tax.ss_contribution)}, IRS ${sym}${fmt(tax.irs_monthly)}, líquido ${sym}${fmt(tax.net_monthly)}.`,
  ].join("\n");

  const freeJson = `{"percentile_base":<int>,"percentile_total":<int>,"p25_base":<int>,"p50_base":<int>,"p75_base":<int>,"p90_base":<int>,"p25_total":<int>,"p50_total":<int>,"p75_total":<int>,"p90_total":<int>,"market_label":"<máx 14 palavras PT>","differentiators":["<x>","<x>","<x>"],"market_context":"<3-4 frases PT>","strengths":"<5-6 frases PT detalhadas>","considerations":"<5-6 frases PT detalhadas>","strategic_advice":"<4-5 frases PT accionáveis>","red_flags":["<risco se existir>"],"next_steps":["<acção 1>","<acção 2>","<acção 3>"]}`;
  const premiumJson = `{"percentile_base":<int>,"percentile_total":<int>,"p25_base":<int>,"p50_base":<int>,"p75_base":<int>,"p90_base":<int>,"p25_total":<int>,"p50_total":<int>,"p75_total":<int>,"p90_total":<int>,"market_label":"<máx 14 palavras PT>","differentiators":["<x>","<x>","<x>"],"market_context":"<3-4 frases PT>","strengths":"<5-6 frases PT detalhadas>","considerations":"<5-6 frases PT detalhadas>","strategic_advice":"<4-5 frases PT accionáveis>","negotiation_tips":"<3-4 frases PT específicas>","red_flags":["<risco se existir>"],"next_steps":["<acção 1>","<acção 2>","<acção 3>"]}`;

  return {
    prompt:
      `És um analista sénior de compensação global e negociação salarial. Responde APENAS com JSON válido, sem markdown.\n\n` +
      `${profile}${benchCtx}\n\n` +
      `Instruções obrigatórias:\n` +
      `1) Personaliza TODA a análise ao perfil exacto (${p.fn}, ${p.industry}, ${p.country}, ${p.seniority}, ${p.years_experience ?? 0} anos).\n` +
      `2) Nunca escrevas texto genérico ou reutilizável. Usa contexto de mercado, senioridade, área funcional e geografia.\n` +
      `3) strengths deve ter 5-6 frases detalhadas sobre forças do pacote e leitura de mercado.\n` +
      `4) considerations deve ter 5-6 frases detalhadas sobre posicionamento, riscos e oportunidades.\n` +
      `5) strategic_advice deve ter 4-5 frases muito accionáveis e específicas.\n` +
      `6) market_context deve ter 3-4 frases sobre o estado do mercado para esta função/área/país.\n` +
      `7) differentiators e next_steps devem ser concretos e úteis.\n` +
      `8) Se existirem poucos dados reais, sê transparente no tom mas mantém a análise específica.\n\n` +
      `Devolve: ${isPremium ? premiumJson : freeJson}`,
    useRealPercentiles,
  };
}

async function callGemini(prompt: string, isPremium: boolean): Promise<JsonRecord> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");
  const model = isPremium ? "gemini-2.5-pro" : "gemini-3.1-flash-lite-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body: JsonRecord = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: isPremium ? 3072 : 2048,
      responseMimeType: "application/json",
    },
  };
  if (isPremium) {
    (body.generationConfig as JsonRecord).thinkingConfig = { thinkingBudget: 8192 };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "")
    .replace(/```json|```/g, "")
    .trim();

  return JSON.parse(text);
}

function enrichResult(
  aiResult: JsonRecord,
  c: ReturnType<typeof computeCTC>,
  tax: ReturnType<typeof estimatePortugalNetSalary>,
  stats: JsonRecord | null,
  useRealPercentiles: boolean,
) {
  const final: JsonRecord = { ...aiResult };

  if (useRealPercentiles && stats) {
    final.p25_base = Math.round(Number(stats.p25_base));
    final.p50_base = Math.round(Number(stats.p50_base));
    final.p75_base = Math.round(Number(stats.p75_base));
    final.p90_base = Math.round(Number(stats.p90_base));
    final.p25_total = Math.round(Number(stats.p25_total));
    final.p50_total = Math.round(Number(stats.p50_total));
    final.p75_total = Math.round(Number(stats.p75_total));
    final.p90_total = Math.round(Number(stats.p90_total));
  }

  const p50Total = asNumber(final.p50_total, asNumber(stats?.p50_total, c.ctc));
  const simplified = buildSimplifiedBenchmark(p50Total, c.ctc);

  return {
    ...final,
    ...simplified,
    gross_monthly: tax.gross_monthly,
    net_monthly: tax.net_monthly,
    irs_rate: tax.irs_rate,
    ss_contribution: tax.ss_contribution,
    tax_summary: tax,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: JSON_H });
  }

  try {
    const pkg = await req.json() as CompPackage;

    for (const field of ["country", "fn", "industry", "seniority", "monthly", "currency", "months"]) {
      if (!pkg[field as keyof CompPackage]) {
        return new Response(JSON.stringify({ error: `Campo obrigatório: ${field}` }), { status: 400, headers: JSON_H });
      }
    }

    const normalizedPkg: CompPackage = {
      ...pkg,
      dependents: Math.max(0, Math.round(pkg.dependents ?? 0)),
      disability_self: Boolean(pkg.disability_self),
      disability_dependent: Boolean(pkg.disability_dependent),
      years_experience: asNumber(pkg.years_experience, 0),
      marital_status: pkg.marital_status ?? "single",
    };

    const c = computeCTC(normalizedPkg);
    const tax = estimatePortugalNetSalary(normalizedPkg);
    const stats = await fetchBenchmarkStats(normalizedPkg);
    const sampleCount = Number(stats?.sample_count ?? 0);

    if (normalizedPkg.tier === "premium" && normalizedPkg.analysis_id) {
      const isPaid = await verifyPayment(normalizedPkg.analysis_id, normalizedPkg.transaction_id, normalizedPkg.payment_method);
      if (!isPaid) {
        return new Response(JSON.stringify({ error: "Pagamento não verificado" }), { status: 402, headers: JSON_H });
      }

      const { prompt, useRealPercentiles } = buildPrompt(normalizedPkg, c, tax, true, stats);
      const aiResult = await callGemini(prompt, true);
      const final = enrichResult(aiResult, c, tax, stats, useRealPercentiles);

      const currentAnalysis = await supabase()
        .from("cv_analysis")
        .select("analysis_result")
        .eq("id", normalizedPkg.analysis_id)
        .single();

      await supabase().from("cv_analysis").update({
        analysis_result: {
          ...(currentAnalysis.data?.analysis_result ?? {}),
          premium: final,
        },
        updated_at: new Date().toISOString(),
      }).eq("id", normalizedPkg.analysis_id);

      await saveBenchmark(normalizedPkg, c, final, sampleCount, "premium");

      return new Response(JSON.stringify({
        ...final,
        computed: {
          base: Math.round(c.base),
          bonus: Math.round(c.bonus),
          car: Math.round(c.car),
          health: Math.round(c.health),
          pension: Math.round(c.pension),
          meal: Math.round(c.meal),
          flex: Math.round(c.flex),
          phone: Math.round(c.phone),
          remote: Math.round(c.remote),
          other: Math.round(c.other),
          ctc: Math.round(c.ctc),
          gross_monthly: tax.gross_monthly,
          net_monthly: tax.net_monthly,
          ss_contribution: tax.ss_contribution,
          irs_rate: tax.irs_rate,
        },
        meta: {
          tier: "premium",
          model: "gemini-2.5-pro",
          benchmark_source: sampleCount >= FULL_CONF ? "real_data" : sampleCount >= MIN_SAMPLES ? "ai_anchored" : "ai_only",
          sample_count: sampleCount,
        },
      }), { status: 200, headers: JSON_H });
    }

    const { prompt, useRealPercentiles } = buildPrompt(normalizedPkg, c, tax, false, stats);
    const aiResult = await callGemini(prompt, false);
    const final = enrichResult(aiResult, c, tax, stats, useRealPercentiles);
    const analysisId = await saveAnalysis(normalizedPkg, c, tax, final);
    await saveBenchmark(normalizedPkg, c, final, sampleCount, "free");

    return new Response(JSON.stringify({
      ...final,
      computed: {
        base: Math.round(c.base),
        bonus: Math.round(c.bonus),
        car: Math.round(c.car),
        health: Math.round(c.health),
        pension: Math.round(c.pension),
        meal: Math.round(c.meal),
        flex: Math.round(c.flex),
        phone: Math.round(c.phone),
        remote: Math.round(c.remote),
        other: Math.round(c.other),
        ctc: Math.round(c.ctc),
        gross_monthly: tax.gross_monthly,
        net_monthly: tax.net_monthly,
        ss_contribution: tax.ss_contribution,
        irs_rate: tax.irs_rate,
      },
      analysis_id: analysisId,
      payment_amount: PRICE_PREMIUM,
      meta: {
        tier: "free",
        model: "gemini-3.1-flash-lite-preview",
        benchmark_source: sampleCount >= FULL_CONF ? "real_data" : sampleCount >= MIN_SAMPLES ? "ai_anchored" : "ai_only",
        sample_count: sampleCount,
      },
    }), { status: 200, headers: JSON_H });
  } catch (error) {
    console.error("salary-reality-check:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }), {
      status: 500,
      headers: JSON_H,
    });
  }
});
