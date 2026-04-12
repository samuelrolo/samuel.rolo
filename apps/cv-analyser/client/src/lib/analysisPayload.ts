import { transformGeminiResponse } from "@/lib/transformGeminiResponse";

export type SupportedLanguage = 'pt' | 'en' | 'es';

const STORAGE_VERSION = '2026-04-12';

const normalizeLanguage = (language?: string): SupportedLanguage => {
  if (language === 'en' || language === 'es') return language;
  return 'pt';
};

const localize = (language: SupportedLanguage, pt: string, en: string, es: string) => {
  if (language === 'en') return en;
  if (language === 'es') return es;
  return pt;
};

const safeObject = (value: any): Record<string, any> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  return {};
};

const safeArray = <T = any>(value: any): T[] => Array.isArray(value) ? value : [];

const preferObject = (...values: any[]): Record<string, any> => {
  for (const value of values) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  }
  return {};
};

export function normalizeLinkedinRoastPayload(payload: any, language?: string) {
  const lang = normalizeLanguage(language);
  const raw = safeObject(payload);
  const teaser = preferObject(raw.teaser, raw.data?.teaser);
  const analysis = preferObject(raw.analise_completa, raw.data?.analise_completa, raw.analysis, raw.data?.analysis);

  return {
    success: raw.success !== false,
    analysis_type: 'linkedin_roast',
    language: lang,
    storage_version: STORAGE_VERSION,
    teaser,
    analysis,
    raw,
  };
}

export function normalizeCareerPathPayload(payload: any, language?: string) {
  const lang = normalizeLanguage(language);
  const raw = safeObject(payload);
  const careerPath = safeObject(raw.career_path);
  const analysis = preferObject(
    careerPath.career_path,
    careerPath.analysis,
    careerPath.data,
    raw.career_path,
    raw.analysis,
    raw.data,
    raw,
  );

  return {
    success: raw.success !== false,
    analysis_type: 'career_path',
    language: lang,
    storage_version: STORAGE_VERSION,
    analysis,
    raw,
  };
}

export function normalizeCareerIntelligencePayload(payload: any, language?: string) {
  const lang = normalizeLanguage(language);
  const raw = safeObject(payload);
  const careerIntelligence = safeObject(raw.career_intelligence);
  const analysis = preferObject(
    careerIntelligence.career_intelligence,
    careerIntelligence.career_path,
    careerIntelligence.analysis,
    careerIntelligence.data,
    raw.career_intelligence,
    raw.career_path,
    raw.analysis,
    raw.data,
    raw,
  );

  return {
    success: raw.success !== false,
    analysis_type: 'career_intelligence',
    language: lang,
    storage_version: STORAGE_VERSION,
    analysis,
    raw,
  };
}

