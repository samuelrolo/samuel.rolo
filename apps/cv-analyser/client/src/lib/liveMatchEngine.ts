/**
 * liveMatchEngine.ts — Client-side engine for the "Live Match" feature.
 *
 * Extracts keywords from a Job Description, matches them against the CV text,
 * computes a global match score, and generates inline reformulation suggestions.
 *
 * Works entirely in the browser — no API calls needed.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MatchedKeyword {
  keyword: string;
  /** 'found' = exact match, 'partial' = synonym/stem match, 'missing' = not found */
  status: 'found' | 'partial' | 'missing';
  importance: 'high' | 'medium' | 'low';
  /** Where in the CV text this keyword was found (character index), -1 if missing */
  positions: number[];
  /** Reformulation suggestion if missing or partial */
  suggestion?: string;
  /** The variant that was found in the CV (for partial matches) */
  foundVariant?: string;
  /** Category: technical, soft-skill, certification, tool, education, experience */
  category: 'technical' | 'soft-skill' | 'certification' | 'tool' | 'education' | 'experience' | 'other';
}

export interface FormatCheck {
  check: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
  fix?: string;
}

export interface LiveMatchResult {
  /** 0-100 global match score */
  globalScore: number;
  /** 0-100 keyword coverage score */
  keywordScore: number;
  /** 0-100 format compatibility score */
  formatScore: number;
  /** All keywords extracted from JD with match status */
  keywords: MatchedKeyword[];
  /** Format checks */
  formatChecks: FormatCheck[];
  /** Annotated CV segments for the editor */
  annotations: Annotation[];
  /** Summary text */
  summary: string;
  /** Number of keywords found / total */
  foundCount: number;
  partialCount: number;
  missingCount: number;
  totalCount: number;
}

export interface Annotation {
  /** Start index in the CV text */
  start: number;
  /** End index in the CV text */
  end: number;
  /** Type of annotation */
  type: 'found' | 'partial' | 'missing-suggestion';
  /** The keyword this annotation relates to */
  keyword: string;
  /** Suggestion text (for missing/partial) */
  suggestion?: string;
  /** Importance level */
  importance: 'high' | 'medium' | 'low';
}

// ─── Synonym / Stem Maps ────────────────────────────────────────────────────

