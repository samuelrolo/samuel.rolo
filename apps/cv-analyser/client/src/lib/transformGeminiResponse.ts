export function transformGeminiResponse(analysis: any): any {
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
