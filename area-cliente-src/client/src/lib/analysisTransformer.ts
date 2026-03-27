/**
 * analysisTransformer.ts
 * Transforms raw Gemini/hyper-task CV analysis responses into the structured
 * format expected by the AnalysisResults component.
 */

export interface TransformedAnalysis {
  score?: number;
  atsScore?: number;
  overall_score?: number;
  overallScore?: number;
  atsRejectionRate?: number;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  recommendations?: string[];
  keywords?: string[];
  perceivedRole?: string;
  perceivedSeniority?: string;
  salaryRange?: { min: number; mid: number; max: number };
  quadrants?: Array<{
    title: string;
    score: number;
    benchmark: number;
    impactPhrase: string;
    strengths?: string[];
    weaknesses?: string[];
  }>;
  sections?: Array<{
    title: string;
    score?: number;
    benchmark?: number;
    insight?: string;
    items?: string[];
  }>;
  cvProblems?: Array<{
    title: string;
    description: string;
    fullExplanation?: string;
    correctionExample?: string;
    rewriteSuggestion?: string;
  }>;
  raw?: Record<string, any>;
}

/**
 * Attempts to extract a numeric score from various possible response shapes.
 */
function extractScore(data: any): number | undefined {
  if (typeof data?.score === 'number') return data.score;
  if (typeof data?.atsScore === 'number') return data.atsScore;
  if (typeof data?.overall_score === 'number') return data.overall_score;
  if (typeof data?.ats_score === 'number') return data.ats_score;
  if (typeof data?.nota_geral === 'number') return data.nota_geral;
  if (typeof data?.global_score === 'number') return data.global_score;
  // Try parsing from string
  const scoreStr = data?.score ?? data?.atsScore ?? data?.overall_score;
  if (typeof scoreStr === 'string') {
    const parsed = parseInt(scoreStr, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return undefined;
}

/**
 * Extracts an array of strings from various possible field names.
 */
function extractStringArray(data: any, ...keys: string[]): string[] {
  for (const key of keys) {
    const val = data?.[key];
    if (Array.isArray(val)) {
      return val.map((item: any) => (typeof item === 'string' ? item : item?.text || item?.description || JSON.stringify(item)));
    }
  }
  return [];
}

/**
 * Main transformer: takes raw Gemini response and returns a normalized structure.
 */
export function transformGeminiResponse(raw: any): TransformedAnalysis {
  if (!raw) return {};

  const analysis = raw?.analysis || raw;

  const score = extractScore(analysis);
  const strengths = extractStringArray(analysis, 'strengths', 'pontos_fortes', 'strong_points', 'positive_aspects');
  const improvements = extractStringArray(analysis, 'improvements', 'areas_melhoria', 'weak_points', 'areas_to_improve', 'gaps');
  const recommendations = extractStringArray(analysis, 'recommendations', 'recomendacoes', 'suggestions', 'action_items');

  const summary =
    analysis?.summary ||
    analysis?.resumo ||
    analysis?.executive_summary?.summary ||
    analysis?.executive_summary?.resumo ||
    (typeof analysis?.executive_summary === 'string' ? analysis.executive_summary : undefined);

  // Try to extract sections/dimensions
  const sections: TransformedAnalysis['sections'] = [];
  const dims = analysis?.dimensions || analysis?.sections || analysis?.categories || analysis?.quadrants;
  if (Array.isArray(dims)) {
    for (const dim of dims) {
      sections.push({
        title: dim.title || dim.name || dim.dimension || 'Section',
        score: typeof dim.score === 'number' ? dim.score : undefined,
        benchmark: typeof dim.benchmark === 'number' ? dim.benchmark : undefined,
        insight: dim.insight || dim.feedback || dim.description,
        items: extractStringArray(dim, 'items', 'points', 'details'),
      });
    }
  }

  // Extract quadrants (for AnalysisResults component)
  const quadrants: TransformedAnalysis['quadrants'] = [];
  const quads = analysis?.quadrants || analysis?.dimensions || analysis?.sections;
  if (Array.isArray(quads)) {
    for (const q of quads) {
      quadrants.push({
        title: q.title || q.name || q.dimension || 'Section',
        score: typeof q.score === 'number' ? q.score : 50,
        benchmark: typeof q.benchmark === 'number' ? q.benchmark : 65,
        impactPhrase: q.impactPhrase || q.impact_phrase || q.insight || q.feedback || q.description || '',
        strengths: extractStringArray(q, 'strengths', 'pontos_fortes'),
        weaknesses: extractStringArray(q, 'weaknesses', 'pontos_fracos', 'gaps'),
      });
    }
  }

  // Extract ATS rejection rate
  const atsRejectionRate = typeof analysis?.atsRejectionRate === 'number' ? analysis.atsRejectionRate
    : typeof analysis?.ats_rejection_rate === 'number' ? analysis.ats_rejection_rate
    : typeof analysis?.rejectionRate === 'number' ? analysis.rejectionRate
    : score ? Math.max(5, Math.min(85, 100 - score)) : 40;

  // Extract keywords
  const keywords = extractStringArray(analysis, 'keywords', 'key_skills', 'skills', 'tags', 'competencias');

  // Extract perceived role/seniority
  const perceivedRole = analysis?.perceivedRole || analysis?.perceived_role || analysis?.detected_role || analysis?.role;
  const perceivedSeniority = analysis?.perceivedSeniority || analysis?.perceived_seniority || analysis?.seniority;

  // Extract salary range
  const sr = analysis?.salaryRange || analysis?.salary_range || analysis?.salary;
  const salaryRange = sr ? { min: sr.min || 1200, mid: sr.mid || sr.median || 1650, max: sr.max || 2100 } : undefined;

  // Extract CV problems
  const cvProblems: TransformedAnalysis['cvProblems'] = [];
  const probs = analysis?.cvProblems || analysis?.cv_problems || analysis?.problems;
  if (Array.isArray(probs)) {
    for (const p of probs) {
      cvProblems.push({
        title: p.title || p.name || 'Issue',
        description: p.description || p.text || '',
        fullExplanation: p.fullExplanation || p.full_explanation,
        correctionExample: p.correctionExample || p.correction_example,
        rewriteSuggestion: p.rewriteSuggestion || p.rewrite_suggestion,
      });
    }
  }

  return {
    score,
    atsScore: score,
    overall_score: score,
    overallScore: score,
    atsRejectionRate,
    summary,
    strengths,
    improvements,
    recommendations,
    keywords: keywords.length > 0 ? keywords : undefined,
    perceivedRole: typeof perceivedRole === 'string' ? perceivedRole : undefined,
    perceivedSeniority: typeof perceivedSeniority === 'string' ? perceivedSeniority : undefined,
    salaryRange,
    quadrants: quadrants.length > 0 ? quadrants : undefined,
    sections: sections.length > 0 ? sections : undefined,
    cvProblems: cvProblems.length > 0 ? cvProblems : undefined,
    raw: analysis,
  };
}