const SYNONYM_MAP: Record<string, string[]> = {
  // PT synonyms
  'gestão de projetos': ['project management', 'gestão de projectos', 'gerenciamento de projetos', 'pm', 'gestão projetos'],
  'liderança': ['leadership', 'líder', 'liderar', 'lider', 'chefia', 'coordenação'],
  'comunicação': ['communication', 'comunicar', 'comunicações'],
  'trabalho em equipa': ['teamwork', 'trabalho em equipe', 'team work', 'colaboração', 'trabalho colaborativo'],
  'resolução de problemas': ['problem solving', 'problem-solving', 'resolução problemas'],
  'análise de dados': ['data analysis', 'data analytics', 'análise dados', 'analítica'],
  'gestão de pessoas': ['people management', 'human resources', 'recursos humanos', 'rh', 'hr', 'gestão pessoas'],
  'transformação digital': ['digital transformation', 'transformação tecnológica'],
  'gestão de mudança': ['change management', 'gestão da mudança', 'change mgmt'],
  'desenvolvimento organizacional': ['organizational development', 'org development', 'desenvolvimento org'],
  'planeamento estratégico': ['strategic planning', 'planejamento estratégico', 'planeamento'],
  'melhoria contínua': ['continuous improvement', 'lean', 'kaizen', 'melhoria continua'],
  'gestão de stakeholders': ['stakeholder management', 'gestão stakeholders'],
  'negociação': ['negotiation', 'negociar', 'negociações'],
  'orçamento': ['budget', 'budgeting', 'orçamentação', 'gestão orçamental'],
  'vendas': ['sales', 'comercial', 'venda'],
  'marketing': ['marketing digital', 'digital marketing', 'mkt'],
  'excel': ['microsoft excel', 'ms excel', 'folhas de cálculo', 'spreadsheets'],
  'python': ['python3', 'programação python'],
  'sql': ['mysql', 'postgresql', 'base de dados', 'database', 'bases de dados'],
  'power bi': ['powerbi', 'power-bi', 'business intelligence', 'bi'],
  'sap': ['sap erp', 'sap hcm', 'sap successfactors', 'sap sf'],
  'agile': ['ágil', 'scrum', 'kanban', 'metodologia ágil', 'agile methodology'],
  'inglês': ['english', 'língua inglesa', 'proficiência inglês'],
  'francês': ['french', 'français', 'língua francesa'],
  'espanhol': ['spanish', 'español', 'castelhano', 'língua espanhola'],
  // EN synonyms
  'project management': ['gestão de projetos', 'pm', 'project mgmt', 'project manager'],
  'leadership': ['liderança', 'lead', 'leading', 'leader'],
  'communication': ['comunicação', 'communications', 'communicate'],
  'teamwork': ['trabalho em equipa', 'team work', 'collaboration', 'collaborative'],
  'problem solving': ['resolução de problemas', 'problem-solving', 'troubleshooting'],
  'data analysis': ['análise de dados', 'data analytics', 'analytics', 'data-driven'],
  'stakeholder management': ['gestão de stakeholders', 'stakeholder engagement'],
  'change management': ['gestão de mudança', 'change mgmt', 'organizational change'],
  'strategic planning': ['planeamento estratégico', 'strategy', 'strategic'],
  'continuous improvement': ['melhoria contínua', 'lean', 'six sigma', 'kaizen'],
  'human resources': ['recursos humanos', 'hr', 'rh', 'people management', 'gestão de pessoas'],
  'digital transformation': ['transformação digital', 'digitalization', 'digitalização'],
  'budget management': ['gestão orçamental', 'budgeting', 'financial planning'],
  'machine learning': ['ml', 'aprendizagem automática', 'deep learning'],
  'artificial intelligence': ['ai', 'ia', 'inteligência artificial'],
};

// Common stop words to filter out
const STOP_WORDS = new Set([
  // PT
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'uns', 'umas',
  'o', 'a', 'os', 'as', 'e', 'ou', 'que', 'para', 'por', 'com', 'se', 'ao', 'à', 'aos', 'às',
  'ser', 'ter', 'estar', 'ir', 'fazer', 'poder', 'dever', 'saber', 'querer', 'ver', 'dar',
  'mais', 'muito', 'bem', 'já', 'ainda', 'também', 'só', 'como', 'mas', 'não', 'sim',
  'este', 'esta', 'esse', 'essa', 'aquele', 'aquela', 'isto', 'isso', 'aquilo',
  'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas',
  'entre', 'sobre', 'após', 'até', 'desde', 'durante', 'perante', 'sem', 'sob',
  // EN
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
  'this', 'that', 'these', 'those', 'it', 'its', 'we', 'our', 'you', 'your', 'they', 'their',
  'as', 'if', 'so', 'than', 'such', 'when', 'where', 'how', 'what', 'which', 'who',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'any', 'no', 'not',
  'only', 'own', 'same', 'too', 'very', 'just', 'about', 'above', 'after', 'again',
]);

// ─── URL Detection ─────────────────────────────────────────────────────────

/**
 * Detect if the input text is a URL rather than a real job description.
 * Returns true if the text looks like a URL or is too short to be a meaningful JD.
 */
export function isURL(text: string): boolean {
  const trimmed = text.trim();
  // Direct URL patterns
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^www\./i.test(trimmed)) return true;
  // LinkedIn job URLs (even without protocol)
  if (/linkedin\.com\/jobs/i.test(trimmed)) return true;
  // If text has fewer than 30 chars and contains domain-like patterns
  if (trimmed.length < 50 && /\.[a-z]{2,}\//i.test(trimmed)) return true;
  return false;
}

