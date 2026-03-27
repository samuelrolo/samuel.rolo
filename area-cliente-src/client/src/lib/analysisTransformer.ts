/**
 * analysisTransformer.ts
 * Transforms raw Gemini/hyper-task CV analysis responses into the structured
 * format expected by the AnalysisResults component.
 */

export interface TransformedAnalysis {
  score?: number;
  atsScore?: number;
  overall_score?: number;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  recommendations?: string[];
  sections?: Array<{
    title: string;
    score?: number;
    benchmark?: number;
    insight?: string;
    items?: string[];
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

  return {
    score,
    atsScore: score,
    overall_score: score,
    summary,
    strengths,
    improvements,
    recommendations,
    sections: sections.length > 0 ? sections : undefined,
    raw: analysis,
  };
}
