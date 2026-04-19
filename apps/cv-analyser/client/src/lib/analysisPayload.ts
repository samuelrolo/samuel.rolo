import { transformGeminiResponse } from "@/lib/transformGeminiResponse";

export type SupportedLanguage = 'pt' | 'en' | 'es';

const STORAGE_VERSION = '2026-04-14';

const normalizeLanguage = (language?: string): SupportedLanguage => {
  if (language === 'en' || language === 'es') return language;
  return 'pt';
};

const localize = (language: SupportedLanguage, pt: string, en: string, es: string) => {
  if (language === 'en') return en;
  if (language === 'es') return es;
  return pt;
};

const stripJsonCodeFences = (value: string) => value.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

const safeObject = (value: any): Record<string, any> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const cleaned = stripJsonCodeFences(value);
    if (cleaned.startsWith('{')) {
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      } catch {
        return {};
      }
    }
  }
  return {};
};

const safeArray = <T = any>(value: any): T[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const cleaned = stripJsonCodeFences(value);
    if (cleaned.startsWith('[')) {
      try {
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }
  return [];
};

const preferObject = (...values: any[]): Record<string, any> => {
  for (const value of values) {
    const parsed = safeObject(value);
    if (Object.keys(parsed).length > 0) return parsed;
  }
  return {};
};

const selectStudentPackCvRaw = (payload: any): Record<string, any> => {
  const root = safeObject(payload);

  if (hasMeaningfulValue(root.candidate_profile)) return root;
  if (hasMeaningfulValue(root.data?.candidate_profile)) return safeObject(root.data);
  if (hasMeaningfulValue(root.raw?.candidate_profile)) return safeObject(root.raw);
  if (hasMeaningfulValue(root.analysis?.candidate_profile)) return safeObject(root.analysis);

  return root;
};

const selectStudentPackCvAnalysis = (payload: any): Record<string, any> => {
  const root = safeObject(payload);
  return preferObject(root.analysis, root.data?.analysis, root.raw?.analysis, root);
};

const resolveCandidateName = (candidateProfile: Record<string, any>) => (
  candidateProfile.detected_name || candidateProfile.name || candidateProfile.nome || ''
);

const hasMeaningfulValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

const CAREER_REPORT_KEYS = [
  'current_positioning',
  'cv_linkedin_cross_analysis',
  'next_roles',
  'development_plan',
  'immediate_actions',
  'long_term_vision',
  'strategic_paths',
  'strategic_comparison',
  'tradeoffs',
  'decision_recommendation',
  'action_plan_by_path',
  'market_context',
  'career_potential_score',
] as const;

const CAREER_META_KEYS = [
  'name',
  'candidate_name',
  'current_role',
  'detected_name',
  'detected_role',
] as const;

const countCareerReportFields = (candidate: Record<string, any>) => {
  let score = 0;
  for (const key of CAREER_REPORT_KEYS) {
    if (hasMeaningfulValue(candidate[key])) score += 1;
  }
  return score;
};

const mergeSelectedFields = (target: Record<string, any>, source: Record<string, any>, keys: readonly string[]) => {
  for (const key of keys) {
    if (!(key in source)) continue;
    const incoming = source[key];
    const existing = target[key];
    if (hasMeaningfulValue(incoming) || !hasMeaningfulValue(existing)) {
      target[key] = incoming;
    }
  }
};

const collectCareerReportAnalysis = (
  payload: any,
  analysisType: 'career_path' | 'career_intelligence'
): Record<string, any> => {
  const root = safeObject(payload);
  const nestedReportKey = analysisType === 'career_intelligence' ? 'career_intelligence' : 'career_path';
  // No guard needed – both career_path and career_intelligence share the same
  // response shape and the BFS below will find the report fields regardless.

  const queue: any[] = [root];
  const seen = new Set<any>();
  const candidates: Record<string, any>[] = [];

  while (queue.length > 0) {
    const current = safeObject(queue.shift());
    if (Object.keys(current).length === 0 || seen.has(current)) continue;
    seen.add(current);
    candidates.push(current);

    for (const nestedKey of ['raw', 'data', 'analysis', 'career_intelligence', 'career_path']) {
      const nested = safeObject(current[nestedKey]);
      if (Object.keys(nested).length > 0 && !seen.has(nested)) {
        queue.push(nested);
      }
    }
  }

  const rankedCandidates = candidates
    .map(candidate => ({ candidate, score: countCareerReportFields(candidate) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => a.score - b.score)
    .map(entry => entry.candidate);

  const analysis: Record<string, any> = {};
  for (const candidate of rankedCandidates.length > 0 ? rankedCandidates : candidates) {
    mergeSelectedFields(analysis, candidate, CAREER_META_KEYS);
    mergeSelectedFields(analysis, candidate, CAREER_REPORT_KEYS);
  }

  return Object.keys(analysis).length > 0 ? analysis : preferObject(root[nestedReportKey], root.analysis, root.career_intelligence, root.career_path, ...candidates, root);
};

const normalizeCareerReportPayload = (payload: any, language: SupportedLanguage, analysisType: 'career_path' | 'career_intelligence') => {
  const raw = safeObject(payload);
  const analysis = collectCareerReportAnalysis(raw, analysisType);

  return {
    success: raw.success !== false,
    analysis_type: analysisType,
    language,
    storage_version: STORAGE_VERSION,
    analysis,
    raw,
  };
};

const normalizeCareerPathPayloadInternal = (payload: any, language: SupportedLanguage) => normalizeCareerReportPayload(payload, language, 'career_path');
const normalizeCareerIntelligencePayloadInternal = (payload: any, language: SupportedLanguage) => normalizeCareerReportPayload(payload, language, 'career_intelligence');

const normalizeCareerPathPayload = (payload: any, language?: string) => normalizeCareerPathPayloadInternal(payload, normalizeLanguage(language));
const normalizeCareerIntelligencePayload = (payload: any, language?: string) => normalizeCareerIntelligencePayloadInternal(payload, normalizeLanguage(language));

export { normalizeCareerPathPayload, normalizeCareerIntelligencePayload };

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
  const linkedinUnavailable = linkedin?.unavailable === true || linkedinNormalized.raw?.unavailable === true || (!hasMeaningfulValue(liTeaser) && !hasMeaningfulValue(liAnalysis));
  const linkedinUnavailableNote = linkedin?.note || linkedinNormalized.raw?.note || localize(
    lang,
    'Os dados do LinkedIn não estavam disponíveis. Este relatório foi gerado apenas com base no CV.',
    'LinkedIn data was not available. This report was generated using the CV only.',
    'Los datos de LinkedIn no estaban disponibles. Este informe se generó solo con base en el CV.'
  );
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
    data_availability: {
      linkedin_available: !linkedinUnavailable,
      linkedin_note: linkedinUnavailable ? linkedinUnavailableNote : '',
    },
    perfil: {
      nome: resolveCandidateName(cp),
      curso: cp.detected_role || cp.area || '',
      area_alvo: cv.perceivedRole || cp.detected_role || '',
      resumo_executivo: linkedinUnavailable
        ? localize(lang, 'Relatório gerado com base no CV. Os dados do LinkedIn não estavam disponíveis nesta análise.', 'Report generated from the CV. LinkedIn data was not available for this analysis.', 'Informe generado con base en el CV. Los datos de LinkedIn no estaban disponibles en este análisis.')
        : (liAnalysis.sumario_executivo || liTeaser.hook_vendas || ''),
    },
    score_global: {
      valor: overallScore,
      nivel,
      interpretacao: linkedinUnavailable ? linkedinUnavailableNote : (liAnalysis.sumario_executivo || liTeaser.hook_vendas || ''),
      vs_mercado_entrada: linkedinUnavailable ? '' : (liAnalysis.benchmarking?.resumo || ''),
    },
    auditoria_perfil_dual: {
      coerencia_cv_linkedin: linkedinUnavailable
        ? localize(lang, 'Indisponível', 'Unavailable', 'No disponible')
        : overallScore >= 65
          ? localize(lang, 'Alta', 'High', 'Alta')
          : overallScore >= 45
            ? localize(lang, 'Média', 'Medium', 'Media')
            : localize(lang, 'Baixa', 'Low', 'Baja'),
      analise_coerencia: linkedinUnavailable ? linkedinUnavailableNote : (liAnalysis.sumario_executivo || liTeaser.hook_vendas || ''),
      primeira_impressao_cv: strengths.slice(0, 2).join('. ') || '',
      primeira_impressao_linkedin: linkedinUnavailable ? linkedinUnavailableNote : (liTeaser.hook_vendas || liAnalysis.hook_vendas || liAnalysis.sumario_executivo || ''),
      scores_cv: scoresCv,
      scores_linkedin: linkedinUnavailable ? {} : scoresLinkedin,
      linkedin_available: !linkedinUnavailable,
      linkedin_note: linkedinUnavailable ? linkedinUnavailableNote : '',
    },
    prontidao_mercado: {
      score_estagio: Math.min(100, Math.round(overallScore * 1.1)),
      score_primeiro_emprego: Math.min(100, overallScore),
      analise_prontidao: linkedinUnavailable ? linkedinUnavailableNote : (liAnalysis.recomendacao_prioritaria || liTeaser.hook_vendas || ''),
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
      seo_linkedin_score: linkedinUnavailable ? 0 : (liAnalysis.dimensoes?.visibilidade_seo?.score || 0),
      keywords_presentes: safeArray<string>(cv.keywords).map((keyword: string) => ({ keyword, onde: 'CV' })),
      keywords_em_falta: [],
      linkedin_note: linkedinUnavailable ? linkedinUnavailableNote : '',
    },
    marca_pessoal_estudante: {
      headline_linkedin_sugeridas: linkedinUnavailable ? [] : (safeArray<string>(liAnalysis.headlines_sugeridas).length > 0 ? safeArray<string>(liAnalysis.headlines_sugeridas) : headlines).slice(0, 3),
      resumo_linkedin_sugerido: linkedinUnavailable ? '' : (liAnalysis.resumo_linkedin_sugerido || ''),
      problemas_criticos_cv: problemasCv,
      acoes_linkedin_prioritarias: linkedinUnavailable ? [] : safeArray(liAnalysis.areas_melhoria)
        .map((entry: any) => entry?.diagnostico || entry?.recomendacao || '')
        .filter(Boolean)
        .slice(0, 5),
      linkedin_note: linkedinUnavailable ? linkedinUnavailableNote : '',
    },
    primeiros_cargos_alvo: [],
    plano_90_dias: plano90,
    recomendacao_prioritaria: linkedinUnavailable ? linkedinUnavailableNote : (liAnalysis.recomendacao_prioritaria || liTeaser.hook_vendas || ''),
  };
}

export function buildUnifiedStudentPackPayload(params: {
  cvRaw: any;
  linkedinRaw: any;
  language?: string;
}) {
  const lang = normalizeLanguage(params.language);
  const cvEnvelope = safeObject(params.cvRaw);
  const cvRaw = selectStudentPackCvRaw(cvEnvelope);
  const cvAnalysis = selectStudentPackCvAnalysis(cvEnvelope);
  const cvNormalized = transformGeminiResponse(cvAnalysis, lang);
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