// ─── Keyword Extraction ─────────────────────────────────────────────────────

/** Importance indicators in JD text */
const HIGH_IMPORTANCE_SIGNALS = [
  'required', 'must have', 'essential', 'mandatory', 'obrigatório', 'requisito',
  'indispensável', 'necessário', 'fundamental', 'imprescindível', 'critical',
  'minimum', 'mínimo', 'key requirement', 'requisito-chave',
];

const MEDIUM_IMPORTANCE_SIGNALS = [
  'preferred', 'desired', 'preferencial', 'valorizado', 'desejável', 'ideal',
  'nice to have', 'plus', 'diferencial', 'advantage', 'vantagem', 'bonus',
];

/** Category detection patterns */
const CATEGORY_PATTERNS: { pattern: RegExp; category: MatchedKeyword['category'] }[] = [
  { pattern: /\b(certificat|certific|pmp|prince2|itil|aws|azure|google cloud|scrum master|csm|safe|togaf|cissp|cisa)\b/i, category: 'certification' },
  { pattern: /\b(python|java|javascript|typescript|react|angular|vue|node|sql|nosql|mongodb|docker|kubernetes|git|terraform|jenkins|jira|confluence|sap|salesforce|power bi|tableau|excel|word|powerpoint|figma|sketch|photoshop|illustrator)\b/i, category: 'tool' },
  { pattern: /\b(licenciatura|mestrado|doutoramento|mba|bachelor|master|phd|degree|formação|curso|pós-graduação|graduate|undergraduate)\b/i, category: 'education' },
  { pattern: /\b(anos? de experiência|years? of experience|experiência em|experience in|experiência profissional|background in|track record)\b/i, category: 'experience' },
  { pattern: /\b(liderança|leadership|comunicação|communication|trabalho em equipa|teamwork|negociação|negotiation|criatividade|creativity|adaptabilidade|adaptability|resiliência|resilience|empatia|empathy|proatividade|proactivity|pensamento crítico|critical thinking|gestão de tempo|time management|inteligência emocional|emotional intelligence)\b/i, category: 'soft-skill' },
];

function categorizeKeyword(keyword: string): MatchedKeyword['category'] {
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(keyword)) return category;
  }
  return 'technical';
}

function determineImportance(keyword: string, context: string): MatchedKeyword['importance'] {
  const lowerContext = context.toLowerCase();
  const kwLower = keyword.toLowerCase();

  // Check if keyword appears near high-importance signals
  const kwIndex = lowerContext.indexOf(kwLower);
  if (kwIndex >= 0) {
    const surroundingText = lowerContext.substring(Math.max(0, kwIndex - 150), Math.min(lowerContext.length, kwIndex + keyword.length + 150));
    if (HIGH_IMPORTANCE_SIGNALS.some(s => surroundingText.includes(s))) return 'high';
    if (MEDIUM_IMPORTANCE_SIGNALS.some(s => surroundingText.includes(s))) return 'medium';
  }

  // Keywords in the first 30% of JD are usually more important
  const relativePosition = kwIndex / lowerContext.length;
  if (relativePosition < 0.3) return 'high';
  if (relativePosition < 0.6) return 'medium';
  return 'low';
}

/**
 * Extract meaningful keywords/phrases from a Job Description.
 * Uses n-gram extraction (1-4 words) with frequency and position weighting.
 */
