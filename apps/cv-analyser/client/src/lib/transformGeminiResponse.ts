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
  const localize = (pt: string, en: string, es: string) => pick(pt, en, es, lang);
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
      // English keys
      'structure': t('estrutura', lang),
      'content': t('contedo', lang),
      'education': t('formao', lang),
      'experience': t('experincia', lang),
      // Portuguese keys
      'estrutura': t('estrutura', lang),
      'conteúdo': t('contedo', lang),
      'conteudo': t('contedo', lang),
      'formação': t('formao', lang),
      'formacao': t('formao', lang),
      'experiência': t('experincia', lang),
      // Spanish keys
      'contenido': t('contedo', lang),
      'formación': t('formao', lang),
      'formacion': t('formao', lang),
      'experiencia': t('experincia', lang),
      'estructura': t('estrutura', lang),
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
      keywords = isES
        ? ['Perfil Profesional', 'Competencias Técnicas', 'Experiencia', 'Formación']
        : isEN
        ? ['Professional Profile', 'Technical Skills', 'Experience', 'Education']
        : ['Perfil Profissional', 'Competências Técnicas', 'Experiência', 'Formação'];
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
        benefits: Array.isArray(sd.benefits) ? sd.benefits : [
          localize('Seguro de saúde', 'Health insurance', 'Seguro de salud'),
          localize('Subsídio de alimentação', 'Meal allowance', 'Subsidio de comida'),
          localize('Formação contínua', 'Continuous training', 'Formación continua'),
        ],
        benefitsNote: sd.benefitsNote || sd.benefits_note || localize('Valores de referência para o mercado.', 'Reference values for the market.', 'Valores de referencia para el mercado.'),
        source: sd.source || localize('Estimativa de mercado baseada em IA', 'AI-based market estimate', 'Estimación de mercado basada en IA'),
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
        'Junior': [
          localize('Seguro de saúde', 'Health insurance', 'Seguro de salud'),
          localize('Subsídio de alimentação', 'Meal allowance', 'Subsidio de comida'),
          localize('Formação contínua', 'Continuous training', 'Formación continua'),
        ],
        'Júnior': [
          localize('Seguro de saúde', 'Health insurance', 'Seguro de salud'),
          localize('Subsídio de alimentação', 'Meal allowance', 'Subsidio de comida'),
          localize('Formação contínua', 'Continuous training', 'Formación continua'),
        ],
        'Mid-level': [
          localize('Seguro de saúde', 'Health insurance', 'Seguro de salud'),
          localize('Subsídio de alimentação', 'Meal allowance', 'Subsidio de comida'),
          localize('Formação contínua', 'Continuous training', 'Formación continua'),
          localize('Bónus anual variável', 'Variable annual bonus', 'Bonus anual variable'),
          localize('Flexibilidade horária', 'Flexible schedule', 'Flexibilidad horaria'),
        ],
        'Pleno': [
          localize('Seguro de saúde', 'Health insurance', 'Seguro de salud'),
          localize('Subsídio de alimentação', 'Meal allowance', 'Subsidio de comida'),
          localize('Formação contínua', 'Continuous training', 'Formación continua'),
          localize('Bónus anual variável', 'Variable annual bonus', 'Bonus anual variable'),
          localize('Flexibilidade horária', 'Flexible schedule', 'Flexibilidad horaria'),
        ],
        'Mid-Senior': [
          localize('Seguro de saúde extensível ao agregado', 'Health insurance extended to dependants', 'Seguro de salud ampliado a la familia'),
          localize('Subsídio de alimentação', 'Meal allowance', 'Subsidio de comida'),
          localize('Formação (2-5% do salário anual)', 'Training (2-5% of annual salary)', 'Formación (2-5 % del salario anual)'),
          localize('Bónus anual (10-20%)', 'Annual bonus (10-20%)', 'Bonus anual (10-20 %)'),
          localize('Carro ou subsídio de mobilidade', 'Company car or mobility allowance', 'Coche o ayuda de movilidad'),
          localize('Telemóvel e comunicações', 'Mobile phone and communications', 'Teléfono móvil y comunicaciones'),
          localize('Benefícios flexíveis', 'Flexible benefits', 'Beneficios flexibles'),
        ],
        'Senior': [
          localize('Plano de saúde premium (agregado familiar)', 'Premium health plan (family household)', 'Plan de salud premium (unidad familiar)'),
          localize('Plano de reforma/PPR', 'Retirement plan/PPR', 'Plan de jubilación/PPR'),
          localize('Carro de função ou subsídio', 'Company car or allowance', 'Coche de empresa o subsidio'),
          localize('Telemóvel e comunicações', 'Mobile phone and communications', 'Teléfono móvil y comunicaciones'),
          localize('Formação executiva (3-8% do salário anual)', 'Executive training (3-8% of annual salary)', 'Formación ejecutiva (3-8 % del salario anual)'),
          localize('Bónus anual (15-30%)', 'Annual bonus (15-30%)', 'Bonus anual (15-30 %)'),
          localize('Benefícios flexíveis (cheques infância, ginásio, etc.)', 'Flexible benefits (childcare vouchers, gym, etc.)', 'Beneficios flexibles (cheques guardería, gimnasio, etc.)'),
          localize('Stock options ou participação nos resultados', 'Stock options or profit sharing', 'Stock options o participación en resultados'),
        ],
        'Sénior': [
          localize('Plano de saúde premium (agregado familiar)', 'Premium health plan (family household)', 'Plan de salud premium (unidad familiar)'),
          localize('Plano de reforma/PPR', 'Retirement plan/PPR', 'Plan de jubilación/PPR'),
          localize('Carro de função ou subsídio', 'Company car or allowance', 'Coche de empresa o subsidio'),
          localize('Telemóvel e comunicações', 'Mobile phone and communications', 'Teléfono móvil y comunicaciones'),
          localize('Formação executiva (3-8% do salário anual)', 'Executive training (3-8% of annual salary)', 'Formación ejecutiva (3-8 % del salario anual)'),
          localize('Bónus anual (15-30%)', 'Annual bonus (15-30%)', 'Bonus anual (15-30 %)'),
          localize('Benefícios flexíveis (cheques infância, ginásio, etc.)', 'Flexible benefits (childcare vouchers, gym, etc.)', 'Beneficios flexibles (cheques guardería, gimnasio, etc.)'),
          localize('Stock options ou participação nos resultados', 'Stock options or profit sharing', 'Stock options o participación en resultados'),
        ],
        'Director': [
          localize('Plano de saúde premium (agregado familiar)', 'Premium health plan (family household)', 'Plan de salud premium (unidad familiar)'),
          localize('Plano de reforma/PPR contributivo', 'Contributory retirement plan/PPR', 'Plan de jubilación/PPR contributivo'),
          localize('Carro de função premium', 'Premium company car', 'Coche de empresa premium'),
          localize('Telemóvel e comunicações', 'Mobile phone and communications', 'Teléfono móvil y comunicaciones'),
          localize('Formação executiva e MBA', 'Executive training and MBA', 'Formación ejecutiva y MBA'),
          localize('Bónus anual (20-50%)', 'Annual bonus (20-50%)', 'Bonus anual (20-50 %)'),
          localize('Benefícios flexíveis premium', 'Premium flexible benefits', 'Beneficios flexibles premium'),
          localize('Stock options / LTIP', 'Stock options / LTIP', 'Stock options / LTIP'),
          localize('Seguro de vida', 'Life insurance', 'Seguro de vida'),
        ],
      };
      const benefits = benefitsByLevel[seniorityLevel] || benefitsByLevel['Mid-level'];
      salaryDetailed = {
        percentile25: salaryBand.p25,
        median: salaryBand.median,
        percentile75: salaryBand.p75,
        topMax: salaryBand.topMax,
        currency: 'EUR',
        period: localize('mensal', 'monthly', 'mensual'),
        benefits,
        benefitsNote: localize(
          `Valores de referência para perfis ${seniorityLevel} no mercado português. O pacote de compensação total pode representar 20-40% acima do salário base, dependendo do setor e dimensão da empresa.`,
          `Reference values for ${seniorityLevel} profiles in the Portuguese market. Total compensation can represent 20–40% above base salary, depending on sector and company size.`,
          `Valores de referencia para perfiles ${seniorityLevel} en el mercado portugués. La compensación total puede situarse entre un 20 % y un 40 % por encima del salario base, según el sector y el tamaño de la empresa.`
        ),
        source: localize('Dados agregados do mercado português (Hays, Michael Page, Robert Walters, Mercer 2024/2025)', 'Aggregated Portuguese market data (Hays, Michael Page, Robert Walters, Mercer 2024/2025)', 'Datos agregados del mercado portugués (Hays, Michael Page, Robert Walters, Mercer 2024/2025)'),
      };
    }

    // ─── 7. AUTOMATION RISK — prefer Gemini-provided data ───────────────
    if (analysis.automationRisk && typeof analysis.automationRisk === 'object' && (analysis.automationRisk.percentage || analysis.automationRisk.level)) {
      // ✅ NEW FORMAT: Gemini returned automation risk directly
      console.log('[CV_ENGINE] Using Gemini-provided automation risk');
      const ar = analysis.automationRisk;
      automationRisk = {
        percentage: typeof ar.percentage === 'string' ? parseInt(ar.percentage, 10) : (ar.percentage || 35),
        level: ar.level || localize('Médio', 'Medium', 'Medio'),
        description: ar.description || localize('Risco moderado de automação.', 'Moderate automation risk.', 'Riesgo moderado de automatización.'),
        recommendations: Array.isArray(ar.recommendations) ? ar.recommendations : [
          localize('Investir em competências de liderança', 'Invest in leadership skills', 'Invertir en competencias de liderazgo'),
          localize('Desenvolver pensamento estratégico', 'Develop strategic thinking', 'Desarrollar pensamiento estratégico'),
          localize('Aprofundar conhecimentos em IA', 'Deepen AI knowledge', 'Profundizar conocimientos en IA'),
        ],
      };
    } else {
      // LEGACY FALLBACK: compute from role keywords
      const roleStr = (perceivedRole || '').toLowerCase();
      let autoPercentage = 35;
      let autoLevel = localize('Médio', 'Medium', 'Medio');
      let autoDesc = localize('O teu perfil tem um risco moderado de automação.', 'Your profile has a moderate automation risk.', 'Tu perfil presenta un riesgo moderado de automatización.');
      let autoRecs = [
        localize('Investir em competências de liderança e gestão de equipas', 'Invest in leadership and team management skills', 'Invertir en competencias de liderazgo y gestión de equipos'),
        localize('Desenvolver pensamento estratégico e criativo', 'Develop strategic and creative thinking', 'Desarrollar pensamiento estratégico y creativo'),
        localize('Aprofundar conhecimentos em IA e automação para liderar a transformação', 'Deepen AI and automation knowledge to lead transformation', 'Profundizar conocimientos en IA y automatización para liderar la transformación'),
      ];

      if (roleStr.includes('director') || roleStr.includes('líder') || roleStr.includes('leader') || roleStr.includes('head') || roleStr.includes('vp') || roleStr.includes('chief')) {
        autoPercentage = 15; autoLevel = localize('Baixo', 'Low', 'Bajo');
        autoDesc = localize('Funções de liderança estratégica têm baixo risco de automação.', 'Strategic leadership roles have low automation risk.', 'Las funciones de liderazgo estratégico tienen bajo riesgo de automatización.');
        autoRecs = [
          localize('Manter foco em decisão estratégica e gestão de stakeholders', 'Keep focus on strategic decision-making and stakeholder management', 'Mantener el foco en la toma de decisiones estratégicas y la gestión de stakeholders'),
          localize('Liderar iniciativas de transformação digital', 'Lead digital transformation initiatives', 'Liderar iniciativas de transformación digital'),
          localize('Desenvolver capacidades de change management', 'Develop change management capabilities', 'Desarrollar capacidades de change management'),
        ];
      } else if (roleStr.includes('manager') || roleStr.includes('gestor') || roleStr.includes('senior') || roleStr.includes('consultor')) {
        autoPercentage = 25; autoLevel = localize('Baixo', 'Low', 'Bajo');
        autoDesc = localize('Perfis de gestão e consultoria sénior têm risco baixo de automação.', 'Senior management and consulting profiles have low automation risk.', 'Los perfiles sénior de gestión y consultoría tienen bajo riesgo de automatización.');
        autoRecs = [
          localize('Reforçar competências de people management', 'Strengthen people management skills', 'Reforzar competencias de people management'),
          localize('Integrar ferramentas de IA no dia-a-dia', 'Integrate AI tools into day-to-day work', 'Integrar herramientas de IA en el día a día'),
          localize('Desenvolver expertise em áreas emergentes do setor', 'Develop expertise in emerging sector areas', 'Desarrollar expertise en áreas emergentes del sector'),
        ];
      } else if (roleStr.includes('admin') || roleStr.includes('assist') || roleStr.includes('data entry') || roleStr.includes('operador')) {
        autoPercentage = 65; autoLevel = localize('Alto', 'High', 'Alto');
        autoDesc = localize('Funções operacionais e administrativas têm risco elevado de automação.', 'Operational and administrative roles have high automation risk.', 'Las funciones operativas y administrativas tienen alto riesgo de automatización.');
        autoRecs = [
          localize('Desenvolver competências analíticas e de interpretação de dados', 'Develop analytical and data interpretation skills', 'Desarrollar competencias analíticas y de interpretación de datos'),
          localize('Aprender ferramentas de automação (RPA, low-code)', 'Learn automation tools (RPA, low-code)', 'Aprender herramientas de automatización (RPA, low-code)'),
          localize('Investir em upskilling para funções de maior valor acrescentado', 'Invest in upskilling for higher-value roles', 'Invertir en upskilling para funciones de mayor valor añadido'),
        ];
      }
      automationRisk = { percentage: autoPercentage, level: autoLevel, description: autoDesc, recommendations: autoRecs };
    }

    // ─── 8. IMPROVEMENT ACTIONS ─────────────────────────────────────────
    improvementActions = quadrants
      .filter((q: any) => q.weaknesses && q.weaknesses.length > 0)
      .map((q: any) => ({
        action: q.weaknesses![0],
        before: localize(
          `Score actual: ${q.score}/100 (${q.score >= q.benchmark ? 'acima' : 'abaixo'} do benchmark de ${q.benchmark})`,
          `Current score: ${q.score}/100 (${q.score >= q.benchmark ? 'above' : 'below'} the benchmark of ${q.benchmark})`,
          `Puntuación actual: ${q.score}/100 (${q.score >= q.benchmark ? 'por encima' : 'por debajo'} del benchmark de ${q.benchmark})`
        ),
        after: localize(
          `Score estimado após melhoria: ${Math.min(100, q.score + 8)}/100`,
          `Estimated score after improvement: ${Math.min(100, q.score + 8)}/100`,
          `Puntuación estimada tras la mejora: ${Math.min(100, q.score + 8)}/100`
        ),
        impact: q.score < q.benchmark ? localize('Alto', 'High', 'Alto') : localize('Médio', 'Medium', 'Medio'),
        dimension: q.title,
      }));

    // ─── 9. PRIORITY MATRIX ─────────────────────────────────────────────
    priorityMatrix = quadrants.map((q: any) => {
      const gap = q.benchmark - q.score;
      return {
        dimension: q.title,
        urgency: gap > 5 ? localize('Alta', 'High', 'Alta') : gap > -5 ? localize('Média', 'Medium', 'Media') : localize('Baixa', 'Low', 'Baja'),
        currentScore: q.score,
        potentialScore: Math.min(100, q.score + (gap > 0 ? gap + 5 : 5)),
        actions: [
          ...(q.weaknesses || []).slice(0, 2),
          ...(q.strengths ? [`Manter: ${q.strengths[0]}`] : []),
        ].filter(Boolean),
      };
    }).sort((a: any, b: any) => {
      const urgencyOrder: Record<string, number> = {
        [localize('Alta', 'High', 'Alta')]: 0,
        [localize('Média', 'Medium', 'Media')]: 1,
        [localize('Baixa', 'Low', 'Baja')]: 2,
      };
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
          if (f && typeof f === 'object') {
            return f.detail || f.factor || f.name || f.title || f.issue || f.description || JSON.stringify(f);
          }
          return '';
        }).filter(Boolean);
      }

      const fallbackFactorCandidates = [
        atsTopFactor,
        ...(Array.isArray(analysis.global_summary?.improvements) ? analysis.global_summary.improvements : []),
        ...(Array.isArray(analysis.weaknesses) ? analysis.weaknesses : []),
        ...(Array.isArray(analysis.cv_problems)
          ? analysis.cv_problems.flatMap((problem: any) => [problem?.title, problem?.description, problem?.rewriteSuggestion, problem?.correctionExample])
          : []),
      ]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value.trim());

      const dedupedFactors = [...factors, ...fallbackFactorCandidates].filter((value, index, array) => {
        const normalized = value.toLowerCase();
        return array.findIndex((candidate) => candidate.toLowerCase() === normalized) === index;
      });

      factors = dedupedFactors.slice(0, 6);

      if (factors.length < 3) {
        const genericFactorFallbacks = [
          localize('Optimizar palavras-chave para a função-alvo', 'Optimise keywords for the target role', 'Optimizar palabras clave para la función objetivo'),
          localize('Usar secções standard e títulos reconhecíveis pelo ATS', 'Use standard sections and ATS-recognisable headings', 'Usar secciones estándar y títulos reconocibles por el ATS'),
          localize('Evitar tabelas, colunas e elementos visuais complexos', 'Avoid tables, columns and complex visual elements', 'Evitar tablas, columnas y elementos visuales complejos'),
          localize('Garantir datas, competências e experiência em formato linear e legível', 'Keep dates, skills and experience in a linear readable format', 'Mantener fechas, competencias y experiencia en un formato lineal y legible'),
        ];

        factors = [...factors, ...genericFactorFallbacks].filter((value, index, array) => {
          const normalized = value.toLowerCase();
          return array.findIndex((candidate) => candidate.toLowerCase() === normalized) === index;
        }).slice(0, 6);
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
        factors: factors.length > 0 ? factors : [atsTopFactor || localize('Optimizar palavras-chave para a função-alvo', 'Optimise keywords for the target role', 'Optimizar palabras clave para la función objetivo')],
        atsSystems: atsSystems.length > 0 ? atsSystems : ['Workday', 'Taleo', 'Greenhouse', 'SAP SuccessFactors', 'iCIMS'],
        quickFixes: Array.isArray(da.quickFixes)
          ? da.quickFixes.map((fix: any) => {
              if (typeof fix === 'string') return fix;
              if (fix && typeof fix === 'object') return fix.detail || fix.fix || fix.action || fix.title || JSON.stringify(fix);
              return '';
            }).filter(Boolean)
          : [
          localize('Usar formato cronológico inverso', 'Use reverse-chronological format', 'Usar formato cronológico inverso'),
          localize('Evitar tabelas, colunas e gráficos', 'Avoid tables, columns and graphics', 'Evitar tablas, columnas y gráficos'),
          localize('Incluir palavras-chave do anúncio de emprego', 'Include keywords from the job posting', 'Incluir palabras clave de la oferta de empleo'),
          localize('Usar fontes standard (Arial, Calibri, Times)', 'Use standard fonts (Arial, Calibri, Times)', 'Usar fuentes estándar (Arial, Calibri, Times)'),
          localize('Guardar em PDF com texto seleccionável', 'Save as PDF with selectable text', 'Guardar en PDF con texto seleccionable'),
        ],
      };
    } else {
      detailedAtsAnalysis = {
        factors: [
          atsTopFactor || localize('Optimizar palavras-chave para a função-alvo', 'Optimise keywords for the target role', 'Optimizar palabras clave para la función objetivo'),
          ...(analysis.global_summary?.improvements || []).slice(0, 3),
        ].filter(Boolean),
        atsSystems: ['Workday', 'Taleo', 'Greenhouse', 'SAP SuccessFactors', 'iCIMS'],
        quickFixes: [
          localize('Usar formato cronológico inverso', 'Use reverse-chronological format', 'Usar formato cronológico inverso'),
          localize('Evitar tabelas, colunas e gráficos', 'Avoid tables, columns and graphics', 'Evitar tablas, columnas y gráficos'),
          localize('Incluir palavras-chave do anúncio de emprego', 'Include keywords from the job posting', 'Incluir palabras clave de la oferta de empleo'),
          localize('Usar fontes standard (Arial, Calibri, Times)', 'Use standard fonts (Arial, Calibri, Times)', 'Usar fuentes estándar (Arial, Calibri, Times)'),
          localize('Guardar em PDF com texto seleccionável', 'Save as PDF with selectable text', 'Guardar en PDF con texto seleccionable'),
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
          localize('Nome e título profissional (0-2 segundos)', 'Name and professional title (0-2 seconds)', 'Nombre y título profesional (0-2 segundos)'),
          localize('Experiência mais recente (2-5 segundos)', 'Most recent experience (2-5 seconds)', 'Experiencia más reciente (2-5 segundos)'),
          localize('Formação académica (5-8 segundos)', 'Academic background (5-8 seconds)', 'Formación académica (5-8 segundos)'),
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
          localize('Nome e título profissional (0-2 segundos)', 'Name and professional title (0-2 seconds)', 'Nombre y título profesional (0-2 segundos)'),
          localize('Experiência mais recente (2-5 segundos)', 'Most recent experience (2-5 seconds)', 'Experiencia más reciente (2-5 segundos)'),
          localize('Formação académica (5-8 segundos)', 'Academic background (5-8 seconds)', 'Formación académica (5-8 segundos)'),
          localize('Competências-chave e certificações (8-15 segundos)', 'Key skills and certifications (8-15 seconds)', 'Competencias clave y certificaciones (8-15 segundos)'),
          localize('Coerência geral e formatação (15-30 segundos)', 'Overall coherence and formatting (15-30 seconds)', 'Coherencia general y formato (15-30 segundos)'),
        ],
        frictionPoints: [
          ...(analysis.global_summary?.improvements || []).slice(0, 2),
          ...(quadrants.filter((q: any) => q.score < q.benchmark).map((q: any) => localize(`${q.title}: abaixo do benchmark (${q.score} vs ${q.benchmark})`, `${q.title}: below benchmark (${q.score} vs ${q.benchmark})`, `${q.title}: por debajo del benchmark (${q.score} vs ${q.benchmark})`))),
        ].filter(Boolean).slice(0, 4),
        positiveSignals: [
          ...(analysis.global_summary?.strengths || []).slice(0, 2),
          ...(quadrants.filter((q: any) => q.score >= q.benchmark).map((q: any) => localize(`${q.title}: acima do benchmark (+${q.score - q.benchmark})`, `${q.title}: above benchmark (+${q.score - q.benchmark})`, `${q.title}: por encima del benchmark (+${q.score - q.benchmark})`))),
        ].filter(Boolean).slice(0, 4),
        readingFlow: localize(
          `O recrutador identifica rapidamente o perfil como ${perceivedRole || 'profissional qualificado'} (${perceivedSeniority || 'nível não determinado'}). ${quadrants.filter((q: any) => q.score >= q.benchmark).length >= 3 ? 'A maioria das dimensões está acima do benchmark, transmitindo uma imagem sólida.' : 'Algumas dimensões estão abaixo do benchmark, o que pode gerar hesitação na triagem inicial.'}`,
          `The recruiter quickly identifies the profile as ${perceivedRole || 'a qualified professional'} (${perceivedSeniority || 'undetermined level'}). ${quadrants.filter((q: any) => q.score >= q.benchmark).length >= 3 ? 'Most dimensions are above benchmark, conveying a strong image.' : 'Some dimensions are below benchmark, which may create hesitation in the initial screening.'}`,
          `El reclutador identifica rápidamente el perfil como ${perceivedRole || 'un perfil cualificado'} (${perceivedSeniority || 'nivel no determinado'}). ${quadrants.filter((q: any) => q.score >= q.benchmark).length >= 3 ? 'La mayoría de las dimensiones están por encima del benchmark, transmitiendo una imagen sólida.' : 'Algunas dimensiones están por debajo del benchmark, lo que puede generar dudas en el cribado inicial.'}`
        ),
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
        week: localize('Semana 1-2', 'Weeks 1-2', 'Semanas 1-2'),
        title: localize('Optimização de Conteúdo', 'Content Optimisation', 'Optimización de Contenido'),
        actions: [
          localize('Reescrever o resumo profissional com foco em resultados quantificáveis', 'Rewrite the professional summary with a focus on quantified results', 'Reescribir el resumen profesional con foco en resultados cuantificables'),
          localize('Adicionar métricas de impacto a cada experiência (%, €, equipas geridas)', 'Add impact metrics to each experience (%, €, teams managed)', 'Añadir métricas de impacto a cada experiencia (%, €, equipos gestionados)'),
          localize('Alinhar palavras-chave com as funções-alvo', 'Align keywords with target roles', 'Alinear palabras clave con las funciones objetivo'),
        ],
      },
      {
        week: localize('Semana 2-3', 'Weeks 2-3', 'Semanas 2-3'),
        title: localize('Estrutura e Formatação', 'Structure and Formatting', 'Estructura y Formato'),
        actions: [
          localize('Reorganizar secções por ordem de relevância para o recrutador', 'Reorganise sections by order of relevance for the recruiter', 'Reorganizar secciones por orden de relevancia para el reclutador'),
          localize('Garantir compatibilidade ATS (formato, fontes, estrutura)', 'Ensure ATS compatibility (format, fonts, structure)', 'Garantizar compatibilidad ATS (formato, fuentes, estructura)'),
          localize('Adicionar secção de competências-chave com keywords relevantes', 'Add a key-skills section with relevant keywords', 'Añadir una sección de competencias clave con keywords relevantes'),
        ],
      },
      {
        week: localize('Semana 3-4', 'Weeks 3-4', 'Semanas 3-4'),
        title: localize('Validação e Refinamento', 'Validation and Refinement', 'Validación y Refinamiento'),
        actions: [
          localize('Pedir feedback a 2-3 profissionais do setor', 'Ask 2-3 professionals in the sector for feedback', 'Pedir feedback a 2-3 profesionales del sector'),
          localize('Testar o CV em ferramentas ATS gratuitas', 'Test the CV with free ATS tools', 'Probar el CV en herramientas ATS gratuitas'),
          localize('Criar versões adaptadas para diferentes funções-alvo', 'Create tailored versions for different target roles', 'Crear versiones adaptadas para distintas funciones objetivo'),
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
        currency: 'EUR', period: localize('mensal', 'monthly', 'mensual'),
        benefits: [
          localize('Seguro de saúde', 'Health insurance', 'Seguro de salud'),
          localize('Subsídio de alimentação', 'Meal allowance', 'Subsidio de comida'),
          localize('Formação contínua', 'Continuous training', 'Formación continua'),
        ],
        benefitsNote: localize('Valores de referência para o mercado português.', 'Reference values for the Portuguese market.', 'Valores de referencia para el mercado portugués.'),
        source: localize('Dados agregados do mercado português (Hays, Michael Page, Robert Walters, Mercer 2024/2025)', 'Aggregated Portuguese market data (Hays, Michael Page, Robert Walters, Mercer 2024/2025)', 'Datos agregados del mercado portugués (Hays, Michael Page, Robert Walters, Mercer 2024/2025)'),
      },
      automationRisk: {
        percentage: 35,
        level: localize('Médio', 'Medium', 'Medio'),
        description: localize('Risco moderado de automação.', 'Moderate automation risk.', 'Riesgo moderado de automatización.'),
        recommendations: [
          localize('Investir em competências de liderança', 'Invest in leadership skills', 'Invertir en competencias de liderazgo'),
          localize('Desenvolver pensamento estratégico', 'Develop strategic thinking', 'Desarrollar pensamiento estratégico'),
          localize('Aprofundar conhecimentos em IA', 'Deepen AI knowledge', 'Profundizar conocimientos en IA'),
        ],
      },
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
      pick('Resultados quantificáveis', 'Quantified results', 'Resultados cuantificables', lang),
      pick('Métricas de impacto', 'Impact metrics', 'Métricas de impacto', lang),
      pick('Verbos de ação', 'Action verbs', 'Verbos de acción', lang),
      pick('Competências técnicas específicas', 'Specific technical skills', 'Competencias técnicas específicas', lang),
      pick('Certificações relevantes', 'Relevant certifications', 'Certificaciones relevantes', lang),
      pick('Palavras-chave do sector', 'Sector keywords', 'Palabras clave del sector', lang),
      pick('Soft skills mensuráveis', 'Measurable soft skills', 'Soft skills medibles', lang),
      pick('Ferramentas e tecnologias', 'Tools and technologies', 'Herramientas y tecnologías', lang),
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