function adaptStudentPackLegacyToUnified(params: {
  cv: any;
  cvRaw: any;
  linkedin: any;
  language?: string;
}) {
  const lang = normalizeLanguage(params.language);
  const cv = safeObject(params.cv);
  const cvRaw = safeObject(params.cvRaw);
  const linkedin = safeObject(params.linkedin);
  const linkedinNormalized = normalizeLinkedinRoastPayload(linkedin, lang);
  const liTeaser = linkedinNormalized.teaser;
  const liAnalysis = linkedinNormalized.analysis;
  const cp = safeObject(cvRaw.candidate_profile);
  const overallScore = typeof cv.overallScore === 'number' ? cv.overallScore : 0;
  const nivel = overallScore >= 75
    ? localize(lang, 'Destacado', 'Outstanding', 'Destacado')
    : overallScore >= 50
      ? localize(lang, 'Competitivo', 'Competitive', 'Competitivo')
      : localize(lang, 'Em Desenvolvimento', 'In Development', 'En Desarrollo');

  const scoresCv: Record<string, any> = {};
  for (const quadrant of safeArray(cv.quadrants)) {
    const key = String(quadrant?.title || '').toLowerCase().replace(/[^a-z]/g, '_');
    if (!key) continue;
    scoresCv[key] = {
      valor: quadrant?.score || 0,
      benchmark_estudantes: quadrant?.benchmark || 65,
    };
  }

  const scoresLinkedin: Record<string, any> = {};
  for (const [key, value] of Object.entries(safeObject(liAnalysis.dimensoes))) {
    scoresLinkedin[key] = {
      valor: (value as any)?.score || 0,
      analise: (value as any)?.analise || '',
    };
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  for (const quadrant of safeArray(cv.quadrants)) {
    strengths.push(...safeArray<string>(quadrant?.strengths));
    weaknesses.push(...safeArray<string>(quadrant?.weaknesses));
  }

  const problemasCv = safeArray(cv.cvProblems).map((problem: any) => ({
    problema: problem?.title || problem?.problema || '',
    descricao: problem?.description || problem?.descricao || '',
    explicacao_completa: problem?.explanation || problem?.explicacao_completa || '',
    exemplo_correcao: problem?.fix || problem?.exemplo_correcao || '',
    reescrita_sugerida: problem?.rewrite || problem?.reescrita_sugerida || '',
  }));

  const rawActions = safeArray(cv.actionPlan30Days);
  const plano90: Record<string, any> = {};
  if (rawActions.length > 0) {
    const isStructured = typeof rawActions[0] === 'object' && rawActions[0] !== null && (rawActions[0].actions || rawActions[0].week || rawActions[0].title);
    if (isStructured) {
      const phaseKeys = ['semana_1_2', 'semana_3_4', 'mes_2', 'mes_3'];
      rawActions.slice(0, 4).forEach((item: any, index: number) => {
        const key = phaseKeys[index];
        const tema = item?.title || item?.tema || localize(lang, `Fase ${index + 1}`, `Phase ${index + 1}`, `Fase ${index + 1}`);
        const acoes = Array.isArray(item?.actions)
          ? item.actions.map((entry: any) => typeof entry === 'string' ? entry : entry?.action || entry?.acao || JSON.stringify(entry))
          : Array.isArray(item?.tasks)
            ? item.tasks.map((entry: any) => typeof entry === 'string' ? entry : entry?.action || entry?.acao || JSON.stringify(entry))
            : typeof item?.action === 'string'
              ? [item.action]
              : typeof item?.acao === 'string'
                ? [item.acao]
                : [];
        if (acoes.length > 0) plano90[key] = { tema, acoes };
      });
    } else {
      const chunk = Math.ceil(rawActions.length / 4);
      const phases = [
        { key: 'semana_1_2', tema: localize(lang, 'Fundação', 'Foundation', 'Fundación') },
        { key: 'semana_3_4', tema: localize(lang, 'Optimização', 'Optimization', 'Optimización') },
        { key: 'mes_2', tema: localize(lang, 'Expansão', 'Expansion', 'Expansión') },
        { key: 'mes_3', tema: localize(lang, 'Consolidação', 'Consolidation', 'Consolidación') },
      ];
      phases.forEach((phase, index) => {
        const slice = rawActions.slice(index * chunk, (index + 1) * chunk);
        if (slice.length === 0) return;
        plano90[phase.key] = {
          tema: phase.tema,
          acoes: slice.map((entry: any) => typeof entry === 'string' ? entry : entry?.action || entry?.acao || JSON.stringify(entry)),
        };
      });
    }
  }

  const headlines = safeArray(liAnalysis.areas_melhoria)
    .map((entry: any) => entry?.recomendacao)
    .filter(Boolean)
    .slice(0, 3);

  const allStrengths = strengths.concat(weaknesses);

  return {
    perfil: {
      nome: cp.name || cp.nome || '',
      curso: cp.detected_role || cp.area || '',
      area_alvo: cv.perceivedRole || cp.detected_role || '',
      resumo_executivo: liAnalysis.sumario_executivo || liTeaser.hook_vendas || '',
    },
    score_global: {
      valor: overallScore,
      nivel,
      interpretacao: liAnalysis.sumario_executivo || liTeaser.hook_vendas || '',
      vs_mercado_entrada: liAnalysis.benchmarking?.resumo || '',
    },
    auditoria_perfil_dual: {
      coerencia_cv_linkedin: overallScore >= 65
        ? localize(lang, 'Alta', 'High', 'Alta')
        : overallScore >= 45
          ? localize(lang, 'Média', 'Medium', 'Media')
          : localize(lang, 'Baixa', 'Low', 'Baja'),
      analise_coerencia: liAnalysis.sumario_executivo || liTeaser.hook_vendas || '',
      primeira_impressao_cv: strengths.slice(0, 2).join('. ') || '',
      primeira_impressao_linkedin: liTeaser.hook_vendas || liAnalysis.hook_vendas || liAnalysis.sumario_executivo || '',
      scores_cv: scoresCv,
      scores_linkedin: scoresLinkedin,
    },
    prontidao_mercado: {
      score_estagio: Math.min(100, Math.round(overallScore * 1.1)),
      score_primeiro_emprego: Math.min(100, overallScore),
      analise_prontidao: liAnalysis.recomendacao_prioritaria || liTeaser.hook_vendas || '',
      o_que_ja_tens: strengths.slice(0, 5),
      o_que_ainda_precisas: weaknesses.slice(0, 5),
    },
    capital_academico: {
      pontos_fortes_academicos: strengths.slice(0, 4),
      oportunidades_nao_aproveitadas: weaknesses.slice(0, 4),
    },
    competencias_transferiveis: {
      mapa_competencias: safeArray<string>(cv.keywords).slice(0, 6).map((keyword: string, index: number) => ({
        competencia: keyword,
        origem: localize(lang, 'CV', 'CV', 'CV'),
        traducao_mercado: keyword,
        evidencia_sugerida: (allStrengths.find((entry: string) => entry.toLowerCase().includes(keyword.toLowerCase().substring(0, 6))) || allStrengths[index] || localize(lang, 'Identificada no CV', 'Identified in CV', 'Identificada en el CV')).substring(0, 120),
      })),
      gaps_criticos: [],
    },
    estrategia_keywords_unificada: {
      ats_score: typeof cv.atsRejectionRate === 'number' ? (100 - cv.atsRejectionRate) : 0,
      seo_linkedin_score: liAnalysis.dimensoes?.visibilidade_seo?.score || 0,
      keywords_presentes: safeArray<string>(cv.keywords).map((keyword: string) => ({ keyword, onde: 'CV' })),
      keywords_em_falta: [],
    },
    marca_pessoal_estudante: {
      headline_linkedin_sugeridas: (safeArray<string>(liAnalysis.headlines_sugeridas).length > 0 ? safeArray<string>(liAnalysis.headlines_sugeridas) : headlines).slice(0, 3),
      resumo_linkedin_sugerido: liAnalysis.resumo_linkedin_sugerido || '',
      problemas_criticos_cv: problemasCv,
      acoes_linkedin_prioritarias: safeArray(liAnalysis.areas_melhoria)
        .map((entry: any) => entry?.diagnostico || entry?.recomendacao || '')
        .filter(Boolean)
        .slice(0, 5),
    },
    primeiros_cargos_alvo: [],
    plano_90_dias: plano90,
    recomendacao_prioritaria: liAnalysis.recomendacao_prioritaria || liTeaser.hook_vendas || '',
  };
}

export function buildUnifiedStudentPackPayload(params: {
  cvRaw: any;
  linkedinRaw: any;
  language?: string;
}) {
  const lang = normalizeLanguage(params.language);
  const cvRaw = preferObject(params.cvRaw?.analysis, params.cvRaw);
  const cvNormalized = transformGeminiResponse(cvRaw, lang);
  const linkedinNormalized = normalizeLinkedinRoastPayload(params.linkedinRaw, lang);
  const analysis = adaptStudentPackLegacyToUnified({
    cv: cvNormalized,
    cvRaw,
    linkedin: linkedinNormalized.raw,
    language: lang,
  });

  return {
    success: true,
    analysis_type: 'student_pack',
    language: lang,
    storage_version: STORAGE_VERSION,
    analysis,
    sources: {
      cv_normalized: cvNormalized,
      cv_raw: cvRaw,
      linkedin: linkedinNormalized.raw,
    },
  };
}