export function extractKeywordsFromJD(jdText: string): { keyword: string; importance: MatchedKeyword['importance']; category: MatchedKeyword['category'] }[] {
  const text = jdText.trim();
  if (!text) return [];

  // Detect if input is a URL (not a real job description)
  if (isURL(text)) return [];

  const lower = text.toLowerCase();
  const keywords: Map<string, { count: number; importance: MatchedKeyword['importance']; category: MatchedKeyword['category'] }> = new Map();

  // 1. Extract multi-word phrases (2-4 words) using sliding window
  const words = lower.replace(/[^\w\sáàâãéèêíìîóòôõúùûçñü-]/g, ' ').split(/\s+/).filter(w => w.length > 1);

  for (let n = 4; n >= 2; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      // Skip if all words are stop words
      if (words.slice(i, i + n).every(w => STOP_WORDS.has(w))) continue;
      // Check if this phrase is meaningful (exists in synonym map or has technical terms)
      const isKnown = Object.keys(SYNONYM_MAP).some(k => k === phrase || SYNONYM_MAP[k]?.includes(phrase));
      const hasTechnicalTerm = CATEGORY_PATTERNS.some(p => p.pattern.test(phrase));
      if (isKnown || hasTechnicalTerm) {
        const existing = keywords.get(phrase);
        if (existing) {
          existing.count++;
        } else {
          keywords.set(phrase, {
            count: 1,
            importance: determineImportance(phrase, text),
            category: categorizeKeyword(phrase),
          });
        }
      }
    }
  }

  // 2. Extract single significant words (not stop words, length > 3)
  const significantWords = words.filter(w => !STOP_WORDS.has(w) && w.length > 3);
  const wordFreq: Map<string, number> = new Map();
  for (const w of significantWords) {
    wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  }

  // Only add single words that appear at least once and aren't part of already-extracted phrases
  for (const [word, count] of Array.from(wordFreq.entries())) {
    // Skip if this word is already part of a multi-word keyword
    const isPartOfPhrase = Array.from(keywords.keys()).some(k => k.includes(word) && k !== word);
    if (isPartOfPhrase && count < 3) continue;

    if (!keywords.has(word)) {
      keywords.set(word, {
        count,
        importance: determineImportance(word, text),
        category: categorizeKeyword(word),
      });
    }
  }

  // 3. Sort by importance (high > medium > low) then by count
  const importanceOrder = { high: 0, medium: 1, low: 2 };
  return Array.from(keywords.entries())
    .sort((a, b) => {
      const impDiff = importanceOrder[a[1].importance] - importanceOrder[b[1].importance];
      if (impDiff !== 0) return impDiff;
      return b[1].count - a[1].count;
    })
    .slice(0, 30) // Cap at 30 keywords
    .map(([keyword, data]) => ({
      keyword,
      importance: data.importance,
      category: data.category,
    }));
}

// ─── Matching ───────────────────────────────────────────────────────────────

function findAllOccurrences(text: string, search: string): number[] {
  const positions: number[] = [];
  const lower = text.toLowerCase();
  const searchLower = search.toLowerCase();
  let pos = 0;
  while ((pos = lower.indexOf(searchLower, pos)) !== -1) {
    positions.push(pos);
    pos += searchLower.length;
  }
  return positions;
}

function findSynonymMatch(cvTextLower: string, keyword: string): { positions: number[]; variant: string } | null {
  // Check direct synonyms
  const synonyms = SYNONYM_MAP[keyword] || [];
  // Also check reverse: if keyword is a synonym of another key
  const allSynonyms = [...synonyms];
  for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
    if (syns.includes(keyword) && key !== keyword) {
      allSynonyms.push(key);
    }
  }

  for (const syn of allSynonyms) {
    const positions = findAllOccurrences(cvTextLower, syn);
    if (positions.length > 0) {
      return { positions, variant: syn };
    }
  }

  // Try stem matching (remove common suffixes)
  const stems = [
    keyword.replace(/(ção|ment|tion|ing|ment|ness|ity|ade|ência|ância)$/i, ''),
    keyword.replace(/(s|es|ed|er|or|ador|eiro|ista)$/i, ''),
  ].filter(s => s.length > 3);

  for (const stem of stems) {
    const regex = new RegExp(`\\b${escapeRegex(stem)}\\w*\\b`, 'gi');
    const match = regex.exec(cvTextLower);
    if (match) {
      return { positions: [match.index], variant: match[0] };
    }
  }

  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Suggestion Generation ──────────────────────────────────────────────────

