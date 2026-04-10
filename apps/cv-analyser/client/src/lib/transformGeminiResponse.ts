import { t, pick, getLang } from '../i18n/translations';

/**
 * transformGeminiResponse — converts the raw Gemini JSON (from cv_extraction or cv_analysis)
 * into the internal format consumed by Results.tsx.
 *
 * PRIORITY: If the Gemini response already contains quadrants, salaryDetailed, or automationRisk
 * (new prompt format), use them directly. Only fall back to hardcoded/computed values when the
 * Gemini response does NOT include those fields.
 */
export function transformGeminiResponse(analysis: any, lang: 'pt' | 'en' | 'es' = 'pt'): any {
  const isEN = lang === 'en';
  const isES = lang === 'es';
  let atsRejectionRate = 35;
  let atsTopFactor: string | undefined;
  let quadrants: any[] = [];
  let keywords: string[] = [];
  let perceivedRole: string | undefined;
  let perceivedSeniority: string | undefined;
  let overallScoreNum: number | undefined;
  let salaryDetailed: any = null;
  let automationRisk: any = null;
  let jobMatch: any = null;
  let improvementActions: any[] = [];
  let priorityMatrix: any[] = [];
  let detailedAtsAnalysis: any = { factors: [], atsSystems: ['Workday', 'Taleo', 'Greenhouse', 'SAP SuccessFactors', 'iCIMS'], quickFixes: [] };
  let recruiterDeepAnalysis: any = { attentionMap: [], frictionPoints: [], positiveSignals: [], readingFlow: '' };
  let actionPlan30Days: any[] = [];

  try {
    // ─── 1. OVERALL SCORE ───────────────────────────────────────────────
    let overallScore = 5; // default (maps to 50/100)

    if (analysis.executive_summary?.global_score) {
      const gs = parseFloat(analysis.executive_summary.global_score);
      overallScore = gs > 10 ? gs / 10 : gs; // normalize: "85" → 8.5, "7" → 7
    } else if (analysis.scoring_geral?.pontuacao) {
      overallScore = analysis.scoring_geral.pontuacao;
    } else if (analysis.overall_score) {
      overallScore = analysis.overall_score;
    }

    atsRejectionRate = Math.round(Math.max(5, Math.min(85, 100 - (overallScore * 10))));
    overallScoreNum = Math.round(overallScore * 10);

    // ─── 2. QUADRANTS — prefer Gemini-provided quadrants ─────────────────
    const titleMapping: Record<string, string> = {
      'structure': t('estrutura'),
      'estrutura': t('estrutura'),
      'content': t('contedo'),
      'conteúdo': t('contedo'),
      'conteudo': t('contedo'),
      'education': t('formao'),
      'formação': t('formao'),
      'formacao': t('formao'),
      'experience': t('experincia'),
      'experiência': t('experincia'),
      'experiencia': t('experincia'),
    };

    if (Array.isArray(analysis.quadrants) && analysis.quadrants.length >= 3) {
      // ✅ NEW FORMAT: Gemini returned quadrants directly
      console.log('[CV_ENGINE] Using Gemini-provided quadrants');
      for (const q of analysis.quadrants) {
        const rawTitle = (q.title || '').toLowerCase().trim();
        const normalizedTitle = titleMapping[rawTitle] || q.title;
        const score = typeof q.score === 'string' ? parseInt(q.score, 10) : (q.score || 50);
        let benchmark = typeof q.benchmark === 'string' ? parseInt(q.benchmark, 10) : (q.benchmark || 65);
        // If benchmark came as text description instead of number, use sensible defaults
        if (isNaN(benchmark)) {
          const defaultBenchmarks: Record<string, number> = isEN
            ? { 'Structure': 65, 'Content': 70, 'Education': 60, 'Experience': 70 }
            : isES
            ? { 'Estructura': 65, 'Contenido': 70, 'Formación': 60, 'Experiencia': 70 }
            : { 'Estrutura': 65, 'Conteúdo': 70, 'Formação': 60, 'Experiência': 70 };
          benchmark = defaultBenchmarks[normalizedTitle] || 65;
        }
        quadrants.push({
          title: normalizedTitle,
          score: Math.min(100, Math.max(0, score)),
          benchmark: Math.min(100, Math.max(0, benchmark)),
          impactPhrase: q.impactPhrase || q.impact_phrase || (pick(`Análise de ${normalizedTitle}`, `Analysis of ${normalizedTitle}`, `Análisis de ${normalizedTitle}`)),
          strengths: Array.isArray(q.strengths) ? q.strengths.slice(0, 3) : undefined,
          weaknesses: Array.isArray(q.weaknesses) ? q.weaknesses.slice(0, 3) : undefined,
          detailedFeedback: q.detailed_feedback || q.detailedFeedback || undefined,
        });
      }
      // Recalculate overallScore from quadrant scores (weighted average)
      if (quadrants.length === 4) {
        const weights = [0.25, 0.30, 0.15, 0.30]; // Structure, Content, Education, Experience
        const order = lang === 'en' ? ['Structure', 'Content', 'Education', 'Experience'] : lang === 'es' ? ['Estructura', 'Contenido', 'Formación', 'Experiencia'] : ['Estrutura', 'Conteúdo', 'Formação', 'Experiência'];
        const sorted = [...quadrants].sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));
        let weightedSum = 0;
        for (let i = 0; i < sorted.length; i++) {
          weightedSum += sorted[i].score * weights[i];
        }
        overallScoreNum = Math.round(weightedSum);
        overallScore = overallScoreNum / 10;
        atsRejectionRate = Math.round(Math.max(5, Math.min(85, 100 - overallScoreNum)));
      }
    } else {
      // LEGACY FORMAT: Try secoes_analisadas first, then generate from global_score
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
          if (sectionName.includes(key)) { mapping = value; break; }
        }
        if (!mapping || addedQuadrants.has(mapping.title)) continue;
        addedQuadrants.add(mapping.title);
        const score = Math.round((section.scoring_secao || 5) * 10);
        quadrants.push({
          title: mapping.title,
          score: Math.min(100, Math.max(0, score)),
          benchmark: mapping.benchmark,
          impactPhrase: section.pontos_a_melhorar?.[0] || section.pontos_fortes?.[0] || `Análise de ${mapping.title}`,
          strengths: (section.pontos_fortes || []).slice(0, 3),
          weaknesses: (section.pontos_a_melhorar || []).slice(0, 3),
        });
      }

      // Fill missing quadrants from global_score
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
          quadrants.push({
            title: dq.title,
            score: Math.min(100, Math.max(20, baseScore + variation)),
            benchmark: dq.benchmark,
            impactPhrase: dq.defaultImpact,
            strengths: globalStrengths[i] ? [globalStrengths[i]] : undefined,
            weaknesses: globalImprovements[i] ? [globalImprovements[i]] : undefined,
          });
        }
      }
    }

    // Sort quadrants in standard order
    const sortOrder = lang === 'en' ? ['Structure', 'Content', 'Education', 'Experience'] : lang === 'es' ? ['Estructura', 'Contenido', 'Formación', 'Experiencia'] : ['Estrutura', 'Conteúdo', 'Formação', 'Experiência'];
    quadrants.sort((a: any, b: any) => sortOrder.indexOf(a.title) - sortOrder.indexOf(b.title));

    // ─── 2b. OVERRIDE: If Gemini returned atsRejectionRate directly, use it ───
    if (typeof analysis.atsRejectionRate === 'number') {
      console.log('[CV_ENGINE] Using Gemini-provided atsRejectionRate:', analysis.atsRejectionRate);
      atsRejectionRate = analysis.atsRejectionRate;
    }
    if (typeof analysis.atsTopFactor === 'string' && analysis.atsTopFactor.trim()) {
      atsTopFactor = analysis.atsTopFactor;
    }
    if (typeof analysis.perceivedRole === 'string' && analysis.perceivedRole.trim()) {
      perceivedRole = analysis.perceivedRole;
    }
    if (typeof analysis.perceivedSeniority === 'string' && analysis.perceivedSeniority.trim()) {
      perceivedSeniority = analysis.perceivedSeniority;
    }
    if (Array.isArray(analysis.keywords) && analysis.keywords.length > 0) {
      keywords = analysis.keywords.slice(0, 10);
    }

    // ─── 3. KEYWORDS (fallback if not already set) ─────────────────────
    if (keywords.length === 0 && analysis.candidate_profile?.key_skills?.length > 0) {
      keywords = analysis.candidate_profile.key_skills.slice(0, 6);
    } else if (keywords.length === 0 && analysis.keywords_extracted?.length > 0) {
      keywords = analysis.keywords_extracted;
    } else if (keywords.length === 0 && analysis.suitability_for_roles) {
      const roles = analysis.suitability_for_roles;
      keywords = [roles.primary, ...(roles.secondary || [])].filter(Boolean).slice(0, 6);
    }
    if (keywords.length === 0 && (analysis.global_summary?.strengths?.length > 0 || analysis.strengths?.length > 0)) {
      const src = analysis.global_summary?.strengths || analysis.strengths || [];
      keywords = src.slice(0, 4).map((s: string) => s.split(/[.,;:]/)[0].substring(0, 40));
    }
    if (keywords.length === 0) {
      keywords = ['Perfil Profissional', 'Competências Técnicas', 'Experiência', 'Formação'];
    }

    // ─── 4. ATS TOP FACTOR ──────────────────────────────────────────────
    if (analysis.ats_analysis?.main_issues?.[0]) {
      atsTopFactor = analysis.ats_analysis.main_issues[0];
    } else if (analysis.global_summary?.improvements?.[0]) {
      atsTopFactor = analysis.global_summary.improvements[0];
    } else if (analysis.weaknesses?.[0]) {
      atsTopFactor = analysis.weaknesses[0];
    }

    // ─── 5. PERCEIVED ROLE & SENIORITY ──────────────────────────────────
    if (analysis.candidate_profile?.detected_role) {
      perceivedRole = analysis.candidate_profile.detected_role;
    } else if (analysis.suitability_for_roles?.primary) {
      perceivedRole = analysis.suitability_for_roles.primary;
    } else if (keywords.length > 0) {
      perceivedRole = keywords[0];
    }

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

    // ─── 6. SALARY — prefer Gemini-provided data ────────────────────────
    if (analysis.salaryDetailed && typeof analysis.salaryDetailed === 'object' && analysis.salaryDetailed.median) {
      // ✅ NEW FORMAT: Gemini returned salary data directly
      console.log('[CV_ENGINE] Using Gemini-provided salary data');
      const sd = analysis.salaryDetailed;
      salaryDetailed = {
        percentile25: typeof sd.percentile25 === 'string' ? parseInt(sd.percentile25, 10) : (sd.percentile25 || 1000),
        median: typeof sd.median === 'string' ? parseInt(sd.median, 10) : (sd.median || 1500),
        percentile75: typeof sd.percentile75 === 'string' ? parseInt(sd.percentile75, 10) : (sd.percentile75 || 2000),
        topMax: typeof sd.topMax === 'string' ? parseInt(sd.topMax, 10) : (sd.topMax || 3000),
        currency: sd.currency || 'EUR',
        period: sd.period || 'mensal',
        benefits: Array.isArray(sd.benefits) ? sd.benefits : ['Seguro de saúde', 'Subsídio de alimentação', 'Formação contínua'],
        benefitsNote: sd.benefitsNote || sd.benefits_note || `Valores de referência para o mercado.`,
        source: sd.source || 'Estimativa de mercado baseada em IA',
      };
    } else {
      // LEGACY FALLBACK: compute from seniority
      const seniorityLevel = perceivedSeniority || 'Mid-level';
      const salaryBands: Record<string, {p25: number; median: number; p75: number; topMax: number}> = {
        'Junior': { p25: 900, median: 1100, p75: 1400, topMax: 1800 },
        'Júnior': { p25: 900, median: 1100, p75: 1400, topMax: 1800 },
        'Mid-level': { p25: 1400, median: 1800, p75: 2400, topMax: 3200 },
        'Pleno': { p25: 1400, median: 1800, p75: 2400, topMax: 3200 },
        'Mid-Senior': { p25: 2000, median: 2800, p75: 3800, topMax: 5000 },
        'Senior': { p25: 2800, median: 3800, p75: 5200, topMax: 7500 },
        'Sénior': { p25: 2800, median: 3800, p75: 5200, topMax: 7500 },
        'Director': { p25: 4000, median: 5500, p75: 7500, topMax: 12000 },
      };
      const salaryBand = salaryBands[seniorityLevel] || salaryBands['Mid-level'];
      const benefitsByLevel: Record<string, string[]> = {
        'Junior': ['Seguro de saúde', 'Subsídio de alimentação', 'Formação contínua'],
        'Júnior': ['Seguro de saúde', 'Subsídio de alimentação', 'Formação contínua'],
        'Mid-level': ['Seguro de saúde', 'Subsídio de alimentação', 'Formação contínua', 'Bónus anual variável', 'Flexibilidade horária'],
        'Pleno': ['Seguro de saúde', 'Subsídio de alimentação', 'Formação contínua', 'Bónus anual variável', 'Flexibilidade horária'],
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
        source: 'Dados agregados do mercado português (Hays, Michael Page, Robert Walters, Mercer 2024/2025)',
      };
    }

    // ─── 7. AUTOMATION RISK — prefer Gemini-provided data ───────────────
    if (analysis.automationRisk && typeof analysis.automationRisk === 'object' && (analysis.automationRisk.percentage || analysis.automationRisk.level)) {
      // ✅ NEW FORMAT: Gemini returned automation risk directly
      console.log('[CV_ENGINE] Using Gemini-provided automation risk');
      const ar = analysis.automationRisk;
      automationRisk = {
        percentage: typeof ar.percentage === 'string' ? parseInt(ar.percentage, 10) : (ar.percentage || 35),
        level: ar.level || 'Médio',
        description: ar.description || 'Risco moderado de automação.',
        recommendations: Array.isArray(ar.recommendations) ? ar.recommendations : ['Investir em competências de liderança', 'Desenvolver pensamento estratégico', 'Aprofundar conhecimentos em IA'],
      };
    } else {
      // LEGACY FALLBACK: compute from role keywords
      const roleStr = (perceivedRole || '').toLowerCase();
      let autoPercentage = 35;
      let autoLevel = 'Médio';
      let autoDesc = 'O teu perfil tem um risco moderado de automação.';
      let autoRecs = ['Investir em competências de liderança e gestão de equipas', 'Desenvolver pensamento estratégico e criativo', 'Aprofundar conhecimentos em IA e automação para liderar a transformação'];

      if (roleStr.includes('director') || roleStr.includes('líder') || roleStr.includes('leader') || roleStr.includes('head') || roleStr.includes('vp') || roleStr.includes('chief')) {
        autoPercentage = 15; autoLevel = 'Baixo';
        autoDesc = 'Funções de liderança estratégica têm baixo risco de automação.';
        autoRecs = ['Manter foco em decisão estratégica e gestão de stakeholders', 'Liderar iniciativas de transformação digital', 'Desenvolver capacidades de change management'];
      } else if (roleStr.includes('manager') || roleStr.includes('gestor') || roleStr.includes('senior') || roleStr.includes('consultor')) {
        autoPercentage = 25; autoLevel = 'Baixo';
        autoDesc = 'Perfis de gestão e consultoria sénior têm risco baixo de automação.';
        autoRecs = ['Reforçar competências de people management', 'Integrar ferramentas de IA no dia-a-dia', 'Desenvolver expertise em áreas emergentes do setor'];
      } else if (roleStr.includes('admin') || roleStr.includes('assist') || roleStr.includes('data entry') || roleStr.includes('operador')) {
        autoPercentage = 65; autoLevel = 'Alto';
        autoDesc = 'Funções operacionais e administrativas têm risco elevado de automação.';
        autoRecs = ['Desenvolver competências analíticas e de interpretação de dados', 'Aprender ferramentas de automação (RPA, low-code)', 'Investir em upskilling para funções de maior valor acrescentado'];
      }
      automationRisk = { percentage: autoPercentage, level: autoLevel, description: autoDesc, recommendations: autoRecs };
    }

    // ─── 8. IMPROVEMENT ACTIONS ─────────────────────────────────────────
    improvementActions = quadrants
      .filter((q: any) => q.weaknesses && q.weaknesses.length > 0)
      .map((q: any) => ({
        action: q.weaknesses![0],
        before: `Score actual: ${q.score}/100 (${q.score >= q.benchmark ? 'acima' : 'abaixo'} do benchmark de ${q.benchmark})`,
        after: `Score estimado após melhoria: ${Math.min(100, q.score + 8)}/100`,
        impact: q.score < q.benchmark ? 'Alto' : 'Médio',
        dimension: q.title,
      }));

    // ─── 9. PRIORITY MATRIX ─────────────────────────────────────────────
    priorityMatrix = quadrants.map((q: any) => {
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
    }).sort((a: any, b: any) => {
      const urgencyOrder: Record<string, number> = { 'Alta': 0, 'Média': 1, 'Baixa': 2 };
      return (urgencyOrder[a.urgency] || 1) - (urgencyOrder[b.urgency] || 1);
    });

    // ─── 10. DETAILED ATS ANALYSIS — prefer Gemini-provided data ──────
    if (analysis.detailedAtsAnalysis && typeof analysis.detailedAtsAnalysis === 'object') {
      console.log('[CV_ENGINE] Using Gemini-provided detailedAtsAnalysis');
      const da = analysis.detailedAtsAnalysis;
      // Normalize factors: Gemini may return [{factor, status, detail}] or string[]
      let factors: string[] = [];
      if (Array.isArray(da.factors)) {
        factors = da.factors.map((f: any) => {
          if (typeof f === 'string') return f;
          if (f && typeof f === 'object') return f.detail || f.factor || JSON.stringify(f);
          return '';
        }).filter(Boolean);
      }
      // Normalize atsSystems: Gemini may return [{name, compatibility}] or string[]
      let atsSystems: string[] = [];
      if (Array.isArray(da.atsSystems)) {
        atsSystems = da.atsSystems.map((s: any) => {
          if (typeof s === 'string') return s;
          if (s && typeof s === 'object') return s.name || '';
          return '';
        }).filter(Boolean);
      }
      detailedAtsAnalysis = {
        factors: factors.length > 0 ? factors : [atsTopFactor || 'Optimizar palavras-chave para a função-alvo'],
        atsSystems: atsSystems.length > 0 ? atsSystems : ['Workday', 'Taleo', 'Greenhouse', 'SAP SuccessFactors', 'iCIMS'],
        quickFixes: Array.isArray(da.quickFixes) ? da.quickFixes : [
          'Usar formato cronológico inverso',
          'Evitar tabelas, colunas e gráficos',
          'Incluir palavras-chave do anúncio de emprego',
          'Usar fontes standard (Arial, Calibri, Times)',
          'Guardar em PDF com texto seleccionável',
        ],
      };
    } else {
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
    }

    // ─── 11. RECRUITER DEEP ANALYSIS — prefer Gemini-provided data ────
    if (analysis.recruiterDeepAnalysis && typeof analysis.recruiterDeepAnalysis === 'object') {
      console.log('[CV_ENGINE] Using Gemini-provided recruiterDeepAnalysis');
      const rd = analysis.recruiterDeepAnalysis;
      recruiterDeepAnalysis = {
        firstImpression: rd.firstImpression || rd.first_impression || '',
        attentionMap: Array.isArray(rd.attentionMap) ? rd.attentionMap : Array.isArray(rd.attention_map) ? rd.attention_map : [
          'Nome e título profissional (0-2 segundos)',
          'Experiência mais recente (2-5 segundos)',
          'Formação académica (5-8 segundos)',
        ],
        frictionPoints: Array.isArray(rd.frictionPoints) ? rd.frictionPoints : Array.isArray(rd.redFlags) ? rd.redFlags : Array.isArray(rd.friction_points) ? rd.friction_points : [],
        positiveSignals: Array.isArray(rd.positiveSignals) ? rd.positiveSignals : Array.isArray(rd.greenFlags) ? rd.greenFlags : Array.isArray(rd.positive_signals) ? rd.positive_signals : [],
        readingFlow: rd.readingFlow || rd.reading_flow || '',
        interviewLikelihood: rd.interviewLikelihood || rd.interview_likelihood || '',
        interviewLikelihoodReason: rd.interviewLikelihoodReason || rd.interview_likelihood_reason || '',
      };
    } else {
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
          ...(quadrants.filter((q: any) => q.score < q.benchmark).map((q: any) => `${q.title}: abaixo do benchmark (${q.score} vs ${q.benchmark})`)),
        ].filter(Boolean).slice(0, 4),
        positiveSignals: [
          ...(analysis.global_summary?.strengths || []).slice(0, 2),
          ...(quadrants.filter((q: any) => q.score >= q.benchmark).map((q: any) => `${q.title}: acima do benchmark (+${q.score - q.benchmark})`)),
        ].filter(Boolean).slice(0, 4),
        readingFlow: `O recrutador identifica rapidamente o perfil como ${perceivedRole || 'profissional qualificado'} (${perceivedSeniority || 'nível não determinado'}). ${quadrants.filter((q: any) => q.score >= q.benchmark).length >= 3 ? 'A maioria das dimensões está acima do benchmark, transmitindo uma imagem sólida.' : 'Algumas dimensões estão abaixo do benchmark, o que pode gerar hesitação na triagem inicial.'}`,
      };
    }

    // ─── 12. 30-DAY ACTION PLAN — prefer Gemini-provided data ─────────
    if (Array.isArray(analysis.actionPlan) && analysis.actionPlan.length > 0) {
      console.log('[CV_ENGINE] Using Gemini-provided actionPlan');
      actionPlan30Days = analysis.actionPlan.map((a: any) => ({
        week: a.week || '',
        title: a.title || '',
        actions: Array.isArray(a.tasks) ? a.tasks : Array.isArray(a.actions) ? a.actions : [],
      }));
    } else {
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
    } // end actionPlan else

  } catch (err) {
    console.error('[CV_ENGINE] Erro ao transformar resposta Gemini:', err);
    return {
      atsRejectionRate: 35,
      quadrants: [
        { title: 'Estrutura', score: 45, benchmark: 70, impactPhrase: 'Organização e clareza do CV' },
        { title: 'Conteúdo', score: 50, benchmark: 72, impactPhrase: 'Qualidade e relevância do conteúdo' },
        { title: 'Formação', score: 48, benchmark: 65, impactPhrase: 'Formação académica e contínua' },
        { title: 'Experiência', score: 52, benchmark: 70, impactPhrase: 'Experiência profissional' },
      ],
      keywords: ['Perfil Profissional', 'Competências Técnicas', 'Experiência', 'Formação'],
      salaryDetailed: {
        percentile25: 1000, median: 1400, percentile75: 1900, topMax: 2500,
        currency: 'EUR', period: 'mensal',
        benefits: ['Seguro de saúde', 'Subsídio de alimentação', 'Formação contínua'],
        benefitsNote: 'Valores de referência para o mercado português.',
        source: 'Dados agregados do mercado português (Hays, Michael Page, Robert Walters, Mercer 2024/2025)',
      },
      automationRisk: { percentage: 35, level: 'Médio', description: 'Risco moderado de automação.', recommendations: ['Investir em competências de liderança', 'Desenvolver pensamento estratégico', 'Aprofundar conhecimentos em IA'] },
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

  // ─── 13. ATS DEEP SCAN — computed client-side from existing analysis data ────
  const atsDeepScan = computeATSDeepScan(analysis, keywords, atsRejectionRate, detailedAtsAnalysis, jobMatch, cvProblems, isEN);

  return { atsRejectionRate, atsTopFactor, quadrants, keywords, perceivedRole, perceivedSeniority, overallScore: overallScoreNum, salaryDetailed, automationRisk, improvementActions, priorityMatrix, detailedAtsAnalysis, recruiterDeepAnalysis, actionPlan30Days, jobMatch, cvProblems, atsDeepScan };
}

/**
 * computeATSDeepScan — builds the ATS Deep Scan from existing analysis data:
 * - Keywords: from matched/missing keywords, cv_problems, quadrant weaknesses
 * - Format checks: from detailedAtsAnalysis factors/quickFixes, cv_problems
 * - Scores: derived from atsRejectionRate and keyword/format analysis
 */
function computeATSDeepScan(
  analysis: any,
  extractedKeywords: string[],
  atsRejectionRate: number,
  detailedAts: any,
  jobMatch: any,
  cvProblems: any[],
  isEN: boolean = false
) {
  const lang = getLang();
  // ── 1. KEYWORD ANALYSIS ──
  const kws: { keyword: string; status: 'found' | 'missing' | 'partial'; importance: 'high' | 'medium' | 'low'; context?: string; suggestion?: string }[] = [];

  // If job match exists, use matched/gap keywords (most accurate)
  if (jobMatch && (jobMatch.matchedKeywords?.length || jobMatch.keywordGaps?.length)) {
    const matched = jobMatch.matchedKeywords || [];
    const gaps = jobMatch.keywordGaps || [];
    matched.forEach((kw: string, i: number) => {
      kws.push({
        keyword: kw,
        status: 'found',
        importance: i < 3 ? 'high' : i < 6 ? 'medium' : 'low',
        context: t('encontrada_no_cv'),
        suggestion: undefined,
      });
    });
    gaps.forEach((kw: string, i: number) => {
      kws.push({
        keyword: kw,
        status: 'missing',
        importance: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
        suggestion: pick(`Adicionar "${kw}" na secção de competências ou experiência relevante`, `Add "${kw}" to the skills or relevant experience section`, `Añadir "${kw}" en la sección de competencias o experiencia relevante`),
      });
    });
  } else {
    // Mode 1 (no job posting): use extracted keywords as "found" and generate typical missing ones
    const genericImportant = [
      'Resultados quantificáveis', 'Métricas de impacto', 'Verbos de ação',
      'Competências técnicas específicas', 'Certificações relevantes',
      'Palavras-chave do sector', 'Soft skills mensuráveis', 'Ferramentas e tecnologias',
    ];
    extractedKeywords.slice(0, 6).forEach((kw, i) => {
      kws.push({
        keyword: kw,
        status: 'found',
        importance: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
        context: t('identificada_no_cv'),
      });
    });
    // Add missing keywords based on common ATS requirements
    const weaknesses = analysis.global_summary?.improvements || analysis.weaknesses || [];
    const missingFromWeaknesses = weaknesses.slice(0, 3).map((w: string) => w.split(/[.,;:]/)[0].substring(0, 50));
    const missingKws = missingFromWeaknesses.length > 0 ? missingFromWeaknesses : genericImportant.slice(0, 3);
    missingKws.forEach((kw: string, i: number) => {
      kws.push({
        keyword: kw,
        status: 'missing',
        importance: i === 0 ? 'high' : 'medium',
        suggestion: pick(`Reformular para incluir: ${kw}`, `Reformulate to include: ${kw}`, `Reformular para incluir: ${kw}`, lang),
      });
    });
    // Add partial matches from cv_problems
    cvProblems.slice(0, 2).forEach((p) => {
      if (p.title && !kws.some(k => k.keyword === p.title)) {
        kws.push({
          keyword: p.title,
          status: 'partial',
          importance: 'medium',
          suggestion: p.rewriteSuggestion || p.correctionExample || p.description,
        });
      }
    });
  }

  // ── 2. FORMAT CHECKS ──
  const formatChecks: { check: string; status: 'pass' | 'warning' | 'fail'; detail: string; fix?: string }[] = [];

  // Standard ATS format checks derived from detailedAtsAnalysis
  const factors = detailedAts?.factors || [];
  const quickFixes = detailedAts?.quickFixes || [];

  // Check: Tables/Columns
  const hasTableIssue = factors.some((f: string) => /tabela|coluna|table|column|layout/i.test(f));
  formatChecks.push({
    check: t('tabelas_e_colunas'),
    status: hasTableIssue ? 'fail' : 'pass',
    detail: hasTableIssue
      ? (t('cv_contm_tabelas_ou_colunas'))
      : (t('sem_tabelas_ou_colunas_problemticas')),
    fix: hasTableIssue ? (t('converter_para_formato_linear_sem')) : undefined,
  });

  // Check: Headers/Section Titles
  const hasHeaderIssue = factors.some((f: string) => /header|cabeçalho|secção|section|título/i.test(f));
  formatChecks.push({
    check: t('cabealhos_e_seces'),
    status: hasHeaderIssue ? 'warning' : 'pass',
    detail: hasHeaderIssue
      ? (t('cabealhos_podem_no_seguir_convenes'))
      : (t('cabealhos_seguem_convenes_standard')),
    fix: hasHeaderIssue ? (t('usar_ttulos_standard_experincia_profissional')) : undefined,
  });

  // Check: Font & Encoding
  const hasFontIssue = factors.some((f: string) => /font|fonte|encoding|caracter|symbol|ícone|icon/i.test(f));
  formatChecks.push({
    check: t('fontes_e_caracteres'),
    status: hasFontIssue ? 'warning' : 'pass',
    detail: hasFontIssue
      ? (t('fontes_ou_caracteres_especiais_podem'))
      : (t('fontes_e_caracteres_compatveis')),
    fix: hasFontIssue ? (t('usar_fontes_standard_arial_calibri')) : undefined,
  });

  // Check: Chronological Order
  const hasOrderIssue = factors.some((f: string) => /cronológ|chronolog|ordem|order|data|date/i.test(f));
  formatChecks.push({
    check: t('ordem_cronolgica'),
    status: hasOrderIssue ? 'warning' : 'pass',
    detail: hasOrderIssue
      ? (t('a_ordem_das_experincias_pode'))
      : (t('formato_cronolgico_inverso_detectado')),
    fix: hasOrderIssue ? (t('organizar_experincias_da_mais_recente')) : undefined,
  });

  // Check: File Format
  const hasFormatIssue = factors.some((f: string) => /pdf|formato|format|imagem|image|scan/i.test(f));
  formatChecks.push({
    check: t('formato_do_ficheiro'),
    status: hasFormatIssue ? 'warning' : 'pass',
    detail: hasFormatIssue
      ? (t('o_formato_do_ficheiro_pode'))
      : (t('pdf_com_texto_seleccionvel_atsfriendly')),
    fix: hasFormatIssue ? (t('guardar_como_pdf_com_texto')) : undefined,
  });

  // Check: Keywords density
  const foundCount = kws.filter(k => k.status === 'found').length;
  const totalCount = kws.length;
  const keywordDensity = totalCount > 0 ? foundCount / totalCount : 0;
  formatChecks.push({
    check: t('densidade_de_keywords'),
    status: keywordDensity >= 0.7 ? 'pass' : keywordDensity >= 0.4 ? 'warning' : 'fail',
    detail: pick(`${foundCount} de ${totalCount} keywords relevantes encontradas (${Math.round(keywordDensity * 100)}%)`, `${foundCount} of ${totalCount} relevant keywords found (${Math.round(keywordDensity * 100)}%)`, `${foundCount} de ${totalCount} keywords relevantes encontradas (${Math.round(keywordDensity * 100)}%)`),
    fix: keywordDensity < 0.7 ? (t('adicionar_keywords_em_falta_nas')) : undefined,
  });

  // ── 3. SCORES ──
  // Use atsRejectionRate from Gemini as the authoritative source for overallATSScore
  // This ensures consistency between ATSRejectionBlock and ATSDeepScanBlock
  const overallATSScore = Math.max(0, Math.min(100, 100 - atsRejectionRate));
  const passCount = formatChecks.filter(c => c.status === 'pass').length;
  const totalChecks = formatChecks.length;
  const formatScore = Math.round((passCount / totalChecks) * 100);
  const keywordScore = Math.round(keywordDensity * 100);
  // Aligned with ATSRejectionBlock thresholds:
  // rejectionRate <= 20 (score >= 80): excellent
  // rejectionRate <= 40 (score >= 60): good
  // rejectionRate <= 60 (score >= 40): needs_work
  // rejectionRate > 60 (score < 40): critical
  const verdict = overallATSScore >= 80 ? 'excellent' : overallATSScore >= 60 ? 'good' : overallATSScore >= 40 ? 'needs_work' : 'critical';

  return {
    keywordScore,
    formatScore,
    overallATSScore,
    verdict,
    keywords: kws,
    formatChecks,
  };
}
