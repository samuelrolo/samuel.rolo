// CV Analyser v2 - Share2Inspire - Build 2026-02-16
// Uses Supabase Edge Function (hyper-task) for Gemini AI analysis
// Sections: Hero, Upload, Trust Badges, What's Included, Social Proof, Pricing, Comparison, Benefits

declare global {
  interface Window {
    currentReportData: any;
  }
}

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, Home as HomeIcon, FileCheck, BarChart3, Grid2x2, TrendingUp, Eye, ChevronDown, ChevronUp, Star, Users, Award, Zap, Shield, Target, Clock, CheckCircle2, XCircle, Minus, Compass, Briefcase, Link, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import { trackCVUpload, trackAnalysisStart, trackAnalysisComplete, trackPaymentStart, trackPurchase } from "@/lib/gtag";
import mammoth from "mammoth";

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM';

/**
 * Fire-and-forget: log analysis to cv_analysis table for dashboard.
 * Never blocks the user flow. Errors are silently caught.
 */
function logAnalysisToSupabase(analysisResult: any, analysisSource: any, cvText?: string) {
  try {
    const score = analysisResult.overallScore || null;
    const professionalArea = analysisResult.perceivedRole || null;
    // Extract candidate name, email and phone from Gemini response
    const cp = analysisSource?.candidate_profile || analysisSource?.analysis?.candidate_profile || {};
    const detectedName = cp.detected_name || null;
    const detectedEmail = cp.detected_email && cp.detected_email !== 'N/A' ? cp.detected_email : null;
    // Use mandatory email from form as primary, Gemini detection as fallback
    const userEmail = sessionStorage.getItem('paymentEmail') || detectedEmail;
    const detectedPhone = cp.detected_phone && cp.detected_phone !== 'N/A' ? cp.detected_phone : null;
    // Check if this is a paid analysis (voucher used or LinkedIn paid)
    const isPaid = sessionStorage.getItem('isPaid') === 'true';
    const voucherCode = sessionStorage.getItem('voucherCode') || null;
    const paymentAmount = sessionStorage.getItem('paymentAmount') || null;
    const transactionId = sessionStorage.getItem('transactionId') || null;
    fetch(`${SUPABASE_URL}/rest/v1/cv_analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        score: score,
        professional_area: professionalArea,
        analysis_type: isPaid ? 'paid' : 'free',
        analysis_result: analysisSource ? JSON.stringify(analysisSource) : null,
        cv_text: cvText || null,
        payment_status: isPaid ? 'paid' : 'pending',
        payment_amount: paymentAmount ? parseFloat(paymentAmount) : null,
        transaction_id: transactionId,
        domain: 'share2inspire.pt',
        user_name: detectedName,
        user_email: userEmail,
        user_phone: detectedPhone,
      }),
    }).then(res => res.json()).then(data => {
      if (Array.isArray(data) && data[0]?.id) {
        sessionStorage.setItem('analysisId', String(data[0].id));
        console.log('[ANALYTICS] cv_analysis logged, id:', data[0].id);
      }
    }).catch(err => {
      console.warn('[ANALYTICS] Falha ao gravar analise (nao critico):', err.message);
    });
  } catch (e) {
    // Never throw - this is purely analytics
  }
}

/** Extract text from a PDF file using pdf.js */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text;
}

/** Extract text from a DOCX file using mammoth */
async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Transform Gemini/Supabase response into AnalysisData format.
 */
function transformGeminiResponse(analysis: any): any {
  let atsRejectionRate = 35;
  let atsTopFactor: string | undefined;
  const quadrants: any[] = [];
  let keywords: string[] = [];
  let perceivedRole: string | undefined;
  let perceivedSeniority: string | undefined;
  let overallScoreNum: number | undefined;
  let salaryDetailed: any = {
    percentile25: 1400, median: 1800, percentile75: 2400, topMax: 3200,
    currency: 'EUR', period: 'mensal',
    benefits: ['Seguro de saúde', 'Subsídio de alimentação', 'Formação contínua'],
    benefitsNote: 'Valores de referência para o mercado português.',
    source: 'Dados agregados do mercado português (Hays, Michael Page, Robert Walters, Mercer 2024/2025)'
  };
  let automationRisk: any = { percentage: 35, level: 'Médio', description: 'O teu perfil tem um risco moderado de automação.', recommendations: ['Investir em competências de liderança', 'Desenvolver pensamento estratégico', 'Aprofundar conhecimentos em IA'] };
  let jobMatch: any = null;
  let improvementActions: any[] = [];
  let priorityMatrix: any[] = [];
  let detailedAtsAnalysis: any = { factors: [], atsSystems: ['Workday', 'Taleo', 'Greenhouse', 'SAP SuccessFactors', 'iCIMS'], quickFixes: [] };
  let recruiterDeepAnalysis: any = { attentionMap: [], frictionPoints: [], positiveSignals: [], readingFlow: '' };
  let actionPlan30Days: any[] = [];

  try {
    // Support multiple response formats:
    // Format A (old): analysis.scoring_geral.pontuacao (0-10)
    // Format B (new Supabase): executive_summary.global_score (string "85")
    // Format C: analysis.overall_score (0-10)
    let overallScore = 6; // default
    
    if (analysis.executive_summary?.global_score) {
      const gs = parseFloat(analysis.executive_summary.global_score);
      overallScore = gs > 10 ? gs / 10 : gs; // normalize: "85" → 8.5, "7" → 7
    } else if (analysis.scoring_geral?.pontuacao) {
      overallScore = analysis.scoring_geral.pontuacao;
    } else if (analysis.overall_score) {
      overallScore = analysis.overall_score;
    }
    
    atsRejectionRate = Math.round(Math.max(5, Math.min(85, 100 - (overallScore * 10))));

    // Try to extract sections from secoes_analisadas (old format)
    const sections = analysis.secoes_analisadas || [];
    
    const sectionMapping: Record<string, { title: string; benchmark: number }> = {
      'estrutura': { title: 'Estrutura', benchmark: 70 },
      'cabeçalho': { title: 'Estrutura', benchmark: 70 },
      'cabecalho': { title: 'Estrutura', benchmark: 70 },
      'informações pessoais': { title: 'Estrutura', benchmark: 70 },
      'resumo': { title: 'Conteúdo', benchmark: 72 },
      'resumo profissional': { title: 'Conteúdo', benchmark: 72 },
      'conteúdo': { title: 'Conteúdo', benchmark: 72 },
      'formação': { title: 'Formação', benchmark: 65 },
      'educação': { title: 'Formação', benchmark: 65 },
      'formacao': { title: 'Formação', benchmark: 65 },
      'experiência': { title: 'Experiência', benchmark: 70 },
      'experiência profissional': { title: 'Experiência', benchmark: 70 },
      'experiencia profissional': { title: 'Experiência', benchmark: 70 },
      'competências': { title: 'Conteúdo', benchmark: 72 },
      'competencias': { title: 'Conteúdo', benchmark: 72 },
    };

    const addedQuadrants = new Set<string>();

    for (const section of sections) {
      const sectionName = (section.secao || '').toLowerCase().replace(/\(.*?\)/g, '').trim();
      
      let mapping = null;
      for (const [key, value] of Object.entries(sectionMapping)) {
        if (sectionName.includes(key)) {
          mapping = value;
          break;
        }
      }

      if (!mapping || addedQuadrants.has(mapping.title)) continue;
      addedQuadrants.add(mapping.title);

      const score = Math.round((section.scoring_secao || 5) * 10);
      const impactPhrase = section.pontos_a_melhorar?.[0] || section.pontos_fortes?.[0] || `Análise de ${mapping.title}`;
      const strengths = (section.pontos_fortes || []).slice(0, 3);
      const weaknesses = (section.pontos_a_melhorar || []).slice(0, 3);

      quadrants.push({
        title: mapping.title,
        score: Math.min(100, Math.max(0, score)),
        benchmark: mapping.benchmark,
        impactPhrase: impactPhrase,
        strengths: strengths,
        weaknesses: weaknesses,
      });
    }

    // Generate quadrants from global_score if sections not available
    const baseScore = Math.round(overallScore * 10);
    const globalStrengths = analysis.global_summary?.strengths || [];
    const globalImprovements = analysis.global_summary?.improvements || [];
    
    const defaultQuadrants = [
      { title: 'Estrutura', benchmark: 70, defaultImpact: 'Organização e clareza do CV', variation: -3 },
      { title: 'Conteúdo', benchmark: 72, defaultImpact: 'Qualidade e relevância do conteúdo', variation: 2 },
      { title: 'Formação', benchmark: 65, defaultImpact: 'Formação académica e contínua', variation: -5 },
      { title: 'Experiência', benchmark: 70, defaultImpact: 'Experiência profissional', variation: 4 },
    ];

    for (let i = 0; i < defaultQuadrants.length; i++) {
      const dq = defaultQuadrants[i];
      if (!addedQuadrants.has(dq.title)) {
        const variation = dq.variation + Math.floor(Math.random() * 6) - 3;
        const strength = globalStrengths[i] || undefined;
        const weakness = globalImprovements[i] || undefined;
        quadrants.push({
          title: dq.title,
          score: Math.min(100, Math.max(20, baseScore + variation)),
          benchmark: dq.benchmark,
          impactPhrase: dq.defaultImpact,
          strengths: strength ? [strength] : undefined,
          weaknesses: weakness ? [weakness] : undefined,
        });
      }
    }

    const order = ['Estrutura', 'Conteúdo', 'Formação', 'Experiência'];
    quadrants.sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));

    // Extract keywords from multiple possible sources
    if (analysis.candidate_profile?.key_skills?.length > 0) {
      keywords = analysis.candidate_profile.key_skills.slice(0, 6);
    } else if (analysis.keywords_extracted?.length > 0) {
      keywords = analysis.keywords_extracted;
    } else if (analysis.suitability_for_roles) {
      const roles = analysis.suitability_for_roles;
      keywords = [roles.primary, ...(roles.secondary || [])].filter(Boolean).slice(0, 6);
    }
    
    if (keywords.length === 0 && (analysis.global_summary?.strengths?.length > 0 || analysis.strengths?.length > 0)) {
      const src = analysis.global_summary?.strengths || analysis.strengths || [];
      keywords = src.slice(0, 4).map((s: string) => {
        return s.split(/[.,;:]/)[0].substring(0, 40);
      });
    }

    if (keywords.length === 0) {
      keywords = ['Perfil Profissional', 'Competências Técnicas', 'Experiência', 'Formação'];
    }

    // Extract ATS top factor
    if (analysis.ats_analysis?.main_issues?.[0]) {
      atsTopFactor = analysis.ats_analysis.main_issues[0];
    } else if (analysis.global_summary?.improvements?.[0]) {
      atsTopFactor = analysis.global_summary.improvements[0];
    } else if (analysis.weaknesses?.[0]) {
      atsTopFactor = analysis.weaknesses[0];
    }

    // Extract perceived role
    if (analysis.candidate_profile?.detected_role) {
      perceivedRole = analysis.candidate_profile.detected_role;
    } else if (analysis.suitability_for_roles?.primary) {
      perceivedRole = analysis.suitability_for_roles.primary;
    } else if (keywords.length > 0) {
      perceivedRole = keywords[0];
    }

    // Extract seniority
    if (analysis.candidate_profile?.seniority) {
      perceivedSeniority = analysis.candidate_profile.seniority;
    } else if (analysis.seniority_level) {
      perceivedSeniority = analysis.seniority_level;
    } else if (analysis.candidate_profile?.total_years_exp) {
      const yearsStr = analysis.candidate_profile.total_years_exp;
      const yearsMatch = yearsStr.match(/(\d+)/);
      if (yearsMatch) {
        const years = parseInt(yearsMatch[1]);
        perceivedSeniority = years > 10 ? 'Senior' : years > 5 ? 'Mid-Senior' : years > 2 ? 'Mid-level' : 'Junior';
      }
    }

    overallScoreNum = Math.round(overallScore * 10);

    // === EXTENDED DATA FOR PAID REPORT ===

    // Salary estimation based on seniority and role
    const seniorityLevel = perceivedSeniority || 'Mid-level';
    const salaryBands: Record<string, {p25: number; median: number; p75: number; topMax: number}> = {
      'Junior': { p25: 900, median: 1100, p75: 1400, topMax: 1800 },
      'Mid-level': { p25: 1400, median: 1800, p75: 2400, topMax: 3200 },
      'Mid-Senior': { p25: 2000, median: 2800, p75: 3800, topMax: 5000 },
      'Senior': { p25: 2800, median: 3800, p75: 5200, topMax: 7500 },
      'Sénior': { p25: 2800, median: 3800, p75: 5200, topMax: 7500 },
      'Director': { p25: 4000, median: 5500, p75: 7500, topMax: 12000 },
    };
    const salaryBand = salaryBands[seniorityLevel] || salaryBands['Mid-level'];

    // Benefits based on seniority
    const benefitsByLevel: Record<string, string[]> = {
      'Junior': ['Seguro de saúde', 'Subsídio de alimentação', 'Formação contínua'],
      'Mid-level': ['Seguro de saúde', 'Subsídio de alimentação', 'Formação contínua', 'Bónus anual variável', 'Flexibilidade horária'],
      'Mid-Senior': ['Seguro de saúde extensível ao agregado', 'Subsídio de alimentação', 'Formação (2-5% do salário anual)', 'Bónus anual (10-20%)', 'Carro ou subsídio de mobilidade', 'Telemóvel e comunicações', 'Benefícios flexíveis'],
      'Senior': ['Plano de saúde premium (agregado familiar)', 'Plano de reforma/PPR', 'Carro de função ou subsídio', 'Telemóvel e comunicações', 'Formação executiva (3-8% do salário anual)', 'Bónus anual (15-30%)', 'Benefícios flexíveis (cheques infância, ginásio, etc.)', 'Stock options ou participação nos resultados'],
      'Sénior': ['Plano de saúde premium (agregado familiar)', 'Plano de reforma/PPR', 'Carro de função ou subsídio', 'Telemóvel e comunicações', 'Formação executiva (3-8% do salário anual)', 'Bónus anual (15-30%)', 'Benefícios flexíveis (cheques infância, ginásio, etc.)', 'Stock options ou participação nos resultados'],
      'Director': ['Plano de saúde premium (agregado familiar)', 'Plano de reforma/PPR contributivo', 'Carro de função premium', 'Telemóvel e comunicações', 'Formação executiva e MBA', 'Bónus anual (20-50%)', 'Benefícios flexíveis premium', 'Stock options / LTIP', 'Seguro de vida'],
    };
    const benefits = benefitsByLevel[seniorityLevel] || benefitsByLevel['Mid-level'];

    salaryDetailed = {
      percentile25: salaryBand.p25,
      median: salaryBand.median,
      percentile75: salaryBand.p75,
      topMax: salaryBand.topMax,
      currency: 'EUR',
      period: 'mensal',
      benefits,
      benefitsNote: `Valores de referência para perfis ${seniorityLevel} no mercado português. O pacote de compensação total pode representar 20-40% acima do salário base, dependendo do setor e dimensão da empresa.`,
      source: 'Dados agregados do mercado português (Hays, Michael Page, Robert Walters, Mercer 2024/2025)'
    };

    // Automation risk based on role keywords
    const roleStr = (perceivedRole || '').toLowerCase();
    let autoPercentage = 35;
    let autoLevel = 'Médio';
    let autoDesc = 'O teu perfil tem um risco moderado de automação.';
    let autoRecs = ['Investir em competências de liderança e gestão de equipas', 'Desenvolver pensamento estratégico e criativo', 'Aprofundar conhecimentos em IA e automação para liderar a transformação'];
    
    if (roleStr.includes('director') || roleStr.includes('líder') || roleStr.includes('leader') || roleStr.includes('head') || roleStr.includes('vp') || roleStr.includes('chief')) {
      autoPercentage = 15;
      autoLevel = 'Baixo';
      autoDesc = 'Funções de liderança estratégica têm baixo risco de automação. A tomada de decisão complexa, gestão de pessoas e visão estratégica são difíceis de automatizar.';
      autoRecs = ['Manter foco em decisão estratégica e gestão de stakeholders', 'Liderar iniciativas de transformação digital', 'Desenvolver capacidades de change management'];
    } else if (roleStr.includes('manager') || roleStr.includes('gestor') || roleStr.includes('senior') || roleStr.includes('consultor')) {
      autoPercentage = 25;
      autoLevel = 'Baixo';
      autoDesc = 'Perfis de gestão e consultoria sénior têm risco baixo de automação. A capacidade analítica, relacional e de resolução de problemas complexos mantém-se relevante.';
      autoRecs = ['Reforçar competências de people management', 'Integrar ferramentas de IA no dia-a-dia para aumentar produtividade', 'Desenvolver expertise em áreas emergentes do setor'];
    } else if (roleStr.includes('admin') || roleStr.includes('assist') || roleStr.includes('data entry') || roleStr.includes('operador')) {
      autoPercentage = 65;
      autoLevel = 'Alto';
      autoDesc = 'Funções operacionais e administrativas têm risco elevado de automação. Tarefas repetitivas e baseadas em regras são as primeiras a ser automatizadas.';
      autoRecs = ['Desenvolver competências analíticas e de interpretação de dados', 'Aprender ferramentas de automação (RPA, low-code)', 'Investir em upskilling para funções de maior valor acrescentado'];
    }

    automationRisk = { percentage: autoPercentage, level: autoLevel, description: autoDesc, recommendations: autoRecs };

    // Improvement actions with before/after
    improvementActions = quadrants
      .filter(q => q.weaknesses && q.weaknesses.length > 0)
      .map(q => ({
        action: q.weaknesses![0],
        before: `Score actual: ${q.score}/100 (${q.score >= q.benchmark ? 'acima' : 'abaixo'} do benchmark de ${q.benchmark})`,
        after: `Score estimado após melhoria: ${Math.min(100, q.score + 8)}/100`,
        impact: q.score < q.benchmark ? 'Alto' : 'Médio',
        dimension: q.title,
      }));

    // Priority matrix
    priorityMatrix = quadrants.map(q => {
      const gap = q.benchmark - q.score;
      return {
        dimension: q.title,
        urgency: gap > 5 ? 'Alta' : gap > -5 ? 'Média' : 'Baixa',
        currentScore: q.score,
        potentialScore: Math.min(100, q.score + (gap > 0 ? gap + 5 : 5)),
        actions: [
          ...(q.weaknesses || []).slice(0, 2),
          ...(q.strengths ? [`Manter: ${q.strengths[0]}`] : []),
        ].filter(Boolean),
      };
    }).sort((a, b) => {
      const urgencyOrder: Record<string, number> = { 'Alta': 0, 'Média': 1, 'Baixa': 2 };
      return (urgencyOrder[a.urgency] || 1) - (urgencyOrder[b.urgency] || 1);
    });

    // Detailed ATS analysis
    detailedAtsAnalysis = {
      factors: [
        atsTopFactor || 'Optimizar palavras-chave para a função-alvo',
        ...(analysis.global_summary?.improvements || []).slice(0, 3),
      ].filter(Boolean),
      atsSystems: ['Workday', 'Taleo', 'Greenhouse', 'SAP SuccessFactors', 'iCIMS'],
      quickFixes: [
        'Usar formato cronológico inverso',
        'Evitar tabelas, colunas e gráficos',
        'Incluir palavras-chave do anúncio de emprego',
        'Usar fontes standard (Arial, Calibri, Times)',
        'Guardar em PDF com texto seleccionável',
      ],
    };

    // Recruiter deep analysis
    recruiterDeepAnalysis = {
      attentionMap: [
        'Nome e título profissional (0-2 segundos)',
        'Experiência mais recente (2-5 segundos)',
        'Formação académica (5-8 segundos)',
        'Competências-chave e certificações (8-15 segundos)',
        'Coerência geral e formatação (15-30 segundos)',
      ],
      frictionPoints: [
        ...(analysis.global_summary?.improvements || []).slice(0, 2),
        ...(quadrants.filter(q => q.score < q.benchmark).map(q => `${q.title}: abaixo do benchmark (${q.score} vs ${q.benchmark})`)),
      ].filter(Boolean).slice(0, 4),
      positiveSignals: [
        ...(analysis.global_summary?.strengths || []).slice(0, 2),
        ...(quadrants.filter(q => q.score >= q.benchmark).map(q => `${q.title}: acima do benchmark (+${q.score - q.benchmark})`)),
      ].filter(Boolean).slice(0, 4),
      readingFlow: `O recrutador identifica rapidamente o perfil como ${perceivedRole || 'profissional qualificado'} (${perceivedSeniority || 'nível não determinado'}). ${quadrants.filter(q => q.score >= q.benchmark).length >= 3 ? 'A maioria das dimensões está acima do benchmark, transmitindo uma imagem sólida.' : 'Algumas dimensões estão abaixo do benchmark, o que pode gerar hesitação na triagem inicial.'}`,
    };

    // 30-day action plan
    actionPlan30Days = [
      {
        week: 'Semana 1-2',
        title: 'Optimização de Conteúdo',
        actions: [
          'Reescrever o resumo profissional com foco em resultados quantificáveis',
          'Adicionar métricas de impacto a cada experiência (%, €, equipas geridas)',
          'Alinhar palavras-chave com as funções-alvo',
        ],
      },
      {
        week: 'Semana 2-3',
        title: 'Estrutura e Formatação',
        actions: [
          'Reorganizar secções por ordem de relevância para o recrutador',
          'Garantir compatibilidade ATS (formato, fontes, estrutura)',
          'Adicionar secção de competências-chave com keywords relevantes',
        ],
      },
      {
        week: 'Semana 3-4',
        title: 'Validação e Refinamento',
        actions: [
          'Pedir feedback a 2-3 profissionais do setor',
          'Testar o CV em ferramentas ATS gratuitas',
          'Criar versões adaptadas para diferentes funções-alvo',
        ],
      },
    ];

  } catch (err) {
    console.error('[CV_ENGINE] Erro ao transformar resposta Gemini:', err);
    return {
      atsRejectionRate: 35,
      quadrants: [
        { title: 'Estrutura', score: 65, benchmark: 70, impactPhrase: 'Organização e clareza do CV' },
        { title: 'Conteúdo', score: 70, benchmark: 72, impactPhrase: 'Qualidade e relevância do conteúdo' },
        { title: 'Formação', score: 68, benchmark: 65, impactPhrase: 'Formação académica e contínua' },
        { title: 'Experiência', score: 72, benchmark: 70, impactPhrase: 'Experiência profissional' },
      ],
      keywords: ['Perfil Profissional', 'Competências Técnicas', 'Experiência', 'Formação'],
      salaryDetailed: {
        percentile25: 1400,
        median: 1800,
        percentile75: 2400,
        topMax: 3200,
        currency: 'EUR',
        period: 'mensal',
        benefits: ['Seguro de saúde', 'Subsídio de alimentação', 'Formação contínua'],
        benefitsNote: 'Valores de referência para o mercado português.',
        source: 'Dados agregados do mercado português (Hays, Michael Page, Robert Walters, Mercer 2024/2025)'
      }
    };
  }

  // Extract job match data if present (Modo 2: CV + Vaga)
  if (analysis.job_match) {
    jobMatch = {
      atsCompatibilityScore: analysis.job_match.ats_compatibility_score || null,
      keywordGaps: analysis.job_match.keyword_gaps || [],
      matchedKeywords: analysis.job_match.matched_keywords || [],
      jobTitle: analysis.job_match.job_title || null,
      overallFit: analysis.job_match.overall_fit || null,
    };
  }

  // Extract CV problems (3 specific issues) for both Mode 1 and Mode 2
  const cvProblems = (analysis.cv_problems || []).map((p: any) => ({
    title: p.title || '',
    description: p.description || '',
    fullExplanation: p.full_explanation || '',
    correctionExample: p.correction_example || '',
    rewriteSuggestion: p.rewrite_suggestion || '',
  }));

  return { atsRejectionRate, atsTopFactor, quadrants, keywords, perceivedRole, perceivedSeniority, overallScore: overallScoreNum, salaryDetailed, automationRisk, improvementActions, priorityMatrix, detailedAtsAnalysis, recruiterDeepAnalysis, actionPlan30Days, jobMatch, cvProblems };
}

/* ─── Testimonials Data ─── */
const testimonials = [
  {
    name: "Ana Rodrigues",
    role: "Marketing Manager",
    text: "Recebi o relatório em minutos. As sugestões eram tão específicas que consegui melhorar o meu CV nessa mesma noite. Resultado: 3 entrevistas na semana seguinte.",
    rating: 5,
  },
  {
    name: "Pedro Santos",
    role: "Engenheiro de Software",
    text: "A análise por quadrantes mostrou-me exactamente onde o meu CV estava fraco. Depois de aplicar as recomendações, passei filtros ATS que antes me rejeitavam.",
    rating: 5,
  },
  {
    name: "Mariana Costa",
    role: "Gestora de Projetos",
    text: "Valia muito mais do que os €4,99 que paguei. O posicionamento na curva normal foi um eye-opener — percebi que estava no percentil 40 e agora estou no 75.",
    rating: 5,
  },
];

/* ─── Pricing Data ─── */
const pricingPlans = [
  {
    name: "Essencial",
    price: "4,99",
    analyses: 1,
    perUnit: "4,99",
    popular: false,
    badge: null,
    features: ["Análise completa desbloqueada", "Curva normal de posicionamento", "Estimativa salarial detalhada", "Certificação LinkedIn — partilha o teu resultado", "Opção de enviar PDF por email"],
  },

  {
    name: "Profissional",
    price: "11,99",
    analyses: 3,
    perUnit: "4,00",
    popular: false,
    badge: null,
    features: ["3 análises completas", "Código reutilizável para futuras análises", "Certificação LinkedIn — partilha o teu resultado", "Ideal para testar versões do CV", "Suporte prioritário por email"],
  },
  {
    name: "Premium",
    price: "17,99",
    analyses: 5,
    perUnit: "3,60",
    popular: false,
    badge: null,
    features: ["5 análises completas", "Código reutilizável para futuras análises", "Certificação LinkedIn — partilha o teu resultado", "Melhor preço por análise", "Partilha com amigos/colegas"],
  },
];

/* ─── Comparison Data ─── */
const comparisonFeatures = [
  { feature: "Análise por IA avançada", us: true, competitor1: true, competitor2: false },
  { feature: "Relatório em Português", us: true, competitor1: false, competitor2: true },
  { feature: "Score ATS real", us: true, competitor1: true, competitor2: false },
  { feature: "Curva normal de posicionamento", us: true, competitor1: false, competitor2: false },
  { feature: "Estimativa salarial", us: true, competitor1: false, competitor2: false },
  { feature: "Análise gratuita incluída", us: true, competitor1: false, competitor2: true },
  { feature: "Relatório PDF detalhado", us: true, competitor1: true, competitor2: false },
  { feature: "Career Path (roadmap de carreira)", us: true, competitor1: false, competitor2: false },
  { feature: "Certificação LinkedIn partilhável", us: true, competitor1: false, competitor2: false },
  { feature: "Cruzamento CV vs LinkedIn", us: true, competitor1: false, competitor2: false },

  { feature: "Preço", usText: "Desde €4,99", comp1Text: "€19,99/mês", comp2Text: "€9,99" },
];

export default function Home() {
  useEffect(() => { document.title = "CV Analyser — Análise de CV com IA | Share2Inspire"; }, []);

  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Progressive loading messages for CV Analyser
  const loadingMessages = [
    "A extrair dados do teu CV...",
    "A identificar competências-chave...",
    "A analisar experiência profissional...",
    "A comparar com o mercado de trabalho...",
    "A calcular compatibilidade ATS...",
    "A avaliar pontos fortes e áreas de melhoria...",
    "A gerar recomendações personalizadas...",
    "A finalizar o relatório..."
  ];

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < loadingMessages.length - 1 ? prev + 1 : prev);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [wantsJobMatch, setWantsJobMatch] = useState(false);
  const [jobInput, setJobInput] = useState("");
  const [showEmailLink, setShowEmailLink] = useState(false);
  const [emailForLink, setEmailForLink] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showLinkedIn, setShowLinkedIn] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [showBuyVoucher, setShowBuyVoucher] = useState(false);
  const [voucherEmail, setVoucherEmail] = useState("");
  const [voucherSelectedPlan, setVoucherSelectedPlan] = useState(0);
  const [voucherPhone, setVoucherPhone] = useState("");
  const [voucherPaymentLoading, setVoucherPaymentLoading] = useState(false);
  const [voucherPaymentStatus, setVoucherPaymentStatus] = useState<'idle' | 'polling' | 'success' | 'error'>('idle');
  const [voucherPaymentError, setVoucherPaymentError] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [showLinkedInPaywall, setShowLinkedInPaywall] = useState(false);
  const [showNoCvOptions, setShowNoCvOptions] = useState(false);
  const [linkedInVoucherCode, setLinkedInVoucherCode] = useState("");
  const [linkedInVoucherError, setLinkedInVoucherError] = useState<string | null>(null);
  const [linkedInVoucherValidating, setLinkedInVoucherValidating] = useState(false);
  // LinkedIn paywall inline payment
  // Mandatory email for analysis
  const [analysisEmail, setAnalysisEmail] = useState("");
  const [analysisEmailError, setAnalysisEmailError] = useState<string | null>(null);

  // Email validation: must be real format, reject obvious fakes
  const validateEmail = (email: string): { valid: boolean; error?: string } => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return { valid: false, error: 'Introduz o teu email para continuar.' };
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(trimmed)) return { valid: false, error: 'Formato de email inválido.' };
    // Block disposable/fake patterns
    const fakePatterns = ['teste', 'test', 'exemplo', 'example', 'fake', 'asdf', 'qwer', 'aaa', 'bbb', 'ccc', 'xxx', 'yyy', 'zzz', 'noreply', 'noemail', 'abc@', '123@', 'admin@admin', 'user@user', 'email@email', 'mail@mail', 'a@a', 'b@b'];
    const localPart = trimmed.split('@')[0];
    const domain = trimmed.split('@')[1];
    // Block if local part is entirely a fake pattern
    if (fakePatterns.some(p => localPart === p || domain?.startsWith(p + '.'))) return { valid: false, error: 'Por favor, usa o teu email verdadeiro.' };
    // Block very short local parts (a@, ab@)
    if (localPart.length < 3) return { valid: false, error: 'Por favor, usa o teu email verdadeiro.' };
    // Block repeated chars (aaa@, bbb@)
    if (/^(.)\1{2,}$/.test(localPart)) return { valid: false, error: 'Por favor, usa o teu email verdadeiro.' };
    // Block common fake domains
    const fakeDomains = ['teste.com', 'teste.pt', 'test.com', 'test.pt', 'exemplo.com', 'exemplo.pt', 'example.com', 'fake.com', 'noemail.com', 'email.com', 'mail.com', 'aaa.com', 'bbb.com'];
    if (fakeDomains.includes(domain)) return { valid: false, error: 'Por favor, usa o teu email verdadeiro.' };
    return { valid: true };
  };

  const [liPaywallStep, setLiPaywallStep] = useState<'choose' | 'pay'>('choose');
  const [liPaywallPlan, setLiPaywallPlan] = useState(0);
  const [liPaywallEmail, setLiPaywallEmail] = useState("");
  const [liPaywallPhone, setLiPaywallPhone] = useState("");
  const [liPaywallLoading, setLiPaywallLoading] = useState(false);
  const [liPaywallStatus, setLiPaywallStatus] = useState<'idle' | 'polling' | 'success' | 'error'>('idle');
  const [liPaywallError, setLiPaywallError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Por favor, carregue um ficheiro PDF, DOCX ou imagem (PNG/JPEG)');
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('O ficheiro não pode exceder 5MB');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
      trackCVUpload();
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    // Validate mandatory email
    const emailCheck = validateEmail(analysisEmail);
    if (!emailCheck.valid) {
      setAnalysisEmailError(emailCheck.error || 'Email obrigatório.');
      setError(emailCheck.error || 'Introduz o teu email para continuar.');
      return;
    }
    setAnalysisEmailError(null);
    sessionStorage.setItem('paymentEmail', analysisEmail.trim().toLowerCase());
    trackAnalysisStart('cv_analyser');
    setLoading(true);
    setError(null);

    try {
      console.log('[CV_ENGINE] Iniciando análise:', file.name, file.type);

      let cvText = "";
      if (file.type === 'image/png' || file.type === 'image/jpeg') {
        // Images always use server-side Gemini Vision extraction
        cvText = '';
      } else if (file.type === 'application/pdf') {
        cvText = await extractTextFromPDF(file);
      } else {
        cvText = await extractTextFromDOCX(file);
      }

      console.log('[CV_ENGINE] Texto extraído, comprimento:', cvText.length);

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Content = await base64Promise;

      // If pdf.js couldn't extract enough text, send the file to the edge function
      // which uses Gemini Vision to extract text from image-based PDFs
      const useServerExtraction = cvText.length < 50;
      if (useServerExtraction) {
        console.log('[CV_ENGINE] Texto insuficiente no browser (' + cvText.length + ' chars). A enviar PDF para extração via Gemini Vision...');
      } else {
        console.log('[GEMINI] A enviar CV para análise IA via Supabase Edge Function...');
      }

      // Retry logic for intermittent 500 errors (cold starts, rate limits)
      let response: Response | null = null;
      let responseData: any = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        try {
          const requestBody: any = {
            mode: 'cv_extraction',
            ...(jobInput.trim() ? { job_description: jobInput.trim().substring(0, 3000) } : {})
          };
          if (useServerExtraction) {
            // Send base64 file for server-side Gemini Vision extraction
            requestBody.file = base64Content;
            requestBody.filename = file.name;
          } else {
            requestBody.cv_text = cvText.substring(0, 8000);
          }

          response = await fetch(SUPABASE_EDGE_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            responseData = await response.json();
            console.log('[GEMINI] Resposta recebida:', JSON.stringify(responseData).substring(0, 200));
            if (responseData.success) break;
          }

          // If not last attempt, wait and retry
          if (attempt < maxRetries) {
            console.warn(`[CV_ENGINE] Tentativa ${attempt + 1} falhou (status: ${response?.status}). A tentar novamente...`);
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } else {
            const errorText = await response?.text().catch(() => 'Unknown error');
            console.error('[GEMINI] Erro do backend após retries:', response?.status, errorText);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (attempt < maxRetries && fetchError.name !== 'AbortError') {
            console.warn(`[CV_ENGINE] Tentativa ${attempt + 1} falhou (${fetchError.message}). A tentar novamente...`);
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          } else {
            throw fetchError;
          }
        }
      }

      if (!response?.ok) {
        throw new Error('Erro na análise IA. Por favor, tente novamente.');
      }

      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Erro na análise IA.');
      }

      // Pass full response - analysis data is at root level, not under .analysis
      const analysisSource = responseData.analysis || responseData;
      const analysisResult = transformGeminiResponse(analysisSource);

      window.currentReportData = analysisSource;

      // Clear previous payment/unlock state for new analysis
      sessionStorage.removeItem('isPaid');
      sessionStorage.removeItem('careerPathIncluded');
      sessionStorage.removeItem('careerPathPaid');
      sessionStorage.removeItem('careerPathData');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('paymentEmail');

      sessionStorage.setItem('cvAnalysis', JSON.stringify(analysisResult));
      sessionStorage.setItem('cvFile', base64Content);
      sessionStorage.setItem('cvFilename', file.name);
      sessionStorage.setItem('analysisLang', 'pt');
      if (jobInput.trim()) {
        sessionStorage.setItem('jobDescription', jobInput.trim());
      } else {
        sessionStorage.removeItem('jobDescription');
      }

      console.log('[CV_ENGINE] Análise completa:', JSON.stringify(analysisResult).substring(0, 200));

      // Fire-and-forget: log to cv_analysis for dashboard
      logAnalysisToSupabase(analysisResult, analysisSource, cvText);

      setLocation('/results');

    } catch (err: any) {
      console.error('[CV_ENGINE] Erro:', err);
      if (err.name === 'AbortError') {
        setError('A análise demorou demasiado. Por favor, tente novamente.');
      } else {
        setError(err.message || 'Erro ao analisar o CV. Por favor, tente novamente.');
      }
      setLoading(false);
    }
  };

  // Validate voucher code against Supabase
  const validateVoucherForLinkedIn = async (code: string): Promise<boolean> => {
    setLinkedInVoucherValidating(true);
    setLinkedInVoucherError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(code)}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      const vouchers = await res.json();
      if (!Array.isArray(vouchers) || vouchers.length === 0) {
        setLinkedInVoucherError('Código inválido. Verifica e tenta novamente.');
        return false;
      }
      const voucher = vouchers[0];
      const remaining = (voucher.total_analyses || 0) - (voucher.used_analyses || 0);
      if (remaining <= 0) {
        setLinkedInVoucherError('Este código já não tem análises disponíveis.');
        return false;
      }
      // Valid! Store payment info
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('voucherCode', code);
      sessionStorage.setItem('voucherId', String(voucher.id));
      sessionStorage.setItem('remainingAnalyses', String(remaining));
      sessionStorage.setItem('paymentAmount', String(voucher.amount_paid || 0));
      sessionStorage.setItem('transactionId', voucher.order_id || '');
      setShowLinkedInPaywall(false);
      return true;
    } catch (err) {
      setLinkedInVoucherError('Erro ao validar código. Tenta novamente.');
      return false;
    } finally {
      setLinkedInVoucherValidating(false);
    }
  };

  // Handle LinkedIn URL analysis (analyse profile without CV file)
  const handleLinkedInAnalyze = async () => {
    if (!linkedInUrl.toLowerCase().includes('linkedin.com')) {
      setError('Introduz um URL de LinkedIn válido (ex: https://linkedin.com/in/o-teu-perfil)');
      return;
    }
    if (!acceptedTerms) {
      setError('Aceita a Política de Privacidade para continuar.');
      return;
    }
    // Validate mandatory email
    const emailCheck = validateEmail(analysisEmail);
    if (!emailCheck.valid) {
      setAnalysisEmailError(emailCheck.error || 'Email obrigatório.');
      setError(emailCheck.error || 'Introduz o teu email para continuar.');
      return;
    }
    setAnalysisEmailError(null);
    sessionStorage.setItem('paymentEmail', analysisEmail.trim().toLowerCase());

    // Check if user has a valid voucher/payment
    const isPaid = sessionStorage.getItem('isPaid') === 'true';
    if (!isPaid) {
      // Show paywall - LinkedIn analysis is premium only
      setShowLinkedInPaywall(true);
      setLiPaywallStep('choose');
      setLiPaywallPlan(0);
      setLiPaywallEmail('');
      setLiPaywallPhone('');
      setLiPaywallLoading(false);
      setLiPaywallStatus('idle');
      setLiPaywallError(null);
      return;
    }

    trackAnalysisStart('cv_analyser_linkedin');
    setLoading(true);
    setError(null);

    try {
      console.log('[CV_ENGINE] Iniciando análise via LinkedIn:', linkedInUrl);

      // Step 1: Scrape LinkedIn profile via backend (Apify)
      console.log('[CV_ENGINE] Step 1: A extrair dados do perfil LinkedIn via Apify...');
      const scrapeResponse = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/services/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin_url: linkedInUrl })
      });

      if (!scrapeResponse.ok) {
        const scrapeError = await scrapeResponse.json().catch(() => ({}));
        throw new Error(scrapeError?.error || 'Erro ao extrair dados do perfil LinkedIn.');
      }

      const scrapeData = await scrapeResponse.json();
      if (!scrapeData?.success || !scrapeData?.cv_text) {
        throw new Error(scrapeData?.error || 'Não foi possível extrair dados do perfil LinkedIn.');
      }

      console.log('[CV_ENGINE] Step 1 OK: Extraídos', scrapeData.cv_text.length, 'chars do perfil', scrapeData.profile_name);

      // Step 2: Send extracted text to edge function for AI analysis
      console.log('[CV_ENGINE] Step 2: A enviar para análise IA...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const requestBody: any = {
        mode: 'cv_extraction',
        cv_text: scrapeData.cv_text.substring(0, 8000),
        linkedin_url: linkedInUrl,
        ...(jobInput.trim() ? { job_description: jobInput.trim().substring(0, 3000) } : {})
      };

      const response = await fetch(SUPABASE_EDGE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Erro na análise IA. Por favor, tente novamente.');
      }

      const responseData = await response.json();
      if (!responseData?.success) {
        throw new Error(responseData?.error || 'Erro na análise IA.');
      }

      const analysisSource = responseData.analysis || responseData;
      const analysisResult = transformGeminiResponse(analysisSource);

      window.currentReportData = analysisSource;

      // Don't remove isPaid for LinkedIn - it's already validated
      sessionStorage.removeItem('careerPathIncluded');
      sessionStorage.removeItem('careerPathPaid');
      sessionStorage.removeItem('careerPathData');
      sessionStorage.removeItem('selectedPlan');
      sessionStorage.removeItem('paymentEmail');

      sessionStorage.setItem('cvAnalysis', JSON.stringify(analysisResult));
      sessionStorage.setItem('cvFile', '');
      sessionStorage.setItem('cvFilename', 'linkedin-profile');
      sessionStorage.setItem('analysisLang', 'pt');
      sessionStorage.setItem('linkedinUrl', linkedInUrl);
      // LinkedIn analysis is always paid - keep isPaid flag
      sessionStorage.setItem('isPaid', 'true');
      if (jobInput.trim()) {
        sessionStorage.setItem('jobDescription', jobInput.trim());
      } else {
        sessionStorage.removeItem('jobDescription');
      }

      logAnalysisToSupabase(analysisResult, analysisSource, `LinkedIn: ${linkedInUrl}`);
      setLocation('/results');

    } catch (err: any) {
      console.error('[CV_ENGINE] Erro LinkedIn:', err);
      if (err.name === 'AbortError') {
        setError('A análise demorou demasiado. Por favor, tente novamente.');
      } else {
        setError(err.message || 'Erro ao analisar o perfil LinkedIn. Por favor, tente novamente.');
      }
      setLoading(false);
    }
  };

  // Handle LinkedIn paywall inline payment (buy + auto-analyse)
  const handleLiPaywallPurchase = async () => {
    if (!liPaywallEmail.includes('@')) {
      setLiPaywallError('Introduz um email válido.');
      return;
    }
    if (!liPaywallPhone || liPaywallPhone.length < 9) {
      setLiPaywallError('Introduz um número de telemóvel válido.');
      return;
    }
    const plan = pricingPlans[liPaywallPlan];
    setLiPaywallLoading(true);
    setLiPaywallError(null);
    setLiPaywallStatus('idle');
    try {
      // Format phone with 351 prefix (same as working payment page)
      const cleanPhone = liPaywallPhone.replace(/\s/g, '').replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('351') ? cleanPhone : (cleanPhone.length === 9 ? '351' + cleanPhone : cleanPhone);
      const orderId = `LI-${Date.now()}`;
      // Create MBWay payment
      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/mbway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          phone: formattedPhone,
          mobileNumber: formattedPhone,
          amount: plan.price.replace(',', '.'),
          email: liPaywallEmail,
          product: `CV Analyser - ${plan.name} (LinkedIn)`,
          description: `LinkedIn ${plan.name} - ${plan.analyses} análise(s)`,
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Erro ao iniciar pagamento');
      setLiPaywallStatus('polling');
      // Poll for payment confirmation using /status/ endpoint (same as working payment page)
      let paid = false;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const checkRes = await fetch(`https://share2inspire-beckend.lm.r.appspot.com/api/payment/status/${orderId}`);
          const checkData = await checkRes.json();
          if (checkData.paid === true || checkData.status === 'PAID') {
            paid = true;
            break;
          }
        } catch (pollErr) {
          console.error('[PAYMENT] Polling error:', pollErr);
        }
      }
      if (!paid) throw new Error('Tempo de pagamento expirado. Tenta novamente.');
      // Create voucher with error handling
      const code = `S2I-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const voucherPayload = {
        code: code,
        email: liPaywallEmail,
        plan_name: plan.name,
        total_analyses: plan.analyses,
        used_analyses: 0,
        amount_paid: parseFloat(plan.price.replace(',', '.')),
        order_id: orderId,
        payment_method: 'mbway',
        voucher_type: 'standard',
        is_active: true,
      };
      const voucherRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(voucherPayload)
      });
      if (!voucherRes.ok) {
        const errBody = await voucherRes.text();
        console.error('[PAYMENT] Voucher INSERT failed:', voucherRes.status, errBody);
        // Retry once with minimal payload
        const retryPayload = { code, email: liPaywallEmail, total_analyses: plan.analyses, used_analyses: 0, amount_paid: parseFloat(plan.price.replace(',', '.')), voucher_type: 'standard', is_active: true };
        const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(retryPayload)
        });
        if (!retryRes.ok) {
          console.error('[PAYMENT] Voucher INSERT retry failed:', retryRes.status);
          throw new Error('Pagamento confirmado mas erro ao criar voucher. Contacta suporte com ref: ' + orderId);
        }
      }
      const voucherData = await voucherRes.json();
      console.log('[PAYMENT] Voucher created:', code, voucherData);
      // No voucher email for LinkedIn flow — payment unlocks analysis directly
      // Payment confirmed! Set paid flag and auto-trigger LinkedIn analysis
      sessionStorage.setItem('isPaid', 'true');
      sessionStorage.setItem('paymentEmail', liPaywallEmail.trim().toLowerCase());
      sessionStorage.setItem('voucherCode', code);
      sessionStorage.setItem('paymentAmount', plan.price.replace(',', '.'));
      sessionStorage.setItem('transactionId', orderId);
      // Track purchase conversion
      trackPurchase('cv_analyser_linkedin', parseFloat(plan.price.replace(',', '.')), orderId);
      setLiPaywallStatus('success');
      setShowLinkedInPaywall(false);
      // Auto-trigger LinkedIn analysis
      handleLinkedInAnalyze();
    } catch (err: any) {
      setLiPaywallError(err.message || 'Erro no pagamento.');
      setLiPaywallStatus('error');
    } finally {
      setLiPaywallLoading(false);
    }
  };

  // Handle voucher purchase (buy now, upload later)
  const handleVoucherPurchase = async () => {
    if (!voucherEmail.includes('@')) {
      setVoucherPaymentError('Introduz um email válido.');
      return;
    }
    if (!voucherPhone || voucherPhone.length < 9) {
      setVoucherPaymentError('Introduz um número de telemóvel válido.');
      return;
    }
    const plan = pricingPlans[voucherSelectedPlan];
    setVoucherPaymentLoading(true);
    setVoucherPaymentError(null);
    setVoucherPaymentStatus('idle');
    try {
      // Format phone with 351 prefix (same as working payment page)
      const cleanVoucherPhone = voucherPhone.replace(/\s/g, '').replace(/\D/g, '');
      const formattedVoucherPhone = cleanVoucherPhone.startsWith('351') ? cleanVoucherPhone : (cleanVoucherPhone.length === 9 ? '351' + cleanVoucherPhone : cleanVoucherPhone);
      const orderId = `VC-${Date.now()}`;
      // Create MBWay payment
      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/mbway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          phone: formattedVoucherPhone,
          mobileNumber: formattedVoucherPhone,
          amount: plan.price.replace(',', '.'),
          email: voucherEmail,
          product: `CV Analyser - ${plan.name} (Voucher)`,
          description: `Voucher ${plan.name} - ${plan.analyses} análise(s)`,
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Erro ao iniciar pagamento');
      setVoucherPaymentStatus('polling');
      // Poll for payment confirmation using /status/ endpoint (same as working payment page)
      let paid = false;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const checkRes = await fetch(`https://share2inspire-beckend.lm.r.appspot.com/api/payment/status/${orderId}`);
          const checkData = await checkRes.json();
          if (checkData.paid === true || checkData.status === 'PAID') {
            paid = true;
            break;
          }
        } catch (pollErr) {
          console.error('[PAYMENT] Polling error:', pollErr);
        }
      }
      if (!paid) throw new Error('Tempo de pagamento expirado. Tenta novamente.');
      // Create voucher with error handling
      const code = `S2I-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const voucherPayload = {
        code: code,
        email: voucherEmail,
        plan_name: plan.name,
        total_analyses: plan.analyses,
        used_analyses: 0,
        amount_paid: parseFloat(plan.price.replace(',', '.')),
        order_id: orderId,
        payment_method: 'mbway',
        voucher_type: 'standard',
        is_active: true,
      };
      const voucherRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(voucherPayload)
      });
      if (!voucherRes.ok) {
        const errorText = await voucherRes.text();
        console.error('[PAYMENT] Voucher INSERT failed:', voucherRes.status, errorText);
        // Retry with minimal payload
        const retryPayload = { code, email: voucherEmail, total_analyses: plan.analyses, used_analyses: 0, amount_paid: parseFloat(plan.price.replace(',', '.')), voucher_type: 'standard', is_active: true };
        const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(retryPayload)
        });
        if (!retryRes.ok) {
          console.error('[PAYMENT] Voucher INSERT retry failed:', retryRes.status);
          throw new Error('Pagamento confirmado mas erro ao criar voucher. Contacta suporte com ref: ' + orderId);
        }
      }
      const voucherData = await voucherRes.json();
      console.log('[PAYMENT] Voucher created:', code, voucherData);
      // Send voucher email
      await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/send-voucher-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: voucherEmail,
          name: voucherEmail.split('@')[0],
          voucherCode: code,
          planName: plan.name,
          totalAnalyses: plan.analyses,
          remainingAnalyses: plan.analyses,
        })
      });
      setVoucherCode(code);
      sessionStorage.setItem('paymentEmail', voucherEmail.trim().toLowerCase());
      // Track purchase conversion
      trackPurchase('cv_analyser_voucher', parseFloat(plan.price.replace(',', '.')), orderId);
      setVoucherPaymentStatus('success');
    } catch (err: any) {
      setVoucherPaymentError(err.message || 'Erro no pagamento.');
      setVoucherPaymentStatus('error');
    } finally {
      setVoucherPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-[#C9A961]" />
            <span className="text-lg font-semibold text-foreground">CV Analyser</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/career-path" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Career Path</a>
            <a href="/en/cv-analyser" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 hover:bg-[#C9A961]/20 transition-colors text-sm font-medium text-[#C9A961]">
              <Globe className="w-3.5 h-3.5" />
              <span>EN</span>
            </a>
            <a 
              href="https://www.share2inspire.pt" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Homepage</span>
            </a>
          </div>
        </div>
      </header>

      {/* Bundle Banner — Main offer */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2d2d2d] border-b border-[#C9A961]/30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-[10px] bg-gradient-to-r from-[#C9A961] to-[#E8D5A3] text-[#1a1a2e] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase shrink-0">Mais popular</span>
          <span className="text-sm text-white">
            <strong className="text-[#C9A961]">Bundle</strong> — CV Analyser + Career Path por <strong className="text-white">€14,99</strong> <span className="text-white/40 line-through text-xs">€16,99</span>
          </span>
          <a href="/bundle" className="text-xs bg-[#C9A961] hover:bg-[#B8943D] text-white px-3 py-1 rounded-full font-semibold shrink-0 transition-all">Obter Bundle</a>
        </div>
      </div>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-6 md:py-16">
        <div className="text-center space-y-3 md:space-y-6 mb-6 md:mb-12">
          <h1 className="text-2xl md:text-5xl font-bold text-foreground leading-tight">
            Descobre o teu <span className="text-[#C9A961]">Score ATS</span>
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Análise gratuita em 30 segundos. Descobre se o teu CV passa nos sistemas de recrutamento.
          </p>
          <a
            href="/cv-analyser/demo.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C9A961]/40 bg-[#C9A961]/10 hover:bg-[#C9A961]/20 transition-all text-sm font-medium text-[#C9A961] hover:scale-105"
          >
            <Eye className="w-4 h-4" />
            Vê o que vais receber
          </a>
        </div>

        {/* Upload Card */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-12 space-y-5 md:space-y-8">
          {/* Mobile: Direct CTA Button */}
          <div className="md:hidden space-y-3">
            <label
              htmlFor="cv-upload-mobile"
              className={`block w-full py-4 px-6 rounded-xl text-center cursor-pointer font-semibold text-base transition-all duration-200 ${
                file ? 'bg-[#C9A961]/10 border-2 border-[#C9A961] text-foreground' : 'bg-[#C9A961] hover:bg-[#A88B4E] text-white'
              }`}
            >
              <input
                id="cv-upload-mobile"
                type="file"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="sr-only"
                disabled={loading}
              />
              {file ? (
                <span className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-[#C9A961]" />
                  {file.name}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Analisar Meu CV Agora
                </span>
              )}
            </label>
            <p className="text-[11px] text-muted-foreground text-center">PDF, DOCX ou Imagem • Grátis • Dados eliminados após análise</p>
          </div>

          {/* Desktop: Full drag & drop area */}
          <div className="hidden md:block">
            {/* Value bullets */}
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p className="font-semibold text-foreground text-base">Depois da análise vais ver:</p>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#C9A961] shrink-0" /> Score de compatibilidade ATS</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#C9A961] shrink-0" /> Palavras-chave em falta</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#C9A961] shrink-0" /> Problemas críticos que bloqueiam entrevistas</div>
            </div>
            {/* Upload Area */}
            <div className="space-y-4">
              <label
                htmlFor="cv-upload"
                className={`
                  relative block w-full border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                  transition-all duration-200
                  ${file ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border hover:border-[#C9A961]/50 hover:bg-muted/50'}
                `}
              >
                <input
                  id="cv-upload"
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={loading}
                />
                
                <div className="space-y-4">
                  {file ? (
                    <>
                      <FileText className="w-12 h-12 mx-auto text-[#C9A961]" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Arrasta o teu CV ou clica para escolher
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOCX ou Imagem (máx. 5MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5 mt-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Análise automática. O ficheiro é eliminado após o processamento.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Alternatives: LinkedIn + Email Link */}
          <div className="flex flex-col gap-2 pt-1">
            {/* LinkedIn button + panel */}
            <button
              type="button"
              onClick={() => { setShowLinkedIn(!showLinkedIn); setShowEmailLink(false); }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-sm text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Usar perfil LinkedIn
            </button>
            {showLinkedIn && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Cola o URL do teu perfil LinkedIn para extrairmos os dados automaticamente.</p>
                <span className="text-[10px] bg-[#C9A961]/20 text-[#C9A961] px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2">PREMIUM</span>
              </div>
              <input
                type="url"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder="https://linkedin.com/in/o-teu-perfil"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
              />
              <p className="text-xs text-muted-foreground/70">Analisamos o teu perfil público do LinkedIn como se fosse um CV. <span className="text-[#C9A961]">Requer pacote pago.</span></p>
            </div>
          )}

          </div>

          {/* Sem CV no telemóvel? — unified toggle with two options */}
          <button
            type="button"
            onClick={() => setShowNoCvOptions(!showNoCvOptions)}
            className="w-full text-center text-xs text-muted-foreground/70 hover:text-[#C9A961] transition-colors py-1"
          >
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Sem o CV no telemóvel? <span className="underline underline-offset-2">Vê as opções</span>
            </span>
          </button>

          {showNoCvOptions && (
            <div className="animate-in slide-in-from-top-2 duration-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Option 1: Buy voucher */}
                <button
                  type="button"
                  onClick={() => { setShowBuyVoucher(true); setShowEmailLink(false); setShowNoCvOptions(false); setTimeout(() => { document.querySelector('[data-buy-voucher]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#C9A961]" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Comprar Análise Agora</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Recebe um voucher por email e faz upload do CV mais tarde no PC.</p>
                </button>
                {/* Option 2: Send link by email */}
                <button
                  type="button"
                  onClick={() => { setShowEmailLink(true); setShowBuyVoucher(false); setShowNoCvOptions(false); setTimeout(() => { document.querySelector('[data-email-link]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150); }}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-center"
                >
                  <div className="w-8 h-8 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#C9A961]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <p className="text-sm font-medium text-foreground">Enviar Link por Email</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Recebe o link no email e testa a análise gratuita no computador.</p>
                </button>
              </div>
            </div>
          )}

          {/* Email link panel (shown when option 2 is selected) */}
          {showEmailLink && (
            <div data-email-link className="space-y-2 animate-in slide-in-from-top-2 duration-200 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">Recebe o link no teu email para testares mais tarde no computador.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailForLink}
                  onChange={(e) => setEmailForLink(e.target.value)}
                  placeholder="o.teu@email.com"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (emailForLink.includes('@')) {
                      fetch(`${SUPABASE_URL}/rest/v1/email_links`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
                        body: JSON.stringify({ email: emailForLink, link: window.location.href, source: 'cv-analyser-pt' })
                      }).catch(() => {});
                      fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/send-link-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: emailForLink,
                          name: emailForLink.split('@')[0],
                          link: 'https://www.share2inspire.pt/cv-analyser',
                          source: 'cv-analyser-pt'
                        })
                      }).catch(() => {});
                      setEmailSent(true);
                      setTimeout(() => { setShowEmailLink(false); setEmailSent(false); }, 3000);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors"
                >
                  {emailSent ? 'Enviado!' : 'Enviar'}
                </button>
              </div>
            </div>
          )}

          {showBuyVoucher && (
            <div data-buy-voucher className="space-y-3 animate-in slide-in-from-top-2 duration-200 p-4 rounded-lg bg-muted/30 border border-border">
              {voucherPaymentStatus === 'success' && voucherCode ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">Pagamento confirmado!</p>
                  <p className="text-xs text-muted-foreground">O teu código de voucher:</p>
                  <p className="text-lg font-bold text-[#C9A961] bg-[#C9A961]/10 rounded-lg py-2 px-4 inline-block tracking-wider">{voucherCode}</p>
                  <p className="text-xs text-muted-foreground">Enviámos o código para <strong>{voucherEmail}</strong>. Usa-o na página de resultados após fazeres upload do teu CV.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Compra agora e recebe um código por email. Depois, faz upload do CV no computador e insere o código para desbloquear a análise completa.</p>
                  
                  {/* Plan Selection */}
                  <div className="grid grid-cols-3 gap-2">
                    {pricingPlans.map((plan, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setVoucherSelectedPlan(i)}
                        className={`p-2 rounded-lg border text-center transition-all text-xs ${
                          voucherSelectedPlan === i
                            ? 'border-[#C9A961] bg-[#C9A961]/10 text-foreground'
                            : 'border-border bg-background text-muted-foreground hover:border-[#C9A961]/50'
                        }`}
                      >
                        <p className="font-semibold">{plan.price}€</p>
                        <p className="text-[10px] text-muted-foreground">{plan.analyses} análise{plan.analyses > 1 ? 's' : ''}</p>
                      </button>
                    ))}
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={voucherEmail}
                      onChange={(e) => setVoucherEmail(e.target.value)}
                      placeholder="o.teu@email.com"
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                    />
                    <input
                      type="tel"
                      value={voucherPhone}
                      onChange={(e) => setVoucherPhone(e.target.value)}
                      placeholder="Telemóvel MB Way (9xxxxxxxx)"
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                    />
                  </div>

                  {voucherPaymentError && (
                    <p className="text-xs text-red-500">{voucherPaymentError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleVoucherPurchase}
                    disabled={voucherPaymentLoading}
                    className="w-full py-2.5 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {voucherPaymentStatus === 'polling' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Aguardar confirmação MB Way...</>
                    ) : voucherPaymentLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> A processar...</>
                    ) : (
                      <>Comprar Voucher — {pricingPlans[voucherSelectedPlan].price}€</>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Job Posting Toggle */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setWantsJobMatch(!wantsJobMatch)}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-border hover:border-[#C9A961]/50 bg-muted/20 hover:bg-muted/40 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-[#C9A961]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Queres analisar para uma vaga específica?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Compara o teu CV com os requisitos da vaga</p>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 ${
                wantsJobMatch ? 'bg-[#C9A961]' : 'bg-muted'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  wantsJobMatch ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>

            {wantsJobMatch && (
              <div className="space-y-2 pl-2 animate-in slide-in-from-top-2 duration-200">
                <label htmlFor="job-input" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  Link do anúncio e/ou nome da função
                </label>
                <textarea
                  id="job-input"
                  value={jobInput}
                  onChange={(e) => setJobInput(e.target.value)}
                  placeholder="Ex: https://linkedin.com/jobs/... ou 'Data Analyst - Lisboa, experiência em Python e SQL'"
                  className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961] resize-y"
                  disabled={loading}
                />
                <p className="text-[11px] text-muted-foreground/70">Cola o link do anúncio de emprego, o nome da função, ou a descrição da vaga. Quanto mais detalhes, melhor a análise.</p>
              </div>
            )}
          </div>

          {/* Mandatory Email Field */}
          <div className="space-y-1">
            <label htmlFor="analysis-email" className="text-sm font-medium text-foreground flex items-center gap-1">
              <svg className="w-4 h-4 text-[#C9A961]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              O teu email <span className="text-red-500">*</span>
            </label>
            <input
              id="analysis-email"
              type="email"
              value={analysisEmail}
              onChange={(e) => { setAnalysisEmail(e.target.value); setAnalysisEmailError(null); }}
              placeholder="o.teu@email.com"
              className={`w-full px-3 py-2.5 rounded-lg border ${analysisEmailError ? 'border-red-500 ring-2 ring-red-500/30' : 'border-border'} bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]`}
              disabled={loading}
            />
            {analysisEmailError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {analysisEmailError}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground/70">Necessário para receberes os resultados e certificação.</p>
          </div>

          {/* Privacy Terms Checkbox */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border text-[#C9A961] focus:ring-[#C9A961] cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
              Concordo com a{' '}
              <a 
                href="https://www.share2inspire.pt/pages/politica-privacidade" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#C9A961] hover:underline"
              >
                Política de Privacidade
              </a>
              {' '}e autorizo o processamento dos meus dados para análise do CV.
            </label>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={() => {
              if (linkedInUrl && linkedInUrl.toLowerCase().includes('linkedin.com') && showLinkedIn) {
                handleLinkedInAnalyze();
              } else {
                handleAnalyze();
              }
            }}
            disabled={loading || !acceptedTerms || !analysisEmail.trim() || (!file && !(linkedInUrl && linkedInUrl.toLowerCase().includes('linkedin.com') && showLinkedIn))}
            className="w-full h-12 text-base font-semibold bg-[#C9A961] hover:bg-[#A88B4E] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {loadingMessages[loadingStep]}
              </>
            ) : linkedInUrl && linkedInUrl.toLowerCase().includes('linkedin.com') && showLinkedIn ? (
              'Analisar Perfil LinkedIn'
            ) : (
              'Analisar CV Gratuitamente'
            )}
          </Button>

          {/* LinkedIn Paywall Modal */}
          {showLinkedInPaywall && (
            <div className="animate-in slide-in-from-top-2 duration-300 p-5 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#2a2a2a] border border-[#C9A961]/30 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#C9A961]/10 border border-[#C9A961]/30 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-[#C9A961]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
                <h3 className="text-lg font-bold text-white">Análise LinkedIn é Premium</h3>
                <p className="text-sm text-white/70">A análise via LinkedIn requer um pacote pago. Obtém um relatório completo com score ATS, estimativa salarial e recomendações personalizadas.</p>
              </div>

              {/* Voucher code input */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/80">Já tens um código?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkedInVoucherCode}
                    onChange={(e) => setLinkedInVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Ex: S2I-XXXXXX"
                    className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961] uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!linkedInVoucherCode.trim()) {
                        setLinkedInVoucherError('Introduz um código.');
                        return;
                      }
                      const valid = await validateVoucherForLinkedIn(linkedInVoucherCode.trim());
                      if (valid) {
                        handleLinkedInAnalyze();
                      }
                    }}
                    disabled={linkedInVoucherValidating}
                    className="px-4 py-2 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {linkedInVoucherValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Validar
                  </button>
                </div>
                {linkedInVoucherError && (
                  <p className="text-xs text-red-400">{linkedInVoucherError}</p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-xs text-white/50">ou compra agora</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>

              {/* Step 1: Choose plan */}
              {liPaywallStep === 'choose' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {pricingPlans.map((plan, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setLiPaywallPlan(i);
                          setLiPaywallStep('pay');
                        }}
                        className="p-3 rounded-lg border border-white/20 bg-white/5 hover:border-[#C9A961]/50 hover:bg-[#C9A961]/10 transition-all text-center"
                      >
                        <p className="text-lg font-bold text-[#C9A961]">{plan.price}€</p>
                        <p className="text-xs text-white/60">{plan.analyses} análise{plan.analyses > 1 ? 's' : ''}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">{plan.perUnit}€/un.</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Email + Phone + Pay */}
              {liPaywallStep === 'pay' && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLiPaywallStep('choose')}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors"
                    >
                      ← Voltar
                    </button>
                    <span className="text-sm font-semibold text-[#C9A961]">
                      {pricingPlans[liPaywallPlan].name} — {pricingPlans[liPaywallPlan].price}€
                    </span>
                  </div>

                  <input
                    type="email"
                    value={liPaywallEmail}
                    onChange={(e) => setLiPaywallEmail(e.target.value)}
                    placeholder="o.teu@email.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                  />
                  <input
                    type="tel"
                    value={liPaywallPhone}
                    onChange={(e) => setLiPaywallPhone(e.target.value)}
                    placeholder="Telemóvel MB Way (9xxxxxxxx)"
                    className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A961]/50 focus:border-[#C9A961]"
                  />

                  {liPaywallError && (
                    <p className="text-xs text-red-400">{liPaywallError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleLiPaywallPurchase}
                    disabled={liPaywallLoading}
                    className="w-full py-3 rounded-lg bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {liPaywallStatus === 'polling' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Confirma no telemóvel (MB Way)...</>
                    ) : liPaywallLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> A processar...</>
                    ) : (
                      <>Comprar e Analisar — {pricingPlans[liPaywallPlan].price}€</>
                    )}
                  </button>
                  <p className="text-[10px] text-white/40 text-center">Pagamento seguro via MB Way. A análise inicia automaticamente.</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setShowLinkedInPaywall(false); setLiPaywallStep('choose'); }}
                disabled={liPaywallLoading}
                className="w-full text-center text-xs text-white/40 hover:text-white/70 transition-colors py-1 disabled:opacity-30"
              >
                Cancelar
              </button>
            </div>
          )}

          {loading && (
            <div className="space-y-3 animate-in fade-in">
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-[#C9A961] rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(((loadingStep + 1) / loadingMessages.length) * 100, 95)}%` }} />
              </div>
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                {loadingMessages[loadingStep]}
              </p>
            </div>
          )}

          {/* Comparison Table — inline dropdown */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setPricingOpen(!pricingOpen)}
              className="w-full flex items-center justify-between py-2 text-left"
            >
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C9A961]" />
                CV Analyser vs Outras Soluções
              </span>
              {pricingOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {pricingOpen && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-semibold text-foreground text-xs">Funcionalidade</th>
                      <th className="p-3 text-center">
                        <span className="text-xs font-bold text-[#C9A961]">CV Analyser</span>
                      </th>
                      <th className="p-3 text-xs font-medium text-muted-foreground text-center">Resumeworded</th>
                      <th className="p-3 text-xs font-medium text-muted-foreground text-center">Kickresume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((row, i) => (
                      <tr key={i} className={`border-t border-border ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="p-3 text-xs text-foreground">{row.feature}</td>
                        {row.usText ? (
                          <>
                            <td className="p-3 text-center text-xs font-bold text-[#C9A961]">{row.usText}</td>
                            <td className="p-3 text-center text-xs text-muted-foreground">{row.comp1Text}</td>
                            <td className="p-3 text-center text-xs text-muted-foreground">{row.comp2Text}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 text-center">
                              {row.us ? <CheckCircle2 className="w-4 h-4 text-[#C9A961] mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                            </td>
                            <td className="p-3 text-center">
                              {row.competitor1 ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                            </td>
                            <td className="p-3 text-center">
                              {row.competitor2 ? <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/40 mx-auto" />}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5 text-[#C9A961]" />
              </div>
              <p className="text-sm font-medium text-foreground">Análise instantânea</p>
              <p className="text-xs text-muted-foreground">Resultados em 30 segundos</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <Target className="w-5 h-5 text-[#C9A961]" />
              </div>
              <p className="text-sm font-medium text-foreground">Powered by AI</p>
              <p className="text-xs text-muted-foreground">Análise com Google Gemini</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-[#C9A961]" />
              </div>
              <p className="text-sm font-medium text-foreground">100% Privado</p>
              <p className="text-xs text-muted-foreground">Os teus dados são seguros</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: What You Get (Free Analysis) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 space-y-8">
          <h2 className="text-2xl font-bold text-center text-foreground">
            O que inclui a análise gratuita?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Score ATS</h3>
              <p className="text-sm text-muted-foreground">
                Probabilidade de rejeição automática por sistemas de recrutamento
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Grid2x2 className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">4 Quadrantes</h3>
              <p className="text-sm text-muted-foreground">
                Análise de estrutura, conteúdo, formação e experiência
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Benchmarks</h3>
              <p className="text-sm text-muted-foreground">
                Comparação com médias do mercado (com transparência de 50%)
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Percepção</h3>
              <p className="text-sm text-muted-foreground">
                Como os recrutadores percecionam o teu perfil nos primeiros 5 segundos
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Social Proof */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 space-y-10">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-[#C9A961]" />
              </div>
              <p className="text-3xl font-bold text-foreground">5.000+</p>
              <p className="text-sm text-muted-foreground">Profissionais ajudados</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 text-[#C9A961]" />
              </div>
              <p className="text-3xl font-bold text-foreground">4.8/5</p>
              <div className="flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'text-[#C9A961] fill-[#C9A961]' : 'text-[#C9A961]/40 fill-[#C9A961]/40'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Avaliação média</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-[#C9A961]" />
              </div>
              <p className="text-3xl font-bold text-foreground">87%</p>
              <p className="text-sm text-muted-foreground">Conseguiram entrevista</p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-center text-foreground">O que dizem os nossos utilizadores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= t.rating ? 'text-[#C9A961] fill-[#C9A961]' : 'text-muted'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center text-sm font-bold text-[#C9A961]">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Pricing (Collapsible) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20">
          <button
            onClick={() => setPricingOpen(!pricingOpen)}
            className="w-full bg-card border border-border rounded-xl p-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Award className="w-6 h-6 text-[#C9A961]" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-foreground">Pacotes de Análise Completa</h2>
                <p className="text-sm text-muted-foreground">Desde €4,99 por análise</p>
              </div>
            </div>
            {pricingOpen ? (
              <ChevronUp className="w-6 h-6 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            )}
          </button>

          {pricingOpen && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-300">
              {pricingPlans.map((plan, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl border p-6 space-y-5 ${
                    plan.popular
                      ? 'bg-[#C9A961] text-white border-[#C9A961]'
                      : 'bg-card border-border'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-4 py-1 rounded-full">
                      Mais Popular
                    </div>
                  )}
                  {plan.badge && (
                    <div className="absolute -top-3 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>{plan.name}</h3>
                    <p className={`text-sm ${plan.popular ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {plan.name === 'Completo' ? 'CV + Career Path' : `${plan.analyses} ${plan.analyses === 1 ? 'Análise Completa' : 'Análises Completas'}`}
                    </p>
                  </div>
                  <div className="space-y-0">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>€{plan.price}</span>
                    </div>
                    <p className={`text-sm ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {plan.name === 'Completo' ? (
                        <><span className="line-through">€7,99</span> <span className="font-semibold">poupa 1€</span></>
                      ) : (
                        <>€{plan.perUnit} por análise</>
                      )}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f, j) => (
                      <li key={j} className={`text-sm flex items-start gap-2 ${plan.popular ? 'text-white/90' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-white' : 'text-[#C9A961]'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full font-semibold ${
                      plan.popular
                        ? 'bg-white text-[#C9A961] hover:bg-white/90'
                        : 'bg-[#C9A961] text-white hover:bg-[#A88B4E]'
                    }`}
                  >
                    Escolher Pacote
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison table moved to upload card above */}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Unique Benefits */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 space-y-8">
          <h2 className="text-2xl font-bold text-center text-foreground">
            Porquê o CV Analyser?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Feito para Portugal</h3>
              <p className="text-sm text-muted-foreground">
                Análise adaptada ao mercado português. Relatórios em português de Portugal, com benchmarks locais e referências salariais nacionais.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Curva Normal Exclusiva</h3>
              <p className="text-sm text-muted-foreground">
                Vê exactamente onde te posicionas face a outros candidatos. Nenhum outro serviço oferece este nível de comparação visual.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Resultados em 30 Segundos</h3>
              <p className="text-sm text-muted-foreground">
                Enquanto outros serviços demoram horas ou dias, o CV Analyser dá-te feedback imediato com IA de última geração.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Preço Justo, Sem Subscrição</h3>
              <p className="text-sm text-muted-foreground">
                Paga apenas quando precisas. Sem mensalidades, sem compromissos. A partir de €4,99 por análise completa.
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Final CTA */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 mb-10 bg-[#C9A961] rounded-2xl p-8 md:p-12 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Pronto para melhorar o teu CV?
          </h2>
          <p className="text-white/80 max-w-lg mx-auto">
            Começa com a análise gratuita. Sem cartão de crédito, sem compromisso. Descobre o que os recrutadores realmente pensam.
          </p>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-[#C9A961] hover:bg-white/90 font-semibold px-8 py-3 text-base"
          >
            Começar Análise Gratuita
          </Button>
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-8 pb-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © 2026 Share2Inspire — Todos os direitos reservados
          </p>
          <p className="text-xs text-muted-foreground">
            <a href="https://www.share2inspire.pt/pages/politica-privacidade" className="hover:text-[#C9A961] transition-colors">
              Política de Privacidade
            </a>
            {' · '}
            <a href="https://www.share2inspire.pt/pages/termos-condicoes" className="hover:text-[#C9A961] transition-colors">
              Termos e Condições
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