function generateSuggestion(keyword: string, category: MatchedKeyword['category'], lang: 'pt' | 'en'): string {
  const templates = lang === 'pt' ? {
    technical: [
      `Adicione "${keyword}" na secção de competências técnicas ou no resumo profissional.`,
      `Inclua experiência prática com ${keyword} nas descrições de funções.`,
      `Mencione ${keyword} com contexto de resultados obtidos.`,
    ],
    'soft-skill': [
      `Demonstre ${keyword} com exemplos concretos nas experiências profissionais.`,
      `Adicione "${keyword}" ao resumo profissional com evidência de impacto.`,
    ],
    certification: [
      `Adicione a certificação ${keyword} na secção de formação/certificações.`,
      `Se não possui ${keyword}, considere mencioná-la como "em curso" ou "planeada".`,
    ],
    tool: [
      `Inclua ${keyword} na secção de ferramentas/tecnologias com nível de proficiência.`,
      `Mencione ${keyword} no contexto de projetos realizados.`,
    ],
    education: [
      `Verifique se a sua formação em ${keyword} está claramente descrita.`,
      `Destaque a relevância da formação para a função pretendida.`,
    ],
    experience: [
      `Quantifique a sua experiência: "X anos de ${keyword}".`,
      `Destaque realizações mensuráveis relacionadas com ${keyword}.`,
    ],
    other: [
      `Considere incluir "${keyword}" de forma natural no teu CV.`,
      `Adicione "${keyword}" onde for mais relevante para a função.`,
    ],
  } : {
    technical: [
      `Add "${keyword}" to your technical skills or professional summary.`,
      `Include hands-on experience with ${keyword} in your role descriptions.`,
      `Mention ${keyword} with context of results achieved.`,
    ],
    'soft-skill': [
      `Demonstrate ${keyword} with concrete examples in your work experience.`,
      `Add "${keyword}" to your professional summary with evidence of impact.`,
    ],
    certification: [
      `Add ${keyword} certification to your education/certifications section.`,
      `If you don't have ${keyword}, consider mentioning it as "in progress" or "planned".`,
    ],
    tool: [
      `Include ${keyword} in your tools/technologies section with proficiency level.`,
      `Mention ${keyword} in the context of completed projects.`,
    ],
    education: [
      `Ensure your ${keyword} education is clearly described.`,
      `Highlight the relevance of your education to the target role.`,
    ],
    experience: [
      `Quantify your experience: "X years of ${keyword}".`,
      `Highlight measurable achievements related to ${keyword}.`,
    ],
    other: [
      `Consider including "${keyword}" naturally in your CV.`,
      `Add "${keyword}" where most relevant for the role.`,
    ],
  };

  const options = templates[category] || templates.other;
  return options[Math.floor(Math.random() * options.length)];
}

// ─── Format Checks ──────────────────────────────────────────────────────────

function runFormatChecks(cvText: string, lang: 'pt' | 'en'): FormatCheck[] {
  const checks: FormatCheck[] = [];
  const isPT = lang === 'pt';

  // 1. Check for table indicators
  const hasTableIndicators = /\t{2,}|│|┃|├|┤|┌|┐|└|┘|╔|╗|╚|╝|\|.*\|.*\|/.test(cvText);
  checks.push({
    check: isPT ? 'Tabelas' : 'Tables',
    status: hasTableIndicators ? 'fail' : 'pass',
    detail: hasTableIndicators
      ? (isPT ? 'Detectadas tabelas no CV — muitos ATS não conseguem ler conteúdo em tabelas.' : 'Tables detected in CV — many ATS cannot read content in tables.')
      : (isPT ? 'Sem tabelas detectadas — compatível com ATS.' : 'No tables detected — ATS compatible.'),
    fix: hasTableIndicators ? (isPT ? 'Substitua tabelas por texto corrido com bullets.' : 'Replace tables with plain text and bullet points.') : undefined,
  });

  // 2. Check for multi-column layout indicators
  const hasColumns = /\t{3,}/.test(cvText) || (cvText.split('\n').filter(l => l.includes('   ') && l.trim().split(/\s{3,}/).length > 1).length > 5);
  checks.push({
    check: isPT ? 'Colunas' : 'Columns',
    status: hasColumns ? 'warning' : 'pass',
    detail: hasColumns
      ? (isPT ? 'Possível layout multi-coluna detectado — pode confundir ATS.' : 'Possible multi-column layout detected — may confuse ATS.')
      : (isPT ? 'Layout de coluna única — óptimo para ATS.' : 'Single column layout — optimal for ATS.'),
    fix: hasColumns ? (isPT ? 'Use layout de coluna única para máxima compatibilidade.' : 'Use single column layout for maximum compatibility.') : undefined,
  });

  // 3. Check for proper section headers
  const commonHeaders = isPT
    ? ['experiência', 'formação', 'competências', 'educação', 'resumo', 'perfil', 'contacto', 'idiomas', 'certificações']
    : ['experience', 'education', 'skills', 'summary', 'profile', 'contact', 'languages', 'certifications'];
  const foundHeaders = commonHeaders.filter(h => cvText.toLowerCase().includes(h));
  const headerRatio = foundHeaders.length / commonHeaders.length;
  checks.push({
    check: isPT ? 'Cabeçalhos de Secção' : 'Section Headers',
    status: headerRatio >= 0.4 ? 'pass' : headerRatio >= 0.2 ? 'warning' : 'fail',
    detail: isPT
      ? `${foundHeaders.length}/${commonHeaders.length} cabeçalhos standard detectados (${foundHeaders.join(', ') || 'nenhum'}).`
      : `${foundHeaders.length}/${commonHeaders.length} standard headers detected (${foundHeaders.join(', ') || 'none'}).`,
    fix: headerRatio < 0.4 ? (isPT ? 'Adicione cabeçalhos claros: Experiência, Formação, Competências, etc.' : 'Add clear headers: Experience, Education, Skills, etc.') : undefined,
  });

  // 4. Check for special characters / graphics indicators
  const specialChars = cvText.match(/[★☆●◆◇■□▲△▼▽♦♠♣♥✓✗✘✔✕✖⚡⭐🔹🔸]/g);
  checks.push({
    check: isPT ? 'Caracteres Especiais' : 'Special Characters',
    status: specialChars && specialChars.length > 5 ? 'warning' : 'pass',
    detail: specialChars && specialChars.length > 0
      ? (isPT ? `${specialChars.length} caracteres especiais/ícones detectados — podem não ser lidos por ATS.` : `${specialChars.length} special characters/icons detected — may not be read by ATS.`)
      : (isPT ? 'Sem caracteres especiais problemáticos.' : 'No problematic special characters.'),
    fix: specialChars && specialChars.length > 5 ? (isPT ? 'Substitua ícones por bullets simples (•) ou hífens (-).' : 'Replace icons with simple bullets (•) or hyphens (-).') : undefined,
  });

  // 5. Check text length (too short = missing content)
  const wordCount = cvText.split(/\s+/).length;
  checks.push({
    check: isPT ? 'Densidade de Conteúdo' : 'Content Density',
    status: wordCount >= 300 ? 'pass' : wordCount >= 150 ? 'warning' : 'fail',
    detail: isPT
      ? `${wordCount} palavras detectadas. ${wordCount < 150 ? 'CV muito curto — ATS pode classificar como incompleto.' : wordCount < 300 ? 'CV relativamente curto — considere adicionar mais detalhe.' : 'Densidade adequada para análise ATS.'}`
      : `${wordCount} words detected. ${wordCount < 150 ? 'CV too short — ATS may classify as incomplete.' : wordCount < 300 ? 'CV relatively short — consider adding more detail.' : 'Adequate density for ATS analysis.'}`,
    fix: wordCount < 300 ? (isPT ? 'Expanda descrições de funções com resultados quantificáveis.' : 'Expand role descriptions with quantifiable results.') : undefined,
  });

  // 6. Check for dates format consistency
  const datePatterns = cvText.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b.*?\d{4}/gi);
  const numericDates = cvText.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g);
  checks.push({
    check: isPT ? 'Formato de Datas' : 'Date Format',
    status: (datePatterns && datePatterns.length >= 2) ? 'pass' : (numericDates && numericDates.length >= 2) ? 'warning' : 'pass',
    detail: isPT
      ? (numericDates && numericDates.length >= 2 ? 'Datas numéricas detectadas — prefira formato "Mês Ano" para ATS.' : 'Formato de datas adequado.')
      : (numericDates && numericDates.length >= 2 ? 'Numeric dates detected — prefer "Month Year" format for ATS.' : 'Date format is adequate.'),
    fix: numericDates && numericDates.length >= 2 ? (isPT ? 'Use formato "Janeiro 2024" ou "Jan 2024" em vez de "01/2024".' : 'Use "January 2024" or "Jan 2024" format instead of "01/2024".') : undefined,
  });

  // 7. Check for contact info
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(cvText);
  const hasPhone = /[\+]?\d[\d\s\-()]{7,}/.test(cvText);
  checks.push({
    check: isPT ? 'Informação de Contacto' : 'Contact Information',
    status: hasEmail && hasPhone ? 'pass' : hasEmail || hasPhone ? 'warning' : 'fail',
    detail: isPT
      ? `${hasEmail ? 'Email ✓' : 'Email ✗'} | ${hasPhone ? 'Telefone ✓' : 'Telefone ✗'}`
      : `${hasEmail ? 'Email ✓' : 'Email ✗'} | ${hasPhone ? 'Phone ✓' : 'Phone ✗'}`,
    fix: (!hasEmail || !hasPhone) ? (isPT ? 'Inclua email e telefone no topo do CV.' : 'Include email and phone at the top of your CV.') : undefined,
  });

  return checks;
}

// ─── Main Engine ────────────────────────────────────────────────────────────

export function runLiveMatch(cvText: string, jdText: string, lang: 'pt' | 'en' = 'pt'): LiveMatchResult {
  if (!cvText.trim() || !jdText.trim()) {
    return {
      globalScore: 0, keywordScore: 0, formatScore: 0,
      keywords: [], formatChecks: [], annotations: [],
      summary: lang === 'pt' ? 'Cole o texto da vaga para iniciar a análise.' : 'Paste the job description to start the analysis.',
      foundCount: 0, partialCount: 0, missingCount: 0, totalCount: 0,
    };
  }

  const cvLower = cvText.toLowerCase();
  const extractedKws = extractKeywordsFromJD(jdText);

  // Match each keyword against CV
  const matchedKeywords: MatchedKeyword[] = extractedKws.map(({ keyword, importance, category }) => {
    // 1. Try exact match
    const exactPositions = findAllOccurrences(cvLower, keyword);
    if (exactPositions.length > 0) {
      return {
        keyword, status: 'found' as const, importance, positions: exactPositions, category,
      };
    }

    // 2. Try synonym/stem match
    const synonymMatch = findSynonymMatch(cvLower, keyword);
    if (synonymMatch) {
      return {
        keyword, status: 'partial' as const, importance, positions: synonymMatch.positions,
        foundVariant: synonymMatch.variant, category,
        suggestion: generateSuggestion(keyword, category, lang),
      };
    }

    // 3. Missing
    return {
      keyword, status: 'missing' as const, importance, positions: [-1], category,
      suggestion: generateSuggestion(keyword, category, lang),
    };
  });

  // Build annotations for the editor
  const annotations: Annotation[] = [];
  for (const kw of matchedKeywords) {
    if (kw.status === 'found') {
      for (const pos of kw.positions) {
        annotations.push({
          start: pos, end: pos + kw.keyword.length,
          type: 'found', keyword: kw.keyword, importance: kw.importance,
        });
      }
    } else if (kw.status === 'partial' && kw.foundVariant) {
      for (const pos of kw.positions) {
        annotations.push({
          start: pos, end: pos + kw.foundVariant.length,
          type: 'partial', keyword: kw.keyword, suggestion: kw.suggestion, importance: kw.importance,
        });
      }
    }
  }

  // Sort annotations by start position
  annotations.sort((a, b) => a.start - b.start);

  // Remove overlapping annotations (keep the one with higher importance)
  const cleanAnnotations: Annotation[] = [];
  for (const ann of annotations) {
    const last = cleanAnnotations[cleanAnnotations.length - 1];
    if (last && ann.start < last.end) {
      // Overlap — keep the more important one
      const impOrder = { high: 0, medium: 1, low: 2 };
      if (impOrder[ann.importance] < impOrder[last.importance]) {
        cleanAnnotations[cleanAnnotations.length - 1] = ann;
      }
      continue;
    }
    cleanAnnotations.push(ann);
  }

  // Calculate scores
  const foundCount = matchedKeywords.filter(k => k.status === 'found').length;
  const partialCount = matchedKeywords.filter(k => k.status === 'partial').length;
  const missingCount = matchedKeywords.filter(k => k.status === 'missing').length;
  const totalCount = matchedKeywords.length;

  // Weighted keyword score (high importance keywords count more)
  const weightMap = { high: 3, medium: 2, low: 1 };
  let totalWeight = 0;
  let matchedWeight = 0;
  for (const kw of matchedKeywords) {
    const w = weightMap[kw.importance];
    totalWeight += w;
    if (kw.status === 'found') matchedWeight += w;
    else if (kw.status === 'partial') matchedWeight += w * 0.5;
  }
  const keywordScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

  // Format checks
  const formatChecks = runFormatChecks(cvText, lang);
  const formatPassCount = formatChecks.filter(c => c.status === 'pass').length;
  const formatScore = Math.round((formatPassCount / formatChecks.length) * 100);

  // Global score (60% keywords, 40% format)
  const globalScore = Math.round(keywordScore * 0.6 + formatScore * 0.4);

  // Generate summary
  const summary = lang === 'pt'
    ? `O teu CV corresponde a ${foundCount} de ${totalCount} keywords da vaga (${partialCount} parciais, ${missingCount} em falta). ${
        globalScore >= 80 ? 'Excelente compatibilidade ATS!' :
        globalScore >= 60 ? 'Boa compatibilidade, mas há margem para melhorar.' :
        globalScore >= 40 ? 'Compatibilidade moderada — recomendamos ajustes.' :
        'Compatibilidade baixa — o CV precisa de optimização significativa.'
      }`
    : `Your CV matches ${foundCount} of ${totalCount} keywords from the job posting (${partialCount} partial, ${missingCount} missing). ${
        globalScore >= 80 ? 'Excellent ATS compatibility!' :
        globalScore >= 60 ? 'Good compatibility, but there\'s room for improvement.' :
        globalScore >= 40 ? 'Moderate compatibility — we recommend adjustments.' :
        'Low compatibility — your CV needs significant optimization.'
      }`;

  return {
    globalScore, keywordScore, formatScore,
    keywords: matchedKeywords, formatChecks, annotations: cleanAnnotations,
    summary, foundCount, partialCount, missingCount, totalCount,
  };
}
